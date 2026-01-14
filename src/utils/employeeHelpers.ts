import { Employee } from '@/types';

/**
 * Obtiene el nombre para mostrar de un empleado de forma consistente.
 * Prioriza first_name sobre el nombre completo.
 * 
 * @example
 * getEmployeeDisplayName(employee) // "María"
 * getEmployeeDisplayName(employee, true) // "María G."
 */
export function getEmployeeDisplayName(
    employee: Employee | undefined | null,
    includeLastInitial = false
): string {
    if (!employee) return 'Sin nombre';

    const firstName = employee.first_name || employee.name?.split(' ')[0] || 'Sin nombre';

    if (includeLastInitial && employee.last_name) {
        return `${firstName} ${employee.last_name.charAt(0)}.`;
    }

    if (includeLastInitial && employee.name) {
        const parts = employee.name.split(' ');
        if (parts.length > 1) {
            return `${firstName} ${parts[1].charAt(0)}.`;
        }
    }

    return firstName;
}

/**
 * Obtiene las iniciales de un empleado para avatares.
 * 
 * @example
 * getEmployeeInitials(employee) // "MG"
 */
export function getEmployeeInitials(employee: Employee | undefined | null): string {
    if (!employee) return '??';

    const firstName = employee.first_name || employee.name?.split(' ')[0] || '';
    const lastName = employee.last_name || employee.name?.split(' ')[1] || '';

    const firstInitial = firstName.charAt(0).toUpperCase();
    const lastInitial = lastName.charAt(0).toUpperCase();

    return firstInitial + lastInitial || firstInitial || '??';
}

/**
 * Obtiene el nombre completo de un empleado.
 */
export function getEmployeeFullName(employee: Employee | undefined | null): string {
    if (!employee) return 'Sin nombre';

    if (employee.first_name && employee.last_name) {
        return `${employee.first_name} ${employee.last_name}`;
    }

    return employee.name || employee.first_name || 'Sin nombre';
}
