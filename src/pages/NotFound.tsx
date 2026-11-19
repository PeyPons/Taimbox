import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { localizedPathFromEs } from "@/i18n/publicPaths";

const NotFound = () => {
  const location = useLocation();
  const { t, i18n } = useTranslation("app");

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  const homePath = localizedPathFromEs("/", i18n.language);

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#14123B] text-white">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-amber-900/20 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-orange-950/35 blur-3xl" />
      </div>
      <LandingHeader />
      <main className="relative z-10 flex flex-1 items-center justify-center px-5 py-16">
        <div className="max-w-lg text-center">
          <h1 className="text-4xl font-black tracking-tight text-white">{t("notFound.title")}</h1>
          <p className="mt-3 text-lg text-indigo-100/90">{t("notFound.subtitle")}</p>
          <Link
            to={homePath}
            className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-5 text-sm font-medium text-white hover:from-indigo-700 hover:to-purple-700"
          >
            {t("notFound.cta")}
          </Link>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
};

export default NotFound;
