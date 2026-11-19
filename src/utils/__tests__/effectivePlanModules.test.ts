import { describe, expect, it } from 'vitest';
import { effectivePlanId, trialHasLapsed, visibleAgencyModules } from '@/utils/effectivePlanModules';

describe('trialHasLapsed', () => {
  const past = new Date(Date.now() - 60_000).toISOString();
  const future = new Date(Date.now() + 60_000).toISOString();

  it('vence solo si sigue en prueba y la fecha ya pasó', () => {
    expect(trialHasLapsed('trialing', past)).toBe(true);
    expect(trialHasLapsed('trialing', future)).toBe(false);
    expect(trialHasLapsed('trialing', null)).toBe(false);
    expect(trialHasLapsed('active', past)).toBe(false);
  });
});

describe('visibleAgencyModules', () => {
  it('recorta weekly, OKR y PPC en cuanto el plan efectivo es Free', () => {
    const planId = effectivePlanId({
      planId: 'business',
      subscriptionStatus: 'trialing',
      trialEndsAt: new Date(Date.now() - 1000).toISOString(),
    });
    const modules = visibleAgencyModules(
      {
        modules: {
          deadlines: true,
          timeTracker: true,
          weeklyFeedback: true,
          professionalGoals: true,
          ppc: true,
        },
      },
      planId,
    );
    expect(planId).toBe('starter');
    expect(modules.weeklyFeedback).toBe(false);
    expect(modules.professionalGoals).toBe(false);
    expect(modules.ppc).toBe(false);
    expect(modules.deadlines).toBe(true);
    expect(modules.timeTracker).toBe(true);
  });
});
