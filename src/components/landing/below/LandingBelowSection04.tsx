import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FC, ReactNode } from "react";
import { animate } from "motion";
import { ArrowRight, ArrowUpRight } from "lucide-react";

import { landingInlineStyle } from "@/components/landing/below/landingInlineStyle";
import { useHomeLiteralT } from "@/components/landing/below/useHomeLiteralT";
import { i18nAsArray } from "@/lib/i18nReturnObjects";

/* ─────────────────────── Types & Data ────────────────────── */

type Phase = {
  number: string;
  label: string;
  color: string;
  shadowRgba: string;
  heading: string;
  description: string;
  bullets: [string, string, string];
  Mockup: FC;
};

function rgba(rgb: string, alpha: number): string {
  const m = /^rgb\(([^)]+)\)$/.exec(rgb);
  return m ? `rgba(${m[1]}, ${alpha})` : rgb;
}

/* ─────────────────────── Browser Frame ────────────────────── */

const S04_NAV_ICONS = [
  <svg key="cal" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>,
  <svg key="check" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="M22 4 12 14.01l-3-3" /></svg>,
  <svg key="tgt" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>,
  <svg key="trend" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>,
];

function BrowserFrame({ accent, children, activeNav = 0 }: { accent: string; children: ReactNode; activeNav?: number }) {
  return (
    <div className="relative w-full mx-auto max-w-xl" style={landingInlineStyle("perspective: 1400px;")}>
      <div
        className="relative rounded-2xl bg-white border border-slate-200/80 overflow-hidden"
        style={landingInlineStyle(
          `transform: rotateY(-5deg) rotateX(2deg); transform-style: preserve-3d; box-shadow: ${rgba(accent, 0.3)} 0px 36px 80px -20px, rgba(15, 23, 42, 0.18) 0px 22px 42px -18px;`,
        )}
      >
        <div className="flex">
          <div className="hidden sm:flex w-10 bg-slate-900 flex-col items-center py-2.5 gap-2 shrink-0 border-r border-slate-800">
            <div className="h-5 w-5 rounded-md bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center mb-0.5" style={landingInlineStyle("box-shadow: rgba(124,58,237,0.35) 0px 3px 8px -2px;")}>
              <span className="text-white text-[7px] font-bold">T</span>
            </div>
            {S04_NAV_ICONS.map((icon, i) => (
              <div key={i} className={`h-5 w-5 rounded-md flex items-center justify-center ${i === activeNav ? "bg-slate-800 text-white" : "text-slate-500"}`}>{icon}</div>
            ))}
          </div>
          <div className="flex-1 min-w-0 relative p-4 sm:p-5">{children}</div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────── Mockup: Planificador ────────────────────── */

const PLAN_ROWS = [
  { i: "MG", n: "María", c: "rgb(251,113,133)", weeks: [{ h: "7h", p: 87, s: "ok" }, { h: "8h", p: 100, s: "ok" }, { h: "8h", p: 100, s: "ok" }], total: "23h", cap: "/24h", ts: "ok" as const },
  { i: "CR", n: "Carlos", c: "rgb(251,146,60)", weeks: [{ h: "11h", p: 137, s: "over" }, { h: "8h", p: 100, s: "ok" }, { h: "9h", p: 112, s: "warn" }], total: "28h", cap: "/24h", ts: "over" as const },
  { i: "AM", n: "Ana", c: "rgb(167,139,250)", weeks: [{ h: "6h", p: 75, s: "ok" }, { h: "—", p: 0, s: "away" }, { h: "8h", p: 100, s: "ok" }], total: "14h", cap: "/16h", ts: "ok" as const },
] as const;
const PLAN_BG: Record<string, string> = { ok: "rgba(236,253,244,0.5)", warn: "rgba(255,251,235,0.6)", over: "rgba(254,242,242,0.8)", away: "rgba(248,250,252,0.7)" };
const PLAN_BAR: Record<string, string> = { ok: "rgb(16,185,129)", warn: "rgb(245,158,11)", over: "rgb(239,68,68)", away: "rgb(148,163,184)" };
const PLAN_TX: Record<string, string> = { ok: "rgb(22,163,74)", warn: "rgb(217,119,6)", over: "rgb(220,38,38)", away: "rgb(100,116,139)" };

const PlanificadorMockup: FC = () => (
  <BrowserFrame accent="rgb(99, 102, 241)" activeNav={0}>
    <div className="flex items-center justify-between mb-3">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">Planificador · Mayo</div>
        <div className="text-[14px] font-semibold text-slate-900 mt-0.5">3 personas · 3 semanas</div>
      </div>
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 border border-rose-100">
        <span className="font-mono text-[10px] text-rose-700">1 sobrecarga</span>
      </span>
    </div>
    <div className="grid grid-cols-[68px_repeat(3,1fr)_48px] gap-1.5">
      <div />
      {["S1", "S2", "S3"].map((w) => (
        <div key={w} className="text-center font-mono text-[9px] uppercase tracking-[0.16em] text-slate-400">{w}</div>
      ))}
      <div className="text-center font-mono text-[9px] uppercase tracking-[0.16em] text-slate-400">Tot</div>
      {PLAN_ROWS.map((p, pi) => (
        <div key={pi} className="contents">
          <div className="flex items-center gap-1.5 py-0.5">
            <div className="h-5 w-5 rounded-md flex items-center justify-center text-white text-[9px] font-bold shrink-0" style={landingInlineStyle(`background: ${p.c};`)}>{p.i}</div>
            <span className="text-[11px] text-slate-700 truncate">{p.n}</span>
          </div>
          {p.weeks.map((w, wi) => (
            <div
              key={wi}
              className="relative rounded-md border overflow-hidden flex flex-col items-center justify-center"
              style={landingInlineStyle(
                w.s === "away"
                  ? `background: repeating-linear-gradient(45deg, rgba(148,163,184,0.15) 0px, rgba(148,163,184,0.15) 3px, transparent 3px, transparent 6px) rgb(248,250,252); border-color: rgb(226,232,240); height: 30px;`
                  : `background: ${PLAN_BG[w.s]}; border-color: ${w.s === "ok" ? "rgb(167,243,208)" : w.s === "warn" ? "rgb(253,230,138)" : "rgb(254,202,202)"}; height: 30px;`,
              )}
            >
              <span className="font-mono text-[10px] font-semibold tabular-nums" style={landingInlineStyle(`color: ${PLAN_TX[w.s]};`)}>{w.h}</span>
              {w.s !== "away" && (
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-black/[0.04]">
                  <div className="h-full rounded-full" style={landingInlineStyle(`background: ${PLAN_BAR[w.s]}; width: ${Math.min(w.p, 100)}%;`)} />
                </div>
              )}
            </div>
          ))}
          <div className="flex items-center justify-center">
            <span className="font-mono text-[10px] font-semibold tabular-nums" style={landingInlineStyle(`color: ${p.ts === "over" ? "rgb(220,38,38)" : "rgb(51,65,85)"};`)}>
              {p.total}<span className="text-slate-400 font-normal text-[9px]">{p.cap}</span>
            </span>
          </div>
        </div>
      ))}
    </div>
    <div className="mt-3 pt-3 border-t border-slate-100 flex items-end justify-between">
      <div>
        <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-slate-400">Capacidad efectiva</div>
        <div className="text-xl font-semibold tabular-nums text-indigo-600 -tracking-[0.02em]">91%</div>
      </div>
      <div className="flex items-center gap-3 text-[9px] text-slate-500">
        <span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> OK</span>
        <span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Alto</span>
        <span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-rose-500" /> Sobre</span>
      </div>
    </div>
  </BrowserFrame>
);

/* ─────────────────────── Mockup: Cierre Semanal ────────────────────── */

function TaskRow({ bg, borderColor, icon, title, client, time, statusText, statusColor }: {
  bg: string; borderColor: string; icon: ReactNode; title: string; client: string; time: string; statusText: string; statusColor: string;
}) {
  return (
    <div className="grid grid-cols-[20px_1fr_auto_auto] gap-2 items-center p-2 rounded-lg border" style={{ background: bg, borderColor }}>
      {icon}
      <div className="min-w-0">
        <div className="text-[12px] font-medium text-slate-800 truncate">{title}</div>
        <div className="font-mono text-[9px] text-slate-500 truncate">{client}</div>
      </div>
      <div className="font-mono text-[10px] tabular-nums text-slate-600 whitespace-nowrap">{time}</div>
      <span className="font-mono text-[9px] font-semibold whitespace-nowrap" style={{ color: statusColor }}>{statusText}</span>
    </div>
  );
}

function CheckIcon({ color }: { color: string }) {
  return (
    <div className="h-4 w-4 rounded-md flex items-center justify-center" style={{ background: color }}>
      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
    </div>
  );
}

const CierreSemanalMockup: FC = () => (
  <BrowserFrame accent="rgb(139, 92, 246)" activeNav={1}>
    <div className="flex items-center justify-between mb-3">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">Cierre semanal · María G.</div>
        <div className="text-[14px] font-semibold text-slate-900 mt-0.5">S2 mayo · Viernes</div>
      </div>
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-50 border border-violet-100">
        <span className="font-mono text-[10px] text-violet-700">3/4 validadas</span>
      </span>
    </div>
    <div className="space-y-1.5 mb-3">
      <TaskRow bg="rgb(236, 253, 245)" borderColor="rgba(16, 185, 129, 0.145)" icon={<CheckIcon color="rgb(16, 185, 129)" />} title="Diseño Retainer global" client="TechCorp" time="6.5h / 6h" statusText="Validada" statusColor="rgb(16, 185, 129)" />
      <TaskRow bg="rgb(255, 247, 237)" borderColor="rgba(234, 88, 12, 0.145)" icon={<CheckIcon color="rgb(234, 88, 12)" />} title="Audit SEO trimestral" client="LocalBiz" time="11h / 8h" statusText="+3h" statusColor="rgb(234, 88, 12)" />
      <TaskRow bg="rgb(236, 253, 245)" borderColor="rgba(16, 185, 129, 0.145)" icon={<CheckIcon color="rgb(16, 185, 129)" />} title="Brief campaña Q2" client="StartupHub" time="4h / 4h" statusText="Validada" statusColor="rgb(16, 185, 129)" />
      <TaskRow
        bg="rgb(245, 243, 255)" borderColor="rgba(124, 58, 237, 0.145)"
        icon={<div className="h-4 w-4 rounded-md flex items-center justify-center" style={{ background: "rgb(124, 58, 237)" }}><ArrowRight className="h-2.5 w-2.5 text-white" /></div>}
        title="Revisión OKR" client="Gestiones internas" time="0h / 2h" statusText="Posponer S1 jun" statusColor="rgb(124, 58, 237)"
      />
    </div>
    <div className="rounded-lg p-2.5 bg-violet-50/60 border border-violet-100 flex items-center gap-2">
      <svg className="h-2.5 w-2.5 text-pink-600 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.5 5L18 8.5l-4.5 1.5L12 15l-1.5-5L6 8.5l4.5-1.5z" /></svg>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-semibold text-violet-900 leading-snug">Revisión OKR no encajó. Posponer a S1 junio</div>
        <div className="font-mono text-[9px] text-violet-700/80 mt-0.5">Aplicar y avisar al manager</div>
      </div>
      <span className="text-[10px] font-semibold text-white px-2 py-1 rounded-md bg-violet-600 shrink-0">Cerrar</span>
    </div>
    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
      <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-slate-400">Total semana</span>
      <span className="font-mono text-[11px] tabular-nums font-semibold text-slate-800">21.5h <span className="text-slate-400">/ 20h plan</span></span>
    </div>
  </BrowserFrame>
);

/* ─────────────────────── Mockup: Radar Operativo ────────────────────── */

function StatusDot({ color, glow = false }: { color: string; glow?: boolean }) {
  return (
    <span
      className="h-2 w-2 rounded-full"
      style={{ background: color, ...(glow ? { boxShadow: `${rgba(color, 0.6)} 0px 0px 8px` } : {}) }}
    />
  );
}

function RadarRow({ title, type, avance, carga, coste }: {
  title: string; type: string; avance: { color: string; glow?: boolean }; carga: { color: string; glow?: boolean }; coste: { color: string; glow?: boolean };
}) {
  const cellBg = (c: { color: string }) => {
    if (c.color === "rgb(16, 185, 129)") return "rgb(236, 253, 245)";
    if (c.color === "rgb(245, 158, 11)") return "rgb(255, 251, 235)";
    return "rgb(254, 242, 242)";
  };
  return (
    <div className="grid grid-cols-[1fr_60px_60px_60px] gap-2 items-center">
      <div className="min-w-0">
        <div className="text-[12px] font-medium text-slate-800 truncate">{title}</div>
        <div className="font-mono text-[9px] text-slate-400">{type}</div>
      </div>
      {[avance, carga, coste].map((s, i) => (
        <div key={i} className="h-7 rounded-md flex items-center justify-center" style={{ background: cellBg(s) }}>
          <StatusDot color={s.color} glow={s.glow} />
        </div>
      ))}
    </div>
  );
}

const RadarOperativoMockup: FC = () => (
  <BrowserFrame accent="rgb(16, 185, 129)" activeNav={2}>
    <div className="flex items-center justify-between mb-3">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">Radar Operativo · Mayo</div>
        <div className="text-[14px] font-semibold text-slate-900 mt-0.5">4 proyectos · 12 señales</div>
      </div>
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 border border-rose-100">
        <span className="font-mono text-[10px] text-rose-700">3 en riesgo</span>
      </span>
    </div>
    <div className="grid grid-cols-[1fr_60px_60px_60px] gap-2 mb-2">
      <div />
      <div className="text-center font-mono text-[9px] uppercase tracking-[0.16em] text-slate-400">Avance</div>
      <div className="text-center font-mono text-[9px] uppercase tracking-[0.16em] text-slate-400">Carga</div>
      <div className="text-center font-mono text-[9px] uppercase tracking-[0.16em] text-slate-400">Coste</div>
    </div>
    <div className="space-y-1.5">
      <RadarRow title="Web TechCorp v2" type="Retainer" avance={{ color: "rgb(245, 158, 11)" }} carga={{ color: "rgb(16, 185, 129)" }} coste={{ color: "rgb(16, 185, 129)" }} />
      <RadarRow title="Audit LocalBiz" type="Proyecto" avance={{ color: "rgb(239, 68, 68)", glow: true }} carga={{ color: "rgb(239, 68, 68)", glow: true }} coste={{ color: "rgb(245, 158, 11)" }} />
      <RadarRow title="PPC StartupHub" type="Retainer" avance={{ color: "rgb(16, 185, 129)" }} carga={{ color: "rgb(16, 185, 129)" }} coste={{ color: "rgb(239, 68, 68)", glow: true }} />
      <RadarRow title="Onboarding cli." type="Proyecto" avance={{ color: "rgb(16, 185, 129)" }} carga={{ color: "rgb(245, 158, 11)" }} coste={{ color: "rgb(16, 185, 129)" }} />
    </div>
    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px]">
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-1 text-slate-500"><span className="h-2 w-2 rounded-full bg-emerald-500" /> OK</span>
        <span className="inline-flex items-center gap-1 text-slate-500"><span className="h-2 w-2 rounded-full bg-amber-500" /> Cuidado</span>
        <span className="inline-flex items-center gap-1 text-slate-500"><span className="h-2 w-2 rounded-full bg-rose-500" /> Riesgo</span>
      </div>
      <span className="font-mono text-[10px] tabular-nums font-semibold text-slate-600">75% saludable</span>
    </div>
  </BrowserFrame>
);

/* ─────────────────────── Mockup: Weekly Forecast ────────────────────── */

function ForecastBar({ week, pct, gradient }: { week: string; pct: number; gradient: string }) {
  const color = pct > 100 ? "rgb(239, 68, 68)" : pct > 90 ? "rgb(245, 158, 11)" : "rgb(34, 197, 94)";
  return (
    <div className="grid grid-cols-[60px_1fr_50px] gap-2 items-center">
      <span className="font-mono text-[10px] text-slate-700 font-semibold">{week}</span>
      <div className="relative h-4 rounded-md bg-slate-100 overflow-visible">
        <div className="h-full rounded-md" style={{ background: gradient, width: `${Math.min(pct, 100)}%` }} />
        <div aria-hidden className="absolute top-0 bottom-0 w-px bg-slate-300/70" style={{ left: "90.9%" }} />
      </div>
      <span className="font-mono text-[10px] tabular-nums text-right" style={{ color }}>{pct}%</span>
    </div>
  );
}

const WeeklyForecastMockup: FC = () => (
  <BrowserFrame accent="rgb(236, 72, 153)" activeNav={3}>
    <div className="flex items-center justify-between mb-3">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">Weekly Forecast</div>
        <div className="text-[14px] font-semibold text-slate-900 mt-0.5">Próximas 4 semanas</div>
      </div>
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-pink-50 border border-pink-100">
        <svg className="h-2.5 w-2.5 text-pink-600" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.5 5L18 8.5l-4.5 1.5L12 15l-1.5-5L6 8.5l4.5-1.5z" /></svg>
        <span className="font-mono text-[10px] text-pink-700">2 sugerencias</span>
      </span>
    </div>
    <div className="space-y-2.5 mb-3">
      <ForecastBar week="S3 · feb" pct={88} gradient="linear-gradient(90deg, rgb(52, 211, 153), rgb(16, 185, 129))" />
      <ForecastBar week="S4 · feb" pct={96} gradient="linear-gradient(90deg, rgb(52, 211, 153), rgb(16, 185, 129))" />
      <ForecastBar week="S1 · mar" pct={110} gradient="linear-gradient(90deg, rgb(251, 146, 60), rgb(239, 68, 68))" />
      <ForecastBar week="S2 · mar" pct={75} gradient="linear-gradient(90deg, rgb(251, 191, 36), rgb(245, 158, 11))" />
    </div>
    <div className="rounded-lg p-2.5 bg-pink-50/70 border border-pink-100 flex items-start gap-2">
      <div className="h-5 w-5 rounded-md bg-pink-100 flex items-center justify-center shrink-0 mt-0.5">
        <svg className="h-2.5 w-2.5 text-pink-600" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.5 5L18 8.5l-4.5 1.5L12 15l-1.5-5L6 8.5l4.5-1.5z" /></svg>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-semibold text-pink-900 leading-snug">Redistribuir 12h de S1 mar a S2 mar</div>
        <div className="font-mono text-[9px] text-pink-700/80 mt-0.5">Sugerencia automática</div>
      </div>
      <span className="text-[10px] font-semibold text-pink-700 px-2 py-1 rounded-md bg-white border border-pink-200 shrink-0">Aplicar</span>
    </div>
  </BrowserFrame>
);

/* ─────────────────────── Phase definitions ────────────────────── */

type PhaseCopy = {
  number: string;
  label: string;
  heading: string;
  description: string;
  bullets: string[];
};

const PHASE_SHELLS: Pick<Phase, "color" | "shadowRgba" | "Mockup">[] = [
  { color: "rgb(99, 102, 241)", shadowRgba: "rgba(99, 102, 241, 0.267)", Mockup: PlanificadorMockup },
  { color: "rgb(139, 92, 246)", shadowRgba: "rgba(139, 92, 246, 0.267)", Mockup: CierreSemanalMockup },
  { color: "rgb(16, 185, 129)", shadowRgba: "rgba(16, 185, 129, 0.267)", Mockup: RadarOperativoMockup },
  { color: "rgb(236, 72, 153)", shadowRgba: "rgba(236, 72, 153, 0.267)", Mockup: WeeklyForecastMockup },
];

/* ─────────────────────── Phase Card ────────────────────── */

function PhaseCard({ phase, active }: { phase: Phase; active: boolean }) {
  return (
    <div
      className="group relative rounded-2xl p-6 sm:p-7 grid grid-cols-[auto_1fr] gap-5 sm:gap-6 items-start transition-all duration-500"
      style={{
        background: active ? "rgb(255, 255, 255)" : "rgba(255, 255, 255, 0.55)",
        border: active
          ? `1px solid ${rgba(phase.color, 0.25)}`
          : "1px solid rgba(15, 23, 42, 0.06)",
        boxShadow: active
          ? `rgba(15, 23, 42, 0.04) 0px 1px 2px, ${phase.shadowRgba} 0px 24px 50px -22px, rgba(255, 255, 255, 0.6) 0px 1px 0px inset`
          : "rgba(15, 23, 42, 0.03) 0px 1px 2px, rgba(15, 23, 42, 0.06) 0px 8px 24px -16px",
      }}
    >
      {/* Side bar accent */}
      <div
        className="absolute left-0 top-6 bottom-6 w-[3px] rounded-full transition-opacity duration-500"
        style={{
          background: phase.color,
          boxShadow: `${rgba(phase.color, 0.6)} 0px 0px 12px`,
          opacity: active ? 1 : 0.3,
        }}
      />

      {/* Number */}
      <div
        className="text-4xl sm:text-6xl font-semibold leading-none tabular-nums -tracking-[0.04em] -mt-1 transition-all duration-500"
        style={{
          color: active ? phase.color : "transparent",
          WebkitTextStroke: active ? `0px rgba(29, 37, 48, 0)` : `1.5px ${rgba(phase.color, 0.4)}`,
        }}
      >
        {phase.number}
      </div>

      {/* Content */}
      <div>
        <div className="flex items-center gap-2.5 mb-2">
          <span className="inline-block font-mono text-[10px] uppercase tracking-[0.2em] font-semibold" style={{ color: phase.color }}>
            {phase.label}
          </span>
          {active && (
            <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: phase.color, boxShadow: `${phase.color} 0px 0px 8px` }} />
          )}
        </div>
        <h3 className="text-xl sm:text-2xl font-semibold text-slate-900 leading-[1.2] -tracking-[0.018em] mb-3">
          {phase.heading}
        </h3>
        <p className="text-[14px] sm:text-[15px] text-slate-600 leading-relaxed mb-4">
          {phase.description}
        </p>
        <ul className="space-y-2">
          {phase.bullets.map((b, i) => (
            <li key={i} className="flex items-start gap-2.5 text-[13px] sm:text-[13.5px] text-slate-600 leading-relaxed">
              <span aria-hidden className="mt-1.5 inline-block h-1 w-1 rounded-full shrink-0" style={{ background: phase.color, boxShadow: `${rgba(phase.color, 0.4)} 0px 0px 6px` }} />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ─────────────────────── Scroll-driven hook ────────────────────── */

function useScrollDrivenPhase(cardRefs: React.RefObject<(HTMLDivElement | null)[]>) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const cards = cardRefs.current;
    if (!cards || cards.length === 0) return;

    let rafId = 0;

    const update = () => {
      const vh = window.innerHeight;
      const center = vh * 0.4;
      let bestIdx = 0;
      let bestDist = Infinity;

      for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        if (!card) continue;
        const rect = card.getBoundingClientRect();
        const cardCenter = rect.top + rect.height / 2;
        const dist = Math.abs(cardCenter - center);
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = i;
        }
      }

      setActive(bestIdx);
    };

    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    update();

    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafId);
    };
  }, [cardRefs]);

  return active;
}

