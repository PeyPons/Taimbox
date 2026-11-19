import type { PlanId } from "@/config/plans";
import { supabase } from "@/lib/supabase";

type CheckoutPlanId = Extract<PlanId, "pro" | "business" | "scale">;

export interface StartPlanCheckoutInput {
  agencyId: string;
  planId: CheckoutPlanId;
  priceId: string;
  successPath?: string;
  cancelPath?: string;
}

export interface StartPlanCheckoutResult {
  url?: string;
  updated?: boolean;
  error?: string;
}

/** Abre Checkout de Stripe para una agencia ya autenticada. No crea la suscripción en el cliente. */
export async function startPlanCheckout(input: StartPlanCheckoutInput): Promise<StartPlanCheckoutResult> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) return { error: "no-session" };

  const origin = window.location.origin;
  const { data, error } = await supabase.functions.invoke("create-checkout-session", {
    body: {
      agency_id: input.agencyId,
      price_id: input.priceId,
      plan_id: input.planId,
      success_url: `${origin}${input.successPath ?? "/onboarding/choose"}`,
      cancel_url: `${origin}${input.cancelPath ?? "/agency?tab=billing"}`,
    },
    headers: { Authorization: `Bearer ${token}` },
  });

  if (error) return { error: error.message || "checkout-error" };
  if (data && typeof data === "object" && "error" in data && data.error) {
    return { error: String(data.error) };
  }
  if (data && typeof data === "object" && "url" in data && typeof data.url === "string" && data.url) {
    return { url: data.url };
  }
  if (data && typeof data === "object" && "updated" in data && data.updated === true) {
    return { updated: true };
  }
  return { error: "no-url" };
}

/** Agencia primaria del usuario que acaba de iniciar sesión. */
export async function primaryAgencyIdForUser(userId: string): Promise<string | null> {
  const { data: primaryRows } = await supabase
    .from("user_agencies")
    .select("agency_id")
    .eq("user_id", userId)
    .eq("is_primary", true)
    .limit(1);
  const primary = primaryRows?.[0]?.agency_id;
  if (typeof primary === "string" && primary) return primary;

  const { data: anyRows } = await supabase
    .from("user_agencies")
    .select("agency_id")
    .eq("user_id", userId)
    .limit(1);
  const fallback = anyRows?.[0]?.agency_id;
  return typeof fallback === "string" && fallback ? fallback : null;
}
