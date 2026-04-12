import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, CalendarDays, BarChartIcon, Gauge, Link2, ArrowRight } from 'lucide-react';
import { format, startOfMonth, subMonths, addMonths, parseISO, isSameDay, endOfMonth, differenceInWeeks, isSameMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { SensitiveText } from '@/components/privacy/SensitiveText';
import { getWeeksForMonth, isAllocationInEffectiveMonth } from '@/utils/dateUtils';
import { getAbsenceHoursInRange } from '@/utils/absenceUtils';
import { getTeamEventHoursInRange } from '@/utils/teamEventUtils';
import { WorkSchedule, Allocation, Employee } from '@/types';

const round2 = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

export default function TeamCapacityDashboard() {
    const { t } = useTranslation('app');
    const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
    const { employees, allocations, absences, teamEvents, projects, ensureMonthLoaded } = useApp();

    const handlePrevMonth = () => setCurrentMonth(prev => subMonths(prev, 1));
    const handleNextMonth = () => setCurrentMonth(prev => addMonths(prev, 1));
    const handleToday = () => setCurrentMonth(startOfMonth(new Date()));

    useEffect(() => {
        void ensureMonthLoaded(currentMonth);
    }, [currentMonth, ensureMonthLoaded]);

    const monthAllocations = useMemo(() => {
        return (allocations || []).filter(a => {
            try {
                const start = parseISO(a.weekStartDate);
                return isSameMonth(start, currentMonth) ||
                    (startOfMonth(start) < startOfMonth(currentMonth) && a.status !== 'completed'); // Tareas pasadas no completadas
            } catch {
                return false;
            }
        });
    }, [allocations, currentMonth]);

    // Alertas de dependencias bloqueadas
    const blockedDependencies = useMemo(() => {
        const blocked: Array<{
            blockedTask: any;
            blockedTaskName: string;
            blockedEmployee: string;
            blockerTask: any;
            blockerTaskName: string;
            blockerEmployee: string;
            weeksSinceBlocked: number;
            projectName: string;
        }> = [];

        // Buscar tareas del mes que tienen dependencias no completadas
        monthAllocations.forEach(task => {
            if (task.dependencyId && task.status !== 'completed') {
                const blockerTask = (allocations || []).find(a => a.id === task.dependencyId);
                if (blockerTask && blockerTask.status !== 'completed') {
                    const blockedEmployee = employees.find(e => e.id === task.employeeId);
                    const blockerEmployee = employees.find(e => e.id === blockerTask.employeeId);
                    const project = (projects || []).find(p => p.id === task.projectId);

                    const blockerWeekDate = parseISO(blockerTask.weekStartDate);
                    const referenceDate = isSameMonth(new Date(), currentMonth) ? new Date() : endOfMonth(currentMonth);
                    const weeksSince = Math.max(0, differenceInWeeks(referenceDate, blockerWeekDate));

                    blocked.push({
                        blockedTask: task,
                        blockedTaskName: task.taskName || 'Tarea sin nombre',
                        blockedEmployee: blockedEmployee?.name || 'Desconocido',
                        blockerTask: blockerTask,
                        blockerTaskName: blockerTask.taskName || 'Tarea sin nombre',
                        blockerEmployee: blockerEmployee?.name || 'Desconocido',
                        weeksSinceBlocked: weeksSince,
                        projectName: project?.name || 'Proyecto desconocido'
                    });
                }
            }
        });

        // Ordenar por semanas bloqueadas (más antiguas primero)
        return blocked.sort((a, b) => b.weeksSinceBlocked - a.weeksSinceBlocked);
    }, [monthAllocations, allocations, employees, projects, currentMonth]);

    // Mapa de calor: carga semanal por empleado
    const heatmapData = useMemo(() => {
        // Obtener todas las semanas del mes actual
        const weeks = getWeeksForMonth(currentMonth);

        return (employees ?? []).filter(e => e.isActive).map(emp => {
            // Obtener ausencias del empleado para el mes actual
            const employeeAbsences = (absences || []).filter(a => a.employeeId === emp.id);

            const weeklyLoad = weeks.map((week, index) => {
                const weekStr = format(week.weekStart, 'yyyy-MM-dd');

                // Buscar allocations que coincidan con esta semana y estén en el mes efectivo
                const weekAllocations = (allocations || []).filter(a => {
                    try {
                        const allocationWeekDate = parseISO(a.weekStartDate);
                        return a.employeeId === emp.id &&
                            isSameDay(allocationWeekDate, week.weekStart) &&
                            isAllocationInEffectiveMonth(a.weekStartDate, currentMonth);
                    } catch {
                        return false;
                    }
                });

                const hoursPlanned = round2(weekAllocations.reduce((sum, a) => sum + a.hoursAssigned, 0));

                // Capacidad semanal basada en los días laborables de esta semana
                const workingDays = week.effectiveEnd.getDate() - week.effectiveStart.getDate() + 1;
                const actualWorkingDays = Math.min(workingDays, 5);
                const baseWeeklyCapacity = (emp.workSchedule as any)?.defaultHoursPerDay
                    ? (emp.workSchedule as any).defaultHoursPerDay * actualWorkingDays
                    : 40 * (actualWorkingDays / 5);

                // Restar ausencias de esta semana
                const weekAbsenceHours = getAbsenceHoursInRange(
                    week.effectiveStart,
                    week.effectiveEnd,
                    employeeAbsences,
                    emp.workSchedule || ({} as WorkSchedule)
                );

                // Restar eventos del equipo de esta semana
                const weekEventHours = getTeamEventHoursInRange(
                    week.effectiveStart,
                    week.effectiveEnd,
                    emp.id,
                    teamEvents || [],
                    emp.workSchedule || ({} as WorkSchedule),
                    employeeAbsences
                );

                // Capacidad disponible después de restar ausencias y eventos
                const availableCapacity = Math.max(0, baseWeeklyCapacity - weekAbsenceHours - weekEventHours);

                const percentage = availableCapacity > 0 ? (hoursPlanned / availableCapacity) * 100 : 0;

                return {
                    week: weekStr,
                    weekLabel: `Sem ${index + 1}`,
                    hours: hoursPlanned,
                    capacity: availableCapacity,
                    baseCapacity: baseWeeklyCapacity,
                    absenceHours: weekAbsenceHours,
                    eventHours: weekEventHours,
                    percentage
                };
            });

            return {
                employeeId: emp.id,
                employeeName: emp.name,
                weeklyLoad
            };
        });
    }, [employees, allocations, currentMonth, absences, teamEvents]);

    const averageLoad = useMemo(() => {
        if (!heatmapData || heatmapData.length === 0) return 0;
        let totalHours = 0;
        let totalCapacity = 0;

        heatmapData.forEach(emp => {
            emp.weeklyLoad.forEach(week => {
                totalHours += week.hours;
                totalCapacity += week.capacity;
            });
        });

        return totalCapacity > 0 ? (totalHours / totalCapacity) * 100 : 0;
    }, [heatmapData]);

    return (
        <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        <Users className="h-6 w-6 text-indigo-600" />
                        {t('teamCapacityDashboard.title', 'Capacidad de Equipo')}
                    </h1>
                    <p className="text-slate-500 mt-1">
                        {t('teamCapacityDashboard.subtitle', 'Mapa de calor pasivo y análisis de cuellos de botella.')}
                    </p>
                </div>
                <div className="flex items-center gap-2 bg-white rounded-lg border p-1 shadow-sm shrink-0">
                    <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="h-8 w-8 text-slate-500">
                        <span className="sr-only">{t('teamCapacityDashboard.controls.prevMonth', 'Mes anterior')}</span>
                        &lt;
                    </Button>
                    <Button variant="ghost" onClick={handleToday} className="h-8 px-3 text-sm font-medium text-slate-700 capitalize">
                        {format(currentMonth, 'MMM yyyy', { locale: es })}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={handleNextMonth} className="h-8 w-8 text-slate-500">
                        <span className="sr-only">{t('teamCapacityDashboard.controls.nextMonth', 'Mes siguiente')}</span>
                        &gt;
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {/* KPIs Rápidos */}
                <Card className={cn("shadow-sm border-l-4", averageLoad > 100 ? "border-amber-500 bg-amber-50/30" : "border-emerald-500 bg-emerald-50/30")}>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">{t('teamCapacityDashboard.kpis.averageLoad.title', 'Ocupación Media (Mes)')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold flex items-center gap-2 relative z-10">
                            {averageLoad.toFixed(1)}%
                        </div>
                        <p className="text-xs text-slate-500 mt-1 relative z-10">{t('teamCapacityDashboard.kpis.averageLoad.subtitle', 'Capacidad planificada vs disponible')}</p>
                    </CardContent>
                </Card>

                {/* KPI: Tareas bloqueadas */}
                <Card className={cn("shadow-sm border-l-4", blockedDependencies.length > 0 ? "border-orange-500 bg-orange-50/30" : "border-emerald-500 bg-emerald-50/30")}>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">{t('teamCapacityDashboard.kpis.bottlenecks.title', 'Cuellos de Botella')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold flex items-center gap-2 relative z-10">
                            {blockedDependencies.length}
                        </div>
                        <p className="text-xs text-slate-500 mt-1 relative z-10">{t('teamCapacityDashboard.kpis.bottlenecks.subtitle', 'Tareas bloqueadas por dependencias')}</p>
                    </CardContent>
                </Card>

                {/* Heatmap Section */}
                <Card className="col-span-full shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CalendarDays className="h-5 w-5 text-indigo-500" />
                            {t('teamCapacityDashboard.heatmap.title', 'Mapa de Calor Semanal')}
                        </CardTitle>
                        <CardDescription>
                            {t('teamCapacityDashboard.heatmap.description', 'Visualización rápida de quién está sobrecargado o disponible.')}
                            <span className="ml-2 mt-2 sm:mt-0 inline-flex items-center gap-1 flex-wrap text-[10px] sm:text-xs">
                                <span className="h-2 w-2 rounded bg-emerald-500" /> {t('teamCapacityDashboard.heatmap.legend.optimal', 'Óptimo (50-80%)')}
                                <span className="h-2 w-2 rounded bg-emerald-600 ml-1 sm:ml-2" /> {t('teamCapacityDashboard.heatmap.legend.high', 'Alto (80-100%)')}
                                <span className="h-2 w-2 rounded bg-amber-500 ml-1 sm:ml-2" /> {t('teamCapacityDashboard.heatmap.legend.veryHigh', 'Muy alto (100-120%)')}
                                <span className="h-2 w-2 rounded bg-red-500 ml-1 sm:ml-2" /> {t('teamCapacityDashboard.heatmap.legend.overloaded', 'Sobrecargado (+120%)')}
                                <span className="h-2 w-2 rounded bg-blue-200 ml-1 sm:ml-2" /> {t('teamCapacityDashboard.heatmap.legend.low', 'Bajo (<50%)')}
                            </span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {heatmapData.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <p>{t('teamCapacityDashboard.heatmap.emptyState', 'No hay datos para mostrar')}</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left py-2 px-3 font-medium text-muted-foreground w-28 sm:w-40">{t('teamCapacityDashboard.heatmap.columns.employee', 'Empleado')}</th>
                                            {heatmapData[0]?.weeklyLoad.map(week => (
                                                <th key={week.week} className="text-center py-2 px-2 font-medium text-muted-foreground min-w-[70px] sm:min-w-[90px]">
                                                    {week.weekLabel}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {heatmapData.map(row => (
                                            <tr key={row.employeeId} className="border-b hover:bg-slate-50 transition-colors">
                                                <td className="py-2 px-3 font-medium">
                                                    <SensitiveText kind="employee" id={row.employeeId}>{row.employeeName}</SensitiveText>
                                                </td>
                                                {row.weeklyLoad.map(week => (
                                                    <td key={week.week} className="py-2 px-2 text-center">
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <div
                                                                        className={cn(
                                                                            "h-10 w-full rounded flex flex-col items-center justify-center text-xs font-medium transition-all cursor-help border",
                                                                            week.percentage === 0 && "bg-slate-50 text-slate-400 border-slate-200",
                                                                            week.percentage > 0 && week.percentage < 50 && "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
                                                                            week.percentage >= 50 && week.percentage < 80 && "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
                                                                            week.percentage >= 80 && week.percentage <= 100 && "bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-600",
                                                                            week.percentage > 100 && week.percentage <= 120 && "bg-amber-500 text-white border-amber-600 hover:bg-amber-600",
                                                                            week.percentage > 120 && "bg-red-500 text-white border-red-600 hover:bg-red-600"
                                                                        )}
                                                                    >
                                                                        {week.hours > 0 ? (
                                                                            <>
                                                                                <span className="font-semibold">{week.hours}h</span>
                                                                                <span className="text-[10px] opacity-90 mt-0.5">
                                                                                    {week.percentage.toFixed(0)}%
                                                                                </span>
                                                                            </>
                                                                        ) : (
                                                                            <span className="text-slate-400">-</span>
                                                                        )}
                                                                    </div>
                                                                </TooltipTrigger>
                                                                <TooltipContent className="max-w-xs">
                                                                    <p className="font-medium mb-1">
                                                                        <SensitiveText kind="employee" id={row.employeeId}>{row.employeeName}</SensitiveText>
                                                                        {' '}- {week.weekLabel}
                                                                    </p>
                                                                    <div className="space-y-0.5 text-xs">
                                                                        <p><span className="font-medium">{t('teamCapacityDashboard.heatmap.tooltip.assignedHours', 'Horas asignadas:')}</span> {week.hours}h</p>
                                                                        <p><span className="font-medium">{t('teamCapacityDashboard.heatmap.tooltip.weeklyCapacity', 'Capacidad semanal:')}</span> {week.capacity}h</p>
                                                                        <p><span className="font-medium">{t('teamCapacityDashboard.heatmap.tooltip.occupancy', 'Ocupación:')}</span> {week.percentage.toFixed(1)}%</p>
                                                                        {week.percentage === 0 && (
                                                                            <p className="text-slate-500 mt-1">{t('teamCapacityDashboard.heatmap.tooltip.noAssignments', 'Sin asignaciones esta semana')}</p>
                                                                        )}
                                                                        {week.percentage > 0 && week.percentage < 50 && (
                                                                            <p className="text-blue-600 mt-1">{t('teamCapacityDashboard.heatmap.tooltip.lowLoad', 'Carga baja - Capacidad disponible')}</p>
                                                                        )}
                                                                        {week.percentage >= 50 && week.percentage < 80 && (
                                                                            <p className="text-emerald-600 mt-1">{t('teamCapacityDashboard.heatmap.tooltip.optimalLoad', 'Carga óptima')}</p>
                                                                        )}
                                                                        {week.percentage >= 80 && week.percentage <= 100 && (
                                                                            <p className="text-emerald-700 mt-1">{t('teamCapacityDashboard.heatmap.tooltip.highLoad', 'Carga alta - Cerca del límite')}</p>
                                                                        )}
                                                                        {week.percentage > 100 && week.percentage <= 120 && (
                                                                            <p className="text-amber-700 mt-1">{t('teamCapacityDashboard.heatmap.tooltip.moderateOverload', '⚠️ Sobrecarga moderada')}</p>
                                                                        )}
                                                                        {week.percentage > 120 && (
                                                                            <p className="text-red-700 mt-1">{t('teamCapacityDashboard.heatmap.tooltip.criticalOverload', '🚨 Sobrecarga crítica')}</p>
                                                                        )}
                                                                    </div>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Dependencias Bloqueadas */}
                {blockedDependencies.length > 0 && (
                    <Card className="col-span-full border-l-4 border-l-orange-400">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Link2 className="h-5 w-5 text-orange-500" />
                                {t('teamCapacityDashboard.blockedTasks.title', 'Tareas bloqueadas por dependencias')}
                                <Badge variant="secondary" className="ml-2">{blockedDependencies.length}</Badge>
                            </CardTitle>
                            <CardDescription>
                                {t('teamCapacityDashboard.blockedTasks.subtitle', 'Tareas que no pueden avanzar hasta que se complete su dependencia')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {blockedDependencies.slice(0, 5).map((dep, idx) => (
                                    <div
                                        key={`${dep.blockedTask.id}-${idx}`}
                                        className={cn(
                                            "p-3 rounded-lg border",
                                            dep.weeksSinceBlocked >= 2 && "bg-red-50 border-red-200",
                                            dep.weeksSinceBlocked === 1 && "bg-amber-50 border-amber-200",
                                            dep.weeksSinceBlocked === 0 && "bg-slate-50 border-slate-200"
                                        )}
                                    >
                                        <div className="flex items-center gap-2 text-sm">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-orange-700 truncate">
                                                        <SensitiveText kind="task" id={dep.blockerTask.id}>{dep.blockerTaskName}</SensitiveText>
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        (
                                                        <SensitiveText kind="employee" id={dep.blockerTask.employeeId}>{dep.blockerEmployee}</SensitiveText>
                                                        )
                                                    </span>
                                                </div>
                                            </div>
                                            <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="truncate">
                                                        <SensitiveText kind="task" id={dep.blockedTask.id}>{dep.blockedTaskName}</SensitiveText>
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        (
                                                        <SensitiveText kind="employee" id={dep.blockedTask.employeeId}>{dep.blockedEmployee}</SensitiveText>
                                                        )
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center mt-2">
                                            <span className="text-xs text-muted-foreground">
                                                <SensitiveText kind="project" id={dep.blockedTask.projectId}>{dep.projectName}</SensitiveText>
                                            </span>
                                            {dep.weeksSinceBlocked > 0 && (
                                                <Badge
                                                    variant={dep.weeksSinceBlocked >= 2 ? 'destructive' : 'secondary'}
                                                    className="text-xs"
                                                >
                                                    {dep.weeksSinceBlocked} {dep.weeksSinceBlocked === 1 ? t('teamCapacityDashboard.blockedTasks.waitingWeek', 'semana esperando') : t('teamCapacityDashboard.blockedTasks.waitingWeeks', 'semanas esperando')}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {blockedDependencies.length > 5 && (
                                    <p className="text-xs text-muted-foreground text-center pt-2">
                                        {t('teamCapacityDashboard.blockedTasks.moreBlocked', { count: blockedDependencies.length - 5, defaultValue: `+${blockedDependencies.length - 5} tareas bloqueadas más` })}
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
