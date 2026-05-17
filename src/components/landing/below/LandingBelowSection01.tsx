import type { FC } from "react";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  ChartLine,
  Sparkles,
  Target,
  TriangleAlert,
} from "lucide-react";

import {
  S01_PILL_BORDERS,
  S01_PILL_ICON_BG,
  S01_PILL_ICON_COLOR,
} from "@/components/landing/below/landingPlannerCellStyle";
import { landingInlineStyle } from "@/components/landing/below/landingInlineStyle";
import { useHomeLiteralT } from "@/components/landing/below/useHomeLiteralT";
import { i18nAsArray } from "@/lib/i18nReturnObjects";

const PILL_ICONS = [ChartLine, Activity, Sparkles, Target] as const;

const MOCK_ROWS = [
  { i: "MG", n: "María", r: "Diseño", c: "rgb(251,113,133)", weeks: [{ h: "8h", p: 100, s: "ok" }, { h: "7h", p: 87, s: "ok" }, { h: "8h", p: 100, s: "ok" }], total: "23h", cap: "/24h", ts: "ok" as const },
  { i: "CR", n: "Carlos", r: "Desarrollo", c: "rgb(251,146,60)", weeks: [{ h: "11h", p: 137, s: "over" }, { h: "8h", p: 100, s: "ok" }, { h: "9h", p: 112, s: "warn" }], total: "28h", cap: "/24h", ts: "over" as const },
  { i: "AM", n: "Ana", r: "Marketing", c: "rgb(167,139,250)", weeks: [{ h: "6h", p: 75, s: "ok" }, { h: "—", p: 0, s: "away" }, { h: "8h", p: 100, s: "ok" }], total: "14h", cap: "/16h", ts: "ok" as const },
  { i: "LF", n: "Luis", r: "Cuentas", c: "rgb(34,211,238)", weeks: [{ h: "7h", p: 87, s: "ok" }, { h: "8h", p: 100, s: "ok" }, { h: "7.5h", p: 93, s: "ok" }], total: "22.5h", cap: "/24h", ts: "ok" as const },
] as const;

const CELL_BG: Record<string, string> = { ok: "bg-emerald-50/50 border-emerald-200", warn: "bg-amber-50/60 border-amber-200", over: "bg-red-50/80 border-red-200" };
const CELL_BAR: Record<string, string> = { ok: "bg-emerald-500", warn: "bg-amber-400", over: "bg-red-500" };
const CELL_TX: Record<string, string> = { ok: "text-emerald-700", warn: "text-amber-700", over: "text-red-700" };

