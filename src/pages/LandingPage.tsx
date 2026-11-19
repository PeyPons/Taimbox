import { lazy, Suspense, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { SeoTags } from "@/seo/SeoTags";

const LandingHeroSlot = lazy(() =>
  import("@/components/landing/LandingHeroSlot").then((mod) => ({ default: mod.LandingHeroSlot })),
);
const LandingBelowMotionSections = lazy(() =>
  import("@/components/landing/LandingBelowMotionSections").then((mod) => ({
    default: mod.LandingBelowMotionSections,
  })),
);

function useShowBelowFold(): boolean {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const start = () => setShow(true);
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(start, { timeout: 800 });
      return () => window.cancelIdleCallback(id);
    }
    const id = window.setTimeout(start, 1);
    return () => window.clearTimeout(id);
  }, []);
  return show;
}

/** Home literal. El hero de producción ya está en el HTML; las secciones entran después del primer pintado. */
export default function LandingPage() {
  const { t, i18n } = useTranslation("landing");
  const lang = i18n.language.startsWith("en") ? "en" : "es";
  const staticHero =
    typeof document !== "undefined" && document.getElementById("prerender-hero") != null;
  const showBelow = useShowBelowFold();

  return (
    <>
      <SeoTags
        pathEs="/"
        pathEn="/en"
        title={t("home.seoTitle")}
        description={t("home.seoDescription")}
        lang={lang}
        jsonLd={
          {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "Taimbox",
            applicationCategory: "BusinessApplication",
            description: t("home.jsonLdDescription"),
            offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
          } as Record<string, unknown>
        }
      />

      <div className="pub-stage pub-stage--plain relative min-h-screen min-w-0 overflow-x-clip bg-[#14123B]">
        <LandingHeader spacer={!staticHero} />

        {staticHero ? null : (
          <Suspense fallback={null}>
            <LandingHeroSlot />
          </Suspense>
        )}

        {showBelow ? (
          <Suspense fallback={null}>
            <LandingBelowMotionSections reduceMotion={null} />
          </Suspense>
        ) : null}

        <LandingFooter variant="stage" />
      </div>
    </>
  );
}
