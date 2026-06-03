import type { Employee } from '@/types';

const EXCLUDED_ROLE_PATTERNS = [
  /^soporte$/i,
  /^support$/i,
  /^admin\s*plataforma$/i,
  /^platform\s*admin$/i,
];

const PLACEHOLDER_NAME = /placeholder|\[pendiente\]|\[vacante\]/i;

/**
 * Persona gestionada: empleado activo en planificación/capacidad.
 * Excluye placeholders y roles de soporte/plataforma sin carga operativa.
 */
export function isManagedUser(employee: Employee): boolean {
  if (employee.isActive === false) return false;
  const role = (employee.role ?? '').trim();
  if (EXCLUDED_ROLE_PATTERNS.some((re) => re.test(role))) return false;
  if (PLACEHOLDER_NAME.test(employee.name ?? '')) return false;
  return true;
}

export function countManagedUsers(employees: Employee[]): number {
  return employees.filter(isManagedUser).length;
}
