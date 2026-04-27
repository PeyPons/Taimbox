import { parseISO } from 'date-fns';
import { Allocation, Employee, Project } from '@/types';
import {
  hoursCountedTowardLoad,
  computeEmployeeLoadForWeek,
  computeProjectHoursForMonth,
} from '@/utils/appMetrics';

const workSchedule8h = {
  monday: 8,
  tuesday: 8,
  wednesday: 8,
  thursday: 8,
  friday: 8,
  saturday: 0,
  sunday: 0,
} as const;

const baseEmployee = (over: Partial<Employee> = {}): Employee => ({
  id: 'emp-1',
  agencyId: 'a1',
  name: 'Test',
  role: 'Disenador',
  defaultWeeklyCapacity: 40,
  workSchedule: { ...workSchedule8h },
  isActive: true,
  ...over,
});

const baseAlloc = (over: Partial<Allocation> = {}): Allocation => ({
  id: 'alloc-1',
  employeeId: 'emp-1',
  projectId: 'p1',
  weekStartDate: '2026-04-06',
  hoursAssigned: 10,
  status: 'completed',
  ...over,
});

describe('hoursCountedTowardLoad', () => {
  it('completada sin real ni computed cuenta 0 (no usa hours_assigned residual)', () => {
    expect(
      hoursCountedTowardLoad(
        baseAlloc({ hoursActual: 0, hoursComputed: undefined, hoursAssigned: 8 })
      )
    ).toBe(0);
  });

  it('completada sin real con hours_computed > 0 usa computed', () => {
    expect(
      hoursCountedTowardLoad(
        baseAlloc({ hoursActual: 0, hoursComputed: 3, hoursAssigned: 8 })
      )
    ).toBe(3);
  });

  it('completada con horas reales > 0 usa hours_actual', () => {
    expect(
      hoursCountedTowardLoad(
        baseAlloc({ hoursActual: 5, hoursComputed: 2, hoursAssigned: 10 })
      )
    ).toBe(5);
  });

  it('tarea no completada usa hours_assigned', () => {
    expect(
      hoursCountedTowardLoad(
        baseAlloc({ status: 'planned', hoursAssigned: 12, hoursActual: 0 })
      )
    ).toBe(12);
  });
});

describe('computeEmployeeLoadForWeek (regresión carga semanal vs completed sin real)', () => {
  const monday = parseISO('2026-04-06T12:00:00');
  const sunday = parseISO('2026-04-12T12:00:00');
  const employee = baseEmployee();
  const depsEmpty = { employees: [employee], allocations: [] as Allocation[], absences: [], teamEvents: [] };

  it('no infla horas con tarea completada, 0h real y hours_assigned > 0', () => {
    const ghost = baseAlloc({
      id: 'a-ghost',
      weekStartDate: '2026-04-06',
      status: 'completed',
      hoursAssigned: 8,
      hoursActual: 0,
    });
    const { hours } = computeEmployeeLoadForWeek('emp-1', '2026-04-06', { effectiveStart: monday, effectiveEnd: sunday }, {
      ...depsEmpty,
      allocations: [ghost],
    });
    expect(hours).toBe(0);
  });

  it('sí suma hours_computed cuando la tarea completada no tiene real', () => {
    const partial = baseAlloc({
      id: 'a-partial',
      weekStartDate: '2026-04-06',
      status: 'completed',
      hoursAssigned: 8,
      hoursActual: 0,
      hoursComputed: 2.5,
    });
    const { hours } = computeEmployeeLoadForWeek('emp-1', '2026-04-06', { effectiveStart: monday, effectiveEnd: sunday }, {
      ...depsEmpty,
      allocations: [partial],
    });
    expect(hours).toBe(2.5);
  });
});

describe('computeProjectHoursForMonth', () => {
  it('alinea carga de proyecto con la misma regla que carga de empleado (completed sin real)', () => {
    const project: Project = {
      id: 'p1',
      agencyId: 'a1',
      clientId: 'c1',
      name: 'P',
      status: 'active',
      budgetHours: 100,
    };
    const viewMonth = new Date(2026, 3, 1);
    const usedOnlyAssigned = baseAlloc({
      id: 'x',
      projectId: 'p1',
      weekStartDate: '2026-04-06',
      status: 'completed',
      hoursAssigned: 6,
      hoursActual: 0,
    });
    const r1 = computeProjectHoursForMonth('p1', viewMonth, { projects: [project], allocations: [usedOnlyAssigned] });
    expect(r1.used).toBe(0);
    const withComputed = { ...usedOnlyAssigned, hoursComputed: 1 };
    const r2 = computeProjectHoursForMonth('p1', viewMonth, { projects: [project], allocations: [withComputed] });
    expect(r2.used).toBe(1);
  });
});
