// Edge Function: crea sesión del Customer Portal de Stripe (gestionar/cancelar suscripción)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "npm:stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    let body: { agency_id?: string };
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Formato de datos inválido." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const agencyId = body.agency_id;
    if (!agencyId) {
      return new Response(
        JSON.stringify({ error: "Falta agency_id." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const { data: agency, error: agencyError } = await supabase
      .from("agencies")
      .select("id, stripe_customer_id")
      .eq("id", agencyId)
      .single();

    if (agencyError || !agency) {
      return new Response(
        JSON.stringify({ error: "Agencia no encontrada." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    if (!agency.stripe_customer_id) {
      return new Response(
        JSON.stringify({ error: "No hay suscripción activa que gestionar. Contrata un plan para acceder al portal de facturación." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
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
    const returnUrl = `${baseUrl}/agency?tab=billing`;

    const session = await stripe.billingPortal.sessions.create({
      customer: agency.stripe_customer_id,
      return_url: returnUrl,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error("create-billing-portal-session error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Error al abrir el portal de facturación." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
