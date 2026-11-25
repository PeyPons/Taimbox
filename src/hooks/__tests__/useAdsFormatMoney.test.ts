import { describe, expect, it } from 'vitest';
import { formatMoneyAmount, getCurrencySymbol } from '@/utils/currencyUtils';
import {
  hasMixedCurrenciesForAccountIds,
  resolveAdsDisplayCurrency,
  sharedCurrencyForAccountIds,
} from '@/hooks/useAdsFormatMoney';

const currencies = new Map<string, string>([
  ['act_111', 'EUR'],
  ['act_222', 'EUR'],
  ['123-456-7890', 'USD'],
]);

describe('resolveAdsDisplayCurrency', () => {
  it('usa el euro de las cuentas del grupo cuando todas coinciden', () => {
    const currency = resolveAdsDisplayCurrency('GROUP-Inserhotel', ['act_111', 'act_222'], currencies);
    expect(currency).toBe('EUR');
    expect(getCurrencySymbol('EUR', 'es-ES')).toBe('€');
    expect(formatMoneyAmount(806, 'EUR', 'es-ES')).toContain('€');
    expect(formatMoneyAmount(389.91, 'EUR', 'es-ES')).toContain('€');
  });

  it('no elige símbolo si el grupo mezcla divisas', () => {
    expect(resolveAdsDisplayCurrency('GROUP-Mixto', ['act_111', '123-456-7890'], currencies)).toBeNull();
    expect(hasMixedCurrenciesForAccountIds(['act_111', '123-456-7890'], currencies)).toBe(true);
  });

  it('resuelve la cuenta suelta y la subcuenta segmentada', () => {
    expect(resolveAdsDisplayCurrency('act_111', ['act_111'], currencies)).toBe('EUR');
    expect(sharedCurrencyForAccountIds(['act_111_HOTEL'], currencies)).toBe('EUR');
  });
});
