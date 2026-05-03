import { addDays, format, startOfWeek } from 'date-fns';
import { Allocation, Employee, LoadStatus, Project } from '@/types';
import {
  getWorkingDaysInRange,
  getMonthlyCapacity,
  getWeeksForMonth,
  getStorageKey,
  isAllocationInEffectiveMonth,
  parseDateStringLocal,
} from '@/utils/dateUtils';
import { Absence, TeamEvent } from '@/types';
import { getCapacityReductionBreakdown } from '@/utils/capacityUtils';
import { round2 } from '@/utils/numbers';

/**
 * Horas que cuentan hacia carga de planificación / capacidad por allocation.
 * Completadas sin horas reales (p. ej. tramo cerrado en rollover weekly con 0h en esa semana)
 * no deben seguir sumando `hours_assigned` residual: se usa `hours_computed` si hay, si no 0.
 */
export function hoursCountedTowardLoad(a: Allocation): number {
  if (a.status === 'completed') {
    const actual = Number(a.hoursActual || 0);
    if (actual > 0) return actual;
    const computed = a.hoursComputed != null ? Number(a.hoursComputed) : 0;
    if (computed > 0) return computed;
    return 0;
  }
  return Number(a.hoursAssigned || 0);
}

export function computeEmployeeLoadForWeek(
  employeeId: string,
  weekStart: string,
  options: {
    effectiveStart?: Date;
    effectiveEnd?: Date;
    viewMonth?: Date;
  },
  deps: {
    employees: Employee[];
    allocations: Allocation[];
    absences: Absence[];
    teamEvents: TeamEvent[];
  }
) {
  const { effectiveStart, effectiveEnd, viewMonth } = options;
  const { employees, allocations, absences, teamEvents } = deps;

  const employee = employees.find(e => e.id === employeeId);
  if (!employee) {
    return {
      hours: 0,
      capacity: 0,
      baseCapacity: 0,
      status: 'empty' as LoadStatus,
      percentage: 0,
      breakdown: [] as { reason: string; hours: number; type: 'absence' | 'event' }[],
    };
  }

  let employeeAllocations = allocations.filter(a => a.employeeId === employeeId && a.weekStartDate === weekStart);
  if (viewMonth) {
    employeeAllocations = employeeAllocations.filter(a => isAllocationInEffectiveMonth(a.weekStartDate, viewMonth));
  }

  const totalHours = round2(employeeAllocations.reduce((sum, a) => sum + hoursCountedTowardLoad(a), 0));

  /**
   * Rango de fechas donde esta fila del planificador tiene sentido (L–D o tramo partido en fin de mes).
   * Sin esto, Weekly / redistribución usaban `defaultWeeklyCapacity` (p. ej. 38h) para toda la semana ISO
   * y las ausencias se evaluaban en Mon–Sun completo → mismo "38h libres" en mayo aunque la semana sea corta
   * o con vacaciones en días laborables del tramo visible.
   */
  let rangeStart: Date;
  let rangeEnd: Date;
  if (effectiveStart && effectiveEnd) {
    rangeStart = effectiveStart;
    rangeEnd = effectiveEnd;
  } else if (viewMonth) {
    const weeksInMonth = getWeeksForMonth(viewMonth);
    const matched = weeksInMonth.find(w => getStorageKey(w.weekStart, viewMonth) === weekStart);
    if (matched) {
      rangeStart = matched.effectiveStart;
      rangeEnd = matched.effectiveEnd;
    } else {
      const anchor = parseDateStringLocal(weekStart);
      const monday = startOfWeek(anchor, { weekStartsOn: 1 });
      rangeStart = monday;
      rangeEnd = addDays(monday, 6);
    }
  } else {
    const anchor = parseDateStringLocal(weekStart);
    const monday = startOfWeek(anchor, { weekStartsOn: 1 });
    rangeStart = monday;
    rangeEnd = addDays(monday, 6);
  }

  const { totalHours: capacityHours } = getWorkingDaysInRange(rangeStart, rangeEnd, employee.workSchedule);
  const baseCapacity = capacityHours;

  let reducedCapacity = baseCapacity;

  const relevantAbsences = absences.filter(a => a.employeeId === employeeId);
  const { total: totalReduction, breakdown } = getCapacityReductionBreakdown(
    rangeStart,
    rangeEnd,
    employeeId,
    relevantAbsences,
    teamEvents,
    employee.workSchedule
  );
  reducedCapacity -= totalReduction;

  reducedCapacity = Math.max(0, round2(reducedCapacity));
  const percentage =
    reducedCapacity > 0 ? round2((totalHours / reducedCapacity) * 100) : totalHours > 0 ? 999 : 0;
  const hoursRemaining = reducedCapacity - totalHours;
  let status: LoadStatus = 'empty';
  if (totalHours === 0) status = 'empty';
  else if (reducedCapacity === 0 && totalHours > 0) status = 'overload';
  else if (totalHours > reducedCapacity) status = 'overload';
  else if (hoursRemaining >= 2 && hoursRemaining <= 5) status = 'healthy';
  else status = 'warning';

  return { hours: totalHours, capacity: reducedCapacity, baseCapacity, status, percentage, breakdown };
}

