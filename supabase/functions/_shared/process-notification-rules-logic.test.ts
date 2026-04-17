import { describe, it, expect } from 'vitest';
import type { Inconsistency } from './planning-coherence-compute';
import {
  issueLabels,
  parseConditions,
  passesCoherenceThreshold,
  passesProjectClientFiltersCoherence,
  shouldSkipDueToDedupe,
} from './process-notification-rules-logic';

function baseInconsistency(overrides: Partial<Inconsistency> = {}): Inconsistency {
  return {
    projectId: 'p1',
    projectName: 'Proyecto',
    employees: [],
    totalDeadlineHours: 0,
    totalPlannedHours: 0,
    totalComputedHours: 0,
    totalDifference: 0,
    budgetHours: 0,
    minimumHours: 0,
    ...overrides,
  };
}

describe('process-notification-rules-logic', () => {
  describe('parseConditions', () => {
    it('usa valores por defecto cuando conditions es null o no es objeto', () => {
      for (const raw of [null, undefined, 'x', 1]) {
        const c = parseConditions(raw);
        expect(c.evaluation).toBe('project_month_health');
        expect(c.coherenceMinAbs).toBe(0.05);
        expect(c.coherenceDeliveryMode).toBe('per_project');
        expect(c.coherenceDigestMax).toBe(12);
        expect(c.matchAny).toEqual([
          'over_budget',
          'needs_planning',
          'behind_schedule',
          'no_activity',
        ]);
      }
    });

    it('filtra match_any inválidos y restaura el conjunto completo si queda vacío', () => {
      expect(parseConditions({ match_any: ['invalid', 'over_budget'] }).matchAny).toEqual([
        'over_budget',
      ]);
      expect(parseConditions({ match_any: ['invalid'] }).matchAny).toEqual([
        'over_budget',
        'needs_planning',
        'behind_schedule',
        'no_activity',
      ]);
    });

    it('respeta evaluation deadline_coherence y tope coherence_digest_max a 50', () => {
      const c = parseConditions({
        evaluation: 'deadline_coherence',
        coherence_digest_max: 200,
        coherence_min_abs_hours: 1.5,
      });
      expect(c.evaluation).toBe('deadline_coherence');
      expect(c.coherenceDigestMax).toBe(50);
      expect(c.coherenceMinAbs).toBe(1.5);
    });

    it('usa 0.05 si coherence_min_abs_hours es negativo', () => {
      expect(parseConditions({ coherence_min_abs_hours: -1 }).coherenceMinAbs).toBe(0.05);
    });

    it('restaura estados de coherencia por defecto si el array filtrado queda vacío', () => {
      const c = parseConditions({
        coherence_op_status_in: ['no-existe'],
      });
      expect(c.coherenceOpStatusIn).toEqual([
        'over-budget',
        'behind-schedule',
        'needs-planning',
        'no-activity',
      ]);
    });

    it('acepta solo estados de coherencia permitidos', () => {
      const c = parseConditions({
        coherence_op_status_in: ['in-rule', 'invalid', 'over-budget'],
      });
      expect(c.coherenceOpStatusIn).toEqual(['in-rule', 'over-budget']);
    });
  });

  describe('passesCoherenceThreshold', () => {
    it('pasa si la diferencia total supera el umbral', () => {
      const inc = baseInconsistency({ totalDifference: 0.1, employees: [] });
      expect(passesCoherenceThreshold(inc, 0.05)).toBe(true);
    });

    it('pasa si algún empleado supera el umbral aunque el total no', () => {
      const inc = baseInconsistency({
        totalDifference: 0.01,
        employees: [
          {
            employeeId: 'e1',
            employeeName: 'A',
            deadlineHours: 0,
            plannedHours: 0,
            computedHours: 0,
            difference: -0.2,
            hasDeadline: true,
          },
        ],
      });
      expect(passesCoherenceThreshold(inc, 0.05)).toBe(true);
    });

    it('no pasa si todo queda por debajo del umbral', () => {
      const inc = baseInconsistency({
        totalDifference: 0.01,
        employees: [
          {
            employeeId: 'e1',
            employeeName: 'A',
            deadlineHours: 0,
            plannedHours: 0,
            computedHours: 0,
            difference: 0.02,
            hasDeadline: true,
          },
        ],
      });
      expect(passesCoherenceThreshold(inc, 0.05)).toBe(false);
    });
  });

  describe('passesProjectClientFiltersCoherence', () => {
    const map = new Map([['p1', 'c1']]);

    it('excluye proyecto si project_ids está definido y no incluye el id', () => {
      const inc = baseInconsistency({ projectId: 'p2' });
      expect(passesProjectClientFiltersCoherence(inc, map, ['p1'], undefined)).toBe(false);
    });

    it('excluye si client_ids no coincide con el cliente del mapa', () => {
      const inc = baseInconsistency({ projectId: 'p1' });
      expect(passesProjectClientFiltersCoherence(inc, map, undefined, ['c2'])).toBe(false);
    });

    it('pasa cuando filtros coinciden', () => {
      const inc = baseInconsistency({ projectId: 'p1' });
      expect(passesProjectClientFiltersCoherence(inc, map, ['p1'], ['c1'])).toBe(true);
    });
  });

  describe('shouldSkipDueToDedupe', () => {
    it('omite reenvío si existe entrega y ignoreDedupe es false', () => {
      expect(shouldSkipDueToDedupe({ id: 'x' }, false)).toBe(true);
    });

    it('no omite si ignoreDedupe es true aunque exista registro', () => {
      expect(shouldSkipDueToDedupe({ id: 'x' }, true)).toBe(false);
    });

    it('no omite si no hay entrega previa', () => {
      expect(shouldSkipDueToDedupe(null, false)).toBe(false);
      expect(shouldSkipDueToDedupe(undefined, false)).toBe(false);
    });
  });

  describe('issueLabels', () => {
    it('genera una etiqueta por cada flag conocido', () => {
      const labels = issueLabels(['over_budget', 'no_activity']);
      expect(labels).toHaveLength(2);
      expect(labels[0]).toContain('presupuesto');
      expect(labels[1]).toContain('Sin horas');
    });
  });
});
