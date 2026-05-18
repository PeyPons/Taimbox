/**
 * Preview de impacto al añadir tareas en lote (planificador / dashboard).
 *
 * Contrato:
 * - **draft**: allocations en vivo + filas pendientes del formulario.
 * - **committing**: baseline congelado al pulsar Guardar + mismas filas pendientes
 *   (evita doble conteo mientras addAllocation actualiza el estado global).
 */
import { format, startOfMonth } from 'date-fns';
import type { Allocation, Deadline, NewTaskRow } from '@/types';
import type { ProjectBudgetStatus } from '@/hooks/useAllocationSheet';
import { isAllocationInEffectiveMonth } from '@/utils/dateUtils';
import { round2 } from '@/utils/numbers';

export type PlannerBatchPreviewMode = 'draft' | 'committing';

export interface WeekLoadSnapshot {
  hours: number;
  capacity: number;
}

export interface BatchCommitSnapshot {
  allocations: Allocation[];
  budgetByProjectId: Record<string, ProjectBudgetStatus>;
  weekLoadByKey: Record<string, WeekLoadSnapshot>;
}

export interface PlannerBatchPreviewContext {
  mode: PlannerBatchPreviewMode;
  liveAllocations: Allocation[];
  commitSnapshot: BatchCommitSnapshot | null;
  pendingRows: NewTaskRow[];
  viewDate: Date;
  defaultEmployeeId: string;
}

export function createPlannerBatchPreviewContext(params: {
  allocations: Allocation[];
  pendingRows: NewTaskRow[];
  viewDate: Date;
  defaultEmployeeId: string;
  commitSnapshot?: BatchCommitSnapshot | null;
}): PlannerBatchPreviewContext {
  const { allocations, pendingRows, viewDate, defaultEmployeeId, commitSnapshot = null } = params;
  return {
    mode: commitSnapshot ? 'committing' : 'draft',
    liveAllocations: allocations,
    commitSnapshot,
    pendingRows,
    viewDate,
    defaultEmployeeId,
  };
}

export function weekLoadSnapshotKey(employeeId: string, weekDate: string): string {
  return `${employeeId}|${weekDate}`;
}

/** Allocations usadas para sumar horas comprometidas (no incluyen filas pendientes). */
export function resolveCommittedAllocations(ctx: PlannerBatchPreviewContext): Allocation[] {
  if (ctx.mode === 'committing' && ctx.commitSnapshot) {
    return ctx.commitSnapshot.allocations;
  }
  return ctx.liveAllocations;
}

export function sumEmployeeProjectHoursInMonth(
  allocations: Allocation[],
  employeeId: string,
  projectId: string,
  viewDate: Date
): { planned: number; computed: number } {
  const employeeAllocations = allocations.filter(
    a =>
      a.employeeId === employeeId &&
      a.projectId === projectId &&
      isAllocationInEffectiveMonth(a.weekStartDate, viewDate)
  );

  let planned = 0;
  let computed = 0;
  for (const a of employeeAllocations) {
    if (a.status === 'completed') {
      computed += a.hoursComputed || 0;
    } else {
      planned += a.hoursAssigned || 0;
    }
  }
  return { planned: round2(planned), computed: round2(computed) };
}

export function resolveEmployeeIdForPendingRow(
  row: NewTaskRow,
  defaultEmployeeId: string
): string {
  return row.employeeId || defaultEmployeeId;
}

/** Horas pendientes del formulario para un empleado y proyecto (opcionalmente excluye una fila). */
export function sumPendingHoursForEmployeeProject(
  pendingRows: NewTaskRow[],
  projectId: string,
  employeeId: string,
  defaultEmployeeId: string,
  options?: { excludeTaskId?: string }
): number {
  let sum = 0;
  for (const row of pendingRows) {
    if (options?.excludeTaskId && row.id === options.excludeTaskId) continue;
    if (row.projectId !== projectId) continue;
    if (resolveEmployeeIdForPendingRow(row, defaultEmployeeId) !== employeeId) continue;
    sum += parseFloat(row.hours) || 0;
  }
  return round2(sum);
}

export function sumPendingHoursForProject(
  pendingRows: NewTaskRow[],
  projectId: string,
  options?: { excludeTaskId?: string }
): number {
  let sum = 0;
  for (const row of pendingRows) {
    if (options?.excludeTaskId && row.id === options.excludeTaskId) continue;
    if (row.projectId !== projectId) continue;
    sum += parseFloat(row.hours) || 0;
  }
  return round2(sum);
}

export interface EmployeeDeadlinePreview {
  deadlineHours: number;
  totalAssigned: number;
  remaining: number;
  exceeds: boolean;
  employeeId: string;
}

export function computeEmployeeDeadlinePreview(
  ctx: PlannerBatchPreviewContext,
  params: {
    projectId: string;
    employeeId: string;
    deadlines: Deadline[];
    taskId?: string;
    includeTaskHours?: number;
  }
): EmployeeDeadlinePreview | null {
  const { projectId, employeeId, deadlines, taskId, includeTaskHours = 0 } = params;
  const monthKey = format(startOfMonth(ctx.viewDate), 'yyyy-MM');
  const deadline = deadlines.find(
    d => d.projectId === projectId && d.month === monthKey && !d.isHidden
  );
  if (!deadline) return null;

  const deadlineHours = deadline.employeeHours[employeeId] || 0;
  if (deadlineHours <= 0) return null;

  const committed = resolveCommittedAllocations(ctx);
  const { planned, computed } = sumEmployeeProjectHoursInMonth(
    committed,
    employeeId,
    projectId,
    ctx.viewDate
  );
  const pendingSame = sumPendingHoursForEmployeeProject(
    ctx.pendingRows,
    projectId,
    employeeId,
    ctx.defaultEmployeeId,
    taskId ? { excludeTaskId: taskId } : undefined
  );
  const totalAssigned = round2(planned + computed + pendingSame + includeTaskHours);
  const remaining = round2(deadlineHours - totalAssigned);

  return {
    deadlineHours,
    totalAssigned,
    remaining,
    exceeds: totalAssigned > deadlineHours,
    employeeId,
  };
}

