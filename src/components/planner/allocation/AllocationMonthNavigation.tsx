import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface AllocationMonthNavigationProps {
  isMobile: boolean;
  monthLabel: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

export function AllocationMonthNavigation({
  isMobile,
  monthLabel,
  onPrevMonth,
  onNextMonth,
}: AllocationMonthNavigationProps) {
  const { t } = useTranslation('app');

  return (
    <div className="flex items-center gap-1 bg-white/60 backdrop-blur-sm p-1 rounded-full border shadow-sm">
      <Button
        variant="ghost"
        size="icon"
        className={cn('h-8 w-8 rounded-full shrink-0', isMobile && 'h-10 w-10 min-h-[44px]')}
        onClick={onPrevMonth}
        aria-label={t('planner.allocation.monthNav.prevMonth', 'Mes anterior')}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span
        className={cn(
          'text-sm sm:text-base font-bold capitalize text-center select-none text-slate-700 tabular-nums',
          isMobile ? 'min-w-[7rem] px-1' : 'min-w-[9rem] px-2'
        )}
      >
        {monthLabel}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className={cn('h-8 w-8 rounded-full shrink-0', isMobile && 'h-10 w-10 min-h-[44px]')}
        onClick={onNextMonth}
        aria-label={t('planner.allocation.monthNav.nextMonth', 'Mes siguiente')}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
