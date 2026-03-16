/**
 * Filtros de la página Deadlines con estado interno (patrón componente "inteligente").
 * Notifica al padre vía onFiltersChange para que pueda filtrar la lista sin prop-drilling.
 * Este hook/componente NO debe instanciar Realtime; la suscripción es singleton en DeadlinesPage.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Search, Filter, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Employee } from '@/types';

export interface DeadlinesFiltersValues {
  searchTerm: string;
  filterId: string;
  showHidden: boolean;
  showUnassignedOnly: boolean;
  filterByEmployee: string;
  sortBy: 'client' | 'assigned' | 'remaining';
}

export interface ProjectFilterOption {
  id: string;
  displayName: string;
}

export interface DeadlinesFiltersProps {
  activeFilters: ProjectFilterOption[];
  employees: Employee[];
  isMobile: boolean;
  onFiltersChange: (values: DeadlinesFiltersValues) => void;
  /** Opcional: slot para botón "Filtros" en móvil (ej. botón que abre el Sheet) */
  renderMobileFilterTrigger?: (onClick: () => void) => React.ReactNode;
}

const DEBOUNCE_MS = 300;

export function DeadlinesFilters({
  activeFilters,
  employees,
  isMobile,
  onFiltersChange,
  renderMobileFilterTrigger,
}: DeadlinesFiltersProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterId, setFilterId] = useState<string>('all');
  const [showHidden, setShowHidden] = useState(false);
  const [showUnassignedOnly, setShowUnassignedOnly] = useState(false);
  const [filterByEmployee, setFilterByEmployee] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'client' | 'assigned' | 'remaining'>('client');
  const [filtersSheetOpen, setFiltersSheetOpen] = useState(false);
  const [openFilterType, setOpenFilterType] = useState(false);
  const [openFilterEmployee, setOpenFilterEmployee] = useState(false);
  const [openSortBy, setOpenSortBy] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastValuesRef = useRef<DeadlinesFiltersValues | null>(null);
  const onFiltersChangeRef = useRef(onFiltersChange);
  onFiltersChangeRef.current = onFiltersChange;

  const emit = useCallback(() => {
    const values: DeadlinesFiltersValues = {
      searchTerm,
      filterId,
      showHidden,
      showUnassignedOnly,
      filterByEmployee,
      sortBy,
    };
    if (JSON.stringify(lastValuesRef.current) === JSON.stringify(values)) return;
    lastValuesRef.current = values;
    onFiltersChangeRef.current(values);
  }, [searchTerm, filterId, showHidden, showUnassignedOnly, filterByEmployee, sortBy]);

  // Emitir una sola vez al montar para que el padre tenga valores iniciales
  const didMountRef = useRef(false);
  useEffect(() => {
    if (didMountRef.current) return;
    didMountRef.current = true;
    emit();
  }, [emit]);

  // Emitir cuando cambian valores (debounce para no saturar al padre en cada tecla)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(emit, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchTerm, filterId, showHidden, showUnassignedOnly, filterByEmployee, sortBy, emit]);

  const filterContent = (
    <>
      <div>
        <Label className="text-slate-600 mb-1.5 block">Buscar proyecto</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-11 border-slate-200"
          />
        </div>
      </div>
      <div>
        <Label className="text-slate-600 mb-1.5 block">Tipo de proyecto</Label>
        <Popover open={openFilterType} onOpenChange={setOpenFilterType}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="h-11 w-full justify-between font-normal">
              <span className="truncate">{filterId === 'all' ? 'Todos' : activeFilters.find(f => f.id === filterId)?.displayName ?? 'Tipo de proyecto'}</span>
              <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
            <Command>
              <CommandList className="max-h-[280px]">
                <CommandEmpty>No hay opciones.</CommandEmpty>
                <CommandGroup>
                  <CommandItem value="Todos" onSelect={() => { setFilterId('all'); setOpenFilterType(false); }}>
                    <Check className={cn('mr-2 h-4 w-4 shrink-0', filterId === 'all' ? 'opacity-100' : 'opacity-0')} />
                    Todos
                  </CommandItem>
                  {activeFilters.map(filter => (
                    <CommandItem key={filter.id} value={filter.displayName} onSelect={() => { setFilterId(filter.id); setOpenFilterType(false); }}>
                      <Check className={cn('mr-2 h-4 w-4 shrink-0', filterId === filter.id ? 'opacity-100' : 'opacity-0')} />
                      {filter.displayName}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
      <div>
        <Label className="text-slate-600 mb-1.5 block">Empleado</Label>
        <Popover open={openFilterEmployee} onOpenChange={setOpenFilterEmployee}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="h-11 w-full justify-between font-normal">
              <span className="truncate">{filterByEmployee === 'all' ? 'Todos' : (employees.find(e => e.id === filterByEmployee)?.first_name || employees.find(e => e.id === filterByEmployee)?.name) ?? 'Empleado'}</span>
              <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
            <Command>
              <CommandList className="max-h-[280px]">
                <CommandEmpty>No hay empleados.</CommandEmpty>
                <CommandGroup>
                  <CommandItem value="Todos" onSelect={() => { setFilterByEmployee('all'); setOpenFilterEmployee(false); }}>
                    <Check className={cn('mr-2 h-4 w-4 shrink-0', filterByEmployee === 'all' ? 'opacity-100' : 'opacity-0')} />
                    Todos
                  </CommandItem>
                  {employees.map(emp => (
                    <CommandItem key={emp.id} value={emp.first_name || emp.name || ''} onSelect={() => { setFilterByEmployee(emp.id); setOpenFilterEmployee(false); }}>
                      <Check className={cn('mr-2 h-4 w-4 shrink-0', filterByEmployee === emp.id ? 'opacity-100' : 'opacity-0')} />
                      {emp.first_name || emp.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
      <div>
        <Label className="text-slate-600 mb-1.5 block">Ordenar por</Label>
        <Popover open={openSortBy} onOpenChange={setOpenSortBy}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="h-11 w-full justify-between font-normal">
              <span className="truncate">{sortBy === 'client' ? 'Por cliente' : sortBy === 'assigned' ? 'Más asignado' : 'Más disponible'}</span>
              <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
            <Command>
              <CommandList className="max-h-[280px]">
                <CommandGroup>
                  <CommandItem value="Por cliente" onSelect={() => { setSortBy('client'); setOpenSortBy(false); }}>
                    <Check className={cn('mr-2 h-4 w-4 shrink-0', sortBy === 'client' ? 'opacity-100' : 'opacity-0')} />
                    Por cliente
                  </CommandItem>
                  <CommandItem value="Más asignado" onSelect={() => { setSortBy('assigned'); setOpenSortBy(false); }}>
                    <Check className={cn('mr-2 h-4 w-4 shrink-0', sortBy === 'assigned' ? 'opacity-100' : 'opacity-0')} />
                    Más asignado
                  </CommandItem>
                  <CommandItem value="Más disponible" onSelect={() => { setSortBy('remaining'); setOpenSortBy(false); }}>
                    <Check className={cn('mr-2 h-4 w-4 shrink-0', sortBy === 'remaining' ? 'opacity-100' : 'opacity-0')} />
                    Más disponible
                  </CommandItem>
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
      <div className="flex items-center justify-between py-2">
        <span className="text-slate-600">Mostrar ocultos</span>
        <Switch id="show-hidden-mobile" checked={showHidden} onCheckedChange={setShowHidden} />
      </div>
      <div className="flex items-center justify-between py-2">
        <span className="text-orange-600 font-medium">Solo sin asignar</span>
        <Switch id="show-unassigned-mobile" checked={showUnassignedOnly} onCheckedChange={setShowUnassignedOnly} />
      </div>
      <Button className="w-full h-11" onClick={() => setFiltersSheetOpen(false)}>
        Aplicar
      </Button>
    </>
  );

  if (isMobile) {
    return (
      <>
        {renderMobileFilterTrigger ? (
          renderMobileFilterTrigger(() => setFiltersSheetOpen(true))
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="h-11 px-4 gap-2 text-sm touch-manipulation"
            onClick={() => setFiltersSheetOpen(true)}
          >
            <Filter className="h-4 w-4" />
            Filtros
          </Button>
        )}
        <Sheet open={filtersSheetOpen} onOpenChange={setFiltersSheetOpen}>
          <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl p-4 overflow-y-auto">
            <SheetHeader className="mb-4">
              <SheetTitle className="text-base">Filtros</SheetTitle>
            </SheetHeader>
            <div className="space-y-4 text-sm">
              {filterContent}
            </div>
          </SheetContent>
        </Sheet>
      </>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 sm:gap-3 bg-white rounded-xl border shadow-sm p-2 sm:p-3" data-tour="filters">
      <div className="flex-1 min-w-[11rem] sm:min-w-[12.5rem]">
        <div className="relative min-w-0">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar proyecto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-9 border-slate-200 text-sm"
          />
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
        <Popover open={openFilterType} onOpenChange={setOpenFilterType}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[120px] sm:w-[140px] h-8 sm:h-9 text-xs sm:text-sm justify-between font-normal">
              <span className="truncate">{filterId === 'all' ? 'Todos' : activeFilters.find(f => f.id === filterId)?.displayName ?? 'Tipo'}</span>
              <ChevronDown className="h-3.5 w-3.5 opacity-50 shrink-0" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
            <Command>
              <CommandList className="max-h-[280px]">
                <CommandEmpty>No hay opciones.</CommandEmpty>
                <CommandGroup>
                  <CommandItem value="Todos" onSelect={() => { setFilterId('all'); setOpenFilterType(false); }}>
                    <Check className={cn('mr-2 h-4 w-4 shrink-0', filterId === 'all' ? 'opacity-100' : 'opacity-0')} />
                    Todos
                  </CommandItem>
                  {activeFilters.map(filter => (
                    <CommandItem key={filter.id} value={filter.displayName} onSelect={() => { setFilterId(filter.id); setOpenFilterType(false); }}>
                      <Check className={cn('mr-2 h-4 w-4 shrink-0', filterId === filter.id ? 'opacity-100' : 'opacity-0')} />
                      {filter.displayName}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        <label className="flex items-center gap-1.5 cursor-pointer shrink-0">
          <span className="text-slate-600 whitespace-nowrap">Ocultos</span>
          <Switch id="show-hidden" checked={showHidden} onCheckedChange={setShowHidden} className="scale-75 sm:scale-90" />
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer shrink-0">
          <span className="text-orange-600 font-medium whitespace-nowrap">Sin asig.</span>
          <Switch id="show-unassigned" checked={showUnassignedOnly} onCheckedChange={setShowUnassignedOnly} className="scale-75 sm:scale-90" />
        </label>
      </div>
      <div className="flex items-center gap-2">
        <Popover open={openFilterEmployee} onOpenChange={setOpenFilterEmployee}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[100px] sm:w-[140px] h-8 sm:h-9 text-xs sm:text-sm justify-between font-normal">
              <span className="truncate">{filterByEmployee === 'all' ? 'Empleado' : (employees.find(e => e.id === filterByEmployee)?.first_name || employees.find(e => e.id === filterByEmployee)?.name) ?? 'Todos'}</span>
              <ChevronDown className="h-3.5 w-3.5 opacity-50 shrink-0" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
            <Command>
              <CommandList className="max-h-[280px]">
                <CommandEmpty>No hay empleados.</CommandEmpty>
                <CommandGroup>
                  <CommandItem value="Todos" onSelect={() => { setFilterByEmployee('all'); setOpenFilterEmployee(false); }}>
                    <Check className={cn('mr-2 h-4 w-4 shrink-0', filterByEmployee === 'all' ? 'opacity-100' : 'opacity-0')} />
                    Todos
                  </CommandItem>
                  {employees.map(emp => (
                    <CommandItem key={emp.id} value={emp.first_name || emp.name || ''} onSelect={() => { setFilterByEmployee(emp.id); setOpenFilterEmployee(false); }}>
                      <Check className={cn('mr-2 h-4 w-4 shrink-0', filterByEmployee === emp.id ? 'opacity-100' : 'opacity-0')} />
                      {emp.first_name || emp.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        <Popover open={openSortBy} onOpenChange={setOpenSortBy}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[100px] sm:w-[140px] h-8 sm:h-9 text-xs sm:text-sm justify-between font-normal">
              <span className="truncate">{sortBy === 'client' ? 'Por cliente' : sortBy === 'assigned' ? 'Más asignado' : 'Más disponible'}</span>
              <ChevronDown className="h-3.5 w-3.5 opacity-50 shrink-0" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
            <Command>
              <CommandList className="max-h-[280px]">
                <CommandGroup>
                  <CommandItem value="Por cliente" onSelect={() => { setSortBy('client'); setOpenSortBy(false); }}>
                    <Check className={cn('mr-2 h-4 w-4 shrink-0', sortBy === 'client' ? 'opacity-100' : 'opacity-0')} />
                    Por cliente
                  </CommandItem>
                  <CommandItem value="Más asignado" onSelect={() => { setSortBy('assigned'); setOpenSortBy(false); }}>
                    <Check className={cn('mr-2 h-4 w-4 shrink-0', sortBy === 'assigned' ? 'opacity-100' : 'opacity-0')} />
                    Más asignado
                  </CommandItem>
                  <CommandItem value="Más disponible" onSelect={() => { setSortBy('remaining'); setOpenSortBy(false); }}>
                    <Check className={cn('mr-2 h-4 w-4 shrink-0', sortBy === 'remaining' ? 'opacity-100' : 'opacity-0')} />
                    Más disponible
                  </CommandItem>
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
