import { useApp } from '@/contexts/AppContext';
import { useEnsureMonthWithLoading } from '@/hooks/useEnsureMonthWithLoading';
import { usePlanMonthNavigation } from '@/hooks/usePlanMonthNavigation';

export function useWeeklyForecastMonthData() {
  const { isLoading: isGlobalLoading } = useApp();
  const { currentMonth, setCurrentMonth, goToPrevMonth, goToNextMonth, goToToday } =
    usePlanMonthNavigation();
  const isLoadingMonth = useEnsureMonthWithLoading(currentMonth, { enabled: !isGlobalLoading });

  return {
    currentMonth,
    setCurrentMonth,
    handlePrevMonth: goToPrevMonth,
    handleNextMonth: goToNextMonth,
    handleToday: goToToday,
    isLoadingMonth,
  };
}
