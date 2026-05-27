import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAgency } from '@/contexts/AgencyContext';
import { useApp } from '@/contexts/AppContext';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { quickChecklistStorageKey } from '@/utils/onboardingDefaults';
import { Button } from '@/components/ui/button';
import { X, CheckCircle2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function OnboardingQuickChecklist() {
  const { t } = useAppTranslation();
  const { currentAgency } = useAgency();
  const { clients, projects } = useApp();
  const [dismissed, setDismissed] = useState(false);

  const visible = useMemo(() => {
    if (!currentAgency?.id || dismissed) return false;
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(quickChecklistStorageKey(currentAgency.id)) === '1';
  }, [currentAgency?.id, dismissed]);

  if (!visible || !currentAgency?.id) return null;

  const hasClient = clients.length > 0;
  const hasProject = projects.length > 0;

  const items = [
    {
      id: 'client',
      done: hasClient,
      label: t('onboarding.checklist.client', 'Añade tu primer cliente'),
      href: '/clients',
    },
    {
      id: 'project',
      done: hasProject,
      label: t('onboarding.checklist.project', 'Crea un proyecto'),
      href: '/clients',
    },
    {
      id: 'team',
      done: false,
      label: t('onboarding.checklist.team', 'Invita a tu equipo'),
      href: '/team',
    },
    {
      id: 'settings',
      done: false,
      label: t('onboarding.checklist.settings', 'Ajusta módulos y conexiones'),
      href: '/agency',
    },
  ];

  const allDone = hasClient && hasProject;

  const dismiss = () => {
    localStorage.removeItem(quickChecklistStorageKey(currentAgency.id));
    setDismissed(true);
  };

  return (
    <div
      className={cn(
        'shrink-0 border-b border-indigo-200/80 bg-gradient-to-r from-indigo-50/90 to-white px-3 py-2.5 sm:px-4',
        allDone && 'from-emerald-50/90'
      )}
      role="region"
      aria-label={t('onboarding.checklist.title', 'Primeros pasos')}
    >
      <div className="flex items-start justify-between gap-2 max-w-[1600px] mx-auto">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-slate-800 sm:text-sm">
            {allDone
              ? t('onboarding.checklist.allDone', '¡Buen trabajo! Ya tienes lo básico.')
              : t('onboarding.checklist.title', 'Primeros pasos en Taimbox')}
          </p>
          <ul className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-1.5 text-xs text-slate-700">
                {item.done ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" aria-hidden />
                ) : (
                  <Circle className="h-3.5 w-3.5 text-slate-400 shrink-0" aria-hidden />
                )}
                {item.done ? (
                  <span className="line-through text-slate-500">{item.label}</span>
                ) : (
                  <Link to={item.href} className="hover:text-indigo-700 hover:underline underline-offset-2">
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-slate-500"
          onClick={dismiss}
          aria-label={t('common.close', 'Cerrar')}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
