import { Helmet } from "react-helmet-async";
import { absoluteUrl } from "@/lib/publicSiteUrl";

export type SeoTagsProps = {
  /** Ruta canónica en español, p. ej. `/precios` */
  pathEs: string;
  /** Ruta equivalente en inglés, p. ej. `/en/pricing` */
  pathEn: string;
  title: string;
  description: string;
  /** Idioma actual de la página (`es` o `en`) */
  lang: "es" | "en";
  ogType?: string;
  /** JSON-LD opcional (objeto o array para @graph) */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  /** p. ej. `noindex, nofollow` para páginas internas */
  robots?: string;
};

export function SeoTags({
  pathEs,
  pathEn,
  title,
  description,
  lang,
  ogType = "website",
  jsonLd,
  robots,
}: SeoTagsProps) {
  const canonicalPath = lang === "en" ? pathEn : pathEs;
  const canonical = absoluteUrl(canonicalPath);
  const urlEs = absoluteUrl(pathEs);
  const urlEn = absoluteUrl(pathEn);

  const ldPayload =
    jsonLd != null
      ? Array.isArray(jsonLd)
        ? { "@context": "https://schema.org", "@graph": jsonLd }
        : jsonLd
      : null;

  return (
    <Helmet>
      <html lang={lang} />
      <title>{title}</title>
      <meta name="description" content={description} />
      {robots != null && robots !== "" && <meta name="robots" content={robots} />}
      <link rel="canonical" href={canonical} />
      <link rel="alternate" hrefLang="es" href={urlEs} />
      <link rel="alternate" hrefLang="en" href={urlEn} />
      <link rel="alternate" hrefLang="x-default" href={urlEs} />
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:locale" content={lang === "en" ? "en_US" : "es_ES"} />
      {ldPayload != null && (
        <script type="application/ld+json">{JSON.stringify(ldPayload)}</script>
      )}
    </Helmet>
  );
}
