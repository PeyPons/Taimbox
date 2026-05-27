import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  AGENCY_CURRENCY_OPTIONS,
  type AgencyCurrencyCode,
  isAgencyCurrencyCode,
} from '@/constants/currencies';
import {
  DEFAULT_LANDING_PRICING_CURRENCY,
  LANDING_PRICING_CURRENCIES,
  LANDING_PRICING_CURRENCY_STORAGE_KEY,
} from '@/config/publicPricing';
import { mergePublicPricingRates } from '@/config/publicPricingFxFallback';
import { localeForAppLanguage } from '@/utils/currencyUtils';

const RATES_CACHE_KEY = 'taimbox-landing-fx-rates-v2';
const RATES_TTL_MS = 24 * 60 * 60 * 1000;
const FRANKFURTER_URL = 'https://api.frankfurter.app/latest';

type RatesCache = {
  fetchedAt: number;
  rates: Record<string, number>;
  live: boolean;
};

function readStoredCurrency(): AgencyCurrencyCode {
  try {
    const raw = localStorage.getItem(LANDING_PRICING_CURRENCY_STORAGE_KEY);
    return isAgencyCurrencyCode(raw) ? raw : DEFAULT_LANDING_PRICING_CURRENCY;
  } catch {
    return DEFAULT_LANDING_PRICING_CURRENCY;
  }
}

function readRatesCache(): RatesCache | null {
  try {
    const raw = sessionStorage.getItem(RATES_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RatesCache;
    if (!parsed?.rates || typeof parsed.fetchedAt !== 'number') return null;
    if (Date.now() - parsed.fetchedAt > RATES_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeRatesCache(rates: Record<string, number>, live: boolean): void {
  try {
    const payload: RatesCache = { fetchedAt: Date.now(), rates, live };
    sessionStorage.setItem(RATES_CACHE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}

function fractionDigitsFor(currency: AgencyCurrencyCode): number {
  return currency === 'CLP' || currency === 'PYG' || currency === 'COP' || currency === 'UYU' ? 0 : 2;
}

async function fetchFrankfurterRates(signal: AbortSignal): Promise<Record<string, number> | null> {
  const targets = LANDING_PRICING_CURRENCIES.filter((c) => c !== 'EUR').join(',');
  const res = await fetch(`${FRANKFURTER_URL}?from=EUR&to=${targets}`, { signal });
  if (!res.ok) return null;
  const data = (await res.json()) as { rates?: Record<string, number> };
  if (!data.rates) return null;
  return data.rates;
}

export function usePublicPricingCurrency() {
  const { i18n, t } = useTranslation('landing');
  const locale = localeForAppLanguage(i18n.language);
  const [currency, setCurrencyState] = useState<AgencyCurrencyCode>(readStoredCurrency);
  const [rates, setRates] = useState<Record<string, number>>(() =>
    mergePublicPricingRates(readRatesCache()?.rates),
  );
  const [ratesLoading, setRatesLoading] = useState(false);

  const setCurrency = useCallback((code: AgencyCurrencyCode) => {
    setCurrencyState(code);
    try {
      localStorage.setItem(LANDING_PRICING_CURRENCY_STORAGE_KEY, code);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const cached = readRatesCache();
    if (cached) {
      setRates(mergePublicPricingRates(cached.rates));
      return;
    }

    const controller = new AbortController();
    setRatesLoading(true);

    fetchFrankfurterRates(controller.signal)
      .then((live) => {
        const merged = mergePublicPricingRates(live ?? undefined);
        setRates(merged);
        writeRatesCache(merged, live != null);
      })
      .catch(() => {
        const merged = mergePublicPricingRates(undefined);
        setRates(merged);
        writeRatesCache(merged, false);
      })
      .finally(() => setRatesLoading(false));

    return () => controller.abort();
  }, []);

  const convertEur = useCallback(
    (eur: number): number => {
      if (currency === 'EUR') return eur;
      const rate = rates[currency];
      if (!rate || !Number.isFinite(rate)) return eur;
      return eur * rate;
    },
    [currency, rates],
  );

  const formatEurAmount = useCallback(
    (eur: number, opts?: { compact?: boolean }): string => {
      const amount = convertEur(eur);
      const digits = opts?.compact ? 0 : fractionDigitsFor(currency);
      const safe = Number.isFinite(amount) ? amount : 0;
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        maximumFractionDigits: digits,
        minimumFractionDigits: digits === 0 ? 0 : undefined,
      }).format(safe);
    },
    [convertEur, currency, locale],
  );

  const formatMonthly = useCallback((eur: number) => formatEurAmount(eur), [formatEurAmount]);

  const formatMonthlyWithPeriod = useCallback(
    (eur: number, periodLabel: string) => {
      if (eur === 0) return formatEurAmount(0);
      return `${formatEurAmount(eur)} / ${periodLabel}`;
    },
    [formatEurAmount],
  );

  const currencyOptions = useMemo(
    () =>
      LANDING_PRICING_CURRENCIES.filter((code) => rates[code] != null).map((code) => {
        const meta = AGENCY_CURRENCY_OPTIONS.find((o) => o.value === code);
        const label = i18n.language.startsWith('en') ? meta?.labelEn : meta?.labelEs;
        return { value: code, label: label ?? code };
      }),
    [i18n.language, rates],
  );

  const billingNote = useMemo(() => {
    if (currency === 'USD') return t('pricing.currencyBillingUsd');
    if (currency === 'EUR') return t('pricing.currencyBillingEur');
    return t('pricing.currencyBillingConverted', { currency });
  }, [currency, t]);

  return {
    currency,
    setCurrency,
    currencyOptions,
    ratesLoading,
    formatEurAmount,
    formatMonthly,
    formatMonthlyWithPeriod,
    locale,
    billingNote,
    isEur: currency === 'EUR',
  };
}
