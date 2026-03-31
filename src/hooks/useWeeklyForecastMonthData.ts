import { useEffect, useState } from 'react';
import { addMonths, endOfMonth, format, startOfMonth, subMonths } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { fetchDeadlinesForMonth } from '@/utils/deadlineUtils';
import type { Deadline } from '@/types';

interface UseWeeklyForecastMonthDataParams {
  agencyIdForData?: string;
  currentAgencyId?: string;
  ensureMonthLoaded: (date: Date) => Promise<void>;
  isGlobalLoading: boolean;
}

export function useWeeklyForecastMonthData(params: UseWeeklyForecastMonthDataParams) {
  const { agencyIdForData, currentAgencyId, ensureMonthLoaded, isGlobalLoading } = params;

  const [currentMonth, setCurrentMonth] = useState(() => {
    const saved = localStorage.getItem('forecast_date');
    return saved ? new Date(saved) : new Date();
  });
  const [dbTransfers, setDbTransfers] = useState<any[]>([]);
  const [monthDeadlines, setMonthDeadlines] = useState<Deadline[]>([]);

  useEffect(() => {
    if (!isGlobalLoading) {
      ensureMonthLoaded(currentMonth);
    }
  }, [currentMonth, isGlobalLoading, ensureMonthLoaded]);

  useEffect(() => {
    const fetchDbTransfers = async () => {
      if (!agencyIdForData) return;

      const start = startOfMonth(currentMonth).toISOString();
      const end = endOfMonth(currentMonth).toISOString();

      const { data, error } = await supabase
        .from('task_transfers')
        .select(`
          *,
          from_employee:employees!task_transfers_from_employee_id_fkey(name, avatar_url),
          to_employee:employees!task_transfers_to_employee_id_fkey(name, avatar_url),
          allocation:allocations!task_transfers_allocation_id_fkey(task_name, project_id)
        `)
        .eq('agency_id', agencyIdForData)
        .gte('requested_at', start)
        .lte('requested_at', end);

      if (!error && data) {
        setDbTransfers(data);
      }
    };

    fetchDbTransfers();
  }, [currentMonth, agencyIdForData]);

  useEffect(() => {
    localStorage.setItem('forecast_date', currentMonth.toISOString());
  }, [currentMonth]);

  useEffect(() => {
    const load = async () => {
      const selectedMonthStr = format(currentMonth, 'yyyy-MM');
      const { data, error } = await fetchDeadlinesForMonth(selectedMonthStr, currentAgencyId);
      if (!error && data) setMonthDeadlines(data);
      if (error) setMonthDeadlines([]);
    };
    load();
  }, [currentMonth, currentAgencyId]);

  const handlePrevMonth = () => setCurrentMonth(prev => subMonths(prev, 1));
  const handleNextMonth = () => setCurrentMonth(prev => addMonths(prev, 1));
  const handleToday = () => setCurrentMonth(new Date());

  return {
    currentMonth,
    setCurrentMonth,
    dbTransfers,
    monthDeadlines,
    handlePrevMonth,
    handleNextMonth,
    handleToday,
  };
}

