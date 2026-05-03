import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '@/contexts/AppContext';
import { useAgency } from '@/contexts/AgencyContext';
import { useDepartmentView } from '@/contexts/DepartmentViewContext';
import { normalizeDepartments, employeeBelongsToDepartment } from '@/utils/departmentUtils';
import { supabase } from '@/lib/supabase';
import { Allocation } from '@/types';
import { format, startOfWeek, isSameDay } from 'date-fns';
import { filterEmployeesForOperationalMonth } from '@/utils/employeeAssignmentVisibility';
import { es } from 'date-fns/locale';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Loader2, Play, CheckCircle2, Circle, Clock, AlertCircle, RefreshCw, Calendar, ListTodo } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/notify';

export default function TeamPulsePage() {
    const { t } = useTranslation('app');
    const { employees, allocations, projects, clients, isLoading, refreshData } = useApp();
    const { currentAgency } = useAgency();
    const { selectedDepartmentId } = useDepartmentView();
    const [realtimeAllocations, setRealtimeAllocations] = useState<Allocation[]>([]);

    const departments = useMemo(() => normalizeDepartments(currentAgency?.settings?.departments), [currentAgency?.settings?.departments]);
    const filteredEmployees = useMemo(() => {
        if (!selectedDepartmentId || !departments.length) return employees;
        const dept = departments.find(d => d.id === selectedDepartmentId || d.name === selectedDepartmentId);
        if (!dept) return employees;
        return employees.filter(e => employeeBelongsToDepartment(e.department, dept.id, dept.name));
    }, [employees, selectedDepartmentId, departments]);

    // Sincronizar estado local con contexto inicial
    useEffect(() => {
        setRealtimeAllocations(allocations);
    }, [allocations]);

    // Suscripción Realtime
    useEffect(() => {
        const channel = supabase
            .channel('team-pulse-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'allocations' },
                (payload) => {
                    // Recargar todo para asegurar consistencia
                    refreshData(true);  // Skip loading to avoid full spinner overlap
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [refreshData]);

    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekStartStr = format(weekStart, 'yyyy-MM-dd');
    const weekMonthKey = format(weekStart, 'yyyy-MM');

    // Agrupar datos por empleado (respeta vista por departamento)
    const employeeColumns = useMemo(() => {
        return filterEmployeesForOperationalMonth(filteredEmployees ?? [], weekMonthKey, {
            allocations: realtimeAllocations,
            deadlines: [],
            globalAssignments: [],
        })
            .filter(e => e.role !== 'admin')
            .sort((a, b) => a.name.localeCompare(b.name)) // Orden alfabético
            .map(employee => {
                // Tareas de este empleado para esta semana
                const empAllocations = realtimeAllocations.filter(a =>
                    a.employeeId === employee.id &&
                    (a.weekStartDate === weekStartStr ||
                        // Incluir tareas activas aunque sean de semanas pasadas (rollover implícito visual)
                        a.status === 'active')
                );

                const activeTask = empAllocations.find(a => a.status === 'active');

                // Completadas (Idealmente filtraríamos por completed_at === today, 
                // por ahora usamos completadas de la semana como fallback v4)
                const completedTasks = empAllocations
                    .filter(a => a.status === 'completed')
                    .sort((a, b) => (b.hoursActual || 0) - (a.hoursActual || 0)); // Ordenar por esfuerzo? O updated_at si lo tuviéramos

                const pendingTasks = empAllocations
                    .filter(a => a.status === 'planned')
                    .sort((a, b) => (a.userPriority || 999) - (b.userPriority || 999));

                return {
                    employee,
                    activeTask,
                    completedTasks,
                    pendingTasks,
                    // Estado general
                    status: activeTask ? 'busy' : 'idle'
                };
            });
    }, [filteredEmployees, realtimeAllocations, weekStartStr, weekMonthKey]);

    const getProjectName = (projectId: string) => {
        const p = projects.find(pr => pr.id === projectId);
        return p?.name || 'Desconocido';
    };

    const getClientColor = (projectId: string) => {
        const p = projects.find(pr => pr.id === projectId);
        if (!p) return '#cbd5e1';
        const c = clients.find(cl => cl.id === p.clientId);
        return c?.color || '#cbd5e1';
    };

    if (isLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-primary h-8 w-8" /></div>;

    return (
        <div className="h-[calc(100vh-4rem)] p-4 bg-slate-50 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4 px-2">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Calendar className="h-6 w-6 text-slate-400" />
                        {t('team.pulse.dailySummary', 'Resumen Diario')}
                    </h1>
                    <p className="text-slate-500 text-sm">{t('team.pulse.teamProgress', 'Progreso del equipo hoy')}</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => refreshData(true)} disabled={isLoading}>
                        <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                        {t('team.pulse.update', 'Actualizar')}
                    </Button>
                </div>
            </div>

            {/* Grid Horizontal con Scroll */}
            <div className="flex-1 overflow-x-auto pb-4 custom-scrollbar">
                <div className="flex gap-4 min-w-max h-full px-2">
                    {employeeColumns.map(({ employee, completedTasks, pendingTasks }) => {
                        const totalHours = completedTasks.reduce((s, t) => s + (t.hoursActual || t.hoursAssigned || 0), 0);
                        const capacity = (employee.defaultWeeklyCapacity || 40) / 5;
                        const progress = Math.min((totalHours / capacity) * 100, 100);

                        return (
                            <div
                                key={employee.id}
                                className="w-72 flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-full transition-all hover:shadow-md"
                            >
                                {/* Header Empleado */}
                                <div className="p-4 border-b bg-slate-50/30">
                                    <div className="flex items-center gap-3 mb-3">
                                        <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                                            <AvatarImage src={employee.avatarUrl} />
                                            <AvatarFallback>{employee.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0">
                                            <h3 className="font-bold text-slate-800 truncate leading-tight">{employee.name}</h3>
                                            <p className="text-xs text-slate-500">{t('team.pulse.completedTasks', { count: completedTasks.length, defaultValue: '{{count}} tareas completadas' })}</p>
                                        </div>
                                    </div>

                                    {/* Barra de Progreso Discreta */}
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs font-medium text-slate-500">
                                            <span>{totalHours.toFixed(1)}h</span>
                                            <span className="text-slate-400">/ {capacity}h</span>
                                        </div>
                                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-slate-800 rounded-full transition-all duration-500"
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Scrollable Content Area */}
                                <ScrollArea className="flex-1">
                                    <div className="p-3 space-y-6">

                                        {/* 2. COMPLETADAS (Log) */}
                                        {completedTasks.length > 0 && (
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between text-xs text-slate-400 font-medium uppercase tracking-wider px-1">
                                                    <span>{t('team.pulse.dailyLog', { count: completedTasks.length, defaultValue: 'Log Hoy ({{count}})' })}</span>
                                                    <span>{completedTasks.reduce((s, t) => s + (t.hoursActual || 0), 0).toFixed(1)}h</span>
                                                </div>
                                                <div className="space-y-1.5 opacity-75 grayscale hover:grayscale-0 transition-all">
                                                    {completedTasks.map(task => (
                                                        <div key={task.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded border border-slate-100 text-xs">
                                                            <CheckCircle2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                                            <span className="truncate flex-1 text-slate-500 line-through decoration-slate-300">
                                                                {task.taskName}
                                                            </span>
                                                            <span className="font-mono text-slate-400 shrink-0">
                                                                {task.hoursActual}h
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* 3. PENDIENTES (Cola) */}
                                        <div className="space-y-2">
                                            <div className="text-xs text-slate-400 font-medium uppercase tracking-wider px-1 flex items-center gap-2">
                                                <AlertCircle className="h-3 w-3" />
                                                {t('team.pulse.queue', { count: pendingTasks.length, defaultValue: 'Cola ({{count}})' })}
                                            </div>
                                            <div className="space-y-2">
                                                {pendingTasks.length === 0 ? (
                                                    <div className="text-center py-4 text-xs text-slate-300 italic">
                                                        {t('team.pulse.nothingInQueue', 'Nada en cola')}
                                                    </div>
                                                ) : (
                                                    pendingTasks.map(task => (
                                                        <div key={task.id} className="p-2 border border-slate-100 rounded bg-white shadow-sm flex gap-2 items-start group hover:border-indigo-200 transition-colors">
                                                            <div className="w-1 h-8 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: getClientColor(task.projectId) }} />
                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-xs text-slate-700 font-medium leading-snug line-clamp-2 group-hover:text-indigo-900">
                                                                    {task.taskName}
                                                                </p>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <span className="text-[10px] text-slate-400 truncate max-w-[100px]">
                                                                        {getProjectName(task.projectId)}
                                                                    </span>
                                                                    <span className="text-[10px] bg-slate-100 text-slate-500 px-1 rounded font-mono ml-auto">
                                                                        {task.hoursAssigned}h
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>

                                    </div>
                                </ScrollArea>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
