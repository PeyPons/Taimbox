import { describe, it, expect } from 'vitest';
import {
  hoursCountedTowardLoad,
  computeEmployeeLoadForWeek,
} from '@/utils/appMetrics';
import type { Allocation, Employee } from '@/types';

const fullWeekSchedule = {
  monday: 8,
  tuesday: 8,
  wednesday: 8,
  thursday: 8,
  friday: 8,
  saturday: 0,
  sunday: 0,
};

function baseAllocation(overrides: Partial<Allocation> = {}): Allocation {
  return {
    id: 'alloc-1',
    employeeId: 'emp-1',
    projectId: 'proj-1',
    weekStartDate: '2026-01-05',
    hoursAssigned: 20,
    status: 'planned',
    ...overrides,
  };
}

describe('hoursCountedTowardLoad', () => {
  it('tareas no completadas usan hoursAssigned', () => {
    expect(hoursCountedTowardLoad(baseAllocation({ status: 'planned', hoursAssigned: 12 }))).toBe(12);
    expect(hoursCountedTowardLoad(baseAllocation({ status: 'active', hoursAssigned: 7 }))).toBe(7);
    expect(hoursCountedTowardLoad(baseAllocation({ status: 'in_progress', hoursAssigned: 4 }))).toBe(4);
  });

  it('completada con horas reales positivas usa hoursActual', () => {
    expect(
      hoursCountedTowardLoad(
        baseAllocation({ status: 'completed', hoursAssigned: 40, hoursActual: 6, hoursComputed: 2 })
      )
    ).toBe(6);
  });

  it('completada sin real (0) pero con hoursComputed positivo usa hoursComputed', () => {
    expect(
      hoursCountedTowardLoad(
        baseAllocation({ status: 'completed', hoursAssigned: 20, hoursActual: 0, hoursComputed: 3 })
      )
    ).toBe(3);
  });

  it('completada sin real ni computed útil no cuenta hoursAssigned (evita inflar carga semanal)', () => {
    expect(
      hoursCountedTowardLoad(baseAllocation({ status: 'completed', hoursAssigned: 20, hoursActual: 0 }))
    ).toBe(0);
    expect(
      hoursCountedTowardLoad(
        baseAllocation({ status: 'completed', hoursAssigned: 15, hoursActual: 0, hoursComputed: 0 })
      )
    ).toBe(0);
  });

  it('coacciona strings numéricos de API como números', () => {
    expect(
      hoursCountedTowardLoad(
        baseAllocation({
          status: 'completed',
          hoursAssigned: 99,
          hoursActual: '5' as unknown as number,
        })
      )
    ).toBe(5);
  });
});

describe('computeEmployeeLoadForWeek', () => {
  it('no suma hoursAssigned residual en completadas sin real (regresión planificador weekly)', () => {
    const employee: Employee = {
      id: 'emp-1',
      agencyId: 'ag-1',
      name: 'Test',
      role: 'dev',
      defaultWeeklyCapacity: 40,
      workSchedule: fullWeekSchedule,
      isActive: true,
    };

    const allocations: Allocation[] = [
      baseAllocation({
        id: 'a1',
        status: 'completed',
        hoursAssigned: 24,
        hoursActual: 0,
        hoursComputed: undefined,
      }),
    ];

    const result = computeEmployeeLoadForWeek(
      'emp-1',
      '2026-01-05',
      {},
      {
        employees: [employee],
        allocations,
        absences: [],
        teamEvents: [],
      }
    );

    expect(result.hours).toBe(0);
  });
});
