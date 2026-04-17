import type { Inconsistency } from "./planning-coherence-compute.ts";
import type { ProjectIssueFlag } from "./project-notification-metrics.ts";
import type { CoherenceOpStatus } from "./coherence-operational-status.ts";

const DEFAULT_COHERENCE_STATUSES: CoherenceOpStatus[] = [
  "over-budget",
  "behind-schedule",
  "needs-planning",
  "no-activity",
];

export function issueLabels(flags: ProjectIssueFlag[]): string[] {
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

export type ParsedNotificationConditions = {
  matchAny: ProjectIssueFlag[];
  projectIds?: string[];
  clientIds?: string[];
  evaluation: "project_month_health" | "deadline_coherence";
  coherenceMinAbs: number;
  coherenceOpStatusIn: CoherenceOpStatus[];
  coherenceDeliveryMode: "per_project" | "digest";
  coherenceDigestMax: number;
};

export function parseConditions(raw: unknown): ParsedNotificationConditions {
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

export function passesCoherenceThreshold(inc: Inconsistency, minAbs: number): boolean {
  if (Math.abs(inc.totalDifference) >= minAbs) return true;
  return inc.employees.some((e) => Math.abs(e.difference) >= minAbs);
}

export function passesProjectClientFiltersCoherence(
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

/** Si ya hay entrega con la misma dedupe_key y no se fuerza reenvío, no se debe enviar de nuevo. */
export function shouldSkipDueToDedupe(
  existing: { id?: string } | null | undefined,
  ignoreDedupe: boolean,
): boolean {
  return Boolean(existing) && !ignoreDedupe;
}
