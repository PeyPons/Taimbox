import { useApp } from '@/contexts/AppContext';
import { useEnsureMonthWithLoading } from '@/hooks/useEnsureMonthWithLoading';
import { useMonthNavigation } from '@/hooks/useMonthNavigation';

export function useWeeklyForecastMonthData() {
  const { isLoading: isGlobalLoading } = useApp();
  const { currentMonth, setCurrentMonth, goToPrevMonth, goToNextMonth, goToToday } =
    useMonthNavigation();
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
