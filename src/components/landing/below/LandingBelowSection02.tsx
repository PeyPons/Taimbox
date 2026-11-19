import type { FC } from "react";
import { Activity, ChartLine, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { landingInlineStyle } from "@/components/landing/below/landingInlineStyle";
import { useHomeLiteralT } from "@/components/landing/below/useHomeLiteralT";
import { cn } from "@/lib/utils";
import { i18nAsArray } from "@/lib/i18nReturnObjects";

type PrincipleCard = {
  step: string;
  heading: string;
  body: string;
};

type S02Visual1 = { load: string; accrued: string; gap: string };

const CARD_SHELL: { icon: LucideIcon; accent: string; glow: string; bar: string }[] = [
  {
    icon: ChartLine,
    accent: "rgb(251, 191, 36)",
    glow: "rgba(251, 191, 36, 0.18)",
    bar: "from-amber-400 to-orange-500",
  },
  {
    icon: Activity,
    accent: "rgb(167, 139, 250)",
    glow: "rgba(167, 139, 250, 0.22)",
    bar: "from-violet-400 to-indigo-500",
  },
  {
    icon: Sparkles,
    accent: "rgb(52, 211, 153)",
    glow: "rgba(52, 211, 153, 0.2)",
    bar: "from-emerald-400 to-teal-500",
  },
];

function CardVisual1({ labels }: { labels: S02Visual1 }) {
  return (
    <div className="flex flex-col gap-2.5 rounded-xl border border-white/10 bg-slate-900/80 p-3 backdrop-blur-sm">
      <div>
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-slate-400">{labels.load}</span>
          <span className="font-mono text-[11px] font-semibold tabular-nums text-amber-300">86%</span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-amber-400" style={landingInlineStyle("width: 86%;")} />
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-slate-400">{labels.accrued}</span>
          <span className="font-mono text-[11px] font-semibold tabular-nums text-rose-300">67%</span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-rose-400" style={landingInlineStyle("width: 67%;")} />
        </div>
      </div>
      <p className="text-center font-mono text-[9px] font-semibold text-rose-300">{labels.gap}</p>
    </div>
  );
}



function CardVisual2({ steps, railLabel }: { steps: string[]; railLabel: string }) {
  const last = steps.length - 1;
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/80 p-3.5 backdrop-blur-sm">
      <p className="mb-3 text-[11px] font-medium leading-snug text-slate-300">{railLabel}</p>
      <div className="relative flex items-center justify-between gap-1 sm:gap-1.5">
        <div
          aria-hidden
          className="pointer-events-none absolute left-[6%] right-[6%] top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-violet-500/50 via-slate-600/40 to-emerald-500/50"
        />
        {steps.map((step, i) => (
          <div key={step} className="relative z-[1] min-w-0 flex-1">
            <span
              className={cn(
                "block w-full truncate rounded-full border px-1.5 py-1.5 text-center text-[8px] font-medium leading-tight sm:text-[9px]",
                i === 0 && "border-violet-400/35 bg-violet-500/15 text-violet-100",
                i === last && "border-emerald-400/35 bg-emerald-500/15 text-emerald-100",
                i > 0 && i < last && "border-white/10 bg-slate-800/90 text-slate-300",
              )}
              title={step}
            >
              {step}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

type Visual3Row = {
  badge: string;
  label: string;
  value: string;
  tone?: "neutral" | "positive";
};

function CardVisual3({ caption, rows }: { caption: string; rows: Visual3Row[] }) {
  const splitAt = rows.findIndex((r) => r.tone === "positive");
  const dividerAt = splitAt === -1 ? rows.length : splitAt;
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/80 p-3 backdrop-blur-sm">
      <p className="mb-2.5 border-b border-white/10 pb-2 text-[11px] font-medium leading-snug text-slate-300">
        {caption}
      </p>
      <div className="space-y-2">
        {rows.map((row, i) => (
          <div key={row.badge}>
            {i === dividerAt && dividerAt > 0 ? <div className="mb-2 h-px bg-white/10" aria-hidden /> : null}
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <span className="shrink-0 rounded border border-white/10 bg-white/5 px-1 py-px font-mono text-[8px] font-semibold text-slate-400">
                  {row.badge}
                </span>
                <span className="truncate text-[11px] text-slate-200">{row.label}</span>
              </div>
              <span
                className={cn(
                  "shrink-0 font-mono text-[11px] font-semibold tabular-nums",
                  row.tone === "positive" ? "text-emerald-400" : "text-slate-100",
                )}
              >
                {row.value}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


export const LandingBelowSection02: FC = () => {
  const { t } = useHomeLiteralT();
  const cards = i18nAsArray<PrincipleCard>(t("s02.cards", { returnObjects: true }));
  const visual1 = t("s02.visual1", { returnObjects: true }) as S02Visual1;
  const visual2Steps = i18nAsArray<string>(t("s02.visual2.steps", { returnObjects: true }));
  const visual2RailLabel = t("s02.visual2.railLabel");
  const visual3Caption = t("s02.visual3.caption");
  const visual3Rows = i18nAsArray<Visual3Row>(t("s02.visual3.rows", { returnObjects: true }));
  const visuals = [
    () => <CardVisual1 labels={visual1} />,
    () => <CardVisual2 steps={visual2Steps} railLabel={visual2RailLabel} />,
    () => <CardVisual3 caption={visual3Caption} rows={visual3Rows} />,
  ];

  return (
    <section
      className="relative overflow-hidden"
      style={landingInlineStyle(
        "background: #14123B; padding-top: clamp(2.5rem, 4.5vw, 3.75rem); padding-bottom: clamp(2.25rem, 4vw, 3.25rem);",
      )}
    >
      <div className="relative mx-auto max-w-6xl px-6 lg:px-10">
        <div className="relative mb-8">
          <p
            aria-hidden
            className="pointer-events-none absolute -left-2 top-1/2 hidden -translate-y-1/2 select-none font-black leading-none tracking-tighter text-white/[0.04] sm:block sm:text-[7rem] lg:text-[9rem]"
          >
            02
          </p>
          <div className="relative max-w-3xl">
            <span className="mb-3 inline-block font-mono text-[10px] uppercase tracking-[0.28em] text-[#C4B5FD]">
              {t("s02.kicker")}
            </span>
            <h2 className="text-[2.15rem] font-black leading-[1.05] tracking-[-0.035em] text-white sm:text-4xl lg:text-[3.25rem]">
              {t("s02.title")}{" "}
              <span className="text-[#C4B5FD]">
                {t("s02.titleEmphasis")}
              </span>
              .
            </h2>
          </div>
        </div>

        <div
          className="relative overflow-hidden rounded-[1.75rem] border border-[rgba(196,181,253,0.2)] bg-[#1A1736] sm:rounded-[2rem]"
        >
          <div aria-hidden className="pointer-events-none absolute left-8 top-8 bottom-8 hidden w-px bg-white/15 lg:block" />

          <div className="relative divide-y divide-white/[0.08]">
            {cards.map((card, i) => {
              if (!CARD_SHELL[i]) return null;
              const Visual = visuals[i];
              if (!Visual) return null;
              const stepNum = String(i + 1).padStart(2, "0");
              const flip = i === 1;
              return (
                <article
                  key={card.step}
                  className={cn(
                    "relative grid grid-cols-1 gap-6 p-6 sm:p-8 lg:grid-cols-12 lg:gap-10 lg:p-10",
                    flip && "lg:[&>div:nth-child(2)]:lg:order-2 lg:[&>div:nth-child(3)]:lg:order-1",
                  )}
                >
                  <p
                    aria-hidden
                    className="pointer-events-none absolute right-4 top-4 select-none font-black text-[4.5rem] leading-none text-white/[0.04] sm:text-[5.5rem] lg:right-8 lg:top-6"
                  >
                    {stepNum}
                  </p>
                  <div className={cn("relative z-[1] lg:col-span-7", flip && "lg:col-start-6")}>
                    <div className="mb-4 flex items-center gap-3">
                      <span className="h-6 w-[2px] shrink-0 bg-[#7C3AED]" aria-hidden />
                      <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#C4B5FD]">
                        {card.step}
                      </span>
                    </div>
                    <h3 className="mb-3 text-2xl font-bold leading-[1.12] tracking-tight text-white sm:text-3xl lg:text-[2rem]">
                      {card.heading}
                    </h3>
                    <p className="max-w-2xl text-[15px] leading-relaxed text-slate-300 sm:text-base">{card.body}</p>
                    <div className="mt-6 lg:hidden">
                      <Visual />
                    </div>
                  </div>
                  <div
                    className={cn(
                      "relative z-[1] hidden items-center lg:col-span-5 lg:flex",
                      flip && "lg:col-start-1 lg:row-start-1",
                    )}
                  >
                    <div className="w-full lg:max-w-md lg:justify-self-end">
                      <Visual />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
