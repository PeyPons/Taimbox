import { ClipboardList, Calculator, MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface ScopeProtocoloInfographicProps {
  step1?: string; // Optional override if we want to pass from parent
  step2?: string;
  step3?: string;
}

export function ScopeProtocoloInfographic({ step1, step2, step3 }: ScopeProtocoloInfographicProps) {
  const { t } = useTranslation('blog');

  const items = [
    {
      icon: ClipboardList,
      title: t('components.scopeProtocolo.step1.title'),
      body: step1 || t('components.scopeProtocolo.step1.body'),
      accent: 'violet',
    },
    {
      icon: Calculator,
      title: t('components.scopeProtocolo.step2.title'),
      body: step2 || t('components.scopeProtocolo.step2.body'),
      accent: 'amber',
    },
    {
      icon: MessageCircle,
      title: t('components.scopeProtocolo.step3.title'),
      body: step3 || t('components.scopeProtocolo.step3.body'),
      accent: 'emerald',
    },
  ];

  return (
    <figure className="my-8 rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-950/80 to-purple-950/50 p-4 sm:p-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {items.map((s) => {
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
          {t('components.scopeProtocolo.quote')}
        </p>
      </blockquote>
      <figcaption className="mt-4 text-xs text-indigo-200/70 text-center">
        {t('components.scopeProtocolo.caption')}
      </figcaption>
    </figure>
  );
}
