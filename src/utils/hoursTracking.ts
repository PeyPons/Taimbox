import { Allocation, AgencySettings } from '@/types';

/**
 * Depender de la configuración de la agencia, este helper devuelve las horas validadas (computadas)
 * o bien las horas reales registradas, si la agencia prefiere no usar el Weekly / Computed.
 */
export function getEffectiveCompletedHours(
  allocation: Allocation,
  preference?: AgencySettings['hoursTrackingPreference']
): number {
  if (preference === 'actual') {
    return allocation.hoursActual ?? 0;
  }
  return allocation.hoursComputed ?? 0;
}

/**
 * Devuelve un análisis combinado de horas asumiendo que para tareas completadas se utiliza el tracking efectivo
 * y para tareas pendientes se utilizan las horas asignadas, o dependiendo de las necesidades.
 */
export function getEffectiveAllocationHours(
  allocation: Allocation,
  preference?: AgencySettings['hoursTrackingPreference']
): number {
  if (allocation.status === 'completed') {
    return getEffectiveCompletedHours(allocation, preference);
  }
  if (preference === 'actual') {
    // Si prefiere reles e incluso en pending hay horas registradas, podemos considerarlas como avance real.
    // De lo contrario, a efectos de "cuánto se asume que ejecutará", usamos assigned.
    return (allocation.hoursActual && allocation.hoursActual > 0) ? allocation.hoursActual : allocation.hoursAssigned;
  }
  // Default behavior ('computed') uses actual/assigned loosely when pending, 
  // but often we rely on assigned for future load. 
  // Let's use what the old logic commonly did: `allocation.hoursComputed || allocation.hoursActual || allocation.hoursAssigned`
  return allocation.hoursComputed || allocation.hoursActual || allocation.hoursAssigned || 0;
}
