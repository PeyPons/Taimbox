import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendEmail } from "../_shared/resend.ts";
import { getSiteUrl } from "../_shared/password-recovery-url.ts";
import { dependencyUnblockEmailHtml } from "../_shared/notification-email-templates.ts";

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
    console.error("[process-event-notifications] Missing env");
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

  let body: { completedAllocationId?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const completedAllocationId = typeof body.completedAllocationId === "string"
    ? body.completedAllocationId.trim()
    : "";
  if (!completedAllocationId) {
    return new Response(JSON.stringify({ error: "completedAllocationId required" }), {
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

  const { data: completed, error: cErr } = await supabaseAdmin
    .from("allocations")
    .select("id, employee_id, project_id, task_name, status")
    .eq("id", completedAllocationId)
    .maybeSingle();

  if (cErr || !completed) {
    return new Response(JSON.stringify({ error: "Allocation not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (completed.status !== "completed") {
    return new Response(JSON.stringify({ ok: true, skipped: "not_completed" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: project, error: pErr } = await supabaseAdmin
    .from("projects")
    .select("id, name, agency_id")
    .eq("id", completed.project_id as string)
    .maybeSingle();

  if (pErr || !project) {
    return new Response(JSON.stringify({ error: "Project not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const agencyId = project.agency_id as string;

  const { data: membership } = await supabaseAdmin
    .from("user_agencies")
    .select("user_id")
    .eq("agency_id", agencyId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!membership) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: agency } = await supabaseAdmin
    .from("agencies")
    .select("name, settings")
    .eq("id", agencyId)
    .maybeSingle();

  const agencySettings = (agency?.settings as Record<string, unknown>) || {};
  if (agencySettings.dependencyUnblockEmailsEnabled === false) {
    return new Response(JSON.stringify({ ok: true, skipped: "disabled_by_agency" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const agencyName = (agency?.name as string) || "Tu agencia";

  const { data: dependents, error: dErr } = await supabaseAdmin
    .from("allocations")
    .select("id, employee_id, task_name, project_id")
    .eq("dependency_id", completedAllocationId);

  if (dErr) {
    console.error("[process-event-notifications] dependents", dErr);
    return new Response(JSON.stringify({ error: "Failed to load dependents" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!dependents?.length) {
    return new Response(JSON.stringify({ ok: true, skipped: "no_dependents" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const dedupeKey = `dependency_unblock|${completedAllocationId}`;
  const { data: existingDelivery } = await supabaseAdmin
    .from("notification_deliveries")
    .select("id")
    .eq("agency_id", agencyId)
    .eq("dedupe_key", dedupeKey)
    .maybeSingle();

  if (existingDelivery) {
    return new Response(JSON.stringify({ ok: true, skipped: "already_sent" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const projectIds = new Set<string>([completed.project_id as string]);
  for (const d of dependents) {
    if (d.project_id) projectIds.add(d.project_id as string);
  }

  const { data: projects } = await supabaseAdmin
    .from("projects")
    .select("id, name")
    .in("id", [...projectIds]);

  const projectNameById = new Map<string, string>();
  for (const pr of projects || []) {
    projectNameById.set(pr.id as string, (pr.name as string) || "Proyecto");
  }

  const blockingProjectName = projectNameById.get(completed.project_id as string) || "Proyecto";
  const blockingTaskName = (completed.task_name as string) || "Tarea";

  const { data: closerEmp } = await supabaseAdmin
    .from("employees")
    .select("name, email")
    .eq("id", completed.employee_id as string)
    .maybeSingle();

  const closerName = (closerEmp?.name as string) || "Alguien";

  const empIds = new Set<string>();
  empIds.add(completed.employee_id as string);
  for (const d of dependents) {
    if (d.employee_id) empIds.add(d.employee_id as string);
  }

  const { data: emps } = await supabaseAdmin
    .from("employees")
    .select("id, email, name")
    .in("id", [...empIds])
    .eq("agency_id", agencyId);

  const emailByEmpId = new Map<string, string>();
  for (const e of emps || []) {
    const em = (e.email as string | null)?.trim();
    if (em) emailByEmpId.set(e.id as string, em);
  }

  const emailSet = new Set<string>();
  for (const id of empIds) {
    const em = emailByEmpId.get(id);
    if (em) emailSet.add(em);
  }

  if (emailSet.size === 0) {
    return new Response(JSON.stringify({ ok: true, skipped: "no_recipients" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const dependentLines = dependents.map((d) => {
    const pn = projectNameById.get(d.project_id as string) || "Proyecto";
    const tn = (d.task_name as string) || "Tarea";
    return { taskName: tn, projectName: pn };
  });

  const siteUrl = getSiteUrl().replace(/\/$/, "");
  const appUrl = `${siteUrl}/planner`;

  const { html, text } = dependencyUnblockEmailHtml({
    agencyName,
    closerName,
    blockingTaskName,
    blockingProjectName,
    dependents: dependentLines,
    appUrl,
  });

  const toList = [...emailSet];
  const sendResult = await sendEmail({
    to: toList,
    subject: `Tarea desbloqueada — ${agencyName}`,
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
    agency_id: agencyId,
    rule_id: null,
    dedupe_key: dedupeKey,
    trigger_type: "dependency_unblock",
    payload: {
      completed_allocation_id: completedAllocationId,
      dependent_allocation_ids: dependents.map((d) => d.id),
    },
    recipient_emails: toList,
    resend_id: sendResult.id ?? null,
    success: true,
    error_message: null,
  });

  if (insErr) {
    console.error("[process-event-notifications] delivery insert", insErr);
  }

  return new Response(JSON.stringify({ ok: true, sent: toList.length }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
