import { describe, expect, it } from 'vitest';
import type { Allocation, Deadline, Employee, GlobalAssignment } from '@/types';
import {
  filterEmployeesForDeadlinesMonth,
  filterEmployeesForOperationalMonth,
} from '@/utils/employeeAssignmentVisibility';

const emp = (id: string, isActive: boolean): Employee =>
  ({
    id,
    name: id,
    isActive,
    workSchedule: {},
  }) as Employee;

describe('filterEmployeesForDeadlinesMonth', () => {
  const month = '2026-06';
  const hidden = new Set<string>();

  it('incluye activos e inactivos solo con horas en deadlines del mes', () => {
    const employees = [emp('active', true), emp('inactive', false)];
    const deadlines: Deadline[] = [
      {
        id: 'd1',
        projectId: 'p1',
        month,
        employeeHours: { inactive: 2 },
      } as Deadline,
    ];

    const result = filterEmployeesForDeadlinesMonth(employees, month, deadlines, hidden);
    expect(result.map((e) => e.id).sort()).toEqual(['active', 'inactive']);
  });

  it('no incluye inactivos solo por planificador ni global affectsAll', () => {
    const employees = [emp('active', true), emp('inactive', false)];
    const deadlines: Deadline[] = [];
    const globalAssignments: GlobalAssignment[] = [
      {
        id: 'g1',
        month,
        name: 'Todos',
        hours: 5,
        affectsAll: true,
        affectedEmployeeIds: [],
      } as GlobalAssignment,
    ];
    const allocations: Allocation[] = [
      {
        id: 'a1',
        employeeId: 'inactive',
        weekStartDate: '2026-06-02',
      } as Allocation,
    ];

    const operational = filterEmployeesForOperationalMonth(employees, month, {
      deadlines,
      globalAssignments,
      allocations,
    });
    expect(operational.map((e) => e.id).sort()).toEqual(['active', 'inactive']);

    const deadlinesOnly = filterEmployeesForDeadlinesMonth(employees, month, deadlines, hidden);
    expect(deadlinesOnly.map((e) => e.id)).toEqual(['active']);
  });
});
