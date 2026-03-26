import { Activity, Clock, MessageSquareOff, TrendingDown } from 'lucide-react';

const ITEMS = [
  { Icon: MessageSquareOff, label: 'Menos participación', tone: 'text-amber-300' },
  { Icon: TrendingDown, label: 'Calidad irregular', tone: 'text-orange-300' },
  { Icon: Clock, label: 'Plazos que se escapan', tone: 'text-rose-300' },
  { Icon: Activity, label: 'Métricas de carga desiguales', tone: 'text-violet-300' },
] as const;

/** Resumen visual de señales tempranas (conducta + datos). */
export function SenalesCargaAlertaVisual() {
  return (
    <figure className="rounded-2xl border border-amber-500/25 bg-amber-950/20 p-5 sm:p-6 not-prose">
      <figcaption className="text-center text-sm font-semibold text-amber-200/90 mb-4">
        Señales tempranas: conducta + números
      </figcaption>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {ITEMS.map(({ Icon, label, tone }) => (
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
