/**
 * Suma presupuestos diarios de campañas evitando duplicar carteras compartidas (Google Ads).
 */
export function addCampaignDailyBudget(
  sum: number,
  seenBudgetIds: Set<string>,
  dailyBudget: number,
  budgetId: string | null | undefined,
  status: string,
): number {
  if (status !== 'ENABLED' || dailyBudget <= 0) return sum;

  const id = budgetId?.trim();
  if (id) {
    if (seenBudgetIds.has(id)) return sum;
    seenBudgetIds.add(id);
  }

  return sum + dailyBudget;
}
