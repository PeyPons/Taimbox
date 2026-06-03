/**
 * Sincroniza settings.modules de una agencia con los módulos permitidos por plan_id.
 */
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

type PlanId = "starter" | "pro" | "business" | "scale" | "enterprise";

const PLAN_MODULES: Record<PlanId, Record<string, boolean>> = {
  starter: { deadlines: true, timeTracker: true, ppc: false, weeklyFeedback: false, professionalGoals: false },
  pro: { deadlines: true, timeTracker: true, weeklyFeedback: true, professionalGoals: true, ppc: false },
  business: {
    deadlines: true,
    timeTracker: true,
    weeklyFeedback: true,
    professionalGoals: true,
    ppc: true,
  },
  scale: {
    deadlines: true,
    timeTracker: true,
    weeklyFeedback: true,
    professionalGoals: true,
    ppc: true,
  },
  enterprise: {
    deadlines: true,
    timeTracker: true,
    weeklyFeedback: true,
    professionalGoals: true,
    ppc: true,
  },
};

export async function syncAgencyModulesForPlan(
  supabase: SupabaseClient,
  agencyId: string,
  planId: PlanId,
): Promise<void> {
  const { data: row, error: fetchErr } = await supabase
    .from("agencies")
    .select("settings")
    .eq("id", agencyId)
    .single();
  if (fetchErr || !row) {
    console.warn("syncAgencyModulesForPlan: agency not found", agencyId, fetchErr);
    return;
  }
  const settings = (row.settings ?? {}) as Record<string, unknown>;
  const modules = PLAN_MODULES[planId] ?? PLAN_MODULES.starter;
  const next = {
    ...settings,
    modules: {
      ...(typeof settings.modules === "object" && settings.modules !== null
        ? (settings.modules as Record<string, boolean>)
        : {}),
      ...modules,
    },
  };
  const { error: updErr } = await supabase
    .from("agencies")
    .update({ settings: next, updated_at: new Date().toISOString() })
    .eq("id", agencyId);
  if (updErr) console.error("syncAgencyModulesForPlan update failed:", updErr);
}
