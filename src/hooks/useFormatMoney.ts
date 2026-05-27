import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAgency } from '@/contexts/AgencyContext';
import type { AgencyCurrencyCode } from '@/constants/currencies';
import {
  formatMoneyAmount,
  formatPerHourSuffix,
  getCurrencySymbol,
  localeForAppLanguage,
  resolveAgencyCurrency,
} from '@/utils/currencyUtils';

export function useFormatMoney() {
  const { currentAgency } = useAgency();
  const { i18n } = useTranslation();

  const currency = useMemo(
    () => resolveAgencyCurrency(currentAgency?.settings),
    [currentAgency?.settings],
  );

  const locale = useMemo(() => localeForAppLanguage(i18n.language), [i18n.language]);

  const formatMoney = useCallback(
    (amount: number) => formatMoneyAmount(amount, currency, locale),
    [currency, locale],
  );

  const currencySymbol = useMemo(() => getCurrencySymbol(currency, locale), [currency, locale]);

  const perHourSuffix = useMemo(() => formatPerHourSuffix(currency, locale), [currency, locale]);

  const formatPerHour = useCallback(
    (amount: number, decimals = 2) => {
      const v = Number.isFinite(amount) ? amount : 0;
      const n = decimals <= 0 ? String(Math.round(v)) : v.toFixed(decimals);
      return `${n} ${perHourSuffix}`;
    },
    [perHourSuffix],
  );

  /** Etiqueta tipo «(€)» o «($)» para cabeceras de tabla. */
  const inCurrencyParens = useMemo(() => `(${currencySymbol})`, [currencySymbol]);

  return {
    currency: currency as AgencyCurrencyCode,
    locale,
    formatMoney,
    formatPerHour,
    currencySymbol,
    perHourSuffix,
    inCurrencyParens,
  };
}
