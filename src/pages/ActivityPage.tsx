/**
 * ActivityPage — Registro de actividad del equipo (/actividad)
 *
 * Superficie propia para el historial de auditoría de allocations,
 * independiente del módulo Weekly (que mantiene su pestaña Historial).
 * Acceso: plan Pro+ (PlanGuard) + permiso de rol can_access_activity_log.
 */

import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, CalendarDays, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ActivityLogSection } from '@/components/shared/ActivityLogSection';
import { useApp } from '@/contexts/AppContext';
import { usePlanMonthNavigation } from '@/hooks/usePlanMonthNavigation';
import { useEnsureMonthWithLoading } from '@/hooks/useEnsureMonthWithLoading';
import { useDateLocale } from '@/hooks/useDateLocale';

export default function ActivityPage() {
  const { t } = useTranslation('app');
  const dateLocale = useDateLocale();
  const { isLoading: isGlobalLoading } = useApp();
  const { currentMonth, goToPrevMonth, goToNextMonth, goToToday } = usePlanMonthNavigation();
  const isLoadingMonth = useEnsureMonthWithLoading(currentMonth, { enabled: !isGlobalLoading });

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          {t('activityPage.title', 'Registro de actividad')}
        </h1>
        <p className="text-slate-500 mt-1">
          {t('activityPage.subtitle', 'Historial de cambios en las tareas del equipo: quién hizo qué y cuándo')}
        </p>
      </div>

      <div className="flex items-center gap-4 bg-white p-2 rounded-lg border shadow-sm w-fit">
        <h2 className="text-lg font-bold capitalize text-slate-900 flex items-center gap-2 ml-2">
          {isLoadingMonth && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
          {format(currentMonth, 'MMMM yyyy', { locale: dateLocale })}
        </h2>
        <div className="h-6 w-px bg-slate-200 mx-2" />
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={goToPrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={goToToday} className="h-7 text-xs px-2">
            <CalendarDays className="h-3.5 w-3.5 mr-1.5" />
            {t('activityPage.monthCurrent', 'Mes actual')}
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ActivityLogSection currentMonth={currentMonth} />
    </div>
  );
}