/** Sección 01 (grid unificado). */
export const LandingBelowSection01: FC = () => {
  const { t, path } = useHomeLiteralT();
  const pills = i18nAsArray<string>(t("s01.pills", { returnObjects: true }));

  return (
    <section
      className="relative bg-white overflow-hidden"
      style={landingInlineStyle(
        "padding-top: clamp(7rem, 12vw, 11rem); padding-bottom: clamp(6rem, 12vw, 10rem);",
      )}
    >
      <svg
        aria-hidden
        className="absolute left-0 right-0 -top-px w-full h-12 sm:h-16 lg:h-20 pointer-events-none"
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
      >
        <path
          d="M0,120 L1440,120 L1440,40 C1080,90 360,90 0,40 Z"
          fill="#ffffff"
        />
      </svg>
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
          <h2 className="text-[2.25rem] sm:text-5xl lg:text-[3.6rem] font-semibold text-slate-900 leading-[1.04] -tracking-[0.028em] mb-5 max-w-3xl mx-auto">
            {t("s01.titlePrefix")}{" "}
            <span className="relative inline-block">
              <span className="relative z-10 bg-gradient-to-r from-violet-600 via-indigo-600 to-pink-600 bg-clip-text text-transparent">
                {t("s01.titleHighlight")}
              </span>
              <svg
                aria-hidden
                className="absolute -bottom-1 left-0 w-full"
                viewBox="0 0 200 8"
                preserveAspectRatio="none"
                style={landingInlineStyle("height: 0.45em;")}
              >
                <path
                  d="M0,5 Q50,0 100,4 T200,3"
                  stroke="url(#underline-grad-s01)"
                  strokeWidth="2.5"
                  fill="none"
                  strokeLinecap="round"
                  pathLength={1}
                  strokeDashoffset={0}
                  strokeDasharray="1 1"
                />
                <defs>
                  <linearGradient id="underline-grad-s01" x1="0" x2="1">
                    <stop offset="0%" stopColor="#7c3aed" />
                    <stop offset="50%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>
                </defs>
              </svg>
            </span>
          </h2>
          <p className="text-[16px] sm:text-[18px] text-slate-500 leading-relaxed max-w-2xl mx-auto">
            {t("s01.subtitle")}
          </p>
        </div>
        <div
          className="mt-9 flex flex-col sm:flex-row gap-3 justify-center items-center"
          style={landingInlineStyle("opacity: 1; transform: none;")}
        >
          <a
            className="group relative inline-flex items-center justify-center gap-2 h-12 px-7 rounded-full text-[14px] font-medium bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-[0_8px_24px_-8px_rgba(15,23,42,0.4)]"
            href={path("/login?tab=register")}
          >
            <span>{t("s01.primaryCta")}</span>
            <ArrowRight
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </a>
          <a
            className="group inline-flex items-center justify-center gap-2 h-12 px-6 rounded-full text-[14px] font-medium text-slate-900 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all"
            href={path("/pitch")}
          >
            <span>{t("s01.secondaryCta")}</span>
            <ArrowUpRight className="h-4 w-4 opacity-60" aria-hidden />
          </a>
        </div>
        <div
          className="mt-16 sm:mt-20 max-w-4xl mx-auto"
          style={landingInlineStyle("opacity: 1; transform: none;")}
        >
          <div className="relative w-full mx-auto max-w-4xl" style={landingInlineStyle("opacity: 1; transform: none;")}>
            <div
              className="relative rounded-2xl bg-white border border-slate-200/80 overflow-hidden"
              style={landingInlineStyle(
                "box-shadow: rgba(99, 102, 241, 0.3) 0px 30px 70px -25px, rgba(15, 23, 42, 0.14) 0px 14px 32px -18px;",
              )}
            >
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-100 bg-slate-50/80">
                <div className="h-2.5 w-2.5 rounded-full bg-rose-300" />
                <div className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
                <div className="ml-2 flex-1 h-5 rounded-md bg-white border border-slate-100 flex items-center px-2 gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span className="font-mono text-[10px] text-slate-400 tracking-tight">{t("s01.mockDomain")}</span>
                </div>
              </div>

              <div className="flex">
                <div className="hidden sm:flex w-12 bg-slate-900 flex-col items-center py-3 gap-2.5 shrink-0 border-r border-slate-800">
                  <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center mb-1" style={landingInlineStyle("box-shadow: rgba(124,58,237,0.4) 0px 4px 12px -2px;")}>
                    <span className="text-white text-[9px] font-bold tracking-tight">T</span>
                  </div>
                  <div className="h-7 w-7 rounded-md bg-slate-800 flex items-center justify-center">
                    <svg className="h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                  </div>
                  <div className="h-7 w-7 rounded-md flex items-center justify-center">
                    <svg className="h-3.5 w-3.5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                  </div>
                  <div className="h-7 w-7 rounded-md flex items-center justify-center">
                    <ChartLine className="h-3.5 w-3.5 text-slate-500" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="text-[13px] font-bold text-slate-900">{t("s01.plannerKicker")}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{t("s01.plannerMeta")}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 border border-rose-100">
                        <TriangleAlert className="h-2.5 w-2.5 text-rose-600" aria-hidden />
                        <span className="font-mono text-[10px] text-rose-700">{t("s01.overloadBadge")}</span>
                      </span>
                      <div className="hidden md:flex items-center gap-0.5 bg-slate-100 rounded-md p-0.5">
                        <span className="h-5 w-5 rounded flex items-center justify-center text-slate-400 text-[11px] cursor-default">‹</span>
                        <span className="h-5 px-2 rounded bg-white text-[10px] text-slate-600 font-medium shadow-sm flex items-center">Hoy</span>
                        <span className="h-5 w-5 rounded flex items-center justify-center text-slate-400 text-[11px] cursor-default">›</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 sm:p-4 bg-slate-50/30">
                    <div className="grid grid-cols-[72px_repeat(3,1fr)_56px] gap-1.5 mb-2">
                      <div />
                      {["S1 · 5–9 may", "S2 · 12–16", "S3 · 19–23"].map((w) => (
                        <div key={w} className="text-center font-mono text-[8px] sm:text-[9px] uppercase tracking-[0.08em] text-slate-400 py-1">{w}</div>
                      ))}
                      <div className="text-center font-mono text-[8px] sm:text-[9px] uppercase tracking-[0.08em] text-slate-400 border-l border-slate-200 py-1">Total</div>
                    </div>

                    {MOCK_ROWS.map((emp) => (
                      <div key={emp.i} className="grid grid-cols-[72px_repeat(3,1fr)_56px] gap-1.5 mb-1.5">
                        <div className="flex items-center gap-1.5 pr-1 sticky left-0 bg-slate-50/30">
                          <div className="h-7 w-7 rounded-full border-2 border-white flex items-center justify-center text-white text-[8px] font-bold shrink-0 shadow-sm" style={landingInlineStyle(`background: ${emp.c};`)}>{emp.i}</div>
                          <div className="min-w-0 hidden sm:block">
                            <div className="text-[10px] font-semibold text-slate-800 truncate leading-tight">{emp.n}</div>
                            <div className="text-[8px] text-slate-400 uppercase tracking-wider truncate">{emp.r}</div>
                          </div>
                        </div>

                        {emp.weeks.map((w, wi) => {
                          if (w.s === "away") return (
                            <div key={wi} className="rounded-lg border border-slate-200 flex flex-col items-center justify-center min-h-[62px] p-1" style={landingInlineStyle("background: repeating-linear-gradient(45deg, rgba(148,163,184,0.08) 0px, rgba(148,163,184,0.08) 3px, transparent 3px, transparent 6px) rgb(248,250,252);")}>
                              <svg className="h-3 w-3 text-amber-500 mb-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3.34A10 10 0 1 1 2 12a10 10 0 0 0 15-8.66Z" /><path d="M13.73 10.73A4 4 0 0 0 8 12a4 4 0 0 0 4 4 4 4 0 0 0 1.73-.27" /></svg>
                              <span className="text-[8px] text-amber-700 font-semibold leading-tight">Vacaciones</span>
                              <span className="text-[7px] text-slate-400 leading-tight">14–16 may</span>
                            </div>
                          );
                          return (
                            <div key={wi} className={`rounded-lg border ${CELL_BG[w.s] ?? ""} p-1.5 flex flex-col min-h-[62px]`}>
                              <div className="h-1 rounded-full bg-slate-200/50 overflow-hidden mb-1">
                                <div className={`h-full rounded-full ${CELL_BAR[w.s] ?? ""}`} style={landingInlineStyle(`width: ${Math.min(w.p, 100)}%;`)} />
                              </div>
                              <div className="flex items-baseline justify-between gap-0.5">
                                <span className="text-[8px] text-slate-400 hidden sm:inline">Est.</span>
                                <span className={`text-[12px] font-mono font-bold tabular-nums ${CELL_TX[w.s] ?? ""}`}>{w.h}</span>
                              </div>
                              <div className="mt-auto pt-1 border-t border-black/[0.04]">
                                <div className="flex items-center justify-between">
                                  <span className="text-[7px] text-slate-400 hidden sm:inline">Carga</span>
                                  <span className={`text-[9px] font-mono font-semibold tabular-nums ${CELL_TX[w.s] ?? ""}`}>{w.p}%</span>
                                </div>
                              </div>
                              {w.s === "over" && (
                                <div className="flex items-center gap-0.5 mt-0.5 bg-red-100 rounded px-1 py-0.5">
                                  <TriangleAlert className="h-2 w-2 text-red-500 shrink-0" aria-hidden />
                                  <span className="text-[7px] font-semibold text-red-700">Sobrecarga +{w.p - 100}%</span>
                                </div>
                              )}
                            </div>
                          );
                        })}

                        <div className={`rounded-lg border-2 flex flex-col items-center justify-center p-1 min-h-[62px] ${
                          emp.ts === "over" ? "bg-red-50 border-red-200" : "bg-emerald-50 border-emerald-200"
                        }`}>
                          <span className={`text-[12px] font-bold font-mono tabular-nums leading-none ${emp.ts === "over" ? "text-red-700" : "text-emerald-700"}`}>{emp.total}</span>
                          <span className="text-[8px] text-slate-400 font-mono mt-0.5">{emp.cap}</span>
                          {emp.ts === "over" && <TriangleAlert className="h-2.5 w-2.5 text-red-400 mt-1" aria-hidden />}
                        </div>
                      </div>
                    ))}

                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] text-slate-400">
                      <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-emerald-500" /> Saludable</span>
                      <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-amber-400" /> Cuidado</span>
                      <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-red-500" /> Sobrecarga</span>
                      <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-sm" style={landingInlineStyle("background: repeating-linear-gradient(45deg, rgba(255,255,255,0.4) 0px, rgba(255,255,255,0.4) 1px, transparent 1px, transparent 3px) rgb(148,163,184);")} /> Ausencia</span>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-end justify-between">
                      <div>
                        <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-slate-400">{t("s01.capacityLabel")}</div>
                        <div className="text-xl font-semibold tabular-nums text-indigo-600 -tracking-[0.02em]">{t("s01.capacityPct")}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-slate-400">{t("s01.capacityHours")}</div>
                        <div className="h-1.5 w-20 rounded-full bg-slate-100 mt-1 overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-indigo-400 to-violet-500" style={landingInlineStyle("width: 93%;")} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-14 flex flex-wrap justify-center gap-2.5 sm:gap-3 max-w-3xl mx-auto">
          {pills.map((label, i) => {
            const Icon = PILL_ICONS[i];
            if (!Icon) return null;
            const border = S01_PILL_BORDERS[i] ?? S01_PILL_BORDERS[0];
            const iconBg = S01_PILL_ICON_BG[i] ?? S01_PILL_ICON_BG[0];
            const iconColor = S01_PILL_ICON_COLOR[i] ?? S01_PILL_ICON_COLOR[0];
            return (
              <div
                key={label}
                className={`inline-flex items-center gap-2 pl-2 pr-3.5 py-1.5 rounded-full bg-white border ${border}`}
                style={landingInlineStyle(
                  "box-shadow: rgba(15, 23, 42, 0.03) 0px 1px 2px, rgba(15, 23, 42, 0.06) 0px 4px 12px -6px; opacity: 1; transform: none;",
                )}
              >
                <span
                  className={`inline-flex items-center justify-center h-6 w-6 rounded-full ${iconBg}`}
                >
                  <Icon
                    className={`h-3 w-3 ${iconColor}`}
                    strokeWidth={2.5}
                    aria-hidden
                  />
                </span>
                <span className="text-[12.5px] font-medium text-slate-700 whitespace-nowrap">
                  {label}
                </span>
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
        <path
          d="M0,100 C360,20 1080,20 1440,100 L1440,120 L0,120 Z"
          fill="#fef9f3"
        />
      </svg>
    </section>
  );
};
