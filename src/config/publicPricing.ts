import type { AgencyCurrencyCode } from '@/constants/currencies';

/** Planes mostrados en home (s07) y /precios. Importes base y cobro Stripe en USD. */
export type PublicPlanId = 'starter' | 'pro' | 'business' | 'scale' | 'enterprise';

/** Nombres comerciales (IDs internos sin cambiar en BD) */
export const PUBLIC_PLAN_LABELS: Record<PublicPlanId, string> = {
  starter: 'Free',
  pro: 'Team',
  business: 'Agency',
  scale: 'Scale',
  enterprise: 'Enterprise',
};

export const PUBLIC_PLAN_LATAM_USD: Partial<Record<Exclude<PublicPlanId, 'starter' | 'enterprise'>, number>> = {
  pro: 29,
  business: 89,
  scale: 179,
};

export interface PublicPlanPricing {
  id: PublicPlanId;
  /** Precio mensual en USD (número mostrado; sin conversión desde EUR). */
  usdMonthly: number | null;
  /** Tarifa oficial antes del descuento early adopter (USD). */
  usdMonthlyOfficial?: number;
  recommended?: boolean;
  featuredOnHome?: boolean;
  href: string;
  mailtoSubjectKey?: 'enterpriseMailSubject';
}

export const PUBLIC_PLAN_PRICING: PublicPlanPricing[] = [
  {
    id: 'starter',
    usdMonthly: 0,
    href: '/login?tab=register',
  },
  {
    id: 'pro',
    usdMonthly: 49,
    usdMonthlyOfficial: 99,
    href: '/login?tab=register',
  },
  {
    id: 'business',
    usdMonthly: 149,
    usdMonthlyOfficial: 249,
    recommended: true,
    featuredOnHome: true,
    href: '/login?tab=register',
  },
  {
    id: 'scale',
    usdMonthly: 299,
    href: '/contacto',
    mailtoSubjectKey: 'enterpriseMailSubject',
  },
  {
    id: 'enterprise',
    usdMonthly: null,
    href: '/contacto',
    mailtoSubjectKey: 'enterpriseMailSubject',
  },
];

export const DEFAULT_LANDING_PRICING_CURRENCY: AgencyCurrencyCode = 'USD';

/** Selector: USD base + otras divisas (tipos desde USD vía Frankfurter). */
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
