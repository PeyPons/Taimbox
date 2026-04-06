/**
 * URL absoluta del sitio público (canonical, hreflang, OG).
 * Definir en `.env`: VITE_PUBLIC_SITE_URL=https://taimbox.com
 */
export function getPublicSiteUrl(): string {
  const raw = import.meta.env.VITE_PUBLIC_SITE_URL as string | undefined;
  if (raw && /^https?:\/\//i.test(raw.trim())) {
    return raw.replace(/\/+$/, "");
  }
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin.replace(/\/+$/, "");
  }
  return "https://taimbox.com";
}

export function absoluteUrl(pathname: string): string {
  const base = getPublicSiteUrl();
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${base}${path}`;
}
