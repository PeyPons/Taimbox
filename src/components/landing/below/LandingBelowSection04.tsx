import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import type { FC, ReactNode } from "react";
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

function phaseOpacity(index: number, active: number, local: number, count: number): number {
  if (index === active) {
    if (active >= count - 1 || local < 0.68) return 1;
    return 1 - (local - 0.68) / 0.32;
  }
  if (index === active + 1 && local >= 0.68) return (local - 0.68) / 0.32;
  return 0;
}

function useMediaFlag(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(query).matches : false,
  );
  useEffect(() => {
    const mq = window.matchMedia(query);
    const apply = () => setMatches(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [query]);
  return matches;
}

function usePrefersReducedMotion(): boolean {
  return useMediaFlag("(prefers-reduced-motion: reduce)");
}

/** Móvil estrecho o táctil: el sticky con svh atrapa el scroll en iOS/Android. */
function useStackPhases(): boolean {
  const narrow = useMediaFlag("(max-width: 768px)");
  const coarse = useMediaFlag("(pointer: coarse)");
  return narrow || coarse;
}

function useTrackPhase(trackRef: RefObject<HTMLElement | null>, count: number, reduce: boolean) {
  const [state, setState] = useState({ active: 0, local: 0 });

  useEffect(() => {
    if (reduce || count < 1) return;
    const track = trackRef.current;
    if (!track) return;
    let raf = 0;

    const update = () => {
      const rect = track.getBoundingClientRect();
      const sticky = window.innerHeight - 64;
      const scrollable = Math.max(rect.height - sticky, 1);
      const passed = Math.min(Math.max(-rect.top, 0), scrollable);
      const scaled = (passed / scrollable) * count;
      const active = Math.min(count - 1, Math.max(0, Math.floor(scaled)));
      const local = Math.min(1, Math.max(0, scaled - active));
      setState((prev) =>
        prev.active === active && Math.abs(prev.local - local) < 0.015 ? prev : { active, local },
      );
    };

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [count, reduce, trackRef]);

  return state;
}

function PhaseStackItem({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setShown(true);
        observer.disconnect();
      },
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={shown ? "phase-stack-item is-in" : "phase-stack-item"}>
      {children}
    </div>
  );
}

function PhaseCopy({ phase }: { phase: Phase }) {
  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-[0.18em]" style={{ color: phase.color }}>
        {phase.number} · {phase.label}
      </p>
      <h3 className="mt-2 text-[1.65rem] font-semibold leading-[1.12] tracking-[-0.03em] text-white sm:text-3xl">
        {phase.heading}
      </h3>
      <p className="mt-3 text-sm leading-relaxed text-[#D4CEF0] sm:text-[15px]">{phase.description}</p>
      <ul className="mt-4 space-y-1.5">
        {phase.bullets.map((bullet) => (
          <li key={bullet} className="flex gap-2 text-sm leading-snug text-[#F7F4EC]">
            <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full" style={{ background: phase.color }} />
            <span>{bullet}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PhaseStage({
  phases,
  active,
  local,
}: {
  phases: Phase[];
  active: number;
  local: number;
}) {
  return (
    <div className="grid w-full grid-cols-1 items-center gap-5 lg:grid-cols-12 lg:gap-10">
      <div className="relative min-h-[12.5rem] lg:col-span-5 lg:min-h-[15rem]">
        {phases.map((phase, index) => {
          const opacity = phaseOpacity(index, active, local, phases.length);
          return (
            <div
              key={phase.number}
              className="absolute inset-0"
              style={{ opacity, pointerEvents: opacity > 0.55 ? "auto" : "none" }}
              aria-hidden={opacity < 0.45}
            >
              <PhaseCopy phase={phase} />
            </div>
          );
        })}
      </div>
      <div
        className="relative h-[min(340px,42svh)] lg:col-span-7 lg:h-[min(440px,52svh)]"
        role="region"
      >
        {phases.map((phase, index) => {
          const opacity = phaseOpacity(index, active, local, phases.length);
          const Mockup = phase.Mockup;
          return (
            <div
              key={phase.number}
              className="absolute inset-0 flex items-center justify-center"
              style={{ opacity, pointerEvents: opacity > 0.55 ? "auto" : "none" }}
              aria-hidden={opacity < 0.45}
            >
              <Mockup />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const LandingBelowSection04: FC = () => {
  const { t, path } = useHomeLiteralT();
  const reduce = usePrefersReducedMotion();
  const stack = useStackPhases() || reduce;
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
  const trackRef = useRef<HTMLDivElement>(null);
  const { active, local } = useTrackPhase(trackRef, phases.length, stack);

  return (
    <section className="relative bg-[#14123B] py-10 sm:py-14">
      <div className="relative mx-auto max-w-6xl px-6 lg:px-10">
        <div className="mb-6 max-w-3xl sm:mb-8">
          <span className="mb-2 inline-block font-mono text-[10px] uppercase tracking-[0.24em] text-[#C4B5FD]">
            {t("s04.kicker")}
          </span>
          <h2 className="text-[1.85rem] font-semibold leading-[1.08] tracking-[-0.03em] text-white sm:text-4xl">
            {t("s04.title")}{" "}
            <span className="italic font-normal text-[#C4B5FD]">{t("s04.titleHighlight")}</span>.
          </h2>
        </div>

        {stack ? (
          <div className="space-y-12" style={{ touchAction: "pan-y" }}>
            {phases.map((phase) => {
              const Mockup = phase.Mockup;
              return (
                <PhaseStackItem key={phase.number}>
                  <div className="grid items-center gap-6 lg:grid-cols-12">
                    <div className="lg:col-span-5">
                      <PhaseCopy phase={phase} />
                    </div>
                    <div className="lg:col-span-7">
                      <Mockup />
                    </div>
                  </div>
                </PhaseStackItem>
              );
            })}
          </div>
        ) : (
          <div ref={trackRef} style={{ height: `${Math.max(phases.length, 1) * 78}vh` }}>
            <div className="sticky top-16 flex h-[calc(100svh-4rem)] items-center overflow-hidden">
              <PhaseStage phases={phases} active={active} local={local} />
            </div>
          </div>
        )}

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            className="group inline-flex h-12 items-center gap-2 rounded-full bg-[#F7F4EC] px-7 text-[14px] font-semibold text-[#14123B] hover:bg-white"
            href="/login?tab=register"
          >
            {t("s04.ctaPrimary")}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </a>
          <a
            className="group inline-flex h-12 items-center gap-2 rounded-full border border-[rgba(196,181,253,0.4)] px-6 text-[14px] font-medium text-white hover:border-[#C4B5FD]"
            href={path("/guia")}
          >
            {t("s04.ctaGuide")}
            <ArrowUpRight className="h-4 w-4 opacity-60" />
          </a>
        </div>
      </div>
    </section>
  );
};
