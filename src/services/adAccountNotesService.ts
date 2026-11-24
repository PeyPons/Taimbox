import { supabase } from '@/lib/supabase';

export const AD_ACCOUNT_NOTE_MAX_LENGTH = 4_000;
const NOTES_LIMIT = 50;

export type AdAccountPlatform = 'google' | 'meta';

export interface AdAccountNote {
  id: string;
  agencyId: string;
  platform: AdAccountPlatform;
  accountId: string;
  authorEmployeeId: string | null;
  body: string;
  createdAt: string;
  updatedAt: string;
  authorName?: string;
  authorAvatarUrl?: string | null;
}

interface NoteRow {
  id: string;
  agency_id: string;
  platform: AdAccountPlatform;
  account_id: string;
  author_employee_id: string | null;
  body: string;
  created_at: string;
  updated_at: string;
  author?:
    | { id: string; name: string; avatar_url: string | null }
    | { id: string; name: string; avatar_url: string | null }[]
    | null;
}

export function adAccountNoteWasEdited(createdAt: string, updatedAt: string): boolean {
  const created = new Date(createdAt).getTime();
  const updated = new Date(updatedAt).getTime();
  if (!Number.isFinite(created) || !Number.isFinite(updated)) return false;
  return updated - created > 2000;
}

function mapNote(row: NoteRow): AdAccountNote {
  const author = Array.isArray(row.author) ? row.author[0] : row.author;
  return {
    id: row.id,
    agencyId: row.agency_id,
    platform: row.platform,
    accountId: row.account_id,
    authorEmployeeId: row.author_employee_id,
    body: row.body,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    authorName: author?.name,
    authorAvatarUrl: author?.avatar_url ?? null,
  };
}

export async function fetchAdAccountNotes(
  agencyId: string,
  platform: AdAccountPlatform,
  accountId: string,
): Promise<AdAccountNote[]> {
  const { data, error } = await supabase
    .from('ad_account_notes')
    .select(
      `
      id,
      agency_id,
      platform,
      account_id,
      author_employee_id,
      body,
      created_at,
      updated_at,
      author:employees!ad_account_notes_author_employee_id_fkey (
        id,
        name,
        avatar_url
      )
    `,
    )
    .eq('agency_id', agencyId)
    .eq('platform', platform)
    .eq('account_id', accountId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })
    .limit(NOTES_LIMIT);

  if (error) throw error;
  return (data ?? []).map((row) => mapNote(row as NoteRow));
}

export async function fetchAdAccountNoteCounts(
  agencyId: string,
  platform: AdAccountPlatform,
): Promise<Record<string, number>> {
  const { data, error } = await supabase.rpc('ad_account_note_counts', {
    p_agency_id: agencyId,
    p_platform: platform,
  });
  if (error) throw error;
  const counts: Record<string, number> = {};
  for (const row of (data ?? []) as { account_id: string; note_count: number }[]) {
    counts[row.account_id] = Number(row.note_count) || 0;
  }
  return counts;
}

export async function createAdAccountNote(input: {
  agencyId: string;
  platform: AdAccountPlatform;
  accountId: string;
  authorEmployeeId: string;
  body: string;
}): Promise<AdAccountNote> {
  const body = input.body.trim();
  if (!body) throw new Error('empty note');
  const { data, error } = await supabase
    .from('ad_account_notes')
    .insert({
      agency_id: input.agencyId,
      platform: input.platform,
      account_id: input.accountId,
      author_employee_id: input.authorEmployeeId,
      body,
    })
    .select(
      `
      id,
      agency_id,
      platform,
      account_id,
      author_employee_id,
      body,
      created_at,
      updated_at
    `,
    )
    .single();
  if (error) throw error;
  return mapNote(data as NoteRow);
}

export async function updateAdAccountNote(noteId: string, body: string): Promise<void> {
  const trimmed = body.trim();
  if (!trimmed) throw new Error('empty note');
  const { error } = await supabase
    .from('ad_account_notes')
    .update({ body: trimmed })
    .eq('id', noteId)
    .is('deleted_at', null);
  if (error) throw error;
}

export async function softDeleteAdAccountNote(noteId: string): Promise<void> {
  const { error } = await supabase
    .from('ad_account_notes')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', noteId)
    .is('deleted_at', null);
  if (error) throw error;
}
