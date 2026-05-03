// Edge Function: borrado irreversible de agencia (solo platform admin).
// Cancela suscripción Stripe si existe; luego RPC admin_delete_agency.
// Tras éxito, best-effort: elimina usuarios de Auth que solo pertenecían a esta agencia.
// RPC debe invocarse con JWT del admin (supabaseUser), no service role, para auth.uid() en SECURITY DEFINER.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "npm:stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");

    if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
      return new Response(
        JSON.stringify({ error: "Configuración del servidor incompleta" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "No autorizado" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: isAdmin, error: rpcErr } = await supabaseUser.rpc("is_platform_admin");
    if (rpcErr || !isAdmin) {
      return new Response(
        JSON.stringify({ error: "Solo administradores de plataforma pueden eliminar agencias" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      );
    }

    let body: { agencyId?: string };
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Cuerpo JSON inválido" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const agencyId = typeof body.agencyId === "string" ? body.agencyId.trim() : "";
    if (!agencyId) {
      return new Response(
        JSON.stringify({ error: "agencyId es obligatorio" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { data: agency, error: fetchErr } = await supabaseAdmin
      .from("agencies")
      .select("id, stripe_subscription_id")
      .eq("id", agencyId)
      .maybeSingle();

    if (fetchErr) {
      console.error("admin-delete-agency: fetch agency", fetchErr);
      return new Response(
        JSON.stringify({ error: "No se pudo leer la agencia" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }
    if (!agency) {
      return new Response(
        JSON.stringify({ error: "Agencia no encontrada" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    const { data: candidates, error: candErr } = await supabaseAdmin
      .from("user_agencies")
      .select("user_id")
      .eq("agency_id", agencyId);

    if (candErr) {
      console.warn("admin-delete-agency: no se pudieron listar candidatos auth", candErr);
    }
    const userIds = [...new Set((candidates ?? []).map((c) => c.user_id as string))];

    if (!stripeSecret && agency.stripe_subscription_id) {
      return new Response(
        JSON.stringify({
          error: "Falta STRIPE_SECRET_KEY pero la agencia tiene suscripción activa.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 503 }
      );
    }

    if (stripeSecret && agency.stripe_subscription_id) {
      try {
        const stripe = new Stripe(stripeSecret, { apiVersion: "2024-11-20.acacia" });
        await stripe.subscriptions.cancel(agency.stripe_subscription_id);
      } catch (e: unknown) {
        const isStripeErr = e instanceof Stripe.errors.StripeError;
        const code = isStripeErr ? e.code : undefined;
        if (code !== "resource_missing") {
          console.error("admin-delete-agency: Stripe cancel falló — abortando", e);
          return new Response(
            JSON.stringify({
              error:
                "No se pudo cancelar la suscripción en Stripe. Inténtalo más tarde, o cancélala manualmente desde Stripe antes de eliminar.",
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 502 }
          );
        }
        console.warn("admin-delete-agency: Stripe subscription ya inexistente, continúo", e);
      }
    }

    const { error: delErr } = await supabaseUser.rpc("admin_delete_agency", {
      p_agency_id: agencyId,
    });

    if (delErr) {
      console.error("admin-delete-agency: RPC", delErr);
      return new Response(
        JSON.stringify({ error: delErr.message || "Error al eliminar la agencia" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    for (const uid of userIds) {
      try {
        const { count, error: remErr } = await supabaseAdmin
          .from("user_agencies")
          .select("*", { count: "exact", head: true })
          .eq("user_id", uid);

        if (remErr) {
          console.warn("admin-delete-agency: chequeo huérfanos falló para", uid, remErr);
          continue;
        }

        if ((count ?? 0) > 0) continue;

        const { data: paRow } = await supabaseAdmin
          .from("platform_admins")
          .select("user_id")
          .eq("user_id", uid)
          .maybeSingle();

        if (paRow) continue;

        const { error: delAuthErr } = await supabaseAdmin.auth.admin.deleteUser(uid);
        if (delAuthErr) {
          console.warn("admin-delete-agency: deleteUser falló para", uid, delAuthErr);
        }
      } catch (orphanErr) {
        console.warn("admin-delete-agency: cleanup auth users (best-effort)", orphanErr);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("admin-delete-agency:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
