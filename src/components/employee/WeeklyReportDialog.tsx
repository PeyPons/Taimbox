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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, parseISO, startOfWeek, isSameMonth, addDays, isBefore } from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckCircle2, ArrowRight, AlertCircle, Plus, X, Users, Clock, Inbox } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { getStorageKey, getWeeksForMonth } from '@/utils/dateUtils';
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
  
  const [taskActions, setTaskActions] = useState<Record<string, 'move' | 'moveToEmployee' | 'justify' | 'distribute' | 'keep' | null>>({});
  const [taskComments, setTaskComments] = useState<Record<string, string>>({});
  const [distributionTasks, setDistributionTasks] = useState<Record<string, Array<{ id: string; taskName: string; hours: string; weekDate: string }>>>({});
  const [moveToEmployee, setMoveToEmployee] = useState<Record<string, string>>({}); // taskId -> employeeId
  const [moveToWeek, setMoveToWeek] = useState<Record<string, string>>({}); // taskId -> weekStartDate
  const [moveToMyWeek, setMoveToMyWeek] = useState<Record<string, string>>({}); // taskId -> weekStartDate (para "Mover a mi semana")
  
  // Detectar semana actual o última semana pasada del mes
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
        if (!isSameMonth(taskWeekDate, viewDate)) return;
        
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
              const targetWeekLoad = getEmployeeLoadForWeek(targetEmployeeId, targetWeek);
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
            isSameMonth(parseISO(a.weekStartDate), viewDate) &&
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
            const weekLoad = getEmployeeLoadForWeek(employeeId, distTask.weekDate);
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
            <CheckCircle2 className="h-5 w-5 text-indigo-600" />
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
          <div className="space-y-6 py-4 overflow-y-auto flex-1 min-h-0">
            {/* Tareas Abiertas */}
            {openTasks.length > 0 && (() => {
              // Separar por tipo de proyecto
              const seoTasks = openTasks.filter(t => {
                const proj = projects.find(p => p.id === t.projectId);
                return proj && proj.projectType !== 'PPC';
              });
              const ppcTasks = openTasks.filter(t => {
                const proj = projects.find(p => p.id === t.projectId);
                return proj && proj.projectType === 'PPC';
              });
              
              return (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <Clock className="h-4 w-4 text-amber-600" />
                    <h3 className="font-semibold text-sm text-slate-900">Tareas que quedaron abiertas</h3>
                    <Badge variant="outline" className="ml-auto text-xs">{openTasks.length}</Badge>
                  </div>
                  
                  {/* SEO Tasks */}
                  {seoTasks.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">SEO</Badge>
                        <span className="text-xs text-muted-foreground">{seoTasks.length} tarea(s)</span>
                      </div>
                      {seoTasks.map(task => {
              const project = projects.find(p => p.id === task.projectId);
              const client = clients.find(c => c.id === project?.clientId);
              const missingHours = task.hoursAssigned - (task.hoursActual || 0);
              const isDistributionTask = task.taskName?.includes('[Distribuir]');
              const isTransferredTask = task.taskName?.includes('(transferida de');
              
              // Inicializar distribución si es una tarea [Distribuir] o transferida y se selecciona la opción
              if ((isDistributionTask || isTransferredTask) && taskActions[task.id] === 'distribute' && (!distributionTasks[task.id] || distributionTasks[task.id].length === 0)) {
                initializeDistribution(task.id, task.hoursAssigned);
              }
              
              // Extraer nombre del empleado que transfirió (si es transferida)
              const transferFromMatch = task.taskName?.match(/\(transferida de (.+)\)/);
              const transferFromName = transferFromMatch ? transferFromMatch[1] : null;
              const transferFromEmployee = transferFromName ? employees.find(e => e.name === transferFromName) : null;
              
              return (
                <Card key={task.id} className="p-4 border-l-4" style={{ borderLeftColor: client?.color || '#6b7280' }}>
                  <div className="space-y-4">
                    {/* Header con proyecto y horas */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: client?.color || '#6b7280' }} />
                          <span className="font-semibold text-sm text-slate-900 truncate">{project?.name || 'Sin proyecto'}</span>
                        </div>
                        <p className="text-sm text-slate-700 mt-1">{task.taskName?.replace(/\(transferida de .+\)/, '').trim() || 'Sin nombre'}</p>
                        
                        {/* Si es transferida, mostrar avatar y nombre del que transfirió */}
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
                      
                      {/* Burbuja de horas */}
                      <div className="flex items-center gap-1.5 bg-indigo-100 rounded-full px-3 py-1.5 shrink-0">
                        <span className="text-xs font-medium text-slate-600">Asignadas</span>
                        <span className="text-sm font-mono font-bold text-indigo-600">{task.hoursAssigned}h</span>
                      </div>
                    </div>
                    
                    {/* Horas realizadas si no es distribución */}
                    {!isDistributionTask && (
                      <div className="flex items-center gap-3 text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-500">Realizadas:</span>
                          <span className="font-semibold text-slate-700">{task.hoursActual || 0}h</span>
                        </div>
                        {missingHours > 0 && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-amber-600">Faltan:</span>
                            <span className="font-semibold text-amber-600">{missingHours}h</span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <RadioGroup
                      value={taskActions[task.id] || ''}
                      onValueChange={(value) => {
                        setTaskActions(prev => ({ ...prev, [task.id]: value as 'move' | 'moveToEmployee' | 'justify' | 'distribute' | 'keep' }));
                        if (value === 'distribute' && (isDistributionTask || isTransferredTask)) {
                          initializeDistribution(task.id, task.hoursAssigned);
                        }
                        // Inicializar semana por defecto para mover a mi semana futura
                        if (value === 'move' && !moveToMyWeek[task.id] && futureWeeks.length > 0) {
                          const defaultWeek = getStorageKey(futureWeeks[0].weekStart, viewDate);
                          setMoveToMyWeek(prev => ({ ...prev, [task.id]: defaultWeek }));
                        }
                        // Inicializar semana por defecto para mover a otro compañero
                        if (value === 'moveToEmployee' && !moveToWeek[task.id] && futureWeeks.length > 0) {
                          const defaultWeek = getStorageKey(futureWeeks[0].weekStart, viewDate);
                          setMoveToWeek(prev => ({ ...prev, [task.id]: defaultWeek }));
                        }
                      }}
                    >
                      <div className="space-y-2">
                        {(isDistributionTask || isTransferredTask) ? (
                          // Para tareas [Distribuir] o transferidas, mostrar opciones de mantener o distribuir
                          <>
                            <div className="flex items-start space-x-2">
                              <RadioGroupItem value="keep" id={`${task.id}-keep`} />
                              <Label htmlFor={`${task.id}-keep`} className="flex-1 cursor-pointer">
                                <div className="flex items-center gap-2">
                                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                  <span className="font-medium">Mantener la misma tarea</span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Mantén la tarea tal cual está. No necesitas distribuirla ni hacer cambios.
                                </p>
                              </Label>
                            </div>
                            <div className="flex items-start space-x-2">
                              <RadioGroupItem value="distribute" id={`${task.id}-distribute`} />
                              <Label htmlFor={`${task.id}-distribute`} className="flex-1 cursor-pointer">
                                <div className="flex items-center gap-2">
                                  <ArrowRight className="h-4 w-4 text-indigo-600" />
                                  <span className="font-medium">Distribuir en múltiples tareas</span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {isTransferredTask 
                                    ? `Distribuye las ${task.hoursAssigned}h transferidas entre las semanas que mejor te vengan.`
                                    : `Crea varias tareas distribuyendo las ${task.hoursAssigned}h entre las semanas restantes del mes.`}
                                </p>
                              </Label>
                            </div>
                          </>
                        ) : (
                          // Para tareas normales, mostrar opciones sin "Terminado eficiente"
                          <>
                            <div className="flex items-start space-x-2">
                              <RadioGroupItem value="move" id={`${task.id}-move`} />
                              <Label htmlFor={`${task.id}-move`} className="flex-1 cursor-pointer">
                                <div className="flex items-center gap-2">
                                  <ArrowRight className="h-4 w-4 text-indigo-600" />
                                  <span className="font-medium">Mover {missingHours}h a una semana futura</span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  La tarea actual se recortará a lo hecho y se creará una nueva asignación en la semana que elijas. <strong className="text-amber-600">Nota obligatoria.</strong>
                                </p>
                              </Label>
                            </div>
                            
                            <div className="flex items-start space-x-2">
                              <RadioGroupItem value="moveToEmployee" id={`${task.id}-moveToEmployee`} />
                              <Label htmlFor={`${task.id}-moveToEmployee`} className="flex-1 cursor-pointer">
                                <div className="flex items-center gap-2">
                                  <Users className="h-4 w-4 text-purple-600" />
                                  <span className="font-medium">Mover {missingHours}h a otro compañero</span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Transfiere las horas restantes a otro compañero. La tarea actual se completará con lo que has hecho. <strong className="text-amber-600">Nota obligatoria.</strong>
                                </p>
                              </Label>
                            </div>
                            
                            <div className="flex items-start space-x-2">
                              <RadioGroupItem value="justify" id={`${task.id}-justify`} />
                              <Label htmlFor={`${task.id}-justify`} className="flex-1 cursor-pointer">
                                <div className="flex items-center gap-2">
                                  <AlertCircle className="h-4 w-4 text-amber-600" />
                                  <span className="font-medium">Solo justificar (Opcional)</span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Añade un comentario explicando la desviación. No afecta el estado de la tarea.
                                </p>
                              </Label>
                            </div>
                          </>
                        )}
                      </div>
                    </RadioGroup>
                    
                    {/* Selector de semana cuando se selecciona "Mover a semana futura" */}
                    {taskActions[task.id] === 'move' && !isDistributionTask && (
                      <div className="mt-3 pl-6 space-y-3 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                        <Label className="text-xs font-medium mb-2 block text-indigo-900">
                          Mover a semana futura
                        </Label>
                        <div>
                          {futureWeeks.length > 0 ? (
                            <>
                              <Select
                                value={moveToMyWeek[task.id] || ''}
                                onValueChange={(value) => setMoveToMyWeek(prev => ({ ...prev, [task.id]: value }))}
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue placeholder="Seleccionar semana" />
                                </SelectTrigger>
                                <SelectContent>
                                  {futureWeeks.map((week) => {
                                    const storageKey = getStorageKey(week.weekStart, viewDate);
                                    const weekNumber = getWeekNumber(week.weekStart);
                                    
                                    // Calcular disponibilidad propia para esta semana
                                    const weekLoad = getEmployeeLoadForWeek(employeeId, storageKey);
                                    const currentHours = weekLoad?.hours || 0;
                                    const capacity = weekLoad?.capacity || 0;
                                    const available = capacity - currentHours;
                                    const remainingHours = task.hoursAssigned - (task.hoursActual || 0);
                                    const wouldExceed = available < remainingHours;
                                    
                                    return (
                                      <SelectItem key={storageKey} value={storageKey}>
                                        <div className="flex items-center justify-between w-full">
                                          <span>Sem {weekNumber} ({format(week.weekStart, 'd MMM', { locale: es })})</span>
                                          <span className={cn(
                                            "text-[10px] ml-2",
                                            wouldExceed ? "text-red-600 font-semibold" : 
                                            available < 5 ? "text-amber-600" : "text-slate-500"
                                          )}>
                                            {wouldExceed 
                                              ? `⚠️ ${available.toFixed(1)}h libres`
                                              : `${available.toFixed(1)}h libres`
                                            }
                                          </span>
                                        </div>
                                      </SelectItem>
                                    );
                                  })}
                                </SelectContent>
                              </Select>
                              {/* Mostrar información de disponibilidad propia */}
                              {moveToMyWeek[task.id] && (() => {
                                const selectedWeek = moveToMyWeek[task.id];
                                const weekLoad = getEmployeeLoadForWeek(employeeId, selectedWeek);
                                const currentHours = weekLoad?.hours || 0;
                                const capacity = weekLoad?.capacity || 0;
                                const available = capacity - currentHours;
                                const remainingHours = task.hoursAssigned - (task.hoursActual || 0);
                                const wouldExceed = available < remainingHours;
                                
                                return (
                                  <div className={cn(
                                    "mt-1.5 p-2 rounded text-xs",
                                    wouldExceed ? "bg-red-50 border border-red-200 text-red-700" :
                                    available < 5 ? "bg-amber-50 border border-amber-200 text-amber-700" :
                                    "bg-slate-50 border border-slate-200 text-slate-600"
                                  )}>
                                    <div className="flex items-center justify-between">
                                      <span className="font-medium">Tu disponibilidad:</span>
                                      <span className="font-mono">
                                        {currentHours.toFixed(1)}h / {capacity.toFixed(1)}h
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between mt-0.5">
                                      <span>Disponible:</span>
                                      <span className={cn("font-mono font-semibold", wouldExceed && "text-red-600")}>
                                        {available.toFixed(1)}h {wouldExceed && `(faltan ${(remainingHours - available).toFixed(1)}h)`}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })()}
                            </>
                          ) : (
                            <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
                              ⚠️ No hay semanas futuras en este mes. Usa "Mover a otro compañero" para transferir las horas.
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Selector de compañero y semana cuando se selecciona "Mover a otro compañero" */}
                    {taskActions[task.id] === 'moveToEmployee' && !isDistributionTask && (
                      <div className="mt-3 pl-6 space-y-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                        <Label className="text-xs font-medium mb-2 block text-purple-900">
                          Transferir a otro compañero
                        </Label>
                        <div className="space-y-2">
                          <div>
                            <Label htmlFor={`${task.id}-employee-select`} className="text-xs mb-1 block">
                              Compañero
                            </Label>
                            <Select
                              value={moveToEmployee[task.id] || ''}
                              onValueChange={(value) => setMoveToEmployee(prev => ({ ...prev, [task.id]: value }))}
                            >
                              <SelectTrigger id={`${task.id}-employee-select`} className="h-8 text-xs">
                                <SelectValue placeholder="Seleccionar compañero" />
                              </SelectTrigger>
                              <SelectContent>
                                {employees
                                  .filter(e => e.id !== employeeId && e.isActive)
                                  .map(emp => {
                                    // Calcular disponibilidad para la semana seleccionada si hay una
                                    const selectedWeek = moveToWeek[task.id];
                                    let availabilityInfo = null;
                                    if (selectedWeek) {
                                      const weekLoad = getEmployeeLoadForWeek(emp.id, selectedWeek);
                                      const currentHours = weekLoad?.hours || 0;
                                      const capacity = weekLoad?.capacity || 0;
                                      const available = capacity - currentHours;
                                      const remainingHours = task.hoursAssigned - (task.hoursActual || 0);
                                      const wouldExceed = available < remainingHours;
                                      
                                      availabilityInfo = {
                                        current: currentHours,
                                        capacity,
                                        available,
                                        wouldExceed
                                      };
                                    }
                                    
                                    return (
                                      <SelectItem key={emp.id} value={emp.id}>
                                        <div className="flex items-center justify-between w-full">
                                          <span>{emp.name}</span>
                                          {availabilityInfo && (
                                            <span className={cn(
                                              "text-[10px] ml-2",
                                              availabilityInfo.wouldExceed ? "text-red-600 font-semibold" : 
                                              availabilityInfo.available < 5 ? "text-amber-600" : "text-slate-500"
                                            )}>
                                              {availabilityInfo.wouldExceed 
                                                ? `⚠️ ${availabilityInfo.available.toFixed(1)}h libres`
                                                : `${availabilityInfo.available.toFixed(1)}h libres`
                                              }
                                            </span>
                                          )}
                                        </div>
                                      </SelectItem>
                                    );
                                  })}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor={`${task.id}-week-select`} className="text-xs mb-1 block">
                              Semana destino
                            </Label>
                            <Select
                              value={moveToWeek[task.id] || ''}
                              onValueChange={(value) => setMoveToWeek(prev => ({ ...prev, [task.id]: value }))}
                            >
                              <SelectTrigger id={`${task.id}-week-select`} className="h-8 text-xs">
                                <SelectValue placeholder="Seleccionar semana" />
                              </SelectTrigger>
                              <SelectContent>
                                {futureWeeks.map((week) => {
                                  const storageKey = getStorageKey(week.weekStart, viewDate);
                                  const weekNumber = getWeekNumber(week.weekStart);
                                  return (
                                    <SelectItem key={storageKey} value={storageKey}>
                                      Sem {weekNumber} ({format(week.weekStart, 'd MMM', { locale: es })})
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                            {/* Mostrar información de disponibilidad del compañero seleccionado */}
                            {moveToEmployee[task.id] && moveToWeek[task.id] && (() => {
                              const selectedEmployeeId = moveToEmployee[task.id];
                              const selectedWeek = moveToWeek[task.id];
                              const weekLoad = getEmployeeLoadForWeek(selectedEmployeeId, selectedWeek);
                              const currentHours = weekLoad?.hours || 0;
                              const capacity = weekLoad?.capacity || 0;
                              const available = capacity - currentHours;
                              const remainingHours = task.hoursAssigned - (task.hoursActual || 0);
                              const wouldExceed = available < remainingHours;
                              const targetEmployee = employees.find(e => e.id === selectedEmployeeId);
                              
                              return (
                                <div className={cn(
                                  "mt-1.5 p-2 rounded text-xs",
                                  wouldExceed ? "bg-red-50 border border-red-200 text-red-700" :
                                  available < 5 ? "bg-amber-50 border border-amber-200 text-amber-700" :
                                  "bg-slate-50 border border-slate-200 text-slate-600"
                                )}>
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium">{targetEmployee?.name || 'Compañero'}:</span>
                                    <span className="font-mono">
                                      {currentHours.toFixed(1)}h / {capacity.toFixed(1)}h
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between mt-0.5">
                                    <span>Disponible:</span>
                                    <span className={cn("font-mono font-semibold", wouldExceed && "text-red-600")}>
                                      {available.toFixed(1)}h {wouldExceed && `(faltan ${(remainingHours - available).toFixed(1)}h)`}
                                    </span>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Comentario obligatorio para move y moveToEmployee, opcional para justify y keep */}
                    {((taskActions[task.id] === 'move' || taskActions[task.id] === 'moveToEmployee') || 
                      (taskActions[task.id] === 'justify' || taskActions[task.id] === 'keep')) && (
                      <div className="mt-3 pl-6">
                        <Label htmlFor={`${task.id}-comment`} className="text-xs font-medium mb-2 block">
                          {(taskActions[task.id] === 'move' || taskActions[task.id] === 'moveToEmployee') ? (
                            <span className="flex items-center gap-2">
                              <span className="text-red-600 font-bold">*</span>
                              <span>Nota obligatoria</span>
                              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-[10px]">
                                Requerida
                              </Badge>
                            </span>
                          ) : (
                            'Comentario (opcional)'
                          )}
                        </Label>
                        {(taskActions[task.id] === 'move' || taskActions[task.id] === 'moveToEmployee') && (
                          <p className="text-xs text-amber-600 mb-2 bg-amber-50 p-2 rounded border border-amber-200">
                            ⚠️ Debes explicar por qué mueves/transfieres estas horas. Esta información es importante para la trazabilidad.
                          </p>
                        )}
                        <Textarea
                          id={`${task.id}-comment`}
                          placeholder={taskActions[task.id] === 'keep' ? "Añade un comentario si lo deseas..." : taskActions[task.id] === 'move' || taskActions[task.id] === 'moveToEmployee' ? "Ej: 'No tuve tiempo suficiente por bloqueo del cliente' o 'Necesito ayuda de un compañero con más experiencia'" : "Explica la razón de la desviación..."}
                          value={taskComments[task.id] || ''}
                          onChange={(e) => setTaskComments(prev => ({ ...prev, [task.id]: e.target.value }))}
                          className={cn(
                            "min-h-[80px] text-sm",
                            (taskActions[task.id] === 'move' || taskActions[task.id] === 'moveToEmployee') && 
                            (!taskComments[task.id] || !taskComments[task.id].trim()) && 
                            "border-red-300 focus:border-red-500"
                          )}
                        />
                        {(taskActions[task.id] === 'move' || taskActions[task.id] === 'moveToEmployee') && 
                         (!taskComments[task.id] || !taskComments[task.id].trim()) && (
                          <p className="text-xs text-red-600 mt-1">Este campo es obligatorio</p>
                        )}
                      </div>
                    )}
                    
                    {taskActions[task.id] === 'distribute' && (isDistributionTask || isTransferredTask) && (
                      <div className="mt-3 pl-6 space-y-3">
                        <Label className="text-xs font-medium mb-2 block">
                          {isTransferredTask 
                            ? `Distribuir ${task.hoursAssigned}h transferidas en tareas (máximo ${task.hoursAssigned}h)`
                            : `Distribuir ${task.hoursAssigned}h en tareas`}
                        </Label>
                        {isTransferredTask && (
                          <p className="text-xs text-purple-600 bg-purple-50 p-2 rounded border border-purple-200">
                            💡 Puedes distribuir estas horas entre múltiples tareas y semanas. El sistema te avisará si excedes tu capacidad o las horas contratadas del proyecto.
                          </p>
                        )}
                        <div className="space-y-2">
                          {(distributionTasks[task.id] || []).map((distRow, idx) => {
                            const rowHours = parseFloat(distRow.hours) || 0;
                            const weekLoad = distRow.weekDate ? getEmployeeLoadForWeek(employeeId, distRow.weekDate) : null;
                            const currentWeekHours = weekLoad?.hours || 0;
                            const weekCapacity = weekLoad?.capacity || 0;
                            
                            // Calcular horas del proyecto en el mes (sumando todas las tareas distribuidas de esta fila y otras)
                            const projectMonthAllocations = allocations.filter(a => 
                              a.projectId === task.projectId && 
                              isSameMonth(parseISO(a.weekStartDate), viewDate) &&
                              a.id !== task.id
                            );
                            const projectMonthHours = projectMonthAllocations.reduce((sum, a) => sum + a.hoursAssigned, 0);
                            
                            // Sumar todas las horas distribuidas (esta fila + otras filas)
                            const allDistributedHours = (distributionTasks[task.id] || []).reduce((sum, r) => sum + (parseFloat(r.hours) || 0), 0);
                            const projectBudget = projects.find(p => p.id === task.projectId)?.budgetHours || 0;
                            const newProjectMonthTotal = projectMonthHours + allDistributedHours;
                            const exceedsProjectBudget = projectBudget > 0 && newProjectMonthTotal > projectBudget;
                            
                            // Calcular si esta semana específica excede capacidad (sumando todas las tareas de esta semana)
                            const weekDistributedHours = (distributionTasks[task.id] || []).filter(r => r.weekDate === distRow.weekDate).reduce((sum, r) => sum + (parseFloat(r.hours) || 0), 0);
                            const newWeekTotal = currentWeekHours + weekDistributedHours;
                            const exceedsCapacity = newWeekTotal > weekCapacity;
                            
                            return (
                              <div key={distRow.id} className={cn(
                                "flex gap-2 items-start p-2 border rounded-lg",
                                exceedsCapacity || exceedsProjectBudget ? "bg-red-50 border-red-200" : "bg-slate-50"
                              )}>
                                <div className="flex-1">
                                  <Input
                                    placeholder="Nombre de la tarea"
                                    value={distRow.taskName}
                                    onChange={(e) => updateDistributionRow(task.id, distRow.id, 'taskName', e.target.value)}
                                    className={cn("h-8 text-xs mb-2", exceedsCapacity || exceedsProjectBudget && "border-red-300")}
                                  />
                                  <div className="flex gap-2">
                                    <div className="flex-1">
                                      <Input
                                        type="number"
                                        min="0.5"
                                        step="0.5"
                                        placeholder="Horas"
                                        value={distRow.hours}
                                        onChange={(e) => updateDistributionRow(task.id, distRow.id, 'hours', e.target.value)}
                                        className={cn("h-8 text-xs w-full", exceedsCapacity || exceedsProjectBudget && "border-red-300")}
                                      />
                                      {exceedsCapacity && (
                                        <p className="text-xs text-red-600 mt-1 font-medium">
                                          ⚠️ Excede capacidad: {newWeekTotal.toFixed(1)}h / {weekCapacity.toFixed(1)}h (+{(newWeekTotal - weekCapacity).toFixed(1)}h)
                                        </p>
                                      )}
                                      {exceedsProjectBudget && (
                                        <p className="text-xs text-red-600 mt-1 font-medium">
                                          ⚠️ Excede horas contratadas del proyecto: {newProjectMonthTotal.toFixed(1)}h / {projectBudget.toFixed(1)}h (+{(newProjectMonthTotal - projectBudget).toFixed(1)}h)
                                        </p>
                                      )}
                                    </div>
                                    <Select
                                      value={distRow.weekDate}
                                      onValueChange={(v) => updateDistributionRow(task.id, distRow.id, 'weekDate', v)}
                                    >
                                      <SelectTrigger className={cn("h-8 text-xs flex-1", exceedsCapacity && "border-red-300")}>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {futureWeeks.map((week) => {
                                          const storageKey = getStorageKey(week.weekStart, viewDate);
                                          const weekNumber = getWeekNumber(week.weekStart);
                                          return (
                                            <SelectItem key={storageKey} value={storageKey}>
                                              Sem {weekNumber} ({format(week.weekStart, 'd MMM', { locale: es })})
                                            </SelectItem>
                                          );
                                        })}
                                      </SelectContent>
                                    </Select>
                                    {(distributionTasks[task.id] || []).length > 1 && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-red-500"
                                        onClick={() => removeDistributionRow(task.id, distRow.id)}
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {(() => {
                          const totalDistributed = (distributionTasks[task.id] || []).reduce((sum, r) => sum + (parseFloat(r.hours) || 0), 0);
                          const remaining = task.hoursAssigned - totalDistributed;
                          return (
                            <div className="flex items-center justify-between text-xs">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => addDistributionRow(task.id)}
                                className="h-7"
                              >
                                <Plus className="h-3 w-3 mr-1" /> Añadir otra tarea
                              </Button>
                              <span className={cn(
                                "font-medium",
                                Math.abs(remaining) < 0.01 ? "text-emerald-600" : "text-amber-600"
                              )}>
                                {remaining > 0.01 ? `Faltan: ${remaining.toFixed(2)}h` : remaining < -0.01 ? `Sobran: ${Math.abs(remaining).toFixed(2)}h` : '✓ Distribución completa'}
                              </span>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </Card>
              );
                      })}
                    </div>
                  )}
                  
                  {/* PPC Tasks */}
                  {ppcTasks.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs">PPC</Badge>
                        <span className="text-xs text-muted-foreground">{ppcTasks.length} tarea(s)</span>
                      </div>
                      {ppcTasks.map(task => {
                        const project = projects.find(p => p.id === task.projectId);
                        const client = clients.find(c => c.id === project?.clientId);
                        const missingHours = task.hoursAssigned - (task.hoursActual || 0);
                        const isDistributionTask = task.taskName?.includes('[Distribuir]');
                        const isTransferredTask = task.taskName?.includes('(transferida de');
                        
                        // Inicializar distribución si es necesario
                        if ((isDistributionTask || isTransferredTask) && taskActions[task.id] === 'distribute' && (!distributionTasks[task.id] || distributionTasks[task.id].length === 0)) {
                          initializeDistribution(task.id, task.hoursAssigned);
                        }
                        
                        // Extraer nombre del empleado que transfirió (si es transferida)
                        const transferFromMatch = task.taskName?.match(/\(transferida de (.+)\)/);
                        const transferFromName = transferFromMatch ? transferFromMatch[1] : null;
                        const transferFromEmployee = transferFromName ? employees.find(e => e.name === transferFromName) : null;
                        
                        return (
                          <Card key={task.id} className="p-4 border-l-4" style={{ borderLeftColor: client?.color || '#6b7280' }}>
                            <div className="space-y-4">
                              {/* Header con proyecto y horas */}
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: client?.color || '#6b7280' }} />
                                    <span className="font-semibold text-sm text-slate-900 truncate">{project?.name || 'Sin proyecto'}</span>
                                  </div>
                                  <p className="text-sm text-slate-700 mt-1">{task.taskName?.replace(/\(transferida de .+\)/, '').trim() || 'Sin nombre'}</p>
                                  
                                  {/* Si es transferida, mostrar avatar y nombre del que transfirió */}
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
                                
                                {/* Burbuja de horas */}
                                <div className="flex items-center gap-1.5 bg-indigo-100 rounded-full px-3 py-1.5 shrink-0">
                                  <span className="text-xs font-medium text-slate-600">Asignadas</span>
                                  <span className="text-sm font-mono font-bold text-indigo-600">{task.hoursAssigned}h</span>
                                </div>
                              </div>
                              
                              {/* Horas realizadas si no es distribución */}
                              {!isDistributionTask && (
                                <div className="flex items-center gap-3 text-xs">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-slate-500">Realizadas:</span>
                                    <span className="font-semibold text-slate-700">{task.hoursActual || 0}h</span>
                                  </div>
                                  {missingHours > 0 && (
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-amber-600">Faltan:</span>
                                      <span className="font-semibold text-amber-600">{missingHours}h</span>
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {/* RadioGroup y acciones (mismo código que antes) */}
                              <RadioGroup
                                value={taskActions[task.id] || ''}
                                onValueChange={(value) => {
                                  setTaskActions(prev => ({ ...prev, [task.id]: value as 'move' | 'moveToEmployee' | 'justify' | 'distribute' | 'keep' }));
                                  if (value === 'distribute' && (isDistributionTask || isTransferredTask)) {
                                    initializeDistribution(task.id, task.hoursAssigned);
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
                              >
                                <div className="space-y-2">
                                  {(isDistributionTask || isTransferredTask) ? (
                                    <>
                                      <div className="flex items-start space-x-2">
                                        <RadioGroupItem value="keep" id={`${task.id}-keep`} />
                                        <Label htmlFor={`${task.id}-keep`} className="flex-1 cursor-pointer">
                                          <div className="flex items-center gap-2">
                                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                            <span className="font-medium">Mantener la misma tarea</span>
                                          </div>
                                          <p className="text-xs text-muted-foreground mt-1">
                                            Mantén la tarea tal cual está. No necesitas distribuirla ni hacer cambios.
                                          </p>
                                        </Label>
                                      </div>
                                      <div className="flex items-start space-x-2">
                                        <RadioGroupItem value="distribute" id={`${task.id}-distribute`} />
                                        <Label htmlFor={`${task.id}-distribute`} className="flex-1 cursor-pointer">
                                          <div className="flex items-center gap-2">
                                            <ArrowRight className="h-4 w-4 text-indigo-600" />
                                            <span className="font-medium">Distribuir en múltiples tareas</span>
                                          </div>
                                          <p className="text-xs text-muted-foreground mt-1">
                                            {isTransferredTask 
                                              ? `Distribuye las ${task.hoursAssigned}h transferidas entre las semanas que mejor te vengan.`
                                              : `Crea varias tareas distribuyendo las ${task.hoursAssigned}h entre las semanas restantes del mes.`}
                                          </p>
                                        </Label>
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <div className="flex items-start space-x-2">
                                        <RadioGroupItem value="move" id={`${task.id}-move`} />
                                        <Label htmlFor={`${task.id}-move`} className="flex-1 cursor-pointer">
                                          <div className="flex items-center gap-2">
                                            <ArrowRight className="h-4 w-4 text-indigo-600" />
                                            <span className="font-medium">Mover {missingHours}h a una semana futura</span>
                                          </div>
                                          <p className="text-xs text-muted-foreground mt-1">
                                            La tarea actual se recortará a lo hecho y se creará una nueva asignación en la semana que elijas. <strong className="text-amber-600">Nota obligatoria.</strong>
                                          </p>
                                        </Label>
                                      </div>
                                      
                                      <div className="flex items-start space-x-2">
                                        <RadioGroupItem value="moveToEmployee" id={`${task.id}-moveToEmployee`} />
                                        <Label htmlFor={`${task.id}-moveToEmployee`} className="flex-1 cursor-pointer">
                                          <div className="flex items-center gap-2">
                                            <Users className="h-4 w-4 text-purple-600" />
                                            <span className="font-medium">Mover {missingHours}h a otro compañero</span>
                                          </div>
                                          <p className="text-xs text-muted-foreground mt-1">
                                            Transfiere las horas restantes a otro compañero. La tarea actual se completará con lo que has hecho. <strong className="text-amber-600">Nota obligatoria.</strong>
                                          </p>
                                        </Label>
                                      </div>
                                      
                                      <div className="flex items-start space-x-2">
                                        <RadioGroupItem value="justify" id={`${task.id}-justify`} />
                                        <Label htmlFor={`${task.id}-justify`} className="flex-1 cursor-pointer">
                                          <div className="flex items-center gap-2">
                                            <AlertCircle className="h-4 w-4 text-amber-600" />
                                            <span className="font-medium">Solo justificar (Opcional)</span>
                                          </div>
                                          <p className="text-xs text-muted-foreground mt-1">
                                            Añade un comentario explicando la desviación. No afecta el estado de la tarea.
                                          </p>
                                        </Label>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </RadioGroup>
                              
                              {/* Selectores y comentarios (mismo código que antes) */}
                              {taskActions[task.id] === 'move' && !isDistributionTask && (
                                <div className="mt-3 pl-6 space-y-3 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                                  <Label className="text-xs font-medium mb-2 block text-indigo-900">
                                    Mover a semana futura
                                  </Label>
                                  <div>
                                    {futureWeeks.length > 0 ? (
                                      <Select
                                        value={moveToMyWeek[task.id] || ''}
                                        onValueChange={(value) => setMoveToMyWeek(prev => ({ ...prev, [task.id]: value }))}
                                      >
                                        <SelectTrigger className="h-8 text-xs">
                                          <SelectValue placeholder="Seleccionar semana" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {futureWeeks.map((week) => {
                                            const storageKey = getStorageKey(week.weekStart, viewDate);
                                            const weekNumber = getWeekNumber(week.weekStart);
                                            return (
                                              <SelectItem key={storageKey} value={storageKey}>
                                                Sem {weekNumber} ({format(week.weekStart, 'd MMM', { locale: es })})
                                              </SelectItem>
                                            );
                                          })}
                                        </SelectContent>
                                      </Select>
                                    ) : (
                                      <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
                                        ⚠️ No hay semanas futuras en este mes. Usa "Mover a otro compañero" para transferir las horas.
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )}
                              
                              {taskActions[task.id] === 'moveToEmployee' && !isDistributionTask && (
                                <div className="mt-3 pl-6 space-y-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                                  <Label className="text-xs font-medium mb-2 block text-purple-900">
                                    Transferir a otro compañero
                                  </Label>
                                  <div className="space-y-2">
                                    <div>
                                      <Label htmlFor={`${task.id}-employee-select`} className="text-xs mb-1 block">
                                        Compañero
                                      </Label>
                                      <Select
                                        value={moveToEmployee[task.id] || ''}
                                        onValueChange={(value) => setMoveToEmployee(prev => ({ ...prev, [task.id]: value }))}
                                      >
                                        <SelectTrigger id={`${task.id}-employee-select`} className="h-8 text-xs">
                                          <SelectValue placeholder="Seleccionar compañero" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {employees
                                            .filter(e => e.id !== employeeId && e.isActive)
                                            .map(emp => (
                                              <SelectItem key={emp.id} value={emp.id}>
                                                {emp.name}
                                              </SelectItem>
                                            ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div>
                                      <Label htmlFor={`${task.id}-week-select`} className="text-xs mb-1 block">
                                        Semana destino
                                      </Label>
                                      <Select
                                        value={moveToWeek[task.id] || ''}
                                        onValueChange={(value) => setMoveToWeek(prev => ({ ...prev, [task.id]: value }))}
                                      >
                                        <SelectTrigger id={`${task.id}-week-select`} className="h-8 text-xs">
                                          <SelectValue placeholder="Seleccionar semana" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {futureWeeks.map((week) => {
                                            const storageKey = getStorageKey(week.weekStart, viewDate);
                                            const weekNumber = getWeekNumber(week.weekStart);
                                            return (
                                              <SelectItem key={storageKey} value={storageKey}>
                                                Sem {weekNumber} ({format(week.weekStart, 'd MMM', { locale: es })})
                                              </SelectItem>
                                            );
                                          })}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {((taskActions[task.id] === 'move' || taskActions[task.id] === 'moveToEmployee') || 
                                (taskActions[task.id] === 'justify' || taskActions[task.id] === 'keep')) && (
                                <div className="mt-3 pl-6">
                                  <Label htmlFor={`${task.id}-comment`} className="text-xs font-medium mb-2 block">
                                    {(taskActions[task.id] === 'move' || taskActions[task.id] === 'moveToEmployee') ? (
                                      <span className="flex items-center gap-2">
                                        <span className="text-red-600 font-bold">*</span>
                                        <span>Nota obligatoria</span>
                                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-[10px]">
                                          Requerida
                                        </Badge>
                                      </span>
                                    ) : (
                                      'Comentario (opcional)'
                                    )}
                                  </Label>
                                  {(taskActions[task.id] === 'move' || taskActions[task.id] === 'moveToEmployee') && (
                                    <p className="text-xs text-amber-600 mb-2 bg-amber-50 p-2 rounded border border-amber-200">
                                      ⚠️ Debes explicar por qué mueves/transfieres estas horas. Esta información es importante para la trazabilidad.
                                    </p>
                                  )}
                                  <Textarea
                                    id={`${task.id}-comment`}
                                    placeholder={taskActions[task.id] === 'keep' ? "Añade un comentario si lo deseas..." : taskActions[task.id] === 'move' || taskActions[task.id] === 'moveToEmployee' ? "Ej: 'No tuve tiempo suficiente por bloqueo del cliente' o 'Necesito ayuda de un compañero con más experiencia'" : "Explica la razón de la desviación..."}
                                    value={taskComments[task.id] || ''}
                                    onChange={(e) => setTaskComments(prev => ({ ...prev, [task.id]: e.target.value }))}
                                    className={cn(
                                      "min-h-[80px] text-sm",
                                      (taskActions[task.id] === 'move' || taskActions[task.id] === 'moveToEmployee') && 
                                      (!taskComments[task.id] || !taskComments[task.id].trim()) && 
                                      "border-red-300 focus:border-red-500"
                                    )}
                                  />
                                  {(taskActions[task.id] === 'move' || taskActions[task.id] === 'moveToEmployee') && 
                                   (!taskComments[task.id] || !taskComments[task.id].trim()) && (
                                    <p className="text-xs text-red-600 mt-1">Este campo es obligatorio</p>
                                  )}
                                </div>
                              )}
                              
                              {taskActions[task.id] === 'distribute' && (isDistributionTask || isTransferredTask) && (
                                <div className="mt-3 pl-6 space-y-3">
                                  <Label className="text-xs font-medium mb-2 block">
                                    {isTransferredTask 
                                      ? `Distribuir ${task.hoursAssigned}h transferidas en tareas (máximo ${task.hoursAssigned}h)`
                                      : `Distribuir ${task.hoursAssigned}h en tareas`}
                                  </Label>
                                  {isTransferredTask && (
                                    <p className="text-xs text-purple-600 bg-purple-50 p-2 rounded border border-purple-200">
                                      💡 Puedes distribuir estas horas entre múltiples tareas y semanas. El sistema te avisará si excedes tu capacidad o las horas contratadas del proyecto.
                                    </p>
                                  )}
                                  <div className="space-y-2">
                                    {(distributionTasks[task.id] || []).map((distRow, idx) => {
                                      const rowHours = parseFloat(distRow.hours) || 0;
                                      const weekLoad = distRow.weekDate ? getEmployeeLoadForWeek(employeeId, distRow.weekDate) : null;
                                      const currentWeekHours = weekLoad?.hours || 0;
                                      const weekCapacity = weekLoad?.capacity || 0;
                                      
                                      const projectMonthAllocations = allocations.filter(a => 
                                        a.projectId === task.projectId && 
                                        isSameMonth(parseISO(a.weekStartDate), viewDate) &&
                                        a.id !== task.id
                                      );
                                      const projectMonthHours = projectMonthAllocations.reduce((sum, a) => sum + a.hoursAssigned, 0);
                                      
                                      const allDistributedHours = (distributionTasks[task.id] || []).reduce((sum, r) => sum + (parseFloat(r.hours) || 0), 0);
                                      const projectBudget = projects.find(p => p.id === task.projectId)?.budgetHours || 0;
                                      const newProjectMonthTotal = projectMonthHours + allDistributedHours;
                                      const exceedsProjectBudget = projectBudget > 0 && newProjectMonthTotal > projectBudget;
                                      
                                      const weekDistributedHours = (distributionTasks[task.id] || []).filter(r => r.weekDate === distRow.weekDate).reduce((sum, r) => sum + (parseFloat(r.hours) || 0), 0);
                                      const newWeekTotal = currentWeekHours + weekDistributedHours;
                                      const exceedsCapacity = newWeekTotal > weekCapacity;
                                      
                                      return (
                                        <div key={distRow.id} className={cn(
                                          "flex gap-2 items-start p-2 border rounded-lg",
                                          exceedsCapacity || exceedsProjectBudget ? "bg-red-50 border-red-200" : "bg-slate-50"
                                        )}>
                                          <div className="flex-1">
                                            <Input
                                              placeholder="Nombre de la tarea"
                                              value={distRow.taskName}
                                              onChange={(e) => updateDistributionRow(task.id, distRow.id, 'taskName', e.target.value)}
                                              className={cn("h-8 text-xs mb-2", exceedsCapacity || exceedsProjectBudget && "border-red-300")}
                                            />
                                            <div className="flex gap-2">
                                              <div className="flex-1">
                                                <Input
                                                  type="number"
                                                  min="0.5"
                                                  step="0.5"
                                                  placeholder="Horas"
                                                  value={distRow.hours}
                                                  onChange={(e) => updateDistributionRow(task.id, distRow.id, 'hours', e.target.value)}
                                                  className={cn("h-8 text-xs w-full", exceedsCapacity || exceedsProjectBudget && "border-red-300")}
                                                />
                                                {exceedsCapacity && (
                                                  <p className="text-xs text-red-600 mt-1 font-medium">
                                                    ⚠️ Excede capacidad: {newWeekTotal.toFixed(1)}h / {weekCapacity.toFixed(1)}h (+{(newWeekTotal - weekCapacity).toFixed(1)}h)
                                                  </p>
                                                )}
                                                {exceedsProjectBudget && (
                                                  <p className="text-xs text-red-600 mt-1 font-medium">
                                                    ⚠️ Excede horas contratadas del proyecto: {newProjectMonthTotal.toFixed(1)}h / {projectBudget.toFixed(1)}h (+{(newProjectMonthTotal - projectBudget).toFixed(1)}h)
                                                  </p>
                                                )}
                                              </div>
                                              <Select
                                                value={distRow.weekDate}
                                                onValueChange={(v) => updateDistributionRow(task.id, distRow.id, 'weekDate', v)}
                                              >
                                                <SelectTrigger className={cn("h-8 text-xs flex-1", exceedsCapacity && "border-red-300")}>
                                                  <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  {futureWeeks.map((week) => {
                                                    const storageKey = getStorageKey(week.weekStart, viewDate);
                                                    const weekNumber = getWeekNumber(week.weekStart);
                                                    return (
                                                      <SelectItem key={storageKey} value={storageKey}>
                                                        Sem {weekNumber} ({format(week.weekStart, 'd MMM', { locale: es })})
                                                      </SelectItem>
                                                    );
                                                  })}
                                                </SelectContent>
                                              </Select>
                                              {(distributionTasks[task.id] || []).length > 1 && (
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  className="h-8 w-8 text-red-500"
                                                  onClick={() => removeDistributionRow(task.id, distRow.id)}
                                                >
                                                  <X className="h-4 w-4" />
                                                </Button>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                  {(() => {
                                    const totalDistributed = (distributionTasks[task.id] || []).reduce((sum, r) => sum + (parseFloat(r.hours) || 0), 0);
                                    const remaining = task.hoursAssigned - totalDistributed;
                                    return (
                                      <div className="flex items-center justify-between text-xs">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => addDistributionRow(task.id)}
                                          className="h-7"
                                        >
                                          <Plus className="h-3 w-3 mr-1" /> Añadir otra tarea
                                        </Button>
                                        <span className={cn(
                                          "font-medium",
                                          Math.abs(remaining) < 0.01 ? "text-emerald-600" : "text-amber-600"
                                        )}>
                                          {remaining > 0.01 ? `Faltan: ${remaining.toFixed(2)}h` : remaining < -0.01 ? `Sobran: ${Math.abs(remaining).toFixed(2)}h` : '✓ Distribución completa'}
                                        </span>
                                      </div>
                                    );
                                  })()}
                                </div>
                              )}
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}
            
            {/* Tareas Transferidas */}
            {transferredTasks.length > 0 && (() => {
              // Separar por tipo de proyecto
              const seoTransferred = transferredTasks.filter(t => {
                const proj = projects.find(p => p.id === t.projectId);
                return proj && proj.projectType !== 'PPC';
              });
              const ppcTransferred = transferredTasks.filter(t => {
                const proj = projects.find(p => p.id === t.projectId);
                return proj && proj.projectType === 'PPC';
              });
              
              return (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <Inbox className="h-4 w-4 text-purple-600" />
                    <h3 className="font-semibold text-sm text-slate-900">Tareas que te han pasado</h3>
                    <Badge variant="outline" className="ml-auto text-xs bg-purple-50 text-purple-700 border-purple-200">{transferredTasks.length}</Badge>
                  </div>
                  
                  {/* SEO Transferidas */}
                  {seoTransferred.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">SEO</Badge>
                        <span className="text-xs text-muted-foreground">{seoTransferred.length} tarea(s)</span>
                      </div>
                      {seoTransferred.map(task => {
                  const project = projects.find(p => p.id === task.projectId);
                  const client = clients.find(c => c.id === project?.clientId);
                  const isDistributionTask = task.taskName?.includes('[Distribuir]');
                  const isTransferredTask = task.taskName?.includes('(transferida de');
                  
                  // Extraer nombre del empleado que transfirió
                  const transferFromMatch = task.taskName?.match(/\(transferida de (.+)\)/);
                  const transferFromName = transferFromMatch ? transferFromMatch[1] : null;
                  const transferFromEmployee = transferFromName ? employees.find(e => e.name === transferFromName) : null;
                  
                  // Inicializar distribución si es necesario
                  if ((isDistributionTask || isTransferredTask) && taskActions[task.id] === 'distribute' && (!distributionTasks[task.id] || distributionTasks[task.id].length === 0)) {
                    initializeDistribution(task.id, task.hoursAssigned);
                  }
                  
                  return (
                    <Card key={task.id} className="p-4 border-l-4 border-purple-400 bg-purple-50/30">
                      <div className="space-y-4">
                        {/* Header con proyecto y horas */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: client?.color || '#6b7280' }} />
                              <span className="font-semibold text-sm text-slate-900 truncate">{project?.name || 'Sin proyecto'}</span>
                            </div>
                            <p className="text-sm text-slate-700 mt-1">{task.taskName?.replace(/\(transferida de .+\)/, '').trim() || 'Sin nombre'}</p>
                            
                            {/* Avatar y nombre del que transfirió */}
                            {transferFromEmployee && (
                              <div className="flex items-center gap-1.5 mt-2 bg-purple-100 rounded-full px-2 py-1 w-fit">
                                <Avatar className="h-4 w-4">
                                  <AvatarImage src={transferFromEmployee.avatarUrl} alt={transferFromEmployee.name} />
                                  <AvatarFallback className="bg-purple-500 text-white text-[8px]">
                                    {(transferFromEmployee.first_name || transferFromEmployee.name)[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-xs text-purple-700 font-medium">De {transferFromEmployee.first_name || transferFromEmployee.name}</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Burbuja de horas */}
                          <div className="flex items-center gap-1.5 bg-purple-100 rounded-full px-3 py-1.5 shrink-0">
                            <span className="text-xs font-medium text-purple-700">Horas</span>
                            <span className="text-sm font-mono font-bold text-purple-600">{task.hoursAssigned}h</span>
                          </div>
                        </div>
                        
                        {/* RadioGroup y acciones (mismo código que antes) */}
                        <RadioGroup
                          value={taskActions[task.id] || ''}
                          onValueChange={(value) => {
                            setTaskActions(prev => ({ ...prev, [task.id]: value as 'move' | 'moveToEmployee' | 'justify' | 'distribute' | 'keep' }));
                            if (value === 'distribute' && (isDistributionTask || isTransferredTask)) {
                              initializeDistribution(task.id, task.hoursAssigned);
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
                        >
                          <div className="space-y-2">
                            <div className="flex items-start space-x-2">
                              <RadioGroupItem value="keep" id={`${task.id}-keep`} />
                              <Label htmlFor={`${task.id}-keep`} className="flex-1 cursor-pointer">
                                <div className="flex items-center gap-2">
                                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                  <span className="font-medium">Mantener la misma tarea</span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Mantén la tarea tal cual está. No necesitas distribuirla ni hacer cambios.
                                </p>
                              </Label>
                            </div>
                            <div className="flex items-start space-x-2">
                              <RadioGroupItem value="distribute" id={`${task.id}-distribute`} />
                              <Label htmlFor={`${task.id}-distribute`} className="flex-1 cursor-pointer">
                                <div className="flex items-center gap-2">
                                  <ArrowRight className="h-4 w-4 text-indigo-600" />
                                  <span className="font-medium">Distribuir en múltiples tareas</span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Distribuye las {task.hoursAssigned}h transferidas entre las semanas que mejor te vengan.
                                </p>
                              </Label>
                            </div>
                          </div>
                        </RadioGroup>
                        
                        {/* Resto del código de distribución, comentarios, etc. */}
                        {(taskActions[task.id] === 'justify' || taskActions[task.id] === 'keep') && (
                          <div className="mt-3 pl-6">
                            <Label htmlFor={`${task.id}-comment`} className="text-xs font-medium mb-2 block">
                              Comentario (opcional)
                            </Label>
                            <Textarea
                              id={`${task.id}-comment`}
                              placeholder={taskActions[task.id] === 'keep' ? "Añade un comentario si lo deseas..." : "Explica la razón de la desviación..."}
                              value={taskComments[task.id] || ''}
                              onChange={(e) => setTaskComments(prev => ({ ...prev, [task.id]: e.target.value }))}
                              className="min-h-[80px] text-sm"
                            />
                          </div>
                        )}
                        
                        {taskActions[task.id] === 'distribute' && (isDistributionTask || isTransferredTask) && (
                          <div className="mt-3 pl-6 space-y-3">
                            <Label className="text-xs font-medium mb-2 block">
                              Distribuir {task.hoursAssigned}h transferidas en tareas (máximo {task.hoursAssigned}h)
                            </Label>
                            <p className="text-xs text-purple-600 bg-purple-50 p-2 rounded border border-purple-200">
                              💡 Puedes distribuir estas horas entre múltiples tareas y semanas. El sistema te avisará si excedes tu capacidad o las horas contratadas del proyecto.
                            </p>
                            <div className="space-y-2">
                              {(distributionTasks[task.id] || []).map((distRow, idx) => {
                                const rowHours = parseFloat(distRow.hours) || 0;
                                const weekLoad = distRow.weekDate ? getEmployeeLoadForWeek(employeeId, distRow.weekDate) : null;
                                const currentWeekHours = weekLoad?.hours || 0;
                                const weekCapacity = weekLoad?.capacity || 0;
                                
                                const projectMonthAllocations = allocations.filter(a => 
                                  a.projectId === task.projectId && 
                                  isSameMonth(parseISO(a.weekStartDate), viewDate) &&
                                  a.id !== task.id
                                );
                                const projectMonthHours = projectMonthAllocations.reduce((sum, a) => sum + a.hoursAssigned, 0);
                                
                                const allDistributedHours = (distributionTasks[task.id] || []).reduce((sum, r) => sum + (parseFloat(r.hours) || 0), 0);
                                const projectBudget = projects.find(p => p.id === task.projectId)?.budgetHours || 0;
                                const newProjectMonthTotal = projectMonthHours + allDistributedHours;
                                const exceedsProjectBudget = projectBudget > 0 && newProjectMonthTotal > projectBudget;
                                
                                const weekDistributedHours = (distributionTasks[task.id] || []).filter(r => r.weekDate === distRow.weekDate).reduce((sum, r) => sum + (parseFloat(r.hours) || 0), 0);
                                const newWeekTotal = currentWeekHours + weekDistributedHours;
                                const exceedsCapacity = newWeekTotal > weekCapacity;
                                
                                return (
                                  <div key={distRow.id} className={cn(
                                    "flex gap-2 items-start p-2 border rounded-lg",
                                    exceedsCapacity || exceedsProjectBudget ? "bg-red-50 border-red-200" : "bg-slate-50"
                                  )}>
                                    <div className="flex-1">
                                      <Input
                                        placeholder="Nombre de la tarea"
                                        value={distRow.taskName}
                                        onChange={(e) => updateDistributionRow(task.id, distRow.id, 'taskName', e.target.value)}
                                        className={cn("h-8 text-xs mb-2", exceedsCapacity || exceedsProjectBudget && "border-red-300")}
                                      />
                                      <div className="flex gap-2">
                                        <div className="flex-1">
                                          <Input
                                            type="number"
                                            min="0.5"
                                            step="0.5"
                                            placeholder="Horas"
                                            value={distRow.hours}
                                            onChange={(e) => updateDistributionRow(task.id, distRow.id, 'hours', e.target.value)}
                                            className={cn("h-8 text-xs w-full", exceedsCapacity || exceedsProjectBudget && "border-red-300")}
                                          />
                                          {exceedsCapacity && (
                                            <p className="text-xs text-red-600 mt-1 font-medium">
                                              ⚠️ Excede capacidad: {newWeekTotal.toFixed(1)}h / {weekCapacity.toFixed(1)}h (+{(newWeekTotal - weekCapacity).toFixed(1)}h)
                                            </p>
                                          )}
                                          {exceedsProjectBudget && (
                                            <p className="text-xs text-red-600 mt-1 font-medium">
                                              ⚠️ Excede horas contratadas del proyecto: {newProjectMonthTotal.toFixed(1)}h / {projectBudget.toFixed(1)}h (+{(newProjectMonthTotal - projectBudget).toFixed(1)}h)
                                            </p>
                                          )}
                                        </div>
                                        <Select
                                          value={distRow.weekDate}
                                          onValueChange={(v) => updateDistributionRow(task.id, distRow.id, 'weekDate', v)}
                                        >
                                          <SelectTrigger className={cn("h-8 text-xs flex-1", exceedsCapacity && "border-red-300")}>
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {futureWeeks.map((week) => {
                                              const storageKey = getStorageKey(week.weekStart, viewDate);
                                              const weekNumber = getWeekNumber(week.weekStart);
                                              return (
                                                <SelectItem key={storageKey} value={storageKey}>
                                                  Sem {weekNumber} ({format(week.weekStart, 'd MMM', { locale: es })})
                                                </SelectItem>
                                              );
                                            })}
                                          </SelectContent>
                                        </Select>
                                        {(distributionTasks[task.id] || []).length > 1 && (
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-red-500"
                                            onClick={() => removeDistributionRow(task.id, distRow.id)}
                                          >
                                            <X className="h-4 w-4" />
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            {(() => {
                              const totalDistributed = (distributionTasks[task.id] || []).reduce((sum, r) => sum + (parseFloat(r.hours) || 0), 0);
                              const remaining = task.hoursAssigned - totalDistributed;
                              return (
                                <div className="flex items-center justify-between text-xs">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addDistributionRow(task.id)}
                                    className="h-7"
                                  >
                                    <Plus className="h-3 w-3 mr-1" /> Añadir otra tarea
                                  </Button>
                                  <span className={cn(
                                    "font-medium",
                                    Math.abs(remaining) < 0.01 ? "text-emerald-600" : "text-amber-600"
                                  )}>
                                    {remaining > 0.01 ? `Faltan: ${remaining.toFixed(2)}h` : remaining < -0.01 ? `Sobran: ${Math.abs(remaining).toFixed(2)}h` : '✓ Distribución completa'}
                                  </span>
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                      })}
                    </div>
                  )}
                  
                  {/* PPC Transferidas */}
                  {ppcTransferred.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs">PPC</Badge>
                        <span className="text-xs text-muted-foreground">{ppcTransferred.length} tarea(s)</span>
                      </div>
                      {ppcTransferred.map(task => {
                        const project = projects.find(p => p.id === task.projectId);
                        const client = clients.find(c => c.id === project?.clientId);
                        const isDistributionTask = task.taskName?.includes('[Distribuir]');
                        const isTransferredTask = task.taskName?.includes('(transferida de');
                        
                        // Extraer nombre del empleado que transfirió
                        const transferFromMatch = task.taskName?.match(/\(transferida de (.+)\)/);
                        const transferFromName = transferFromMatch ? transferFromMatch[1] : null;
                        const transferFromEmployee = transferFromName ? employees.find(e => e.name === transferFromName) : null;
                        
                        // Inicializar distribución si es necesario
                        if ((isDistributionTask || isTransferredTask) && taskActions[task.id] === 'distribute' && (!distributionTasks[task.id] || distributionTasks[task.id].length === 0)) {
                          initializeDistribution(task.id, task.hoursAssigned);
                        }
                        
                        return (
                          <Card key={task.id} className="p-4 border-l-4 border-purple-400 bg-purple-50/30">
                            <div className="space-y-4">
                              {/* Header con proyecto y horas */}
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: client?.color || '#6b7280' }} />
                                    <span className="font-semibold text-sm text-slate-900 truncate">{project?.name || 'Sin proyecto'}</span>
                                  </div>
                                  <p className="text-sm text-slate-700 mt-1">{task.taskName?.replace(/\(transferida de .+\)/, '').trim() || 'Sin nombre'}</p>
                                  
                                  {/* Avatar y nombre del que transfirió */}
                                  {transferFromEmployee && (
                                    <div className="flex items-center gap-1.5 mt-2 bg-purple-100 rounded-full px-2 py-1 w-fit">
                                      <Avatar className="h-4 w-4">
                                        <AvatarImage src={transferFromEmployee.avatarUrl} alt={transferFromEmployee.name} />
                                        <AvatarFallback className="bg-purple-500 text-white text-[8px]">
                                          {(transferFromEmployee.first_name || transferFromEmployee.name)[0]}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="text-xs text-purple-700 font-medium">{transferFromEmployee.first_name || transferFromEmployee.name}</span>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Burbuja de horas */}
                                <div className="flex items-center gap-1.5 bg-purple-100 rounded-full px-3 py-1.5 shrink-0">
                                  <span className="text-xs font-medium text-purple-700">Horas</span>
                                  <span className="text-sm font-mono font-bold text-purple-600">{task.hoursAssigned}h</span>
                                </div>
                              </div>
                              
                              {/* RadioGroup y acciones (mismo código que antes) */}
                              <RadioGroup
                                value={taskActions[task.id] || ''}
                                onValueChange={(value) => {
                                  setTaskActions(prev => ({ ...prev, [task.id]: value as 'move' | 'moveToEmployee' | 'justify' | 'distribute' | 'keep' }));
                                  if (value === 'distribute' && (isDistributionTask || isTransferredTask)) {
                                    initializeDistribution(task.id, task.hoursAssigned);
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
                              >
                                <div className="space-y-2">
                                  <div className="flex items-start space-x-2">
                                    <RadioGroupItem value="keep" id={`${task.id}-keep`} />
                                    <Label htmlFor={`${task.id}-keep`} className="flex-1 cursor-pointer">
                                      <div className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                        <span className="font-medium">Mantener la misma tarea</span>
                                      </div>
                                      <p className="text-xs text-muted-foreground mt-1">
                                        Mantén la tarea tal cual está. No necesitas distribuirla ni hacer cambios.
                                      </p>
                                    </Label>
                                  </div>
                                  <div className="flex items-start space-x-2">
                                    <RadioGroupItem value="distribute" id={`${task.id}-distribute`} />
                                    <Label htmlFor={`${task.id}-distribute`} className="flex-1 cursor-pointer">
                                      <div className="flex items-center gap-2">
                                        <ArrowRight className="h-4 w-4 text-indigo-600" />
                                        <span className="font-medium">Distribuir en múltiples tareas</span>
                                      </div>
                                      <p className="text-xs text-muted-foreground mt-1">
                                        Distribuye las {task.hoursAssigned}h transferidas entre las semanas que mejor te vengan.
                                      </p>
                                    </Label>
                                  </div>
                                </div>
                              </RadioGroup>
                              
                              {/* Resto del código de distribución, comentarios, etc. */}
                              {(taskActions[task.id] === 'justify' || taskActions[task.id] === 'keep') && (
                                <div className="mt-3 pl-6">
                                  <Label htmlFor={`${task.id}-comment`} className="text-xs font-medium mb-2 block">
                                    Comentario (opcional)
                                  </Label>
                                  <Textarea
                                    id={`${task.id}-comment`}
                                    placeholder={taskActions[task.id] === 'keep' ? "Añade un comentario si lo deseas..." : "Explica la razón de la desviación..."}
                                    value={taskComments[task.id] || ''}
                                    onChange={(e) => setTaskComments(prev => ({ ...prev, [task.id]: e.target.value }))}
                                    className="min-h-[80px] text-sm"
                                  />
                                </div>
                              )}
                              
                              {taskActions[task.id] === 'distribute' && (isDistributionTask || isTransferredTask) && (
                                <div className="mt-3 pl-6 space-y-3">
                                  <Label className="text-xs font-medium mb-2 block">
                                    Distribuir {task.hoursAssigned}h transferidas en tareas (máximo {task.hoursAssigned}h)
                                  </Label>
                                  <p className="text-xs text-purple-600 bg-purple-50 p-2 rounded border border-purple-200">
                                    💡 Puedes distribuir estas horas entre múltiples tareas y semanas. El sistema te avisará si excedes tu capacidad o las horas contratadas del proyecto.
                                  </p>
                                  <div className="space-y-2">
                                    {(distributionTasks[task.id] || []).map((distRow, idx) => {
                                      const rowHours = parseFloat(distRow.hours) || 0;
                                      const weekLoad = distRow.weekDate ? getEmployeeLoadForWeek(employeeId, distRow.weekDate) : null;
                                      const currentWeekHours = weekLoad?.hours || 0;
                                      const weekCapacity = weekLoad?.capacity || 0;
                                      
                                      const projectMonthAllocations = allocations.filter(a => 
                                        a.projectId === task.projectId && 
                                        isSameMonth(parseISO(a.weekStartDate), viewDate) &&
                                        a.id !== task.id
                                      );
                                      const projectMonthHours = projectMonthAllocations.reduce((sum, a) => sum + a.hoursAssigned, 0);
                                      
                                      const allDistributedHours = (distributionTasks[task.id] || []).reduce((sum, r) => sum + (parseFloat(r.hours) || 0), 0);
                                      const projectBudget = projects.find(p => p.id === task.projectId)?.budgetHours || 0;
                                      const newProjectMonthTotal = projectMonthHours + allDistributedHours;
                                      const exceedsProjectBudget = projectBudget > 0 && newProjectMonthTotal > projectBudget;
                                      
                                      const weekDistributedHours = (distributionTasks[task.id] || []).filter(r => r.weekDate === distRow.weekDate).reduce((sum, r) => sum + (parseFloat(r.hours) || 0), 0);
                                      const newWeekTotal = currentWeekHours + weekDistributedHours;
                                      const exceedsCapacity = newWeekTotal > weekCapacity;
                                      
                                      return (
                                        <div key={distRow.id} className={cn(
                                          "flex gap-2 items-start p-2 border rounded-lg",
                                          exceedsCapacity || exceedsProjectBudget ? "bg-red-50 border-red-200" : "bg-slate-50"
                                        )}>
                                          <div className="flex-1">
                                            <Input
                                              placeholder="Nombre de la tarea"
                                              value={distRow.taskName}
                                              onChange={(e) => updateDistributionRow(task.id, distRow.id, 'taskName', e.target.value)}
                                              className={cn("h-8 text-xs mb-2", exceedsCapacity || exceedsProjectBudget && "border-red-300")}
                                            />
                                            <div className="flex gap-2">
                                              <div className="flex-1">
                                                <Input
                                                  type="number"
                                                  min="0.5"
                                                  step="0.5"
                                                  placeholder="Horas"
                                                  value={distRow.hours}
                                                  onChange={(e) => updateDistributionRow(task.id, distRow.id, 'hours', e.target.value)}
                                                  className={cn("h-8 text-xs w-full", exceedsCapacity || exceedsProjectBudget && "border-red-300")}
                                                />
                                                {exceedsCapacity && (
                                                  <p className="text-xs text-red-600 mt-1 font-medium">
                                                    ⚠️ Excede capacidad: {newWeekTotal.toFixed(1)}h / {weekCapacity.toFixed(1)}h (+{(newWeekTotal - weekCapacity).toFixed(1)}h)
                                                  </p>
                                                )}
                                                {exceedsProjectBudget && (
                                                  <p className="text-xs text-red-600 mt-1 font-medium">
                                                    ⚠️ Excede horas contratadas del proyecto: {newProjectMonthTotal.toFixed(1)}h / {projectBudget.toFixed(1)}h (+{(newProjectMonthTotal - projectBudget).toFixed(1)}h)
                                                  </p>
                                                )}
                                              </div>
                                              <Select
                                                value={distRow.weekDate}
                                                onValueChange={(v) => updateDistributionRow(task.id, distRow.id, 'weekDate', v)}
                                              >
                                                <SelectTrigger className={cn("h-8 text-xs flex-1", exceedsCapacity && "border-red-300")}>
                                                  <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  {futureWeeks.map((week) => {
                                                    const storageKey = getStorageKey(week.weekStart, viewDate);
                                                    const weekNumber = getWeekNumber(week.weekStart);
                                                    return (
                                                      <SelectItem key={storageKey} value={storageKey}>
                                                        Sem {weekNumber} ({format(week.weekStart, 'd MMM', { locale: es })})
                                                      </SelectItem>
                                                    );
                                                  })}
                                                </SelectContent>
                                              </Select>
                                              {(distributionTasks[task.id] || []).length > 1 && (
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  className="h-8 w-8 text-red-500"
                                                  onClick={() => removeDistributionRow(task.id, distRow.id)}
                                                >
                                                  <X className="h-4 w-4" />
                                                </Button>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                  {(() => {
                                    const totalDistributed = (distributionTasks[task.id] || []).reduce((sum, r) => sum + (parseFloat(r.hours) || 0), 0);
                                    const remaining = task.hoursAssigned - totalDistributed;
                                    return (
                                      <div className="flex items-center justify-between text-xs">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => addDistributionRow(task.id)}
                                          className="h-7"
                                        >
                                          <Plus className="h-3 w-3 mr-1" /> Añadir otra tarea
                                        </Button>
                                        <span className={cn(
                                          "font-medium",
                                          Math.abs(remaining) < 0.01 ? "text-emerald-600" : "text-amber-600"
                                        )}>
                                          {remaining > 0.01 ? `Faltan: ${remaining.toFixed(2)}h` : remaining < -0.01 ? `Sobran: ${Math.abs(remaining).toFixed(2)}h` : '✓ Distribución completa'}
                                        </span>
                                      </div>
                                    );
                                  })()}
                                </div>
                              )}
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}
        
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
                  isSameMonth(parseISO(a.weekStartDate), viewDate) &&
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
                  const weekLoad = getEmployeeLoadForWeek(employeeId, distTask.weekDate);
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
                    const weekLoad = getEmployeeLoadForWeek(employeeId, targetWeek);
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
                    const targetWeekLoad = getEmployeeLoadForWeek(targetEmployeeId, targetWeek);
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
                className="bg-indigo-600 hover:bg-indigo-700"
                disabled={!canSubmit}
                title={!canSubmit ? validationErrors.join('; ') : ''}
              >
                Confirmar Weekly
              </Button>
            );
          })()}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

