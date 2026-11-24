import { describe, expect, it } from 'vitest';
import { AD_ACCOUNT_NOTE_MAX_LENGTH, adAccountNoteWasEdited } from '@/services/adAccountNotesService';

describe('ad account notes', () => {
  it('keeps the body under the database limit', () => {
    expect(AD_ACCOUNT_NOTE_MAX_LENGTH).toBe(4000);
  });

  it('marks a note as edited only after the body changes later', () => {
    const created = '2026-11-24T10:00:00.000Z';
    expect(adAccountNoteWasEdited(created, '2026-11-24T10:00:01.000Z')).toBe(false);
    expect(adAccountNoteWasEdited(created, '2026-11-24T10:05:00.000Z')).toBe(true);
  });
});
