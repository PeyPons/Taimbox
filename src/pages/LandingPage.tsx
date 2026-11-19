import { useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { MotionConfig, useReducedMotion } from "motion/react";
import { SeoTags } from "@/seo/SeoTags";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingBelowMotionSections } from "@/components/landing/LandingBelowMotionSections";
import { LandingLiteralHero } from "@/components/landing/LandingLiteralHero";
import { useLandingLiteralDomMotion } from "@/hooks/useLandingLiteralDomMotion";
import { useLandingHeroAmbientMotion } from "@/hooks/useLandingHeroAmbientMotion";

/** Home literal (hero + secciones inferiores en TSX). Ticker/órbita del hero: `useLandingLiteralDomMotion`. */
export default function LandingPage() {
  const { t, i18n } = useTranslation("landing");
  const lang = i18n.language.startsWith("en") ? "en" : "es";
  const reduceMotion = useReducedMotion();
  const heroRef = useRef<HTMLElement | null>(null);
  const literalHeroDomMotion = useLandingLiteralDomMotion(reduceMotion);
  const setLiteralHeroRef = useCallback(
    (node: HTMLElement | null) => {
      heroRef.current = node;
      literalHeroDomMotion(node);
    },
    [literalHeroDomMotion],
  );
  useLandingHeroAmbientMotion(heroRef, reduceMotion);

  return (
    <MotionConfig reducedMotion="user">
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

      <div className="pub-stage pub-stage--plain relative min-h-screen min-w-0 bg-[#14123B] overflow-x-clip">
        <LandingHeader />

        <LandingLiteralHero ref={setLiteralHeroRef} reduceMotion={reduceMotion} />

        <LandingBelowMotionSections reduceMotion={reduceMotion} />

        <LandingFooter variant="stage" />
      </div>
    </MotionConfig>
  );
}
