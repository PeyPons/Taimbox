import { describe, expect, it } from 'vitest';
import {
  canPostponeTaskInWeekly,
  formatWeeklyTaskHoursSummary,
  getWeeklyTaskGuidance,
  getWeeklyTaskPendingHours,
  validatePostponeRemaining,
} from '@/utils/weeklyCloseShared';

describe('weeklyCloseShared', () => {
  it('getWeeklyTaskPendingHours resta horas reales ya guardadas', () => {
    expect(getWeeklyTaskPendingHours({ hoursAssigned: 8, hoursActual: 3 })).toBe(5);
    expect(getWeeklyTaskPendingHours({ hoursAssigned: 8, hoursActual: 8 })).toBe(0);
    expect(getWeeklyTaskPendingHours({ hoursAssigned: 8 })).toBe(8);
  });

  it('canPostponeTaskInWeekly permite posponer con estimado aunque el pendiente DB sea 0', () => {
    expect(canPostponeTaskInWeekly({ hoursAssigned: 8 })).toBe(true);
    expect(
      canPostponeTaskInWeekly({ hoursAssigned: 8 }) &&
        getWeeklyTaskPendingHours({ hoursAssigned: 8, hoursActual: 8 }) === 0
    ).toBe(true);
    expect(canPostponeTaskInWeekly({ hoursAssigned: 0 })).toBe(false);
  });

  it('validatePostponeRemaining acepta 0h realizadas con saldo futuro', () => {
    const r = validatePostponeRemaining(0, 6, '2026-05-25');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.remaining).toBe(6);
  });

  it('formatWeeklyTaskHoursSummary distingue sin registrar vs pendiente cero con horas hechas', () => {
    expect(formatWeeklyTaskHoursSummary({ hoursAssigned: 8 })).toContain('sin registrar');
    expect(formatWeeklyTaskHoursSummary({ hoursAssigned: 8, hoursActual: 8 })).toContain('registradas');
    expect(formatWeeklyTaskHoursSummary({ hoursAssigned: 8, hoursActual: 3 })).toContain('pendientes');
  });

  it('getWeeklyTaskGuidance orienta sin avance y con horas ya registradas', () => {
    expect(getWeeklyTaskGuidance({ hoursAssigned: 6 })).toContain('Sigo después');
    expect(getWeeklyTaskGuidance({ hoursAssigned: 6, hoursActual: 6 })).toContain('0 si quieres moverlo entero');
    expect(getWeeklyTaskGuidance({ hoursAssigned: 0 })).toBeNull();
  });
});
