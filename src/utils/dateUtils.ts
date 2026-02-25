import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, isSameMonth, addDays, format, eachDayOfInterval, isWeekend, parseISO, isBefore, isAfter } from 'date-fns';
import { es } from 'date-fns/locale';
import { WorkSchedule } from '@/types';

// ... (Resto de funciones: getMonthName, formatDateToISO, isCurrentWeek se mantienen igual) ...
export const getMonthName = (date: Date) => format(date, 'MMMM', { locale: es });
export const formatDateToISO = (date: Date) => format(date, 'yyyy-MM-dd');
// ✅ Updated isCurrentWeek to handle split weeks (e.g. Jan 1st vs Dec 29th)
export const isCurrentWeek = (date: Date) => {
  const now = new Date();
  // Check if the given date is literally in the same week as "now"
  // Using endOfWeek ensures we capture the whole real week regardless of the split start
  const start = startOfWeek(now, { weekStartsOn: 1 });
  const end = endOfWeek(now, { weekStartsOn: 1 });
  return date >= start && date <= end;
};

export const getStorageKey = (weekStart: Date, viewMonth: Date): string => {
  // Misma lógica que Split Weeks: Si la fecha está en el mes, úsala.
  // Si es anterior al mes (caso overlap Dic-Ene), usa el 1 del mes.
  if (isSameMonth(weekStart, viewMonth)) {
    return format(weekStart, 'yyyy-MM-dd');
  }
  const monthStart = startOfMonth(viewMonth);
  // Si la semana empieza antes del mes pero termina dentro/después, es una semana partida.
  // La parte que pertenece a este 'viewMonth' empieza el día 1.
  if (weekStart < monthStart) {
    return format(monthStart, 'yyyy-MM-dd');
  }
  return format(weekStart, 'yyyy-MM-dd');
};

// Nueva función helper para normalizar fechas de inicio de semana
// Asegura que si estamos en modo estricto, usamos la fecha correcta (1 del mes o Lunes)
export const normalizeWeekStart = (date: Date | string, viewMonth: Date): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  // Primero obtenemos el lunes real de esa semana física
  const monday = startOfWeek(d, { weekStartsOn: 1 });

  // Luego aplicamos la lógica de Storage Key que ya maneja el Split
  return getStorageKey(monday, viewMonth);
};

// ✅ FUNCIÓN CORREGIDA PARA FILTRAR SEMANAS SIN DÍAS LABORABLES
export const getWeeksForMonth = (date: Date) => {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);

  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const weeks = [];
  let currentWeekStart = startDate;

  while (currentWeekStart <= endDate) {
    const currentWeekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });

    const effectiveStart = currentWeekStart < monthStart ? monthStart : currentWeekStart;
    const effectiveEnd = currentWeekEnd > monthEnd ? monthEnd : currentWeekEnd;

    // Lógica: Comprobamos si en el intervalo visible hay algún día que NO sea fin de semana
    const daysInInterval = eachDayOfInterval({ start: effectiveStart, end: effectiveEnd });
    const hasWorkingDays = daysInInterval.some(day => !isWeekend(day));

    // Lógica de "Split Weeks": Si la semana cruza meses, usamos el inicio efectivo como key
    // EXCEPTO si es la última semana del mes anterior (allí usamos el lunes normal)
    // Para simplificar: En el planner, el contexto de mes manda.

    // Si la semana empieza ANTES del mes y termina DENTRO, es la primera semana parcial.
    // Su "key" debe ser el 1 del mes para separarla de la semana de diciembre.
    const isFirstPartialWeek = currentWeekStart < monthStart && currentWeekEnd >= monthStart;

    // Si la semana empieza DENTRO y termina DESPUES, es la última semana parcial.
    // Su "key" sigue siendo el lunes normal (pertenece a este mes).

    // La clave real para la DB:
    // - Si es semana normal: LUNES
    // - Si es primera semana parcial de Enero: 1 de Enero (Jueves)
    // Esto crea DOS entradas en la DB para la misma semana física: una para Dic (Lunes 29) y otra para Enero (Jueves 1)

    const dbWeekStart = isFirstPartialWeek ? monthStart : currentWeekStart;

    // Solo añadimos la semana si tiene días laborables
    if (hasWorkingDays) {
      weeks.push({
        weekStart: dbWeekStart, // Usamos la fecha split como inicio real
        weekEnd: currentWeekEnd,
        weekLabel: `Semana ${weeks.length + 1}`,
        effectiveStart: dbWeekStart, // Aseguramos que effective matches
        effectiveEnd,
      });
    }

    currentWeekStart = addDays(currentWeekStart, 7);
  }

  return weeks;
};

