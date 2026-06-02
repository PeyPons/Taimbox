import {
  AGENCY_CURRENCY_CODES,
  DEFAULT_AGENCY_CURRENCY,
  type AgencyCurrencyCode,
  isAgencyCurrencyCode,
} from '@/constants/currencies';
import type { AgencySettings } from '@/types';

export function resolveAgencyCurrency(settings: AgencySettings | undefined | null): AgencyCurrencyCode {
  const raw = settings?.currency;
  return isAgencyCurrencyCode(raw) ? raw : DEFAULT_AGENCY_CURRENCY;
}

/** Moneda de una cuenta Ads (Meta/Google); cae a la de la agencia si la plataforma devuelve otra no soportada. */
export function resolveAdAccountCurrency(
  accountCurrency: string | null | undefined,
  agencySettings?: AgencySettings | null,
): AgencyCurrencyCode {
  if (isAgencyCurrencyCode(accountCurrency)) return accountCurrency;
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
  currency: AgencyCurrencyCode = DEFAULT_AGENCY_CURRENCY,
  locale = 'es-ES',
): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(safe);
}

export function getCurrencySymbol(currency: AgencyCurrencyCode, locale = 'es-ES'): string {
  const parts = new Intl.NumberFormat(locale, { style: 'currency', currency }).formatToParts(0);
  return parts.find((p) => p.type === 'currency')?.value?.trim() ?? currency;
}

/** Sufijo para precio hora: "USD/h" o "€/h" según moneda. */
export function formatPerHourSuffix(currency: AgencyCurrencyCode, locale = 'es-ES'): string {
  const symbol = getCurrencySymbol(currency, locale);
  return `${symbol}/h`;
}

export { AGENCY_CURRENCY_CODES, DEFAULT_AGENCY_CURRENCY };
