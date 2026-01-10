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
  const { allocations, projects, clients, employees, absences, teamEvents, weeklyFeedback, updateAllocation, addAllocation, deleteAllocation, addWeeklyFeedback, getEmployeeLoadForWeek, loadDataForMonth } = useApp();
  const round2 = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

  // Función helper para normalizar números (acepta tanto coma como punto como separador decimal)
  const normalizeNumber = (value: string): string => {
    // Reemplazar coma por punto para parseFloat
    return value.replace(',', '.');
  };

  // Función helper para parsear horas con soporte para coma y punto
  const parseHours = (value: string): number => {
    const normalized = normalizeNumber(value);
    const parsed = parseFloat(normalized);
    return isNaN(parsed) ? 0 : parsed;
  };

  const [taskActions, setTaskActions] = useState<Record<string, 'move' | 'moveToEmployee' | 'justify' | 'distribute' | 'keep' | 'rollover' | null>>({});
  const [taskComments, setTaskComments] = useState<Record<string, string>>({});
  const [distributionTasks, setDistributionTasks] = useState<Record<string, Array<{ id: string; taskName: string; hours: string; weekDate: string }>>>({});
  const [moveToEmployee, setMoveToEmployee] = useState<Record<string, string>>({}); // taskId -> employeeId
  const [moveToWeek, setMoveToWeek] = useState<Record<string, string>>({}); // taskId -> weekStartDate
  const [moveToMyWeek, setMoveToMyWeek] = useState<Record<string, string>>({}); // taskId -> weekStartDate (para "Mover a mi semana")
  const [keepTaskHours, setKeepTaskHours] = useState<Record<string, { actual: string; computed: string }>>({}); // taskId -> { actual, computed }
  const [rolloverHours, setRolloverHours] = useState<Record<string, { actual: string; computed: string }>>({}); // taskId -> { actual, computed } para rollover
  const [rolloverNewHours, setRolloverNewHours] = useState<Record<string, string>>({}); // taskId -> nueva estimación para semana siguiente

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

        // NEW: Strict Week Filtering. Only show tasks for the TARGET WEEK.
        // This prevents tasks from future weeks (Week 3) appearing when doing Weekly for Week 2.
        // It also prevents stale tasks from weeks prior to the target one if they weren't caught.
        // Note: targetWeek comes from getTargetWeek() which defaults to current week or last week of month.
        if (getStorageKey(taskWeekDate, viewDate) !== targetWeek) return;

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

  // Handler especial para horas que normaliza el valor
  const updateDistributionHours = (taskId: string, rowId: string, value: string) => {
    // Permitir entrada con coma o punto, pero normalizar internamente
    updateDistributionRow(taskId, rowId, 'hours', value);
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

            // 2. Crear tarea para el otro empleado - NOMBRE LIMPIO
            const taskNameTransferred = task.taskName || 'Tarea';
            await addAllocation({
              employeeId: targetEmployeeId,
              projectId: task.projectId,
              weekStartDate: targetWeek,
              hoursAssigned: remainingHours,
              taskName: taskNameTransferred,
              status: 'planned',
              transferredFromAllocationId: task.id, // Rastrear de qué tarea original proviene esta transferencia
              originalTransferredTaskName: task.originalTransferredTaskName || taskNameTransferred.replace(/\(transferida de .+\)/, '').trim(),
              transferSourceEmployeeId: employeeId // Quién está transfiriendo (yo)
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
          // Mantener / Completar la tarea con horas reales y computadas
          const hours = keepTaskHours[task.id];
          const actual = hours ? parseHours(hours.actual) : (task.hoursActual || task.hoursAssigned);
          const computed = hours ? parseHours(hours.computed) : (task.hoursComputed || actual);

          if (actual <= 0) {
            toast.error(`"${task.taskName}" necesita horas reales mayores a 0`);
            continue;
          }

          // Actualizar la tarea con las horas reales y computadas, y marcarla como completada
          await updateAllocation({
            ...task,
            hoursActual: actual,
            hoursComputed: computed,
            status: 'completed'
          });

          // Registrar feedback para marcarla como procesada
          const comment = taskComments[task.id] || `Tarea completada: ${actual.toFixed(2)}h reales, ${computed.toFixed(2)}h computadas`;
          await addWeeklyFeedback({
            employeeId,
            weekStartDate: taskWeekStr,
            projectId: task.projectId,
            allocationId: task.id,
            reason: 'other',
            comments: comment
          });
        } else if (action === 'rollover') {
          // Imputar y Continuar: Cerrar tarea actual y crear nueva en semana siguiente
          const hours = rolloverHours[task.id];
          const newHoursEstimate = rolloverNewHours[task.id];

          if (!hours || !newHoursEstimate) {
            toast.error(`"${task.taskName}" necesita horas reales y nueva estimación completadas`);
            continue;
          }

          const actual = parseHours(hours.actual);
          const computed = parseHours(hours.computed) || actual;
          const newEstimate = parseHours(newHoursEstimate);

          if (actual <= 0) {
            toast.error(`"${task.taskName}" necesita horas reales mayores a 0`);
            continue;
          }

          if (newEstimate <= 0) {
            toast.error(`"${task.taskName}" necesita una nueva estimación mayor a 0`);
            continue;
          }

          // 1. Cerrar tarea actual (Semana N) - NO cambiar la fecha, se queda en Semana N
          await updateAllocation({
            ...task,
            hoursActual: actual,
            hoursComputed: computed,
            status: 'completed'
          });

          // 2. Calcular semana siguiente (lunes de la semana siguiente)
          const currentWeekDate = parseISO(task.weekStartDate);
          const nextWeekStart = startOfWeek(addDays(currentWeekDate, 7), { weekStartsOn: 1 });
          // Usar getStorageKey para normalizar la fecha según el mes (maneja semanas partidas)
          const nextWeekStr = getStorageKey(nextWeekStart, viewDate);

          console.log('[Rollover] Creando tarea:', {
            taskName: task.taskName,
            currentWeek: task.weekStartDate,
            nextWeek: nextWeekStr,
            nextWeekStart: format(nextWeekStart, 'yyyy-MM-dd'),
            newEstimate,
            parentId: task.id
          });

          // 3. Crear nueva tarea (Semana N+1) con parent_allocation_id
          try {
            const newAllocation = await addAllocation({
              employeeId: task.employeeId,
              projectId: task.projectId,
              weekStartDate: nextWeekStr,
              hoursAssigned: newEstimate,
              hoursActual: 0,
              hoursComputed: 0,
              status: 'planned',
              taskName: task.taskName,
              description: task.description,
              parentAllocationId: task.id // ENLACE CRÍTICO para trazabilidad
            });

            if (!newAllocation) {
              console.error('[Rollover] addAllocation retornó null');
              toast.error(`Error al crear la tarea en la semana siguiente para "${task.taskName}"`);
              continue;
            }

            console.log('[Rollover] Tarea creada exitosamente:', newAllocation);

            // Si la semana siguiente está en un mes diferente, cargar datos de ese mes
            const nextWeekMonth = new Date(nextWeekStart.getFullYear(), nextWeekStart.getMonth(), 1);
            const currentViewMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);

            if (nextWeekMonth.getTime() !== currentViewMonth.getTime()) {
              console.log('[Rollover] Cargando datos del mes siguiente:', format(nextWeekMonth, 'yyyy-MM'));
              await loadDataForMonth(nextWeekMonth);
            }
          } catch (error) {
            console.error('[Rollover] Error creando tarea:', error);
            toast.error(`Error al crear la tarea en la semana siguiente: ${error instanceof Error ? error.message : 'Error desconocido'}`);
            continue;
          }

          // 4. Registrar feedback
          const comment = taskComments[task.id] || `Tarea con rollover: ${actual.toFixed(2)}h imputadas esta semana, ${newEstimate.toFixed(2)}h planificadas para próxima semana`;
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
          const validTasks = distTasks.filter(t => t.taskName.trim() && parseHours(t.hours) > 0);

          if (validTasks.length === 0) {
            toast.error('Añade al menos una tarea válida para distribuir');
            continue;
          }

          const totalDistributed = validTasks.reduce((sum, t) => sum + parseHours(t.hours), 0);
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
            const weekTotalHours = weekTasks.reduce((sum, t) => sum + parseHours(t.hours), 0);
            const newWeekTotal = currentWeekHours + weekTotalHours;

            if (newWeekTotal > weekCapacity) {
              toast.error(`No se puede guardar: Semana ${format(parseISO(distTask.weekDate), 'd MMM')} excede capacidad (${newWeekTotal.toFixed(1)}h / ${weekCapacity.toFixed(1)}h)`);
              continue;
            }
          }

          // Detectar si la tarea a distribuir es transferida (usando IDs o string legacy)
          const isTransferredTask = !!task.transferredFromAllocationId || task.taskName?.includes('(transferida de');
          const transferMatch = task.taskName?.match(/\(transferida de (.+)\)/);
          const fromEmployeeName = transferMatch ? transferMatch[1] : (
            task.transferSourceEmployeeId ? employees.find(e => e.id === task.transferSourceEmployeeId)?.name : null
          );

          // Extraer el nombre original de la tarea transferida
          const originalTransferredTaskName = task.originalTransferredTaskName || (
            isTransferredTask
              ? task.taskName?.replace(/\(transferida de .+\)/, '').trim() || task.taskName
              : null
          );

          // Guardar el ID de la tarea original ANTES de eliminarla (necesario para la foreign key)
          const originalTaskId = task.id;

          // Registrar feedback ANTES de eliminar para que hasPendingWeeklyTasks detecte que fue procesada
          // Guardar nombre original de la tarea en el comentario para que persista aunque cambie
          const originalTaskName = task.taskName?.replace(/\(transferida de .+\)/, '').trim() || task.taskName || 'Tarea';
          const userComment = taskComments[task.id]?.trim();
          const baseComment = `Distribuidas en ${validTasks.length} tarea(s): ${validTasks.map(t => `${t.taskName} (${t.hours}h)`).join(', ')} | Nombre original: ${originalTaskName}`;
          const comment = userComment ? `${baseComment} | Nota: ${userComment}` : baseComment;
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
            // Si la tarea original era transferida, usar NOMBRE LIMPIO
            const finalTaskName = distTask.taskName;

            const newAllocation = await addAllocation({
              employeeId,
              projectId: task.projectId,
              weekStartDate: distTask.weekDate,
              hoursAssigned: parseHours(distTask.hours),
              taskName: finalTaskName,
              status: 'planned',
              // Si la tarea original era transferida, rastrear tanto la transferencia como la distribución
              transferredFromAllocationId: isTransferredTask && task.transferredFromAllocationId ? task.transferredFromAllocationId : undefined,
              distributionSourceAllocationId: originalTaskId, // Rastrear de qué tarea transferida proviene esta distribución
              originalTransferredTaskName: originalTransferredTaskName || finalTaskName, // Propagar nombre original
              transferSourceEmployeeId: task.transferSourceEmployeeId || (isTransferredTask ? undefined : employeeId) // Propagar source original o soy yo
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
      setKeepTaskHours({});
      setRolloverHours({});
      setRolloverNewHours({});
    } catch (error) {
      console.error('Error actualizando weekly:', error);
      toast.error('Error al actualizar el weekly');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" aria-describedby="weekly-report-desc">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Weekly
          </DialogTitle>
          <DialogDescription id="weekly-report-desc" className="space-y-2">
            <span className="block text-sm">Revisa las tareas que te quedaron abiertas y las que tus compañeros te han pasado.</span>
            <span className="block text-xs text-muted-foreground">
              <strong>Importante:</strong> Únicamente se mostrarán tareas que dejaste sin completar de la semana anterior. Elige cómo gestionar cada tarea para mantener tu planificación actualizada.
            </span>
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

                // 1. Asignar tareas a filtros activos (cada tarea solo al primer filtro que coincida)
                activeFilters.forEach(filter => {
                  tasksByFilter[filter.id] = allTasks.filter(t => {
                    // Si la tarea ya fue asignada a otro filtro, no la incluimos aquí
                    if (assignedTaskIds.has(t.id)) return false;

                    const proj = projects.find(p => p.id === t.projectId);
                    const matches = proj && filterProject(proj, filter.id);

                    // Si coincide con este filtro, marcarla como asignada
                    if (matches) {
                      assignedTaskIds.add(t.id);
                    }

                    return matches;
                  });
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

                                        if (value === 'keep' && !keepTaskHours[task.id]) {
                                          // Inicializar horas reales y computadas con valores por defecto
                                          const defaultActual = (task.hoursActual || task.hoursAssigned || 0).toFixed(2);
                                          const defaultComputed = (task.hoursComputed || task.hoursActual || task.hoursAssigned || 0).toFixed(2);
                                          setKeepTaskHours(prev => ({
                                            ...prev,
                                            [task.id]: { actual: defaultActual, computed: defaultComputed }
                                          }));
                                        }

                                        if (value === 'rollover' && !rolloverHours[task.id]) {
                                          // Inicializar horas reales, computadas y nueva estimación con valores por defecto
                                          const defaultActual = (task.hoursActual || missingHours || 0).toFixed(2);
                                          const defaultComputed = (task.hoursComputed || task.hoursActual || missingHours || 0).toFixed(2);
                                          const defaultNewHours = missingHours > 0 ? missingHours.toFixed(2) : '0.00';
                                          setRolloverHours(prev => ({
                                            ...prev,
                                            [task.id]: { actual: defaultActual, computed: defaultComputed }
                                          }));
                                          setRolloverNewHours(prev => ({
                                            ...prev,
                                            [task.id]: defaultNewHours
                                          }));
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
                                        <RadioGroupItem value="rollover" id={`${task.id}-rollover`} />
                                        <Label htmlFor={`${task.id}-rollover`} className="cursor-pointer text-xs font-medium">Imputar y Continuar (Próxima Semana)</Label>
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

                                    {/* Logic for 'keep' */}
                                    {taskActions[task.id] === 'keep' && (() => {
                                      const hours = keepTaskHours[task.id] || {
                                        actual: (task.hoursActual || task.hoursAssigned || 0).toFixed(2),
                                        computed: (task.hoursComputed || task.hoursActual || task.hoursAssigned || 0).toFixed(2)
                                      };

                                      return (
                                        <div className="mt-3 space-y-3 pl-3 border-l-4 bg-gradient-to-r from-emerald-50/30 to-teal-50/30 rounded-r-lg p-4 border-emerald-300">
                                          <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                              <Label className="text-xs font-medium text-slate-700">Horas Reales *</Label>
                                              <Input
                                                type="text"
                                                inputMode="decimal"
                                                className="h-9 text-xs font-mono border-2 border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500"
                                                value={hours.actual}
                                                onChange={(e) => {
                                                  const value = e.target.value.replace(/[^0-9,.]/g, '').replace(/,/g, '.');
                                                  const parts = value.split('.');
                                                  const normalized = parts.length > 1 ? `${parts[0]}.${parts[1].slice(0, 2)}` : value;
                                                  setKeepTaskHours(prev => ({
                                                    ...prev,
                                                    [task.id]: { ...prev[task.id], actual: normalized }
                                                  }));
                                                }}
                                                placeholder="0.00"
                                              />
                                              <p className="text-xs text-muted-foreground">Horas realmente trabajadas</p>
                                            </div>
                                            <div className="space-y-1">
                                              <Label className="text-xs font-medium text-slate-700">Horas Computadas</Label>
                                              <Input
                                                type="text"
                                                inputMode="decimal"
                                                className="h-9 text-xs font-mono border-2 border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500"
                                                value={hours.computed}
                                                onChange={(e) => {
                                                  const value = e.target.value.replace(/[^0-9,.]/g, '').replace(/,/g, '.');
                                                  const parts = value.split('.');
                                                  const normalized = parts.length > 1 ? `${parts[0]}.${parts[1].slice(0, 2)}` : value;
                                                  setKeepTaskHours(prev => ({
                                                    ...prev,
                                                    [task.id]: { ...prev[task.id], computed: normalized }
                                                  }));
                                                }}
                                                placeholder="0.00"
                                              />
                                              <p className="text-xs text-muted-foreground">Horas a facturar (por defecto = reales)</p>
                                            </div>
                                          </div>
                                          <div className="space-y-1 pt-2 border-t border-emerald-200">
                                            <Label className="text-xs font-medium text-slate-700">Nota (Opcional)</Label>
                                            <Textarea
                                              value={taskComments[task.id] || ''}
                                              onChange={(e) => setTaskComments(prev => ({ ...prev, [task.id]: e.target.value }))}
                                              className="h-16 text-xs border-emerald-200 focus:border-emerald-400 focus:ring-emerald-400"
                                              placeholder="Nota adicional sobre el cierre de la tarea..."
                                            />
                                          </div>
                                        </div>
                                      );
                                    })()}

                                    {/* Logic for 'rollover' */}
                                    {taskActions[task.id] === 'rollover' && (() => {
                                      const hours = rolloverHours[task.id] || {
                                        actual: (task.hoursActual || missingHours || 0).toFixed(2),
                                        computed: (task.hoursComputed || task.hoursActual || missingHours || 0).toFixed(2)
                                      };
                                      const newHoursEstimate = rolloverNewHours[task.id] || (missingHours > 0 ? missingHours.toFixed(2) : '0.00');

                                      // Calcular semana siguiente
                                      const nextWeekStart = addDays(parseISO(task.weekStartDate), 7);
                                      const nextWeekStr = format(nextWeekStart, 'yyyy-MM-dd');

                                      return (
                                        <div className="mt-3 space-y-3 pl-3 border-l-4 bg-gradient-to-r from-blue-50/30 to-cyan-50/30 rounded-r-lg p-4 border-blue-300">
                                          <div className="space-y-2">
                                            <p className="text-xs font-medium text-slate-700 mb-2">Imputar horas de esta semana y continuar en la próxima:</p>
                                            <div className="grid grid-cols-2 gap-3">
                                              <div className="space-y-1">
                                                <Label className="text-xs font-medium text-slate-700">Horas Reales Imputadas *</Label>
                                                <Input
                                                  type="text"
                                                  inputMode="decimal"
                                                  className="h-9 text-xs font-mono border-2 border-blue-300 focus:border-blue-500 focus:ring-blue-500"
                                                  value={hours.actual}
                                                  onChange={(e) => {
                                                    const value = e.target.value.replace(/[^0-9,.]/g, '').replace(/,/g, '.');
                                                    const parts = value.split('.');
                                                    const normalized = parts.length > 1 ? `${parts[0]}.${parts[1].slice(0, 2)}` : value;
                                                    setRolloverHours(prev => ({
                                                      ...prev,
                                                      [task.id]: { ...prev[task.id], actual: normalized }
                                                    }));
                                                  }}
                                                  placeholder="0.00"
                                                />
                                                <p className="text-xs text-muted-foreground">Horas realmente trabajadas esta semana</p>
                                              </div>
                                              <div className="space-y-1">
                                                <Label className="text-xs font-medium text-slate-700">Horas Computadas</Label>
                                                <Input
                                                  type="text"
                                                  inputMode="decimal"
                                                  className="h-9 text-xs font-mono border-2 border-blue-300 focus:border-blue-500 focus:ring-blue-500"
                                                  value={hours.computed}
                                                  onChange={(e) => {
                                                    const value = e.target.value.replace(/[^0-9,.]/g, '').replace(/,/g, '.');
                                                    const parts = value.split('.');
                                                    const normalized = parts.length > 1 ? `${parts[0]}.${parts[1].slice(0, 2)}` : value;
                                                    setRolloverHours(prev => ({
                                                      ...prev,
                                                      [task.id]: { ...prev[task.id], computed: normalized }
                                                    }));
                                                  }}
                                                  placeholder="0.00"
                                                />
                                                <p className="text-xs text-muted-foreground">Horas a facturar (por defecto = reales)</p>
                                              </div>
                                            </div>
                                            <div className="space-y-1 pt-2 border-t border-blue-200">
                                              <Label className="text-xs font-medium text-slate-700">Nueva Estimación para Semana Siguiente *</Label>
                                              <Input
                                                type="text"
                                                inputMode="decimal"
                                                className="h-9 text-xs font-mono border-2 border-blue-300 focus:border-blue-500 focus:ring-blue-500"
                                                value={newHoursEstimate}
                                                onChange={(e) => {
                                                  const value = e.target.value.replace(/[^0-9,.]/g, '').replace(/,/g, '.');
                                                  const parts = value.split('.');
                                                  const normalized = parts.length > 1 ? `${parts[0]}.${parts[1].slice(0, 2)}` : value;
                                                  setRolloverNewHours(prev => ({
                                                    ...prev,
                                                    [task.id]: normalized
                                                  }));
                                                }}
                                                placeholder="0.00"
                                              />
                                              <p className="text-xs text-muted-foreground">
                                                Horas planificadas para la semana del {format(nextWeekStart, 'd MMM yyyy')}
                                              </p>
                                            </div>
                                            <div className="space-y-1 pt-2 border-t border-blue-200">
                                              <Label className="text-xs font-medium text-slate-700">Nota (Opcional)</Label>
                                              <Textarea
                                                value={taskComments[task.id] || ''}
                                                onChange={(e) => setTaskComments(prev => ({ ...prev, [task.id]: e.target.value }))}
                                                className="h-16 text-xs border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                                                placeholder="Nota adicional sobre el rollover..."
                                              />
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })()}

                                    {/* Logic for 'distribute' */}
                                    {taskActions[task.id] === 'distribute' && (
                                      <div className="mt-4 pt-3 border-t-2 border-indigo-200 bg-gradient-to-br from-indigo-50/30 to-purple-50/30 rounded-lg p-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div className="space-y-3">
                                          <div className="flex items-center justify-between text-xs font-medium px-1">
                                            <span className="text-indigo-700 dark:text-indigo-400">Distribuir {round2(missingHours).toFixed(2)}h:</span>
                                            <span className={round2(missingHours - (distributionTasks[task.id]?.reduce((acc, d) => acc + parseHours(d.hours), 0) || 0)) === 0
                                              ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                                              : "text-amber-600 dark:text-amber-400"}>
                                              Falta: {round2(missingHours - (distributionTasks[task.id]?.reduce((acc, d) => acc + parseHours(d.hours), 0) || 0)).toFixed(2)}h
                                            </span>
                                          </div>

                                          <div className="space-y-2">
                                            {(distributionTasks[task.id] || []).map((dist) => {
                                              const weekLoad = dist.weekDate ? getEmployeeLoadForWeek(employeeId, dist.weekDate, undefined, undefined, viewDate) : null;
                                              const weekHours = weekLoad?.hours || 0;
                                              const weekCapacity = weekLoad?.capacity || 0;
                                              const weekAvailable = round2(weekCapacity - weekHours);

                                              const hoursValue = parseHours(dist.hours);
                                              const isOverCapacity = weekLoad && (weekHours + hoursValue) > weekCapacity;
                                              const availabilityStatus = weekLoad
                                                ? (weekAvailable >= 5 ? 'healthy' : weekAvailable >= 0 ? 'warning' : 'overload')
                                                : 'unknown';

                                              return (
                                                <div key={dist.id} className="space-y-2 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 p-3 rounded-lg border-2 border-indigo-200/50 shadow-sm hover:shadow-md transition-all">
                                                  <div className="flex items-center gap-2">
                                                    <Input
                                                      type="text"
                                                      className="h-9 text-xs flex-1 border-indigo-300 focus:border-indigo-500 focus:ring-indigo-500"
                                                      value={dist.taskName}
                                                      onChange={(e) => updateDistributionRow(task.id, dist.id, 'taskName', e.target.value)}
                                                      placeholder="Nombre de la tarea *"
                                                      required
                                                    />
                                                    <Input
                                                      type="text"
                                                      inputMode="decimal"
                                                      className={`h-9 w-24 text-xs font-mono border-2 ${isOverCapacity
                                                        ? 'border-red-400 focus:border-red-500 focus:ring-red-500'
                                                        : 'border-indigo-300 focus:border-indigo-500 focus:ring-indigo-500'
                                                        }`}
                                                      value={dist.hours}
                                                      onChange={(e) => {
                                                        // Permitir entrada con coma o punto
                                                        const value = e.target.value.replace(/[^0-9,.]/g, '').replace(/,/g, '.');
                                                        // Asegurar máximo 2 decimales
                                                        const parts = value.split('.');
                                                        const normalized = parts.length > 1 ? `${parts[0]}.${parts[1].slice(0, 2)}` : value;
                                                        updateDistributionHours(task.id, dist.id, normalized);
                                                      }}
                                                      placeholder="0.00"
                                                      step="0.01"
                                                    />
                                                    <Button
                                                      variant="ghost"
                                                      size="icon"
                                                      className="h-9 w-9 text-red-500 hover:text-red-700 hover:bg-red-50 border border-red-200 rounded-md transition-colors"
                                                      onClick={() => removeDistributionRow(task.id, dist.id)}
                                                    >
                                                      <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                  </div>
                                                  <div className="flex items-center gap-2">
                                                    <Select
                                                      value={dist.weekDate}
                                                      onValueChange={(val) => updateDistributionRow(task.id, dist.id, 'weekDate', val)}
                                                    >
                                                      <SelectTrigger className="h-9 text-xs flex-1 border-indigo-300 focus:border-indigo-500 focus:ring-indigo-500">
                                                        <SelectValue placeholder="Semana" />
                                                      </SelectTrigger>
                                                      <SelectContent>
                                                        {futureWeeks.map(w => {
                                                          const weekKey = getStorageKey(w.weekStart, viewDate);
                                                          const load = getEmployeeLoadForWeek(employeeId, weekKey, undefined, undefined, viewDate);
                                                          const hours = load?.hours || 0;
                                                          const capacity = load?.capacity || 0;
                                                          const available = round2(capacity - hours);
                                                          const status = available >= 5 ? 'healthy' : available >= 0 ? 'warning' : 'overload';
                                                          return (
                                                            <SelectItem
                                                              key={w.weekStart.toISOString()}
                                                              value={weekKey}
                                                              className={status === 'healthy' ? 'text-emerald-700' : status === 'warning' ? 'text-amber-700' : 'text-red-700'}
                                                            >
                                                              Semana {getWeekNumber(w.weekStart)} ({format(w.weekStart, 'd MMM')}) - {available.toFixed(2)}h libres ({hours.toFixed(2)}h / {capacity.toFixed(2)}h)
                                                            </SelectItem>
                                                          );
                                                        })}
                                                      </SelectContent>
                                                    </Select>
                                                    {weekLoad && (
                                                      <div className={`text-xs font-medium whitespace-nowrap px-2 py-1 rounded ${availabilityStatus === 'healthy'
                                                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                                                        : availabilityStatus === 'warning'
                                                          ? 'bg-amber-100 text-amber-700 border border-amber-300'
                                                          : 'bg-red-100 text-red-700 border border-red-300'
                                                        }`}>
                                                        {weekHours.toFixed(2)}h / {weekCapacity.toFixed(2)}h
                                                      </div>
                                                    )}
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full text-xs border-2 border-dashed border-indigo-300 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-400 font-medium transition-colors"
                                            onClick={() => addDistributionRow(task.id)}
                                          >
                                            <Plus className="h-3 w-3 mr-1" /> Añadir distribución
                                          </Button>
                                          <div className="space-y-1 pt-3 border-t border-indigo-200">
                                            <Label className="text-xs font-medium text-slate-700">Nota (Opcional)</Label>
                                            <Textarea
                                              value={taskComments[task.id] || ''}
                                              onChange={(e) => setTaskComments(prev => ({ ...prev, [task.id]: e.target.value }))}
                                              className="h-16 text-xs border-indigo-200 focus:border-indigo-400 focus:ring-indigo-400"
                                              placeholder="Nota adicional sobre la distribución..."
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {/* Logic for 'move' */}
                                    {taskActions[task.id] === 'move' && (() => {
                                      const selectedWeek = moveToMyWeek[task.id];
                                      const weekLoad = selectedWeek ? getEmployeeLoadForWeek(employeeId, selectedWeek, undefined, undefined, viewDate) : null;
                                      const weekHours = weekLoad?.hours || 0;
                                      const weekCapacity = weekLoad?.capacity || 0;
                                      const weekAvailable = round2(weekCapacity - weekHours);
                                      const availabilityStatus = weekLoad
                                        ? (weekAvailable >= 5 ? 'healthy' : weekAvailable >= 0 ? 'warning' : 'overload')
                                        : 'unknown';

                                      return (
                                        <div className="mt-3 space-y-3 pl-3 border-l-4 bg-gradient-to-r from-blue-50/30 to-cyan-50/30 rounded-r-lg p-4 border-blue-300">
                                          <div className="space-y-1">
                                            <Label className="text-xs">Semana destino</Label>
                                            <Select value={moveToMyWeek[task.id]} onValueChange={(val) => setMoveToMyWeek(prev => ({ ...prev, [task.id]: val }))}>
                                              <SelectTrigger className="h-8 text-xs">
                                                <SelectValue placeholder="seleccionar semana" />
                                              </SelectTrigger>
                                              <SelectContent>
                                                {futureWeeks.map(w => {
                                                  const weekKey = getStorageKey(w.weekStart, viewDate);
                                                  const load = getEmployeeLoadForWeek(employeeId, weekKey, undefined, undefined, viewDate);
                                                  const hours = load?.hours || 0;
                                                  const capacity = load?.capacity || 0;
                                                  const available = round2(capacity - hours);
                                                  return (
                                                    <SelectItem key={w.weekStart.toISOString()} value={weekKey}>
                                                      Semana {getWeekNumber(w.weekStart)} ({format(w.weekStart, 'd MMM')}) - {available.toFixed(2)}h libres
                                                    </SelectItem>
                                                  );
                                                })}
                                              </SelectContent>
                                            </Select>
                                            {weekLoad && (
                                              <div className={`text-xs font-medium mt-2 px-3 py-2 rounded-lg border-2 ${availabilityStatus === 'healthy'
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                                : availabilityStatus === 'warning'
                                                  ? 'bg-amber-50 text-amber-700 border-amber-300'
                                                  : 'bg-red-50 text-red-700 border-red-300'
                                                }`}>
                                                Disponibilidad: {weekHours.toFixed(2)}h / {weekCapacity.toFixed(2)}h ({weekAvailable >= 0 ? `${weekAvailable.toFixed(2)}h libres` : `${Math.abs(weekAvailable).toFixed(2)}h excedidas`})
                                              </div>
                                            )}
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
                                      );
                                    })()}

                                    {/* Logic for 'moveToEmployee' */}
                                    {taskActions[task.id] === 'moveToEmployee' && (() => {
                                      const selectedEmployeeId = moveToEmployee[task.id];
                                      const selectedWeek = moveToWeek[task.id];

                                      // Calcular disponibilidad total del compañero (promedio de todas las semanas futuras)
                                      const employeeTotalLoad = selectedEmployeeId ? (() => {
                                        const loads = futureWeeks.map(w => {
                                          const weekKey = getStorageKey(w.weekStart, viewDate);
                                          return getEmployeeLoadForWeek(selectedEmployeeId, weekKey, undefined, undefined, viewDate);
                                        });
                                        const totalHours = loads.reduce((sum, l) => sum + (l?.hours || 0), 0);
                                        const totalCapacity = loads.reduce((sum, l) => sum + (l?.capacity || 0), 0);
                                        return { hours: totalHours, capacity: totalCapacity, available: round2(totalCapacity - totalHours) };
                                      })() : null;

                                      // Calcular disponibilidad de la semana seleccionada para el compañero
                                      const weekLoad = selectedEmployeeId && selectedWeek ? getEmployeeLoadForWeek(selectedEmployeeId, selectedWeek, undefined, undefined, viewDate) : null;
                                      const weekHours = weekLoad?.hours || 0;
                                      const weekCapacity = weekLoad?.capacity || 0;
                                      const weekAvailable = round2(weekCapacity - weekHours);
                                      const totalAvailabilityStatus = employeeTotalLoad
                                        ? (employeeTotalLoad.available >= 20 ? 'healthy' : employeeTotalLoad.available >= 0 ? 'warning' : 'overload')
                                        : 'unknown';
                                      const weekAvailabilityStatus = weekLoad
                                        ? (weekAvailable >= 5 ? 'healthy' : weekAvailable >= 0 ? 'warning' : 'overload')
                                        : 'unknown';

                                      return (
                                        <div className="mt-3 space-y-3 pl-3 border-l-4 bg-gradient-to-r from-violet-50/30 to-fuchsia-50/30 rounded-r-lg p-4 border-violet-300">
                                          <div className="grid grid-cols-2 gap-2">
                                            <div className="space-y-1">
                                              <Label className="text-xs">Compañero</Label>
                                              <Select value={moveToEmployee[task.id]} onValueChange={(val) => setMoveToEmployee(prev => ({ ...prev, [task.id]: val }))}>
                                                <SelectTrigger className="h-8 text-xs">
                                                  <SelectValue placeholder="seleccionar" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  {employees.filter(e => e.isActive && e.id !== employeeId).map(e => {
                                                    // Calcular disponibilidad total para este empleado
                                                    const loads = futureWeeks.map(w => {
                                                      const weekKey = getStorageKey(w.weekStart, viewDate);
                                                      return getEmployeeLoadForWeek(e.id, weekKey, undefined, undefined, viewDate);
                                                    });
                                                    const totalHours = loads.reduce((sum, l) => sum + (l?.hours || 0), 0);
                                                    const totalCapacity = loads.reduce((sum, l) => sum + (l?.capacity || 0), 0);
                                                    const available = round2(totalCapacity - totalHours);
                                                    const status = available >= 20 ? 'healthy' : available >= 0 ? 'warning' : 'overload';
                                                    return (
                                                      <SelectItem
                                                        key={e.id}
                                                        value={e.id}
                                                        className={status === 'healthy' ? 'text-emerald-700' : status === 'warning' ? 'text-amber-700' : 'text-red-700'}
                                                      >
                                                        {e.name} - Total: {totalHours.toFixed(2)}h / {totalCapacity.toFixed(2)}h ({available >= 0 ? `${available.toFixed(2)}h libres` : `${Math.abs(available).toFixed(2)}h excedidas`})
                                                      </SelectItem>
                                                    );
                                                  })}
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
                                                  {futureWeeks.map(w => {
                                                    const weekKey = getStorageKey(w.weekStart, viewDate);
                                                    const load = selectedEmployeeId ? getEmployeeLoadForWeek(selectedEmployeeId, weekKey, undefined, undefined, viewDate) : null;
                                                    const hours = load?.hours || 0;
                                                    const capacity = load?.capacity || 0;
                                                    const available = round2(capacity - hours);
                                                    const status = available >= 5 ? 'healthy' : available >= 0 ? 'warning' : 'overload';
                                                    return (
                                                      <SelectItem
                                                        key={w.weekStart.toISOString()}
                                                        value={weekKey}
                                                        className={status === 'healthy' ? 'text-emerald-700' : status === 'warning' ? 'text-amber-700' : 'text-red-700'}
                                                      >
                                                        Semana {getWeekNumber(w.weekStart)} ({format(w.weekStart, 'd MMM')}) - {hours.toFixed(2)}h / {capacity.toFixed(2)}h ({available >= 0 ? `${available.toFixed(2)}h libres` : `${Math.abs(available).toFixed(2)}h excedidas`})
                                                      </SelectItem>
                                                    );
                                                  })}
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
                                      );
                                    })()}
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
                    const validTasks = distTasks.filter(t => t.taskName.trim() && parseHours(t.hours) > 0);
                    const tasksWithoutName = distTasks.filter(t => !t.taskName.trim() && parseHours(t.hours) > 0);
                    const tasksWithoutHours = distTasks.filter(t => t.taskName.trim() && parseHours(t.hours) <= 0);

                    if (validTasks.length === 0) {
                      canSubmit = false;
                      if (tasksWithoutName.length > 0) {
                        validationErrors.push(`"${task.taskName}": añade el nombre de la tarea en todas las distribuciones`);
                      } else if (tasksWithoutHours.length > 0) {
                        validationErrors.push(`"${task.taskName}": añade horas válidas en todas las distribuciones`);
                      } else {
                        validationErrors.push(`"${task.taskName}" necesita al menos una tarea válida con nombre y horas`);
                      }
                      continue;
                    }

                    const totalDistributed = validTasks.reduce((sum, t) => sum + parseHours(t.hours), 0);
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
                  } else if (action === 'keep') {
                    const hours = keepTaskHours[task.id];
                    const actual = hours ? parseHours(hours.actual) : (task.hoursActual || task.hoursAssigned);

                    if (!actual || actual <= 0) {
                      canSubmit = false;
                      validationErrors.push(`"${task.taskName}": las horas reales deben ser mayores a 0`);
                    }
                  } else if (action === 'rollover') {
                    const hours = rolloverHours[task.id];
                    const newHoursEstimate = rolloverNewHours[task.id];

                    if (!hours || !hours.actual) {
                      canSubmit = false;
                      validationErrors.push(`"${task.taskName}": completa las horas reales imputadas`);
                    } else {
                      const actual = parseHours(hours.actual);
                      if (actual <= 0) {
                        canSubmit = false;
                        validationErrors.push(`"${task.taskName}": las horas reales deben ser mayores a 0`);
                      }
                    }

                    if (!newHoursEstimate) {
                      canSubmit = false;
                      validationErrors.push(`"${task.taskName}": completa la nueva estimación para la semana siguiente`);
                    } else {
                      const newEstimate = parseHours(newHoursEstimate);
                      if (newEstimate <= 0) {
                        canSubmit = false;
                        validationErrors.push(`"${task.taskName}": la nueva estimación debe ser mayor a 0`);
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

