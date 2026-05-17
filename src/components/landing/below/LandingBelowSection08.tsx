import type { FC } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowRight, ArrowUpRight, Plus } from "lucide-react";

import { landingInlineStyle } from "@/components/landing/below/landingInlineStyle";
import { useHomeLiteralT } from "@/components/landing/below/useHomeLiteralT";
import { i18nAsArray } from "@/lib/i18nReturnObjects";

type FaqItem = { question: string; answer: string };

/** FAQ (acordeón; textos desde `home.faqItems` en i18n). */
export const LandingBelowSection08: FC = () => {
  const { t, path } = useHomeLiteralT();
  const { t: tHome } = useTranslation("landing", { keyPrefix: "home" });
  const faqItems = i18nAsArray<FaqItem>(tHome("faqItems", { returnObjects: true }));
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section
      className="relative overflow-hidden"
      style={landingInlineStyle("background: radial-gradient(70% 45% at 50% 0%, rgba(196,181,253,0.15), transparent 60%), rgb(255,255,255); padding-top: clamp(5rem, 10vw, 8rem); padding-bottom: clamp(7rem, 12vw, 10rem);")}
    >
      <div className="relative max-w-3xl mx-auto px-6 lg:px-10">
        <div className="text-center mb-10 sm:mb-12">
          <span className="inline-block font-mono text-[10px] uppercase tracking-[0.24em] text-slate-400 mb-3">
            {t("s08.kicker")}
          </span>
          <h2 className="text-[2rem] sm:text-4xl lg:text-5xl font-semibold text-slate-900 leading-[1.1] -tracking-[0.02em]">
            {t("s08.title")} <span className="italic text-violet-600">{t("s08.titleHighlight")}</span>.
          </h2>
        </div>
        <div className="rounded-2xl border border-slate-200/60 bg-white overflow-hidden" style={landingInlineStyle("box-shadow: rgba(15,23,42,0.04) 0px 1px 2px, rgba(15,23,42,0.06) 0px 12px 36px -16px;")}>
          {faqItems.map((item, i) => {
            const open = openIndex === i;
            return (
              <div key={item.question} className="border-b border-slate-100 last:border-b-0">
                <button
                  type="button"
                  className="group flex w-full items-center justify-between gap-4 px-5 sm:px-7 py-5 text-left hover:bg-slate-50/60 transition-colors"
                  aria-expanded={open}
                  onClick={() => setOpenIndex(open ? -1 : i)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="shrink-0 font-mono text-[10px] tabular-nums text-slate-300 font-semibold">{String(i + 1).padStart(2, "0")}</span>
                    <span className="text-[15px] sm:text-[16px] font-medium text-slate-800 leading-snug">{item.question}</span>
                  </div>
                  <span
                    className="shrink-0 inline-flex items-center justify-center h-7 w-7 rounded-full border text-slate-500 transition-all duration-300"
                    style={landingInlineStyle(open ? "transform: rotate(45deg); border-color: rgb(139,92,246); color: rgb(139,92,246); background: rgba(139,92,246,0.06);" : "transform: none; border-color: rgb(226,232,240);")}
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden />
                  </span>
                </button>
                {open ? (
                  <div className="px-5 sm:px-7 pb-6 pl-[52px] sm:pl-[68px] text-[14px] leading-relaxed text-slate-600">{item.answer}</div>
                ) : null}
              </div>
            );
          })}
        </div>
        <div className="mt-12 flex flex-col sm:flex-row gap-3 justify-center items-center">
          <a
            className="group inline-flex items-center justify-center gap-2 h-12 px-7 rounded-full text-[14px] font-medium bg-slate-900 text-white hover:bg-slate-800 transition-colors"
            href="/login?tab=register"
          >
            {t("s08.ctaPrimary")}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </a>
          <a
            className="group inline-flex items-center justify-center gap-2 h-12 px-6 rounded-full text-[14px] font-medium text-slate-900 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all"
            href={path("/contacto")}
          >
            {t("s08.ctaSales")}
            <ArrowUpRight className="h-4 w-4 opacity-60" aria-hidden />
          </a>
        </div>
      </div>
      <svg
        aria-hidden
        className="absolute left-0 right-0 bottom-0 w-full pointer-events-none h-20 sm:h-28"
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
      >
        <path d="M0,100 C360,20 1080,20 1440,100 L1440,120 L0,120 Z" fill="#4c1d95" />
      </svg>
    </section>
  );
};
