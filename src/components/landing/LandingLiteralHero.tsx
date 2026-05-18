import { forwardRef } from "react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";

import { landingInlineStyle } from "@/components/landing/below/landingInlineStyle";
import { useHomeLiteralT } from "@/components/landing/below/useHomeLiteralT";
import { i18nAsArray } from "@/lib/i18nReturnObjects";

type HeroTickerItem = {
  time: string;
  name: string;
  tone: string;
  verb: string;
  detail: string;
};

function HeroTickerEntry({
  item,
  toneClass,
}: {
  item: HeroTickerItem;
  toneClass: string;
}) {
  return (
    <div className="flex items-center gap-3 shrink-0">
      <span className="text-[11px] font-mono text-indigo-200/70 tabular-nums">
        {item.time}
      </span>
      <span className={`text-[12.5px] font-semibold ${toneClass}`}>
        {item.name}
      </span>
      <span className="text-[12.5px] text-white/85">{item.verb}</span>
      <span className="text-[12.5px] text-indigo-200/75">{item.detail}</span>
    </div>
  );
}

function HeroTickerTrack({
  items,
  toneClasses,
  ariaHidden,
}: {
  items: HeroTickerItem[];
  toneClasses: Record<string, string>;
  ariaHidden?: boolean;
}) {
  return (
    <div
      className="flex items-center gap-10 pr-10 shrink-0"
      aria-hidden={ariaHidden}
    >
      {items.map((item) => (
        <HeroTickerEntry
          key={`${item.time}-${item.name}-${item.verb}`}
          item={item}
          toneClass={toneClasses[item.tone] ?? "text-indigo-300"}
        />
      ))}
    </div>
  );
}

export type LandingLiteralHeroProps = {
  reduceMotion?: boolean | null;
};

const LANDING_HERO_CSS = `@keyframes hero-orbit {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes hero-orbit-reverse {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }

@keyframes hero-pulse-bar {
          0%, 100% { transform: scaleY(0.35); }
          50%      { transform: scaleY(1); }
        }`;

/** Hero literal de la home (HTML del dump → TSX). Ticker/orbita: `useLandingLiteralDomMotion`. */
export const LandingLiteralHero = forwardRef<
  HTMLElement,
  LandingLiteralHeroProps
