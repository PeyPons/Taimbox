import { parseISO, isBefore, startOfWeek, addDays } from 'date-fns';
import { Allocation, Employee, DepartmentConfig } from '../types';

/**
 * Task editing permission utilities.
 * Centralized logic for determining if a task can be edited.
 */

export interface CanEditTaskOptions {
    allocation: Allocation;
    currentUser: Employee;
    departmentConfig?: DepartmentConfig;
    weeklyEnabled?: boolean;
    now?: Date;
}

export interface CanEditTaskResult {
    canEdit: boolean;
    reason?: string;
}

/**
 * Check if a user can edit a specific task/allocation.
 * 
 * Rules:
 * 1. If task.isLocked === true, only admins can edit
 * 2. If week is in the past (after closing day/hour), non-admins cannot edit
 * 3. Admins can always edit
 * 4. User can edit their own tasks if not locked and not past closing
 */
export function canEditTask(options: CanEditTaskOptions): CanEditTaskResult {
    const { allocation, currentUser, departmentConfig, now = new Date() } = options;

    // Check if user is admin (has settings access = admin level)
    const isAdmin = currentUser.permissions?.can_access_settings === true;

    // Rule 1: Locked tasks - only admins
    if (allocation.isLocked) {
        if (isAdmin) {
            return { canEdit: true };
        }
        return { canEdit: false, reason: 'Esta tarea está bloqueada. Solo administradores pueden editarla.' };
    }

    // Rule 2: Past closing day/hour for non-admins (only when weekly is enabled)
    if (!isAdmin && options.weeklyEnabled !== false) {
        const weekStart = parseISO(allocation.weekStartDate);
        const closingDay = departmentConfig?.closingDay ?? 3; // Default: Wednesday (3)
        const closingHour = departmentConfig?.closingHour ?? 10; // Default: 10:00

        // Calculate closing datetime for this week
        // closingDay: 0=Monday, 6=Sunday
        const closingDate = addDays(weekStart, closingDay + 7); // Next week's closing day
        closingDate.setHours(closingHour, 0, 0, 0);

        if (isBefore(closingDate, now)) {
            return {
                canEdit: false,
                reason: `El plazo de edición ha pasado (${getDayName(closingDay)} ${closingHour}:00).`
            };
        }
    }

    // Rule 3: User can only edit their own tasks (unless admin)
    if (!isAdmin && allocation.employeeId !== currentUser.id) {
        return { canEdit: false, reason: 'No puedes editar tareas de otros usuarios.' };
    }

    // All checks passed
    return { canEdit: true };
}

/**
 * Check if a week is currently editable based on closing rules.
 */
export function isWeekEditable(
    weekStartDate: string | Date,
    departmentConfig?: DepartmentConfig,
    now: Date = new Date(),
    weeklyEnabled: boolean = true
): boolean {
    if (!weeklyEnabled) return true;

    const weekStart = typeof weekStartDate === 'string' ? parseISO(weekStartDate) : weekStartDate;
    const closingDay = departmentConfig?.closingDay ?? 3;
    const closingHour = departmentConfig?.closingHour ?? 10;

    const closingDate = addDays(weekStart, closingDay + 7);
    closingDate.setHours(closingHour, 0, 0, 0);

    return isBefore(now, closingDate);
}

/**
 * Get the closing datetime for a specific week.
 */
export function getWeekClosingDate(
    weekStartDate: string | Date,
    departmentConfig?: DepartmentConfig
): Date {
    const weekStart = typeof weekStartDate === 'string' ? parseISO(weekStartDate) : weekStartDate;
    const closingDay = departmentConfig?.closingDay ?? 3;
    const closingHour = departmentConfig?.closingHour ?? 10;

    const closingDate = addDays(weekStart, closingDay + 7);
    closingDate.setHours(closingHour, 0, 0, 0);

    return closingDate;
}

function getDayName(day: number): string {
    const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    return days[day] || 'Desconocido';
}

/**
 * Check if a role is a system role (protected, cannot be deleted).
 */
export function isSystemRole(roleName: string): boolean {
    const systemRoles = ['Administrador', 'Admin', 'Administrator'];
    return systemRoles.some(sr => sr.toLowerCase() === roleName.toLowerCase());
}
