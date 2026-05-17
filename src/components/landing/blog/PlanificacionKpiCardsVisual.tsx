import { BarChart3, Clock, PieChart } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const POST = 'posts.planificacionProyectos.section5';

export function PlanificacionKpiCardsVisual() {
  const { t } = useTranslation('blog');

  const kpis = [
    { Icon: BarChart3, card: 'border-indigo-500/20 bg-indigo-950/30', icon: 'text-indigo-400', title: 'kpiProgressTitle', text: 'kpiProgressText' },
    { Icon: Clock, card: 'border-purple-500/20 bg-purple-950/30', icon: 'text-purple-400', title: 'kpiHoursTitle', text: 'kpiHoursText' },
    { Icon: PieChart, card: 'border-emerald-500/20 bg-emerald-950/30', icon: 'text-emerald-400', title: 'kpiMarginTitle', text: 'kpiMarginText' },
  ] as const;

  return (
    <ul className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 my-6 not-prose list-none p-0 m-0">
      {kpis.map(({ Icon, card, icon, title, text }) => (
        <li key={title} className={`rounded-2xl border ${card} p-5 flex flex-col items-center text-center`}>
          <Icon className={`h-8 w-8 ${icon} mb-4`} />
          <h4 className="text-white font-bold mb-2">{t(`${POST}.${title}`)}</h4>
          <p className="text-sm text-indigo-200/85">{t(`${POST}.${text}`)}</p>
        </li>
      ))}
    </ul>
  );
}
