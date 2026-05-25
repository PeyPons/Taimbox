import { GitBranch, History, Layers, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function MetodosEstimacionVisual() {
  const { t } = useTranslation('blog');
  const k = 'components.metodosEstimacion';

  const branches = [
    { key: 'analogy', icon: History, accent: 'emerald' },
    { key: 'bottomUp', icon: Layers, accent: 'indigo' },
    { key: 'pert', icon: Zap, accent: 'amber' },
  ] as const;

  const accent = {
    emerald: 'border-emerald-500/40 bg-emerald-500/10',
    indigo: 'border-indigo-500/40 bg-indigo-500/10',
    amber: 'border-amber-500/40 bg-amber-500/10',
  };

  const iconColor = {
    emerald: 'text-emerald-300',
    indigo: 'text-indigo-300',
    amber: 'text-amber-300',
  };

  return (
    <figure className="w-full m-0 rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-8 not-prose">
      <div className="flex flex-col items-center mb-6">
        <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2">
          <GitBranch className="h-4 w-4 text-indigo-300" aria-hidden />
          <span className="text-sm font-semibold text-white">{t(`${k}.root`)}</span>
        </div>
        <div className="w-px h-6 bg-white/20 my-1" aria-hidden />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {branches.map((b) => {
          const Icon = b.icon;
          return (
            <article key={b.key} className={`rounded-xl border p-5 flex flex-col gap-3 ${accent[b.accent]}`}>
              <div className="flex items-center gap-2">
                <Icon className={`h-6 w-6 shrink-0 ${iconColor[b.accent]}`} aria-hidden />
                <h4 className="text-sm font-bold text-white m-0">{t(`${k}.branches.${b.key}.title`)}</h4>
              </div>
              <p className="text-xs text-indigo-100/90 m-0 flex-1">{t(`${k}.branches.${b.key}.when`)}</p>
              <p className="text-xs font-medium text-white/95 m-0 border-t border-white/10 pt-3">
                {t(`${k}.branches.${b.key}.output`)}
              </p>
            </article>
          );
        })}
      </div>
      <figcaption className="mt-6 text-xs text-indigo-200/75 text-center">{t(`${k}.caption`)}</figcaption>
    </figure>
  );
}
