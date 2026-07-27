/**
 * Entitlements de plan aplicados en servidor (Edge Functions).
 * Espeja `src/config/plans.ts` (límites) y `useSubscriptionLimits` (trial vencido → Free)
 * y `src/utils/managedUsers.ts` (conteo de personas gestionadas).
 */
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { AgencyAccessError } from "./agency-access.ts";

export type PlanId = "starter" | "pro" | "business" | "scale" | "enterprise";

const PLAN_IDS: PlanId[] = ["starter", "pro", "business", "scale", "enterprise"];

/** Máximo de personas gestionadas por plan (null = sin límite). Espeja PLAN_LIMITS. */
export const PLAN_MAX_MANAGED_USERS: Record<PlanId, number | null> = {
  starter: 5,
  pro: 25,
  business: 100,
  scale: null,
  enterprise: null,
};

const API_PLANS: PlanId[] = ["business", "scale", "enterprise"];
const ADS_PLANS: PlanId[] = ["business", "scale", "enterprise"];

export function parsePlanId(value: string | null | undefined): PlanId {
  if (value && PLAN_IDS.includes(value as PlanId)) return value as PlanId;
  return "starter";
}

export function planIncludesApi(planId: PlanId): boolean {
  return API_PLANS.includes(planId);
}

export function planIncludesAds(planId: PlanId): boolean {
  return ADS_PLANS.includes(planId);
}

interface AgencyPlanRow {
  plan_id: string | null;
  subscription_status: string | null;
  trial_ends_at: string | null;
}

/** Trial vencido con status aún 'trialing' se trata como Free (igual que el cliente). */
export function effectivePlanIdFromRow(row: AgencyPlanRow): PlanId {
  const raw = parsePlanId(row.plan_id);
  const trialExpired =
    row.subscription_status === "trialing" &&
    row.trial_ends_at != null &&
    new Date(row.trial_ends_at).getTime() <= Date.now();
  return trialExpired ? "starter" : raw;
}

export async function getEffectivePlanId(
  supabaseAdmin: SupabaseClient,
  agencyId: string,
): Promise<PlanId> {
  const { data, error } = await supabaseAdmin
    .from("agencies")
    .select("plan_id, subscription_status, trial_ends_at")
    .eq("id", agencyId)
    .single();
  if (error || !data) {
    throw new AgencyAccessError(404, "Agencia no encontrada.");
  }
  return effectivePlanIdFromRow(data as AgencyPlanRow);
}

/** Lanza 403 si el plan efectivo de la agencia no incluye acceso a la API de integración. */
export async function assertPlanIncludesApi(
  supabaseAdmin: SupabaseClient,
  agencyId: string,
): Promise<void> {
  const planId = await getEffectivePlanId(supabaseAdmin, agencyId);
  if (!planIncludesApi(planId)) {
    throw new AgencyAccessError(
      403,
      "Tu plan no incluye acceso a la API. Disponible desde el plan Agency.",
    );
  }
}

/** Lanza 403 si el plan efectivo de la agencia no incluye el módulo PPC (Google/Meta Ads). */
export async function assertPlanIncludesAds(
  supabaseAdmin: SupabaseClient,
  agencyId: string,
): Promise<void> {
  const planId = await getEffectivePlanId(supabaseAdmin, agencyId);
  if (!planIncludesAds(planId)) {
    throw new AgencyAccessError(
      403,
      "Tu plan no incluye el Monitor PPC (Google/Meta Ads). Disponible desde el plan Agency.",
    );
  }
}

const EXCLUDED_ROLE_PATTERNS = [
  /^soporte$/i,
  /^support$/i,
  /^admin\s*plataforma$/i,
  /^platform\s*admin$/i,
];

const PLACEHOLDER_NAME = /placeholder|\[pendiente\]|\[vacante\]/i;

interface EmployeeCountRow {
  role: string | null;
  name: string | null;
  is_active: boolean | null;
}

function isManagedUserRow(row: EmployeeCountRow): boolean {
  if (row.is_active === false) return false;
  const role = (row.role ?? "").trim();
  if (EXCLUDED_ROLE_PATTERNS.some((re) => re.test(role))) return false;
  if (PLACEHOLDER_NAME.test(row.name ?? "")) return false;
  return true;
}

export async function countManagedUsers(
  supabaseAdmin: SupabaseClient,
  agencyId: string,
): Promise<number> {
  const { data, error } = await supabaseAdmin
    .from("employees")
    .select("role, name, is_active")
    .eq("agency_id", agencyId);
  if (error) {
    console.error("countManagedUsers:", error);
    throw new AgencyAccessError(500, "No se pudo comprobar el cupo de personas del plan.");
  }
  return ((data ?? []) as EmployeeCountRow[]).filter(isManagedUserRow).length;
}

/**
 * Lanza 403 si añadir una persona gestionada superaría el máximo del plan efectivo.
 * No aplica a scale/enterprise (sin límite).
 */
export async function assertManagedUserCapacity(
  supabaseAdmin: SupabaseClient,
  agencyId: string,
): Promise<void> {
  const planId = await getEffectivePlanId(supabaseAdmin, agencyId);
  const max = PLAN_MAX_MANAGED_USERS[planId];
  if (max == null) return;
  const current = await countManagedUsers(supabaseAdmin, agencyId);
  if (current >= max) {
    throw new AgencyAccessError(
      403,
      `Tu plan admite un máximo de ${max} personas gestionadas (actualmente ${current}). Amplía el plan para añadir más personas.`,
    );
  }
}
