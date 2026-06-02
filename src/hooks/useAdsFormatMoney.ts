import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAgency } from '@/contexts/AgencyContext';
import type { AgencyCurrencyCode } from '@/constants/currencies';
import {
  formatMoneyAmount,
  getCurrencySymbol,
  localeForAppLanguage,
  resolveAdAccountCurrency,
  resolveAgencyCurrency,
} from '@/utils/currencyUtils';

export type AdAccountCurrencySource = {
  account_id: string;
  currency?: string | null;
};

function normalizeAccountId(id: string): string {
  return id ? id.trim() : '';
}

/** Resuelve la moneda de un client_id (cuenta o subcuenta segmentada). */
export function resolveCurrencyForClientId(
  clientId: string,
  currencyByAccountId: Map<string, AgencyCurrencyCode>,
  agencyCurrency: AgencyCurrencyCode,
): AgencyCurrencyCode {
  const normalized = normalizeAccountId(clientId);
  for (const [accountId, currency] of currencyByAccountId) {
    const normAccount = normalizeAccountId(accountId);
    if (normalized === normAccount || normalized.startsWith(`${normAccount}_`)) {
      return currency;
    }
  }
  return agencyCurrency;
}

/**
 * Formateo monetario para Monitor PPC: usa la moneda importada de cada cuenta Ads,
 * no la moneda configurada en la agencia.
 */
export function useAdsFormatMoney(accounts: AdAccountCurrencySource[]) {
  const { currentAgency } = useAgency();
  const { i18n } = useTranslation();

  const agencyCurrency = useMemo(
    () => resolveAgencyCurrency(currentAgency?.settings),
    [currentAgency?.settings],
  );

  const locale = useMemo(() => localeForAppLanguage(i18n.language), [i18n.language]);

  const currencyByAccountId = useMemo(() => {
    const map = new Map<string, AgencyCurrencyCode>();
    for (const acc of accounts) {
      map.set(
        normalizeAccountId(acc.account_id),
        resolveAdAccountCurrency(acc.currency, currentAgency?.settings),
      );
    }
    return map;
  }, [accounts, currentAgency?.settings]);

  const resolveClientCurrency = useCallback(
    (clientId: string) =>
      resolveCurrencyForClientId(clientId, currencyByAccountId, agencyCurrency),
    [currencyByAccountId, agencyCurrency],
  );

  const formatMoney = useCallback(
    (amount: number, clientId?: string) => {
      let currency: AgencyCurrencyCode;
      if (clientId) {
        currency = resolveClientCurrency(clientId);
      } else if (currencyByAccountId.size > 0) {
        currency = [...currencyByAccountId.values()][0];
      } else {
        currency = agencyCurrency;
      }
      return formatMoneyAmount(amount, currency, locale);
    },
    [resolveClientCurrency, currencyByAccountId, agencyCurrency, locale],
  );

  const currencySymbolForClient = useCallback(
    (clientId: string) => getCurrencySymbol(resolveClientCurrency(clientId), locale),
    [resolveClientCurrency, locale],
  );

  const primaryCurrency = useMemo(() => {
    const values = [...currencyByAccountId.values()];
    if (values.length === 0) return agencyCurrency;
    return values[0];
  }, [currencyByAccountId, agencyCurrency]);

  const primaryCurrencySymbol = useMemo(
    () => getCurrencySymbol(primaryCurrency, locale),
    [primaryCurrency, locale],
  );

  const hasMixedCurrencies = useMemo(() => {
    const set = new Set(currencyByAccountId.values());
    return set.size > 1;
  }, [currencyByAccountId]);

  return {
    formatMoney,
    formatMoneyForClient: formatMoney,
    currencySymbolForClient,
    primaryCurrencySymbol,
    primaryCurrency,
    hasMixedCurrencies,
    agencyCurrency,
  };
}
