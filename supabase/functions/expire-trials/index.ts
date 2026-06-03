/**
 * Fallback si pg_cron no está disponible: expira trials vía HTTP cron.
 * Auth: Bearer EXPIRE_TRIALS_CRON_SECRET o ADS_CRON_SECRET (mismo patrón notificaciones).
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const secret =
    Deno.env.get("EXPIRE_TRIALS_CRON_SECRET") ?? Deno.env.get("NOTIFICATIONS_CRON_SECRET");
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!secret || token !== secret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: "Misconfigured" }), { status: 500, headers: corsHeaders });
  }
  const supabase = createClient(supabaseUrl, serviceKey);
  const { data, error } = await supabase.rpc("expire_agency_trials");
  if (error) {
    console.error("expire_agency_trials:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  return new Response(JSON.stringify({ expired: data }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
