/**
 * Audit Service
 * 
 * Provides logging functionality for tracking user actions on critical resources.
 * All audit logs are stored in the audit_logs table in Supabase.
 */

import { supabase } from '@/lib/supabase';

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE';
export type AuditResource = 'ALLOCATION' | 'ALLOCATION_NOTE' | 'PROJECT' | 'EMPLOYEE' | 'CLIENT' | 'ABSENCE' | 'TEAM_EVENT';

interface AuditDetails {
    previousValue?: Record<string, unknown>;
    newValue?: Record<string, unknown>;
    description?: string;
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

        // Insert audit log entry
        const { error: insertError } = await supabase.from('audit_logs').insert({
            user_id: user.id,
            agency_id: agencyId,
            action,
            resource,
            resource_id: resourceId,
            details: {
                ...details,
                timestamp: new Date().toISOString(),
                userEmail: user.email
            }
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
): { changed: Record<string, { old: unknown; new: unknown }> } {
    const changed: Record<string, { old: unknown; new: unknown }> = {};

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
        newValue,
        description: `Created ${resource.toLowerCase()}`
    });
}

/**
 * Log an UPDATE action with diff
 */
export async function logUpdate(
    agencyId: string,
    resource: AuditResource,
    resourceId: string,
    previousValue: Record<string, unknown>,
    newValue: Record<string, unknown>
): Promise<void> {
    const diff = createDiff(previousValue, newValue);

    return logAudit(agencyId, 'UPDATE', resource, resourceId, {
        previousValue,
        newValue,
        description: `Updated ${resource.toLowerCase()}: ${Object.keys(diff.changed).join(', ')}`
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
        previousValue,
        description: `Deleted ${resource.toLowerCase()}`
    });
}
