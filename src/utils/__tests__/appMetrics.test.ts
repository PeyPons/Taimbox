import { computeEmployeeLoadForWeek, hoursCountedTowardLoad } from '@/utils/appMetrics';
import type { Allocation, Employee } from '@/types';

const workWeek40: Employee['workSchedule'] = {
  monday: 8,
  tuesday: 8,
  wednesday: 8,
  thursday: 8,
  friday: 8,
  saturday: 0,
  sunday: 0,
};

function baseAllocation(overrides: Partial<Allocation> = {}): Allocation {
  return {
    id: 'a1',
    employeeId: 'e1',
    projectId: 'p1',
    weekStartDate: '2026-01-05',
    hoursAssigned: 8,
    status: 'planned',
    ...overrides,
  };
}

describe('hoursCountedTowardLoad', () => {
  it('tarea no completada usa hoursAssigned', () => {
    expect(hoursCountedTowardLoad(baseAllocation({ status: 'planned', hoursAssigned: 12 }))).toBe(12);
    expect(hoursCountedTowardLoad(baseAllocation({ status: 'active', hoursAssigned: 3 }))).toBe(3);
  });

  it('completada con horas reales usa hoursActual', () => {
    expect(
      hoursCountedTowardLoad(
        baseAllocation({ status: 'completed', hoursAssigned: 20, hoursActual: 7, hoursComputed: 2 })
      )
    ).toBe(7);
  });

  it('completada sin horas reales usa hoursComputed si existe (no hoursAssigned residual)', () => {
    expect(
      hoursCountedTowardLoad(
        baseAllocation({ status: 'completed', hoursAssigned: 10, hoursActual: 0, hoursComputed: 2.5 })
      )
    ).toBe(2.5);
  });

  it('completada sin real ni computed cuenta 0 aunque hoursAssigned sea alto', () => {
    expect(
      hoursCountedTowardLoad(baseAllocation({ status: 'completed', hoursAssigned: 40, hoursActual: 0 }))
    ).toBe(0);
  });

  it('completada con hoursComputed null o 0 y sin real cuenta 0', () => {
    expect(
      hoursCountedTowardLoad(
        baseAllocation({ status: 'completed', hoursAssigned: 5, hoursActual: 0, hoursComputed: undefined })
      )
    ).toBe(0);
    expect(
      hoursCountedTowardLoad(
        baseAllocation({ status: 'completed', hoursAssigned: 5, hoursActual: 0, hoursComputed: 0 })
      )
    ).toBe(0);
  });
});

describe('computeEmployeeLoadForWeek', () => {
  const employee: Employee = {
    id: 'e1',
    agencyId: 'ag1',
    name: 'Test',
    role: 'member',
    defaultWeeklyCapacity: 40,
    workSchedule: workWeek40,
    isActive: true,
  };

  it('suma carga semanal alineada con hoursCountedTowardLoad (completada 0h real + computed)', () => {
    const allocations: Allocation[] = [
      baseAllocation({
        id: 't1',
        status: 'completed',
        hoursAssigned: 10,
        hoursActual: 0,
        hoursComputed: 2,
      }),
      baseAllocation({ id: 't2', status: 'planned', hoursAssigned: 5 }),
    ];

    const result = computeEmployeeLoadForWeek('e1', '2026-01-05', {}, {
      employees: [employee],
      allocations,
      absences: [],
      teamEvents: [],
    });

    expect(result.hours).toBe(7);
  });
});
