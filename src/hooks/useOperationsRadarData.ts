import { useMemo } from 'react';
import type { Allocation, Deadline, Employee, Project } from '@/types';
import { employeeBelongsToDepartment } from '@/utils/departmentUtils';
import { isAllocationInEffectiveMonth } from '@/utils/dateUtils';
import { deliverablePhaseOverlapsMonth, getDeliverablePhase } from '@/utils/deliverableLifecycle';
import { PROJECT_TYPE_ENTREGABLE } from '@/config/projectTypePresets';
import {
  buildMonthAllocationsByProjectAndEmployee,
  shouldIncludeProjectIdInOperationsTracking,
} from '@/utils/operationsTrackingVisibility';

export type RadarRiskLevel = 'critical' | 'high' | 'medium';
export type RadarRiskType = 'overBudget' | 'lowProgress' | 'lowPace';
export type ProjectStatusType = 'over-budget' | 'behind-schedule' | 'needs-planning' | 'no-activity' | 'in-rule';

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

export interface ProjectRowItem {
  projectId: string;
  projectName: string;
  clientName: string;
  planned: number;
  actual: number;
  computed: number;
  budget: number;
  progressOperational: number;
  riskLevel?: RadarRiskLevel;
  riskType?: RadarRiskType;
  status: ProjectStatusType;
}

export function useOperationsRadarData(params: {
  projectMetrics: ProjectMetricItem[];
  viewDate: Date;
  isEndOfMonth: boolean;
  radarLowProgressExcludeKeywords: string[];
  selectedDepartmentId: string | null;
  departments: DepartmentOption[];
  employees: Employee[];
  allocations: Allocation[];
  projects: Project[];
  deadlines: Pick<Deadline, 'projectId' | 'isHidden' | 'employeeHours'>[];
  hoursTrackingPreference?: 'actual' | 'computed' | null;
}) {
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
    deadlines,
    hoursTrackingPreference,
  } = params;

  const employeesForView = useMemo(() => {
    if (!selectedDepartmentId || !departments.length) return employees ?? [];
    const dept = departments.find(d => d.id === selectedDepartmentId || d.name === selectedDepartmentId);
    if (!dept) return employees ?? [];
    return (employees ?? []).filter(e => employeeBelongsToDepartment(e.department, dept.id, dept.name));
  }, [employees, selectedDepartmentId, departments]);

  const allowedEmployeeIds = useMemo(() => {
    if (!selectedDepartmentId) return null;
    return new Set(employeesForView.map(e => e.id));
  }, [selectedDepartmentId, employeesForView]);

  const allocationsByProjectAndEmployee = useMemo(
    () =>
      buildMonthAllocationsByProjectAndEmployee({
        allocations,
        viewDate,
        allowedEmployeeIds,
        hoursTrackingPreference,
      }),
    [allocations, viewDate, allowedEmployeeIds, hoursTrackingPreference],
  );

  const isProjectVisibleInOperations = useMemo(() => {
    return (projectId: string) =>
      shouldIncludeProjectIdInOperationsTracking({
        projectId,
        projects: projects ?? [],
        deadlines,
        allocationsByProjectAndEmployee,
      });
  }, [projects, deadlines, allocationsByProjectAndEmployee]);

  const atRiskProjectsRaw = useMemo(() => {
    const risks: Array<ProjectMetricItem & { riskLevel: RadarRiskLevel; riskReason: string; riskType: RadarRiskType }> = [];

    projectMetrics.forEach(p => {
      if (!isProjectVisibleInOperations(p.projectId)) return;
      // Solo horas "reales" (hoursActual). El exceso por plan + computado vs presupuesto
      // se resuelve en OperationsRadarPage con effectiveUsage (coherente con la tarjeta de coherencia).
      const hoursOverBudget = p.actual - p.budget;
      const completionRate = p.budget > 0 ? (p.actual / p.budget) * 100 : 0;
      const projectNameLower = p.projectName.toLowerCase();
      const isExcludedFromLowProgress =
        radarLowProgressExcludeKeywords.length > 0 &&
        radarLowProgressExcludeKeywords.some(kw => projectNameLower.includes(kw.trim().toLowerCase()));

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
  }, [projectMetrics, isEndOfMonth, radarLowProgressExcludeKeywords, isProjectVisibleInOperations]);

  const projectIdsForDepartment = useMemo(() => {
    if (!selectedDepartmentId) return undefined as Set<string> | undefined;
    if (!employeesForView.length) return new Set<string>();
    const allowedEmployeeIds = new Set(employeesForView.map(e => e.id));
    const ids = new Set<string>();
    allocations.forEach(a => {
      if (!allowedEmployeeIds.has(a.employeeId)) return;
      if (!isAllocationInEffectiveMonth(a.weekStartDate, viewDate)) return;
      ids.add(a.projectId);
    });
    return ids;
  }, [allocations, employeesForView, selectedDepartmentId, viewDate]);

  const atRiskProjects = useMemo(() => {
    if (!projectIdsForDepartment) return atRiskProjectsRaw;
    return atRiskProjectsRaw.filter(risk => projectIdsForDepartment.has(risk.projectId));
  }, [atRiskProjectsRaw, projectIdsForDepartment]);

  const allProjectsForView = useMemo(() => {
    const selectedDept =
      selectedDepartmentId && departments.length
        ? departments.find(d => d.id === selectedDepartmentId || d.name === selectedDepartmentId)
        : null;
    /** Incluye entregables activos en fase que solapan el mes aunque no tengan tareas del equipo en ese mes (p. ej. `responsibleDepartmentId` coincide). */
    const projectIdsForDeptView = (() => {
      if (!projectIdsForDepartment || !selectedDept) return projectIdsForDepartment;
      const merged = new Set(projectIdsForDepartment);
      for (const p of projects ?? []) {
        if (p.status !== 'active' || p.projectType !== PROJECT_TYPE_ENTREGABLE) continue;
        if (!getDeliverablePhase(p) || !deliverablePhaseOverlapsMonth(p, viewDate)) continue;
        const rd = p.responsibleDepartmentId;
        if (rd && (rd === selectedDept.id || rd === selectedDept.name)) {
          merged.add(p.id);
        } else if (!rd) {
          merged.add(p.id);
        }
      }
      return merged;
    })();

    const byDept = (projectIdsForDeptView && selectedDept
      ? projectMetrics.filter(p => {
          if (!projectIdsForDeptView.has(p.projectId)) return false;
          const project = projects?.find(proj => proj.id === p.projectId);
          if (!project?.responsibleDepartmentId) return true;
          return project.responsibleDepartmentId === selectedDept.id || project.responsibleDepartmentId === selectedDept.name;
        })
      : projectIdsForDeptView
        ? projectMetrics.filter(p => projectIdsForDeptView.has(p.projectId))
        : projectMetrics
    ).filter(p => isProjectVisibleInOperations(p.projectId));

    const riskMap = new Map(atRiskProjects.map(r => [r.projectId, r]));
    const rows: ProjectRowItem[] = byDept.map(p => {
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
  }, [projectMetrics, projectIdsForDepartment, atRiskProjects, selectedDepartmentId, departments, projects, viewDate, isProjectVisibleInOperations]);

  return {
    employeesForView,
    projectIdsForDepartment,
    atRiskProjects,
    allProjectsForView,
  };
}

