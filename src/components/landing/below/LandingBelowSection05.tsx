import type { FC } from "react";
import { Check, TrendingUp } from "lucide-react";

import { landingInlineStyle } from "@/components/landing/below/landingInlineStyle";
import { useHomeLiteralT } from "@/components/landing/below/useHomeLiteralT";
import { i18nAsArray } from "@/lib/i18nReturnObjects";

type IntegrationCard = { title: string; desc: string };
type CampaignRow = {
  platform: string;
  name: string;
  status: string;
  spend: string;
  roas: string;
  cpl: string;
  widthPct: number;
  variant: string;
};

const CAMPAIGN_SHELL: Record<
  string,
  { border: string; bg: string; bar: string; badge: string }
> = {
  ok: {
    border: "rgba(16, 185, 129, 0.145)",
    bg: "rgba(236, 253, 245, 0.5)",
    bar: "rgb(16, 185, 129)",
    badge: "rgb(16, 185, 129)",
  },
  under: {
    border: "rgba(14, 165, 233, 0.145)",
    bg: "rgba(240, 249, 255, 0.5)",
    bar: "rgb(14, 165, 233)",
    badge: "rgb(14, 165, 233)",
  },
  over: {
    border: "rgba(239, 68, 68, 0.145)",
    bg: "rgba(254, 242, 242, 0.5)",
    bar: "rgb(239, 68, 68)",
    badge: "rgb(239, 68, 68)",
  },
};

const STATUS_TEXT_CLASS: Record<string, string> = {
  ok: "text-[12px]",
  risk: "text-[12px] text-amber-200",
  under: "text-[12px] text-sky-200",
  over: "text-[12px] text-rose-200",
};

