import {
    parseISO,
    isBefore,
    isAfter,
    startOfDay,
    startOfMonth,
    endOfMonth,
    differenceInCalendarDays,
    eachDayOfInterval,
    isWeekend,
    format,
    subDays,
} from 'date-fns';
import type { Allocation, Employee, Project } from '@/types';
import { PROJECT_TYPE_ENTREGABLE } from '@/config/projectTypePresets';
import { getEffectiveAllocationHours } from '@/utils/hoursTracking';
import { getRowCost } from '@/utils/profitabilityCost';
import { round2 } from '@/utils/numbers';

export type DeliverablePhase = { start: Date; due: Date; totalDays: number };

export type DeliverableLifecycleHours = {
    planned: number;
    actual: number;
    computed: number;
    budget: number;
    available: number;
    pctConsumed: number;
};

export type DeliverableLifecyclePacing = {
    daysElapsed: number;
    daysRemaining: number;
    expectedHoursToDate: number;
    deltaHours: number;
    projectedAtDueDate: number;
    isProjectedOverBudget: boolean;
};

export type DeliverableLifecycleFinance = {
    contractFee: number;
    costToDate: number;
    revenueAccrued: number;
    marginAbsolute: number | null;
    marginPct: number | null;
    effectiveHourlyRate: number;
    hasUnknownCostEmployees: boolean;
};

export type DeliverableLifecycleStatus =
    | 'no-phase'
    | 'pre-start'
    | 'on-track'
    | 'at-risk'
    | 'over-budget'
    | 'completed';

export type DeliverableLifecycle = {
    phase: DeliverablePhase | null;
    hours: DeliverableLifecycleHours;
    pacing: DeliverableLifecyclePacing;
    finance: DeliverableLifecycleFinance;
    status: DeliverableLifecycleStatus;
};

function getWorkingDaysInPeriod(start: Date, end: Date): number {
    const days = eachDayOfInterval({ start, end });
    return days.filter((d) => !isWeekend(d)).length;
}

/** Prorrateo de horas de una semana sobre el tramo [phaseStart, phaseEnd] (días laborables), misma idea que projectMetricsCompute. */
export function prorateHoursForPhaseOverlap(
    allocation: Allocation,
    phaseStart: Date,
    phaseEnd: Date,
    preference?: 'computed' | 'actual' | null
): { planned: number; actual: number; computed: number } {
    const weekStart = parseISO(allocation.weekStartDate);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const pStart = startOfDay(phaseStart);
    const pEnd = startOfDay(phaseEnd);

    if (!isBefore(weekStart, pStart) && !isAfter(weekEnd, pEnd)) {
        const pref = preference === 'actual' || preference === 'computed' ? preference : undefined;
        return {
            planned: allocation.hoursAssigned || 0,
            actual: allocation.hoursActual || 0,
            computed: round2(getEffectiveAllocationHours(allocation, pref)),
        };
    }

    const overlapStart = isBefore(weekStart, pStart) ? pStart : weekStart;
    const overlapEnd = isAfter(weekEnd, pEnd) ? pEnd : weekEnd;

    if (overlapStart > overlapEnd) {
        return { planned: 0, actual: 0, computed: 0 };
    }

    const overlapDays = getWorkingDaysInPeriod(overlapStart, overlapEnd);
    const totalDays = getWorkingDaysInPeriod(weekStart, weekEnd);
    if (totalDays === 0) return { planned: 0, actual: 0, computed: 0 };

    const ratio = overlapDays / totalDays;
    const pref = preference === 'actual' || preference === 'computed' ? preference : undefined;
    return {
        planned: round2((allocation.hoursAssigned || 0) * ratio),
        actual: round2((allocation.hoursActual || 0) * ratio),
        computed: round2(getEffectiveAllocationHours(allocation, pref) * ratio),
    };
}

export function getDeliverablePhase(project: Project): DeliverablePhase | null {
    if (project.projectType !== PROJECT_TYPE_ENTREGABLE) return null;
    const startStr = project.deliverableStartDate?.trim();
    const dueStr = project.deliverableDueDate?.trim();
    if (!startStr || !dueStr) return null;
    let start: Date;
    let due: Date;
    try {
        start = parseISO(startStr);
        due = parseISO(dueStr);
    } catch {
        return null;
    }
    if (Number.isNaN(start.getTime()) || Number.isNaN(due.getTime()) || start > due) return null;
    const totalDays = differenceInCalendarDays(due, start) + 1;
    if (totalDays <= 0) return null;
    return { start, due, totalDays };
}