/* ─────────────────────── Mockup slide animator ────────────────────── */

function useMockupSlideAnimation(
  containerRef: React.RefObject<HTMLDivElement | null>,
  activeIdx: number,
) {
  const stopsRef = useRef<Array<{ stop: () => void }>>([]);
  const prevRef = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const slides = Array.from(container.querySelectorAll<HTMLElement>("[data-s04-slide]"));
    if (slides.length !== 4) return;

    stopsRef.current.forEach((c) => c.stop());
    stopsRef.current = [];

    slides.forEach((el, i) => {
      const on = i === activeIdx;
      const fromOpacity = parseFloat(el.style.opacity || (on ? "0" : "1"));
      const toOpacity = on ? 1 : 0;
      const fromY = on ? 18 : 0;
      const toY = on ? 0 : -10;
      const fromScale = on ? 0.97 : 1;
      const toScale = on ? 1 : 0.97;

      const ctrl = animate(0, 1, {
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1],
        onUpdate: (p) => {
          const op = fromOpacity + (toOpacity - fromOpacity) * p;
          const y = fromY + (toY - fromY) * p;
          const sc = fromScale + (toScale - fromScale) * p;
          el.style.opacity = String(op);
          el.style.transform = `translateY(${y}px) scale(${sc})`;
        },
        onComplete: () => {
          el.style.pointerEvents = on ? "auto" : "none";
        },
      });
      stopsRef.current.push(ctrl);
      el.style.zIndex = String(on ? 2 : 0);
    });

    prevRef.current = activeIdx;

    return () => {
      stopsRef.current.forEach((c) => c.stop());
    };
  }, [activeIdx, containerRef]);
}

