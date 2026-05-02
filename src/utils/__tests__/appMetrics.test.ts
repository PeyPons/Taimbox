import type { Allocation, Employee } from '@/types';
import { computeEmployeeLoadForWeek, hoursCountedTowardLoad } from '@/utils/appMetrics';

const work40: Employee['workSchedule'] = {
  monday: 8,
  tuesday: 8,
  wednesday: 8,
  thursday: 8,
  friday: 8,
  saturday: 0,
  sunday: 0,
};

const baseEmployee = (id: string): Employee => ({
  id,
  agencyId: 'a1',
  name: 'Test',
  role: 'dev',
  defaultWeeklyCapacity: 40,
  workSchedule: work40,
  isActive: true,
});

const baseAlloc = (over: Partial<Allocation>): Allocation => ({
  id: 'alloc-1',
  employeeId: 'e1',
  projectId: 'p1',
  weekStartDate: '2026-01-05',
  hoursAssigned: 10,
  status: 'planned',
  ...over,
});

describe('hoursCountedTowardLoad', () => {
  it('tareas no completadas usan hoursAssigned', () => {
    expect(hoursCountedTowardLoad(baseAlloc({ status: 'planned', hoursAssigned: 12 }))).toBe(12);
    expect(hoursCountedTowardLoad(baseAlloc({ status: 'active', hoursAssigned: 7 }))).toBe(7);
  });

  it('completadas con horas reales usan hoursActual', () => {
    expect(
      hoursCountedTowardLoad(
        baseAlloc({ status: 'completed', hoursAssigned: 40, hoursActual: 3.5, hoursComputed: 10 })
      )
    ).toBe(3.5);
  });

  it('completadas sin real pero con hoursComputed usan hoursComputed (no hoursAssigned)', () => {
    expect(
      hoursCountedTowardLoad(
        baseAlloc({
          status: 'completed',
          hoursAssigned: 40,
          hoursActual: 0,
          hoursComputed: 2,
        })
      )
    ).toBe(2);
  });

  it('completadas sin real ni hoursComputed útil no inflan la carga con hoursAssigned residual', () => {
    expect(
      hoursCountedTowardLoad(
        baseAlloc({
          status: 'completed',
          hoursAssigned: 40,
          hoursActual: 0,
        })
      )
    ).toBe(0);
    expect(
      hoursCountedTowardLoad(
        baseAlloc({
          status: 'completed',
          hoursAssigned: 40,
          hoursActual: 0,
          hoursComputed: 0,
        })
      )
    ).toBe(0);
  });
});

describe('computeEmployeeLoadForWeek', () => {
  const weekStart = '2026-01-05';
  const employee = baseEmployee('e1');

  it('suma allocations con la regla de carga (completada sin real + planned)', () => {
    const allocations: Allocation[] = [
      baseAlloc({
        id: 'a1',
        status: 'completed',
        hoursAssigned: 40,
        hoursActual: 0,
        hoursComputed: 2,
      }),
      baseAlloc({
        id: 'a2',
        status: 'planned',
        hoursAssigned: 10,
      }),
    ];

    const result = computeEmployeeLoadForWeek('e1', weekStart, {}, {
      employees: [employee],
      allocations,
      absences: [],
      teamEvents: [],
    });

    expect(result.hours).toBe(12);
    expect(result.capacity).toBe(40);
  });
});
