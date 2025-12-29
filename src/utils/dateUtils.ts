import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, isSameMonth, addDays, format, eachDayOfInterval, isWeekend, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { WorkSchedule } from '@/types';

// ... (Resto de funciones: getMonthName, formatDateToISO, isCurrentWeek se mantienen igual) ...
export const getMonthName = (date: Date) => format(date, 'MMMM', { locale: es });
export const formatDateToISO = (date: Date) => format(date, 'yyyy-MM-dd');
export const isCurrentWeek = (date: Date) => {
    const now = new Date();
    const start = startOfWeek(now, { weekStartsOn: 1 });
    return date.getTime() === start.getTime();
};

export const getStorageKey = (weekStart: Date, viewMonth: Date): string => {
    if (isSameMonth(weekStart, viewMonth)) {
        return format(weekStart, 'yyyy-MM-dd');
    }
    const monthStart = startOfMonth(viewMonth);
    if (weekStart < monthStart) {
        return format(monthStart, 'yyyy-MM-dd');
    }
    return format(weekStart, 'yyyy-MM-dd');
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

    // Solo añadimos la semana si tiene días laborables
    if (hasWorkingDays) {
        weeks.push({
            weekStart: currentWeekStart,
            weekEnd: currentWeekEnd,
            weekLabel: `Semana ${weeks.length + 1}`,
            effectiveStart,
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
        // @ts-ignore
        const hours = schedule[dayKey] || 0;
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

// ✅ Función helper para verificar si una allocation está en el mes efectivo
// Considera semanas que cruzan meses: solo incluye si tiene días laborables en el mes efectivo
export const isAllocationInEffectiveMonth = (weekStartDate: string | Date, viewMonth: Date): boolean => {
  try {
    const allocWeekStart = typeof weekStartDate === 'string' ? parseISO(weekStartDate) : weekStartDate;
    const monthStart = startOfMonth(viewMonth);
    const monthEnd = endOfMonth(viewMonth);
    
    // Si el weekStartDate está en el mes efectivo, incluir
    if (isSameMonth(allocWeekStart, viewMonth)) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/3b5a9c54-3879-4370-8f86-7870919c2bd3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dateUtils.ts:96',message:'isAllocationInEffectiveMonth: same month',data:{weekStartDate:typeof weekStartDate==='string'?weekStartDate:format(weekStartDate,'yyyy-MM-dd'),viewMonth:format(viewMonth,'yyyy-MM'),result:true},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      return true;
    }
    
    // Si la semana cruza meses, verificar si tiene días laborables en el mes efectivo
    const allocWeekEnd = addDays(allocWeekStart, 6);
    
    // Calcular el rango efectivo de la semana en el mes
    const effectiveStart = allocWeekStart < monthStart ? monthStart : allocWeekStart;
    const effectiveEnd = allocWeekEnd > monthEnd ? monthEnd : allocWeekEnd;
    
    // Solo incluir si hay días laborables en el rango efectivo del mes
    if (effectiveStart <= effectiveEnd) {
      const daysInInterval = eachDayOfInterval({ start: effectiveStart, end: effectiveEnd });
      const hasWorkingDays = daysInInterval.some(day => !isWeekend(day));
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/3b5a9c54-3879-4370-8f86-7870919c2bd3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dateUtils.ts:110',message:'isAllocationInEffectiveMonth: crosses months',data:{weekStartDate:typeof weekStartDate==='string'?weekStartDate:format(weekStartDate,'yyyy-MM-dd'),viewMonth:format(viewMonth,'yyyy-MM'),effectiveStart:format(effectiveStart,'yyyy-MM-dd'),effectiveEnd:format(effectiveEnd,'yyyy-MM-dd'),hasWorkingDays,result:hasWorkingDays},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      return hasWorkingDays;
    }
    
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/3b5a9c54-3879-4370-8f86-7870919c2bd3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dateUtils.ts:115',message:'isAllocationInEffectiveMonth: no overlap',data:{weekStartDate:typeof weekStartDate==='string'?weekStartDate:format(weekStartDate,'yyyy-MM-dd'),viewMonth:format(viewMonth,'yyyy-MM'),result:false},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    return false;
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/3b5a9c54-3879-4370-8f86-7870919c2bd3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dateUtils.ts:119',message:'isAllocationInEffectiveMonth: error',data:{weekStartDate:typeof weekStartDate==='string'?weekStartDate:'Date',viewMonth:format(viewMonth,'yyyy-MM'),error:String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    return false;
  }
};
