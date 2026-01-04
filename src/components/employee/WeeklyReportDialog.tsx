import { useState, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useProjectFilters } from '@/hooks/useProjectFilters';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, parseISO, startOfWeek, isSameMonth, addDays, isBefore } from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckCircle2, ArrowRight, AlertCircle, Plus, X, Users, Clock, Inbox, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { getStorageKey, getWeeksForMonth, isAllocationInEffectiveMonth } from '@/utils/dateUtils';
import { cn, formatProjectName } from '@/lib/utils';
import { getAbsenceHoursInRange } from '@/utils/absenceUtils';
import { getTeamEventHoursInRange } from '@/utils/teamEventUtils';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check } from 'lucide-react';

interface WeeklyReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string;
  viewDate: Date;
}

export function WeeklyReportDialog({ open, onOpenChange, employeeId, viewDate }: WeeklyReportDialogProps) {
  const { allocations, projects, clients, employees, absences, teamEvents, weeklyFeedback, updateAllocation, addAllocation, deleteAllocation, addWeeklyFeedback, getEmployeeLoadForWeek } = useApp();
  const round2 = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

  const [taskActions, setTaskActions] = useState<Record<string, 'move' | 'moveToEmployee' | 'justify' | 'distribute' | 'keep' | null>>({});
  const [taskComments, setTaskComments] = useState<Record<string, string>>({});
  const [distributionTasks, setDistributionTasks] = useState<Record<string, Array<{ id: string; taskName: string; hours: string; weekDate: string }>>>({});
  const [moveToEmployee, setMoveToEmployee] = useState<Record<string, string>>({}); // taskId -> employeeId
  const [moveToWeek, setMoveToWeek] = useState<Record<string, string>>({}); // taskId -> weekStartDate
  const [moveToMyWeek, setMoveToMyWeek] = useState<Record<string, string>>({}); // taskId -> weekStartDate (para "Mover a mi semana")

  // Detectar semana actual o última semana pasada del mes
  const { activeFilters, filterProject, getFilterDisplayName } = useProjectFilters();
  const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const currentWeekStr = format(currentWeekStart, 'yyyy-MM-dd');
  const isCurrentWeekInMonth = isSameMonth(currentWeekStart, viewDate);

  // Encontrar la última semana pasada del mes si la actual no está en el mes
  const getTargetWeek = (): string | null => {
    if (isCurrentWeekInMonth) {
      return currentWeekStr;
    }
    const monthStart = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
    const monthEnd = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);

    if (isBefore(monthEnd, new Date())) {
      const lastWeekStart = startOfWeek(monthEnd, { weekStartsOn: 1 });
      return format(lastWeekStart, 'yyyy-MM-dd');
    }

    return null;
  };

  const targetWeek = getTargetWeek();

  // Separar tareas abiertas y transferidas
  const { openTasks, transferredTasks } = useMemo(() => {
    const today = new Date();

    // Obtener IDs de tareas que ya tienen feedback de "keep" (mantener)
    const keptTaskIds = new Set(
      weeklyFeedback
        .filter(fb => fb.allocationId && fb.comments?.includes('Tarea mantenida tal cual'))
        .map(fb => fb.allocationId!)
    );

    // Obtener IDs de tareas que fueron distribuidas (tienen feedback de distribución)
    const distributedTaskIds = new Set(
      weeklyFeedback
        .filter(fb => fb.allocationId && fb.comments?.includes('Distribuidas en'))
        .map(fb => fb.allocationId!)
    );

    // Obtener IDs de tareas que fueron creadas como resultado de una distribución desde transferencia
    // Estas tienen feedback con "Tarea distribuida desde transferencia"
    const distributedFromTransferIds = new Set(
      weeklyFeedback
        .filter(fb => fb.allocationId && fb.comments?.includes('Tarea distribuida desde transferencia'))
        .map(fb => fb.allocationId!)
    );

    const open: typeof allocations = [];
    const transferred: typeof allocations = [];

    allocations.forEach(a => {
      if (a.employeeId !== employeeId) return;
      if (keptTaskIds.has(a.id)) return;

      // EXCLUIR: Tareas que fueron distribuidas (tienen feedback de distribución)
      if (distributedTaskIds.has(a.id)) return;

      // EXCLUIR: Tareas distribuidas desde transferencias (tienen feedback específico)
      // Estas ya fueron procesadas y no deben aparecer como pendientes
      if (distributedFromTransferIds.has(a.id)) return;

      try {
        const taskWeekDate = parseISO(a.weekStartDate);
        if (!isAllocationInEffectiveMonth(a.weekStartDate, viewDate)) return;

        // Usar campo de BD si está disponible, sino fallback al formato de texto
        const isTransferredTask = a.transferredFromAllocationId !== undefined && a.transferredFromAllocationId !== null
          || a.taskName?.includes('(transferida de');

        if (isTransferredTask && a.status !== 'completed') {
          transferred.push(a);
          return;
        }

        const taskWeekEnd = addDays(taskWeekDate, 4);
        if (taskWeekEnd > today) return;

        if (a.status !== 'completed' || ((a.hoursActual || 0) < a.hoursAssigned)) {
          open.push(a);
        }
      } catch {
        // Ignorar errores de parsing
      }
    });

    return {
      openTasks: Array.from(new Map(open.map(t => [t.id, t])).values()),
      transferredTasks: Array.from(new Map(transferred.map(t => [t.id, t])).values())
    };
  }, [allocations, employeeId, viewDate, weeklyFeedback]);

  const allTasks = [...openTasks, ...transferredTasks];

  // Todas las semanas del mes (para calcular índices correctos)
  const allWeeks = useMemo(() => getWeeksForMonth(viewDate), [viewDate]);

  // Semanas futuras del mes para distribución
  const futureWeeks = useMemo(() => {
    const today = new Date();
    return allWeeks.filter(week => {
      try {
        const weekDate = parseISO(getStorageKey(week.weekStart, viewDate));
        const weekEnd = addDays(weekDate, 4); // Viernes
        return weekEnd >= today;
      } catch {
        return false;
      }
    });
  }, [allWeeks, viewDate]);

  // Función para obtener el número de semana correcto
  const getWeekNumber = (weekStartDate: Date): number => {
    const storageKey = format(weekStartDate, 'yyyy-MM-dd');
    const weekIndex = allWeeks.findIndex(w => {
      const weekKey = getStorageKey(w.weekStart, viewDate);
      return weekKey === storageKey;
    });
    return weekIndex >= 0 ? weekIndex + 1 : 0;
  };

  // Inicializar distribución para tareas [Distribuir]
  const initializeDistribution = (taskId: string, totalHours: number) => {
    if (!distributionTasks[taskId] || distributionTasks[taskId].length === 0) {
      const defaultWeek = futureWeeks[0] ? getStorageKey(futureWeeks[0].weekStart, viewDate) : format(new Date(), 'yyyy-MM-dd');
      setDistributionTasks(prev => ({
        ...prev,
        [taskId]: [{
          id: crypto.randomUUID(),
          taskName: '',
          hours: totalHours.toString(),
          weekDate: defaultWeek
        }]
      }));
    }
  };

  const addDistributionRow = (taskId: string) => {
    const current = distributionTasks[taskId] || [];
    const lastRow = current[current.length - 1];
    setDistributionTasks(prev => ({
      ...prev,
      [taskId]: [...current, {
        id: crypto.randomUUID(),
        taskName: '',
        hours: '',
        weekDate: lastRow?.weekDate || (futureWeeks[0] ? getStorageKey(futureWeeks[0].weekStart, viewDate) : format(new Date(), 'yyyy-MM-dd'))
      }]
    }));
  };

  const removeDistributionRow = (taskId: string, rowId: string) => {
    setDistributionTasks(prev => ({
      ...prev,
      [taskId]: (prev[taskId] || []).filter(r => r.id !== rowId)
    }));
  };

  const updateDistributionRow = (taskId: string, rowId: string, field: 'taskName' | 'hours' | 'weekDate', value: string) => {
    setDistributionTasks(prev => ({
      ...prev,
      [taskId]: (prev[taskId] || []).map(r => r.id === rowId ? { ...r, [field]: value } : r)
    }));
  };

  const handleCloseWeek = async () => {
    try {
      for (const task of allTasks) {
        const action = taskActions[task.id];
        if (!action) continue;

        const taskWeekDate = parseISO(task.weekStartDate);
        const taskWeekStr = format(taskWeekDate, 'yyyy-MM-dd');
        const nextWeekStart = addDays(taskWeekDate, 7);
        const nextWeekStr = format(nextWeekStart, 'yyyy-MM-dd');
        const nextWeekStorageKey = getStorageKey(nextWeekStart, viewDate);

        if (action === 'move') {
          // Mover horas restantes a una semana futura seleccionada
          const targetWeek = moveToMyWeek[task.id];
          const comment = taskComments[task.id];

          if (!targetWeek) {
            toast.error('Selecciona una semana destino');
            continue;
          }

          // NOTA OBLIGATORIA cuando se mueve a semana futura
          if (!comment || !comment.trim()) {
            toast.error('Debes añadir una nota explicando por qué mueves esta tarea a otra semana');
            continue;
          }

          const remainingHours = task.hoursAssigned - (task.hoursActual || 0);
          if (remainingHours > 0) {
            // 1. Completar tarea actual con las horas realmente trabajadas
            await updateAllocation({
              ...task,
              hoursAssigned: task.hoursActual || 0,
              status: 'completed'
            });

            // 2. Crear/actualizar tarea en la semana destino con las horas restantes
            const existingTargetWeek = allocations.find(a =>
              a.employeeId === employeeId &&
              a.projectId === task.projectId &&
              a.weekStartDate === targetWeek &&
              a.taskName === task.taskName
            );

            if (existingTargetWeek) {
              // Si ya existe una tarea similar, sumar las horas
              await updateAllocation({
                ...existingTargetWeek,
                hoursAssigned: existingTargetWeek.hoursAssigned + remainingHours
              });
            } else {
              // Crear nueva tarea con las horas restantes
              await addAllocation({
                employeeId,
                projectId: task.projectId,
                weekStartDate: targetWeek,
                hoursAssigned: remainingHours,
                taskName: task.taskName || 'Tarea movida',
                status: 'planned'
              });
            }

            // Registrar feedback con la nota obligatoria
            await addWeeklyFeedback({
              employeeId,
              weekStartDate: taskWeekStr,
              projectId: task.projectId,
              allocationId: task.id,
              reason: 'other',
              comments: `Tarea movida a semana futura. Motivo: ${comment}`
            });
          }
        } else if (action === 'moveToEmployee') {
          // Mover horas restantes a otro compañero
          const targetEmployeeId = moveToEmployee[task.id];
          const targetWeek = moveToWeek[task.id];

          if (!targetEmployeeId || !targetWeek) {
            toast.error('Selecciona compañero y semana destino');
            continue;
          }

          const remainingHours = task.hoursAssigned - (task.hoursActual || 0);
          if (remainingHours > 0) {
            // Validar capacidad del compañero destino
            const targetEmployee = employees.find(e => e.id === targetEmployeeId);
            if (targetEmployee) {
              const targetWeekLoad = getEmployeeLoadForWeek(targetEmployeeId, targetWeek, undefined, undefined, viewDate);
              const targetCurrentHours = targetWeekLoad?.hours || 0;
              const targetCapacity = targetWeekLoad?.capacity || 0;
              const newTargetTotal = targetCurrentHours + remainingHours;

              if (newTargetTotal > targetCapacity) {
                toast.warning(
                  `${targetEmployee.name} excedería su capacidad en esa semana (${newTargetTotal.toFixed(1)}h / ${targetCapacity.toFixed(1)}h). La tarea se creará de todas formas.`
                );
                // No bloqueamos, solo avisamos
              }
            }

            // 1. Completar tarea actual con las horas realmente trabajadas
            await updateAllocation({
              ...task,
              hoursAssigned: task.hoursActual || 0,
              status: 'completed'
            });

            // 2. Crear tarea para el otro empleado
            const taskNameTransferred = `${task.taskName || 'Tarea'} (transferida de ${employees.find(e => e.id === employeeId)?.name || 'compañero'})`;
            await addAllocation({
              employeeId: targetEmployeeId,
              projectId: task.projectId,
              weekStartDate: targetWeek,
              hoursAssigned: remainingHours,
              taskName: taskNameTransferred,
              status: 'planned',
              transferredFromAllocationId: task.id // Rastrear de qué tarea original proviene esta transferencia
            });

            // 3. Registrar feedback para trazabilidad con nombre de tarea original
            // Guardamos el nombre original en el comentario para que persista aunque cambie
            await addWeeklyFeedback({
              employeeId,
              weekStartDate: taskWeekStr,
              projectId: task.projectId,
              allocationId: task.id, // ID de la tarea original
              reason: 'other',
              comments: `Tarea transferida a ${employees.find(e => e.id === targetEmployeeId)?.name || 'otro empleado'} (${remainingHours}h restantes) | Nombre: ${task.taskName || 'Sin nombre'}`
            });
          }
        } else if (action === 'justify') {
          const comment = taskComments[task.id];
          if (comment?.trim()) {
            await addWeeklyFeedback({
              employeeId,
              weekStartDate: taskWeekStr,
              projectId: task.projectId,
              allocationId: task.id,
              reason: 'other',
              comments: comment
            });
          }
        } else if (action === 'keep') {
          // Mantener la tarea tal cual (sin cambios)
          // Registrar feedback para marcarla como procesada y que no vuelva a aparecer
          const comment = taskComments[task.id] || 'Tarea mantenida tal cual';
          await addWeeklyFeedback({
            employeeId,
            weekStartDate: taskWeekStr,
            projectId: task.projectId,
            allocationId: task.id,
            reason: 'other',
            comments: comment
          });
        } else if (action === 'distribute') {
          // Opción D: Distribuir asignación genérica [Distribuir] o transferida en múltiples tareas
          const distTasks = distributionTasks[task.id] || [];
          const validTasks = distTasks.filter(t => t.taskName.trim() && parseFloat(t.hours) > 0);

          if (validTasks.length === 0) {
            toast.error('Añade al menos una tarea válida para distribuir');
            continue;
          }

          const totalDistributed = validTasks.reduce((sum, t) => sum + parseFloat(t.hours), 0);
          // Usar tolerancia muy pequeña (0.01) para manejar errores de punto flotante, pero ser estricto con decimales
          if (Math.abs(totalDistributed - task.hoursAssigned) > 0.01) {
            toast.error(`La suma de horas (${totalDistributed.toFixed(2)}h) debe ser igual a las horas asignadas (${task.hoursAssigned.toFixed(2)}h)`);
            continue;
          }

          // Validar capacidad y horas contratadas antes de crear tareas
          const projectMonthAllocations = allocations.filter(a =>
            a.projectId === task.projectId &&
            isAllocationInEffectiveMonth(a.weekStartDate, viewDate) &&
            a.id !== task.id
          );
          const projectMonthHours = projectMonthAllocations.reduce((sum, a) => sum + a.hoursAssigned, 0);
          const projectBudget = projects.find(p => p.id === task.projectId)?.budgetHours || 0;
          const newProjectMonthTotal = projectMonthHours + totalDistributed;

          if (projectBudget > 0 && newProjectMonthTotal > projectBudget) {
            toast.error(`No se puede guardar: Proyecto excede horas contratadas (${newProjectMonthTotal.toFixed(1)}h / ${projectBudget.toFixed(1)}h)`);
            continue;
          }

          // Validar capacidad por semana
          for (const distTask of validTasks) {
            const weekLoad = getEmployeeLoadForWeek(employeeId, distTask.weekDate, undefined, undefined, viewDate);
            const currentWeekHours = weekLoad?.hours || 0;
            const weekCapacity = weekLoad?.capacity || 0;

            // Sumar todas las tareas de esta semana
            const weekTasks = validTasks.filter(t => t.weekDate === distTask.weekDate);
            const weekTotalHours = weekTasks.reduce((sum, t) => sum + parseFloat(t.hours), 0);
            const newWeekTotal = currentWeekHours + weekTotalHours;

            if (newWeekTotal > weekCapacity) {
              toast.error(`No se puede guardar: Semana ${format(parseISO(distTask.weekDate), 'd MMM')} excede capacidad (${newWeekTotal.toFixed(1)}h / ${weekCapacity.toFixed(1)}h)`);
              continue;
            }
          }

          // Detectar si la tarea a distribuir es transferida
          const isTransferredTask = task.taskName?.includes('(transferida de');
          const transferMatch = task.taskName?.match(/\(transferida de (.+)\)/);
          const fromEmployeeName = transferMatch ? transferMatch[1] : null;

          // Extraer el nombre original de la tarea transferida (sin el indicador)
          // Ejemplo: "jaime (transferida de Miguel)" -> "jaime"
          const originalTransferredTaskName = isTransferredTask
            ? task.taskName?.replace(/\(transferida de .+\)/, '').trim() || task.taskName
            : null;

          // Guardar el ID de la tarea original ANTES de eliminarla (necesario para la foreign key)
          const originalTaskId = task.id;

          // Registrar feedback ANTES de eliminar para que hasPendingWeeklyTasks detecte que fue procesada
          // Guardar nombre original de la tarea en el comentario para que persista aunque cambie
          const originalTaskName = task.taskName?.replace(/\(transferida de .+\)/, '').trim() || task.taskName || 'Tarea';
          const comment = `Distribuidas en ${validTasks.length} tarea(s): ${validTasks.map(t => `${t.taskName} (${t.hours}h)`).join(', ')} | Nombre original: ${originalTaskName}`;
          await addWeeklyFeedback({
            employeeId,
            weekStartDate: taskWeekStr,
            projectId: task.projectId,
            allocationId: originalTaskId, // ID de la tarea que se distribuye (puede ser transferida)
            reason: 'other',
            comments: comment
          });

          // Crear las nuevas tareas distribuidas ANTES de eliminar la original
          // (necesario para que la foreign key constraint funcione)
          for (const distTask of validTasks) {
            // Si la tarea original era transferida, añadir el indicador y el nombre original
            let finalTaskName = distTask.taskName;
            if (isTransferredTask && fromEmployeeName) {
              if (originalTransferredTaskName && originalTransferredTaskName !== distTask.taskName) {
                // Si el nombre original es diferente, incluirlo: "pepe (transferida de Miguel, original: jaime)"
                finalTaskName = `${distTask.taskName} (transferida de ${fromEmployeeName}, original: ${originalTransferredTaskName})`;
              } else {
                // Si es el mismo nombre o no hay nombre original, solo añadir el indicador
                finalTaskName = `${distTask.taskName} (transferida de ${fromEmployeeName})`;
              }
            }

            const newAllocation = await addAllocation({
              employeeId,
              projectId: task.projectId,
              weekStartDate: distTask.weekDate,
              hoursAssigned: parseFloat(distTask.hours),
              taskName: finalTaskName,
              status: 'planned',
              // Si la tarea original era transferida, rastrear tanto la transferencia como la distribución
              transferredFromAllocationId: isTransferredTask && task.transferredFromAllocationId ? task.transferredFromAllocationId : undefined,
              distributionSourceAllocationId: originalTaskId // Rastrear de qué tarea transferida proviene esta distribución
            });

            // Crear feedback para cada tarea distribuida si proviene de transferencia (para trazabilidad)
            if (isTransferredTask && fromEmployeeName && newAllocation) {
              const feedbackComment = originalTransferredTaskName && originalTransferredTaskName !== distTask.taskName
                ? `Tarea distribuida desde transferencia de ${fromEmployeeName} (tarea original: ${originalTransferredTaskName})`
                : `Tarea distribuida desde transferencia de ${fromEmployeeName}`;

              await addWeeklyFeedback({
                employeeId,
                weekStartDate: distTask.weekDate,
                projectId: task.projectId,
                allocationId: newAllocation.id,
                reason: 'other',
                comments: feedbackComment
              });
            }
          }

          // Eliminar la tarea genérica original DESPUÉS de crear las distribuidas
          // (para que la foreign key constraint funcione correctamente)
          await deleteAllocation(originalTaskId);
        }
      }

      toast.success('Weekly actualizado correctamente');
      onOpenChange(false);
      setTaskActions({});
      setTaskComments({});
      setMoveToEmployee({});
      setMoveToWeek({});
      setMoveToMyWeek({});
      setDistributionTasks({});
    } catch (error) {
      console.error('Error actualizando weekly:', error);
      toast.error('Error al actualizar el weekly');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" aria-describedby="weekly-report-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Weekly
          </DialogTitle>
          <DialogDescription id="weekly-report-description">
            <div className="space-y-1">
              <p className="text-sm">Revisa las tareas que te quedaron abiertas y las que tus compañeros te han pasado.</p>
              <p className="text-xs text-muted-foreground mt-2">
                <strong>Importante:</strong> Únicamente se mostrarán tareas que dejaste sin completar de la semana anterior. Elige cómo gestionar cada tarea para mantener tu planificación actualizada.
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>

        {allTasks.length === 0 ? (
          <div className="py-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-4">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">¡Todo al día!</h3>
            <p className="text-sm text-muted-foreground">No tienes tareas pendientes de revisar. Tu weekly está completo.</p>
          </div>
        ) : (
          <>
            <div className="space-y-6 py-4 overflow-y-auto flex-1 min-h-0">
              {/* Tareas Abiertas */}
              {/* Todas las tareas (Abiertas + Transferidas) */}
              {(() => {
                // Agrupar tareas dinámicamente según filtros activos
                const tasksByFilter: Record<string, typeof allTasks> = {};
                const assignedTaskIds = new Set<string>();

                // 1. Asignar tareas a filtros activos
                activeFilters.forEach(filter => {
                  tasksByFilter[filter.id] = allTasks.filter(t => {
                    const proj = projects.find(p => p.id === t.projectId);
                    return proj && filterProject(proj, filter.id);
                  });
                  tasksByFilter[filter.id].forEach(t => assignedTaskIds.add(t.id));
                });

                // 2. Tareas que no entran en ningún filtro ("General" o "Otros")
                const otherTasks = allTasks.filter(t => !assignedTaskIds.has(t.id));
                if (otherTasks.length > 0) {
                  tasksByFilter['other'] = otherTasks;
                }

                return (
                  <div className="space-y-8">
                    <div className="flex items-center gap-2 pb-2 border-b">
                      <Clock className="h-4 w-4 text-amber-600" />
                      <h3 className="font-semibold text-sm text-slate-900">Tareas que quedaron abiertas</h3>
                      <Badge variant="outline" className="ml-auto text-xs">{openTasks.length}</Badge>
                    </div>

                    {/* Renderizar grupos dinámicamente */}
                    {[...activeFilters, { id: 'other', displayName: 'General' }].map(filter => {
                      const tasks = tasksByFilter[filter.id];
                      if (!tasks || tasks.length === 0) return null;

                      return (
                        <div key={filter.id} className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 text-xs">
                              {filter.displayName}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{tasks.length} tarea(s)</span>
                          </div>
                          {tasks.map(task => {
                            const project = projects.find(p => p.id === task.projectId);
                            const client = clients.find(c => c.id === project?.clientId);
                            const missingHours = task.hoursAssigned - (task.hoursActual || 0);
                            const isDistributionTask = task.taskName?.includes('[Distribuir]');
                            const isTransferredTask = task.taskName?.includes('(transferida de');

                            // Inicializar distribución si es necesario
                            if ((isDistributionTask || isTransferredTask) && taskActions[task.id] === 'distribute' && (!distributionTasks[task.id] || distributionTasks[task.id].length === 0)) {
                              initializeDistribution(task.id, task.hoursAssigned);
                            }

                            // Datos de transferencia
                            const transferFromMatch = task.taskName?.match(/\(transferida de (.+)\)/);
                            const transferFromName = transferFromMatch ? transferFromMatch[1] : null;
                            const transferFromEmployee = transferFromName ? employees.find(e => e.name === transferFromName) : null;

                            return (
                              <Card key={task.id} className="p-4 border-l-4" style={{ borderLeftColor: client?.color || '#6b7280' }}>
                                <div className="space-y-4">
                                  {/* Header */}
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: client?.color || '#6b7280' }} />
                                        <span className="font-semibold text-sm text-slate-900 truncate">{project?.name || 'Sin proyecto'}</span>
                                      </div>
                                      <p className="text-sm text-slate-700 mt-1">{task.taskName?.replace(/\(transferida de .+\)/, '').trim() || 'Sin nombre'}</p>

                                      {isTransferredTask && transferFromEmployee && (
                                        <div className="flex items-center gap-1.5 mt-2 bg-purple-50 rounded-full px-2 py-1 w-fit">
                                          <Avatar className="h-4 w-4">
                                            <AvatarImage src={transferFromEmployee.avatarUrl} alt={transferFromEmployee.name} />
                                            <AvatarFallback className="bg-purple-500 text-white text-[8px]">
                                              {(transferFromEmployee.first_name || transferFromEmployee.name)[0]}
                                            </AvatarFallback>
                                          </Avatar>
                                          <span className="text-xs text-purple-700">{transferFromEmployee.first_name || transferFromEmployee.name}</span>
                                        </div>
                                      )}
                                    </div>

                                    {/* Horas pendientes */}
                                    <div className="text-right shrink-0">
                                      <div className="text-xs text-muted-foreground mb-0.5">Pendiente</div>
                                      <Badge variant="secondary" className="font-mono text-amber-700 bg-amber-50 hover:bg-amber-100">
                                        {round2(missingHours)}h
                                      </Badge>
                                    </div>
                                  </div>

                                  {/* Acciones (Radio Group) */}
                                  <div className="pt-2 border-t border-slate-100">
                                    <RadioGroup
                                      value={taskActions[task.id] || ''}
                                      onValueChange={(value) => {
                                        setTaskActions(prev => ({ ...prev, [task.id]: value as any }));
                                        if (value === 'distribute' && (isDistributionTask || isTransferredTask)) {
                                          initializeDistribution(task.id, task.hoursAssigned);
                                        } else if (value === 'distribute' && (!distributionTasks[task.id] || distributionTasks[task.id].length === 0)) {
                                          initializeDistribution(task.id, missingHours);
                                        }

                                        if (value === 'move' && !moveToMyWeek[task.id] && futureWeeks.length > 0) {
                                          const defaultWeek = getStorageKey(futureWeeks[0].weekStart, viewDate);
                                          setMoveToMyWeek(prev => ({ ...prev, [task.id]: defaultWeek }));
                                        }
                                        if (value === 'moveToEmployee' && !moveToWeek[task.id] && futureWeeks.length > 0) {
                                          const defaultWeek = getStorageKey(futureWeeks[0].weekStart, viewDate);
                                          setMoveToWeek(prev => ({ ...prev, [task.id]: defaultWeek }));
                                        }
                                      }}
                                      className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                                    >
                                      <div className="flex items-center space-x-2 p-2 rounded border hover:bg-slate-50">
                                        <RadioGroupItem value="keep" id={`${task.id}-keep`} />
                                        <Label htmlFor={`${task.id}-keep`} className="cursor-pointer text-xs font-medium">Mantener / Completar hoy</Label>
                                      </div>
                                      <div className="flex items-center space-x-2 p-2 rounded border hover:bg-slate-50">
                                        <RadioGroupItem value="move" id={`${task.id}-move`} />
                                        <Label htmlFor={`${task.id}-move`} className="cursor-pointer text-xs font-medium">Mover a otra semana</Label>
                                      </div>
                                      <div className="flex items-center space-x-2 p-2 rounded border hover:bg-slate-50">
                                        <RadioGroupItem value="distribute" id={`${task.id}-distribute`} />
                                        <Label htmlFor={`${task.id}-distribute`} className="cursor-pointer text-xs font-medium">Distribuir horas</Label>
                                      </div>
                                      <div className="flex items-center space-x-2 p-2 rounded border hover:bg-slate-50">
                                        <RadioGroupItem value="moveToEmployee" id={`${task.id}-employee`} />
                                        <Label htmlFor={`${task.id}-employee`} className="cursor-pointer text-xs font-medium">Transferir a compañero</Label>
                                      </div>
                                    </RadioGroup>

                                    {/* Logic for 'distribute' */}
                                    {taskActions[task.id] === 'distribute' && (
                                      <div className="mt-4 pt-3 border-t border-purple-100 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div className="space-y-3">
                                          <div className="flex items-center justify-between text-xs text-purple-700 font-medium px-1">
                                            <span>Distribuir {round2(missingHours)}h:</span>
                                            <span>Falta: {round2(missingHours - (distributionTasks[task.id]?.reduce((acc, d) => acc + (parseFloat(d.hours) || 0), 0) || 0))}h</span>
                                          </div>

                                          <div className="space-y-2">
                                            {(distributionTasks[task.id] || []).map((dist) => (
                                              <div key={dist.id} className="flex items-center gap-2 bg-white p-2 rounded border border-purple-100">
                                                <Select
                                                  value={dist.weekDate}
                                                  onValueChange={(val) => updateDistributionRow(task.id, dist.id, 'weekDate', val)}
                                                >
                                                  <SelectTrigger className="h-8 text-xs flex-1">
                                                    <SelectValue placeholder="Semana" />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                    {futureWeeks.map(w => (
                                                      <SelectItem key={w.weekStart.toISOString()} value={getStorageKey(w.weekStart, viewDate)}>
                                                        Semana {getWeekNumber(w.weekStart)} ({format(w.weekStart, 'd MMM')})
                                                      </SelectItem>
                                                    ))}
                                                  </SelectContent>
                                                </Select>
                                                <Input
                                                  type="number"
                                                  className="h-8 w-20 text-xs"
                                                  value={dist.hours}
                                                  onChange={(e) => updateDistributionRow(task.id, dist.id, 'hours', e.target.value)}
                                                  placeholder="Horas"
                                                  min={0.1}
                                                  step={0.5}
                                                />
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-500" onClick={() => removeDistributionRow(task.id, dist.id)}>
                                                  <Trash2 className="h-4 w-4" />
                                                </Button>
                                              </div>
                                            ))}
                                          </div>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full text-xs border-dashed text-purple-600 border-purple-200 hover:bg-purple-50"
                                            onClick={() => addDistributionRow(task.id)}
                                          >
                                            <Plus className="h-3 w-3 mr-1" /> Añadir distribución
                                          </Button>
                                        </div>
                                      </div>
                                    )}

                                    {/* Logic for 'move' */}
                                    {taskActions[task.id] === 'move' && (
                                      <div className="mt-3 space-y-3 pl-2 border-l-2 border-primary/20">
                                        <div className="space-y-1">
                                          <Label className="text-xs">Semana destino</Label>
                                          <Select value={moveToMyWeek[task.id]} onValueChange={(val) => setMoveToMyWeek(prev => ({ ...prev, [task.id]: val }))}>
                                            <SelectTrigger className="h-8 text-xs">
                                              <SelectValue placeholder="seleccionar semana" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {futureWeeks.map(w => (
                                                <SelectItem key={w.weekStart.toISOString()} value={getStorageKey(w.weekStart, viewDate)}>
                                                  Semana {getWeekNumber(w.weekStart)} ({format(w.weekStart, 'd MMM')})
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        <div className="space-y-1">
                                          <Label className="text-xs">Nota (Obligatoria)</Label>
                                          <Textarea
                                            value={taskComments[task.id] || ''}
                                            onChange={(e) => setTaskComments(prev => ({ ...prev, [task.id]: e.target.value }))}
                                            className="h-16 text-xs"
                                            placeholder="Por qué mueves esta tarea..."
                                          />
                                        </div>
                                      </div>
                                    )}

                                    {/* Logic for 'moveToEmployee' */}
                                    {taskActions[task.id] === 'moveToEmployee' && (
                                      <div className="mt-3 space-y-3 pl-2 border-l-2 border-primary/20">
                                        <div className="grid grid-cols-2 gap-2">
                                          <div className="space-y-1">
                                            <Label className="text-xs">Compañero</Label>
                                            <Select value={moveToEmployee[task.id]} onValueChange={(val) => setMoveToEmployee(prev => ({ ...prev, [task.id]: val }))}>
                                              <SelectTrigger className="h-8 text-xs">
                                                <SelectValue placeholder="seleccionar" />
                                              </SelectTrigger>
                                              <SelectContent>
                                                {employees.filter(e => e.isActive && e.id !== employeeId).map(e => (
                                                  <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                                                ))}
                                              </SelectContent>
                                            </Select>
                                          </div>
                                          <div className="space-y-1">
                                            <Label className="text-xs">Semana</Label>
                                            <Select value={moveToWeek[task.id]} onValueChange={(val) => setMoveToWeek(prev => ({ ...prev, [task.id]: val }))}>
                                              <SelectTrigger className="h-8 text-xs">
                                                <SelectValue placeholder="Semana" />
                                              </SelectTrigger>
                                              <SelectContent>
                                                {futureWeeks.map(w => (
                                                  <SelectItem key={w.weekStart.toISOString()} value={getStorageKey(w.weekStart, viewDate)}>
                                                    Semana {getWeekNumber(w.weekStart)} ({format(w.weekStart, 'd MMM')})
                                                  </SelectItem>
                                                ))}
                                              </SelectContent>
                                            </Select>
                                          </div>
                                        </div>
                                        <div className="space-y-1">
                                          <Label className="text-xs">Nota (Obligatoria)</Label>
                                          <Textarea
                                            value={taskComments[task.id] || ''}
                                            onChange={(e) => setTaskComments(prev => ({ ...prev, [task.id]: e.target.value }))}
                                            className="h-16 text-xs"
                                            placeholder="Por qué transfieres esta tarea..."
                                          />
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </Card>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              {allTasks.length > 0 && (() => {
                // Validar que todas las tareas con acción "distribute" tengan la suma correcta
                let canSubmit = true;
                const validationErrors: string[] = [];

                for (const task of allTasks) {
                  const action = taskActions[task.id];

                  if (action === 'distribute') {
                    const distTasks = distributionTasks[task.id] || [];
                    const validTasks = distTasks.filter(t => t.taskName.trim() && parseFloat(t.hours) > 0);

                    if (validTasks.length === 0) {
                      canSubmit = false;
                      validationErrors.push(`"${task.taskName}" necesita al menos una tarea válida`);
                      continue;
                    }

                    const totalDistributed = validTasks.reduce((sum, t) => sum + parseFloat(t.hours), 0);
                    // Usar tolerancia muy pequeña (0.01) para manejar errores de punto flotante, pero ser estricto con decimales
                    if (Math.abs(totalDistributed - task.hoursAssigned) > 0.01) {
                      canSubmit = false;
                      validationErrors.push(`"${task.taskName}": suma ${totalDistributed.toFixed(2)}h debe ser ${task.hoursAssigned.toFixed(2)}h`);
                    }

                    // Validar capacidad y horas contratadas
                    const projectMonthAllocations = allocations.filter(a =>
                      a.projectId === task.projectId &&
                      isAllocationInEffectiveMonth(a.weekStartDate, viewDate) &&
                      a.id !== task.id
                    );
                    const projectMonthHours = projectMonthAllocations.reduce((sum, a) => sum + a.hoursAssigned, 0);
                    const projectBudget = projects.find(p => p.id === task.projectId)?.budgetHours || 0;
                    const newProjectMonthTotal = projectMonthHours + totalDistributed;

                    if (projectBudget > 0 && newProjectMonthTotal > projectBudget) {
                      canSubmit = false;
                      validationErrors.push(`"${task.taskName}": excede horas contratadas (${newProjectMonthTotal.toFixed(1)}h / ${projectBudget.toFixed(1)}h)`);
                    }

                    // Validar capacidad por semana
                    for (const distTask of validTasks) {
                      const weekLoad = getEmployeeLoadForWeek(employeeId, distTask.weekDate, undefined, undefined, viewDate);
                      const currentWeekHours = weekLoad?.hours || 0;
                      const weekCapacity = weekLoad?.capacity || 0;

                      const weekTasks = validTasks.filter(t => t.weekDate === distTask.weekDate);
                      const weekTotalHours = weekTasks.reduce((sum, t) => sum + parseFloat(t.hours), 0);
                      const newWeekTotal = currentWeekHours + weekTotalHours;

                      if (newWeekTotal > weekCapacity) {
                        canSubmit = false;
                        validationErrors.push(`"${task.taskName}": semana ${format(parseISO(distTask.weekDate), 'd MMM')} excede capacidad (${newWeekTotal.toFixed(1)}h / ${weekCapacity.toFixed(1)}h)`);
                      }
                    }
                  } else if (action === 'move') {
                    const targetWeek = moveToMyWeek[task.id];
                    const comment = taskComments[task.id];

                    if (!targetWeek) {
                      canSubmit = false;
                      validationErrors.push(`"${task.taskName}": selecciona semana destino`);
                    } else if (futureWeeks.length === 0) {
                      canSubmit = false;
                      validationErrors.push(`"${task.taskName}": no hay semanas futuras en este mes. Usa "Mover a otro compañero"`);
                    } else if (!comment || !comment.trim()) {
                      canSubmit = false;
                      validationErrors.push(`"${task.taskName}": añade una nota explicando por qué mueves esta tarea`);
                    } else {
                      // Validar capacidad propia
                      const remainingHours = task.hoursAssigned - (task.hoursActual || 0);
                      if (remainingHours > 0) {
                        const weekLoad = getEmployeeLoadForWeek(employeeId, targetWeek, undefined, undefined, viewDate);
                        const currentWeekHours = weekLoad?.hours || 0;
                        const weekCapacity = weekLoad?.capacity || 0;
                        const newWeekTotal = currentWeekHours + remainingHours;

                        if (newWeekTotal > weekCapacity) {
                          canSubmit = false;
                          validationErrors.push(`"${task.taskName}": excede tu capacidad en esa semana (${newWeekTotal.toFixed(1)}h / ${weekCapacity.toFixed(1)}h)`);
                        }
                      }
                    }
                  } else if (action === 'moveToEmployee') {
                    const targetEmployeeId = moveToEmployee[task.id];
                    const targetWeek = moveToWeek[task.id];
                    const comment = taskComments[task.id];

                    if (!targetEmployeeId || !targetWeek) {
                      canSubmit = false;
                      validationErrors.push(`"${task.taskName}": selecciona compañero y semana destino`);
                    } else if (!comment || !comment.trim()) {
                      canSubmit = false;
                      validationErrors.push(`"${task.taskName}": añade una nota explicando por qué transfieres esta tarea`);
                    } else {
                      // Validar capacidad del compañero destino
                      const remainingHours = task.hoursAssigned - (task.hoursActual || 0);
                      if (remainingHours > 0) {
                        const targetWeekLoad = getEmployeeLoadForWeek(targetEmployeeId, targetWeek, undefined, undefined, viewDate);
                        const targetCurrentHours = targetWeekLoad?.hours || 0;
                        const targetCapacity = targetWeekLoad?.capacity || 0;
                        const newTargetTotal = targetCurrentHours + remainingHours;

                        const targetEmployee = employees.find(e => e.id === targetEmployeeId);
                        if (targetEmployee && newTargetTotal > targetCapacity) {
                          canSubmit = false;
                          validationErrors.push(`"${task.taskName}": ${targetEmployee.name} excedería su capacidad (${newTargetTotal.toFixed(1)}h / ${targetCapacity.toFixed(1)}h)`);
                        }
                      }
                    }
                  }
                }

                return (
                  <Button
                    onClick={handleCloseWeek}
                    className="bg-primary hover:bg-primary/90"
                    disabled={!canSubmit}
                    title={!canSubmit ? validationErrors.join('; ') : ''}
                  >
                    Confirmar Weekly
                  </Button>
                );
              })()}
            </DialogFooter>
          </>
        )}

      </DialogContent >
    </Dialog >
  );
}

