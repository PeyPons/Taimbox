import type { Client, Project } from '@/types';
export type { Inconsistency, InconsistencyEmployeeItem } from '@/utils/planningCoherenceCompute';
export { computeGlobalPlanningInconsistencies } from '@/utils/planningCoherenceCompute';

import type { Inconsistency } from '@/utils/planningCoherenceCompute';

export function filterInconsistenciesBySearch(params: {
  inconsistencies: Inconsistency[];
  query: string;
  projects: Project[];
  clients: Client[];
  formatProjectName: (name: string) => string;
}): Inconsistency[] {
  const { inconsistencies, query, projects, clients, formatProjectName } = params;
  const q = query.trim().toLowerCase();
  if (!q) return inconsistencies;

  return inconsistencies.filter((inc) => {
    const proj = projects.find((p) => p.id === inc.projectId);
    const clientName = proj ? clients.find((c) => c.id === proj.clientId)?.name ?? '' : '';
    const projectName = formatProjectName(inc.projectName);
    return projectName.toLowerCase().includes(q) || (clientName && clientName.toLowerCase().includes(q));
  });
}
