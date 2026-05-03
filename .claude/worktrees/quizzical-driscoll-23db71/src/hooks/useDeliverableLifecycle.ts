import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useAgency } from '@/contexts/AgencyContext';
import {
    getDeliverablePhase,
    allocationsSignatureForProject,
    type DeliverableLifecycle,
} from '@/utils/deliverableLifecycle';
import {
    buildLifecycle,
    fetchAllocationsForDeliverablePhase,
    getCachedLifecycle,
    setCachedLifecycle,
    hoursPreferenceKey,
    clearDeliverableLifecycleCache,
} from '@/hooks/useDeliverableLifecycleCore';

export { clearDeliverableLifecycleCache };

/**
 * Ciclo de vida de un entregable. No abre canales Realtime propios: invalida por firma de
 * allocations en AppContext y refetch directo a Supabase para el rango de la fase.
 *
 * NO precarga meses en `AppContext` (`ensureMonthsLoadedInRange`): cargar meses enteros para
 * cada entregable visible inflaba RAM y bloqueaba listas. La consulta directa
 * (`fetchAllocationsForDeliverablePhase`) ya devuelve solo lo que necesita el cálculo. Los
 * cambios locales del cliente sobre `allocations` se reflejan vía firma; los cambios
 * remotos se ven hasta el TTL del caché o tras un `refetch()`.
 */
export function useDeliverableLifecycle(
    projectId: string | null,
    options?: { costModeOverride?: 'standard' | 'dynamic' }
): {
    data: DeliverableLifecycle | null;
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;
} {
    const { projects, employees, allocations } = useApp();
    const { currentAgency } = useAgency();
    const [data, setData] = useState<DeliverableLifecycle | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [nonce, setNonce] = useState(0);
    const abortRef = useRef<AbortController | null>(null);

    const project = useMemo(
        () => (projectId ? projects.find((p) => p.id === projectId) : undefined),
        [projects, projectId]
    );
    /**
     * `getDeliverablePhase` devolvería un objeto nuevo en cada render. Memoizamos por la
     * referencia de `project` (estable mientras `projects` no cambie) para evitar disparos
     * del `useEffect` en cada render del badge / consumidor.
     */
    const phase = useMemo(() => (project ? getDeliverablePhase(project) : null), [project]);

    const hoursPref = currentAgency?.settings?.hoursTrackingPreference ?? null;
    const hk = hoursPreferenceKey(hoursPref);
    const costMode: 'standard' | 'dynamic' = options?.costModeOverride ?? 'standard';

    const appAllocSig = useMemo(
        () => (projectId ? allocationsSignatureForProject(allocations, projectId) : ''),
        [allocations, projectId]
    );

    const refetch = useCallback(() => setNonce((n) => n + 1), []);

    useEffect(() => {
        if (!projectId || !project) {
            setData(null);
            setIsLoading(false);
            setError(null);
            return;
        }

        if (phase === null) {
            setData(
                buildLifecycle(project, [], employees, hoursPref, costMode)
            );
            setIsLoading(false);
            setError(null);
            return;
        }

        const agencyId = currentAgency?.id;
        if (!agencyId) {
            setIsLoading(false);
            setError(new Error('Sin agencia activa'));
            setData(null);
            return;
        }

        let cancelled = false;
        abortRef.current?.abort();
        const ac = new AbortController();
        abortRef.current = ac;

        (async () => {
            setIsLoading(true);
            setError(null);
            try {
                const cached = getCachedLifecycle(projectId, costMode, hk, appAllocSig);
                if (cached) {
                    setData(cached);
                    setIsLoading(false);
                    return;
                }

                const rows = await fetchAllocationsForDeliverablePhase({
                    projectId,
                    phase,
                    agencyId,
                });
                if (ac.signal.aborted || cancelled) return;

                const computed = buildLifecycle(project, rows, employees, hoursPref, costMode);
                setCachedLifecycle(projectId, costMode, hk, computed, appAllocSig);
                setData(computed);
            } catch (e) {
                if (ac.signal.aborted || cancelled) return;
                setError(e instanceof Error ? e : new Error(String(e)));
                setData(null);
            } finally {
                if (!cancelled && !ac.signal.aborted) setIsLoading(false);
            }
        })();

        return () => {
            cancelled = true;
            ac.abort();
        };
    }, [projectId, project, phase, employees, hoursPref, hk, costMode, appAllocSig, nonce, currentAgency?.id]);

    return { data, isLoading, error, refetch };
}
