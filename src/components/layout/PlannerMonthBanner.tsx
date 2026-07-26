import { format, isSameMonth, startOfMonth } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { CalendarRange } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import {
  PLANNER_MONTH_CHANGE_EVENT,
  readStoredPlannerMonth,
  writeStoredPlannerMonth,
} from '@/utils/plannerMonthStorage';
import { useEffect, useState } from 'react';

/**
 * Aviso global cuando el mes de planificación compartido no es el mes calendario actual.
 * Misma franja que DepartmentViewBanner / SubscriptionSoftLockBanner.
 */
export function PlannerMonthBanner() {
  const { t, i18n } = useAppTranslation();
  const [viewMonth, setViewMonth] = useState(() => readStoredPlannerMonth());
  const todayMonth = startOfMonth(new Date());

  useEffect(() => {
    const sync = () => setViewMonth(readStoredPlannerMonth());
    window.addEventListener(PLANNER_MONTH_CHANGE_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(PLANNER_MONTH_CHANGE_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  if (isSameMonth(viewMonth, todayMonth)) return null;

  const locale = i18n.language.startsWith('en') ? enUS : es;
  const viewingLabel = format(viewMonth, 'MMMM yyyy', { locale });
  const currentLabel = format(todayMonth, 'MMMM yyyy', { locale });

  return (
    <div
      className="text-sm font-medium px-4 py-2 flex items-center justify-center gap-4 flex-wrap lg:pl-64 bg-amber-50 text-amber-900 border-b border-amber-200"
      role="status"
      aria-live="polite"
    >
      <span className="inline-flex items-center gap-2">
        <CalendarRange className="h-4 w-4 shrink-0" aria-hidden />
        <span>
          {t('layout.monthBanner.viewing', 'Estás viendo')}{' '}
          <strong className="capitalize">{viewingLabel}</strong>.{' '}
          {t('layout.monthBanner.todayIs', 'Hoy estamos en')}{' '}
          <strong className="capitalize">{currentLabel}</strong>.
        </span>
      </span>
      <Button
        size="sm"
        variant="outline"
        className="h-7 gap-1 border-amber-400 text-amber-900 hover:bg-amber-100"
        onClick={() => writeStoredPlannerMonth(todayMonth)}
      >
        {t('layout.monthBanner.goCurrent', 'Ir al mes actual')}
      </Button>
    </div>
  );
}
