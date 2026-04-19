import { describe, it, expect } from 'vitest';
import { operationalStatusFromInconsistency } from '../../../supabase/functions/_shared/coherence-operational-status.ts';
import type { Inconsistency } from '../../../supabase/functions/_shared/planning-coherence-compute.ts';

function inc(partial: Partial<Inconsistency>): Inconsistency {
  return {
    projectId: 'p1',
    projectName: 'Proyecto',
    employees: [],
    totalDeadlineHours: 0,
    totalPlannedHours: 0,
    totalComputedHours: 0,
    totalDifference: 0,
    budgetHours: 0,
    minimumHours: 0,
    ...partial,
  };
}

describe('operationalStatusFromInconsistency', () => {
  it('over-budget por exceso respecto al deadline (diferencia positiva)', () => {
    const st = operationalStatusFromInconsistency(
      inc({
        totalDeadlineHours: 10,
        totalDifference: 0.06,
        budgetHours: 100,
        totalPlannedHours: 0,
        totalComputedHours: 0,
      }),
      50,
    );
    expect(st).toBe('over-budget');
  });

  it('over-budget cuando uso efectivo supera el presupuesto', () => {
    const st = operationalStatusFromInconsistency(
      inc({
        budgetHours: 40,
        totalPlannedHours: 30,
        totalComputedHours: 15,
        totalDeadlineHours: 0,
        totalDifference: 0,
      }),
      40,
    );
    expect(st).toBe('over-budget');
  });

  it('behind-schedule con presupuesto y ejecución muy por debajo del avance del mes', () => {
    const st = operationalStatusFromInconsistency(
      inc({
        budgetHours: 100,
        totalPlannedHours: 80,
        totalComputedHours: 5,
        totalDeadlineHours: 0,
        totalDifference: 0,
      }),
      50,
    );
    expect(st).toBe('behind-schedule');
  });

  it('no-activity sin planificación ni horas computadas con presupuesto', () => {
    const st = operationalStatusFromInconsistency(
      inc({
        budgetHours: 50,
        totalPlannedHours: 0,
        totalComputedHours: 0,
        totalDeadlineHours: 0,
        totalDifference: 0,
      }),
      10,
    );
    expect(st).toBe('no-activity');
  });

  it('needs-planning cuando el uso efectivo queda por debajo del presupuesto', () => {
    const st = operationalStatusFromInconsistency(
      inc({
        budgetHours: 100,
        totalPlannedHours: 20,
        totalComputedHours: 10,
        totalDeadlineHours: 0,
        totalDifference: 0,
      }),
      10,
    );
    expect(st).toBe('needs-planning');
  });

  it('in-rule cuando está equilibrado respecto al presupuesto', () => {
    const st = operationalStatusFromInconsistency(
      inc({
        budgetHours: 100,
        totalPlannedHours: 50,
        totalComputedHours: 50,
        totalDeadlineHours: 0,
        totalDifference: 0,
      }),
      50,
    );
    expect(st).toBe('in-rule');
  });
});
