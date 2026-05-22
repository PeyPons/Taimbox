import { describe, expect, it } from 'vitest';
import type { Project } from '@/types';

/** Lógica pura extraída para test (misma que mergeReferencedProjects). */
function missingProjectIds(current: Project[], referencedIds: Iterable<string>): string[] {
  const known = new Set(current.map((p) => p.id));
  return [...new Set(referencedIds)].filter((id): id is string => Boolean(id) && !known.has(id));
}

describe('mergeReferencedProjects (ids faltantes)', () => {
  it('detecta proyectos completados no presentes en catálogo activo', () => {
    const activeOnly: Project[] = [
      {
        id: 'p-active',
        agencyId: 'a1',
        clientId: 'c1',
        name: 'Activo',
        status: 'active',
        budgetHours: 10,
      },
    ];
    const missing = missingProjectIds(activeOnly, ['p-active', 'p-completed']);
    expect(missing).toEqual(['p-completed']);
  });
});
