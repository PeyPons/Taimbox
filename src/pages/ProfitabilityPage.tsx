import { useState, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, cn, formatProjectName } from '@/lib/utils';
import { format, startOfMonth, endOfMonth, isSameMonth, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarDays, TrendingUp, AlertCircle, DollarSign, Clock } from 'lucide-react';

export default function ProfitabilityPage() {
    const { projects, clients, allocations, isLoading } = useApp();
    const [currentMonth, setCurrentMonth] = useState(new Date());

    // Filtrar proyectos activos (o que tengan actividad este mes)
    // Calculamos los datos de rentabilidad por proyecto
    const profitabilityData = useMemo(() => {
        if (isLoading) return [];

        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(currentMonth);

        // 1. Identificar proyectos relevantes (activos o con horas imputadas este mes)
        // Filtramos proyectos que están 'active' o 'completed' pero tienen horas en el mes
        const activeProjects = projects.filter(p => p.status !== 'archived' && !p.isHidden);

        return activeProjects.map(project => {
            const client = clients.find(c => c.id === project.clientId);

            // Datos base
            const revenue = project.monthlyFee || 0;
            const budgetHours = project.budgetHours || 0;

            // Precio hora teórico (venta)
            const targetHourlyRate = budgetHours > 0 ? revenue / budgetHours : 0;

            // Horas computadas del mes (Realizadas y Completadas)
            // Se suman las horas de las allocations que caen en este mes
            // IMPORTANTE: Según la lógica de "Computed", sumamos hoursAssigned de tareas COMPLETADAS
            // O si existe hoursComputed explícito.
            const monthAllocations = allocations.filter(a => {
                if (a.projectId !== project.id) return false;

                // Verificar si la tarea cae en el mes
                const allocDate = parseISO(a.weekStartDate);
                // Ajuste simple: si la weekStartDate está en el mes (o la semana solapa)
                // Para simplificar "mes fiscal", usamos weekStartDate en el mes
                return isSameMonth(allocDate, currentMonth);
            });

            const computedHours = monthAllocations.reduce((sum, a) => {
                if (a.status === 'completed') {
                    return sum + (a.hoursComputed || a.hoursAssigned || 0);
                }
                return sum;
            }, 0);

            // Métricas derivadas
            const efficiencyPercentage = budgetHours > 0 ? (computedHours / budgetHours) * 100 : 0;

            // Precio hora efectivo (Real) -> Si he trabajado más horas de las vendidas, mi precio baja
            // Si computedHours es 0, el precio es infinito (o el revenue íntegro)
            const effectiveHourlyRate = computedHours > 0 ? revenue / computedHours : revenue;

            // Estado de rentabilidad
            // Si consumimos MENOS del 100% del presupuesto -> Rentable (Green) (estamos entregando en menos tiempo)
            // Si consumimos MÁS -> "Se diluye el margen" (Red/Amber)
            let status: 'optimum' | 'good' | 'warning' | 'danger' = 'good';

            if (budgetHours > 0) {
                if (efficiencyPercentage > 110) status = 'danger';
                else if (efficiencyPercentage > 100) status = 'warning';
                else if (efficiencyPercentage > 80) status = 'good'; // Cerca del presupuesto
                else status = 'optimum'; // Muy por debajo (muy rentable por hora, aunque ojo con under-delivery)
            } else {
                // Si no hay presupuesto de horas pero hay revenue y horas trabajadas
                status = 'good';
            }

            return {
                id: project.id,
                name: project.name,
                clientName: client?.name || 'Sin Cliente',
                clientColor: client?.color,
                revenue,
                budgetHours,
                targetHourlyRate,
                computedHours,
                efficiencyPercentage,
                effectiveHourlyRate,
                status
            };
        }).sort((a, b) => b.revenue - a.revenue); // Ordenar por revenue descendente por defecto

    }, [projects, clients, allocations, currentMonth, isLoading]);

    // Totales generales
    const totals = useMemo(() => {
        return profitabilityData.reduce((acc, curr) => ({
            revenue: acc.revenue + curr.revenue,
            budgetHours: acc.budgetHours + curr.budgetHours,
            computedHours: acc.computedHours + curr.computedHours
        }), { revenue: 0, budgetHours: 0, computedHours: 0 });
    }, [profitabilityData]);

    const totalEffectiveRate = totals.computedHours > 0 ? totals.revenue / totals.computedHours : 0;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Rentabilidad</h1>
                    <p className="text-muted-foreground">Análisis de ingresos vs. esfuerzo mensual (Sin costes laborales).</p>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}>
                        <CalendarDays className="mr-2 h-4 w-4" /> Anterior
                    </Button>
                    <div className="font-medium min-w-[140px] text-center capitalize">
                        {format(currentMonth, 'MMMM yyyy', { locale: es })}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}>
                        Siguiente <CalendarDays className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Facturación Mensual</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totals.revenue)}</div>
                        <p className="text-xs text-muted-foreground">Total fees recurrentes</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Horas Computadas</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totals.computedHours.toFixed(1)}h</div>
                        <p className="text-xs text-muted-foreground">De {totals.budgetHours.toFixed(1)}h presupuestadas</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Precio Hora Medio</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className={cn("text-2xl font-bold", totalEffectiveRate < 30 ? "text-red-500" : "text-emerald-600")}>
                            {formatCurrency(totalEffectiveRate)}
                        </div>
                        <p className="text-xs text-muted-foreground">Ingresos / Horas Trabajadas</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Eficiencia Global</CardTitle>
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {totals.budgetHours > 0 ? ((totals.computedHours / totals.budgetHours) * 100).toFixed(1) : 0}%
                        </div>
                        <p className="text-xs text-muted-foreground">% de horas vendidas consumidas</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Desglose por Proyecto</CardTitle>
                    <CardDescription>
                        Detalle de rentabilidad operativa por proyecto activo.
                        <span className="text-emerald-600 font-medium ml-1">Verde</span>: Precio hora efectivo alto (Eficiente).
                        <span className="text-red-500 font-medium ml-1">Rojo</span>: Precio hora efectivo bajo (Sobre-esfuerzo).
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Cliente / Proyecto</TableHead>
                                <TableHead className="text-right">Fee Mensual</TableHead>
                                <TableHead className="text-right">Horas Venta</TableHead>
                                <TableHead className="text-right">Precio Venta</TableHead>
                                <TableHead className="text-right">Horas Reales</TableHead>
                                <TableHead className="text-right">Consumo</TableHead>
                                <TableHead className="text-right">Precio Real</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {profitabilityData.map((row) => (
                                <TableRow key={row.id}>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-sm">{formatProjectName(row.name)}</span>
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: row.clientColor || '#ccc' }}></span>
                                                {row.clientName}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                        {formatCurrency(row.revenue)}
                                    </TableCell>
                                    <TableCell className="text-right text-muted-foreground">
                                        {row.budgetHours}h
                                    </TableCell>
                                    <TableCell className="text-right text-xs text-muted-foreground">
                                        {formatCurrency(row.targetHourlyRate)}/h
                                    </TableCell>
                                    <TableCell className="text-right font-bold">
                                        {row.computedHours.toFixed(1)}h
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <span className={cn(
                                            "px-2 py-1 rounded-full text-xs font-semibold",
                                            row.status === 'danger' ? "bg-red-100 text-red-700" :
                                                row.status === 'warning' ? "bg-amber-100 text-amber-700" :
                                                    "bg-emerald-100 text-emerald-700"
                                        )}>
                                            {row.efficiencyPercentage.toFixed(0)}%
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-sm">
                                        <span className={cn(
                                            row.effectiveHourlyRate < row.targetHourlyRate * 0.8 ? "text-red-500" :
                                                row.effectiveHourlyRate > row.targetHourlyRate * 1.2 ? "text-emerald-500" :
                                                    "text-slate-700"
                                        )}>
                                            {formatCurrency(row.effectiveHourlyRate)}/h
                                        </span>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {profitabilityData.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                                        No hay datos de proyectos activos para este mes.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
