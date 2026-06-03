import { isBefore, startOfMonth } from 'date-fns';

/** true si el mes está antes del primer mes permitido por el plan (Free). */
export function isMonthBeforePlanHistory(month: Date, minMonth: Date | null): boolean {
  if (!minMonth) return false;
  return isBefore(startOfMonth(month), startOfMonth(minMonth));
}

export function isAtPlanHistoryMinMonth(month: Date, minMonth: Date | null): boolean {
  if (!minMonth) return false;
  return !isBefore(startOfMonth(minMonth), startOfMonth(month));
}
