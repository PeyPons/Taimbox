import { roundDeadlineHours } from '@/utils/deadlineUtils';
import type { EmployeeRecommendation } from '@/hooks/useDeadlinesRedistribution';

export function meetsMinSuggestedTransferHours(hours: number, minHours: number): boolean {
  const h = Number(hours) || 0;
  if (minHours <= 0) return h > 0.05;
  return h >= minHours - 1e-6;
}

export function buildExpandedEmployeesForTeamView(
  groups: EmployeeRecommendation[],
  minHours: number
): Set<string> {
  const withTransfers = groups
    .filter((g) =>
      g.projects.some((p) =>
        p.transfers.some((t) => meetsMinSuggestedTransferHours(t.suggestedHours, minHours))
      )
    )
    .map((g) => g.employeeId);
  if (withTransfers.length > 0) return new Set(withTransfers);
  const withDeficit = groups.filter((g) => g.deficitHours > 0.01).map((g) => g.employeeId);
  if (withDeficit.length > 0) return new Set(withDeficit);
  return groups.length > 0 ? new Set(groups.map((g) => g.employeeId)) : new Set();
}

export type TeamSuggestionsSummary = {
  receiverCount: number;
  transferCount: number;
  projectCount: number;
  totalHours: number;
  donorCount: number;
  topReceivers: { employeeId: string; name: string; hours: number }[];
  topDonors: { fromId: string; name: string; hours: number }[];
};

export function computeTeamSuggestionsSummary(
  groups: EmployeeRecommendation[],
  minHours: number
): TeamSuggestionsSummary {
  const donorTotals = new Map<string, { name: string; hours: number }>();
  const receiverTotals = new Map<string, { name: string; hours: number }>();
  const projectsSeen = new Set<string>();
  let transferCount = 0;
  let totalHours = 0;

  for (const g of groups) {
    for (const p of g.projects) {
      for (const t of p.transfers) {
        const h = Number(t.suggestedHours) || 0;
        if (!meetsMinSuggestedTransferHours(h, minHours)) continue;
        transferCount += 1;
        totalHours = roundDeadlineHours(totalHours + h);
        projectsSeen.add(p.projectId);
        const dPrev = donorTotals.get(t.fromId);
        donorTotals.set(t.fromId, {
          name: t.fromName,
          hours: roundDeadlineHours((dPrev?.hours ?? 0) + h),
        });
        const rPrev = receiverTotals.get(g.employeeId);
        receiverTotals.set(g.employeeId, {
          name: g.employeeName,
          hours: roundDeadlineHours((rPrev?.hours ?? 0) + h),
        });
      }
    }
  }

  const topReceivers = [...receiverTotals.entries()]
    .map(([employeeId, { name, hours }]) => ({ employeeId, name, hours }))
    .filter((r) => r.hours > 0)
    .sort((a, b) => b.hours - a.hours)
    .slice(0, 6);

  const topDonors = [...donorTotals.entries()]
    .map(([fromId, { name, hours }]) => ({ fromId, name, hours }))
    .filter((d) => d.hours > 0)
    .sort((a, b) => b.hours - a.hours)
    .slice(0, 6);

  return {
    receiverCount: topReceivers.length,
    transferCount,
    projectCount: projectsSeen.size,
    totalHours: roundDeadlineHours(totalHours),
    donorCount: topDonors.length,
    topReceivers,
    topDonors,
  };
}
