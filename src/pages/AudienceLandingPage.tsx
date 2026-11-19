import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { localizedPathFromEs, pathEsToEn } from "@/i18n/publicPaths";
import { i18nAsArray } from "@/lib/i18nReturnObjects";
import { SeoTags } from "@/seo/SeoTags";

const SEGMENTS = [
  {
    id: "performance" as const,
    pathEs: "/agencias-performance",
    modules: [
      "/monitor-ppc",
      "/planificador-recursos",
      "/reportes-rentabilidad",
      "/gestion-equipos",
    ],
  },
  {
    id: "creative" as const,
    pathEs: "/estudios-creativos",
    modules: [
      "/planificador-recursos",
      "/control-proyectos",
      "/gestion-equipos",
      "/reportes-rentabilidad",
    ],
  },
  {
    id: "fullService" as const,
    pathEs: "/agencias-integrales",
    modules: [
      "/control-proyectos",
      "/planificador-recursos",
      "/reportes-rentabilidad",
      "/monitor-ppc",
    ],
  },
] as const;

type SegmentId = (typeof SEGMENTS)[number]["id"];

type Situation = { title: string; body: string };
type ModuleCopy = { label: string; note: string };

function usePublicLang(): "es" | "en" {
  const { i18n } = useTranslation("landing");
  return i18n.language.startsWith("en") ? "en" : "es";
}

function AudienceFrame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F7F8FC] text-[#14123B]">
      <LandingHeader />
      {children}
      <LandingFooter />
    </div>
  );
}

