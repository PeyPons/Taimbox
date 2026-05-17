import { GanttChart, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const POST = 'posts.planificacionProyectos.section2';

export function PlanificacionGanttCompareVisual() {
  const { t } = useTranslation('blog');

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 sm:p-8 my-6 not-prose">
      <h3 className="text-lg sm:text-xl font-bold text-white mb-3">{t(`${POST}.compareTitle`)}</h3>
      <p className="text-indigo-100/90 mb-4">{t(`${POST}.compareIntro`)}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-slate-800/50 border border-white/10 text-center flex flex-col items-center">
          <GanttChart className="h-8 w-8 text-amber-400 mb-3" />
          <h4 className="text-white font-semibold mb-2">{t(`${POST}.onlyTasksTitle`)}</h4>
          <p className="text-sm text-indigo-200/90">{t(`${POST}.onlyTasksText`)}</p>
        </div>
        <div className="p-4 rounded-xl bg-indigo-950/50 border border-indigo-500/20 text-center flex flex-col items-center">
          <div className="flex items-center gap-2 mb-3">
            <GanttChart className="h-6 w-6 text-indigo-400" />
            <Users className="h-6 w-6 text-indigo-400" />
          </div>
          <h4 className="text-white font-semibold mb-2">{t(`${POST}.tasksResourcesTitle`)}</h4>
          <p className="text-sm text-indigo-200/90">{t(`${POST}.tasksResourcesText`)}</p>
        </div>
      </div>
    </section>
  );
}
