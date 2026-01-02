import { useState, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format, parseISO, startOfWeek, subWeeks, addDays, isBefore } from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckCircle2, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn, formatProjectName } from '@/lib/utils';

interface CloseTasksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string;
}

export function CloseTasksDialog({ open, onOpenChange, employeeId }: CloseTasksDialogProps) {
  const { allocations, projects, clients, updateAllocation } = useApp();
  
  const [taskHours, setTaskHours] = useState<Record<string, { actual: string; computed: string }>>({});
  
  // Obtener semana anterior (lunes a viernes)
  const lastWeekStart = startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 });
  const lastWeekEnd = addDays(lastWeekStart, 4); // Viernes
  const lastWeekStr = format(lastWeekStart, 'yyyy-MM-dd');
  
  // Tareas de la semana anterior que no están completadas
  const openTasks = useMemo(() => {
    const today = new Date();
    
    return allocations.filter(a => {
      if (a.employeeId !== employeeId) return false;
      if (a.status === 'completed') return false;
      
      try {
        const taskWeekDate = parseISO(a.weekStartDate);
        const taskWeekEnd = addDays(taskWeekDate, 4);
        
        // Solo tareas de la semana anterior (que ya pasó)
        if (taskWeekDate.getTime() === lastWeekStart.getTime() && isBefore(taskWeekEnd, today)) {
          return true;
        }
        
        return false;
      } catch {
        return false;
      }
    });
  }, [allocations, employeeId, lastWeekStart]);
  
  const handleClose = async () => {
    try {
      let closedCount = 0;
      
      for (const task of openTasks) {
        const hours = taskHours[task.id];
        if (!hours) continue;
        
        const actual = parseFloat(hours.actual) || 0;
        const computed = parseFloat(hours.computed) || actual; // Si no se especifica, usar actual
        
        if (actual <= 0) {
          toast.error(`"${task.taskName}" necesita horas reales mayores a 0`);
          continue;
        }
        
        await updateAllocation({
          ...task,
          hoursActual: actual,
          hoursComputed: computed,
          status: 'completed'
        });
        
        closedCount++;
      }
      
      if (closedCount > 0) {
        toast.success(`${closedCount} tarea(s) cerrada(s) correctamente`);
        setTaskHours({});
        onOpenChange(false);
      } else {
        toast.warning('Completa las horas reales para al menos una tarea');
      }
    } catch (error) {
      console.error('Error cerrando tareas:', error);
      toast.error('Error al cerrar las tareas');
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" aria-describedby="close-tasks-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            Cerrar Tareas de la Semana Anterior
          </DialogTitle>
          <DialogDescription id="close-tasks-description">
            Tareas abiertas de la semana del <strong>{format(lastWeekStart, "d 'de' MMMM", { locale: es })}</strong> al <strong>{format(lastWeekEnd, "d 'de' MMMM", { locale: es })}</strong>.
            Indica las horas reales y computadas para cada tarea.
          </DialogDescription>
        </DialogHeader>
        
        {openTasks.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-emerald-500" />
            <p>No hay tareas abiertas de la semana anterior. ¡Todo está al día!</p>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {openTasks.map(task => {
              const project = projects.find(p => p.id === task.projectId);
              const client = clients.find(c => c.id === project?.clientId);
              const hours = taskHours[task.id] || { actual: '', computed: '' };
              
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
                        {task.hoursActual && task.hoursActual > 0 && (
                          <span>Realizadas: {task.hoursActual}h</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor={`${task.id}-actual`} className="text-xs font-medium">
                          Horas Reales *
                        </Label>
                        <Input
                          id={`${task.id}-actual`}
                          type="number"
                          min="0"
                          step="0.5"
                          placeholder="0"
                          value={hours.actual}
                          onChange={(e) => setTaskHours(prev => ({
                            ...prev,
                            [task.id]: { ...prev[task.id], actual: e.target.value }
                          }))}
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`${task.id}-computed`} className="text-xs font-medium">
                          Horas Computadas
                        </Label>
                        <Input
                          id={`${task.id}-computed`}
                          type="number"
                          min="0"
                          step="0.5"
                          placeholder={hours.actual || '0'}
                          value={hours.computed}
                          onChange={(e) => setTaskHours(prev => ({
                            ...prev,
                            [task.id]: { ...prev[task.id], computed: e.target.value }
                          }))}
                          className="h-9"
                        />
                        <p className="text-xs text-muted-foreground">
                          Si no se especifica, se usará el valor de horas reales
                        </p>
                      </div>
                    </div>
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
          {openTasks.length > 0 && (
            <Button onClick={handleClose} className="bg-primary hover:bg-primary/90">
              Cerrar Tareas
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

