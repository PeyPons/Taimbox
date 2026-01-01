
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Calendar, Clock } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { getStorageKey, isAllocationInEffectiveMonth } from '@/utils/dateUtils';
import { cn } from '@/lib/utils';
import { Allocation, Project, Employee, WeekData } from '@/types';

interface MonthlyEvolutionChartProps {
    currentMonth: Date;
    weeks: WeekData[];
    allocations: Allocation[];
    projects: Project[];
    employees: Employee[];
    className?: string;
}

export function MonthlyEvolutionChart({
    currentMonth,
    weeks,
    allocations,
    projects,
    employees,
    className
}: MonthlyEvolutionChartProps) {

    const weeklyData = useMemo(() => {
        return weeks.map((week, index) => {
            const storageKey = getStorageKey(week.weekStart, currentMonth);

            // Filtrar allocations de esta semana que pertenezcan al mes efectivo
            const weekAllocations = allocations.filter(a => {
                if (a.weekStartDate !== storageKey && a.weekStartDate !== week.weekStart.toISOString().split('T')[0]) return false;
                return isAllocationInEffectiveMonth(a.weekStartDate, currentMonth);
            });

            // PLANIFICADO: Todo lo asignado en la semana (completado o no)
            const totalPlanned = weekAllocations.reduce((sum, a) => sum + a.hoursAssigned, 0);

            // COMPUTADO: Solo lo asignado de tareas COMPLETADAS (lo que se factura/gana)
            // Asumimos que al completar se computan las horas asignadas originales (valor entregado)
            // Si existe un campo explícito hoursComputed, úsalo, si no, fallback a hoursAssigned
            const totalComputed = weekAllocations
                .filter(a => a.status === 'completed')
                .reduce((sum, a) => sum + (a.hoursAssigned), 0);

            // EXPLICACIÓN "TIEMPO GANADO":
            // El usuario quiere ver "cuánto tiempo hemos ganado".
            // Si Computado (lo entregado) es X, y Planificado es Y.
            // visualmente se verá el progreso de entrega frente a lo previsto.

            return {
                weekLabel: `Sem ${index + 1}`,
                dateRange: `${format(week.weekStart, 'd MMM', { locale: es })}`,
                totalPlanned,
                totalComputed,
                isCurrent: new Date() >= week.weekStart && new Date() <= addDays(week.weekStart, 6)
            };
        });
    }, [weeks, allocations, currentMonth]);

    const maxHours = Math.max(...weeklyData.map(d => Math.max(d.totalPlanned, d.totalComputed)), 10);

    return (
        <Card className={cn("border shadow-md bg-white", className)}>
            <CardHeader className="pb-2 border-b bg-slate-50/50">
                <CardTitle className="text-sm font-semibold flex items-center justify-between text-slate-700">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-emerald-600" />
                        Evolución Mensual (Valor Entregado)
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
                <div className="h-[180px] flex items-end justify-between gap-2 sm:gap-4 mt-2 px-2">
                    {weeklyData.map((data, i) => {
                        const heightPlanned = (data.totalPlanned / maxHours) * 100;
                        const heightComputed = (data.totalComputed / maxHours) * 100;

                        return (
                            <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                                <div className="w-full flex items-end justify-center gap-1 sm:gap-1.5 h-[140px] relative px-1">
                                    {/* Barra Planificada (Fondo / Referencia) */}
                                    <div
                                        className={cn(
                                            "w-2.5 sm:w-5 bg-slate-200 rounded-t transition-all relative",
                                            data.isCurrent && "bg-slate-300 ring-1 ring-slate-200"
                                        )}
                                        style={{ height: `${Math.max(heightPlanned, 4)}%` }}
                                    >
                                        <span className="opacity-0 group-hover:opacity-100 absolute -top-12 left-1/2 -translate-x-1/2 text-[10px] bg-slate-800 text-white px-1.5 py-1 rounded z-20 whitespace-nowrap shadow-sm">
                                            Plan: {data.totalPlanned.toFixed(0)}h
                                        </span>
                                    </div>

                                    {/* Barra Computada (Valor Real/Facturable) */}
                                    <div
                                        className={cn(
                                            "w-2.5 sm:w-5 bg-emerald-500 rounded-t transition-all hover:bg-emerald-600 relative",
                                            data.isCurrent && "bg-emerald-400 ring-2 ring-emerald-100"
                                        )}
                                        style={{ height: `${Math.max(heightComputed, 4)}%` }}
                                    >
                                        <span className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] font-bold bg-emerald-700 text-white px-1.5 py-1 rounded z-30 whitespace-nowrap shadow-sm">
                                            {data.totalComputed.toFixed(0)}h OK
                                        </span>
                                    </div>
                                </div>

                                {/* Labels */}
                                <div className="text-center mt-3 pb-1">
                                    <p className={cn("text-[9px] font-bold uppercase tracking-wider mb-0.5", data.isCurrent ? "text-indigo-600" : "text-slate-500")}>
                                        {data.weekLabel}
                                    </p>
                                    <p className="text-[9px] text-slate-400 scale-90 sm:scale-100 whitespace-nowrap">
                                        {data.dateRange}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="flex justify-center gap-6 mt-6 border-t pt-4 text-[10px] text-slate-500 uppercase tracking-wide font-medium">
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-sm bg-slate-300" />
                        <span>Planificado</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                        <span>Computado (Facturable)</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
