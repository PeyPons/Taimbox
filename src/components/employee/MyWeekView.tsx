import { useMemo, useState, memo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { format, isSameMonth, parseISO, startOfWeek, isBefore, addDays, isAfter, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Sparkles, TrendingUp, TrendingDown, Users, Target, 
  CheckCircle2, Clock, Award, Filter, CheckSquare, ArrowRight, AlertCircle
} from 'lucide-react';
import { cn, formatProjectName } from '@/lib/utils';
import { toast } from 'sonner';
import { getStorageKey } from '@/utils/dateUtils';

interface MyWeekViewProps {
  employeeId: string;
  viewDate: Date;
}

const round2 = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

export const MyWeekView = memo(function MyWeekView({ employeeId, viewDate }: MyWeekViewProps) {
  const { allocations, projects, clients, employees, getEmployeeMonthlyLoad, updateAllocation, addAllocation, addWeeklyFeedback } = useApp();
  
  const [filterProject, setFilterProject] = useState<string>('all');
  const [filterTeammate, setFilterTeammate] = useState<string>('all');
  const [showCloseWeekDialog, setShowCloseWeekDialog] = useState(false);
  const [taskActions, setTaskActions] = useState<Record<string, 'move' | 'complete' | 'justify' | null>>({});
  const [taskComments, setTaskComments] = useState<Record<string, string>>({});
  
  const monthLabel = format(viewDate, 'MMMM yyyy', { locale: es });
  
  // Detectar semana actual o última semana pasada del mes
  const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const currentWeekStr = format(currentWeekStart, 'yyyy-MM-dd');
  const isCurrentWeekInMonth = isSameMonth(currentWeekStart, viewDate);
  
  // Encontrar la última semana pasada del mes si la actual no está en el mes
  const getTargetWeek = (): string | null => {
    if (isCurrentWeekInMonth) {
      return currentWeekStr;
    }
    // Buscar la última semana pasada del mes
    const monthStart = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
    const monthEnd = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);
    
    // Si estamos en el mes actual pero la semana actual es futura, usar la última semana del mes
    if (isAfter(currentWeekStart, monthEnd)) {
      const lastWeekStart = startOfWeek(monthEnd, { weekStartsOn: 1 });
      if (isBefore(lastWeekStart, new Date()) || isSameDay(lastWeekStart, new Date())) {
        return format(lastWeekStart, 'yyyy-MM-dd');
      }
    }
    
    // Si estamos en un mes pasado, usar la última semana del mes
    if (isBefore(monthEnd, new Date())) {
      const lastWeekStart = startOfWeek(monthEnd, { weekStartsOn: 1 });
      return format(lastWeekStart, 'yyyy-MM-dd');
    }
    
    return null;
  };
  
  const targetWeek = getTargetWeek();
  const canCloseWeek = targetWeek !== null;
  
  // Allocations del mes para este empleado
  const monthlyAllocations = allocations.filter(a => 
    a.employeeId === employeeId && 
    isSameMonth(parseISO(a.weekStartDate), viewDate)
  );
  
  // Tareas desviadas de la semana objetivo
  const deviatedTasks = useMemo(() => {
    if (!targetWeek) return [];
    const storageKey = getStorageKey(parseISO(targetWeek), viewDate);
    return allocations.filter(a => 
      a.employeeId === employeeId &&
      a.weekStartDate === storageKey &&
      ((a.hoursActual || 0) < a.hoursAssigned || a.status !== 'completed')
    );
  }, [allocations, employeeId, targetWeek, viewDate]);

  // Métricas globales del mes
  const monthlyStats = useMemo(() => {
    const load = getEmployeeMonthlyLoad(employeeId, viewDate.getFullYear(), viewDate.getMonth());
    
    const completed = monthlyAllocations.filter(a => a.status === 'completed');
    const totalTasks = monthlyAllocations.length;
    const completedTasks = completed.length;
    
    const totalEstimated = monthlyAllocations.reduce((sum, a) => sum + a.hoursAssigned, 0);
    const totalReal = completed.reduce((sum, a) => sum + (a.hoursActual || 0), 0);
    const totalComputed = completed.reduce((sum, a) => sum + (a.hoursComputed || 0), 0);
    
    const executionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    
    return {
      ...load,
      totalTasks,
      completedTasks,
      totalEstimated: round2(totalEstimated),
      totalReal: round2(totalReal),
      totalComputed: round2(totalComputed),
      executionRate: round2(executionRate)
    };
  }, [employeeId, viewDate, monthlyAllocations, getEmployeeMonthlyLoad]);

  // Agrupar por proyecto con métricas de impacto y compañeros detallados
  const projectGroups = useMemo(() => {
    const groups: Record<string, {
      projectId: string;
      projectName: string;
      clientName: string;
      clientColor: string;
      myEstimated: number;
      myReal: number;
      myComputed: number;
      myTasks: number;
      myCompletedTasks: number;
      projectTotalComputed: number;
      projectBudget: number;
      // Compañeros con detalle
      teammates: { 
        id: string; 
        name: string; 
        avatarUrl?: string;
        hoursComputed: number;
        impactPercentage: number;
      }[];
      myImpactPercentage: number;
    }> = {};

    // Procesar mis allocations
    monthlyAllocations.forEach(alloc => {
      if (!groups[alloc.projectId]) {
        const proj = projects.find(p => p.id === alloc.projectId);
        const cli = clients.find(c => c.id === proj?.clientId);
        groups[alloc.projectId] = {
          projectId: alloc.projectId,
          projectName: proj?.name || 'Sin proyecto',
          clientName: cli?.name || 'Interno',
          clientColor: cli?.color || '#6b7280',
          myEstimated: 0,
          myReal: 0,
          myComputed: 0,
          myTasks: 0,
          myCompletedTasks: 0,
          projectTotalComputed: 0,
          projectBudget: proj?.budgetHours || 0,
          teammates: [],
          myImpactPercentage: 0
        };
      }

      groups[alloc.projectId].myEstimated += alloc.hoursAssigned;
      groups[alloc.projectId].myTasks += 1;
      
      if (alloc.status === 'completed') {
        groups[alloc.projectId].myReal += alloc.hoursActual || 0;
        groups[alloc.projectId].myComputed += alloc.hoursComputed || 0;
        groups[alloc.projectId].myCompletedTasks += 1;
      }
    });

    // Calcular totales del proyecto y compañeros con sus aportes
    Object.keys(groups).forEach(projId => {
      const allProjectAllocations = allocations.filter(a => 
        a.projectId === projId && 
        isSameMonth(parseISO(a.weekStartDate), viewDate)
      );
      
      // Total computado del proyecto
      const projectTotal = allProjectAllocations
        .filter(a => a.status === 'completed')
        .reduce((sum, a) => sum + (a.hoursComputed || 0), 0);
      
      groups[projId].projectTotalComputed = round2(projectTotal);
      
      // Mi impacto
      if (projectTotal > 0) {
        groups[projId].myImpactPercentage = round2((groups[projId].myComputed / projectTotal) * 100);
      }
      
      // Compañeros con sus horas y porcentaje
      const teammateHours: Record<string, number> = {};
      allProjectAllocations
        .filter(a => a.employeeId !== employeeId && a.status === 'completed')
        .forEach(a => {
          if (!teammateHours[a.employeeId]) teammateHours[a.employeeId] = 0;
          teammateHours[a.employeeId] += a.hoursComputed || 0;
        });
      
      groups[projId].teammates = Object.entries(teammateHours).map(([empId, hours]) => {
        const emp = employees.find(e => e.id === empId);
        return {
          id: empId,
          name: emp?.name || 'Desconocido',
          avatarUrl: emp?.avatarUrl,
          hoursComputed: round2(hours),
          impactPercentage: projectTotal > 0 ? round2((hours / projectTotal) * 100) : 0
        };
      }).sort((a, b) => b.hoursComputed - a.hoursComputed);
    });

    return Object.values(groups)
      .map(g => ({
        ...g,
        myEstimated: round2(g.myEstimated),
        myReal: round2(g.myReal),
        myComputed: round2(g.myComputed)
      }))
      .sort((a, b) => b.myComputed - a.myComputed);
  }, [monthlyAllocations, allocations, projects, clients, employees, employeeId, viewDate]);

  // Lista de todos los compañeros únicos para filtro
  const allTeammates = useMemo(() => {
    const set = new Set<string>();
    projectGroups.forEach(g => g.teammates.forEach(t => set.add(t.id)));
    return Array.from(set).map(id => employees.find(e => e.id === id)).filter(Boolean);
  }, [projectGroups, employees]);

  // Filtrar proyectos
  const filteredProjects = useMemo(() => {
    return projectGroups.filter(g => {
      if (filterProject !== 'all' && g.projectId !== filterProject) return false;
      if (filterTeammate !== 'all' && !g.teammates.some(t => t.id === filterTeammate)) return false;
      return true;
    });
  }, [projectGroups, filterProject, filterTeammate]);

  const handleCloseWeek = async () => {
    if (!targetWeek) return;
    
    const storageKey = getStorageKey(parseISO(targetWeek), viewDate);
    const nextWeekStart = addDays(parseISO(targetWeek), 7);
    const nextWeekStr = format(nextWeekStart, 'yyyy-MM-dd');
    const nextWeekStorageKey = getStorageKey(nextWeekStart, viewDate);
    
    try {
      for (const task of deviatedTasks) {
        const action = taskActions[task.id];
        if (!action) continue;
        
        if (action === 'move') {
          // Opción A: Mover resto a la semana siguiente
          const remainingHours = task.hoursAssigned - (task.hoursActual || 0);
          if (remainingHours > 0) {
            // Actualizar tarea actual (recortar a lo hecho)
            await updateAllocation({
              ...task,
              hoursAssigned: task.hoursActual || 0,
              status: 'completed'
            });
            
            // Crear/actualizar asignación en la semana siguiente
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
          // Opción B: Marcar como completado (asumir desviación)
          await updateAllocation({
            ...task,
            status: 'completed',
            hoursActual: task.hoursActual || task.hoursAssigned
          });
        } else if (action === 'justify') {
          // Opción C: Solo justificar (opcional, no bloquea)
          const comment = taskComments[task.id];
          if (comment?.trim()) {
            await addWeeklyFeedback({
              employeeId,
              weekStartDate: targetWeek,
              projectId: task.projectId,
              allocationId: task.id,
              reason: 'other',
              comments: comment
            });
          }
        }
      }
      
      toast.success('Semana cerrada correctamente');
      setShowCloseWeekDialog(false);
      setTaskActions({});
      setTaskComments({});
    } catch (error) {
      console.error('Error cerrando semana:', error);
      toast.error('Error al cerrar la semana');
    }
  };
  
  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header con título, KPIs y filtros */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 capitalize flex items-center gap-2">
                {monthLabel}
              </h2>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Target className="h-3.5 w-3.5" /> Rendimiento por proyecto
              </p>
            </div>
            
            {/* Botón Cerrar Semana */}
            {canCloseWeek && (
              <Button
                onClick={() => setShowCloseWeekDialog(true)}
                variant="outline"
                className="gap-2 border-indigo-300 text-indigo-700 hover:bg-indigo-50"
              >
                <CheckSquare className="h-4 w-4" />
                Cerrar Semana
              </Button>
            )}
            
            {/* KPIs compactos */}
            <div className="flex items-center gap-3 flex-wrap">
              <Tooltip>
                <TooltipTrigger>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg">
                    <Clock className="h-4 w-4 text-slate-500" />
                    <span className="text-sm font-bold text-slate-700">~{monthlyStats.capacity}h</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>Tu capacidad disponible este mes</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger>
                  <div className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg",
                    monthlyStats.executionRate >= 50 ? "bg-emerald-50" : "bg-amber-50"
                  )}>
                    <CheckCircle2 className={cn("h-4 w-4", monthlyStats.executionRate >= 50 ? "text-emerald-500" : "text-amber-500")} />
                    <span className={cn("text-sm font-bold", monthlyStats.executionRate >= 50 ? "text-emerald-700" : "text-amber-700")}>
                      {monthlyStats.executionRate}%
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>{monthlyStats.completedTasks} de {monthlyStats.totalTasks} tareas completadas</TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Filtros */}
          {(projectGroups.length > 1 || allTeammates.length > 0) && (
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-400" />
                <Select value={filterProject} onValueChange={setFilterProject}>
                  <SelectTrigger className="w-[180px] h-8 text-xs">
                    <SelectValue placeholder="Todos los proyectos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los proyectos</SelectItem>
                    {projectGroups.map(g => (
                      <SelectItem key={g.projectId} value={g.projectId}>
                        {formatProjectName(g.projectName)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {allTeammates.length > 0 && (
                <Select value={filterTeammate} onValueChange={setFilterTeammate}>
                  <SelectTrigger className="w-[180px] h-8 text-xs">
                    <SelectValue placeholder="Todos los compañeros" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los compañeros</SelectItem>
                    {allTeammates.map(emp => emp && (
                      <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}
        </div>

        {/* Grid de proyectos - altura uniforme */}
        {filteredProjects.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Sparkles className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <p className="text-muted-foreground">
                {filterProject !== 'all' || filterTeammate !== 'all' 
                  ? "No hay proyectos con esos filtros." 
                  : "Sin proyectos asignados este mes."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredProjects.map(group => {
              const balance = round2(group.myComputed - group.myReal);
              const isPositive = balance >= 0;
              const completionRate = group.myTasks > 0 ? round2((group.myCompletedTasks / group.myTasks) * 100) : 0;
              const isHighImpact = group.myImpactPercentage >= 50;
              const isMediumImpact = group.myImpactPercentage >= 25 && group.myImpactPercentage < 50;
              
              return (
                <Card key={group.projectId} className={cn("flex flex-col h-full transition-all hover:shadow-md", isHighImpact && "ring-2 ring-emerald-200")}>
                  {/* Header */}
                  <CardHeader className="pb-2 pt-4 px-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-sm font-bold truncate" title={group.projectName}>
                          {formatProjectName(group.projectName)}
                        </CardTitle>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: group.clientColor }} />
                          <span className="text-xs text-muted-foreground truncate">{group.clientName}</span>
                        </div>
                      </div>
                      
                      {/* Badge de impacto */}
                      <Tooltip>
                        <TooltipTrigger>
                          <Badge variant="outline" className={cn(
                            "shrink-0 gap-1",
                            isHighImpact ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                              : isMediumImpact ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                              : "bg-slate-50 text-slate-600 border-slate-200"
                          )}>
                            {isHighImpact ? <Award className="h-3 w-3" /> : <Target className="h-3 w-3" />}
                            {group.myImpactPercentage}%
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="max-w-[200px]">
                          <p className="font-semibold mb-1">
                            {isHighImpact ? "¡Alto impacto!" : isMediumImpact ? "Impacto notable" : "Tu contribución"}
                          </p>
                          <p className="text-xs">
                            Aportas el {group.myImpactPercentage}% del trabajo total del proyecto este mes.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    
                    {/* Compañeros con avatares */}
                    {group.teammates.length > 0 && (
                      <div className="flex items-center gap-2 mt-2">
                        <Users className="h-3 w-3 text-slate-400" />
                        <div className="flex -space-x-2">
                          {group.teammates.slice(0, 4).map(tm => (
                            <Tooltip key={tm.id}>
                              <TooltipTrigger>
                                <Avatar className="h-6 w-6 border-2 border-white">
                                  <AvatarImage src={tm.avatarUrl} />
                                  <AvatarFallback className="text-[10px] bg-slate-100">
                                    {tm.name.substring(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="font-semibold">{tm.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {tm.hoursComputed}h computadas ({tm.impactPercentage}%)
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          ))}
                          {group.teammates.length > 4 && (
                            <Tooltip>
                              <TooltipTrigger>
                                <div className="h-6 w-6 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[10px] font-medium text-slate-600">
                                  +{group.teammates.length - 4}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                {group.teammates.slice(4).map(tm => (
                                  <div key={tm.id} className="text-xs">{tm.name}: {tm.hoursComputed}h</div>
                                ))}
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </div>
                    )}
                  </CardHeader>

                  <CardContent className="px-4 pb-4 pt-2 space-y-3 flex-1 flex flex-col">
                    {/* Barra de progreso */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Tareas completadas</span>
                        <span className="font-medium">{group.myCompletedTasks}/{group.myTasks}</span>
                      </div>
                      <Progress value={completionRate} className="h-1.5" />
                    </div>

                    {/* Métricas - flex-1 para empujar balance abajo */}
                    <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t flex-1">
                      <div className="space-y-0.5">
                        <p className="text-lg font-bold text-slate-700">{group.myEstimated}h</p>
                        <p className="text-[10px] text-slate-400 uppercase">Estimado</p>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-lg font-bold text-blue-600">{group.myReal}h</p>
                        <p className="text-[10px] text-blue-400 uppercase">Real</p>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-lg font-bold text-emerald-600">{group.myComputed}h</p>
                        <p className="text-[10px] text-emerald-400 uppercase">Computado</p>
                      </div>
                    </div>

                    {/* Balance - siempre al final */}
                    {group.myCompletedTasks > 0 && (
                      <div className={cn(
                        "flex items-center justify-between px-3 py-2 rounded-lg mt-auto",
                        isPositive ? "bg-emerald-50" : "bg-red-50"
                      )}>
                        <span className="text-xs font-medium text-slate-600">Balance</span>
                        <div className={cn("flex items-center gap-1 font-bold text-sm", isPositive ? "text-emerald-600" : "text-red-600")}>
                          {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                          {isPositive ? '+' : ''}{balance}h
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
        
        {/* Dialog Cerrar Semana */}
        <Dialog open={showCloseWeekDialog} onOpenChange={setShowCloseWeekDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5" />
                Cerrar Semana
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
                            <span className="text-amber-600 font-medium">Faltan: {missingHours}h</span>
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
                                  <span className="font-medium">Marcar como completado (Asumir desviación)</span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  La diferencia de horas se perderá y la tarea quedará marcada como completada.
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
              <Button variant="outline" onClick={() => setShowCloseWeekDialog(false)}>
                Cancelar
              </Button>
              {deviatedTasks.length > 0 && (
                <Button onClick={handleCloseWeek} className="bg-indigo-600 hover:bg-indigo-700">
                  Cerrar Semana
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
});
