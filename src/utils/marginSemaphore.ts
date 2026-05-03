/** Límite % margen para considerar "óptimo" (verde). Por debajo hasta 0% = ámbar; negativo = rojo. */
export const MARGIN_HEALTHY_PCT = 20;

/** Clase CSS y si mostrar icono de alerta para semáforo de margen (por %). */
export function getMarginSemaphore(marginPct: number): { className: string; showAlert: boolean } {
    if (marginPct > MARGIN_HEALTHY_PCT) return { className: 'text-emerald-600 dark:text-emerald-400', showAlert: false };
    if (marginPct >= 0) return { className: 'text-amber-500', showAlert: false };
    return { className: 'text-red-600', showAlert: true };
}
