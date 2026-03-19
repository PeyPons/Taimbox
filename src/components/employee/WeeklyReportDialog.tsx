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
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, parseISO, startOfWeek, startOfMonth, isSameMonth, addDays, isBefore } from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckCircle2, ArrowRight, AlertCircle, Plus, X, Users, Clock, Inbox, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { getStorageKey, getWeeksForMonth, isAllocationInEffectiveMonth, getWeekEndDate, collectSelectableFutureWeekSlots } from '@/utils/dateUtils';
import { useWeeklyCloseDay } from '@/hooks/useWeeklyCloseDay';
import { cn } from '@/lib/utils';
import { useProjectAliasing } from '@/hooks/useProjectAliasing';
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
  const weeklyCloseDay = useWeeklyCloseDay();
  const { formatName: formatProjectName } = useProjectAliasing();
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
  const [rolloverNewHours, setRolloverNewHours] = useState<Record<string, string>>({}); // taskId -> horas planificadas en semana destino
  const [rolloverTargetWeek, setRolloverTargetWeek] = useState<Record<string, string>>({}); // taskId -> weekStartDate destino (rollover)

  // Detectar semana actual o última semana pasada del mes
  const { activeFilters, filterProject, getFilterDisplayName } = useProjectFilters();
  const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const currentWeekStr = format(currentWeekStart, 'yyyy-MM-dd');
  const isCurrentWeekInMonth = isSameMonth(currentWeekStart, viewDate);

  // Encontrar semanas pasadas para mostrar en el Weekly
  // Devolver null significa "mostrar todas las semanas pasadas del mes"
  const getTargetWeek = (): string | null => {
    // Si el mes visualizado es un mes pasado completo, mostrar la última semana
    const monthStart = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
    const monthEnd = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);

    if (isBefore(monthEnd, new Date())) {
      // Es un mes pasado completo, mostrar última semana
      const lastWeekStart = startOfWeek(monthEnd, { weekStartsOn: 1 });
      return format(lastWeekStart, 'yyyy-MM-dd');
    }

    // Si estamos en el mes actual, retornar null para mostrar TODAS las semanas pasadas
    // Esto permite ver tareas de semana 1 y 2 cuando estamos en semana 3
    if (isCurrentWeekInMonth) {
      return null;
    }

    return null;
  };

  const targetWeek = getTargetWeek();

  // Separar tareas abiertas y transferidas
  const { openTasks, transferredTasks } = useMemo(() => {
    const today = new Date();
    const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 });

    // Obtener IDs de tareas que ya fueron PROCESADAS por el Weekly
    // Estas tienen feedback específico indicando que ya se gestionaron
    const processedByWeeklyIds = new Set(
      weeklyFeedback
        .filter(fb => fb.allocationId && (
          fb.comments?.includes('Tarea completada:') ||
          fb.comments?.includes('Tarea movida a semana futura') ||
          fb.comments?.includes('Tarea transferida a') ||
          fb.comments?.includes('Distribuidas en') ||
          fb.comments?.includes('Tarea distribuida desde') ||
          fb.comments?.includes('Tarea con rollover:') ||
          fb.comments?.includes('Tarea mantenida tal cual')
        ))
        .map(fb => fb.allocationId!)
    );

    const open: typeof allocations = [];
    const transferred: typeof allocations = [];

    allocations.forEach(a => {
      if (a.employeeId !== employeeId) return;

      // EXCLUIR: Tareas que ya fueron procesadas por el Weekly
      if (processedByWeeklyIds.has(a.id)) return;

      try {
        const taskWeekDate = parseISO(a.weekStartDate);
        if (!isAllocationInEffectiveMonth(a.weekStartDate, viewDate)) return;

        // El viernes de esa semana es el último día laboral
        const taskWeekEnd = getWeekEndDate(taskWeekDate, weeklyCloseDay); // Configurable close day

        // Filtrado de semanas:
        // - Si targetWeek está definido (mes pasado completo), solo mostrar tareas de la última semana
        // - Si targetWeek es null (mes actual), mostrar tareas de semanas cuyo VIERNES ya pasó
        if (targetWeek !== null) {
          // Mes pasado: filtrar por la última semana
          if (getStorageKey(taskWeekDate, viewDate) !== targetWeek) return;
        } else {
          // Mes actual: solo mostrar tareas cuyo viernes YA PASÓ (semanas anteriores)
          if (taskWeekEnd > today) return;
        }

        // Usar campo de BD si está disponible, sino fallback al formato de texto
        const isTransferredTask = a.transferredFromAllocationId !== undefined && a.transferredFromAllocationId !== null
          || a.taskName?.includes('(transferida de');

        if (isTransferredTask && a.status !== 'completed') {
          transferred.push(a);
          return;
        }

        // Solo incluir si NO está completada
        // (Si el usuario marcó la tarea como completed, la consideramos cerrada)
        if (a.status !== 'completed') {
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

  const weekSlotsFor = (taskWeekStartStr: string) =>
    collectSelectableFutureWeekSlots(taskWeekStartStr, startOfMonth(viewDate), weeklyCloseDay, 2);

  // Inicializar distribución para tareas [Distribuir]
  const initializeDistribution = (taskId: string, totalHours: number, taskWeekStartStr: string) => {
    if (!distributionTasks[taskId] || distributionTasks[taskId].length === 0) {
      const slots = weekSlotsFor(taskWeekStartStr);
      const defaultWeek = slots[0]?.storageKey || format(new Date(), 'yyyy-MM-dd');
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

  const addDistributionRow = (taskId: string, taskWeekStartStr: string) => {
    const current = distributionTasks[taskId] || [];
    const lastRow = current[current.length - 1];
    const slots = weekSlotsFor(taskWeekStartStr);
    const fallback = slots[0]?.storageKey || format(new Date(), 'yyyy-MM-dd');
    setDistributionTasks(prev => ({
      ...prev,
      [taskId]: [...current, {
        id: crypto.randomUUID(),
        taskName: '',
        hours: '',
        weekDate: lastRow?.weekDate || fallback
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

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCloseWeek = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      for (const task of allTasks) {
        const action = taskActions[task.id];
        if (!action) continue;

        const taskWeekDate = parseISO(task.weekStartDate);
        const taskWeekStr = format(taskWeekDate, 'yyyy-MM-dd');

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
            const mvSlot = collectSelectableFutureWeekSlots(task.weekStartDate, startOfMonth(viewDate), weeklyCloseDay, 2).find(s => s.storageKey === targetWeek);
            if (mvSlot) await loadDataForMonth(mvSlot.viewMonth);
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
              const twSlot = collectSelectableFutureWeekSlots(task.weekStartDate, startOfMonth(viewDate), weeklyCloseDay, 2).find(s => s.storageKey === targetWeek);
              const targetWeekLoad = getEmployeeLoadForWeek(targetEmployeeId, targetWeek, undefined, undefined, twSlot?.viewMonth ?? viewDate);
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
            const transferSlot = collectSelectableFutureWeekSlots(task.weekStartDate, startOfMonth(viewDate), weeklyCloseDay, 2).find(s => s.storageKey === targetWeek);
            if (transferSlot) await loadDataForMonth(transferSlot.viewMonth);
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
          // Cerrar semana actual (horas reales) y crear la misma tarea en la semana destino elegida
          const hours = rolloverHours[task.id];
          const newHoursEstimate = rolloverNewHours[task.id];
          const destWeekStr = rolloverTargetWeek[task.id];
          const slots = collectSelectableFutureWeekSlots(task.weekStartDate, startOfMonth(viewDate), weeklyCloseDay, 2);
          const destSlot = slots.find(s => s.storageKey === destWeekStr);

          if (!hours || !newHoursEstimate) {
            toast.error(`"${task.taskName}" necesita horas reales y horas a planificar completadas`);
            continue;
          }

          if (!destWeekStr || !destSlot) {
            toast.error(`"${task.taskName}": elige la semana en la que quieres seguir con la tarea`);
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
            toast.error(`"${task.taskName}" necesita horas a planificar mayores a 0`);
            continue;
          }

          await updateAllocation({
            ...task,
            hoursActual: actual,
            hoursComputed: computed,
            status: 'completed'
          });

          try {
            const newAllocation = await addAllocation({
              employeeId: task.employeeId,
              projectId: task.projectId,
              weekStartDate: destWeekStr,
              hoursAssigned: newEstimate,
              hoursActual: 0,
              hoursComputed: 0,
              status: 'planned',
              taskName: task.taskName,
              description: task.description,
              parentAllocationId: task.id
            });

            if (!newAllocation) {
              toast.error(`No se pudo crear la tarea en la semana elegida para "${task.taskName}"`);
              continue;
            }

            await loadDataForMonth(destSlot.viewMonth);
          } catch (error) {
            toast.error(`Error al crear la tarea en la semana elegida: ${error instanceof Error ? error.message : 'Error desconocido'}`);
            continue;
          }

          const destLabel = format(destSlot.weekStart, 'd MMM yyyy', { locale: es });
          const comment = taskComments[task.id] || `Tarea con rollover: ${actual.toFixed(2)}h registradas en semana cerrada, ${newEstimate.toFixed(2)}h planificadas desde ${destLabel}`;
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
            toast.warning(`Proyecto excede horas contratadas (${newProjectMonthTotal.toFixed(1)}h / ${projectBudget.toFixed(1)}h). Se creará de todas formas.`);
          }

          // Avisar si alguna semana excede capacidad (sin bloquear)
          const checkedWeeks = new Set<string>();
          const distSlots = collectSelectableFutureWeekSlots(task.weekStartDate, startOfMonth(viewDate), weeklyCloseDay, 2);
          for (const distTask of validTasks) {
            if (checkedWeeks.has(distTask.weekDate)) continue;
            checkedWeeks.add(distTask.weekDate);

            const dSlot = distSlots.find(s => s.storageKey === distTask.weekDate);
            const weekLoad = getEmployeeLoadForWeek(employeeId, distTask.weekDate, undefined, undefined, dSlot?.viewMonth ?? viewDate);
            const currentWeekHours = weekLoad?.hours || 0;
            const weekCapacity = weekLoad?.capacity || 0;

            const weekTasks = validTasks.filter(t => t.weekDate === distTask.weekDate);
            const weekTotalHours = weekTasks.reduce((sum, t) => sum + parseHours(t.hours), 0);
            const newWeekTotal = currentWeekHours + weekTotalHours;

            if (newWeekTotal > weekCapacity) {
              toast.warning(`Semana ${format(parseISO(distTask.weekDate), 'd MMM')} excede capacidad (${newWeekTotal.toFixed(1)}h / ${weekCapacity.toFixed(1)}h). Se creará de todas formas.`);
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
      setRolloverTargetWeek({});
    } catch (error) {
      console.error('Error actualizando weekly:', error);
      toast.error('Error al actualizar el weekly');
    } finally {
      setIsSubmitting(false);
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
                              initializeDistribution(task.id, task.hoursAssigned, task.weekStartDate);
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
                                          initializeDistribution(task.id, task.hoursAssigned, task.weekStartDate);
                                        } else if (value === 'distribute' && (!distributionTasks[task.id] || distributionTasks[task.id].length === 0)) {
                                          initializeDistribution(task.id, missingHours, task.weekStartDate);
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
                                          const defaultActual = (task.hoursActual || missingHours || 0).toFixed(2);
                                          const defaultComputed = (task.hoursComputed || task.hoursActual || missingHours || 0).toFixed(2);
                                          const defaultNewHours = missingHours > 0 ? missingHours.toFixed(2) : '0.00';
                                          const rSlots = weekSlotsFor(task.weekStartDate);
                                          setRolloverHours(prev => ({
                                            ...prev,
                                            [task.id]: { actual: defaultActual, computed: defaultComputed }
                                          }));
                                          setRolloverNewHours(prev => ({
                                            ...prev,
                                            [task.id]: defaultNewHours
                                          }));
                                          if (rSlots[0]) {
                                            setRolloverTargetWeek(prev => ({ ...prev, [task.id]: rSlots[0].storageKey }));
                                          }
                                        }

                                        if (value === 'move' && !moveToMyWeek[task.id]) {
                                          const mSlots = weekSlotsFor(task.weekStartDate);
                                          if (mSlots[0]) setMoveToMyWeek(prev => ({ ...prev, [task.id]: mSlots[0].storageKey }));
                                        }
                                        if (value === 'moveToEmployee' && !moveToWeek[task.id]) {
                                          const eSlots = weekSlotsFor(task.weekStartDate);
                                          if (eSlots[0]) setMoveToWeek(prev => ({ ...prev, [task.id]: eSlots[0].storageKey }));
                                        }
                                      }}
                                      className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                                    >
                                      <div className="flex items-center space-x-2 p-2 rounded border hover:bg-slate-50">
                                        <RadioGroupItem value="keep" id={`${task.id}-keep`} />
                                        <Label htmlFor={`${task.id}-keep`} className="cursor-pointer text-xs font-medium">Mantener / Completar hoy</Label>
                                      </div>
                                      <div className="flex items-start space-x-2 p-2 rounded border hover:bg-slate-50">
                                        <RadioGroupItem value="rollover" id={`${task.id}-rollover`} className="mt-0.5" />
                                        <div className="min-w-0">
                                          <Label htmlFor={`${task.id}-rollover`} className="cursor-pointer text-xs font-medium leading-snug">
                                            Registrar horas de esta semana y seguir la tarea después
                                          </Label>
                                          <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">
                                            Cierra lo hecho con horas reales y crea la misma tarea en la semana que elijas (incluso otro mes).
                                          </p>
                                        </div>
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
                                      const rSlots = weekSlotsFor(task.weekStartDate);
                                      const byMonth = new Map<string, typeof rSlots>();
                                      for (const s of rSlots) {
                                        const k = format(startOfMonth(s.viewMonth), 'yyyy-MM');
                                        if (!byMonth.has(k)) byMonth.set(k, []);
                                        byMonth.get(k)!.push(s);
                                      }
                                      const monthGroups = [...byMonth.entries()].sort(([a], [b]) => a.localeCompare(b));

                                      return (
                                        <div className="mt-3 space-y-3 pl-3 border-l-4 bg-gradient-to-r from-blue-50/30 to-cyan-50/30 rounded-r-lg p-4 border-blue-300">
                                          <div className="space-y-2">
                                            <p className="text-xs font-medium text-slate-700 mb-2">
                                              Paso 1: cuántas horas hiciste <strong>esta semana</strong>. Paso 2: en qué semana sigues y cuántas horas prevés.
                                            </p>
                                            <div className="grid grid-cols-2 gap-3">
                                              <div className="space-y-1">
                                                <Label className="text-xs font-medium text-slate-700">Horas que hiciste esta semana *</Label>
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
                                                <p className="text-xs text-muted-foreground">Lo que registras como trabajo hecho en la semana que cierras</p>
                                              </div>
                                              <div className="space-y-1">
                                                <Label className="text-xs font-medium text-slate-700">Horas computadas (facturación)</Label>
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
                                                <p className="text-xs text-muted-foreground">Normalmente igual a las horas hechas</p>
                                              </div>
                                            </div>
                                            <div className="space-y-1 pt-2 border-t border-blue-200">
                                              <Label className="text-xs font-medium text-slate-700">¿En qué semana sigues con la tarea? *</Label>
                                              {rSlots.length === 0 ? (
                                                <p className="text-xs text-amber-700">No hay semanas futuras disponibles. Prueba cambiando el mes en el calendario o usa otra opción.</p>
                                              ) : (
                                                <Select
                                                  value={rolloverTargetWeek[task.id] || rSlots[0]?.storageKey}
                                                  onValueChange={(val) => setRolloverTargetWeek(prev => ({ ...prev, [task.id]: val }))}
                                                >
                                                  <SelectTrigger className="h-9 text-xs border-blue-300">
                                                    <SelectValue placeholder="Elige semana" />
                                                  </SelectTrigger>
                                                  <SelectContent className="max-h-[280px]">
                                                    {monthGroups.map(([mk, monthSlots]) => (
                                                      <SelectGroup key={mk}>
                                                        <SelectLabel className="capitalize">
                                                          {format(monthSlots[0].viewMonth, 'MMMM yyyy', { locale: es })}
                                                        </SelectLabel>
                                                        {monthSlots.map((slot) => {
                                                          const weeks = getWeeksForMonth(slot.viewMonth);
                                                          const wi = weeks.findIndex(w => getStorageKey(w.weekStart, slot.viewMonth) === slot.storageKey);
                                                          const wn = wi >= 0 ? wi + 1 : null;
                                                          const load = getEmployeeLoadForWeek(employeeId, slot.storageKey, undefined, undefined, slot.viewMonth);
                                                          const avail = round2((load?.capacity || 0) - (load?.hours || 0));
                                                          return (
                                                            <SelectItem key={slot.storageKey} value={slot.storageKey}>
                                                              {wn ? `Sem. ${wn}` : 'Semana'} · {format(slot.weekStart, 'd MMM', { locale: es })} – {format(addDays(slot.weekStart, 4), 'd MMM', { locale: es })}
                                                              {' · '}{avail >= 0 ? `${avail.toFixed(1)}h libres` : `${Math.abs(avail).toFixed(1)}h sobre capacidad`}
                                                            </SelectItem>
                                                          );
                                                        })}
                                                      </SelectGroup>
                                                    ))}
                                                  </SelectContent>
                                                </Select>
                                              )}
                                              <p className="text-xs text-muted-foreground">Solo semanas futuras (este mes y los dos siguientes).</p>
                                            </div>
                                            <div className="space-y-1 pt-2 border-t border-blue-200">
                                              <Label className="text-xs font-medium text-slate-700">Horas que planeas dedicar en esa semana *</Label>
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
                                                Estimación de la misma tarea en la semana elegida arriba
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
                                              const distSlot = weekSlotsFor(task.weekStartDate).find(s => s.storageKey === dist.weekDate);
                                              const weekLoad = dist.weekDate
                                                ? getEmployeeLoadForWeek(employeeId, dist.weekDate, undefined, undefined, distSlot?.viewMonth ?? viewDate)
                                                : null;
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
                                                      <SelectContent className="max-h-[280px]">
                                                        {(() => {
                                                          const dSlots = weekSlotsFor(task.weekStartDate);
                                                          const dm = new Map<string, typeof dSlots>();
                                                          for (const s of dSlots) {
                                                            const k = format(startOfMonth(s.viewMonth), 'yyyy-MM');
                                                            if (!dm.has(k)) dm.set(k, []);
                                                            dm.get(k)!.push(s);
                                                          }
                                                          return [...dm.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([mk, monthSlots]) => (
                                                            <SelectGroup key={mk}>
                                                              <SelectLabel className="capitalize">
                                                                {format(monthSlots[0].viewMonth, 'MMMM yyyy', { locale: es })}
                                                              </SelectLabel>
                                                              {monthSlots.map((slot) => {
                                                                const load = getEmployeeLoadForWeek(employeeId, slot.storageKey, undefined, undefined, slot.viewMonth);
                                                                const hours = load?.hours || 0;
                                                                const capacity = load?.capacity || 0;
                                                                const available = round2(capacity - hours);
                                                                const status = available >= 5 ? 'healthy' : available >= 0 ? 'warning' : 'overload';
                                                                const weeks = getWeeksForMonth(slot.viewMonth);
                                                                const wi = weeks.findIndex(w => getStorageKey(w.weekStart, slot.viewMonth) === slot.storageKey);
                                                                const wn = wi >= 0 ? wi + 1 : null;
                                                                return (
                                                                  <SelectItem
                                                                    key={slot.storageKey}
                                                                    value={slot.storageKey}
                                                                    className={status === 'healthy' ? 'text-emerald-700' : status === 'warning' ? 'text-amber-700' : 'text-red-700'}
                                                                  >
                                                                    {wn ? `Sem. ${wn}` : 'Sem.'} ({format(slot.weekStart, 'd MMM')}) — {available.toFixed(2)}h libres ({hours.toFixed(2)}h / {capacity.toFixed(2)}h)
                                                                  </SelectItem>
                                                                );
                                                              })}
                                                            </SelectGroup>
                                                          ));
                                                        })()}
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
                                            onClick={() => addDistributionRow(task.id, task.weekStartDate)}
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
                                      const selSlot = weekSlotsFor(task.weekStartDate).find(s => s.storageKey === selectedWeek);
                                      const weekLoad = selectedWeek
                                        ? getEmployeeLoadForWeek(employeeId, selectedWeek, undefined, undefined, selSlot?.viewMonth ?? viewDate)
                                        : null;
                                      const weekHours = weekLoad?.hours || 0;
                                      const weekCapacity = weekLoad?.capacity || 0;
                                      const weekAvailable = round2(weekCapacity - weekHours);
                                      const availabilityStatus = weekLoad
                                        ? (weekAvailable >= 5 ? 'healthy' : weekAvailable >= 0 ? 'warning' : 'overload')
                                        : 'unknown';

                                      return (
                                        <div className="mt-3 space-y-3 pl-3 border-l-4 bg-gradient-to-r from-blue-50/30 to-cyan-50/30 rounded-r-lg p-4 border-blue-300">
                                          <div className="space-y-1">
                                            <Label className="text-xs">Semana destino (futuras, varios meses)</Label>
                                            <Select value={moveToMyWeek[task.id]} onValueChange={(val) => setMoveToMyWeek(prev => ({ ...prev, [task.id]: val }))}>
                                              <SelectTrigger className="h-8 text-xs">
                                                <SelectValue placeholder="seleccionar semana" />
                                              </SelectTrigger>
                                              <SelectContent className="max-h-[280px]">
                                                {(() => {
                                                  const mSlots = weekSlotsFor(task.weekStartDate);
                                                  const mm = new Map<string, typeof mSlots>();
                                                  for (const s of mSlots) {
                                                    const k = format(startOfMonth(s.viewMonth), 'yyyy-MM');
                                                    if (!mm.has(k)) mm.set(k, []);
                                                    mm.get(k)!.push(s);
                                                  }
                                                  return [...mm.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([mk, monthSlots]) => (
                                                    <SelectGroup key={mk}>
                                                      <SelectLabel className="capitalize">
                                                        {format(monthSlots[0].viewMonth, 'MMMM yyyy', { locale: es })}
                                                      </SelectLabel>
                                                      {monthSlots.map((slot) => {
                                                        const load = getEmployeeLoadForWeek(employeeId, slot.storageKey, undefined, undefined, slot.viewMonth);
                                                        const h = load?.hours || 0;
                                                        const cap = load?.capacity || 0;
                                                        const available = round2(cap - h);
                                                        const weeks = getWeeksForMonth(slot.viewMonth);
                                                        const wi = weeks.findIndex(w => getStorageKey(w.weekStart, slot.viewMonth) === slot.storageKey);
                                                        const wn = wi >= 0 ? wi + 1 : null;
                                                        return (
                                                          <SelectItem key={slot.storageKey} value={slot.storageKey}>
                                                            {wn ? `Sem. ${wn}` : 'Sem.'} ({format(slot.weekStart, 'd MMM')}) — {available.toFixed(2)}h libres
                                                          </SelectItem>
                                                        );
                                                      })}
                                                    </SelectGroup>
                                                  ));
                                                })()}
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
                                      const tSlots = weekSlotsFor(task.weekStartDate);

                                      const employeeTotalLoad = selectedEmployeeId ? (() => {
                                        const loads = tSlots.map(slot =>
                                          getEmployeeLoadForWeek(selectedEmployeeId, slot.storageKey, undefined, undefined, slot.viewMonth)
                                        );
                                        const totalHours = loads.reduce((sum, l) => sum + (l?.hours || 0), 0);
                                        const totalCapacity = loads.reduce((sum, l) => sum + (l?.capacity || 0), 0);
                                        return { hours: totalHours, capacity: totalCapacity, available: round2(totalCapacity - totalHours) };
                                      })() : null;

                                      // Calcular disponibilidad de la semana seleccionada para el compañero
                                      const weekSelSlot = tSlots.find(s => s.storageKey === selectedWeek);
                                      const weekLoad = selectedEmployeeId && selectedWeek
                                        ? getEmployeeLoadForWeek(selectedEmployeeId, selectedWeek, undefined, undefined, weekSelSlot?.viewMonth ?? viewDate)
                                        : null;
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
                                                    const loads = tSlots.map(slot =>
                                                      getEmployeeLoadForWeek(e.id, slot.storageKey, undefined, undefined, slot.viewMonth)
                                                    );
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
                                              <Label className="text-xs">Semana (futuras)</Label>
                                              <Select value={moveToWeek[task.id]} onValueChange={(val) => setMoveToWeek(prev => ({ ...prev, [task.id]: val }))}>
                                                <SelectTrigger className="h-8 text-xs">
                                                  <SelectValue placeholder="Semana" />
                                                </SelectTrigger>
                                                <SelectContent className="max-h-[280px]">
                                                  {(() => {
                                                    const em = new Map<string, typeof tSlots>();
                                                    for (const s of tSlots) {
                                                      const k = format(startOfMonth(s.viewMonth), 'yyyy-MM');
                                                      if (!em.has(k)) em.set(k, []);
                                                      em.get(k)!.push(s);
                                                    }
                                                    return [...em.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([mk, monthSlots]) => (
                                                      <SelectGroup key={mk}>
                                                        <SelectLabel className="capitalize">
                                                          {format(monthSlots[0].viewMonth, 'MMMM yyyy', { locale: es })}
                                                        </SelectLabel>
                                                        {monthSlots.map((slot) => {
                                                          const load = selectedEmployeeId
                                                            ? getEmployeeLoadForWeek(selectedEmployeeId, slot.storageKey, undefined, undefined, slot.viewMonth)
                                                            : null;
                                                          const h = load?.hours || 0;
                                                          const cap = load?.capacity || 0;
                                                          const available = round2(cap - h);
                                                          const status = available >= 5 ? 'healthy' : available >= 0 ? 'warning' : 'overload';
                                                          const weeks = getWeeksForMonth(slot.viewMonth);
                                                          const wi = weeks.findIndex(w => getStorageKey(w.weekStart, slot.viewMonth) === slot.storageKey);
                                                          const wn = wi >= 0 ? wi + 1 : null;
                                                          return (
                                                            <SelectItem
                                                              key={slot.storageKey}
                                                              value={slot.storageKey}
                                                              className={status === 'healthy' ? 'text-emerald-700' : status === 'warning' ? 'text-amber-700' : 'text-red-700'}
                                                            >
                                                              {wn ? `Sem. ${wn}` : 'Sem.'} ({format(slot.weekStart, 'd MMM')}) — {h.toFixed(2)}h / {cap.toFixed(2)}h
                                                            </SelectItem>
                                                          );
                                                        })}
                                                      </SelectGroup>
                                                    ));
                                                  })()}
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
                const capacityWarnings: string[] = [];

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
                    const valDistSlots = collectSelectableFutureWeekSlots(task.weekStartDate, startOfMonth(viewDate), weeklyCloseDay, 2);
                    for (const distTask of validTasks) {
                      const dvs = valDistSlots.find(s => s.storageKey === distTask.weekDate);
                      const weekLoad = getEmployeeLoadForWeek(employeeId, distTask.weekDate, undefined, undefined, dvs?.viewMonth ?? viewDate);
                      const currentWeekHours = weekLoad?.hours || 0;
                      const weekCapacity = weekLoad?.capacity || 0;

                      const weekTasks = validTasks.filter(t => t.weekDate === distTask.weekDate);
                      const weekTotalHours = weekTasks.reduce((sum, t) => sum + parseFloat(t.hours), 0);
                      const newWeekTotal = currentWeekHours + weekTotalHours;

                      if (newWeekTotal > weekCapacity) {
                        capacityWarnings.push(`"${task.taskName}": semana ${format(parseISO(distTask.weekDate), 'd MMM')} excede capacidad (${newWeekTotal.toFixed(1)}h / ${weekCapacity.toFixed(1)}h)`);
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
                    const rSlotList = collectSelectableFutureWeekSlots(task.weekStartDate, startOfMonth(viewDate), weeklyCloseDay, 2);

                    if (rSlotList.length === 0) {
                      canSubmit = false;
                      validationErrors.push(`"${task.taskName}": no hay semanas futuras para continuar la tarea`);
                    }
                    if (!rolloverTargetWeek[task.id] || !rSlotList.some(s => s.storageKey === rolloverTargetWeek[task.id])) {
                      canSubmit = false;
                      validationErrors.push(`"${task.taskName}": elige la semana en la que sigues con la tarea`);
                    }

                    if (!hours || !hours.actual) {
                      canSubmit = false;
                      validationErrors.push(`"${task.taskName}": indica las horas que hiciste esta semana`);
                    } else {
                      const actual = parseHours(hours.actual);
                      if (actual <= 0) {
                        canSubmit = false;
                        validationErrors.push(`"${task.taskName}": las horas hechas deben ser mayores a 0`);
                      }
                    }

                    if (!newHoursEstimate) {
                      canSubmit = false;
                      validationErrors.push(`"${task.taskName}": indica las horas que planeas en la semana elegida`);
                    } else {
                      const newEstimate = parseHours(newHoursEstimate);
                      if (newEstimate <= 0) {
                        canSubmit = false;
                        validationErrors.push(`"${task.taskName}": las horas planificadas deben ser mayores a 0`);
                      }
                    }
                  } else if (action === 'move') {
                    const targetWeek = moveToMyWeek[task.id];
                    const comment = taskComments[task.id];

                    const moveSlots = collectSelectableFutureWeekSlots(task.weekStartDate, startOfMonth(viewDate), weeklyCloseDay, 2);
                    if (!targetWeek) {
                      canSubmit = false;
                      validationErrors.push(`"${task.taskName}": selecciona semana destino`);
                    } else if (moveSlots.length === 0) {
                      canSubmit = false;
                      validationErrors.push(`"${task.taskName}": no hay semanas futuras disponibles`);
                    } else if (!comment || !comment.trim()) {
                      canSubmit = false;
                      validationErrors.push(`"${task.taskName}": añade una nota explicando por qué mueves esta tarea`);
                    } else {
                      // Validar capacidad propia
                      const remainingHours = task.hoursAssigned - (task.hoursActual || 0);
                      if (remainingHours > 0) {
                        const mvSlot = moveSlots.find(s => s.storageKey === targetWeek);
                        const weekLoad = getEmployeeLoadForWeek(employeeId, targetWeek, undefined, undefined, mvSlot?.viewMonth ?? viewDate);
                        const currentWeekHours = weekLoad?.hours || 0;
                        const weekCapacity = weekLoad?.capacity || 0;
                        const newWeekTotal = currentWeekHours + remainingHours;

                        if (newWeekTotal > weekCapacity) {
                          capacityWarnings.push(`"${task.taskName}": excede tu capacidad en esa semana (${newWeekTotal.toFixed(1)}h / ${weekCapacity.toFixed(1)}h)`);
                        }
                      }
                    }
                  } else if (action === 'moveToEmployee') {
                    const targetEmployeeId = moveToEmployee[task.id];
                    const targetWeek = moveToWeek[task.id];
                    const comment = taskComments[task.id];
                    const teSlots = collectSelectableFutureWeekSlots(task.weekStartDate, startOfMonth(viewDate), weeklyCloseDay, 2);

                    if (teSlots.length === 0) {
                      canSubmit = false;
                      validationErrors.push(`"${task.taskName}": no hay semanas futuras para transferir`);
                    } else if (!targetEmployeeId || !targetWeek) {
                      canSubmit = false;
                      validationErrors.push(`"${task.taskName}": selecciona compañero y semana destino`);
                    } else if (!comment || !comment.trim()) {
                      canSubmit = false;
                      validationErrors.push(`"${task.taskName}": añade una nota explicando por qué transfieres esta tarea`);
                    } else {
                      const remainingHours = task.hoursAssigned - (task.hoursActual || 0);
                      if (remainingHours > 0) {
                        const teSlot = collectSelectableFutureWeekSlots(task.weekStartDate, startOfMonth(viewDate), weeklyCloseDay, 2).find(s => s.storageKey === targetWeek);
                        const targetWeekLoad = getEmployeeLoadForWeek(targetEmployeeId, targetWeek, undefined, undefined, teSlot?.viewMonth ?? viewDate);
                        const targetCurrentHours = targetWeekLoad?.hours || 0;
                        const targetCapacity = targetWeekLoad?.capacity || 0;
                        const newTargetTotal = targetCurrentHours + remainingHours;

                        const targetEmployee = employees.find(e => e.id === targetEmployeeId);
                        if (targetEmployee && newTargetTotal > targetCapacity) {
                          capacityWarnings.push(`"${task.taskName}": ${targetEmployee.name} excedería su capacidad (${newTargetTotal.toFixed(1)}h / ${targetCapacity.toFixed(1)}h)`);
                        }
                      }
                    }
                  }
                }

                return (
                  <Button
                    onClick={handleCloseWeek}
                    className="bg-primary hover:bg-primary/90"
                    disabled={!canSubmit || isSubmitting}
                    title={!canSubmit ? validationErrors.join('; ') : capacityWarnings.length > 0 ? `⚠️ ${capacityWarnings.join('; ')}` : ''}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        Confirmando...
                      </>
                    ) : (
                      'Confirmar Weekly'
                    )}
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

