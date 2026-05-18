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

      <div className="relative min-h-screen min-w-0 isolate bg-gradient-to-br from-indigo-950 via-purple-950 to-indigo-900 overflow-x-clip">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-50" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl opacity-50" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-3xl opacity-30" />
        </div>
        <div
          className="pointer-events-none absolute inset-0 opacity-10"
          aria-hidden
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "50px 50px",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-[5] hidden mix-blend-screen motion-reduce:hidden lg:block"
          style={{
            background: reduceMotion
              ? "radial-gradient(420px at 50% 25%, rgba(129, 140, 248, 0.2), rgba(168, 85, 247, 0.12) 35%, transparent 70%)"
              : "radial-gradient(420px at var(--landing-glow-x, 50%) var(--landing-glow-y, 25%), rgba(129, 140, 248, 0.24), rgba(168, 85, 247, 0.14) 35%, transparent 70%)",
          }}
        />

        <LandingHeader />

        <LandingLiteralHero ref={setLiteralHeroRef} reduceMotion={reduceMotion} />

        <LandingBelowMotionSections reduceMotion={reduceMotion} />

        <LandingFooter />
      </div>
    </MotionConfig>
  );
}
