import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAgency } from '@/contexts/AgencyContext';

export type AdsSyncPlatform = 'google' | 'meta';

export interface AdsLastSyncInfo {
  at: Date;
  source: 'manual' | 'cron';
}

const LOG_TABLE: Record<AdsSyncPlatform, 'ads_sync_logs' | 'meta_sync_logs'> = {
  google: 'ads_sync_logs',
  meta: 'meta_sync_logs',
};

async function fetchLastSync(
  agencyId: string,
  platform: AdsSyncPlatform,
): Promise<AdsLastSyncInfo | null> {
  const table = LOG_TABLE[platform];
  const { data } = await supabase
    .from(table)
    .select('created_at, source')
    .eq('agency_id', agencyId)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data?.created_at) return null;
  const source = data.source === 'cron' ? 'cron' : 'manual';
  return { at: new Date(data.created_at), source };
}

const DEFAULT_PLATFORMS: AdsSyncPlatform[] = ['google', 'meta'];

export function useAdsLastSync(platforms: AdsSyncPlatform[] = DEFAULT_PLATFORMS) {
  const { currentAgency } = useAgency();
  const agencyId = currentAgency?.id;
  const [google, setGoogle] = useState<AdsLastSyncInfo | null>(null);
  const [meta, setMeta] = useState<AdsLastSyncInfo | null>(null);

  const refresh = useCallback(async () => {
    if (!agencyId) {
      setGoogle(null);
      setMeta(null);
      return;
    }
    const tasks: Promise<void>[] = [];
    if (platforms.includes('google')) {
      tasks.push(
        fetchLastSync(agencyId, 'google').then((info) => {
          setGoogle(info);
        }),
      );
    }
    if (platforms.includes('meta')) {
      tasks.push(
        fetchLastSync(agencyId, 'meta').then((info) => {
          setMeta(info);
        }),
      );
    }
    await Promise.all(tasks);
  }, [agencyId, platforms]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!agencyId) return;

    const channels = platforms.map((platform) => {
      const table = LOG_TABLE[platform];
      return supabase
        .channel(`ads-last-sync-${platform}-${agencyId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table,
            filter: `agency_id=eq.${agencyId}`,
          },
          () => {
            void refresh();
          },
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table,
            filter: `agency_id=eq.${agencyId}`,
          },
          () => {
            void refresh();
          },
        )
        .subscribe();
    });

    const pollId = window.setInterval(() => {
      void refresh();
    }, 5 * 60 * 1000);

    return () => {
      window.clearInterval(pollId);
      channels.forEach((ch) => {
        void supabase.removeChannel(ch);
      });
    };
  }, [agencyId, platforms, refresh]);

  return { google, meta, refresh };
}
