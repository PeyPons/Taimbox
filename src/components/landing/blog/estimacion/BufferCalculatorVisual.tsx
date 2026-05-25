import { useState } from 'react';
import { Percent, ShieldPlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const SCENARIOS = ['known', 'ambiguous', 'newTech'] as const;

export function BufferCalculatorVisual() {
  const { t } = useTranslation('blog');
  const k = 'components.bufferCalculator';
  const [active, setActive] = useState<(typeof SCENARIOS)[number]>('known');

  const pct = { known: 15, ambiguous: 25, newTech: 30 }[active];
  const baseHours = 40;

  return (
    <figure className="w-full m-0 rounded-2xl border border-violet-500/25 bg-gradient-to-br from-violet-950/50 to-indigo-950/60 p-4 sm:p-8 not-prose">
      <div className="flex items-start gap-3 mb-5">
        <ShieldPlus className="h-7 w-7 text-violet-300 shrink-0 mt-0.5" aria-hidden />
        <div className="min-w-0">
          <h3 className="text-base sm:text-lg font-bold text-white m-0 leading-snug">{t(`${k}.title`)}</h3>
          <p className="text-sm text-indigo-100/85 m-0 mt-1 leading-relaxed">{t(`${k}.subtitle`)}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 sm:gap-2.5 mb-6">
        {SCENARIOS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setActive(s)}
            className={`w-full sm:w-auto rounded-full px-4 py-2.5 text-xs font-semibold transition-colors text-left sm:text-center ${
              active === s
                ? 'bg-violet-500/40 border border-violet-400/50 text-white'
                : 'bg-white/5 border border-white/10 text-indigo-200/90 hover:border-white/25'
            }`}
          >
            {t(`${k}.scenarios.${s}.label`)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 min-[400px]:grid-cols-3 gap-3 sm:gap-4 mb-5">
        <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-center">
          <p className="text-xs text-indigo-300/80 mb-1">{t(`${k}.base`)}</p>
          <p className="text-2xl font-black text-white m-0">{baseHours} h</p>
        </div>
        <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 p-4 text-center flex flex-col items-center justify-center">
          <Percent className="h-5 w-5 text-violet-300 mb-1" aria-hidden />
          <p className="text-2xl font-black text-violet-200 m-0">+{pct}%</p>
        </div>
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
          <p className="text-xs text-emerald-300/80 mb-1">{t(`${k}.total`)}</p>
          <p className="text-2xl font-black text-white m-0">{Math.round(baseHours * (1 + pct / 100))} h</p>
        </div>
      </div>

      <p className="text-sm text-indigo-100/90 m-0 rounded-lg border border-white/10 bg-white/5 p-4">
        {t(`${k}.scenarios.${active}.note`)}
      </p>
      <figcaption className="mt-4 text-xs text-indigo-200/70 text-center">{t(`${k}.caption`)}</figcaption>
    </figure>
  );
}
