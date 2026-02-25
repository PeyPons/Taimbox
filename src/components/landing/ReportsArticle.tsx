import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
    ArrowRight,
    CheckCircle2,
    BarChart3,
    TrendingUp,
    DollarSign,
    FileDown,
    PieChart,
    Users,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    Eye,
    FileSpreadsheet,
    Zap,
    Shield,
    Calculator,
    Clock,
    Percent,
} from 'lucide-react';

/* ─── Mockup: Profitability Dashboard ─── */
function MockProfitability() {
    const projects = [
        { client: 'Acme Corp', name: 'Rediseño Web', revenue: 12000, cost: 8500, profit: 3500, margin: 29 },
        { client: 'StartupX', name: 'SEO + Content', revenue: 5000, cost: 3200, profit: 1800, margin: 36 },
        { client: 'TechCo', name: 'Campaña Q1', revenue: 8000, cost: 9100, profit: -1100, margin: -14 },
    ];

    return (
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 sm:p-6 shadow-2xl backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-emerald-500/30 flex items-center justify-center">
                        <PieChart className="h-4 w-4 text-emerald-300" />
                    </div>
                    <span className="text-white font-semibold text-sm">Rentabilidad por proyecto</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold">Feb 2026</span>
            </div>

            <div className="space-y-2.5">
                {projects.map((p, i) => {
                    const isNegative = p.profit < 0;
                    return (
                        <div key={i} className={`rounded-xl p-3 border ${isNegative ? 'bg-red-500/10 border-red-500/20' : 'bg-slate-800/60 border-slate-700/50'}`}>
                            <div className="flex items-center justify-between mb-2">
                                <div>
                                    <p className="text-[10px] text-indigo-400">{p.client}</p>
                                    <p className="text-xs text-white/90 font-semibold">{p.name}</p>
                                </div>
                                <div className="flex items-center gap-1">
                                    {isNegative ? <ArrowDownRight className="h-3 w-3 text-red-400" /> : <ArrowUpRight className="h-3 w-3 text-emerald-400" />}
                                    <span className={`text-sm font-bold ${isNegative ? 'text-red-400' : 'text-emerald-400'}`}>{p.margin}%</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <p className="text-[9px] text-slate-400">Ingreso</p>
                                    <p className="text-[10px] font-bold text-white">{(p.revenue / 1000).toFixed(1)}k€</p>
                                </div>
                                <div>
                                    <p className="text-[9px] text-slate-400">Coste</p>
                                    <p className="text-[10px] font-bold text-white">{(p.cost / 1000).toFixed(1)}k€</p>
                                </div>
                                <div>
                                    <p className="text-[9px] text-slate-400">Beneficio</p>
                                    <p className={`text-[10px] font-bold ${isNegative ? 'text-red-400' : 'text-emerald-400'}`}>{(p.profit / 1000).toFixed(1)}k€</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/* ─── Mockup: Client Report ─── */
function MockClientReport() {
    return (
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 sm:p-6 shadow-2xl backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-purple-500/30 flex items-center justify-center">
                    <FileSpreadsheet className="h-4 w-4 text-purple-300" />
                </div>
                <span className="text-white font-semibold text-sm">Informe para cliente</span>
            </div>

            <div className="rounded-xl bg-slate-800/60 p-3 border border-slate-700/50 mb-3">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-white font-semibold">Acme Corp — Febrero 2026</p>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">Listo</span>
                </div>
                <div className="space-y-1.5">
                    {[
                        { label: 'Diseño UI/UX', hours: '32h', pct: 80 },
                        { label: 'Desarrollo front', hours: '24h', pct: 60 },
                        { label: 'Reuniones', hours: '8h', pct: 20 },
                    ].map((item, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400 w-24 truncate">{item.label}</span>
                            <div className="flex-1 h-1.5 rounded-full bg-slate-700 overflow-hidden">
                                <div className="h-full rounded-full bg-indigo-500" style={{ width: `${item.pct}%` }} />
                            </div>
                            <span className="text-[10px] font-mono text-white/80 w-8 text-right">{item.hours}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex gap-2">
                <div className="flex-1 h-8 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center text-[10px] font-semibold text-white cursor-default gap-1.5">
                    <FileDown className="h-3 w-3" />
                    Exportar PDF
                </div>
                <div className="h-8 rounded-lg border border-slate-600 px-3 flex items-center justify-center text-[10px] text-slate-400 cursor-default gap-1.5">
                    <FileDown className="h-3 w-3" />
                    Excel
                </div>
            </div>
        </div>
    );
}

/* ─── Mockup: Weekly Forecast ─── */
function MockForecast() {
    const weeks = [
        { label: 'S1', planned: 120, executed: 115, pct: 96 },
        { label: 'S2', planned: 130, executed: 128, pct: 98 },
        { label: 'S3', planned: 110, executed: 95, pct: 86 },
        { label: 'S4', planned: 125, executed: 0, pct: 0 },
    ];

    return (
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 sm:p-6 shadow-2xl backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-amber-500/30 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-amber-300" />
                </div>
                <span className="text-white font-semibold text-sm">Weekly Forecast</span>
            </div>

            <div className="space-y-2.5">
                {weeks.map((w, i) => {
                    const isCurrentWeek = i === 3;
                    return (
                        <div key={i} className={`rounded-xl p-3 border ${isCurrentWeek ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-slate-800/60 border-slate-700/50'}`}>
                            <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-white font-bold">{w.label}</span>
                                    {isCurrentWeek && <span className="text-[8px] px-1.5 py-0.5 rounded bg-indigo-500/30 text-indigo-300 font-bold">ACTUAL</span>}
                                </div>
                                <span className={`text-[10px] font-bold ${w.pct >= 90 ? 'text-emerald-400' : w.pct >= 80 ? 'text-amber-400' : w.pct > 0 ? 'text-red-400' : 'text-slate-500'}`}>
                                    {w.pct > 0 ? `${w.pct}%` : '—'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 h-2 rounded-full bg-slate-700/60 overflow-hidden">
                                    {w.pct > 0 && <div className={`h-full rounded-full ${w.pct >= 90 ? 'bg-emerald-500' : w.pct >= 80 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${w.pct}%` }} />}
                                </div>
                                <span className="text-[9px] text-slate-400 font-mono">{w.executed > 0 ? w.executed : '?'}/{w.planned}h</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2">
                <Zap className="h-3.5 w-3.5 text-amber-400 mt-0.5 shrink-0" />
                <p className="text-[10px] text-amber-200/80">S3 tuvo un <strong className="text-amber-200">86%</strong> de cumplimiento. 15h redistribuidas automáticamente a S4.</p>
            </div>
        </div>
    );
}


/* ─── Main Article ─── */
export function ReportsArticle() {
    return (
        <article className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 md:py-16 text-left overflow-x-hidden">

            {/* HERO */}
            <section className="mb-16 sm:mb-20 text-center">
                <div className="mb-6">
                    <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider text-emerald-300 bg-emerald-500/20 border border-emerald-400/30">
                        Para dirección financiera
                    </span>
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-[1.1] tracking-tight">
                    Rentabilidad por proyecto,{' '}
                    <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                        al céntimo
                    </span>
                </h1>
                <p className="text-indigo-100/90 text-base sm:text-lg lg:text-xl leading-relaxed max-w-3xl mx-auto mb-8">
                    Cada hora tiene un coste. Cada proyecto tiene un margen. Los reportes de Taimbox conectan tiempo, personas y dinero para que tomes decisiones con datos reales, no con estimaciones.
                </p>
                <div className="flex flex-wrap justify-center gap-3 text-sm">
                    {['Rentabilidad en vivo', 'Informes de cliente', 'Weekly Forecast', 'Exportaciones', 'Históricos'].map((f, i) => (
                        <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-indigo-200/90 text-xs font-medium">
                            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                            {f}
                        </span>
                    ))}
                </div>
            </section>

            {/* SECTION 1: Rentabilidad */}
            <section className="mb-16 sm:mb-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    <div className="order-2 lg:order-1">
                        <MockProfitability />
                    </div>
                    <div className="order-1 lg:order-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300/90 mb-3 block">Dashboard analítico</span>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 leading-tight">
                            ¿Ganas o pierdes dinero en cada proyecto?
                        </h2>
                        <p className="text-indigo-100/90 mb-4 leading-relaxed">
                            El dashboard de Rentabilidad muestra el valor planificado por proyecto, las horas reales computadas y el avance operativo. Ves la rentabilidad y el progreso de cada proyecto en tiempo real.
                        </p>
                        <ul className="space-y-3">
                            {[
                                { icon: DollarSign, text: 'Valor planificado y mensualidad por proyecto', color: 'text-emerald-400' },
                                { icon: Users, text: 'Horas reales vs presupuesto y avance operativo', color: 'text-indigo-400' },
                                { icon: TrendingUp, text: 'Tendencias: ¿mejora o empeora?', color: 'text-amber-400' },
                            ].map(({ icon: Icon, text, color }, i) => (
                                <li key={i} className="flex items-center gap-3 text-indigo-100/90 text-sm">
                                    <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                                        <Icon className={`h-3.5 w-3.5 ${color}`} />
                                    </div>
                                    {text}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </section>

            {/* SECTION 2: Informes de cliente */}
            <section className="mb-16 sm:mb-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    <div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-300/90 mb-3 block">Para tus clientes</span>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 leading-tight">
                            Informes profesionales, listos para enviar
                        </h2>
                        <p className="text-indigo-100/90 mb-4 leading-relaxed">
                            Genera informes por cliente con el desglose de horas por proyecto y empleado. Exporta en PDF con un clic; integración vía API para otros formatos. Tu cliente ve exactamente en qué se invirtió su presupuesto.
                        </p>
                        <div className="rounded-xl border-l-4 border-purple-400 bg-purple-500/10 border border-purple-500/20 p-4">
                            <p className="text-indigo-100/90 text-sm m-0">
                                Los informes muestran solo lo que el cliente debe ver: <strong className="text-white">horas por categoría</strong>, no los detalles internos del equipo.
                            </p>
                        </div>
                        <div className="rounded-xl border-l-4 border-teal-400 bg-teal-500/10 border border-teal-500/20 p-4 mt-3">
                            <p className="text-indigo-100/90 text-sm m-0">
                                Las horas registradas con el <strong className="text-white">cronómetro por tarea</strong> alimentan los reportes y el avance real. Más precisión en rentabilidad y facturación.
                            </p>
                        </div>
                    </div>
                    <div>
                        <MockClientReport />
                    </div>
                </div>
            </section>

            {/* SECTION 3: Weekly Forecast */}
            <section className="mb-16 sm:mb-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    <div className="order-2 lg:order-1">
                        <MockForecast />
                    </div>
                    <div className="order-1 lg:order-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-300/90 mb-3 block">Predicción semanal</span>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 leading-tight">
                            Forecast: predice antes de que sea tarde
                        </h2>
                        <p className="text-indigo-100/90 mb-4 leading-relaxed">
                            El Weekly Forecast compara lo planificado con lo ejecutado cada semana. Si una semana queda por debajo del objetivo, el sistema redistribuye automáticamente las horas restantes a la siguiente.
                        </p>
                        <ul className="space-y-3">
                            {[
                                'Comparativa semanal planificado vs ejecutado',
                                'Redistribución automática de horas no completadas',
                                'Tendencias históricas de cumplimiento',
                            ].map((text, i) => (
                                <li key={i} className="flex items-center gap-3 text-indigo-100/90 text-sm">
                                    <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
                                    {text}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </section>

            {/* SECTION: Lógica financiera (F1–F4 y EHR) */}
            <section className="mb-16 sm:mb-20" id="formulas">
                <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-800/80 to-slate-900/80 p-6 sm:p-10">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="h-10 w-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                            <Calculator className="h-5 w-5 text-cyan-300" />
                        </div>
                        <div>
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-cyan-300/90 block">Contabilidad analítica</span>
                            <h2 className="text-xl sm:text-2xl font-bold text-white">Cómo calculamos la rentabilidad</h2>
                        </div>
                    </div>
                    <p className="text-indigo-100/90 text-sm mb-6 max-w-3xl">
                        Taimbox no hace contabilidad fiscal; hace <strong className="text-white">contabilidad analítica (Unit Economics)</strong> para que el CEO tome decisiones en tiempo real. Todas las cifras del dashboard de Salud Financiera se basan en estas cuatro reglas.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        {[
                            { icon: Clock, title: 'F1 — Coste laboral', formula: 'Σ (horas reales × coste/h del empleado)', desc: 'Cuánto nos ha costado el trabajo en el proyecto. Cada empleado tiene un coste por hora (€/h); se multiplica por las horas trackeadas en ese proyecto y se suma.' },
                            { icon: DollarSign, title: 'F2 — Ingreso atribuido', formula: 'Iguala mensual del proyecto', desc: 'El ingreso del proyecto es el fee mensual (monthly_fee). No se prorratea: si el cliente paga 1.500 €/mes, el ingreso es 1.500 € desde el día 1.' },
                            { icon: Percent, title: 'F3 — Margen neto', formula: 'Ingreso − Coste laboral (− Ads si aplica)', desc: 'Margen en € y en %. Indica cuánto dinero líquido deja el proyecto. Proyectos internos (sin fee) tendrán margen negativo; se muestran en rojo.' },
                            { icon: BarChart3, title: 'F4 — Precio hora efectivo (EHR)', formula: 'Ingreso ÷ Total horas reales del proyecto', desc: 'La métrica estrella: eficiencia real. Ej: 1.500 € / 10 h = 150 €/h (excelente). Si hay 0 horas, se muestra "Sin datos" para evitar divisiones por cero.' },
                        ].map(({ icon: Icon, title, formula, desc }, i) => (
                            <div key={i} className="rounded-xl bg-slate-900/60 border border-white/10 p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Icon className="h-4 w-4 text-cyan-400 shrink-0" />
                                    <span className="text-sm font-bold text-white">{title}</span>
                                </div>
                                <p className="text-xs font-mono text-cyan-200/90 mb-2 bg-slate-800/60 px-2 py-1.5 rounded border border-white/5">{formula}</p>
                                <p className="text-[11px] text-indigo-200/80">{desc}</p>
                            </div>
                        ))}
                    </div>
                    <div className="rounded-xl border-l-4 border-amber-500/50 bg-amber-500/10 border border-amber-500/20 p-4">
                        <p className="text-indigo-100/90 text-sm m-0">
                            <strong className="text-white">Origen de los datos:</strong> Fee y horas por proyecto; coste por hora (€/h) por empleado; horas reales del cronómetro (time entries). El coste del empleado es un valor fijo por hora, no se calcula dividiendo la nómina entre las horas del mes.
                        </p>
                    </div>
                </div>
            </section>

            {/* SECTION 4: Exportaciones */}
            <section className="mb-16 sm:mb-20">
                <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 p-6 sm:p-10">
                    <div className="text-center mb-8">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300/90 mb-3 block">Exporta e integra</span>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                            PDF listo para enviar; API para tus sistemas
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                            { icon: Eye, label: 'PDF', desc: 'Informes de cliente listos para enviar con un clic (imprimir a PDF).', color: 'from-purple-500 to-pink-500' },
                            { icon: Shield, label: 'API REST', desc: 'Integración directa: exporta datos en CSV, JSON o el formato que necesites.', color: 'from-amber-500 to-orange-500' },
                        ].map(({ icon: Icon, label, desc, color }, i) => (
                            <div key={i} className="rounded-xl bg-slate-900/60 border border-white/10 p-4 text-center">
                                <div className={`w-12 h-12 mx-auto rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3`}>
                                    <Icon className="h-6 w-6 text-white" />
                                </div>
                                <p className="text-sm text-white font-semibold mb-1">{label}</p>
                                <p className="text-[11px] text-indigo-200/70">{desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="mb-0">
                <div className="rounded-3xl border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-600/20 via-teal-600/20 to-emerald-600/20 p-6 sm:p-10">
                    <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4 text-center">
                        Mide lo que importa. Actúa con datos.
                    </h2>
                    <p className="text-indigo-100/95 mb-6 text-base sm:text-lg leading-relaxed text-center max-w-2xl mx-auto">
                        Los reportes de Taimbox conectan tiempo, personas y dinero. Sabes exactamente cuánto cuesta y cuánto genera cada proyecto.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
                        {[
                            { num: '100%', label: 'trazabilidad de horas' },
                            { num: '1 clic', label: 'informe PDF para cliente' },
                            { num: '∞', label: 'datos históricos vía API' },
                        ].map(({ num, label }, i) => (
                            <div key={i} className="text-center p-3 rounded-xl bg-white/5 border border-white/10">
                                <p className="text-xl sm:text-2xl font-bold text-white">{num}</p>
                                <p className="text-xs text-indigo-200/70">{label}</p>
                            </div>
                        ))}
                    </div>
                    <div className="text-center">
                        <Link to="/login">
                            <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-12 py-7 text-lg font-bold shadow-2xl shadow-emerald-500/30 rounded-xl">
                                Probar gratis
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </Link>
                        <p className="mt-3 text-sm text-indigo-200/80">Sin tarjeta de crédito. Tus primeros reportes en 5 minutos.</p>
                        <div className="flex flex-wrap justify-center gap-4 mt-4">
                            <Link to="/guia/informes" className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-300/80 hover:text-white transition-colors">
                                📖 Ver guía técnica de reportes
                                <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                            <Link to="/reportes-rentabilidad#formulas" className="inline-flex items-center gap-1.5 text-sm font-medium text-cyan-300/80 hover:text-white transition-colors">
                                🧮 Cómo calculamos la rentabilidad (F1–F4 y EHR)
                                <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </article>
    );
}
