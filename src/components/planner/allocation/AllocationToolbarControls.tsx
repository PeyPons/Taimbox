import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Calendar, Check, ChevronDown, GanttChart, LayoutGrid, Search, SlidersHorizontal, TrendingUp } from 'lucide-react';

type SortOption = 'budget_desc' | 'budget_asc' | 'my_hours_desc' | 'my_hours_asc' | 'name_asc' | 'name_desc';

interface AllocationToolbarControlsProps {
  isMobile: boolean;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  effectiveShowAllWeeks: boolean;
  showAllWeeks: boolean;
  onToggleShowAllWeeks: () => void;
  onOpenTimeline: () => void;
  onOpenWeekly: () => void;
  sortButtonLabel: string;
  autoExpand: boolean;
  onToggleAutoExpand: () => void;
  sortOption: SortOption;
  onSetSortOption: (option: SortOption) => void;
}

export function AllocationToolbarControls({
  isMobile,
  searchTerm,
  onSearchTermChange,
  effectiveShowAllWeeks,
  showAllWeeks,
  onToggleShowAllWeeks,
  onOpenTimeline,
  onOpenWeekly,
  sortButtonLabel,
  autoExpand,
  onToggleAutoExpand,
  sortOption,
  onSetSortOption,
}: AllocationToolbarControlsProps) {
  return (
    <div className="flex items-center gap-2 z-10 ml-auto order-2 xl:order-3">
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("relative transition-all duration-300 ease-in-out", searchTerm ? "w-48" : "w-9 focus-within:w-48")}>
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Buscar tarea o proyecto..."
              className={cn("pl-9 h-9 text-xs bg-white/50 focus:bg-white transition-all", !searchTerm && "cursor-pointer")}
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
            />
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">Filtra por nombre de tarea o de proyecto</TooltipContent>
      </Tooltip>

      <div className="h-6 w-px bg-slate-200 mx-1" />

      <div className="flex bg-slate-100/80 p-1 rounded-lg gap-1" data-tour="planner-view-toggle">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn("h-7 px-2 gap-1.5", isMobile && "h-11 min-h-[44px] px-3", effectiveShowAllWeeks && "bg-white shadow-sm text-indigo-600")}
              onClick={onToggleShowAllWeeks}
            >
              {effectiveShowAllWeeks ? <LayoutGrid className="h-3.5 w-3.5 shrink-0" /> : <Calendar className="h-3.5 w-3.5 shrink-0" />}
              <span className="text-xs font-medium">{effectiveShowAllWeeks ? 'Mes' : 'Semana'}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Vista: {effectiveShowAllWeeks ? "mes completo (todas las semanas)" : "semana actual"}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn("h-7 px-2 text-slate-500 hover:text-indigo-600", isMobile && "h-11 min-h-[44px] px-3")}
              onClick={onOpenTimeline}
            >
              <GanttChart className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-[220px]">
            <p className="font-medium">Timeline</p>
            <p className="text-xs text-muted-foreground mt-0.5">Todas las semanas del mes en una línea para comparar cargas de un vistazo.</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn("h-7 px-2 text-slate-500 hover:text-indigo-600", isMobile && "h-11 min-h-[44px] px-3")}
              onClick={onOpenWeekly}
            >
              <TrendingUp className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-[220px]">
            <p className="font-medium">Previsión semanal</p>
            <p className="text-xs text-muted-foreground mt-0.5">Resumen de cierre de semana y tareas pendientes de revisar.</p>
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="h-6 w-px bg-slate-200 mx-1" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-9 px-2 gap-2 text-slate-600 border-slate-200 min-w-0" data-tour="planner-sort">
            <SlidersHorizontal className="h-3.5 w-3.5 shrink-0" />
            <span className="text-xs truncate max-w-[140px] sm:max-w-[200px]">{sortButtonLabel}</span>
            <ChevronDown className="h-3 w-3 opacity-50 shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {effectiveShowAllWeeks && (
            <>
              <div className="p-2">
                <p className="text-xs font-semibold text-slate-500 mb-2 px-1">VISUALIZACIÓN</p>
                <div className="flex items-center justify-between px-2 py-1.5 hover:bg-slate-50 rounded cursor-pointer" onClick={onToggleAutoExpand}>
                  <span className="text-sm">Proyectos expandidos</span>
                  {autoExpand && <Check className="h-3.5 w-3.5 text-indigo-600" />}
                </div>
              </div>
              <div className="h-px bg-slate-100 my-1" />
            </>
          )}
          <div className="p-2">
            <p className="text-xs font-semibold text-slate-500 mb-2 px-1">
              {effectiveShowAllWeeks ? 'ORDENAR POR' : 'ORDENAR PROYECTOS'}
            </p>
            <DropdownMenuItem onClick={() => onSetSortOption('budget_desc')} className="text-xs">
              {sortOption === 'budget_desc' && <Check className="h-3 w-3 mr-2 text-indigo-600" />} Horas contratadas (Mayor)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSetSortOption('budget_asc')} className="text-xs">
              {sortOption === 'budget_asc' && <Check className="h-3 w-3 mr-2 text-indigo-600" />} Horas contratadas (Menor)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSetSortOption('my_hours_desc')} className="text-xs">
              {sortOption === 'my_hours_desc' && <Check className="h-3 w-3 mr-2 text-indigo-600" />} Mis horas (Mayor)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSetSortOption('my_hours_asc')} className="text-xs">
              {sortOption === 'my_hours_asc' && <Check className="h-3 w-3 mr-2 text-indigo-600" />} Mis horas (Menor)
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

