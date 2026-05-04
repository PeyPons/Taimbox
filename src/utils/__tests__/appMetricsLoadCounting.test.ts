import { describe, it, expect } from 'vitest';
import type { Allocation } from '@/types';
import { hoursCountedTowardLoad } from '@/utils/appMetrics';

function baseAllocation(over: Partial<Allocation> = {}): Allocation {
  return {
    id: 'a1',
    employeeId: 'e1',
    projectId: 'p1',
    weekStartDate: '2026-05-04',
    hoursAssigned: 8,
    status: 'planned',
    ...over,
  };
}

describe('hoursCountedTowardLoad', () => {
  it('tarea no completada: cuenta hoursAssigned hacia carga', () => {
    expect(hoursCountedTowardLoad(baseAllocation({ status: 'planned', hoursAssigned: 5 }))).toBe(5);
  });

  it('completada con horas reales > 0: usa hoursActual', () => {
    expect(
      hoursCountedTowardLoad(
        baseAllocation({ status: 'completed', hoursAssigned: 20, hoursActual: 3, hoursComputed: 3 })
      )
    ).toBe(3);
  });

  it('completada sin real ni computado: no suma hoursAssigned residual (cierre / weekly 0h real)', () => {
    expect(
      hoursCountedTowardLoad(
        baseAllocation({
          status: 'completed',
          hoursAssigned: 12,
          hoursActual: 0,
          hoursComputed: 0,
        })
      )
    ).toBe(0);
  });

  it('completada sin real > 0 pero con computado > 0: usa hoursComputed', () => {
    expect(
      hoursCountedTowardLoad(
        baseAllocation({
          status: 'completed',
          hoursAssigned: 10,
          hoursActual: 0,
          hoursComputed: 4,
        })
      )
    ).toBe(4);
  });

  it('completada con hoursActual 0 y hoursComputed undefined: 0 aunque haya estimado', () => {
    expect(
      hoursCountedTowardLoad(
        baseAllocation({
          status: 'completed',
          hoursAssigned: 8,
          hoursActual: 0,
        })
      )
    ).toBe(0);
  });
});
