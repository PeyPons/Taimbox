import { Allocation, AgencySettings } from '@/types';
import { round2 } from '@/utils/numbers';

/**
 * Delta de planificación por tarea **completada** para mostrar en planificador / dashboard.
 *
 * - Modo `computed` (por defecto): horas computadas − horas reales (ajuste Weekly vs trabajo registrado).
 * - Modo `actual`: horas estimadas (`hoursAssigned`) − horas reales. En cierre se persiste `hoursComputed === hoursActual`
 *   a propósito (`getEffectiveCompletedHours`); la UI de “¿lento/rápido?” debe usar este delta, no `computed − actual`.
 *
 * **Solo sumar/agregar sobre allocations con `status === 'completed'`.** Si la tarea no está completada, no aplica.
 */
export function getPlanningDeltaHours(
  allocation: Allocation,
  preference?: AgencySettings['hoursTrackingPreference']
): number | null {
  if (allocation.status !== 'completed') {
    return null;
  }
  if (preference === 'actual') {
    return round2((allocation.hoursAssigned ?? 0) - (allocation.hoursActual ?? 0));
  }
  return round2((allocation.hoursComputed ?? 0) - (allocation.hoursActual ?? 0));
}

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
