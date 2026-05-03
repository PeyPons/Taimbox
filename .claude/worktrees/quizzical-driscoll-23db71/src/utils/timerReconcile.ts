import { round2 } from '@/utils/numbers';

/**
 * Alinea hours_actual con la suma de time_entries cuando hubo guardados erróneos
 * (p. ej. Real = estimado) pero el cronómetro sí dejó filas en time_entries.
 */
export function mergeActualWithTimeEntriesSum(
  hoursActualFromAlloc: number | undefined,
  hoursAssigned: number | undefined,
  sumTimeEntries: number
): number {
  const ha = hoursActualFromAlloc ?? 0;
  const as = hoursAssigned ?? 0;
  const sum = round2(sumTimeEntries);
  if (sum <= 0) return round2(ha);
  if (sum > ha + 1e-4) return sum;
  if (Math.abs(ha - as) < 1e-4 && sum < ha - 1e-4) return sum;
  return round2(ha);
}
