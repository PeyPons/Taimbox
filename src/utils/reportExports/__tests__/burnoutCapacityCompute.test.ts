import { describe, expect, it } from 'vitest';
import { computeBurnoutCapacityForMonth } from '@/utils/reportExports/burnoutCapacityCompute';
import type { Employee } from '@/types';

const baseSchedule = {
  monday: 8,
  tuesday: 8,
  wednesday: 8,
  thursday: 8,
  friday: 6,
  saturday: 0,
  sunday: 0,
};

function emp(partial: Partial<Employee> & Pick<Employee, 'id' | 'name'>): Employee {
  return {
    agencyId: 'a1',
    role: 'dev',
    defaultWeeklyCapacity: 38,
    workSchedule: baseSchedule,
    isActive: true,
    ...partial,
  };
}

describe('computeBurnoutCapacityForMonth', () => {
  it('combina planificador y deadlines con max() y expone ocupación sobre capacidad neta', () => {
    const jan = new Date(2026, 0, 15);
    const e1 = emp({ id: 'e1', name: 'Ana' });
    const rows = computeBurnoutCapacityForMonth({
      month: jan,
      employees: [e1],
      allocations: [
        {
          id: 't1',
          employeeId: 'e1',
          projectId: 'p1',
          weekStartDate: '2026-01-05',
          hoursAssigned: 20,
          status: 'planned',
        },
      ],
      absences: [],
      teamEvents: [],
      deadlines: [
        {
          id: 'd1',
          projectId: 'p1',
          month: '2026-01',
          employeeHours: { e1: 80 },
          isHidden: false,
        },
      ],
      globalAssignments: [{ id: 'g1', month: '2026-01', name: 'Interno', hours: 5, affectsAll: true }],
      projects: [{ id: 'p1', agencyId: 'a1', clientId: 'c1', name: 'P', status: 'active', budgetHours: 100 }],
      clients: [{ id: 'c1', agencyId: 'a1', name: 'C', color: '#000' }],
      deadlinesForMetrics: [{ projectId: 'p1', month: '2026-01' }],
      hoursTrackingPreference: 'computed',
      allowedEmployeeIds: null,
    }).rows;

    expect(rows).toHaveLength(1);
    const r = rows[0];
    expect(r.plannerHoursMonthlyGrid).toBeGreaterThan(0);
    expect(r.deadlineHoursClientProjects).toBe(80);
    expect(r.deadlineHoursGlobalAssignments).toBe(5);
    expect(r.deadlineHoursTotal).toBe(85);
    expect(r.committedLoadHours).toBe(85);
    expect(r.netAvailableHours).toBeGreaterThan(0);
    expect(r.occupancyOfNetCapacityPercent).toBeGreaterThan(0);
    expect(r.bufferForAdHocPercent).toBeGreaterThanOrEqual(0);
  });
});
