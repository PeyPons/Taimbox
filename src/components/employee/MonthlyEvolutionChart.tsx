
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
                // Verificar fecha de semana (usando string exacto o lógica de fecha)
                if (a.weekStartDate !== storageKey && a.weekStartDate !== week.weekStart.toISOString().split('T')[0]) return false;

                // Verificar si pertenece al mes (aunque si usamos weeks del mes, ya debería)
                return isAllocationInEffectiveMonth(a.weekStartDate, currentMonth);
            });

            const totalAssigned = weekAllocations.reduce((sum, a) => sum + a.hoursAssigned, 0);
            const totalReal = weekAllocations.reduce((sum, a) => sum + (a.hoursActual || 0), 0);
            const totalCompleted = weekAllocations.filter(a => a.status === 'completed').length;

            return {
                weekLabel: `Sem ${index + 1}`,
                dateRange: `${format(week.weekStart, 'd MMM', { locale: es })}`,
                totalAssigned,
                totalReal,
                totalCompleted,
                isCurrent: new Date() >= week.weekStart && new Date() <= addDays(week.weekStart, 6)
            };
        });
    }, [weeks, allocations, currentMonth]);

    const maxHours = Math.max(...weeklyData.map(d => Math.max(d.totalAssigned, d.totalReal)), 10);

    return (
        <Card className={cn("border shadow-sm", className)}>
            <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-indigo-600" />
                    Evolución Mensual
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[180px] flex items-end justify-between gap-4 mt-2">
                    {weeklyData.map((data, i) => {
                        const heightAssigned = (data.totalAssigned / maxHours) * 100;
                        const heightReal = (data.totalReal / maxHours) * 100;

                        return (
                            <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                                <div className="w-full flex items-end justify-center gap-1 h-[140px] relative">
                                    {/* Barra Asignada */}
                                    <div
                                        className={cn(
                                            "w-3 sm:w-6 bg-indigo-200 rounded-t transition-all hover:bg-indigo-300 relative",
                                            data.isCurrent && "bg-indigo-300 ring-2 ring-indigo-100"
                                        )}
                                        style={{ height: `${Math.max(heightAssigned, 2)}%` }}
                                    >
                                        <span className="opacity-0 group-hover:opacity-100 absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold bg-slate-800 text-white px-1.5 py-0.5 rounded z-10 whitespace-nowrap">
                                            {data.totalAssigned.toFixed(0)}h est
                                        </span>
                                    </div>

                                    {/* Barra Real */}
                                    <div
                                        className={cn(
                                            "w-3 sm:w-6 bg-indigo-600 rounded-t transition-all hover:bg-indigo-700 relative",
                                            data.isCurrent && "bg-indigo-500"
                                        )}
                                        style={{ height: `${Math.max(heightReal, 2)}%` }}
                                    >
                                        <span className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 -translate-x-1/2 text-[10px] font-bold bg-slate-800 text-white px-1.5 py-0.5 rounded z-10 whitespace-nowrap">
                                            {data.totalReal.toFixed(0)}h real
                                        </span>
                                    </div>
                                </div>

                                {/* Labels */}
                                <div className="text-center mt-2">
                                    <p className={cn("text-[10px] font-bold uppercase", data.isCurrent ? "text-indigo-600" : "text-slate-500")}>
                                        {data.weekLabel}
                                    </p>
                                    <p className="text-[9px] text-slate-400 hidden sm:block">
                                        {data.dateRange}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="flex justify-center gap-6 mt-4 text-[10px] text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-sm bg-indigo-200" />
                        <span>Horas Estimadas</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-sm bg-indigo-600" />
                        <span>Horas Reales</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