export function AudienceHubPage() {
  const { t, i18n } = useTranslation("landing");
  const lang = usePublicLang();

  return (
    <AudienceFrame>
      <SeoTags
        pathEs="/para-quien"
        pathEn={pathEsToEn("/para-quien")}
        title={t("audiences.hub.seoTitle")}
        description={t("audiences.hub.seoDescription")}
        lang={lang}
      />
      <main className="mx-auto max-w-[46rem] px-5 sm:px-8 pb-20 pt-8 sm:pt-12">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#7C3AED]">
          {t("audiences.hub.kicker")}
        </p>
        <h1 className="font-public mt-3 text-[2.5rem] leading-[1.05] tracking-[-0.03em] sm:text-[3.15rem]">
          {t("audiences.hub.title")}
        </h1>
        <p className="mt-5 max-w-[38rem] text-[1.05rem] leading-relaxed text-[#4A4868]">
          {t("audiences.hub.lede")}
        </p>
        <ul className="mt-12 border-t border-[#14123B]/15">
          {SEGMENTS.map((segment) => (
            <li key={segment.id}>
              <Link
                to={localizedPathFromEs(segment.pathEs, i18n.language)}
                className="group grid gap-2 border-b border-[#14123B]/15 py-7 sm:grid-cols-[11rem_1fr] sm:gap-6"
              >
                <span className="pt-1 font-mono text-[11px] uppercase tracking-[0.18em] text-[#7C3AED]">
                  {t(`audiences.${segment.id}.kicker`)}
                </span>
                <span>
                  <span className="font-public block text-[1.85rem] leading-tight tracking-[-0.03em] group-hover:text-[#7C3AED]">
                    {t(`audiences.${segment.id}.title`)}
                  </span>
                  <span className="mt-2 block max-w-[34rem] text-[15px] leading-relaxed text-[#4A4868]">
                    {t(`audiences.${segment.id}.cardLede`)}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-8 text-sm leading-relaxed text-[#5c564e]">
          {t("audiences.hub.footnoteBefore")}{" "}
          <Link
            to={localizedPathFromEs("/precios", i18n.language)}
            className="underline decoration-[#14123B]/30 underline-offset-4 hover:decoration-[#7C3AED]"
          >
            {t("header.pricing")}
          </Link>
          . {t("audiences.hub.footnoteAfter")}{" "}
          <Link
            to={localizedPathFromEs("/guia", i18n.language)}
            className="underline decoration-[#14123B]/30 underline-offset-4 hover:decoration-[#7C3AED]"
          >
            {t("header.guide")}
          </Link>
          .
        </p>
      </main>
    </AudienceFrame>
  );
}

function SegmentPage({ id }: { id: SegmentId }) {
  const { t, i18n } = useTranslation("landing");
  const lang = usePublicLang();
  const segment = SEGMENTS.find((item) => item.id === id);
  if (!segment) return null;

  const situations = i18nAsArray<Situation>(
    t(`audiences.${id}.situations`, { returnObjects: true }),
  );
  const moduleCopy = i18nAsArray<ModuleCopy>(
    t(`audiences.${id}.modules`, { returnObjects: true }),
  );
  const limits = i18nAsArray<string>(t(`audiences.${id}.limits`, { returnObjects: true }));
  const prefix = `audiences.${id}`;

  return (
    <AudienceFrame>
      <SeoTags
        pathEs={segment.pathEs}
        pathEn={pathEsToEn(segment.pathEs)}
        title={t(`${prefix}.seoTitle`)}
        description={t(`${prefix}.seoDescription`)}
        lang={lang}
      />
      <main className="mx-auto max-w-[42rem] px-5 pb-20 pt-8 sm:px-8 sm:pt-12">
        <p className="text-sm text-[#5c564e]">
          <Link
            to={localizedPathFromEs("/para-quien", i18n.language)}
            className="underline decoration-[#14123B]/25 underline-offset-4 hover:text-[#7C3AED]"
          >
            {t("audiences.nav")}
          </Link>
        </p>
        <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.22em] text-[#7C3AED]">
          {t(`${prefix}.kicker`)}
        </p>
        <h1 className="font-public mt-3 text-[2.35rem] leading-[1.08] tracking-[-0.03em] sm:text-[2.9rem]">
          {t(`${prefix}.title`)}
        </h1>
        <p className="mt-5 text-[1.05rem] leading-relaxed text-[#4A4868]">{t(`${prefix}.lede`)}</p>

        <h2 className="font-public mt-14 text-[1.7rem] tracking-[-0.02em]">
          {t(`${prefix}.situationsTitle`)}
        </h2>
        <ol className="mt-5 border-t border-[#14123B]/15">
          {situations.map((situation, index) => (
            <li
              key={situation.title}
              className="grid grid-cols-[2.4rem_1fr] gap-3 border-b border-[#14123B]/15 py-5"
            >
              <span className="font-mono text-sm text-[#7C3AED]">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="text-[1.02rem] font-medium">{situation.title}</h3>
                <p className="mt-1.5 text-[15px] leading-relaxed text-[#4A4868]">{situation.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <h2 className="font-public mt-14 text-[1.7rem] tracking-[-0.02em]">
          {t(`${prefix}.modulesTitle`)}
        </h2>
        <ul className="mt-4 border-t border-[#14123B]/15">
          {segment.modules.map((hrefEs, index) => {
            const copy = moduleCopy[index];
            if (!copy) return null;
            return (
              <li key={hrefEs}>
                <Link
                  to={localizedPathFromEs(hrefEs, i18n.language)}
                  className="block border-b border-[#14123B]/15 py-4 hover:text-[#7C3AED]"
                >
                  <span className="block font-medium">{copy.label}</span>
                  <span className="mt-1 block text-sm leading-relaxed text-[#5c564e]">{copy.note}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        <h2 className="font-public mt-14 text-[1.7rem] tracking-[-0.02em]">
          {t(`${prefix}.limitsTitle`)}
        </h2>
        <ul className="mt-4 space-y-3 text-[15px] leading-relaxed text-[#4A4868]">
          {limits.map((limit) => (
            <li key={limit} className="border-l border-[#7C3AED] pl-4">
              {limit}
            </li>
          ))}
        </ul>

        <div className="mt-16 border-t border-[#14123B]/15 pt-8">
          <h2 className="font-public text-[1.7rem] tracking-[-0.02em]">{t(`${prefix}.ctaTitle`)}</h2>
          <p className="mt-3 max-w-[36rem] text-[15px] leading-relaxed text-[#4A4868]">
            {t(`${prefix}.ctaBody`)}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to={localizedPathFromEs("/precios", i18n.language)}
              className="inline-flex items-center bg-[#14123B] px-4 py-2.5 text-sm text-[#F7F8FC] hover:bg-[#3a332c]"
            >
              {t("header.pricing")}
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center border border-[#14123B] px-4 py-2.5 text-sm hover:border-[#7C3AED] hover:text-[#7C3AED]"
            >
              {t("header.login")}
            </Link>
          </div>
        </div>
      </main>
    </AudienceFrame>
  );
}

export function PerformanceAudiencePage() {
  return <SegmentPage id="performance" />;
}

export function CreativeAudiencePage() {
  return <SegmentPage id="creative" />;
}

export function FullServiceAudiencePage() {
  return <SegmentPage id="fullService" />;
}
