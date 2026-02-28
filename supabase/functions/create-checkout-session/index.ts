// Edge Function: crear sesión de Stripe Checkout para suscripción (Pro o Business)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "npm:stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TRIAL_DAYS_BUSINESS = 14;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");
    const baseUrl = Deno.env.get("CHECKOUT_BASE_URL") || "https://taimbox.com";

    if (!supabaseUrl || !supabaseServiceKey || !stripeSecret) {
      return new Response(
        JSON.stringify({ error: "Configuración del servidor incompleta." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "No autorizado." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "No autorizado." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    let body: { agency_id?: string; price_id?: string; plan_id?: string; success_url?: string; cancel_url?: string };
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Formato de datos inválido." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const agencyId = body.agency_id;
    const priceId = body.price_id;
    const planId = body.plan_id === "business" ? "business" : "pro";
    if (!agencyId || !priceId) {
      return new Response(
        JSON.stringify({ error: "Faltan agency_id o price_id." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const successUrl = body.success_url || `${baseUrl}/agency?tab=billing`;
    const cancelUrl = body.cancel_url || `${baseUrl}/agency?tab=billing`;

    const { data: agency, error: agencyError } = await supabase
      .from("agencies")
      .select("id, name, stripe_customer_id, stripe_subscription_id, plan_id, trial_used_at")
      .eq("id", agencyId)
      .single();

    if (agencyError || !agency) {
      return new Response(
        JSON.stringify({ error: "Agencia no encontrada." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    const { data: ua } = await supabase
      .from("user_agencies")
      .select("role")
      .eq("user_id", user.id)
      .eq("agency_id", agencyId)
      .maybeSingle();
    const { data: emp } = await supabase
      .from("employees")
      .select("id, role")
      .eq("agency_id", agencyId)
      .eq("user_id", user.id)
      .maybeSingle();

    const role = ua?.role ?? emp?.role ?? "";
    const { data: agencyFull } = await supabase.from("agencies").select("settings").eq("id", agencyId).single();
    const roles = (agencyFull?.settings as { roles?: { name: string; permissions?: { can_access_agency_settings?: boolean } }[] })?.roles ?? [];
    const isAdmin = roles.some(
      (r) => r.name.toLowerCase() === role.toLowerCase() && r.permissions?.can_access_agency_settings === true
    );
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Sin permiso para gestionar la facturación de esta agencia." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      );
    }

    const stripe = new Stripe(stripeSecret, { apiVersion: "2024-11-20.acacia" });
    let customerId = agency.stripe_customer_id;

    // Si ya tiene una suscripción activa o en trial, actualizamos el plan en lugar de crear otra (evita doble suscripción)
    if (agency.stripe_subscription_id) {
      try {
        const existingSub = await stripe.subscriptions.retrieve(agency.stripe_subscription_id);
        if (existingSub.status === "active" || existingSub.status === "trialing") {
          const itemId = existingSub.items.data[0]?.id;
          if (!itemId) {
            return new Response(
              JSON.stringify({ error: "Suscripción sin ítem válido. Contacta con soporte." }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
            );
          }
          const updateParams: Stripe.SubscriptionUpdateParams = {
            items: [{ id: itemId, price: priceId }],
            metadata: { agency_id: agencyId, plan_id: planId },
            proration_behavior: "create_prorations",
          };
          // Si cambia a Pro (no Business), terminar el trial para cobrar desde ya
          if (planId !== "business" && existingSub.status === "trialing") {
            updateParams.trial_end = "now";
          }
          await stripe.subscriptions.update(agency.stripe_subscription_id, updateParams);
          // El webhook subscription.updated actualizará plan_id y estado en agencies
          return new Response(JSON.stringify({ updated: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }
      } catch (e) {
        console.warn("Could not update existing subscription, falling back to checkout:", e);
        // Si la suscripción ya no existe o falla, seguimos con Checkout
      }
    }

    if (!customerId) {
      const customer = await stripe.customers.create({
        name: agency.name,
        metadata: { agency_id: agencyId },
      });
      customerId = customer.id;
      await supabase.from("agencies").update({ stripe_customer_id: customerId }).eq("id", agencyId);
    }

    const isBusiness = planId === "business";
    const allowTrial = isBusiness && !agency.trial_used_at;
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { agency_id: agencyId, plan_id: planId },
      subscription_data: {
        metadata: { agency_id: agencyId, plan_id: planId },
        ...(allowTrial ? { trial_period_days: TRIAL_DAYS_BUSINESS } : {}),
      },
    };

    const session = await stripe.checkout.sessions.create(sessionParams);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error("create-checkout-session error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Error al crear la sesión de pago." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
