import { useEffect, useMemo, useRef, useState } from 'react';
import type { Allocation } from '@/types';
import { useApp } from '@/contexts/AppContext';
import { useAgency } from '@/contexts/AgencyContext';
import {
    getDeliverablePhase,
    allocationsSignatureForProject,
    type DeliverableLifecycle,
} from '@/utils/deliverableLifecycle';
import {
    buildLifecycle,
    fetchAllocationsForDeliverablePhaseBatch,
    getCachedLifecycle,
    setCachedLifecycle,
    hoursPreferenceKey,
} from '@/hooks/useDeliverableLifecycleCore';

/**
 * Una query para varios entregables con fase válida. Comparte caché con `useDeliverableLifecycle`.
 *
 * Optimizaciones para listas grandes:
 *  - NO precarga meses en `AppContext` (`ensureMonthsLoadedInRange`). El cálculo del lifecycle
 *    usa `fetchAllocationsForDeliverablePhaseBatch` (consulta directa a Supabase para el rango
 *    de la fase). Cargar meses enteros en `AppContext` para 100 entregables consume RAM y
 *    bloquea el render principal de listas como Proyectos / Clientes.
 *  - Indexa allocations por projectId en una sola pasada para no recorrer N×M veces.
 *  - Usa `batchSig` como dependencia única del efecto: cubre cambios en allocations sin
 *    re-disparar por la nueva referencia de array.
 *  - Reaprovecha la referencia del `Map` cuando el resultado coincide con el anterior, así
 *    los consumidores que comparen con `===` (o badges memoizados) no re-renderizan.
 */
