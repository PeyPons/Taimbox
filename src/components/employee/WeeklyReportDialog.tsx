import { useState, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { format, parseISO, startOfWeek, isSameMonth, addDays, isBefore } from 'date-fns';
import { CheckCircle2, ArrowRight, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getStorageKey } from '@/utils/dateUtils';
import { cn, formatProjectName } from '@/lib/utils';

interface WeeklyReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string;
  viewDate: Date;
}

export function WeeklyReportDialog({ open, onOpenChange, employeeId, viewDate }: WeeklyReportDialogProps) {
  const { allocations, projects, clients, updateAllocation, addAllocation, addWeeklyFeedback } = useApp();
  
  const [taskActions, setTaskActions] = useState<Record<string, 'move' | 'complete' | 'justify' | null>>({});
  const [taskComments, setTaskComments] = useState<Record<string, string>>({});
  
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
                        <span>Realizadas: {task.hoursActual || 0}h</span>
                        {missingHours > 0 && (
                          <span className="text-amber-600 font-medium">Faltan: {missingHours}h</span>
                        )}
                      </div>
                    </div>
                    
                    <RadioGroup
                      value={taskActions[task.id] || ''}
                      onValueChange={(value) => setTaskActions(prev => ({ ...prev, [task.id]: value as 'move' | 'complete' | 'justify' }))}
                    >
                      <div className="space-y-2">
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
