type CampaignBudgetRow = {
  status?: string | null;
  daily_budget?: number | null;
  budget_id?: string | null;
  client_id?: string | null;
};

/**
 * Clave para deduplicar presupuestos compartidos (cartera Google Ads).
 * Incluye cuenta porque el id de campaign_budget es local al customer de Google.
 */
export function buildCampaignBudgetDedupeKey(
  budgetId: string | null | undefined,
  accountId: string | null | undefined,
  dailyBudget: number,
): string | null {
  const account = accountId?.trim();
  const id = budgetId?.trim();

  if (id) {
    return account ? `id:${account}:${id}` : `id:${id}`;
  }

  // Sin budget_id (sync antiguo): heurística — varias campañas con el mismo importe
  // en la misma cuenta suelen ser cartera compartida con el total repetido en cada fila.
  if (account && dailyBudget > 0) {
    return `amt:${account}:${dailyBudget.toFixed(6)}`;
  }

  return null;
}

/**
 * Suma presupuestos diarios de campañas evitando duplicar carteras compartidas (Google Ads).
 */
export function addCampaignDailyBudget(
  sum: number,
  seenBudgetIds: Set<string>,
  dailyBudget: number,
  budgetId: string | null | undefined,
  status: string,
  accountId?: string | null,
): number {
  if (status !== 'ENABLED' || dailyBudget <= 0) return sum;

  const key = buildCampaignBudgetDedupeKey(budgetId, accountId, dailyBudget);
  if (key) {
    if (seenBudgetIds.has(key)) return sum;
    seenBudgetIds.add(key);
  }

  return sum + dailyBudget;
}

/** Cuenta campañas activas que comparten la misma cartera de presupuesto. */
export function countSharedBudgetCampaigns(campaigns: CampaignBudgetRow[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const c of campaigns) {
    if (c.status !== 'ENABLED' || !c.daily_budget || Number(c.daily_budget) <= 0) continue;
    const daily = Number(c.daily_budget);
    const key = buildCampaignBudgetDedupeKey(c.budget_id, c.client_id, daily);
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

/** Presupuesto diario mostrado por campaña (total de cartera ÷ nº de campañas si comparten). */
export function getCampaignDisplayDailyBudget(
  camp: CampaignBudgetRow,
  sharedCounts: Map<string, number>,
): number | null {
  if (!camp.daily_budget || Number(camp.daily_budget) <= 0) return null;
  const daily = Number(camp.daily_budget);
  const key = buildCampaignBudgetDedupeKey(camp.budget_id, camp.client_id, daily);
  if (!key) return daily;
  const count = sharedCounts.get(key) ?? 1;
  if (count <= 1) return daily;
  return daily / count;
}

export function isSharedPortfolioBudget(
  camp: CampaignBudgetRow,
  sharedCounts: Map<string, number>,
): boolean {
  if (!camp.daily_budget || Number(camp.daily_budget) <= 0) return false;
  const key = buildCampaignBudgetDedupeKey(camp.budget_id, camp.client_id, Number(camp.daily_budget));
  if (!key) return false;
  return (sharedCounts.get(key) ?? 0) > 1;
}
