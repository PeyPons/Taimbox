import type { FC } from "react";
import { Activity, ChartLine, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { landingInlineStyle } from "@/components/landing/below/landingInlineStyle";
import { useHomeLiteralT } from "@/components/landing/below/useHomeLiteralT";
import { i18nAsArray } from "@/lib/i18nReturnObjects";

type PrincipleCard = {
  step: string;
  heading: string;
  body: string;
};

const CARD_ICONS: { icon: LucideIcon; bg: string; color: string }[] = [
  { icon: ChartLine, bg: "rgb(254, 242, 242)", color: "rgb(220, 38, 38)" },
  { icon: Activity, bg: "rgb(245, 243, 255)", color: "rgb(124, 58, 237)" },
  { icon: Sparkles, bg: "rgb(236, 253, 245)", color: "rgb(16, 185, 129)" },
];

const CardVisual1: FC = () => (
  <div className="flex flex-col gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100">
    <div className="flex items-center justify-between">
      <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-slate-400">Ocupación</span>
      <span className="font-mono text-[11px] font-semibold tabular-nums text-slate-700">86%</span>
    </div>
    <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
      <div className="h-full rounded-full bg-amber-400" style={landingInlineStyle("width: 86%;")} />
    </div>
    <div className="flex items-center justify-between">
      <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-slate-400">Devengado</span>
      <span className="font-mono text-[11px] font-semibold tabular-nums text-rose-600">67%</span>
    </div>
    <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
      <div className="h-full rounded-full bg-rose-400" style={landingInlineStyle("width: 67%;")} />
    </div>
    <div className="mt-0.5 text-center font-mono text-[9px] text-rose-600 font-semibold">−19% margen perdido</div>
  </div>
);

const CardVisual2: FC = () => (
  <div className="flex items-center gap-1.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
    {["Plan", "Exec", "Medir", "Prever"].map((step, i) => (
      <div key={step} className="flex items-center gap-1.5">
        <div className={`flex flex-col items-center gap-0.5 ${i === 2 ? "opacity-100" : "opacity-60"}`}>
          <div className="h-5 w-5 rounded-md flex items-center justify-center" style={landingInlineStyle(i === 2 ? "background: rgb(124,58,237); box-shadow: 0 2px 6px rgba(124,58,237,0.3);" : "background: rgb(226,232,240);")}>
            <span className="text-[7px] font-bold" style={landingInlineStyle(i === 2 ? "color: white;" : "color: rgb(100,116,139);")}>{i + 1}</span>
          </div>
          <span className="font-mono text-[7px] text-slate-500">{step}</span>
        </div>
        {i < 3 && <div className="h-px w-2 bg-slate-300 mt-[-8px]" />}
      </div>
    ))}
  </div>
);

const CardVisual3: FC = () => (
  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 font-mono text-[10px] space-y-1.5">
    <div className="flex items-center justify-between">
      <span className="text-slate-500">Horas × Coste/h</span>
      <span className="tabular-nums text-slate-700 font-semibold">24h × 42€</span>
    </div>
    <div className="flex items-center justify-between">
      <span className="text-slate-500">= Coste real</span>
      <span className="tabular-nums text-emerald-600 font-semibold">1.008,00€</span>
    </div>
    <div className="h-px bg-slate-200" />
    <div className="flex items-center justify-between">
      <span className="text-slate-500">Facturado</span>
      <span className="tabular-nums text-slate-700 font-semibold">1.200,00€</span>
    </div>
    <div className="flex items-center justify-between">
      <span className="text-emerald-600 font-semibold">Margen</span>
      <span className="tabular-nums text-emerald-600 font-semibold">+16%</span>
    </div>
  </div>
);

const CARD_VISUALS = [CardVisual1, CardVisual2, CardVisual3];

export const LandingBelowSection02: FC = () => {
  const { t } = useHomeLiteralT();
  const cards = i18nAsArray<PrincipleCard>(t("s02.cards", { returnObjects: true }));

  return (
    <section
      className="relative overflow-hidden"
      style={landingInlineStyle(
        "background: rgb(254, 249, 243); padding-top: clamp(5rem, 10vw, 8rem); padding-bottom: clamp(7rem, 12vw, 10rem);",
      )}
    >
      <div className="relative max-w-6xl mx-auto px-6 lg:px-10">
        <div className="max-w-2xl mb-14 sm:mb-16" style={landingInlineStyle("opacity: 1; transform: none;")}>
          <span className="inline-block font-mono text-[10px] uppercase tracking-[0.24em] text-amber-700 mb-3">
            {t("s02.kicker")}
          </span>
          <h2 className="text-[2rem] sm:text-4xl lg:text-5xl font-semibold text-slate-900 leading-[1.1] -tracking-[0.02em]">
            {t("s02.title")}{" "}
            <span className="italic text-amber-700/90">{t("s02.titleEmphasis")}</span>.
          </h2>
        </div>
        <div className="space-y-4 sm:space-y-5">
          {cards.map((card, i) => {
            const shell = CARD_ICONS[i];
            if (!shell) return null;
            const Icon = shell.icon;
            const Visual = CARD_VISUALS[i] ?? CardVisual1;
            return (
              <div
                key={card.step}
                className="group relative rounded-2xl bg-white border border-slate-100/80 p-6 sm:p-8 lg:p-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center transition-shadow"
                style={landingInlineStyle(
                  "box-shadow: rgba(15, 23, 42, 0.04) 0px 1px 2px, rgba(15, 23, 42, 0.08) 0px 12px 36px -16px; opacity: 1; transform: none;",
                )}
              >
                <div className="lg:col-span-1 flex items-center justify-start lg:justify-center">
                  <div
                    className="relative h-14 w-14 rounded-2xl flex items-center justify-center"
                    style={landingInlineStyle(`background: ${shell.bg};`)}
                  >
                    <Icon className="h-7 w-7" strokeWidth={1.75} style={landingInlineStyle(`color: ${shell.color};`)} />
                  </div>
                </div>
                <div className="lg:col-span-7">
                  <span className="inline-block font-mono text-[10px] uppercase tracking-[0.22em] text-slate-400 mb-2">
                    {card.step}
                  </span>
                  <h3 className="text-2xl sm:text-3xl lg:text-[2.1rem] font-semibold text-slate-900 leading-[1.15] -tracking-[0.018em] mb-3">
                    {card.heading}
                  </h3>
                  <p className="text-[15px] sm:text-[16px] text-slate-600 leading-relaxed max-w-3xl">{card.body}</p>
                </div>
                <div className="lg:col-span-4 hidden lg:block">
                  <Visual />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <svg
        aria-hidden
        className="absolute left-0 right-0 bottom-0 w-full pointer-events-none h-14 sm:h-20"
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
      >
        <path d="M0,80 C320,40 640,120 880,90 C1120,60 1280,90 1440,70 L1440,120 L0,120 Z" fill="#ffffff" />
      </svg>
    </section>
  );
};
