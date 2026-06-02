import { useEffect, useMemo, useRef, useState } from 'react';
import { format, startOfMonth } from 'date-fns';
import type { Allocation } from '@/types';
import type { Deadline } from '@/types';
import { fetchDeadlinesForMonth } from '@/utils/deadlineUtils';
import { isAllocationInEffectiveMonth } from '@/utils/dateUtils';

interface UseAllocationSheetMonthDataParams {
  open: boolean;
  isFormOpen: boolean;
  viewDate: Date;
  currentAgencyId?: string;
  allocations: Allocation[];
  isGlobalLoading: boolean;
  loadDataForMonth: (month: Date) => Promise<boolean>;
}

function monthHasAllocationRows(viewDate: Date, allocations: Allocation[]): boolean {
  return allocations.some((a) => isAllocationInEffectiveMonth(a.weekStartDate, viewDate));
}

export function useAllocationSheetMonthData(params: UseAllocationSheetMonthDataParams) {
  const { open, isFormOpen, viewDate, currentAgencyId, allocations, isGlobalLoading, loadDataForMonth } = params;

  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const loadedMonthsRef = useRef<Set<string>>(new Set());

  const monthKey = useMemo(() => format(startOfMonth(viewDate), 'yyyy-MM'), [viewDate]);

  useEffect(() => {
    if (!open || isGlobalLoading) return;

    const hasRows = monthHasAllocationRows(viewDate, allocations);

    if (loadedMonthsRef.current.has(monthKey) && hasRows) {
      setIsLoadingTasks(false);
      return;
    }

    if (loadedMonthsRef.current.has(monthKey) && !hasRows) {
      loadedMonthsRef.current.delete(monthKey);
    }

    if (hasRows) {
      loadedMonthsRef.current.add(monthKey);
      setIsLoadingTasks(false);
      return;
    }

    setIsLoadingTasks(true);
    loadDataForMonth(viewDate)
      .then((ok) => {
        if (ok) loadedMonthsRef.current.add(monthKey);
      })
      .finally(() => {
        setIsLoadingTasks(false);
      });
  }, [monthKey, viewDate, open, isGlobalLoading, loadDataForMonth, allocations]);

  useEffect(() => {
    if (!open && !isFormOpen) return;
    const loadDeadlinesForMonth = async () => {
      const selectedMonthKey = format(startOfMonth(viewDate), 'yyyy-MM');
      try {
        const { data, error } = await fetchDeadlinesForMonth(selectedMonthKey, currentAgencyId);
        if (error) throw error;
        setDeadlines(data ?? []);
      } catch {
        setDeadlines([]);
      }
    };
    loadDeadlinesForMonth();
  }, [open, isFormOpen, viewDate, currentAgencyId]);

  return {
    isLoadingTasks,
    deadlines,
  };
}
