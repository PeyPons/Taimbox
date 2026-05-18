import { SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { SensitiveText } from '@/components/privacy/SensitiveText';
import { AllocationMonthNavigation } from '@/components/planner/allocation/AllocationMonthNavigation';
import { AllocationToolbarControls } from '@/components/planner/allocation/AllocationToolbarControls';
import { AllocationWeekStrip, WeekStripItemSummary } from '@/components/planner/allocation/AllocationWeekStrip';

type SortOption = 'budget_desc' | 'budget_asc' | 'my_hours_desc' | 'my_hours_asc' | 'name_asc' | 'name_desc';

interface WeekInfo {
  weekStart: Date;
  effectiveStart?: Date;
  effectiveEnd?: Date;
}

interface AllocationSheetHeaderProps {
  employee: { id: string; name: string; avatarUrl?: string | null };
  monthLabel: string;
  isMobile: boolean;
  effectiveShowAllWeeks: boolean;
  weeks: WeekInfo[];
  weekSummaries: WeekStripItemSummary[];
  activeWeekIndex: number;
  currentWeekIndex: number | null;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onSelectWeek: (index: number) => void;
  onAddTask?: () => void;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  onToggleShowAllWeeks: () => void;
  onOpenTimeline: () => void;
  onOpenWeekly: () => void;
  sortButtonLabel: string;
  sortOptionLabel: string;
  autoExpand: boolean;
  onToggleAutoExpand: () => void;
  sortOption: SortOption;
  onSetSortOption: (option: SortOption) => void;
}

export function AllocationSheetHeader({
  employee,
  monthLabel,
  isMobile,
  effectiveShowAllWeeks,
  weeks,
  weekSummaries,
  activeWeekIndex,
  currentWeekIndex,
  onPrevMonth,
  onNextMonth,
  onSelectWeek,
  onAddTask,
  searchTerm,
  onSearchTermChange,
  onToggleShowAllWeeks,
  onOpenTimeline,
  onOpenWeekly,
  sortButtonLabel,
  sortOptionLabel,
  autoExpand,
  onToggleAutoExpand,
  sortOption,
  onSetSortOption,
}: AllocationSheetHeaderProps) {
  return (
    <SheetHeader className="pb-3 border-b mb-4 space-y-2.5">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,auto)] gap-x-4 gap-y-2.5 items-center">
        <div className="flex items-center gap-3 min-w-0 order-1">
          {employee.avatarUrl ? (
            <Avatar className="h-10 w-10 border border-indigo-200/80 shadow-sm shrink-0">
              <AvatarImage src={employee.avatarUrl} alt={employee.name} />
              <AvatarFallback className="bg-indigo-100 text-indigo-700 font-bold">
                {employee.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold shadow-sm border border-indigo-200/80 shrink-0">
              {employee.name.substring(0, 2).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <SheetTitle className="text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2 min-w-0">
              <SensitiveText kind="employee" id={employee.id} asBlock>
                <span className="truncate">{employee.name}</span>
              </SensitiveText>
              <Badge variant="outline" className="font-normal text-slate-500 bg-slate-50 hidden sm:inline-flex shrink-0">
                Planificación
              </Badge>
            </SheetTitle>
          </div>
        </div>

        <div className="order-3 lg:order-2 flex justify-center w-full lg:w-auto">
          <AllocationMonthNavigation
            isMobile={isMobile}
            monthLabel={monthLabel}
            onPrevMonth={onPrevMonth}
            onNextMonth={onNextMonth}
          />
        </div>

        <div className="order-2 lg:order-3 justify-self-end w-full lg:w-auto">
          <AllocationToolbarControls
            isMobile={isMobile}
            searchTerm={searchTerm}
            onSearchTermChange={onSearchTermChange}
            effectiveShowAllWeeks={effectiveShowAllWeeks}
            onToggleShowAllWeeks={onToggleShowAllWeeks}
            onOpenTimeline={onOpenTimeline}
            onOpenWeekly={onOpenWeekly}
            sortButtonLabel={sortButtonLabel}
            sortOptionLabel={sortOptionLabel}
            autoExpand={autoExpand}
            onToggleAutoExpand={onToggleAutoExpand}
            sortOption={sortOption}
            onSetSortOption={onSetSortOption}
            onAddTask={onAddTask}
          />
        </div>
      </div>

      {!effectiveShowAllWeeks && weeks.length > 0 && (
        <AllocationWeekStrip
          weeks={weeks}
          weekSummaries={weekSummaries}
          activeWeekIndex={activeWeekIndex}
          currentWeekIndex={currentWeekIndex}
          onSelectWeek={onSelectWeek}
          isMobile={isMobile}
        />
      )}

      {effectiveShowAllWeeks && weeks.length > 0 && (
        <p className="text-[11px] text-slate-400 px-0.5">
          Desliza horizontalmente para ver las {weeks.length} semanas del mes
        </p>
      )}
    </SheetHeader>
  );
}
