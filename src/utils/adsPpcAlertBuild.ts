import { addCampaignDailyBudget } from '@/utils/adsBudgetUtils';

export type AdsPpcStatus = 'over' | 'risk';

export interface AdsCampaignRow {
  client_id: string;
  client_name?: string | null;
  cost: number;
  date: string;
  daily_budget?: number | null;
  status?: string | null;
  budget_id?: string | null;
  campaign_name?: string | null;
}

export interface AdsClientSettingRow {
  client_id: string;
  budget_limit: number;
  group_name?: string | null;
  is_hidden?: boolean | null;
}

export interface AdsAccountConfigRow {
  account_id: string;
  account_name?: string | null;
  currency?: string | null;
}

export interface AdsSegmentationRuleRow {
  account_id: string;
  keyword: string;
  virtual_name: string;
}

export interface AdsPpcAlertDetail {
  platform: 'google' | 'meta';
  clientKey: string;
  displayName: string;
  isGroup: boolean;
  accountRefs: Array<{ id: string; name: string }>;
  status: AdsPpcStatus;
  monthKey: string;
  currency: string;
  monthlyBudgetMax: number;
  isManualBudget: boolean;
  spent: number;
  forecast: number;
  remainingBudget: number;
  progressPct: number;
  forecastPct: number;
  currentDailyBudget: number;
  avgDailySpend: number;
  recommendedDaily: number;
  daysInMonth: number;
  currentDay: number;
  daysRemaining: number;
}

function normalizeId(id: string): string {
  return id ? id.trim() : '';
}

function formatProjectName(name: string): string {
  return (name || '').replace(/^(Cliente|Client)\s*[-:]?\s*/i, '');
}

function monthBounds(now: Date): {
  monthStart: string;
  monthEnd: string;
  daysInMonth: number;
  currentDay: number;
  daysRemaining: number;
  monthKey: string;
} {
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const daysInMonth = new Date(year, now.getMonth() + 1, 0).getDate();
  const currentDay = now.getDate();
  return {
    monthStart: `${year}-${String(month).padStart(2, '0')}-01`,
    monthEnd: `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`,
    daysInMonth,
    currentDay,
    daysRemaining: Math.max(1, daysInMonth - currentDay + 1),
    monthKey: `${year}-${String(month).padStart(2, '0')}`,
  };
}

function resolveCurrency(
  accountRefs: Array<{ id: string }>,
  currencyByAccount: Map<string, string>,
  fallback = 'EUR',
): string {
  for (const ref of accountRefs) {
    const c = currencyByAccount.get(normalizeId(ref.id));
    if (c) return c;
  }
  return fallback;
}

type StatsEntry = {
  name: string;
  spent: number;
  manualBudget: number;
  isGroup: boolean;
  isHidden: boolean;
  realIdsNames: Array<{ id: string; name: string }>;
  autoDailyBudgetSum: number;
  seenBudgetIds: Set<string>;
  isManualGroupBudget: boolean;
};

