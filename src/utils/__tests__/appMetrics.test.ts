import { describe, it, expect } from 'vitest';
import { parseISO } from 'date-fns';
import { hoursCountedTowardLoad, computeEmployeeLoadForWeek } from '@/utils/appMetrics';
import type { Allocation, Employee } from '@/types';

const schedule8x5 = {
  monday: 8,
  tuesday: 8,
  wednesday: 8,
  thursday: 8,
  friday: 8,
  saturday: 0,
  sunday: 0,
};

function baseAllocation(overrides: Partial<Allocation>): Allocation {
  return {
    id: 'a1',
    employeeId: 'e1',
    projectId: 'p1',
    weekStartDate: '2026-01-05',
    hoursAssigned: 10,
    status: 'planned',
    ...overrides,
  };
}

describe('hoursCountedTowardLoad', () => {
  it('tarea no completada: usa hoursAssigned', () => {
    expect(hoursCountedTowardLoad(baseAllocation({ status: 'planned', hoursAssigned: 12 }))).toBe(12);
    expect(hoursCountedTowardLoad(baseAllocation({ status: 'active', hoursAssigned: 5 }))).toBe(5);
  });

  it('completada con horas reales > 0: usa hoursActual', () => {
    expect(
      hoursCountedTowardLoad(
        baseAllocation({
          status: 'completed',
          hoursActual: 7,
          hoursAssigned: 10,
          hoursComputed: 8,
        })
      )
    ).toBe(7);
  });

  it('completada sin real pero con computed: usa hoursComputed (no hoursAssigned residual)', () => {
    expect(
      hoursCountedTowardLoad(
        baseAllocation({
          status: 'completed',
          hoursActual: 0,
          hoursComputed: 3,
          hoursAssigned: 16,
        })
      )
    ).toBe(3);
  });

  it('completada sin real ni computed positivo: 0 aunque hoursAssigned sea alto (rollover weekly)', () => {
    expect(
      hoursCountedTowardLoad(
        baseAllocation({
          status: 'completed',
          hoursActual: 0,
          hoursComputed: 0,
          hoursAssigned: 24,
        })
      )
    ).toBe(0);
    expect(
      hoursCountedTowardLoad(
        baseAllocation({
          status: 'completed',
          hoursActual: 0,
          hoursAssigned: 24,
        })
      )
    ).toBe(0);
  });
});

describe('computeEmployeeLoadForWeek', () => {
  const employee: Employee = {
    id: 'e1',
    agencyId: 'ag1',
    name: 'Test',
    email: 't@test',
    role: 'dev',
    departmentId: 'd1',
    workSchedule: schedule8x5,
    defaultWeeklyCapacity: 40,
    isActive: true,
  };

  const weekStart = '2026-01-05';
  const monday = parseISO('2026-01-05');
  const sunday = parseISO('2026-01-11');

  it('no infla la carga con hoursAssigned en completadas 0h real sin computed', () => {
    const allocations: Allocation[] = [
      baseAllocation({
        id: 'ghost',
        status: 'completed',
        hoursActual: 0,
        hoursAssigned: 20,
      }),
    ];
    const r = computeEmployeeLoadForWeek(
      'e1',
      weekStart,
      { effectiveStart: monday, effectiveEnd: sunday },
      { employees: [employee], allocations, absences: [], teamEvents: [] }
    );
    expect(r.hours).toBe(0);
  });

  it('suma hoursComputed cuando completada tiene 0h real (coherente con Weekly)', () => {
    const allocations: Allocation[] = [
      baseAllocation({
        id: 'closed',
        status: 'completed',
        hoursActual: 0,
        hoursComputed: 4,
        hoursAssigned: 18,
      }),
    ];
    const r = computeEmployeeLoadForWeek(
      'e1',
      weekStart,
      { effectiveStart: monday, effectiveEnd: sunday },
      { employees: [employee], allocations, absences: [], teamEvents: [] }
    );
    expect(r.hours).toBe(4);
  });
});
