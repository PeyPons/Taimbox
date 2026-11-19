import { useAgency } from '@/contexts/AgencyContext';
import { effectivePlanId, visibleAgencyModules } from '@/utils/effectivePlanModules';

/**
 * Hook para verificar si una integración está activa para la agencia actual
 * @param integrationId - ID de la integración a verificar
 * @returns true si la integración está activa, false en caso contrario
 */
export function useIntegration(integrationId: string): boolean {
  const { currentAgency } = useAgency();

  return currentAgency?.settings?.enabledIntegrations?.[integrationId] ?? false;
}

/** Cierre semanal Weekly (`modules.weeklyFeedback`). */
export function useWeeklyModuleEnabled(): boolean {
  const { currentAgency, isLoading } = useAgency();
  if (isLoading || !currentAgency) return false;
  const planId = effectivePlanId({
    planId: currentAgency.planId,
    subscriptionStatus: currentAgency.subscriptionStatus,
    trialEndsAt: currentAgency.trialEndsAt,
  });
  return visibleAgencyModules(currentAgency.settings, planId).weeklyFeedback;
}
