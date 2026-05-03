import {
  differenceInCalendarDays,
  endOfMonth,
  parseISO,
  startOfMonth,
} from 'date-fns';
import { PROJECT_TYPE_ENTREGABLE } from '@/config/projectTypePresets';

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Campos de proyecto usados para el fee mensual efectivo (entregables). */
export type ProjectFeeFields = {
  monthlyFee?: number;
  projectType?: string;
  deliverableContractFee?: number | null;
  deliverableStartDate?: string | null;
  deliverableDueDate?: string | null;
};

/**
 * Fee en € atribuido al mes calendario para rentabilidad.
 * - Retainers y demás tipos: `monthlyFee` del proyecto.
 * - Entregable con inicio y fin: prorrateo lineal por **días de calendario** del total del contrato
 *   (`deliverableContractFee` si existe y ≥ 0; si no, `monthlyFee` como total del contrato).
 * - Entregable sin fechas completas: mismo que retainer (`monthlyFee` por mes).
 */
export function getEffectiveMonthlyFee(project: ProjectFeeFields, month: Date): number {
  const base = project.monthlyFee ?? 0;
  if (project.projectType !== PROJECT_TYPE_ENTREGABLE) {
    return base;
  }

  const startStr = project.deliverableStartDate?.trim();
  const dueStr = project.deliverableDueDate?.trim();
  if (!startStr || !dueStr) {
    return base;
  }

  let phaseStart: Date;
  let phaseEnd: Date;
  try {
    phaseStart = parseISO(startStr);
    phaseEnd = parseISO(dueStr);
  } catch {
    return base;
  }
  if (Number.isNaN(phaseStart.getTime()) || Number.isNaN(phaseEnd.getTime()) || phaseEnd < phaseStart) {
    return base;
  }

  const contractTotal =
    project.deliverableContractFee != null &&
    Number.isFinite(project.deliverableContractFee) &&
    project.deliverableContractFee >= 0
      ? project.deliverableContractFee
      : base;
  if (contractTotal <= 0) {
    return 0;
  }

  const ms = startOfMonth(month);
  const me = endOfMonth(month);
  const ovStart = phaseStart.getTime() > ms.getTime() ? phaseStart : ms;
  const ovEnd = phaseEnd.getTime() < me.getTime() ? phaseEnd : me;
  if (ovStart > ovEnd) {
    return 0;
  }

  const phaseDays = differenceInCalendarDays(phaseEnd, phaseStart) + 1;
  const overlapDays = differenceInCalendarDays(ovEnd, ovStart) + 1;
  if (phaseDays <= 0 || overlapDays <= 0) {
    return 0;
  }

  return round2((contractTotal * overlapDays) / phaseDays);
}

/**
 * Devuelve el budget efectivo para un proyecto en un mes.
 * Si el deadline tiene budgetOverride, lo usa; si no, usa project.budgetHours.
 */
export function getEffectiveBudget(
  project: { budgetHours: number },
  deadline?: { budgetOverride?: number } | null
): number {
  if (deadline?.budgetOverride != null && deadline.budgetOverride >= 0) {
    return deadline.budgetOverride;
  }
  return project.budgetHours || 0;
}

export type ProjectBudgetMonthFields = {
  budgetHours: number;
  projectType?: string;
  deliverableStartDate?: string | null;
  deliverableDueDate?: string | null;
};

/**
 * Horas-presupuesto atribuidas al mes (rentabilidad).
 * - Con `budgetOverride` en el deadline del mes: ese valor.
 * - No Entregable: `budgetHours` total del proyecto.
 * - Entregable con fase: prorrateo lineal del total de horas por días de fase (misma lógica que el fee mensual).
 */
export function getEffectiveBudgetForMonth(
  project: ProjectBudgetMonthFields,
  deadline: { budgetOverride?: number } | null | undefined,
  month: Date
): number {
  if (deadline?.budgetOverride != null && deadline.budgetOverride >= 0) {
    return deadline.budgetOverride;
  }
  const base = project.budgetHours || 0;
  if (project.projectType !== PROJECT_TYPE_ENTREGABLE) {
    return base;
  }

  const startStr = project.deliverableStartDate?.trim();
  const dueStr = project.deliverableDueDate?.trim();
  if (!startStr || !dueStr) {
    return base;
  }

  let phaseStart: Date;
  let phaseEnd: Date;
  try {
    phaseStart = parseISO(startStr);
    phaseEnd = parseISO(dueStr);
  } catch {
    return base;
  }
  if (Number.isNaN(phaseStart.getTime()) || Number.isNaN(phaseEnd.getTime()) || phaseEnd < phaseStart) {
    return base;
  }

  const ms = startOfMonth(month);
  const me = endOfMonth(month);
  const ovStart = phaseStart.getTime() > ms.getTime() ? phaseStart : ms;
  const ovEnd = phaseEnd.getTime() < me.getTime() ? phaseEnd : me;
  if (ovStart > ovEnd) {
    return 0;
  }

  const phaseDays = differenceInCalendarDays(phaseEnd, phaseStart) + 1;
  const overlapDays = differenceInCalendarDays(ovEnd, ovStart) + 1;
  if (phaseDays <= 0 || overlapDays <= 0) {
    return 0;
  }

  return round2((base * overlapDays) / phaseDays);
}

/**
 * Devuelve el minimum efectivo para un proyecto en un mes.
 * Si el budget fue overridden, el minimum no puede exceder el override.
 */
export function getEffectiveMinimum(
  project: { budgetHours: number; minimumHours?: number },
  deadline?: { budgetOverride?: number } | null
): number {
  const minimum = project.minimumHours || 0;
  if (deadline?.budgetOverride != null && deadline.budgetOverride >= 0) {
    return Math.min(minimum, deadline.budgetOverride);
  }
  return minimum;
}