>(function LandingLiteralHero({ reduceMotion = null }, ref) {
  const prefersReduced = reduceMotion === true;
  const { t } = useTranslation("landing", { keyPrefix: "home" });
  const { t: tLit, path } = useHomeLiteralT();
  const tickerItems = i18nAsArray<HeroTickerItem>(
    tLit("hero.ticker", { returnObjects: true }),
  );
  const toneClasses = tLit("hero.tickerToneClass", {
    returnObjects: true,
  }) as Record<string, string>;

  return (
    <section
      ref={ref}
      className="relative overflow-hidden min-h-[calc(100vh-3.5rem)] flex flex-col"
      style={landingInlineStyle(
        "background: radial-gradient(80% 60% at 15% 20%, rgba(99, 102, 241, 0.22), transparent 60%), radial-gradient(70% 50% at 90% 70%, rgba(168, 85, 247, 0.14), transparent 60%);",
      )}
    >
      <style dangerouslySetInnerHTML={{ __html: LANDING_HERO_CSS }} />
      <motion.div
        className="relative z-10 flex-1 grid lg:grid-cols-12 gap-8 lg:gap-12 px-6 sm:px-10 lg:px-16 pt-8 lg:pt-14 pb-10 max-w-[1500px] w-full mx-auto items-center"
        initial={prefersReduced ? false : { opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.52, ease: [0.22, 1, 0.36, 1] }}
      >
        <div
          className="lg:col-span-7 text-left"
          style={landingInlineStyle(`opacity: 1; transform: none;`)}
        >
          <div
            className="inline-flex items-center gap-2.5 mb-8 px-3 py-1.5 rounded-full bg-indigo-500/15 border border-indigo-400/30"
            style={landingInlineStyle(`opacity: 1; transform: none;`)}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              aria-hidden="true"
            >
              <circle
                cx="7"
                cy="7"
                r="5.5"
                stroke="rgba(15,23,42,0.30)"
                strokeWidth="1"
                fill="none"
              ></circle>
              <circle
                cx="7"
                cy="7"
                r="2.5"
                stroke="rgba(15,23,42,0.15)"
                strokeWidth="0.75"
                fill="none"
                strokeDasharray="1 1.5"
              ></circle>
              <g
                style={landingInlineStyle(
                  `transform-origin: 50% 50%; transform: rotate(112.92deg); transform-box: fill-box;`,
                )}
              >
                <line
                  x1="7"
                  y1="7"
                  x2="7"
                  y2="2"
                  stroke="#7c3aed"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                ></line>
                <circle cx="7" cy="2" r="1.2" fill="#a855f7"></circle>
              </g>
              <circle cx="7" cy="7" r="1" fill="rgba(124,58,237,0.95)"></circle>
            </svg>
            <span className="text-[11.5px] font-medium text-indigo-200">
              {t("heroBadge")}
            </span>
            <span className="h-3 w-px bg-white/15"></span>
            <a
              className="text-[11.5px] font-medium text-indigo-300 hover:text-white inline-flex items-center gap-1 transition-colors"
              href={path("/precios")}
            >
              {t("heroPricingLink")}
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
                className="lucide lucide-arrow-right h-3 w-3"
              >
                <path d="M5 12h14"></path>
                <path d="m12 5 7 7-7 7"></path>
              </svg>
            </a>
          </div>
          <h1 className="text-[2.5rem] sm:text-[3.5rem] md:text-[4.5rem] lg:text-[5.25rem] xl:text-[6rem] font-black text-white leading-[1.1] tracking-tight">
            <span
              className="block"
              style={landingInlineStyle(
                `opacity: 1; filter: blur(0px); transform: none;`,
              )}
            >
              {t("heroTitleLine1")}
            </span>{" "}
            <span
              className="block relative"
              style={landingInlineStyle(
                `opacity: 1; filter: blur(0px); transform: none;`,
              )}
            >
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
                {t("heroTitleHighlight")}
              </span>
            </span>
          </h1>
          <p
            className="mt-7 max-w-lg text-[15px] sm:text-[17px] leading-relaxed text-indigo-100/90"
            style={landingInlineStyle(`opacity: 1; transform: none;`)}
          >
            {t("heroSubtitleLine1")} {t("heroSubtitleLine2Prefix")}{" "}
            <span className="text-white font-semibold">
              {t("heroSubtitleLine2When")}
            </span>{" "}
            {t("heroSubtitleLine2And")}{" "}
            <span className="text-white font-semibold">
              {t("heroSubtitleLine2Why")}
            </span>
            .
          </p>
          <div
            className="mt-9 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center"
            style={landingInlineStyle(`opacity: 1; transform: none;`)}
          >
            <a className="group" href={path("/login?tab=register")}>
              <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 w-full sm:w-auto h-12 px-7 rounded-full bg-white text-indigo-950 hover:bg-indigo-50 text-[14px] font-medium shadow-[0_8px_24px_-8px_rgba(0,0,0,0.35)] transition-colors">
                {t("heroPrimaryCta")}
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
                  className="lucide lucide-arrow-right ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-0.5"
                >
                  <path d="M5 12h14"></path>
                  <path d="m12 5 7 7-7 7"></path>
                </svg>
              </button>
            </a>
            <a className="group" href={path("/pitch")}>
              <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 w-full sm:w-auto h-12 px-6 rounded-full text-[14px] font-medium text-white bg-white/5 border border-white/20 hover:border-white/35 hover:bg-white/10 transition-colors">
                {t("heroSecondaryCta")}
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
                  className="lucide lucide-arrow-up-right ml-1.5 h-4 w-4 opacity-60"
                >
                  <path d="M7 7h10v10"></path>
                  <path d="M7 17 17 7"></path>
                </svg>
              </button>
            </a>
          </div>
          <div
            className="mt-10 flex items-center gap-4"
            style={landingInlineStyle(`opacity: 1; transform: none;`)}
          >
            <div className="flex -space-x-2 shrink-0">
              <div
                className="relative w-9 h-9 rounded-full ring-2 ring-white flex items-center justify-center text-[10px] font-bold text-white"
                title="María"
                style={landingInlineStyle(`background: rgb(168, 85, 247);`)}
              >
                MG
              </div>
              <div
                className="relative w-9 h-9 rounded-full ring-2 ring-white flex items-center justify-center text-[10px] font-bold text-white"
                title="Carlos"
                style={landingInlineStyle(`background: rgb(245, 158, 11);`)}
              >
                CR
              </div>
              <div
                className="relative w-9 h-9 rounded-full ring-2 ring-white flex items-center justify-center text-[10px] font-bold text-white"
                title="Ana"
                style={landingInlineStyle(`background: rgb(139, 92, 246);`)}
              >
                AM
              </div>
              <div
                className="relative w-9 h-9 rounded-full ring-2 ring-white flex items-center justify-center text-[10px] font-bold text-white"
                title="Luis"
                style={landingInlineStyle(`background: rgb(8, 145, 178);`)}
              >
                LF
              </div>
            </div>
            <div className="relative h-11 flex-1 min-w-0 overflow-hidden" data-hero-status-ticker>
              {[
                { value: "0", text: tLit("hero.overloads"), valueClass: "text-emerald-400" },
                { value: "100%", text: tLit("hero.statusHoursTracked"), valueClass: "text-indigo-300" },
                { value: "3", text: tLit("hero.statusRedistributions"), valueClass: "text-violet-300" },
                { value: "93%", text: tLit("hero.statusCapacity"), valueClass: "text-emerald-400" },
                { value: "12", text: tLit("hero.statusBudget"), valueClass: "text-cyan-300" },
              ].map((item, i) => (
                <div
                  key={i}
                  className="absolute inset-0 flex flex-col justify-center"
                  data-hero-status-item
                >
                  <div className="flex items-baseline gap-1.5">
                    <span
                      className={`text-[15px] font-bold tabular-nums -tracking-[0.01em] ${item.valueClass}`}
                    >
                      {item.value}
                    </span>
                    <span className="text-[13px] text-white/90 font-medium truncate">
                      {item.text}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="relative flex h-1 w-1">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/70" />
                      <span className="relative inline-flex h-1 w-1 rounded-full bg-emerald-400" />
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.16em] font-mono text-indigo-200/70">
                      {tLit("hero.live")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div
          className="lg:col-span-5 relative flex justify-center items-center mt-8 lg:mt-0 w-full"
          style={landingInlineStyle(`opacity: 1; transform: none;`)}
        >
          <div className="relative w-full max-w-[460px] aspect-square mx-auto">
            <div
              aria-hidden="true"
              className="absolute inset-0 rounded-full border border-indigo-400/25 pointer-events-none"
              style={landingInlineStyle(
                `transform: scale(1.4298); transform-origin: center center;`,
              )}
            ></div>
            <div
              aria-hidden="true"
              className="absolute inset-0 rounded-full border border-indigo-400/25 pointer-events-none"
              style={landingInlineStyle(
                `transform: scale(1.25201); transform-origin: center center;`,
              )}
            ></div>
            <div
              aria-hidden="true"
              className="absolute inset-0 rounded-full border border-indigo-400/25 pointer-events-none"
              style={landingInlineStyle(
                `transform: scale(1.14988); transform-origin: center center;`,
              )}
            ></div>
            <div
              aria-hidden="true"
              className="absolute inset-[5%] rounded-full blur-3xl pointer-events-none"
              style={landingInlineStyle(
                "background: radial-gradient(circle, rgba(99, 102, 241, 0.45), rgba(168, 85, 247, 0.28) 55%, transparent 80%); transform: scale(1.01637);",
              )}
            ></div>
            <svg
              viewBox="-150 -150 300 300"
              className="absolute inset-0 w-full h-full js-landing-orbit-svg"
              style={landingInlineStyle(
                `transform-origin: center center; will-change: transform; transform: rotate(0deg);`,
              )}
            >
              <circle
                cx="0"
                cy="0"
                r="110"
                fill="none"
                stroke="rgba(15,23,42,0.05)"
                strokeWidth="22"
              ></circle>
              <circle
                cx="0"
                cy="0"
                r="110"
                fill="none"
                stroke="#7c3aed"
                strokeWidth="22"
                strokeLinecap="butt"
                strokeDasharray="154.4679060487527 691.1503837897545"
                strokeDashoffset="0"
                style={landingInlineStyle(
                  `filter: drop-shadow(rgba(124, 58, 237, 0.267) 0px 4px 12px);`,
                )}
              ></circle>
              <circle
                cx="0"
                cy="0"
                r="110"
                fill="none"
                stroke="#6366f1"
                strokeWidth="22"
                strokeLinecap="butt"
                strokeDasharray="191.18527018758337 691.1503837897545"
                strokeDashoffset="-168.4679060487527"
                style={landingInlineStyle(
                  `filter: drop-shadow(rgba(99, 102, 241, 0.267) 0px 4px 12px);`,
                )}
              ></circle>
              <circle
                cx="0"
                cy="0"
                r="110"
                fill="none"
                stroke="#0891b2"
                strokeWidth="22"
                strokeLinecap="butt"
                strokeDasharray="126.3899217072939 691.1503837897545"
                strokeDashoffset="-373.6531762363361"
                style={landingInlineStyle(
                  `filter: drop-shadow(rgba(8, 145, 178, 0.267) 0px 4px 12px);`,
                )}
              ></circle>
              <circle
                cx="0"
                cy="0"
                r="110"
                fill="none"
                stroke="#db2777"
                strokeWidth="22"
                strokeLinecap="butt"
                strokeDasharray="163.10728584612463 691.1503837897545"
                strokeDashoffset="-514.04309794363"
                style={landingInlineStyle(
                  `filter: drop-shadow(rgba(219, 39, 119, 0.267) 0px 4px 12px);`,
                )}
              ></circle>
            </svg>
            <div
              aria-hidden="true"
              className="absolute inset-0 pointer-events-none"
              style={landingInlineStyle(
                `transform-origin: center center; will-change: transform; transform: rotate(238.262deg);`,
              )}
            >
              <span
                className="absolute left-1/2 -translate-x-1/2 h-3.5 w-3.5 rounded-full"
                style={landingInlineStyle(
                  `top: calc(50% - 121px); background: rgb(168, 85, 247); box-shadow: rgba(168, 85, 247, 0.85) 0px 0px 16px, rgba(255, 255, 255, 0.95) 0px 0px 4px, rgba(255, 255, 255, 0.6) 0px 0px 0px 2px inset;`,
                )}
              ></span>
            </div>
            <div
              aria-hidden="true"
              className="absolute inset-0 pointer-events-none"
              style={landingInlineStyle(
                `transform-origin: center center; will-change: transform; transform: rotate(38.841deg);`,
              )}
            >
              <span
                className="absolute left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full opacity-60"
                style={landingInlineStyle(
                  `top: calc(50% - 145px); background: rgb(124, 58, 237); box-shadow: rgb(124, 58, 237) 0px 0px 8px;`,
                )}
              ></span>
            </div>
            <div
              aria-hidden="true"
              className="absolute inset-0 pointer-events-none"
              style={landingInlineStyle(
                `transform-origin: center center; will-change: transform; transform: rotate(150.869deg);`,
              )}
            >
              <span
                className="absolute left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full opacity-60"
                style={landingInlineStyle(
                  `top: calc(50% - 158px); background: rgb(8, 145, 178); box-shadow: rgb(8, 145, 178) 0px 0px 8px;`,
                )}
              ></span>
            </div>
            <div
              aria-hidden="true"
              className="absolute inset-0 pointer-events-none"
              style={landingInlineStyle(
                `transform-origin: center center; will-change: transform; transform: rotate(59.3046deg);`,
              )}
            >
              <span
                className="absolute left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full opacity-60"
                style={landingInlineStyle(
                  `top: calc(50% - 152px); background: rgb(219, 39, 119); box-shadow: rgb(219, 39, 119) 0px 0px 8px;`,
                )}
              ></span>
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <span
                className="font-mono text-[10px] uppercase tracking-[0.22em] text-indigo-300/70 mb-2"
                style={landingInlineStyle(`opacity: 1; transform: none;`)}
              >
                {tLit("hero.orbitKicker")}
              </span>
              <div
                className="flex items-baseline gap-1"
                style={landingInlineStyle(`opacity: 1; transform: none;`)}
              >
                <span className="text-6xl sm:text-7xl font-semibold tabular-nums -tracking-[0.04em] text-white">
                  47
                </span>
                <span className="text-2xl sm:text-3xl font-normal text-indigo-300/60">
                  h
                </span>
              </div>
              <div
                className="flex items-center gap-1.5 mt-2"
                style={landingInlineStyle(`opacity: 1;`)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-arrow-up-right h-3 w-3 text-emerald-400"
                >
                  <path d="M7 7h10v10"></path>
                  <path d="M7 17 17 7"></path>
                </svg>
                <span className="text-[12px] font-semibold tabular-nums text-emerald-400">
                  +12,4%
                </span>
                <span className="text-[11px] text-indigo-300/60">
                  {tLit("hero.plannedSuffix")}
                </span>
              </div>
              <span
                className="font-mono text-[9px] uppercase tracking-[0.22em] text-indigo-300/60 mt-3"
                style={landingInlineStyle(`opacity: 1;`)}
              >
                {tLit("hero.balancedCapacity")}
              </span>
            </div>
          </div>
          <div
            aria-hidden="true"
            className="absolute top-1/2 left-1/2 w-0 h-0 pointer-events-none"
            style={landingInlineStyle(
              `transform-origin: center center; will-change: transform; transform: rotate(76.3576deg);`,
            )}
          >
            <div
              className="absolute"
              style={landingInlineStyle(
                `top: -195px; left: 50%; transform: translateX(-50%);`,
              )}
            >
              <div
                className="pointer-events-auto"
                style={landingInlineStyle(
                  `transform-origin: center center; will-change: transform; transform: rotate(283.642deg);`,
                )}
              >
                <div className="inline-flex items-center gap-2.5 px-3 py-2 rounded-2xl bg-white border border-slate-200/70 shadow-[0_10px_28px_-10px_rgba(15,23,42,0.18),0_2px_6px_-2px_rgba(15,23,42,0.06)]">
                  <span
                    className="relative flex h-7 w-7 rounded-full text-white text-[10px] font-bold items-center justify-center shrink-0"
                    style={landingInlineStyle(`background: rgb(139, 92, 246);`)}
                  >
                    AM
                  </span>
                  <div className="flex flex-col leading-tight pr-1">
                    <span className="text-[11.5px] font-semibold text-slate-900 whitespace-nowrap">
                      Ana
                    </span>
                    <span className="flex items-center gap-1.5 whitespace-nowrap">
                      <span className="font-mono text-[10px] text-slate-500 tabular-nums">
                        32h / 40h
                      </span>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-100">
                        <span className="h-1 w-1 rounded-full bg-emerald-500"></span>
                        <span className="font-mono text-[9px] font-semibold text-emerald-700 tabular-nums">
                          80%
                        </span>
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div
            aria-hidden="true"
            className="absolute top-1/2 left-1/2 w-0 h-0 pointer-events-none"
            style={landingInlineStyle(
              `transform-origin: center center; will-change: transform; transform: rotate(197.02deg);`,
            )}
          >
            <div
              className="absolute"
              style={landingInlineStyle(
                `top: -205px; left: 50%; transform: translateX(-50%);`,
              )}
            >
              <div
                className="pointer-events-auto"
                style={landingInlineStyle(
                  `transform-origin: center center; will-change: transform; transform: rotate(162.98deg);`,
                )}
              >
                <div className="inline-flex items-center gap-2.5 px-3 py-2 rounded-2xl bg-white border border-amber-200/80 shadow-[0_10px_28px_-10px_rgba(217,119,6,0.30),0_2px_6px_-2px_rgba(15,23,42,0.06)]">
                  <span
                    className="relative flex h-7 w-7 rounded-full text-white text-[10px] font-bold items-center justify-center shrink-0"
                    style={landingInlineStyle(`background: rgb(245, 158, 11);`)}
                  >
                    CR
                  </span>
                  <div className="flex flex-col leading-tight pr-1">
                    <span className="flex items-center gap-1 text-[11.5px] font-semibold text-slate-900 whitespace-nowrap">
                      <svg
                        className="h-3 w-3 text-amber-500"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                          clipRule="evenodd"
                        ></path>
                      </svg>
                      Carlos
                    </span>
                    <span className="flex items-center gap-1.5 whitespace-nowrap">
                      <span className="font-mono text-[10px] text-slate-500 tabular-nums">
                        48h / 40h
                      </span>
                      <span className="font-mono text-[10px] font-semibold text-amber-700 tabular-nums">
                        +20%
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div
            aria-hidden="true"
            className="absolute top-1/2 left-1/2 w-0 h-0 pointer-events-none"
            style={landingInlineStyle(
              `transform-origin: center center; will-change: transform; transform: rotate(305.722deg);`,
            )}
          >
            <div
              className="absolute"
              style={landingInlineStyle(
                `top: -200px; left: 50%; transform: translateX(-50%);`,
              )}
            >
              <div
                className="pointer-events-auto"
                style={landingInlineStyle(
                  `transform-origin: center center; will-change: transform; transform: rotate(54.2782deg);`,
                )}
              >
                <div
                  className="inline-flex items-center gap-2.5 px-3 py-2 rounded-2xl bg-white border border-violet-200/80"
                  style={landingInlineStyle(
                    `box-shadow: rgba(124, 58, 237, 0.25) 0px 10px 28px -10px, rgba(15, 23, 42, 0.06) 0px 2px 6px -2px, rgba(255, 255, 255, 0.8) 0px 1px 0px inset;`,
                  )}
                >
                  <span
                    className="relative flex h-7 w-7 rounded-full items-center justify-center shrink-0"
                    style={landingInlineStyle(
                      `background: linear-gradient(135deg, rgb(168, 85, 247), rgb(99, 102, 241)); box-shadow: rgba(124, 58, 237, 0.55) 0px 6px 14px -4px;`,
                    )}
                  >
                    <svg
                      className="h-3.5 w-3.5 text-white"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M12 2l1.5 5L18 8.5l-4.5 1.5L12 15l-1.5-5L6 8.5l4.5-1.5z"></path>
                      <path
                        d="M19 14l.7 2.3L22 17l-2.3.7L19 20l-.7-2.3L16 17l2.3-.7z"
                        opacity={0.7}
                      ></path>
                    </svg>
                  </span>
                  <div className="flex flex-col leading-tight pr-1">
                    <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-violet-600 whitespace-nowrap">
                      {tLit("hero.suggestionKicker")}
                    </span>
                    <span className="text-[11.5px] font-semibold text-slate-900 whitespace-nowrap">
                      {tLit("hero.suggestionText")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
      <motion.div
        className="relative z-10 mt-auto border-y border-white/10 backdrop-blur-md bg-indigo-950/70"
        initial={prefersReduced ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.46,
          ease: [0.22, 1, 0.36, 1],
          delay: prefersReduced ? 0 : 0.08,
        }}
      >
        <div className="flex items-center px-6 sm:px-10 lg:px-16 py-4 gap-6 max-w-[1500px] w-full mx-auto">
          <div className="hidden lg:flex items-center gap-2.5 shrink-0">
            <span className="inline-flex items-end gap-[3px] h-3.5">
              <span
                className="block w-[3px] rounded-full"
                style={landingInlineStyle(
                  `height: 14px; background: rgb(124, 58, 237); transform-origin: center bottom; animation: 1.2s ease-in-out 0s infinite normal none running hero-pulse-bar;`,
                )}
              ></span>
              <span
                className="block w-[3px] rounded-full"
                style={landingInlineStyle(
                  `height: 14px; background: rgb(99, 102, 241); transform-origin: center bottom; animation: 1.2s ease-in-out 0.15s infinite normal none running hero-pulse-bar;`,
                )}
              ></span>
              <span
                className="block w-[3px] rounded-full"
                style={landingInlineStyle(
                  `height: 14px; background: rgb(8, 145, 178); transform-origin: center bottom; animation: 1.2s ease-in-out 0.3s infinite normal none running hero-pulse-bar;`,
                )}
              ></span>
              <span
                className="block w-[3px] rounded-full"
                style={landingInlineStyle(
                  `height: 14px; background: rgb(219, 39, 119); transform-origin: center bottom; animation: 1.2s ease-in-out 0.45s infinite normal none running hero-pulse-bar;`,
                )}
              ></span>
            </span>
            <span className="text-[10px] uppercase tracking-[0.22em] text-indigo-200/90 font-mono font-semibold">
              {tLit("hero.tickerLive")}
            </span>
          </div>
          <div className="hidden lg:block h-4 w-px bg-white/15"></div>
          <div className="flex-1 overflow-hidden relative min-w-0">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-indigo-950 to-transparent z-10"
            ></div>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-indigo-950 to-transparent z-10"
            ></div>
            <div
              className="flex w-max will-change-transform [backface-visibility:hidden] js-landing-ticker"
              style={landingInlineStyle(
                `transform: translate3d(0px, 0px, 0px);`,
              )}
            >
              <HeroTickerTrack items={tickerItems} toneClasses={toneClasses} />
              <HeroTickerTrack
                items={tickerItems}
                toneClasses={toneClasses}
                ariaHidden
              />
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
});

LandingLiteralHero.displayName = "LandingLiteralHero";
