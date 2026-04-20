import { describe, it, expect } from 'vitest';
import { parseDeliverableContractFeeInput } from '@/utils/deliverableProjectFields';

describe('parseDeliverableContractFeeInput', () => {
  it('devuelve null para vacío o solo espacios', () => {
    expect(parseDeliverableContractFeeInput(undefined)).toBeNull();
    expect(parseDeliverableContractFeeInput('')).toBeNull();
    expect(parseDeliverableContractFeeInput('   ')).toBeNull();
  });

  it('acepta coma como separador decimal (sin miles mezclados)', () => {
    expect(parseDeliverableContractFeeInput('1234,56')).toBeCloseTo(1234.56, 2);
    expect(parseDeliverableContractFeeInput('12,5')).toBe(12.5);
  });

  it('acepta punto decimal', () => {
    expect(parseDeliverableContractFeeInput('3100.50')).toBe(3100.5);
  });

  it('rechaza negativos y no numéricos', () => {
    expect(parseDeliverableContractFeeInput('-10')).toBeNull();
    expect(parseDeliverableContractFeeInput('abc')).toBeNull();
  });
});
