import { useMemo, useState } from 'react';
import { format, startOfMonth } from 'date-fns';
import { AlertTriangle, Check, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useProjectAliasing } from '@/hooks/useProjectAliasing';
import type { ProjectBudgetStatus } from '@/hooks/useAllocationSheet';
import { cn } from '@/lib/utils';
import type { Client, Deadline, Employee, Project } from '@/types';
import {
  computeEmployeeDeadlinePreview,
  resolveProjectBudgetForPreview,
  type PlannerBatchPreviewContext,
} from '@/utils/plannerBatchPreview';

export type ProjectPickerProps = {
  value: string;
  onChange: (projectId: string) => void;
  activeProjects: Project[];
  clients: Client[];
  employees: Employee[];
  deadlines: Deadline[];
  viewDate: Date;
  getProjectBudgetStatus: (projectId: string) => ProjectBudgetStatus;
  batchPreview: PlannerBatchPreviewContext;
  /** Empleado para ordenar por deadline y preview en el listado */
  employeeId?: string;
  contextTaskHours?: number;
  contextTaskId?: string;
  budgetExceeded?: boolean;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  placeholder?: string;
};

export function ProjectPicker({
  value,
  onChange,
  activeProjects,
  clients,
  employees,
  deadlines,
  viewDate,
  getProjectBudgetStatus,
  batchPreview,
  employeeId,
  contextTaskHours = 0,
  contextTaskId,
  budgetExceeded,
  disabled,
  className,
  triggerClassName,
  placeholder = 'Seleccionar proyecto...',
}: ProjectPickerProps) {
  const [open, setOpen] = useState(false);
  const { formatName: formatProjectName } = useProjectAliasing();

  const selectorEmployeeId = employeeId || batchPreview.defaultEmployeeId;

  const { projectsWithDeadline, projectsWithoutDeadline } = useMemo(() => {
    if (!viewDate || !selectorEmployeeId || deadlines.length === 0) {
      return { projectsWithDeadline: [], projectsWithoutDeadline: activeProjects };
    }
    const monthKey = format(startOfMonth(viewDate), 'yyyy-MM');
    const withDeadline: Project[] = [];
    const withoutDeadline: Project[] = [];
    for (const p of activeProjects) {
      const d = deadlines.find((dl) => dl.projectId === p.id && dl.month === monthKey && !dl.isHidden);
      const hours = d?.employeeHours[selectorEmployeeId] ?? 0;
      if (hours > 0) withDeadline.push(p);
      else withoutDeadline.push(p);
    }
    return { projectsWithDeadline: withDeadline, projectsWithoutDeadline: withoutDeadline };
  }, [activeProjects, deadlines, viewDate, selectorEmployeeId]);

  const sortedProjects = useMemo(
    () => [...projectsWithDeadline, ...projectsWithoutDeadline],
    [projectsWithDeadline, projectsWithoutDeadline],
  );

  const selectedLabel = value
    ? formatProjectName(activeProjects.find((p) => p.id === value)?.name || '')
    : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          disabled={disabled}
          className={cn(
            'w-full justify-between px-3 text-left font-normal',
            !value && 'text-muted-foreground',
            budgetExceeded && 'border-amber-300 bg-amber-50 text-amber-900',
            triggerClassName,
            className,
          )}
        >
          <span className="truncate">{selectedLabel}</span>
          <div className="ml-2 flex shrink-0 items-center gap-2 opacity-50">
            {budgetExceeded && <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />}
            <Plus className="h-3.5 w-3.5" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[calc(100vw-2rem)] max-w-[450px] p-0"
        align="start"
        side="bottom"
        avoidCollisions={false}
        sideOffset={4}
      >
        <Command
          filter={(cmdValue, search) => {
            if (cmdValue.toLowerCase().includes(search.toLowerCase())) return 1;
            return 0;
          }}
        >
          <CommandInput placeholder="Buscar proyecto..." />
          <CommandList className="max-h-[280px] overflow-y-auto overscroll-contain">
            <CommandEmpty>No hay proyectos que coincidan.</CommandEmpty>
            <CommandGroup heading={projectsWithDeadline.length > 0 ? 'Proyectos (primero con tu deadline)' : 'Proyectos'}>
              {sortedProjects.map((project) => {
                const client = clients.find((c) => c.id === project.clientId);
                const budgetStatus = resolveProjectBudgetForPreview(
                  batchPreview,
                  project.id,
                  getProjectBudgetStatus,
                );
                const totalUsed = budgetStatus.totalComputed + budgetStatus.totalPlanned;
                const remaining = budgetStatus.budgetMax > 0 ? budgetStatus.budgetMax - totalUsed : null;

                const computedPct =
                  budgetStatus.budgetMax > 0
                    ? Math.round((budgetStatus.totalComputed / budgetStatus.budgetMax) * 100)
                    : 0;
                const plannedPct =
                  budgetStatus.budgetMax > 0
                    ? Math.round((budgetStatus.totalPlanned / budgetStatus.budgetMax) * 100)
                    : 0;

                const previewHours = value === project.id ? contextTaskHours : 0;
                const deadlinePreview =
                  selectorEmployeeId && viewDate
                    ? computeEmployeeDeadlinePreview(batchPreview, {
                        projectId: project.id,
                        employeeId: selectorEmployeeId,
                        deadlines,
                        taskId: contextTaskId,
                        includeTaskHours: previewHours,
                      })
                    : null;

                const searchValue = `${project.name} ${client?.name || ''}`;

                return (
                  <CommandItem
                    key={project.id}
                    value={searchValue}
                    onSelect={() => {
                      onChange(project.id);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn('mr-2 h-4 w-4 shrink-0', value === project.id ? 'opacity-100' : 'opacity-0')}
                    />
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: client?.color || '#6b7280' }}
                        />
                        <span className="truncate font-medium">
                          {formatProjectName(project.name)}
                          {client?.name && (
                            <span className="ml-1 text-[10px] font-normal text-slate-400">({client.name})</span>
                          )}
                        </span>
                        {budgetStatus.budgetMax > 0 && (
                          <div className="ml-auto flex shrink-0 items-center gap-1">
                            <span
                              className={cn(
                                'rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                                computedPct > 100
                                  ? 'bg-red-100 text-red-700'
                                  : computedPct > 85
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-emerald-100 text-emerald-700',
                              )}
                            >
                              {computedPct}%
                            </span>
                            {plannedPct > 0 && (
                              <span className="text-[10px] font-medium text-slate-400">(+{plannedPct}% plan.)</span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2 pl-4 text-[10px] text-slate-500">
                        <span className="truncate">
                          {budgetStatus.budgetMax > 0 ? (
                            <span>
                              <span className="font-medium text-slate-700">{budgetStatus.totalComputed.toFixed(1)}h</span>
                              {budgetStatus.totalPlanned > 0 && (
                                <span className="text-slate-400"> +{budgetStatus.totalPlanned.toFixed(1)}h</span>
                              )}
                              <span className="text-slate-400"> / {budgetStatus.budgetMax}h</span>
                            </span>
                          ) : (
                            'Sin límite'
                          )}
                        </span>
                        {remaining !== null && (
                          <span className={cn('shrink-0', remaining < 0 ? 'font-bold text-red-600' : 'text-slate-400')}>
                            {remaining > 0 ? `${remaining.toFixed(1)}h rest.` : `${Math.abs(remaining).toFixed(1)}h ex.`}
                          </span>
                        )}
                      </div>
                      {deadlinePreview && (
                        <div className="mt-0.5 flex items-center gap-1.5 pl-4 text-[10px]">
                          <span
                            className={cn(
                              'font-medium',
                              selectorEmployeeId === batchPreview.defaultEmployeeId
                                ? 'text-blue-600'
                                : 'text-indigo-600',
                            )}
                          >
                            {selectorEmployeeId === batchPreview.defaultEmployeeId
                              ? 'Tu deadline:'
                              : `${employees.find((e) => e.id === selectorEmployeeId)?.name || 'Su'} deadline:`}
                          </span>
                          <span
                            className={cn(
                              'font-bold',
                              deadlinePreview.totalAssigned > deadlinePreview.deadlineHours
                                ? 'text-red-600'
                                : deadlinePreview.totalAssigned >= deadlinePreview.deadlineHours * 0.9
                                  ? 'text-amber-600'
                                  : selectorEmployeeId === batchPreview.defaultEmployeeId
                                    ? 'text-blue-600'
                                    : 'text-indigo-600',
                            )}
                          >
                            {deadlinePreview.totalAssigned.toFixed(1)} / {deadlinePreview.deadlineHours}h
                          </span>
                        </div>
                      )}
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
