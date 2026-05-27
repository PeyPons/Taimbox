import { PLAN_MODULES, type PlanId } from '@/config/plans';
import type { AgencyModules, AgencySettings, DepartmentDefinition } from '@/types';

export const DEFAULT_EHR_TARGET = 75;
export const DEFAULT_DEPARTMENT_NAME = 'General';
export const DEFAULT_DEPARTMENT_COLOR = '#4f46e5';
export const ONBOARDING_QUICK_CHECKLIST_KEY_PREFIX = 'onboarding_quick_checklist_';
/** Sesión: el usuario eligió el asistente guiado en /onboarding/choose */
export const ONBOARDING_WIZARD_ALLOWED_KEY = 'onboarding_wizard_allowed';

export function quickChecklistStorageKey(agencyId: string): string {
  return `${ONBOARDING_QUICK_CHECKLIST_KEY_PREFIX}${agencyId}`;
}

/** Nombre de agencia por defecto si el usuario no indica uno (registro rápido). */
export function deriveDefaultAgencyName(email: string): string {
  const domain = email.split('@')[1]?.trim().toLowerCase();
  if (!domain) return 'Mi agencia';
  const slug = domain.split('.')[0] ?? '';
  if (slug.length < 2) return 'Mi agencia';
  return slug.charAt(0).toUpperCase() + slug.slice(1);
}

export function buildDefaultDepartment(): DepartmentDefinition {
  return {
    id: crypto.randomUUID(),
    name: DEFAULT_DEPARTMENT_NAME,
    color: DEFAULT_DEPARTMENT_COLOR,
  };
}

export function buildRecommendedModules(planId: PlanId): AgencyModules {
  const m = PLAN_MODULES[planId] ?? PLAN_MODULES.starter;
  return {
    ppc: false,
    weeklyFeedback: m.weeklyFeedback === true,
    professionalGoals: m.professionalGoals === true,
    deadlines: m.deadlines !== false,
    timeTracker: m.timeTracker !== false,
  };
}

export function buildRecommendedAgencySettings(planId: PlanId): Partial<AgencySettings> {
  const modules = buildRecommendedModules(planId);
  return {
    ehrTarget: DEFAULT_EHR_TARGET,
    hoursTrackingPreference: 'computed',
    modules,
    weeklyCloseDay: modules.weeklyFeedback ? 4 : undefined,
    timeTrackerMaxHours: modules.timeTracker ? 12 : undefined,
  };
}
