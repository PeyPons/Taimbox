/**
 * Hook para calcular tips de redistribución y sugerencias por empleado/proyecto en Deadlines.
 * Usado solo por DeadlinesPage. Toda la lógica de desequilibrio de carga y condicionantes.
 */

import { useMemo, useCallback } from 'react';
import { Deadline } from '@/types';

export type RedistributionTip = {
  from: string;
  to: string;
  fromId: string;
  toId: string;
  reason: string;
  projects: string[];
  projectIds: string[];
};

export type ProjectRecommendation = {
  projectId: string;
  projectName: string;
  transfers: {
    fromId: string;
    fromName: string;
    fromAvatar?: string;
    hoursOnProject: number;
    suggestedHours: number;
    reason: string;
  }[];
};

export type EmployeeRecommendation = {
  employeeId: string;
  employeeName: string;
  employeeAvatar?: string;
  deficitHours: number;
  projects: ProjectRecommendation[];
};

type EmployeeLike = { id: string; name: string; first_name?: string; avatarUrl?: string };
type ProjectLike = { id: string; name: string };

export interface UseDeadlinesRedistributionParams {
  activeEmployees: EmployeeLike[];
  deadlines: Deadline[];
  projects: ProjectLike[];
  hiddenProjects: Set<string>;
  getMonthlyCapacity: (employeeId: string) => { available: number };
  getEmployeeAssignedHours: (employeeId: string) => number;
  formatProjectName: (name: string) => string;
  excludedDonorIds: string[];
  maxReceiverLoadPct: number;
  minSenderLoadPct: number;
  employees: EmployeeLike[] | null;
}

