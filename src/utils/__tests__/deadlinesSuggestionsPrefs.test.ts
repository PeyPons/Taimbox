import { describe, expect, it } from 'vitest';
import {
  defaultDeadlinesSuggestionsPrefs,
  sanitizeDeadlinesSuggestionsPrefs,
} from '@/utils/deadlinesSuggestionsPrefs';

describe('sanitizeDeadlinesSuggestionsPrefs', () => {
  it('limpia exclusión de todos los cedentes cuando hay universo válido', () => {
    const donors = new Set(['a', 'b']);
    const result = sanitizeDeadlinesSuggestionsPrefs(
      {
        ...defaultDeadlinesSuggestionsPrefs(),
        excludedDonorIds: ['a', 'b'],
      },
      { validDonorIds: donors }
    );
    expect(result.excludedDonorIds).toEqual([]);
  });

  it('elimina proyectos incluidos que ya no existen', () => {
    const result = sanitizeDeadlinesSuggestionsPrefs(
      {
        ...defaultDeadlinesSuggestionsPrefs(),
        includedProjectIds: ['p1', 'gone'],
      },
      { validProjectIds: new Set(['p1']) }
    );
    expect(result.includedProjectIds).toEqual(['p1']);
  });
});
