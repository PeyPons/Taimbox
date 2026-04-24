import { describe, it, expect } from 'vitest';
import {
  hoursCountedTowardLoad,
  computeEmployeeLoadForWeek,
  computeProjectHoursForMonth,
} from '@/utils/appMetrics';
import { getStorageKey, getWeeksForMonth } from '@/utils/dateUtils';
import type { Allocation, Employee, Project } from '@/types';

const defaultSchedule = {
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
  role: 'admin',
  defaultWeeklyCapacity: 40,
  workSchedule: defaultSchedule,
  isActive: true,
});

const baseAllocation = (over: Partial<Allocation> & Pick<Allocation, 'id' | 'employeeId' | 'projectId' | 'weekStartDate'>): Allocation => ({
  hoursAssigned: 0,
  status: 'planned',
  ...over,
});

describe('hoursCountedTowardLoad', () => {
  it('tareas no completadas usan hoursAssigned', () => {
    expect(
      hoursCountedTowardLoad(
        baseAllocation({
          id: '1',
          employeeId: 'e1',
          projectId: 'p1',
          weekStartDate: '2026-01-05',
          hoursAssigned: 12,
          status: 'planned',
        })
      )
    ).toBe(12);
  });

  it('completada con horas reales positivas usa hoursActual', () => {
    expect(
      hoursCountedTowardLoad(
        baseAllocation({
          id: '1',
          employeeId: 'e1',
          projectId: 'p1',
          weekStartDate: '2026-01-05',
          hoursAssigned: 20,
          hoursActual: 7.5,
          status: 'completed',
        })
      )
    ).toBe(7.5);
  });

  it('completada sin real ni computed no usa hoursAssigned residual (evita inflar carga tras rollover)', () => {
    expect(
      hoursCountedTowardLoad(
        baseAllocation({
          id: '1',
          employeeId: 'e1',
          projectId: 'p1',
          weekStartDate: '2026-01-05',
          hoursAssigned: 8,
          hoursActual: 0,
          status: 'completed',
        })
      )
    ).toBe(0);
  });

  it('completada sin real usa hoursComputed cuando existe', () => {
    expect(
      hoursCountedTowardLoad(
        baseAllocation({
          id: '1',
          employeeId: 'e1',
          projectId: 'p1',
          weekStartDate: '2026-01-05',
          hoursAssigned: 10,
          hoursActual: 0,
          hoursComputed: 3,
          status: 'completed',
        })
      )
    ).toBe(3);
  });
});

describe('computeEmployeeLoadForWeek (regresión carga semanal)', () => {
  it('no suma hours_assigned en completadas 0h real sin computed', () => {
    const viewMonth = new Date(2026, 0, 15);
    const weeks = getWeeksForMonth(viewMonth);
    const firstWeek = weeks[0];
    const weekStart = getStorageKey(firstWeek.weekStart, viewMonth);

    const alloc = baseAllocation({
      id: 'a1',
      employeeId: 'e1',
      projectId: 'p1',
      weekStartDate: weekStart,
      hoursAssigned: 8,
      hoursActual: 0,
      status: 'completed',
    });

    const result = computeEmployeeLoadForWeek(
      'e1',
      weekStart,
      { viewMonth },
      {
        employees: [baseEmployee('e1')],
        allocations: [alloc],
        absences: [],
        teamEvents: [],
      }
    );

    expect(result.hours).toBe(0);
  });
});

describe('computeProjectHoursForMonth', () => {
  it('agrega carga con la misma regla que el planificador (completada 0/0 no cuenta assigned)', () => {
    const month = new Date(2026, 0, 15);
    const weeks = getWeeksForMonth(month);
    const w0 = weeks[0];
    const key = getStorageKey(w0.weekStart, month);

    const project: Project = {
      id: 'p1',
      agencyId: 'a1',
      clientId: 'c1',
      name: 'P',
      status: 'active',
      budgetHours: 100,
    };

    const used = computeProjectHoursForMonth('p1', month, {
      projects: [project],
      allocations: [
        baseAllocation({
          id: 'a1',
          employeeId: 'e1',
          projectId: 'p1',
          weekStartDate: key,
          hoursAssigned: 15,
          hoursActual: 0,
          status: 'completed',
        }),
      ],
    });

    expect(used.used).toBe(0);
    expect(used.available).toBe(100);
  });
});
