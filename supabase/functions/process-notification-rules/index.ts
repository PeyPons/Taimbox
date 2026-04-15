import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendEmail } from "../_shared/resend.ts";
import { getSiteUrl } from "../_shared/password-recovery-url.ts";
import { scheduledProjectAlertEmailHtml } from "../_shared/notification-email-templates.ts";
import {
  analyzeProjectMonth,
  passesProjectClientFilters,
  projectMatchesIssueFlags,
  type AllocationRow,
  type ProjectIssueFlag,
  type ProjectRow,
} from "../_shared/project-notification-metrics.ts";
import {
  computePlanningCoherenceInconsistencies,
  type AllocForCoherence,
  type DeadlineForCoherence,
  type EmployeeForCoherence,
  type Inconsistency,
  type ProjectForCoherence,
} from "../_shared/planning-coherence-compute.ts";
import {
  operationalStatusFromInconsistency,
  type CoherenceOpStatus,
  statusLabelEs,
} from "../_shared/coherence-operational-status.ts";
import { coherenceDigestEmailHtml, coherenceSingleProjectEmailHtml } from "../_shared/coherence-email-html.ts";
import {
  hoursPreferenceFromSettings,
  resolveEmailsForPolicy,
} from "../_shared/notification-recipients.ts";
import type { RecipientPolicy } from "../_shared/notification-recipients.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_COHERENCE_STATUSES: CoherenceOpStatus[] = [
  "over-budget",
  "behind-schedule",
  "needs-planning",
  "no-activity",
];

function issueLabels(flags: ProjectIssueFlag[]): string[] {
  const labels: string[] = [];
  for (const f of flags) {
    switch (f) {
      case "needs_planning":
        labels.push("Falta planificación (horas asignadas vs mínimo/presupuesto)");
        break;
      case "behind_schedule":
        labels.push("Ritmo de ejecución por debajo del esperado para el mes");
        break;
      case "over_budget":
        labels.push("Horas planificadas por encima del presupuesto mensual");
        break;
      case "no_activity":
        labels.push("Sin horas planificadas pese a tener presupuesto");
        break;
    }
  }
  return labels;
}

function parseConditions(raw: unknown): {
  matchAny: ProjectIssueFlag[];
  projectIds?: string[];
  clientIds?: string[];
  evaluation: "project_month_health" | "deadline_coherence";
  coherenceMinAbs: number;
  coherenceOpStatusIn: CoherenceOpStatus[];
  coherenceDeliveryMode: "per_project" | "digest";
  coherenceDigestMax: number;
} {
  if (!raw || typeof raw !== "object") {
    return {
      matchAny: ["over_budget", "needs_planning", "behind_schedule", "no_activity"],
      evaluation: "project_month_health",
      coherenceMinAbs: 0.05,
      coherenceOpStatusIn: [...DEFAULT_COHERENCE_STATUSES],
      coherenceDeliveryMode: "per_project",
      coherenceDigestMax: 12,
    };
  }
  const o = raw as Record<string, unknown>;
  const allowed: ProjectIssueFlag[] = [
    "needs_planning",
    "behind_schedule",
    "over_budget",
    "no_activity",
  ];
  let matchAny: ProjectIssueFlag[] = [];
  if (Array.isArray(o.match_any)) {
    matchAny = o.match_any.filter((x): x is ProjectIssueFlag =>
      typeof x === "string" && (allowed as string[]).includes(x)
    );
  }
  if (matchAny.length === 0) {
    matchAny = ["over_budget", "needs_planning", "behind_schedule", "no_activity"];
  }
  const projectIds = Array.isArray(o.project_ids)
    ? o.project_ids.filter((x): x is string => typeof x === "string")
    : undefined;
  const clientIds = Array.isArray(o.client_ids)
    ? o.client_ids.filter((x): x is string => typeof x === "string")
    : undefined;

  const evaluation = o.evaluation === "deadline_coherence" ? "deadline_coherence" : "project_month_health";
  const coherenceMinAbs = typeof o.coherence_min_abs_hours === "number" && o.coherence_min_abs_hours >= 0
    ? Number(o.coherence_min_abs_hours)
    : 0.05;

  let coherenceOpStatusIn: CoherenceOpStatus[] = [...DEFAULT_COHERENCE_STATUSES];
  if (Array.isArray(o.coherence_op_status_in) && o.coherence_op_status_in.length > 0) {
    const allowedSt: CoherenceOpStatus[] = [
      "over-budget",
      "behind-schedule",
      "needs-planning",
      "no-activity",
      "in-rule",
    ];
    coherenceOpStatusIn = o.coherence_op_status_in.filter((x): x is CoherenceOpStatus =>
      typeof x === "string" && (allowedSt as string[]).includes(x)
    );
    if (coherenceOpStatusIn.length === 0) coherenceOpStatusIn = [...DEFAULT_COHERENCE_STATUSES];
  }

  const coherenceDeliveryMode = o.coherence_delivery_mode === "digest" ? "digest" : "per_project";
  const digestRaw = o.coherence_digest_max;
  const coherenceDigestMax = typeof digestRaw === "number" && digestRaw > 0
    ? Math.min(50, Math.floor(digestRaw))
    : 12;

  return {
    matchAny,
    projectIds,
    clientIds,
    evaluation,
    coherenceMinAbs,
    coherenceOpStatusIn,
    coherenceDeliveryMode,
    coherenceDigestMax,
  };
}

