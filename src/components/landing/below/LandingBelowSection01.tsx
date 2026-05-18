import type { FC } from "react";
import { AlertTriangle, BarChart3, CalendarOff, Users } from "lucide-react";

import { LandingBelowSection01Mock } from "@/components/landing/below/LandingBelowSection01Mock";
import { landingInlineStyle } from "@/components/landing/below/landingInlineStyle";
import { LANDING_SECTION } from "@/components/landing/below/landingSectionColors";
import { LandingSectionWave } from "@/components/landing/below/LandingSectionWave";
import { useHomeLiteralT } from "@/components/landing/below/useHomeLiteralT";
import { i18nAsArray } from "@/lib/i18nReturnObjects";

type S01Highlight = {
  title: string;
  description: string;
};

const HIGHLIGHT_ICONS = [Users, CalendarOff, AlertTriangle, BarChart3] as const;

const HIGHLIGHT_STYLES = [
  {
    card: "border-indigo-200/90 bg-gradient-to-br from-indigo-50 via-white to-violet-50/40 shadow-[0_10px_32px_-14px_rgba(79,70,229,0.45)] ring-1 ring-indigo-100",
    bar: "bg-gradient-to-b from-indigo-400 to-violet-500",
    icon: "bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/35",
  },
  {
    card: "border-amber-200/80 bg-gradient-to-br from-amber-50/90 via-white to-orange-50/30 shadow-[0_10px_32px_-14px_rgba(245,158,11,0.3)] ring-1 ring-amber-100",
    bar: "bg-gradient-to-b from-amber-400 to-orange-500",
    icon: "bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30",
  },
  {
    card: "border-red-200/80 bg-gradient-to-br from-red-50/90 via-white to-rose-50/30 shadow-[0_10px_32px_-14px_rgba(239,68,68,0.35)] ring-1 ring-red-100",
    bar: "bg-gradient-to-b from-red-400 to-rose-500",
    icon: "bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/30",
  },
  {
    card: "border-emerald-200/80 bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/30 shadow-[0_10px_32px_-14px_rgba(16,185,129,0.32)] ring-1 ring-emerald-100",
    bar: "bg-gradient-to-b from-emerald-400 to-teal-500",
    icon: "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30",
  },
] as const;

/** Sección 01 (grid unificado). */
export const LandingBelowSection01: FC = () => {
  const { t } = useHomeLiteralT();
  const highlights = i18nAsArray<S01Highlight>(t("s01.highlights", { returnObjects: true }));

  return (
    <section
      className="relative bg-white overflow-hidden"
      style={landingInlineStyle(
        "padding-top: clamp(4.5rem, 8vw, 6.5rem); padding-bottom: clamp(4rem, 8vw, 7rem);",
      )}
    >
      <LandingSectionWave position="top" fill={LANDING_SECTION.white} variant="topIntoWhite" />
      <div
        aria-hidden
        className="absolute top-[35%] left-[8%] h-[400px] w-[400px] rounded-full opacity-25 blur-3xl pointer-events-none"
        style={landingInlineStyle(
          "background: radial-gradient(circle, rgb(199, 210, 254), transparent 70%);",
        )}
      />
      <div
        aria-hidden
        className="absolute top-[55%] right-[6%] h-[380px] w-[380px] rounded-full opacity-20 blur-3xl pointer-events-none"
        style={landingInlineStyle(
          "background: radial-gradient(circle, rgb(251, 207, 232), transparent 70%);",
        )}
      />
      <div className="relative max-w-6xl mx-auto px-6 lg:px-10 text-center">
        <div style={landingInlineStyle("opacity: 1; transform: none;")}>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.1] tracking-tight mb-4 max-w-3xl mx-auto">
            {t("s01.titlePrefix")}{" "}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
              {t("s01.titleHighlight")}
            </span>
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
            {t("s01.subtitle")}
          </p>
        </div>
        <div
          className="mt-8 sm:mt-10 max-w-4xl mx-auto"
          style={landingInlineStyle("opacity: 1; transform: none;")}
        >
          <LandingBelowSection01Mock />
        </div>
        <ul className="mt-10 sm:mt-12 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto text-left list-none p-0 m-0">
          {highlights.map((item, i) => {
            const Icon = HIGHLIGHT_ICONS[i];
            const style = HIGHLIGHT_STYLES[i] ?? HIGHLIGHT_STYLES[0];
            if (!Icon) return null;
            return (
              <li
                key={item.title}
                className={`relative flex items-center gap-3.5 overflow-hidden rounded-2xl border pl-5 pr-4 py-4 transition-shadow hover:shadow-xl ${style.card}`}
              >
                <span
                  className={`absolute left-0 top-1/2 h-10 w-1 -translate-y-1/2 rounded-full ${style.bar}`}
                  aria-hidden
                />
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${style.icon}`}
                >
                  <Icon className="h-[18px] w-[18px]" strokeWidth={2.25} aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold text-slate-900 leading-snug tracking-tight">
                    {item.title}
                  </p>
                  <p className="text-[13px] text-slate-600 leading-relaxed mt-1.5">{item.description}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
      <LandingSectionWave position="bottom" fill={LANDING_SECTION.cream} variant="bottomIntoCream" />
    </section>
  );
};
