import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import { absoluteUrl } from "@/lib/publicSiteUrl";
import { resolveHreflangFromPathname } from "./hreflangPaths";

/**
 * Inyecta hreflang (es / en / x-default) en todas las rutas públicas con par EN.
 * Al añadir una landing en App.tsx, registra el par en `publicPaths.ts` (`PUBLIC_PATH_ES_TO_EN`).
 */
export function RouteHreflangSync() {
  const { pathname } = useLocation();
  const resolved = resolveHreflangFromPathname(pathname);
  if (resolved == null) return null;

  const urlEs = absoluteUrl(resolved.pathEs);
  const urlEn = absoluteUrl(resolved.pathEn);

  return (
    <Helmet>
      <html lang={resolved.lang} />
      <link rel="alternate" hrefLang="es" href={urlEs} />
      <link rel="alternate" hrefLang="en" href={urlEn} />
      <link rel="alternate" hrefLang="x-default" href={urlEs} />
    </Helmet>
  );
}
