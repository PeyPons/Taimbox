import { describe, it, expect } from 'vitest';
import {
  analyzeProjectMonthForNotifications,
  getEffectiveCompletedHoursForNotifications,
  isAllocationInEffectiveMonthForNotifications,
  passesProjectClientFilters,
  projectMatchesIssueFlags,
  type AllocationRow,
  type ProjectRow,
} from '../projectNotificationMetrics';

const march2026 = new Date(2026, 2, 15);

function baseProject(overrides: Partial<ProjectRow> = {}): ProjectRow {
  return {
    id: 'p1',
    client_id: 'c1',
    status: 'active',
    budget_hours: 100,
    minimum_hours: 0,
    ...overrides,
  };
}

describe('getEffectiveCompletedHoursForNotifications', () => {
  const alloc: AllocationRow = {
    project_id: 'p1',
    employee_id: 'e1',
    week_start_date: '2026-03-02',
    hours_assigned: 8,
    status: 'completed',
    hours_actual: 5,
    hours_computed: 7,
  };

  it('usa hours_actual cuando la preferencia es actual', () => {
    expect(getEffectiveCompletedHoursForNotifications(alloc, 'actual')).toBe(5);
  });

  it('usa hours_computed cuando la preferencia es computed', () => {
    expect(getEffectiveCompletedHoursForNotifications(alloc, 'computed')).toBe(7);
  });

  it('trata null como 0 en ambas ramas', () => {
    const a: AllocationRow = { ...alloc, hours_actual: null, hours_computed: null };
    expect(getEffectiveCompletedHoursForNotifications(a, 'actual')).toBe(0);
    expect(getEffectiveCompletedHoursForNotifications(a, 'computed')).toBe(0);
  });
});

describe('isAllocationInEffectiveMonthForNotifications', () => {
  it('acepta semana en el mismo mes calendario que viewMonth', () => {
    expect(isAllocationInEffectiveMonthForNotifications('2026-03-02', march2026)).toBe(true);
  });

  it('rechaza semana en otro mes', () => {
    expect(isAllocationInEffectiveMonthForNotifications('2026-04-06', march2026)).toBe(false);
  });

  it('rechaza fecha mal formada sin lanzar', () => {
    expect(isAllocationInEffectiveMonthForNotifications('no-es-fecha', march2026)).toBe(false);
  });
});

describe('analyzeProjectMonthForNotifications', () => {
  it('devuelve null si el proyecto no está activo', () => {
    const p = baseProject({ status: 'archived' });
    const r = analyzeProjectMonthForNotifications(p, [], march2026, 50, 'computed');
    expect(r).toBeNull();
  });

  it('detecta over_budget cuando las horas asignadas del mes superan el presupuesto', () => {
    const p = baseProject({ budget_hours: 10, minimum_hours: 0 });
    const allocs: AllocationRow[] = [
      {
        project_id: 'p1',
        employee_id: 'e1',
        week_start_date: '2026-03-02',
        hours_assigned: 20,
        status: 'open',
        hours_actual: null,
        hours_computed: null,
      },
    ];
    const r = analyzeProjectMonthForNotifications(p, allocs, march2026, 40, 'computed');
    expect(r).not.toBeNull();
    expect(r!.overBudget).toBe(true);
    expect(r!.noActivity).toBe(false);
  });

  it('detecta no_activity con presupuesto pero sin horas asignadas en el mes', () => {
    const p = baseProject({ budget_hours: 40, minimum_hours: 0 });
    const r = analyzeProjectMonthForNotifications(p, [], march2026, 10, 'computed');
    expect(r!.noActivity).toBe(true);
    expect(r!.needsPlanning).toBe(true);
  });

  it('needsPlanning por minimum_hours cuando hay mínimo explícito', () => {
    const p = baseProject({ budget_hours: 100, minimum_hours: 20 });
    const allocs: AllocationRow[] = [
      {
        project_id: 'p1',
        employee_id: 'e1',
        week_start_date: '2026-03-02',
        hours_assigned: 10,
        status: 'open',
        hours_actual: null,
        hours_computed: null,
      },
    ];
    const r = analyzeProjectMonthForNotifications(p, allocs, march2026, 25, 'computed');
    expect(r!.needsPlanning).toBe(true);
    expect(r!.minimum).toBe(20);
    expect(r!.totalAssigned).toBe(10);
  });

  it('behind_schedule cuando el avance del mes supera el umbral y la ejecución va muy por debajo', () => {
    const p = baseProject({ budget_hours: 100, minimum_hours: 0 });
    const allocs: AllocationRow[] = [
      {
        project_id: 'p1',
        employee_id: 'e1',
        week_start_date: '2026-03-02',
        hours_assigned: 100,
        status: 'completed',
        hours_actual: null,
        hours_computed: 5,
      },
    ];
    const r = analyzeProjectMonthForNotifications(p, allocs, march2026, 50, 'computed');
    expect(r!.behindSchedule).toBe(true);
  });
});

describe('projectMatchesIssueFlags', () => {
  const analysis = {
    projectId: 'p1',
    clientId: 'c1',
    needsPlanning: true,
    behindSchedule: false,
    overBudget: false,
    noActivity: false,
    involvedEmployeeIds: ['e1'],
    totalAssigned: 5,
    hoursComputed: 0,
    budget: 100,
    minimum: 20,
  };

  it('lista vacía no coincide', () => {
    expect(projectMatchesIssueFlags(analysis, [])).toBe(false);
  });

  it('needs_planning no dispara si solo hay no_activity (sin planificación vs vacío)', () => {
    const noAct = { ...analysis, needsPlanning: true, noActivity: true };
    expect(projectMatchesIssueFlags(noAct, ['needs_planning'])).toBe(false);
  });

  it('over_budget coincide de forma independiente', () => {
    const ob = { ...analysis, overBudget: true, needsPlanning: false };
    expect(projectMatchesIssueFlags(ob, ['over_budget'])).toBe(true);
  });
});

describe('passesProjectClientFilters', () => {
  const analysis = {
    projectId: 'p1',
    clientId: 'c1',
    needsPlanning: false,
    behindSchedule: false,
    overBudget: false,
    noActivity: false,
    involvedEmployeeIds: [],
    totalAssigned: 0,
    hoursComputed: 0,
    budget: 0,
    minimum: 0,
  };

  it('filtra por projectIds', () => {
    expect(passesProjectClientFilters(analysis, ['p2'], undefined)).toBe(false);
    expect(passesProjectClientFilters(analysis, ['p1'], undefined)).toBe(true);
  });

  it('filtra por clientIds', () => {
    expect(passesProjectClientFilters(analysis, undefined, ['c2'])).toBe(false);
    expect(passesProjectClientFilters(analysis, undefined, ['c1'])).toBe(true);
  });
});
