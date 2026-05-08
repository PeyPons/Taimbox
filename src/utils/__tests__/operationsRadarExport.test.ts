import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { parseISO } from 'date-fns';
import { buildOperationsRadarExportPayload } from '@/utils/operationsRadarExport';
import type { ProjectMetrics } from '@/utils/projectMetricsCompute';
import type { Allocation, Employee, Project } from '@/types';

const workSchedule = {
  monday: 8,
  tuesday: 8,
  wednesday: 8,
  thursday: 8,
  friday: 8,
  saturday: 0,
  sunday: 0,
};

const employee = (id: string, departmentId?: string, department?: string): Employee => ({
  id,
  agencyId: 'a1',
  name: `E ${id}`,
  role: 'dev',
  defaultWeeklyCapacity: 40,
  workSchedule,
  isActive: true,
  departmentId,
  department,
});

const baseProject = (overrides: Partial<Project> = {}): Project => ({
  id: 'p1',
  agencyId: 'a1',
  clientId: 'c1',
  name: 'Proyecto',
  status: 'active',
  budgetHours: 100,
  monthlyFee: 5000,
  ...overrides,
});

const baseMetric = (overrides: Partial<ProjectMetrics> = {}): ProjectMetrics => ({
  projectId: 'p1',
  projectName: 'Proyecto Uno',
  clientId: 'c1',
  clientName: 'Cliente',
  planned: 40,
  actual: 30,
  computed: 30,
  budget: 100,
  minimum: 0,
  monthlyFee: 5000,
  hourlyRate: 50,
  hoursValue: 0,
  progressOperational: 50,
  progressBilling: 50,
  available: 0,
  isPacing: true,
  isOverBudget: false,
  ...overrides,
});

const januaryView = parseISO('2026-01-15');

describe('buildOperationsRadarExportPayload', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-10T12:00:00Z'));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('clasifica riesgo critical por horas muy por encima del presupuesto', () => {
    const payload = buildOperationsRadarExportPayload({
      projectMetrics: [
        baseMetric({
          projectId: 'p-over',
          actual: 110,
          budget: 100,
          isPacing: false,
        }),
      ],
      viewDate: januaryView,
      isEndOfMonth: false,
      radarLowProgressExcludeKeywords: [],
      selectedDepartmentId: null,
      departments: [],
      employees: [],
      allocations: [],
      projects: [baseProject({ id: 'p-over' })],
    });
    const risk = payload.atRiskProjects.find((r) => r.projectId === 'p-over');
    expect(risk?.riskType).toBe('overBudget');
    expect(risk?.riskLevel).toBe('critical');
  });

  it('fin de mes: avance bajo sin exclusiones → lowProgress', () => {
    const payload = buildOperationsRadarExportPayload({
      projectMetrics: [
        baseMetric({
          projectId: 'p-slow',
          actual: 10,
          budget: 100,
          isPacing: false,
        }),
      ],
      viewDate: januaryView,
      isEndOfMonth: true,
      radarLowProgressExcludeKeywords: [],
      selectedDepartmentId: null,
      departments: [],
      employees: [],
      allocations: [],
      projects: [baseProject({ id: 'p-slow' })],
    });
    const risk = payload.atRiskProjects.find((r) => r.projectId === 'p-slow');
    expect(risk?.riskType).toBe('lowProgress');
  });

  it('las palabras clave de exclusión evitan lowProgress por nombre de proyecto', () => {
    const payload = buildOperationsRadarExportPayload({
      projectMetrics: [
        baseMetric({
          projectId: 'p-internal',
          projectName: 'Proyecto interno revisión',
          actual: 5,
          budget: 100,
          isPacing: false,
        }),
      ],
      viewDate: januaryView,
      isEndOfMonth: true,
      radarLowProgressExcludeKeywords: ['interno'],
      selectedDepartmentId: null,
      departments: [],
      employees: [],
      allocations: [],
      projects: [baseProject({ id: 'p-internal', name: 'Proyecto interno revisión' })],
    });
    expect(payload.atRiskProjects.some((r) => r.riskType === 'lowProgress')).toBe(false);
  });

  it('filtra por departamento: solo entran proyectos con asignaciones del mes para empleados del área', () => {
    const dept = { id: 'd-dev', name: 'Dev' };
    const eDev = { ...employee('e-dev', 'd-dev'), department: 'd-dev' };
    const eOther = { ...employee('e-other', 'd-mkt'), department: 'd-mkt' };
    const alloc: Allocation = {
      id: 'a1',
      employeeId: 'e-dev',
      projectId: 'p-dev',
      weekStartDate: '2026-01-06',
      hoursAssigned: 8,
      hoursActual: 8,
      status: 'completed',
    };
    const payload = buildOperationsRadarExportPayload({
      projectMetrics: [
        baseMetric({ projectId: 'p-dev', projectName: 'Solo Dev', actual: 20, budget: 80, isPacing: true }),
        baseMetric({
          projectId: 'p-other',
          projectName: 'Otro',
          actual: 40,
          budget: 80,
          isPacing: true,
        }),
      ],
      viewDate: januaryView,
      isEndOfMonth: false,
      radarLowProgressExcludeKeywords: [],
      selectedDepartmentId: 'd-dev',
      departments: [dept],
      employees: [eDev, eOther],
      allocations: [alloc],
      projects: [
        baseProject({ id: 'p-dev', name: 'Solo Dev' }),
        baseProject({ id: 'p-other', name: 'Otro' }),
      ],
    });
    expect(payload.rowsWithStatus.map((r) => r.projectId)).toEqual(['p-dev']);
  });

  it('si el uso efectivo supera el presupuesto, el estado exportado es over-budget aunque el riesgo fuera solo de ritmo', () => {
    const allocCompleted: Allocation = {
      id: 'a1',
      employeeId: 'e1',
      projectId: 'p1',
      weekStartDate: '2026-01-06',
      hoursAssigned: 50,
      hoursActual: 50,
      hoursComputed: 50,
      status: 'completed',
    };
    const allocPending: Allocation = {
      id: 'a2',
      employeeId: 'e1',
      projectId: 'p1',
      weekStartDate: '2026-01-06',
      hoursAssigned: 60,
      status: 'planned',
    };
    const payload = buildOperationsRadarExportPayload({
      projectMetrics: [
        baseMetric({
          actual: 50,
          computed: 50,
          budget: 100,
          isPacing: false,
        }),
      ],
      viewDate: januaryView,
      isEndOfMonth: false,
      radarLowProgressExcludeKeywords: [],
      selectedDepartmentId: null,
      departments: [],
      employees: [employee('e1')],
      allocations: [allocCompleted, allocPending],
      projects: [baseProject()],
    });
    const row = payload.rowsWithStatus.find((r) => r.projectId === 'p1');
    expect(row?.status).toBe('over-budget');
    expect(row?.effectiveUsage).toBe(110);
  });

  it('fija exportedAt con la hora simulada', () => {
    vi.setSystemTime(new Date('2026-01-10T15:30:00.000Z'));
    const payload = buildOperationsRadarExportPayload({
      projectMetrics: [baseMetric()],
      viewDate: januaryView,
      isEndOfMonth: false,
      radarLowProgressExcludeKeywords: [],
      selectedDepartmentId: null,
      departments: [],
      employees: [],
      allocations: [],
      projects: [baseProject()],
    });
    expect(payload.exportedAt).toBe('2026-01-10T15:30:00.000Z');
    expect(payload.viewMonthKey).toBe('2026-01');
  });
});
