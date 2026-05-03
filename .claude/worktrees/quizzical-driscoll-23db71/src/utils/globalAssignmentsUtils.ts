import { supabase } from '@/lib/supabase';
import type { GlobalAssignment } from '@/types';

interface SupabaseGlobalAssignmentRow {
  id: string;
  month: string;
  name: string;
  hours: number;
  affects_all: boolean;
  affected_employee_ids?: string[];
  employee_id?: string;
  created_by?: string;
}

/**
 * Carga asignaciones globales de Deadlines para un mes y agencia.
 */
export async function fetchGlobalAssignmentsForMonth(
  monthKey: string,
  agencyId: string | undefined
): Promise<{ data: GlobalAssignment[]; error: Error | null }> {
  try {
    if (!agencyId) {
      return { data: [], error: null };
    }
    const { data, error } = await supabase
      .from('global_assignments')
      .select('*')
      .eq('month', monthKey)
      .eq('agency_id', agencyId)
      .order('created_at', { ascending: false });

    if (error) return { data: [], error };

    const mapped =
      (data as SupabaseGlobalAssignmentRow[] | null)?.map((g) => ({
        id: g.id,
        month: g.month,
        name: g.name,
        hours: Number(g.hours),
        affectsAll: g.affects_all,
        affectedEmployeeIds: (g.affected_employee_ids || []) as string[],
        employeeId: g.employee_id || g.created_by,
      })) ?? [];

    return { data: mapped, error: null };
  } catch (err) {
    return { data: [], error: err instanceof Error ? err : new Error(String(err)) };
  }
}
