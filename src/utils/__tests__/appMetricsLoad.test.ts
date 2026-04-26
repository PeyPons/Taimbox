import { parseISO } from 'date-fns';
import { Allocation, Employee, WorkSchedule } from '@/types';
import {
  computeEmployeeLoadForWeek,
  hoursCountedTowardLoad,
} from '@/utils/appMetrics';

const workWeek40: WorkSchedule = {
  monday: 8,
  tuesday: 8,
  wednesday: 8,
  thursday: 8,
  friday: 8,
  saturday: 0,
  sunday: 0,
};

function makeEmployee(overrides: Partial<Employee> = {}): Employee {
  return {
    id: 'e1',
    agencyId: 'a1',
    name: 'Test',
    role: 'developer',
    defaultWeeklyCapacity: 40,
    workSchedule: workWeek40,
    isActive: true,
    ...overrides,
  };
}

function baseAlloc(partial: Partial<Allocation> & Pick<Allocation, 'id' | 'weekStartDate' | 'status'>): Allocation {
  return {
    employeeId: 'e1',
    projectId: 'p1',
    hoursAssigned: 0,
    ...partial,
  };
}

describe('hoursCountedTowardLoad', () => {
  it('no contabilizadas: usa hoursAssigned', () => {
    expect(
      hoursCountedTowardLoad(
        baseAlloc({
          id: '1',
          weekStartDate: '2026-04-20',
          status: 'planned',
          hoursAssigned: 12.5,
        })
      )
    ).toBe(12.5);
  });

  it('completadas con horas reales: usa hoursActual', () => {
    expect(
      hoursCountedTowardLoad(
        baseAlloc({
          id: '1',
          weekStartDate: '2026-04-20',
          status: 'completed',
          hoursAssigned: 20,
          hoursActual: 7.25,
        })
      )
    ).toBe(7.25);
  });

  it('completadas sin real (0) pero con hoursComputed: usa el computed (cierre/rollover)', () => {
    expect(
      hoursCountedTowardLoad(
        baseAlloc({
          id: '1',
          weekStartDate: '2026-04-20',
          status: 'completed',
          hoursAssigned: 8,
          hoursActual: 0,
          hoursComputed: 1.5,
        })
      )
    ).toBe(1.5);
  });

  it('completadas sin real y sin computed: 0 aunque hoursAssigned tenga residuo (regresión planificador weekly)', () => {
    expect(
      hoursCountedTowardLoad(
        baseAlloc({
          id: '1',
          weekStartDate: '2026-04-20',
          status: 'completed',
          hoursAssigned: 8,
          hoursActual: 0,
        })
      )
    ).toBe(0);
  });
});

describe('computeEmployeeLoadForWeek (carga con hoursCountedTowardLoad)', () => {
  const weekStart = '2026-04-20';
  const viewMonth = parseISO('2026-04-01');
  const employee = makeEmployee();

  it('no suma hoursAssigned en completadas 0h reales: solo toma hoursComputed', () => {
    const allocations: Allocation[] = [
      baseAlloc({
        id: 'a',
        weekStartDate: weekStart,
        status: 'completed',
        hoursAssigned: 8,
        hoursActual: 0,
        hoursComputed: 2,
      }),
      baseAlloc({
        id: 'b',
        weekStartDate: weekStart,
        status: 'planned',
        hoursAssigned: 3,
      }),
    ];

    const r = computeEmployeeLoadForWeek(
      'e1',
      weekStart,
      { viewMonth },
      { employees: [employee], allocations, absences: [], teamEvents: [] }
    );

    // 2 (computed) + 3 (planned), no 8+3
    expect(r.hours).toBe(5);
  });
});
