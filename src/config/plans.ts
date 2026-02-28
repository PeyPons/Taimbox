/**
 * Configuración de planes de suscripción (Starter, Pro, Business).
 * Usado por useSubscriptionLimits, AgencyContext, y protección de rutas/módulos.
 */

import type { PlanId } from '@/types';

export type { PlanId };

export const PLAN_IDS: PlanId[] = ['starter', 'pro', 'business'];

export interface PlanLimits {
  maxEmployees: number;
  /** Solo Starter: días de histórico en Inteligencia/Reportes (Rentabilidad, Matriz fiabilidad). null = ilimitado */
  maxReportingDays: number | null;
}

export const PLAN_LIMITS: Record<PlanId, PlanLimits> = {
  starter: { maxEmployees: 5, maxReportingDays: 30 },
  pro: { maxEmployees: 20, maxReportingDays: null },
  business: { maxEmployees: 50, maxReportingDays: null },
};

/** Módulos (AgencySettings.modules) permitidos por plan */
export const PLAN_MODULES: Record<PlanId, { weeklyFeedback?: boolean; professionalGoals?: boolean; deadlines?: boolean; timeTracker?: boolean; ppc?: boolean }> = {
  starter: { deadlines: true },
  pro: { weeklyFeedback: true, professionalGoals: true, deadlines: true, timeTracker: true },
  business: { weeklyFeedback: true, professionalGoals: true, deadlines: true, timeTracker: true, ppc: true },
};

/** Rutas que requieren plan Pro o superior (ej. Weekly, OKRs, Cronómetro) */
export const ROUTES_REQUIRE_PRO: string[] = ['/weekly-forecast', '/okrs', '/tiempos'];

/** Rutas que requieren plan Business (Radar hemorragias, Ads, API) */
export const ROUTES_REQUIRE_BUSINESS: string[] = ['/operaciones', '/ads', '/meta-ads', '/api-keys'];

export function getPlanLimit(planId: PlanId): PlanLimits {
  return PLAN_LIMITS[planId] ?? PLAN_LIMITS.starter;
}

export function canAccessRoute(planId: PlanId, path: string): boolean {
  if (ROUTES_REQUIRE_BUSINESS.some(p => path.startsWith(p))) return planId === 'business';
  if (ROUTES_REQUIRE_PRO.some(p => path.startsWith(p))) return planId === 'pro' || planId === 'business';
  return true;
}

/** Si el plan incluye el módulo PPC (Google/Meta Ads) */
export function planIncludesAds(planId: PlanId): boolean {
  return planId === 'business';
}

/** Si el plan incluye OKRs */
export function planIncludesOkrs(planId: PlanId): boolean {
  return planId === 'pro' || planId === 'business';
}

/** Si el plan incluye Weekly */
export function planIncludesWeekly(planId: PlanId): boolean {
  return planId === 'pro' || planId === 'business';
}

/** Si el plan incluye Radar de Hemorragias (Operaciones) */
export function planIncludesRadar(planId: PlanId): boolean {
  return planId === 'business';
}

/** Si el plan incluye API */
export function planIncludesApi(planId: PlanId): boolean {
  return planId === 'business';
}