function passesCoherenceThreshold(inc: Inconsistency, minAbs: number): boolean {
  if (Math.abs(inc.totalDifference) >= minAbs) return true;
  return inc.employees.some((e) => Math.abs(e.difference) >= minAbs);
}

function passesProjectClientFiltersCoherence(
  inc: Inconsistency,
  clientByProjectId: Map<string, string>,
  projectIds?: string[],
  clientIds?: string[],
): boolean {
  if (projectIds?.length && !projectIds.includes(inc.projectId)) return false;
  const cid = clientByProjectId.get(inc.projectId);
  if (clientIds?.length && (!cid || !clientIds.includes(cid))) return false;
  return true;
}

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

  const cronSecret = Deno.env.get("NOTIFICATIONS_CRON_SECRET");
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";

  if (!cronSecret || token !== cronSecret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(JSON.stringify({ error: "Server misconfigured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  let body: { agencyId?: string; force?: boolean } = {};
  try {
    if (req.headers.get("content-type")?.includes("application/json")) {
      body = await req.json();
    }
  } catch { /* empty body ok */ }

  const filterAgencyId = typeof body.agencyId === "string" ? body.agencyId : null;
  const force = body.force === true;

  const now = new Date();
  const viewMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const daysInMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0))
    .getUTCDate();
  const monthProgress = Math.round((now.getUTCDate() / daysInMonth) * 100);
  const monthKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const hourUtc = now.getUTCHours();

  let rulesQuery = supabaseAdmin
    .from("notification_rules")
    .select("*")
    .eq("enabled", true)
    .eq("trigger_type", "scheduled");

  if (filterAgencyId) {
    rulesQuery = rulesQuery.eq("agency_id", filterAgencyId);
  }

  const { data: rules, error: rulesErr } = await rulesQuery;
  if (rulesErr) {
    console.error("[process-notification-rules]", rulesErr);
    return new Response(JSON.stringify({ error: "Failed to load rules" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const siteUrl = getSiteUrl().replace(/\/$/, "");
  const appUrlProjects = `${siteUrl}/projects`;
  const appUrlOperaciones = `${siteUrl}/operaciones`;

  let emailsAttempted = 0;
  let emailsSent = 0;
  const errors: string[] = [];

  for (const rule of rules || []) {
    if (
      rule.schedule_hour_utc !== null &&
      rule.schedule_hour_utc !== undefined &&
      !force
    ) {
      const h = Number(rule.schedule_hour_utc);
      if (Number.isFinite(h) && h !== hourUtc) {
        continue;
      }
    }

    const agencyId = rule.agency_id as string;
    const { data: agency } = await supabaseAdmin
      .from("agencies")
      .select("name, settings")
      .eq("id", agencyId)
      .maybeSingle();

    const agencyName = (agency?.name as string) || "Agencia";
    const agencySettings = (agency?.settings as Record<string, unknown>) || {};
    const hoursPref = hoursPreferenceFromSettings(agencySettings);
    const cond = parseConditions(rule.conditions);

    if (cond.evaluation === "deadline_coherence") {
      const { data: projectsFull } = await supabaseAdmin
        .from("projects")
        .select("id, name, client_id, budget_hours, minimum_hours, status")
        .eq("agency_id", agencyId)
        .eq("status", "active");

      const projectsList = (projectsFull || []) as Array<{
        id: string;
        name: string;
        client_id: string;
        budget_hours: number | null;
        minimum_hours: number | null;
      }>;

      const projectIds = projectsList.map((p) => p.id);
      if (!projectIds.length) continue;

      const clientByProjectId = new Map(projectsList.map((p) => [p.id, p.client_id]));

      const { data: deadlineRows } = await supabaseAdmin
        .from("deadlines")
        .select(
          "project_id, month, employee_hours, is_hidden, budget_override",
        )
        .eq("month", monthKey)
        .in("project_id", projectIds)
        .eq("is_hidden", false);

      const deadlines: DeadlineForCoherence[] = (deadlineRows || []).map((d) => ({
        projectId: d.project_id as string,
        month: String(d.month),
        employeeHours: (d.employee_hours as Record<string, number>) || {},
        isHidden: Boolean(d.is_hidden),
        budgetOverride: d.budget_override as number | null | undefined,
      }));

      const { data: allocsRaw } = await supabaseAdmin
        .from("allocations")
        .select(
          "project_id, employee_id, week_start_date, hours_assigned, status, hours_actual, hours_computed",
        )
        .in("project_id", projectIds);

      const allocations: AllocForCoherence[] = (allocsRaw || []).map((a) => ({
        projectId: a.project_id as string,
        employeeId: a.employee_id as string,
        weekStartDate: String(a.week_start_date),
        hoursAssigned: Number(a.hours_assigned) || 0,
        status: String(a.status),
        hoursActual: a.hours_actual as number | null,
        hoursComputed: a.hours_computed as number | null,
      }));

      const { data: empsRaw } = await supabaseAdmin
        .from("employees")
        .select("id, name, avatar_url")
        .eq("agency_id", agencyId)
        .eq("is_active", true);

      const employees: EmployeeForCoherence[] = (empsRaw || []).map((e) => ({
        id: e.id as string,
        name: String(e.name ?? ""),
        avatarUrl: e.avatar_url as string | null,
      }));

      const projectsForCoherence: ProjectForCoherence[] = projectsList.map((p) => ({
        id: p.id,
        name: p.name,
        budgetHours: Number(p.budget_hours) || 0,
        minimumHours: Number(p.minimum_hours) || 0,
      }));

      const inconsistencies = computePlanningCoherenceInconsistencies({
        deadlines,
        allocations,
        projects: projectsForCoherence,
        employees,
        viewDate: viewMonth,
        hoursTrackingPreference: hoursPref,
      });

      let flagged: Array<{ inc: Inconsistency; opStatus: CoherenceOpStatus }> = [];

      for (const inc of inconsistencies) {
        if (!passesProjectClientFiltersCoherence(inc, clientByProjectId, cond.projectIds, cond.clientIds)) {
          continue;
        }
        if (!passesCoherenceThreshold(inc, cond.coherenceMinAbs)) continue;
        const opStatus = operationalStatusFromInconsistency(inc, monthProgress);
        if (!cond.coherenceOpStatusIn.includes(opStatus)) continue;
        flagged.push({ inc, opStatus });
      }

      if (!flagged.length) continue;

      const policy = rule.recipient_policy as RecipientPolicy;

      if (cond.coherenceDeliveryMode === "digest") {
        flagged = flagged.slice(0, cond.coherenceDigestMax);
        const dedupeKey = `scheduled_coherence_digest|${rule.id}|${monthKey}`;
        const { data: existing } = await supabaseAdmin
          .from("notification_deliveries")
          .select("id")
          .eq("agency_id", agencyId)
          .eq("dedupe_key", dedupeKey)
          .maybeSingle();
        if (existing) continue;

        const allEmpIds = [...new Set(flagged.flatMap((f) => f.inc.employees.map((e) => e.employeeId)))];
        const recipients = await resolveEmailsForPolicy({
          supabaseAdmin,
          policy,
          recipientRoleName: rule.recipient_role_name as string | null,
          extraEmails: (rule.extra_emails as string[]) || [],
          agencyId,
          agencySettings,
          involvedEmployeeIds: allEmpIds,
        });
        if (recipients.length === 0) continue;

        const intro =
          `Resumen de ${flagged.length} proyecto(s) con desviación respecto a deadlines / planificación (umbral ≥ ${cond.coherenceMinAbs}h).`;

        const { html, text } = coherenceDigestEmailHtml({
          agencyName,
          monthLabel: monthKey,
          intro,
          items: flagged,
          appUrl: appUrlOperaciones,
        });

        emailsAttempted++;
        const sendResult = await sendEmail({
          to: recipients,
          subject: `Coherencia de planificación — ${flagged.length} proyecto(s) · ${monthKey}`,
          html,
          text,
        });

        if (sendResult.success) {
          await supabaseAdmin.from("notification_deliveries").insert({
            agency_id: agencyId,
            rule_id: rule.id as string,
            dedupe_key: dedupeKey,
            trigger_type: "scheduled",
            payload: {
              kind: "deadline_coherence_digest",
              month: monthKey,
              project_ids: flagged.map((f) => f.inc.projectId),
            },
            recipient_emails: recipients,
            resend_id: sendResult.id ?? null,
            success: true,
            error_message: null,
          });
          emailsSent++;
        } else if (sendResult.error) {
          errors.push(`digest ${rule.id}: ${sendResult.error}`);
        }
      } else {
        for (const { inc, opStatus } of flagged) {
          const dedupeKey = `scheduled_coherence|${rule.id}|${inc.projectId}|${monthKey}`;
          const { data: existing } = await supabaseAdmin
            .from("notification_deliveries")
            .select("id")
            .eq("agency_id", agencyId)
            .eq("dedupe_key", dedupeKey)
            .maybeSingle();
          if (existing) continue;

          const empIds = inc.employees.map((e) => e.employeeId);
          const recipients = await resolveEmailsForPolicy({
            supabaseAdmin,
            policy,
            recipientRoleName: rule.recipient_role_name as string | null,
            extraEmails: (rule.extra_emails as string[]) || [],
            agencyId,
            agencySettings,
            involvedEmployeeIds: empIds,
          });
          if (recipients.length === 0) continue;

          const { html, text } = coherenceSingleProjectEmailHtml({
            agencyName,
            monthLabel: monthKey,
            inc,
            opStatus,
            appUrl: appUrlOperaciones,
          });

          emailsAttempted++;
          const sendResult = await sendEmail({
            to: recipients,
            subject: `${statusLabelEs(opStatus)}: ${inc.projectName} (${monthKey})`,
            html,
            text,
          });

          if (sendResult.success) {
            await supabaseAdmin.from("notification_deliveries").insert({
              agency_id: agencyId,
              rule_id: rule.id as string,
              dedupe_key: dedupeKey,
              trigger_type: "scheduled",
              payload: {
                kind: "deadline_coherence",
                month: monthKey,
                project_id: inc.projectId,
                op_status: opStatus,
              },
              recipient_emails: recipients,
              resend_id: sendResult.id ?? null,
              success: true,
              error_message: null,
            });
            emailsSent++;
          } else if (sendResult.error) {
            errors.push(`${inc.projectId}: ${sendResult.error}`);
          }
        }
      }

      continue;
    }

    const { data: projectsRaw } = await supabaseAdmin
      .from("projects")
      .select("id, client_id, status, budget_hours, minimum_hours")
      .eq("agency_id", agencyId)
      .eq("status", "active");

    const projects = (projectsRaw || []) as ProjectRow[];
    const projectIds = projects.map((p) => p.id);
    if (!projectIds.length) continue;

    const { data: allocsRaw } = await supabaseAdmin
      .from("allocations")
      .select(
        "project_id, employee_id, week_start_date, hours_assigned, status, hours_actual, hours_computed",
      )
      .in("project_id", projectIds);

    const allocations: AllocationRow[] = (allocsRaw || []).map((a) => ({
      project_id: a.project_id as string,
      employee_id: a.employee_id as string,
      week_start_date: String(a.week_start_date),
      hours_assigned: Number(a.hours_assigned) || 0,
      status: String(a.status),
      hours_actual: a.hours_actual as number | null,
      hours_computed: a.hours_computed as number | null,
    }));

    for (const project of projects) {
      const analysis = analyzeProjectMonth(
        project,
        allocations,
        viewMonth,
        monthProgress,
        hoursPref,
      );
      if (!analysis) continue;
      if (!passesProjectClientFilters(analysis, cond.projectIds, cond.clientIds)) continue;
      if (!projectMatchesIssueFlags(analysis, cond.matchAny)) continue;

      const matchedFlags = cond.matchAny.filter((f) => {
        const one = projectMatchesIssueFlags(analysis, [f]);
        return one;
      });

      const dedupeKey = `scheduled|${rule.id}|${project.id}|${monthKey}`;
      const { data: existing } = await supabaseAdmin
        .from("notification_deliveries")
        .select("id")
        .eq("agency_id", agencyId)
        .eq("dedupe_key", dedupeKey)
        .maybeSingle();

      if (existing) continue;

      const policy = rule.recipient_policy as RecipientPolicy;
      const recipients = await resolveEmailsForPolicy({
        supabaseAdmin,
        policy,
        recipientRoleName: rule.recipient_role_name as string | null,
        extraEmails: (rule.extra_emails as string[]) || [],
        agencyId,
        agencySettings,
        involvedEmployeeIds: analysis.involvedEmployeeIds,
      });

      if (recipients.length === 0) {
        continue;
      }

      const { data: projRow } = await supabaseAdmin
        .from("projects")
        .select("name")
        .eq("id", project.id)
        .maybeSingle();
      const projectName = (projRow?.name as string) || "Proyecto";

      const { html, text } = scheduledProjectAlertEmailHtml({
        agencyName,
        projectName,
        issues: issueLabels(matchedFlags.length ? matchedFlags : cond.matchAny),
        monthLabel: monthKey,
        appUrl: appUrlProjects,
      });

      emailsAttempted++;
      const sendResult = await sendEmail({
        to: recipients,
        subject: `Alerta de proyecto: ${projectName} (${monthKey})`,
        html,
        text,
      });

      if (sendResult.success) {
        const { error: insErr } = await supabaseAdmin.from("notification_deliveries").insert({
          agency_id: agencyId,
          rule_id: rule.id as string,
          dedupe_key: dedupeKey,
          trigger_type: "scheduled",
          payload: {
            project_id: project.id,
            month: monthKey,
            flags: matchedFlags,
          },
          recipient_emails: recipients,
          resend_id: sendResult.id ?? null,
          success: true,
          error_message: null,
        });

        if (insErr) {
          console.error("[process-notification-rules] insert delivery", insErr);
        } else {
          emailsSent++;
        }
      } else if (sendResult.error) {
        errors.push(`${project.id}: ${sendResult.error}`);
      }
    }
  }

  return new Response(
    JSON.stringify({
      ok: true,
      monthKey,
      hourUtc,
      emailsAttempted,
      emailsSent,
      errors: errors.slice(0, 20),
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
