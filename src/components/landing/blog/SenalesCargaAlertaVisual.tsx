import { Activity, Clock, MessageSquareOff, TrendingDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function SenalesCargaAlertaVisual() {
  const { t } = useTranslation('blog');
  const compKey = 'components.senalesCargaAlerta';

  const items = [
    { Icon: MessageSquareOff, label: t(`${compKey}.items.0`), tone: 'text-amber-300' },
    { Icon: TrendingDown, label: t(`${compKey}.items.1`), tone: 'text-orange-300' },
    { Icon: Clock, label: t(`${compKey}.items.2`), tone: 'text-rose-300' },
    { Icon: Activity, label: t(`${compKey}.items.3`), tone: 'text-violet-300' },
  ];

  return (
    <figure className="rounded-2xl border border-amber-500/25 bg-amber-950/20 p-5 sm:p-6 not-prose">
      <figcaption className="text-center text-sm font-semibold text-amber-200/90 mb-4">
        {t(`${compKey}.caption`)}
      </figcaption>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {items.map(({ Icon, label, tone }) => (
          <div
            key={label}
            className="flex flex-col items-center text-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-4"
          >
            <Icon className={`h-6 w-6 ${tone}`} strokeWidth={1.75} aria-hidden />
            <span className="text-xs sm:text-sm text-indigo-100/90 leading-snug">{label}</span>
          </div>
        ))}
      </div>
    </figure>
  );
}
