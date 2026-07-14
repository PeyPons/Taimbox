import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Calendar, Check, ChevronDown, LayoutGrid, Plus, Search, SlidersHorizontal, Sun, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { PlannerSheetViewMode } from '@/components/planner/allocation/plannerSheetViewMode';

type SortOption = 'budget_desc' | 'budget_asc' | 'my_hours_desc' | 'my_hours_asc' | 'name_asc' | 'name_desc';

interface AllocationToolbarControlsProps {
  isMobile: boolean;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  viewMode: PlannerSheetViewMode;
  onViewModeChange: (mode: PlannerSheetViewMode) => void;
  /** Etiqueta «Mi día» frente a «Día» al ver la propia ficha. */
  isOwnEmployee?: boolean;
  isWeeklyEnabled?: boolean;
  onOpenWeekly?: () => void;
  sortButtonLabel: string;
  sortOptionLabel: string;
  autoExpand: boolean;
  onToggleAutoExpand: () => void;
  sortOption: SortOption;
  onSetSortOption: (option: SortOption) => void;
  onAddTask?: () => void;
}

const viewBtnClass = (active: boolean, isMobile: boolean) =>
  cn(
    'h-7 px-2 gap-1.5',
    isMobile && 'h-11 min-h-[44px] px-2.5',
    active && 'bg-white shadow-sm text-indigo-600',
  );

