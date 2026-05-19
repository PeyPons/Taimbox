/** Utilidades compartidas entre cierre Weekly, diálogo parcial y `useWeeklyCloseMutations`. */

/** Acción de cierre registrada en `weekly_feedback.weekly_action` (fuente de verdad). */
export type WeeklyCloseAction =
  | 'keep'
  | 'postpone'
  | 'distribute'
  | 'transfer'
  | 'justify'
  | 'cancel'
  | 'move';

export type WeeklyCloseApplyResult = { ok: true } | { ok: false; message: string };

export function weeklyCloseOk(): WeeklyCloseApplyResult {
  return { ok: true };
}

export function weeklyCloseFail(message: string): WeeklyCloseApplyResult {
  return { ok: false, message };
}

/** Feedback que cierra/resuelve una allocation en el flujo weekly. */
export const WEEKLY_CLOSURE_ACTIONS: ReadonlySet<WeeklyCloseAction> = new Set([
  'keep',
  'postpone',
  'distribute',
  'transfer',
  'justify',
  'cancel',
  'move',
]);

export interface WeeklyFeedbackLike {
  allocationId?: string | null;
  weeklyAction?: WeeklyCloseAction | null;
  comments?: string | null;
}

const LEGACY_CLOSURE_COMMENT_MARKERS = [
  'Tarea completada:',
  'Tarea movida a semana futura',
  'Tarea transferida a',
  'Distribuidas en',
  'Tarea distribuida desde',
  'Tarea con rollover:',
  'Tarea mantenida tal cual',
  'Tarea justificada:',
  'Tarea anulada:',
] as const;

export function isWeeklyFeedbackClosure(feedback: WeeklyFeedbackLike): boolean {
  if (!feedback.allocationId) return false;
  if (feedback.weeklyAction && WEEKLY_CLOSURE_ACTIONS.has(feedback.weeklyAction)) return true;
  const comments = feedback.comments ?? '';
  return LEGACY_CLOSURE_COMMENT_MARKERS.some((marker) => comments.includes(marker));
}

export function getWeeklyProcessedAllocationIds(feedback: WeeklyFeedbackLike[]): Set<string> {
  const ids = new Set<string>();
  for (const fb of feedback) {
    if (fb.allocationId && isWeeklyFeedbackClosure(fb)) ids.add(fb.allocationId);
  }
  return ids;
}

export function normalizeWeeklyHourInput(raw: string): string {
  const v = raw.replace(/[^0-9,.]/g, '').replace(/,/g, '.');
  const parts = v.split('.');
  return parts.length > 1 ? `${parts[0]}.${parts[1].slice(0, 2)}` : v;
}

export function parseWeeklyCloseHours(value: string): number {
  const parsed = parseFloat(value.replace(',', '.'));
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function resolveComputedForClose(
  actual: number,
  computedInput: string,
  preference: 'actual' | 'computed' | undefined
): number {
  if (preference === 'actual') return actual;
  return parseWeeklyCloseHours(computedInput) || actual;
}

export function validateKeepHours(actual: number, hoursAssigned?: number): string | null {
  if (actual <= 0) return 'Las horas reales deben ser mayores a 0';
  if (hoursAssigned != null && actual > hoursAssigned + 0.001) {
    return `Las horas reales no pueden superar el estimado (${hoursAssigned.toFixed(2)}h)`;
  }
  return null;
}

export function validatePostponeRemaining(
  actual: number,
  hoursAssigned: number,
  destWeek: string | undefined
): { ok: true; remaining: number } | { ok: false; message: string } {
  if (Number.isNaN(actual) || actual < 0) {
    return { ok: false, message: 'Las horas realizadas no pueden ser negativas' };
  }
  if (actual > hoursAssigned) {
    return {
      ok: false,
      message: 'Las horas realizadas no pueden superar el estimado de esta asignación',
    };
  }
  if (!destWeek?.trim()) return { ok: false, message: 'Selecciona la semana en la que quieres planificar lo pendiente' };
  const remaining = Math.round((hoursAssigned - actual) * 100) / 100;
  if (remaining <= 0) {
    return {
      ok: false,
      message:
        'Para posponer debe quedar tiempo pendiente (horas realizadas menores que el estimado de la tarea)',
    };
  }
  return { ok: true, remaining };
}
