import type { AgencyCurrencyCode } from '@/constants/currencies';

/**
 * Tipos EUR → moneda (1 EUR = X unidades).
 * Respaldo offline si Frankfurter no responde o no publica la divisa (p. ej. ARS).
 * Revisar trimestralmente; fuente orientativa: BCE / mercado spot.
 * Última revisión: 2026-05.
 */
export const PUBLIC_PRICING_FX_FALLBACK_EUR: Partial<Record<AgencyCurrencyCode, number>> = {
  EUR: 1,
  USD: 1.08,
  GBP: 0.85,
  MXN: 21.4,
  BRL: 6.15,
  CAD: 1.48,
  CHF: 0.94,
  ARS: 1180,
  COP: 4550,
  CLP: 1050,
  PEN: 4.05,
  UYU: 42.5,
};

export function mergePublicPricingRates(
  live: Record<string, number> | undefined,
): Record<string, number> {
  return { ...PUBLIC_PRICING_FX_FALLBACK_EUR, EUR: 1, ...live };
}