export function AllocationToolbarControls({
  isMobile,
  searchTerm,
  onSearchTermChange,
  viewMode,
  onViewModeChange,
  isOwnEmployee = false,
  isWeeklyEnabled = false,
  onOpenWeekly,
  sortButtonLabel,
  sortOptionLabel,
  autoExpand,
  onToggleAutoExpand,
  sortOption,
  onSetSortOption,
  onAddTask,
}: AllocationToolbarControlsProps) {
  const { t } = useTranslation('app');
  const isMonthView = viewMode === 'month';

  const dayLabel = isOwnEmployee
    ? t('team.dashboard.myDay', 'Mi día')
    : t('planner.allocationToolbar.viewDay', 'Día');

  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2">
      {viewMode !== 'day' && (
        <>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  'relative transition-all duration-300 ease-in-out',
                  searchTerm ? 'w-full sm:w-44' : 'w-9 focus-within:w-full sm:focus-within:w-44',
                )}
              >
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder={t('planner.allocationToolbar.searchPlaceholder', 'Buscar...')}
                  className={cn('pl-9 h-9 text-xs bg-white/50 focus:bg-white transition-all', !searchTerm && 'cursor-pointer')}
                  value={searchTerm}
                  onChange={(e) => onSearchTermChange(e.target.value)}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {t('planner.allocationToolbar.searchTooltip', 'Filtra por nombre de tarea o de proyecto')}
            </TooltipContent>
          </Tooltip>

          <div className="hidden sm:block h-6 w-px bg-slate-200" />
        </>
      )}

      <div className="flex bg-slate-100/80 p-1 rounded-lg gap-0.5 shrink-0" data-tour="planner-view-toggle">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={viewBtnClass(viewMode === 'day', isMobile)}
              onClick={() => onViewModeChange('day')}
            >
              <Sun className="h-3.5 w-3.5 shrink-0" />
              <span className="text-xs font-medium">{dayLabel}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {isOwnEmployee
              ? t('planner.allocationToolbar.viewMyDayTooltip', 'Foco de hoy y backlog semanal')
              : t('planner.allocationToolbar.viewDayTooltip', 'Foco de hoy y backlog de la semana')}
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={viewBtnClass(viewMode === 'week', isMobile)}
              onClick={() => onViewModeChange('week')}
            >
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              <span className="text-xs font-medium">{t('planner.allocationToolbar.viewWeek', 'Semana')}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {t('planner.allocationToolbar.viewWeekTooltip', 'Vista: semana actual')}
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={viewBtnClass(viewMode === 'month', isMobile)}
              onClick={() => onViewModeChange('month')}
            >
              <LayoutGrid className="h-3.5 w-3.5 shrink-0" />
              <span className="text-xs font-medium">{t('planner.allocationToolbar.viewMonth', 'Mes')}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {t('planner.allocationToolbar.viewMonthTooltip', 'Vista: mes completo (todas las semanas)')}
          </TooltipContent>
        </Tooltip>

        {isWeeklyEnabled && onOpenWeekly && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn('h-7 px-2 text-slate-500 hover:text-indigo-600', isMobile && 'h-11 min-h-[44px] px-3')}
                onClick={onOpenWeekly}
              >
                <TrendingUp className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-[220px]">
              <p className="font-medium">{t('planner.allocationToolbar.weeklyForecastTitle', 'Previsión semanal')}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t('planner.allocationToolbar.weeklyForecastDesc', 'Resumen de cierre de semana y tareas pendientes de revisar.')}
              </p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {viewMode !== 'day' && (
        <>
          <div className="hidden sm:block h-6 w-px bg-slate-200" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-2 gap-1.5 text-slate-600 border-slate-200 min-w-0 shrink-0"
                data-tour="planner-sort"
                aria-label={sortOptionLabel}
              >
                <SlidersHorizontal className="h-3.5 w-3.5 shrink-0" />
                <span className="text-xs hidden md:inline truncate max-w-[120px] lg:max-w-[160px]">{sortButtonLabel}</span>
                <ChevronDown className="h-3 w-3 opacity-50 shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {isMonthView && (
                <>
                  <div className="p-2">
                    <p className="text-xs font-semibold text-slate-500 mb-2 px-1">
                      {t('planner.allocationToolbar.displaySection', 'VISUALIZACIÓN')}
                    </p>
                    <div
                      className="flex items-center justify-between px-2 py-1.5 hover:bg-slate-50 rounded cursor-pointer"
                      onClick={onToggleAutoExpand}
                    >
                      <span className="text-sm">{t('planner.allocationToolbar.expandedProjects', 'Proyectos expandidos')}</span>
                      {autoExpand && <Check className="h-3.5 w-3.5 text-indigo-600" />}
                    </div>
                  </div>
                  <div className="h-px bg-slate-100 my-1" />
                </>
              )}
              <div className="p-2">
                <p className="text-xs font-semibold text-slate-500 mb-2 px-1">
                  {isMonthView
                    ? t('planner.allocationToolbar.sortSection', 'ORDENAR POR')
                    : t('planner.allocationToolbar.sortProjectsSection', 'ORDENAR PROYECTOS')}
                </p>
                <DropdownMenuItem onClick={() => onSetSortOption('budget_desc')} className="text-xs">
                  {sortOption === 'budget_desc' && <Check className="h-3 w-3 mr-2 text-indigo-600" />}
                  {t('planner.allocationSheet.sort.budgetDesc', 'Horas contratadas (Mayor)')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSetSortOption('budget_asc')} className="text-xs">
                  {sortOption === 'budget_asc' && <Check className="h-3 w-3 mr-2 text-indigo-600" />}
                  {t('planner.allocationSheet.sort.budgetAsc', 'Horas contratadas (Menor)')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSetSortOption('my_hours_desc')} className="text-xs">
                  {sortOption === 'my_hours_desc' && <Check className="h-3 w-3 mr-2 text-indigo-600" />}
                  {t('planner.allocationSheet.sort.myHoursDesc', 'Mis horas (Mayor)')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSetSortOption('my_hours_asc')} className="text-xs">
                  {sortOption === 'my_hours_asc' && <Check className="h-3 w-3 mr-2 text-indigo-600" />}
                  {t('planner.allocationSheet.sort.myHoursAsc', 'Mis horas (Menor)')}
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )}

      {onAddTask && viewMode === 'week' && (
        <>
          <div className="hidden sm:block h-6 w-px bg-slate-200" />
          <Button
            size="sm"
            className={cn(
              'gap-1.5 shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm',
              isMobile ? 'h-11 min-h-[44px]' : 'h-9',
            )}
            onClick={onAddTask}
            data-tour="planner-add-task"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">{t('planner.allocationSheet.addTask', 'Añadir tarea')}</span>
          </Button>
        </>
      )}
    </div>
  );
}
