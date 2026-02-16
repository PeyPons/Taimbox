import { supabase } from '@/lib/supabase';
import { Deadline } from '@/types';

/** Formato de fila deadlines en Supabase (snake_case) */
interface SupabaseDeadlineRow {
  id: string;
  project_id: string;
  month: string;
  notes?: string;
  employee_hours?: Record<string, number>;
  is_hidden?: boolean;
  budget_override?: number | null;
}

function mapRowToDeadline(d: SupabaseDeadlineRow): Deadline {
  return {
    id: d.id,
    projectId: d.project_id,
    month: d.month,
    notes: d.notes,
    employeeHours: d.employee_hours || {},
    isHidden: d.is_hidden ?? false,
    budgetOverride: d.budget_override ?? undefined
  };
}

/**
 * Carga los deadlines de un mes, opcionalmente filtrados por agencia.
 * Si dos agencias comparten el mismo Supabase, es esencial pasar agencyId
 * para no mezclar datos.
 *
 * @param monthKey - Mes en formato 'YYYY-MM'
 * @param agencyId - ID de la agencia; si se pasa, solo se devuelven deadlines de proyectos de esa agencia
 */
export async function fetchDeadlinesForMonth(
  monthKey: string,
  agencyId: string | undefined
): Promise<{ data: Deadline[]; error: Error | null }> {
  try {
    if (agencyId) {
      const { data, error } = await supabase
        .from('deadlines')
        .select('*, projects!inner(agency_id)')
        .eq('month', monthKey)
        .eq('projects.agency_id', agencyId)
        .order('created_at', { ascending: false });

      if (error) return { data: [], error };
      const rows = (data || []) as (SupabaseDeadlineRow & { projects?: { agency_id: string } })[];
      return { data: rows.map(mapRowToDeadline), error: null };
    }

    // Sin agencyId (ej. demo o compatibilidad): misma query sin filtro de agencia
    const { data, error } = await supabase
      .from('deadlines')
      .select('*')
      .eq('month', monthKey)
      .order('created_at', { ascending: false });

    if (error) return { data: [], error };
    const rows = (data || []) as SupabaseDeadlineRow[];
    return { data: rows.map(mapRowToDeadline), error: null };
  } catch (err) {
    return { data: [], error: err instanceof Error ? err : new Error(String(err)) };
  }
}
