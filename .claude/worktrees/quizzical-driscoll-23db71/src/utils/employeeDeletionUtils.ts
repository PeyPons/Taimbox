import { supabase } from '@/lib/supabase';

export type PurgeEmployeeResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Ejecuta cleanup_employee_data + DELETE en employees. No toca Auth.
 */
export async function purgeEmployeeRowAndRelatedData(employeeId: string): Promise<PurgeEmployeeResult> {
  const { error: cleanupError } = await supabase.rpc('cleanup_employee_data', {
    p_employee_id: employeeId,
  });
  if (cleanupError) {
    console.error('[employeeDeletionUtils] cleanup_employee_data:', cleanupError);
    return { ok: false, error: cleanupError.message || 'Error al limpiar datos del empleado' };
  }

  const { error: deleteError } = await supabase.from('employees').delete().eq('id', employeeId);
  if (deleteError) {
    console.error('[employeeDeletionUtils] delete employees:', deleteError);
    return { ok: false, error: deleteError.message || 'Error al eliminar el empleado' };
  }

  return { ok: true };
}

export interface AuthLinkCounts {
  employees: number;
  userAgencies: number;
}

/** Cuenta filas employees y user_agencias para un auth user (p. ej. tras borrar un empleado). */
export async function countAuthLinksForUser(userId: string): Promise<AuthLinkCounts | null> {
  const { data: emps, error: e1 } = await supabase.from('employees').select('id').eq('user_id', userId);
  if (e1) {
    console.error('[employeeDeletionUtils] count employees:', e1);
    return null;
  }

  const { data: uas, error: e2 } = await supabase.from('user_agencies').select('id').eq('user_id', userId);
  if (e2) {
    console.error('[employeeDeletionUtils] count user_agencies:', e2);
    return null;
  }

  return { employees: (emps ?? []).length, userAgencies: (uas ?? []).length };
}

export type DeleteAuthResult = { ok: true } | { ok: false; error: string };

export async function invokeDeleteAuthUser(userId: string): Promise<DeleteAuthResult> {
  try {
    const { data, error: fnError } = await supabase.functions.invoke('delete-user', {
      body: { userId },
    });
    if (fnError) {
      console.error('[employeeDeletionUtils] delete-user invoke:', fnError);
      return { ok: false, error: fnError.message || 'Error al invocar delete-user' };
    }
    const body = data as { error?: string } | null;
    if (body && typeof body.error === 'string' && body.error.length > 0) {
      return { ok: false, error: body.error };
    }
    return { ok: true };
  } catch (err) {
    console.error('[employeeDeletionUtils] delete-user:', err);
    return { ok: false, error: err instanceof Error ? err.message : 'Error desconocido' };
  }
}
