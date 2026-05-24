/**
 * Mapa de rutas públicas ES → EN (prefijo /en en inglés).
 * Panel autenticado y callbacks no tienen versión /en.
 *
 * Las rutas del blog quedan aquí como fallback estático para SEO/hreflang
 * mientras la BD no esté disponible. En runtime, el cache de Supabase
 * (poblado por BlogPathSync) tiene prioridad y permite que admin renombre
 * o añada posts sin desplegar.
 */
export const PUBLIC_PATH_ES_TO_EN: Record<string, string> = {
  "/": "/en",
  "/por-que-timeboxing": "/en/why-taimbox",
  "/blog": "/en/blog",
  "/blog/que-es-timeboxing": "/en/blog/what-is-timeboxing",
  "/blog/planificacion-proyectos-cronograma-recursos": "/en/blog/project-planning-schedule-resources",
  "/blog/ley-parkinson": "/en/blog/parkinsons-law",
  "/blog/kpis-agencias-marketing-2026": "/en/blog/marketing-agency-kpis-2026",
  "/blog/plantilla-planificacion-recursos-agencia": "/en/blog/agency-resource-planning-template",
  "/blog/por-que-tu-agencia-pierde-rentabilidad-equipo-ocupado": "/en/blog/why-agency-loses-profitability-busy-team",
  "/blog/como-medir-rentabilidad-proyecto-agencia-dejar-vender-horas": "/en/blog/measure-project-profitability-stop-selling-hours",
  "/blog/gestion-carga-trabajo-equipo-sin-burnout": "/en/blog/workload-management-without-burnout",
  "/blog/capacidad-calendario-vs-capacidad-productiva-equipo": "/en/blog/calendar-capacity-vs-shippable-team-capacity",
  "/dashboard-empleado": "/en/employee-dashboard",
  "/planificador-recursos": "/en/resource-planner",
  "/gestion-equipos": "/en/team-management",
  "/reportes-rentabilidad": "/en/reports-profitability",
  "/control-proyectos": "/en/project-control",
  "/integraciones": "/en/integrations",
  "/monitor-ppc": "/en/ppc-monitor",
  "/seguridad": "/en/security",
  "/privacidad": "/en/privacy",
  "/condiciones": "/en/terms",
  "/precios": "/en/pricing",
  "/guia": "/en/guide",
  "/contacto": "/en/contact",
  "/api-docs": "/en/api-docs",
  "/api-docs/openapi": "/en/api-docs/openapi",
  "/pitch": "/en/pitch",
};

const EN_TO_ES: Record<string, string> = Object.fromEntries(
  Object.entries(PUBLIC_PATH_ES_TO_EN).map(([es, en]) => [en, es]),
) as Record<string, string>;

// Cache runtime del blog poblado desde Supabase. Tiene prioridad sobre el mapa
// estatico para que cambios desde /admin/blog se propaguen sin redeploy.
let blogEsToEn = new Map<string, string>();
let blogEnToEs = new Map<string, string>();

/** Llamado por BlogPathSync cuando llegan los datos del blog. */
export function setBlogPathCache(pairs: { pathEs: string; pathEn: string }[]): void {
  const es = new Map<string, string>();
  const en = new Map<string, string>();
  for (const p of pairs) {
    es.set(p.pathEs, p.pathEn);
    en.set(p.pathEn, p.pathEs);
  }
  blogEsToEn = es;
  blogEnToEs = en;
}

/** Normaliza pathname (sin query) para lookup. */
export function normalizePathname(pathname: string): string {
  if (!pathname || pathname === "") return "/";
  const noQuery = pathname.split("?")[0] ?? pathname;
  if (noQuery.length > 1 && noQuery.endsWith("/")) {
    return noQuery.replace(/\/+$/, "") || "/";
  }
  return noQuery;
}

export function pathEsToEn(pathEs: string): string {
  const p = normalizePathname(pathEs);
  if (p === "/guia") return "/en/guide";
  if (p.startsWith("/guia/")) return `/en/guide/${p.slice("/guia/".length)}`;
  if (p.startsWith("/blog/")) {
    const fromCache = blogEsToEn.get(p);
    if (fromCache != null) return fromCache;
  }
  return PUBLIC_PATH_ES_TO_EN[p] ?? `/en${p === "/" ? "" : p}`;
}

export function pathEnToEs(pathEn: string): string {
  const p = normalizePathname(pathEn);
  if (p === "/en/guide") return "/guia";
  if (p.startsWith("/en/guide/")) return `/guia/${p.slice("/en/guide/".length)}`;
  if (p.startsWith("/en/blog/")) {
    const fromCache = blogEnToEs.get(p);
    if (fromCache != null) return fromCache;
  }
  return EN_TO_ES[p] ?? (p.startsWith("/en") ? p.slice(3) || "/" : p);
}

/**
 * Dada una ruta "canónica" en español (p. ej. /precios), devuelve la URL localizada según i18n.
 */
export function localizedPathFromEs(esPath: string, lng: string): string {
  const lang = lng?.split("-")[0] ?? "es";
  if (lang !== "en") return normalizePathname(esPath);
  return pathEsToEn(esPath);
}

/** Si estamos en inglés, convierte href absoluto de sección /#demo a /en#demo */
export function localizedHashPath(esPath: string, lng: string): string {
  const lang = lng?.split("-")[0] ?? "es";
  if (lang !== "en") return esPath;
  if (esPath.startsWith("/#")) return `/en${esPath}`;
  return localizedPathFromEs(esPath.split("#")[0] ?? "/", lng) + (esPath.includes("#") ? `#${esPath.split("#")[1]}` : "");
}
