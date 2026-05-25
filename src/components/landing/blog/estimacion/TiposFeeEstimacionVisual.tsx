import { FileCheck, Clock, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const TYPES = [
  { key: 'fixed', icon: FileCheck, accent: 'indigo' },
  { key: 'tm', icon: Clock, accent: 'emerald' },
  { key: 'retainer', icon: RefreshCw, accent: 'violet' },
] as const;

const styles = {
  indigo: 'border-indigo-500/40 bg-indigo-500/10',
  emerald: 'border-emerald-500/40 bg-emerald-500/10',
  violet: 'border-violet-500/40 bg-violet-500/10',
};

export function TiposFeeEstimacionVisual() {
  const { t } = useTranslation('blog');
  const k = 'components.tiposFeeEstimacion';

  return (
    <figure className="w-full m-0 rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-8 not-prose">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {TYPES.map((type) => {
          const Icon = type.icon;
          return (
            <article key={type.key} className={`rounded-xl border p-5 flex flex-col gap-3 ${styles[type.accent]}`}>
              <Icon className="h-7 w-7 text-white/90 shrink-0" aria-hidden />
              <h4 className="text-base font-bold text-white m-0">{t(`${k}.types.${type.key}.title`)}</h4>
              <p className="text-xs text-indigo-100/90 m-0 flex-1">{t(`${k}.types.${type.key}.estimate`)}</p>
              <p className="text-xs font-medium text-white/95 m-0 border-t border-white/10 pt-3">
                {t(`${k}.types.${type.key}.risk`)}
              </p>
            </article>
          );
        })}
      </div>
      <figcaption className="mt-5 text-xs text-indigo-200/75 text-center">{t(`${k}.caption`)}</figcaption>
    </figure>
  );
}
