import type { Allocation, Employee, Project } from '@/types';
import { employeeBelongsToDepartment } from '@/utils/departmentUtils';
import { isAllocationInEffectiveMonth } from '@/utils/dateUtils';
import { getEffectiveCompletedHours } from '@/utils/hoursTracking';
import { round2 } from '@/utils/numbers';
import type { ProjectMetrics } from '@/utils/projectMetricsCompute';
import type {
  ProjectRowItem,
  ProjectStatusType,
  RadarRiskLevel,
  RadarRiskType,
} from '@/hooks/useOperationsRadarData';

export type { ProjectRowItem, ProjectStatusType, RadarRiskLevel, RadarRiskType };

interface DepartmentOption {
  id: string;
  name: string;
}

interface ProjectMetricItem {
  projectId: string;
  projectName: string;
  clientName?: string;
  planned: number;
  actual: number;
  computed: number;
  budget: number;
  progressOperational: number;
  isPacing: boolean;
}

function computeAtRiskProjectsRaw(
  projectMetrics: ProjectMetricItem[],
  isEndOfMonth: boolean,
  radarLowProgressExcludeKeywords: string[]
): Array<ProjectMetricItem & { riskLevel: RadarRiskLevel; riskReason: string; riskType: RadarRiskType }> {
  const risks: Array<
    ProjectMetricItem & { riskLevel: RadarRiskLevel; riskReason: string; riskType: RadarRiskType }
  > = [];

  projectMetrics.forEach((p) => {
    const hoursOverBudget = p.actual - p.budget;
    const completionRate = p.budget > 0 ? (p.actual / p.budget) * 100 : 0;
    const projectNameLower = p.projectName.toLowerCase();
    const isExcludedFromLowProgress =
      radarLowProgressExcludeKeywords.length > 0 &&
      radarLowProgressExcludeKeywords.some((kw) => projectNameLower.includes(kw.trim().toLowerCase()));

    if (hoursOverBudget > 0) {
      risks.push({
        ...p,
        riskLevel: hoursOverBudget > 5 ? 'critical' : 'high',
        riskReason: `Supera presupuesto en ${hoursOverBudget.toFixed(1)}h`,
        riskType: 'overBudget',
      });
    } else if (isEndOfMonth && completionRate < 35 && p.budget > 0 && !isExcludedFromLowProgress) {
      risks.push({
        ...p,
        riskLevel: completionRate < 20 ? 'critical' : 'high',
        riskReason: `Poco avance (${completionRate.toFixed(0)}%)`,
        riskType: 'lowProgress',
      });
    } else if (!p.isPacing && p.budget > 0) {
      risks.push({
        ...p,
        riskLevel: 'medium',
        riskReason: `Por debajo del objetivo (Avance real: ${p.progressOperational.toFixed(0)}%)`,
        riskType: 'lowPace',
      });
    }
  });

  return risks.sort((a, b) => {
    const riskOrder: Record<string, number> = { critical: 0, high: 1, medium: 2 };
    return (riskOrder[a.riskLevel] || 2) - (riskOrder[b.riskLevel] || 2);
  });
}

function computeEmployeesForView(
  employees: Employee[],
  selectedDepartmentId: string | null,
  departments: DepartmentOption[]
): Employee[] {
  if (!selectedDepartmentId || !departments.length) return employees ?? [];
  const dept = departments.find((d) => d.id === selectedDepartmentId || d.name === selectedDepartmentId);
  if (!dept) return employees ?? [];
  return (employees ?? []).filter((e) => employeeBelongsToDepartment(e.department, dept.id, dept.name));
}

function computeProjectIdsForDepartment(
  allocations: Allocation[],
  employeesForView: Employee[],
  selectedDepartmentId: string | null,
  viewDate: Date
): Set<string> | undefined {
  if (!selectedDepartmentId) return undefined;
  if (!employeesForView.length) return new Set<string>();
  const allowedEmployeeIds = new Set(employeesForView.map((e) => e.id));
  const ids = new Set<string>();
  allocations.forEach((a) => {
    if (!allowedEmployeeIds.has(a.employeeId)) return;
    if (!isAllocationInEffectiveMonth(a.weekStartDate, viewDate)) return;
    ids.add(a.projectId);
  });
  return ids;
}

