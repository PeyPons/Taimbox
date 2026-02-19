import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
    ArrowRight,
    Calendar,
    CheckCircle2,
    Clock,
    ListPlus,
    AlertCircle,
    TrendingUp,
    Users,
    BarChart3,
    Zap,
    Target,
    Shield,
    ChevronRight,
    CheckSquare,
    FileDown,
    MoreHorizontal,
} from 'lucide-react';

/* ─── Mockup Components ─── */

function MockCalendarGrid() {
    const weeks = ['S1', 'S2', 'S3', 'S4', 'S5'];
    const hours = [8, 6, 10, 7, 4];
    const maxHours = 10;

    return (
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 sm:p-6 shadow-2xl backdrop-blur-sm">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-indigo-500/30 flex items-center justify-center">
                        <Calendar className="h-4 w-4 text-indigo-300" />
                    </div>
                    <div>
                        <span className="text-white font-semibold text-sm">Febrero 2026</span>
                        <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">2026</span>
                    </div>
                </div>
                <div className="flex gap-1">
                    <div className="h-6 w-6 rounded bg-slate-800 flex items-center justify-center text-slate-400 text-xs">←</div>
                    <div className="h-6 px-2 rounded bg-slate-800 flex items-center justify-center text-slate-400 text-[10px]">Hoy</div>
                    <div className="h-6 w-6 rounded bg-slate-800 flex items-center justify-center text-slate-400 text-xs">→</div>
                </div>
            </div>

            {/* Grid header */}
            <div className="grid grid-cols-6 gap-1 mb-2">
                <div className="text-[10px] font-bold text-slate-500 px-2 py-1">Calendario</div>
                {weeks.map((w, i) => (
                    <div key={w} className="text-center">
                        <span className="text-[10px] font-bold text-slate-500">{w}</span>
                        <span className="block text-[8px] text-slate-600">{3 + i * 7}-{9 + i * 7} feb</span>
                    </div>
                ))}
            </div>

            {/* Employee row */}
            <div className="grid grid-cols-6 gap-1 items-center bg-slate-800/60 rounded-lg p-1.5">
                <div className="flex items-center gap-2 px-1">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-[10px] font-bold text-white">MA</div>
                    <span className="text-xs text-white/90 font-medium hidden sm:inline">María A.</span>
                </div>
                {hours.map((h, i) => {
                    const pct = (h / maxHours) * 100;
                    const color = pct > 90 ? 'bg-red-500/80' : pct > 70 ? 'bg-amber-500/80' : 'bg-emerald-500/80';
                    return (
                        <div key={i} className="flex flex-col items-center gap-1 py-1">
                            <div className="w-full h-5 rounded bg-slate-700/50 relative overflow-hidden">
                                <div className={`absolute inset-y-0 left-0 rounded ${color} transition-all duration-700`} style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-[10px] font-mono text-white/80">{h}h</span>
                        </div>
                    );
                })}
            </div>

            {/* Totals */}
            <div className="mt-3 flex items-center justify-end gap-3">
                <div className="text-right">
                    <span className="text-sm font-bold text-white">35h</span>
                    <span className="text-[10px] text-slate-400 ml-1">/ 40h</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">87.5%</span>
            </div>

            {/* Callout */}
            <div className="mt-3 flex items-start gap-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 px-3 py-2">
                <Zap className="h-3.5 w-3.5 text-indigo-400 mt-0.5 shrink-0" />
                <p className="text-[10px] text-indigo-200/80 leading-relaxed">
                    Las <strong className="text-indigo-200">semanas partidas</strong> entre meses se gestionan automáticamente. Los costes se dividen al céntimo.
                </p>
            </div>
        </div>
    );
}

