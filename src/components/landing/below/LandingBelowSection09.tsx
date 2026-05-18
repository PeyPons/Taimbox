import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { ArrowRight, ArrowUpRight, Check } from "lucide-react";

import { useHomeLiteralT } from "@/components/landing/below/useHomeLiteralT";

const noiseLayerBackgroundImage = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.95' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

/** CTA final de la home (volcado literal → JSX). */
export const LandingBelowSection09: FC = () => {
  const { t, path } = useHomeLiteralT();
  const { t: tHome } = useTranslation("landing", { keyPrefix: "home" });

  return (
  <section
    className="relative overflow-hidden"
    style={{
      background: "rgb(76, 29, 149)",
      paddingTop: "clamp(8rem, 14vw, 12rem)",
      paddingBottom: "clamp(7rem, 13vw, 11rem)",
    }}
  >
    <div
      aria-hidden
      className="absolute inset-0 opacity-[0.05] mix-blend-overlay pointer-events-none"
      style={{ backgroundImage: noiseLayerBackgroundImage }}
    />
    <div className="relative max-w-3xl mx-auto px-6 lg:px-10 text-center">
      <div
        className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-6 backdrop-blur-md"
        style={{
          background: "rgba(255, 255, 255, 0.1)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
        }}
      >
        <Check className="h-3 w-3 text-emerald-300" strokeWidth={3} aria-hidden />
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/85">
          {t("s09.badge")}
        </span>
      </div>
      <h2 className="text-[2.5rem] sm:text-5xl lg:text-6xl xl:text-7xl font-semibold text-white leading-[1.05] -tracking-[0.03em] mb-7">
        <span className="bg-gradient-to-r from-white via-violet-100 to-pink-100 bg-clip-text text-transparent">
          {t("s09.titleLine1")}
        </span>
        <br />
        <span className="font-normal italic text-white/90">{t("s09.titleLine2")}</span>
      </h2>
      <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
        <a
          className="group relative inline-flex items-center justify-center gap-2 h-14 px-8 rounded-full text-[15px] font-semibold bg-white text-slate-900 hover:bg-slate-50 shadow-[0_20px_50px_-15px_rgba(255,255,255,0.4)] transition-all"
          href="/login?tab=register"
        >
          {tHome("heroPrimaryCta")}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </a>
        <a
          className="group inline-flex items-center justify-center gap-2 h-14 px-7 rounded-full text-[14px] font-medium text-white bg-white/10 border border-white/25 hover:bg-white/15 hover:border-white/40 backdrop-blur-md transition-all"
          href={path("/pitch")}
        >
          {t("s09.ctaSecondary")}
          <ArrowUpRight className="h-4 w-4 opacity-70" aria-hidden />
        </a>
      </div>
    </div>
  </section>
  );
};
