/**
 * Filtros de la página Clientes y Proyectos con estado interno.
 * Notifica al padre vía onFiltersChange para que la lista se filtre sin prop-drilling.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Search,
  ChevronDown,
  ChevronsUpDown,
  Check,
  User,
  X,
  LayoutGrid,
  Ban,
  CircleDashed,
  Clock,
  AlertOctagon,
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

const statusLabels: Record<StatusFilter, string> = {
  all: 'Todos los estados',
  active: 'Solo activos',
  completed: 'Solo completados',
  archived: 'Solo archivados',
  hidden: 'Solo ocultos',
};

export function ClientsAndProjectsFilters({
  activeFilters,
  employees,
  onFiltersChange,
}: ClientsAndProjectsFiltersProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [projectTypeFilter, setProjectTypeFilter] = useState('all');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('all');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [openStatusFilter, setOpenStatusFilter] = useState(false);
  const [openProjectTypeFilter, setOpenProjectTypeFilter] = useState(false);
  const [openEmployeeCombo, setOpenEmployeeCombo] = useState(false);

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
      ? 'Todos los empleados'
      : employees.find((e) => e.id === selectedEmployeeId)?.name ?? 'Seleccionar...';

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente o proyecto..."
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

        <Popover open={openStatusFilter} onOpenChange={setOpenStatusFilter}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[160px] h-9 justify-between font-normal">
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
            <Button variant="outline" className="w-[140px] h-9 justify-between font-normal">
              <span className="truncate">
                {projectTypeFilter === 'all' ? 'Todos los tipos' : activeFilters.find((f) => f.id === projectTypeFilter)?.displayName ?? 'Tipo'}
              </span>
              <ChevronDown className="h-3.5 w-3.5 opacity-50 shrink-0" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
            <Command>
              <CommandList className="max-h-[280px]">
                <CommandEmpty>No hay tipos.</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    value="Todos los tipos"
                    onSelect={() => {
                      setProjectTypeFilter('all');
                      setOpenProjectTypeFilter(false);
                    }}
                  >
                    <Check className={cn('mr-2 h-4 w-4 shrink-0', projectTypeFilter === 'all' ? 'opacity-100' : 'opacity-0')} />
                    Todos los tipos
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
            <Button variant="outline" role="combobox" className="w-[180px] h-9 justify-between bg-white shrink-0">
              <span className="flex items-center gap-2 truncate">
                <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{selectedEmployeeName}</span>
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50 shrink-0" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[180px] p-0">
            <Command>
              <CommandInput placeholder="Buscar..." />
              <CommandList>
                <CommandEmpty>No se encontró el empleado.</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    onSelect={() => {
                      setSelectedEmployeeId('all');
                      setOpenEmployeeCombo(false);
                    }}
                  >
                    Todos los empleados
                  </CommandItem>
                  {employees.filter((e) => e.isActive !== false).map((e) => (
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

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-slate-500 mr-1">Filtros:</span>
        <Button
          variant={activeFilter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveFilter('all')}
          className={cn('h-8 text-xs gap-1.5', activeFilter === 'all' ? 'bg-slate-900' : 'bg-white')}
        >
          <LayoutGrid className="h-3.5 w-3.5" />
          Todos
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
                Sin actividad
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Proyectos sin tareas planificadas este mes</p>
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
                Falta planificar
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Proyectos que no han planificado todas sus horas asignadas o mínimas</p>
              <p className="text-[10px] text-slate-400 mt-1">
                Si tiene horas asignadas, debe planificar todas. Si solo tiene mínimas, debe planificar al menos esas.
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
                Retrasados
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Ejecución por debajo del progreso del mes</p>
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
                Exceso horas
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Proyectos con más horas planificadas que asignadas</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