function buildPlatformAlerts(
  platform: 'google' | 'meta',
  rows: AdsCampaignRow[],
  settings: AdsClientSettingRow[],
  registeredAccounts: AdsAccountConfigRow[],
  segmentationRules: AdsSegmentationRuleRow[],
  now: Date,
): AdsPpcAlertDetail[] {
  const { monthStart, monthEnd, daysInMonth, currentDay, daysRemaining, monthKey } = monthBounds(now);

  const clientSettings: Record<
    string,
    { budget: number; group_name: string; is_hidden: boolean }
  > = {};
  for (const s of settings) {
    clientSettings[s.client_id] = {
      budget: Number(s.budget_limit) || 0,
      group_name: s.group_name?.trim() || '',
      is_hidden: Boolean(s.is_hidden),
    };
  }

  const accountNameById = new Map<string, string>();
  const currencyByAccount = new Map<string, string>();
  for (const acc of registeredAccounts) {
    const id = normalizeId(acc.account_id);
    if (acc.account_name) accountNameById.set(id, acc.account_name);
    if (acc.currency) currencyByAccount.set(id, acc.currency.toUpperCase());
  }

  const stats = new Map<string, StatsEntry>();

  const uniqueAccounts = Array.from(
    new Set(rows.map((r) => JSON.stringify({ id: r.client_id, name: r.client_name ?? '' }))),
  ).map((s) => JSON.parse(s) as { id: string; name: string });

  for (const acc of registeredAccounts) {
    const id = normalizeId(acc.account_id);
    if (!uniqueAccounts.find((u) => normalizeId(u.id) === id)) {
      uniqueAccounts.push({ id: acc.account_id, name: acc.account_name ?? acc.account_id });
    }
  }

  for (const acc of uniqueAccounts) {
    const cfg = clientSettings[acc.id] || { budget: 0, group_name: '', is_hidden: false };
    const groupKey = cfg.group_name ? `GROUP-${cfg.group_name}` : acc.id;
    const resolvedName =
      formatProjectName(acc.name) ||
      accountNameById.get(normalizeId(acc.id)) ||
      acc.name ||
      acc.id;

    if (!cfg.group_name && !stats.has(groupKey)) {
      stats.set(groupKey, {
        name: resolvedName,
        spent: 0,
        manualBudget: cfg.budget,
        isGroup: false,
        isHidden: cfg.is_hidden,
        realIdsNames: [{ id: acc.id, name: resolvedName }],
        autoDailyBudgetSum: 0,
        seenBudgetIds: new Set(),
        isManualGroupBudget: false,
      });
    }
  }

  for (const row of rows) {
    const rowDate =
      typeof row.date === 'string'
        ? row.date.substring(0, 10)
        : new Date(row.date).toISOString().substring(0, 10);
    if (rowDate < monthStart || rowDate > monthEnd) continue;

    let finalId = row.client_id;
    let finalName =
      formatProjectName(row.client_name ?? '') ||
      accountNameById.get(normalizeId(row.client_id)) ||
      row.client_name ||
      row.client_id;

    const rulesForAccount = segmentationRules.filter(
      (r) => normalizeId(r.account_id) === normalizeId(row.client_id),
    );
    if (rulesForAccount.length > 0 && row.campaign_name) {
      const match = rulesForAccount.find((r) =>
        row.campaign_name!.toLowerCase().includes(r.keyword.toLowerCase()),
      );
      if (match) {
        finalId = `${row.client_id}_${match.keyword.toUpperCase()}`;
        finalName = match.virtual_name;
      }
    }

    const cfg = clientSettings[finalId] || { budget: 0, group_name: '', is_hidden: false };
    if (cfg.is_hidden) continue;

    const groupKey = cfg.group_name ? `GROUP-${cfg.group_name}` : finalId;
    const displayName = cfg.group_name || finalName;
    const isGroupManual = groupKey.startsWith('GROUP-') && (clientSettings[groupKey]?.budget ?? 0) > 0;

    if (!stats.has(groupKey)) {
      stats.set(groupKey, {
        name: displayName,
        spent: 0,
        manualBudget: 0,
        isGroup: groupKey.startsWith('GROUP-'),
        isHidden: cfg.is_hidden,
        realIdsNames: [],
        autoDailyBudgetSum: 0,
        seenBudgetIds: new Set(),
        isManualGroupBudget: isGroupManual,
      });
    }

    const entry = stats.get(groupKey)!;
    entry.spent += Number(row.cost) || 0;

    if (row.status === 'ENABLED' && Number(row.daily_budget) > 0) {
      entry.autoDailyBudgetSum = addCampaignDailyBudget(
        entry.autoDailyBudgetSum,
        entry.seenBudgetIds,
        Number(row.daily_budget) || 0,
        row.budget_id,
        row.status ?? '',
      );
    }

    if (!entry.realIdsNames.some((r) => r.id === finalId)) {
      entry.realIdsNames.push({ id: finalId, name: finalName });
    }
  }

  const alerts: AdsPpcAlertDetail[] = [];

  for (const [key, value] of stats) {
    if (value.isHidden) continue;

    let monthlyBudgetMax = 0;
    let isManualBudget = false;

    if (value.isGroup) {
      const groupSettings =
        clientSettings[key.replace(/^GROUP-/, '')] || clientSettings[key];
      if (groupSettings && groupSettings.budget > 0) {
        monthlyBudgetMax = groupSettings.budget;
        isManualBudget = true;
      } else {
        monthlyBudgetMax = value.autoDailyBudgetSum * 30.4;
      }
    } else {
      const memberBudget = value.realIdsNames.reduce((max, ref) => {
        const b = clientSettings[ref.id]?.budget ?? 0;
        return Math.max(max, b);
      }, 0);
      if (memberBudget > 0) {
        monthlyBudgetMax = memberBudget;
        isManualBudget = true;
      } else {
        monthlyBudgetMax = value.autoDailyBudgetSum * 30.4;
      }
    }

    if (!isManualBudget || monthlyBudgetMax <= 0) continue;

    const spent = value.spent;
    const avgDailySpend = currentDay > 0 ? spent / currentDay : 0;
    const currentDailyBudget = value.autoDailyBudgetSum;
    const forecast =
      currentDailyBudget > 0
        ? spent + currentDailyBudget * daysRemaining
        : avgDailySpend * daysInMonth;

    let status: AdsPpcStatus | null = null;
    if (spent > monthlyBudgetMax) status = 'over';
    else if (forecast > monthlyBudgetMax) status = 'risk';
    if (!status) continue;

    const remainingBudget = Math.max(0, monthlyBudgetMax - spent);
    const recommendedDaily = daysRemaining > 0 ? remainingBudget / daysRemaining : 0;
    const progressPct = monthlyBudgetMax > 0 ? Math.round((spent / monthlyBudgetMax) * 100) : 0;
    const forecastPct = monthlyBudgetMax > 0 ? Math.round((forecast / monthlyBudgetMax) * 100) : 0;

    alerts.push({
      platform,
      clientKey: key,
      displayName: value.name,
      isGroup: value.isGroup,
      accountRefs: value.realIdsNames.length
        ? value.realIdsNames
        : [{ id: key, name: value.name }],
      status,
      monthKey,
      currency: resolveCurrency(value.realIdsNames, currencyByAccount),
      monthlyBudgetMax,
      isManualBudget,
      spent,
      forecast,
      remainingBudget,
      progressPct,
      forecastPct,
      currentDailyBudget,
      avgDailySpend,
      recommendedDaily,
      daysInMonth,
      currentDay,
      daysRemaining,
    });
  }

  return alerts;
}

