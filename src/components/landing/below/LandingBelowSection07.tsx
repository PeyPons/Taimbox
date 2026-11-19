import { useMemo, type FC } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  Crown,
  Users,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { landingInlineStyle } from "@/components/landing/below/landingInlineStyle";
import { useHomeLiteralT } from "@/components/landing/below/useHomeLiteralT";
import { LandingPricingCurrencySelect } from "@/components/landing/LandingPricingCurrencySelect";
import { PUBLIC_PLAN_PRICING, PUBLIC_PLAN_LABELS, type PublicPlanId } from "@/config/publicPricing";
import { PRICING_HOME_PLAN_IDS } from "@/config/publicPricingLayout";
import { usePublicPricingCurrency } from "@/hooks/usePublicPricingCurrency";
import { i18nAsArray } from "@/lib/i18nReturnObjects";

const PLAN_ICONS: Partial<Record<PublicPlanId, { icon: LucideIcon; bg: string; color: string }>> = {
  starter: {
    icon: Users,
    bg: "rgba(100, 116, 139, 0.08)",
    color: "rgb(100, 116, 139)",
  },
  pro: {
    icon: Zap,
    bg: "rgba(99, 102, 241, 0.1)",
    color: "rgb(79, 70, 229)",
  },
  business: {
    icon: Crown,
    bg: "rgba(236, 72, 153, 0.08)",
    color: "rgb(236, 72, 153)",
  },
  enterprise: {
    icon: Building2,
    bg: "rgba(15, 23, 42, 0.08)",
    color: "rgb(15, 23, 42)",
  },
};

const CHECK_COLORS: Partial<Record<PublicPlanId, string>> = {
  starter: "rgb(100, 116, 139)",
  pro: "rgb(79, 70, 229)",
  business: "rgb(236, 72, 153)",
  enterprise: "rgb(15, 23, 42)",
};

type HomePlanCopy = {
  period: string;
  description: string;
  features: string[];
  cta: string;
  customPrice: string;
};

