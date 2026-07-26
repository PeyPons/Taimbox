import { useCallback, useEffect, useState } from 'react';
import { addMonths, format, startOfMonth, subMonths } from 'date-fns';
import {
  PLANNER_MONTH_CHANGE_EVENT,
  readStoredPlannerMonth,
  writeStoredPlannerMonth,
} from '@/utils/plannerMonthStorage';

export interface UseMonthNavigationOptions {
  /** Si no se persiste, solo usa estado en memoria. */
  persist?: boolean;
  initialMonth?: Date;
  minMonth?: Date;
  maxMonth?: Date;
}

function clampMonth(date: Date, minMonth?: Date, maxMonth?: Date): Date {
  let m = startOfMonth(date);
  if (minMonth && m < startOfMonth(minMonth)) {
    m = startOfMonth(minMonth);
  }
  if (maxMonth && m > startOfMonth(maxMonth)) {
    m = startOfMonth(maxMonth);
  }
  return m;
}

export function useMonthNavigation(options: UseMonthNavigationOptions = {}) {
  const { persist = true, initialMonth, minMonth, maxMonth } = options;

  const [currentMonth, setCurrentMonthState] = useState(() =>
    clampMonth(initialMonth ?? (persist ? readStoredPlannerMonth() : new Date()), minMonth, maxMonth)
  );

  useEffect(() => {
    if (minMonth && currentMonth < startOfMonth(minMonth)) {
      setCurrentMonthState(startOfMonth(minMonth));
    }
  }, [minMonth, currentMonth]);

  const setCurrentMonth = useCallback(
    (value: Date | ((prev: Date) => Date)) => {
      setCurrentMonthState((prev) => {
        const raw = typeof value === 'function' ? value(prev) : value;
        return clampMonth(raw, minMonth, maxMonth);
      });
    },
    [minMonth, maxMonth]
  );

  useEffect(() => {
    if (persist) {
      writeStoredPlannerMonth(currentMonth);
    }
  }, [currentMonth, persist]);

  // Sincronizar si el banner (u otra vista) cambia el mes compartido.
  useEffect(() => {
    if (!persist) return;
    const onExternalChange = (event: Event) => {
      const detail = (event as CustomEvent<{ monthIso?: string }>).detail;
      const next = detail?.monthIso
        ? startOfMonth(new Date(detail.monthIso))
        : readStoredPlannerMonth();
      if (Number.isNaN(next.getTime())) return;
      setCurrentMonthState((prev) => {
        const clamped = clampMonth(next, minMonth, maxMonth);
        return prev.getTime() === clamped.getTime() ? prev : clamped;
      });
    };
    window.addEventListener(PLANNER_MONTH_CHANGE_EVENT, onExternalChange);
    return () => window.removeEventListener(PLANNER_MONTH_CHANGE_EVENT, onExternalChange);
  }, [persist, minMonth, maxMonth]);

  const goToPrevMonth = useCallback(() => {
    setCurrentMonth((prev) => subMonths(prev, 1));
  }, [setCurrentMonth]);

  const goToNextMonth = useCallback(() => {
    setCurrentMonth((prev) => addMonths(prev, 1));
  }, [setCurrentMonth]);

  const goToToday = useCallback(() => {
    setCurrentMonth(startOfMonth(new Date()));
  }, [setCurrentMonth]);

  const monthKey = format(currentMonth, 'yyyy-MM');

  return {
    currentMonth,
    setCurrentMonth,
    goToPrevMonth,
    goToNextMonth,
    goToToday,
    monthKey,
  };
}
