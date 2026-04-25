import { hoursCountedTowardLoad, computeEmployeeLoadForWeek, computeProjectHoursForMonth } from '@/utils/appMetrics';
import { getWeeksForMonth, getStorageKey } from '@/utils/dateUtils';
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

function baseAlloc(over: Partial<Allocation> = {}): Allocation {
  return {
    id: 'a1',
    employeeId: 'e1',
    projectId: 'p1',
    weekStartDate: '2026-04-06',
    hoursAssigned: 8,
    status: 'planned',
    ...over,
  };
}

const baseEmployee: Employee = {
  id: 'e1',
  agencyId: 'ag1',
  name: 'Test',
  role: 'dev',
  defaultWeeklyCapacity: 40,
  workSchedule,
  isActive: true,
};

describe('hoursCountedTowardLoad', () => {
  it('tarea en progreso usa hoursAssigned', () => {
    expect(
      hoursCountedTowardLoad(
        baseAlloc({ status: 'in_progress', hoursAssigned: 5, hoursActual: 2, hoursComputed: 10 })
      )
    ).toBe(5);
  });

  it('completada con hoursActual > 0 usa horas reales', () => {
    expect(
      hoursCountedTowardLoad(
        baseAlloc({ status: 'completed', hoursAssigned: 8, hoursActual: 3.5, hoursComputed: 0 })
      )
    ).toBe(3.5);
  });

  it('completada sin real (0) y con hoursComputed positivo usa hoursComputed', () => {
    expect(
      hoursCountedTowardLoad(
        baseAlloc({ status: 'completed', hoursAssigned: 8, hoursActual: 0, hoursComputed: 2.5 })
      )
    ).toBe(2.5);
  });

  /**
   * Regresión: rollover weekly puede dejar completada con hoursAssigned residual y 0h reales
   * en la semana; no debe inflar carga con hoursAssigned.
   */
  it('completada sin real ni computed cuenta 0 aunque haya hoursAssigned residual', () => {
    expect(
      hoursCountedTowardLoad(
        baseAlloc({ status: 'completed', hoursAssigned: 8, hoursActual: 0, hoursComputed: 0 })
      )
    ).toBe(0);
  });
});

describe('computeEmployeeLoadForWeek', () => {
  const deps = (allocations: Allocation[]) => ({
    employees: [baseEmployee],
    allocations,
    absences: [],
    teamEvents: [],
  });

  it('sin empleado devuelve carga 0', () => {
    const r = computeEmployeeLoadForWeek(
      'no-existe',
      '2026-04-06',
      {},
      deps([baseAlloc()])
    );
    expect(r.hours).toBe(0);
    expect(r.status).toBe('empty');
  });

  it('acumula completadas "fantasma" como 0 hacia la carga semanal', () => {
    const a = baseAlloc({
      status: 'completed',
      hoursAssigned: 6,
      hoursActual: 0,
      hoursComputed: 0,
    });
    const r = computeEmployeeLoadForWeek('e1', '2026-04-06', {}, deps([a]));
    expect(r.hours).toBe(0);
  });
});

describe('computeProjectHoursForMonth', () => {
  it('no suma presupuesto agotado en horas de tareas completadas sin real (regresión planificador)', () => {
    const viewMonth = new Date(2026, 3, 15);
    const weeks = getWeeksForMonth(viewMonth);
    const firstKey = getStorageKey(weeks[0]!.weekStart, viewMonth);

    const project: Project = {
      id: 'p1',
      clientId: 'c1',
      agencyId: 'ag1',
      name: 'P',
      color: '#000',
      budgetHours: 100,
    };

    const a: Allocation = {
      id: 'alloc-1',
      employeeId: 'e1',
      projectId: 'p1',
      weekStartDate: firstKey,
      hoursAssigned: 7,
      hoursActual: 0,
      hoursComputed: 0,
      status: 'completed',
    };

    const { used, budget } = computeProjectHoursForMonth('p1', viewMonth, {
      projects: [project],
      allocations: [a],
    });

    expect(used).toBe(0);
    expect(budget).toBe(100);
  });
});
