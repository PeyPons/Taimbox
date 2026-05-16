import { parseISO } from 'date-fns';
import {
  computeEmployeeLoadForWeek,
  computeEmployeeMonthlyLoad,
  hoursCountedTowardLoad,
} from '@/utils/appMetrics';
import type { Allocation, Employee } from '@/types';

const baseEmployee = (): Employee =>
  ({
    id: 'e1',
    agencyId: 'a1',
    name: 'Empleado',
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
  }) as Employee;

const baseAllocation = (overrides: Partial<Allocation>): Allocation => ({
  id: 'a1',
  employeeId: 'e1',
  projectId: 'p1',
  weekStartDate: '2026-01-05',
  hoursAssigned: 10,
  status: 'planned',
  ...overrides,
});

describe('hoursCountedTowardLoad', () => {
  it('tareas no completadas usan hoursAssigned', () => {
    expect(hoursCountedTowardLoad(baseAllocation({ status: 'planned', hoursAssigned: 12 }))).toBe(12);
    expect(hoursCountedTowardLoad(baseAllocation({ status: 'active', hoursAssigned: 7 }))).toBe(7);
  });

  it('completada con horas reales > 0 usa hoursActual', () => {
    expect(
      hoursCountedTowardLoad(
        baseAllocation({ status: 'completed', hoursAssigned: 20, hoursActual: 6, hoursComputed: 8 }),
      ),
    ).toBe(6);
  });

  it('completada sin real pero con hoursComputed > 0 usa computed (rollover weekly)', () => {
    expect(
      hoursCountedTowardLoad(
        baseAllocation({ status: 'completed', hoursAssigned: 8, hoursActual: 0, hoursComputed: 3 }),
      ),
    ).toBe(3);
  });

  it('completada sin real y sin computed útil no cuenta hoursAssigned residual (evita inflar carga semanal)', () => {
    expect(
      hoursCountedTowardLoad(
        baseAllocation({ status: 'completed', hoursAssigned: 8, hoursActual: 0, hoursComputed: 0 }),
      ),
    ).toBe(0);
    expect(
      hoursCountedTowardLoad(baseAllocation({ status: 'completed', hoursAssigned: 8, hoursActual: 0 })),
    ).toBe(0);
  });
});

describe('computeEmployeeLoadForWeek — agregación con hoursCountedTowardLoad', () => {
  const weekStart = '2026-01-05';
  const range = {
    effectiveStart: parseISO('2026-01-05'),
    effectiveEnd: parseISO('2026-01-11'),
  };

  it('no suma hoursAssigned en completada cerrada con 0h reales y sin computed', () => {
    const res = computeEmployeeLoadForWeek('e1', weekStart, range, {
      employees: [baseEmployee()],
      allocations: [
        baseAllocation({
          id: 'x1',
          status: 'completed',
          hoursAssigned: 8,
          hoursActual: 0,
          hoursComputed: 0,
        }),
      ],
      absences: [],
      teamEvents: [],
    });
    expect(res.hours).toBe(0);
  });

  it('suma hoursComputed cuando completada tiene 0h reales', () => {
    const res = computeEmployeeLoadForWeek('e1', weekStart, range, {
      employees: [baseEmployee()],
      allocations: [
        baseAllocation({
          id: 'x2',
          status: 'completed',
          hoursAssigned: 10,
          hoursActual: 0,
          hoursComputed: 4,
        }),
      ],
      absences: [],
      teamEvents: [],
    });
    expect(res.hours).toBe(4);
  });
});

describe('computeEmployeeMonthlyLoad — misma regla de conteo', () => {
  it('mes con completada residual 0 no infla horas mensuales', () => {
    const res = computeEmployeeMonthlyLoad('e1', 2026, 0, {
      employees: [baseEmployee()],
      allocations: [
        baseAllocation({
          id: 'm1',
          weekStartDate: '2026-01-05',
          status: 'completed',
          hoursAssigned: 12,
          hoursActual: 0,
          hoursComputed: 0,
        }),
      ],
      absences: [],
      teamEvents: [],
    });
    expect(res.hours).toBe(0);
  });
});
