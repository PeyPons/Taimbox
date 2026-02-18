import type { Project } from '@/types';

export interface PlanningPrecisionExclusions {
  projectIds?: string[];
  clientIds?: string[];
}

/**
 * Devuelve el conjunto de IDs de proyecto que deben excluirse del cálculo de
 * precisión de planificación (índice de fiabilidad): proyectos seleccionados
 * explícitamente más los que pertenecen a clientes excluidos.
 */
export function getExcludedProjectIds(
  projects: Project[],
  exclusions?: PlanningPrecisionExclusions | null
): Set<string> {
  if (!exclusions) return new Set();
  const set = new Set<string>(exclusions.projectIds || []);
  if (exclusions.clientIds?.length) {
    projects
      .filter((p) => exclusions.clientIds!.includes(p.clientId))
      .forEach((p) => set.add(p.id));
  }
  return set;
}
