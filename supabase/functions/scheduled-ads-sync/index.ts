/**
 * Cron: sincronización programada Google/Meta Ads (planes Agency/Scale/Enterprise).
 * Auth: Authorization Bearer ADS_CRON_SECRET
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const cronSecret = Deno.env.get("ADS_CRON_SECRET");
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!cronSecret || token !== cronSecret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: "Server misconfigured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, serviceKey);
  const { data: agencies, error } = await supabase
    .from("agencies")
    .select("id, plan_id, google_ads_refresh_token, meta_ads_access_token")
    .in("plan_id", ["business", "scale", "enterprise"])
    .or("google_ads_refresh_token.not.is.null,meta_ads_access_token.not.is.null");

  if (error) {
    console.error("scheduled-ads-sync list agencies:", error);
    return new Response(JSON.stringify({ error: "Query failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const results: { agency_id: string; google?: string; meta?: string }[] = [];
  const functionsBase = `${supabaseUrl}/functions/v1`;

  for (const ag of agencies ?? []) {
    const row: { agency_id: string; google?: string; meta?: string } = { agency_id: ag.id };
    if (ag.google_ads_refresh_token) {
      try {
        const res = await fetch(`${functionsBase}/sync-google-ads`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${cronSecret}`,
            "Content-Type": "application/json",
            "X-Ads-Cron-Secret": cronSecret,
            apikey: Deno.env.get("SUPABASE_ANON_KEY") ?? "",
          },
          body: JSON.stringify({ agency_id: ag.id }),
        });
        row.google = res.ok ? "ok" : `error ${res.status}`;
      } catch (e) {
        row.google = e instanceof Error ? e.message : "fetch failed";
      }
    }
    if (ag.meta_ads_access_token) {
      try {
        const res = await fetch(`${functionsBase}/sync-meta-ads`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${cronSecret}`,
            "Content-Type": "application/json",
            "X-Ads-Cron-Secret": cronSecret,
            apikey: Deno.env.get("SUPABASE_ANON_KEY") ?? "",
          },
          body: JSON.stringify({ agency_id: ag.id }),
        });
        row.meta = res.ok ? "ok" : `error ${res.status}`;
      } catch (e) {
        row.meta = e instanceof Error ? e.message : "fetch failed";
      }
    }
    results.push(row);
  }

  return new Response(JSON.stringify({ synced: results.length, results }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
