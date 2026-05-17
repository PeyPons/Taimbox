import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { localizedPathFromEs } from "@/i18n/publicPaths";
import { cn } from "@/lib/utils";
import {
  Calendar,
  Menu,
  X,
  ArrowRight,
  LayoutDashboard,
  CalendarRange,
  Users,
  BarChart3,
  FolderKanban,
  Plug,
  DollarSign,
  Shield,
} from "lucide-react";
import { FeaturesDropdown } from "./FeaturesDropdown";
import { LanguageSelector } from "./LanguageSelector";

const MOBILE_FEATURE_META = [
  { id: "employeeDashboard" as const, hrefEs: "/dashboard-empleado", icon: LayoutDashboard, gradient: "from-indigo-500 to-purple-500" },
  { id: "resourcePlanner" as const, hrefEs: "/planificador-recursos", icon: CalendarRange, gradient: "from-indigo-500 to-blue-500" },
  { id: "teamManagement" as const, hrefEs: "/gestion-equipos", icon: Users, gradient: "from-blue-500 to-cyan-500" },
  { id: "reports" as const, hrefEs: "/reportes-rentabilidad", icon: BarChart3, gradient: "from-emerald-500 to-teal-500" },
  { id: "projects" as const, hrefEs: "/control-proyectos", icon: FolderKanban, gradient: "from-amber-500 to-orange-500" },
  { id: "integrations" as const, hrefEs: "/integraciones", icon: Plug, gradient: "from-cyan-500 to-blue-500" },
  { id: "ppc" as const, hrefEs: "/monitor-ppc", icon: DollarSign, gradient: "from-fuchsia-500 to-pink-500" },
  { id: "security" as const, hrefEs: "/seguridad", icon: Shield, gradient: "from-emerald-500 to-teal-500" },
];

export type LandingHeaderVariant = "dark" | "light";

export type LandingHeaderProps = {
  variant?: LandingHeaderVariant;
};

