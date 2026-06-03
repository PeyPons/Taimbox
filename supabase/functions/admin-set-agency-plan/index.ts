// Edge Function: forzar plan de agencia (platform admin) y sincronizar Stripe si hay suscripción.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "npm:stripe@14.21.0";
import {
  getStripePriceIdForPlan,
  readStripePlanEnv,
  resolvePlanIdFromSubscriptionAsync,
  type PaidPlanId,
} from "../_shared/stripe-plan.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type AgencyPlanId = "starter" | "pro" | "business" | "scale" | "enterprise";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");

    if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
      return json({ error: "Configuración del servidor incompleta." }, 500);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "No autorizado." }, 401);
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: isAdmin, error: rpcErr } = await supabaseUser.rpc("is_platform_admin");
    if (rpcErr || !isAdmin) {
      return json({ error: "Solo administradores de plataforma pueden cambiar el plan." }, 403);
    }

    let body: { agency_id?: string; plan_id?: string };
    try {
      body = await req.json();
    } catch {
      return json({ error: "Cuerpo JSON inválido." }, 400);
    }

    const agencyId = typeof body.agency_id === "string" ? body.agency_id.trim() : "";
    const planId = body.plan_id as AgencyPlanId;
    if (!agencyId || !["starter", "pro", "business", "scale", "enterprise"].includes(planId)) {
      return json({ error: "agency_id y plan_id válido son obligatorios." }, 400);
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { data: agency, error: fetchErr } = await supabaseAdmin
      .from("agencies")
      .select(
        "id, name, plan_id, stripe_customer_id, stripe_subscription_id, subscription_status, trial_ends_at",
      )
      .eq("id", agencyId)
      .maybeSingle();

    if (fetchErr) {
      console.error("admin-set-agency-plan: fetch agency", fetchErr);
      return json({ error: "No se pudo leer la agencia." }, 500);
    }
    if (!agency) {
      return json({ error: "Agencia no encontrada." }, 404);
    }

    const stripe = stripeSecret ? new Stripe(stripeSecret, { apiVersion: "2024-11-20.acacia" }) : null;
    const planEnv = readStripePlanEnv();
    let stripeSynced = false;
    let stripeWarning: string | undefined;

    if (planId === "starter") {
      if (agency.stripe_subscription_id && stripe) {
        try {
          await stripe.subscriptions.cancel(agency.stripe_subscription_id);
          stripeSynced = true;
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          if (!msg.includes("resource_missing")) {
            console.error("admin-set-agency-plan: cancel subscription", e);
            return json({ error: `No se pudo cancelar la suscripción en Stripe: ${msg}` }, 502);
          }
        }
      }

      const { error: updErr } = await supabaseAdmin
        .from("agencies")
        .update({
          plan_id: "starter",
          subscription_status: "active",
          stripe_subscription_id: null,
          trial_ends_at: null,
          subscription_period_ends_at: null,
          subscription_cancel_at_period_end: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", agencyId);

      if (updErr) {
        console.error("admin-set-agency-plan: update starter", updErr);
        return json({ error: "No se pudo actualizar la agencia." }, 500);
      }

      return json({ ok: true, plan_id: "starter", stripe_synced: stripeSynced });
    }

    const paidPlan = planId as PaidPlanId;
    const targetPriceId = getStripePriceIdForPlan(paidPlan, planEnv);

    if (agency.stripe_subscription_id && stripe) {
      if (!targetPriceId) {
        return json(
          {
            error:
              `Hay suscripción activa en Stripe pero falta STRIPE_PRICE_ID_${paidPlan.toUpperCase()} en el servidor. ` +
              "Configúrala en el contenedor de Edge Functions y vuelve a intentar.",
          },
          400,
        );
      }

      try {
        const existingSub = await stripe.subscriptions.retrieve(agency.stripe_subscription_id);
        if (existingSub.status === "active" || existingSub.status === "trialing") {
          const itemId = existingSub.items.data[0]?.id;
          if (!itemId) {
            return json({ error: "Suscripción en Stripe sin ítem válido." }, 400);
          }

          const updateParams: Stripe.SubscriptionUpdateParams = {
            items: [{ id: itemId, price: targetPriceId }],
            metadata: { agency_id: agencyId, plan_id: paidPlan },
            proration_behavior: "none",
          };

          if (paidPlan === "pro" && existingSub.status === "trialing") {
            updateParams.trial_end = "now";
          }

          const updated = await stripe.subscriptions.update(agency.stripe_subscription_id, updateParams);
          stripeSynced = true;

          const resolvedPlan = await resolvePlanIdFromSubscriptionAsync(stripe, updated, planEnv);
          const trialEnd = updated.trial_end
            ? new Date(updated.trial_end * 1000).toISOString()
            : null;
          const periodEnd = updated.current_period_end
            ? new Date(updated.current_period_end * 1000).toISOString()
            : null;

          const { error: updErr } = await supabaseAdmin
            .from("agencies")
            .update({
              plan_id: resolvedPlan,
              subscription_status: updated.status,
              stripe_subscription_id: updated.id,
              trial_ends_at: trialEnd,
              subscription_period_ends_at: periodEnd,
              subscription_cancel_at_period_end: !!updated.cancel_at_period_end,
              updated_at: new Date().toISOString(),
            })
            .eq("id", agencyId);

          if (updErr) {
            console.error("admin-set-agency-plan: update after stripe", updErr);
            return json({ error: "Stripe actualizado pero falló la BD." }, 500);
          }

          if (resolvedPlan !== paidPlan) {
            stripeWarning =
              `Stripe quedó en plan "${resolvedPlan}" (esperado "${paidPlan}"). Revisa Price IDs y metadata.`;
          }

          return json({
            ok: true,
            plan_id: resolvedPlan,
            stripe_synced: true,
            warning: stripeWarning,
          });
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error("admin-set-agency-plan: stripe update", e);
        return json({ error: `Error al actualizar Stripe: ${msg}` }, 502);
      }
    } else if (agency.stripe_subscription_id && !stripe) {
      stripeWarning =
        "Sin STRIPE_SECRET_KEY: solo se actualizó la BD; el webhook puede revertir el plan.";
    }

    const { error: updErr } = await supabaseAdmin
      .from("agencies")
      .update({
        plan_id: planId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", agencyId);

    if (updErr) {
      console.error("admin-set-agency-plan: update plan", updErr);
      return json({ error: "No se pudo actualizar la agencia." }, 500);
    }

    return json({
      ok: true,
      plan_id: planId,
      stripe_synced: stripeSynced,
      warning: stripeWarning,
    });
  } catch (err) {
    console.error("admin-set-agency-plan:", err);
    return json(
      { error: err instanceof Error ? err.message : "Error interno." },
      500,
    );
  }
});

function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });
}
