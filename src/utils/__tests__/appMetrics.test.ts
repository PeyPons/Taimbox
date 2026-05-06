import type { Allocation } from '@/types';
import { hoursCountedTowardLoad } from '@/utils/appMetrics';

function alloc(partial: Partial<Allocation> & Pick<Allocation, 'status'>): Allocation {
  return {
    id: 'a1',
    employeeId: 'e1',
    projectId: 'p1',
    weekStartDate: '2026-05-04',
    hoursAssigned: 10,
    ...partial,
  };
}

describe('hoursCountedTowardLoad', () => {
  it('tareas no completadas usan hoursAssigned', () => {
    expect(hoursCountedTowardLoad(alloc({ status: 'planned', hoursAssigned: 12 }))).toBe(12);
    expect(hoursCountedTowardLoad(alloc({ status: 'active', hoursAssigned: 8 }))).toBe(8);
  });

  it('completadas con horas reales > 0 usan hoursActual', () => {
    expect(
      hoursCountedTowardLoad(
        alloc({
          status: 'completed',
          hoursAssigned: 40,
          hoursActual: 7.5,
          hoursComputed: 7,
        })
      )
    ).toBe(7.5);
  });

  it('completadas sin real pero con hoursComputed > 0 usan computed (p. ej. rollover)', () => {
    expect(
      hoursCountedTowardLoad(
        alloc({
          status: 'completed',
          hoursAssigned: 20,
          hoursActual: 0,
          hoursComputed: 6,
        })
      )
    ).toBe(6);
  });

  it('completadas sin real ni computed útil no cuentan residual de hoursAssigned (evita inflar carga)', () => {
    expect(
      hoursCountedTowardLoad(
        alloc({
          status: 'completed',
          hoursAssigned: 18,
          hoursActual: 0,
          hoursComputed: 0,
        })
      )
    ).toBe(0);
    expect(
      hoursCountedTowardLoad(
        alloc({
          status: 'completed',
          hoursAssigned: 18,
          hoursActual: 0,
        })
      )
    ).toBe(0);
  });
});