function MockPriorityCards() {
    const priorities = [
        { name: 'Diseñar Home — Acme Corp', hours: '4h', deadline: 'Hoy', urgency: 'critical', color: 'red' },
        { name: 'Landing SEO — StartupX', hours: '3h', deadline: 'Mañana', urgency: 'warning', color: 'amber' },
        { name: 'Revisión copy — TechCo', hours: '2h', deadline: 'Viernes', urgency: 'normal', color: 'emerald' },
    ];

    return (
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 sm:p-6 shadow-2xl backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-orange-500/30 flex items-center justify-center">
                    <AlertCircle className="h-4 w-4 text-orange-300" />
                </div>
                <span className="text-white font-semibold text-sm">Prioridades del día</span>
            </div>

            <div className="space-y-2.5">
                {priorities.map((p, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-xl bg-slate-800/60 p-3 border border-slate-700/50 hover:border-slate-600/50 transition-colors">
                        <div className={`w-2 h-8 rounded-full ${p.color === 'red' ? 'bg-red-500' : p.color === 'amber' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-white/90 font-medium truncate">{p.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] text-slate-400 font-mono">{p.hours}</span>
                                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${p.color === 'red' ? 'bg-red-500/20 text-red-400' :
                                    p.color === 'amber' ? 'bg-amber-500/20 text-amber-400' :
                                        'bg-emerald-500/20 text-emerald-400'
                                    }`}>{p.deadline}</span>
                            </div>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-slate-600 shrink-0" />
                    </div>
                ))}
            </div>

            {/* Team Pulse mini */}
            <div className="mt-4 pt-3 border-t border-slate-700/50">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Compañeros en mis proyectos</span>
                <div className="flex items-center gap-2 mt-2">
                    {['JL', 'CR', 'PS'].map((initials, i) => (
                        <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-800/80 border border-slate-700/40">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white ${i === 0 ? 'bg-emerald-500' : i === 1 ? 'bg-amber-500' : 'bg-indigo-500'
                                }`}>{initials}</div>
                            <div className={`w-1.5 h-1.5 rounded-full ${i === 0 ? 'bg-emerald-400' : i === 1 ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function MockProjectList() {
    const projects = [
        { client: 'Acme Corp', name: 'Rediseño Web', hours: 32, budget: 40, tasks: 5 },
        { client: 'StartupX', name: 'SEO + Content', hours: 18, budget: 25, tasks: 3 },
        { client: 'TechCo', name: 'Campaña Q1', hours: 12, budget: 15, tasks: 4 },
    ];

    return (
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 sm:p-6 shadow-2xl backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-indigo-500/30 flex items-center justify-center">
                        <ListPlus className="h-4 w-4 text-indigo-300" />
                    </div>
                    <span className="text-white font-semibold text-sm">Mis proyectos</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold">{projects.length} activos</span>
            </div>

            <div className="space-y-3">
                {projects.map((p, i) => {
                    const pct = Math.round((p.hours / p.budget) * 100);
                    const color = pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-amber-500' : 'bg-emerald-500';
                    const textColor = pct > 90 ? 'text-red-400' : pct > 70 ? 'text-amber-400' : 'text-emerald-400';
                    return (
                        <div key={i} className="rounded-xl bg-slate-800/60 p-3 border border-slate-700/50">
                            <div className="flex items-center justify-between mb-2">
                                <div>
                                    <p className="text-[10px] text-indigo-400 font-medium">{p.client}</p>
                                    <p className="text-xs text-white/90 font-semibold">{p.name}</p>
                                </div>
                                <span className="text-[10px] text-slate-400">{p.tasks} tareas</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 rounded-full bg-slate-700/60 overflow-hidden">
                                    <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${pct}%` }} />
                                </div>
                                <span className={`text-[10px] font-bold ${textColor}`}>{pct}%</span>
                                <span className="text-[10px] text-slate-500 font-mono">{p.hours}/{p.budget}h</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Add tasks mockup */}
            <div className="mt-3 flex gap-2">
                <div className="flex-1 rounded-lg border border-dashed border-slate-600 p-2 flex items-center justify-center gap-1.5 text-slate-500 hover:text-slate-400 hover:border-slate-500 transition-colors cursor-default">
                    <ListPlus className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-medium">Añadir tareas</span>
                </div>
                <div className="rounded-lg border border-dashed border-slate-600 p-2 flex items-center justify-center gap-1.5 text-slate-500 cursor-default">
                    <Clock className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-medium">Interna</span>
                </div>
            </div>
        </div>
    );
}

function MockCollaborationCards() {
    const teammates = [
        { name: 'Julia López', role: 'Diseñadora', projects: 2, load: 78, avatar: 'JL' },
        { name: 'Carlos Ruiz', role: 'Developer', projects: 1, load: 92, avatar: 'CR' },
        { name: 'Paula Sanz', role: 'Copywriter', projects: 3, load: 55, avatar: 'PS' },
    ];

    return (
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 sm:p-6 shadow-2xl backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-purple-500/30 flex items-center justify-center">
                    <Users className="h-4 w-4 text-purple-300" />
                </div>
                <span className="text-white font-semibold text-sm">Compañeros</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {teammates.map((t, i) => {
                    const loadColor = t.load > 90 ? 'text-red-400' : t.load > 70 ? 'text-amber-400' : 'text-emerald-400';
                    const bgColor = t.load > 90 ? 'bg-red-500' : t.load > 70 ? 'bg-amber-500' : 'bg-emerald-500';
                    return (
                        <div key={i} className="rounded-xl bg-slate-800/60 p-3 border border-slate-700/50 flex flex-col items-center text-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white mb-2 ${i === 0 ? 'bg-gradient-to-br from-pink-500 to-purple-500' :
                                i === 1 ? 'bg-gradient-to-br from-blue-500 to-cyan-500' :
                                    'bg-gradient-to-br from-emerald-500 to-teal-500'
                                }`}>{t.avatar}</div>
                            <p className="text-xs text-white/90 font-semibold">{t.name}</p>
                            <p className="text-[10px] text-slate-400">{t.role}</p>
                            <div className="mt-2 flex items-center gap-1.5">
                                <div className="w-12 h-1 rounded-full bg-slate-700/60 overflow-hidden">
                                    <div className={`h-full rounded-full ${bgColor}`} style={{ width: `${t.load}%` }} />
                                </div>
                                <span className={`text-[10px] font-bold ${loadColor}`}>{t.load}%</span>
                            </div>
                            <p className="text-[9px] text-slate-500 mt-1">{t.projects} proyectos en común</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function MockMetricsPanel() {
    return (
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 sm:p-6 shadow-2xl backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-emerald-500/30 flex items-center justify-center">
                    <BarChart3 className="h-4 w-4 text-emerald-300" />
                </div>
                <span className="text-white font-semibold text-sm">Mis métricas</span>
            </div>

            {/* Balance mensual */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="rounded-xl bg-slate-800/60 p-3 border border-slate-700/50">
                    <p className="text-[10px] text-slate-400 mb-1">Horas planificadas</p>
                    <p className="text-lg font-bold text-white">35h</p>
                    <p className="text-[10px] text-slate-500">de 40h disponibles</p>
                </div>
                <div className="rounded-xl bg-slate-800/60 p-3 border border-slate-700/50">
                    <p className="text-[10px] text-slate-400 mb-1">Tareas completadas</p>
                    <p className="text-lg font-bold text-emerald-400">12</p>
                    <p className="text-[10px] text-slate-500">de 16 asignadas</p>
                </div>
            </div>

            {/* Reliability */}
            <div className="rounded-xl bg-gradient-to-r from-emerald-900/40 to-teal-900/30 border border-emerald-500/20 p-3">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-emerald-400" />
                        <span className="text-xs text-white/90 font-semibold">Índice de fiabilidad</span>
                    </div>
                    <span className="text-sm font-bold text-emerald-400">94%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800/60 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700" style={{ width: '94%' }} />
                </div>
                <p className="text-[9px] text-emerald-200/60 mt-1.5">Basado en tus últimas 8 semanas de planificación vs ejecución</p>
            </div>

            {/* Coherence */}
            <div className="mt-3 rounded-xl bg-slate-800/60 p-3 border border-slate-700/50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-indigo-400" />
                        <span className="text-xs text-white/90 font-medium">Control de planificación</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">OK</span>
                </div>
                <p className="text-[9px] text-slate-500 mt-1">Sin inconsistencias detectadas este mes</p>
            </div>
        </div>
    );
}

function MockWeeklyActions() {
    return (
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 sm:p-6 shadow-2xl backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-amber-500/30 flex items-center justify-center">
                    <CheckSquare className="h-4 w-4 text-amber-300" />
                </div>
                <span className="text-white font-semibold text-sm">Confirmación Weekly</span>
            </div>

            {/* Task review mockup */}
            <div className="space-y-2">
                {[
                    { name: 'Maquetación — Acme', action: 'Mantenida', icon: '✓', color: 'emerald' },
                    { name: 'Revisión SEO — StartupX', action: 'Movida a S3', icon: '→', color: 'amber' },
                    { name: 'Corrección bugs — TechCo', action: 'Completada', icon: '✓', color: 'indigo' },
                ].map((t, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-lg bg-slate-800/60 p-2.5 border border-slate-700/50">
                        <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold ${t.color === 'emerald' ? 'bg-emerald-500/20 text-emerald-400' :
                            t.color === 'amber' ? 'bg-amber-500/20 text-amber-400' :
                                'bg-indigo-500/20 text-indigo-400'
                            }`}>{t.icon}</div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[11px] text-white/90 font-medium truncate">{t.name}</p>
                        </div>
                        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${t.color === 'emerald' ? 'bg-emerald-500/20 text-emerald-400' :
                            t.color === 'amber' ? 'bg-amber-500/20 text-amber-400' :
                                'bg-indigo-500/20 text-indigo-400'
                            }`}>{t.action}</span>
                    </div>
                ))}
            </div>

            <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 h-8 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center text-[11px] font-semibold text-white cursor-default">
                    Confirmar Weekly
                </div>
                <div className="h-8 w-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center cursor-default">
                    <MoreHorizontal className="h-3.5 w-3.5 text-slate-400" />
                </div>
            </div>

            <div className="mt-3 flex items-center gap-3 pt-2 border-t border-slate-700/50">
                <div className="flex items-center gap-1.5">
                    <FileDown className="h-3 w-3 text-purple-400" />
                    <span className="text-[9px] text-slate-400">Exportar a CRM</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <TrendingUp className="h-3 w-3 text-emerald-400" />
                    <span className="text-[9px] text-slate-400">Objetivos</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <Calendar className="h-3 w-3 text-amber-400" />
                    <span className="text-[9px] text-slate-400">Ausencias</span>
                </div>
            </div>
        </div>
    );
}


/* ─── Main Article ─── */

export function EmployeeDashboardArticle() {
    return (
        <article className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 md:py-16 text-left overflow-x-hidden">

            {/* ─── HERO ─── */}
            <section className="mb-16 sm:mb-20 text-center">
                <div className="mb-6">
                    <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider text-indigo-300 bg-indigo-500/20 border border-indigo-400/30">
                        Para empleados y equipos
                    </span>
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-[1.1] tracking-tight">
                    Tu día, tus prioridades,{' '}
                    <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                        sin ruido
                    </span>
                </h1>
                <p className="text-indigo-100/90 text-base sm:text-lg lg:text-xl leading-relaxed max-w-3xl mx-auto mb-8">
                    Cada empleado tiene su propio centro de control: sabe qué hacer hoy, cuánto tiempo le queda, cómo va su planificación y qué hacen sus compañeros. Todo sin preguntar a nadie.
                </p>
                <div className="flex flex-wrap justify-center gap-3 text-sm">
                    {['Calendario personal', 'Prioridades inteligentes', 'Métricas de fiabilidad', 'Weekly feedback'].map((f, i) => (
                        <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-indigo-200/90 text-xs font-medium">
                            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                            {f}
                        </span>
                    ))}
                </div>
            </section>

            {/* ─── SECTION 1: Calendario ─── */}
            <section className="mb-16 sm:mb-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    <div className="order-2 lg:order-1">
                        <MockCalendarGrid />
                    </div>
                    <div className="order-1 lg:order-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-300/90 mb-3 block">Planificación visual</span>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 leading-tight">
                            Tu semana en un vistazo
                        </h2>
                        <p className="text-indigo-100/90 mb-4 leading-relaxed">
                            Un calendario semanal que muestra tus bloques de tiempo asignados proyecto a proyecto. Ves tu carga mensual, las horas planificadas vs capacidad, y alertas instantáneas cuando estás sobrecargado.
                        </p>
                        <ul className="space-y-3">
                            {[
                                { icon: Calendar, text: 'Navegación por meses con un clic' },
                                { icon: Zap, text: 'Semanas partidas gestionadas automáticamente' },
                                { icon: Target, text: 'Carga en tiempo real con indicadores de color' },
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

            {/* ─── SECTION 2: Prioridades ─── */}
            <section className="mb-16 sm:mb-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    <div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-orange-300/90 mb-3 block">Inteligencia contextual</span>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 leading-tight">
                            Prioridades claras, sin adivinar
                        </h2>
                        <p className="text-indigo-100/90 mb-4 leading-relaxed">
                            El sistema analiza tus tareas automáticamente: deadlines, dependencias, carga acumulada. Te presenta una lista de prioridades ordenada por urgencia real, no por «quién gritó más fuerte».
                        </p>
                        <ul className="space-y-3">
                            {[
                                { icon: AlertCircle, text: 'Detección automática de urgencia por deadline', color: 'text-red-400' },
                                { icon: Users, text: 'Vista de compañeros en tus mismos proyectos', color: 'text-purple-400' },
                                { icon: TrendingUp, text: 'Contexto de presupuesto consumido del proyecto', color: 'text-emerald-400' },
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
                    <div>
                        <MockPriorityCards />
                    </div>
                </div>
            </section>

            {/* ─── SECTION 3: Proyectos y tareas ─── */}
            <section className="mb-16 sm:mb-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    <div className="order-2 lg:order-1">
                        <MockProjectList />
                    </div>
                    <div className="order-1 lg:order-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-300/90 mb-3 block">Gestión de tareas</span>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 leading-tight">
                            Tus proyectos, tus tareas, tu control
                        </h2>
                        <p className="text-indigo-100/90 mb-4 leading-relaxed">
                            Visualiza todos los proyectos donde participas con el progreso de presupuesto en tiempo real. Añade tareas en batch, registra gestiones internas y ve el impacto de cada hora antes de asignarla.
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { label: 'Añadir tareas', desc: 'En batch, con dependencias', icon: ListPlus },
                                { label: 'Tareas internas', desc: 'Reuniones y gestiones', icon: Clock },
                                { label: 'Presupuesto visual', desc: 'Barras de consumo en vivo', icon: BarChart3 },
                                { label: 'Impacto previo', desc: 'Simulación antes de guardar', icon: Target },
                            ].map(({ label, desc, icon: Icon }, i) => (
                                <div key={i} className="rounded-xl bg-white/5 border border-white/10 p-3">
                                    <Icon className="h-4 w-4 text-indigo-400 mb-1.5" />
                                    <p className="text-xs text-white font-semibold">{label}</p>
                                    <p className="text-[10px] text-indigo-200/70">{desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── SECTION 4: Weekly & Acciones ─── */}
            <section className="mb-16 sm:mb-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    <div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-300/90 mb-3 block">Feedback continuo</span>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 leading-tight">
                            Weekly: cierra la semana en 2 minutos
                        </h2>
                        <p className="text-indigo-100/90 mb-4 leading-relaxed">
                            Cada semana, el sistema te presenta las tareas pendientes para que confirmes: ¿la mantuviste? ¿la moviste? ¿la completaste? Sin formularios largos, sin interrupciones. Solo decisiones rápidas.
                        </p>
                        <div className="rounded-xl border-l-4 border-amber-400 bg-amber-500/10 border border-amber-500/20 p-4">
                            <p className="text-indigo-100/90 text-sm m-0">
                                El empleado <strong className="text-white">nunca pierde el contexto</strong>: las tareas no revisadas se destacan con un indicador pulsante, y puede exportar su trabajo directamente al CRM de la agencia.
                            </p>
                        </div>
                    </div>
                    <div>
                        <MockWeeklyActions />
                    </div>
                </div>
            </section>

            {/* ─── SECTION 5: Colaboración ─── */}
            <section className="mb-16 sm:mb-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    <div className="order-2 lg:order-1">
                        <MockCollaborationCards />
                    </div>
                    <div className="order-1 lg:order-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-300/90 mb-3 block">Visibilidad de equipo</span>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 leading-tight">
                            Conoce a tus compañeros de proyecto
                        </h2>
                        <p className="text-indigo-100/90 mb-4 leading-relaxed">
                            Sin salir de tu dashboard, ves quién más está trabajando en tus proyectos, cuál es su carga actual y cuántos proyectos compartís. Así puedes coordinarte sin necesidad de una reunión más.
                        </p>
                        <ul className="space-y-3">
                            {[
                                'Carga actual de cada compañero',
                                'Proyectos compartidos de un vistazo',
                                'Indicadores de saturación en tiempo real',
                            ].map((text, i) => (
                                <li key={i} className="flex items-center gap-3 text-indigo-100/90 text-sm">
                                    <CheckCircle2 className="h-4 w-4 text-purple-400 shrink-0" />
                                    {text}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </section>

            {/* ─── SECTION 6: Métricas + CTA ─── */}
            <section className="mb-16 sm:mb-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    <div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300/90 mb-3 block">Métricas personales</span>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 leading-tight">
                            Tu rendimiento, medido con datos reales
                        </h2>
                        <p className="text-indigo-100/90 mb-4 leading-relaxed">
                            El índice de fiabilidad mide cuánto se ajusta tu ejecución real a la planificación. El balance mensual muestra tu carga acumulada. Y el control de coherencia detecta automáticamente inconsistencias antes de que lleguen al reporte.
                        </p>
                        <ul className="space-y-3">
                            {[
                                { icon: Shield, text: 'Índice de fiabilidad basado en 8 semanas', color: 'text-emerald-400' },
                                { icon: BarChart3, text: 'Balance mensual: planificado vs capacidad', color: 'text-indigo-400' },
                                { icon: CheckCircle2, text: 'Control de planificación automático', color: 'text-amber-400' },
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
                    <div>
                        <MockMetricsPanel />
                    </div>
                </div>
            </section>

            {/* ─── CTA FINAL ─── */}
            <section className="mb-0">
                <div className="rounded-3xl border-2 border-indigo-500/30 bg-gradient-to-br from-indigo-600/20 via-purple-600/20 to-indigo-600/20 p-6 sm:p-10">
                    <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4 text-center">
                        Dale a tu equipo la herramienta que merece
                    </h2>
                    <p className="text-indigo-100/95 mb-4 text-base sm:text-lg leading-relaxed text-center max-w-2xl mx-auto">
                        Un dashboard diseñado para que cada persona sea autónoma, productiva y consciente del impacto financiero de su trabajo. Sin micromanagement, sin ruido.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
                        {[
                            { num: '5', label: 'vistas integradas' },
                            { num: '< 2min', label: 'para cerrar la semana' },
                            { num: '94%', label: 'fiabilidad media' },
                        ].map(({ num, label }, i) => (
                            <div key={i} className="text-center p-3 rounded-xl bg-white/5 border border-white/10">
                                <p className="text-xl sm:text-2xl font-bold text-white">{num}</p>
                                <p className="text-xs text-indigo-200/70">{label}</p>
                            </div>
                        ))}
                    </div>
                    <div className="text-center">
                        <Link to="/login">
                            <Button
                                size="lg"
                                className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-12 py-7 text-lg font-bold shadow-2xl shadow-indigo-500/30 rounded-xl"
                            >
                                Probar gratis
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </Link>
                        <p className="mt-3 text-sm text-indigo-200/80">
                            Sin tarjeta de crédito. Tu equipo tendrá su panel en 2 minutos.
                        </p>
                        <Link to="/guia/mi-espacio" className="inline-flex items-center gap-1.5 mt-4 text-sm font-medium text-indigo-300/80 hover:text-white transition-colors">
                            📖 Ver guía técnica del espacio del empleado
                            <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                    </div>
                </div>
            </section>
        </article>
    );
}
