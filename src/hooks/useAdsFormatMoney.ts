import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  formatMoneyAmount,
  getCurrencySymbol,
  localeForAppLanguage,
  resolvePlatformAdAccountCurrency,
} from '@/utils/currencyUtils';

export type AdAccountCurrencySource = {
  account_id: string;
  currency?: string | null;
};

function normalizeAccountId(id: string): string {
  return id ? id.trim() : '';
}

function formatPlainAmount(amount: number, locale: string): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  return safe.toLocaleString(locale, { maximumFractionDigits: 2, minimumFractionDigits: 2 });
}

/** Resuelve la moneda de plataforma de un client_id (cuenta o subcuenta segmentada). */
export function resolveCurrencyForClientId(
  clientId: string,
  currencyByAccountId: Map<string, string>,
): string | null {
  const normalized = normalizeAccountId(clientId);
  for (const [accountId, currency] of currencyByAccountId) {
    const normAccount = normalizeAccountId(accountId);
    if (normalized === normAccount || normalized.startsWith(`${normAccount}_`)) {
      return currency;
    }
  }
  return null;
}

/** Monedas distintas entre varias cuentas (ids de ad_accounts_config). */
export function hasMixedCurrenciesForAccountIds(
  accountIds: string[],
  currencyByAccountId: Map<string, string>,
): boolean {
  const codes = new Set<string>();
  for (const id of accountIds) {
    const norm = normalizeAccountId(id);
    const direct = currencyByAccountId.get(norm);
    if (direct) codes.add(direct);
    for (const [accountId, currency] of currencyByAccountId) {
      if (norm === normalizeAccountId(accountId) || norm.startsWith(`${normalizeAccountId(accountId)}_`)) {
        codes.add(currency);
      }
    }
  }
  return codes.size > 1;
}

/**
 * Formateo monetario para Monitor PPC: moneda importada de cada cuenta (Meta/Google),
 * no la moneda elegida en configuración general de la agencia.
 */
export function useAdsFormatMoney(accounts: AdAccountCurrencySource[]) {
  const { i18n, t } = useTranslation('app');

  const locale = useMemo(() => localeForAppLanguage(i18n.language), [i18n.language]);

  const currencyByAccountId = useMemo(() => {
    const map = new Map<string, string>();
    for (const acc of accounts) {
      const platform = resolvePlatformAdAccountCurrency(acc.currency);
      if (platform) {
        map.set(normalizeAccountId(acc.account_id), platform);
      }
    }
    return map;
  }, [accounts]);

  const resolveClientCurrency = useCallback(
    (clientId: string) => resolveCurrencyForClientId(clientId, currencyByAccountId),
    [currencyByAccountId],
  );

  const hasMixedCurrencies = useMemo(() => {
    const set = new Set(currencyByAccountId.values());
    return set.size > 1;
  }, [currencyByAccountId]);

  const mixedCurrenciesLabel = useMemo(
    () => t('ads.stats.mixedCurrenciesShort', 'Varias monedas'),
    [t],
  );

  const formatMoney = useCallback(
    (amount: number, clientId?: string) => {
      let currency: string | null = null;
      if (clientId) {
        currency = resolveClientCurrency(clientId);
      } else if (!hasMixedCurrencies && currencyByAccountId.size > 0) {
        currency = [...currencyByAccountId.values()][0];
      }
      if (!currency) return formatPlainAmount(amount, locale);
      return formatMoneyAmount(amount, currency, locale);
    },
    [resolveClientCurrency, currencyByAccountId, hasMixedCurrencies, locale],
  );

  /** Totales agregados: no mezclar importes si hay cuentas en distintas divisas. */
  const formatGlobalMoney = useCallback(
    (amount: number) => {
      if (hasMixedCurrencies) return mixedCurrenciesLabel;
      if (currencyByAccountId.size === 0) return formatPlainAmount(amount, locale);
      return formatMoney(amount);
    },
    [hasMixedCurrencies, mixedCurrenciesLabel, currencyByAccountId.size, formatMoney, locale],
  );

  const currencySymbolForClient = useCallback(
    (clientId: string, relatedAccountIds?: string[]) => {
      if (relatedAccountIds?.length && hasMixedCurrenciesForAccountIds(relatedAccountIds, currencyByAccountId)) {
        return mixedCurrenciesLabel;
      }
      const currency = resolveClientCurrency(clientId);
      if (!currency) return '';
      return getCurrencySymbol(currency, locale);
    },
    [resolveClientCurrency, currencyByAccountId, locale, mixedCurrenciesLabel],
  );

  const primaryCurrency = useMemo(() => {
    const values = [...currencyByAccountId.values()];
    if (values.length === 0) return null;
    return values[0];
  }, [currencyByAccountId]);

  const primaryCurrencySymbol = useMemo(
    () => (primaryCurrency ? getCurrencySymbol(primaryCurrency, locale) : ''),
    [primaryCurrency, locale],
  );

  return {
    formatMoney,
    formatMoneyForClient: formatMoney,
    formatGlobalMoney,
    currencySymbolForClient,
    primaryCurrencySymbol,
    primaryCurrency,
    hasMixedCurrencies,
    mixedCurrenciesLabel,
  };
}
