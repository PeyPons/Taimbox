import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { localizedPathFromEs } from "@/i18n/publicPaths";
import { i18nAsArray } from "@/lib/i18nReturnObjects";
import { SeoTags } from "@/seo/SeoTags";
import { PRICING_HOME_PLAN_IDS } from "@/config/publicPricingLayout";
import {
  PUBLIC_PLAN_LABELS,
  PUBLIC_PLAN_PRICING,
  type PublicPlanId,
} from "@/config/publicPricing";

const FEATURES: { id: string; hrefEs: string }[] = [
  { id: "employee", hrefEs: "/dashboard-empleado" },
  { id: "planner", hrefEs: "/planificador-recursos" },
  { id: "team", hrefEs: "/gestion-equipos" },
  { id: "reports", hrefEs: "/reportes-rentabilidad" },
  { id: "projects", hrefEs: "/control-proyectos" },
  { id: "integrations", hrefEs: "/integraciones" },
  { id: "ppc", hrefEs: "/monitor-ppc" },
];

const HOME_PLANS = PRICING_HOME_PLAN_IDS;

function planPrice(id: PublicPlanId): string {
  const plan = PUBLIC_PLAN_PRICING.find((item) => item.id === id);
  if (!plan || plan.usdMonthly == null) return "—";
  return `${plan.usdMonthly} USD`;
}

function planLink(id: PublicPlanId, language: string): string {
  const href = PUBLIC_PLAN_PRICING.find((item) => item.id === id)?.href ?? "/contacto";
  if (href.startsWith("/login")) return href;
  return localizedPathFromEs(href, language);
}

