import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Check, ChevronDown, Link2, User } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import type { Allocation, Employee } from '@/types';
import { formatPlannerWeekWorkingRangeLabel } from '@/utils/dateUtils';

type WeekSlice = { weekStart: Date; effectiveStart?: Date; effectiveEnd?: Date };

export type DependencyPickerProps = {
  value: string;
  onChange: (dependencyId: string) => void;
  dependencies: Allocation[];
  employees: Employee[];
  weeks: WeekSlice[];
  disabled?: boolean;
  /** Variante compacta para filas del batch */
  compact?: boolean;
  className?: string;
};

export const DEPENDENCY_NONE = 'none';

/** Valor interno cmdk: siempre visible aunque haya búsqueda activa */
const NONE_ITEM_VALUE = '__dependency_none__';

const PICKER_LIST_HEIGHT = 'h-[320px]';

function getEmployee(employees: Employee[], id: string) {
  return employees.find((e) => e.id === id);
}

function getWeekLabel(weekStartDate: string, weeks: WeekSlice[]): string {
  const idx = weeks.findIndex((w) => format(w.weekStart, 'yyyy-MM-dd') === weekStartDate);
  if (idx >= 0) {
    return `Sem ${idx + 1} · ${formatPlannerWeekWorkingRangeLabel(weeks[idx])}`;
  }
  return weekStartDate;
}

function statusLabel(status: Allocation['status']): string {
  switch (status) {
    case 'completed':
      return 'Completada';
    case 'in_progress':
    case 'active':
      return 'En curso';
    default:
      return 'Planificada';
  }
}

function statusVariant(status: Allocation['status']): 'default' | 'secondary' | 'outline' {
  switch (status) {
    case 'in_progress':
    case 'active':
      return 'default';
    case 'completed':
      return 'secondary';
    default:
      return 'outline';
  }
}

function buildSearchValue(dep: Allocation, owner: Employee | undefined, weekLabel: string) {
  return [dep.taskName, owner?.name, owner?.first_name, owner?.last_name, weekLabel].filter(Boolean).join(' ');
}

function DependencyPickerList({
  dependencies,
  employees,
  weeks,
  value,
  onSelect,
  className,
  listLayout = 'fixed',
}: {
  dependencies: Allocation[];
  employees: Employee[];
  weeks: WeekSlice[];
  value: string;
  onSelect: (id: string) => void;
  className?: string;
  /** fixed: altura estable (popover). flex: rellena el diálogo móvil */
  listLayout?: 'fixed' | 'flex';
}) {
  const grouped = useMemo(() => {
    const sorted = [...dependencies].sort((a, b) => {
      const weekCmp = a.weekStartDate.localeCompare(b.weekStartDate);
      if (weekCmp !== 0) return weekCmp;
      return (a.taskName || '').localeCompare(b.taskName || '', 'es');
    });

    const map = new Map<string, Allocation[]>();
    for (const dep of sorted) {
      const key = dep.weekStartDate;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(dep);
    }
    return Array.from(map.entries()).map(([weekStartDate, items]) => ({
      weekStartDate,
      weekLabel: getWeekLabel(weekStartDate, weeks),
      items,
    }));
  }, [dependencies, weeks]);

  return (
    <Command
      filter={(cmdValue, search) => {
        if (cmdValue === NONE_ITEM_VALUE) return 1;
        if (!search.trim()) return 1;
        return cmdValue.toLowerCase().includes(search.toLowerCase()) ? 1 : 0;
      }}
      className={cn('flex flex-col', listLayout === 'flex' && 'min-h-0 flex-1', className)}
    >
      <CommandInput placeholder="Buscar por tarea, persona o semana…" />
      <CommandList
        className={cn(
          listLayout === 'fixed' ? PICKER_LIST_HEIGHT : 'min-h-0 flex-1',
          'overflow-y-auto overscroll-contain',
        )}
      >
        <CommandEmpty>No hay tareas que coincidan.</CommandEmpty>

        <CommandGroup heading="Opción">
          <CommandItem
            value={NONE_ITEM_VALUE}
            onSelect={() => onSelect(DEPENDENCY_NONE)}
            className="py-2.5"
          >
            <Check className={cn('mr-2 h-4 w-4 shrink-0', !value || value === DEPENDENCY_NONE ? 'opacity-100' : 'opacity-0')} />
            <span className="font-medium text-slate-700">Sin dependencia</span>
            <span className="ml-auto text-xs text-slate-400">Esta tarea no espera a otra</span>
          </CommandItem>
        </CommandGroup>

        {grouped.length > 0 && <CommandSeparator />}

        {grouped.map(({ weekStartDate, weekLabel, items }) => (
          <CommandGroup key={weekStartDate} heading={weekLabel}>
            {items.map((dep) => {
              const owner = getEmployee(employees, dep.employeeId);
              const searchValue = buildSearchValue(dep, owner, weekLabel);
              const initials = (owner?.name || owner?.first_name || '?').slice(0, 2).toUpperCase();

              return (
                <CommandItem
                  key={dep.id}
                  value={searchValue}
                  onSelect={() => onSelect(dep.id)}
                  className="items-start gap-2 py-2.5"
                >
                  <Check
                    className={cn(
                      'mt-0.5 h-4 w-4 shrink-0',
                      value === dep.id ? 'opacity-100 text-indigo-600' : 'opacity-0',
                    )}
                  />
                  <Avatar className="h-7 w-7 shrink-0 ring-1 ring-white">
                    {owner?.avatarUrl && <AvatarImage src={owner.avatarUrl} alt="" />}
                    <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="text-sm font-medium leading-snug text-slate-900 line-clamp-2" title={dep.taskName}>
                      {dep.taskName || 'Sin nombre'}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <User className="h-3 w-3 shrink-0" />
                        {owner?.name || 'Sin asignar'}
                      </span>
                      <span>{dep.hoursAssigned}h</span>
                      <Badge variant={statusVariant(dep.status)} className="h-5 px-1.5 text-[10px] font-normal">
                        {statusLabel(dep.status)}
                      </Badge>
                    </div>
                  </div>
                </CommandItem>
              );
            })}
          </CommandGroup>
        ))}
      </CommandList>
    </Command>
  );
}