export function resolveProjectBudgetForPreview(
  ctx: PlannerBatchPreviewContext,
  projectId: string,
  getProjectBudgetStatus: (projectId: string) => ProjectBudgetStatus
): ProjectBudgetStatus {
  if (ctx.mode === 'committing' && ctx.commitSnapshot?.budgetByProjectId[projectId]) {
    return ctx.commitSnapshot.budgetByProjectId[projectId];
  }
  return getProjectBudgetStatus(projectId);
}

export function buildEmployeeProjectHoursMap(
  ctx: PlannerBatchPreviewContext,
  employeeIds: Iterable<string>
): Record<string, Record<string, { planned: number; computed: number }>> {
  const committed = resolveCommittedAllocations(ctx);
  const result: Record<string, Record<string, { planned: number; computed: number }>> = {};

  for (const empId of employeeIds) {
    result[empId] = {};
    for (const a of committed) {
      if (a.employeeId !== empId) continue;
      if (!isAllocationInEffectiveMonth(a.weekStartDate, ctx.viewDate)) continue;
      if (!result[empId][a.projectId]) {
        result[empId][a.projectId] = { planned: 0, computed: 0 };
      }
      if (a.status === 'completed') {
        result[empId][a.projectId].computed += a.hoursComputed || 0;
      } else {
        result[empId][a.projectId].planned += a.hoursAssigned || 0;
      }
    }
    for (const projectId of Object.keys(result[empId])) {
      result[empId][projectId].planned = round2(result[empId][projectId].planned);
      result[empId][projectId].computed = round2(result[empId][projectId].computed);
    }
  }

  return result;
}

export type GetEmployeeLoadForWeekFn = (
  employeeId: string,
  weekStart: string,
  effectiveStart?: Date,
  effectiveEnd?: Date,
  viewMonth?: Date
) => { hours: number; capacity: number; percentage: number };

export function resolveWeekLoadForPreview(
  ctx: PlannerBatchPreviewContext,
  employeeId: string,
  weekDate: string,
  getEmployeeLoadForWeek: GetEmployeeLoadForWeekFn,
  weekMeta?: { effectiveStart?: Date; effectiveEnd?: Date }
): WeekLoadSnapshot {
  if (ctx.mode === 'committing' && ctx.commitSnapshot) {
    const key = weekLoadSnapshotKey(employeeId, weekDate);
    const snap = ctx.commitSnapshot.weekLoadByKey[key];
    if (snap) return snap;
  }
  const load = getEmployeeLoadForWeek(
    employeeId,
    weekDate,
    weekMeta?.effectiveStart,
    weekMeta?.effectiveEnd,
    ctx.viewDate
  );
  return { hours: load.hours, capacity: load.capacity };
}

export interface CaptureBatchCommitSnapshotParams {
  allocations: Allocation[];
  validTasks: NewTaskRow[];
  defaultEmployeeId: string;
  viewDate: Date;
  weeks: { weekStart: Date; effectiveStart?: Date; effectiveEnd?: Date }[];
  getProjectBudgetStatus: (projectId: string) => ProjectBudgetStatus;
  getEmployeeLoadForWeek: GetEmployeeLoadForWeekFn;
}

/** Congela baseline de BD y lecturas derivadas (presupuesto / carga semanal) antes del guardado en lote. */
export function captureBatchCommitSnapshot(
  params: CaptureBatchCommitSnapshotParams
): BatchCommitSnapshot {
  const {
    allocations,
    validTasks,
    defaultEmployeeId,
    viewDate,
    weeks,
    getProjectBudgetStatus,
    getEmployeeLoadForWeek,
  } = params;

  const budgetByProjectId: Record<string, ProjectBudgetStatus> = {};
  const weekLoadByKey: Record<string, WeekLoadSnapshot> = {};

  for (const task of validTasks) {
    if (task.projectId && !budgetByProjectId[task.projectId]) {
      budgetByProjectId[task.projectId] = getProjectBudgetStatus(task.projectId);
    }

    const empId = resolveEmployeeIdForPendingRow(task, defaultEmployeeId);
    if (!task.weekDate) continue;
    const key = weekLoadSnapshotKey(empId, task.weekDate);
    if (weekLoadByKey[key]) continue;

    const weekIndex = weeks.findIndex(
      w => w.weekStart && format(w.weekStart, 'yyyy-MM-dd') === task.weekDate
    );
    const weekMeta = weekIndex >= 0 ? weeks[weekIndex] : weeks[0];
    const load = getEmployeeLoadForWeek(
      empId,
      task.weekDate,
      weekMeta?.effectiveStart,
      weekMeta?.effectiveEnd,
      viewDate
    );
    weekLoadByKey[key] = { hours: load.hours, capacity: load.capacity };
  }

  return {
    allocations: [...allocations],
    budgetByProjectId,
    weekLoadByKey,
  };
}
