import { useEffect, useMemo } from 'react';
import { format, startOfMonth } from 'date-fns';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAgency } from '@/contexts/AgencyContext';
import { useApp } from '@/contexts/AppContext';
import { logCreate, logDelete } from '@/services/auditService';
import {
  ALLOCATION_NOTE_MAX_LENGTH,
  copyAllocationNotes,
  createAllocationNote,
  fetchAllocationNoteCounts,
  fetchAllocationNoteCountsForEmployeeMonth,
  fetchAllocationNotes,
  softDeleteAllocationNote,
} from '@/services/allocationNotesService';
import type { AllocationNote } from '@/types';

const STALE_MS = 60 * 1000;

export const allocationNotesQueryKeys = {
  all: ['allocation-notes'] as const,
  byAllocation: (allocationId: string) => ['allocation-notes', 'allocation', allocationId] as const,
  counts: (agencyId: string | undefined, idsKey: string) =>
    ['allocation-notes', 'counts', agencyId ?? '', idsKey] as const,
  countsEmployeeMonth: (agencyId: string | undefined, employeeId: string, monthKey: string) =>
    ['allocation-notes', 'counts-employee-month', agencyId ?? '', employeeId, monthKey] as const,
};

function invalidateAllNoteCountQueries(queryClient: ReturnType<typeof useQueryClient>) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ['allocation-notes', 'counts'] }),
    queryClient.invalidateQueries({ queryKey: ['allocation-notes', 'counts-employee-month'] }),
  ]);
}

export function useAllocationNotes(allocationId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: allocationId ? allocationNotesQueryKeys.byAllocation(allocationId) : ['allocation-notes', 'noop'],
    queryFn: () => (allocationId ? fetchAllocationNotes(allocationId) : Promise.resolve([])),
    enabled: Boolean(allocationId) && enabled,
    staleTime: STALE_MS,
  });
}

/** Conteos para un conjunto explícito de allocations (Mi día visible, diálogo de edición, etc.). */
export function useAllocationNoteCounts(allocationIds: string[]) {
  const { currentAgency } = useAgency();
  const agencyId = currentAgency?.id;

  const idsKey = useMemo(() => [...allocationIds].sort().join(','), [allocationIds]);
  const ids = useMemo(() => (idsKey ? idsKey.split(',') : []), [idsKey]);

  return useQuery({
    queryKey: allocationNotesQueryKeys.counts(agencyId, idsKey),
    queryFn: () => fetchAllocationNoteCounts(ids, agencyId!),
    enabled: ids.length > 0 && Boolean(agencyId),
    staleTime: STALE_MS,
    retry: false,
  });
}

/** Conteos del planificador: empleado + mes efectivo vía RPC (sin pasar cientos de UUIDs). */
export function useAllocationNoteCountsForEmployeeMonth(
  employeeId: string | undefined,
  viewMonth: Date | undefined,
  enabled = true,
) {
  const { currentAgency } = useAgency();
  const agencyId = currentAgency?.id;
  const monthKey = viewMonth ? format(startOfMonth(viewMonth), 'yyyy-MM') : '';

  return useQuery({
    queryKey: allocationNotesQueryKeys.countsEmployeeMonth(agencyId, employeeId ?? '', monthKey),
    queryFn: () => fetchAllocationNoteCountsForEmployeeMonth(agencyId!, employeeId!, viewMonth!),
    enabled: Boolean(agencyId && employeeId && viewMonth && enabled),
    staleTime: STALE_MS,
    retry: false,
  });
}

export function useAllocationNotesMutations(allocationId: string) {
  const queryClient = useQueryClient();
  const { currentAgency } = useAgency();
  const { currentUser } = useApp();

  const invalidate = async () => {
    await queryClient.invalidateQueries({
      queryKey: allocationNotesQueryKeys.byAllocation(allocationId),
    });
    await invalidateAllNoteCountQueries(queryClient);
  };

  const addMutation = useMutation({
    mutationFn: async (body: string) => {
      if (!currentAgency?.id) throw new Error('Agencia no disponible');
      if (!currentUser?.id) throw new Error('Empleado no disponible');
      return createAllocationNote({
        allocationId,
        agencyId: currentAgency.id,
        authorEmployeeId: currentUser.id,
        body,
      });
    },
    onSuccess: async (note: AllocationNote) => {
      if (currentAgency?.id) {
        await logCreate(currentAgency.id, 'ALLOCATION_NOTE', note.id, {
          allocationId: note.allocationId,
          bodyPreview: note.body.slice(0, 120),
        });
      }
      await invalidate();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (noteId: string) => softDeleteAllocationNote(noteId),
    onSuccess: async (_data, noteId) => {
      if (currentAgency?.id) {
        await logDelete(currentAgency.id, 'ALLOCATION_NOTE', noteId, { allocationId });
      }
      await invalidate();
    },
  });

  return {
    addNote: addMutation.mutateAsync,
    deleteNote: deleteMutation.mutateAsync,
    isAdding: addMutation.isPending,
    isDeleting: deleteMutation.isPending,
    maxLength: ALLOCATION_NOTE_MAX_LENGTH,
  };
}

/** Suscripción Realtime: invalida caches de notas por agencia. */
export function useAllocationNotesRealtime() {
  const queryClient = useQueryClient();
  const { currentAgency } = useAgency();

  useEffect(() => {
    if (!currentAgency?.id) return;

    const channel = supabase
      .channel(`allocation-notes-${currentAgency.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'allocation_notes',
          filter: `agency_id=eq.${currentAgency.id}`,
        },
        payload => {
          const allocationId =
            (payload.new as { allocation_id?: string } | undefined)?.allocation_id ??
            (payload.old as { allocation_id?: string } | undefined)?.allocation_id;
          if (allocationId) {
            void queryClient.invalidateQueries({
              queryKey: allocationNotesQueryKeys.byAllocation(allocationId),
            });
          }
          void invalidateAllNoteCountQueries(queryClient);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [currentAgency?.id, queryClient]);
}

export { copyAllocationNotes };
