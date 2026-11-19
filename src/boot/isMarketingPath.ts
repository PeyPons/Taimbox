import { normalizePathname, PUBLIC_PATH_ES_TO_EN } from "@/i18n/publicPaths";

/**
 * Rutas que carga la entrada ligera (`publicEntry`).
 * Login, reset y el panel quedan en la entrada de la app: si no, el alta
 * no podría navegar al Dashboard sin recargar.
 */
const EXACT = new Set<string>([
  ...Object.keys(PUBLIC_PATH_ES_TO_EN),
  ...Object.values(PUBLIC_PATH_ES_TO_EN),
  "/que-es-timeboxing",
]);

export function isMarketingPath(pathname: string): boolean {
  const path = normalizePathname(pathname);
  if (EXACT.has(path)) return true;
  if (path.startsWith("/guia/") || path.startsWith("/en/guide/")) return true;
  if (path.startsWith("/blog/") || path.startsWith("/en/blog/")) return true;
  return false;
}
