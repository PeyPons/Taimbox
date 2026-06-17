import {
  AGENCY_CURRENCY_CODES,
  DEFAULT_AGENCY_CURRENCY,
  normalizeIsoCurrencyCode,
  type AgencyCurrencyCode,
  isAgencyCurrencyCode,
} from '@/constants/currencies';
import type { AgencySettings } from '@/types';

export function resolveAgencyCurrency(settings: AgencySettings | undefined | null): AgencyCurrencyCode {
  const raw = settings?.currency;
  return isAgencyCurrencyCode(raw) ? raw : DEFAULT_AGENCY_CURRENCY;
}

/** Moneda importada de Meta/Google; null si la plataforma no devolvió código válido. */
export function resolvePlatformAdAccountCurrency(
  accountCurrency: string | null | undefined,
): string | null {
  return normalizeIsoCurrencyCode(accountCurrency);
}

/** Moneda de cuenta Ads con fallback a la agencia (solo fuera de Monitor PPC). */
export function resolveAdAccountCurrency(
  accountCurrency: string | null | undefined,
  agencySettings?: AgencySettings | null,
): string {
  const platform = resolvePlatformAdAccountCurrency(accountCurrency);
  if (platform) return platform;
  return resolveAgencyCurrency(agencySettings);
}

/** Locale BCP 47 para formatear números según idioma de la UI. */
export function localeForAppLanguage(language: string | undefined): string {
  if (!language) return 'es-ES';
  if (language.startsWith('en')) return 'en-US';
  if (language.startsWith('es')) return 'es-ES';
  return language;
}

export function formatMoneyAmount(
  amount: number,
  currency: AgencyCurrencyCode | string = DEFAULT_AGENCY_CURRENCY,
  locale = 'es-ES',
): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  const code = normalizeIsoCurrencyCode(currency) ?? (isAgencyCurrencyCode(currency) ? currency : DEFAULT_AGENCY_CURRENCY);
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: code,
    maximumFractionDigits: 2,
  }).format(safe);
}

export function getCurrencySymbol(currency: AgencyCurrencyCode | string, locale = 'es-ES'): string {
  const code = normalizeIsoCurrencyCode(currency) ?? (isAgencyCurrencyCode(currency) ? currency : DEFAULT_AGENCY_CURRENCY);
  const parts = new Intl.NumberFormat(locale, { style: 'currency', currency: code }).formatToParts(0);
  return parts.find((p) => p.type === 'currency')?.value?.trim() ?? code;
}

/** Sufijo para precio hora: "USD/h" o "€/h" según moneda. */
export function formatPerHourSuffix(currency: AgencyCurrencyCode, locale = 'es-ES'): string {
  const symbol = getCurrencySymbol(currency, locale);
  return `${symbol}/h`;
}

export { AGENCY_CURRENCY_CODES, DEFAULT_AGENCY_CURRENCY };
