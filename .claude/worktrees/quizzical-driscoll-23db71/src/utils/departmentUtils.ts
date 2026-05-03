import type { DepartmentDefinition } from '@/types';

const DEFAULT_DEPT_COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ef4444'];

/** Convierte departments de settings (string[] legacy o DepartmentDefinition[]) a DepartmentDefinition[]. */
export function normalizeDepartments(
  raw: (string | DepartmentDefinition)[] | undefined
): DepartmentDefinition[] {
  if (!raw || !Array.isArray(raw) || raw.length === 0) return [];
  return raw.map((item, index) => {
    if (typeof item === 'string') {
      const id = slugify(item) || `dept-${index}`;
      return {
        id,
        name: item,
        color: DEFAULT_DEPT_COLORS[index % DEFAULT_DEPT_COLORS.length],
      };
    }
    return {
      id: item.id || slugify(item.name) || `dept-${index}`,
      name: item.name,
      color: item.color || DEFAULT_DEPT_COLORS[index % DEFAULT_DEPT_COLORS.length],
    };
  });
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || '';
}

/** Indica si un empleado pertenece al departamento (por id o por nombre legacy). */
export function employeeBelongsToDepartment(
  employeeDepartment: string | undefined,
  departmentId: string,
  departmentName: string
): boolean {
  if (!employeeDepartment) return false;
  return employeeDepartment === departmentId || employeeDepartment === departmentName;
}
