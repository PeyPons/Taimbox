import { useEffect, useState } from 'react';
import { CalendarClock, TrendingDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function EstimacionHeroVisual() {
  const { t } = useTranslation('blog');
  const k = 'components.estimacionHero';
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setAnimate(true), 300);
    return () => clearTimeout(id);
  }, []);

  return (
    <figure className="w-full m-0 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-950/50 via-indigo-950/60 to-purple-950/50 p-4 sm:p-8 not-prose">
      <div className="flex flex-col gap-4 mb-5 sm:mb-6">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 border border-amber-400/30">
            <CalendarClock className="h-5 w-5 sm:h-6 sm:w-6 text-amber-300" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-amber-200/90 m-0">
              {t(`${k}.badge`)}
            </p>
            <p className="text-sm text-indigo-100/85 m-0 leading-relaxed mt-1">{t(`${k}.subtitle`)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start rounded-full border border-red-400/40 bg-red-500/15 px-3 py-1.5">
          <TrendingDown className="h-4 w-4 text-red-300 shrink-0" aria-hidden />
          <span className="text-sm font-semibold text-red-200">{t(`${k}.variance`)}</span>
        </div>
      </div>

      <div className="space-y-5">
        <div>
          <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:items-center text-xs mb-2">
            <span className="text-indigo-200/90 leading-snug">{t(`${k}.promised`)}</span>
            <span className="text-emerald-300 font-medium shrink-0">{t(`${k}.promisedDays`)}</span>
          </div>
          <div className="h-3 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-[1.8s] ease-out"
              style={{ width: animate ? '55%' : '0%' }}
            />
          </div>
        </div>
        <div>
          <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:items-center text-xs mb-2">
            <span className="text-indigo-200/90 leading-snug">{t(`${k}.actual`)}</span>
            <span className="text-amber-300 font-medium shrink-0">{t(`${k}.actualDays`)}</span>
          </div>
          <div className="h-3 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-[2.2s] ease-out delay-300"
              style={{ width: animate ? '100%' : '0%' }}
            />
          </div>
        </div>
      </div>

      <figcaption className="mt-6 text-sm text-indigo-100/90 leading-relaxed border-t border-white/10 pt-4">
        {t(`${k}.caption`)}
      </figcaption>
    </figure>
  );
}
