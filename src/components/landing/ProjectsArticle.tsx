import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
    ArrowRight,
    CheckCircle2,
    Target,
    FolderOpen,
    Users,
    Clock,
    BarChart3,
    AlertTriangle,
    TrendingUp,
    CalendarCheck,
    Briefcase,
    ArrowUpRight,
    Flag,
    Layers,
    Settings,
    Zap,
} from 'lucide-react';

/* ─── Mockup: Projects CRUD ─── */
function MockProjects() {
    const projects = [
        { client: 'Acme Corp', name: 'Rediseño Web', budget: 40, used: 32, status: 'active', color: 'emerald' },
        { client: 'StartupX', name: 'SEO + Content', budget: 25, used: 18, status: 'active', color: 'emerald' },
        { client: 'TechCo', name: 'Campaña Q1', budget: 15, used: 14, status: 'warning', color: 'amber' },
        { client: 'MediaCo', name: 'Social Media', budget: 30, used: 30, status: 'full', color: 'red' },
    ];

    return (
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 sm:p-6 shadow-2xl backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-indigo-500/30 flex items-center justify-center">
                        <Briefcase className="h-4 w-4 text-indigo-300" />
                    </div>
                    <span className="text-white font-semibold text-sm">Proyectos activos</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold">{projects.length} proyectos</span>
            </div>

            <div className="space-y-2.5">
                {projects.map((p, i) => {
                    const pct = Math.round((p.used / p.budget) * 100);
                    const barColor = p.color === 'red' ? 'bg-red-500' : p.color === 'amber' ? 'bg-amber-500' : 'bg-emerald-500';
                    const textColor = p.color === 'red' ? 'text-red-400' : p.color === 'amber' ? 'text-amber-400' : 'text-emerald-400';
                    return (
                        <div key={i} className={`rounded-xl p-3 border ${p.color === 'red' ? 'bg-red-500/10 border-red-500/20' : 'bg-slate-800/60 border-slate-700/50'}`}>
                            <div className="flex items-center justify-between mb-1.5">
                                <div>
                                    <p className="text-[10px] text-indigo-400">{p.client}</p>
                                    <p className="text-xs text-white/90 font-semibold">{p.name}</p>
                                </div>
                                <span className={`text-[9px] px-2 py-0.5 rounded font-bold ${p.color === 'red' ? 'bg-red-500/20 text-red-400' :
                                    p.color === 'amber' ? 'bg-amber-500/20 text-amber-400' :
                                        'bg-emerald-500/20 text-emerald-400'
                                    }`}>{pct}%</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 rounded-full bg-slate-700/60 overflow-hidden">
                                    <div className={`h-full rounded-full ${barColor}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                                </div>
                                <span className="text-[9px] font-mono text-slate-400">{p.used}/{p.budget}h</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/* ─── Mockup: Deadlines ─── */
function MockDeadlines() {
    const deadlines = [
        { project: 'Rediseño Web', target: 40, current: 32, remaining: 8, weeks: 2, status: 'on-track' },
        { project: 'SEO + Content', target: 25, current: 18, remaining: 7, weeks: 3, status: 'on-track' },
        { project: 'Campaña Q1', target: 15, current: 14, remaining: 1, weeks: 1, status: 'tight' },
    ];

    return (
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 sm:p-6 shadow-2xl backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-amber-500/30 flex items-center justify-center">
                    <Target className="h-4 w-4 text-amber-300" />
                </div>
                <span className="text-white font-semibold text-sm">Deadlines — Febrero 2026</span>
            </div>

            <div className="space-y-2.5">
                {deadlines.map((d, i) => (
                    <div key={i} className={`rounded-xl p-3 border ${d.status === 'tight' ? 'bg-amber-500/10 border-amber-500/20' : 'bg-slate-800/60 border-slate-700/50'}`}>
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs text-white/90 font-semibold">{d.project}</p>
                            <div className="flex items-center gap-1">
                                {d.status === 'tight' ? (
                                    <AlertTriangle className="h-3 w-3 text-amber-400" />
                                ) : (
                                    <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                                )}
                                <span className={`text-[9px] font-bold ${d.status === 'tight' ? 'text-amber-400' : 'text-emerald-400'}`}>
                                    {d.status === 'tight' ? 'Ajustado' : 'En línea'}
                                </span>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                            <div>
                                <p className="text-[9px] text-slate-400">Objetivo</p>
                                <p className="text-xs font-bold text-white">{d.target}h</p>
                            </div>
                            <div>
                                <p className="text-[9px] text-slate-400">Ejecutado</p>
                                <p className="text-xs font-bold text-emerald-400">{d.current}h</p>
                            </div>
                            <div>
                                <p className="text-[9px] text-slate-400">Faltan</p>
                                <p className={`text-xs font-bold ${d.status === 'tight' ? 'text-amber-400' : 'text-indigo-300'}`}>{d.remaining}h en {d.weeks}s</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2">
                <Zap className="h-3.5 w-3.5 text-amber-400 mt-0.5 shrink-0" />
                <p className="text-[10px] text-amber-200/80"><strong className="text-amber-200">Campaña Q1</strong> necesita 1h en 1 semana. Sugiere asignar a Pedro S. que tiene 10h disponibles.</p>
            </div>
        </div>
    );
}

/* ─── Mockup: OKRs ─── */
function MockOKRs() {
    return (
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 sm:p-6 shadow-2xl backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-purple-500/30 flex items-center justify-center">
                    <Flag className="h-4 w-4 text-purple-300" />
                </div>
                <span className="text-white font-semibold text-sm">OKRs — Q1 2026</span>
            </div>

            <div className="space-y-3">
                <div className="rounded-xl bg-slate-800/60 p-3 border border-slate-700/50">
                    <p className="text-xs text-white/90 font-semibold mb-2">O: Aumentar rentabilidad de proyectos</p>
                    <div className="space-y-2">
                        {[
                            { kr: 'Margen > 25% en todos los proyectos', pct: 67, color: 'amber' },
                            { kr: 'Reducir horas internas un 15%', pct: 80, color: 'emerald' },
                            { kr: 'Cumplir 90% de deadlines', pct: 95, color: 'emerald' },
                        ].map((kr, i) => (
                            <div key={i}>
                                <div className="flex items-center justify-between mb-0.5">
                                    <p className="text-[10px] text-slate-400">{kr.kr}</p>
                                    <span className={`text-[9px] font-bold ${kr.color === 'emerald' ? 'text-emerald-400' : 'text-amber-400'}`}>{kr.pct}%</span>
                                </div>
                                <div className="w-full h-1.5 rounded-full bg-slate-700 overflow-hidden">
                                    <div className={`h-full rounded-full ${kr.color === 'emerald' ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${kr.pct}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-xl bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/20 p-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-white/90 font-semibold">Progreso global Q1</span>
                        <span className="text-sm font-bold text-purple-400">81%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden mt-2">
                        <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500" style={{ width: '81%' }} />
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ─── Mockup: Coherence Check ─── */
function MockCoherence() {
    return (
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 sm:p-6 shadow-2xl backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-emerald-500/30 flex items-center justify-center">
                    <Settings className="h-4 w-4 text-emerald-300" />
                </div>
                <span className="text-white font-semibold text-sm">Control de coherencia</span>
            </div>

            <div className="space-y-2">
                <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 p-2.5 border border-emerald-500/20">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <p className="text-[10px] text-emerald-200/80">Todas las tareas tienen empleado asignado</p>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 p-2.5 border border-emerald-500/20">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <p className="text-[10px] text-emerald-200/80">Presupuestos dentro de límites definidos</p>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 p-2.5 border border-amber-500/20">
                    <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                    <p className="text-[10px] text-amber-200/80">1 proyecto supera el budget override en 2h</p>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 p-2.5 border border-emerald-500/20">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <p className="text-[10px] text-emerald-200/80">Sin conflictos de horario detectados</p>
                </div>
            </div>
        </div>
    );
}


/* ─── Main Article ─── */
export function ProjectsArticle() {
    return (
        <article className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 md:py-16 text-left overflow-x-hidden">

            {/* HERO */}
            <section className="mb-16 sm:mb-20 text-center">
                <div className="mb-6">
                    <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider text-amber-300 bg-amber-500/20 border border-amber-400/30">
                        Para project managers
                    </span>
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-[1.1] tracking-tight">
                    Del briefing al deadline,{' '}
                    <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
                        sin sorpresas
                    </span>
                </h1>
                <p className="text-indigo-100/90 text-base sm:text-lg lg:text-xl leading-relaxed max-w-3xl mx-auto mb-8">
                    Gestiona clientes, proyectos, presupuestos, deadlines y OKRs desde un único punto. Con control de coherencia automática que detecta inconsistencias antes de que lleguen al reporte.
                </p>
                <div className="flex flex-wrap justify-center gap-3 text-sm">
                    {['Clientes y proyectos', 'Presupuestos en vivo', 'Deadlines mensuales', 'OKRs', 'Control de coherencia'].map((f, i) => (
                        <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-indigo-200/90 text-xs font-medium">
                            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                            {f}
                        </span>
                    ))}
                </div>
            </section>

            {/* SECTION 1: Proyectos */}
            <section className="mb-16 sm:mb-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    <div className="order-2 lg:order-1">
                        <MockProjects />
                    </div>
                    <div className="order-1 lg:order-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-300/90 mb-3 block">Gestión de proyectos</span>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 leading-tight">
                            Todos tus proyectos, un presupuesto vivo
                        </h2>
                        <p className="text-indigo-100/90 mb-4 leading-relaxed">
                            Cada proyecto tiene su cliente, su presupuesto en horas y su barra de progreso en tiempo real. Cuando se acerca al límite, lo sabes antes de que sea un problema.
                        </p>
                        <ul className="space-y-3">
                            {[
                                { icon: FolderOpen, text: 'CRUD completo de clientes y proyectos' },
                                { icon: BarChart3, text: 'Presupuesto consumido en tiempo real' },
                                { icon: AlertTriangle, text: 'Alertas automáticas al acercarse al límite' },
                            ].map(({ icon: Icon, text }, i) => (
                                <li key={i} className="flex items-center gap-3 text-indigo-100/90 text-sm">
                                    <div className="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center shrink-0">
                                        <Icon className="h-3.5 w-3.5 text-indigo-400" />
                                    </div>
                                    {text}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </section>

            {/* SECTION 2: Deadlines */}
            <section className="mb-16 sm:mb-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    <div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-300/90 mb-3 block">Objetivos mensuales</span>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 leading-tight">
                            Deadlines: cumple cada compromiso
                        </h2>
                        <p className="text-indigo-100/90 mb-4 leading-relaxed">
                            Define cuántas horas deberían completarse cada mes por proyecto. El sistema compara en tiempo real lo ejecutado vs lo planificado y sugiere redistribuciones si detecta riesgo de incumplimiento.
                        </p>
                        <div className="rounded-xl border-l-4 border-amber-400 bg-amber-500/10 border border-amber-500/20 p-4">
                            <p className="text-indigo-100/90 text-sm m-0">
                                Si un proyecto va justo de horas, el sistema <strong className="text-white">sugiere empleados con disponibilidad</strong> para asignar el trabajo restante.
                            </p>
                        </div>
                    </div>
                    <div>
                        <MockDeadlines />
                    </div>
                </div>
            </section>

            {/* SECTION 3: OKRs */}
            <section className="mb-16 sm:mb-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    <div className="order-2 lg:order-1">
                        <MockOKRs />
                    </div>
                    <div className="order-1 lg:order-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-300/90 mb-3 block">Objetivos estratégicos</span>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 leading-tight">
                            OKRs: alinea ejecución con estrategia
                        </h2>
                        <p className="text-indigo-100/90 mb-4 leading-relaxed">
                            Define objetivos ambiciosos y key results medibles. El sistema conecta automáticamente los datos del planner con tus OKRs para medir progreso real, no opiniones.
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { label: 'Objetivos', desc: 'Metas de alto nivel por Q', icon: Flag },
                                { label: 'Key Results', desc: 'Métricas medibles', icon: Target },
                                { label: 'Progreso real', desc: 'Datos del planner en vivo', icon: TrendingUp },
                                { label: 'Tracking Q', desc: 'Evolución trimestral', icon: CalendarCheck },
                            ].map(({ label, desc, icon: Icon }, i) => (
                                <div key={i} className="rounded-xl bg-white/5 border border-white/10 p-3">
                                    <Icon className="h-4 w-4 text-purple-400 mb-1.5" />
                                    <p className="text-xs text-white font-semibold">{label}</p>
                                    <p className="text-[10px] text-indigo-200/70">{desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* SECTION 4: Coherencia */}
            <section className="mb-16 sm:mb-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    <div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300/90 mb-3 block">Validación automática</span>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 leading-tight">
                            Control de coherencia: cero errores silenciosos
                        </h2>
                        <p className="text-indigo-100/90 mb-4 leading-relaxed">
                            El sistema revisa automáticamente que no haya tareas sin asignar, presupuestos excedidos, conflictos de horario o inconsistencias entre planificación y ejecución. Si detecta algo, lo marca antes de que salga en un reporte.
                        </p>
                        <ul className="space-y-3">
                            {[
                                'Tareas huérfanas sin empleado',
                                'Presupuestos que superan el override',
                                'Conflictos de horario por ausencias',
                                'Inconsistencias planificación vs ejecución',
                            ].map((text, i) => (
                                <li key={i} className="flex items-center gap-3 text-indigo-100/90 text-sm">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                                    {text}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <MockCoherence />
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="mb-0">
                <div className="rounded-3xl border-2 border-amber-500/30 bg-gradient-to-br from-amber-600/20 via-orange-600/20 to-amber-600/20 p-6 sm:p-10">
                    <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4 text-center">
                        Proyectos bajo control. Siempre.
                    </h2>
                    <p className="text-indigo-100/95 mb-6 text-base sm:text-lg leading-relaxed text-center max-w-2xl mx-auto">
                        Gestiona todo el ciclo de vida de tus proyectos: desde la creación hasta el cierre, con presupuestos en vivo, deadlines y validación automática.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
                        {[
                            { num: '0', label: 'errores silenciosos' },
                            { num: '85%', label: 'cumplimiento de deadlines' },
                            { num: '∞', label: 'proyectos simultáneos' },
                        ].map(({ num, label }, i) => (
                            <div key={i} className="text-center p-3 rounded-xl bg-white/5 border border-white/10">
                                <p className="text-xl sm:text-2xl font-bold text-white">{num}</p>
                                <p className="text-xs text-indigo-200/70">{label}</p>
                            </div>
                        ))}
                    </div>
                    <div className="text-center">
                        <Link to="/login">
                            <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white px-12 py-7 text-lg font-bold shadow-2xl shadow-amber-500/30 rounded-xl">
                                Probar gratis
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </Link>
                        <p className="mt-3 text-sm text-indigo-200/80">Sin tarjeta de crédito. Crea tu primer proyecto en 1 minuto.</p>
                        <Link to="/guia/clientes-proyectos" className="inline-flex items-center gap-1.5 mt-4 text-sm font-medium text-indigo-300/80 hover:text-white transition-colors">
                            📖 Ver guía técnica de proyectos
                            <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                    </div>
                </div>
            </section>
        </article>
    );
}