export function useDeadlinesRedistribution(params: UseDeadlinesRedistributionParams) {
  const {
    activeEmployees,
    deadlines,
    projects,
    hiddenProjects,
    getMonthlyCapacity,
    getEmployeeAssignedHours,
    formatProjectName,
    excludedDonorIds,
    maxReceiverLoadPct,
    minSenderLoadPct,
    employees,
  } = params;

  const getRedistributionTips = useCallback((): RedistributionTip[] => {
    const tips: (RedistributionTip & { impact: number })[] = [];
    const employeeLoads: { id: string; name: string; percentage: number; projects: string[] }[] = [];

    activeEmployees.forEach((emp) => {
      const capacityData = getMonthlyCapacity(emp.id);
      const assigned = getEmployeeAssignedHours(emp.id);
      const percentage = capacityData.available > 0 ? Math.round((assigned / capacityData.available) * 100) : 0;

      const empProjects: string[] = [];
      deadlines.forEach((d) => {
        if (!hiddenProjects.has(d.projectId) && !d.isHidden && (d.employeeHours[emp.id] || 0) > 0) {
          const project = projects.find((p) => p.id === d.projectId);
          if (project) empProjects.push(project.id);
        }
      });

      employeeLoads.push({ id: emp.id, name: emp.first_name || emp.name, percentage, projects: empProjects });
    });

    if (employeeLoads.length < 2) return [];

    const totalPercentage = employeeLoads.reduce((sum, e) => sum + e.percentage, 0);
    const averageLoad = Math.round(totalPercentage / employeeLoads.length);
    const maxLoad = Math.max(...employeeLoads.map((e) => e.percentage));
    const minLoad = Math.min(...employeeLoads.map((e) => e.percentage));
    const range = maxLoad - minLoad;

    if (range < 5) return [];

    const variance =
      employeeLoads.reduce((sum, e) => sum + Math.pow(e.percentage - averageLoad, 2), 0) / employeeLoads.length;
    const standardDeviation = Math.sqrt(variance);
    const deviationThreshold =
      range <= 15 ? 2 : Math.max(2, Math.round(standardDeviation * 1.2));

    const aboveAverage = employeeLoads.filter((e) => e.percentage > averageLoad + deviationThreshold);
    const belowAverage = employeeLoads.filter((e) => e.percentage < averageLoad - deviationThreshold);

    const pushTips = (
      above: typeof employeeLoads,
      below: typeof employeeLoads
    ) => {
      above.forEach((over) => {
        below.forEach((avail) => {
          const sharedProjects = over.projects.filter((p) => avail.projects.includes(p));
          if (sharedProjects.length === 0) return;
          const impact = (over.percentage - averageLoad) + (averageLoad - avail.percentage);
          tips.push({
            from: over.name,
            to: avail.name,
            fromId: over.id,
            toId: avail.id,
            reason: `${over.name} está al ${over.percentage}% (media: ${averageLoad}%), ${avail.name} al ${avail.percentage}%`,
            projects: sharedProjects
              .map((pid) => {
                const p = projects.find((proj) => proj.id === pid);
                return p ? formatProjectName(p.name) : '';
              })
              .filter(Boolean),
            projectIds: sharedProjects,
            impact: impact * 1.5,
          });
        });
      });
    };

    if (aboveAverage.length === 0 || belowAverage.length === 0) {
      const relaxedThreshold = 5;
      const aboveRelaxed = employeeLoads.filter((e) => e.percentage > averageLoad + relaxedThreshold);
      const belowRelaxed = employeeLoads.filter((e) => e.percentage < averageLoad - relaxedThreshold);
      if (aboveRelaxed.length === 0 || belowRelaxed.length === 0) return [];
      pushTips(aboveRelaxed, belowRelaxed);
    } else {
      pushTips(aboveAverage, belowAverage);
    }

    const MAX_SUGGESTIONS = 20;
    return tips
      .sort((a, b) => b.impact - a.impact)
      .slice(0, MAX_SUGGESTIONS)
      .map(({ impact, ...tip }) => tip);
  }, [
    activeEmployees,
    deadlines,
    hiddenProjects,
    projects,
    getMonthlyCapacity,
    getEmployeeAssignedHours,
    formatProjectName,
  ]);

  const redistributionTips = useMemo(() => getRedistributionTips(), [getRedistributionTips]);

  const getHoursOnProject = useCallback(
    (projectId: string, employeeId: string) => {
      const d = deadlines.find((dl) => dl.projectId === projectId);
      return (d?.employeeHours?.[employeeId] ?? 0) as number;
    },
    [deadlines]
  );

  const suggestionDonors = useMemo(() => {
    const ids = [...new Set(redistributionTips.map((t) => t.fromId))];
    return ids
      .map((id) => {
        const emp = (employees ?? []).find((e) => e.id === id);
        return { id, name: emp?.first_name || emp?.name || id, avatarUrl: emp?.avatarUrl };
      })
      .filter((d) => d.name);
  }, [redistributionTips, employees]);

  const suggestionsByEmployeeAndProject = useMemo((): EmployeeRecommendation[] => {
    const excludedSet = new Set(excludedDonorIds);
    const filteredTips = excludedSet.size > 0 ? redistributionTips.filter((tip) => !excludedSet.has(tip.fromId)) : redistributionTips;

    const active = activeEmployees ?? [];
    if (active.length === 0) return [];
    let totalPercentage = 0;
    active.forEach((emp) => {
      const capacityData = getMonthlyCapacity(emp.id);
      const assigned = getEmployeeAssignedHours(emp.id);
      const pct = capacityData.available > 0 ? (assigned / capacityData.available) * 100 : 0;
      totalPercentage += pct;
    });
    const averageLoad = totalPercentage / active.length;
    const targetLoadPct = Math.min(averageLoad, maxReceiverLoadPct);

    const getShortfall = (toId: string) => {
      const cap = getMonthlyCapacity(toId);
      const assigned = getEmployeeAssignedHours(toId);
      const targetHours = cap.available * (targetLoadPct / 100);
      return Math.max(0, targetHours - assigned);
    };

    const byEmployee = new Map<string, Map<string, ProjectRecommendation>>();
    const shortfallByToId = new Map<string, number>();

    filteredTips.forEach((tip) => {
      if (!tip.projectIds?.length) return;
      const toId = tip.toId;
      if (!shortfallByToId.has(toId)) shortfallByToId.set(toId, getShortfall(toId));
      const shortfall = shortfallByToId.get(toId)!;
      if (!byEmployee.has(toId)) byEmployee.set(toId, new Map());
      const byProject = byEmployee.get(toId)!;
      tip.projectIds.forEach((projectId, i) => {
        const projectName = tip.projects[i] ?? '';
        if (!byProject.has(projectId)) byProject.set(projectId, { projectId, projectName, transfers: [] });
        const proj = byProject.get(projectId)!;
        const hoursOnProject = getHoursOnProject(projectId, tip.fromId);
        const fromCap = getMonthlyCapacity(tip.fromId).available;
        const fromAssigned = getEmployeeAssignedHours(tip.fromId);
        const minSenderHours = fromCap * (minSenderLoadPct / 100);
        const maxHoursFromSender = Math.max(0, fromAssigned - minSenderHours);
        const suggestedHours = Math.round(Math.min(hoursOnProject, shortfall, maxHoursFromSender) * 2) / 2;
        if (!proj.transfers.some((t) => t.fromId === tip.fromId)) {
          proj.transfers.push({
            fromId: tip.fromId,
            fromName: tip.from,
            fromAvatar: (employees ?? []).find((e) => e.id === tip.fromId)?.avatarUrl,
            hoursOnProject,
            suggestedHours,
            reason: tip.reason,
          });
        }
      });
    });

    return Array.from(byEmployee.entries())
      .map(([employeeId, byProject]) => {
        const emp = (employees ?? []).find((e) => e.id === employeeId);
        const rawProjects = Array.from(byProject.values()).filter((p) => p.transfers.length > 0);
        const shortfall = shortfallByToId.get(employeeId) ?? 0;
        const totalSuggested = rawProjects.reduce(
          (sum, p) => sum + p.transfers.reduce((s, t) => s + t.suggestedHours, 0),
          0
        );
        const factor = shortfall > 0 && totalSuggested > shortfall ? shortfall / totalSuggested : 1;
        const projectList = rawProjects
          .map((p) => ({
            ...p,
            transfers: p.transfers.map((t) => ({
              ...t,
              suggestedHours: factor === 1 ? t.suggestedHours : Math.round(t.suggestedHours * factor * 2) / 2,
            })),
          }))
          .sort((a, b) => b.transfers.length - a.transfers.length);
        return {
          employeeId,
          employeeName: emp?.first_name || emp?.name || 'Desconocido',
          employeeAvatar: emp?.avatarUrl,
          deficitHours: shortfall,
          projects: projectList,
        };
      })
      .filter((g) => g.employeeName !== 'Desconocido' && g.projects.length > 0)
      .sort((a, b) => b.projects.length - a.projects.length);
  }, [
    redistributionTips,
    employees,
    getHoursOnProject,
    activeEmployees,
    getMonthlyCapacity,
    getEmployeeAssignedHours,
    excludedDonorIds,
    maxReceiverLoadPct,
    minSenderLoadPct,
  ]);

  const suggestionsByEmployee = useMemo(() => {
    const byId = new Map<string, RedistributionTip[]>();
    redistributionTips.forEach((tip) => {
      const list = byId.get(tip.toId) || [];
      list.push(tip);
      byId.set(tip.toId, list);
    });
    return Array.from(byId.entries()).map(([employeeId, tips]) => {
      const emp = (employees ?? []).find((e) => e.id === employeeId);
      return {
        employeeId,
        employeeName: emp?.first_name || emp?.name || 'Desconocido',
        employeeAvatar: emp?.avatarUrl,
        tips,
      };
    }).filter((g) => g.employeeName !== 'Desconocido').sort((a, b) => b.tips.length - a.tips.length);
  }, [redistributionTips, employees]);

  return {
    redistributionTips,
    getHoursOnProject,
    suggestionDonors,
    suggestionsByEmployeeAndProject,
    suggestionsByEmployee,
  };
}
