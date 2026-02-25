import { useMemo, useState, useEffect, Fragment } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useAgency } from '@/contexts/AgencyContext';
import { useDepartmentView } from '@/contexts/DepartmentViewContext';
import { useProjectMetrics } from '@/hooks/useProjectMetrics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    DollarSign,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    ArrowDownRight,
    Users,
    Search,
    LayoutDashboard,
    FolderKanban,
    UserCircle,
    ChevronDown,
    ChevronRight,
    Filter
} from 'lucide-react';
import { format, startOfMonth, subMonths, addMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { normalizeDepartments, employeeBelongsToDepartment } from '@/utils/departmentUtils';
import { isAllocationInEffectiveMonth } from '@/utils/dateUtils';
import type { Project } from '@/types';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Cell,
    Legend,
    CartesianGrid
} from 'recharts';

export default function FinancialHealthPage() {
    const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
    const [searchQuery, setSearchQuery] = useState('');
    const [includeProjectsWithoutActivity, setIncludeProjectsWithoutActivity] = useState(false);
    const [hoursMode, setHoursMode] = useState<'actual' | 'computed'>('computed');
    const { projects, clients, employees, allocations, ensureMonthLoaded } = useApp();
    const { currentAgency } = useAgency();
    const { selectedDepartmentId } = useDepartmentView();

    useEffect(() => {
        ensureMonthLoaded(currentMonth);
    }, [currentMonth, ensureMonthLoaded]);

    const departments = useMemo(
        () => normalizeDepartments(currentAgency?.settings?.departments),
        [currentAgency?.settings?.departments]
    );

    const employeesForView = useMemo(() => {
        if (!selectedDepartmentId || !departments.length) return employees ?? [];
        const dept = departments.find(d => d.id === selectedDepartmentId || d.name === selectedDepartmentId);
        if (!dept) return employees ?? [];
        return (employees ?? []).filter(e => employeeBelongsToDepartment(e.department, dept.id, dept.name));
    }, [employees, selectedDepartmentId, departments]);

    const projectIdsForDepartment = useMemo(() => {
        if (!selectedDepartmentId) return undefined as Set<string> | undefined;
        if (!employeesForView.length) return new Set<string>();
        const allowedEmployeeIds = new Set(employeesForView.map(e => e.id));
        const ids = new Set<string>();
        (allocations ?? []).forEach(a => {
            if (!allowedEmployeeIds.has(a.employeeId)) return;
            if (!isAllocationInEffectiveMonth(a.weekStartDate, currentMonth)) return;
            ids.add(a.projectId);
        });
        return ids;
    }, [allocations, employeesForView, selectedDepartmentId, currentMonth]);

    const handlePrevMonth = () => setCurrentMonth(prev => subMonths(prev, 1));
    const handleNextMonth = () => setCurrentMonth(prev => addMonths(prev, 1));
    const handleToday = () => setCurrentMonth(startOfMonth(new Date()));

    const {
        projectMetrics,
        employeeMetrics,
        totals
    } = useProjectMetrics({
        month: currentMonth
    });

    const selectedDept = useMemo(() => {
        if (!selectedDepartmentId || !departments.length) return null;
        return departments.find(d => d.id === selectedDepartmentId || d.name === selectedDepartmentId) ?? null;
    }, [selectedDepartmentId, departments]);

    const projectMetricsForView = useMemo(() => {
        if (!projectIdsForDepartment || !selectedDept) return projectMetrics;
        return projectMetrics.filter(p => {
            if (!projectIdsForDepartment.has(p.projectId)) return false;
            const proj = projects?.find(pr => pr.id === p.projectId);
            if (!proj?.responsibleDepartmentId) return true;
            return proj.responsibleDepartmentId === selectedDept.id || proj.responsibleDepartmentId === selectedDept.name;
        });
    }, [projectMetrics, projectIdsForDepartment, selectedDept, projects]);

    const clientById = useMemo(() => {
        const map = new Map<string, string>();
        clients.forEach(c => map.set(c.id, c.name));
        return map;
    }, [clients]);

    const projectMetricsFilteredBySearch = useMemo(() => {
        if (!searchQuery.trim()) return projectMetricsForView;
        const q = searchQuery.trim().toLowerCase();
        return projectMetricsForView.filter(p => {
            const clientName = clientById.get(p.clientId) || p.clientName || '';
            return p.projectName.toLowerCase().includes(q) || clientName.toLowerCase().includes(q);
        });
    }, [projectMetricsForView, searchQuery, clientById]);

    const projectMetricsBillable = useMemo(
        () => projectMetricsFilteredBySearch.filter(p => (p.monthlyFee ?? 0) > 0),
        [projectMetricsFilteredBySearch]
    );
    const projectMetricsInternal = useMemo(
        () => projectMetricsFilteredBySearch.filter(p => (p.monthlyFee ?? 0) === 0),
        [projectMetricsFilteredBySearch]
    );

    const projectMetricsBillableWithActivity = useMemo(
        () => includeProjectsWithoutActivity ? projectMetricsBillable : projectMetricsBillable.filter(p => (hoursMode === 'computed' ? p.computed : p.actual) > 0),
        [projectMetricsBillable, includeProjectsWithoutActivity, hoursMode]
    );

    const employeeMetricsForView = useMemo(() => {
        if (!selectedDepartmentId) return employeeMetrics;
        const allowedIds = new Set(employeesForView.map(e => e.id));
        return employeeMetrics.filter(em => allowedIds.has(em.employeeId));
    }, [employeeMetrics, selectedDepartmentId, employeesForView]);

    const totalsForView = useMemo(() => {
        const totalFee = projectMetricsBillableWithActivity.reduce((s, p) => s + p.monthlyFee, 0);
        const totalActual = projectMetricsBillableWithActivity.reduce((s, p) => s + p.actual, 0);
        const totalComputed = projectMetricsBillableWithActivity.reduce((s, p) => s + p.computed, 0);
        const totalBudget = projectMetricsBillableWithActivity.reduce((s, p) => s + p.budget, 0);
        const avgProgress = projectMetricsBillableWithActivity.length > 0
            ? projectMetricsBillableWithActivity.reduce((s, p) => s + p.progressOperational, 0) / projectMetricsBillableWithActivity.length
            : 0;
        return { totalFee, totalActual, totalComputed, totalBudget, avgProgress };
    }, [projectMetricsBillableWithActivity]);

    // === KPI 1: Precio Hora Efectivo global (según vista) === Horas según filtro Reales/Computadas
    const totalRevenue = totalsForView.totalFee;
    const totalHoursForView = hoursMode === 'computed' ? totalsForView.totalComputed : totalsForView.totalActual;
    const effectiveHourlyRate = totalHoursForView > 0 ? totalRevenue / totalHoursForView : 0;

    // F1 Coste laboral total de la vista: suma de (horas reales × hourly_cost) por empleado. No usar nóminas.
    const totalLaborCostView = useMemo(() => {
        return employeeMetricsForView.reduce((sum, em) => {
            const emp = employees.find(e => e.id === em.employeeId);
            const hours = hoursMode === 'computed' ? em.totalComputed : em.totalActual;
            return sum + hours * (emp?.hourlyRate ?? 0);
        }, 0);
    }, [employeeMetricsForView, employees, hoursMode]);

    const totalRealHoursForCost = totalsForView.totalComputed || totalsForView.totalActual || 0;
    const avgHourlyCost = totalRealHoursForCost > 0 ? totalLaborCostView / totalRealHoursForCost : 0;

    // Objetivo de EHR: configurable en agencia o por defecto 75 €/h (o media de coste si es superior)
    const defaultEhrTarget = avgHourlyCost > 0 ? Math.max(avgHourlyCost, 75) : 75;
    const ehrTarget = (currentAgency?.settings?.ehrTarget != null && currentAgency.settings.ehrTarget > 0)
        ? currentAgency.settings.ehrTarget
        : defaultEhrTarget;
    const ehrIsHealthy = effectiveHourlyRate >= ehrTarget && totalHoursForView > 0;

    // === KPI 2: Margen Neto Global (F3) === Coste = F1 (suma de horas × hourly_cost en la vista).
    const totalInternalCost = totalLaborCostView;

    const netMargin = totalRevenue - totalInternalCost;
    const marginIsPositive = netMargin >= 0;
    const marginPercent = totalRevenue > 0 ? (netMargin / totalRevenue) * 100 : 0;

    // === Ranking de hemorragias: solo proyectos facturables (con actividad por defecto) ===
    type EnrichedProject = {
        metric: typeof projectMetrics[number];
        clientName: string;
        ehr: number;          // € / h real
        ehrLabel: string;     // texto para UI (incluye "Sin iniciar" si procede)
    };

    const enrichedProjects: EnrichedProject[] = useMemo(() => {
        return projectMetricsBillableWithActivity.map(p => {
            const clientName = clientById.get(p.clientId) || p.clientName || 'Cliente desconocido';
            const projectHours = hoursMode === 'computed' ? p.computed : p.actual;
            const ehr = projectHours > 0 ? (p.monthlyFee || 0) / projectHours : Number.POSITIVE_INFINITY;
            const ehrLabel = projectHours > 0
                ? `${(ehr || 0).toFixed(0)} €/h`
                : 'Sin iniciar';
            return { metric: p, clientName, ehr, ehrLabel };
        });
    }, [projectMetricsBillableWithActivity, clientById, hoursMode]);

    const sortedProjects = useMemo(() => {
        return [...enrichedProjects].sort((a, b) => {
            const ehrA = a.ehr;
            const ehrB = b.ehr;
            if (!isFinite(ehrA) && !isFinite(ehrB)) return 0;
            if (!isFinite(ehrA)) return 1;
            if (!isFinite(ehrB)) return -1;
            return ehrA - ehrB; // de peor (más bajo) a mejor
        });
    }, [enrichedProjects]);

    const [showAllProjects, setShowAllProjects] = useState(false);
    const projectsToShow = showAllProjects ? sortedProjects : sortedProjects.slice(0, 10);

    // Mapa proyecto -> desglose por empleado (según vista)
    const projectEmployeesMap = useMemo(() => {
        const map = new Map<string, { employeeId: string; hours: number }[]>();
        employeeMetricsForView.forEach(em => {
            em.projectBreakdown.forEach(pb => {
                const list = map.get(pb.projectId) || [];
                list.push({ employeeId: em.employeeId, hours: pb.hours });
                map.set(pb.projectId, list);
            });
        });
        return map;
    }, [employeeMetricsForView]);

    const projectByIdForAttr = useMemo(() => {
        const map = new Map<string, { actual: number; monthlyFee: number }>();
        projectMetricsForView.forEach(p => map.set(p.projectId, { actual: p.actual, monthlyFee: p.monthlyFee || 0 }));
        return map;
    }, [projectMetricsForView]);

    // Total de horas por proyecto según el mismo breakdown que los empleados (computed), para repartir el fee sin distorsión
    const projectTotalHoursFromBreakdown = useMemo(() => {
        const map = new Map<string, number>();
        projectEmployeesMap.forEach((rows, projectId) => {
            map.set(projectId, rows.reduce((s, r) => s + r.hours, 0));
        });
        return map;
    }, [projectEmployeesMap]);

    // Horas totales por empleado (computed) en la vista: para repartir el coste mensual entre proyectos
    const employeeTotalHoursMap = useMemo(() => {
        const map = new Map<string, number>();
        employeeMetricsForView.forEach(em => map.set(em.employeeId, em.totalComputed));
        return map;
    }, [employeeMetricsForView]);

    // F1 Coste Laboral: SUM(horas reales del empleado en proyecto × hourly_cost del empleado). Sin prorratear nómina.
    // Horas reales = trackeadas (computed del breakdown). hourlyRate en BD = coste por hora (€/h) para esta fórmula.
    const projectCostAndMarginMap = useMemo(() => {
        const map = new Map<string, { cost: number; margin: number }>();
        projectMetricsForView.forEach(p => {
            const breakdown = projectEmployeesMap.get(p.projectId) || [];
            const cost = breakdown.reduce((sum, row) => {
                const emp = employees.find(e => e.id === row.employeeId);
                const hourlyCost = emp?.hourlyRate ?? 0; // €/h (coste fijo estándar del empleado)
                return sum + row.hours * hourlyCost;
            }, 0);
            const fee = p.monthlyFee || 0; // F2 Ingreso = monthly_fee (no prorratear)
            map.set(p.projectId, { cost, margin: fee - cost }); // F3 Margen = Ingreso - Coste Laboral
        });
        return map;
    }, [projectMetricsForView, projectEmployeesMap, employees]);

    // Desglose por empleado en proyecto: F1 (horas + coste) + ingreso atribuido y margen informativos (reparto proporcional al % de horas).
    // Oficial: F2 = monthly_fee del proyecto (no prorratear). Aquí mostramos el reparto por empleado solo para contexto.
    const projectEmployeeAttributionMap = useMemo(() => {
        const map = new Map<string, { employeeId: string; hours: number; cost: number; attributedRevenue: number; margin: number }[]>();
        employeeMetricsForView.forEach(em => {
            const hourlyCost = employees.find(e => e.id === em.employeeId)?.hourlyRate ?? 0; // €/h
            em.projectBreakdown.forEach(pb => {
                const hours = pb.hours;
                const cost = hours * hourlyCost; // F1
                const totalHours = projectTotalHoursFromBreakdown.get(pb.projectId) ?? 0;
                const monthlyFee = projectByIdForAttr.get(pb.projectId)?.monthlyFee ?? 0;
                const attributedRevenue = totalHours > 0 ? (hours / totalHours) * monthlyFee : 0;
                const margin = attributedRevenue - cost;
                const list = map.get(pb.projectId) || [];
                list.push({ employeeId: em.employeeId, hours, cost, attributedRevenue, margin });
                map.set(pb.projectId, list);
            });
        });
        return map;
    }, [employeeMetricsForView, employees, projectTotalHoursFromBreakdown, projectByIdForAttr]);

    const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
    const toggleProject = (projectId: string) => {
        setExpandedProjects(prev => {
            const next = new Set(prev);
            if (next.has(projectId)) next.delete(projectId);
            else next.add(projectId);
            return next;
        });
    };

    // === Rentabilidad por departamento (área) ===
    const projectById = useMemo(() => {
        const map = new Map<string, Project>();
        projects.forEach(p => map.set(p.id, p));
        return map;
    }, [projects]);

    const departmentProfitability = useMemo(() => {
        const records: { id: string; name: string; ehr: number; revenue: number; hours: number }[] = [];
        departments.forEach(dept => {
            let revenue = 0;
            let hours = 0;
            projectMetricsBillableWithActivity.forEach(pm => {
                const proj = projectById.get(pm.projectId);
                if (!proj) return;
                if (!proj.responsibleDepartmentId) return;
                if (proj.responsibleDepartmentId !== dept.id && proj.responsibleDepartmentId !== dept.name) return;
                revenue += pm.monthlyFee || 0;
                hours += hoursMode === 'computed' ? pm.computed : pm.actual;
            });
            if (hours > 0 && revenue > 0) {
                const ehr = revenue / hours;
                records.push({ id: dept.id, name: dept.name, ehr, revenue, hours });
            }
        });
        const maxEhr = records.reduce((max, r) => Math.max(max, r.ehr), 0);
        return {
            maxEhr,
            items: records.sort((a, b) => b.ehr - a.ehr)
        };
    }, [departments, projectMetricsBillableWithActivity, projectById, hoursMode]);

    // === Por empleado: F1 (coste) + ingreso atribuido y margen informativos (reparto proporcional por horas). ===
    type EmployeeProfitability = {
        employeeId: string;
        employeeName: string;
        totalActual: number;
        totalComputed: number;
        cost: number; // F1
        attributedRevenue: number; // reparto informativo
        margin: number;
        marginPercent: number;
        byProject: { projectId: string; projectName: string; hours: number; cost: number; attributedRevenue: number; margin: number }[];
    };

    const employeeProfitabilityList = useMemo((): EmployeeProfitability[] => {
        return employeeMetricsForView.map(em => {
            const emp = employees.find(e => e.id === em.employeeId);
            const hourlyCost = emp?.hourlyRate ?? 0; // €/h
            let cost = 0;
            let attributedRevenue = 0;
            const byProject: EmployeeProfitability['byProject'] = [];
            em.projectBreakdown.forEach(pb => {
                const hours = pb.hours;
                const rowCost = hours * hourlyCost;
                cost += rowCost;
                const totalHours = projectTotalHoursFromBreakdown.get(pb.projectId) ?? 0;
                const monthlyFee = projectByIdForAttr.get(pb.projectId)?.monthlyFee ?? 0;
                const attr = totalHours > 0 ? (hours / totalHours) * monthlyFee : 0;
                attributedRevenue += attr;
                byProject.push({
                    projectId: pb.projectId,
                    projectName: pb.projectName,
                    hours,
                    cost: rowCost,
                    attributedRevenue: attr,
                    margin: attr - rowCost
                });
            });
            const margin = attributedRevenue - cost;
            const marginPercent = attributedRevenue > 0 ? (margin / attributedRevenue) * 100 : 0;
            return {
                employeeId: em.employeeId,
                employeeName: em.employeeName,
                totalActual: em.totalActual,
                totalComputed: em.totalComputed,
                cost,
                attributedRevenue,
                margin,
                marginPercent,
                byProject
            };
        });
    }, [employeeMetricsForView, employees, projectTotalHoursFromBreakdown, projectByIdForAttr]);

    const employeeProfitabilityFilteredBySearch = useMemo(() => {
        if (!searchQuery.trim()) return employeeProfitabilityList;
        const q = searchQuery.trim().toLowerCase();
        return employeeProfitabilityList.filter(ep => {
            if (ep.employeeName.toLowerCase().includes(q)) return true;
            return ep.byProject.some(bp => bp.projectName.toLowerCase().includes(q));
        });
    }, [employeeProfitabilityList, searchQuery]);

    const departmentNameForView = useMemo(() => {
        if (!selectedDepartmentId) return null;
        const d = departments.find(x => x.id === selectedDepartmentId || x.name === selectedDepartmentId);
        return d?.name ?? null;
    }, [selectedDepartmentId, departments]);

    const internalWithActivity = useMemo(
        () => includeProjectsWithoutActivity ? projectMetricsInternal : projectMetricsInternal.filter(p => (hoursMode === 'computed' ? p.computed : p.actual) > 0),
        [projectMetricsInternal, includeProjectsWithoutActivity, hoursMode]
    );

    return (
        <div className="p-4 sm:p-6 md:p-8 max-w-[1600px] mx-auto space-y-6">
            {/* Cabecera con título y contexto */}
            <header className="space-y-3">
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <DollarSign className="h-7 w-7 text-emerald-600 shrink-0" aria-hidden />
                    Rentabilidad
                </h1>
                <p className="text-slate-600 text-sm max-w-xl">
                    Precio hora efectivo, margen neto y rentabilidad por proyecto y empleado.
                    {departmentNameForView && (
                        <span className="block mt-1 text-emerald-700 font-medium">
                            Vista: {departmentNameForView}
                        </span>
                    )}
                </p>
            </header>

            {/* Barra de filtros y navegación */}
            <div className="flex flex-col sm:flex-row gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="relative flex-1 min-w-0 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" aria-hidden />
                    <Input
                        placeholder="Buscar proyecto o cliente..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-10 bg-white border-slate-200"
                        aria-label="Buscar en Rentabilidad"
                    />
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <div className="flex items-center gap-0.5 rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm">
                        <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="h-9 w-9 text-slate-600 hover:bg-slate-100" aria-label="Mes anterior">
                            <ChevronRight className="h-4 w-4 rotate-180" />
                        </Button>
                        <Button variant="ghost" onClick={handleToday} className="h-9 px-3 text-sm font-medium text-slate-800 capitalize min-w-[100px]">
                            {format(currentMonth, 'MMM yyyy', { locale: es })}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={handleNextMonth} className="h-9 w-9 text-slate-600 hover:bg-slate-100" aria-label="Mes siguiente">
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                    <Button
                        variant={includeProjectsWithoutActivity ? 'secondary' : 'outline'}
                        size="sm"
                        className="h-10 gap-1.5 border-slate-200"
                        onClick={() => setIncludeProjectsWithoutActivity(prev => !prev)}
                    >
                        <Filter className="h-4 w-4" />
                        {includeProjectsWithoutActivity ? 'Solo con actividad' : 'Incluir todos los proyectos'}
                    </Button>
                    <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1.5">
                        <span className="text-xs font-medium text-slate-600 whitespace-nowrap">Horas:</span>
                        <div className="flex rounded-md border border-slate-200 overflow-hidden">
                            <button
                                type="button"
                                onClick={() => setHoursMode('actual')}
                                className={cn(
                                    "px-3 py-1.5 text-xs font-medium transition-colors",
                                    hoursMode === 'actual' ? "bg-slate-800 text-white" : "bg-white text-slate-600 hover:bg-slate-50"
                                )}
                            >
                                Reales
                            </button>
                            <button
                                type="button"
                                onClick={() => setHoursMode('computed')}
                                className={cn(
                                    "px-3 py-1.5 text-xs font-medium transition-colors border-l border-slate-200",
                                    hoursMode === 'computed' ? "bg-slate-800 text-white" : "bg-white text-slate-600 hover:bg-slate-50"
                                )}
                            >
                                Computadas
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="resumen" className="space-y-6">
                <div className="space-y-1">
                    <TabsList className="grid w-full max-w-lg grid-cols-3 h-11 bg-slate-100 p-1 rounded-lg">
                        <TabsTrigger value="resumen" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md">
                            <LayoutDashboard className="h-4 w-4 shrink-0" />
                            Resumen
                        </TabsTrigger>
                        <TabsTrigger value="proyectos" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md">
                            <FolderKanban className="h-4 w-4 shrink-0" />
                            Proyectos
                        </TabsTrigger>
                        <TabsTrigger value="empleados" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md">
                            <UserCircle className="h-4 w-4 shrink-0" />
                            Empleados
                        </TabsTrigger>
                    </TabsList>
                    <p className="text-xs text-slate-500 px-0.5">Resumen · Tabla de proyectos · Rentabilidad por empleado en €</p>
                </div>

                <TabsContent value="resumen" className="space-y-8 mt-0">
            {/* KPIs */}
            <section className="grid gap-4 sm:gap-6 md:grid-cols-2" aria-label="Indicadores clave">
                <Card className="border-l-4 border-emerald-500 shadow-sm bg-white overflow-hidden">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                                <DollarSign className="h-4 w-4" />
                            </span>
                            Precio Hora Efectivo (EHR)
                        </CardTitle>
                        <CardDescription className="text-xs text-slate-500 mt-1">
                            Ingresos / horas {hoursMode === 'computed' ? 'computadas' : 'reales'}. Solo proyectos facturables con actividad.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <span
                                className={cn(
                                    "text-3xl md:text-4xl font-bold tabular-nums",
                                    totalHoursForView === 0 ? "text-slate-400" : ehrIsHealthy ? "text-emerald-700" : "text-red-600"
                                )}
                            >
                                {totalHoursForView > 0
                                    ? `${effectiveHourlyRate.toFixed(0)} €/h`
                                    : '–'}
                            </span>
                            {totalHoursForView > 0 && !ehrIsHealthy && (
                                <AlertTriangle className="h-5 w-5 text-red-500" aria-hidden="true" />
                            )}
                        </div>
                        <p className="text-xs text-slate-600 mt-1">
                            Objetivo de la agencia:{' '}
                            <span className="font-semibold tabular-nums">{ehrTarget.toFixed(0)} €/h</span>
                        </p>
                        {totalHoursForView > 0 && (
                            <p className="text-[11px] mt-1 text-slate-500">
                                {ehrIsHealthy ? (
                                    <>Por encima del objetivo. La agencia está generando buen margen por hora.</>
                                ) : (
                                    <>Por debajo del objetivo. Cada hora trabajada deja menos margen del deseado.</>
                                )}
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card className={cn("border-l-4 shadow-sm bg-white overflow-hidden", marginIsPositive ? "border-emerald-500" : "border-red-500")}>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                            <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", marginIsPositive ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600")}>
                                {marginIsPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                            </span>
                            Margen Neto
                        </CardTitle>
                        <CardDescription className="text-xs text-slate-500 mt-1">
                            Ingresos menos coste interno. Solo proyectos facturables con actividad.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <span
                                className={cn(
                                    "text-3xl md:text-4xl font-bold tabular-nums",
                                    marginIsPositive ? "text-emerald-700" : "text-red-600"
                                )}
                            >
                                {netMargin.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                            </span>
                            {marginIsPositive ? (
                                <TrendingUp className="h-5 w-5 text-emerald-500" aria-hidden="true" />
                            ) : (
                                <TrendingDown className="h-5 w-5 text-red-500" aria-hidden="true" />
                            )}
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                            <Badge
                                variant={marginIsPositive ? 'outline' : 'destructive'}
                                className={cn(
                                    "text-[11px] font-semibold tabular-nums",
                                    marginIsPositive
                                        ? "border-emerald-300 text-emerald-700 bg-emerald-50"
                                        : "border-red-300 bg-red-600/90 text-white"
                                )}
                            >
                                {totalRevenue > 0 ? `${marginPercent.toFixed(1)}% margen` : 'Sin facturación'}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>
            </section>

            {/* Radar de hemorragias */}
            <section aria-label="Radar de hemorragias">
            <Card className="shadow-sm border border-slate-200 bg-white overflow-hidden">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600">
                            <ArrowDownRight className="h-4 w-4" />
                        </span>
                        Radar de hemorragias
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500">
                        Proyectos facturables ordenados por peor Precio Hora Efectivo. Arriba, los que más sangran rentabilidad.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {sortedProjects.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                            <div className="rounded-full bg-slate-100 p-4 mb-3">
                                <FolderKanban className="h-8 w-8 text-slate-400" />
                            </div>
                            <p className="text-sm font-medium text-slate-600">Sin proyectos con facturación este mes</p>
                            <p className="text-xs text-slate-500 mt-1 max-w-sm">No hay proyectos facturables con actividad, o no coinciden con los filtros aplicados.</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="text-xs text-slate-500 uppercase bg-slate-50/80">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-medium rounded-tl-lg">Cliente / Proyecto</th>
                                            <th className="px-4 py-3 text-right font-medium">Ingreso (Fee)</th>
                                            <th className="px-4 py-3 text-right font-medium">Horas (Real / Budget)</th>
                                            <th className="px-4 py-3 text-right font-medium">Precio Hora Efectivo</th>
                                            <th className="px-4 py-3 text-right font-medium">Coste interno (€)</th>
                                            <th className="px-4 py-3 text-right font-medium">Margen (€)</th>
                                            <th className="px-4 py-3 text-right font-medium rounded-tr-lg">Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {projectsToShow.map(({ metric: p, clientName, ehr, ehrLabel }, idx) => {
                                            const cm = projectCostAndMarginMap.get(p.projectId) ?? { cost: 0, margin: 0 };
                                            const attributionRows = projectEmployeeAttributionMap.get(p.projectId) || [];
                                            const client = clients.find(c => c.id === p.clientId);
                                            const clientInitials = (clientName || '?')
                                                .split(' ')
                                                .slice(0, 2)
                                                .map(part => part[0])
                                                .join('')
                                                .toUpperCase();
                                            const projectHours = hoursMode === 'computed' ? p.computed : p.actual;
                                            const hoursRatio = p.budget > 0 ? projectHours / p.budget : 0;
                                            const isOverBudget = projectHours > p.budget && p.budget > 0;
                                            const ehrBelowTarget = isFinite(ehr) && projectHours > 0 && ehr < ehrTarget;
                                            const isExpanded = expandedProjects.has(p.projectId);

                                            return (
                                                <Fragment key={p.projectId}>
                                                <tr className={cn("align-top transition-colors", idx % 2 === 1 ? "bg-slate-50/50" : "bg-white", "hover:bg-slate-100/70")}>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-3 max-w-[260px]">
                                                            <Avatar className="h-8 w-8 border shrink-0">
                                                                <AvatarFallback
                                                                    className="bg-slate-900 text-white text-xs font-bold flex items-center justify-center"
                                                                    style={client?.color ? { backgroundColor: client.color, color: 'white' } : undefined}
                                                                >
                                                                    {clientInitials}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div className="min-w-0">
                                                                <div className="font-semibold text-slate-900 truncate">{p.projectName}</div>
                                                                <div className="text-[11px] text-slate-500 truncate">{clientName}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-right align-middle">
                                                        <div className="font-mono text-xs tabular-nums">
                                                            {p.monthlyFee.toLocaleString('es-ES', {
                                                                style: 'currency',
                                                                currency: 'EUR'
                                                            })}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-right align-middle">
                                                        <div className="flex flex-col items-end gap-1">
                                                            <span className="font-mono text-[11px] text-slate-600 tabular-nums">
                                                                {projectHours.toFixed(1)}h / {p.budget.toFixed(1)}h
                                                            </span>
                                                            <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                                <div
                                                                    className={cn(
                                                                        "h-full rounded-full transition-all",
                                                                        isOverBudget ? "bg-red-500" : "bg-emerald-500"
                                                                    )}
                                                                    style={{
                                                                        width: `${Math.min(100, p.budget > 0 ? (hoursRatio * 100) : 0)}%`
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-right align-middle">
                                                        <div className="flex items-center justify-end gap-1">
                                                            {projectHours > 0 ? (
                                                                <Badge
                                                                    variant={ehrBelowTarget ? 'destructive' : 'outline'}
                                                                    className={cn(
                                                                        "text-[11px] font-semibold tabular-nums",
                                                                        ehrBelowTarget
                                                                            ? "bg-red-600 text-white border-red-600"
                                                                            : "bg-emerald-50 text-emerald-700 border-emerald-300"
                                                                    )}
                                                                >
                                                                    {ehrLabel}
                                                                </Badge>
                                                            ) : (
                                                                <Badge variant="outline" className="text-[11px] text-slate-500 border-slate-300 bg-slate-50">
                                                                    Sin iniciar
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-right align-middle font-mono text-xs tabular-nums text-slate-700">{cm.cost.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td>
                                                    <td className={cn("px-4 py-3 text-right align-middle font-mono text-xs tabular-nums font-semibold", cm.margin >= 0 ? "text-emerald-700" : "text-red-600")}>{cm.margin.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td>
                                                    <td className="px-4 py-3 text-right align-middle">
                                                        <Button size="sm" variant="ghost" className="h-8 text-xs gap-1 text-slate-600 hover:text-slate-900" onClick={() => toggleProject(p.projectId)}>
                                                            {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                                                            Desglose
                                                        </Button>
                                                    </td>
                                                </tr>
                                                {isExpanded && (
                                                    <tr>
                                                        <td colSpan={7} className="p-0 align-top bg-slate-50/50">
                                                            <div className="px-4 pb-3 pt-1">
                                                                {attributionRows.length === 0 ? (
                                                                    <p className="text-xs italic text-slate-400 py-2">Sin desglose por empleado para este mes.</p>
                                                                ) : (
                                                                    <div className="flex gap-4 items-stretch flex-wrap">
                                                                        <div className="rounded-lg border border-slate-200 bg-white overflow-x-auto shrink-0">
                                                                            <table className="text-xs table-fixed" style={{ tableLayout: 'fixed', width: '520px' }}>
                                                                                <colgroup>
                                                                                    <col style={{ width: '160px' }} />
                                                                                    <col style={{ width: '64px' }} />
                                                                                    <col style={{ width: '88px' }} />
                                                                                    <col style={{ width: '88px' }} />
                                                                                    <col style={{ width: '88px' }} />
                                                                                </colgroup>
                                                                                <thead>
                                                                                    <tr className="bg-slate-50 text-slate-500">
                                                                                        <th className="sticky left-0 z-10 bg-slate-50 pl-3 pr-2 py-2 text-left font-medium">Empleado</th>
                                                                                        <th className="px-2 py-2 text-right font-medium whitespace-nowrap">Horas</th>
                                                                                        <th className="px-2 py-2 text-right font-medium whitespace-nowrap">Ingreso atrib. (€)</th>
                                                                                        <th className="px-2 py-2 text-right font-medium whitespace-nowrap">Coste (€)</th>
                                                                                        <th className="px-2 py-2 text-right font-medium whitespace-nowrap">Margen (€)</th>
                                                                                    </tr>
                                                                                </thead>
                                                                                <tbody className="divide-y divide-slate-100">
                                                                                    {attributionRows.map((row, i) => {
                                                                                        const emp = employees.find(e => e.id === row.employeeId);
                                                                                        return (
                                                                                            <tr key={row.employeeId} className={cn(i % 2 === 1 && "bg-slate-50/50")}>
                                                                                                <td className={cn("sticky left-0 z-10 pl-3 pr-2 py-2 font-medium text-slate-800 truncate", i % 2 === 1 ? "bg-slate-50/50" : "bg-white")} title={emp?.name || 'Empleado'}>{emp?.name || 'Empleado'}</td>
                                                                                                <td className="px-2 py-2 text-right font-mono tabular-nums text-slate-600 whitespace-nowrap">{row.hours.toFixed(1)} h</td>
                                                                                                <td className="px-2 py-2 text-right font-mono tabular-nums text-slate-700 whitespace-nowrap">{row.attributedRevenue.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td>
                                                                                                <td className="px-2 py-2 text-right font-mono tabular-nums text-slate-700 whitespace-nowrap">{row.cost.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td>
                                                                                                <td className={cn("px-2 py-2 text-right font-mono tabular-nums font-medium whitespace-nowrap", row.margin >= 0 ? "text-emerald-700" : "text-red-600")}>{row.margin.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td>
                                                                                            </tr>
                                                                                        );
                                                                                    })}
                                                                                    <tr className="border-t-2 border-slate-200 bg-slate-100/80 font-semibold text-slate-800">
                                                                                        <td className="sticky left-0 z-10 bg-slate-100/80 pl-3 pr-2 py-2">Total</td>
                                                                                        <td className="px-2 py-2 text-right font-mono tabular-nums whitespace-nowrap">{attributionRows.reduce((s, r) => s + r.hours, 0).toFixed(1)} h</td>
                                                                                        <td className="px-2 py-2 text-right font-mono tabular-nums whitespace-nowrap">{attributionRows.reduce((s, r) => s + r.attributedRevenue, 0).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td>
                                                                                        <td className="px-2 py-2 text-right font-mono tabular-nums whitespace-nowrap">{attributionRows.reduce((s, r) => s + r.cost, 0).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td>
                                                                                        <td className={cn("px-2 py-2 text-right font-mono tabular-nums whitespace-nowrap", attributionRows.reduce((s, r) => s + r.margin, 0) >= 0 ? "text-emerald-700" : "text-red-600")}>{attributionRows.reduce((s, r) => s + r.margin, 0).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td>
                                                                                    </tr>
                                                                                </tbody>
                                                                            </table>
                                                                        </div>
                                                                        <div className="flex-1 min-w-[300px] rounded-xl border border-slate-200/80 bg-gradient-to-br from-slate-50/80 to-white p-4 shadow-sm flex flex-col" style={{ minHeight: '220px' }}>
                                                                            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-3">Contribución por empleado (coste + margen)</p>
                                                                            <ResponsiveContainer width="100%" height={Math.max(200, attributionRows.length * 48)}>
                                                                                <BarChart
                                                                                    layout="vertical"
                                                                                    margin={{ top: 8, right: 32, left: 12, bottom: 8 }}
                                                                                    barCategoryGap="14%"
                                                                                    barSize={22}
                                                                                    data={[...attributionRows]
                                                                                        .map(row => ({
                                                                                            name: (employees.find(e => e.id === row.employeeId)?.name || 'Empleado').split(' ')[0],
                                                                                            cost: row.cost,
                                                                                            margin: row.margin
                                                                                        }))
                                                                                        .sort((a, b) => b.margin - a.margin)}
                                                                                >
                                                                                    <defs>
                                                                                        <linearGradient id="chartCost" x1="0" y1="0" x2="1" y2="0" gradientUnits="userSpaceOnUse">
                                                                                            <stop stopColor="#94a3b8" />
                                                                                            <stop offset="1" stopColor="#cbd5e1" />
                                                                                        </linearGradient>
                                                                                        <linearGradient id="chartMarginPos" x1="0" y1="0" x2="1" y2="0" gradientUnits="userSpaceOnUse">
                                                                                            <stop stopColor="#059669" />
                                                                                            <stop offset="1" stopColor="#34d399" />
                                                                                        </linearGradient>
                                                                                        <linearGradient id="chartMarginNeg" x1="0" y1="0" x2="1" y2="0" gradientUnits="userSpaceOnUse">
                                                                                            <stop stopColor="#dc2626" />
                                                                                            <stop offset="1" stopColor="#f87171" />
                                                                                        </linearGradient>
                                                                                    </defs>
                                                                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} vertical={true} />
                                                                                    <XAxis type="number" tickFormatter={v => `${v} €`} fontSize={11} fill="#64748b" stroke="#e2e8f0" tickLine={false} axisLine={{ stroke: '#e2e8f0' }} tick={{ fontFamily: 'inherit' }} />
                                                                                    <YAxis type="category" dataKey="name" width={60} fontSize={11} fill="#475569" tickLine={false} axisLine={false} tick={{ fontFamily: 'inherit', fontWeight: 500 }} />
                                                                                    <Tooltip
                                                                                        formatter={(value: number) => [value.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }), '']}
                                                                                        labelFormatter={label => `Empleado: ${label}`}
                                                                                        contentStyle={{ fontSize: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}
                                                                                        wrapperStyle={{ outline: 'none' }}
                                                                                        cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
                                                                                    />
                                                                                    <Legend wrapperStyle={{ fontSize: '11px' }} iconType="circle" iconSize={8} align="right" verticalAlign="top" formatter={(value) => <span className="text-slate-600 font-medium">{value}</span>} />
                                                                                    <Bar dataKey="cost" name="Coste" stackId="a" fill="url(#chartCost)" radius={[0, 0, 0, 0]} />
                                                                                    <Bar dataKey="margin" name="Margen" stackId="a" fill="#059669" radius={[0, 6, 6, 0]}>
                                                                                        {[...attributionRows].map((row, i) => ({ name: (employees.find(e => e.id === row.employeeId)?.name || 'Empleado').split(' ')[0], margin: row.margin })).sort((a, b) => b.margin - a.margin).map((entry, i) => (
                                                                                            <Cell key={i} fill={entry.margin >= 0 ? 'url(#chartMarginPos)' : 'url(#chartMarginNeg)'} />
                                                                                        ))}
                                                                                    </Bar>
                                                                                </BarChart>
                                                                            </ResponsiveContainer>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                                </Fragment>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            {sortedProjects.length > 10 && (
                                <div className="flex justify-center pt-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-xs"
                                        onClick={() => setShowAllProjects(prev => !prev)}
                                    >
                                        {showAllProjects ? 'Ver solo Top 10 peores' : 'Ver todos los proyectos'}
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
            </section>

            {/* Inversión interna */}
            {internalWithActivity.length > 0 && (
                <section aria-label="Inversión interna">
                <Card className="shadow-sm border border-slate-200 bg-white border-l-4 border-l-slate-400 overflow-hidden">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                                <FolderKanban className="h-4 w-4" />
                            </span>
                            Inversión interna
                        </CardTitle>
                        <CardDescription className="text-xs text-slate-500">
                            Proyectos internos (horas y coste). No forman parte del radar de rentabilidad.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="text-xs text-slate-500 uppercase bg-slate-50/80">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-medium rounded-tl-lg">Cliente / Proyecto</th>
                                        <th className="px-4 py-3 text-right font-medium">Horas reales</th>
                                        <th className="px-4 py-3 text-right font-medium rounded-tr-lg">Coste interno (€)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {internalWithActivity.map((p, idx) => {
                                        const clientName = clientById.get(p.clientId) || p.clientName || 'Cliente desconocido';
                                        const breakdown = projectEmployeesMap.get(p.projectId) || [];
                                        const cost = breakdown.reduce((sum, row) => {
                                            const emp = employees.find(e => e.id === row.employeeId);
                                            const monthlyCost = emp?.hourlyRate ?? 0;
                                            const totalH = employeeTotalHoursMap.get(row.employeeId) ?? 0;
                                            if (totalH <= 0) return sum;
                                            return sum + monthlyCost * (row.hours / totalH);
                                        }, 0);
                                        return (
                                            <tr key={p.projectId} className={cn("transition-colors", idx % 2 === 1 ? "bg-slate-50/50" : "bg-white", "hover:bg-slate-100/70")}>
                                                <td className="px-4 py-3">
                                                    <div className="font-medium text-slate-900">{p.projectName}</div>
                                                    <div className="text-[11px] text-slate-500">{clientName}</div>
                                                </td>
                                                <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-700">{(hoursMode === 'computed' ? p.computed : p.actual).toFixed(1)} h</td>
                                                <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-700">
                                                    {cost.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
                </section>
            )}

            {/* Rentabilidad por departamento y por empleado */}
            <section aria-label="Rentabilidad por área y empleados">
            <div className="grid gap-6 md:grid-cols-2">
                <Card className="shadow-sm border border-slate-200 bg-white overflow-hidden">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                                <TrendingUp className="h-4 w-4" />
                            </span>
                            Rentabilidad por departamento
                        </CardTitle>
                        <CardDescription className="text-xs text-slate-500">
                            Precio hora efectivo medio por área (proyectos con responsable asignado).
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {departmentProfitability.items.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                                <div className="rounded-full bg-slate-100 p-3 mb-2">
                                    <LayoutDashboard className="h-6 w-6 text-slate-400" />
                                </div>
                                <p className="text-sm font-medium text-slate-600">Sin datos por departamento</p>
                                <p className="text-xs text-slate-500 mt-1">No hay proyectos con departamento responsable este mes.</p>
                            </div>
                        ) : (
                            <ul className="space-y-2">
                                {departmentProfitability.items.map(dept => {
                                    const widthPct = departmentProfitability.maxEhr > 0
                                        ? (dept.ehr / departmentProfitability.maxEhr) * 100
                                        : 0;
                                    const isBelowTarget = dept.ehr < ehrTarget;
                                    return (
                                        <li key={dept.id} className="flex items-center gap-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-sm font-medium text-slate-800 truncate">{dept.name}</span>
                                                    <span
                                                        className={cn(
                                                            "text-xs font-semibold tabular-nums",
                                                            isBelowTarget ? "text-red-600" : "text-emerald-700"
                                                        )}
                                                    >
                                                        {dept.ehr.toFixed(0)} €/h
                                                    </span>
                                                </div>
                                                <div className="mt-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={cn(
                                                            "h-full rounded-full",
                                                            isBelowTarget ? "bg-red-400" : "bg-emerald-500"
                                                        )}
                                                        style={{ width: `${Math.min(100, widthPct)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </CardContent>
                </Card>

                {/* Rentabilidad por empleado (lista completa) */}
                <Card className="shadow-sm border border-slate-200 bg-white overflow-hidden">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                                <Users className="h-4 w-4" />
                            </span>
                            Rentabilidad por empleado
                        </CardTitle>
                        <CardDescription className="text-xs text-slate-500">
                            Horas (reales) y coste laboral (F1) por empleado. Ordenado por coste. Detalle en pestaña Empleados.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {employeeProfitabilityFilteredBySearch.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                                <div className="rounded-full bg-slate-100 p-3 mb-2">
                                    <UserCircle className="h-6 w-6 text-slate-400" />
                                </div>
                                <p className="text-sm font-medium text-slate-600">Sin datos de empleados</p>
                                <p className="text-xs text-slate-500 mt-1">No hay empleados con actividad este mes o no coinciden con la búsqueda.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="text-xs text-slate-500 uppercase bg-slate-50/80">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-medium rounded-tl-lg">Empleado</th>
                                            <th className="px-4 py-3 text-right font-medium">Horas (reales)</th>
                                            <th className="px-4 py-3 text-right font-medium">Ingreso atribuido (€)</th>
                                            <th className="px-4 py-3 text-right font-medium">Coste (€)</th>
                                            <th className="px-4 py-3 text-right font-medium rounded-tr-lg">Margen (€)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {[...employeeProfitabilityFilteredBySearch]
                                            .sort((a, b) => b.margin - a.margin)
                                            .map((ep, idx) => (
                                            <tr key={ep.employeeId} className={cn("transition-colors", idx % 2 === 1 ? "bg-slate-50/50" : "bg-white", "hover:bg-slate-100/70")}>
                                                <td className="px-4 py-3 font-medium text-slate-900">{ep.employeeName}</td>
                                                <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-600">{(hoursMode === 'computed' ? ep.totalComputed : ep.totalActual).toFixed(1)} h</td>
                                                <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-700">{ep.attributedRevenue.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td>
                                                <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-700">{ep.cost.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td>
                                                <td className={cn("px-4 py-3 text-right font-mono tabular-nums font-semibold", ep.margin >= 0 ? "text-emerald-700" : "text-red-600")}>
                                                    {ep.margin.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
            </section>
                </TabsContent>

                <TabsContent value="proyectos" className="space-y-6 mt-0">
                    <Card className="shadow-sm border border-slate-200 bg-white overflow-hidden">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                                    <FolderKanban className="h-4 w-4" />
                                </span>
                                Tabla de proyectos (facturables)
                            </CardTitle>
                            <CardDescription className="text-xs text-slate-500">
                                Proyectos con fee y actividad. Coste interno y margen en euros. Activa "Incluir todos los proyectos" para ver la cartera completa.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {projectMetricsBillableWithActivity.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                                    <div className="rounded-full bg-slate-100 p-4 mb-3">
                                        <FolderKanban className="h-8 w-8 text-slate-400" />
                                    </div>
                                    <p className="text-sm font-medium text-slate-600">Sin proyectos facturables</p>
                                    <p className="text-xs text-slate-500 mt-1 max-w-sm">No hay proyectos con fee y actividad este mes, o no coinciden con los filtros.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="text-xs text-slate-500 uppercase bg-slate-50/80">
                                            <tr>
                                                <th className="px-4 py-3 text-left font-medium rounded-tl-lg">Cliente / Proyecto</th>
                                                <th className="px-4 py-3 text-right font-medium">Fee (€)</th>
                                                <th className="px-4 py-3 text-right font-medium">Horas (Real / Budget)</th>
                                                <th className="px-4 py-3 text-right font-medium">EHR</th>
                                                <th className="px-4 py-3 text-right font-medium">Coste interno (€)</th>
                                                <th className="px-4 py-3 text-right font-medium">Margen (€)</th>
                                                <th className="px-4 py-3 text-right font-medium rounded-tr-lg">Acción</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {[...enrichedProjects].sort((a, b) => a.ehr - b.ehr).map(({ metric: p, clientName, ehr, ehrLabel }, idx) => {
                                                const cm = projectCostAndMarginMap.get(p.projectId) ?? { cost: 0, margin: 0 };
                                                const isExpanded = expandedProjects.has(p.projectId);
                                                const client = clients.find(c => c.id === p.clientId);
                                                const clientInitials = (clientName || '?').split(' ').slice(0, 2).map(part => part[0]).join('').toUpperCase();
                                                const attributionRows = projectEmployeeAttributionMap.get(p.projectId) || [];
                                                return (
                                                    <Fragment key={p.projectId}>
                                                    <tr className={cn("align-top transition-colors", idx % 2 === 1 ? "bg-slate-50/50" : "bg-white", "hover:bg-slate-100/70")}>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-3 max-w-[260px]">
                                                                <Avatar className="h-8 w-8 border shrink-0">
                                                                    <AvatarFallback className="bg-slate-900 text-white text-xs font-bold" style={client?.color ? { backgroundColor: client.color, color: 'white' } : undefined}>{clientInitials}</AvatarFallback>
                                                                </Avatar>
                                                                <div className="min-w-0">
                                                                    <div className="font-semibold text-slate-900 truncate">{p.projectName}</div>
                                                                    <div className="text-[11px] text-slate-500 truncate">{clientName}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-700">{p.monthlyFee.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td>
                                                        <td className="px-4 py-3 text-right font-mono text-[11px] tabular-nums text-slate-600">{(hoursMode === 'computed' ? p.computed : p.actual).toFixed(1)}h / {p.budget.toFixed(1)}h</td>
                                                        <td className="px-4 py-3 text-right"><Badge variant="outline" className="text-[11px] font-semibold tabular-nums">{ehrLabel}</Badge></td>
                                                        <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-700">{cm.cost.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td>
                                                        <td className={cn("px-4 py-3 text-right font-mono tabular-nums font-semibold", cm.margin >= 0 ? "text-emerald-700" : "text-red-600")}>{cm.margin.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td>
                                                        <td className="px-4 py-3 text-right">
                                                            <Button size="sm" variant="ghost" className="h-8 text-xs gap-1 text-slate-600 hover:text-slate-900" onClick={() => toggleProject(p.projectId)}>
                                                                {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                                                                Desglose
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                    {isExpanded && attributionRows.length > 0 && (
                                                        <tr>
                                                            <td colSpan={7} className="p-0 align-top bg-slate-50/50">
                                                                <div className="px-4 pb-3 pt-1">
                                                                    <div className="flex gap-4 items-stretch flex-wrap">
                                                                        <div className="rounded-lg border border-slate-200 bg-white overflow-x-auto shrink-0">
                                                                            <table className="text-xs table-fixed" style={{ tableLayout: 'fixed', width: '520px' }}>
                                                                                <colgroup>
                                                                                    <col style={{ width: '160px' }} />
                                                                                    <col style={{ width: '64px' }} />
                                                                                    <col style={{ width: '88px' }} />
                                                                                    <col style={{ width: '88px' }} />
                                                                                    <col style={{ width: '88px' }} />
                                                                                </colgroup>
                                                                                <thead>
                                                                                    <tr className="bg-slate-50 text-slate-500">
                                                                                        <th className="sticky left-0 z-10 bg-slate-50 pl-3 pr-2 py-2 text-left font-medium">Empleado</th>
                                                                                        <th className="px-2 py-2 text-right font-medium whitespace-nowrap">Horas</th>
                                                                                        <th className="px-2 py-2 text-right font-medium whitespace-nowrap">Ingreso atrib. (€)</th>
                                                                                        <th className="px-2 py-2 text-right font-medium whitespace-nowrap">Coste (€)</th>
                                                                                        <th className="px-2 py-2 text-right font-medium whitespace-nowrap">Margen (€)</th>
                                                                                    </tr>
                                                                                </thead>
                                                                                <tbody className="divide-y divide-slate-100">
                                                                                    {attributionRows.map((row, i) => {
                                                                                        const emp = employees.find(e => e.id === row.employeeId);
                                                                                        return (
                                                                                            <tr key={row.employeeId} className={cn(i % 2 === 1 && "bg-slate-50/50")}>
                                                                                                <td className={cn("sticky left-0 z-10 pl-3 pr-2 py-2 font-medium text-slate-800 truncate", i % 2 === 1 ? "bg-slate-50/50" : "bg-white")} title={emp?.name || 'Empleado'}>{emp?.name || 'Empleado'}</td>
                                                                                                <td className="px-2 py-2 text-right font-mono tabular-nums text-slate-600 whitespace-nowrap">{row.hours.toFixed(1)} h</td>
                                                                                                <td className="px-2 py-2 text-right font-mono tabular-nums text-slate-700 whitespace-nowrap">{row.attributedRevenue.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td>
                                                                                                <td className="px-2 py-2 text-right font-mono tabular-nums text-slate-700 whitespace-nowrap">{row.cost.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td>
                                                                                                <td className={cn("px-2 py-2 text-right font-mono tabular-nums font-medium whitespace-nowrap", row.margin >= 0 ? "text-emerald-700" : "text-red-600")}>{row.margin.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td>
                                                                                            </tr>
                                                                                        );
                                                                                    })}
                                                                                    <tr className="border-t-2 border-slate-200 bg-slate-100/80 font-semibold text-slate-800">
                                                                                        <td className="sticky left-0 z-10 bg-slate-100/80 pl-3 pr-2 py-2">Total</td>
                                                                                        <td className="px-2 py-2 text-right font-mono tabular-nums whitespace-nowrap">{attributionRows.reduce((s, r) => s + r.hours, 0).toFixed(1)} h</td>
                                                                                        <td className="px-2 py-2 text-right font-mono tabular-nums whitespace-nowrap">{attributionRows.reduce((s, r) => s + r.attributedRevenue, 0).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td>
                                                                                        <td className="px-2 py-2 text-right font-mono tabular-nums whitespace-nowrap">{attributionRows.reduce((s, r) => s + r.cost, 0).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td>
                                                                                        <td className={cn("px-2 py-2 text-right font-mono tabular-nums whitespace-nowrap", attributionRows.reduce((s, r) => s + r.margin, 0) >= 0 ? "text-emerald-700" : "text-red-600")}>{attributionRows.reduce((s, r) => s + r.margin, 0).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td>
                                                                                    </tr>
                                                                                </tbody>
                                                                            </table>
                                                                        </div>
                                                                        <div className="flex-1 min-w-[300px] rounded-xl border border-slate-200/80 bg-gradient-to-br from-slate-50/80 to-white p-4 shadow-sm flex flex-col" style={{ minHeight: '220px' }}>
                                                                            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-3">Contribución por empleado (coste + margen)</p>
                                                                            <ResponsiveContainer width="100%" height={Math.max(200, attributionRows.length * 48)}>
                                                                                <BarChart
                                                                                    layout="vertical"
                                                                                    margin={{ top: 8, right: 32, left: 12, bottom: 8 }}
                                                                                    barCategoryGap="14%"
                                                                                    barSize={22}
                                                                                    data={[...attributionRows]
                                                                                        .map(row => ({
                                                                                            name: (employees.find(e => e.id === row.employeeId)?.name || 'Empleado').split(' ')[0],
                                                                                            cost: row.cost,
                                                                                            margin: row.margin
                                                                                        }))
                                                                                        .sort((a, b) => b.margin - a.margin)}
                                                                                >
                                                                                    <defs>
                                                                                        <linearGradient id="chartCostProj" x1="0" y1="0" x2="1" y2="0" gradientUnits="userSpaceOnUse">
                                                                                            <stop stopColor="#94a3b8" />
                                                                                            <stop offset="1" stopColor="#cbd5e1" />
                                                                                        </linearGradient>
                                                                                        <linearGradient id="chartMarginPosProj" x1="0" y1="0" x2="1" y2="0" gradientUnits="userSpaceOnUse">
                                                                                            <stop stopColor="#059669" />
                                                                                            <stop offset="1" stopColor="#34d399" />
                                                                                        </linearGradient>
                                                                                        <linearGradient id="chartMarginNegProj" x1="0" y1="0" x2="1" y2="0" gradientUnits="userSpaceOnUse">
                                                                                            <stop stopColor="#dc2626" />
                                                                                            <stop offset="1" stopColor="#f87171" />
                                                                                        </linearGradient>
                                                                                    </defs>
                                                                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} vertical={true} />
                                                                                    <XAxis type="number" tickFormatter={v => `${v} €`} fontSize={11} fill="#64748b" stroke="#e2e8f0" tickLine={false} axisLine={{ stroke: '#e2e8f0' }} tick={{ fontFamily: 'inherit' }} />
                                                                                    <YAxis type="category" dataKey="name" width={60} fontSize={11} fill="#475569" tickLine={false} axisLine={false} tick={{ fontFamily: 'inherit', fontWeight: 500 }} />
                                                                                    <Tooltip
                                                                                        formatter={(value: number) => [value.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }), '']}
                                                                                        labelFormatter={label => `Empleado: ${label}`}
                                                                                        contentStyle={{ fontSize: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}
                                                                                        wrapperStyle={{ outline: 'none' }}
                                                                                        cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
                                                                                    />
                                                                                    <Legend wrapperStyle={{ fontSize: '11px' }} iconType="circle" iconSize={8} align="right" verticalAlign="top" formatter={(value) => <span className="text-slate-600 font-medium">{value}</span>} />
                                                                                    <Bar dataKey="cost" name="Coste" stackId="a" fill="url(#chartCostProj)" radius={[0, 0, 0, 0]} />
                                                                                    <Bar dataKey="margin" name="Margen" stackId="a" fill="#059669" radius={[0, 6, 6, 0]}>
                                                                                        {[...attributionRows].map((row, i) => ({ name: (employees.find(e => e.id === row.employeeId)?.name || 'Empleado').split(' ')[0], margin: row.margin })).sort((a, b) => b.margin - a.margin).map((entry, i) => (
                                                                                            <Cell key={i} fill={entry.margin >= 0 ? 'url(#chartMarginPosProj)' : 'url(#chartMarginNegProj)'} />
                                                                                        ))}
                                                                                    </Bar>
                                                                                </BarChart>
                                                                            </ResponsiveContainer>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                    </Fragment>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="empleados" className="space-y-6 mt-0">
                    <Card className="shadow-sm border border-slate-200 bg-white overflow-hidden">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                                    <UserCircle className="h-4 w-4" />
                                </span>
                                Rentabilidad por empleado
                            </CardTitle>
                            <CardDescription className="text-xs text-slate-500">
                                Horas (reales) y coste laboral (F1). Expande para ver desglose por proyecto.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {employeeProfitabilityFilteredBySearch.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                                    <div className="rounded-full bg-slate-100 p-4 mb-3">
                                        <UserCircle className="h-8 w-8 text-slate-400" />
                                    </div>
                                    <p className="text-sm font-medium text-slate-600">Sin datos de empleados</p>
                                    <p className="text-xs text-slate-500 mt-1 max-w-sm">No hay empleados con actividad este mes o no coinciden con la búsqueda.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="text-xs text-slate-500 uppercase bg-slate-50/80">
                                            <tr>
                                                <th className="px-4 py-3 text-left font-medium rounded-tl-lg">Empleado</th>
                                                <th className="px-4 py-3 text-right font-medium">Horas (reales)</th>
                                                <th className="px-4 py-3 text-right font-medium">Ingreso atribuido (€)</th>
                                                <th className="px-4 py-3 text-right font-medium">Coste (€)</th>
                                                <th className="px-4 py-3 text-right font-medium">Margen (€)</th>
                                                <th className="px-4 py-3 text-right font-medium">% margen</th>
                                                <th className="px-4 py-3 text-right font-medium rounded-tr-lg">Acción</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {[...employeeProfitabilityFilteredBySearch].sort((a, b) => b.margin - a.margin).map((ep, idx) => {
                                                const isExpanded = expandedProjects.has(`emp-${ep.employeeId}`);
                                                return (
                                                    <Fragment key={ep.employeeId}>
                                                    <tr className={cn("align-top transition-colors", idx % 2 === 1 ? "bg-slate-50/50" : "bg-white", "hover:bg-slate-100/70")}>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-3">
                                                                <Avatar className="h-8 w-8 border shrink-0">
                                                                    <AvatarFallback className="bg-slate-100 text-slate-600 text-xs font-bold">{ep.employeeName.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                                </Avatar>
                                                                <span className="font-medium text-slate-900">{ep.employeeName}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-600">{(hoursMode === 'computed' ? ep.totalComputed : ep.totalActual).toFixed(1)} h</td>
                                                        <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-700">{ep.attributedRevenue.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td>
                                                        <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-700">{ep.cost.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td>
                                                        <td className={cn("px-4 py-3 text-right font-mono tabular-nums font-semibold", ep.margin >= 0 ? "text-emerald-700" : "text-red-600")}>{ep.margin.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td>
                                                        <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-600">{ep.attributedRevenue > 0 ? `${ep.marginPercent.toFixed(1)}%` : '–'}</td>
                                                        <td className="px-4 py-3 text-right">
                                                            <Button size="sm" variant="ghost" className="h-8 text-xs gap-1 text-slate-600 hover:text-slate-900" onClick={() => toggleProject(`emp-${ep.employeeId}`)}>
                                                                {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                                                                Desglose
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                    {isExpanded && ep.byProject.length > 0 && (
                                                        <tr>
                                                            <td colSpan={7} className="p-0 align-top bg-slate-50/50">
                                                                <div className="px-4 pb-4 pt-2">
                                                                    <div className="flex gap-4 items-stretch">
                                                                        <div className="shrink-0 w-52 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                                                                            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Resumen</div>
                                                                            <dl className="space-y-3 text-sm">
                                                                                <div>
                                                                                    <dt className="text-slate-500 text-xs">Horas (reales)</dt>
                                                                                    <dd className="font-mono font-semibold text-slate-800">{(hoursMode === 'computed' ? ep.totalComputed : ep.totalActual).toFixed(1)} h</dd>
                                                                                </div>
                                                                                <div>
                                                                                    <dt className="text-slate-500 text-xs">Ingreso atribuido (€)</dt>
                                                                                    <dd className="font-mono font-semibold text-slate-800">{ep.attributedRevenue.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</dd>
                                                                                </div>
                                                                                <div>
                                                                                    <dt className="text-slate-500 text-xs">Coste laboral (€)</dt>
                                                                                    <dd className="font-mono font-semibold text-slate-800">{ep.cost.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</dd>
                                                                                </div>
                                                                                <div>
                                                                                    <dt className="text-slate-500 text-xs">Margen (€)</dt>
                                                                                    <dd className={cn("font-mono font-semibold", ep.margin >= 0 ? "text-emerald-700" : "text-red-600")}>{ep.margin.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</dd>
                                                                                </div>
                                                                                <div>
                                                                                    <dt className="text-slate-500 text-xs">% margen</dt>
                                                                                    <dd className="font-mono font-semibold text-slate-800">{ep.attributedRevenue > 0 ? `${ep.marginPercent.toFixed(1)}%` : '–'}</dd>
                                                                                </div>
                                                                            </dl>
                                                                        </div>
                                                                        <div className="rounded-xl border border-slate-200 bg-white overflow-x-auto">
                                                                            <table className="text-xs table-fixed w-max" style={{ tableLayout: 'fixed', width: '520px' }}>
                                                                                <colgroup>
                                                                                    <col style={{ width: '200px' }} />
                                                                                    <col style={{ width: '64px' }} />
                                                                                    <col style={{ width: '88px' }} />
                                                                                    <col style={{ width: '88px' }} />
                                                                                    <col style={{ width: '88px' }} />
                                                                                </colgroup>
                                                                                <thead>
                                                                                    <tr className="bg-slate-50 text-slate-500">
                                                                                        <th className="sticky left-0 z-10 bg-slate-50 pl-3 pr-2 py-2 text-left font-medium">Proyecto</th>
                                                                                        <th className="px-2 py-2 text-right font-medium whitespace-nowrap">Horas</th>
                                                                                        <th className="px-2 py-2 text-right font-medium whitespace-nowrap">Ingreso atrib. (€)</th>
                                                                                        <th className="px-2 py-2 text-right font-medium whitespace-nowrap">Coste (€)</th>
                                                                                        <th className="px-2 py-2 text-right font-medium whitespace-nowrap">Margen (€)</th>
                                                                                    </tr>
                                                                                </thead>
                                                                                <tbody className="divide-y divide-slate-100">
                                                                                    {ep.byProject.map((bp, i) => (
                                                                                        <tr key={bp.projectId} className={cn(i % 2 === 1 && "bg-slate-50/50")}>
                                                                                            <td className={cn("sticky left-0 z-10 pl-3 pr-2 py-2 font-medium text-slate-800 truncate", i % 2 === 1 ? "bg-slate-50/50" : "bg-white")} title={bp.projectName}>{bp.projectName}</td>
                                                                                            <td className="px-2 py-2 text-right font-mono tabular-nums text-slate-600 whitespace-nowrap">{bp.hours.toFixed(1)} h</td>
                                                                                            <td className="px-2 py-2 text-right font-mono tabular-nums text-slate-700 whitespace-nowrap">{bp.attributedRevenue.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td>
                                                                                            <td className="px-2 py-2 text-right font-mono tabular-nums text-slate-700 whitespace-nowrap">{bp.cost.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td>
                                                                                            <td className={cn("px-2 py-2 text-right font-mono tabular-nums font-medium whitespace-nowrap", bp.margin >= 0 ? "text-emerald-700" : "text-red-600")}>{bp.margin.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td>
                                                                                        </tr>
                                                                                    ))}
                                                                                    <tr className="border-t-2 border-slate-200 bg-slate-100/80 font-semibold text-slate-800">
                                                                                        <td className="sticky left-0 z-10 bg-slate-100/80 pl-3 pr-2 py-2">Total</td>
                                                                                        <td className="px-2 py-2 text-right font-mono tabular-nums whitespace-nowrap">{ep.byProject.reduce((s, b) => s + b.hours, 0).toFixed(1)} h</td>
                                                                                        <td className="px-2 py-2 text-right font-mono tabular-nums whitespace-nowrap">{ep.byProject.reduce((s, b) => s + b.attributedRevenue, 0).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td>
                                                                                        <td className="px-2 py-2 text-right font-mono tabular-nums whitespace-nowrap">{ep.byProject.reduce((s, b) => s + b.cost, 0).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td>
                                                                                        <td className={cn("px-2 py-2 text-right font-mono tabular-nums whitespace-nowrap", ep.byProject.reduce((s, b) => s + b.margin, 0) >= 0 ? "text-emerald-700" : "text-red-600")}>{ep.byProject.reduce((s, b) => s + b.margin, 0).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td>
                                                                                    </tr>
                                                                                </tbody>
                                                                            </table>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                    </Fragment>
                                                );
                                            })}
                                        </tbody>
                                        <tfoot>
                                            <tr className="border-t-2 border-slate-200 bg-slate-100/90 font-semibold text-slate-800">
                                                <td className="px-4 py-3">Total</td>
                                                <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-700">
                                                    {employeeProfitabilityFilteredBySearch.reduce((s, ep) => s + (hoursMode === 'computed' ? ep.totalComputed : ep.totalActual), 0).toFixed(1)} h
                                                </td>
                                                <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-700">
                                                    {employeeProfitabilityFilteredBySearch.reduce((s, ep) => s + ep.attributedRevenue, 0).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                                </td>
                                                <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-700">
                                                    {employeeProfitabilityFilteredBySearch.reduce((s, ep) => s + ep.cost, 0).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                                </td>
                                                <td className={cn("px-4 py-3 text-right font-mono tabular-nums", employeeProfitabilityFilteredBySearch.reduce((s, ep) => s + ep.margin, 0) >= 0 ? "text-emerald-700" : "text-red-600")}>
                                                    {employeeProfitabilityFilteredBySearch.reduce((s, ep) => s + ep.margin, 0).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                                </td>
                                                <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-600">
                                                    {(() => {
                                                        const totalAttr = employeeProfitabilityFilteredBySearch.reduce((s, ep) => s + ep.attributedRevenue, 0);
                                                        const totalMargin = employeeProfitabilityFilteredBySearch.reduce((s, ep) => s + ep.margin, 0);
                                                        return totalAttr > 0 ? `${((totalMargin / totalAttr) * 100).toFixed(1)}%` : '–';
                                                    })()}
                                                </td>
                                                <td className="px-4 py-3" />
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
