import { useTranslation } from 'react-i18next';

export function CargaTrabajoFrameworkVisual() {
  const { t } = useTranslation('blog');
  const compKey = 'components.cargaTrabajoFramework';

  const steps = [
    { n: 1, title: t(`${compKey}.steps.0.title`), subtitle: t(`${compKey}.steps.0.subtitle`) },
    { n: 2, title: t(`${compKey}.steps.1.title`), subtitle: t(`${compKey}.steps.1.subtitle`) },
    { n: 3, title: t(`${compKey}.steps.2.title`), subtitle: t(`${compKey}.steps.2.subtitle`) },
    { n: 4, title: t(`${compKey}.steps.3.title`), subtitle: t(`${compKey}.steps.3.subtitle`) },
    { n: 5, title: t(`${compKey}.steps.4.title`), subtitle: t(`${compKey}.steps.4.subtitle`) },
    { n: 6, title: t(`${compKey}.steps.5.title`), subtitle: t(`${compKey}.steps.5.subtitle`) },
  ];

  return (
    <figure className="rounded-2xl border border-violet-500/35 bg-gradient-to-br from-violet-950/50 via-indigo-950/40 to-slate-950/60 p-5 sm:p-8 overflow-hidden not-prose">
      <figcaption className="text-center text-sm font-semibold text-violet-200/95 mb-6">
        {t(`${compKey}.caption`)}
      </figcaption>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        {steps.map((s, i) => (
          <div
            key={s.n}
            className="relative rounded-xl border border-white/10 bg-white/[0.06] p-3 sm:p-4 text-left min-h-[5.5rem] sm:min-h-[6rem] flex flex-col justify-between"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/25 text-violet-200 text-sm font-black">
                {s.n}
              </span>
              {i < steps.length - 1 && (
                <span className="hidden sm:block text-violet-500/40 text-xs font-mono" aria-hidden>
                  →
                </span>
              )}
            </div>
            <div>
              <p className="text-white font-bold text-sm sm:text-base leading-tight m-0">{s.title}</p>
              <p className="text-indigo-200/75 text-xs sm:text-sm m-0 mt-1">{s.subtitle}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="text-center text-indigo-300/70 text-xs mt-5 m-0">
        {t(`${compKey}.footer`)}
      </p>
    </figure>
  );
}
