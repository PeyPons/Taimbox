import type { Allocation, Employee, Project } from '@/types';
import { isAllocationInEffectiveMonth } from '@/utils/dateUtils';

/**
 * Proyectos visibles en vista por departamento: primero por `responsibleDepartmentId`;
 * si no hay ninguno, proyectos con asignaciones del mes de empleados del departamento.
 */
export function resolveProjectsForDepartmentView(
  projects: Project[],
  selectedDepartmentId: string | null,
  employeesForView: Employee[],
  allocations: Allocation[],
  viewMonth: Date,
): Project[] {
  if (!selectedDepartmentId || !projects.length) return projects;
  const byResponsible = projects.filter((p) => p.responsibleDepartmentId === selectedDepartmentId);
  if (byResponsible.length > 0) return byResponsible;
  const deptEmployeeIds = new Set(employeesForView.map((e) => e.id));
  return projects.filter((p) =>
    allocations.some(
      (a) =>
        a.projectId === p.id &&
        deptEmployeeIds.has(a.employeeId) &&
        isAllocationInEffectiveMonth(a.weekStartDate, viewMonth),
    ),
  );
}
