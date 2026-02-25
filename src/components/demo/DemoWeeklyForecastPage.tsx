import { useState, useMemo } from 'react';
import { useDemo } from '@/contexts/DemoContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format, startOfMonth, endOfMonth, isSameMonth, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { AlertCircle, TrendingUp, CheckCircle2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getWeeksForMonth } from '@/utils/dateUtils';

export function DemoWeeklyForecastPage() {
    const {
        projects, allocations, employees, clients,
        getEmployeeMonthlyLoad
    } = useDemo();

    const [currentMonth] = useState(new Date());

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const weeks = getWeeksForMonth(currentMonth);

    // Sección A: Semáforo de proyectos (Month-End Forecast)
    const projectForecast = useMemo(() => {
        if (!projects || !Array.isArray(projects)) return [];

        // Filtro para demo - mostrar solo algunos relevantes
        const relevantProjects = projects.slice(0, 6);

        const forecastData = relevantProjects.map(project => {
            const contracted = project.budgetHours || 0;

            // Simulación de datos para la demo
            // Generar valores que tengan sentido visualmente
            let realized = 0;
            let status: 'red' | 'yellow' | 'green' = 'green';

            if (project.name.includes('Website')) { status = 'red'; realized = contracted + 15; }
            else if (project.name.includes('Campaña')) { status = 'yellow'; realized = contracted - 10; }
            else { status = 'green'; realized = contracted - 2; }

            const difference = contracted - realized;

            return {
                projectId: project.id,
                projectName: project.name,
                clientName: clients.find(c => c.id === project.clientId)?.name || 'Sin cliente',
                clientColor: clients.find(c => c.id === project.clientId)?.color || '#6b7280',
                contracted,
                realized,
                difference,
                status
            };
        }).sort((a, b) => {
            // Ordenar: rojos, amarillos, verdes
            const statusOrder = { red: 0, yellow: 1, green: 2 };
            return statusOrder[a.status] - statusOrder[b.status];
        });

        return forecastData;
    }, [projects, clients]);

    // Sección B: Transferencias de horas (Simuladas para Demo)
    const transfers = useMemo(() => {
        // Datos hardcodeados para la demo que se vean bonitos
        return [
            {
                id: '1',
                fromEmployee: employees.find(e => e.name.includes('Carlos')) || employees[1],
                toEmployee: employees.find(e => e.name.includes('María')) || employees[0],
                projectName: 'Rediseño Web Corporativo',
                taskName: 'Desarrollo Frontend - Home',
                hours: 4,
                status: 'distributed',
                originalWeek: weeks[0]?.weekStart.toISOString(),
                targetWeek: weeks[1]?.weekStart.toISOString()
            },
            {
                id: '2',
                fromEmployee: employees.find(e => e.name.includes('Ana')) || employees[2],
                toEmployee: employees.find(e => e.name.includes('Luis')) || employees[3],
                projectName: 'Campaña Q4 2024',
                taskName: 'Configuración de Ads',
                hours: 2.5,
                status: 'pending',
                originalWeek: weeks[1]?.weekStart.toISOString(),
                targetWeek: undefined
            }
        ];
    }, [employees, weeks]);

    return (
        <div className="space-y-6 lg:space-y-8 pb-20 p-3 sm:p-4 md:p-6 bg-slate-50 min-h-screen">

            {/* 1. SEMÁFORO DE PROYECTOS */}
            <Card className="border-indigo-100 shadow-md">
                <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-indigo-50 to-white pb-2">
                    <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg bg-indigo-100 text-indigo-700`}>
                            <CheckCircle2 className="h-5 w-5" />
                        </div>
                        <div>
                            <CardTitle className="text-lg sm:text-xl font-bold text-slate-800">
                                Semáforo de proyectos
                            </CardTitle>
                            <p className="text-sm text-slate-500">Forecast de cierre mensual</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 border-b">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Proyecto</th>
                                    <th className="px-4 py-3 font-medium text-right">Contratado</th>
                                    <th className="px-4 py-3 font-medium text-right">Forecast</th>
                                    <th className="px-4 py-3 font-medium text-right">Diferencia</th>
                                    <th className="px-4 py-3 font-medium text-center">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {projectForecast.map((proj) => (
                                    <tr key={proj.projectId} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-slate-900">{proj.projectName}</div>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: proj.clientColor }} />
                                                <span className="text-xs text-slate-500">{proj.clientName}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono text-slate-600">
                                            {proj.contracted}h
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono font-medium text-slate-900">
                                            {proj.realized}h
                                        </td>
                                        <td className={cn("px-4 py-3 text-right font-mono font-bold",
                                            proj.difference > 0 ? "text-emerald-600" : "text-red-600"
                                        )}>
                                            {proj.difference > 0 ? '+' : ''}{proj.difference}h
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <Badge variant="outline" className={cn(
                                                "capitalize",
                                                proj.status === 'red' && "bg-red-50 text-red-700 border-red-200",
                                                proj.status === 'yellow' && "bg-amber-50 text-amber-700 border-amber-200",
                                                proj.status === 'green' && "bg-emerald-50 text-emerald-700 border-emerald-200"
                                            )}>
                                                {proj.status === 'red' ? 'Riesgo' : proj.status === 'yellow' ? 'Atención' : 'On Track'}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* 3. TRANSFERENCIAS DE HORAS */}
            <Card className="border-indigo-100 shadow-md">
                <CardHeader className="bg-gradient-to-r from-indigo-50 to-white pb-2">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700">
                            <ArrowRight className="h-5 w-5" />
                        </div>
                        <div>
                            <CardTitle className="text-lg sm:text-xl font-bold text-slate-800">
                                Transferencias de horas
                            </CardTitle>
                            <p className="text-sm text-slate-500">Movimientos entre el equipo este mes</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                    {transfers.map((item) => (
                        <div key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-white hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-4 w-full sm:w-auto">
                                {/* FROM */}
                                <div className="flex items-center gap-2 min-w-[140px]">
                                    <Avatar className="h-10 w-10 border-2 border-slate-100">
                                        <AvatarFallback className="bg-slate-100 text-slate-600">{item.fromEmployee?.name.substring(0, 2)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold text-slate-900">{item.fromEmployee?.name.split(' ')[0]}</span>
                                        <Badge variant="secondary" className="text-[10px] w-fit">Semana orig.</Badge>
                                    </div>
                                </div>

                                <div className="flex flex-col items-center justify-center px-2">
                                    <div className="h-px w-8 bg-slate-300 mb-1" />
                                    <ArrowRight className="h-4 w-4 text-slate-400" />
                                    <div className="h-px w-8 bg-slate-300 mt-1" />
                                </div>

                                {/* TO */}
                                <div className="flex items-center gap-2 min-w-[140px]">
                                    <Avatar className="h-10 w-10 border-2 border-indigo-100">
                                        <AvatarFallback className="bg-indigo-100 text-primary">{item.toEmployee?.name.substring(0, 2)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold text-slate-900">{item.toEmployee?.name.split(' ')[0]}</span>
                                        {item.targetWeek ? (
                                            <Badge variant="outline" className="text-[10px] w-fit border-indigo-200 text-indigo-700">
                                                {item.status === 'distributed' ? 'Semana dest.' : 'Recibido'}
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-[10px] w-fit border-amber-200 text-amber-700 bg-amber-50">
                                                Pendiente
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* PROJECT INFO */}
                            <div className="flex-1 min-w-0 border-l border-slate-100 pl-0 sm:pl-4 ml-0 sm:ml-2 w-full sm:w-auto">
                                <div className="flex flex-col">
                                    <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">{item.projectName}</span>
                                    <span className="font-medium text-slate-900 truncate">{item.taskName}</span>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge variant="default" className="bg-primary hover:bg-primary/90">
                                            {item.hours}h
                                        </Badge>
                                        <span className="text-xs text-slate-500">
                                            {item.status === 'distributed' ? 'Redistribuido' : 'Pendiente de aceptar'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Banner informativo de demo */}
                    <div className="flex items-center gap-2 p-3 bg-blue-50 text-blue-700 rounded-lg text-sm">
                        <AlertCircle className="h-4 w-4" />
                        <span>En la versión real, estas transferencias se generan automáticamente desde los reportes semanales.</span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