export function useDeliverableLifecycleBatch(
    projectIds: string[],
    options?: { costModeOverride?: 'standard' | 'dynamic' }
): {
    data: Map<string, DeliverableLifecycle>;
    isLoading: boolean;
    error: Error | null;
} {
    const { projects, employees, allocations } = useApp();
    const { currentAgency } = useAgency();
    const [map, setMap] = useState<Map<string, DeliverableLifecycle>>(() => new Map());
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const hoursPref = currentAgency?.settings?.hoursTrackingPreference ?? null;
    const hk = hoursPreferenceKey(hoursPref);
    const costMode: 'standard' | 'dynamic' = options?.costModeOverride ?? 'standard';

    const validEntries = useMemo(() => {
        const list: { project: (typeof projects)[0]; phase: NonNullable<ReturnType<typeof getDeliverablePhase>> }[] =
            [];
        for (const id of projectIds) {
            const project = projects.find((p) => p.id === id);
            if (!project) continue;
            const phase = getDeliverablePhase(project);
            if (phase) list.push({ project, phase });
        }
        return list;
    }, [projectIds, projects]);

    /** Índice allocations por projectId (una pasada por allocations en lugar de N×). */
    const allocationsByProjectId = useMemo(() => {
        const idx = new Map<string, Allocation[]>();
        if (validEntries.length === 0) return idx;
        const ids = new Set(validEntries.map((e) => e.project.id));
        for (const a of allocations) {
            if (!ids.has(a.projectId)) continue;
            const arr = idx.get(a.projectId);
            if (arr) arr.push(a);
            else idx.set(a.projectId, [a]);
        }
        return idx;
    }, [validEntries, allocations]);

    /** Firmas por proyecto para invalidar caché por entregable de forma estable. */
    const sigByProjectId = useMemo(() => {
        const sig = new Map<string, string>();
        for (const { project } of validEntries) {
            sig.set(project.id, allocationsSignatureForProject(allocationsByProjectId.get(project.id) ?? [], project.id));
        }
        return sig;
    }, [validEntries, allocationsByProjectId]);

    /** Firma combinada estable: cambia solo si cambia algún subsig. */
    const batchSig = useMemo(() => {
        const parts: string[] = [];
        for (const [id, s] of sigByProjectId) parts.push(`${id}:${s}`);
        parts.sort();
        return parts.join('||');
    }, [sigByProjectId]);

    /** Snapshot reciente para comparar resultado vs estado y reaprovechar referencia. */
    const mapRef = useRef(map);
    mapRef.current = map;

    useEffect(() => {
        if (validEntries.length === 0) {
            if (mapRef.current.size !== 0) setMap(new Map());
            setIsLoading(false);
            setError(null);
            return;
        }

        // Fast path: todo en caché → resolvemos sincrónicamente sin tocar isLoading.
        const fromCache = new Map<string, DeliverableLifecycle>();
        let allCached = true;
        for (const { project } of validEntries) {
            const sig = sigByProjectId.get(project.id) ?? '';
            const cached = getCachedLifecycle(project.id, costMode, hk, sig);
            if (cached) fromCache.set(project.id, cached);
            else {
                allCached = false;
                break;
            }
        }

        if (allCached) {
            if (sameLifecycleMap(mapRef.current, fromCache)) {
                if (isLoading) setIsLoading(false);
                if (error) setError(null);
            } else {
                setMap(fromCache);
                if (isLoading) setIsLoading(false);
                if (error) setError(null);
            }
            return;
        }

        let cancelled = false;
        setIsLoading(true);
        setError(null);

        (async () => {
            try {
                const next = new Map<string, DeliverableLifecycle>();
                const idsToFetch: string[] = [];
                for (const { project } of validEntries) {
                    const sig = sigByProjectId.get(project.id) ?? '';
                    const cached = getCachedLifecycle(project.id, costMode, hk, sig);
                    if (cached) next.set(project.id, cached);
                    else idsToFetch.push(project.id);
                }

                const fetchedByProject = new Map<string, Allocation[]>();
                if (idsToFetch.length > 0) {
                    const agencyId = currentAgency?.id;
                    if (!agencyId) {
                        throw new Error('Sin agencia activa');
                    }
                    const toFetchSet = new Set(idsToFetch);
                    const phasesToFetch = validEntries.filter((e) => toFetchSet.has(e.project.id));
                    const minStart = phasesToFetch.reduce(
                        (m, e) => (e.phase.start < m ? e.phase.start : m),
                        phasesToFetch[0].phase.start
                    );
                    const maxDue = phasesToFetch.reduce(
                        (m, e) => (e.phase.due > m ? e.phase.due : m),
                        phasesToFetch[0].phase.due
                    );
                    const allRows = await fetchAllocationsForDeliverablePhaseBatch({
                        projectIds: idsToFetch,
                        minPhaseStart: minStart,
                        maxPhaseDue: maxDue,
                        agencyId,
                    });
                    if (cancelled) return;
                    for (const row of allRows) {
                        const arr = fetchedByProject.get(row.projectId);
                        if (arr) arr.push(row);
                        else fetchedByProject.set(row.projectId, [row]);
                    }
                }

                for (const { project } of validEntries) {
                    if (next.has(project.id)) continue;
                    const rows = fetchedByProject.get(project.id) ?? [];
                    const computed = buildLifecycle(project, rows, employees, hoursPref, costMode);
                    const sig = sigByProjectId.get(project.id) ?? '';
                    setCachedLifecycle(project.id, costMode, hk, computed, sig);
                    next.set(project.id, computed);
                }

                if (cancelled) return;
                if (!sameLifecycleMap(mapRef.current, next)) setMap(next);
            } catch (e) {
                if (!cancelled) {
                    setError(e instanceof Error ? e : new Error(String(e)));
                    if (mapRef.current.size !== 0) setMap(new Map());
                }
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
        // batchSig + sigByProjectId derivan de validEntries y allocations; no añadimos `allocations`
        // ni `isLoading`/`error` para evitar bucles y re-disparos innecesarios.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [validEntries, batchSig, employees, hoursPref, hk, costMode, currentAgency?.id]);

    return { data: map, isLoading, error };
}

/** Compara dos mapas por tamaño y referencia de cada lifecycle (los lifecycles vienen del caché compartido). */
function sameLifecycleMap(
    a: Map<string, DeliverableLifecycle>,
    b: Map<string, DeliverableLifecycle>
): boolean {
    if (a === b) return true;
    if (a.size !== b.size) return false;
    for (const [k, v] of a) {
        if (b.get(k) !== v) return false;
    }
    return true;
}
