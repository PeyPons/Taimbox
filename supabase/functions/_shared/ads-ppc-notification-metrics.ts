/** Métricas PPC para reglas programadas (paridad con src/utils/adsBudgetAlerts.ts). */

export type AdsPpcStatus = "over" | "risk";

export interface AdsSpendRow {
  client_id: string;
  cost: number;
  date: string;
}

export interface AdsClientSettingRow {
  client_id: string;
  budget_limit: number;
  group_name?: string | null;
  is_hidden?: boolean | null;
}

export interface AdsPpcAlert {
  platform: "google" | "meta";
  clientKey: string;
  displayName: string;
  status: AdsPpcStatus;
  spent: number;
  budget: number;
  forecast: number;
  monthKey: string;
}

function monthBounds(now: Date): {
  monthStart: string;
  monthEnd: string;
  daysInMonth: number;
  currentDay: number;
  monthKey: string;
} {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const monthEnd = `${year}-${String(month).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;
  return {
    monthStart,
    monthEnd,
    daysInMonth,
    currentDay: now.getUTCDate(),
    monthKey: `${year}-${String(month).padStart(2, "0")}`,
  };
}

function resolveGroupKey(clientId: string, settingsByClient: Map<string, AdsClientSettingRow>): string {
  const settings = settingsByClient.get(clientId);
  const groupName = settings?.group_name?.trim();
  if (groupName) return `GROUP-${groupName}`;
  return clientId;
}

function pacingStatus(
  budget: number,
  spent: number,
  forecast: number,
  currentDay: number,
  daysInMonth: number,
): AdsPpcStatus | "ok" {
  if (budget <= 0) return "ok";
  if (spent > budget) return "over";
  if (forecast > budget) return "risk";
  if (currentDay > 20 && (spent / budget) * 100 < 50) return "ok";
  return "ok";
}

function aggregatePlatformAlerts(
  platform: "google" | "meta",
  rows: AdsSpendRow[],
  settings: AdsClientSettingRow[],
  now: Date,
): AdsPpcAlert[] {
  const { monthStart, monthEnd, daysInMonth, currentDay, monthKey } = monthBounds(now);
  const settingsByClient = new Map(settings.map((s) => [s.client_id, s]));
  const visibleSettings = settings.filter((s) => !s.is_hidden && Number(s.budget_limit) > 0);

  const groupBudget = new Map<string, number>();
  for (const s of visibleSettings) {
    const key = resolveGroupKey(s.client_id, settingsByClient);
    if (key.startsWith("GROUP-")) {
      if (s.client_id === key) groupBudget.set(key, Number(s.budget_limit));
    } else {
      groupBudget.set(key, Number(s.budget_limit));
    }
  }

  const spentByKey = new Map<string, number>();
  const nameByKey = new Map<string, string>();

  for (const row of rows) {
    const rowDate = typeof row.date === "string" ? row.date.substring(0, 10) : String(row.date).substring(0, 10);
    if (rowDate < monthStart || rowDate > monthEnd) continue;
    const settingsForRow = settingsByClient.get(row.client_id);
    if (settingsForRow?.is_hidden) continue;
    const key = resolveGroupKey(row.client_id, settingsByClient);
    spentByKey.set(key, (spentByKey.get(key) ?? 0) + (Number(row.cost) || 0));
    const displayName = key.startsWith("GROUP-") ? key.replace(/^GROUP-/, "") : row.client_id;
    if (!nameByKey.has(key)) nameByKey.set(key, displayName);
  }

  const alerts: AdsPpcAlert[] = [];
  for (const [key, budget] of groupBudget) {
    if (budget <= 0) continue;
    const spent = spentByKey.get(key) ?? 0;
    const avgDailySpend = currentDay > 0 ? spent / currentDay : 0;
    const forecast = avgDailySpend * daysInMonth;
    const status = pacingStatus(budget, spent, forecast, currentDay, daysInMonth);
    if (status !== "over" && status !== "risk") continue;
    alerts.push({
      platform,
      clientKey: key,
      displayName: nameByKey.get(key) ?? key,
      status,
      spent,
      budget,
      forecast,
      monthKey,
    });
  }
  return alerts;
}

export function computeAdsPpcAlerts(
  settings: AdsClientSettingRow[],
  googleRows: AdsSpendRow[],
  metaRows: AdsSpendRow[],
  platforms: Array<"google" | "meta">,
  now: Date = new Date(),
): AdsPpcAlert[] {
  const useGoogle = platforms.length === 0 || platforms.includes("google");
  const useMeta = platforms.length === 0 || platforms.includes("meta");
  const out: AdsPpcAlert[] = [];
  if (useGoogle) out.push(...aggregatePlatformAlerts("google", googleRows, settings, now));
  if (useMeta) out.push(...aggregatePlatformAlerts("meta", metaRows, settings, now));
  return out;
}

export function adsPpcAlertMatchesFlags(alert: AdsPpcAlert, matchAny: AdsPpcStatus[]): boolean {
  return matchAny.includes(alert.status);
}
