import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';
import { useMonthNavigation, type UseMonthNavigationOptions } from '@/hooks/useMonthNavigation';

/** Navegación mensual con tope de histórico según plan (Free = 2 meses). */
export function usePlanMonthNavigation(options: Omit<UseMonthNavigationOptions, 'minMonth'> = {}) {
  const { historyMinDate } = useSubscriptionLimits();
  return useMonthNavigation({
    ...options,
    minMonth: historyMinDate ?? undefined,
  });
}
