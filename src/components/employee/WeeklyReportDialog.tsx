import { useState, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, parseISO, startOfWeek, isSameMonth, addDays, isBefore } from 'date-fns';
import { CheckCircle2, ArrowRight, AlertCircle, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { getStorageKey, getWeeksForMonth } from '@/utils/dateUtils';
import { cn, formatProjectName } from '@/lib/utils';

interface WeeklyReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string;
  viewDate: Date;
}

export function WeeklyReportDialog({ open, onOpenChange, employeeId, viewDate }: WeeklyReportDialogProps) {
  const { allocations, projects, clients, updateAllocation, addAllocation, deleteAllocation, addWeeklyFeedback } = useApp();
  
  const [taskActions, setTaskActions] = useState<Record<string, 'move' | 'complete' | 'justify' | 'distribute' | null>>({});
  const [taskComments, setTaskComments] = useState<Record<string, string>>({});
  const [distributionTasks, setDistributionTasks] = useState<Record<string, Array<{ id: string; taskName: string; hours: string; weekDate: string }>>>({});
  
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
  
  // Tareas desviadas (incluye todas las semanas pasadas y actual)
  const deviatedTasks = useMemo(() => {
    const today = new Date();
    
    // Buscar todas las tareas en semanas pasadas o actual que necesiten reporte
    const allDeviatedTasks = allocations.filter(a => {
      if (a.employeeId !== employeeId) return false;
      
      try {
        const taskWeekDate = parseISO(a.weekStartDate);
        if (!isSameMonth(taskWeekDate, viewDate)) return false;
        
        const taskWeekEnd = addDays(taskWeekDate, 4); // Viernes de esa semana
        
        // Incluir si la semana ya pasó (viernes ya pasó) o es la actual
        if (taskWeekEnd > today) return false;
        
        // Incluir si no está completada O si tiene horas desviadas
        if (a.status !== 'completed') return true;
        if ((a.hoursActual || 0) < a.hoursAssigned) return true;
        
        return false;
      } catch {
        return false;
      }
    });
    
    // Eliminar duplicados
    return Array.from(new Map(allDeviatedTasks.map(t => [t.id, t])).values());
  }, [allocations, employeeId, viewDate]);
  
  // Semanas futuras del mes para distribución
  const futureWeeks = useMemo(() => {
    const today = new Date();
    const weeks = getWeeksForMonth(viewDate);
    return weeks.filter(week => {
      try {
        const weekDate = parseISO(getStorageKey(week.weekStart, viewDate));
        const weekEnd = addDays(weekDate, 4); // Viernes
        return weekEnd >= today;
      } catch {
        return false;
      }
    });
  }, [viewDate]);
  
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
      for (const task of deviatedTasks) {
        const action = taskActions[task.id];
        if (!action) continue;
        
        const taskWeekDate = parseISO(task.weekStartDate);
        const taskWeekStr = format(taskWeekDate, 'yyyy-MM-dd');
        const nextWeekStart = addDays(taskWeekDate, 7);
        const nextWeekStr = format(nextWeekStart, 'yyyy-MM-dd');
        const nextWeekStorageKey = getStorageKey(nextWeekStart, viewDate);
        
        if (action === 'move') {
          const remainingHours = task.hoursAssigned - (task.hoursActual || 0);
          if (remainingHours > 0) {
            await updateAllocation({
              ...task,
              hoursAssigned: task.hoursActual || 0,
              status: 'completed'
            });
            
            const existingNextWeek = allocations.find(a => 
              a.employeeId === employeeId &&
              a.projectId === task.projectId &&
              a.weekStartDate === nextWeekStorageKey &&
              a.taskName === task.taskName
            );
            
            if (existingNextWeek) {
              await updateAllocation({
                ...existingNextWeek,
                hoursAssigned: existingNextWeek.hoursAssigned + remainingHours
              });
            } else {
              await addAllocation({
                employeeId,
                projectId: task.projectId,
                weekStartDate: nextWeekStorageKey,
                hoursAssigned: remainingHours,
                taskName: task.taskName || 'Tarea movida',
                status: 'planned'
              });
            }
          }
        } else if (action === 'complete') {
          const actualHours = task.hoursActual || task.hoursAssigned;
          await updateAllocation({
            ...task,
            status: 'completed',
            hoursActual: actualHours,
            hoursAssigned: actualHours
          });
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
        } else if (action === 'distribute') {
          // Opción D: Distribuir asignación genérica [Distribuir] en múltiples tareas
          const distTasks = distributionTasks[task.id] || [];
          const validTasks = distTasks.filter(t => t.taskName.trim() && parseFloat(t.hours) > 0);
          
          if (validTasks.length === 0) {
            toast.error('Añade al menos una tarea válida para distribuir');
            continue;
          }
          
          const totalDistributed = validTasks.reduce((sum, t) => sum + parseFloat(t.hours), 0);
          if (Math.abs(totalDistributed - task.hoursAssigned) > 0.1) {
            toast.error(`La suma de horas (${totalDistributed}h) debe ser igual a las horas asignadas (${task.hoursAssigned}h)`);
            continue;
          }
          
          // Eliminar la tarea genérica original
          await deleteAllocation(task.id);
          
          // Crear las nuevas tareas distribuidas
          for (const distTask of validTasks) {
            await addAllocation({
              employeeId,
              projectId: task.projectId,
              weekStartDate: distTask.weekDate,
              hoursAssigned: parseFloat(distTask.hours),
              taskName: distTask.taskName,
              status: 'planned'
            });
          }
        }
      }
      
      toast.success('Reporte semanal enviado correctamente');
      onOpenChange(false);
      setTaskActions({});
      setTaskComments({});
    } catch (error) {
      console.error('Error enviando reporte semanal:', error);
      toast.error('Error al enviar el reporte semanal');
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            Reporte Semanal
          </DialogTitle>
          <DialogDescription>
            Revisa las tareas desviadas y elige cómo gestionarlas.
          </DialogDescription>
        </DialogHeader>
        
        {deviatedTasks.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-emerald-500" />
            <p>No hay tareas desviadas en esta semana. ¡Todo está en orden!</p>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {deviatedTasks.map(task => {
              const project = projects.find(p => p.id === task.projectId);
              const client = clients.find(c => c.id === project?.clientId);
              const missingHours = task.hoursAssigned - (task.hoursActual || 0);
              const isDistributionTask = task.taskName?.includes('[Distribuir]');
              
              // Inicializar distribución si es una tarea [Distribuir] y se selecciona la opción
              if (isDistributionTask && taskActions[task.id] === 'distribute' && (!distributionTasks[task.id] || distributionTasks[task.id].length === 0)) {
                initializeDistribution(task.id, task.hoursAssigned);
              }
              
              return (
                <Card key={task.id} className="p-4">
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: client?.color || '#6b7280' }} />
                        <span className="font-semibold text-sm">{project?.name || 'Sin proyecto'}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{task.taskName || 'Sin nombre'}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>Asignadas: {task.hoursAssigned}h</span>
                        {!isDistributionTask && (
                          <>
                            <span>Realizadas: {task.hoursActual || 0}h</span>
                            {missingHours > 0 && (
                              <span className="text-amber-600 font-medium">Faltan: {missingHours}h</span>
                            )}
                          </>
                        )}
                        {isDistributionTask && (
                          <span className="text-indigo-600 font-medium">Distribuir entre tareas</span>
                        )}
                      </div>
                    </div>
                    
                    <RadioGroup
                      value={taskActions[task.id] || ''}
                      onValueChange={(value) => {
                        setTaskActions(prev => ({ ...prev, [task.id]: value as 'move' | 'complete' | 'justify' | 'distribute' }));
                        if (value === 'distribute' && isDistributionTask) {
                          initializeDistribution(task.id, task.hoursAssigned);
                        }
                      }}
                    >
                      <div className="space-y-2">
                        {isDistributionTask ? (
                          // Para tareas [Distribuir], solo mostrar opción de distribuir
                          <div className="flex items-start space-x-2">
                            <RadioGroupItem value="distribute" id={`${task.id}-distribute`} />
                            <Label htmlFor={`${task.id}-distribute`} className="flex-1 cursor-pointer">
                              <div className="flex items-center gap-2">
                                <ArrowRight className="h-4 w-4 text-indigo-600" />
                                <span className="font-medium">Distribuir en múltiples tareas</span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                Crea varias tareas distribuyendo las {task.hoursAssigned}h entre las semanas restantes del mes.
                              </p>
                            </Label>
                          </div>
                        ) : (
                          // Para tareas normales, mostrar las 3 opciones estándar
                          <>
                            <div className="flex items-start space-x-2">
                              <RadioGroupItem value="move" id={`${task.id}-move`} />
                              <Label htmlFor={`${task.id}-move`} className="flex-1 cursor-pointer">
                                <div className="flex items-center gap-2">
                                  <ArrowRight className="h-4 w-4 text-indigo-600" />
                                  <span className="font-medium">Mover {missingHours}h a la semana siguiente</span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  La tarea actual se recortará a lo hecho y se creará una nueva asignación para la semana siguiente.
                                </p>
                              </Label>
                            </div>
                            
                            <div className="flex items-start space-x-2">
                              <RadioGroupItem value="complete" id={`${task.id}-complete`} />
                              <Label htmlFor={`${task.id}-complete`} className="flex-1 cursor-pointer">
                                <div className="flex items-center gap-2">
                                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                  <span className="font-medium">Terminado eficiente</span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Las horas asignadas se ajustarán a las horas reales. Las horas liberadas volverán al presupuesto disponible del proyecto.
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
                    
                    {taskActions[task.id] === 'justify' && (
                      <div className="mt-3 pl-6">
                        <Label htmlFor={`${task.id}-comment`} className="text-xs font-medium mb-2 block">
                          Comentario (opcional)
                        </Label>
                        <Textarea
                          id={`${task.id}-comment`}
                          placeholder="Explica la razón de la desviación..."
                          value={taskComments[task.id] || ''}
                          onChange={(e) => setTaskComments(prev => ({ ...prev, [task.id]: e.target.value }))}
                          className="min-h-[80px] text-sm"
                        />
                      </div>
                    )}
                    
                    {taskActions[task.id] === 'distribute' && isDistributionTask && (
                      <div className="mt-3 pl-6 space-y-3">
                        <Label className="text-xs font-medium mb-2 block">
                          Distribuir {task.hoursAssigned}h en tareas
                        </Label>
                        <div className="space-y-2">
                          {(distributionTasks[task.id] || []).map((distRow, idx) => {
                            return (
                              <div key={distRow.id} className="flex gap-2 items-start p-2 border rounded-lg bg-slate-50">
                                <div className="flex-1">
                                  <Input
                                    placeholder="Nombre de la tarea"
                                    value={distRow.taskName}
                                    onChange={(e) => updateDistributionRow(task.id, distRow.id, 'taskName', e.target.value)}
                                    className="h-8 text-xs mb-2"
                                  />
                                  <div className="flex gap-2">
                                    <Input
                                      type="number"
                                      min="0.5"
                                      step="0.5"
                                      placeholder="Horas"
                                      value={distRow.hours}
                                      onChange={(e) => updateDistributionRow(task.id, distRow.id, 'hours', e.target.value)}
                                      className="h-8 text-xs w-24"
                                    />
                                    <Select
                                      value={distRow.weekDate}
                                      onValueChange={(v) => updateDistributionRow(task.id, distRow.id, 'weekDate', v)}
                                    >
                                      <SelectTrigger className="h-8 text-xs flex-1">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {futureWeeks.map((week, i) => {
                                          const storageKey = getStorageKey(week.weekStart, viewDate);
                                          return (
                                            <SelectItem key={storageKey} value={storageKey}>
                                              Sem {i + 1} ({format(week.weekStart, 'd MMM', { locale: es })})
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
                                Math.abs(remaining) < 0.1 ? "text-emerald-600" : "text-amber-600"
                              )}>
                                {remaining > 0.1 ? `Faltan: ${remaining.toFixed(1)}h` : remaining < -0.1 ? `Sobran: ${Math.abs(remaining).toFixed(1)}h` : '✓ Distribución completa'}
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
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          {deviatedTasks.length > 0 && (
            <Button onClick={handleCloseWeek} className="bg-indigo-600 hover:bg-indigo-700">
              Enviar Reporte
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
