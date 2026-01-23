import { useMemo } from 'react';
import { useMarketing } from '@/contexts/MarketingContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowUpRight, ArrowDownRight, DollarSign, Target, Activity, Wallet } from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';
import { format, startOfYear, addMonths } from 'date-fns';
import { es } from 'date-fns/locale';

export function MarketingDashboard() {
    const { currentBudget, getBudgetSummary, categories, monthlyPlans, getRealSpentForPlan, getEstimatedForPlan } = useMarketing();
    const summary = getBudgetSummary();

    // 1. Prepare Burn Rate Data
    const burnRateData = useMemo(() => {
        if (!currentBudget) return [];

        const months = Array.from({ length: 12 }, (_, i) => {
            const d = addMonths(startOfYear(new Date(currentBudget.year, 0, 1)), i);
            return {
                date: d,
                monthKey: format(d, 'yyyy-MM-dd'),
                label: format(d, 'MMM', { locale: es }),
            };
        });

        let cumulativeBudget = 0;
        let cumulativeSpent = 0;
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonthIndex = now.getMonth();

        return months.map((m, index) => {
            // Filter plans for this month
            const plansInMonth = monthlyPlans.filter(p => p.month === m.monthKey);

            const monthBudget = plansInMonth.reduce((sum, p) => sum + p.budgetAllocated, 0);
            const monthSpent = plansInMonth.reduce((sum, p) => sum + getRealSpentForPlan(p.id), 0);

            cumulativeBudget += monthBudget;

            // Only add to cumulative spent if the month has passed or is current
            // Or if there is actual spend recorded
            // Logic: Show spent line up to current month (or if there's data)
            const isFuture = currentBudget.year > currentYear || (currentBudget.year === currentYear && index > currentMonthIndex);

            if (!isFuture || monthSpent > 0) {
                cumulativeSpent += monthSpent;
            }

            return {
                name: m.label,
                presupuesto: cumulativeBudget,
                gasto: (!isFuture || monthSpent > 0) ? cumulativeSpent : null, // null to break line if future
                monthlyBudget: monthBudget,
                monthlySpent: monthSpent
            };
        });
    }, [currentBudget, monthlyPlans, getRealSpentForPlan]);

    // 2. Prepare Category Distribution Data
    const categoryDistribution = useMemo(() => {
        // Get top level categories
        const topLevelCategories = categories.filter(c => !c.parentId);

        const data = topLevelCategories.map(cat => {
            // Calculate ALL spend for this category and its children
            // Recursive helper
            const getCategorySpend = (catId: string): number => {
                const plans = monthlyPlans.filter(p => p.categoryId === catId);
                const directSpend = plans.reduce((sum, p) => sum + getRealSpentForPlan(p.id), 0);

                const children = categories.filter(c => c.parentId === catId);
                const childrenSpend = children.reduce((sum, c) => sum + getCategorySpend(c.id), 0);

                return directSpend + childrenSpend;
            };

            return {
                name: cat.name,
                value: getCategorySpend(cat.id)
            };
        });

        // Filter out zero values and sort
        return data.filter(d => d.value > 0).sort((a, b) => b.value - a.value);

    }, [categories, monthlyPlans, getRealSpentForPlan]);

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'];

    if (!currentBudget) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-lg bg-slate-50/50">
                <div className="p-4 bg-slate-100 rounded-full mb-4">
                    <Wallet className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-900">No hay presupuesto seleccionado</h3>
                <p className="text-sm text-slate-500 mt-1 max-w-sm">
                    Selecciona un año fiscal en la parte superior o crea un nuevo presupuesto para comenzar.
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* KPI Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard
                    title="Presupuesto Total"
                    value={summary.totalBudget}
                    icon={DollarSign}
                    trend={null}
                    subtitle="Anual asignado"
                    color="blue"
                />
                <KpiCard
                    title="Ejecución Real"
                    value={summary.totalSpent}
                    icon={Activity}
                    trend={{ value: summary.executionRate, label: '% del total' }}
                    subtitle={`${(summary.totalBudget - summary.totalSpent).toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })} restante`}
                    color="indigo"
                />
                <KpiCard
                    title="Asignado a Campañas"
                    value={summary.totalAllocated}
                    icon={Target}
                    trend={{ value: summary.utilizationRate, label: '% planificado' }}
                    subtitle="Comprometido en planes"
                    color="emerald"
                />
                <KpiCard
                    title="Disponible Real"
                    value={summary.totalRemaining}
                    icon={Wallet}
                    trend={null}
                    subtitle="Sin asignar / Ahorro"
                    color="amber"
                />
            </div>

            {/* Main Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 border shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Evolución del Gasto Acumulado</CardTitle>
                        <CardDescription>Presupuesto Planificado vs. Gasto Real Acumulado</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[350px] w-full mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={burnRateData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorPresupuesto" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorGasto" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 12, fill: '#64748b' }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 12, fill: '#64748b' }}
                                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                        formatter={(value: number) => [value.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' }), '']}
                                    />
                                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                    <Area
                                        type="monotone"
                                        dataKey="presupuesto"
                                        name="Presupuesto Acumulado"
                                        stroke="#94a3b8"
                                        strokeDasharray="5 5"
                                        fillOpacity={1}
                                        fill="url(#colorPresupuesto)"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="gasto"
                                        name="Gasto Real Acumulado"
                                        stroke="#3b82f6"
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#colorGasto)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Distribución del Gasto</CardTitle>
                        <CardDescription>Por categorías principales</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[350px] w-full mt-4 flex items-center justify-center">
                            {categoryDistribution.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={categoryDistribution}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {categoryDistribution.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value: number) => value.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                        />
                                        <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="text-center text-muted-foreground p-8">
                                    <p className="text-sm">No hay datos de gasto registrados aún.</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Future: Recent Activity Feed */}
        </div>
    );
}

// Helper Component for KPI Cards
function KpiCard({
    title,
    value,
    icon: Icon,
    trend,
    subtitle,
    color
}: {
    title: string;
    value: number;
    icon: any;
    trend: { value: number; label: string } | null;
    subtitle: string;
    color: 'blue' | 'indigo' | 'emerald' | 'amber';
}) {
    const colorStyles = {
        blue: 'bg-blue-50 text-blue-700',
        indigo: 'bg-indigo-50 text-indigo-700',
        emerald: 'bg-emerald-50 text-emerald-700',
        amber: 'bg-amber-50 text-amber-700',
    };

    return (
        <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
                <div className="flex items-center justify-between space-x-4">
                    <div className="flex items-center space-x-4">
                        <div className={`p-2 rounded-lg ${colorStyles[color]}`}>
                            <Icon className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">{title}</p>
                            <h3 className="text-2xl font-bold tracking-tight">
                                {value.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                            </h3>
                        </div>
                    </div>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{subtitle}</span>
                    {trend && (
                        <span className={`font-medium ${trend.value > 100 ? 'text-red-600' : 'text-emerald-600'}`}>
                            {trend.value.toFixed(1)}%
                        </span>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
