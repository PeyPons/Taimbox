/**
 * Utilidades para manejar roles de empleados de forma robusta
 */

import { Employee } from '@/types';
import { RolePermissions } from '@/types';

/**
 * Obtiene el rol válido de un empleado
 * Si el rol del empleado no existe en la configuración, devuelve el primer rol disponible
 * Si no hay roles configurados, devuelve un rol por defecto
 */
export function getValidRole(
  employee: Employee | undefined,
  availableRoles: (string | RolePermissions)[] | undefined
): string {
  if (!employee?.role) {
    // Si el empleado no tiene rol, usar el primero disponible
    if (availableRoles && availableRoles.length > 0) {
      const firstRole = typeof availableRoles[0] === 'string' 
        ? availableRoles[0] 
        : availableRoles[0].name;
      return firstRole;
    }
    return 'Administrador'; // Fallback final
  }

  // Verificar si el rol del empleado existe en la configuración
  if (availableRoles && availableRoles.length > 0) {
    const roleExists = availableRoles.some(r => {
      const roleName = typeof r === 'string' ? r : r.name;
      return roleName.toLowerCase() === employee.role.toLowerCase();
    });

    if (roleExists) {
      return employee.role; // El rol existe, usarlo
    }
  }

  // El rol no existe en la configuración, usar el primero disponible
  if (availableRoles && availableRoles.length > 0) {
    const firstRole = typeof availableRoles[0] === 'string' 
      ? availableRoles[0] 
      : availableRoles[0].name;
    return firstRole;
  }

  // No hay roles configurados, usar el rol del empleado o fallback
  return employee.role || 'Administrador';
}

type DeptOption = string | { id: string; name: string };

/**
 * Obtiene el departamento válido de un empleado (nombre para mostrar).
 * Acepta string[] (legacy) o DepartmentDefinition[] (id/name).
 * Si el departamento del empleado no existe, devuelve el primero disponible.
 */
export function getValidDepartment(
  employee: Employee | undefined,
  availableDepartments: DeptOption[] | undefined
): string {
  const firstDeptName = availableDepartments?.length
    ? (typeof availableDepartments[0] === 'string' ? availableDepartments[0] : availableDepartments[0].name)
    : null;

  if (!employee?.department) {
    return firstDeptName ?? 'General';
  }

  if (availableDepartments && availableDepartments.length > 0) {
    const match = availableDepartments.find(d => {
      if (typeof d === 'string') return d.toLowerCase() === employee.department?.toLowerCase();
      return d.id === employee.department || d.name.toLowerCase() === employee.department?.toLowerCase();
    });
    if (match) return typeof match === 'string' ? match : match.name;
    return firstDeptName ?? employee.department;
  }

  return employee.department || 'General';
}

