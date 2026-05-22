import { describe, it, expect } from 'vitest';
import { INPUT_LIMITS as frontendLimits } from '@/constants/inputLimits';
import { INPUT_LIMITS as edgeLimits } from '../../../supabase/functions/_shared/input-limits';

/**
 * Evita divergencia entre validación en cliente (Zod/maxLength) y Edge Functions.
 * Si falla, alinear `src/constants/inputLimits.ts` y `supabase/functions/_shared/input-limits.ts`.
 */
describe('INPUT_LIMITS contrato frontend ↔ Edge', () => {
  it('coinciden todas las claves y valores numéricos', () => {
    expect(Object.keys(frontendLimits).sort()).toEqual(Object.keys(edgeLimits).sort());
    for (const key of Object.keys(frontendLimits) as (keyof typeof frontendLimits)[]) {
      expect(frontendLimits[key]).toBe(edgeLimits[key]);
    }
  });
});
