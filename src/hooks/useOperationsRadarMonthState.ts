import { useEffect, useState } from 'react';
import { addMonths, endOfMonth, format, getDate, isSameMonth, parseISO, startOfMonth, subMonths } from 'date-fns';
import { writeStoredPlannerMonth } from '@/utils/plannerMonthStorage';
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';
import { isAtPlanHistoryMinMonth, isMonthBeforePlanHistory } from '@/utils/planHistoryUtils';
import { fetchDeadlinesForMonth } from '@/utils/deadlineUtils';
import { fetchGlobalAssignmentsForMonth } from '@/utils/globalAssignmentsUtils';
import type { Deadline, GlobalAssignment } from '@/types';

export function parseMonthFromSearchParams(searchParams: URLSearchParams): Date {
  const mes = searchParams.get('mes');
  if (!mes || !/^\d{4}-\d{2}$/.test(mes)) return startOfMonth(new Date());
  try {
    const d = parseISO(`${mes}-01`);
    if (isNaN(d.getTime())) return startOfMonth(new Date());
    return startOfMonth(d);
  } catch {
    return startOfMonth(new Date());
  }
}

interface UseOperationsRadarMonthStateParams {
  searchParams: URLSearchParams;
  navigate: (to: { pathname: string; search: string }, options?: { replace?: boolean }) => void;
  currentAgencyId?: string;
}

function clampViewToPlan(month: Date, historyMinDate: Date | null): Date {
  const m = startOfMonth(month);
  if (historyMinDate && isMonthBeforePlanHistory(m, historyMinDate)) {
    return startOfMonth(historyMinDate);
  }
  return m;
}

export function useOperationsRadarMonthState(params: UseOperationsRadarMonthStateParams) {
  const { searchParams, navigate, currentAgencyId } = params;
  const { historyMinDate } = useSubscriptionLimits();
  const [viewDate, setViewDate] = useState<Date>(() =>
    clampViewToPlan(parseMonthFromSearchParams(searchParams), historyMinDate),
  );
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [globalAssignments, setGlobalAssignments] = useState<GlobalAssignment[]>([]);

  useEffect(() => {
    setViewDate(prev => {
      const fromUrl = clampViewToPlan(parseMonthFromSearchParams(searchParams), historyMinDate);
      return prev.getTime() !== fromUrl.getTime() ? fromUrl : prev;
    });
  }, [searchParams, historyMinDate]);

  useEffect(() => {
    setViewDate((prev) => clampViewToPlan(prev, historyMinDate));
  }, [historyMinDate]);

  useEffect(() => {
    writeStoredPlannerMonth(viewDate);
  }, [viewDate]);

  useEffect(() => {
    const monthKey = format(viewDate, 'yyyy-MM');
    let cancelled = false;
    fetchDeadlinesForMonth(monthKey, currentAgencyId).then(({ data, error }) => {
      if (!cancelled && !error && data) setDeadlines(data);
      if (!cancelled && error) setDeadlines([]);
    });
    fetchGlobalAssignmentsForMonth(monthKey, currentAgencyId).then(({ data, error }) => {
      if (!cancelled && !error && data) setGlobalAssignments(data);
      if (!cancelled && error) setGlobalAssignments([]);
    });
    return () => {
      cancelled = true;
    };
  }, [viewDate, currentAgencyId]);

  const handlePrevMonth = () => {
    const next = subMonths(viewDate, 1);
    if (isMonthBeforePlanHistory(next, historyMinDate)) return;
    setViewDate(next);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('mes', format(next, 'yyyy-MM'));
    navigate({ pathname: '/operaciones', search: nextParams.toString() }, { replace: true });
  };

  const handleNextMonth = () => {
    const next = addMonths(viewDate, 1);
    setViewDate(next);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('mes', format(next, 'yyyy-MM'));
    navigate({ pathname: '/operaciones', search: nextParams.toString() }, { replace: true });
  };

  const handleToday = () => {
    const next = startOfMonth(new Date());
    setViewDate(next);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('mes', format(next, 'yyyy-MM'));
    navigate({ pathname: '/operaciones', search: nextParams.toString() }, { replace: true });
  };

  const isCurrentMonth = isSameMonth(new Date(), viewDate);
  const referenceDate = isCurrentMonth ? new Date() : endOfMonth(viewDate);
  const currentWeekOfMonth = Math.ceil(getDate(referenceDate) / 7);
  const isEndOfMonth = currentWeekOfMonth >= 3;

  return {
    viewDate,
    deadlines,
    globalAssignments,
    isCurrentMonth,
    currentWeekOfMonth,
    isEndOfMonth,
    handlePrevMonth,
    handleNextMonth,
    handleToday,
    prevMonthDisabled: isAtPlanHistoryMinMonth(viewDate, historyMinDate),
  };
}

