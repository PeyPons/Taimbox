import { useEffect, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ROWS = [
  { key: 'copy', estimated: 20, actual: 21, pct: 5 },
  { key: 'design', estimated: 32, actual: 38, pct: 19 },
  { key: 'dev', estimated: 48, actual: 65, pct: 35 },
  { key: 'pm', estimated: 16, actual: 22, pct: 38 },
] as const;

const maxActual = Math.max(...ROWS.map((r) => r.actual));

export function EstimadoVsRealChart() {
  const { t } = useTranslation('blog');
  const k = 'components.estimadoVsReal';
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setAnimate(true), 400);
    return () => clearTimeout(id);
  }, []);

  return (
    <figure className="w-full m-0 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 sm:p-8 not-prose">
      <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3 mb-5 sm:mb-6">
        <BarChart3 className="h-7 w-7 text-indigo-300 shrink-0" aria-hidden />
        <div className="min-w-0">
          <h3 className="text-base sm:text-lg font-bold text-white m-0 leading-snug">{t(`${k}.title`)}</h3>
          <p className="text-sm text-indigo-100/85 m-0 mt-1 leading-relaxed">{t(`${k}.subtitle`)}</p>
        </div>
      </div>

      <div className="space-y-4" role="img" aria-label={t(`${k}.aria`)}>
        {ROWS.map((row) => (
          <div key={row.key}>
            <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:items-center text-xs mb-1.5">
              <span className="font-semibold text-white leading-snug">{t(`${k}.roles.${row.key}`)}</span>
              <span className={`shrink-0 ${row.pct > 20 ? 'text-amber-300 font-medium' : 'text-emerald-300'}`}>
                {row.pct > 0 ? '+' : ''}
                {row.pct}%
              </span>
            </div>
            <div className="relative h-8 rounded-lg bg-white/5 overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 rounded-lg bg-indigo-500/35 border-r border-indigo-400/30 transition-all duration-[1.5s] ease-out"
                style={{ width: animate ? `${(row.estimated / maxActual) * 100}%` : '0%' }}
              />
              <div
                className="absolute inset-y-0 left-0 rounded-lg bg-gradient-to-r from-amber-500/70 to-orange-500/70 transition-all duration-[1.8s] ease-out delay-200"
                style={{ width: animate ? `${(row.actual / maxActual) * 100}%` : '0%', opacity: 0.85 }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-indigo-300/70 mt-1">
              <span>{t(`${k}.estimated`)}: {row.estimated} h</span>
              <span>{t(`${k}.actual`)}: {row.actual} h</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-4 text-xs text-indigo-200/80">
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-6 rounded bg-indigo-500/40" aria-hidden /> {t(`${k}.legendEstimated`)}
        </span>
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-6 rounded bg-amber-500/70" aria-hidden /> {t(`${k}.legendActual`)}
        </span>
      </div>
      <figcaption className="mt-4 text-xs text-indigo-200/75">{t(`${k}.caption`)}</figcaption>
    </figure>
  );
}
