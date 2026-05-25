import { Clock, Hourglass, MessageSquare, Layers } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const STEPS = [
  { key: 'design', icon: Clock, accent: 'indigo' },
  { key: 'wait', icon: Hourglass, accent: 'amber' },
  { key: 'changes', icon: Layers, accent: 'violet' },
  { key: 'approval', icon: MessageSquare, accent: 'emerald' },
] as const;

const accentMap = {
  indigo: 'border-indigo-500/40 bg-indigo-500/10 text-indigo-300',
  amber: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
  violet: 'border-violet-500/40 bg-violet-500/10 text-violet-300',
  emerald: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
};

export function EsfuerzoVsDuracionVisual() {
  const { t } = useTranslation('blog');
  const k = 'components.esfuerzoVsDuracion';

  return (
    <figure className="w-full m-0 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-4 sm:p-8 not-prose">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-5 text-center">
          <p className="text-xs uppercase tracking-wider text-emerald-300/90 mb-1">{t(`${k}.effortLabel`)}</p>
          <p className="text-3xl sm:text-4xl font-black text-white m-0">{t(`${k}.effortValue`)}</p>
          <p className="text-sm text-indigo-100/80 mt-2 m-0">{t(`${k}.effortHint`)}</p>
        </div>
        <div className="rounded-xl border border-amber-500/30 bg-amber-950/30 p-5 text-center">
          <p className="text-xs uppercase tracking-wider text-amber-300/90 mb-1">{t(`${k}.durationLabel`)}</p>
          <p className="text-3xl sm:text-4xl font-black text-white m-0">{t(`${k}.durationValue`)}</p>
          <p className="text-sm text-indigo-100/80 mt-2 m-0">{t(`${k}.durationHint`)}</p>
        </div>
      </div>

      <div className="relative">
        <div className="hidden sm:block absolute top-1/2 left-8 right-8 h-0.5 bg-white/10 -translate-y-1/2" aria-hidden />
        <ol className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-2 list-none p-0 m-0">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <li
                key={step.key}
                className={`relative rounded-xl border p-4 flex flex-col gap-2 ${accentMap[step.accent]}`}
              >
                <span className="text-[10px] font-black tracking-widest text-white/60">
                  {t(`${k}.step`, { n: i + 1 })}
                </span>
                <Icon className="h-5 w-5 shrink-0" aria-hidden />
                <span className="text-sm font-semibold text-white">{t(`${k}.steps.${step.key}.title`)}</span>
                <span className="text-xs text-indigo-100/85 leading-snug">{t(`${k}.steps.${step.key}.time`)}</span>
              </li>
            );
          })}
        </ol>
      </div>

      <figcaption className="mt-6 text-xs text-indigo-200/75 text-center">{t(`${k}.caption`)}</figcaption>
    </figure>
  );
}
