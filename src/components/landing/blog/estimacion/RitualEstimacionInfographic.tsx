import { ClipboardCheck, ChevronDown, History, Layers, CalendarRange, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const STEPS = [
  { key: 'gate', icon: ClipboardCheck },
  { key: 'analogy', icon: History },
  { key: 'bottomUp', icon: Layers },
  { key: 'duration', icon: CalendarRange },
  { key: 'committee', icon: Users },
] as const;

export function RitualEstimacionInfographic() {
  const { t } = useTranslation('blog');
  const k = 'components.ritualEstimacion';

  return (
    <figure className="w-full m-0 rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-950/80 to-purple-950/50 p-4 sm:p-6 lg:p-8 not-prose">
      <div className="flex flex-col gap-2 lg:grid lg:grid-cols-5 lg:gap-3">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          return (
            <div key={step.key} className="flex flex-col gap-2 lg:min-w-0">
              <article className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-4 sm:p-5 flex flex-col gap-2.5 h-full min-h-[128px]">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-indigo-200 text-xs font-black">
                    {i + 1}
                  </span>
                  <Icon className="h-5 w-5 text-indigo-300 shrink-0" aria-hidden />
                </div>
                <h4 className="text-sm sm:text-base font-bold text-white m-0 leading-snug">
                  {t(`${k}.steps.${step.key}.title`)}
                </h4>
                <p className="text-xs sm:text-sm text-indigo-100/85 m-0 flex-1 leading-relaxed">
                  {t(`${k}.steps.${step.key}.body`)}
                </p>
              </article>
              {i < STEPS.length - 1 && (
                <div className="flex justify-center py-0.5 text-indigo-400/50 lg:hidden" aria-hidden>
                  <ChevronDown className="h-5 w-5" />
                </div>
              )}
            </div>
          );
        })}
      </div>
      <blockquote className="mt-6 sm:mt-8 text-center border-t border-white/10 pt-6 px-2 sm:px-4 m-0">
        <p className="text-base sm:text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 via-white to-violet-200 leading-relaxed m-0">
          {t(`${k}.quote`)}
        </p>
      </blockquote>
      <figcaption className="mt-4 text-xs sm:text-sm text-indigo-200/70 text-center leading-relaxed">
        {t(`${k}.caption`)}
      </figcaption>
    </figure>
  );
}
