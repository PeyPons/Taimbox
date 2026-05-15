import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { parseISO } from 'date-fns';
import {
  computeProjectHoursForMonth,
  hoursCountedTowardLoad,
} from '@/utils/appMetrics';
import type { Allocation, Project } from '@/types';

const baseAlloc = (overrides: Partial<Allocation> = {}): Allocation => ({
  id: 'a1',
  employeeId: 'e1',
  projectId: 'p1',
  weekStartDate: '2026-01-05',
  hoursAssigned: 10,
  status: 'planned',
  ...overrides,
});

describe('hoursCountedTowardLoad', () => {
  it('completada sin horas reales ni hours_computed no suma hours_assigned residual (weekly rollover)', () => {
    expect(
      hoursCountedTowardLoad(
        baseAlloc({
          status: 'completed',
          hoursActual: 0,
          hoursAssigned: 8,
        }),
      ),
    ).toBe(0);
  });

  it('completada sin horas reales usa hours_computed cuando es positivo', () => {
    expect(
      hoursCountedTowardLoad(
        baseAlloc({
          status: 'completed',
          hoursActual: 0,
          hoursAssigned: 8,
          hoursComputed: 3,
        }),
      ),
    ).toBe(3);
  });

  it('completada con horas reales positivas prioriza hours_actual', () => {
    expect(
      hoursCountedTowardLoad(
        baseAlloc({
          status: 'completed',
          hoursActual: 5,
          hoursAssigned: 20,
          hoursComputed: 99,
        }),
      ),
    ).toBe(5);
  });

  it('filas no completadas siguen usando hours_assigned', () => {
    expect(hoursCountedTowardLoad(baseAlloc({ status: 'planned', hoursAssigned: 7 }))).toBe(7);
    expect(hoursCountedTowardLoad(baseAlloc({ status: 'active', hoursAssigned: 4 }))).toBe(4);
    expect(hoursCountedTowardLoad(baseAlloc({ status: 'in_progress', hoursAssigned: 6 }))).toBe(6);
  });
});

describe('computeProjectHoursForMonth', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-03T12:00:00Z'));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('agrega con hoursCountedTowardLoad: completada sin real no infla used', () => {
    const project: Project = {
      id: 'p1',
      agencyId: 'a1',
      clientId: 'c1',
      name: 'P',
      status: 'active',
      budgetHours: 100,
    };
    const allocation = baseAlloc({
      status: 'completed',
      hoursActual: 0,
      hoursAssigned: 12,
    });
    const res = computeProjectHoursForMonth('p1', parseISO('2026-01-01'), {
      projects: [project],
      allocations: [allocation],
    });
    expect(res.used).toBe(0);
    expect(res.available).toBe(100);
  });
});
