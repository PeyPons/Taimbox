import { describe, it, expect } from 'vitest';
import {
  hoursCountedTowardLoad,
  computeEmployeeLoadForWeek,
  computeEmployeeMonthlyLoad,
  computeProjectHoursForMonth,
} from '@/utils/appMetrics';
import { format } from 'date-fns';
import { getWeeksForMonth } from '@/utils/dateUtils';
import type { Allocation, Employee, Project } from '@/types';

const defaultSchedule = {
  monday: 8,
  tuesday: 8,
  wednesday: 8,
  thursday: 8,
  friday: 6,
  saturday: 0,
  sunday: 0,
};

function baseEmployee(overrides: Partial<Employee> = {}): Employee {
  return {
    id: 'emp-1',
    agencyId: 'ag-1',
    name: 'Test',
    role: 'dev',
    defaultWeeklyCapacity: 38,
    workSchedule: defaultSchedule,
    isActive: true,
    ...overrides,
  };
}

function baseAllocation(overrides: Partial<Allocation> = {}): Allocation {
  return {
    id: 'alloc-1',
    employeeId: 'emp-1',
    projectId: 'proj-1',
    weekStartDate: '2026-01-05',
    hoursAssigned: 10,
    status: 'planned',
    ...overrides,
  };
}

describe('hoursCountedTowardLoad', () => {
  it('tarea planificada usa hoursAssigned', () => {
    expect(hoursCountedTowardLoad(baseAllocation({ status: 'planned', hoursAssigned: 12 }))).toBe(12);
  });

  it('completada con horas reales positivas usa hoursActual', () => {
    expect(
      hoursCountedTowardLoad(
        baseAllocation({ status: 'completed', hoursAssigned: 20, hoursActual: 7.5, hoursComputed: 3 })
      )
    ).toBe(7.5);
  });

  it('completada sin real (0) pero con hoursComputed usa computed (rollover / weekly)', () => {
    expect(
      hoursCountedTowardLoad(
        baseAllocation({ status: 'completed', hoursAssigned: 10, hoursActual: 0, hoursComputed: 4 })
      )
    ).toBe(4);
  });

  it('completada sin real ni computed no infla con hoursAssigned residual', () => {
    expect(
      hoursCountedTowardLoad(baseAllocation({ status: 'completed', hoursAssigned: 10, hoursActual: 0 }))
    ).toBe(0);
  });

  it('completada con hoursActual 0 y hoursComputed 0 cuenta 0 aunque hoursAssigned sea alto', () => {
    expect(
      hoursCountedTowardLoad(
        baseAllocation({ status: 'completed', hoursAssigned: 40, hoursActual: 0, hoursComputed: 0 })
      )
    ).toBe(0);
  });
});

describe('computeEmployeeLoadForWeek (agregación con hoursCountedTowardLoad)', () => {
  it('no suma hoursAssigned en completadas cerradas sin real ni computed', () => {
    const weekStart = '2026-01-05';
    const employee = baseEmployee();
    const allocations: Allocation[] = [
      baseAllocation({ id: 'a1', weekStartDate: weekStart, status: 'planned', hoursAssigned: 5 }),
      baseAllocation({
        id: 'a2',
        weekStartDate: weekStart,
        status: 'completed',
        hoursAssigned: 99,
        hoursActual: 0,
      }),
    ];
    const r = computeEmployeeLoadForWeek(
      employee.id,
      weekStart,
      {},
      {
        employees: [employee],
        allocations,
        absences: [],
        teamEvents: [],
      }
    );
    expect(r.hours).toBe(5);
  });
});

describe('computeEmployeeMonthlyLoad', () => {
  it('aplica la misma regla de horas contadas en el mes', () => {
    const employee = baseEmployee();
    const jan = new Date(2026, 0, 15);
    const weeks = getWeeksForMonth(jan);
    const allocations: Allocation[] = weeks.map((w, i) =>
      baseAllocation({
        id: `w${i}`,
        weekStartDate: format(w.weekStart, 'yyyy-MM-dd'),
        status: 'completed',
        hoursAssigned: 50,
        hoursActual: 0,
      })
    );
    const r = computeEmployeeMonthlyLoad(employee.id, 2026, 0, {
      employees: [employee],
      allocations,
      absences: [],
      teamEvents: [],
    });
    expect(r.hours).toBe(0);
  });
});

describe('computeProjectHoursForMonth', () => {
  it('presupuesto usado no cuenta hoursAssigned residual en completadas sin real', () => {
    const month = new Date(2026, 0, 10);
    const project: Project = {
      id: 'proj-1',
      agencyId: 'ag-1',
      clientId: 'cli-1',
      name: 'P',
      status: 'active',
      budgetHours: 200,
    };
    const allocations: Allocation[] = [
      baseAllocation({
        id: 'x1',
        weekStartDate: '2026-01-05',
        status: 'completed',
        hoursAssigned: 80,
        hoursActual: 0,
      }),
    ];
    const r = computeProjectHoursForMonth(project.id, month, { projects: [project], allocations });
    expect(r.used).toBe(0);
    expect(r.available).toBe(200);
  });
});
