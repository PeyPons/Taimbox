import { hoursCountedTowardLoad, computeEmployeeLoadForWeek, computeEmployeeMonthlyLoad } from '@/utils/appMetrics';
import type { Absence, Allocation, Employee, TeamEvent } from '@/types';

const fullWeekSchedule: Employee['workSchedule'] = {
  monday: 8,
  tuesday: 8,
  wednesday: 8,
  thursday: 8,
  friday: 8,
  saturday: 0,
  sunday: 0,
};

const baseAlloc = (over: Partial<Allocation> & Pick<Allocation, 'id' | 'employeeId' | 'projectId' | 'weekStartDate' | 'hoursAssigned' | 'status'>): Allocation => ({
  id: 'a1',
  employeeId: 'e1',
  projectId: 'p1',
  weekStartDate: '2025-01-06',
  hoursAssigned: 10,
  status: 'planned',
  ...over,
});

describe('hoursCountedTowardLoad', () => {
  it('tareas no completadas usan hoursAssigned', () => {
    expect(
      hoursCountedTowardLoad(
        baseAlloc({ status: 'planned', id: 'x1', weekStartDate: '2025-01-06', hoursAssigned: 12, hoursActual: 0 })
      )
    ).toBe(12);
  });

  it('completadas con horas reales positivas usan hoursActual', () => {
    expect(
      hoursCountedTowardLoad(
        baseAlloc({
          status: 'completed',
          id: 'x2',
          weekStartDate: '2025-01-06',
          hoursAssigned: 20,
          hoursActual: 3,
        })
      )
    ).toBe(3);
  });

  it('completadas sin real pero con hoursComputed > 0 usan hoursComputed', () => {
    expect(
      hoursCountedTowardLoad(
        baseAlloc({
          status: 'completed',
          id: 'x3',
          weekStartDate: '2025-01-06',
          hoursAssigned: 8,
          hoursActual: 0,
          hoursComputed: 2.5,
        })
      )
    ).toBe(2.5);
  });

  it('completadas sin real ni computadas no suman el residual de hoursAssigned (0)', () => {
    expect(
      hoursCountedTowardLoad(
        baseAlloc({
          status: 'completed',
          id: 'x4',
          weekStartDate: '2025-01-06',
          hoursAssigned: 7,
          hoursActual: 0,
        })
      )
    ).toBe(0);
  });

  it('completadas con hoursActual 0 y hoursComputed null o 0 devuelve 0', () => {
    expect(
      hoursCountedTowardLoad(
        baseAlloc({
          status: 'completed',
          id: 'x5',
          weekStartDate: '2025-01-06',
          hoursAssigned: 9,
          hoursActual: 0,
          hoursComputed: 0,
        })
      )
    ).toBe(0);
  });
});

describe('computeEmployeeLoadForWeek (regresión carga planificador)', () => {
  const employee: Employee = {
    id: 'e1',
    agencyId: 'ag1',
    name: 'Test',
    email: 't@t.com',
    role: 'D',
    defaultWeeklyCapacity: 40,
    isActive: true,
    workSchedule: fullWeekSchedule,
  };

  it('no infla la carga con hoursAssigned de tareas weekly completadas sin registro real', () => {
    const allocations: Allocation[] = [
      baseAlloc({
        id: 'rolled',
        employeeId: 'e1',
        projectId: 'p1',
        weekStartDate: '2025-01-06',
        status: 'completed',
        hoursAssigned: 5,
        hoursActual: 0,
      }),
    ];
    const result = computeEmployeeLoadForWeek(
      'e1',
      '2025-01-06',
      {},
      { employees: [employee], allocations, absences: [] as Absence[], teamEvents: [] as TeamEvent[] }
    );
    expect(result.hours).toBe(0);
  });
});

describe('computeEmployeeMonthlyLoad (coherencia con hoursCountedTowardLoad)', () => {
  const employee: Employee = {
    id: 'e1',
    agencyId: 'ag1',
    name: 'Test',
    email: 't@t.com',
    role: 'D',
    defaultWeeklyCapacity: 40,
    isActive: true,
    workSchedule: fullWeekSchedule,
  };

  it('excluye residual de asignación en tareas completadas sin real en el mes', () => {
    const janAlloc: Allocation = baseAlloc({
      id: 'm1',
      employeeId: 'e1',
      projectId: 'p1',
      weekStartDate: '2025-01-06',
      status: 'completed',
      hoursAssigned: 12,
      hoursActual: 0,
    });
    const { hours } = computeEmployeeMonthlyLoad('e1', 2025, 0, {
      employees: [employee],
      allocations: [janAlloc],
      absences: [],
      teamEvents: [],
    });
    expect(hours).toBe(0);
  });
});
