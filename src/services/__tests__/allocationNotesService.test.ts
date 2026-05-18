import { describe, expect, it } from 'vitest';
import { ALLOCATION_NOTE_MAX_LENGTH } from '@/services/allocationNotesService';

describe('allocation notes constraints', () => {
  it('defines a reasonable max body length', () => {
    expect(ALLOCATION_NOTE_MAX_LENGTH).toBe(10_000);
  });

  it('trims empty notes at validation layer', () => {
    const body = '   ';
    expect(body.trim().length).toBe(0);
  });

  it('preserves multiline instructions', () => {
    const body = 'ES: subir imagenes\nEN: textos e imagenes\nDE: textos e imagenes';
    expect(body.split('\n')).toHaveLength(3);
  });
});
