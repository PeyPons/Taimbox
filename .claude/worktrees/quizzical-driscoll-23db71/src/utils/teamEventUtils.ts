import { endOfDay, isWithinInterval, startOfDay } from 'date-fns';
import { TeamEvent, WorkSchedule, Absence } from '@/types';
import { parseDateStringLocal } from '@/utils/dateUtils';

/** Día civil local del evento (evita `new Date('yyyy-MM-dd')` en UTC que desplaza el día). */
export function teamEventCalendarDay(event: TeamEvent): Date {
  const raw = typeof event.date === 'string' ? event.date : String(event.date);
  const ymd = raw.length >= 10 ? raw.slice(0, 10) : raw;
  return startOfDay(parseDateStringLocal(ymd));
}

/**
 * Verifica si una fecha específica está cubierta por alguna ausencia del empleado
 */
function isDateCoveredByAbsence(date: Date, absences: Absence[]): boolean {
  const checkDay = startOfDay(date);
  return absences.some(absence => {
    const s = absence.startDate.length >= 10 ? absence.startDate.slice(0, 10) : absence.startDate;
    const e = absence.endDate.length >= 10 ? absence.endDate.slice(0, 10) : absence.endDate;
    const absStart = startOfDay(parseDateStringLocal(s));
    const absEnd = startOfDay(parseDateStringLocal(e));
    return isWithinInterval(checkDay, { start: absStart, end: absEnd });
  });
}

/**
 * Calcula las horas reducidas por eventos de equipo para un empleado en un rango de fechas.
 * 
 * MEJORAS:
 * 1. Si el evento tiene hoursReduction >= 8 (día completo), usa el horario real del empleado
 * 2. NO cuenta eventos en días donde el empleado ya tiene una ausencia (vacaciones, etc.)
 */
export function getTeamEventHoursInRange(
  startDate: Date,
  endDate: Date,
  employeeId: string,
  teamEvents: TeamEvent[],
  workSchedule: WorkSchedule,
  employeeAbsences: Absence[] = []  // NUEVO: recibe las ausencias del empleado
): number {
  let totalHours = 0;
  const rangeFrom = startOfDay(startDate);
  const rangeTo = endOfDay(endDate);

  teamEvents.forEach(event => {
    const eventDay = teamEventCalendarDay(event);

    if (!isWithinInterval(eventDay, { start: rangeFrom, end: rangeTo })) {
      return;
    }

    const ids = event.affectedEmployeeIds;
    const isAffected = ids === 'all' || (Array.isArray(ids) && ids.includes(employeeId));

    if (!isAffected) {
      return;
    }

    if (isDateCoveredByAbsence(eventDay, employeeAbsences)) {
      return;
    }

    const dayOfWeek = eventDay.getDay();
    const dayNames: (keyof WorkSchedule)[] = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ];
    const dayName = dayNames[dayOfWeek];
    const employeeHoursForDay = workSchedule[dayName] || 0;

    if (employeeHoursForDay > 0) {
      if (event.hoursReduction >= 8) {
        totalHours += employeeHoursForDay;
      } else {
        totalHours += Math.min(event.hoursReduction, employeeHoursForDay);
      }
    }
  });

  return totalHours;
}

/**
 * Obtiene el detalle de eventos que afectan a un empleado en un rango.
 * Útil para mostrar el breakdown en la UI.
 * 
 * NO incluye eventos en días donde el empleado ya tiene ausencia.
 */
export function getTeamEventDetailsInRange(
  startDate: Date,
  endDate: Date,
  employeeId: string,
  teamEvents: TeamEvent[],
  workSchedule: WorkSchedule,
  employeeAbsences: Absence[] = []  // NUEVO: recibe las ausencias del empleado
): { name: string; date: Date; hours: number }[] {
  const details: { name: string; date: Date; hours: number }[] = [];
  const rangeFrom = startOfDay(startDate);
  const rangeTo = endOfDay(endDate);

  teamEvents.forEach(event => {
    const eventDay = teamEventCalendarDay(event);

    if (!isWithinInterval(eventDay, { start: rangeFrom, end: rangeTo })) {
      return;
    }

    const ids = event.affectedEmployeeIds;
    const isAffected = ids === 'all' || (Array.isArray(ids) && ids.includes(employeeId));

    if (!isAffected) {
      return;
    }

    if (isDateCoveredByAbsence(eventDay, employeeAbsences)) {
      return;
    }

    const dayOfWeek = eventDay.getDay();
    const dayNames: (keyof WorkSchedule)[] = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ];
    const dayName = dayNames[dayOfWeek];
    const employeeHoursForDay = workSchedule[dayName] || 0;

    if (employeeHoursForDay > 0) {
      const hoursReduced =
        event.hoursReduction >= 8 ? employeeHoursForDay : Math.min(event.hoursReduction, employeeHoursForDay);

      details.push({
        name: event.name,
        date: eventDay,
        hours: hoursReduced,
      });
    }
  });

  return details;
}