/** Sección 05 (integraciones / PPC). */
export const LandingBelowSection05: FC = () => {
  const { t, path } = useHomeLiteralT();
  const integrations = i18nAsArray<IntegrationCard>(
    t("s05.integrations", { returnObjects: true }),
  );
  const campaigns = i18nAsArray<CampaignRow>(
    t("s05.campaigns", { returnObjects: true }),
  );
  const ppcBullets = i18nAsArray<string>(
    t("s05.ppcBullets", { returnObjects: true }),
  );
  const statuses = t("s05.ppcBulletStatuses", {
    returnObjects: true,
  }) as Record<string, string>;

  return (
    <section
      className="relative overflow-hidden"
      style={landingInlineStyle(
        "background: #14123B; padding-top: clamp(2.5rem, 4.5vw, 3.5rem); padding-bottom: clamp(2.25rem, 4vw, 3.25rem);",
      )}
    >
      <div className="relative max-w-6xl mx-auto px-6 lg:px-10">
        <div className="max-w-2xl mb-12 sm:mb-14">
          <span className="inline-block font-mono text-[10px] uppercase tracking-[0.24em] text-[#C4B5FD] mb-3">
            {t("s05.kicker")}
          </span>
          <h2 className="text-[2rem] sm:text-4xl lg:text-5xl font-semibold text-white leading-[1.1] tracking-[-0.03em] mb-4">
            {t("s05.title")}{" "}
            <span className="text-[#C4B5FD]">{t("s05.titleHighlight")}</span>.
          </h2>
          <p className="text-[15px] sm:text-[16px] text-[#D4CEF0] leading-relaxed">
            {t("s05.subtitle")}
          </p>
        </div>
        <div className="rounded-2xl border border-[#E4DDD0] bg-[#F7F4EC] px-5 sm:px-8">
          {integrations.map((card) => (
            <div
              key={card.title}
              className="grid gap-1 border-b border-[#E4DDD0] py-4 last:border-b-0 sm:grid-cols-[11rem_1fr] sm:gap-6 sm:items-baseline"
            >
              <div className="text-[14px] font-semibold text-[#14123B]">
                {card.title}
              </div>
              <p className="text-[14px] text-[#3C3858] leading-snug">
                {card.desc}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-5 order-2 lg:order-1">
            <span className="inline-block font-mono text-[10px] uppercase tracking-[0.22em] text-[#C4B5FD] mb-3">
              {t("s05.ppcKicker")}
            </span>
            <h3 className="text-2xl sm:text-3xl font-semibold text-white leading-[1.15] tracking-[-0.02em] mb-4">
              {t("s05.ppcTitle")}{" "}
              <span className="italic text-[#C4B5FD]">
                {t("s05.ppcTitleHighlight")}
              </span>
              .
            </h3>
            <p className="text-[14px] sm:text-[15px] text-[#D4CEF0] leading-relaxed mb-5">
              {t("s05.ppcBody")}
            </p>
            <ul className="space-y-2.5 text-[13.5px] text-[#E7E2FB]">
              <li className="flex items-start gap-2">
                <Check
                  className="h-4 w-4 mt-0.5 text-emerald-300 shrink-0"
                  strokeWidth={2.5}
                  aria-hidden
                />
                <span>
                  {t("s05.ppcBullet1Prefix")}{" "}
                  <span className="font-mono text-[12px]">{statuses.ok}</span> ·{" "}
                  <span className={`font-mono ${STATUS_TEXT_CLASS.risk}`}>
                    {statuses.risk}
                  </span>{" "}
                  ·{" "}
                  <span className={`font-mono ${STATUS_TEXT_CLASS.under}`}>
                    {statuses.under}
                  </span>{" "}
                  ·{" "}
                  <span className={`font-mono ${STATUS_TEXT_CLASS.over}`}>
                    {statuses.over}
                  </span>{" "}
                  {t("s05.ppcBullet1Suffix")}
                </span>
              </li>
              {ppcBullets.slice(1).map((bullet) => (
                <li key={bullet} className="flex items-start gap-2">
                  <Check
                    className="h-4 w-4 mt-0.5 text-emerald-300 shrink-0"
                    strokeWidth={2.5}
                    aria-hidden
                  />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:col-span-7 order-1 lg:order-2 flex items-center justify-center">
            <div
              className="relative w-full mx-auto max-w-xl"
              style={landingInlineStyle("opacity: 1;")}
            >
              <div
                className="relative rounded-2xl bg-white border border-slate-200/80 overflow-hidden"
                style={landingInlineStyle(
                  "box-shadow: 0 24px 50px -28px rgba(0, 0, 0, 0.55);",
                )}
              >
                <div className="flex">
                  <div className="hidden sm:flex w-10 bg-slate-900 flex-col items-center py-2.5 gap-2 shrink-0 border-r border-slate-800">
                    <div className="h-5 w-5 rounded-md bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center mb-0.5" style={landingInlineStyle("box-shadow: rgba(124,58,237,0.35) 0px 3px 8px -2px;")}>
                      <span className="text-white text-[7px] font-bold">T</span>
                    </div>
                    <div className="h-5 w-5 rounded-md flex items-center justify-center text-slate-500"><svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg></div>
                    <div className="h-5 w-5 rounded-md flex items-center justify-center text-slate-500"><svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg></div>
                    <div className="h-5 w-5 rounded-md bg-slate-800 flex items-center justify-center text-white"><svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></svg></div>
                  </div>
                  <div className="flex-1 min-w-0 relative p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">
                        {t("s05.monitorKicker")}
                      </div>
                      <div className="text-[14px] font-semibold text-slate-900 mt-0.5">
                        {t("s05.monitorMeta")}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span
                        className="inline-flex items-center justify-center rounded-md"
                        title={t("s05.googleAdsTitle")}
                        style={landingInlineStyle(
                          "background: rgb(254, 243, 199); width: 20px; height: 20px;",
                        )}
                      >
                        <span className="font-mono text-[9px] font-bold text-amber-700">
                          G
                        </span>
                      </span>
                      <span
                        className="inline-flex items-center justify-center rounded-md"
                        title={t("s05.metaAdsTitle")}
                        style={landingInlineStyle(
                          "background: rgb(219, 234, 254); width: 20px; height: 20px;",
                        )}
                      >
                        <span className="font-mono text-[9px] font-bold text-blue-700">
                          M
                        </span>
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {campaigns.map((row) => {
                      const shell =
                        CAMPAIGN_SHELL[row.variant] ?? CAMPAIGN_SHELL.ok;
                      const isGoogle = row.platform === "google";
                      return (
                        <div
                          key={row.name}
                          className="rounded-lg p-2.5 border"
                          style={landingInlineStyle(
                            `border-color: ${shell.border}; background: ${shell.bg}; opacity: 1; transform: none;`,
                          )}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span
                                className="inline-flex items-center justify-center rounded-md"
                                title={
                                  isGoogle
                                    ? t("s05.googleAdsTitle")
                                    : t("s05.metaAdsTitle")
                                }
                                style={landingInlineStyle(
                                  isGoogle
                                    ? "background: rgb(254, 243, 199); width: 16px; height: 16px;"
                                    : "background: rgb(219, 234, 254); width: 16px; height: 16px;",
                                )}
                              >
                                <span
                                  className={`font-mono text-[9px] font-bold ${isGoogle ? "text-amber-700" : "text-blue-700"}`}
                                >
                                  {isGoogle ? "G" : "M"}
                                </span>
                              </span>
                              <span className="text-[12px] font-semibold text-slate-800 truncate">
                                {row.name}
                              </span>
                            </div>
                            <span
                              className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] px-1.5 py-0.5 rounded"
                              style={landingInlineStyle(
                                `background: ${shell.badge}; color: white;`,
                              )}
                            >
                              {row.status}
                            </span>
                          </div>
                          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 items-center">
                            <div className="relative h-1.5 rounded-full bg-slate-200/60 overflow-visible">
                              <div
                                className="h-full rounded-full"
                                style={landingInlineStyle(
                                  `background: ${shell.bar}; width: ${row.widthPct}%;`,
                                )}
                              />
                              {row.variant === "over" ? (
                                <span
                                  className="absolute top-0 bottom-0 w-px"
                                  style={landingInlineStyle(
                                    "left: 100%; background: rgba(15, 23, 42, 0.3);",
                                  )}
                                />
                              ) : null}
                            </div>
                            <span className="font-mono text-[10px] tabular-nums text-slate-700 whitespace-nowrap">
                              {row.spend}
                            </span>
                            <span className="font-mono text-[10px] tabular-nums text-slate-500 whitespace-nowrap">
                              {row.roas}
                            </span>
                            <span className="font-mono text-[10px] tabular-nums text-slate-500 whitespace-nowrap">
                              {row.cpl}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-slate-400">
                      {t("s05.forecastLabel")}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700">
                      <TrendingUp className="h-3 w-3" aria-hidden />
                      {t("s05.forecastAlert")}
                    </span>
                  </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-12 text-center">
          <a
            className="group inline-flex items-center gap-1.5 text-[14px] font-medium text-[#C4B5FD] hover:text-white border-b border-[rgba(196,181,253,0.4)] hover:border-white pb-0.5 transition-colors"
            href={path(t("s05.integrationsHref"))}
          >
            {t("s05.integrationsLink")}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-arrow-up-right h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              aria-hidden
            >
              <path d="M7 7h10v10" />
              <path d="M7 17 17 7" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
};
