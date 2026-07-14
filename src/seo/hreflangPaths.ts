import {
  normalizePathname,
  pathEnToEs,
  pathEsToEn,
  PUBLIC_PATH_ES_TO_EN,
} from "@/i18n/publicPaths";

/** Rutas de app / auth sin paridad pública ES↔EN. */
const PROTECTED_PATH_PREFIXES = [
  "/login",
  "/reset-password",
  "/meta-callback",
  "/google-callback",
  "/onboarding",
  "/suspended",
  "/account-inactive",
  "/admin",
  "/dashboard",
  "/planner",
  "/deadlines",
  "/team",
  "/tiempos",
  "/team-capacity",
  "/operaciones",
  "/finanzas",
  "/capacidad",
  "/clients",
  "/projects",
  "/okrs",
  "/reports",
  "/weekly-forecast",
  "/actividad",
  "/settings",
  "/agency",
  "/exportacion-informes",
  "/agencies",
  "/ads",
  "/meta-ads",
  "/api-keys",
  "/soporte",
  "/review-agents",
] as const;

function isProtectedAppPath(pathname: string): boolean {
  const p = normalizePathname(pathname);
  return PROTECTED_PATH_PREFIXES.some((pref) => p === pref || p.startsWith(`${pref}/`));
}

/** Indica si la ruta canónica en español tiene versión inglesa publicada. */
export function hasEnglishAlternate(pathEs: string): boolean {
  const p = normalizePathname(pathEs);
  if (p === "/" || PUBLIC_PATH_ES_TO_EN[p]) return true;
  if (p === "/guia" || p.startsWith("/guia/")) return true;
  if (p === "/blog" || p.startsWith("/blog/")) return true;
  return false;
}

/** Rutas de marketing / legales con hreflang (excluye panel autenticado). */
export function isPublicMarketingPath(pathname: string): boolean {
  const p = normalizePathname(pathname);
  if (isProtectedAppPath(p)) return false;
  if (p === "/en" || p.startsWith("/en/")) return true;
  return hasEnglishAlternate(p);
}

export type ResolvedHreflang = {
  pathEs: string;
  pathEn: string;
  lang: "es" | "en";
};

/** Resuelve par ES/EN y idioma activo a partir del pathname actual. */
export function resolveHreflangFromPathname(pathname: string): ResolvedHreflang | null {
  const p = normalizePathname(pathname);
  if (!isPublicMarketingPath(p)) return null;

  const lang: "es" | "en" = p === "/en" || p.startsWith("/en/") ? "en" : "es";
  const pathEs = lang === "en" ? pathEnToEs(p) : p;
  if (!hasEnglishAlternate(pathEs)) return null;

  return {
    pathEs,
    pathEn: pathEsToEn(pathEs),
    lang,
  };
}
