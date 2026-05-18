import { useCallback, useMemo, useState } from 'react';
import type { Allocation, NewTaskRow } from '@/types';
import type { ProjectBudgetStatus } from '@/hooks/useAllocationSheet';
import {
  captureBatchCommitSnapshot,
  createPlannerBatchPreviewContext,
  type BatchCommitSnapshot,
  type GetEmployeeLoadForWeekFn,
  type PlannerBatchPreviewContext,
} from '@/utils/plannerBatchPreview';

export interface UseBatchCommitPreviewParams {
  allocations: Allocation[];
  pendingRows: NewTaskRow[];
  viewDate: Date;
  defaultEmployeeId: string;
  weeks: { weekStart: Date; effectiveStart?: Date; effectiveEnd?: Date }[];
  getProjectBudgetStatus: (projectId: string) => ProjectBudgetStatus;
  getEmployeeLoadForWeek: GetEmployeeLoadForWeekFn;
}

export function useBatchCommitPreview(params: UseBatchCommitPreviewParams | null) {
  const [commitSnapshot, setCommitSnapshot] = useState<BatchCommitSnapshot | null>(null);

  const previewContext: PlannerBatchPreviewContext | null = useMemo(() => {
    if (!params) return null;
    return createPlannerBatchPreviewContext({
      allocations: params.allocations,
      pendingRows: params.pendingRows,
      viewDate: params.viewDate,
      defaultEmployeeId: params.defaultEmployeeId,
      commitSnapshot,
    });
  }, [
    params,
    commitSnapshot,
  ]);

  const captureSnapshot = useCallback(
    (validTasks: NewTaskRow[]) => {
      if (!params) return;
      setCommitSnapshot(
        captureBatchCommitSnapshot({
          allocations: params.allocations,
          validTasks,
          defaultEmployeeId: params.defaultEmployeeId,
          viewDate: params.viewDate,
          weeks: params.weeks,
          getProjectBudgetStatus: params.getProjectBudgetStatus,
          getEmployeeLoadForWeek: params.getEmployeeLoadForWeek,
        })
      );
    },
    [params]
  );

  const clearSnapshot = useCallback(() => {
    setCommitSnapshot(null);
  }, []);

  return {
    previewContext,
    captureSnapshot,
    clearSnapshot,
    isCommitting: commitSnapshot !== null,
  };
}
