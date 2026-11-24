import { describe, expect, it } from 'vitest';
import { budgetWindowFor, computeBudgetPace, earliestBudgetQueryStart, monthKeyToRange, resolveStoredBudget } from '@/utils/adBudgetWindow';

describe('ad budget window', () => {
  const november = new Date(2026, 10, 24);

  it('keeps a monthly budget on the current month', () => {
    const window = budgetWindowFor({ mode: 'month' }, november);
    expect(window.start).toBe('2026-11-01');
    expect(window.end).toBe('2026-11-30');
    expect(window.elapsedDays).toBe(24);
    expect(window.remainingDays).toBe(7);
    const pace = computeBudgetPace({ spent: 400, amount: 1000, window, currentDailyBudget: 0 });
    expect(pace.forecast).toBeCloseTo((400 / 24) * 30);
    expect(pace.status).toBe('under');
  });

  it('spreads 1000 euros across October, November and December', () => {
    const window = budgetWindowFor(
      { mode: 'period', periodStart: '2026-10-01', periodEnd: '2026-12-31' },
      november,
    );
    expect(window.totalDays).toBe(92);
    expect(window.elapsedDays).toBe(55);
    const pace = computeBudgetPace({ spent: 700, amount: 1000, window, currentDailyBudget: 0 });
    expect(pace.remaining).toBe(300);
    expect(pace.recommendedDaily).toBeCloseTo(300 / 38);
    expect(pace.status).not.toBe('over');
  });

  it('marks the period over only when the whole range is spent', () => {
    const window = budgetWindowFor(
      { mode: 'period', periodStart: '2026-10-01', periodEnd: '2026-12-31' },
      november,
    );
    const pace = computeBudgetPace({ spent: 1100, amount: 1000, window, currentDailyBudget: 0 });
    expect(pace.status).toBe('over');
  });

  it('counts December through February across the new year', () => {
    const january = new Date(2027, 0, 15);
    const window = budgetWindowFor(
      { mode: 'period', periodStart: '2026-12-01', periodEnd: '2027-02-28' },
      january,
    );
    expect(window.totalDays).toBe(90);
    expect(window.elapsedDays).toBe(46);
    expect(window.remainingDays).toBe(45);
    expect(window.mode).toBe('period');
    const pace = computeBudgetPace({ spent: 400, amount: 1000, window, currentDailyBudget: 0 });
    expect(pace.status).not.toBe('over');
    expect(pace.remaining).toBe(600);
  });

  it('keeps a saved period when the row is opened again', () => {
    const resolved = resolveStoredBudget(
      'GROUP-Fundacion',
      ['act_1'],
      {
        'GROUP-Fundacion': { budget: 1500, budgetMode: 'period', periodStart: '2026-11-01', periodEnd: '2027-01-31' },
        act_1: { budget: 500, budgetMode: 'month', periodStart: null, periodEnd: null },
      },
    );
    expect(resolved.budgetMode).toBe('period');
    expect(resolved.periodEnd).toBe('2027-01-31');

    const split = resolveStoredBudget('act_1_PODCAST', [], {
      act_1: { budget: 1000, budgetMode: 'period', periodStart: '2026-10-01', periodEnd: '2026-12-31' },
    });
    expect(split.budgetMode).toBe('period');
    expect(split.periodStart).toBe('2026-10-01');
  });

  it('asks the sync reader to include months before the current one', () => {
    const start = earliestBudgetQueryStart(
      [
        { budget_mode: 'month', budget_period_start: null },
        { budget_mode: 'period', budget_period_start: '2026-10-01' },
      ],
      '2026-11-01',
    );
    expect(start).toBe('2026-10-01');
    expect(monthKeyToRange('2026-12')?.end).toBe('2026-12-31');
  });
});
