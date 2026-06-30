import { supabase } from '@/lib/supabase';
import type { AllocationNote, AllocationNoteSource } from '@/types';

const NOTES_LIMIT = 50;
/** PostgREST/nginx rechazan URLs con `in.(…)` muy largas (502 → el navegador muestra CORS). */
const ALLOCATION_IDS_IN_BATCH_SIZE = 50;
export const ALLOCATION_NOTE_MAX_LENGTH = 10_000;

function chunkAllocationIds(ids: string[]): string[][] {
  const unique = [...new Set(ids)];
  const chunks: string[][] = [];
  for (let i = 0; i < unique.length; i += ALLOCATION_IDS_IN_BATCH_SIZE) {
    chunks.push(unique.slice(i, i + ALLOCATION_IDS_IN_BATCH_SIZE));
  }
  return chunks;
}

interface SupabaseAllocationNoteRow {
  id: string;
  allocation_id: string;
  agency_id: string;
  author_employee_id: string | null;
  body: string;
  source: AllocationNoteSource;
  created_at: string;
  deleted_at: string | null;
  author?: { id: string; name: string; avatar_url: string | null } | null;
}

function mapNote(row: SupabaseAllocationNoteRow): AllocationNote {
  return {
    id: row.id,
    allocationId: row.allocation_id,
    agencyId: row.agency_id,
    authorEmployeeId: row.author_employee_id,
    body: row.body,
    source: row.source,
    createdAt: row.created_at,
    deletedAt: row.deleted_at,
    authorName: row.author?.name,
    authorAvatarUrl: row.author?.avatar_url ?? null,
  };
}

export async function fetchAllocationNotes(allocationId: string): Promise<AllocationNote[]> {
  const { data, error } = await supabase
    .from('allocation_notes')
    .select(
      `
      id,
      allocation_id,
      agency_id,
      author_employee_id,
      body,
      source,
      created_at,
      deleted_at,
      author:employees!allocation_notes_author_employee_id_fkey (
        id,
        name,
        avatar_url
      )
    `
    )
    .eq('allocation_id', allocationId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })
    .limit(NOTES_LIMIT);

  if (error) throw error;
  return (data ?? []).map(row => mapNote(row as SupabaseAllocationNoteRow));
}

export async function fetchAllocationNoteCounts(
  allocationIds: string[],
  agencyId?: string,
): Promise<Record<string, number>> {
  if (allocationIds.length === 0) return {};

  const counts: Record<string, number> = {};
  for (const id of allocationIds) counts[id] = 0;

  for (const chunk of chunkAllocationIds(allocationIds)) {
    let query = supabase
      .from('allocation_notes')
      .select('allocation_id')
      .in('allocation_id', chunk)
      .is('deleted_at', null);

    if (agencyId) {
      query = query.eq('agency_id', agencyId);
    }

    const { data, error } = await query;
    if (error) throw error;

    for (const row of data ?? []) {
      const key = row.allocation_id as string;
      counts[key] = (counts[key] ?? 0) + 1;
    }
  }

  return counts;
}

export async function fetchAllocationNotesForIds(allocationIds: string[]): Promise<AllocationNote[]> {
  if (allocationIds.length === 0) return [];

  const notes: AllocationNote[] = [];

  for (const chunk of chunkAllocationIds(allocationIds)) {
    const { data, error } = await supabase
      .from('allocation_notes')
      .select(
        `
      id,
      allocation_id,
      agency_id,
      author_employee_id,
      body,
      source,
      created_at,
      deleted_at,
      author:employees!allocation_notes_author_employee_id_fkey (
        id,
        name,
        avatar_url
      )
    `
      )
      .in('allocation_id', chunk)
      .is('deleted_at', null)
      .order('created_at', { ascending: true });

    if (error) throw error;
    notes.push(...(data ?? []).map(row => mapNote(row as SupabaseAllocationNoteRow)));
  }

  return notes.sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

export async function createAllocationNote(params: {
  allocationId: string;
  agencyId: string;
  authorEmployeeId: string;
  body: string;
}): Promise<AllocationNote> {
  const trimmed = params.body.trim();
  if (!trimmed) throw new Error('La anotación no puede estar vacía');
  if (trimmed.length > ALLOCATION_NOTE_MAX_LENGTH) {
    throw new Error(`La anotación no puede superar ${ALLOCATION_NOTE_MAX_LENGTH} caracteres`);
  }

  const { data, error } = await supabase
    .from('allocation_notes')
    .insert({
      allocation_id: params.allocationId,
      agency_id: params.agencyId,
      author_employee_id: params.authorEmployeeId,
      body: trimmed,
      source: 'user',
    })
    .select(
      `
      id,
      allocation_id,
      agency_id,
      author_employee_id,
      body,
      source,
      created_at,
      deleted_at,
      author:employees!allocation_notes_author_employee_id_fkey (
        id,
        name,
        avatar_url
      )
    `
    )
    .single();

  if (error) throw error;
  return mapNote(data as SupabaseAllocationNoteRow);
}

export async function softDeleteAllocationNote(noteId: string): Promise<void> {
  const { error } = await supabase
    .from('allocation_notes')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', noteId)
    .is('deleted_at', null);

  if (error) throw error;
}

export async function copyAllocationNotes(fromAllocationId: string, toAllocationId: string): Promise<number> {
  const { data, error } = await supabase.rpc('copy_allocation_notes', {
    p_from: fromAllocationId,
    p_to: toAllocationId,
    p_source: 'system_copy',
  });

  if (error) throw error;
  return typeof data === 'number' ? data : 0;
}

/** Búsqueda ligera: allocation_ids que tienen notas cuyo body coincide (ilike). */
export async function searchAllocationIdsByNoteBody(
  allocationIds: string[],
  needle: string,
  agencyId?: string,
): Promise<Set<string>> {
  const q = needle.trim().toLowerCase();
  if (!q || allocationIds.length === 0) return new Set();

  const hits = new Set<string>();

  for (const chunk of chunkAllocationIds(allocationIds)) {
    let query = supabase
      .from('allocation_notes')
      .select('allocation_id, body')
      .in('allocation_id', chunk)
      .is('deleted_at', null);

    if (agencyId) {
      query = query.eq('agency_id', agencyId);
    }

    const { data, error } = await query;
    if (error) throw error;

    for (const row of data ?? []) {
      const body = String(row.body ?? '').toLowerCase();
      if (body.includes(q)) hits.add(row.allocation_id as string);
    }
  }

  return hits;
}