function computeAllProjectsForView(
  projectMetrics: ProjectMetricItem[],
  projectIdsForDepartment: Set<string> | undefined,
  atRiskProjects: Array<ProjectMetricItem & { riskLevel: RadarRiskLevel; riskType: RadarRiskType }>,
  selectedDepartmentId: string | null,
  departments: DepartmentOption[],
  projects: Project[]
): ProjectRowItem[] {
  const selectedDept =
    selectedDepartmentId && departments.length
      ? departments.find((d) => d.id === selectedDepartmentId || d.name === selectedDepartmentId)
      : null;
  const byDept =
    projectIdsForDepartment && selectedDept
      ? projectMetrics.filter((p) => {
          if (!projectIdsForDepartment.has(p.projectId)) return false;
          const project = projects?.find((proj) => proj.id === p.projectId);
          if (!project?.responsibleDepartmentId) return true;
          return (
            project.responsibleDepartmentId === selectedDept.id ||
            project.responsibleDepartmentId === selectedDept.name
          );
        })
      : projectIdsForDepartment
        ? projectMetrics.filter((p) => projectIdsForDepartment.has(p.projectId))
        : projectMetrics;

  const riskMap = new Map(atRiskProjects.map((r) => [r.projectId, r]));
  const rows: ProjectRowItem[] = byDept.map((p) => {
    const risk = riskMap.get(p.projectId);
    const base: ProjectRowItem = {
      projectId: p.projectId,
      projectName: p.projectName,
      clientName: p.clientName ?? '',
      planned: p.planned,
      actual: p.actual,
      computed: p.computed,
      budget: p.budget,
      progressOperational: p.progressOperational,
      status: 'in-rule',
    };
    if (risk) return { ...base, riskLevel: risk.riskLevel, riskType: risk.riskType };
    return base;
  });

  const riskOrder: Record<string, number> = { critical: 0, high: 1, medium: 2 };
  return rows.sort((a, b) => {
    const aOrder = a.riskLevel ? riskOrder[a.riskLevel] ?? 3 : 4;
    const bOrder = b.riskLevel ? riskOrder[b.riskLevel] ?? 3 : 4;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return (a.projectName || '').localeCompare(b.projectName || '');
  });
}

function computeProjectDetailsByProjectId(
  allocations: Allocation[],
  projectMetrics: ProjectMetrics[],
  viewDate: Date,
  hoursTrackingPreference?: 'actual' | 'computed' | null
): Map<
  string,
  {
    effectiveUsage: number;
    planningPct: number;
    realPct: number;
    computedPct: number;
  }
> {
  const map = new Map<
    string,
    { effectiveUsage: number; planningPct: number; realPct: number; computedPct: number }
  >();
  const monthAllocations = (allocations ?? []).filter((a) =>
    isAllocationInEffectiveMonth(a.weekStartDate, viewDate)
  );
  const projectIds = new Set(projectMetrics.map((p) => p.projectId));
  const budgetByProject = new Map(projectMetrics.map((p) => [p.projectId, p.budget]));
  const effectivePreference =
    hoursTrackingPreference === 'actual' || hoursTrackingPreference === 'computed'
      ? hoursTrackingPreference
      : undefined;

  projectIds.forEach((projectId) => {
    const projectAllocs = monthAllocations.filter((a) => a.projectId === projectId);
    const completedTasks = projectAllocs.filter((a) => a.status === 'completed');
    const pendingTasks = projectAllocs.filter((a) => a.status !== 'completed');
    const hoursReal = completedTasks.reduce((s, a) => s + (a.hoursActual || 0), 0);
    const hoursComputed = completedTasks.reduce(
      (s, a) => s + getEffectiveCompletedHours(a, effectivePreference),
      0
    );
    const effectiveUsage = hoursComputed + pendingTasks.reduce((s, a) => s + (a.hoursAssigned || 0), 0);
    const budget = budgetByProject.get(projectId) ?? 0;
    const planningPct = budget > 0 ? (effectiveUsage / budget) * 100 : 0;
    const realPct = budget > 0 ? (hoursReal / budget) * 100 : 0;
    const computedPct = budget > 0 ? (hoursComputed / budget) * 100 : 0;
    map.set(projectId, {
      effectiveUsage: round2(effectiveUsage),
      planningPct: round2(planningPct),
      realPct: round2(realPct),
      computedPct: round2(computedPct),
    });
  });
  return map;
}

function getFinalRadarStatus(
  row: ProjectRowItem,
  detail:
    | { effectiveUsage: number; planningPct: number; realPct: number; computedPct: number }
    | undefined
): ProjectStatusType {
  const effectiveUsage = detail?.effectiveUsage;
  const effectiveOverBudget =
    row.budget > 0 && effectiveUsage != null && round2(effectiveUsage) > round2(row.budget);

  if (row.riskType === 'overBudget' || effectiveOverBudget) return 'over-budget';
  if (row.riskType === 'lowProgress' || row.riskType === 'lowPace') return 'behind-schedule';
  if (row.budget > 0 && row.planned === 0 && row.computed === 0) return 'no-activity';
  const shortOfBudget =
    row.budget > 0 && effectiveUsage != null && round2(effectiveUsage) < round2(row.budget);
  if (shortOfBudget) return 'needs-planning';
  return 'in-rule';
}

