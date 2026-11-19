import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Menu, X } from "lucide-react";
import { localizedPathFromEs } from "@/i18n/publicPaths";
import { PublicWordmark } from "@/components/public/PublicMark";
import { FeaturesDropdown } from "./FeaturesDropdown";
import { LanguageSelector } from "./LanguageSelector";
import { cn } from "@/lib/utils";

const PRIMARY = [
  { hrefEs: "/para-quien", label: "audiences" },
  { hrefEs: "/precios", label: "pricing" },
  { hrefEs: "/guia", label: "guide" },
  { hrefEs: "/api-docs", label: "api" },
  { hrefEs: "/contacto", label: "contact" },
] as const;

const FEATURES = [
  { id: "employeeDashboard", hrefEs: "/dashboard-empleado" },
  { id: "resourcePlanner", hrefEs: "/planificador-recursos" },
  { id: "teamManagement", hrefEs: "/gestion-equipos" },
  { id: "reports", hrefEs: "/reportes-rentabilidad" },
  { id: "projects", hrefEs: "/control-proyectos" },
  { id: "integrations", hrefEs: "/integraciones" },
  { id: "ppc", hrefEs: "/monitor-ppc" },
  { id: "security", hrefEs: "/seguridad" },
] as const;

const navLink =
  "relative text-[13px] font-medium text-[#D4CEF0] px-2.5 py-2 rounded-md hover:text-white transition-colors after:absolute after:left-2.5 after:right-2.5 after:-bottom-0.5 after:h-px after:origin-left after:scale-x-0 after:bg-[#7C3AED] after:transition-transform hover:after:scale-x-100 focus-visible:outline-none";

export function PublicHeader() {
  const [open, setOpen] = useState(false);
  const { t, i18n } = useTranslation("landing");

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const path = (hrefEs: string) => localizedPathFromEs(hrefEs, i18n.language);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-[rgba(196,181,253,0.18)] bg-[#14123B]/92 backdrop-blur-xl">
        <div className="mx-auto flex h-full max-w-[1280px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <Link
            to={path("/")}
            className="shrink-0 rounded-md"
            onClick={() => setOpen(false)}
          >
            <PublicWordmark tone="paper" />
          </Link>

          <nav className="hidden lg:flex items-center gap-0.5" aria-label={t("header.featuresTrigger")}>
            <FeaturesDropdown variant="dark" />
            {PRIMARY.filter((item) => item.hrefEs !== "/api-docs").map((item) => (
              <Link key={item.hrefEs} to={path(item.hrefEs)} className={navLink}>
                {t(`header.${item.label}`)}
              </Link>
            ))}
            <Link to={path("/api-docs")} className={cn(navLink, "hidden xl:inline")}>
              {t("header.api")}
            </Link>
            <LanguageSelector surface="dark" />
            <Link
              to="/login"
              className="ml-2 inline-flex h-11 items-center rounded-full bg-[#7C3AED] px-4 text-[13px] font-medium text-white hover:bg-[#6D28D9]"
            >
              {t("header.login")}
            </Link>
          </nav>

          <div className="flex lg:hidden items-center">
            <Link
              to="/login"
              className="inline-flex h-11 items-center px-3 text-sm font-medium text-[#E7E2FB]"
            >
              {t("header.login")}
            </Link>
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-md text-[#E7E2FB] hover:text-white"
              aria-expanded={open}
              aria-controls="pub-menu"
              aria-label={t("header.menuAria")}
              onClick={() => setOpen((value) => !value)}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>
      <div className="h-16" />

      {open ? (
        <div
          id="pub-menu"
          className="lg:hidden fixed inset-x-0 bottom-0 top-16 z-40 overflow-y-auto bg-[#100E24]"
        >
          <div className="mx-auto grid max-w-5xl gap-10 px-5 py-8 sm:px-8 md:grid-cols-2">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#C4B5FD]">
                {t("header.featuresTrigger")}
              </p>
              <ul className="mt-3 border-t border-[rgba(196,181,253,0.18)]">
                {FEATURES.map((feature) => (
                  <li key={feature.hrefEs}>
                    <Link
                      to={path(feature.hrefEs)}
                      onClick={() => setOpen(false)}
                      className="group flex items-baseline justify-between gap-4 border-b border-[rgba(196,181,253,0.14)] py-3.5"
                    >
                      <span className="min-w-0 text-[17px] font-medium leading-snug text-white group-hover:text-[#C4B5FD]">
                        {t(`mobileFeatures.${feature.id}.title`)}
                      </span>
                      <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.16em] text-[#C4B5FD]">
                        {t(`mobileFeatures.${feature.id}.badge`)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col">
              <nav className="flex flex-col">
                {PRIMARY.map((item) => (
                  <Link
                    key={item.hrefEs}
                    to={path(item.hrefEs)}
                    onClick={() => setOpen(false)}
                    className="border-b border-[rgba(196,181,253,0.14)] py-3 text-[1.65rem] font-medium tracking-[-0.03em] text-white hover:text-[#C4B5FD]"
                  >
                    {t(`header.${item.label}`)}
                  </Link>
                ))}
              </nav>
              <div className="mt-8 flex items-center justify-between gap-4">
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#C4B5FD]">
                  {t("header.language", "Idioma")}
                </span>
                <LanguageSelector surface="dark" />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
