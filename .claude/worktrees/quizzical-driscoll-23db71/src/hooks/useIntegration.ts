import { useAgency } from '@/contexts/AgencyContext';

/**
 * Hook para verificar si una integración está activa para la agencia actual
 * @param integrationId - ID de la integración a verificar
 * @returns true si la integración está activa, false en caso contrario
 */
export function useIntegration(integrationId: string): boolean {
  const { currentAgency } = useAgency();
  
  return currentAgency?.settings?.enabledIntegrations?.[integrationId] ?? false;
}

/**
 * Hook para verificar múltiples integraciones a la vez
 * @param integrationIds - Array de IDs de integraciones a verificar
 * @returns Objeto con el estado de cada integración
 */
export function useIntegrations(integrationIds: string[]): Record<string, boolean> {
  const { currentAgency } = useAgency();
  const enabled = currentAgency?.settings?.enabledIntegrations ?? {};
  
  return integrationIds.reduce((acc, id) => {
    acc[id] = enabled[id] ?? false;
    return acc;
  }, {} as Record<string, boolean>);
}

