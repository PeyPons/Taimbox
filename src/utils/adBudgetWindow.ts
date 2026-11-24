export type BudgetMode = 'month' | 'period';

export interface BudgetConfig {
  mode: BudgetMode;
  periodStart?: string | null;
  periodEnd?: string | null;
}

export interface BudgetWindow {
  mode: BudgetMode;
  start: string;
  end: string;
  totalDays: number;
  elapsedDays: number;
  remainingDays: number;
  closed: boolean;
  monthStart: string;
  monthEnd: string;
}

export interface BudgetPace {
  forecast: number;
  remaining: number;
  recommendedDaily: number;
  avgDaily: number;
  progress: number;
  status: 'ok' | 'risk' | 'over' | 'under';
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export function toYmd(year: number, month: number, day: number): string {
  return `${year}-${pad(month)}-${pad(day)}`;
}

export function parseYmd(value: string | null | undefined): { y: number; m: number; d: number } | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  return { y, m, d };
}

export function daysInCalendarMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function dayNumber(y: number, m: number, d: number): number {
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
}

export function inclusiveDays(start: string, end: string): number {
  const a = parseYmd(start);
  const b = parseYmd(end);
  if (!a || !b) return 0;
  return dayNumber(b.y, b.m, b.d) - dayNumber(a.y, a.m, a.d) + 1;
}

export function monthKeyToRange(monthKey: string): { start: string; end: string } | null {
  const match = /^(\d{4})-(\d{2})$/.exec(monthKey);
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  if (m < 1 || m > 12) return null;
  return { start: toYmd(y, m, 1), end: toYmd(y, m, daysInCalendarMonth(y, m)) };
}

export function addMonths(monthKey: string, delta: number): string {
  const match = /^(\d{4})-(\d{2})$/.exec(monthKey);
  if (!match) return monthKey;
  const index = Number(match[1]) * 12 + (Number(match[2]) - 1) + delta;
  const y = Math.floor(index / 12);
  const m = (index % 12) + 1;
  return `${y}-${pad(m)}`;
}

export function budgetWindowFor(config: BudgetConfig, now: Date): BudgetWindow {
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const monthStart = toYmd(year, month, 1);
  const monthEnd = toYmd(year, month, daysInCalendarMonth(year, month));
  const today = toYmd(year, month, now.getDate());

  let mode: BudgetMode = 'month';
  let start = monthStart;
  let end = monthEnd;
  const periodStart = config.periodStart?.slice(0, 10);
  const periodEnd = config.periodEnd?.slice(0, 10);
  if (config.mode === 'period' && periodStart && periodEnd && periodStart <= periodEnd) {
    mode = 'period';
    start = periodStart;
    end = periodEnd;
  }

  const totalDays = Math.max(1, inclusiveDays(start, end));
  let elapsedDays = 0;
  let remainingDays = 0;
  let closed = false;
  if (today < start) {
    remainingDays = totalDays;
  } else if (today > end) {
    elapsedDays = totalDays;
    closed = true;
  } else {
    elapsedDays = inclusiveDays(start, today);
    remainingDays = inclusiveDays(today, end);
  }

  return { mode, start, end, totalDays, elapsedDays, remainingDays, closed, monthStart, monthEnd };
}

export function dateInRange(value: string, start: string, end: string): boolean {
  const day = value.slice(0, 10);
  return day >= start && day <= end;
}

export function computeBudgetPace(input: {
  spent: number;
  amount: number;
  window: BudgetWindow;
  currentDailyBudget: number;
}): BudgetPace {
  const { spent, amount, window, currentDailyBudget } = input;
  const avgDaily = window.elapsedDays > 0 ? spent / window.elapsedDays : 0;
  let forecast = spent;
  if (!window.closed) {
    if (currentDailyBudget > 0) {
      const horizon = window.elapsedDays === 0 ? window.totalDays : window.remainingDays;
      forecast = spent + currentDailyBudget * horizon;
    } else if (window.elapsedDays > 0) {
      forecast = avgDaily * window.totalDays;
    }
  }
  const remaining = Math.max(0, amount - spent);
  const recommendedDaily = window.remainingDays > 0 ? remaining / window.remainingDays : 0;
  const progress = amount > 0 ? (spent / amount) * 100 : 0;

  let status: BudgetPace['status'] = 'ok';
  if (amount > 0) {
    if (spent > amount) status = 'over';
    else if (!window.closed && forecast > amount) status = 'risk';
    else if (!window.closed && window.elapsedDays / window.totalDays > 20 / 30 && progress < 50) status = 'under';
  }

  return { forecast, remaining, recommendedDaily, avgDaily, progress, status };
}

export function earliestBudgetQueryStart(
  settings: Array<{ budget_mode?: string | null; budget_period_start?: string | null }>,
  monthStart: string,
): string {
  let start = monthStart;
  for (const row of settings) {
    if (row.budget_mode === 'period' && row.budget_period_start) {
      const day = row.budget_period_start.slice(0, 10);
      if (day && day < start) start = day;
    }
  }
  return start;
}