// ... (getWorkingDaysInRange y getMonthlyCapacity se mantienen igual) ...
export const getWorkingDaysInRange = (start: Date, end: Date, schedule: WorkSchedule) => {
  let totalHours = 0;
  let days = 0;
  let current = new Date(start);
  if (current > end) return { totalHours: 0, days: 0 };
  while (current <= end) {
    const dayOfWeek = current.getDay();
    const dayKey = dayOfWeek === 0 ? 'sunday' : dayOfWeek === 1 ? 'monday' : dayOfWeek === 2 ? 'tuesday' : dayOfWeek === 3 ? 'wednesday' : dayOfWeek === 4 ? 'thursday' : dayOfWeek === 5 ? 'friday' : 'saturday';
    const hours = (schedule as unknown as Record<string, number>)[dayKey] || 0;
    if (hours > 0) days++;
    totalHours += hours;
    current = addDays(current, 1);
  }
  return { totalHours, days };
};

export const getMonthlyCapacity = (year: number, month: number, schedule: WorkSchedule) => {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  return getWorkingDaysInRange(start, end, schedule).totalHours;
};

/** Horas semanales según el horario (suma L–D). Usado para derivar defaultWeeklyCapacity del empleado. */
export const getWeeklyHoursFromSchedule = (schedule: WorkSchedule): number => {
  return schedule.monday + schedule.tuesday + schedule.wednesday + schedule.thursday
    + schedule.friday + schedule.saturday + schedule.sunday;
};

// ✅ Función helper para verificar si una allocation está en el mes efectivo
// SOLO incluye si el weekStartDate está en el mes efectivo (NO incluye semanas que cruzan meses)
// Esto asegura que las tareas de diciembre no aparezcan en enero, incluso si la semana cruza meses
export const isAllocationInEffectiveMonth = (weekStartDate: string | Date, viewMonth: Date): boolean => {
  try {
    const allocWeekStart = typeof weekStartDate === 'string' ? parseISO(weekStartDate) : weekStartDate;

    // STRICT MODE: Verificar si la semana PERTENECE al mes (basado en fecha de inicio)
    // Esto asegura separación total: Una semana de dic (29 dic) SOLO sale en dic.
    return isSameMonth(allocWeekStart, viewMonth);
  } catch (error) {
    return false;
  }
};

/**
 * Get the end date of a week based on configurable close day.
 * @param weekStartDate - The start date of the week (Monday)
 * @param closeDay - Days from week start (0-6, default 4 = Friday)
 * @returns Date representing the week close date
 */
export const getWeekEndDate = (weekStartDate: Date, closeDay: number = 4): Date => {
  return addDays(weekStartDate, closeDay);
};

/**
 * Default week close day (Friday = 4 days from Monday)
 */
export const DEFAULT_WEEKLY_CLOSE_DAY = 4;

/**
 * Número de días laborables (L–V) en un mes.
 * Usado para pacing: % del mes transcurrido.
 */
export function getWorkingDaysInMonth(month: Date): number {
  const start = startOfMonth(month);
  const end = endOfMonth(month);
  const days = eachDayOfInterval({ start, end });
  return days.filter(d => !isWeekend(d)).length;
}

/**
 * Días laborables transcurridos en el mes hasta hoy (solo tiene sentido para el mes actual).
 * Si el mes es futuro → 0. Si es el mes actual → días laborables desde inicio de mes hasta hoy (inclusive).
 * Si es un mes pasado → se devuelve el total del mes (100% transcurrido).
 */
export function getWorkingDaysElapsedInMonth(month: Date): number {
  const now = new Date();
  const start = startOfMonth(month);
  const end = endOfMonth(month);
  if (isBefore(now, start)) return 0;
  const endCap = isAfter(now, end) ? end : now;
  const days = eachDayOfInterval({ start, end: endCap });
  return days.filter(d => !isWeekend(d)).length;
}
