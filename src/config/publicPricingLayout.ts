import type { PublicPlanId } from './publicPricing';

/** Fila principal en /precios (Free, Team, Agency) */
export const PRICING_ROW_PRIMARY = ['starter', 'pro', 'business'] as const satisfies readonly PublicPlanId[];

/** Segunda fila (Scale, Enterprise) — más ancho por tarjeta */
export const PRICING_ROW_SECONDARY: PublicPlanId[] = ['scale', 'enterprise'];

/** Home s07: cuatro planes; Scale solo en /precios */
export const PRICING_HOME_PLAN_IDS: PublicPlanId[] = ['starter', 'pro', 'business', 'enterprise'];
