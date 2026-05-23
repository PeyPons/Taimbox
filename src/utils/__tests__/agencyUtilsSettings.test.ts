import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

import type { AgencySettings } from '@/types';
import {
  resolveWeeklyEnabled,
  normalizeAgencySettings,
  redactIntegrationSecrets,
  sanitizeIntegrationsForSave,
} from '@/utils/agencyUtils';

describe('resolveWeeklyEnabled', () => {
  it('sin settings devuelve true (comportamiento por defecto)', () => {
    expect(resolveWeeklyEnabled(undefined)).toBe(true);
  });

  it('prioriza modules.weeklyFeedback sobre el flag legacy en integraciones', () => {
    expect(
      resolveWeeklyEnabled({
        modules: { weeklyFeedback: true },
        enabledIntegrations: { weekly_feedback: false } as AgencySettings['enabledIntegrations'],
      } as AgencySettings),
    ).toBe(true);

    expect(
      resolveWeeklyEnabled({
        modules: { weeklyFeedback: false },
        enabledIntegrations: { weekly_feedback: true } as AgencySettings['enabledIntegrations'],
      } as AgencySettings),
    ).toBe(false);
  });

  it('si modules no define weeklyFeedback, usa enabledIntegrations.weekly_feedback', () => {
    expect(
      resolveWeeklyEnabled({
        modules: {},
        enabledIntegrations: { weekly_feedback: false } as AgencySettings['enabledIntegrations'],
      } as AgencySettings),
    ).toBe(false);
    expect(
      resolveWeeklyEnabled({
        enabledIntegrations: { weekly_feedback: true } as AgencySettings['enabledIntegrations'],
      } as AgencySettings),
    ).toBe(true);
  });

  it('sin módulo ni legacy explícitos devuelve true', () => {
    expect(resolveWeeklyEnabled({ modules: {} } as AgencySettings)).toBe(true);
  });
});

describe('normalizeAgencySettings', () => {
  it('fija modules.weeklyFeedback según el estado resuelto y elimina weekly_feedback del legacy', () => {
    const input = {
      ownerUserId: 'u1',
      modules: { deadlines: true, weeklyFeedback: undefined, seo: true as unknown as boolean },
      enabledIntegrations: {
        weekly_feedback: false,
        crm_export: true,
      } as AgencySettings['enabledIntegrations'],
    } as AgencySettings;

    const out = normalizeAgencySettings(input);
    expect(out.modules?.weeklyFeedback).toBe(false);
    expect(out.modules?.seo).toBeUndefined();
    expect(out.modules?.deadlines).toBe(true);
    expect((out.enabledIntegrations as Record<string, unknown>)?.weekly_feedback).toBeUndefined();
    expect(out.enabledIntegrations?.crm_export).toBe(true);
  });

  it('si solo quedaba weekly_feedback en integraciones, enabledIntegrations pasa a undefined', () => {
    const input = {
      enabledIntegrations: { weekly_feedback: true } as AgencySettings['enabledIntegrations'],
    } as AgencySettings;
    const out = normalizeAgencySettings(input);
    expect(out.modules?.weeklyFeedback).toBe(true);
    expect(out.enabledIntegrations).toBeUndefined();
  });
});

describe('redactIntegrationSecrets / sanitizeIntegrationsForSave', () => {
  const rich = {
    googleClientId: 'id',
    googleClientSecret: 'sec',
    googleAdsDevToken: 'dev',
    googleRefreshToken: 'ref',
    metaAccessToken: 'meta',
    metaAdAccountIds: 'ids',
    googleAdsCustomerId: 'cid',
  };

  it('redactIntegrationSecrets elimina tokens y secretos pero conserva campos no sensibles', () => {
    const settings: AgencySettings = { integrations: { ...rich } };
    const out = redactIntegrationSecrets(settings);
    expect(out.integrations).toEqual({ googleClientId: 'id' });
  });

  it('sanitizeIntegrationsForSave devuelve el mismo subconjunto seguro para persistencia', () => {
    expect(sanitizeIntegrationsForSave(rich)).toEqual({ googleClientId: 'id' });
    expect(sanitizeIntegrationsForSave(undefined)).toBeUndefined();
  });
});