export interface BuildOperationsRadarExportParams {
  projectMetrics: ProjectMetrics[];
  viewDate: Date;
  isEndOfMonth: boolean;
  radarLowProgressExcludeKeywords: string[];
  selectedDepartmentId: string | null;
  departments: DepartmentOption[];
  employees: Employee[];
  allocations: Allocation[];
  projects: Project[];
  hoursTrackingPreference?: 'actual' | 'computed' | null;
}

export interface OperationsRadarExportRow extends ProjectRowItem {
  effectiveUsage: number | null;
  planningPct: number | null;
  realPct: number | null;
  computedPct: number | null;
}

export function buildOperationsRadarExportPayload(params: BuildOperationsRadarExportParams) {
  const {
    projectMetrics,
    viewDate,
    isEndOfMonth,
    radarLowProgressExcludeKeywords,
    selectedDepartmentId,
    departments,
    employees,
    allocations,
    projects,
    hoursTrackingPreference,
  } = params;

  const metricItems: ProjectMetricItem[] = projectMetrics.map((p) => ({
    projectId: p.projectId,
    projectName: p.projectName,
    clientName: p.clientName,
    planned: p.planned,
    actual: p.actual,
    computed: p.computed,
    budget: p.budget,
    progressOperational: p.progressOperational,
    isPacing: p.isPacing,
  }));

  const atRiskProjectsRaw = computeAtRiskProjectsRaw(
    metricItems,
    isEndOfMonth,
    radarLowProgressExcludeKeywords
  );
  const employeesForView = computeEmployeesForView(employees, selectedDepartmentId, departments);
  const projectIdsForDepartment = computeProjectIdsForDepartment(
    allocations,
    employeesForView,
    selectedDepartmentId,
    viewDate
  );
  const atRiskProjects = projectIdsForDepartment
    ? atRiskProjectsRaw.filter((risk) => projectIdsForDepartment.has(risk.projectId))
    : atRiskProjectsRaw;

  const allProjectsForView = computeAllProjectsForView(
    metricItems,
    projectIdsForDepartment,
    atRiskProjects,
    selectedDepartmentId,
    departments,
    projects
  );

  const projectDetailsByProjectId = computeProjectDetailsByProjectId(
    allocations,
    projectMetrics,
    viewDate,
    hoursTrackingPreference
  );

  const statusOrder: Record<ProjectStatusType, number> = {
    'over-budget': 0,
    'behind-schedule': 1,
    'needs-planning': 2,
    'no-activity': 3,
    'in-rule': 4,
  };

  const rowsWithStatus: OperationsRadarExportRow[] = allProjectsForView
    .map((row) => {
      const detail = projectDetailsByProjectId.get(row.projectId);
      const status = getFinalRadarStatus(row, detail);
      return {
        ...row,
        status,
        effectiveUsage: detail?.effectiveUsage ?? null,
        planningPct: detail?.planningPct ?? null,
        realPct: detail?.realPct ?? null,
        computedPct: detail?.computedPct ?? null,
      };
    })
    .sort((a, b) => {
      const o = statusOrder[a.status] - statusOrder[b.status];
      if (o !== 0) return o;
      return (a.projectName || '').localeCompare(b.projectName || '');
    });

  const filterCounts = {
    all: rowsWithStatus.length,
    'no-activity': rowsWithStatus.filter((p) => p.status === 'no-activity').length,
    'needs-planning': rowsWithStatus.filter((p) => p.status === 'needs-planning').length,
    'behind-schedule': rowsWithStatus.filter((p) => p.status === 'behind-schedule').length,
    'over-budget': rowsWithStatus.filter((p) => p.status === 'over-budget').length,
    'in-rule': rowsWithStatus.filter((p) => p.status === 'in-rule').length,
  };

  return {
    schemaVersion: 1 as const,
    exportedAt: new Date().toISOString(),
    viewMonthKey: `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}`,
    isEndOfMonth,
    rowsWithStatus,
    filterCounts,
    atRiskProjects: atRiskProjects.map((r) => ({
      projectId: r.projectId,
      projectName: r.projectName,
      riskLevel: r.riskLevel,
      riskType: r.riskType,
      riskReason: r.riskReason,
    })),
  };
}
