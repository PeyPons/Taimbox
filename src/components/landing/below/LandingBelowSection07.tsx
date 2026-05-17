import type { FC } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  Crown,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { landingInlineStyle } from "@/components/landing/below/landingInlineStyle";
import { useHomeLiteralT } from "@/components/landing/below/useHomeLiteralT";
import { i18nAsArray } from "@/lib/i18nReturnObjects";

type Plan = {
  id: string;
  name: string;
  desc: string;
  price: string;
  priceSuffix?: string;
  priceWas?: string;
  discountBadge?: string;
  features: string[];
  cta: string;
  ctaHref: string;
  featured?: boolean;
};

const PLAN_ICONS: Record<
  string,
  { icon: LucideIcon; bg: string; color: string }
> = {
  starter: {
    icon: Users,
    bg: "rgba(100, 116, 139, 0.08)",
    color: "rgb(100, 116, 139)",
  },
  pro: {
    icon: Zap,
    bg: "rgba(255, 255, 255, 0.1)",
    color: "rgb(255, 255, 255)",
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

const CHECK_COLORS: Record<string, string> = {
  starter: "rgb(100, 116, 139)",
  pro: "text-emerald-300",
  business: "rgb(236, 72, 153)",
  enterprise: "rgb(15, 23, 42)",
};

/** Sección 07 (planes). */
export const LandingBelowSection07: FC = () => {
  const { t, path } = useHomeLiteralT();
  const plans = i18nAsArray<Plan>(t("s07.plans", { returnObjects: true }));

  return (
    <section
      className="relative overflow-hidden"
      style={landingInlineStyle(
        "background: rgb(250, 245, 232); padding-top: clamp(5rem, 10vw, 8rem); padding-bottom: clamp(7rem, 12vw, 10rem);",
      )}
    >
      <div className="relative max-w-7xl mx-auto px-6 lg:px-10">
        <div
          className="max-w-3xl mb-14 mx-auto text-center"
          style={landingInlineStyle("opacity: 1; transform: none;")}
        >
          <span className="inline-block font-mono text-[10px] uppercase tracking-[0.24em] text-amber-700 mb-3">
            {t("s07.kicker")}
          </span>
          <h2 className="text-[2rem] sm:text-4xl lg:text-5xl font-semibold text-slate-900 leading-[1.1] -tracking-[0.02em] mb-4">
            {t("s07.title")}{" "}
            <span className="italic text-amber-700">
              {t("s07.titleHighlight")}
            </span>
          </h2>
          <p className="text-[15px] sm:text-[16px] text-slate-600 leading-relaxed">
            {t("s07.subtitle")}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
          {plans.map((plan) => {
            const shell = PLAN_ICONS[plan.id];
            if (!shell) return null;
            const Icon = shell.icon;
            const featured = plan.featured === true;
            const features = Array.isArray(plan.features)
              ? plan.features
              : i18nAsArray<string>(plan.features);
            const checkClass = CHECK_COLORS[plan.id] ?? "rgb(100, 116, 139)";

            return (
              <div
                key={plan.id}
                className={
                  featured
                    ? "group relative rounded-2xl p-6 sm:p-7 flex flex-col bg-slate-900 text-white ring-1 ring-violet-400/30"
                    : "group relative rounded-2xl p-6 sm:p-7 flex flex-col bg-white text-slate-900 border border-slate-200/70"
                }
                style={landingInlineStyle(
                  featured
                    ? "box-shadow: rgba(124, 58, 237, 0.6) 0px 30px 80px -25px, rgba(15, 23, 42, 0.2) 0px 14px 40px -16px; opacity: 1; transform: none;"
                    : "box-shadow: rgba(15, 23, 42, 0.04) 0px 1px 2px, rgba(15, 23, 42, 0.08) 0px 12px 36px -16px; opacity: 1; transform: none;",
                )}
              >
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2.5">
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
                    <span className="text-[15px] font-semibold">
                      {plan.name}
                    </span>
                  </div>
                  {plan.discountBadge ? (
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-bold tracking-[0.12em] uppercase text-white shrink-0"
                      style={landingInlineStyle(
                        "background: linear-gradient(135deg, rgb(124, 58, 237), rgb(236, 72, 153)); opacity: 1; transform: none;",
                      )}
                    >
                      <Sparkles className="h-2.5 w-2.5" aria-hidden />
                      {plan.discountBadge}
                    </span>
                  ) : null}
                </div>
                <p
                  className={`text-[13px] leading-snug min-h-[40px] mb-5 ${featured ? "text-white/65" : "text-slate-500"}`}
                >
                  {plan.desc}
                </p>
                <div className="mb-6">
                  {plan.priceWas ? (
                    <div
                      className={`text-[13px] line-through tabular-nums mb-0.5 ${featured ? "text-white/40" : "text-slate-400"}`}
                    >
                      {plan.priceWas}
                    </div>
                  ) : null}
                  <div className="flex items-baseline gap-1">
                    <span
                      className={
                        plan.id === "enterprise"
                          ? "text-3xl sm:text-4xl font-semibold tabular-nums -tracking-[0.03em]"
                          : "text-4xl sm:text-5xl font-semibold tabular-nums -tracking-[0.04em]"
                      }
                    >
                      {plan.price}
                    </span>
                    {plan.priceSuffix ? (
                      <span
                        className={`text-[13px] ${featured ? "text-white/55" : "text-slate-500"}`}
                      >
                        {plan.priceSuffix}
                      </span>
                    ) : null}
                  </div>
                </div>
                <ul className="space-y-2.5 mb-7 flex-1">
                  {features.map((feature) => (
                    <li
                      key={feature}
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
                        className={`lucide lucide-check h-3.5 w-3.5 mt-0.5 shrink-0 ${typeof checkClass === "string" && checkClass.startsWith("text-") ? checkClass : ""}`}
                        style={
                          typeof checkClass === "string" &&
                          !checkClass.startsWith("text-")
                            ? landingInlineStyle(`color: ${checkClass};`)
                            : undefined
                        }
                        aria-hidden
                      >
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <a
                  className={
                    featured
                      ? "group/cta inline-flex items-center justify-center gap-2 h-11 rounded-full text-[13.5px] font-semibold transition-all bg-white text-slate-900 hover:bg-slate-100"
                      : "group/cta inline-flex items-center justify-center gap-2 h-11 rounded-full text-[13.5px] font-semibold transition-all bg-slate-900 text-white hover:bg-slate-800"
                  }
                  href={path(plan.ctaHref)}
                >
                  <span>{plan.cta}</span>
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
            className="group inline-flex items-center gap-1.5 text-[14px] font-medium text-slate-700 hover:text-slate-900 border-b border-slate-400 hover:border-slate-800 pb-0.5 transition-colors"
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
      <svg
        aria-hidden
        className="absolute left-0 right-0 bottom-0 w-full pointer-events-none h-14 sm:h-20"
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
      >
        <path
          d="M0,100 C360,20 1080,20 1440,100 L1440,120 L0,120 Z"
          fill="#ffffff"
        />
      </svg>
    </section>
  );
};
