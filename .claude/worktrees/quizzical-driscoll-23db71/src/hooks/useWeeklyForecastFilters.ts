import { useMemo } from 'react';
import type { Allocation, Employee, Project } from '@/types';
import { employeeBelongsToDepartment } from '@/utils/departmentUtils';
import { isAllocationInEffectiveMonth } from '@/utils/dateUtils';
import { filterEmployeesForOperationalMonthDate } from '@/utils/employeeAssignmentVisibility';

interface DepartmentOption {
  id: string;
  name: string;
}

export function useWeeklyForecastFilters(params: {
  selectedDepartmentId: string | null;
  departments: DepartmentOption[];
  employees: Employee[];
  projects: Project[];
  allocations: Allocation[];
  currentMonth: Date;
}) {
  const { selectedDepartmentId, departments, employees, projects, allocations, currentMonth } = params;

  const employeesForView = useMemo(() => {
    if (!selectedDepartmentId || !departments.length) return employees ?? [];
    const dept = departments.find(d => d.id === selectedDepartmentId || d.name === selectedDepartmentId);
    if (!dept) return employees ?? [];
    return (employees ?? []).filter(e => employeeBelongsToDepartment(e.department, dept.id, dept.name));
  }, [employees, selectedDepartmentId, departments]);

  const employeesForOperationalMonth = useMemo(
    () =>
      filterEmployeesForOperationalMonthDate(employeesForView, currentMonth, {
        allocations,
        deadlines: [],
        globalAssignments: [],
      }),
    [employeesForView, currentMonth, allocations]
  );

  const filteredProjectsForView = useMemo(() => {
    if (!selectedDepartmentId || !(projects ?? []).length) return projects ?? [];
    const byResponsible = (projects ?? []).filter(p => p.responsibleDepartmentId === selectedDepartmentId);
    if (byResponsible.length > 0) return byResponsible;
    const deptIds = new Set(employeesForView.map(e => e.id));
    return (projects ?? []).filter(p =>
      (allocations ?? []).some(
        a => a.projectId === p.id && deptIds.has(a.employeeId) && isAllocationInEffectiveMonth(a.weekStartDate, currentMonth)
      )
    );
  }, [projects, selectedDepartmentId, employeesForView, allocations, currentMonth]);

  return {
    employeesForView,
    employeesForOperationalMonth,
    filteredProjectsForView,
  };
}

