import type { AgencyCurrencyCode } from '@/constants/currencies';

/**
 * Tipos USD → moneda (1 USD = X unidades).
 * Respaldo si Frankfurter no responde. Revisar trimestralmente.
 */
export const PUBLIC_PRICING_FX_FALLBACK_USD: Partial<Record<AgencyCurrencyCode, number>> = {
  USD: 1,
  EUR: 0.93,
  GBP: 0.79,
  MXN: 20.0,
  BRL: 5.7,
  CAD: 1.37,
  CHF: 0.87,
  ARS: 1100,
  COP: 4200,
  CLP: 970,
  PEN: 3.75,
  UYU: 39,
};

export function mergePublicPricingRates(
  live: Record<string, number> | undefined,
): Record<string, number> {
  return { ...PUBLIC_PRICING_FX_FALLBACK_USD, USD: 1, ...live };
}