/** True si la fase del entregable solapa algún día del mes calendario `month`. */
export function deliverablePhaseOverlapsMonth(project: Project, month: Date): boolean {
    const phase = getDeliverablePhase(project);
    if (!phase) return false;
    const ms = startOfMonth(month);
    const me = endOfMonth(month);
    return !(phase.due < ms || phase.start > me);
}

function resolveContractFee(project: Project): number {
    const base = project.monthlyFee ?? 0;
    const fee =
        project.deliverableContractFee != null &&
        Number.isFinite(project.deliverableContractFee) &&
        project.deliverableContractFee >= 0
            ? project.deliverableContractFee
            : base;
    return fee > 0 ? round2(fee) : 0;
}

const EMPTY_HOURS: DeliverableLifecycleHours = {
    planned: 0,
    actual: 0,
    computed: 0,
    budget: 0,
    available: 0,
    pctConsumed: 0,
};

const EMPTY_PACING: DeliverableLifecyclePacing = {
    daysElapsed: 0,
    daysRemaining: 0,
    expectedHoursToDate: 0,
    deltaHours: 0,
    projectedAtDueDate: 0,
    isProjectedOverBudget: false,
};

const EMPTY_FINANCE: DeliverableLifecycleFinance = {
    contractFee: 0,
    costToDate: 0,
    revenueAccrued: 0,
    marginAbsolute: null,
    marginPct: null,
    effectiveHourlyRate: 0,
    hasUnknownCostEmployees: false,
};

function resolveLifecycleStatus(args: {
    phase: DeliverablePhase | null;
    today: Date;
    hours: DeliverableLifecycleHours;
    pacing: DeliverableLifecyclePacing;
}): DeliverableLifecycleStatus {
    const { phase, today, hours, pacing } = args;
    if (phase === null) return 'no-phase';
    const t0 = startOfDay(today);
    const s0 = startOfDay(phase.start);
    const d0 = startOfDay(phase.due);
    if (t0 < s0) return 'pre-start';
    if (t0 > d0) return 'completed';
    const budget = hours.budget;
    if (budget <= 0) {
        if (hours.computed > 0) return 'over-budget';
        return 'on-track';
    }
    if (hours.computed > budget || pacing.projectedAtDueDate > budget * 1.1) {
        return 'over-budget';
    }
    // At-risk: sobreconsumo >10 % del techo (no penaliza ir por debajo del ritmo esperado)
    if (pacing.deltaHours > budget * 0.1 || pacing.projectedAtDueDate > budget * 1.05) {
        return 'at-risk';
    }
    return 'on-track';
}

