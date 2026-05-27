import type { AgencyCurrencyCode } from '@/constants/currencies';

/** Planes mostrados en home (s07) y /precios — alineados con Stripe en EUR. */
export type PublicPlanId = 'starter' | 'pro' | 'business' | 'enterprise';

export interface PublicPlanPricing {
  id: PublicPlanId;
  /** Precio mensual en EUR; null = tarifa a medida (Enterprise). */
  eurMonthly: number | null;
  /** Tarifa oficial antes del descuento early adopter. */
  eurMonthlyOfficial?: number;
  recommended?: boolean;
  /** Tarjeta destacada en la home (fondo oscuro). */
  featuredOnHome?: boolean;
  href: string;
  mailtoSubjectKey?: 'enterpriseMailSubject';
}

export const PUBLIC_PLAN_PRICING: PublicPlanPricing[] = [
  {
    id: 'starter',
    eurMonthly: 0,
    href: '/login?tab=register',
  },
  {
    id: 'pro',
    eurMonthly: 49,
    eurMonthlyOfficial: 99,
    featuredOnHome: true,
    href: '/login?tab=register',
  },
  {
    id: 'business',
    eurMonthly: 149,
    eurMonthlyOfficial: 249,
    recommended: true,
    href: '/login?tab=register',
  },
  {
    id: 'enterprise',
    eurMonthly: null,
    href: '/contacto',
    mailtoSubjectKey: 'enterpriseMailSubject',
  },
];

/** Moneda por defecto en home y /precios (cobro real sigue en EUR vía Stripe). */
export const DEFAULT_LANDING_PRICING_CURRENCY: AgencyCurrencyCode = 'USD';

/** Monedas del selector en páginas públicas (precios base en EUR, visualización convertida). */
export const LANDING_PRICING_CURRENCIES: readonly AgencyCurrencyCode[] = [
  'USD',
  'EUR',
  'GBP',
  'MXN',
  'BRL',
  'CAD',
  'CHF',
  'ARS',
  'COP',
  'CLP',
  'PEN',
  'UYU',
] as const;

export const LANDING_PRICING_CURRENCY_STORAGE_KEY = 'taimbox-landing-pricing-currency';
