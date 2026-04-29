import { describe, it, expect } from 'vitest';
import type { Allocation, Employee } from '@/types';
import { hoursCountedTowardLoad, computeEmployeeLoadForWeek } from '@/utils/appMetrics';

function alloc(partial: Partial<Allocation> & Pick<Allocation, 'id' | 'employeeId' | 'projectId' | 'weekStartDate'>): Allocation {
  return {
    hoursAssigned: 0,
    status: 'planned',
    ...partial,
  };
}

const employee: Employee = {
  id: 'e1',
  agencyId: 'a1',
  name: 'Test',
  role: 'dev',
  defaultWeeklyCapacity: 40,
  isActive: true,
  workSchedule: {
    monday: 8,
    tuesday: 8,
    wednesday: 8,
    thursday: 8,
    friday: 8,
    saturday: 0,
    sunday: 0,
  },
};

describe('hoursCountedTowardLoad', () => {
  it('tarea no completada: usa hoursAssigned', () => {
    expect(
      hoursCountedTowardLoad(
        alloc({
          id: '1',
          employeeId: 'e1',
          projectId: 'p1',
          weekStartDate: '2026-01-05',
          status: 'planned',
          hoursAssigned: 12,
        })
      )
    ).toBe(12);
  });

  it('completada con horas reales > 0: usa hoursActual', () => {
    expect(
      hoursCountedTowardLoad(
        alloc({
          id: '1',
          employeeId: 'e1',
          projectId: 'p1',
          weekStartDate: '2026-01-05',
          status: 'completed',
          hoursAssigned: 20,
          hoursActual: 7.5,
        })
      )
    ).toBe(7.5);
  });

  it('completada sin real (0) pero con hoursComputed: usa computed (rollover weekly)', () => {
    expect(
      hoursCountedTowardLoad(
        alloc({
          id: '1',
          employeeId: 'e1',
          projectId: 'p1',
          weekStartDate: '2026-01-05',
          status: 'completed',
          hoursAssigned: 15,
          hoursActual: 0,
          hoursComputed: 4,
        })
      )
    ).toBe(4);
  });

  it('completada sin real ni computed positivo: no cuenta hoursAssigned residual', () => {
    expect(
      hoursCountedTowardLoad(
        alloc({
          id: '1',
          employeeId: 'e1',
          projectId: 'p1',
          weekStartDate: '2026-01-05',
          status: 'completed',
          hoursAssigned: 15,
          hoursActual: 0,
        })
      )
    ).toBe(0);
  });

  it('completada con hoursComputed 0 explícito: sigue en 0', () => {
    expect(
      hoursCountedTowardLoad(
        alloc({
          id: '1',
          employeeId: 'e1',
          projectId: 'p1',
          weekStartDate: '2026-01-05',
          status: 'completed',
          hoursAssigned: 10,
          hoursActual: 0,
          hoursComputed: 0,
        })
      )
    ).toBe(0);
  });
});

describe('computeEmployeeLoadForWeek', () => {
  const weekStart = '2026-01-05';
  const effectiveStart = new Date(2026, 0, 5);
  const effectiveEnd = new Date(2026, 0, 11);

  const emptyDeps = {
    employees: [employee],
    allocations: [] as Allocation[],
    absences: [],
    teamEvents: [],
  };

  it('empleado inexistente: horas 0 y estado empty', () => {
    const r = computeEmployeeLoadForWeek('missing', weekStart, { effectiveStart, effectiveEnd }, emptyDeps);
    expect(r.hours).toBe(0);
    expect(r.status).toBe('empty');
    expect(r.capacity).toBe(0);
  });

  it('no infla la carga con completadas sin real y sin computed (fix planificador weekly)', () => {
    const allocations: Allocation[] = [
      alloc({
        id: 'a1',
        employeeId: 'e1',
        projectId: 'p1',
        weekStartDate: weekStart,
        status: 'completed',
        hoursAssigned: 20,
        hoursActual: 0,
      }),
    ];
    const r = computeEmployeeLoadForWeek('e1', weekStart, { effectiveStart, effectiveEnd }, { ...emptyDeps, allocations });
    expect(r.hours).toBe(0);
  });

  it('suma hoursComputed cuando completada sin real', () => {
    const allocations: Allocation[] = [
      alloc({
        id: 'a1',
        employeeId: 'e1',
        projectId: 'p1',
        weekStartDate: weekStart,
        status: 'completed',
        hoursAssigned: 20,
        hoursActual: 0,
        hoursComputed: 6,
      }),
      alloc({
        id: 'a2',
        employeeId: 'e1',
        projectId: 'p1',
        weekStartDate: weekStart,
        status: 'planned',
        hoursAssigned: 3,
      }),
    ];
    const r = computeEmployeeLoadForWeek('e1', weekStart, { effectiveStart, effectiveEnd }, { ...emptyDeps, allocations });
    expect(r.hours).toBe(9);
  });
});
