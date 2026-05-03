import { format, subDays } from 'date-fns';
import { supabase } from '@/lib/supabase';
import type { Allocation } from '@/types';
import type { DeliverableLifecycle, DeliverablePhase } from '@/utils/deliverableLifecycle';
import { computeDeliverableLifecycle } from '@/utils/deliverableLifecycle';
import type { Employee, Project } from '@/types';
import { round2 } from '@/utils/numbers';

const TTL_MS = 60_000;

type CacheEntry = { data: DeliverableLifecycle; fetchedAt: number; appAllocSig: string };

const lifecycleCache = new Map<string, CacheEntry>();

export function clearDeliverableLifecycleCache(projectId?: string): void {
    if (projectId == null) {
        lifecycleCache.clear();
        return;
    }
    for (const key of [...lifecycleCache.keys()]) {
        if (key.startsWith(`${projectId}|`)) lifecycleCache.delete(key);
    }
}

function cacheKey(
    projectId: string,
    costMode: 'standard' | 'dynamic',
    hoursKey: string
): string {
    return `${projectId}|${costMode}|${hoursKey}`;
}

type SupabaseAllocationRow = {
    id: string;
    project_id: string;
    employee_id: string;
    week_start_date: string;
    hours_assigned: number;
    hours_actual?: number | null;
    hours_computed?: number | null;
    status: string | null;
    description?: string | null;
    task_name?: string | null;
    dependency_id?: string | null;
    transferred_from_allocation_id?: string | null;
    distribution_source_allocation_id?: string | null;
    parent_allocation_id?: string | null;
    original_transferred_task_name?: string | null;
    transfer_source_employee_id?: string | null;
    user_priority?: number | null;
    focus_date?: string | null;
    is_locked?: boolean | null;
};

/** Columnas alineadas con `appDataLoader` para listados/edición de tareas en modales. */
const DELIVERABLE_PHASE_ALLOCATION_COLUMNS =
    'id, project_id, employee_id, week_start_date, hours_assigned, hours_actual, hours_computed, status, description, task_name, dependency_id, transferred_from_allocation_id, distribution_source_allocation_id, parent_allocation_id, original_transferred_task_name, transfer_source_employee_id, user_priority, focus_date, is_locked';

/** Misma técnica que `loadMonthData`: inner join a `employees` para que RLS / políticas permitan leer allocations de la agencia. */
const DELIVERABLE_PHASE_ALLOCATION_SELECT = `${DELIVERABLE_PHASE_ALLOCATION_COLUMNS}, employees!allocations_employee_id_fkey!inner(agency_id)`;

function mapFetchedAllocationRows(data: unknown[] | null): Allocation[] {
    return (data ?? []).map((raw) => {
        const row = raw as Record<string, unknown>;
        const { employees: _emb, ...rest } = row;
        return mapSupabaseAllocationRow(rest as SupabaseAllocationRow);
    });
}

export function mapSupabaseAllocationRow(a: SupabaseAllocationRow): Allocation {
    return {
        id: a.id,
        employeeId: a.employee_id,
        projectId: a.project_id,
        weekStartDate: a.week_start_date,
        hoursAssigned: round2(Number(a.hours_assigned)),
        hoursActual: a.hours_actual != null ? round2(Number(a.hours_actual)) : undefined,
        hoursComputed: a.hours_computed != null ? round2(Number(a.hours_computed)) : undefined,
        status: (a.status || 'planned') as Allocation['status'],
        description: a.description ?? undefined,
        taskName: a.task_name ?? undefined,
        dependencyId: a.dependency_id ?? undefined,
        transferredFromAllocationId: a.transferred_from_allocation_id ?? undefined,
        distributionSourceAllocationId: a.distribution_source_allocation_id ?? undefined,
        parentAllocationId: a.parent_allocation_id ?? undefined,
        originalTransferredTaskName: a.original_transferred_task_name ?? undefined,
        transferSourceEmployeeId: a.transfer_source_employee_id ?? undefined,
        userPriority: a.user_priority ?? null,
        focusDate: a.focus_date ?? null,
        isLocked: a.is_locked ?? false,
    };
}

export async function fetchAllocationsForDeliverablePhase(params: {
    projectId: string;
    phase: DeliverablePhase;
    agencyId: string;
}): Promise<Allocation[]> {
    const weekGte = format(subDays(params.phase.start, 6), 'yyyy-MM-dd');
    const weekLte = format(params.phase.due, 'yyyy-MM-dd');

    const { data, error } = await supabase
        .from('allocations')
        .select(DELIVERABLE_PHASE_ALLOCATION_SELECT)
        .eq('project_id', params.projectId)
        .eq('employees.agency_id', params.agencyId)
        .gte('week_start_date', weekGte)
        .lte('week_start_date', weekLte);

    if (error) throw error;
    return mapFetchedAllocationRows(data);
}

export async function fetchAllocationsForDeliverablePhaseBatch(params: {
    projectIds: string[];
    minPhaseStart: Date;
    maxPhaseDue: Date;
    agencyId: string;
}): Promise<Allocation[]> {
    if (params.projectIds.length === 0) return [];
    const weekGte = format(subDays(params.minPhaseStart, 6), 'yyyy-MM-dd');
    const weekLte = format(params.maxPhaseDue, 'yyyy-MM-dd');

    const { data, error } = await supabase
        .from('allocations')
        .select(DELIVERABLE_PHASE_ALLOCATION_SELECT)
        .in('project_id', params.projectIds)
        .eq('employees.agency_id', params.agencyId)
        .gte('week_start_date', weekGte)
        .lte('week_start_date', weekLte);

    if (error) throw error;
    return mapFetchedAllocationRows(data);
}

export function getCachedLifecycle(
    projectId: string,
    costMode: 'standard' | 'dynamic',
    hoursPreferenceKey: string,
    appAllocSig: string
): DeliverableLifecycle | null {
    const key = cacheKey(projectId, costMode, hoursPreferenceKey);
    const hit = lifecycleCache.get(key);
    if (!hit) return null;
    if (Date.now() - hit.fetchedAt > TTL_MS) return null;
    if (hit.appAllocSig !== appAllocSig) return null;
    return hit.data;
}

export function setCachedLifecycle(
    projectId: string,
    costMode: 'standard' | 'dynamic',
    hoursPreferenceKey: string,
    data: DeliverableLifecycle,
    appAllocSig: string
): void {
    const key = cacheKey(projectId, costMode, hoursPreferenceKey);
    lifecycleCache.set(key, { data, fetchedAt: Date.now(), appAllocSig });
}

export function buildLifecycle(
    project: Project,
    allocations: Allocation[],
    employees: Employee[],
    hoursPreference: 'actual' | 'computed' | null,
    costMode: 'standard' | 'dynamic'
): DeliverableLifecycle {
    return computeDeliverableLifecycle({
        project,
        allocations,
        employees,
        hoursPreference,
        costMode,
    });
}

export function hoursPreferenceKey(hoursPreference: 'actual' | 'computed' | null | undefined): string {
    return hoursPreference === 'actual' || hoursPreference === 'computed' ? hoursPreference : 'default';
}
