import type { FC } from "react";
import { Activity, Database, Earth, Eye, Lock, Shield } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { landingInlineStyle } from "@/components/landing/below/landingInlineStyle";
import { useHomeLiteralT } from "@/components/landing/below/useHomeLiteralT";
import { i18nAsArray } from "@/lib/i18nReturnObjects";

type SecurityCard = { title: string; body: string };

const CARD_SHELLS = [
  {
    border: "rgba(5, 150, 105, 0.145)",
    shadow: "rgba(5, 150, 105, 0.2)",
    gradient:
      "linear-gradient(135deg, rgb(5, 150, 105), rgba(5, 150, 105, 0.8))",
    glow: "rgba(5, 150, 105, 0.5)",
    icon: Shield,
  },
  {
    border: "rgba(8, 145, 178, 0.145)",
    shadow: "rgba(8, 145, 178, 0.2)",
    gradient:
      "linear-gradient(135deg, rgb(8, 145, 178), rgba(8, 145, 178, 0.8))",
    glow: "rgba(8, 145, 178, 0.5)",
    icon: Lock,
  },
  {
    border: "rgba(124, 58, 237, 0.145)",
    shadow: "rgba(124, 58, 237, 0.2)",
    gradient:
      "linear-gradient(135deg, rgb(124, 58, 237), rgba(124, 58, 237, 0.8))",
    glow: "rgba(124, 58, 237, 0.5)",
    icon: Eye,
  },
  {
    border: "rgba(219, 39, 119, 0.145)",
    shadow: "rgba(219, 39, 119, 0.2)",
    gradient:
      "linear-gradient(135deg, rgb(219, 39, 119), rgba(219, 39, 119, 0.8))",
    glow: "rgba(219, 39, 119, 0.5)",
    icon: Earth,
  },
] as const;

const TRUST_ICONS: { icon: LucideIcon; color: string }[] = [
  { icon: Shield, color: "text-emerald-600" },
  { icon: Lock, color: "text-cyan-600" },
  { icon: Database, color: "text-violet-600" },
  { icon: Earth, color: "text-pink-600" },
  { icon: Activity, color: "text-amber-600" },
  { icon: Database, color: "text-indigo-600" },
  { icon: Eye, color: "text-slate-600" },
];

/* ─────── Audit Log Mockup ─────── */

const AUDIT_EVENTS = [
  { time: "14:32", user: "MG", color: "rgb(251,113,133)", action: "Login exitoso", ip: "82.34.xx.xx", status: "ok" as const },
  { time: "14:28", user: "CR", color: "rgb(251,146,60)", action: "Export CSV — Horas mayo", ip: "91.12.xx.xx", status: "ok" as const },
  { time: "14:15", user: "SY", color: "rgb(16,185,129)", action: "OAuth Google Ads — solo lectura", ip: "—", status: "ok" as const },
  { time: "13:58", user: "??", color: "rgb(148,163,184)", action: "Login fallido (2FA incorrecto)", ip: "45.89.xx.xx", status: "blocked" as const },
  { time: "13:41", user: "AM", color: "rgb(167,139,250)", action: "Backup cifrado completado", ip: "interno", status: "ok" as const },
] as const;