export function computeEmployeeMonthlyLoad(
  employeeId: string,
  year: number,
  month: number,
  deps: {
    employees: Employee[];
    allocations: Allocation[];
    absences: Absence[];
    teamEvents: TeamEvent[];
  }
) {
  const { employees, allocations, absences, teamEvents } = deps;

  const employee = employees.find(e => e.id === employeeId);
  if (!employee) {
    return { hours: 0, capacity: 0, status: 'empty' as LoadStatus, percentage: 0 };
  }

  const monthStart = new Date(year, month, 1);
  const weeks = getWeeksForMonth(monthStart);
  let totalHours = 0;
  weeks.forEach(week => {
    const weekStartDate = format(week.weekStart, 'yyyy-MM-dd');
    const tasks = allocations.filter(
      a =>
        a.employeeId === employeeId &&
        a.weekStartDate === weekStartDate &&
        isAllocationInEffectiveMonth(a.weekStartDate, monthStart)
    );
    totalHours += tasks.reduce((sum, a) => sum + hoursCountedTowardLoad(a), 0);
  });
  totalHours = round2(totalHours);

  const monthEnd = new Date(year, month + 1, 0);
  const employeeAbsences = absences.filter(a => a.employeeId === employeeId);
  let capacity = getMonthlyCapacity(year, month, employee.workSchedule);
  const { total: totalReduction } = getCapacityReductionBreakdown(
    monthStart,
    monthEnd,
    employeeId,
    employeeAbsences,
    teamEvents,
    employee.workSchedule
  );
  capacity = Math.max(0, round2(capacity - totalReduction));
  const percentage = capacity > 0 ? round2((totalHours / capacity) * 100) : totalHours > 0 ? 999 : 0;
  const hoursRemaining = capacity - totalHours;
  let status: LoadStatus = 'empty';
  if (totalHours === 0) status = 'empty';
  else if (capacity === 0 && totalHours > 0) status = 'overload';
  else if (totalHours > capacity) status = 'overload';
  else if (hoursRemaining >= 2 && hoursRemaining <= 5) status = 'healthy';
  else status = 'warning';

  return { hours: totalHours, capacity, status, percentage };
}

export function computeProjectHoursForMonth(
  projectId: string,
  month: Date,
  deps: {
    projects: Project[];
    allocations: Allocation[];
  }
) {
  const { projects, allocations } = deps;

  const project = projects.find(p => p.id === projectId);
  if (!project) return { used: 0, budget: 0, available: 0, percentage: 0 };

  const weeks = getWeeksForMonth(month);
  let usedHours = 0;
  weeks.forEach(week => {
    const storageKey = getStorageKey(week.weekStart, month);
    const tasks = allocations.filter(
      a =>
        a.projectId === projectId &&
        a.weekStartDate === storageKey &&
        isAllocationInEffectiveMonth(a.weekStartDate, month)
    );
    usedHours += tasks.reduce((sum, a) => sum + hoursCountedTowardLoad(a), 0);
  });
  usedHours = round2(usedHours);
  const available = round2(Math.max(0, project.budgetHours - usedHours));
  const percentage = project.budgetHours > 0 ? round2((usedHours / project.budgetHours) * 100) : 0;
  return { used: usedHours, budget: project.budgetHours, available, percentage };
}

export function computeClientTotalHoursForMonth(
  clientId: string,
  month: Date,
  deps: {
    projects: Project[];
    allocations: Allocation[];
  }
) {
  const { projects, allocations } = deps;

  const clientProjects = projects.filter(p => p.clientId === clientId);
  const weeks = getWeeksForMonth(month);
  let totalUsed = 0;
  let totalBudget = 0;

  clientProjects.forEach(project => {
    totalBudget += Number(project.budgetHours);
    weeks.forEach(week => {
      const storageKey = getStorageKey(week.weekStart, month);
      const tasks = allocations.filter(a => a.projectId === project.id && a.weekStartDate === storageKey);
      totalUsed += tasks.reduce((sum, a) => sum + hoursCountedTowardLoad(a), 0);
    });
  });

  totalUsed = round2(totalUsed);
  totalBudget = round2(totalBudget);
  const percentage = totalBudget > 0 ? round2((totalUsed / totalBudget) * 100) : 0;
  return { used: totalUsed, budget: totalBudget, percentage };
}

