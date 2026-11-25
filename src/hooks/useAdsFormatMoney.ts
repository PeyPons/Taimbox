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

/** Moneda única de un conjunto de cuentas. Null si falta o si hay más de una. */
export function sharedCurrencyForAccountIds(
  accountIds: string[],
  currencyByAccountId: Map<string, string>,
): string | null {
  const codes = new Set<string>();
  for (const id of accountIds) {
    const currency = resolveCurrencyForClientId(id, currencyByAccountId);
    if (currency) codes.add(currency);
  }
  if (codes.size !== 1) return null;
  return [...codes][0];
}

/** Monedas distintas entre varias cuentas (ids de ad_accounts_config). */
export function hasMixedCurrenciesForAccountIds(
  accountIds: string[],
  currencyByAccountId: Map<string, string>,
): boolean {
  const codes = new Set<string>();
  for (const id of accountIds) {
    const currency = resolveCurrencyForClientId(id, currencyByAccountId);
    if (currency) codes.add(currency);
  }
  return codes.size > 1;
}

/**
 * Moneda a mostrar. Un grupo (GROUP-…) no tiene divisa propia: usa la de sus
 * cuentas si todas coinciden. Si hay varias, no se elige una.
 */
export function resolveAdsDisplayCurrency(
  clientId: string | undefined,
  relatedAccountIds: string[] | undefined,
  currencyByAccountId: Map<string, string>,
): string | null {
  const related = relatedAccountIds ?? [];
  if (related.length > 0 && hasMixedCurrenciesForAccountIds(related, currencyByAccountId)) {
    return null;
  }
  if (clientId) {
    const direct = resolveCurrencyForClientId(clientId, currencyByAccountId);
    if (direct) return direct;
  }
  if (related.length > 0) return sharedCurrencyForAccountIds(related, currencyByAccountId);
  return null;
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

  const hasMixedCurrencies = useMemo(() => {
    const set = new Set(currencyByAccountId.values());
    return set.size > 1;
  }, [currencyByAccountId]);

  const mixedCurrenciesLabel = useMemo(
    () => t('ads.stats.mixedCurrenciesShort', 'Varias monedas'),
    [t],
  );

  const formatMoney = useCallback(
    (amount: number, clientId?: string, relatedAccountIds?: string[]) => {
      let currency = resolveAdsDisplayCurrency(clientId, relatedAccountIds, currencyByAccountId);
      if (!currency && !clientId && !relatedAccountIds?.length && !hasMixedCurrencies && currencyByAccountId.size > 0) {
        currency = [...currencyByAccountId.values()][0];
      }
      if (!currency) return formatPlainAmount(amount, locale);
      return formatMoneyAmount(amount, currency, locale);
    },
    [currencyByAccountId, hasMixedCurrencies, locale],
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
      const currency = resolveAdsDisplayCurrency(clientId, relatedAccountIds, currencyByAccountId);
      if (!currency) return '';
      return getCurrencySymbol(currency, locale);
    },
    [currencyByAccountId, locale, mixedCurrenciesLabel],
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