const AuditLogMockup: FC = () => (
  <div className="relative w-full mx-auto max-w-lg" style={landingInlineStyle("perspective: 1200px;")}>
    <div className="relative rounded-2xl bg-white border border-slate-200/80 overflow-hidden" style={landingInlineStyle("transform: rotateY(3deg) rotateX(1deg); transform-style: preserve-3d; box-shadow: rgba(5,150,105,0.25) 0px 30px 70px -20px, rgba(15,23,42,0.15) 0px 18px 36px -16px;")}>
      <div className="flex">
        <div className="hidden sm:flex w-10 bg-slate-900 flex-col items-center py-2.5 gap-2 shrink-0 border-r border-slate-800">
          <div className="h-5 w-5 rounded-md bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center mb-0.5" style={landingInlineStyle("box-shadow: rgba(124,58,237,0.35) 0px 3px 8px -2px;")}>
            <span className="text-white text-[7px] font-bold">T</span>
          </div>
          <div className="h-5 w-5 rounded-md flex items-center justify-center text-slate-500"><svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg></div>
          <div className="h-5 w-5 rounded-md flex items-center justify-center text-slate-500"><svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg></div>
          <div className="h-5 w-5 rounded-md bg-slate-800 flex items-center justify-center text-white"><svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" /></svg></div>
        </div>
        <div className="flex-1 min-w-0 relative p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">Audit Log</div>
              <div className="text-[13px] font-semibold text-slate-900 mt-0.5">Últimos eventos · Hoy</div>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" style={landingInlineStyle("box-shadow: 0 0 6px rgb(16,185,129);")} />
              <span className="font-mono text-[9px] text-emerald-700">RLS activo</span>
            </div>
          </div>
          <div className="space-y-1">
            {AUDIT_EVENTS.map((ev, i) => (
              <div key={i} className="grid grid-cols-[32px_1fr_auto] gap-2 items-center p-1.5 rounded-lg" style={landingInlineStyle(ev.status === "blocked" ? "background: rgba(254,242,242,0.6); border: 1px solid rgba(239,68,68,0.12);" : "background: rgba(248,250,252,0.6); border: 1px solid rgba(226,232,240,0.5);")}>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[9px] text-slate-400 tabular-nums">{ev.time}</span>
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-4 w-4 rounded-md flex items-center justify-center text-white text-[7px] font-bold shrink-0" style={landingInlineStyle(`background: ${ev.color};`)}>{ev.user}</div>
                  <span className="text-[11px] text-slate-700 truncate">{ev.action}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[9px] text-slate-400">{ev.ip}</span>
                  <span className="h-1.5 w-1.5 rounded-full" style={landingInlineStyle(ev.status === "ok" ? "background: rgb(16,185,129);" : "background: rgb(239,68,68); box-shadow: 0 0 6px rgba(239,68,68,0.6);")} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3 text-[9px] text-slate-500">
              <span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Éxito</span>
              <span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-rose-500" /> Bloqueado</span>
            </div>
            <span className="font-mono text-[9px] text-slate-400">agency_id: a7f3…</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

/** Sección 06 (seguridad). */
export const LandingBelowSection06: FC = () => {
  const { t, path } = useHomeLiteralT();
  const cards = i18nAsArray<SecurityCard>(
    t("s06.cards", { returnObjects: true }),
  );
  const trustStrip = i18nAsArray<string>(
    t("s06.trustStrip", { returnObjects: true }),
  );

  return (
    <section
      className="relative overflow-hidden"
      style={landingInlineStyle(
        "background: radial-gradient(70% 50% at 30% 20%, rgba(167, 243, 208, 0.3), transparent 60%), radial-gradient(70% 50% at 80% 80%, rgba(165, 243, 252, 0.25), transparent 60%), linear-gradient(rgb(240, 253, 244) 0%, rgb(236, 253, 245) 60%, rgb(240, 253, 244) 100%); padding-top: clamp(6rem, 12vw, 10rem); padding-bottom: clamp(7rem, 13vw, 11rem);",
      )}
    >
      <div className="relative max-w-6xl mx-auto px-6 lg:px-10">
        <div
          className="max-w-3xl mb-14 mx-auto text-center"
          style={landingInlineStyle("opacity: 1; transform: none;")}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-200 bg-emerald-50 mb-5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]" />
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-emerald-700">
              {t("s06.badge")}
            </span>
          </div>
          <h2 className="text-[2rem] sm:text-4xl lg:text-5xl font-semibold text-slate-900 leading-[1.1] -tracking-[0.02em] mb-5">
            {t("s06.title")}{" "}
            <span className="bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
              {t("s06.titleHighlight")}
            </span>
            {t("s06.titleSuffix")}
          </h2>
          <p className="text-[15px] sm:text-[16px] text-slate-600 leading-relaxed">
            {t("s06.subtitle")}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-12">
          {cards.map((card, i) => {
            const shell = CARD_SHELLS[i];
            if (!shell) return null;
            const Icon = shell.icon;
            return (
              <div
                key={card.title}
                className="relative rounded-2xl p-6 sm:p-7 bg-white"
                style={landingInlineStyle(
                  `border: 1px solid ${shell.border}; box-shadow: rgba(15, 23, 42, 0.04) 0px 1px 2px, ${shell.shadow} 0px 16px 40px -20px; opacity: 1; transform: none;`,
                )}
              >
                <div
                  className="h-11 w-11 rounded-xl flex items-center justify-center mb-4"
                  style={landingInlineStyle(
                    `background: ${shell.gradient}; box-shadow: ${shell.glow} 0px 10px 24px -8px;`,
                  )}
                >
                  <Icon
                    className="h-5 w-5 text-white"
                    strokeWidth={2}
                    aria-hidden
                  />
                </div>
                <h3 className="text-[17px] font-semibold text-slate-900 mb-2">
                  {card.title}
                </h3>
                <p className="text-[13.5px] text-slate-600 leading-relaxed">
                  {card.body}
                </p>
              </div>
            );
          })}
        </div>
        {/* Audit Log Mockup */}
        <div className="mb-12 flex justify-center">
          <AuditLogMockup />
        </div>
        <div
          className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-[12px] uppercase tracking-[0.18em] font-medium text-slate-500"
          style={landingInlineStyle("opacity: 1;")}
        >
          {trustStrip.map((label, i) => {
            const shell = TRUST_ICONS[i];
            if (!shell) return null;
            const Icon = shell.icon;
            return (
              <span key={label} className="inline-flex items-center gap-1.5">
                <Icon className={`h-3.5 w-3.5 ${shell.color}`} aria-hidden />
                {label}
              </span>
            );
          })}
        </div>
        <div className="mt-10 text-center">
          <a
            className="group inline-flex items-center gap-1.5 text-[14px] font-medium text-slate-700 hover:text-slate-900 border-b border-slate-300 hover:border-slate-700 pb-0.5 transition-colors"
            href={path(t("s06.securityHref"))}
          >
            {t("s06.securityLink")}
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
      <svg
        aria-hidden
        className="absolute left-0 right-0 bottom-0 w-full pointer-events-none h-14 sm:h-20"
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
      >
        <path
          d="M0,120 C320,60 1120,0 1440,60 L1440,120 L0,120 Z"
          fill="#faf5e8"
        />
      </svg>
    </section>
  );
};
