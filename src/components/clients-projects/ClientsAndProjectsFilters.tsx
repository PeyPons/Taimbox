/**
 * Filtros de la página Clientes y Proyectos con estado interno.
 * Notifica al padre vía onFiltersChange para que la lista se filtre sin prop-drilling.
 * En móvil: búsqueda siempre visible; resto de filtros colapsables.
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Search,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  Check,
  User,
  X,
  LayoutGrid,
  Ban,
  CircleDashed,
  Clock,
  AlertOctagon,
  SlidersHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type FilterType = 'all' | 'needs-planning' | 'behind-schedule' | 'over-budget' | 'no-activity';
export type StatusFilter = 'all' | 'active' | 'completed' | 'archived' | 'hidden';

export interface ClientsAndProjectsFiltersValues {
  searchQuery: string;
  statusFilter: StatusFilter;
  projectTypeFilter: string;
  selectedEmployeeId: string;
  activeFilter: FilterType;
}

export interface ProjectFilterOption {
  id: string;
  displayName: string;
}

export interface EmployeeOption {
  id: string;
  name: string;
  isActive?: boolean;
}

export interface ClientsAndProjectsFiltersProps {
  activeFilters: ProjectFilterOption[];
  employees: EmployeeOption[];
  onFiltersChange: (values: ClientsAndProjectsFiltersValues) => void;
}

const SEARCH_DEBOUNCE_MS = 300;

export function ClientsAndProjectsFilters({
  activeFilters,
  employees,
  onFiltersChange,
}: ClientsAndProjectsFiltersProps) {
  const { t } = useTranslation('app');

  const statusLabels: Record<StatusFilter, string> = useMemo(() => ({
    all: t('clientsAndProjects.filters.status.all', 'Todos los estados'),
    active: t('clientsAndProjects.filters.status.active', 'Solo activos'),
    completed: t('clientsAndProjects.filters.status.completed', 'Solo completados'),
    archived: t('clientsAndProjects.filters.status.archived', 'Solo archivados'),
    hidden: t('clientsAndProjects.filters.status.hidden', 'Solo ocultos'),
  }), [t]);

  const quickLabels: Record<FilterType, string> = useMemo(() => ({
    all: t('clientsAndProjects.filters.quick.all', 'Todos'),
    'no-activity': t('clientsAndProjects.filters.quick.noActivity', 'Sin actividad'),
    'needs-planning': t('clientsAndProjects.filters.quick.needsPlanning', 'Falta planificar'),
    'behind-schedule': t('clientsAndProjects.filters.quick.behindSchedule', 'Retrasados'),
    'over-budget': t('clientsAndProjects.filters.quick.overBudget', 'Exceso horas'),
  }), [t]);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [projectTypeFilter, setProjectTypeFilter] = useState('all');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('all');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [openStatusFilter, setOpenStatusFilter] = useState(false);
  const [openProjectTypeFilter, setOpenProjectTypeFilter] = useState(false);
  const [openEmployeeCombo, setOpenEmployeeCombo] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onFiltersChangeRef = useRef(onFiltersChange);
  onFiltersChangeRef.current = onFiltersChange;

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearchQuery(searchInput);
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchInput]);

  const emit = useCallback(() => {
    onFiltersChangeRef.current({
      searchQuery,
      statusFilter,
      projectTypeFilter,
      selectedEmployeeId,
      activeFilter,
    });
  }, [searchQuery, statusFilter, projectTypeFilter, selectedEmployeeId, activeFilter]);

  useEffect(() => {
    emit();
  }, [emit]);

  const selectedEmployeeName =
    selectedEmployeeId === 'all'
      ? t('clientsAndProjects.filters.employees.all', 'Todos los empleados')
      : employees.find((e) => e.id === selectedEmployeeId)?.name ?? t('clientsAndProjects.filters.employees.placeholder', 'Seleccionar...');

  const typeLabel =
    projectTypeFilter === 'all'
      ? t('clientsAndProjects.filters.types.all', 'Todos los tipos')
      : activeFilters.find((f) => f.id === projectTypeFilter)?.displayName ?? t('clientsAndProjects.filters.types.placeholder', 'Tipo');

  const dropdownFilters = (
    <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 sm:gap-3 min-w-0">
      <Popover open={openStatusFilter} onOpenChange={setOpenStatusFilter}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full sm:w-[160px] h-9 justify-between font-normal">
            <span className="truncate">{statusLabels[statusFilter]}</span>
            <ChevronDown className="h-3.5 w-3.5 opacity-50 shrink-0" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command>
            <CommandList className="max-h-[280px]">
              <CommandGroup>
                {(['all', 'active', 'completed', 'archived', 'hidden'] as const).map((val) => (
                  <CommandItem
                    key={val}
                    value={statusLabels[val]}
                    onSelect={() => {
                      setStatusFilter(val);
                      setOpenStatusFilter(false);
                    }}
                  >
                    <Check className={cn('mr-2 h-4 w-4 shrink-0', statusFilter === val ? 'opacity-100' : 'opacity-0')} />
                    {statusLabels[val]}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Popover open={openProjectTypeFilter} onOpenChange={setOpenProjectTypeFilter}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full sm:w-[140px] h-9 justify-between font-normal">
            <span className="truncate">{typeLabel}</span>
            <ChevronDown className="h-3.5 w-3.5 opacity-50 shrink-0" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command>
            <CommandList className="max-h-[280px]">
              <CommandEmpty>{t('common.no_results', 'No hay resultados.')}</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  value={t('clientsAndProjects.filters.types.all', 'Todos los tipos')}
                  onSelect={() => {
                    setProjectTypeFilter('all');
                    setOpenProjectTypeFilter(false);
                  }}
                >
                  <Check className={cn('mr-2 h-4 w-4 shrink-0', projectTypeFilter === 'all' ? 'opacity-100' : 'opacity-0')} />
                  {t('clientsAndProjects.filters.types.all', 'Todos los tipos')}
                </CommandItem>
                {activeFilters.map((filter) => (
                  <CommandItem
                    key={filter.id}
                    value={filter.displayName}
                    onSelect={() => {
                      setProjectTypeFilter(filter.id);
                      setOpenProjectTypeFilter(false);
                    }}
                  >
                    <Check className={cn('mr-2 h-4 w-4 shrink-0', projectTypeFilter === filter.id ? 'opacity-100' : 'opacity-0')} />
                    {filter.displayName}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Popover open={openEmployeeCombo} onOpenChange={setOpenEmployeeCombo}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" className="w-full sm:w-[180px] h-9 justify-between bg-white shrink-0">
            <span className="flex items-center gap-2 truncate min-w-0">
              <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{selectedEmployeeName}</span>
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50 shrink-0" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] sm:w-[180px] p-0">
          <Command>
            <CommandInput placeholder={t('clientsAndProjects.filters.employees.search', 'Buscar...')} />
            <CommandList>
              <CommandEmpty>{t('clientsAndProjects.filters.employees.notFound', 'No se encontró el empleado.')}</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    setSelectedEmployeeId('all');
                    setOpenEmployeeCombo(false);
                  }}
                >
                  {t('clientsAndProjects.filters.employees.all', 'Todos los empleados')}
                </CommandItem>
                {employees.map((e) => (
                  <CommandItem
                    key={e.id}
                    onSelect={() => {
                      setSelectedEmployeeId(e.id);
                      setOpenEmployeeCombo(false);
                    }}
                  >
                    {e.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );

  const quickFilters = (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-slate-500 mr-1 hidden sm:inline">{t('clientsAndProjects.filters.quick.label', 'Filtros:')}</span>
      <Button
        variant={activeFilter === 'all' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setActiveFilter('all')}
        className={cn('h-8 text-xs gap-1.5', activeFilter === 'all' ? 'bg-slate-900' : 'bg-white')}
      >
        <LayoutGrid className="h-3.5 w-3.5" />
        {t('clientsAndProjects.filters.quick.all', 'Todos')}
      </Button>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={activeFilter === 'no-activity' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter('no-activity')}
              className={cn(
                'h-8 text-xs gap-1.5',
                activeFilter === 'no-activity' ? 'bg-slate-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              )}
            >
              <Ban className="h-3.5 w-3.5" />
              {t('clientsAndProjects.filters.quick.noActivity', 'Sin actividad')}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">{t('clientsAndProjects.filters.quick.noActivityTooltip', 'Proyectos sin tareas planificadas este mes')}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={activeFilter === 'needs-planning' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter('needs-planning')}
              className={cn(
                'h-8 text-xs gap-1.5',
                activeFilter === 'needs-planning' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-white border-amber-200 text-amber-700 hover:bg-amber-50'
              )}
            >
              <CircleDashed className="h-3.5 w-3.5" />
              <span className="sm:hidden">{t('clientsAndProjects.filters.quick.needsPlanningShort', 'Planificar')}</span>
              <span className="hidden sm:inline">{t('clientsAndProjects.filters.quick.needsPlanning', 'Falta planificar')}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">{t('clientsAndProjects.filters.quick.needsPlanningTooltip', 'Proyectos que no han planificado todas sus horas asignadas o mínimas')}</p>
            <p className="text-[10px] text-slate-400 mt-1">
              {t('clientsAndProjects.filters.quick.needsPlanningDetail', 'Si tiene horas asignadas, debe planificar todas. Si solo tiene mínimas, debe planificar al menos esas.')}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={activeFilter === 'behind-schedule' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter('behind-schedule')}
              className={cn(
                'h-8 text-xs gap-1.5',
                activeFilter === 'behind-schedule' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-white border-orange-200 text-orange-700 hover:bg-orange-50'
              )}
            >
              <Clock className="h-3.5 w-3.5" />
              {t('clientsAndProjects.filters.quick.behindSchedule', 'Retrasados')}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">{t('clientsAndProjects.filters.quick.behindScheduleTooltip', 'Ejecución por debajo del progreso del mes')}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={activeFilter === 'over-budget' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter('over-budget')}
              className={cn(
                'h-8 text-xs gap-1.5',
                activeFilter === 'over-budget' ? 'bg-red-600 hover:bg-red-700' : 'bg-white border-red-200 text-red-700 hover:bg-red-50'
              )}
            >
              <AlertOctagon className="h-3.5 w-3.5" />
              <span className="sm:hidden">{t('clientsAndProjects.filters.quick.overBudgetShort', 'Exceso')}</span>
              <span className="hidden sm:inline">{t('clientsAndProjects.filters.quick.overBudget', 'Exceso horas')}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">{t('clientsAndProjects.filters.quick.overBudgetTooltip', 'Proyectos con más horas planificadas que asignadas')}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );

  return (
    <div className="space-y-2 sm:space-y-3 min-w-0">
      <Collapsible open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen} className="space-y-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="relative w-full min-w-0 sm:max-w-md sm:flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder={t('clientsAndProjects.filters.searchPlaceholder', 'Buscar cliente o proyecto...')}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10 h-9"
            />
            {searchInput && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setSearchInput('')}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          <CollapsibleTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="sm:hidden h-9 px-2.5 gap-1.5 bg-white shrink-0"
              aria-label={t('clientsAndProjects.filters.openFilters', 'Filtros')}
            >
              <SlidersHorizontal className="h-3.5 w-3.5 shrink-0" />
              <span className="text-xs font-medium truncate max-w-[6rem]">
                {mobileFiltersOpen
                  ? t('clientsAndProjects.filters.hideFiltersShort', 'Cerrar')
                  : t('clientsAndProjects.filters.openFilters', 'Filtros')}
              </span>
              {(statusFilter !== 'active' || activeFilter !== 'all') && !mobileFiltersOpen && (
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" aria-hidden />
              )}
              {mobileFiltersOpen ? <ChevronDown className="h-3.5 w-3.5 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
            </Button>
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent className="sm:hidden space-y-3">
          {dropdownFilters}
          {quickFilters}
        </CollapsibleContent>
      </Collapsible>

      <div className="hidden sm:block space-y-3">
        {dropdownFilters}
        {quickFilters}
      </div>
    </div>
  );
}
