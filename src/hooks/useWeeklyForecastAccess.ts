import { usePermissions } from '@/hooks/usePermissions';
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';
import { useWeeklyModuleEnabled } from '@/hooks/useIntegration';

/** Acceso real a /weekly-forecast: plan Pro+, permiso de rol y módulo Weekly activo en la agencia. */
export function useWeeklyForecastAccess(): boolean {
  const { canAccess } = usePermissions();
  const { canAccessRouteByPlan } = useSubscriptionLimits();
  const isWeeklyModuleEnabled = useWeeklyModuleEnabled();

  return (
    isWeeklyModuleEnabled &&
    canAccess('/weekly-forecast') &&
    canAccessRouteByPlan('/weekly-forecast')
  );
}
