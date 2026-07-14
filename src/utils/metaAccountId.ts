/** Meta API usa prefijo act_; normaliza entradas manuales. */
export function normalizeMetaAccountId(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;
  return trimmed.startsWith('act_') ? trimmed : `act_${trimmed}`;
}
