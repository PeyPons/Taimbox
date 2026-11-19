import { Check, Minus } from "lucide-react";
import { useTranslation } from "react-i18next";

import { PLAN_LIMITS } from "@/config/plans";
import { PUBLIC_PLAN_LABELS, PUBLIC_PLAN_PRICING, type PublicPlanId } from "@/config/publicPricing";
import { PRICING_ROW_PRIMARY } from "@/config/publicPricingLayout";
import { i18nAsArray } from "@/lib/i18nReturnObjects";
import { cn } from "@/lib/utils";

const COLUMNS = PRICING_ROW_PRIMARY;

type Cell = { kind: "yes" | "no" } | { kind: "text"; value: string };

function yesNo(on: boolean): Cell {
  return on ? { kind: "yes" } : { kind: "no" };
}

function registerHref(plan: PublicPlanId): string {
  return `/login?tab=register&plan=${plan}`;
}

export function PublicPriceDecision({
  formatMoney,
  enterpriseMail,
}: {
  formatMoney: (usd: number) => string;
  enterpriseMail: string;
}) {
  const { t } = useTranslation("landing");
  const faq = i18nAsArray<{ q: string; a: string }>(t("pricing.faqShort", { returnObjects: true }));
  const scale = PUBLIC_PLAN_PRICING.find((plan) => plan.id === "scale");
  const scalePrice = scale?.usdMonthly != null ? formatMoney(scale.usdMonthly) : "";

  const limits = {
    starter: PLAN_LIMITS.starter,
    pro: PLAN_LIMITS.pro,
    business: PLAN_LIMITS.business,
  };

  const extra = (id: keyof typeof limits): Cell => {
    const price = limits[id].extraUserPriceUsd;
    if (price == null) return { kind: "no" };
    return { kind: "text", value: formatMoney(price) };
  };

  const rows: { key: string; cells: Record<(typeof COLUMNS)[number], Cell> }[] = [
    {
      key: "included",
      cells: {
        starter: { kind: "text", value: String(limits.starter.includedManagedUsers) },
        pro: { kind: "text", value: String(limits.pro.includedManagedUsers) },
        business: { kind: "text", value: String(limits.business.includedManagedUsers) },
      },
    },
    { key: "extra", cells: { starter: extra("starter"), pro: extra("pro"), business: extra("business") } },
    {
      key: "cap",
      cells: {
        starter: { kind: "text", value: String(limits.starter.maxManagedUsers) },
        pro: { kind: "text", value: String(limits.pro.maxManagedUsers) },
        business: { kind: "text", value: String(limits.business.maxManagedUsers) },
      },
    },
    {
      key: "planner",
      cells: { starter: yesNo(true), pro: yesNo(true), business: yesNo(true) },
    },
    {
      key: "deadlines",
      cells: { starter: yesNo(true), pro: yesNo(true), business: yesNo(true) },
    },
    {
      key: "timer",
      cells: { starter: yesNo(true), pro: yesNo(true), business: yesNo(true) },
    },
    {
      key: "history",
      cells: {
        starter: yesNo(!limits.starter.limitHistoryToTwoMonths),
        pro: yesNo(!limits.pro.limitHistoryToTwoMonths),
        business: yesNo(!limits.business.limitHistoryToTwoMonths),
      },
    },
    {
      key: "weekly",
      cells: { starter: yesNo(false), pro: yesNo(true), business: yesNo(true) },
    },
    {
      key: "okr",
      cells: { starter: yesNo(false), pro: yesNo(true), business: yesNo(true) },
    },
    {
      key: "reports",
      cells: { starter: yesNo(false), pro: yesNo(true), business: yesNo(true) },
    },
    {
      key: "activity",
      cells: { starter: yesNo(false), pro: yesNo(true), business: yesNo(true) },
    },
    {
      key: "exports",
      cells: {
        starter: yesNo(limits.starter.advancedExports),
        pro: yesNo(limits.pro.advancedExports),
        business: yesNo(limits.business.advancedExports),
      },
    },
    {
      key: "ppc",
      cells: {
        starter: yesNo(limits.starter.adsAccess),
        pro: yesNo(limits.pro.adsAccess),
        business: yesNo(limits.business.adsAccess),
      },
    },
    {
      key: "sync",
      cells: {
        starter: yesNo(limits.starter.scheduledSync),
        pro: yesNo(limits.pro.scheduledSync),
        business: yesNo(limits.business.scheduledSync),
      },
    },
    {
      key: "api",
      cells: {
        starter: yesNo(limits.starter.apiAccess),
        pro: yesNo(limits.pro.apiAccess),
        business: yesNo(limits.business.apiAccess),
      },
    },
  ];

  return (
    <div>
      <p className="text-center font-mono text-[11px] uppercase tracking-[0.22em] text-[#C4B5FD]">
        {t("pricing.monthlyOnly")}
      </p>

      <div className="mt-8 grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-[#E4DDD0] bg-[#E4DDD0]">
        {COLUMNS.map((id) => {
          const pricing = PUBLIC_PLAN_PRICING.find((plan) => plan.id === id);
          const recommended = pricing?.recommended === true;
          const amount = pricing?.usdMonthly ?? 0;
          return (
            <article
              key={id}
              className={cn(
                "flex flex-col bg-[#F7F4EC] px-3 py-4 text-[#14123B] sm:px-6 sm:py-6",
                recommended && "shadow-[inset_0_3px_0_0_#7C3AED]",
              )}
            >
              <p className="min-h-[1rem] font-mono text-[10px] uppercase tracking-[0.14em] text-[#14123B]">
                {recommended ? t("pricing.recommended") : "\u00a0"}
              </p>
              <h2 className="mt-1 text-sm font-semibold sm:text-lg">{PUBLIC_PLAN_LABELS[id]}</h2>
              <p className="mt-3 text-[1.65rem] font-semibold leading-none tracking-[-0.04em] tabular-nums [font-feature-settings:'zero'_1] sm:text-5xl">
                {formatMoney(amount)}
              </p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[#3C3858] sm:text-[11px]">
                / {t(`pricing.plans.${id}.period`)}
              </p>
              <p className="mt-3 min-h-[2.5rem] text-[12px] leading-snug text-[#3C3858] sm:min-h-0 sm:text-sm">
                {t(`pricing.decisionWho.${id}`)}
              </p>
              <a
                href={registerHref(id)}
                className={cn(
                  "mt-4 inline-flex h-11 items-center justify-center rounded-full px-3 text-center text-[13px] font-semibold sm:text-sm",
                  recommended
                    ? "bg-[#14123B] text-white hover:bg-[#2A2558]"
                    : "border border-[#14123B] text-[#14123B] hover:bg-[#14123B] hover:text-white",
                )}
              >
                {t(`pricing.decisionCta.${id}`)}
              </a>
              <p className="mt-3 text-[11px] leading-snug text-[#3C3858] sm:text-xs">
                {t(`pricing.decisionNote.${id}`)}
              </p>
            </article>
          );
        })}
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-[#E4DDD0] bg-[#F7F4EC] text-[#14123B]">
        {rows.map((row) => (
          <div
            key={row.key}
            className="grid grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(0,0.8fr))] border-b border-[#E4DDD0] last:border-b-0"
          >
            <div className="px-3 py-3 text-[12px] leading-snug sm:px-5 sm:text-sm">
              {t(`pricing.decisionRows.${row.key}`)}
            </div>
            {COLUMNS.map((id) => (
              <div key={id} className="flex items-center justify-center px-1 py-3 text-center text-[12px] sm:text-sm">
                <PriceCell cell={row.cells[id]} yesLabel={t("pricing.yes")} noLabel={t("pricing.no")} />
              </div>
            ))}
          </div>
        ))}
      </div>

      <p className="mx-auto mt-8 max-w-3xl text-center text-sm leading-relaxed text-[#D4CEF0]">
        {t("pricing.beyond", { price: scalePrice })}{" "}
        <a href={enterpriseMail} className="text-white underline decoration-[#C4B5FD] underline-offset-4">
          {t("pricing.beyondCta")}
        </a>
      </p>

      <div className="mx-auto mt-12 max-w-3xl border-t border-[rgba(196,181,253,0.24)]">
        {faq.map((item) => (
          <div key={item.q} className="border-b border-[rgba(196,181,253,0.24)] py-4">
            <h2 className="text-base font-semibold text-white">{item.q}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-[#D4CEF0]">{item.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PriceCell({ cell, yesLabel, noLabel }: { cell: Cell; yesLabel: string; noLabel: string }) {
  if (cell.kind === "text") {
    return <span className="tabular-nums">{cell.value}</span>;
  }
  const on = cell.kind === "yes";
  return (
    <span className={cn("inline-flex items-center gap-1", on ? "text-[#14123B]" : "text-[#3C3858]")}>
      {on ? <Check className="h-3.5 w-3.5 shrink-0" aria-hidden /> : <Minus className="h-3.5 w-3.5 shrink-0" aria-hidden />}
      <span>{on ? yesLabel : noLabel}</span>
    </span>
  );
}
