import { endOfMonth, format, startOfMonth } from 'date-fns';
import type {
  Absence,
  AgencySettings,
  Allocation,
  Client,
  Deadline,
  Employee,
  GlobalAssignment,
  Project,
  TeamEvent,
  WeeklyFeedback,
} from '@/types';
import { getAbsenceHoursInRange } from '@/utils/absenceUtils';
import { computeEmployeeMonthlyLoad } from '@/utils/appMetrics';
import { getMonthlyCapacity } from '@/utils/dateUtils';
import { computeProjectMetricsForMonth, type ProjectMetricsDeadline } from '@/utils/projectMetricsCompute';
import { round2 } from '@/utils/numbers';
import { getTeamEventHoursInRange } from '@/utils/teamEventUtils';

export interface EmployeeConfigSnapshot {
  id: string;
  name: string;
  email?: string;
  role: string;
  department?: string;
  departmentId?: string;
  isActive: boolean;
  defaultWeeklyCapacity: number;
  workSchedule: Employee['workSchedule'];
  /** Coste mensual en € (sensible); incluido para informes financieros / burnout con contexto económico. */
  monthlyCost?: number;
  /** @deprecated Espejo histórico; igual que `monthlyCost`. */
  hourlyRate?: number;
}

export interface BurnoutEmployeeMonthRow {
  employeeId: string;
  employeeName: string;
  /** Capacidad según calendario laboral del mes (horas teóricas trabajables). */
  calendarCapacityHours: number;
  /** Misma lógica que la tarjeta de Deadlines (`getAbsenceHoursInRange`). */
  absenceReductionHours: number;
  /** Misma lógica que la tarjeta de Deadlines (`getTeamEventHoursInRange`). */
  teamEventReductionHours: number;
  /** Suma de las dos anteriores (compatibilidad con versiones previas del informe). */
  absenceAndEventReductionHours: number;
  /** calendarCapacityHours − ausencias − eventos; alineado con “Disponible” en Deadlines. */
  netAvailableHours: number;
  /**
   * Horas en planificador como en la cuadrícula mensual (`computeEmployeeMonthlyLoad`):
   * tareas completadas con horas reales > 0 usan actual; si no, asignadas.
   */
  plannerHoursMonthlyGrid: number;
  /** Horas “efectivas” según preferencia de tracking y prorrateo (`computeProjectMetricsForMonth`). */
  plannerHoursProratedEffective: number;
  /** Suma de horas en Deadlines (cuotas cliente) para el empleado. */
  deadlineHoursClientProjects: number;
  /** Horas de gestiones globales de Deadlines atribuidas al empleado. */
  deadlineHoursGlobalAssignments: number;
  deadlineHoursTotal: number;
  /**
   * Carga “comprometida” para evitar doble conteo planificador vs deadlines:
   * max(planificador cuadrícula, deadlines) cuando ambos reflejan trabajo del mismo mes.
   */
  committedLoadHours: number;
  /** |planificador cuadrícula − deadlines| si ambos > 0 (desalineación útil para auditoría). */
  plannerVsDeadlinesDeltaHours: number;
  /** Proyectos con cupo > 0 en Deadlines (fragmentación). */
  deadlineProjectCount: number;
  /** committedLoadHours / netAvailableHours · 100 (999 si neto 0 y hay carga). */
  occupancyOfNetCapacityPercent: number;
  /** (netAvailableHours − committedLoadHours) / netAvailableHours · 100, mínimo 0. */
  bufferForAdHocPercent: number;
  /** Horas libres bajo el techo neto: max(0, net − committed). */
  spareHoursUnderNetCapacity: number;
  /** Referencia: defaultWeeklyCapacity × 4.33 (como en rentabilidad; puede diferir del calendario). */
  approxMonthlyHoursFromWeeklyDefault: number;
  /** Estado heurístico para riesgo de saturación. */
  burnoutRisk: 'low' | 'medium' | 'high' | 'critical' | 'unknown';
}

const NOTES: string[] = [
  'netAvailableHours usa la misma fórmula que Deadlines: calendario − getAbsenceHoursInRange − getTeamEventHoursInRange.',
  'plannerHoursMonthlyGrid coincide con la cabecera mensual del planificador (computeEmployeeMonthlyLoad).',
  'committedLoadHours = max(plannerHoursMonthlyGrid, deadlines cliente + globales) para no sumar dos veces el mismo trabajo.',
  'plannerHoursProratedEffective sigue la preferencia de horas de la agencia y semanas que cruzan meses (métricas / rentabilidad).',
];

function employeeInScope(emp: Employee, allowedEmployeeIds: Set<string> | null): boolean {
  if (!emp.isActive) return false;
  if (!allowedEmployeeIds) return true;
  return allowedEmployeeIds.has(emp.id);
}

