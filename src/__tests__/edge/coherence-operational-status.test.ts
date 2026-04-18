import { describe, it, expect } from "vitest";
import {
  operationalStatusFromInconsistency,
  statusLabelEs,
  type CoherenceOpStatus,
} from "../../../supabase/functions/_shared/coherence-operational-status.ts";
import type { Inconsistency } from "../../../supabase/functions/_shared/planning-coherence-compute.ts";

function baseInc(partial: Partial<Inconsistency>): Inconsistency {
  return {
    projectId: "p1",
    projectName: "Proyecto",
    employees: [],
    totalDeadlineHours: 0,
    totalPlannedHours: 0,
    totalComputedHours: 0,
    totalDifference: 0,
    budgetHours: 0,
    minimumHours: 0,
    ...partial,
  };
}

describe("coherence-operational-status (Edge shared)", () => {
  it("prioriza over-budget cuando hay exceso claro respecto al deadline", () => {
    const st = operationalStatusFromInconsistency(
      baseInc({
        totalDeadlineHours: 10,
        totalPlannedHours: 12,
        totalComputedHours: 0,
        totalDifference: 2,
        budgetHours: 100,
      }),
      40,
    );
    expect(st).toBe("over-budget");
  });

  it("marca behind-schedule cuando el mes avanzó y la ejecución va muy por debajo del ritmo", () => {
    const st = operationalStatusFromInconsistency(
      baseInc({
        totalDeadlineHours: 0,
        totalPlannedHours: 40,
        totalComputedHours: 2,
        totalDifference: 0,
        budgetHours: 80,
      }),
      50,
    );
    expect(st).toBe("behind-schedule");
  });

  it("marca no-activity cuando hay presupuesto pero cero planificado y cero computado", () => {
    const st = operationalStatusFromInconsistency(
      baseInc({
        budgetHours: 10,
        totalPlannedHours: 0,
        totalComputedHours: 0,
      }),
      10,
    );
    expect(st).toBe("no-activity");
  });

  it("marca needs-planning cuando el uso efectivo está por debajo del presupuesto", () => {
    const st = operationalStatusFromInconsistency(
      baseInc({
        budgetHours: 40,
        totalPlannedHours: 5,
        totalComputedHours: 5,
        totalDeadlineHours: 0,
      }),
      20,
    );
    expect(st).toBe("needs-planning");
  });

  it("devuelve in-rule cuando no aplica ninguna alerta fuerte", () => {
    const st = operationalStatusFromInconsistency(
      baseInc({
        budgetHours: 40,
        totalPlannedHours: 20,
        totalComputedHours: 20,
        totalDeadlineHours: 40,
        totalDifference: 0,
      }),
      20,
    );
    expect(st).toBe("in-rule");
  });

  it("statusLabelEs devuelve etiquetas en español conocidas", () => {
    const keys: CoherenceOpStatus[] = [
      "over-budget",
      "behind-schedule",
      "needs-planning",
      "no-activity",
      "in-rule",
    ];
    const labels = keys.map((k) => statusLabelEs(k));
    expect(labels).toEqual([
      "Exceso horas",
      "Retrasados",
      "Falta planificar",
      "Sin actividad",
      "En regla",
    ]);
  });
});
