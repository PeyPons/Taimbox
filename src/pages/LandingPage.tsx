import { useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { MotionConfig, useReducedMotion } from "motion/react";
import { SeoTags } from "@/seo/SeoTags";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingBelowMotionSections } from "@/components/landing/LandingBelowMotionSections";
import { LandingLiteralHero } from "@/components/landing/LandingLiteralHero";
import { useLandingLiteralDomMotion } from "@/hooks/useLandingLiteralDomMotion";
import { useLandingHeroAmbientMotion } from "@/hooks/useLandingHeroAmbientMotion";
import { useLandingBelowReveal } from "@/hooks/useLandingBelowReveal";
import { useLandingBackgroundParallax } from "@/hooks/useLandingBackgroundParallax";

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
  useLandingBelowReveal(reduceMotion);
  useLandingBackgroundParallax(reduceMotion);

  useEffect(() => {
    if (reduceMotion) return;
    const root = document.documentElement;
    const onMove = (e: MouseEvent) => {
      const x = (e.clientX / Math.max(window.innerWidth, 1)) * 100;
      const y = (e.clientY / Math.max(window.innerHeight, 1)) * 100;
      root.style.setProperty("--landing-glow-x", `${x}%`);
      root.style.setProperty("--landing-glow-y", `${y}%`);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [reduceMotion]);

  return (
    <MotionConfig reducedMotion="never">
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

      <div className="relative min-h-screen min-w-0 isolate bg-white overflow-x-clip">
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-[5] hidden mix-blend-screen motion-reduce:hidden lg:block"
          style={{
            background: reduceMotion
              ? "radial-gradient(420px at 50% 25%, rgba(168, 85, 247, 0.18), rgba(99, 102, 241, 0.1) 35%, transparent 70%)"
              : "radial-gradient(420px at var(--landing-glow-x, 50%) var(--landing-glow-y, 25%), rgba(168, 85, 247, 0.22), rgba(99, 102, 241, 0.1) 35%, transparent 70%)",
          }}
        />

        <LandingHeader variant="light" />

        <LandingLiteralHero ref={setLiteralHeroRef} reduceMotion={reduceMotion} />

        <LandingBelowMotionSections reduceMotion={reduceMotion} />

        <LandingFooter variant="light" />
      </div>
    </MotionConfig>
  );
}
