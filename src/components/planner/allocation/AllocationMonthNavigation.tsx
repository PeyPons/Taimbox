import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

interface AllocationMonthNavigationProps {
  isMobile: boolean;
  monthLabel: string;
  showAllWeeks: boolean;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onScrollWeeksLeft: () => void;
  onScrollWeeksRight: () => void;
}

export function AllocationMonthNavigation({
  isMobile,
  monthLabel,
  showAllWeeks,
  onPrevMonth,
  onNextMonth,
  onScrollWeeksLeft,
  onScrollWeeksRight,
}: AllocationMonthNavigationProps) {
  return (
    <div className="flex flex-col items-center gap-2 w-full xl:w-auto xl:absolute xl:left-1/2 xl:top-1 xl:-translate-x-1/2 z-0 order-3 xl:order-2">
      <div className="flex items-center gap-1 sm:gap-1 bg-white/50 backdrop-blur-sm p-1 rounded-full border shadow-sm">
        <Button variant="ghost" size="icon" className={cn("h-8 w-8 rounded-full", isMobile && "h-11 w-11 min-h-[44px]")} onClick={onPrevMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className={cn("text-base font-bold capitalize text-center select-none text-slate-700", isMobile ? "w-28 min-w-0 truncate" : "w-36")}>
          {monthLabel}
        </span>
        <Button variant="ghost" size="icon" className={cn("h-8 w-8 rounded-full", isMobile && "h-11 w-11 min-h-[44px]")} onClick={onNextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div
        className={cn(
          "flex items-center gap-3 transition-all duration-300 overflow-hidden",
          showAllWeeks ? "h-8 opacity-100" : "h-0 opacity-0"
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          onClick={onScrollWeeksLeft}
          disabled={!showAllWeeks}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 select-none">Navegar Semanas</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          onClick={onScrollWeeksRight}
          disabled={!showAllWeeks}
        >
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

