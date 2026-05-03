import { Absence, WorkSchedule } from '@/types';
import { eachDayOfInterval, getDay, startOfDay, endOfDay, isWithinInterval, format } from 'date-fns';
import { parseDateStringLocal } from '@/utils/dateUtils';

const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export const getAbsenceHoursInRange = (
  start: Date,
  end: Date,
  absences: Absence[],
  schedule: WorkSchedule
): number => {
  // Normalizamos el rango de consulta al inicio y fin del día local para comparaciones precisas
  const rangeStart = startOfDay(start);
  const rangeEnd = endOfDay(end);

  // Mapa para rastrear la reducción máxima por día (para manejar solapamientos)
  // Clave: fecha en formato ISO string (YYYY-MM-DD), Valor: horas de reducción
  const dayReductions = new Map<string, number>();

  absences.forEach(absence => {
    try {
        // YYYY-MM-DD como fecha local (evita desfase de parseISO en husos UTC−)
        const absStart = startOfDay(parseDateStringLocal(absence.startDate));
        const absEnd = startOfDay(parseDateStringLocal(absence.endDate));

        // Validación básica para evitar errores con fechas inválidas
        if (isNaN(absStart.getTime()) || isNaN(absEnd.getTime()) || absStart > absEnd) {
            return;
        }

        const days = eachDayOfInterval({ start: absStart, end: absEnd });

        days.forEach(day => {
            // Verificamos si el día cae dentro del rango consultado (inclusive)
            if (isWithinInterval(day, { start: rangeStart, end: rangeEnd })) {
                const dayIndex = getDay(day);
                const dayName = DAY_KEYS[dayIndex];
                // Obtenemos las horas programadas para ese día de la semana
                const scheduledHours = schedule ? (schedule[dayName] || 0) : 0;

                // Solo calculamos reducción si es un día laborable para el empleado
                if (scheduledHours > 0) {
                    let reduction = 0;
                    
                    // Convertimos explícitamente a número para evitar problemas de tipos
                    const absenceHours = Number(absence.hours);
                    
                    // LÓGICA CORREGIDA:
                    // Si existe un valor de horas válido y mayor a 0, aplicamos esa cantidad (topeada por el horario diario).
                    // Si absence.hours es undefined, null, o 0, asumimos que es ausencia de DÍA COMPLETO.
                    if (!isNaN(absenceHours) && absenceHours > 0) {
                        reduction = Math.min(absenceHours, scheduledHours);
                    } else {
                        reduction = scheduledHours;
                    }
                    
                    // CORRECCIÓN DE SOLAPAMIENTO:
                    // Lógica híbrida:
                    // - Si hay una ausencia de día completo (reduction = scheduledHours), esa prevalece
                    // - Si hay múltiples ausencias parciales, se suman (hasta el máximo del día)
                    const dayKey = format(day, 'yyyy-MM-dd');
                    const existingReduction = dayReductions.get(dayKey) || 0;
                    
                    // Si la reducción existente ya es día completo, no sumar más
                    if (existingReduction >= scheduledHours) {
                        // Ya hay día completo, no hacer nada
                        return;
                    }
                    
                    // Si la nueva reducción es día completo, reemplazar todo
                    if (reduction >= scheduledHours) {
                        dayReductions.set(dayKey, scheduledHours);
                    } else {
                        // Ambas son parciales: sumar (hasta el máximo del día)
                        const newTotal = Math.min(existingReduction + reduction, scheduledHours);
                        dayReductions.set(dayKey, newTotal);
                    }
                }
            }
        });
    } catch (e) {
        // Prevenir rotura de la UI si hay datos corruptos
        console.warn("Error procesando ausencia:", absence, e);
    }
  });

  // Sumar todas las reducciones únicas por día (sin duplicar por solapamientos)
  let totalHours = 0;
  dayReductions.forEach((reduction) => {
    totalHours += reduction;
  });

  return totalHours;
};
