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

const INTEGRATION_GRADIENTS = [
  "linear-gradient(to right, transparent, rgb(251, 188, 4), transparent)",
  "linear-gradient(to right, transparent, rgb(0, 100, 224), transparent)",
  "linear-gradient(to right, transparent, rgb(6, 182, 212), transparent)",
  "linear-gradient(to right, transparent, rgb(16, 185, 129), transparent)",
  "linear-gradient(to right, transparent, rgb(139, 92, 246), transparent)",
  "linear-gradient(to right, transparent, rgb(245, 158, 11), transparent)",
] as const;

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
  risk: "text-[12px] text-amber-700",
  under: "text-[12px] text-sky-700",
  over: "text-[12px] text-rose-700",
};

function IntegrationIcon({ index }: { index: number }) {
  if (index === 0) {
    return (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M7.5 19.6 13.4 9.4a3 3 0 1 1 5.2 3l-5.9 10.2a3 3 0 1 1-5.2-3Z"
          fill="#FBBC04"
        />
        <circle cx="5" cy="18.5" r="3" fill="#34A853" />
        <path
          d="m11.6 4.4-5.9 10.2a3 3 0 1 0 5.2 3l5.9-10.2a3 3 0 1 0-5.2-3Z"
          fill="#4285F4"
          opacity={0.95}
        />
      </svg>
    );
  }
  if (index === 1) {
    return (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M3 12.5c0-3 2-6 5-6 2.2 0 3.6 1.5 5 3.5 1.4-2 2.8-3.5 5-3.5 3 0 5 3 5 6s-2 6-5 6c-1.5 0-2.6-.8-3.7-2-.5-.6-1-1.2-1.3-1.7-.3.5-.8 1.1-1.3 1.7-1.1 1.2-2.2 2-3.7 2-3 0-5-3-5-6Z"
          stroke="#0064E0"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  if (index === 2) {
    return (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="m9 7-5 5 5 5M15 7l5 5-5 5"
          stroke="#06b6d4"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (index === 3) {
    return (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="13" r="7.5" stroke="#10b981" strokeWidth="1.6" />
        <path
          d="M12 9v4l2.5 2"
          stroke="#10b981"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M10 3h4M12 3v2.5"
          stroke="#10b981"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  if (index === 4) {
    return (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect
          x="3"
          y="5"
          width="18"
          height="15"
          rx="2"
          stroke="#8b5cf6"
          strokeWidth="1.6"
        />
        <path
          d="M3 10h18M8 3v4M16 3v4"
          stroke="#8b5cf6"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <path
          d="m9 14 2 2 4-4"
          stroke="#10b981"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 4v11m0 0 4-4m-4 4-4-4"
        stroke="#f59e0b"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 16v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3"
        stroke="#f59e0b"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

const INTEGRATION_ICON_BG = [
  "rgba(251, 188, 4, 0.08)",
  "rgba(0, 100, 224, 0.08)",
  "rgba(6, 182, 212, 0.08)",
  "rgba(16, 185, 129, 0.08)",
  "rgba(139, 92, 246, 0.08)",
  "rgba(245, 158, 11, 0.08)",
] as const;

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
      className="relative bg-white overflow-hidden"
      style={landingInlineStyle(
        "padding-top: clamp(5rem, 10vw, 8rem); padding-bottom: clamp(7rem, 12vw, 10rem);",
      )}
    >
      <div className="relative max-w-6xl mx-auto px-6 lg:px-10">
        <div
          className="max-w-2xl mb-12 sm:mb-14 mx-auto text-center"
          style={landingInlineStyle("opacity: 1; transform: none;")}
        >
          <span className="inline-block font-mono text-[10px] uppercase tracking-[0.24em] text-slate-400 mb-3">
            {t("s05.kicker")}
          </span>
          <h2 className="text-[2rem] sm:text-4xl lg:text-5xl font-semibold text-slate-900 leading-[1.1] -tracking-[0.02em] mb-4">
            {t("s05.title")}{" "}
            <span className="text-cyan-600">{t("s05.titleHighlight")}</span>.
          </h2>
          <p className="text-[15px] sm:text-[16px] text-slate-500 leading-relaxed">
            {t("s05.subtitle")}
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {integrations.map((card, i) => (
            <div
              key={card.title}
              className="group relative rounded-2xl bg-white border border-slate-100 p-5 sm:p-6 transition-shadow"
              style={landingInlineStyle(
                "box-shadow: rgba(15, 23, 42, 0.04) 0px 1px 2px, rgba(15, 23, 42, 0.08) 0px 8px 24px -14px; opacity: 1; transform: none;",
              )}
            >
              <div
                aria-hidden
                className="absolute inset-x-0 top-0 h-px opacity-0 group-hover:opacity-100 transition-opacity"
                style={landingInlineStyle(
                  `background: ${INTEGRATION_GRADIENTS[i] ?? INTEGRATION_GRADIENTS[0]};`,
                )}
              />
              <div
                className="h-10 w-10 rounded-xl flex items-center justify-center mb-3"
                style={landingInlineStyle(
                  `background: ${INTEGRATION_ICON_BG[i] ?? INTEGRATION_ICON_BG[0]};`,
                )}
              >
                <IntegrationIcon index={i} />
              </div>
              <div className="text-[14px] font-semibold text-slate-900 mb-1">
                {card.title}
              </div>
              <p className="text-[12px] text-slate-500 leading-snug">
                {card.desc}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-16 sm:mt-20 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-5 order-2 lg:order-1">
            <span className="inline-block font-mono text-[10px] uppercase tracking-[0.22em] text-cyan-700 mb-3">
              {t("s05.ppcKicker")}
            </span>
            <h3 className="text-2xl sm:text-3xl font-semibold text-slate-900 leading-[1.15] -tracking-[0.018em] mb-4">
              {t("s05.ppcTitle")}{" "}
              <span className="italic text-cyan-700">
                {t("s05.ppcTitleHighlight")}
              </span>
              .
            </h3>
            <p className="text-[14px] sm:text-[15px] text-slate-600 leading-relaxed mb-5">
              {t("s05.ppcBody")}
            </p>
            <ul className="space-y-2.5 text-[13.5px] text-slate-700">
              <li className="flex items-start gap-2">
                <Check
                  className="h-4 w-4 mt-0.5 text-emerald-600 shrink-0"
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
                    className="h-4 w-4 mt-0.5 text-emerald-600 shrink-0"
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
              style={landingInlineStyle(
                "perspective: 1400px; opacity: 1; transform: none;",
              )}
            >
              <div
                className="relative rounded-2xl bg-white border border-slate-200/80 overflow-hidden"
                style={landingInlineStyle(
                  "transform: rotateY(-5deg) rotateX(2deg); transform-style: preserve-3d; box-shadow: rgba(6, 182, 212, 0.3) 0px 36px 80px -20px, rgba(15, 23, 42, 0.18) 0px 22px 42px -18px;",
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
            className="group inline-flex items-center gap-1.5 text-[14px] font-medium text-slate-700 hover:text-slate-900 border-b border-slate-300 hover:border-slate-700 pb-0.5 transition-colors"
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
