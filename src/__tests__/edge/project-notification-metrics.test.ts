import { describe, it, expect } from "vitest";
import {
  analyzeProjectMonth,
  getEffectiveCompletedHours,
  isAllocationInEffectiveMonth,
  passesProjectClientFilters,
  projectMatchesIssueFlags,
  type AllocationRow,
  type ProjectRow,
} from "../../../supabase/functions/_shared/project-notification-metrics.ts";

describe("project-notification-metrics (Edge shared)", () => {
  const april2026 = new Date(2026, 3, 1);

  describe("isAllocationInEffectiveMonth", () => {
    it("acepta semana en el mismo mes calendario que viewMonth", () => {
      expect(isAllocationInEffectiveMonth("2026-04-07", april2026)).toBe(true);
    });

    it("rechaza fechas mal formadas", () => {
      expect(isAllocationInEffectiveMonth("no-es-fecha", april2026)).toBe(false);
    });

    it("rechaza semana de otro mes", () => {
      expect(isAllocationInEffectiveMonth("2026-03-30", april2026)).toBe(false);
    });
  });

  describe("getEffectiveCompletedHours", () => {
    const base: AllocationRow = {
      project_id: "p1",
      employee_id: "e1",
      week_start_date: "2026-04-07",
      hours_assigned: 1,
      status: "completed",
      hours_actual: 3,
      hours_computed: 5,
    };

    it("usa hours_actual cuando la preferencia es actual", () => {
      expect(getEffectiveCompletedHours(base, "actual")).toBe(3);
    });

    it("usa hours_computed cuando la preferencia es computed", () => {
      expect(getEffectiveCompletedHours(base, "computed")).toBe(5);
    });

    it("trata null como 0", () => {
      expect(
        getEffectiveCompletedHours({ ...base, hours_actual: null, hours_computed: null }, "actual"),
      ).toBe(0);
    });
  });

  describe("analyzeProjectMonth", () => {
    it("retorna null si el proyecto no está activo", () => {
      const project: ProjectRow = {
        id: "p1",
        client_id: "c1",
        status: "archived",
        budget_hours: 10,
        minimum_hours: 0,
      };
      expect(analyzeProjectMonth(project, [], april2026, 50, "computed")).toBeNull();
    });

    it("detecta over_budget cuando las horas asignadas superan el presupuesto", () => {
      const project: ProjectRow = {
        id: "p1",
        client_id: "c1",
        status: "active",
        budget_hours: 10,
        minimum_hours: 0,
      };
      const allocs: AllocationRow[] = [
        {
          project_id: "p1",
          employee_id: "e1",
          week_start_date: "2026-04-07",
          hours_assigned: 11,
          status: "open",
          hours_actual: null,
          hours_computed: null,
        },
      ];
      const a = analyzeProjectMonth(project, allocs, april2026, 40, "computed");
      expect(a).not.toBeNull();
      expect(a!.overBudget).toBe(true);
      expect(a!.totalAssigned).toBe(11);
    });

    it("detecta no_activity con presupuesto y cero horas asignadas en el mes", () => {
      const project: ProjectRow = {
        id: "p1",
        client_id: "c1",
        status: "active",
        budget_hours: 5,
        minimum_hours: 0,
      };
      const a = analyzeProjectMonth(project, [], april2026, 10, "computed");
      expect(a!.noActivity).toBe(true);
    });

    it("marca behind_schedule cuando el avance del mes supera el umbral y la ejecución va muy por debajo", () => {
      const project: ProjectRow = {
        id: "p1",
        client_id: "c1",
        status: "active",
        budget_hours: 100,
        minimum_hours: 0,
      };
      const allocs: AllocationRow[] = [
        {
          project_id: "p1",
          employee_id: "e1",
          week_start_date: "2026-04-07",
          hours_assigned: 40,
          status: "completed",
          hours_actual: null,
          hours_computed: 2,
        },
      ];
      const a = analyzeProjectMonth(project, allocs, april2026, 50, "computed");
      expect(a!.behindSchedule).toBe(true);
    });
  });

  describe("projectMatchesIssueFlags", () => {
    it("needs_planning no coincide si no_activity es verdadero (evita doble señal)", () => {
      const analysis = {
        projectId: "p1",
        clientId: "c1",
        needsPlanning: true,
        behindSchedule: false,
        overBudget: false,
        noActivity: true,
        involvedEmployeeIds: [],
        totalAssigned: 0,
        hoursComputed: 0,
        budget: 10,
        minimum: 0,
      };
      expect(projectMatchesIssueFlags(analysis, ["needs_planning"])).toBe(false);
      expect(projectMatchesIssueFlags(analysis, ["no_activity"])).toBe(true);
    });

    it("retorna false si la lista de flags está vacía", () => {
      const analysis = {
        projectId: "p1",
        clientId: "c1",
        needsPlanning: false,
        behindSchedule: false,
        overBudget: true,
        noActivity: false,
        involvedEmployeeIds: ["e1"],
        totalAssigned: 20,
        hoursComputed: 0,
        budget: 10,
        minimum: 0,
      };
      expect(projectMatchesIssueFlags(analysis, [])).toBe(false);
    });
  });

  describe("passesProjectClientFilters", () => {
    const analysis = {
      projectId: "p1",
      clientId: "c1",
      needsPlanning: false,
      behindSchedule: false,
      overBudget: false,
      noActivity: false,
      involvedEmployeeIds: [],
      totalAssigned: 0,
      hoursComputed: 0,
      budget: 0,
      minimum: 0,
    };

    it("excluye por projectIds cuando está definido", () => {
      expect(passesProjectClientFilters(analysis, ["p2"], undefined)).toBe(false);
      expect(passesProjectClientFilters(analysis, ["p1"], undefined)).toBe(true);
    });

    it("excluye por clientIds cuando está definido", () => {
      expect(passesProjectClientFilters(analysis, undefined, ["c2"])).toBe(false);
      expect(passesProjectClientFilters(analysis, undefined, ["c1"])).toBe(true);
    });
  });
});
