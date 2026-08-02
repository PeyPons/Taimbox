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
  const viewingLabel = format(viewMonth, 'MMM yyyy', { locale });
  const currentLabel = format(todayMonth, 'MMM yyyy', { locale });

  return (
    <div
      className="text-xs sm:text-sm font-medium px-3 sm:px-4 py-1.5 sm:py-2 flex items-center justify-between sm:justify-center gap-2 sm:gap-4 lg:pl-64 bg-amber-50 text-amber-900 border-b border-amber-200"
      role="status"
      aria-live="polite"
    >
      <span className="inline-flex items-center gap-1.5 min-w-0">
        <CalendarRange className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" aria-hidden />
        <span className="min-w-0 leading-snug truncate sm:whitespace-normal">
          <span className="sm:hidden">
            {t('layout.monthBanner.viewingShort', 'Viendo')}{' '}
            <strong className="capitalize">{viewingLabel}</strong>
            <span className="text-amber-800/80"> · {t('layout.monthBanner.todayShort', 'hoy')} </span>
            <strong className="capitalize">{currentLabel}</strong>
          </span>
          <span className="hidden sm:inline">
            {t('layout.monthBanner.viewing', 'Estás viendo')}{' '}
            <strong className="capitalize">{format(viewMonth, 'MMMM yyyy', { locale })}</strong>
            . {t('layout.monthBanner.todayIs', 'Hoy estamos en')}{' '}
            <strong className="capitalize">{format(todayMonth, 'MMMM yyyy', { locale })}</strong>.
          </span>
        </span>
      </span>
      <Button
        size="sm"
        variant="outline"
        className="h-7 gap-1 border-amber-400 text-amber-900 hover:bg-amber-100 shrink-0 px-2 sm:px-3 text-[11px] sm:text-xs"
        onClick={() => writeStoredPlannerMonth(todayMonth)}
      >
        {t('layout.monthBanner.goCurrentShort', 'Mes actual')}
      </Button>
    </div>
  );
}
