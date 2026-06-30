import { useMemo } from 'react';
import type { Allocation, Employee, Project } from '@/types';
import { employeeBelongsToDepartment } from '@/utils/departmentUtils';
import { resolveProjectsForDepartmentView } from '@/utils/departmentViewFilters';
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

  const filteredProjectsForView = useMemo(
    () =>
      resolveProjectsForDepartmentView(
        projects ?? [],
        selectedDepartmentId,
        employeesForView,
        allocations ?? [],
        currentMonth,
      ),
    [projects, selectedDepartmentId, employeesForView, allocations, currentMonth],
  );

  return {
    employeesForView,
    employeesForOperationalMonth,
    filteredProjectsForView,
  };
}

