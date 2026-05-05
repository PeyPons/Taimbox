import { describe, expect, it } from 'vitest';
import { parseISO } from 'date-fns';
import {
  hoursCountedTowardLoad,
  computeEmployeeLoadForWeek,
  computeEmployeeMonthlyLoad,
  computeProjectHoursForMonth,
  computeClientTotalHoursForMonth,
} from '@/utils/appMetrics';
import type { Allocation, Employee, Project, Client } from '@/types';

const schedule = {
  monday: 8,
  tuesday: 8,
  wednesday: 8,
  thursday: 8,
  friday: 8,
  saturday: 0,
  sunday: 0,
};

const employee = (id = 'e1'): Employee =>
  ({
    id,
    agencyId: 'a1',
    name: 'Test',
    role: 'dev',
    defaultWeeklyCapacity: 40,
    workSchedule: schedule,
    isActive: true,
  }) as Employee;

const baseAlloc = (overrides: Partial<Allocation> & Pick<Allocation, 'id'>): Allocation => ({
  employeeId: 'e1',
  projectId: 'p1',
  weekStartDate: '2026-01-05',
  hoursAssigned: 10,
  status: 'planned',
  ...overrides,
});

describe('hoursCountedTowardLoad', () => {
  it('tarea completada sin horas reales ni computadas no suma hoursAssigned (evita inflar carga tras rollover weekly)', () => {
    const a = baseAlloc({
      id: 'a1',
      status: 'completed',
      hoursAssigned: 8,
      hoursActual: 0,
      hoursComputed: undefined,
    });
    expect(hoursCountedTowardLoad(a)).toBe(0);
  });

  it('completada sin real pero con hoursComputed positivo usa hoursComputed', () => {
    const a = baseAlloc({
      id: 'a2',
      status: 'completed',
      hoursAssigned: 20,
      hoursActual: 0,
      hoursComputed: 3,
    });
    expect(hoursCountedTowardLoad(a)).toBe(3);
  });

  it('completada con horas reales positivas usa hoursActual', () => {
    const a = baseAlloc({
      id: 'a3',
      status: 'completed',
      hoursAssigned: 2,
      hoursActual: 7,
      hoursComputed: 1,
    });
    expect(hoursCountedTowardLoad(a)).toBe(7);
  });

  it('no completada usa hoursAssigned', () => {
    const planned = baseAlloc({ id: 'p1', status: 'planned', hoursAssigned: 12 });
    expect(hoursCountedTowardLoad(planned)).toBe(12);
    const active = baseAlloc({ id: 'p2', status: 'active', hoursAssigned: 5 });
    expect(hoursCountedTowardLoad(active)).toBe(5);
  });
});

describe('computeEmployeeLoadForWeek', () => {
  it('agrega carga semanal con la misma regla que hoursCountedTowardLoad', () => {
    const deps = {
      employees: [employee()],
      allocations: [
        baseAlloc({
          id: 'x1',
          status: 'completed',
          hoursAssigned: 40,
          hoursActual: 0,
          hoursComputed: undefined,
        }),
        baseAlloc({
          id: 'x2',
          status: 'planned',
          hoursAssigned: 4,
        }),
      ],
      absences: [],
      teamEvents: [],
    };
    const weekStart = '2026-01-05';
    const effectiveStart = parseISO('2026-01-05');
    const effectiveEnd = parseISO('2026-01-11');
    const res = computeEmployeeLoadForWeek('e1', weekStart, { effectiveStart, effectiveEnd }, deps);
    expect(res.hours).toBe(4);
  });
});

describe('computeEmployeeMonthlyLoad', () => {
  it('no cuenta hoursAssigned residual en completadas sin real en el mes', () => {
    const deps = {
      employees: [employee()],
      allocations: [
        baseAlloc({
          id: 'm1',
          weekStartDate: '2026-01-05',
          status: 'completed',
          hoursAssigned: 100,
          hoursActual: 0,
        }),
      ],
      absences: [],
      teamEvents: [],
    };
    const res = computeEmployeeMonthlyLoad('e1', 2026, 0, deps);
    expect(res.hours).toBe(0);
  });
});

describe('computeProjectHoursForMonth', () => {
  it('used ignora hoursAssigned en completadas cerradas sin real', () => {
    const project: Project = {
      id: 'p1',
      agencyId: 'a1',
      clientId: 'c1',
      name: 'Proy',
      status: 'active',
      budgetHours: 200,
      monthlyFee: 0,
    };
    const deps = {
      projects: [project],
      allocations: [
        baseAlloc({
          id: 'u1',
          projectId: 'p1',
          weekStartDate: '2026-01-05',
          status: 'completed',
          hoursAssigned: 50,
          hoursActual: 0,
        }),
      ],
    };
    const res = computeProjectHoursForMonth('p1', new Date(2026, 0, 10), deps);
    expect(res.used).toBe(0);
    expect(res.available).toBe(200);
  });
});

describe('computeClientTotalHoursForMonth', () => {
  it('suma horas de proyecto con hoursCountedTowardLoad por allocation', () => {
    const client: Client = { id: 'c1', agencyId: 'a1', name: 'Cli', color: '#000' };
    const project: Project = {
      id: 'p1',
      agencyId: 'a1',
      clientId: 'c1',
      name: 'P',
      status: 'active',
      budgetHours: 100,
      monthlyFee: 0,
    };
    const deps = {
      projects: [project],
      allocations: [
        baseAlloc({
          id: 'c-a1',
          projectId: 'p1',
          weekStartDate: '2026-02-02',
          status: 'completed',
          hoursAssigned: 30,
          hoursActual: 0,
          hoursComputed: 2,
        }),
      ],
    };
    const res = computeClientTotalHoursForMonth('c1', new Date(2026, 1, 15), deps);
    expect(res.used).toBe(2);
  });
});
