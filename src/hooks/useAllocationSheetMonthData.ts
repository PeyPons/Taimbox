import { useEffect, useMemo, useRef, useState } from 'react';
import { format, startOfMonth } from 'date-fns';
import type { Allocation } from '@/types';
import type { Deadline } from '@/types';
import { fetchDeadlinesForMonth } from '@/utils/deadlineUtils';

interface UseAllocationSheetMonthDataParams {
  open: boolean;
  isFormOpen: boolean;
  viewDate: Date;
  currentAgencyId?: string;
  allocations: Allocation[];
  isGlobalLoading: boolean;
  loadDataForMonth: (month: Date) => Promise<boolean>;
}

export function useAllocationSheetMonthData(params: UseAllocationSheetMonthDataParams) {
  const { open, isFormOpen, viewDate, currentAgencyId, allocations, isGlobalLoading, loadDataForMonth } = params;

  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const loadedMonthsRef = useRef<Set<string>>(new Set());

  const monthKey = useMemo(() => `${viewDate.getFullYear()}-${viewDate.getMonth()}`, [viewDate]);

  useEffect(() => {
    if (open && !isGlobalLoading) {
      if (loadedMonthsRef.current.has(monthKey)) {
        setIsLoadingTasks(false);
        return;
      }

      const monthStart = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
      const monthEnd = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);
      const hasDataInContext = allocations.some(a => {
        try {
          const allocDate = new Date(a.weekStartDate);
          return allocDate >= monthStart && allocDate <= monthEnd;
        } catch {
          return false;
        }
      });

      if (hasDataInContext) {
        loadedMonthsRef.current.add(monthKey);
        setIsLoadingTasks(false);
        return;
      }

      setIsLoadingTasks(true);
      loadDataForMonth(viewDate)
        .then(ok => {
          if (ok) loadedMonthsRef.current.add(monthKey);
        })
        .finally(() => {
          setIsLoadingTasks(false);
        });
    }
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