export function computeDeliverableLifecycle(args: {
    project: Project;
    allocations: Allocation[];
    employees: Employee[];
    hoursPreference: 'actual' | 'computed' | null;
    costMode: 'standard' | 'dynamic';
    today?: Date;
}): DeliverableLifecycle {
    const today = args.today ? startOfDay(args.today) : startOfDay(new Date());
    const phase = getDeliverablePhase(args.project);
    const budget = round2(args.project.budgetHours || 0);

    if (phase === null) {
        return {
            phase: null,
            hours: { ...EMPTY_HOURS },
            pacing: { ...EMPTY_PACING },
            finance: { ...EMPTY_FINANCE },
            status: 'no-phase',
        };
    }

    const phaseStartBound = format(subDays(phase.start, 6), 'yyyy-MM-dd');
    const phaseDueStr = format(phase.due, 'yyyy-MM-dd');

    const projectAllocs = args.allocations.filter((a) => {
        if (a.projectId !== args.project.id) return false;
        const ws = a.weekStartDate;
        if (ws < phaseStartBound) return false;
        if (ws > phaseDueStr) return false;
        return true;
    });

    const pref = args.hoursPreference === 'actual' || args.hoursPreference === 'computed' ? args.hoursPreference : undefined;

    let planned = 0;
    let actual = 0;
    let computed = 0;
    let hasUnknownCostEmployees = false;
    const hoursByEmployee = new Map<string, number>();

    for (const a of projectAllocs) {
        const pr = prorateHoursForPhaseOverlap(a, phase.start, phase.due, pref);
        planned = round2(planned + pr.planned);
        actual = round2(actual + pr.actual);
        computed = round2(computed + pr.computed);
        const empId = a.employeeId;
        hoursByEmployee.set(empId, round2((hoursByEmployee.get(empId) ?? 0) + pr.computed));
    }

    const available = round2(budget - computed);
    const pctConsumed = budget > 0 ? round2((computed / budget) * 100) : 0;

    const hoursBlock: DeliverableLifecycleHours = {
        planned,
        actual,
        computed,
        budget,
        available,
        pctConsumed,
    };

    const s0 = startOfDay(phase.start);
    const d0 = startOfDay(phase.due);
    const totalDays = phase.totalDays;

    let daysElapsed = 0;
    let daysRemaining = 0;
    if (today < s0) {
        daysElapsed = 0;
        daysRemaining = totalDays;
    } else if (today > d0) {
        daysElapsed = totalDays;
        daysRemaining = 0;
    } else {
        daysElapsed = Math.min(totalDays, differenceInCalendarDays(today, s0) + 1);
        daysRemaining = Math.max(0, differenceInCalendarDays(d0, today));
    }

    const expectedHoursToDate =
        totalDays > 0 ? round2(budget * (daysElapsed / totalDays)) : 0;
    const deltaHours = round2(computed - expectedHoursToDate);

    let projectedAtDueDate = 0;
    const statusPrelim =
        today < s0 ? 'pre-start' : today > d0 ? 'completed' : 'on-track';

    if (statusPrelim === 'pre-start') {
        projectedAtDueDate = 0;
    } else if (statusPrelim === 'completed') {
        projectedAtDueDate = computed;
    } else if (daysElapsed === 0) {
        projectedAtDueDate = computed;
    } else {
        projectedAtDueDate = round2(computed * (totalDays / Math.max(daysElapsed, 1)));
    }

    const isProjectedOverBudget = projectedAtDueDate > budget * 1.05;

    const pacing: DeliverableLifecyclePacing = {
        daysElapsed,
        daysRemaining,
        expectedHoursToDate,
        deltaHours,
        projectedAtDueDate,
        isProjectedOverBudget,
    };

    const contractFee = resolveContractFee(args.project);
    const revenueAccrued =
        totalDays > 0 ? round2(contractFee * (daysElapsed / totalDays)) : 0;
    const effectiveHourlyRate = budget > 0 ? round2(contractFee / budget) : 0;

    let costToDate = 0;
    for (const a of projectAllocs) {
        const pr = prorateHoursForPhaseOverlap(a, phase.start, phase.due, pref);
        const emp = args.employees.find((e) => e.id === a.employeeId);
        if (!emp) {
            hasUnknownCostEmployees = true;
            continue;
        }
        const displayHours = pr.computed;
        const totalEmp = hoursByEmployee.get(a.employeeId) ?? 0;
        costToDate = round2(
            costToDate + getRowCost(emp, displayHours, totalEmp, args.costMode)
        );
    }

    let marginAbsolute: number | null = null;
    let marginPct: number | null = null;
    if (contractFee > 0) {
        marginAbsolute = round2(revenueAccrued - costToDate);
        marginPct =
            revenueAccrued > 0 ? round2((marginAbsolute / revenueAccrued) * 100) : null;
    }

    const finance: DeliverableLifecycleFinance = {
        contractFee,
        costToDate,
        revenueAccrued,
        marginAbsolute,
        marginPct,
        effectiveHourlyRate,
        hasUnknownCostEmployees,
    };

    const status = resolveLifecycleStatus({ phase, today, hours: hoursBlock, pacing });

    return {
        phase,
        hours: hoursBlock,
        pacing,
        finance,
        status,
    };
}

/** Firma estable de allocations en memoria para invalidar caché (mismo proyecto). */
export function allocationsSignatureForProject(allocations: Allocation[], projectId: string): string {
    return allocations
        .filter((a) => a.projectId === projectId)
        .map(
            (a) =>
                `${a.id}:${a.hoursAssigned}:${a.hoursActual ?? ''}:${a.hoursComputed ?? ''}:${a.status}:${a.weekStartDate}`
        )
        .sort()
        .join('|');
}
