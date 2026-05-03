import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendEmail } from "../_shared/resend.ts";
import { getSiteUrl } from "../_shared/password-recovery-url.ts";
import { taskTransferEmailHtml } from "../_shared/notification-email-templates.ts";
import { resolveEmailsForPolicy } from "../_shared/notification-recipients.ts";
import type { RecipientPolicy } from "../_shared/notification-recipients.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

  if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
    console.error("[notify-task-transfer] Missing env");
    return new Response(JSON.stringify({ error: "Server misconfigured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: { transferId?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const transferId = typeof body.transferId === "string" ? body.transferId.trim() : "";
  if (!transferId) {
    return new Response(JSON.stringify({ error: "transferId required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userData, error: userErr } = await supabaseUser.auth.getUser();
  if (userErr || !userData?.user?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const userId = userData.user.id;
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  const { data: transfer, error: tErr } = await supabaseAdmin
    .from("task_transfers")
    .select(
      "id, agency_id, allocation_id, from_employee_id, to_employee_id, hours_transferred, reason, status",
    )
    .eq("id", transferId)
    .maybeSingle();

  if (tErr || !transfer) {
    return new Response(JSON.stringify({ error: "Transfer not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (transfer.status !== "pending") {
    return new Response(JSON.stringify({ ok: true, skipped: "not_pending" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: requester } = await supabaseAdmin
    .from("employees")
    .select("id, agency_id")
    .eq("user_id", userId)
    .eq("agency_id", transfer.agency_id)
    .maybeSingle();

  if (!requester || requester.id !== transfer.from_employee_id) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const dedupeKey = `task_transfer|${transferId}`;
  const { data: existingDelivery } = await supabaseAdmin
    .from("notification_deliveries")
    .select("id")
    .eq("agency_id", transfer.agency_id)
    .eq("dedupe_key", dedupeKey)
    .maybeSingle();

  if (existingDelivery) {
    return new Response(JSON.stringify({ ok: true, skipped: "already_sent" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: rules, error: rErr } = await supabaseAdmin
    .from("notification_rules")
    .select("*")
    .eq("agency_id", transfer.agency_id)
    .eq("enabled", true)
    .eq("trigger_type", "task_transfer_pending");

  if (rErr) {
    console.error("[notify-task-transfer] rules", rErr);
    return new Response(JSON.stringify({ error: "Failed to load rules" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!rules?.length) {
    return new Response(JSON.stringify({ ok: true, skipped: "no_rules" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: agency } = await supabaseAdmin
    .from("agencies")
    .select("name, settings")
    .eq("id", transfer.agency_id)
    .maybeSingle();

  const agencyName = (agency?.name as string) || "Tu agencia";
  const agencySettings = (agency?.settings as Record<string, unknown>) || {};

  const { data: alloc } = await supabaseAdmin
    .from("allocations")
    .select("task_name, project_id")
    .eq("id", transfer.allocation_id)
    .maybeSingle();

  let projectName = "Proyecto";
  if (alloc?.project_id) {
    const { data: proj } = await supabaseAdmin
      .from("projects")
      .select("name")
      .eq("id", alloc.project_id as string)
      .maybeSingle();
    if (proj?.name) projectName = proj.name as string;
  }
  const taskName = (alloc?.task_name as string) || "Tarea";

  const { data: fromEmp } = await supabaseAdmin
    .from("employees")
    .select("name")
    .eq("id", transfer.from_employee_id)
    .maybeSingle();
  const { data: toEmp } = await supabaseAdmin
    .from("employees")
    .select("name")
    .eq("id", transfer.to_employee_id)
    .maybeSingle();

  const fromName = (fromEmp?.name as string) || "Empleado";
  const toName = (toEmp?.name as string) || "Empleado";
  const hoursStr = String(transfer.hours_transferred ?? "");

  const siteUrl = getSiteUrl().replace(/\/$/, "");
  const appUrl = `${siteUrl}/planner`;

  const emailSet = new Set<string>();
  for (const rule of rules) {
    const policy = rule.recipient_policy as RecipientPolicy;
    const emails = await resolveEmailsForPolicy({
      supabaseAdmin,
      policy,
      recipientRoleName: rule.recipient_role_name as string | null,
      extraEmails: (rule.extra_emails as string[]) || [],
      agencyId: transfer.agency_id as string,
      agencySettings,
      fromEmployeeId: transfer.from_employee_id as string,
      toEmployeeId: transfer.to_employee_id as string,
      involvedEmployeeIds: [],
    });
    for (const e of emails) emailSet.add(e);
  }

  if (emailSet.size === 0) {
    return new Response(JSON.stringify({ ok: true, skipped: "no_recipients" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { html, text } = taskTransferEmailHtml({
    agencyName,
    fromName,
    toName,
    projectName,
    taskName,
    hours: hoursStr,
    reason: transfer.reason as string | null,
    appUrl,
  });

  const toList = [...emailSet];
  const sendResult = await sendEmail({
    to: toList,
    subject: `Nueva solicitud de transferencia — ${agencyName}`,
    html,
    text,
  });

  if (!sendResult.success) {
    return new Response(
      JSON.stringify({ ok: false, error: sendResult.error }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const { error: insErr } = await supabaseAdmin.from("notification_deliveries").insert({
    agency_id: transfer.agency_id,
    rule_id: null,
    dedupe_key: dedupeKey,
    trigger_type: "task_transfer_pending",
    payload: {
      transfer_id: transferId,
      rule_ids: rules.map((r) => r.id),
    },
    recipient_emails: toList,
    resend_id: sendResult.id ?? null,
    success: true,
    error_message: null,
  });

  if (insErr) {
    console.error("[notify-task-transfer] delivery insert", insErr);
  }

  return new Response(JSON.stringify({ ok: true, sent: toList.length }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
