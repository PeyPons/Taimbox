import { hoursCountedTowardLoad } from '@/utils/appMetrics';
import type { Allocation } from '@/types';

function alloc(partial: Partial<Allocation> & Pick<Allocation, 'id' | 'employeeId' | 'projectId' | 'weekStartDate' | 'status'>): Allocation {
  return {
    hoursAssigned: 0,
    ...partial,
  };
}

describe('hoursCountedTowardLoad', () => {
  it('tareas no completadas usan hoursAssigned', () => {
    expect(
      hoursCountedTowardLoad(
        alloc({
          id: '1',
          employeeId: 'e',
          projectId: 'p',
          weekStartDate: '2026-04-20',
          status: 'planned',
          hoursAssigned: 12,
        })
      )
    ).toBe(12);
  });

  it('completada con horas reales > 0 usa hoursActual', () => {
    expect(
      hoursCountedTowardLoad(
        alloc({
          id: '1',
          employeeId: 'e',
          projectId: 'p',
          weekStartDate: '2026-04-20',
          status: 'completed',
          hoursAssigned: 10,
          hoursActual: 7.5,
        })
      )
    ).toBe(7.5);
  });

  it('completada sin real pero con hoursComputed > 0 usa hoursComputed (tramo computado)', () => {
    expect(
      hoursCountedTowardLoad(
        alloc({
          id: '1',
          employeeId: 'e',
          projectId: 'p',
          weekStartDate: '2026-04-20',
          status: 'completed',
          hoursAssigned: 8,
          hoursActual: 0,
          hoursComputed: 3,
        })
      )
    ).toBe(3);
  });

  it('completada sin real y sin computo útil no suma hoursAssigned residual (regresión planificador)', () => {
    expect(
      hoursCountedTowardLoad(
        alloc({
          id: '1',
          employeeId: 'e',
          projectId: 'p',
          weekStartDate: '2026-04-20',
          status: 'completed',
          hoursAssigned: 8,
          hoursActual: 0,
          hoursComputed: 0,
        })
      )
    ).toBe(0);
  });

  it('completada con hoursActual 0 y hoursComputed ausente no cuenta asignado', () => {
    expect(
      hoursCountedTowardLoad(
        alloc({
          id: '1',
          employeeId: 'e',
          projectId: 'p',
          weekStartDate: '2026-04-20',
          status: 'completed',
          hoursAssigned: 5,
          hoursActual: 0,
        })
      )
    ).toBe(0);
  });
});
