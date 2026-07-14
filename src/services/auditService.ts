/**
 * Audit Service
 * 
 * Provides logging functionality for tracking user actions on critical resources.
 * All audit logs are stored in the audit_logs table in Supabase.
 */

import { supabase } from '@/lib/supabase';

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE';
export type AuditResource = 'ALLOCATION' | 'ALLOCATION_NOTE' | 'PROJECT' | 'EMPLOYEE' | 'CLIENT' | 'ABSENCE' | 'TEAM_EVENT';

export type AuditChangedFields = Record<string, { old: unknown; new: unknown }>;

interface AuditDetails {
    /** Snapshot completo (formato legado y CREATE/DELETE). */
    previousValue?: Record<string, unknown>;
    newValue?: Record<string, unknown>;
    /** Formato compacto de UPDATE: solo campos que cambiaron. */
    changed?: AuditChangedFields;
    /** Mini-snapshot (valores nuevos) con el contexto que necesita la UI del historial. */
    context?: Record<string, unknown>;
    description?: string;
}

/**
 * Campos de Allocation que se persisten en los snapshots de CREATE/DELETE.
 * Poda duplicados snake_case y campos internos que la UI del historial no usa.
 */
const ALLOCATION_SNAPSHOT_FIELDS: readonly string[] = [
    'employeeId', 'projectId', 'weekStartDate',
    'hoursAssigned', 'hoursActual', 'hoursComputed',
    'status', 'taskName', 'description', 'dependencyId',
    'transferredFromAllocationId', 'distributionSourceAllocationId', 'parentAllocationId',
    'originalTransferredTaskName', 'transferSourceEmployeeId',
    'userPriority', 'isLocked', 'focusDate',
];

/**
 * Subconjunto mínimo que acompaña a los diffs de UPDATE para que el historial
 * pueda renderizar (empleado, proyecto, tarea, semana, horas, linaje) sin
 * necesitar el objeto completo.
 */
const ALLOCATION_CONTEXT_FIELDS: readonly string[] = [
    'employeeId', 'projectId', 'weekStartDate',
    'hoursAssigned', 'hoursActual', 'status', 'taskName',
    'transferredFromAllocationId', 'distributionSourceAllocationId', 'parentAllocationId',
    'transferSourceEmployeeId',
];

function pruneToFields(
    value: Record<string, unknown>,
    fields: readonly string[]
): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const field of fields) {
        if (value[field] !== undefined) out[field] = value[field];
    }
    return out;
}

/** Para ALLOCATION reduce el payload a los campos que usa el historial; el resto de recursos ya envían payloads mínimos. */
function pruneSnapshot(
    resource: AuditResource,
    value: Record<string, unknown>,
    fields: readonly string[]
): Record<string, unknown> {
    return resource === 'ALLOCATION' ? pruneToFields(value, fields) : value;
}

/**
 * Log an audit event to the database
 * 
 * This function is designed to be non-blocking and fail-safe.
 * It will never throw an error to prevent breaking the main application flow.
 * 
 * @param agencyId - The agency ID for the audit log (for RLS)
 * @param action - The action type (CREATE, UPDATE, DELETE)
 * @param resource - The resource type being modified
 * @param resourceId - The ID of the resource being modified
 * @param details - Optional details including previous and new values
 */
export async function logAudit(
    agencyId: string,
    action: AuditAction,
    resource: AuditResource,
    resourceId: string,
    details: AuditDetails = {}
): Promise<void> {
    try {
        // Get current authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            console.warn('[AuditService] No authenticated user, skipping audit log');
            return;
        }

        // Insert audit log entry (user y fecha ya van en user_id/created_at; no duplicar en el jsonb)
        const { error: insertError } = await supabase.from('audit_logs').insert({
            user_id: user.id,
            agency_id: agencyId,
            action,
            resource,
            resource_id: resourceId,
            details
        });

        if (insertError) {
            // Log error but don't throw - audit logging should never break main functionality
            console.error('[AuditService] Failed to insert audit log:', insertError.message);
        }
    } catch (error) {
        // Catch all errors to prevent breaking the main flow
        console.error('[AuditService] Unexpected error:', error);
    }
}

/**
 * Helper to create a diff object for UPDATE operations
 * Compares previous and new values and returns only changed fields
 */
export function createDiff(
    previousValue: Record<string, unknown>,
    newValue: Record<string, unknown>
): { changed: AuditChangedFields } {
    const changed: AuditChangedFields = {};

    const allKeys = new Set([...Object.keys(previousValue), ...Object.keys(newValue)]);

    allKeys.forEach(key => {
        const oldVal = previousValue[key];
        const newVal = newValue[key];

        // Deep comparison for objects
        if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
            changed[key] = { old: oldVal, new: newVal };
        }
    });

    return { changed };
}

/**
 * Log a CREATE action
 */
export async function logCreate(
    agencyId: string,
    resource: AuditResource,
    resourceId: string,
    newValue: Record<string, unknown>
): Promise<void> {
    return logAudit(agencyId, 'CREATE', resource, resourceId, {
        // Snapshot completo (podado): necesario para trazar linaje de tareas padre ya borradas
        newValue: pruneSnapshot(resource, newValue, ALLOCATION_SNAPSHOT_FIELDS),
        description: `Created ${resource.toLowerCase()}`
    });
}

/**
 * Log an UPDATE action with diff
 *
 * Guarda solo los campos que cambiaron (`changed`) más un mini-snapshot de
 * contexto, en lugar de duplicar el objeto completo en previous/new.
 * Si no hay cambios efectivos, no inserta nada.
 */
export async function logUpdate(
    agencyId: string,
    resource: AuditResource,
    resourceId: string,
    previousValue: Record<string, unknown>,
    newValue: Record<string, unknown>
): Promise<void> {
    const diff = createDiff(
        pruneSnapshot(resource, previousValue, ALLOCATION_SNAPSHOT_FIELDS),
        pruneSnapshot(resource, newValue, ALLOCATION_SNAPSHOT_FIELDS)
    );
    const changedKeys = Object.keys(diff.changed);
    if (changedKeys.length === 0) return; // No-op: no ensuciar audit_logs

    return logAudit(agencyId, 'UPDATE', resource, resourceId, {
        changed: diff.changed,
        context: pruneSnapshot(resource, newValue, ALLOCATION_CONTEXT_FIELDS),
        description: `Updated ${resource.toLowerCase()}: ${changedKeys.join(', ')}`
    });
}

/**
 * Log a DELETE action
 */
export async function logDelete(
    agencyId: string,
    resource: AuditResource,
    resourceId: string,
    previousValue?: Record<string, unknown>
): Promise<void> {
    return logAudit(agencyId, 'DELETE', resource, resourceId, {
        previousValue: previousValue
            ? pruneSnapshot(resource, previousValue, ALLOCATION_SNAPSHOT_FIELDS)
            : undefined,
        description: `Deleted ${resource.toLowerCase()}`
    });
}
