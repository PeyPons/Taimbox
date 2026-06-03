import { describe, expect, it } from 'vitest';
import { computeAdsBudgetAlerts } from '@/utils/adsBudgetAlerts';

describe('computeAdsBudgetAlerts', () => {
  const now = new Date('2026-06-15T12:00:00Z');

  it('alerta cuando el gasto supera el presupuesto mensual', () => {
    const alerts = computeAdsBudgetAlerts(
      [{ client_id: 'acc-1', budget_limit: 1000, is_hidden: false }],
      [{ client_id: 'acc-1', client_name: 'Cuenta Demo', cost: 600, date: '2026-06-10' }, { client_id: 'acc-1', client_name: 'Cuenta Demo', cost: 500, date: '2026-06-14' }],
      [],
      now,
    );
    expect(alerts).toHaveLength(1);
    expect(alerts[0]?.status).toBe('over');
    expect(alerts[0]?.platform).toBe('google');
    expect(alerts[0]?.displayName).toBe('Cuenta Demo');
  });

  it('alerta riesgo cuando la proyección supera el presupuesto', () => {
    const alerts = computeAdsBudgetAlerts(
      [{ client_id: 'meta-1', budget_limit: 1000, is_hidden: false }],
      [],
      [{ client_id: 'meta-1', client_name: 'Meta Brand', cost: 600, date: '2026-06-14' }],
      now,
    );
    expect(alerts.some((a) => a.status === 'risk' && a.platform === 'meta')).toBe(true);
  });
});
