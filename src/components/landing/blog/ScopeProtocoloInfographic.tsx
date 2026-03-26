import { ClipboardList, Calculator, MessageCircle } from 'lucide-react';

const steps = [
  {
    icon: ClipboardList,
    title: 'REGISTRAR',
    body: 'Cada solicitud fuera de alcance se anota en el momento. Sin registro, no hay conversación posible.',
    accent: 'violet',
  },
  {
    icon: Calculator,
    title: 'CUANTIFICAR',
    body: 'Estima el tiempo antes de aceptar. Sin número, no hay precio posible.',
    accent: 'amber',
  },
  {
    icon: MessageCircle,
    title: 'COMUNICAR',
    body: 'Informa al cliente antes de ejecutar, no después. Siempre.',
    accent: 'emerald',
  },
] as const;

export function ScopeProtocoloInfographic() {
  return (
    <figure className="my-8 rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-950/80 to-purple-950/50 p-4 sm:p-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {steps.map((s) => {
          const Icon = s.icon;
          const border =
            s.accent === 'violet'
              ? 'border-violet-500/40 bg-violet-500/10'
              : s.accent === 'amber'
                ? 'border-amber-500/40 bg-amber-500/10'
                : 'border-emerald-500/40 bg-emerald-500/10';
          const iconColor =
            s.accent === 'violet' ? 'text-violet-300' : s.accent === 'amber' ? 'text-amber-300' : 'text-emerald-300';
          return (
            <div
              key={s.title}
              className={`rounded-xl border p-4 sm:p-5 ${border} flex flex-col gap-2 min-h-[140px]`}
            >
              <div className="flex items-center gap-2">
                <Icon className={`h-6 w-6 shrink-0 ${iconColor}`} aria-hidden />
                <span className="text-xs font-black tracking-widest text-white/90">{s.title}</span>
              </div>
              <p className="text-sm text-indigo-100/90 leading-relaxed m-0 flex-1">{s.body}</p>
            </div>
          );
        })}
      </div>
      <blockquote className="mt-6 text-center border-t border-white/10 pt-6 px-2">
        <p className="text-lg sm:text-xl md:text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-violet-200 via-white to-emerald-200 leading-snug">
          «¿Lo añadimos ajustando el presupuesto, o lo dejamos para el próximo sprint?»
        </p>
      </blockquote>
      <figcaption className="mt-4 text-xs text-indigo-200/70 text-center">
        Protocolo de alcance en tres pasos: la frase del pie convierte el conflicto en bifurcación, no en muro.
      </figcaption>
    </figure>
  );
}
