import { describe, expect, it } from 'vitest';
import {
  computeEmployeeMonthlyLoad,
  hoursCountedTowardLoad,
} from '@/utils/appMetrics';
import type { Allocation, Employee } from '@/types';

const baseAllocation = (overrides: Partial<Allocation> = {}): Allocation => ({
  id: 'alloc-1',
  employeeId: 'emp-1',
  projectId: 'proj-1',
  weekStartDate: '2026-01-05',
  hoursAssigned: 10,
  status: 'planned',
  ...overrides,
});

const testEmployee: Employee = {
  id: 'emp-1',
  agencyId: 'ag-1',
  name: 'Test',
  role: 'dev',
  defaultWeeklyCapacity: 40,
  workSchedule: {
    monday: 8,
    tuesday: 8,
    wednesday: 8,
    thursday: 8,
    friday: 8,
    saturday: 0,
    sunday: 0,
  },
  isActive: true,
};

describe('hoursCountedTowardLoad', () => {
  it('tareas no completadas usan hoursAssigned', () => {
    expect(hoursCountedTowardLoad(baseAllocation({ status: 'planned', hoursAssigned: 12 }))).toBe(12);
    expect(hoursCountedTowardLoad(baseAllocation({ status: 'active', hoursAssigned: 7 }))).toBe(7);
  });

  it('completadas con horas reales > 0 usan hoursActual', () => {
    expect(
      hoursCountedTowardLoad(
        baseAllocation({
          status: 'completed',
          hoursAssigned: 40,
          hoursActual: 3.5,
          hoursComputed: 0,
        })
      )
    ).toBe(3.5);
  });

  it('completadas sin real pero con hoursComputed > 0 usan hoursComputed', () => {
    expect(
      hoursCountedTowardLoad(
        baseAllocation({
          status: 'completed',
          hoursAssigned: 20,
          hoursActual: 0,
          hoursComputed: 4,
        })
      )
    ).toBe(4);
  });

  /**
   * Caso rollover weekly: completada en semana sin carga real; no debe inflar la suma
   * con el residual de hoursAssigned.
   */
  it('completadas sin real ni computed computable cuentan 0 aunque hoursAssigned sea alto', () => {
    expect(
      hoursCountedTowardLoad(
        baseAllocation({
          status: 'completed',
          hoursAssigned: 38,
          hoursActual: 0,
          hoursComputed: undefined,
        })
      )
    ).toBe(0);
    expect(
      hoursCountedTowardLoad(
        baseAllocation({
          status: 'completed',
          hoursAssigned: 38,
          hoursActual: 0,
          hoursComputed: 0,
        })
      )
    ).toBe(0);
  });
});

describe('computeEmployeeMonthlyLoad (agregación con hoursCountedTowardLoad)', () => {
  it('no suma residual de completada sin real en la misma semana que una planned', () => {
    const allocations: Allocation[] = [
      baseAllocation({
        id: 'a-completed',
        status: 'completed',
        hoursAssigned: 40,
        hoursActual: 0,
        hoursComputed: undefined,
      }),
      baseAllocation({
        id: 'a-planned',
        status: 'planned',
        hoursAssigned: 5,
        hoursActual: undefined,
      }),
    ];
    const res = computeEmployeeMonthlyLoad('emp-1', 2026, 0, {
      employees: [testEmployee],
      allocations,
      absences: [],
      teamEvents: [],
    });
    expect(res.hours).toBe(5);
  });
});
