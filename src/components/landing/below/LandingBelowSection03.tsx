import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FC, ReactNode } from "react";
import { motion } from "motion/react";
import {
  ArrowUpRight,
  CalendarRange,
  ChartLine,
  Check,
  LayoutDashboard,
  Sparkles,
  Target,
  TriangleAlert,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { landingInlineStyle } from "@/components/landing/below/landingInlineStyle";
import { useHomeLiteralT } from "@/components/landing/below/useHomeLiteralT";
import { cn } from "@/lib/utils";
import { i18nAsArray } from "@/lib/i18nReturnObjects";

type Role = {
  /** Color principal (rgb(...)) usado en pastilla, badge, bullets, sombra del mockup. */
  color: string;
  label: string;
  icon: LucideIcon;
  badgeText: string;
  heading: string;
  description: string;
  bullets: [string, string, string];
  linkText: string;
  linkHref: string;
  Mockup: FC;
};

function rgba(rgb: string, alpha: number): string {
  const m = /^rgb\(([^)]+)\)$/.exec(rgb);
  return m ? `rgba(${m[1]}, ${alpha})` : rgb;
}

/* ─────────────────────── Browser frame compartido ────────────────────── */

const NAV_ICONS = [
  <svg key="cal" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>,
  <svg key="dash" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" /></svg>,
  <svg key="tgt" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>,
  <svg key="usr" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
  <svg key="fin" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></svg>,
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
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-100 bg-slate-50/80">
          <div className="h-2.5 w-2.5 rounded-full bg-rose-300" />
          <div className="h-2.5 w-2.5 rounded-full bg-amber-300" />
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
          <div className="ml-2 flex-1 h-5 rounded-md bg-white border border-slate-100 flex items-center px-2 gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span className="font-mono text-[10px] text-slate-400 tracking-tight">taimbox.com</span>
          </div>
        </div>
        <div className="flex">
          <div className="hidden sm:flex w-10 bg-slate-900 flex-col items-center py-2.5 gap-2 shrink-0 border-r border-slate-800">
            <div className="h-5 w-5 rounded-md bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center mb-0.5" style={landingInlineStyle("box-shadow: rgba(124,58,237,0.35) 0px 3px 8px -2px;")}>
              <span className="text-white text-[7px] font-bold">T</span>
            </div>
            {NAV_ICONS.map((icon, i) => (
              <div key={i} className={`h-5 w-5 rounded-md flex items-center justify-center ${i === activeNav ? "bg-slate-800 text-white" : "text-slate-500"}`}>{icon}</div>
            ))}
          </div>
          <div className="flex-1 min-w-0 relative p-4 sm:p-5">{children}</div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────── Mockups por rol ────────────────────── */


/* Directores → Planificador (capacidad efectiva en grid con heatmap) */
const DIR_ROWS = [
  { i: "MG", n: "María", c: "rgb(251,113,133)", weeks: [{ h: "7h", p: 87, s: "ok" }, { h: "8h", p: 100, s: "ok" }, { h: "8h", p: 100, s: "ok" }], total: "23h", cap: "/24h", ts: "ok" as const },
  { i: "CR", n: "Carlos", c: "rgb(251,146,60)", weeks: [{ h: "11h", p: 137, s: "over" }, { h: "8h", p: 100, s: "ok" }, { h: "9h", p: 112, s: "warn" }], total: "28h", cap: "/24h", ts: "over" as const },
  { i: "AM", n: "Ana", c: "rgb(167,139,250)", weeks: [{ h: "6h", p: 75, s: "ok" }, { h: "—", p: 0, s: "away" }, { h: "8h", p: 100, s: "ok" }], total: "14h", cap: "/16h", ts: "ok" as const },
  { i: "LF", n: "Luis", c: "rgb(34,211,238)", weeks: [{ h: "7h", p: 87, s: "ok" }, { h: "8h", p: 100, s: "ok" }, { h: "7.5h", p: 93, s: "ok" }], total: "22.5h", cap: "/24h", ts: "ok" as const },
] as const;
const DIR_BG: Record<string, string> = { ok: "rgba(236,253,244,0.5)", warn: "rgba(255,251,235,0.6)", over: "rgba(254,242,242,0.8)", away: "rgba(248,250,252,0.7)" };
const DIR_BAR: Record<string, string> = { ok: "rgb(16,185,129)", warn: "rgb(245,158,11)", over: "rgb(239,68,68)", away: "rgb(148,163,184)" };
const DIR_TX: Record<string, string> = { ok: "rgb(22,163,74)", warn: "rgb(217,119,6)", over: "rgb(220,38,38)", away: "rgb(100,116,139)" };

const DirectoresMockup: FC = () => (
  <BrowserFrame accent="rgb(99, 102, 241)" activeNav={0}>
    <div className="flex items-center justify-between mb-3">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">
          Planificador · Mayo
        </div>
        <div className="text-[14px] font-semibold text-slate-900 mt-0.5">
          4 personas · 3 semanas
        </div>
      </div>
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 border border-rose-100">
        <TriangleAlert className="h-2.5 w-2.5 text-rose-600" />
        <span className="font-mono text-[10px] text-rose-700">1 sobrecarga</span>
      </span>
    </div>
    <div className="grid grid-cols-[72px_repeat(3,1fr)_52px] gap-1.5">
      <div />
      {["S1", "S2", "S3"].map((w) => (
        <div key={w} className="text-center font-mono text-[9px] uppercase tracking-[0.16em] text-slate-400">
          {w}
        </div>
      ))}
      <div className="text-center font-mono text-[9px] uppercase tracking-[0.16em] text-slate-400">Tot</div>
      {DIR_ROWS.map((p, pi) => (
        <div key={pi} className="contents">
          <div className="flex items-center gap-1.5 py-0.5">
            <div
              className="h-5 w-5 rounded-md flex items-center justify-center text-white text-[9px] font-bold shrink-0"
              style={landingInlineStyle(`background: ${p.c};`)}
            >
              {p.i}
            </div>
            <span className="text-[11px] text-slate-700 truncate">{p.n}</span>
          </div>
          {p.weeks.map((w, wi) => (
            <div
              key={wi}
              className="relative rounded-md border overflow-hidden flex flex-col items-center justify-center"
              style={landingInlineStyle(
                w.s === "away"
                  ? `background: repeating-linear-gradient(45deg, rgba(148,163,184,0.15) 0px, rgba(148,163,184,0.15) 3px, transparent 3px, transparent 6px) rgb(248,250,252); border-color: rgb(226,232,240); height: 32px;`
                  : `background: ${DIR_BG[w.s]}; border-color: ${w.s === "ok" ? "rgb(167,243,208)" : w.s === "warn" ? "rgb(253,230,138)" : "rgb(254,202,202)"}; height: 32px;`,
              )}
            >
              <span className="font-mono text-[10px] font-semibold tabular-nums" style={landingInlineStyle(`color: ${DIR_TX[w.s]};`)}>{w.h}</span>
              {w.s !== "away" && (
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-black/[0.04]">
                  <div className="h-full rounded-full" style={landingInlineStyle(`background: ${DIR_BAR[w.s]}; width: ${Math.min(w.p, 100)}%;`)} />
                </div>
              )}
            </div>
          ))}
          <div className="flex items-center justify-center">
            <span
              className="font-mono text-[10px] font-semibold tabular-nums"
              style={landingInlineStyle(`color: ${p.ts === "over" ? "rgb(220,38,38)" : "rgb(51,65,85)"};`)}
            >
              {p.total}<span className="text-slate-400 font-normal">{p.cap}</span>
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

/* Empleados → Mi semana (timer + cierre de tareas) */
const EmpleadosMockup: FC = () => (
  <BrowserFrame accent="rgb(139, 92, 246)" activeNav={1}>
    <div className="flex items-center justify-between mb-3">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">
          Mi semana · S2 mayo
        </div>
        <div className="text-[14px] font-semibold text-slate-900 mt-0.5">32h planificadas · 19h reportadas</div>
      </div>
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-violet-50 border border-violet-100">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-500/70" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-violet-500" />
        </span>
        <span className="font-mono text-[10px] text-violet-700">Cronómetro · 32:14</span>
      </span>
    </div>
    <div className="space-y-1.5 mb-3">
      {[
        {
          status: "running" as const,
          title: "Diseño Retainer global",
          client: "TechCorp",
          time: "2.3h / 4h",
          color: "rgb(139, 92, 246)",
          bg: "rgb(245, 243, 255)",
          border: "rgba(139, 92, 246, 0.18)",
        },
        {
          status: "done" as const,
          title: "Audit SEO trimestral",
          client: "LocalBiz",
          time: "6.5h / 6h",
          color: "rgb(16, 185, 129)",
          bg: "rgb(236, 253, 245)",
          border: "rgba(16, 185, 129, 0.18)",
        },
        {
          status: "done" as const,
          title: "Brief campaña Q2",
          client: "StartupHub",
          time: "4h / 4h",
          color: "rgb(16, 185, 129)",
          bg: "rgb(236, 253, 245)",
          border: "rgba(16, 185, 129, 0.18)",
        },
        {
          status: "pending" as const,
          title: "Revisión OKR",
          client: "Gestiones internas",
          time: "0h / 2h",
          color: "rgb(100, 116, 139)",
          bg: "rgb(248, 250, 252)",
          border: "rgba(100, 116, 139, 0.16)",
        },
      ].map((t, i) => (
        <div
          key={i}
          className="grid grid-cols-[20px_1fr_auto_auto] gap-2 items-center p-2 rounded-lg border"
          style={landingInlineStyle(`background: ${t.bg}; border-color: ${t.border};`)}
        >
          <div
            className="h-4 w-4 rounded-md flex items-center justify-center"
            style={landingInlineStyle(`background: ${t.color};`)}
          >
            {t.status === "done" ? (
              <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
            ) : t.status === "running" ? (
              <span className="h-1.5 w-1.5 rounded-sm bg-white" />
            ) : (
              <span className="h-2 w-2 rounded-full border-2 border-white" />
            )}
          </div>
          <div className="min-w-0">
            <div className="text-[12px] font-medium text-slate-800 truncate">{t.title}</div>
            <div className="font-mono text-[9px] text-slate-500 truncate">{t.client}</div>
          </div>
          <div className="font-mono text-[10px] tabular-nums text-slate-600 whitespace-nowrap">{t.time}</div>
          <span
            className="font-mono text-[9px] font-semibold whitespace-nowrap"
            style={landingInlineStyle(`color: ${t.color};`)}
          >
            {t.status === "done" ? "Validada" : t.status === "running" ? "En curso" : "Pendiente"}
          </span>
        </div>
      ))}
    </div>
    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
      <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-slate-400">Total semana</span>
      <span className="font-mono text-[11px] tabular-nums font-semibold text-slate-800">
        12.8h <span className="text-slate-400">/ 16h al cierre</span>
      </span>
    </div>
  </BrowserFrame>
);

/* Project Managers → Radar Operativo (señales por proyecto) */
const ProjectManagersMockup: FC = () => (
  <BrowserFrame accent="rgb(245, 158, 11)" activeNav={2}>
    <div className="flex items-center justify-between mb-3">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">
          Radar Operativo · Mayo
        </div>
        <div className="text-[14px] font-semibold text-slate-900 mt-0.5">4 proyectos · 12 señales</div>
      </div>
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 border border-rose-100">
        <TriangleAlert className="h-2.5 w-2.5 text-rose-600" />
        <span className="font-mono text-[10px] text-rose-700">3 en riesgo</span>
      </span>
    </div>
    <div className="grid grid-cols-[1fr_60px_60px_60px] gap-2 mb-2">
      <div />
      {["Avance", "Carga", "Coste"].map((h) => (
        <div key={h} className="text-center font-mono text-[9px] uppercase tracking-[0.16em] text-slate-400">
          {h}
        </div>
      ))}
    </div>
    <div className="space-y-1.5">
      {[
        { name: "Web TechCorp v2", type: "Retainer", cells: ["warn", "good", "good"] },
        { name: "Audit LocalBiz", type: "Proyecto", cells: ["bad", "bad", "warn"] },
        { name: "PPC StartupHub", type: "Retainer", cells: ["good", "good", "bad"] },
        { name: "Onboarding cli.", type: "Proyecto", cells: ["good", "warn", "good"] },
      ].map((p, i) => (
        <div key={i} className="grid grid-cols-[1fr_60px_60px_60px] gap-2 items-center">
          <div className="min-w-0">
            <div className="text-[12px] font-medium text-slate-800 truncate">{p.name}</div>
            <div className="font-mono text-[9px] text-slate-400">{p.type}</div>
          </div>
          {p.cells.map((state, ci) => {
            const cfg =
              state === "good"
                ? { bg: "rgb(236, 253, 245)", dot: "rgb(16, 185, 129)", glow: "" }
                : state === "warn"
                  ? { bg: "rgb(255, 251, 235)", dot: "rgb(245, 158, 11)", glow: "" }
                  : {
                      bg: "rgb(254, 242, 242)",
                      dot: "rgb(239, 68, 68)",
                      glow: "box-shadow: rgba(239, 68, 68, 0.6) 0px 0px 8px;",
                    };
            return (
              <div
                key={ci}
                className="h-7 rounded-md flex items-center justify-center"
                style={landingInlineStyle(`background: ${cfg.bg};`)}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={landingInlineStyle(`background: ${cfg.dot}; ${cfg.glow}`)}
                />
              </div>
            );
          })}
        </div>
      ))}
    </div>
    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px]">
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-1 text-slate-500">
          <span className="h-2 w-2 rounded-full bg-emerald-500" /> OK
        </span>
        <span className="inline-flex items-center gap-1 text-slate-500">
          <span className="h-2 w-2 rounded-full bg-amber-500" /> Cuidado
        </span>
        <span className="inline-flex items-center gap-1 text-slate-500">
          <span className="h-2 w-2 rounded-full bg-rose-500" /> Riesgo
        </span>
      </div>
      <span className="font-mono text-[10px] tabular-nums font-semibold text-slate-600">75% saludable</span>
    </div>
  </BrowserFrame>
);

/* RRHH → Capacidad + ausencias del equipo */
const RRHHMockup: FC = () => (
  <BrowserFrame accent="rgb(8, 145, 178)" activeNav={3}>
    <div className="flex items-center justify-between mb-3">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">Equipo · Mayo</div>
        <div className="text-[14px] font-semibold text-slate-900 mt-0.5">12 personas · 3 departamentos</div>
      </div>
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-50 border border-cyan-100">
        <Users className="h-2.5 w-2.5 text-cyan-700" />
        <span className="font-mono text-[10px] text-cyan-700">88% capacidad</span>
      </span>
    </div>
    <div className="space-y-1.5 mb-3">
      {[
        { name: "María", role: "Diseño", initials: "MG", color: "rgb(251, 113, 133)", cap: 92, status: "ok" as const, note: "—" },
        { name: "Carlos", role: "Diseño", initials: "CR", color: "rgb(251, 146, 60)", cap: 118, status: "over" as const, note: "+8h pendientes" },
        { name: "Ana", role: "Marketing", initials: "AM", color: "rgb(167, 139, 250)", cap: 78, status: "away" as const, note: "Vacaciones 14–16" },
        { name: "Luis", role: "Desarrollo", initials: "LF", color: "rgb(34, 211, 238)", cap: 95, status: "ok" as const, note: "—" },
      ].map((p, i) => {
        const cfg =
          p.status === "ok"
            ? { bg: "rgb(236, 253, 245)", border: "rgba(16, 185, 129, 0.18)", color: "rgb(16, 185, 129)", label: "Disponible" }
            : p.status === "over"
              ? { bg: "rgb(254, 242, 242)", border: "rgba(239, 68, 68, 0.18)", color: "rgb(220, 38, 38)", label: "Sobrecarga" }
              : { bg: "rgb(248, 250, 252)", border: "rgba(100, 116, 139, 0.16)", color: "rgb(100, 116, 139)", label: "Ausencia" };
        return (
          <div
            key={i}
            className="grid grid-cols-[24px_1fr_auto_auto] gap-2.5 items-center p-2 rounded-lg border"
            style={landingInlineStyle(`background: ${cfg.bg}; border-color: ${cfg.border};`)}
          >
            <div
              className="h-6 w-6 rounded-md flex items-center justify-center text-white text-[10px] font-bold"
              style={landingInlineStyle(`background: ${p.color};`)}
            >
              {p.initials}
            </div>
            <div className="min-w-0">
              <div className="text-[12px] font-medium text-slate-800 truncate">{p.name}</div>
              <div className="font-mono text-[9px] text-slate-500 truncate">
                {p.role} · {p.note}
              </div>
            </div>
            <div className="font-mono text-[10px] tabular-nums text-slate-700 whitespace-nowrap">{p.cap}%</div>
            <span
              className="font-mono text-[9px] font-semibold whitespace-nowrap"
              style={landingInlineStyle(`color: ${cfg.color};`)}
            >
              {cfg.label}
            </span>
          </div>
        );
      })}
    </div>
    <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-3 gap-3">
      <div>
        <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-slate-400">Disponible</div>
        <div className="text-[14px] font-semibold tabular-nums text-emerald-600">9</div>
      </div>
      <div>
        <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-slate-400">Sobrecarga</div>
        <div className="text-[14px] font-semibold tabular-nums text-rose-600">1</div>
      </div>
      <div>
        <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-slate-400">Ausencias</div>
        <div className="text-[14px] font-semibold tabular-nums text-slate-600">2</div>
      </div>
    </div>
  </BrowserFrame>
);

/* Finanzas → Salud Financiera (F1-F4, EHR, margen) */
const FinanzasMockup: FC = () => (
  <BrowserFrame accent="rgb(16, 185, 129)" activeNav={4}>
    <div className="flex items-center justify-between mb-3">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">
          Salud Financiera · Mayo
        </div>
        <div className="text-[14px] font-semibold text-slate-900 mt-0.5">12 días sin cerrar · pacing en vivo</div>
      </div>
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100">
        <ChartLine className="h-2.5 w-2.5 text-emerald-700" />
        <span className="font-mono text-[10px] text-emerald-700">Margen 32%</span>
      </span>
    </div>
    <div className="grid grid-cols-3 gap-2 mb-3">
      {[
        { label: "Ingreso devengado", value: "€18.420", sub: "F1 · al céntimo", color: "rgb(16, 185, 129)", bg: "rgb(236, 253, 245)" },
        { label: "EHR efectivo", value: "€47,8", sub: "F3 · €/h", color: "rgb(8, 145, 178)", bg: "rgb(236, 254, 255)" },
        { label: "Margen mes", value: "32%", sub: "F4 · vs 28% plan", color: "rgb(99, 102, 241)", bg: "rgb(238, 242, 255)" },
      ].map((k, i) => (
        <div
          key={i}
          className="rounded-lg p-2.5"
          style={landingInlineStyle(`background: ${k.bg};`)}
        >
          <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-slate-400">{k.label}</div>
          <div
            className="text-[18px] font-semibold tabular-nums -tracking-[0.02em] mt-0.5"
            style={landingInlineStyle(`color: ${k.color};`)}
          >
            {k.value}
          </div>
          <div className="font-mono text-[9px] text-slate-500 mt-0.5">{k.sub}</div>
        </div>
      ))}
    </div>
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-slate-400">
          Pacing por proyecto
        </span>
        <span className="font-mono text-[9px] text-slate-400">Día 12 / 22</span>
      </div>
      <div className="space-y-1.5">
        {[
          { name: "TechCorp", pct: 58, target: 54, color: "rgb(16, 185, 129)" },
          { name: "LocalBiz", pct: 71, target: 54, color: "rgb(245, 158, 11)" },
          { name: "StartupHub", pct: 42, target: 54, color: "rgb(239, 68, 68)" },
        ].map((p, i) => (
          <div key={i} className="grid grid-cols-[80px_1fr_50px] gap-2 items-center">
            <span className="text-[11px] text-slate-700 truncate">{p.name}</span>
            <div className="relative h-3 rounded-md bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-md"
                style={landingInlineStyle(`background: ${p.color}; width: ${p.pct}%;`)}
              />
              <div
                aria-hidden
                className="absolute top-0 bottom-0 w-px bg-slate-300/70"
                style={landingInlineStyle(`left: ${p.target}%;`)}
              />
            </div>
            <span
              className="font-mono text-[10px] tabular-nums text-right"
              style={landingInlineStyle(`color: ${p.color};`)}
            >
              {p.pct}%
            </span>
          </div>
        ))}
      </div>
    </div>
    <div className="rounded-lg p-2.5 bg-emerald-50/70 border border-emerald-100 flex items-start gap-2">
      <Sparkles className="h-3 w-3 text-emerald-700 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-[12px] font-semibold text-emerald-900 leading-snug">
          F1–F4 cuadradas · export a Excel / API
        </div>
        <div className="font-mono text-[10px] text-emerald-700/80 mt-0.5">
          Sin caja negra · cada euro auditable
        </div>
      </div>
    </div>
  </BrowserFrame>
);

/* ─────────────────────── Config de roles ────────────────────── */

type RoleCopy = {
  label: string;
  badgeText: string;
  heading: string;
  description: string;
  bullets: string[];
  linkText: string;
  linkHref: string;
};

const ROLE_SHELLS: Pick<Role, "color" | "icon" | "Mockup">[] = [
  { color: "rgb(99, 102, 241)", icon: CalendarRange, Mockup: DirectoresMockup },
  { color: "rgb(139, 92, 246)", icon: LayoutDashboard, Mockup: EmpleadosMockup },
  { color: "rgb(245, 158, 11)", icon: Target, Mockup: ProjectManagersMockup },
  { color: "rgb(8, 145, 178)", icon: Users, Mockup: RRHHMockup },
  { color: "rgb(16, 185, 129)", icon: ChartLine, Mockup: FinanzasMockup },
];

const AUTOCYCLE_MS = 5500;
const PAUSE_AFTER_INTERACTION_MS = 12000;

/* ─────────────────────── Componente principal ────────────────────── */

export const LandingBelowSection03: FC = () => {
  const { t, path } = useHomeLiteralT();
  const roleCopies = i18nAsArray<RoleCopy>(t("s03.roles", { returnObjects: true }));
  const roles = useMemo<Role[]>(
    () =>
      roleCopies.map((copy, i) => {
        const shell = ROLE_SHELLS[i];
        if (!shell) throw new Error(`Missing role shell at index ${i}`);
        const bullets = copy.bullets;
        return {
          ...shell,
          label: copy.label,
          badgeText: copy.badgeText,
          heading: copy.heading,
          description: copy.description,
          bullets: [bullets[0] ?? "", bullets[1] ?? "", bullets[2] ?? ""] as [string, string, string],
          linkText: copy.linkText,
          linkHref: path(copy.linkHref),
        };
      }),
    [path, roleCopies],
  );

  const [activeIdx, setActiveIdx] = useState(0);
  const pinnedIdxRef = useRef(0);
  const pausedRef = useRef(false);
  const pauseTimerRef = useRef<number>(0);

  const activate = useCallback((idx: number) => {
    pinnedIdxRef.current = idx;
    pausedRef.current = true;
    setActiveIdx(idx);
    window.clearTimeout(pauseTimerRef.current);
    pauseTimerRef.current = window.setTimeout(() => {
      pausedRef.current = false;
    }, PAUSE_AFTER_INTERACTION_MS);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (pausedRef.current) return;
      const next = (pinnedIdxRef.current + 1) % roles.length;
      pinnedIdxRef.current = next;
      setActiveIdx(next);
    }, AUTOCYCLE_MS);
    return () => {
      window.clearInterval(id);
      window.clearTimeout(pauseTimerRef.current);
    };
  }, [roles.length]);

  const role = roles[activeIdx];
  const ActiveMockup = role.Mockup;
  const BadgeIcon = role.icon;

  return (
    <section
      className="relative bg-white overflow-hidden"
      style={landingInlineStyle("padding-top: clamp(5rem, 10vw, 8rem); padding-bottom: clamp(7rem, 12vw, 10rem);")}
    >
      <div className="relative max-w-7xl mx-auto px-6 lg:px-10">
        {/* Encabezado */}
        <div className="max-w-3xl mb-12 text-center mx-auto">
          <span className="inline-block font-mono text-[10px] uppercase tracking-[0.24em] text-slate-400 mb-3">
            {t("s03.kicker")}
          </span>
          <h2 className="text-[2rem] sm:text-4xl lg:text-5xl font-semibold text-slate-900 leading-[1.1] -tracking-[0.02em] mb-5">
            {t("s03.title")} <span className="text-violet-600">{t("s03.titleHighlight")}</span>.
          </h2>
          <p className="text-[15px] sm:text-[16px] text-slate-500 leading-relaxed">{t("s03.subtitle")}</p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-2.5 mb-10 sm:mb-14 relative">
          {roles.map((r, i) => {
            const isActive = activeIdx === i;
            const Icon = r.icon;
            return (
              <button
                key={r.label}
                type="button"
                aria-pressed={isActive}
                onMouseEnter={() => activate(i)}
                onFocus={() => activate(i)}
                onClick={(e) => {
                  e.preventDefault();
                  activate(i);
                }}
                className={cn(
                  "relative inline-flex items-center gap-2 h-11 px-4 sm:px-5 rounded-full text-[13px] sm:text-[14px] font-medium transition-colors duration-200",
                  isActive ? "text-white" : "text-slate-700 hover:text-slate-900",
                )}
              >
                {isActive ? (
                  <motion.span
                    layoutId="section-03-tabs-pill"
                    className="absolute inset-0 rounded-full"
                    style={landingInlineStyle(`background: ${r.color}; box-shadow: ${r.color} 0px 8px 24px -10px; z-index: 0;`)}
                    transition={{ type: "spring", stiffness: 380, damping: 28, mass: 0.85 }}
                  />
                ) : null}
                <Icon className="relative h-4 w-4" />
                <span className="relative whitespace-nowrap">{r.label}</span>
              </button>
            );
          })}
        </div>

        {/* Panel */}
        <div className="relative rounded-3xl overflow-hidden border border-slate-100 bg-gradient-to-br from-slate-50/80 to-white">
          <div
            aria-hidden
            className="absolute -top-32 -right-32 h-96 w-96 rounded-full blur-3xl opacity-25 pointer-events-none transition-[background] duration-300"
            style={landingInlineStyle(`background: radial-gradient(circle, ${role.color}, transparent 70%);`)}
          />
          <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 p-8 sm:p-10 lg:p-14">
            {/* Columna izquierda */}
            <div className="lg:col-span-6 relative">
              <div
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-5 transition-colors duration-300"
                style={landingInlineStyle(
                  `background: ${rgba(role.color, 0.08)}; border: 1px solid ${rgba(role.color, 0.145)};`,
                )}
              >
                <BadgeIcon className="h-3.5 w-3.5" />
                <span
                  className="font-mono text-[10px] uppercase tracking-[0.2em]"
                  style={landingInlineStyle(`color: ${role.color};`)}
                >
                  {role.badgeText}
                </span>
              </div>
              <motion.div
                key={`heading-${activeIdx}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              >
                <h3 className="text-[1.75rem] sm:text-3xl lg:text-4xl font-semibold text-slate-900 leading-[1.15] -tracking-[0.02em] mb-4">
                  {role.heading}
                </h3>
                <p className="text-[15px] sm:text-[16px] text-slate-600 leading-relaxed mb-7">
                  {role.description}
                </p>
                <ul className="space-y-3 mb-8">
                  {role.bullets.map((b, bi) => (
                    <li key={bi} className="flex items-start gap-3 text-[14px] text-slate-700">
                      <span
                        className="mt-1 inline-flex items-center justify-center h-4 w-4 rounded-full shrink-0"
                        style={landingInlineStyle(`background: ${rgba(role.color, 0.12)};`)}
                      >
                        <Check
                          className="h-2.5 w-2.5"
                          strokeWidth={3}
                          style={landingInlineStyle(`color: ${role.color};`)}
                        />
                      </span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
                <a
                  className="group inline-flex items-center gap-1.5 text-[14px] font-medium border-b pb-0.5 transition-colors"
                  href={role.linkHref}
                  style={landingInlineStyle(
                    `color: ${role.color}; border-color: ${rgba(role.color, 0.4)};`,
                  )}
                >
                  {role.linkText}
                  <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
              </motion.div>
            </div>

            {/* Columna derecha (mockup) */}
            <div className="lg:col-span-6 relative flex items-center justify-center min-h-[420px] lg:min-h-[520px]">
              <motion.div
                key={`mockup-${activeIdx}`}
                initial={{ opacity: 0, y: 14, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                className="w-full"
              >
                <ActiveMockup />
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
