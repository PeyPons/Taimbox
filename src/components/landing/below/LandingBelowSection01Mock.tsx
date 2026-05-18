import type { FC } from "react";
import { AlertTriangle } from "lucide-react";

import { useHomeLiteralT } from "@/components/landing/below/useHomeLiteralT";
import { i18nAsArray } from "@/lib/i18nReturnObjects";

const AVATAR_GRADIENTS = [
  "from-indigo-400 to-purple-500",
  "from-blue-400 to-cyan-500",
  "from-pink-400 to-rose-500",
  "from-emerald-400 to-teal-500",
] as const;

type S01Person = {
  initials: string;
  name: string;
  cells: string[];
};

function parseLoadPct(cell: string): number | null {
  if (cell === "—" || cell === "-") return null;
  const n = parseInt(cell.replace("%", "").trim(), 10);
  return Number.isFinite(n) ? n : 0;
}

function barFillClass(pct: number): string {
  if (pct > 100) return "bg-red-500";
  if (pct > 88) return "bg-amber-400";
  return "bg-emerald-500";
}

/** Mock del planificador — mismo lenguaje visual que `MockPlanningGrid` (PlannerArticle). */
export const LandingBelowSection01Mock: FC = () => {
  const { t } = useHomeLiteralT();
  const weekCols = i18nAsArray<string>(t("s01.weekCols", { returnObjects: true }));
  const weekDates = i18nAsArray<string>(t("s01.weekDates", { returnObjects: true }));
  const people = i18nAsArray<S01Person>(t("s01.people", { returnObjects: true }));

  const gridClass = weekCols.length === 4 ? "grid-cols-5" : "grid-cols-6";

  return (
    <div
      className="rounded-2xl border border-white/10 bg-slate-900 p-5 sm:p-6 shadow-2xl ring-1 ring-black/20 text-left"
      aria-hidden
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-x-4 gap-y-2 border-b border-white/10 pb-4">
        <div className="min-w-0">
          <p className="text-white font-semibold text-sm sm:text-[15px] leading-tight">
            {t("s01.plannerKicker")}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">{t("s01.plannerScope")}</p>
        </div>
        <span className="inline-flex items-center text-[11px] px-2.5 py-1 rounded-md bg-red-500/15 border border-red-500/20 text-red-200 font-medium whitespace-nowrap shrink-0">
          {t("s01.overloadBadge")}
        </span>
      </div>

      <div
        className={`grid ${gridClass} gap-1.5 mb-2 rounded-lg bg-slate-800/70 border border-slate-700/50 px-2 py-2.5 items-center`}
      >
        <div className="px-1">
          <span className="text-[11px] font-semibold text-slate-300 leading-none">
            {t("s01.gridEmployee")}
          </span>
        </div>
        {weekCols.map((w, i) => (
          <div key={w} className="text-center">
            <span className="block text-xs font-bold text-slate-200 leading-none">{w}</span>
            {weekDates[i] ? (
              <span className="block text-[10px] text-slate-400 leading-tight mt-1 font-medium">
                {weekDates[i]}
              </span>
            ) : null}
          </div>
        ))}
      </div>

      <div className="space-y-1.5">
        {people.map((emp, ei) => {
          const loads = emp.cells.map(parseLoadPct);
          const isOverloadRow = loads.some((p) => p !== null && p > 100);

          return (
            <div
              key={emp.initials}
              className={`grid ${gridClass} gap-1.5 items-center rounded-xl px-1.5 py-1.5 ${
                isOverloadRow
                  ? "bg-red-500/10 border border-red-500/25"
                  : "bg-slate-800/50 border border-slate-700/40"
              }`}
            >
              <div className="flex items-center gap-2 px-1 min-w-0">
                <div
                  className={`w-7 h-7 rounded-full bg-gradient-to-br ${AVATAR_GRADIENTS[ei] ?? AVATAR_GRADIENTS[0]} flex items-center justify-center text-[9px] font-bold text-white shrink-0`}
                >
                  {emp.initials}
                </div>
                <span className="text-[11px] text-white/90 font-medium truncate hidden sm:inline">
                  {emp.name}
                </span>
              </div>

              {emp.cells.map((cell, ci) => {
                const pct = loads[ci];
                if (pct === null) {
                  return (
                    <div key={ci} className="flex flex-col items-center justify-center gap-1 py-1.5">
                      <div className="w-full h-4 rounded-md bg-slate-700/40 border border-dashed border-slate-600/50" />
                      <span className="text-[9px] font-medium text-amber-400/90">{t("s01.absenceShort")}</span>
                    </div>
                  );
                }

                return (
                  <div key={ci} className="flex flex-col items-center gap-1 py-1">
                    <div className="w-full h-4 rounded-md bg-slate-700/50 relative overflow-hidden">
                      <div
                        className={`absolute inset-y-0 left-0 rounded-md ${barFillClass(pct)}`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                    <span
                      className={`text-[10px] font-mono tabular-nums ${
                        pct > 100 ? "text-red-400 font-semibold" : "text-white/75"
                      }`}
                    >
                      {cell}
                    </span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-red-500/10 border border-red-500/20 px-3.5 py-2.5">
        <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" aria-hidden />
        <p className="text-[11px] text-red-200/90 leading-relaxed">{t("s01.overloadAlert")}</p>
      </div>

      <div className="mt-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 rounded-xl bg-slate-800/40 border border-slate-700/50 px-4 py-3">
        <div>
          <p className="text-xs text-slate-400 font-medium">{t("s01.capacityLabel")}</p>
          <p className="text-2xl font-bold text-white tabular-nums tracking-tight mt-1">
            {t("s01.capacityPct")}
          </p>
        </div>
        <div className="sm:flex-1 sm:max-w-[14rem] sm:ml-6">
          <div className="flex items-baseline justify-between gap-2 mb-1.5">
            <span className="text-xs text-slate-400">{t("s01.capacityHoursLabel")}</span>
            <span className="text-xs font-mono text-slate-200 tabular-nums font-medium">
              {t("s01.capacityHoursValue")}
            </span>
          </div>
          <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
            <div className="h-full w-[93%] rounded-full bg-gradient-to-r from-indigo-400 to-violet-500" />
          </div>
        </div>
      </div>
    </div>
  );
};
