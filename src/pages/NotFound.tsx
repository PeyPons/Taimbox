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
    <div className="pub-light flex min-h-screen flex-col bg-[#F7F8FC] text-[#14123B]">
      <LandingHeader />
      <main className="flex flex-1 items-center justify-center px-5 py-16">
        <div className="max-w-lg text-center">
          <h1 className="font-display text-4xl font-bold tracking-[-0.02em]">{t("notFound.title")}</h1>
          <p className="mt-3 text-lg text-[#4A4868]">{t("notFound.subtitle")}</p>
          <Link to={homePath} className="pub-btn pub-btn-primary mt-6">
            {t("notFound.cta")}
          </Link>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
};

export default NotFound;
