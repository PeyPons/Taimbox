import { describe, expect, it } from 'vitest';
import type { Inconsistency } from '../../../supabase/functions/_shared/planning-coherence-compute.ts';
import {
  operationalStatusFromInconsistency,
  statusLabelEs,
} from '../../../supabase/functions/_shared/coherence-operational-status.ts';

function baseInc(overrides: Partial<Inconsistency> = {}): Inconsistency {
  return {
    projectId: 'p1',
    projectName: 'Proyecto',
    employees: [],
    totalDeadlineHours: 0,
    totalPlannedHours: 10,
    totalComputedHours: 20,
    totalDifference: 0,
    budgetHours: 100,
    minimumHours: 0,
    ...overrides,
  };
}

describe('operationalStatusFromInconsistency', () => {
  it('prioriza over-budget cuando el uso efectivo supera el presupuesto', () => {
    const s = operationalStatusFromInconsistency(
      baseInc({
        totalPlannedHours: 60,
        totalComputedHours: 50,
        budgetHours: 100,
      }),
      50
    );
    expect(s).toBe('over-budget');
  });

  it('over-budget por exceso de deadline (diferencia positiva relevante)', () => {
    const s = operationalStatusFromInconsistency(
      baseInc({
        totalDeadlineHours: 10,
        totalDifference: 0.1,
        totalPlannedHours: 5,
        totalComputedHours: 5,
        budgetHours: 200,
      }),
      10
    );
    expect(s).toBe('over-budget');
  });

  it('behind-schedule cuando el avance ejecutado va muy por detrás del mes', () => {
    const s = operationalStatusFromInconsistency(
      baseInc({
        totalPlannedHours: 80,
        totalComputedHours: 5,
        budgetHours: 100,
      }),
      60
    );
    expect(s).toBe('behind-schedule');
  });

  it('no-activity cuando hay presupuesto pero sin horas planificadas ni computadas', () => {
    const s = operationalStatusFromInconsistency(
      baseInc({
        totalPlannedHours: 0,
        totalComputedHours: 0,
        budgetHours: 40,
      }),
      20
    );
    expect(s).toBe('no-activity');
  });

  it('needs-planning cuando el uso efectivo queda por debajo del presupuesto', () => {
    const s = operationalStatusFromInconsistency(
      baseInc({
        totalPlannedHours: 10,
        totalComputedHours: 10,
        budgetHours: 100,
      }),
      50
    );
    expect(s).toBe('needs-planning');
  });

  it('in-rule cuando el uso cubre el presupuesto y la ejecución sigue el ritmo del mes', () => {
    const s = operationalStatusFromInconsistency(
      baseInc({
        totalPlannedHours: 50,
        totalComputedHours: 50,
        budgetHours: 100,
      }),
      50
    );
    expect(s).toBe('in-rule');
  });
});

describe('statusLabelEs', () => {
  it('devuelve etiquetas en español para cada estado', () => {
    expect(statusLabelEs('over-budget')).toBe('Exceso horas');
    expect(statusLabelEs('behind-schedule')).toBe('Retrasados');
    expect(statusLabelEs('needs-planning')).toBe('Falta planificar');
    expect(statusLabelEs('no-activity')).toBe('Sin actividad');
    expect(statusLabelEs('in-rule')).toBe('En regla');
  });
});
