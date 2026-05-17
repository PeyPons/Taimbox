import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { localizedPathFromEs } from "@/i18n/publicPaths";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  LayoutDashboard,
  CalendarRange,
  Users,
  BarChart3,
  FolderKanban,
  Plug,
  ArrowRight,
  DollarSign,
  Shield,
} from "lucide-react";

const FEATURE_META = [
  {
    id: "employeeDashboard" as const,
    hrefEs: "/dashboard-empleado",
    badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    badgeLight: "bg-violet-50 text-violet-700 border-violet-200",
    icon: LayoutDashboard,
    gradient: "from-indigo-500 to-purple-500",
  },
  {
    id: "resourcePlanner" as const,
    hrefEs: "/planificador-recursos",
    badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
    badgeLight: "bg-indigo-50 text-indigo-700 border-indigo-200",
    icon: CalendarRange,
    gradient: "from-indigo-500 to-blue-500",
  },
  {
    id: "teamManagement" as const,
    hrefEs: "/gestion-equipos",
    badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    badgeLight: "bg-sky-50 text-sky-700 border-sky-200",
    icon: Users,
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    id: "reports" as const,
    hrefEs: "/reportes-rentabilidad",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    badgeLight: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: BarChart3,
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    id: "projects" as const,
    hrefEs: "/control-proyectos",
    badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    badgeLight: "bg-amber-50 text-amber-700 border-amber-200",
    icon: FolderKanban,
    gradient: "from-amber-500 to-orange-500",
  },
  {
    id: "integrations" as const,
    hrefEs: "/integraciones",
    badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    badgeLight: "bg-cyan-50 text-cyan-700 border-cyan-200",
    icon: Plug,
    gradient: "from-cyan-500 to-blue-500",
  },
  {
    id: "ppc" as const,
    hrefEs: "/monitor-ppc",
    badgeColor: "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30",
    badgeLight: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200",
    icon: DollarSign,
    gradient: "from-fuchsia-500 to-pink-500",
  },
  {
    id: "security" as const,
    hrefEs: "/seguridad",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    badgeLight: "bg-teal-50 text-teal-700 border-teal-200",
    icon: Shield,
    gradient: "from-emerald-500 to-teal-500",
  },
];

export type FeaturesDropdownVariant = "dark" | "light";

type FeaturesDropdownProps = {
  variant?: FeaturesDropdownVariant;
};

export function FeaturesDropdown({ variant = "dark" }: FeaturesDropdownProps) {
  const { t, i18n } = useTranslation("landing");
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const light = variant === "light";

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setIsOpen(false), 200);
  };

  const handleClick = () => setIsOpen(!isOpen);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, []);

  return (
    <div
      ref={dropdownRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          "flex items-center gap-1 font-medium transition-colors rounded-md",
          light
            ? "text-[13px] px-3 py-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-900/[0.04]"
            : "text-sm text-indigo-200 hover:text-white",
        )}
      >
        {t("header.featuresTrigger")}
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-300", isOpen && "rotate-180")} />
      </button>

      <div
        className={cn(
          "absolute top-full right-0 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 mt-3 transition-all duration-300 origin-top",
          isOpen
            ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
            : "opacity-0 scale-95 -translate-y-2 pointer-events-none",
        )}
      >
        <div
          className={cn(
            "absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 hidden sm:block",
            light ? "bg-white border-l border-t border-slate-200/70" : "bg-slate-900/95 border-l border-t border-white/15",
          )}
        />

        <div
          className={cn(
            "w-[340px] sm:w-[600px] rounded-2xl border overflow-hidden backdrop-blur-2xl",
            light
              ? "border-slate-200/70 bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.7),0_30px_80px_-20px_rgba(15,23,42,0.2),0_18px_48px_-22px_rgba(15,23,42,0.15)]"
              : "border-white/15 bg-slate-900/95 shadow-2xl shadow-black/40",
          )}
        >
          <div className={cn("px-5 pt-4 pb-3 border-b", light ? "border-slate-100" : "border-white/10")}>
            <p
              className={cn(
                "font-mono text-[10px] font-semibold uppercase tracking-[0.22em]",
                light ? "text-violet-700" : "text-xs tracking-wider text-indigo-300/90",
              )}
            >
              {t("features.exploreByRole")}
            </p>
            <p className={cn("text-[11px] mt-1", light ? "text-slate-500" : "text-[10px] text-slate-400 mt-0.5")}>
              {t("features.exploreSubtitle")}
            </p>
          </div>

          <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {FEATURE_META.map((feature) => {
              const Icon = feature.icon;
              const href = localizedPathFromEs(feature.hrefEs, i18n.language);
              return (
                <Link
                  key={feature.hrefEs}
                  to={href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "group flex items-start gap-3 rounded-xl p-3 transition-all duration-200",
                    light ? "hover:bg-slate-50" : "hover:bg-white/5",
                  )}
                >
                  <div
                    className={cn(
                      "w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br flex items-center justify-center transition-all duration-200",
                      feature.gradient,
                      light
                        ? "shadow-[0_8px_18px_-6px_rgba(99,102,241,0.45)] group-hover:scale-105"
                        : "shadow-lg group-hover:shadow-xl group-hover:scale-105",
                    )}
                  >
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p
                        className={cn(
                          "text-[13.5px] font-semibold truncate transition-colors",
                          light
                            ? "text-slate-900 group-hover:text-violet-700"
                            : "text-sm text-white group-hover:text-indigo-200",
                        )}
                      >
                        {t(`features.items.${feature.id}.title`)}
                      </p>
                    </div>
                    <p
                      className={cn(
                        "text-[11.5px] leading-snug mb-1",
                        light ? "text-slate-500 mb-1.5" : "text-[11px] text-slate-400 mb-1",
                      )}
                    >
                      {t(`features.items.${feature.id}.description`)}
                    </p>
                    <span
                      className={cn(
                        "inline-block font-mono text-[9px] font-bold uppercase tracking-[0.16em] px-2 py-0.5 rounded-full border",
                        light ? feature.badgeLight : feature.badgeColor,
                      )}
                    >
                      {t(`features.items.${feature.id}.badge`)}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>

          <div
            className={cn(
              "px-5 py-3 border-t flex items-center justify-between",
              light ? "border-slate-100 bg-slate-50/50" : "border-white/10 bg-white/[0.02]",
            )}
          >
            <Link
              to={localizedPathFromEs("/guia", i18n.language)}
              onClick={() => setIsOpen(false)}
              className={cn(
                "text-[12px] font-medium flex items-center gap-1 transition-colors",
                light ? "text-violet-700 hover:text-violet-900" : "text-xs text-indigo-300 hover:text-white",
              )}
            >
              {t("features.guideFull")}
              <ArrowRight className="h-3 w-3" />
            </Link>
            <Link
              to={localizedPathFromEs("/por-que-timeboxing", i18n.language)}
              onClick={() => setIsOpen(false)}
              className={cn(
                "text-[12px] transition-colors",
                light ? "text-slate-500 hover:text-slate-900" : "text-xs text-slate-400 hover:text-white",
              )}
            >
              {t("features.whyTaimbox")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
