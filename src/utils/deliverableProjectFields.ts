/** Parseo del importe total opcional en formularios (cartera / onboarding). */
export function parseDeliverableContractFeeInput(raw: string | undefined): number | null {
  const s = raw?.trim();
  if (!s) return null;
  const n = parseFloat(s.replace(',', '.'));
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}
