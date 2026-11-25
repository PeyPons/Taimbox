import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { mapAgentAction, type AgentAction, type AgentActionRow } from '@/types/agentActions';

interface UseAgentActionsResult {
  actions: AgentAction[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * Carga los árboles que tocan el intervalo: primero los nodos que empiezan dentro
 * y después el resto del árbol por `root_id`, para no perder la petición padre.
 */
export function useAgentActions(
  agencyId: string | null,
  rangeStart: Date | null,
  rangeEnd: Date | null,
): UseAgentActionsResult {
  const [actions, setActions] = useState<AgentAction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick((value) => value + 1), []);

  useEffect(() => {
    if (!agencyId || !rangeStart || !rangeEnd) {
      setActions([]);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const load = async () => {
      const overlapping = await supabase
        .from('agent_actions')
        .select('*')
        .eq('agency_id', agencyId)
        .gte('started_at', rangeStart.toISOString())
        .lt('started_at', rangeEnd.toISOString());

      if (overlapping.error) throw new Error(overlapping.error.message);

      const roots = new Set<string>();
      for (const row of (overlapping.data ?? []) as AgentActionRow[]) {
        roots.add(row.root_id ?? row.id);
      }

      let rows = (overlapping.data ?? []) as AgentActionRow[];
      if (roots.size > 0) {
        const tree = await supabase
          .from('agent_actions')
          .select('*')
          .eq('agency_id', agencyId)
          .in('root_id', [...roots]);
        if (tree.error) throw new Error(tree.error.message);
        const byId = new Map<string, AgentActionRow>();
        for (const row of rows) byId.set(row.id, row);
        for (const row of (tree.data ?? []) as AgentActionRow[]) byId.set(row.id, row);
        rows = [...byId.values()];
      }

      if (!cancelled) {
        setActions(rows.map(mapAgentAction));
        setError(null);
      }
    };

    load()
      .catch((cause: unknown) => {
        if (cancelled) return;
        setError(cause instanceof Error ? cause.message : 'No se pudo cargar el trabajo de los agentes');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [agencyId, rangeStart, rangeEnd, tick]);

  useEffect(() => {
    if (!agencyId) return;
    const channel = supabase
      .channel(`agent-actions-${agencyId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'agent_actions', filter: `agency_id=eq.${agencyId}` },
        () => refresh(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [agencyId, refresh]);

  return { actions, loading, error, refresh };
}