export function buildAdsPpcAlerts(input: {
  settings: AdsClientSettingRow[];
  google?: {
    campaigns: AdsCampaignRow[];
    accounts: AdsAccountConfigRow[];
    rules: AdsSegmentationRuleRow[];
  };
  meta?: {
    campaigns: AdsCampaignRow[];
    accounts: AdsAccountConfigRow[];
    rules: AdsSegmentationRuleRow[];
  };
  platforms?: Array<'google' | 'meta'>;
  now?: Date;
}): AdsPpcAlertDetail[] {
  const now = input.now ?? new Date();
  const platforms = input.platforms?.length ? input.platforms : (['google', 'meta'] as const);
  const out: AdsPpcAlertDetail[] = [];

  if (platforms.includes('google') && input.google) {
    out.push(
      ...buildPlatformAlerts(
        'google',
        input.google.campaigns,
        input.settings,
        input.google.accounts,
        input.google.rules,
        now,
      ),
    );
  }
  if (platforms.includes('meta') && input.meta) {
    out.push(
      ...buildPlatformAlerts(
        'meta',
        input.meta.campaigns,
        input.settings,
        input.meta.accounts,
        input.meta.rules,
        now,
      ),
    );
  }

  return out.sort((a, b) => b.spent - a.spent);
}

export function adsPpcAlertMatchesFlags(alert: { status: AdsPpcStatus }, matchAny: AdsPpcStatus[]): boolean {
  return matchAny.includes(alert.status);
}

/** Alias retrocompatible con campanita / tests simples. */
export type AdsBudgetAlert = AdsPpcAlertDetail;

export function computeAdsBudgetAlerts(
  settings: AdsClientSettingRow[],
  googleRows: Array<{ client_id: string; cost: number; date: string; client_name?: string | null }>,
  metaRows: Array<{ client_id: string; cost: number; date: string; client_name?: string | null }>,
  now: Date = new Date(),
): AdsPpcAlertDetail[] {
  return buildAdsPpcAlerts({
    settings,
    google: { campaigns: googleRows, accounts: [], rules: [] },
    meta: { campaigns: metaRows, accounts: [], rules: [] },
    now,
  });
}

export function adsBudgetAlertDedupeKey(alert: AdsPpcAlertDetail): string {
  return `${alert.platform}:${alert.clientKey}:${alert.monthKey}:${alert.status}`;
}

export function sampleAdsPpcAlertDetail(): AdsPpcAlertDetail {
  return {
    platform: 'google',
    clientKey: '1234567890',
    displayName: 'Marca Premium — España',
    isGroup: false,
    accountRefs: [{ id: '1234567890', name: 'Marca Premium — España' }],
    status: 'risk',
    monthKey: '2026-06',
    currency: 'EUR',
    monthlyBudgetMax: 12000,
    isManualBudget: true,
    spent: 7200,
    forecast: 13200,
    remainingBudget: 4800,
    progressPct: 60,
    forecastPct: 110,
    currentDailyBudget: 420,
    avgDailySpend: 480,
    recommendedDaily: 320,
    daysInMonth: 30,
    currentDay: 15,
    daysRemaining: 16,
  };
}
