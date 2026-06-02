import { startOfMonth } from 'date-fns';

/** Mes visible compartido entre dashboard, planificador, previsión, etc. */
export const PLANNER_DATE_STORAGE_KEY = 'planner_date';

const LEGACY_FORECAST_DATE_KEY = 'forecast_date';

export function readStoredPlannerMonth(): Date {
  if (typeof localStorage === 'undefined') {
    return startOfMonth(new Date());
  }
  const saved =
    localStorage.getItem(PLANNER_DATE_STORAGE_KEY) ??
    localStorage.getItem(LEGACY_FORECAST_DATE_KEY);
  if (saved) {
    const parsed = new Date(saved);
    if (!Number.isNaN(parsed.getTime())) {
      return startOfMonth(parsed);
    }
  }
  return startOfMonth(new Date());
}

export function writeStoredPlannerMonth(month: Date): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(PLANNER_DATE_STORAGE_KEY, startOfMonth(month).toISOString());
  localStorage.removeItem(LEGACY_FORECAST_DATE_KEY);
}