/* ─────────────────────── Main Section Component ────────────────────── */

export const LandingBelowSection04: FC = () => {
  const { t, path } = useHomeLiteralT();
  const phaseCopies = i18nAsArray<PhaseCopy>(t("s04.phases", { returnObjects: true }));
  const phases = useMemo<Phase[]>(
    () =>
      phaseCopies.map((copy, i) => {
        const shell = PHASE_SHELLS[i];
        if (!shell) throw new Error(`Missing phase shell at index ${i}`);
        const bullets = copy.bullets;
        return {
          ...shell,
          number: copy.number,
          label: copy.label,
          heading: copy.heading,
          description: copy.description,
          bullets: [bullets[0] ?? "", bullets[1] ?? "", bullets[2] ?? ""] as [string, string, string],
        };
      }),
    [phaseCopies],
  );

  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const mockupContainerRef = useRef<HTMLDivElement>(null);

  const setCardRef = useCallback((idx: number) => (el: HTMLDivElement | null) => {
    cardRefs.current[idx] = el;
  }, []);

  const activeIdx = useScrollDrivenPhase(cardRefs);
  useMockupSlideAnimation(mockupContainerRef, activeIdx);

  return (
    <section
      className="relative"
      style={landingInlineStyle(
        "overflow: clip; background: radial-gradient(90% 50% at 50% 0%, rgba(196, 181, 253, 0.3), transparent 60%), linear-gradient(rgb(250, 247, 255) 0%, rgb(240, 233, 255) 60%, rgb(250, 247, 255) 100%); padding-top: clamp(6rem, 12vw, 10rem); padding-bottom: clamp(7rem, 13vw, 11rem);",
      )}
    >
      {/* Decorative blobs */}
      <div aria-hidden className="absolute top-[20%] -right-20 h-[400px] w-[400px] rounded-full opacity-30 blur-3xl pointer-events-none" style={landingInlineStyle("background: radial-gradient(circle, rgb(199, 210, 254), transparent 70%);")} />
      <div aria-hidden className="absolute bottom-[10%] -left-20 h-[400px] w-[400px] rounded-full opacity-25 blur-3xl pointer-events-none" style={landingInlineStyle("background: radial-gradient(circle, rgb(251, 207, 232), transparent 70%);")} />

      <div className="relative max-w-6xl mx-auto px-6 lg:px-10">
        {/* Section Header */}
        <div className="max-w-3xl mb-14 sm:mb-20 text-center mx-auto">
          <span className="inline-block font-mono text-[10px] uppercase tracking-[0.24em] text-violet-700 mb-3">
            {t("s04.kicker")}
          </span>
          <h2 className="text-[2.25rem] sm:text-5xl lg:text-[3.6rem] font-semibold text-slate-900 leading-[1.05] -tracking-[0.028em]">
            {t("s04.title")}{" "}
            <span className="italic font-normal bg-gradient-to-r from-violet-600 via-indigo-600 to-pink-600 bg-clip-text text-transparent">
              {t("s04.titleHighlight")}
            </span>
            .
          </h2>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Left: Scrollable phase cards */}
          <div className="lg:col-span-5 order-2 lg:order-1 space-y-6 sm:space-y-8">
            {phases.map((phase, i) => (
              <div key={phase.number} ref={setCardRef(i)}>
                <PhaseCard phase={phase} active={i === activeIdx} />
              </div>
            ))}
          </div>

          {/* Right: Sticky mockup */}
          <div className="lg:col-span-7 order-1 lg:order-2">
            <div className="lg:sticky lg:top-28 flex items-center justify-center min-h-[420px] lg:min-h-[520px]">
              <div
                ref={mockupContainerRef}
                className="relative w-full max-w-xl mx-auto h-[400px] sm:h-[440px] flex items-center"
                role="region"
                aria-label={t("s04.mockupAria")}
              >
                {phases.map((phase, i) => (
                  <div
                    key={phase.number}
                    data-s04-slide={i}
                    className="absolute inset-0 flex items-center justify-center"
                    style={{
                      opacity: i === 0 ? 1 : 0,
                      transform: i === 0 ? "none" : "translateY(18px) scale(0.97)",
                      pointerEvents: i === 0 ? "auto" : "none",
                    }}
                  >
                    <phase.Mockup />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 sm:mt-20 flex flex-col sm:flex-row gap-3 justify-center items-center">
          <a
            className="group inline-flex items-center gap-2 h-12 px-7 rounded-full text-[14px] font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-[0_8px_24px_-8px_rgba(15,23,42,0.4)]"
            href="/login?tab=register"
          >
            {t("s04.ctaPrimary")}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </a>
          <a
            className="group inline-flex items-center gap-2 h-12 px-6 rounded-full text-[14px] font-medium text-slate-900 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all"
            href={path("/guia")}
          >
            {t("s04.ctaGuide")}
            <ArrowUpRight className="h-4 w-4 opacity-60" />
          </a>
        </div>
      </div>

      {/* Bottom wave */}
      <svg aria-hidden className="absolute left-0 right-0 bottom-0 w-full pointer-events-none h-14 sm:h-20" viewBox="0 0 1440 120" preserveAspectRatio="none">
        <path d="M0,80 C320,40 640,120 880,90 C1120,60 1280,90 1440,70 L1440,120 L0,120 Z" fill="#ffffff" />
      </svg>
    </section>
  );
};