export function DependencyPicker({
  value,
  onChange,
  dependencies,
  employees,
  weeks,
  disabled,
  compact,
  className,
}: DependencyPickerProps) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  const selectedDep = value && value !== DEPENDENCY_NONE ? dependencies.find((d) => d.id === value) : null;
  const selectedOwner = selectedDep ? getEmployee(employees, selectedDep.employeeId) : null;

  const triggerLabel = selectedDep
    ? selectedDep.taskName || 'Sin nombre'
    : compact
      ? 'Sin dependencia'
      : 'Sin dependencia';

  const triggerSub =
    selectedDep && selectedOwner
      ? selectedOwner.name
      : dependencies.length > 0
        ? `${dependencies.length} tarea${dependencies.length === 1 ? '' : 's'} en el proyecto`
        : 'Selecciona un proyecto primero';

  const handleSelect = (id: string) => {
    onChange(id);
    setOpen(false);
  };

  const trigger = (
    <Button
      type="button"
      variant="outline"
      disabled={disabled}
      className={cn(
        'w-full justify-between gap-2 font-normal text-left',
        compact ? 'h-11 sm:h-9 min-h-[44px] sm:min-h-0 text-xs px-2' : 'h-10 min-h-[44px] sm:min-h-0',
        className,
      )}
    >
      <span className="flex min-w-0 flex-1 items-center gap-2">
        <Link2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium text-slate-900">{triggerLabel}</span>
          {!compact && <span className="block truncate text-xs text-slate-500">{triggerSub}</span>}
        </span>
      </span>
      <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
    </Button>
  );

  if (isMobile) {
    return (
      <>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          onClick={() => setOpen(true)}
          className={cn(
            'w-full justify-between gap-2 font-normal text-left',
            compact ? 'h-11 sm:h-9 min-h-[44px] sm:min-h-0 text-xs px-2' : 'h-10 min-h-[44px] sm:min-h-0',
            className,
          )}
        >
          <span className="flex min-w-0 flex-1 items-center gap-2">
            <Link2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium text-slate-900">{triggerLabel}</span>
              {!compact && <span className="block truncate text-xs text-slate-500">{triggerSub}</span>}
            </span>
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="flex h-[min(85vh,460px)] max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
            <DialogHeader className="border-b border-slate-200 px-4 py-3 text-left">
              <DialogTitle className="text-base">Depende de otra tarea</DialogTitle>
              <DialogDescription className="text-xs">
                Elige la tarea que debe completarse antes. Usa la búsqueda si hay muchas opciones.
              </DialogDescription>
            </DialogHeader>
            <DependencyPickerList
              dependencies={dependencies}
              employees={employees}
              weeks={weeks}
              value={value}
              onSelect={handleSelect}
              listLayout="flex"
              className="flex min-h-0 flex-1 flex-col border-0"
            />
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        className="w-[min(520px,calc(100vw-2rem))] overflow-hidden p-0"
        align="start"
        side="bottom"
        sideOffset={4}
        avoidCollisions={false}
        collisionPadding={8}
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <div className="shrink-0 border-b border-slate-100 px-3 py-2">
          <p className="text-xs font-medium text-slate-700">Depende de otra tarea</p>
          <p className="text-[11px] text-slate-500">
            {dependencies.length > 0
              ? `${dependencies.length} candidata${dependencies.length === 1 ? '' : 's'} · agrupadas por semana`
              : 'No hay otras tareas activas en este proyecto'}
          </p>
        </div>
        <DependencyPickerList
          dependencies={dependencies}
          employees={employees}
          weeks={weeks}
          value={value}
          onSelect={handleSelect}
        />
      </PopoverContent>
    </Popover>
  );
}
