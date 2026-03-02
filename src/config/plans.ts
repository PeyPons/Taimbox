/**
 * Configuración de planes de suscripción (Starter, Pro, Business, Enterprise).
 * Usado por useSubscriptionLimits, AgencyContext, y protección de rutas/módulos.
 */

import type { PlanId } from '@/types';

export type { PlanId };

export const PLAN_IDS: PlanId[] = ['starter', 'pro', 'business', 'enterprise'];

export interface PlanLimits {
  maxEmployees: number | null; // null = ilimitado
  /** true para Starter: solo puede ver mes actual y mes anterior completo */
  limitHistoryToTwoMonths: boolean;
}

export const PLAN_LIMITS: Record<PlanId, PlanLimits> = {
  starter: { maxEmployees: 5, limitHistoryToTwoMonths: true },
  pro: { maxEmployees: 20, limitHistoryToTwoMonths: false },
  business: { maxEmployees: 50, limitHistoryToTwoMonths: false },
  enterprise: { maxEmployees: null, limitHistoryToTwoMonths: false },
};

/** Módulos (AgencySettings.modules) permitidos por plan */
export const PLAN_MODULES: Record<PlanId, { weeklyFeedback?: boolean; professionalGoals?: boolean; deadlines?: boolean; timeTracker?: boolean; ppc?: boolean }> = {
  // CRÍTICO: timeTracker en true para Starter — deben poder cronometrar
  starter: { deadlines: true, timeTracker: true },
  pro: { weeklyFeedback: true, professionalGoals: true, deadlines: true, timeTracker: true },
  business: { weeklyFeedback: true, professionalGoals: true, deadlines: true, timeTracker: true, ppc: true },
  enterprise: { weeklyFeedback: true, professionalGoals: true, deadlines: true, timeTracker: true, ppc: true },
};

/** Rutas que requieren plan Pro o superior (Weekly, OKRs) */
// NOTA: /tiempos ya NO requiere Pro — Starter tiene acceso al cronómetro
export const ROUTES_REQUIRE_PRO: string[] = ['/weekly-forecast', '/okrs'];

/** Rutas que requieren plan Business (Radar hemorragias, Ads, API) */
export const ROUTES_REQUIRE_BUSINESS: string[] = ['/operaciones', '/ads', '/meta-ads', '/api-keys'];

export function getPlanLimit(planId: PlanId): PlanLimits {
  return PLAN_LIMITS[planId] ?? PLAN_LIMITS.starter;
}

export function canAccessRoute(planId: PlanId, path: string): boolean {
  if (planId === 'enterprise') return true;
  if (ROUTES_REQUIRE_BUSINESS.some(p => path.startsWith(p))) return planId === 'business';
  if (ROUTES_REQUIRE_PRO.some(p => path.startsWith(p))) return planId === 'pro' || planId === 'business';
  return true;
}

/** Si el plan incluye el módulo PPC (Google/Meta Ads) */
export function planIncludesAds(planId: PlanId): boolean {
  return planId === 'business' || planId === 'enterprise';
}

/** Si el plan incluye OKRs */
export function planIncludesOkrs(planId: PlanId): boolean {
  return planId !== 'starter';
}

/** Si el plan incluye Weekly */
export function planIncludesWeekly(planId: PlanId): boolean {
  return planId !== 'starter';
}

/** Si el plan incluye Radar de Hemorragias (Operaciones) */
export function planIncludesRadar(planId: PlanId): boolean {
  return planId === 'business' || planId === 'enterprise';
}

/** Si el plan incluye API */
export function planIncludesApi(planId: PlanId): boolean {
  return planId === 'business' || planId === 'enterprise';
}
