import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Check, ChevronDown, Link2 } from 'lucide-react';

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

/** cmdk usa `value` como identificador; debe ser único aunque el texto mostrado se repita */
function dependencyItemValue(depId: string, searchValue: string) {
  return `${depId}::${searchValue}`;
}

function dependencyItemSearchableText(itemValue: string) {
  const idx = itemValue.indexOf('::');
  return idx >= 0 ? itemValue.slice(idx + 2) : itemValue;
}

const dependencyGroupClass =
  'px-1.5 py-0.5 [&_[cmdk-group-heading]]:sticky [&_[cmdk-group-heading]]:top-0 [&_[cmdk-group-heading]]:z-10 [&_[cmdk-group-heading]]:bg-popover [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-slate-400';

/** Filas densas pero legibles: ~46px, hover solo en la fila activa */
const dependencyRowClass = cn(
  'relative mx-0.5 my-0.5 gap-2 rounded-lg border border-transparent px-2.5 py-2',
  'transition-[background-color,border-color,box-shadow] duration-100',
  'data-[selected=true]:!bg-slate-50 data-[selected=true]:!text-slate-900',
  'data-[selected=true]:border-slate-200/80 data-[selected=true]:shadow-sm',
  'hover:border-slate-200/60 hover:bg-slate-50/80',
);

const dependencyRowSelectedClass = 'border-indigo-200/90 bg-indigo-50/90 shadow-none hover:bg-indigo-50';

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
}: {
  dependencies: Allocation[];
  employees: Employee[];
  weeks: WeekSlice[];
  value: string;
  onSelect: (id: string) => void;
  className?: string;
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
        const searchable = dependencyItemSearchableText(cmdValue);
        return searchable.toLowerCase().includes(search.toLowerCase()) ? 1 : 0;
      }}
      className={cn(
        'flex min-h-0 flex-1 flex-col border-0 [&_[cmdk-input-wrapper]_svg]:h-4 [&_[cmdk-input-wrapper]_svg]:w-4 [&_[cmdk-input]]:h-10 [&_[cmdk-input]]:text-sm',
        className,
      )}
    >
      <CommandInput placeholder="Buscar por tarea, persona o semana…" />
      <CommandList className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <CommandEmpty>No hay tareas que coincidan.</CommandEmpty>

        <CommandGroup heading="Opción" className={dependencyGroupClass}>
          <CommandItem
            value={NONE_ITEM_VALUE}
            onSelect={() => onSelect(DEPENDENCY_NONE)}
            className={cn(
              dependencyRowClass,
              'items-center',
              (!value || value === DEPENDENCY_NONE) && dependencyRowSelectedClass,
            )}
          >
            <Check
              className={cn(
                'h-4 w-4 shrink-0',
                !value || value === DEPENDENCY_NONE ? 'text-indigo-600 opacity-100' : 'opacity-0',
              )}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-800">Sin dependencia</p>
              <p className="truncate text-xs text-slate-500">Esta tarea no espera a otra</p>
            </div>
          </CommandItem>
        </CommandGroup>

        {grouped.length > 0 && <CommandSeparator />}

        {grouped.map(({ weekStartDate, weekLabel, items }) => (
          <CommandGroup key={weekStartDate} heading={weekLabel} className={dependencyGroupClass}>
            {items.map((dep) => {
              const owner = getEmployee(employees, dep.employeeId);
              const searchValue = buildSearchValue(dep, owner, weekLabel);
              const itemValue = dependencyItemValue(dep.id, searchValue);
              const initials = (owner?.name || owner?.first_name || '?').slice(0, 2).toUpperCase();
              const isSelected = value === dep.id;

              return (
                <CommandItem
                  key={dep.id}
                  value={itemValue}
                  onSelect={() => onSelect(dep.id)}
                  className={cn(dependencyRowClass, 'items-start', isSelected && dependencyRowSelectedClass)}
                >
                  <Check
                    className={cn(
                      'mt-1 h-4 w-4 shrink-0',
                      isSelected ? 'text-indigo-600 opacity-100' : 'opacity-0',
                    )}
                  />
                  <Avatar className="mt-0.5 h-6 w-6 shrink-0 ring-1 ring-white">
                    {owner?.avatarUrl && <AvatarImage src={owner.avatarUrl} alt="" />}
                    <AvatarFallback className="text-[9px]">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="truncate text-sm font-medium leading-snug text-slate-900" title={dep.taskName}>
                      {dep.taskName || 'Sin nombre'}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
                      <span className="truncate">{owner?.name || 'Sin asignar'}</span>
                      <span className="text-slate-300">·</span>
                      <span className="shrink-0 tabular-nums">{dep.hoursAssigned}h</span>
                      <span className="text-slate-300">·</span>
                      <Badge
                        variant={statusVariant(dep.status)}
                        className="h-5 shrink-0 px-1.5 text-[10px] font-normal leading-none"
                      >
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
        <DialogContent
          priority="high"
          className="flex h-[min(85vh,520px)] max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg"
        >
          <DialogHeader className="shrink-0 border-b border-slate-200 px-4 py-3 text-left">
            <DialogTitle className="text-base">Depende de otra tarea</DialogTitle>
            <DialogDescription className="text-xs">
              {dependencies.length > 0
                ? `${dependencies.length} candidata${dependencies.length === 1 ? '' : 's'} · agrupadas por semana. Usa la búsqueda si hay muchas opciones.`
                : 'No hay otras tareas activas en este proyecto.'}
            </DialogDescription>
          </DialogHeader>
          <DependencyPickerList
            dependencies={dependencies}
            employees={employees}
            weeks={weeks}
            value={value}
            onSelect={handleSelect}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
