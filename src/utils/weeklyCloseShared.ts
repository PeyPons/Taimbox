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

/** Saldo pendiente según horas ya registradas en la allocation (no el valor del formulario). */
export function getWeeklyTaskPendingHours(task: {
  hoursAssigned: number;
  hoursActual?: number | null;
}): number {
  const assigned = Number(task.hoursAssigned) || 0;
  const actual = Number(task.hoursActual) || 0;
  return Math.round(Math.max(0, assigned - actual) * 100) / 100;
}

/** Posponer: basta con estimado > 0; el usuario puede registrar 0h realizadas y mover todo el saldo. */
export function canPostponeTaskInWeekly(task: { hoursAssigned: number }): boolean {
  return (Number(task.hoursAssigned) || 0) > 0;
}

export function formatWeeklyTaskHoursSummary(task: {
  hoursAssigned: number;
  hoursActual?: number | null;
}): string {
  const assigned = roundWeeklyHours(Number(task.hoursAssigned) || 0);
  const actual = roundWeeklyHours(Number(task.hoursActual) || 0);
  const pending = getWeeklyTaskPendingHours(task);
  if (assigned <= 0) return 'Sin horas planificadas';
  if (actual <= 0) return `${assigned.toFixed(2)}h planificadas · sin registrar esta semana`;
  if (pending <= 0) {
    return `${assigned.toFixed(2)}h planificadas · ${actual.toFixed(2)}h registradas`;
  }
  return `${pending.toFixed(2)}h pendientes · ${assigned.toFixed(2)}h planificadas`;
}

/** Texto breve en pantalla; evita explicar el flujo tarea a tarea. */
export function getWeeklyTaskGuidance(task: {
  hoursAssigned: number;
  hoursActual?: number | null;
}): string | null {
  const assigned = Number(task.hoursAssigned) || 0;
  if (assigned <= 0) return null;
  const actual = Number(task.hoursActual) || 0;
  const pending = getWeeklyTaskPendingHours(task);

  if (actual <= 0) {
    return '¿No avanzaste? Elige «Sigo después», deja 0 en horas de esta semana y elige la semana destino.';
  }
  if (pending <= 0 && canPostponeTaskInWeekly(task)) {
    return 'Para pasar el trabajo a otra semana, elige «Sigo después» e indica cuánto hiciste esta semana (0 si quieres moverlo entero).';
  }
  return null;
}

function roundWeeklyHours(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
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
