import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { parseISO } from 'date-fns';
import type { Allocation, Project } from '@/types';
import type { ProjectMetrics } from '@/utils/projectMetricsCompute';
import { buildOperationsRadarExportPayload } from '@/utils/operationsRadarExport';

function pm(overrides: Partial<ProjectMetrics> = {}): ProjectMetrics {
  return {
    projectId: 'p1',
    projectName: 'Alpha',
    clientId: 'c1',
    clientName: 'Cliente',
    planned: 40,
    actual: 40,
    computed: 40,
    budget: 100,
    minimum: 0,
    monthlyFee: 1000,
    hourlyRate: 50,
    hoursValue: 1000,
    progressOperational: 40,
    progressBilling: 40,
    available: 60,
    isPacing: true,
    isOverBudget: false,
    ...overrides,
  };
}

describe('buildOperationsRadarExportPayload', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-15T12:00:00Z'));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  const viewDate = parseISO('2026-03-01');
  const baseParams = {
    viewDate,
    isEndOfMonth: false,
    radarLowProgressExcludeKeywords: [] as string[],
    selectedDepartmentId: null as string | null,
    departments: [] as { id: string; name: string }[],
    employees: [] as import('@/types').Employee[],
    allocations: [] as Allocation[],
    projects: [] as Project[],
    hoursTrackingPreference: null as 'actual' | 'computed' | null,
  };

  it('marca over-budget cuando las horas reales superan el presupuesto', () => {
    const payload = buildOperationsRadarExportPayload({
      ...baseParams,
      projectMetrics: [
        pm({
          projectId: 'over',
          projectName: 'Sobrecoste',
          actual: 120,
          computed: 120,
          budget: 100,
          isPacing: false,
        }),
      ],
    });
    const row = payload.rowsWithStatus.find((r) => r.projectId === 'over');
    expect(row?.status).toBe('over-budget');
    expect(payload.filterCounts['over-budget']).toBeGreaterThanOrEqual(1);
    expect(payload.atRiskProjects.some((r) => r.riskType === 'overBudget')).toBe(true);
  });

  it('filtra riesgos por departamento: proyecto fuera del filtro no aparece en atRisk', () => {
    const allocations: Allocation[] = [
      {
        id: 'a1',
        employeeId: 'e-dept',
        projectId: 'p-dept',
        weekStartDate: '2026-03-02',
        hoursAssigned: 10,
        status: 'pending',
      },
    ];
    const projects: Project[] = [
      {
        id: 'p-dept',
        agencyId: 'a1',
        clientId: 'c1',
        name: 'Solo dept',
        status: 'active',
        budgetHours: 50,
        monthlyFee: 500,
        responsibleDepartmentId: 'd1',
      },
      {
        id: 'p-other',
        agencyId: 'a1',
        clientId: 'c1',
        name: 'Otro',
        status: 'active',
        budgetHours: 50,
        monthlyFee: 500,
      },
    ];
    const payload = buildOperationsRadarExportPayload({
      ...baseParams,
      selectedDepartmentId: 'd1',
      departments: [{ id: 'd1', name: 'Equipo A' }],
      employees: [
        {
          id: 'e-dept',
          agencyId: 'a1',
          name: 'Ana',
          role: 'dev',
          department: 'Equipo A',
          departmentId: 'd1',
          defaultWeeklyCapacity: 40,
          workSchedule: {
            monday: 8,
            tuesday: 8,
            wednesday: 8,
            thursday: 8,
            friday: 8,
            saturday: 0,
            sunday: 0,
          },
          isActive: true,
        } as import('@/types').Employee,
      ],
      allocations,
      projects,
      projectMetrics: [
        pm({
          projectId: 'p-dept',
          projectName: 'Solo dept',
          actual: 120,
          budget: 100,
          isPacing: false,
        }),
        pm({
          projectId: 'p-other',
          projectName: 'Global riesgo',
          actual: 200,
          budget: 50,
          isPacing: false,
        }),
      ],
    });
    expect(payload.atRiskProjects.every((r) => r.projectId === 'p-dept')).toBe(true);
    expect(payload.rowsWithStatus.some((r) => r.projectId === 'p-other')).toBe(false);
  });

  it('excluye palabras clave del riesgo de bajo avance a fin de mes', () => {
    const payload = buildOperationsRadarExportPayload({
      ...baseParams,
      isEndOfMonth: true,
      radarLowProgressExcludeKeywords: ['interno'],
      projectMetrics: [
        pm({
          projectId: 'int',
          projectName: 'Proyecto interno demo',
          actual: 10,
          computed: 10,
          budget: 100,
          progressOperational: 10,
          isPacing: false,
        }),
      ],
    });
    expect(payload.atRiskProjects.some((r) => r.riskType === 'lowProgress')).toBe(false);
  });

  it('publica schemaVersion y viewMonthKey coherentes con la fecha de vista', () => {
    const payload = buildOperationsRadarExportPayload({
      ...baseParams,
      projectMetrics: [pm()],
    });
    expect(payload.schemaVersion).toBe(1);
    expect(payload.viewMonthKey).toBe('2026-03');
    expect(payload.exportedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
