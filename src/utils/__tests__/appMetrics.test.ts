import { format } from 'date-fns';
import {
  computeClientTotalHoursForMonth,
  computeEmployeeMonthlyLoad,
  computeProjectHoursForMonth,
  hoursCountedTowardLoad,
} from '@/utils/appMetrics';
import { getWeeksForMonth } from '@/utils/dateUtils';
import type { Allocation, Employee, Project } from '@/types';

const workSchedule = {
  monday: 8,
  tuesday: 8,
  wednesday: 8,
  thursday: 8,
  friday: 8,
  saturday: 0,
  sunday: 0,
};

function baseEmployee(id: string): Employee {
  return {
    id,
    agencyId: 'agency-1',
    name: 'Tester',
    role: 'design',
    defaultWeeklyCapacity: 40,
    workSchedule,
    isActive: true,
  };
}

function alloc(base: Pick<Allocation, 'id' | 'employeeId' | 'projectId' | 'weekStartDate'> & Partial<Allocation>): Allocation {
  return {
    hoursAssigned: 0,
    status: 'planned',
    ...base,
  };
}

describe('hoursCountedTowardLoad', () => {
  it('en planned usa hoursAssigned', () => {
    expect(
      hoursCountedTowardLoad(
        alloc({
          id: 'a',
          employeeId: 'e',
          projectId: 'p',
          weekStartDate: '2026-01-05',
          status: 'planned',
          hoursAssigned: 12,
        })
      )
    ).toBe(12);
  });

  it('completada con horas reales positivas usa hoursActual', () => {
    expect(
      hoursCountedTowardLoad(
        alloc({
          id: 'a',
          employeeId: 'e',
          projectId: 'p',
          weekStartDate: '2026-01-05',
          status: 'completed',
          hoursAssigned: 40,
          hoursActual: 7.5,
        })
      )
    ).toBe(7.5);
  });

  /**
   * Regresión planificador weekly: completadas sin horas reales no deben seguir
   * inflando la carga con el residual de hoursAssigned (p. ej. tras rollover).
   */
  it('completada sin horas reales ni computed cuenta 0 aunque hoursAssigned sea alto', () => {
    expect(
      hoursCountedTowardLoad(
        alloc({
          id: 'a',
          employeeId: 'e',
          projectId: 'p',
          weekStartDate: '2026-01-05',
          status: 'completed',
          hoursAssigned: 16,
          hoursActual: 0,
          hoursComputed: undefined,
        })
      )
    ).toBe(0);
  });

  it('completada sin horas reales pero con hoursComputed usa computed', () => {
    expect(
      hoursCountedTowardLoad(
        alloc({
          id: 'a',
          employeeId: 'e',
          projectId: 'p',
          weekStartDate: '2026-01-05',
          status: 'completed',
          hoursAssigned: 16,
          hoursActual: 0,
          hoursComputed: 3,
        })
      )
    ).toBe(3);
  });

  it('completada con hoursActual 0 string-falsy sigue tratándose como sin real', () => {
    expect(
      hoursCountedTowardLoad(
        alloc({
          id: 'a',
          employeeId: 'e',
          projectId: 'p',
          weekStartDate: '2026-01-05',
          status: 'completed',
          hoursAssigned: 8,
          hoursActual: 0,
        })
      )
    ).toBe(0);
  });
});

describe('agregados mensuales / proyecto (misma regla de horas)', () => {
  const jan2026 = new Date(2026, 0, 1);
  const weekKeys = getWeeksForMonth(jan2026).map((w) => format(w.weekStart, 'yyyy-MM-dd'));
  const week0 = weekKeys[0];
  if (!week0) throw new Error('getWeeksForMonth debe devolver al menos una semana para enero 2026');

  it('computeEmployeeMonthlyLoad no suma residual hoursAssigned en completadas sin real', () => {
    const employee = baseEmployee('emp-1');
    const allocations: Allocation[] = [
      alloc({
        id: 'al-1',
        employeeId: 'emp-1',
        projectId: 'pr-1',
        weekStartDate: week0,
        status: 'completed',
        hoursAssigned: 100,
        hoursActual: 0,
      }),
    ];
    const res = computeEmployeeMonthlyLoad('emp-1', 2026, 0, {
      employees: [employee],
      allocations,
      absences: [],
      teamEvents: [],
    });
    expect(res.hours).toBe(0);
  });

  it('computeProjectHoursForMonth alinea completadas sin real con 0 horas efectivas', () => {
    const project: Project = {
      id: 'pr-1',
      agencyId: 'agency-1',
      clientId: 'cl-1',
      name: 'P',
      status: 'active',
      budgetHours: 500,
    };
    const allocations: Allocation[] = [
      alloc({
        id: 'al-1',
        employeeId: 'emp-1',
        projectId: 'pr-1',
        weekStartDate: week0,
        status: 'completed',
        hoursAssigned: 50,
        hoursActual: 0,
      }),
    ];
    const res = computeProjectHoursForMonth('pr-1', jan2026, {
      projects: [project],
      allocations,
    });
    expect(res.used).toBe(0);
    expect(res.available).toBe(500);
  });

  it('computeClientTotalHoursForMonth suma proyectos del cliente con la misma regla', () => {
    const projects: Project[] = [
      {
        id: 'pr-1',
        agencyId: 'agency-1',
        clientId: 'cl-1',
        name: 'A',
        status: 'active',
        budgetHours: 100,
      },
      {
        id: 'pr-2',
        agencyId: 'agency-1',
        clientId: 'cl-1',
        name: 'B',
        status: 'active',
        budgetHours: 100,
      },
    ];
    const allocations: Allocation[] = [
      alloc({
        id: 'al-1',
        employeeId: 'emp-1',
        projectId: 'pr-1',
        weekStartDate: week0,
        status: 'completed',
        hoursAssigned: 20,
        hoursActual: 0,
      }),
      alloc({
        id: 'al-2',
        employeeId: 'emp-1',
        projectId: 'pr-2',
        weekStartDate: week0,
        status: 'planned',
        hoursAssigned: 5,
      }),
    ];
    const res = computeClientTotalHoursForMonth('cl-1', jan2026, { projects, allocations });
    expect(res.used).toBe(5);
  });
});
