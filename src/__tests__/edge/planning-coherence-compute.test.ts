import { describe, it, expect } from "vitest";
import { computePlanningCoherenceInconsistencies } from "../../../supabase/functions/_shared/planning-coherence-compute.ts";

describe("planning-coherence-compute (Edge shared)", () => {
  const viewApril = new Date(2026, 3, 15);

  it("omite deadlines ocultos", () => {
    const res = computePlanningCoherenceInconsistencies({
      deadlines: [
        {
          projectId: "p1",
          month: "2026-04",
          employeeHours: { e1: 10 },
          isHidden: true,
        },
      ],
      allocations: [],
      projects: [{ id: "p1", name: "Proy", budgetHours: 20, minimumHours: 0 }],
      employees: [{ id: "e1", name: "Ana", avatarUrl: null }],
      viewDate: viewApril,
    });
    expect(res).toEqual([]);
  });

  it("calcula diferencia por empleado respecto al deadline y agrega totales", () => {
    const res = computePlanningCoherenceInconsistencies({
      deadlines: [
        {
          projectId: "p1",
          month: "2026-04",
          employeeHours: { e1: 10 },
          isHidden: false,
        },
      ],
      allocations: [
        {
          projectId: "p1",
          employeeId: "e1",
          weekStartDate: "2026-04-07",
          hoursAssigned: 4,
          status: "open",
          hoursActual: null,
          hoursComputed: null,
        },
        {
          projectId: "p1",
          employeeId: "e1",
          weekStartDate: "2026-04-14",
          hoursAssigned: 0,
          status: "completed",
          hoursActual: null,
          hoursComputed: 3,
        },
      ],
      projects: [{ id: "p1", name: "Proy", budgetHours: 20, minimumHours: 0 }],
      employees: [{ id: "e1", name: "Ana", avatarUrl: null }],
      viewDate: viewApril,
      hoursTrackingPreference: "computed",
    });
    expect(res).toHaveLength(1);
    expect(res[0].totalPlannedHours).toBe(4);
    expect(res[0].totalComputedHours).toBe(3);
    expect(res[0].totalDeadlineHours).toBe(10);
    expect(res[0].totalDifference).toBe(-3);
    const emp = res[0].employees.find((x) => x.employeeId === "e1");
    expect(emp?.difference).toBe(-3);
  });

  it("aplica budgetOverride del deadline al presupuesto efectivo", () => {
    const res = computePlanningCoherenceInconsistencies({
      deadlines: [
        {
          projectId: "p1",
          month: "2026-04",
          employeeHours: { e1: 1 },
          isHidden: false,
          budgetOverride: 99,
        },
      ],
      allocations: [],
      projects: [{ id: "p1", name: "Proy", budgetHours: 5, minimumHours: 0 }],
      employees: [{ id: "e1", name: "Ana", avatarUrl: null }],
      viewDate: viewApril,
    });
    expect(res[0].budgetHours).toBe(99);
  });

  it("incluye empleados con horas planificadas pero sin entrada en employeeHours del deadline", () => {
    const res = computePlanningCoherenceInconsistencies({
      deadlines: [
        {
          projectId: "p1",
          month: "2026-04",
          employeeHours: { e1: 5 },
          isHidden: false,
        },
      ],
      allocations: [
        {
          projectId: "p1",
          employeeId: "e2",
          weekStartDate: "2026-04-07",
          hoursAssigned: 2,
          status: "open",
          hoursActual: null,
          hoursComputed: null,
        },
      ],
      projects: [{ id: "p1", name: "Proy", budgetHours: 50, minimumHours: 0 }],
      employees: [
        { id: "e1", name: "Ana", avatarUrl: null },
        { id: "e2", name: "Luis", avatarUrl: null },
      ],
      viewDate: viewApril,
    });
    expect(res[0].employees.some((e) => e.employeeId === "e2" && !e.hasDeadline)).toBe(true);
  });

  it("para tareas completadas usa hoursActual cuando hoursTrackingPreference es actual", () => {
    const resComputed = computePlanningCoherenceInconsistencies({
      deadlines: [
        {
          projectId: "p1",
          month: "2026-04",
          employeeHours: { e1: 10 },
          isHidden: false,
        },
      ],
      allocations: [
        {
          projectId: "p1",
          employeeId: "e1",
          weekStartDate: "2026-04-07",
          hoursAssigned: 0,
          status: "completed",
          hoursActual: 7,
          hoursComputed: 1,
        },
      ],
      projects: [{ id: "p1", name: "Proy", budgetHours: 20, minimumHours: 0 }],
      employees: [{ id: "e1", name: "Ana", avatarUrl: null }],
      viewDate: viewApril,
      hoursTrackingPreference: "actual",
    });
    expect(resComputed[0].totalComputedHours).toBe(7);

    const resDefault = computePlanningCoherenceInconsistencies({
      deadlines: [
        {
          projectId: "p1",
          month: "2026-04",
          employeeHours: { e1: 10 },
          isHidden: false,
        },
      ],
      allocations: [
        {
          projectId: "p1",
          employeeId: "e1",
          weekStartDate: "2026-04-07",
          hoursAssigned: 0,
          status: "completed",
          hoursActual: 7,
          hoursComputed: 1,
        },
      ],
      projects: [{ id: "p1", name: "Proy", budgetHours: 20, minimumHours: 0 }],
      employees: [{ id: "e1", name: "Ana", avatarUrl: null }],
      viewDate: viewApril,
      hoursTrackingPreference: null,
    });
    expect(resDefault[0].totalComputedHours).toBe(1);
  });
});