/** Sección 07 (planes) — mismos textos que `landing.pricing.plans` en /precios. */
export const LandingBelowSection07: FC = () => {
  const { t, path } = useHomeLiteralT();
  const { t: tPricing, i18n } = useTranslation("landing");

  const planCopyById = useMemo(() => {
    const map = {} as Record<PublicPlanId, HomePlanCopy>;
    for (const id of PRICING_HOME_PLAN_IDS) {
      map[id] = {
        period: tPricing(`pricing.plans.${id}.period`),
        description: tPricing(`pricing.plans.${id}.description`),
        features: i18nAsArray<string>(
          tPricing(`pricing.plans.${id}.features`, { returnObjects: true }),
        ),
        cta: tPricing(`pricing.plans.${id}.cta`),
        customPrice: tPricing(`pricing.plans.${id}.customPrice`, { defaultValue: "" }),
      };
    }
    return map;
  }, [tPricing]);

  const enterpriseMail = `mailto:hello@taimbox.com?subject=${encodeURIComponent(
    tPricing("pricing.enterpriseMailSubject"),
  )}`;

  const {
    currency,
    setCurrency,
    currencyOptions,
    ratesLoading,
    formatMonthly,
    formatUsdAmount,
    billingNote,
  } = usePublicPricingCurrency();

  return (
    <section
      className="relative overflow-hidden"
      style={landingInlineStyle(
        "background: #14123B; padding-top: clamp(2.5rem, 4.5vw, 3.5rem); padding-bottom: clamp(2.25rem, 4vw, 3.25rem);",
      )}
    >
      <div className="relative max-w-[1280px] mx-auto px-6 lg:px-10">
        <div
          className="max-w-3xl mb-8 mx-auto text-center"
          style={landingInlineStyle("opacity: 1; transform: none;")}
        >
          <span className="inline-block font-mono text-[10px] uppercase tracking-[0.24em] text-[#C4B5FD] mb-3">
            {t("s07.kicker")}
          </span>
          <h2 className="text-[2rem] sm:text-4xl lg:text-5xl font-semibold text-white leading-[1.1] tracking-[-0.03em] mb-4">
            {t("s07.title")}{" "}
            <span className="italic text-[#C4B5FD]">{t("s07.titleHighlight")}</span>
          </h2>
          <p className="text-[15px] sm:text-[16px] text-[#D4CEF0] leading-relaxed mb-5">
            {t("s07.subtitle")}
          </p>
        </div>

        <LandingPricingCurrencySelect
          currency={currency}
          onCurrencyChange={setCurrency}
          options={currencyOptions}
          loading={ratesLoading}
          variant="dark"
        />
        <p className="text-center text-[11px] text-[#D4CEF0] max-w-xl mx-auto -mt-4 mb-10">
          {billingNote}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 lg:gap-8">
          {PUBLIC_PLAN_PRICING.filter((p) => PRICING_HOME_PLAN_IDS.includes(p.id)).map((pricing) => {
            const copy = planCopyById[pricing.id];
            if (!copy) return null;

            const shell = PLAN_ICONS[pricing.id];
            if (!shell) return null;

            const Icon = shell.icon;
            const featured = pricing.featuredOnHome === true;
            const displayName = PUBLIC_PLAN_LABELS[pricing.id];
            const checkClass = CHECK_COLORS[pricing.id] ?? "rgb(100, 116, 139)";
            const isEnterprise = pricing.usdMonthly == null;

            const priceDisplay = isEnterprise
              ? copy.customPrice
              : pricing.usdMonthly === 0
                ? formatUsdAmount(0)
                : formatMonthly(pricing.usdMonthly!);

            const ctaHref =
              pricing.id === "enterprise" ? enterpriseMail : path(pricing.href);

            return (
              <div
                key={pricing.id}
                className={
                  featured
                    ? "group relative rounded-2xl p-6 sm:p-7 pt-8 sm:pt-9 flex flex-col bg-slate-900 text-white ring-1 ring-violet-400/30"
                    : "group relative rounded-2xl p-6 sm:p-7 flex flex-col bg-white text-slate-900 border border-slate-200/70"
                }
                style={landingInlineStyle(
                  featured
                    ? "box-shadow: rgba(124, 58, 237, 0.6) 0px 30px 80px -25px, rgba(15, 23, 42, 0.2) 0px 14px 40px -16px; opacity: 1; transform: none;"
                    : "box-shadow: rgba(15, 23, 42, 0.04) 0px 1px 2px, rgba(15, 23, 42, 0.08) 0px 12px 36px -16px; opacity: 1; transform: none;",
                )}
              >
                {pricing.recommended ? (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white bg-[#7C3AED]">
                      {tPricing("pricing.recommended")}
                    </span>
                  </div>
                ) : null}

                <div className="flex items-center gap-2.5 mb-4">
                  <div
                    className="h-9 w-9 rounded-xl flex items-center justify-center"
                    style={landingInlineStyle(`background: ${shell.bg};`)}
                  >
                    <Icon
                      className="h-4 w-4"
                      style={landingInlineStyle(`color: ${shell.color};`)}
                      aria-hidden
                    />
                  </div>
                  <span className="text-[15px] font-semibold">{displayName}</span>
                </div>

                <p
                  className={`text-[13px] leading-snug min-h-[40px] mb-5 ${featured ? "text-white/65" : "text-slate-500"}`}
                >
                  {copy.description}
                </p>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span
                      className={
                        isEnterprise
                          ? "text-3xl sm:text-4xl font-semibold tabular-nums -tracking-[0.03em]"
                          : "text-4xl sm:text-5xl font-semibold tabular-nums -tracking-[0.04em]"
                      }
                    >
                      {priceDisplay}
                    </span>
                    {!isEnterprise && copy.period ? (
                      <span
                        className={`text-[13px] font-medium ${featured ? "text-white/55" : "text-slate-500"}`}
                      >
                        / {copy.period}
                      </span>
                    ) : null}
                  </div>
                </div>

                <ul className="space-y-2.5 mb-7 flex-1">
                  {copy.features.map((feature, i) => (
                    <li
                      key={`${pricing.id}-${i}`}
                      className={`flex items-start gap-2.5 text-[13px] leading-snug ${featured ? "text-white/85" : "text-slate-700"}`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-check h-3.5 w-3.5 mt-0.5 shrink-0"
                        style={landingInlineStyle(`color: ${featured && pricing.id === "pro" ? "rgb(167, 243, 208)" : checkClass};`)}
                        aria-hidden
                      >
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                      <span
                        className={
                          i === 0 && pricing.id !== "starter"
                            ? featured
                              ? "font-semibold text-white"
                              : "font-semibold text-slate-900"
                            : undefined
                        }
                      >
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <a
                  className={
                    featured
                      ? "group/cta inline-flex items-center justify-center gap-2 h-11 rounded-full text-[13.5px] font-semibold transition-all bg-white text-slate-900 hover:bg-slate-100"
                      : "group/cta inline-flex items-center justify-center gap-2 h-11 rounded-full text-[13.5px] font-semibold transition-all bg-slate-900 text-white hover:bg-slate-800"
                  }
                  href={ctaHref}
                >
                  <span>{copy.cta}</span>
                  <ArrowRight
                    className="h-3.5 w-3.5 transition-transform group-hover/cta:translate-x-0.5"
                    aria-hidden
                  />
                </a>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <a
            className="group inline-flex items-center gap-1.5 text-[14px] font-medium text-[#C4B5FD] hover:text-white border-b border-[rgba(196,181,253,0.4)] hover:border-white pb-0.5 transition-colors"
            href={path(t("s07.compareHref"))}
          >
            {t("s07.compareLink")}
            <ArrowUpRight
              className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              aria-hidden
            />
          </a>
        </div>
      </div>
    </section>
  );
};
