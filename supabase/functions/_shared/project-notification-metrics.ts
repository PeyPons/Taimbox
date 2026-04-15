/**
 * Métricas mensuales por proyecto alineadas con ProjectsPage (detección de problemas).
 * Usado en Edge Functions para reglas `scheduled`.
 */

export type HoursPreference = 'computed' | 'actual';

export type ProjectIssueFlag = 'needs_planning' | 'behind_schedule' | 'over_budget' | 'no_activity';

export interface AllocationRow {
  project_id: string;
  employee_id: string;
  week_start_date: string;
  hours_assigned: number;
  status: string;
  hours_actual: number | null;
  hours_computed: number | null;
}

export interface ProjectRow {
  id: string;
  client_id: string;
  status: string;
  budget_hours: number | null;
  minimum_hours: number | null;
}

function parseLocalYmd(ymd: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim());
  if (!m) return new Date(NaN);
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  return new Date(y, mo, d);
}

/** Equivalente a isAllocationInEffectiveMonth en dateUtils (mes según inicio de semana local). */
export function isAllocationInEffectiveMonth(weekStartDate: string, viewMonth: Date): boolean {
  try {
    const allocWeekStart = parseLocalYmd(weekStartDate);
    if (Number.isNaN(allocWeekStart.getTime())) return false;
    return (
      allocWeekStart.getFullYear() === viewMonth.getFullYear() &&
      allocWeekStart.getMonth() === viewMonth.getMonth()
    );
  } catch {
    return false;
  }
}

export function getEffectiveCompletedHours(
  alloc: AllocationRow,
  preference: HoursPreference,
): number {
  if (preference === 'actual') {
    return alloc.hours_actual ?? 0;
  }
  return alloc.hours_computed ?? 0;
}

export interface ProjectMonthAnalysis {
  projectId: string;
  clientId: string;
  needsPlanning: boolean;
  behindSchedule: boolean;
  overBudget: boolean;
  noActivity: boolean;
  involvedEmployeeIds: string[];
  totalAssigned: number;
  hoursComputed: number;
  budget: number;
  minimum: number;
}

export function analyzeProjectMonth(
  project: ProjectRow,
  allocations: AllocationRow[],
  viewMonth: Date,
  monthProgress: number,
  hoursPreference: HoursPreference,
): ProjectMonthAnalysis | null {
  if (project.status !== 'active') return null;

  const monthTasks = allocations.filter(
    (a) => a.project_id === project.id && isAllocationInEffectiveMonth(a.week_start_date, viewMonth),
  );

  const totalAssigned = monthTasks.reduce((sum, t) => sum + (Number(t.hours_assigned) || 0), 0);
  const completedTasks = monthTasks.filter((t) => t.status === 'completed');

  const hoursComputed = completedTasks.reduce(
    (sum, t) => sum + getEffectiveCompletedHours(t, hoursPreference),
    0,
  );

  const budget = Number(project.budget_hours) || 0;
  const minimum = Number(project.minimum_hours) || 0;

  const needsPlanning =
    minimum > 0 ? totalAssigned < minimum : budget > 0 && totalAssigned < budget * 0.5;
  const executionPct = totalAssigned > 0 ? (hoursComputed / totalAssigned) * 100 : 0;
  const behindSchedule = monthProgress > 30 && executionPct < monthProgress - 20;
  const overBudget = budget > 0 && totalAssigned > budget;
  const noActivity = budget > 0 && totalAssigned === 0;

  const involvedEmployeeIds = [...new Set(monthTasks.map((t) => t.employee_id))];

  return {
    projectId: project.id,
    clientId: project.client_id,
    needsPlanning,
    behindSchedule,
    overBudget,
    noActivity,
    involvedEmployeeIds,
    totalAssigned,
    hoursComputed,
    budget,
    minimum,
  };
}

export function projectMatchesIssueFlags(
  analysis: ProjectMonthAnalysis,
  flags: ProjectIssueFlag[],
): boolean {
  if (!flags.length) return false;
  return flags.some((f) => {
    switch (f) {
      case 'needs_planning':
        return analysis.needsPlanning && !analysis.noActivity;
      case 'behind_schedule':
        return analysis.behindSchedule;
      case 'over_budget':
        return analysis.overBudget;
      case 'no_activity':
        return analysis.noActivity;
      default:
        return false;
    }
  });
}

export function passesProjectClientFilters(
  analysis: ProjectMonthAnalysis,
  projectIds?: string[],
  clientIds?: string[],
): boolean {
  if (projectIds?.length && !projectIds.includes(analysis.projectId)) return false;
  if (clientIds?.length && !clientIds.includes(analysis.clientId)) return false;
  return true;
}
