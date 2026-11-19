import type { FC } from "react";

import { LandingBelowSection01Mock } from "@/components/landing/below/LandingBelowSection01Mock";
import { landingInlineStyle } from "@/components/landing/below/landingInlineStyle";
import { useHomeLiteralT } from "@/components/landing/below/useHomeLiteralT";
import { i18nAsArray } from "@/lib/i18nReturnObjects";

type S01Highlight = {
  title: string;
  description: string;
};

/** Sección 01 (grid unificado). */
export const LandingBelowSection01: FC = () => {
  const { t } = useHomeLiteralT();
  const highlights = i18nAsArray<S01Highlight>(t("s01.highlights", { returnObjects: true }));

  return (
    <section
      className="relative overflow-hidden"
      style={landingInlineStyle(
        "background: #14123B; padding-top: clamp(4.5rem, 8vw, 6.5rem); padding-bottom: clamp(4rem, 8vw, 7rem);",
      )}
    >
      <div className="relative max-w-6xl mx-auto px-6 lg:px-10 text-center">
        <div style={landingInlineStyle("opacity: 1; transform: none;")}>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white leading-[1.05] tracking-[-0.035em] mb-4 max-w-3xl mx-auto">
            {t("s01.titlePrefix")}{" "}
            <span className="text-[#C4B5FD]">
              {t("s01.titleHighlight")}
            </span>
          </h2>
          <p className="text-base sm:text-lg text-[#D4CEF0] leading-relaxed max-w-2xl mx-auto">
            {t("s01.subtitle")}
          </p>
        </div>
        <div
          className="mt-8 sm:mt-10 max-w-4xl mx-auto"
          style={landingInlineStyle("opacity: 1; transform: none;")}
        >
          <LandingBelowSection01Mock />
        </div>
        <ol className="mt-10 sm:mt-12 max-w-3xl mx-auto text-left list-none p-0 m-0 border-t border-[rgba(196,181,253,0.2)]">
          {highlights.map((item, i) => (
            <li
              key={item.title}
              className="grid grid-cols-[2.5rem_1fr] gap-3 border-b border-[rgba(196,181,253,0.16)] py-4"
            >
              <span className="font-mono text-[12px] text-[#C4B5FD] pt-0.5">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0">
                <p className="text-[15px] font-semibold text-white leading-snug tracking-tight">
                  {item.title}
                </p>
                <p className="text-[13px] text-[#D4CEF0] leading-relaxed mt-1.5">{item.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
};
