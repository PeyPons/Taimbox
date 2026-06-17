import { describe, expect, it } from 'vitest';
import {
  addCampaignDailyBudget,
  countSharedBudgetCampaigns,
  getCampaignDisplayDailyBudget,
  isSharedPortfolioBudget,
} from '@/utils/adsBudgetUtils';

describe('addCampaignDailyBudget', () => {
  it('deduplica por budget_id en la misma cuenta', () => {
    const seen = new Set<string>();
    let sum = 0;
    const account = '6041969446';
    const budgetId = '15632616913';

    for (let i = 0; i < 4; i++) {
      sum = addCampaignDailyBudget(sum, seen, 100, budgetId, 'ENABLED', account);
    }

    expect(sum).toBe(100);
  });

  it('no deduplica budget_id entre cuentas distintas', () => {
    const seen = new Set<string>();
    let sum = 0;
    sum = addCampaignDailyBudget(sum, seen, 100, '123', 'ENABLED', 'acc-a');
    sum = addCampaignDailyBudget(sum, seen, 100, '123', 'ENABLED', 'acc-b');
    expect(sum).toBe(200);
  });

  it('sin budget_id deduplica importe repetido en la misma cuenta (cartera legacy)', () => {
    const seen = new Set<string>();
    let sum = 0;
    const account = 'acc-1';
    for (let i = 0; i < 4; i++) {
      sum = addCampaignDailyBudget(sum, seen, 100, null, 'ENABLED', account);
    }
    expect(sum).toBe(100);
  });
});

describe('display helpers', () => {
  const campaigns = [
    { status: 'ENABLED', daily_budget: 100, budget_id: 'portfolio-1', client_id: 'acc-1' },
    { status: 'ENABLED', daily_budget: 100, budget_id: 'portfolio-1', client_id: 'acc-1' },
    { status: 'ENABLED', daily_budget: 100, budget_id: 'portfolio-1', client_id: 'acc-1' },
    { status: 'ENABLED', daily_budget: 100, budget_id: 'portfolio-1', client_id: 'acc-1' },
  ];

  it('muestra media diaria en cartera compartida', () => {
    const counts = countSharedBudgetCampaigns(campaigns);
    expect(getCampaignDisplayDailyBudget(campaigns[0], counts)).toBe(25);
    expect(isSharedPortfolioBudget(campaigns[0], counts)).toBe(true);
  });
});
