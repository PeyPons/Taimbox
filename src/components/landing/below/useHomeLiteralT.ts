import { useTranslation } from "react-i18next";

import { localizedPathFromEs } from "@/i18n/publicPaths";

/** Traducciones de la home literal (`home.literal` en `landing.json`). */
export function useHomeLiteralT() {
  const { t, i18n } = useTranslation("landing", { keyPrefix: "home.literal" });
  const path = (hrefEs: string) => localizedPathFromEs(hrefEs, i18n.language);
  return { t, path };
}
