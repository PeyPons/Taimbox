import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const POST = 'posts.planificacionProyectos.section4';

export function PlanificacionCapacityCardsVisual() {
  const { t } = useTranslation('blog');

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-5 my-6 not-prose">
      <article className="rounded-2xl border border-red-500/30 bg-gradient-to-br from-red-900/40 to-orange-900/20 p-5 sm:p-6 flex flex-col items-center text-center">
        <span className="w-12 h-12 rounded-xl bg-red-500/30 flex items-center justify-center mb-4">
          <AlertTriangle className="h-6 w-6 text-red-300" />
        </span>
        <h3 className="text-white font-bold mb-3 text-lg">{t(`${POST}.noVisibilityTitle`)}</h3>
        <p className="text-indigo-100/90 text-sm leading-relaxed">{t(`${POST}.noVisibilityText`)}</p>
      </article>
      <article className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-900/40 to-teal-900/20 p-5 sm:p-6 flex flex-col items-center text-center">
        <span className="w-12 h-12 rounded-xl bg-emerald-500/30 flex items-center justify-center mb-4">
          <CheckCircle2 className="h-6 w-6 text-emerald-300" />
        </span>
        <h3 className="text-white font-bold mb-3 text-lg">{t(`${POST}.capacityPlanningTitle`)}</h3>
        <p className="text-indigo-100/90 text-sm leading-relaxed">{t(`${POST}.capacityPlanningText`)}</p>
      </article>
    </section>
  );
}
