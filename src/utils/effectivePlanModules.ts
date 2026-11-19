import { PLAN_MODULES, type PlanId } from '@/config/plans';
import type { AgencyModules, AgencySettings } from '@/types';
import { resolveWeeklyEnabled } from '@/utils/agencyUtils';

const MODULE_KEYS = ['deadlines', 'timeTracker', 'weeklyFeedback', 'professionalGoals', 'ppc'] as const;

type ModuleKey = (typeof MODULE_KEYS)[number];

/** La prueba ya pasó y el cron todavía no ha bajado el plan. */
export function trialHasLapsed(
  subscriptionStatus: string | undefined,
  trialEndsAt: string | null | undefined,
  nowMs: number = Date.now(),
): boolean {
  if (subscriptionStatus !== 'trialing' || !trialEndsAt) return false;
  const end = new Date(trialEndsAt).getTime();
  return Number.isFinite(end) && end <= nowMs;
}

export function effectivePlanId(input: {
  planId?: PlanId;
  subscriptionStatus?: string;
  trialEndsAt?: string | null;
}): PlanId {
  const raw = input.planId ?? 'starter';
  return trialHasLapsed(input.subscriptionStatus, input.trialEndsAt) ? 'starter' : raw;
}

function planAllowsModule(planId: PlanId, module: ModuleKey): boolean {
  return (PLAN_MODULES[planId] ?? PLAN_MODULES.starter)[module] === true;
}

/**
 * Módulos que el navegador debe tratar como activos.
 * Si la prueba ya venció, el plan efectivo es Free y weekly, OKR y PPC quedan fuera
 * aunque settings.modules siga con los flags de Agency hasta el cron.
 */
export function visibleAgencyModules(
  settings: AgencySettings | undefined,
  planId: PlanId,
): Required<Pick<AgencyModules, ModuleKey>> {
  const stored = settings?.modules;
  const weeklyOn = planAllowsModule(planId, 'weeklyFeedback') && resolveWeeklyEnabled(settings);
  return {
    deadlines: planAllowsModule(planId, 'deadlines') && stored?.deadlines !== false,
    timeTracker: planAllowsModule(planId, 'timeTracker') && stored?.timeTracker === true,
    weeklyFeedback: weeklyOn,
    professionalGoals: planAllowsModule(planId, 'professionalGoals') && stored?.professionalGoals !== false,
    ppc: planAllowsModule(planId, 'ppc') && stored?.ppc !== false,
  };
}
