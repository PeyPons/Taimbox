import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PUBLIC_PATH_ES_TO_EN } from "./publicPaths";

/**
 * Sincroniza `i18n.language` con la URL en rutas **públicas**.
 *
 * - Rutas bajo `/en/…` → fuerza inglés.
 * - Rutas públicas en español (landing, blog, seguridad…) → fuerza español.
 * - Rutas **autenticadas** (dashboard, planner, settings…) → respeta
 *   la preferencia del usuario guardada en localStorage.
 *
 * Debe montarse dentro de `BrowserRouter`.
 */

// Construimos un Set de todos los pathnames públicos conocidos (ES + EN + variantes)
const PUBLIC_ES_PATHS = new Set(Object.keys(PUBLIC_PATH_ES_TO_EN));
const PUBLIC_EN_PATHS = new Set(Object.values(PUBLIC_PATH_ES_TO_EN));

function isPublicPath(p: string): boolean {
  // Rutas inglesas explícitas
  if (p === "/en" || p.startsWith("/en/")) return true;
  // Rutas españolas explícitas
  if (PUBLIC_ES_PATHS.has(p)) return true;
  if (PUBLIC_EN_PATHS.has(p)) return true;
  // Rutas con prefijo conocido (blog, guia, etc.)
  if (p.startsWith("/blog/") || p.startsWith("/guia/")) return true;
  // Login y reset-password son públicas pero no tienen /en/
  if (p === "/login" || p === "/reset-password") return true;
  return false;
}

export function PublicLocaleSync() {
  const { pathname } = useLocation();
  const { i18n } = useTranslation();

  useEffect(() => {
    const p = (pathname.split("?")[0] ?? pathname).replace(/\/+$/, "") || "/";

    // Solo forzar idioma en rutas públicas; las autenticadas respetan localStorage
    if (!isPublicPath(p)) return;

    const isEn = p === "/en" || p.startsWith("/en/");
    const next = isEn ? "en" : "es";
    if (i18n.language !== next) {
      void i18n.changeLanguage(next);
    }
  }, [pathname, i18n]);

  return null;
}
