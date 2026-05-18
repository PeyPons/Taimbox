import { describe, expect, it } from 'vitest';
import type { Allocation, Deadline, NewTaskRow } from '@/types';
import {
  captureBatchCommitSnapshot,
  computeEmployeeDeadlinePreview,
  createPlannerBatchPreviewContext,
  resolveCommittedAllocations,
} from '@/utils/plannerBatchPreview';
import type { ProjectBudgetStatus } from '@/hooks/useAllocationSheet';

const viewDate = new Date(2026, 4, 1); // 2026-05

function alloc(partial: Partial<Allocation> & Pick<Allocation, 'id'>): Allocation {
  return {
    employeeId: 'emp-1',
    projectId: 'proj-a',
    weekStartDate: '2026-05-05',
    hoursAssigned: 0,
    hoursActual: 0,
    hoursComputed: 0,
    status: 'planned',
    taskName: 'T',
    ...partial,
  } as Allocation;
}

const deadlines: Deadline[] = [
  {
    id: 'd1',
    projectId: 'proj-a',
    month: '2026-05',
    employeeHours: { 'emp-1': 20 },
    isHidden: false,
  } as Deadline,
];

describe('plannerBatchPreview', () => {
  it('en draft suma comprometido + pendiente sin duplicar la misma fila', () => {
    const committed: Allocation[] = [
      alloc({ id: 'a1', hoursAssigned: 10, status: 'planned' }),
    ];
    const pending: NewTaskRow[] = [
      {
        id: 'row-1',
        projectId: 'proj-a',
        taskName: 'Nueva',
        hours: '5',
        weekDate: '2026-05-12',
        description: '',
        dependencyId: 'none',
      },
    ];
    const ctx = createPlannerBatchPreviewContext({
      allocations: committed,
      pendingRows: pending,
      viewDate,
      defaultEmployeeId: 'emp-1',
    });

    const preview = computeEmployeeDeadlinePreview(ctx, {
      projectId: 'proj-a',
      employeeId: 'emp-1',
      deadlines,
      taskId: 'row-1',
      includeTaskHours: 5,
    });

    expect(preview?.totalAssigned).toBe(15);
    expect(preview?.exceeds).toBe(false);
  });

  it('en committing ignora allocations en vivo y usa el baseline congelado', () => {
    const baseline: Allocation[] = [
      alloc({ id: 'a1', hoursAssigned: 10, status: 'planned' }),
    ];
    const liveAfterSave: Allocation[] = [
      ...baseline,
      alloc({ id: 'a2', hoursAssigned: 8, status: 'planned' }),
    ];
    const pending: NewTaskRow[] = [
      {
        id: 'row-1',
        projectId: 'proj-a',
        taskName: 'Nueva',
        hours: '5',
        weekDate: '2026-05-12',
        description: '',
        dependencyId: 'none',
      },
    ];

    const snapshot = {
      allocations: baseline,
      budgetByProjectId: {} as Record<string, ProjectBudgetStatus>,
      weekLoadByKey: {},
    };

    const ctx = createPlannerBatchPreviewContext({
      allocations: liveAfterSave,
      pendingRows: pending,
      viewDate,
      defaultEmployeeId: 'emp-1',
      commitSnapshot: snapshot,
    });

    expect(resolveCommittedAllocations(ctx)).toEqual(baseline);

    const preview = computeEmployeeDeadlinePreview(ctx, {
      projectId: 'proj-a',
      employeeId: 'emp-1',
      deadlines,
      taskId: 'row-1',
      includeTaskHours: 5,
    });

    // 10 (baseline) + 5 (pendiente) — no 10+8+5 del estado en vivo
    expect(preview?.totalAssigned).toBe(15);
  });

  it('captureBatchCommitSnapshot clona allocations y presupuesto por proyecto', () => {
    const allocations = [alloc({ id: 'a1', hoursAssigned: 3 })];
    const validTasks: NewTaskRow[] = [
      {
        id: 'r1',
        projectId: 'proj-a',
        taskName: 'T',
        hours: '2',
        weekDate: '2026-05-05',
        description: '',
        dependencyId: 'none',
      },
    ];
    const budget: ProjectBudgetStatus = {
      totalComputed: 1,
      totalPlanned: 2,
      budgetMax: 100,
      budgetMin: 0,
      percentage: 1,
      status: 'healthy',
      breakdown: [],
    };

    const snap = captureBatchCommitSnapshot({
      allocations,
      validTasks,
      defaultEmployeeId: 'emp-1',
      viewDate,
      weeks: [{ weekStart: new Date(2026, 4, 5) }],
      getProjectBudgetStatus: () => budget,
      getEmployeeLoadForWeek: () => ({ hours: 4, capacity: 40, percentage: 10 }),
    });

    expect(snap.allocations).not.toBe(allocations);
    expect(snap.allocations).toEqual(allocations);
    expect(snap.budgetByProjectId['proj-a']).toEqual(budget);
    expect(snap.weekLoadByKey['emp-1|2026-05-05']).toEqual({ hours: 4, capacity: 40 });
  });
});