function sumDeadlineClientHours(employeeId: string, deadlines: Deadline[]): {
  total: number;
  projectCount: number;
} {
  let total = 0;
  let projectCount = 0;
  for (const d of deadlines) {
    const h = d.employeeHours?.[employeeId];
    if (h != null && h > 0) {
      total += h;
      projectCount += 1;
    }
  }
  return { total: round2(total), projectCount };
}

function sumGlobalHoursForEmployee(
  employeeId: string,
  globals: GlobalAssignment[],
  scopeEmployeeIds: string[]
): number {
  let sum = 0;
  const scopeSet = new Set(scopeEmployeeIds);
  for (const g of globals) {
    if (g.affectsAll) {
      if (scopeSet.has(employeeId)) sum += g.hours || 0;
    } else {
      const ids = g.affectedEmployeeIds ?? [];
      if (ids.includes(employeeId)) sum += g.hours || 0;
    }
  }
  return round2(sum);
}

export function buildEmployeesConfigSnapshot(
  employees: Employee[],
  allowedEmployeeIds: Set<string> | null
): { schemaVersion: 1; exportedAt: string; employees: EmployeeConfigSnapshot[] } {
  const list = employees.filter((e) => employeeInScope(e, allowedEmployeeIds));
  return {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    employees: list.map((e) => ({
      id: e.id,
      name: e.name,
      email: e.email,
      role: e.role,
      department: e.department,
      departmentId: e.departmentId,
      isActive: e.isActive,
      defaultWeeklyCapacity: e.defaultWeeklyCapacity,
      workSchedule: e.workSchedule,
      monthlyCost: e.monthlyCost ?? e.hourlyRate,
      hourlyRate: e.monthlyCost ?? e.hourlyRate,
    })),
  };
}

export function computeBurnoutCapacityForMonth(params: {
  month: Date;
  employees: Employee[];
  allocations: Allocation[];
  absences: Absence[];
  teamEvents: TeamEvent[];
  deadlines: Deadline[];
  globalAssignments: GlobalAssignment[];
  projects: Project[];
  clients: Client[];
  deadlinesForMetrics: ProjectMetricsDeadline[];
  hoursTrackingPreference?: AgencySettings['hoursTrackingPreference'] | null;
  allowedEmployeeIds: Set<string> | null;
}): {
  schemaVersion: 1;
  exportedAt: string;
  monthKey: string;
  notes: string[];
  rows: BurnoutEmployeeMonthRow[];
} {
  const {
    month,
    employees,
    allocations,
    absences,
    teamEvents,
    deadlines,
    globalAssignments,
    projects,
    clients,
    deadlinesForMetrics,
    hoursTrackingPreference,
    allowedEmployeeIds,
  } = params;

  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const monthKey = format(month, 'yyyy-MM');

  const scopedEmployees = employees.filter((e) => employeeInScope(e, allowedEmployeeIds));
  const scopeIds = scopedEmployees.map((e) => e.id);

  // D5: Informe mensual de burnout — forzamos fin de mes como referencia de pacing para que
  // el snapshot sea estable (progreso esperado 100 % del mes) frente al default dinámico de compute.
  const { getEmployeeMetrics } = computeProjectMetricsForMonth({
    allocations,
    projects,
    clients,
    employees,
    month,
    hoursTrackingPreference: hoursTrackingPreference ?? undefined,
    deadlines: deadlinesForMetrics,
    pacingReferenceDate: monthEnd,
  });

  const rows: BurnoutEmployeeMonthRow[] = [];

  for (const emp of scopedEmployees) {
    const calendarCapacityHours = round2(getMonthlyCapacity(year, monthIndex, emp.workSchedule));
    const empAbsencesMonth = absences.filter((a) => a.employeeId === emp.id);
    const absenceReductionHours = round2(
      getAbsenceHoursInRange(monthStart, monthEnd, empAbsencesMonth, emp.workSchedule)
    );
    const teamEventReductionHours = round2(
      getTeamEventHoursInRange(monthStart, monthEnd, emp.id, teamEvents, emp.workSchedule, empAbsencesMonth)
    );
    const absenceAndEventReductionHours = round2(absenceReductionHours + teamEventReductionHours);
    const netAvailableHours = Math.max(
      0,
      round2(calendarCapacityHours - absenceReductionHours - teamEventReductionHours)
    );

    const monthlyGrid = computeEmployeeMonthlyLoad(emp.id, year, monthIndex, {
      employees,
      allocations,
      absences,
      teamEvents,
    });
    const plannerHoursMonthlyGrid = monthlyGrid.hours;

    const em = getEmployeeMetrics(emp.id);
    const plannerHoursProratedEffective = em?.totalComputed ?? 0;

    const { total: dClient, projectCount } = sumDeadlineClientHours(emp.id, deadlines);
    const dGlobal = sumGlobalHoursForEmployee(emp.id, globalAssignments, scopeIds);
    const deadlineHoursTotal = round2(dClient + dGlobal);

    const committedLoadHours = round2(Math.max(plannerHoursMonthlyGrid, deadlineHoursTotal));
    const plannerVsDeadlinesDeltaHours =
      plannerHoursMonthlyGrid > 0 && deadlineHoursTotal > 0
        ? round2(Math.abs(plannerHoursMonthlyGrid - deadlineHoursTotal))
        : 0;

    let occupancyOfNetCapacityPercent = 0;
    if (netAvailableHours > 0) {
      occupancyOfNetCapacityPercent = round2((committedLoadHours / netAvailableHours) * 100);
    } else if (committedLoadHours > 0) {
      occupancyOfNetCapacityPercent = 999;
    }

    const spareRaw = round2(netAvailableHours - committedLoadHours);
    const spareHoursUnderNetCapacity = Math.max(0, spareRaw);

    let bufferForAdHocPercent = 0;
    if (netAvailableHours > 0) {
      bufferForAdHocPercent = round2((spareHoursUnderNetCapacity / netAvailableHours) * 100);
    }

    const approxMonthlyHoursFromWeeklyDefault = round2((emp.defaultWeeklyCapacity || 0) * 4.33);

    let burnoutRisk: BurnoutEmployeeMonthRow['burnoutRisk'] = 'unknown';
    if (netAvailableHours <= 0 && committedLoadHours <= 0) burnoutRisk = 'low';
    else if (occupancyOfNetCapacityPercent >= 110 || (netAvailableHours <= 0 && committedLoadHours > 0)) {
      burnoutRisk = 'critical';
    } else if (occupancyOfNetCapacityPercent >= 100) {
      burnoutRisk = 'high';
    } else if (occupancyOfNetCapacityPercent >= 85 || projectCount >= 12) {
      burnoutRisk = 'medium';
    } else {
      burnoutRisk = 'low';
    }

    rows.push({
      employeeId: emp.id,
      employeeName: emp.name,
      calendarCapacityHours,
      absenceReductionHours,
      teamEventReductionHours,
      absenceAndEventReductionHours,
      netAvailableHours,
      plannerHoursMonthlyGrid,
      plannerHoursProratedEffective,
      deadlineHoursClientProjects: dClient,
      deadlineHoursGlobalAssignments: dGlobal,
      deadlineHoursTotal,
      committedLoadHours,
      plannerVsDeadlinesDeltaHours,
      deadlineProjectCount: projectCount,
      occupancyOfNetCapacityPercent,
      bufferForAdHocPercent,
      spareHoursUnderNetCapacity,
      approxMonthlyHoursFromWeeklyDefault,
      burnoutRisk,
    });
  }

  rows.sort((a, b) => b.occupancyOfNetCapacityPercent - a.occupancyOfNetCapacityPercent);

  return {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    monthKey,
    notes: NOTES,
    rows,
  };
}

