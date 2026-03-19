import { useState, useMemo, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import type { Employee } from '@/types';
import {
    format,
    addDays,
    startOfMonth,
    endOfMonth,
    eachWeekOfInterval,
    startOfWeek,
    endOfWeek,
    isSameMonth,
    parseISO,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import {
    ChevronLeft,
    ChevronRight,
    CalendarDays,
    User,
    Clock,
    ChevronDown,
    ChevronUp,
    Check,
    ChevronDown as ChevronDownIcon,
    Info,
} from 'lucide-react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { useProjectAliasing } from '@/hooks/useProjectAliasing';

type ZoomLevel = 'week' | 'month';

type CellBreakdown = { taskName: string; hours: number; status: string };

function statusLabel(s: string): string {
    switch (s) {
        case 'completed':
            return 'Completada';
        case 'active':
        case 'in_progress':
            return 'En curso';
        case 'planned':
        default:
            return 'Planificada';
    }
}

function statusBadgeVariant(s: string): 'default' | 'secondary' | 'outline' | 'destructive' {
    if (s === 'completed') return 'secondary';
    if (s === 'active' || s === 'in_progress') return 'default';
    return 'outline';
}

/** Fondo suave según carga semanal (referencia ~40h). */
function cellHeatmapClasses(hours: number): string {
    if (hours <= 0) return '';
    if (hours <= 10) return 'bg-emerald-50 text-emerald-900 border border-emerald-200/80 shadow-sm';
    if (hours <= 24) return 'bg-sky-50 text-sky-900 border border-sky-200/80 shadow-sm';
    if (hours <= 40) return 'bg-indigo-50 text-indigo-900 border border-indigo-200/80 shadow-sm';
    return 'bg-amber-50 text-amber-950 border border-amber-300/90 shadow-sm ring-1 ring-amber-200/60';
}

function formatPeriodLabel(pk: string, zoomLevel: ZoomLevel): string {
    if (zoomLevel === 'week') {
        const start = parseISO(pk);
        const end = addDays(start, 4);
        return `${format(start, 'd MMM', { locale: es })} – ${format(end, 'd MMM yyyy', { locale: es })}`;
    }
    const [y, m] = pk.split('-').map(Number);
    return format(new Date(y, m - 1, 1), 'MMMM yyyy', { locale: es });
}

interface GanttViewProps {
    initialViewDate?: Date;
    employeesFiltered?: Employee[];
}

/** Una celda = horas totales del empleado en ese proyecto en esa semana (o mes). */
function buildEmployeePeriodCells(
    allocations: { employeeId: string; weekStartDate: string; hoursAssigned: number; taskName?: string; status: string }[],
    projectId: string,
    periodKeys: string[],
    zoomLevel: ZoomLevel,
): Map<
    string,
    { employeeName: string; cells: Map<string, { hours: number; breakdown: CellBreakdown[] }> }
> {
    const byEmployee = new Map<
        string,
        { employeeName: string; cells: Map<string, { hours: number; breakdown: CellBreakdown[] }> }
    >();

    const periodSet = new Set(periodKeys);

    for (const a of allocations) {
        if (a.projectId !== projectId) continue;
        if (a.status === 'completed' && a.hoursAssigned === 0) continue;

        let periodKey: string;
        if (zoomLevel === 'week') {
            const monday = a.weekStartDate.slice(0, 10);
            periodKey = monday;
        } else {
            const ws = parseISO(a.weekStartDate);
            periodKey = format(ws, 'yyyy-MM');
        }
        if (!periodSet.has(periodKey)) continue;

        const empId = a.employeeId;
        if (!byEmployee.has(empId)) {
            byEmployee.set(empId, {
                employeeName: '',
                cells: new Map(),
            });
        }
        const row = byEmployee.get(empId)!;
        const taskName = a.taskName || 'Tarea';
        const prev = row.cells.get(periodKey) || { hours: 0, breakdown: [] as CellBreakdown[] };
        prev.hours += a.hoursAssigned;
        const existing = prev.breakdown.find((b) => b.taskName === taskName);
        if (existing) {
            existing.hours += a.hoursAssigned;
            if (a.status !== 'completed') existing.status = a.status;
            else if (existing.status !== 'active' && existing.status !== 'in_progress') existing.status = a.status;
        } else prev.breakdown.push({ taskName, hours: a.hoursAssigned, status: a.status });
        row.cells.set(periodKey, prev);
    }

    return byEmployee;
}

export function GanttView({ initialViewDate, employeesFiltered }: GanttViewProps) {
    const { projects, allocations, employees: allEmployees, clients } = useApp();
    const employees = employeesFiltered ?? allEmployees ?? [];
    const { formatName: formatProjectName } = useProjectAliasing();

    const [viewDate, setViewDate] = useState(initialViewDate || new Date());
    const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('week');
    const [selectedProject, setSelectedProject] = useState<string>('all');
    const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
    const [allExpanded, setAllExpanded] = useState(true);
    const [projectFilterOpen, setProjectFilterOpen] = useState(false);
    const [cellDetail, setCellDetail] = useState<{
        projectName: string;
        clientName: string;
        employeeName: string;
        periodLabel: string;
        hours: number;
        breakdown: CellBreakdown[];
    } | null>(null);

    useEffect(() => {
        if (initialViewDate) {
            setViewDate(initialViewDate);
        }
    }, [initialViewDate]);

    const dateRange = useMemo(() => {
        if (zoomLevel === 'week') {
            const start = startOfMonth(viewDate);
            const end = endOfMonth(viewDate);
            const weeks = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 });
            return {
                start: startOfWeek(start, { weekStartsOn: 1 }),
                end: endOfWeek(end, { weekStartsOn: 1 }),
                days: weeks,
            };
        }
        const start = startOfMonth(addDays(viewDate, -30));
        const end = endOfMonth(addDays(viewDate, 60));
        const months: Date[] = [];
        let current = start;
        while (current <= end) {
            months.push(current);
            current = addDays(endOfMonth(current), 1);
        }
        return { start, end, days: months };
    }, [viewDate, zoomLevel]);

    const periodKeys = useMemo(() => {
        if (zoomLevel === 'week') {
            return dateRange.days.map((d) => format(d, 'yyyy-MM-dd'));
        }
        return dateRange.days.map((d) => format(d, 'yyyy-MM'));
    }, [dateRange.days, zoomLevel]);

    const projectColors = useMemo(() => {
        const colors = [
            'bg-blue-500',
            'bg-emerald-500',
            'bg-purple-500',
            'bg-amber-500',
            'bg-rose-500',
            'bg-cyan-500',
            'bg-indigo-500',
            'bg-pink-500',
        ];
        const colorMap: Record<string, string> = {};
        projects.forEach((p, i) => {
            colorMap[p.id] = colors[i % colors.length];
        });
        return colorMap;
    }, [projects]);

    const projectBorderAccent = useMemo(() => {
        const accents = [
            'border-l-blue-500',
            'border-l-emerald-500',
            'border-l-purple-500',
            'border-l-amber-500',
            'border-l-rose-500',
            'border-l-cyan-500',
            'border-l-indigo-500',
            'border-l-pink-500',
        ];
        const map: Record<string, string> = {};
        projects.forEach((p, i) => {
            map[p.id] = accents[i % accents.length];
        });
        return map;
    }, [projects]);

    const activeProjectIds = useMemo(() => {
        const active =
            selectedProject === 'all'
                ? projects.filter((p) => p.status === 'active')
                : projects.filter((p) => p.id === selectedProject);
        return new Set(active.map((p) => p.id));
    }, [projects, selectedProject]);

    const allocationsInScope = useMemo(
        () =>
            (allocations || []).filter((a) => {
                if (!activeProjectIds.has(a.projectId)) return false;
                if (a.status === 'completed' && a.hoursAssigned === 0) return false;
                return true;
            }),
        [allocations, activeProjectIds],
    );

    const projectIdsWithData = useMemo(() => {
        const s = new Set<string>();
        allocationsInScope.forEach((a) => s.add(a.projectId));
        return Array.from(s);
    }, [allocationsInScope]);

    const employeeRowsByProject = useMemo(() => {
        const result: Record<
            string,
            Array<{
                employeeId: string;
                employeeName: string;
                cells: Map<string, { hours: number; breakdown: CellBreakdown[] }>;
                totalVisibleHours: number;
            }>
        > = {};

        for (const projectId of projectIdsWithData) {
            const raw = buildEmployeePeriodCells(allocationsInScope as never[], projectId, periodKeys, zoomLevel);
            const rows: Array<{
                employeeId: string;
                employeeName: string;
                cells: Map<string, { hours: number; breakdown: CellBreakdown[] }>;
                totalVisibleHours: number;
            }> = [];

            raw.forEach((row, employeeId) => {
                const emp = employees.find((e) => e.id === employeeId);
                const name = emp?.name || 'Sin asignar';
                let total = 0;
                periodKeys.forEach((k) => {
                    total += row.cells.get(k)?.hours ?? 0;
                });
                if (total === 0) return;
                rows.push({
                    employeeId,
                    employeeName: name,
                    cells: row.cells,
                    totalVisibleHours: total,
                });
            });
            rows.sort((a, b) => a.employeeName.localeCompare(b.employeeName, 'es'));
            result[projectId] = rows;
        }
        return result;
    }, [allocationsInScope, projectIdsWithData, periodKeys, zoomLevel, employees]);

    useEffect(() => {
        if (allExpanded) {
            setExpandedProjects(new Set(projectIdsWithData));
        }
    }, [projectIdsWithData, allExpanded]);

    const toggleProject = (projectId: string) => {
        setExpandedProjects((prev) => {
            const next = new Set(prev);
            if (next.has(projectId)) next.delete(projectId);
            else next.add(projectId);
            return next;
        });
        setAllExpanded(false);
    };

    const toggleAll = () => {
        if (allExpanded) {
            setExpandedProjects(new Set());
            setAllExpanded(false);
        } else {
            setExpandedProjects(new Set(projectIdsWithData));
            setAllExpanded(true);
        }
    };

    const handlePrev = () => {
        if (zoomLevel === 'week') {
            setViewDate((prev) => addDays(prev, -30));
        } else {
            setViewDate((prev) => addDays(prev, -90));
        }
    };

    const handleNext = () => {
        if (zoomLevel === 'week') {
            setViewDate((prev) => addDays(prev, 30));
        } else {
            setViewDate((prev) => addDays(prev, 90));
        }
    };

    const handleToday = () => setViewDate(new Date());

    return (
        <TooltipProvider>
            <div className="h-full flex flex-col bg-slate-50/30">
                <div className="flex items-center justify-between p-4 border-b bg-white shadow-sm z-20">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePrev}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={handleToday} className="h-8 text-xs px-3" aria-label="Mes actual">
                                <CalendarDays className="h-3.5 w-3.5 mr-1.5" />
                                Mes actual
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
                                <Button variant="outline" role="combobox" className="w-[220px] h-9 bg-white shadow-sm justify-between">
                                    <span className="truncate">
                                        {selectedProject === 'all'
                                            ? 'Todos los proyectos'
                                            : formatProjectName(projects.find((p) => p.id === selectedProject)?.name || 'Proyecto')}
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
                                                        'mr-2 h-4 w-4',
                                                        selectedProject === 'all' ? 'opacity-100' : 'opacity-0',
                                                    )}
                                                />
                                                Todos los proyectos
                                            </CommandItem>
                                            {projects
                                                .filter((p) => p.status === 'active')
                                                .map((p) => (
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
                                                                'mr-2 h-4 w-4',
                                                                selectedProject === p.id ? 'opacity-100' : 'opacity-0',
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
                                className={cn(
                                    'h-8 text-xs px-4 rounded-md transition-all',
                                    zoomLevel === 'week' && 'bg-white shadow-sm text-primary font-bold',
                                )}
                            >
                                Semanas
                            </Button>
                            <Button
                                variant={zoomLevel === 'month' ? 'outline' : 'ghost'}
                                size="sm"
                                onClick={() => setZoomLevel('month')}
                                className={cn(
                                    'h-8 text-xs px-4 rounded-md transition-all',
                                    zoomLevel === 'month' && 'bg-white shadow-sm text-primary font-bold',
                                )}
                            >
                                Trimestre
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="sticky top-0 z-10 shadow-sm bg-white/90 backdrop-blur-md border-b">
                    <div className="flex border-b">
                        <div className="w-72 shrink-0 p-3 border-r font-bold text-xs uppercase tracking-wider text-slate-500 bg-slate-50/50 flex items-center justify-between">
                            <span>Proyecto / Empleado</span>
                            <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]" onClick={toggleAll}>
                                {allExpanded ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
                                {allExpanded ? 'Colapsar' : 'Expandir'}
                            </Button>
                        </div>
                        <div className="flex-1 flex min-w-0">
                            {dateRange.days.map((date, i) => {
                                const isCurrentWeekCol =
                                    zoomLevel === 'week' &&
                                    format(date, 'yyyy-MM-dd') === format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
                                return (
                                    <div
                                        key={i}
                                        className={cn(
                                            'flex-1 min-w-[44px] text-center py-2 text-[10px] font-bold border-r uppercase tracking-tighter flex flex-col justify-center gap-0.5 px-0.5',
                                            isSameMonth(date, viewDate) ? 'text-slate-700' : 'text-slate-300 bg-slate-50/30',
                                            isCurrentWeekCol && 'bg-violet-50 text-violet-900 ring-1 ring-violet-200/80 ring-inset',
                                        )}
                                    >
                                        {zoomLevel === 'week' && (
                                            <>
                                                <span className={cn('opacity-80', isCurrentWeekCol ? 'text-violet-700' : 'text-primary')}>
                                                    S{i + 1}
                                                </span>
                                                <span className="font-medium text-[9px] leading-tight">{format(date, 'd MMM', { locale: es })}</span>
                                            </>
                                        )}
                                        {zoomLevel === 'month' && (
                                            <span className="text-[9px] leading-tight">{format(date, 'MMM yy', { locale: es })}</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div className="flex items-center gap-3 px-3 py-1.5 border-t border-slate-100 bg-slate-50/60 text-[10px] text-slate-500 flex-wrap">
                        <span className="flex items-center gap-1 font-medium text-slate-600 shrink-0">
                            <Info className="h-3 w-3" />
                            Carga (aprox.):
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="h-3.5 w-5 rounded border border-emerald-200 bg-emerald-50" />
                            ≤10h
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="h-3.5 w-5 rounded border border-sky-200 bg-sky-50" />
                            10–24h
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="h-3.5 w-5 rounded border border-indigo-200 bg-indigo-50" />
                            24–40h
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="h-3.5 w-5 rounded border border-amber-300 bg-amber-50" />
                            &gt;40h
                        </span>
                        <span className="text-slate-400 hidden sm:inline">| Borde izq. = color del proyecto · Clic en celda = detalle</span>
                    </div>
                </div>

                <div className="flex-1 overflow-auto custom-scrollbar bg-slate-50/20">
                    {projectIdsWithData.map((projectId) => {
                        const project = projects.find((p) => p.id === projectId);
                        const client = clients.find((c) => c.id === project?.clientId);
                        const isExpanded = expandedProjects.has(projectId);
                        const rows = employeeRowsByProject[projectId] || [];
                        const empCount = rows.length;

                        return (
                            <div key={projectId} className="border-b bg-white/50">
                                <div
                                    className="flex items-center bg-slate-100/50 backdrop-blur-sm group cursor-pointer hover:bg-slate-100/80 transition-colors"
                                    onClick={() => toggleProject(projectId)}
                                >
                                    <div className="w-72 shrink-0 p-3 border-r min-h-12 flex items-center">
                                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                                                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                            </Button>
                                            <div
                                                className={cn(
                                                    'w-3 h-3 rounded-full shadow-sm ring-2 ring-white shrink-0',
                                                    projectColors[projectId],
                                                )}
                                            />
                                            <div className="min-w-0 flex-1">
                                                <div className="font-bold text-xs text-slate-800 truncate leading-none mb-0.5">
                                                    {formatProjectName(project?.name || '')}
                                                </div>
                                                <div className="text-[9px] font-medium text-slate-500 truncate uppercase tracking-tight">
                                                    {client?.name || 'Interno'}
                                                </div>
                                            </div>
                                            <Badge variant="outline" className="text-[9px] h-5 bg-white shrink-0">
                                                {empCount} {empCount === 1 ? 'empleado' : 'empleados'}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="flex-1 min-h-12" />
                                </div>

                                {isExpanded &&
                                    rows.map((row) => (
                                        <div key={row.employeeId} className="flex items-stretch hover:bg-white transition-colors border-t border-slate-100">
                                            <div className="w-72 shrink-0 p-2 pl-10 border-r flex items-center gap-2 bg-white/80 min-h-[44px]">
                                                <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                                <div className="min-w-0 flex-1">
                                                    <div className="text-[11px] font-semibold text-slate-800 truncate">{row.employeeName}</div>
                                                    <div className="text-[10px] text-slate-500 tabular-nums font-medium">
                                                        {row.totalVisibleHours}h en periodo
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-1 min-w-0">
                                                {periodKeys.map((pk, ci) => {
                                                    const cell = row.cells.get(pk);
                                                    const h = cell?.hours ?? 0;
                                                    const isCurrentWeekCol =
                                                        zoomLevel === 'week' &&
                                                        pk === format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
                                                    const accent = projectBorderAccent[projectId] || 'border-l-slate-400';

                                                    return (
                                                        <div
                                                            key={ci}
                                                            className={cn(
                                                                'flex-1 min-w-[44px] border-r flex items-center justify-center px-0.5 py-1 min-h-[44px] bg-slate-50/40',
                                                                isCurrentWeekCol && 'bg-violet-50/70',
                                                            )}
                                                        >
                                                            {h > 0 ? (
                                                                <button
                                                                    type="button"
                                                                    className={cn(
                                                                        'w-[92%] max-w-[56px] min-h-[32px] rounded-lg flex flex-col items-center justify-center px-0.5 py-0.5 transition-all',
                                                                        'border-l-[3px] hover:brightness-[0.98] hover:shadow-md active:scale-[0.98]',
                                                                        accent,
                                                                        cellHeatmapClasses(h),
                                                                    )}
                                                                    onClick={() =>
                                                                        setCellDetail({
                                                                            projectName: formatProjectName(project?.name || ''),
                                                                            clientName: client?.name || 'Interno',
                                                                            employeeName: row.employeeName,
                                                                            periodLabel: formatPeriodLabel(pk, zoomLevel),
                                                                            hours: h,
                                                                            breakdown: [...(cell?.breakdown ?? [])].sort(
                                                                                (a, b) => b.hours - a.hours,
                                                                            ),
                                                                        })
                                                                    }
                                                                >
                                                                    <span className="text-[11px] font-bold tabular-nums leading-none">
                                                                        {Number.isInteger(h) ? h : h.toFixed(2)}
                                                                    </span>
                                                                    <span className="text-[8px] font-semibold opacity-75 leading-none mt-0.5">
                                                                        h
                                                                    </span>
                                                                </button>
                                                            ) : (
                                                                <span className="text-[9px] text-slate-300 select-none">·</span>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        );
                    })}

                    {projectIdsWithData.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-80 text-slate-400 bg-white/50 m-6 rounded-2xl border-2 border-dashed border-slate-200">
                            <CalendarDays className="h-16 w-16 mx-auto mb-4 opacity-10" />
                            <p className="font-medium text-slate-500">No hay planificación en este periodo</p>
                            <p className="text-xs text-slate-400 mt-1">Ajusta el filtro de proyecto o el rango de fechas</p>
                        </div>
                    )}
                </div>

                <Dialog open={!!cellDetail} onOpenChange={(open) => !open && setCellDetail(null)}>
                    <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="text-left pr-8">Detalle de planificación</DialogTitle>
                            <DialogDescription asChild>
                                <div className="text-left space-y-1 pt-1 text-sm text-slate-600">
                                    {cellDetail && (
                                        <>
                                            <p>
                                                <span className="font-semibold text-slate-800">{cellDetail.employeeName}</span>
                                                <span className="text-slate-400"> · </span>
                                                {cellDetail.projectName}
                                            </p>
                                            <p className="text-xs text-slate-500">{cellDetail.clientName}</p>
                                            <p className="text-xs flex items-center gap-1.5 mt-2">
                                                <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                                                {cellDetail.periodLabel}
                                            </p>
                                            <p className="flex items-center gap-2 mt-2 text-base font-bold text-slate-900">
                                                <Clock className="h-4 w-4 text-primary" />
                                                {cellDetail.hours}h planificadas
                                            </p>
                                        </>
                                    )}
                                </div>
                            </DialogDescription>
                        </DialogHeader>
                        {cellDetail && cellDetail.breakdown.length > 0 && (
                            <div className="border rounded-lg overflow-hidden">
                                <div className="grid grid-cols-[1fr_auto_auto] gap-2 px-3 py-2 bg-slate-50 text-[10px] font-bold uppercase tracking-wide text-slate-500 border-b">
                                    <span>Tarea</span>
                                    <span className="text-right">Horas</span>
                                    <span>Estado</span>
                                </div>
                                <ul className="divide-y max-h-[40vh] overflow-y-auto">
                                    {cellDetail.breakdown.map((b, idx) => (
                                        <li
                                            key={`${b.taskName}-${idx}`}
                                            className="grid grid-cols-[1fr_auto_auto] gap-2 px-3 py-2.5 text-sm items-center hover:bg-slate-50/80"
                                        >
                                            <span className="truncate font-medium text-slate-800" title={b.taskName}>
                                                {b.taskName}
                                            </span>
                                            <span className="font-mono text-sm tabular-nums text-right shrink-0">
                                                {Number.isInteger(b.hours) ? b.hours : b.hours.toFixed(2)}h
                                            </span>
                                            <Badge variant={statusBadgeVariant(b.status)} className="text-[10px] shrink-0 justify-self-end">
                                                {statusLabel(b.status)}
                                            </Badge>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        <DialogFooter className="sm:justify-end gap-2">
                            <Button type="button" variant="secondary" onClick={() => setCellDetail(null)}>
                                Cerrar
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </TooltipProvider>
    );
}
