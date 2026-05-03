import type { Inconsistency } from "./planning-coherence-compute.ts";

export type CoherenceOpStatus =
  | "over-budget"
  | "behind-schedule"
  | "needs-planning"
  | "no-activity"
  | "in-rule";

function round2(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Aproxima la prioridad de OperationsRadarPage/getStatus sin `riskType` del hook de riesgos.
 */
export function operationalStatusFromInconsistency(
  inc: Inconsistency,
  monthProgress: number,
): CoherenceOpStatus {
  const effectiveUsage = round2(inc.totalPlannedHours + inc.totalComputedHours);
  const budget = inc.budgetHours;
  const planned = inc.totalPlannedHours;
  const computed = inc.totalComputedHours;

  const deadlineExcess = inc.totalDeadlineHours > 0 && inc.totalDifference > 0.05;
  const effectiveOverBudget = budget > 0 && round2(effectiveUsage) > round2(budget);
  if (deadlineExcess || effectiveOverBudget) return "over-budget";

  if (budget > 0 && monthProgress > 30) {
    const executionPct = effectiveUsage > 0 ? (computed / effectiveUsage) * 100 : 0;
    if (executionPct < monthProgress - 20) return "behind-schedule";
  }

  if (budget > 0 && planned === 0 && computed === 0) return "no-activity";

  const shortOfBudget = budget > 0 && effectiveUsage < round2(budget);
  if (shortOfBudget) return "needs-planning";

  return "in-rule";
}

export function statusLabelEs(status: CoherenceOpStatus): string {
  switch (status) {
    case "over-budget":
      return "Exceso horas";
    case "behind-schedule":
      return "Retrasados";
    case "needs-planning":
      return "Falta planificar";
    case "no-activity":
      return "Sin actividad";
    default:
      return "En regla";
  }
}
