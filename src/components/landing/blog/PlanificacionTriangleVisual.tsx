import { Target, Clock, Wallet } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const POST = 'posts.planificacionProyectos.section3';

export function PlanificacionTriangleVisual() {
  const { t } = useTranslation('blog');

  const items = [
    { Icon: Target, card: 'bg-indigo-950/50 border-indigo-500/20', icon: 'text-indigo-400', title: 'triangleScopeTitle', text: 'triangleScopeText' },
    { Icon: Clock, card: 'bg-purple-950/50 border-purple-500/20', icon: 'text-purple-400', title: 'triangleTimeTitle', text: 'triangleTimeText' },
    { Icon: Wallet, card: 'bg-emerald-950/50 border-emerald-500/20', icon: 'text-emerald-400', title: 'triangleCostTitle', text: 'triangleCostText' },
  ] as const;

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 sm:p-8 my-6 not-prose">
      <h3 className="text-lg sm:text-xl font-bold text-white mb-4">{t(`${POST}.triangleTitle`)}</h3>
      <ul className="grid grid-cols-1 md:grid-cols-3 gap-4 list-none p-0 m-0">
        {items.map(({ Icon, card, icon, title, text }) => (
          <li key={title} className={`p-4 rounded-xl border ${card} text-center`}>
            <Icon className={`h-7 w-7 ${icon} mx-auto mb-2`} />
            <h4 className="text-white font-semibold text-sm mb-1">{t(`${POST}.${title}`)}</h4>
            <p className="text-xs text-indigo-200/85">{t(`${POST}.${text}`)}</p>
          </li>
        ))}
      </ul>
      <p className="text-indigo-200/80 text-sm mt-4 text-center">{t(`${POST}.triangleNote`)}</p>
    </section>
  );
}
