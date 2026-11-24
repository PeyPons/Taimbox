import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAgency } from '@/contexts/AgencyContext';
import { useApp } from '@/contexts/AppContext';
import {
  AD_ACCOUNT_NOTE_MAX_LENGTH,
  createAdAccountNote,
  fetchAdAccountNoteCounts,
  fetchAdAccountNotes,
  softDeleteAdAccountNote,
  updateAdAccountNote,
  type AdAccountPlatform,
} from '@/services/adAccountNotesService';

const STALE_MS = 30_000;

export const adAccountNotesQueryKeys = {
  counts: (agencyId: string | undefined, platform: AdAccountPlatform) =>
    ['ad-account-notes', 'counts', agencyId ?? '', platform] as const,
  list: (agencyId: string | undefined, platform: AdAccountPlatform, accountId: string) =>
    ['ad-account-notes', 'list', agencyId ?? '', platform, accountId] as const,
};

export function useAdAccountNoteCounts(platform: AdAccountPlatform) {
  const { currentAgency } = useAgency();
  const agencyId = currentAgency?.id;
  return useQuery({
    queryKey: adAccountNotesQueryKeys.counts(agencyId, platform),
    queryFn: () => fetchAdAccountNoteCounts(agencyId!, platform),
    enabled: Boolean(agencyId),
    staleTime: STALE_MS,
  });
}

export function useAdAccountNotes(platform: AdAccountPlatform, accountId: string, enabled = true) {
  const { currentAgency } = useAgency();
  const agencyId = currentAgency?.id;
  return useQuery({
    queryKey: adAccountNotesQueryKeys.list(agencyId, platform, accountId),
    queryFn: () => fetchAdAccountNotes(agencyId!, platform, accountId),
    enabled: Boolean(agencyId && accountId && enabled),
    staleTime: STALE_MS,
  });
}

export function useAdAccountNotesMutations(platform: AdAccountPlatform, accountId: string) {
  const queryClient = useQueryClient();
  const { currentAgency } = useAgency();
  const { currentUser } = useApp();
  const agencyId = currentAgency?.id;

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: adAccountNotesQueryKeys.list(agencyId, platform, accountId) }),
      queryClient.invalidateQueries({ queryKey: adAccountNotesQueryKeys.counts(agencyId, platform) }),
    ]);
  };

  const addMutation = useMutation({
    mutationFn: async (body: string) => {
      if (!agencyId) throw new Error('Agencia no disponible');
      if (!currentUser?.id) throw new Error('Empleado no disponible');
      return createAdAccountNote({
        agencyId,
        platform,
        accountId,
        authorEmployeeId: currentUser.id,
        body,
      });
    },
    onSuccess: invalidate,
  });

  const editMutation = useMutation({
    mutationFn: ({ noteId, body }: { noteId: string; body: string }) => updateAdAccountNote(noteId, body),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (noteId: string) => softDeleteAdAccountNote(noteId),
    onSuccess: invalidate,
  });

  return {
    addNote: addMutation.mutateAsync,
    editNote: editMutation.mutateAsync,
    deleteNote: deleteMutation.mutateAsync,
    isAdding: addMutation.isPending,
    isSaving: editMutation.isPending,
    isDeleting: deleteMutation.isPending,
    maxLength: AD_ACCOUNT_NOTE_MAX_LENGTH,
  };
}

export function useAdAccountNotesRealtime(platform: AdAccountPlatform) {
  const queryClient = useQueryClient();
  const { currentAgency } = useAgency();

  useEffect(() => {
    if (!currentAgency?.id) return;
    const agencyId = currentAgency.id;
    const channel = supabase
      .channel(`ad-account-notes-${platform}-${agencyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ad_account_notes',
          filter: `agency_id=eq.${agencyId}`,
        },
        (payload) => {
          const row = (payload.new ?? payload.old) as { platform?: string; account_id?: string } | undefined;
          if (row?.platform && row.platform !== platform) return;
          if (row?.account_id) {
            void queryClient.invalidateQueries({
              queryKey: adAccountNotesQueryKeys.list(agencyId, platform, row.account_id),
            });
          }
          void queryClient.invalidateQueries({
            queryKey: adAccountNotesQueryKeys.counts(agencyId, platform),
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [currentAgency?.id, platform, queryClient]);
}
