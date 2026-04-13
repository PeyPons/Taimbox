/** Utilidades compartidas entre cierre Weekly, diálogo parcial y `useWeeklyCloseMutations`. */

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

export function validateKeepHours(actual: number): string | null {
  if (actual <= 0) return 'Las horas realizadas deben ser mayores a 0';
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
