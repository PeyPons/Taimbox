import type {
  DonorTransferRow,
  EmployeeOption,
  EmployeeRecommendation,
  ProjectRecommendation,
  SuggestionDonor,
} from '@/components/deadlines/suggestions/types';
import {
  countProjectsWithTransfers,
  projectHasSuggestedTransfers,
  totalSuggestedHoursForGroup,
} from '@/utils/deadlinesSuggestionsPrefs';
import { roundDeadlineHours } from '@/utils/deadlineUtils';

export function employeeLoadPct(
  employeeId: string,
  getMonthlyCapacity: (id: string) => { available: number },
  getEmployeeAssignedHours: (id: string) => number
): number {
  const cap = getMonthlyCapacity(employeeId).available;
  const assigned = getEmployeeAssignedHours(employeeId);
  return cap > 0 ? Math.round((assigned / cap) * 100) : 0;
}

export function buildReceiverOptions(
  groups: EmployeeRecommendation[],
  getMonthlyCapacity: (id: string) => { available: number },
  getEmployeeAssignedHours: (id: string) => number
): EmployeeOption[] {
  return groups
    .filter((g) => countProjectsWithTransfers(g) > 0 || g.deficitHours > 0.01)
    .map((g) => {
      const projectCount = countProjectsWithTransfers(g);
      const totalH = totalSuggestedHoursForGroup(g);
      return {
        id: g.employeeId,
        name: g.employeeName,
        avatarUrl: g.employeeAvatar,
        loadPct: employeeLoadPct(g.employeeId, getMonthlyCapacity, getEmployeeAssignedHours),
        subtitle:
          projectCount > 0
            ? `${projectCount} proyecto(s) · hasta ${totalH}h sugeridas`
            : g.deficitHours > 0
              ? `Margen ~${Math.round(g.deficitHours * 10) / 10}h (sin transferencias con filtros actuales)`
              : undefined,
      };
    })
    .sort((a, b) => a.loadPct - b.loadPct);
}

export function buildDonorOptions(
  donors: SuggestionDonor[],
  groups: EmployeeRecommendation[],
  getMonthlyCapacity: (id: string) => { available: number },
  getEmployeeAssignedHours: (id: string) => number
): EmployeeOption[] {
  const withTransfers = new Set<string>();
  groups.forEach((g) =>
    g.projects.forEach((p) => p.transfers.forEach((t) => withTransfers.add(t.fromId)))
  );

  return donors
    .filter((d) => withTransfers.has(d.id))
    .map((d) => {
      const rows = getDonorTransferRows(groups, d.id);
      const projectIds = new Set(rows.map((r) => r.projectId));
      const totalH = roundDeadlineHours(rows.reduce((s, r) => s + (Number(r.transfer.suggestedHours) || 0), 0));
      return {
        id: d.id,
        name: d.name,
        avatarUrl: d.avatarUrl,
        loadPct: employeeLoadPct(d.id, getMonthlyCapacity, getEmployeeAssignedHours),
        subtitle: `${projectIds.size} proyecto(s) · hasta ${totalH}h sugeridas`,
      };
    })
    .sort((a, b) => b.loadPct - a.loadPct);
}

export function getGroupForEmployee(
  groups: EmployeeRecommendation[],
  employeeId: string
): EmployeeRecommendation | undefined {
  return groups.find((g) => g.employeeId === employeeId);
}

/** Proyectos con transferencias, ordenados por horas sugeridas (mayor primero). */
export function sortProjectsBySuggestedHours(projects: ProjectRecommendation[]): ProjectRecommendation[] {
  const score = (p: ProjectRecommendation) =>
    p.transfers.reduce((s, t) => s + (Number(t.suggestedHours) || 0), 0);
  return [...projects]
    .filter((p) => projectHasSuggestedTransfers(p))
    .sort((a, b) => score(b) - score(a));
}

export function projectTotalSuggestedHours(project: ProjectRecommendation): number {
  return roundDeadlineHours(
    project.transfers.reduce((s, t) => s + (Number(t.suggestedHours) || 0), 0)
  );
}

export function getDonorTransferRows(
  groups: EmployeeRecommendation[],
  donorId: string
): DonorTransferRow[] {
  const rows: DonorTransferRow[] = [];
  groups.forEach((g) => {
    g.projects.forEach((p) => {
      p.transfers
        .filter((t) => t.fromId === donorId && t.suggestedHours > 0.05)
        .forEach((t) => {
          rows.push({
            receiverId: g.employeeId,
            receiverName: g.employeeName,
            receiverAvatar: g.employeeAvatar,
            projectId: p.projectId,
            projectName: p.projectName,
            transfer: t,
          });
        });
    });
  });
  return rows;
}
