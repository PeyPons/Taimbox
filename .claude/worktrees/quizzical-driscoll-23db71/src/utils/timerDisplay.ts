/**
 * HH:MM alineado con `formattedTimeShort` de useTaskTimer (total en segundos desde horas decimales).
 */
export function formatDecimalHoursAsHm(totalHours: number): string {
  if (!Number.isFinite(totalHours) || totalHours <= 0) return '00:00';
  const totalSeconds = Math.max(0, Math.round(totalHours * 3600));
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  return `${h}:${m}`;
}
