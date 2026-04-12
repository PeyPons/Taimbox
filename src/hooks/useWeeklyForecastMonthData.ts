import { useEffect, useState } from 'react';
import { addMonths, subMonths } from 'date-fns';

interface UseWeeklyForecastMonthDataParams {
  ensureMonthLoaded: (date: Date) => Promise<void>;
  isGlobalLoading: boolean;
}

export function useWeeklyForecastMonthData(params: UseWeeklyForecastMonthDataParams) {
  const { ensureMonthLoaded, isGlobalLoading } = params;

  const [currentMonth, setCurrentMonth] = useState(() => {
    const saved = localStorage.getItem('forecast_date');
    return saved ? new Date(saved) : new Date();
  });

  useEffect(() => {
    if (!isGlobalLoading) {
      ensureMonthLoaded(currentMonth);
    }
  }, [currentMonth, isGlobalLoading, ensureMonthLoaded]);

  useEffect(() => {
    localStorage.setItem('forecast_date', currentMonth.toISOString());
  }, [currentMonth]);

  const handlePrevMonth = () => setCurrentMonth(prev => subMonths(prev, 1));
  const handleNextMonth = () => setCurrentMonth(prev => addMonths(prev, 1));
  const handleToday = () => setCurrentMonth(new Date());

  return {
    currentMonth,
    setCurrentMonth,
    handlePrevMonth,
    handleNextMonth,
    handleToday,
  };
}
