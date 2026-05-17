import { Target, LayoutGrid, Clock, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const POST = 'posts.planificacionProyectos.section1';

export function PlanificacionFasesVisual() {
  const { t } = useTranslation('blog');

  const phases = [
    { Icon: Target, card: 'bg-indigo-950/50 border-indigo-500/20', iconBg: 'bg-indigo-500/30', icon: 'text-indigo-300', title: 'phaseStartTitle', text: 'phaseStartText' },
    { Icon: LayoutGrid, card: 'bg-purple-950/50 border-purple-500/20', iconBg: 'bg-purple-500/30', icon: 'text-purple-300', title: 'phasePlanningTitle', text: 'phasePlanningText' },
    { Icon: Clock, card: 'bg-emerald-950/50 border-emerald-500/20', iconBg: 'bg-emerald-500/30', icon: 'text-emerald-300', title: 'phaseExecutionTitle', text: 'phaseExecutionText' },
    { Icon: CheckCircle2, card: 'bg-amber-950/50 border-amber-500/20', iconBg: 'bg-amber-500/30', icon: 'text-amber-300', title: 'phaseCloseTitle', text: 'phaseCloseText' },
  ] as const;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 sm:p-8 my-6 not-prose">
      <h3 className="text-lg sm:text-xl font-bold text-white mb-4">{t(`${POST}.phasesTitle`)}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {phases.map(({ Icon, card, iconBg, icon, title, text }) => (
          <div key={title} className={`p-4 rounded-xl border ${card} text-center flex flex-col items-center`}>
            <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center mb-2`}>
              <Icon className={`h-5 w-5 ${icon}`} />
            </div>
            <h4 className="text-white font-semibold text-sm mb-1">{t(`${POST}.${title}`)}</h4>
            <p className="text-xs text-indigo-200/85">{t(`${POST}.${text}`)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