export function LandingHeader({ variant = "dark" }: LandingHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t, i18n } = useTranslation("landing");
  const light = variant === "light";
  const navBp = light ? "md" : "sm";
  const topOffset = light ? "top-[68px]" : "top-[57px]";
  const spacerH = light ? "h-[68px]" : "h-14";

  const navLinkClass = light
    ? "group relative text-[14px] font-medium px-3.5 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
    : "text-sm text-indigo-200 hover:text-white transition-colors";

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 w-full transition-shadow duration-200",
          light ? "border-b border-slate-900/[0.06] bg-white" : "border-b border-white/10 bg-indigo-950/90 backdrop-blur-xl",
        )}
      >
        <div
          className={cn(
            "mx-auto flex items-center justify-between",
            light ? "max-w-[1280px] px-5 sm:px-8 h-[68px]" : "max-w-7xl px-4 sm:px-6 lg:px-8 h-14",
          )}
        >
          <Link
            to={localizedPathFromEs("/", i18n.language)}
            className={cn(
              "group flex shrink-0 items-center gap-2.5 font-semibold transition-colors",
              light ? "text-[16px] -tracking-[0.012em] text-slate-900 hover:text-slate-900" : "gap-2 text-lg font-bold text-white hover:text-indigo-200",
            )}
          >
            {light ? (
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden className="shrink-0">
                <circle cx="11" cy="11" r="9" stroke="rgba(15,23,42,0.30)" strokeWidth="1" fill="none" />
                <circle cx="11" cy="11" r="4.5" stroke="rgba(15,23,42,0.15)" strokeWidth="0.75" fill="none" strokeDasharray="1.5 2" />
                <g style={{ transformOrigin: "50% 50%", transformBox: "fill-box", animation: "spin 24s linear infinite" }} className="motion-reduce:animate-none">
                  <line x1="11" y1="11" x2="11" y2="3.5" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" />
                  <circle cx="11" cy="3.5" r="1.6" fill="#a855f7" />
                </g>
                <circle cx="11" cy="11" r="1.4" fill="rgba(124,58,237,0.95)" />
              </svg>
            ) : null}
            {!light && <Calendar className="h-5 w-5 shrink-0 text-indigo-400" />}
            <span className="leading-none">Taimbox</span>
          </Link>

          <div className={cn(`hidden ${navBp}:flex items-center`, light ? "gap-1" : "gap-4")}>
            <FeaturesDropdown variant={variant} />
            <Link to={localizedPathFromEs("/precios", i18n.language)} className={navLinkClass}>
              {t("header.pricing")}
            </Link>
            <Link to={localizedPathFromEs("/guia", i18n.language)} className={navLinkClass}>
              {t("header.guide")}
            </Link>
            <Link to={localizedPathFromEs("/api-docs", i18n.language)} className={navLinkClass}>
              {t("header.api")}
            </Link>
            <Link to={localizedPathFromEs("/contacto", i18n.language)} className={navLinkClass}>
              {t("header.contact")}
            </Link>
            <div className={light ? "hidden sm:block" : ""}>
              <LanguageSelector surface={light ? "light" : "dark"} />
            </div>
            <Link to="/login" className="group">
              <Button
                size="sm"
                className={cn(
                  light
                    ? "relative h-10 px-5 rounded-lg bg-slate-900 text-white text-[14px] font-medium hover:bg-slate-800 transition-colors"
                    : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white",
                )}
              >
                {t("header.login")}
                <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </Link>
          </div>

          <div className={cn(`flex ${navBp}:hidden items-center shrink-0`, light ? "gap-3" : "gap-2")}>
            <Link to="/login" className="group">
              <Button
                size="sm"
                className={cn(
                  light
                    ? "h-10 px-5 rounded-lg bg-slate-900 text-white text-[14px] font-medium hover:bg-slate-800"
                    : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs px-3",
                )}
              >
                {t("header.login")}
              </Button>
            </Link>
            <LanguageSelector surface={light ? "light" : "dark"} />
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className={cn(
                "inline-flex items-center justify-center rounded-lg transition-colors",
                light ? "md:hidden h-10 w-10 text-slate-700 hover:text-slate-900 hover:bg-slate-100" : "p-1.5 text-indigo-200 hover:text-white hover:bg-white/10",
              )}
              aria-label={t("header.menuAria")}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>
      <div className={spacerH} />

      <div
        className={cn(
          `${navBp}:hidden fixed inset-x-0 z-40 transition-all duration-300`,
          topOffset,
          mobileOpen ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-4 pointer-events-none",
        )}
      >
        <div
          className={cn(
            "fixed inset-x-0 backdrop-blur-sm transition-opacity duration-300",
            topOffset,
            light ? "bg-slate-900/30" : "bg-black/60",
            mobileOpen ? "opacity-100" : "opacity-0",
          )}
          onClick={() => setMobileOpen(false)}
          role="presentation"
        />

        <div
          className={cn(
            "relative mx-3 mt-2 max-h-[78vh] overflow-y-auto overflow-hidden rounded-2xl border backdrop-blur-2xl",
            light
              ? "border-slate-200/70 bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.7),0_30px_80px_-20px_rgba(15,23,42,0.2),0_18px_48px_-22px_rgba(15,23,42,0.15)]"
              : "border-white/15 bg-slate-900/98 shadow-2xl shadow-black/50 max-h-[70vh]",
          )}
        >
          <div className={cn("px-4 py-3.5 flex flex-wrap gap-2 border-b", light ? "border-slate-100" : "border-white/10")}>
            {(["/precios", "/guia", "/api-docs", "/contacto"] as const).map((path) => (
              <Link
                key={path}
                to={localizedPathFromEs(path, i18n.language)}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex-1 min-w-[80px] rounded-xl py-2 text-center text-[13px] font-medium transition-colors",
                  light
                    ? "border border-slate-200/60 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                    : "rounded-lg border border-white/10 bg-white/5 text-indigo-200 hover:text-white",
                )}
              >
                {path === "/precios" && t("header.pricing")}
                {path === "/guia" && t("header.guide")}
                {path === "/api-docs" && t("header.api")}
                {path === "/contacto" && t("header.contact")}
              </Link>
            ))}
          </div>

          <div className="px-3 py-3">
            <div className="mb-2 flex items-center gap-2 px-2">
              <span className={cn("h-1 w-1 rounded-full", light ? "bg-violet-500" : "bg-indigo-400")} />
              <p className={cn("text-[10px] font-semibold uppercase tracking-[0.18em]", light ? "text-slate-500" : "text-indigo-300/80")}>
                {t("header.featuresTrigger")}
              </p>
            </div>
            <div className="space-y-1">
              {MOBILE_FEATURE_META.map((feature) => {
                const Icon = feature.icon;
                const href = localizedPathFromEs(feature.hrefEs, i18n.language);
                return (
                  <Link
                    key={feature.hrefEs}
                    to={href}
                    onClick={() => setMobileOpen(false)}
                    className={cn("flex items-center gap-3 rounded-xl p-2.5 transition-colors", light ? "hover:bg-slate-50" : "hover:bg-white/5")}
                  >
                    <div
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br shadow-[0_6px_14px_-6px_rgba(99,102,241,0.5)]",
                        feature.gradient,
                      )}
                    >
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={cn("truncate text-sm font-medium", light ? "text-slate-900" : "text-white")}>
                        {t(`mobileFeatures.${feature.id}.title`)}
                      </p>
                      <p className={cn("text-[10px]", light ? "text-slate-500" : "text-white/50")}>{t(`mobileFeatures.${feature.id}.badge`)}</p>
                    </div>
                    <ArrowRight className={cn("h-3.5 w-3.5", light ? "text-slate-400" : "text-slate-500")} />
                  </Link>
                );
              })}
            </div>
          </div>

          {light && (
            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
              <span className="text-[11px] font-mono uppercase tracking-[0.18em] text-slate-400">Idioma</span>
              <LanguageSelector surface="light" />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
