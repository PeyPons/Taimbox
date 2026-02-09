import { useState, useMemo, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { format, addDays, startOfMonth, endOfMonth, eachWeekOfInterval, differenceInDays, startOfWeek, endOfWeek, isSameMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { ChevronLeft, ChevronRight, CalendarDays, User, Clock, ChevronDown, ChevronUp, CheckCircle2, Check, ChevronDown as ChevronDownIcon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { useProjectAliasing } from '@/hooks/useProjectAliasing';

type ZoomLevel = 'week' | 'month';

interface GanttTask {
    id: string;
    projectId: string;
    projectName: string;
    projectColor: string;
    taskName: string;
    employeeName: string;
    startDate: Date;
    endDate: Date;
    hours: number;
    status: 'planned' | 'active' | 'completed';
}

interface GanttViewProps {
    initialViewDate?: Date;
}

export function GanttView({ initialViewDate }: GanttViewProps) {
    const { projects, allocations, employees, clients } = useApp();
    const { formatName: formatProjectName } = useProjectAliasing();

    const [viewDate, setViewDate] = useState(initialViewDate || new Date());
    const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('week');
    const [selectedProject, setSelectedProject] = useState<string>('all');
    const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
    const [allExpanded, setAllExpanded] = useState(true);
    const [projectFilterOpen, setProjectFilterOpen] = useState(false);

    // Sincronizar si cambia desde afuera
    useEffect(() => {
        if (initialViewDate) {
            setViewDate(initialViewDate);
        }
    }, [initialViewDate]);

    // Calcular rango de fechas según zoom
    const dateRange = useMemo(() => {
        if (zoomLevel === 'week') {
            const start = startOfMonth(viewDate);
            const end = endOfMonth(viewDate);
            const weeks = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 });
            return {
                start: startOfWeek(start, { weekStartsOn: 1 }),
                end: endOfWeek(end, { weekStartsOn: 1 }),
                days: weeks
            };
        } else {
            const start = startOfMonth(addDays(viewDate, -30));
            const end = endOfMonth(addDays(viewDate, 60));
            const months = [];
            let current = start;
            while (current <= end) {
                months.push(current);
                current = addDays(endOfMonth(current), 1);
            }
            return { start, end, days: months };
        }
    }, [viewDate, zoomLevel]);

    // Colores por proyecto
    const projectColors = useMemo(() => {
        const colors = [
            'bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500',
            'bg-rose-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-pink-500'
        ];
        const colorMap: Record<string, string> = {};
        projects.forEach((p, i) => {
            colorMap[p.id] = colors[i % colors.length];
        });
        return colorMap;
    }, [projects]);

    // Construir tareas del Gantt - INCLUIR completadas excepto las de 0h
    const ganttTasks = useMemo(() => {
        const activeProjects = selectedProject === 'all'
            ? projects.filter(p => p.status === 'active')
            : projects.filter(p => p.id === selectedProject);

        const projectIds = new Set(activeProjects.map(p => p.id));

        const tasks: GanttTask[] = allocations
            .filter(a => {
                // Incluir si pertenece a un proyecto activo
                if (!projectIds.has(a.projectId)) return false;
                // Excluir tareas completadas con 0 horas (cerradas automáticamente)
                if (a.status === 'completed' && a.hoursAssigned === 0) return false;
                // Incluir todas las demás (incluidas completadas con horas)
                return true;
            })
            .map(a => {
                const project = projects.find(p => p.id === a.projectId);
                const employee = employees.find(e => e.id === a.employeeId);
                const weekStart = new Date(a.weekStartDate);
                const endDate = addDays(weekStart, 4);

                return {
                    id: a.id,
                    projectId: a.projectId,
                    projectName: project ? formatProjectName(project.name) : 'Proyecto',
                    projectColor: projectColors[a.projectId] || 'bg-slate-500',
                    taskName: a.taskName || 'Tarea',
                    employeeName: employee?.name || 'Sin asignar',
                    startDate: weekStart,
                    endDate,
                    hours: a.hoursAssigned,
                    status: a.status
                } as GanttTask;
            });

        // Ya NO detectamos conflictos - es normal tener varias tareas por empleado

        return tasks;
    }, [allocations, projects, employees, selectedProject, projectColors]);

    // Agrupar por proyecto
    const tasksByProject = useMemo(() => {
        const grouped: Record<string, GanttTask[]> = {};
        ganttTasks.forEach(task => {
            if (!grouped[task.projectId]) {
                grouped[task.projectId] = [];
            }
            grouped[task.projectId].push(task);
        });
        return grouped;
    }, [ganttTasks]);

    // Inicializar todos los proyectos como expandidos
    useEffect(() => {
        if (allExpanded) {
            setExpandedProjects(new Set(Object.keys(tasksByProject)));
        }
    }, [tasksByProject, allExpanded]);

    // Toggle un proyecto
    const toggleProject = (projectId: string) => {
        setExpandedProjects(prev => {
            const next = new Set(prev);
            if (next.has(projectId)) {
                next.delete(projectId);
            } else {
                next.add(projectId);
            }
            return next;
        });
        setAllExpanded(false);
    };

    // Toggle todos
    const toggleAll = () => {
        if (allExpanded) {
            setExpandedProjects(new Set());
            setAllExpanded(false);
        } else {
            setExpandedProjects(new Set(Object.keys(tasksByProject)));
            setAllExpanded(true);
        }
    };

    // Navegación
    const handlePrev = () => {
        if (zoomLevel === 'week') {
            setViewDate(prev => addDays(prev, -30));
        } else {
            setViewDate(prev => addDays(prev, -90));
        }
    };

    const handleNext = () => {
        if (zoomLevel === 'week') {
            setViewDate(prev => addDays(prev, 30));
        } else {
            setViewDate(prev => addDays(prev, 90));
        }
    };

    const handleToday = () => setViewDate(new Date());

    // Calcular posición de una tarea
    const getTaskPosition = (task: GanttTask) => {
        const totalDuration = differenceInDays(dateRange.end, dateRange.start) + 1;
        const startOffset = differenceInDays(task.startDate, dateRange.start);
        const taskDuration = differenceInDays(task.endDate, task.startDate) + 1;

        const left = (startOffset / totalDuration) * 100;
        const width = (taskDuration / totalDuration) * 100;

        return {
            left: `${Math.max(0, left)}%`,
            width: `${Math.max(2, width)}%`,
            display: (left + width < 0 || left > 100) ? 'none' : 'flex'
        };
    };

    // Contar tareas por proyecto
    const getProjectTaskCount = (projectId: string) => {
        return tasksByProject[projectId]?.length || 0;
    };

    return (
        <TooltipProvider>
            <div className="h-full flex flex-col bg-slate-50/30">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b bg-white shadow-sm z-20">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePrev}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={handleToday} className="h-8 text-xs px-3">
                                <CalendarDays className="h-3.5 w-3.5 mr-1.5" />
                                Hoy
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleNext}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                        <h3 className="text-lg font-bold capitalize text-slate-800">
                            {format(viewDate, 'MMMM yyyy', { locale: es })}
                        </h3>
                    </div>

                    <div className="flex items-center gap-3">
                        <Popover open={projectFilterOpen} onOpenChange={setProjectFilterOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    className="w-[220px] h-9 bg-white shadow-sm justify-between"
                                >
                                    <span className="truncate">
                                        {selectedProject === 'all'
                                            ? 'Todos los proyectos'
                                            : formatProjectName(projects.find(p => p.id === selectedProject)?.name || 'Proyecto')
                                        }
                                    </span>
                                    <ChevronDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[220px] p-0" align="start">
                                <Command>
                                    <CommandInput placeholder="Buscar proyecto..." />
                                    <CommandList>
                                        <CommandEmpty>No se encontraron proyectos</CommandEmpty>
                                        <CommandGroup>
                                            <CommandItem
                                                value="all"
                                                onSelect={() => {
                                                    setSelectedProject('all');
                                                    setProjectFilterOpen(false);
                                                }}
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4",
                                                        selectedProject === 'all' ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                                Todos los proyectos
                                            </CommandItem>
                                            {projects
                                                .filter(p => p.status === 'active')
                                                .map(p => (
                                                    <CommandItem
                                                        key={p.id}
                                                        value={formatProjectName(p.name)}
                                                        onSelect={() => {
                                                            setSelectedProject(p.id);
                                                            setProjectFilterOpen(false);
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                selectedProject === p.id ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        {formatProjectName(p.name)}
                                                    </CommandItem>
                                                ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>

                        <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border shadow-inner">
                            <Button
                                variant={zoomLevel === 'week' ? 'outline' : 'ghost'}
                                size="sm"
                                onClick={() => setZoomLevel('week')}
                                className={cn("h-8 text-xs px-4 rounded-md transition-all", zoomLevel === 'week' && "bg-white shadow-sm text-primary font-bold")}
                            >
                                Semanas
                            </Button>
                            <Button
                                variant={zoomLevel === 'month' ? 'outline' : 'ghost'}
                                size="sm"
                                onClick={() => setZoomLevel('month')}
                                className={cn("h-8 text-xs px-4 rounded-md transition-all", zoomLevel === 'month' && "bg-white shadow-sm text-primary font-bold")}
                            >
                                Trimestre
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Timeline Header */}
                <div className="flex border-b bg-white/80 backdrop-blur-md sticky top-0 z-10 shadow-sm">
                    <div className="w-72 shrink-0 p-3 border-r font-bold text-xs uppercase tracking-wider text-slate-500 bg-slate-50/50 flex items-center justify-between">
                        <span>Proyecto / Tarea</span>
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]" onClick={toggleAll}>
                            {allExpanded ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
                            {allExpanded ? 'Colapsar' : 'Expandir'}
                        </Button>
                    </div>
                    <div className="flex-1 flex">
                        {dateRange.days.map((date, i) => (
                            <div
                                key={i}
                                className={cn(
                                    "flex-1 text-center py-3 text-[10px] font-bold border-r uppercase tracking-tighter flex flex-col justify-center gap-0.5",
                                    isSameMonth(date, viewDate) ? "text-slate-700" : "text-slate-300 bg-slate-50/30"
                                )}
                            >
                                {zoomLevel === 'week' && (
                                    <>
                                        <span className="text-primary opacity-70">Semana {i + 1}</span>
                                        <span className="font-medium text-[9px]">{format(date, 'd MMM', { locale: es })}</span>
                                    </>
                                )}
                                {zoomLevel === 'month' && format(date, 'MMMM', { locale: es })}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Timeline Content */}
                <div className="flex-1 overflow-auto custom-scrollbar bg-slate-50/20">
                    {Object.entries(tasksByProject).map(([projectId, tasks]) => {
                        const project = projects.find(p => p.id === projectId);
                        const client = clients.find(c => c.id === project?.clientId);
                        const isExpanded = expandedProjects.has(projectId);
                        const taskCount = getProjectTaskCount(projectId);
                        const completedCount = tasks.filter(t => t.status === 'completed').length;

                        return (
                            <div key={projectId} className="border-b bg-white/50">
                                {/* Project Header - Clickable */}
                                <div
                                    className="flex items-center bg-slate-100/50 backdrop-blur-sm group cursor-pointer hover:bg-slate-100/80 transition-colors"
                                    onClick={() => toggleProject(projectId)}
                                >
                                    <div className="w-72 shrink-0 p-3 border-r h-12 flex items-center">
                                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                                                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                            </Button>
                                            <div className={cn("w-3 h-3 rounded-full shadow-sm ring-2 ring-white shrink-0", projectColors[projectId])} />
                                            <div className="min-w-0 flex-1">
                                                <div className="font-bold text-xs text-slate-800 truncate leading-none mb-0.5">
                                                    {formatProjectName(project?.name || '')}
                                                </div>
                                                <div className="text-[9px] font-medium text-slate-500 truncate uppercase tracking-tight">
                                                    {client?.name || 'Interno'}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <Badge variant="outline" className="text-[9px] h-5 bg-white">
                                                    {taskCount} tareas
                                                </Badge>
                                                {completedCount > 0 && (
                                                    <Badge variant="outline" className="text-[9px] h-5 bg-emerald-50 text-emerald-600 border-emerald-200">
                                                        <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
                                                        {completedCount}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex-1 h-12" />
                                </div>

                                {/* Tasks - Collapsible */}
                                {isExpanded && tasks.map(task => (
                                    <div key={task.id} className="flex items-center hover:bg-white transition-colors group">
                                        <div className="w-72 shrink-0 p-2 pl-10 border-r border-slate-100 h-10 flex flex-col justify-center bg-white/80">
                                            <div className="flex items-center gap-2">
                                                {task.status === 'completed' && (
                                                    <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                                                )}
                                                <div className={cn(
                                                    "text-[11px] font-semibold truncate flex-1",
                                                    task.status === 'completed' ? "text-slate-400 line-through" : "text-slate-700"
                                                )}>
                                                    {task.taskName}
                                                </div>
                                            </div>
                                            <div className="text-[9px] text-slate-400 font-medium truncate flex items-center gap-1 pl-5">
                                                <User className="h-2.5 w-2.5" />
                                                {task.employeeName}
                                            </div>
                                        </div>
                                        <div className="flex-1 relative h-10 flex items-center">
                                            {/* Today line */}
                                            {isSameMonth(viewDate, new Date()) && zoomLevel === 'week' && (
                                                <div
                                                    className="absolute top-0 bottom-0 w-0.5 bg-primary/20 z-10 border-l border-primary/30"
                                                    style={{ left: `${(differenceInDays(new Date(), dateRange.start) / differenceInDays(dateRange.end, dateRange.start)) * 100}%` }}
                                                />
                                            )}

                                            {/* Task bar */}
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div
                                                        className={cn(
                                                            "absolute h-6 rounded-md flex items-center px-2 text-[10px] text-white font-bold cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg shadow-sm border border-white/20 select-none",
                                                            task.status === 'completed' ? "bg-slate-400" : task.projectColor
                                                        )}
                                                        style={getTaskPosition(task)}
                                                    >
                                                        <span className="truncate drop-shadow-sm">{task.hours}h</span>
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent side="top" className="p-3 bg-white shadow-2xl border-slate-200 max-w-xs">
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className={cn("w-2 h-2 rounded-full", task.projectColor)} />
                                                            <div className="font-bold text-slate-900">{task.taskName}</div>
                                                            {task.status === 'completed' && (
                                                                <Badge className="bg-emerald-100 text-emerald-700 text-[9px] h-4">Completada</Badge>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col gap-1 text-[11px] text-slate-500">
                                                            <div className="flex items-center gap-1.5">
                                                                <User className="h-3 w-3" />
                                                                <span className="font-medium">{task.employeeName}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5">
                                                                <Clock className="h-3 w-3" />
                                                                <span>{task.hours}h asignadas</span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 font-semibold text-slate-700 bg-slate-50 p-1 rounded mt-1">
                                                                <CalendarDays className="h-3 w-3" />
                                                                {format(task.startDate, 'd MMM', { locale: es })} - {format(task.endDate, 'd MMM', { locale: es })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TooltipContent>
                                            </Tooltip>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        );
                    })}

                    {Object.keys(tasksByProject).length === 0 && (
                        <div className="flex flex-col items-center justify-center h-80 text-slate-400 bg-white/50 m-6 rounded-2xl border-2 border-dashed border-slate-200">
                            <CalendarDays className="h-16 w-16 mx-auto mb-4 opacity-10" />
                            <p className="font-medium text-slate-500">No hay tareas planificadas en este periodo</p>
                            <p className="text-xs text-slate-400 mt-1">Usa la vista semanal para asignar tareas al equipo</p>
                        </div>
                    )}
                </div>
            </div>
        </TooltipProvider>
    );
}
