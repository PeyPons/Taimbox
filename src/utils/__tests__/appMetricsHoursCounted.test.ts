import { describe, expect, it } from 'vitest';
import {
  computeEmployeeLoadForWeek,
  computeEmployeeMonthlyLoad,
  computeProjectHoursForMonth,
  hoursCountedTowardLoad,
} from '@/utils/appMetrics';
import type { Allocation, Employee, Project } from '@/types';

const workSchedule: Employee['workSchedule'] = {
  monday: 8,
  tuesday: 8,
  wednesday: 8,
  thursday: 8,
  friday: 8,
  saturday: 0,
  sunday: 0,
};

const employee = (id = 'e1'): Employee => ({
  id,
  agencyId: 'a1',
  name: 'Empleado',
  role: 'dev',
  defaultWeeklyCapacity: 40,
  workSchedule,
  isActive: true,
});

const baseAllocation = (overrides: Partial<Allocation>): Allocation => ({
  id: 'alloc-1',
  employeeId: 'e1',
  projectId: 'p1',
  weekStartDate: '2026-05-04',
  hoursAssigned: 8,
  status: 'planned',
  ...overrides,
});

describe('hoursCountedTowardLoad', () => {
  it('tareas no completadas usan hoursAssigned', () => {
    expect(hoursCountedTowardLoad(baseAllocation({ status: 'planned', hoursAssigned: 12 }))).toBe(12);
    expect(hoursCountedTowardLoad(baseAllocation({ status: 'active', hoursAssigned: 4 }))).toBe(4);
  });

  it('completadas con horas reales > 0 cuentan hoursActual', () => {
    expect(
      hoursCountedTowardLoad(
        baseAllocation({ status: 'completed', hoursAssigned: 20, hoursActual: 6, hoursComputed: 6 }),
      ),
    ).toBe(6);
  });

  it('completadas sin real pero con hoursComputed > 0 cuentan hoursComputed', () => {
    expect(
      hoursCountedTowardLoad(
        baseAllocation({
          status: 'completed',
          hoursAssigned: 10,
          hoursActual: 0,
          hoursComputed: 3,
        }),
      ),
    ).toBe(3);
  });

  it('completadas sin real ni computed útil no inflan con hoursAssigned residual (weekly rollover)', () => {
    expect(
      hoursCountedTowardLoad(
        baseAllocation({
          status: 'completed',
          hoursAssigned: 10,
          hoursActual: 0,
          hoursComputed: undefined,
        }),
      ),
    ).toBe(0);
    expect(
      hoursCountedTowardLoad(
        baseAllocation({
          status: 'completed',
          hoursAssigned: 10,
          hoursActual: 0,
          hoursComputed: 0,
        }),
      ),
    ).toBe(0);
  });
});

describe('computeEmployeeLoadForWeek (regla unificada de horas)', () => {
  const deps = {
    employees: [employee()],
    absences: [] as const,
    teamEvents: [] as const,
  };

  it('no suma hoursAssigned en completadas 0h reales sin computed', () => {
    const allocations: Allocation[] = [
      baseAllocation({
        id: 'ghost',
        status: 'completed',
        hoursAssigned: 10,
        hoursActual: 0,
      }),
      baseAllocation({
        id: 'real',
        status: 'planned',
        hoursAssigned: 5,
      }),
    ];
    const { hours } = computeEmployeeLoadForWeek('e1', '2026-05-04', {}, { ...deps, allocations });
    expect(hours).toBe(5);
  });
});

describe('computeEmployeeMonthlyLoad', () => {
  it('aplica la misma regla al agregar semanas del mes', () => {
    const allocations: Allocation[] = [
      baseAllocation({
        id: 'a-m1',
        weekStartDate: '2026-05-04',
        status: 'completed',
        hoursAssigned: 8,
        hoursActual: 0,
      }),
    ];
    const { hours } = computeEmployeeMonthlyLoad('e1', 2026, 4, {
      employees: [employee()],
      allocations,
      absences: [],
      teamEvents: [],
    });
    expect(hours).toBe(0);
  });
});

describe('computeProjectHoursForMonth', () => {
  const project: Project = {
    id: 'p1',
    agencyId: 'a1',
    clientId: 'c1',
    name: 'Proy',
    status: 'active',
    budgetHours: 100,
    monthlyFee: 0,
  };

  it('no cuenta horas fantasma en completadas sin real', () => {
    const allocations: Allocation[] = [
      baseAllocation({
        status: 'completed',
        hoursAssigned: 40,
        hoursActual: 0,
        weekStartDate: '2026-05-04',
      }),
    ];
    const { used } = computeProjectHoursForMonth('p1', new Date(2026, 4, 1), {
      projects: [project],
      allocations,
    });
    expect(used).toBe(0);
  });
});
