export type RoasPresentation =
  | { kind: 'hidden' }
  | { kind: 'empty' }
  | { kind: 'value'; roas: number };

/** ROAS solo cuando la cuenta vende y hay valor de conversión. Si no, no se pinta un 0 en rojo. */
export function presentRoas(input: {
  isSales: boolean;
  cost: number;
  conversionValue: number;
}): RoasPresentation {
  if (!input.isSales) return { kind: 'hidden' };
  const cost = Number(input.cost) || 0;
  const value = Number(input.conversionValue) || 0;
  if (cost <= 0 || value <= 0) return { kind: 'empty' };
  return { kind: 'value', roas: value / cost };
}

export function isAdsCampaignActive(status: string | null | undefined): boolean {
  const normalized = (status || '').toUpperCase();
  return normalized === 'ENABLED' || normalized === 'ACTIVE';
}

export function getRoasColorClass(roas: number): string {
  if (roas >= 4) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
  if (roas >= 2) return 'text-blue-700 bg-blue-50 border-blue-200';
  if (roas >= 1) return 'text-amber-700 bg-amber-50 border-amber-200';
  return 'text-red-700 bg-red-50 border-red-200';
}
