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

function HoursMock() {
  const rows = [
    ["MA", "María", "6h", "8h", "7h"],
    ["CR", "Carlos", "11h", "8h", "9h"],
    ["AN", "Ana", "6h", "—", "8h"],
  ];
  return (
    <div className="rounded-2xl border border-[#E4DDD0] bg-[#F7F4EC] p-4 text-[#14123B] sm:p-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#3C3858]">Planificador · semana</p>
      <div className="mt-3 grid grid-cols-[5.5rem_repeat(3,1fr)] gap-1.5 text-center font-mono text-[10px] text-[#3C3858]">
        <span />
        <span>S1</span>
        <span>S2</span>
        <span>S3</span>
        {rows.map((row) => (
          <div key={row[0]} className="contents">
            <span className="truncate text-left text-[12px] font-medium text-[#14123B]">{row[1]}</span>
            {row.slice(2).map((hours, index) => (
              <span
                key={row[0] + index}
                className="rounded-md border border-[#E4DDD0] bg-white py-1.5 tabular-nums"
              >
                {hours}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function PaceMock() {
  const weeks = [
    ["S1", 22],
    ["S2", 48],
    ["S3", 71],
    ["S4", 96],
  ];
  return (
    <div className="rounded-2xl border border-[#E4DDD0] bg-[#F7F4EC] p-4 text-[#14123B] sm:p-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#3C3858]">Monitor · gasto del mes</p>
      <div className="mt-4 space-y-2">
        {weeks.map(([label, width]) => (
          <div key={label} className="grid grid-cols-[2rem_1fr] items-center gap-2">
            <span className="font-mono text-[10px] text-[#3C3858]">{label}</span>
            <span className="h-2 overflow-hidden rounded-full bg-[#E4DDD0]">
              <span className="block h-full rounded-full bg-[#7C3AED]" style={{ width: `${width}%` }} />
            </span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-[#3C3858]">Gasto acumulado frente al ritmo lineal. Última sincronización.</p>
    </div>
  );
}

function MarginMock() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-2xl border border-[#E4DDD0] bg-[#F7F4EC] p-4 text-[#14123B]">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#3C3858]">Trabajo</p>
        <p className="mt-2 text-2xl font-semibold tabular-nums">Ingreso</p>
        <p className="mt-1 text-sm text-[#3C3858]">Devengado del proyecto, junto al coste del tiempo imputado.</p>
      </div>
      <div className="rounded-2xl border border-[#E4DDD0] bg-[#F7F4EC] p-4 text-[#14123B]">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#3C3858]">Medios</p>
        <p className="mt-2 text-2xl font-semibold tabular-nums">Ads</p>
        <p className="mt-1 text-sm text-[#3C3858]">Gasto del cliente, aparte del margen de la agencia.</p>
      </div>
    </div>
  );
}

const PROFILE_MOCK = {
  performance: PaceMock,
  creative: HoursMock,
  fullService: MarginMock,
} as const;

function AudienceFrame({ children }: { children: ReactNode }) {
  return (
    <div className="pub-stage relative min-h-screen overflow-x-clip bg-[#14123B] text-white">
      <div className="relative z-10">
        <LandingHeader />
        {children}
        <LandingFooter variant="stage" />
      </div>
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
      <main className="mx-auto max-w-6xl px-5 pb-16 pt-8 sm:px-8 sm:pt-10">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#C4B5FD]">
          {t("audiences.hub.kicker")}
        </p>
        <h1 className="mt-3 max-w-3xl text-[2.4rem] font-semibold leading-[1.05] tracking-[-0.03em] text-white sm:text-5xl">
          {t("audiences.hub.title")}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#D4CEF0] sm:text-lg">
          {t("audiences.hub.lede")}
        </p>
        <div className="mt-8 space-y-6">
          {SEGMENTS.map((segment) => {
            const Mock = PROFILE_MOCK[segment.id];
            const situations = i18nAsArray<Situation>(
              t(`audiences.${segment.id}.situations`, { returnObjects: true }),
            );
            const problem = situations[0];
            return (
              <section
                key={segment.id}
                className="grid items-center gap-6 border-t border-[rgba(196,181,253,0.22)] py-8 lg:grid-cols-12 lg:gap-10"
              >
                <div className="lg:col-span-5">
                  <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#C4B5FD]">
                    {t(`audiences.${segment.id}.kicker`)}
                  </p>
                  <h2 className="mt-2 text-[1.7rem] font-semibold leading-tight tracking-[-0.03em] text-white sm:text-3xl">
                    {t(`audiences.${segment.id}.title`)}
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-[#D4CEF0] sm:text-[15px]">
                    {t(`audiences.${segment.id}.lede`)}
                  </p>
                  {problem ? (
                    <p className="mt-4 border-l border-[#7C3AED] pl-3 text-sm leading-relaxed text-white">
                      <span className="font-medium">{problem.title}. </span>
                      {problem.body}
                    </p>
                  ) : null}
                  <Link
                    to={localizedPathFromEs(segment.pathEs, i18n.language)}
                    className="mt-5 inline-flex h-11 items-center rounded-full bg-[#F7F4EC] px-5 text-sm font-semibold text-[#14123B] hover:bg-white"
                  >
                    {t("audiences.hub.profileCta")}
                  </Link>
                </div>
                <div className="lg:col-span-7">
                  <Mock />
                </div>
              </section>
            );
          })}
        </div>
        <p className="mt-4 text-sm leading-relaxed text-[#D4CEF0]">
          {t("audiences.hub.footnoteBefore")}{" "}
          <Link
            to={localizedPathFromEs("/precios", i18n.language)}
            className="underline decoration-white/40 underline-offset-4 hover:decoration-violet-300"
          >
            {t("header.pricing")}
          </Link>
          . {t("audiences.hub.footnoteAfter")}{" "}
          <Link
            to={localizedPathFromEs("/guia", i18n.language)}
            className="underline decoration-white/40 underline-offset-4 hover:decoration-violet-300"
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
        <p className="text-sm text-indigo-200/80">
          <Link
            to={localizedPathFromEs("/para-quien", i18n.language)}
            className="underline decoration-white/40 underline-offset-4 hover:text-violet-200"
          >
            {t("audiences.nav")}
          </Link>
        </p>
        <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.22em] text-violet-300">
          {t(`${prefix}.kicker`)}
        </p>
        <h1 className="font-public mt-3 text-[2.35rem] leading-[1.08] tracking-[-0.03em] sm:text-[2.9rem]">
          {t(`${prefix}.title`)}
        </h1>
        <p className="mt-5 text-[1.05rem] leading-relaxed text-indigo-100/90">{t(`${prefix}.lede`)}</p>

        <h2 className="font-public mt-14 text-[1.7rem] tracking-[-0.02em]">
          {t(`${prefix}.situationsTitle`)}
        </h2>
        <ol className="mt-5 border-t border-white/15">
          {situations.map((situation, index) => (
            <li
              key={situation.title}
              className="grid grid-cols-[2.4rem_1fr] gap-3 border-b border-white/15 py-5"
            >
              <span className="font-mono text-sm text-violet-300">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="text-[1.02rem] font-medium">{situation.title}</h3>
                <p className="mt-1.5 text-[15px] leading-relaxed text-indigo-100/90">{situation.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <h2 className="font-public mt-14 text-[1.7rem] tracking-[-0.02em]">
          {t(`${prefix}.modulesTitle`)}
        </h2>
        <ul className="mt-4 border-t border-white/15">
          {segment.modules.map((hrefEs, index) => {
            const copy = moduleCopy[index];
            if (!copy) return null;
            return (
              <li key={hrefEs}>
                <Link
                  to={localizedPathFromEs(hrefEs, i18n.language)}
                  className="block border-b border-white/15 py-4 hover:text-violet-300"
                >
                  <span className="block font-medium">{copy.label}</span>
                  <span className="mt-1 block text-sm leading-relaxed text-indigo-200/80">{copy.note}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        <h2 className="font-public mt-14 text-[1.7rem] tracking-[-0.02em]">
          {t(`${prefix}.limitsTitle`)}
        </h2>
        <ul className="mt-4 space-y-3 text-[15px] leading-relaxed text-indigo-100/90">
          {limits.map((limit) => (
            <li key={limit} className="border-l border-violet-300 pl-4">
              {limit}
            </li>
          ))}
        </ul>

        <div className="mt-16 border-t border-white/15 pt-8">
          <h2 className="font-public text-[1.7rem] tracking-[-0.02em]">{t(`${prefix}.ctaTitle`)}</h2>
          <p className="mt-3 max-w-[36rem] text-[15px] leading-relaxed text-indigo-100/90">
            {t(`${prefix}.ctaBody`)}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to={localizedPathFromEs("/precios", i18n.language)}
              className="inline-flex h-11 items-center rounded-full bg-[#F7F4EC] px-5 text-sm font-semibold text-[#14123B] hover:bg-white"
            >
              {t("header.pricing")}
            </Link>
            <a
              href="/login"
              className="inline-flex h-11 items-center rounded-full border border-[rgba(196,181,253,0.4)] px-5 text-sm text-white hover:border-[#C4B5FD]"
            >
              {t("header.login")}
            </a>
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
