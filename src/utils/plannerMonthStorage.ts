import { startOfMonth } from 'date-fns';

/** Mes visible compartido entre dashboard, planificador, previsión, etc. */
export const PLANNER_DATE_STORAGE_KEY = 'planner_date';

const LEGACY_FORECAST_DATE_KEY = 'forecast_date';

/** Evento same-tab para sincronizar banner y hooks de navegación de mes. */
export const PLANNER_MONTH_CHANGE_EVENT = 'taimbox:planner-month-change';

function dispatchPlannerMonthChange(month: Date): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent(PLANNER_MONTH_CHANGE_EVENT, {
      detail: { monthIso: startOfMonth(month).toISOString() },
    })
  );
}

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
  const normalized = startOfMonth(month);
  const nextIso = normalized.toISOString();
  const prev =
    localStorage.getItem(PLANNER_DATE_STORAGE_KEY) ??
    localStorage.getItem(LEGACY_FORECAST_DATE_KEY);
  if (prev) {
    const prevDate = new Date(prev);
    if (!Number.isNaN(prevDate.getTime()) && startOfMonth(prevDate).getTime() === normalized.getTime()) {
      localStorage.setItem(PLANNER_DATE_STORAGE_KEY, nextIso);
      localStorage.removeItem(LEGACY_FORECAST_DATE_KEY);
      return;
    }
  }
  localStorage.setItem(PLANNER_DATE_STORAGE_KEY, nextIso);
  localStorage.removeItem(LEGACY_FORECAST_DATE_KEY);
  dispatchPlannerMonthChange(normalized);
}
