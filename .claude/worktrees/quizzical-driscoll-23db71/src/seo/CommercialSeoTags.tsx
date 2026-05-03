import { useTranslation } from "react-i18next";
import { pathEsToEn } from "@/i18n/publicPaths";
import { SeoTags } from "./SeoTags";

export type CommercialPageKey =
  | "employeeDashboard"
  | "planner"
  | "team"
  | "reports"
  | "projects"
  | "integrations"
  | "ppc"
  | "security";

export function CommercialSeoTags({ pathEs, pageKey }: { pathEs: string; pageKey: CommercialPageKey }) {
  const { t, i18n } = useTranslation("landing");
  const lang = i18n.language.startsWith("en") ? "en" : "es";
  const p = `commercial.${pageKey}`;
  return (
    <SeoTags
      pathEs={pathEs}
      pathEn={pathEsToEn(pathEs)}
      title={t(`${p}.seoTitle`)}
      description={t(`${p}.seoDescription`)}
      lang={lang}
      jsonLd={{
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: t(`${p}.jsonName`),
        description: t(`${p}.jsonDescription`),
      }}
    />
  );
}