/** Portada según el wireframe de Inés. El título no se anima. */
export function PublicHome() {
  const { t, i18n } = useTranslation("landing");
  const lang = i18n.language.startsWith("en") ? "en" : "es";
  const steps = i18nAsArray<{ title: string; body: string }>(
    t("homeShell.steps", { returnObjects: true }),
  );
  const faqs = i18nAsArray<{ q: string; a: string }>(
    t("homeShell.faqs", { returnObjects: true }),
  );

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const seen = sessionStorage.getItem("tb-pub-sector");
    if (!reduce && seen !== "1") {
      document.documentElement.classList.add("pub-motion");
      sessionStorage.setItem("tb-pub-sector", "1");
    }
    if (reduce) return;
    const nodes = Array.from(document.querySelectorAll<HTMLElement>(".pub-reveal"));
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) entry.target.classList.add("is-in");
        }
      },
      { threshold: 0.18 },
    );
    for (const node of nodes) observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="pub-site min-h-screen bg-[#F7F8FC] text-[#14123B]">
      <SeoTags
        pathEs="/"
        pathEn="/en"
        title={t("home.seoTitle")}
        description={t("home.seoDescription")}
        lang={lang}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "Taimbox",
          applicationCategory: "BusinessApplication",
          description: t("home.jsonLdDescription"),
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        }}
      />
      <LandingHeader />
      <main>
        <section className="pub-hero mx-auto grid max-w-[1280px] items-center gap-10 px-5 pb-16 pt-8 sm:px-8 lg:grid-cols-2 lg:pb-24 lg:pt-12">
          <div>
            <p className="text-sm text-[#4A4868]">{t("homeShell.kicker")}</p>
            <h1 className="mt-3 max-w-[16ch] font-display text-[2.5rem] font-bold leading-[1.05] tracking-[-0.02em] sm:text-5xl lg:text-[3.75rem]">
              {t("homeShell.h1")}
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-[#4A4868] sm:text-lg">
              {t("homeShell.lede")}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/login?tab=register" className="pub-btn pub-btn-primary">
                {t("homeShell.start")}
              </Link>
              <Link
                to={localizedPathFromEs("/precios", i18n.language)}
                className="pub-btn pub-btn-secondary"
              >
                {t("homeShell.seePlans")}
              </Link>
            </div>
          </div>
          <div className="pub-reveal rounded-xl border border-[#E3E6F0] bg-white p-4 shadow-[0_12px_32px_-20px_rgba(20,18,59,0.35)] sm:p-6">
            <div className="mb-4 flex items-center justify-between text-xs text-[#4A4868]">
              <span>{t("homeShell.mockTitle")}</span>
              <span className="inline-flex items-center gap-2">
                <span className="pub-clock" aria-hidden />
                {t("homeShell.mockWeek")}
              </span>
            </div>
            <PlannerSketch />
            <p className="mt-3 text-[11px] text-[#4A4868]">{t("homeShell.mockCaption")}</p>
          </div>
        </section>

        <section className="mx-auto grid max-w-[1280px] grid-cols-2 gap-3 px-5 sm:px-8 lg:grid-cols-4">
          {(["capacity", "hours", "projects", "load"] as const).map((key) => (
            <div key={key} className="pub-reveal rounded-xl border border-[#E3E6F0] bg-white px-4 py-4">
              <p className="text-sm text-[#4A4868]">{t(`homeShell.metrics.${key}`)}</p>
              <p className="mt-2 font-display text-2xl tabular-nums text-[#14123B]">—</p>
            </div>
          ))}
        </section>

        <section className="mx-auto max-w-[1280px] px-5 py-16 sm:px-8 lg:py-24">
          <p className="text-sm text-[#4A4868]">{t("homeShell.howKicker")}</p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-[-0.02em] sm:text-4xl">
            {t("homeShell.howTitle")}
          </h2>
          <ol className="mt-8 grid gap-4 lg:grid-cols-3">
            {steps.map((step, index) => (
              <li key={step.title} className="pub-reveal rounded-xl border border-[#E3E6F0] bg-white p-5">
                <span className="pub-box" aria-hidden data-step={index} />
                <h3 className="mt-4 font-display text-xl font-bold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#4A4868]">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mx-auto max-w-[1280px] px-5 pb-8 sm:px-8">
          <p className="text-sm text-[#4A4868]">{t("homeShell.featuresKicker")}</p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-[-0.02em] sm:text-4xl">
            {t("homeShell.featuresTitle")}
          </h2>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature) => (
              <li key={feature.id} className="pub-reveal">
                <Link
                  to={localizedPathFromEs(feature.hrefEs, i18n.language)}
                  className="block h-full rounded-xl border border-[#E3E6F0] bg-white p-5 transition-colors hover:border-[#4F46E5]"
                >
                  <span className="font-display text-lg font-bold">
                    {t(`homeShell.features.${feature.id}.title`)}
                  </span>
                  <span className="mt-2 block text-sm leading-relaxed text-[#4A4868]">
                    {t(`homeShell.features.${feature.id}.body`)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="mx-auto max-w-[1280px] px-5 py-12 sm:px-8">
          <div className="pub-reveal rounded-xl bg-[#EEF0FF] px-6 py-8 sm:px-10">
            <p className="text-sm text-[#4A4868]">{t("homeShell.securityKicker")}</p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-[-0.02em]">
              {t("homeShell.securityTitle")}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#4A4868]">
              {t("homeShell.securityBody")}
            </p>
            <Link
              to={localizedPathFromEs("/seguridad", i18n.language)}
              className="mt-4 inline-block text-sm font-medium text-[#4F46E5] underline-offset-4 hover:underline"
            >
              {t("homeShell.securityLink")}
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-[1280px] px-5 pb-16 sm:px-8">
          <p className="text-sm text-[#4A4868]">{t("homeShell.plansKicker")}</p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-[-0.02em] sm:text-4xl">
            {t("homeShell.plansTitle")}
          </h2>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {HOME_PLANS.map((id) => {
              const recommended = id === "business";
              return (
                <li
                  key={id}
                  className={`pub-reveal rounded-xl border bg-white p-5 ${
                    recommended ? "border-[#4F46E5]" : "border-[#E3E6F0]"
                  }`}
                >
                  {recommended ? (
                    <p className="text-xs font-medium text-[#4F46E5]">{t("homeShell.recommended")}</p>
                  ) : null}
                  <h3 className="mt-1 font-display text-2xl font-bold">{PUBLIC_PLAN_LABELS[id]}</h3>
                  <p className="mt-2 font-display text-xl tabular-nums">{planPrice(id)}</p>
                  <p className="mt-2 text-sm leading-relaxed text-[#4A4868]">
                    {t(`homeShell.plans.${id}`)}
                  </p>
                  <Link
                    to={planLink(id, i18n.language)}
                    className={`pub-btn mt-5 ${recommended ? "pub-btn-primary" : "pub-btn-secondary"}`}
                  >
                    {id === "enterprise" ? t("homeShell.talk") : t("homeShell.start")}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="mx-auto max-w-3xl px-5 pb-16 sm:px-8">
          <p className="text-sm text-[#4A4868]">{t("homeShell.faqKicker")}</p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-[-0.02em]">
            {t("homeShell.faqTitle")}
          </h2>
          <div className="mt-6 divide-y divide-[#E3E6F0] rounded-xl border border-[#E3E6F0] bg-white">
            {faqs.map((item) => (
              <details key={item.q} className="group px-5 py-4">
                <summary className="cursor-pointer list-none font-medium marker:content-none [&::-webkit-details-marker]:hidden">
                  {item.q}
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-[#4A4868]">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="bg-[#14123B] text-[#F7F8FC]">
          <div className="mx-auto max-w-[1280px] px-5 py-16 text-center sm:px-8">
            <h2 className="font-display text-3xl font-bold tracking-[-0.02em] sm:text-4xl">
              {t("homeShell.ctaTitle")}
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm text-[#C8C6DE]">{t("homeShell.ctaBody")}</p>
            <Link to="/login?tab=register" className="pub-btn pub-btn-amber mt-6">
              {t("homeShell.start")}
            </Link>
          </div>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
}

function PlannerSketch() {
  const rows = [
    ["#22C55E", "72%"],
    ["#FFB020", "48%"],
    ["#22C55E", "90%"],
    ["#F15B4A", "36%"],
  ];
  return (
    <div className="space-y-3" aria-hidden>
      <div className="grid grid-cols-7 gap-2 text-center text-[10px] text-[#4A4868]">
        {["L", "M", "X", "J", "V", "S", "D"].map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      {rows.map(([color, width]) => (
        <div key={width + color} className="h-3 rounded-full bg-[#EEF0FF]">
          <div className="h-3 rounded-full" style={{ width, background: color }} />
        </div>
      ))}
    </div>
  );
}
