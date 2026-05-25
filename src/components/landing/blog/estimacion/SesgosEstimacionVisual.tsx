import { Briefcase, Shield, Palette, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ROLES = [
  { key: 'sales', icon: Briefcase, color: 'text-sky-300', bg: 'from-sky-950/60 to-indigo-950/40', border: 'border-sky-500/30' },
  { key: 'pm', icon: Shield, color: 'text-violet-300', bg: 'from-violet-950/60 to-indigo-950/40', border: 'border-violet-500/30' },
  { key: 'creative', icon: Palette, color: 'text-amber-300', bg: 'from-amber-950/60 to-indigo-950/40', border: 'border-amber-500/30' },
  { key: 'client', icon: User, color: 'text-rose-300', bg: 'from-rose-950/60 to-indigo-950/40', border: 'border-rose-500/30' },
] as const;

export function SesgosEstimacionVisual() {
  const { t } = useTranslation('blog');
  const k = 'components.sesgosEstimacion';

  return (
    <figure className="w-full m-0 rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-950/80 to-purple-950/50 p-5 sm:p-8 not-prose">
      <p className="text-center text-sm text-indigo-100/90 mb-6">{t(`${k}.intro`)}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {ROLES.map((role) => {
          const Icon = role.icon;
          return (
            <article
              key={role.key}
              className={`rounded-xl border ${role.border} bg-gradient-to-br ${role.bg} p-4 flex gap-3`}
            >
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/5 ${role.color}`}>
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-white m-0 mb-1">{t(`${k}.roles.${role.key}.title`)}</h4>
                <p className="text-xs text-indigo-200/85 m-0 mb-2">{t(`${k}.roles.${role.key}.bias`)}</p>
                <p className="text-xs font-medium text-white/90 m-0">{t(`${k}.roles.${role.key}.effect`)}</p>
              </div>
            </article>
          );
        })}
      </div>
      <div className="rounded-xl border border-white/15 bg-black/20 p-4 text-center">
        <p className="text-xs uppercase tracking-wider text-indigo-300/80 mb-2">{t(`${k}.funnelLabel`)}</p>
        <p className="text-base sm:text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-200 via-white to-rose-200 m-0 leading-relaxed px-2">
          {t(`${k}.funnelResult`)}
        </p>
      </div>
      <figcaption className="mt-4 text-xs text-indigo-200/70 text-center">{t(`${k}.caption`)}</figcaption>
    </figure>
  );
}
