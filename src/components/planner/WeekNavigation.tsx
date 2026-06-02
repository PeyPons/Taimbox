import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { useDateLocale } from '@/hooks/useDateLocale';

interface WeekNavigationProps {
  currentWeekIndex: number;
  totalWeeks: number;
  viewDate: Date;
  showAllWeeks: boolean;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onToggleView: () => void;
}

export function WeekNavigation({
  currentWeekIndex,
  totalWeeks,
  viewDate,
  showAllWeeks,
  onPrevWeek,
  onNextWeek,
  onToggleView,
}: WeekNavigationProps) {
  const { t } = useTranslation('app');
  const dateLocale = useDateLocale();
  const monthName = format(viewDate, 'MMMM', { locale: dateLocale });
  const monthLabel = `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} - ${format(viewDate, 'yyyy')}`;

  return (
    <div className="flex items-center justify-between p-4 border-b bg-slate-50">
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-slate-500" />
        <span className="text-sm font-medium text-slate-700">{monthLabel}</span>
        {!showAllWeeks && (
          <span className="text-xs text-slate-500">
            ({t('planner.weekNavigation.weekOf', 'Semana {{current}} de {{total}}', {
              current: currentWeekIndex + 1,
              total: totalWeeks,
            })})
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {!showAllWeeks && (
          <>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={onPrevWeek}
              disabled={currentWeekIndex === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={onNextWeek}
              disabled={currentWeekIndex >= totalWeeks - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleView}
          className="text-xs"
        >
          {showAllWeeks
            ? t('planner.weekNavigation.viewCurrentWeek', 'Ver semana actual')
            : t('planner.weekNavigation.viewAllWeeks', 'Ver todas las semanas')}
        </Button>
      </div>
    </div>
  );
}
