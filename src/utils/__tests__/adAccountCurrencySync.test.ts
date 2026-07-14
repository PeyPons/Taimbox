import { describe, expect, it } from 'vitest';
import { normalizeMetaAccountId } from '@/utils/metaAccountId';

describe('normalizeMetaAccountId', () => {
  it('añade prefijo act_ si falta', () => {
    expect(normalizeMetaAccountId('123456')).toBe('act_123456');
    expect(normalizeMetaAccountId('act_123456')).toBe('act_123456');
    expect(normalizeMetaAccountId('  789  ')).toBe('act_789');
  });
});
