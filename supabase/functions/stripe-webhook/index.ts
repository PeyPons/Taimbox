// Edge Function: webhook de Stripe para actualizar agencies (suscripción)
// Configurar en Stripe Dashboard la URL: https://<project>.supabase.co/functions/v1/stripe-webhook
// Eventos: customer.subscription.created, customer.subscription.updated, customer.subscription.deleted
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "npm:stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!stripeSecret || !webhookSecret || !supabaseUrl || !supabaseServiceKey) {
    console.error("Missing STRIPE_WEBHOOK_SECRET or Supabase env");
    return new Response(JSON.stringify({ error: "Server config missing" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }

  const signature = req.headers.get("Stripe-Signature");
  if (!signature) {
    return new Response(JSON.stringify({ error: "No Stripe-Signature" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }

  const rawBody = await req.text();
  let event: Stripe.Event;
  try {
    const stripe = new Stripe(stripeSecret, { apiVersion: "2024-11-20.acacia" });
    event = await stripe.webhooks.constructEventAsync(
      rawBody,
      signature,
      webhookSecret,
      undefined
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return new Response(JSON.stringify({ error: "Invalid signature" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated") {
    const sub = event.data.object as Stripe.Subscription;
    const agencyId = sub.metadata?.agency_id;
    const planId = sub.metadata?.plan_id === "business" ? "business" : "pro";
    if (!agencyId) {
      console.warn("Subscription event without agency_id in metadata:", sub.id);
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    const status = sub.status;
    const trialEnd = sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null;
    const periodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null;
    const { error } = await supabase
      .from("agencies")
      .update({
        plan_id: planId,
        subscription_status: status,
        stripe_subscription_id: sub.id,
        trial_ends_at: trialEnd,
        subscription_period_ends_at: periodEnd,
        updated_at: new Date().toISOString(),
      })
      .eq("id", agencyId);
    if (error) {
      console.error("Error updating agency subscription:", error);
      return new Response(JSON.stringify({ error: "Update failed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }
  } else if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    const agencyId = sub.metadata?.agency_id;
    if (!agencyId) {
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    const { error } = await supabase
      .from("agencies")
      .update({
        plan_id: "starter",
        subscription_status: "canceled",
        stripe_subscription_id: null,
        trial_ends_at: null,
        subscription_period_ends_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", agencyId);
    if (error) {
      console.error("Error downgrading agency:", error);
      return new Response(JSON.stringify({ error: "Update failed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
});