export function buildEmployeeMonthMiniExport(params: {
  monthKey: string;
  employee: Employee;
  burnoutRow: BurnoutEmployeeMonthRow | undefined;
  allocationsMonth: Allocation[];
  deadlinesMonth: Deadline[];
  absencesMonth: Absence[];
  teamEventsMonth: TeamEvent[];
  weeklyFeedbackMonth: WeeklyFeedback[];
}): Record<string, unknown> {
  const { employee, allocationsMonth, deadlinesMonth, monthKey } = params;
  const empId = employee.id;
  const myAllocations = allocationsMonth.filter((a) => a.employeeId === empId);
  const myDeadlines = deadlinesMonth.filter((d) => (d.employeeHours?.[empId] ?? 0) > 0);
  const myEvents = params.teamEventsMonth.filter(
    (e) => e.affectedEmployeeIds === 'all' || e.affectedEmployeeIds.includes(empId)
  );
  return {
    schemaVersion: 1 as const,
    exportedAt: new Date().toISOString(),
    monthKey,
    employee: {
      id: employee.id,
      name: employee.name,
      email: employee.email,
      defaultWeeklyCapacity: employee.defaultWeeklyCapacity,
      workSchedule: employee.workSchedule,
      department: employee.department,
      departmentId: employee.departmentId,
    },
    burnout: params.burnoutRow ?? null,
    planningAllocations: myAllocations,
    deadlinesSubset: myDeadlines,
    absences: params.absencesMonth.filter((a) => a.employeeId === empId),
    teamEvents: myEvents,
    weeklyFeedback: params.weeklyFeedbackMonth.filter((f) => f.employeeId === empId),
  };
}

function sanitizeFilePart(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 60);
}

export function employeeMiniFilename(employee: Employee): string {
  const part = sanitizeFilePart(employee.name || 'empleado');
  return `${part}_${employee.id.slice(0, 8)}.json`;
}
