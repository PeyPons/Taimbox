import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
    ArrowRight,
    Calendar,
    CheckCircle2,
    Clock,
    Zap,
    Target,
    BarChart3,
    Users,
    AlertTriangle,
    GitBranch,
    Layers,
    MousePointerClick,
    ArrowLeftRight,
    Shield,
    TrendingUp,
    Eye,
} from 'lucide-react';

/* ─── Mockup: Planning Grid ─── */
function MockPlanningGrid() {
    const employees = [
        { name: 'María A.', initials: 'MA', color: 'from-indigo-400 to-purple-500', weeks: [8, 6, 10, 7, 4] },
        { name: 'Carlos R.', initials: 'CR', color: 'from-blue-400 to-cyan-500', weeks: [6, 8, 5, 9, 7] },
        { name: 'Julia L.', initials: 'JL', color: 'from-pink-400 to-rose-500', weeks: [10, 9, 8, 6, 3] },
        { name: 'Pedro S.', initials: 'PS', color: 'from-emerald-400 to-teal-500', weeks: [4, 7, 6, 8, 10] },
    ];
    const weeks = ['S1', 'S2', 'S3', 'S4', 'S5'];

    return (
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 sm:p-6 shadow-2xl backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-indigo-500/30 flex items-center justify-center">
                        <Calendar className="h-4 w-4 text-indigo-300" />
                    </div>
                    <span className="text-white font-semibold text-sm">Planificador — Febrero 2026</span>
                </div>
                <div className="flex gap-1">
                    <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold">4 empleados</span>
                </div>
            </div>

            {/* Header */}
            <div className="grid grid-cols-6 gap-1 mb-2">
                <div className="text-[10px] font-bold text-slate-500 px-2 py-1">Empleado</div>
                {weeks.map((w, i) => (
                    <div key={w} className="text-center">
                        <span className="text-[10px] font-bold text-slate-500">{w}</span>
                        <span className="block text-[8px] text-slate-600">{3 + i * 7}-{9 + i * 7} feb</span>
                    </div>
                ))}
            </div>

            {/* Rows */}
            {employees.map((emp, ei) => (
                <div key={ei} className={`grid grid-cols-6 gap-1 items-center rounded-lg p-1.5 mb-1 ${ei === 2 ? 'bg-red-500/10 border border-red-500/20' : 'bg-slate-800/60'}`}>
                    <div className="flex items-center gap-2 px-1">
                        <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${emp.color} flex items-center justify-center text-[9px] font-bold text-white`}>{emp.initials}</div>
                        <span className="text-[10px] text-white/90 font-medium hidden sm:inline">{emp.name}</span>
                    </div>
                    {emp.weeks.map((h, i) => {
                        const pct = (h / 10) * 100;
                        const color = pct > 90 ? 'bg-red-500/80' : pct > 70 ? 'bg-amber-500/80' : 'bg-emerald-500/80';
                        return (
                            <div key={i} className="flex flex-col items-center gap-0.5 py-1">
                                <div className="w-full h-4 rounded bg-slate-700/50 relative overflow-hidden">
                                    <div className={`absolute inset-y-0 left-0 rounded ${color}`} style={{ width: `${pct}%` }} />
                                </div>
                                <span className="text-[9px] font-mono text-white/70">{h}h</span>
                            </div>
                        );
                    })}
                </div>
            ))}

            <div className="mt-2 flex items-start gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2">
                <AlertTriangle className="h-3.5 w-3.5 text-red-400 mt-0.5 shrink-0" />
                <p className="text-[10px] text-red-200/80">Julia está al <strong className="text-red-200">100%</strong> en S1 y S2. Reasignación ágil en 1 clic o usa el asistente para que te sugiera a quién pasarle la carga.</p>
            </div>
        </div>
    );
}

/* ─── Mockup: Allocation Sheet ─── */
function MockAllocationSheet() {
    return (
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 sm:p-6 shadow-2xl backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-purple-500/30 flex items-center justify-center">
                    <MousePointerClick className="h-4 w-4 text-purple-300" />
                </div>
                <span className="text-white font-semibold text-sm">Asignar tarea</span>
            </div>

            {/* Task info */}
            <div className="rounded-xl bg-slate-800/60 p-3 border border-slate-700/50 mb-3">
                <div className="flex items-center justify-between mb-2">
                    <div>
                        <p className="text-[10px] text-indigo-400">Acme Corp — Rediseño Web</p>
                        <p className="text-xs text-white font-semibold">Maquetación página de producto</p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold">6h</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <Clock className="h-3 w-3" />
                    <span>Deadline: 14 feb</span>
                    <span className="text-slate-600">|</span>
                    <Users className="h-3 w-3" />
                    <span>María A.</span>
                </div>
            </div>

            {/* Impact preview */}
            <div className="rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 p-3 mb-3">
                <p className="text-[10px] text-indigo-300 font-semibold mb-2">Impacto antes de guardar</p>
                <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-slate-800/60 p-2">
                        <p className="text-[9px] text-slate-400">Presupuesto proyecto</p>
                        <p className="text-xs font-bold text-white">32h <span className="text-emerald-400">→ 38h</span></p>
                        <div className="w-full h-1 rounded-full bg-slate-700 mt-1 overflow-hidden">
                            <div className="h-full rounded-full bg-amber-500" style={{ width: '95%' }} />
                        </div>
                    </div>
                    <div className="rounded-lg bg-slate-800/60 p-2">
                        <p className="text-[9px] text-slate-400">Carga María S2</p>
                        <p className="text-xs font-bold text-white">6h <span className="text-amber-400">→ 12h</span></p>
                        <div className="w-full h-1 rounded-full bg-slate-700 mt-1 overflow-hidden">
                            <div className="h-full rounded-full bg-red-500" style={{ width: '120%' }} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex gap-2">
                <div className="flex-1 h-8 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center text-[11px] font-semibold text-white cursor-default">
                    Confirmar asignación
                </div>
                <div className="h-8 rounded-lg border border-slate-600 px-3 flex items-center justify-center text-[11px] text-slate-400 cursor-default">
                    Cancelar
                </div>
            </div>
        </div>
    );
}

/* ─── Mockup: Dependencies ─── */
function MockDependencies() {
    return (
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 sm:p-6 shadow-2xl backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-amber-500/30 flex items-center justify-center">
                    <GitBranch className="h-4 w-4 text-amber-300" />
                </div>
                <span className="text-white font-semibold text-sm">Dependencias</span>
            </div>

            <div className="space-y-2">
                {/* Chain */}
                <div className="rounded-xl bg-slate-800/60 p-3 border-l-4 border-emerald-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-white font-semibold">Diseño Home</p>
                            <p className="text-[10px] text-slate-400">María A. — Completada ✓</p>
                        </div>
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    </div>
                </div>

                <div className="flex justify-center">
                    <div className="w-px h-4 bg-slate-600" />
                </div>

                <div className="rounded-xl bg-slate-800/60 p-3 border-l-4 border-indigo-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-white font-semibold">Maquetación front</p>
                            <p className="text-[10px] text-slate-400">Carlos R. — En progreso</p>
                        </div>
                        <span className="text-[9px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 font-bold">En curso</span>
                    </div>
                </div>

                <div className="flex justify-center">
                    <div className="w-px h-4 bg-slate-600" />
                </div>

                <div className="rounded-xl bg-red-500/10 p-3 border-l-4 border-red-500 border border-red-500/20">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-white font-semibold">Testing QA</p>
                            <p className="text-[10px] text-red-300">Bloqueada — esperando maquetación</p>
                        </div>
                        <AlertTriangle className="h-4 w-4 text-red-400" />
                    </div>
                </div>
            </div>

            <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2">
                <Zap className="h-3.5 w-3.5 text-amber-400 mt-0.5 shrink-0" />
                <p className="text-[10px] text-amber-200/80">Identifica al instante qué tareas impiden avanzar. Si la maquetación se retrasa, ves que <strong className="text-amber-200">Testing QA</strong> está bloqueada.</p>
            </div>
        </div>
    );
}

/* ─── Mockup: Split Weeks ─── */
function MockSplitWeeks() {
    return (
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 sm:p-6 shadow-2xl backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-teal-500/30 flex items-center justify-center">
                    <ArrowLeftRight className="h-4 w-4 text-teal-300" />
                </div>
                <span className="text-white font-semibold text-sm">Costes entre meses</span>
            </div>

            {/* Visual split */}
            <div className="flex gap-2 mb-3">
                <div className="flex-1 rounded-xl bg-indigo-500/10 border border-indigo-500/20 p-3 text-center">
                    <p className="text-[10px] text-indigo-300 font-semibold">Enero</p>
                    <p className="text-[9px] text-slate-400 mt-1">Lun 27 – Mié 29</p>
                    <p className="text-sm font-bold text-white mt-1">3 días</p>
                    <p className="text-[10px] text-indigo-300 font-mono mt-1">60%</p>
                </div>
                <div className="flex items-center">
                    <ArrowLeftRight className="h-3.5 w-3.5 text-slate-500" />
                </div>
                <div className="flex-1 rounded-xl bg-purple-500/10 border border-purple-500/20 p-3 text-center">
                    <p className="text-[10px] text-purple-300 font-semibold">Febrero</p>
                    <p className="text-[9px] text-slate-400 mt-1">Jue 30 – Vie 31</p>
                    <p className="text-sm font-bold text-white mt-1">2 días</p>
                    <p className="text-[10px] text-purple-300 font-mono mt-1">40%</p>
                </div>
            </div>

            <div className="rounded-xl bg-slate-800/60 p-3 border border-slate-700/50">
                <p className="text-[10px] text-slate-400 mb-1">Tarea: Maquetación Home — 10h asignadas</p>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-indigo-300">6h → Enero</span>
                    <span className="text-[10px] text-slate-500">|</span>
                    <span className="text-xs font-bold text-purple-300">4h → Febrero</span>
                </div>
                <p className="text-[9px] text-emerald-400/80 mt-1.5">✓ Coste dividido automáticamente al céntimo</p>
            </div>
        </div>
    );
}

/* ─── Main Article ─── */
export function PlannerArticle() {
    return (
        <article className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 md:py-16 text-left overflow-x-hidden">

            {/* HERO */}
            <section className="mb-16 sm:mb-20 text-center">
                <div className="mb-6">
                    <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider text-indigo-300 bg-indigo-500/20 border border-indigo-400/30">
                        Para directores y managers
                    </span>
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-[1.1] tracking-tight">
                    Cada hora cuenta.{' '}
                    <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                        Visualiza todas.
                    </span>
                </h1>
                <p className="text-indigo-100/90 text-base sm:text-lg lg:text-xl leading-relaxed max-w-3xl mx-auto mb-8">
                    El planificador central de Taimbox te muestra quién hace qué, cuándo y con qué impacto financiero. Asigna tareas, detecta sobrecargas y gestiona dependencias desde una sola vista.
                </p>
                <div className="flex flex-wrap justify-center gap-3 text-sm">
                    {['Grid visual', 'Reasignación ágil en 1 clic', 'Impacto antes de guardar', 'Dependencias', 'Semanas partidas', 'Indicadores de sobrecarga'].map((f, i) => (
                        <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-indigo-200/90 text-xs font-medium">
                            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                            {f}
                        </span>
                    ))}
                </div>
            </section>

            {/* SECTION 1: Grid de planificación */}
            <section className="mb-16 sm:mb-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    <div className="order-2 lg:order-1">
                        <MockPlanningGrid />
                    </div>
                    <div className="order-1 lg:order-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-300/90 mb-3 block">Vista principal</span>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 leading-tight">
                            Tu equipo en una cuadrícula
                        </h2>
                        <p className="text-indigo-100/90 mb-4 leading-relaxed">
                            Cada fila es un empleado. Cada columna es una semana. Las barras de color muestran la carga en tiempo real: verde, ámbar o rojo. Un vistazo basta para saber quién está disponible y quién no.
                        </p>
                        <ul className="space-y-3">
                            {[
                                { icon: Eye, text: 'Vista global de todo el equipo' },
                                { icon: Calendar, text: 'Navegación por meses con un clic' },
                                { icon: AlertTriangle, text: 'Indicadores visuales de sobrecarga al instante' },
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

            {/* SECTION 2: Asignación inteligente */}
            <section className="mb-16 sm:mb-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    <div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-300/90 mb-3 block">Asignación con contexto</span>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 leading-tight">
                            Sabes lo que va a pasar antes de que pase
                        </h2>
                        <p className="text-indigo-100/90 mb-4 leading-relaxed">
                            Antes de guardar una asignación, ves exactamente el impacto. Además, el asistente inteligente de reasignación detecta quién está saturado y te sugiere con nombre y apellido a quién pasarle la carga, cruzando automáticamente los proyectos que tienen en común. En Deadlines tienes las mismas sugerencias con condicionantes: quién puede ceder, límites de carga para quien recibe y resumen de impacto antes de aplicar. Decisiones informadas en segundos.
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { label: 'Presupuesto', desc: 'Consumo del proyecto en vivo', icon: BarChart3 },
                                { label: 'Carga', desc: 'Horas del empleado esa semana', icon: Users },
                                { label: 'Conflictos', desc: 'Indicadores de sobrecarga y bloqueos', icon: AlertTriangle },
                                { label: 'Deadlines', desc: 'Fechas límite afectadas', icon: Target },
                            ].map(({ label, desc, icon: Icon }, i) => (
                                <div key={i} className="rounded-xl bg-white/5 border border-white/10 p-3">
                                    <Icon className="h-4 w-4 text-purple-400 mb-1.5" />
                                    <p className="text-xs text-white font-semibold">{label}</p>
                                    <p className="text-[10px] text-indigo-200/70">{desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <MockAllocationSheet />
                    </div>
                </div>
            </section>

            {/* SECTION 3: Dependencias */}
            <section className="mb-16 sm:mb-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    <div className="order-2 lg:order-1">
                        <MockDependencies />
                    </div>
                    <div className="order-1 lg:order-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-300/90 mb-3 block">Gestión de bloqueos</span>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 leading-tight">
                            Control estricto de bloqueos
                        </h2>
                        <p className="text-indigo-100/90 mb-4 leading-relaxed">
                            Identifica al instante qué tareas impiden avanzar a tu equipo. Gestión de dependencias integrada: Taimbox te avisa si una tarea está bloqueando a otra, para que actúes a tiempo.
                        </p>
                        <ul className="space-y-3">
                            {[
                                { icon: GitBranch, text: 'Gestión de dependencias integrada', color: 'text-amber-400' },
                                { icon: AlertTriangle, text: 'Identifica qué tareas impiden avanzar', color: 'text-red-400' },
                                { icon: Zap, text: 'Control estricto de bloqueos', color: 'text-emerald-400' },
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

            {/* SECTION 4: Semanas partidas */}
            <section className="mb-16 sm:mb-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    <div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-teal-300/90 mb-3 block">Gestión financiera</span>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 leading-tight">
                            Semanas partidas, costes perfectos
                        </h2>
                        <p className="text-indigo-100/90 mb-4 leading-relaxed">
                            Cuando una semana cae entre dos meses, el sistema divide automáticamente las horas y los costes proporcionalmente. Cada mes refleja exactamente lo que corresponde, sin ajustes manuales.
                        </p>
                        <div className="rounded-xl border-l-4 border-teal-400 bg-teal-500/10 border border-teal-500/20 p-4">
                            <p className="text-indigo-100/90 text-sm m-0">
                                El coste por hora de cada empleado se aplica de forma precisa. Si un empleado trabaja 3 días en enero y 2 en febrero, el coste se divide <strong className="text-white">al céntimo</strong>.
                            </p>
                        </div>
                    </div>
                    <div>
                        <MockSplitWeeks />
                    </div>
                </div>
            </section>

            {/* SECTION 5: Multiproyecto */}
            <section className="mb-16 sm:mb-20">
                <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 p-6 sm:p-10">
                    <div className="text-center mb-8">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-300/90 mb-3 block">Visión 360°</span>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                            Un planificador, múltiples dimensiones
                        </h2>
                        <p className="text-indigo-100/90 max-w-2xl mx-auto">
                            No es solo un calendario. Es la única fuente de verdad de tu agencia: tiempo, dinero, personas y proyectos, todo conectado.
                        </p>
                        <p className="text-indigo-100/80 text-sm max-w-2xl mx-auto mt-3">
                            En vista semanal, mensual y en Mi Día puedes usar el <strong className="text-white">cronómetro por tarea</strong> para registrar las horas reales; la página Tiempos (Equipo) muestra en vivo quién está trabajando en qué.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { icon: Layers, label: 'Multi-proyecto', desc: 'Visualiza todos los proyectos simultáneamente.', color: 'from-indigo-500 to-purple-500' },
                            { icon: Users, label: 'Multi-empleado', desc: 'Compara cargas cruzando empleados.', color: 'from-purple-500 to-pink-500' },
                            { icon: BarChart3, label: 'Multi-mes', desc: 'Navega entre meses sin perder contexto.', color: 'from-blue-500 to-cyan-500' },
                            { icon: Shield, label: 'Multi-permiso', desc: 'Cada rol ve solo lo que le corresponde.', color: 'from-emerald-500 to-teal-500' },
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
                <div className="rounded-3xl border-2 border-indigo-500/30 bg-gradient-to-br from-indigo-600/20 via-purple-600/20 to-indigo-600/20 p-6 sm:p-10">
                    <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4 text-center">
                        Planifica con datos, no con intuición
                    </h2>
                    <p className="text-indigo-100/95 mb-6 text-base sm:text-lg leading-relaxed text-center max-w-2xl mx-auto">
                        El planificador de Taimbox convierte las suposiciones en certezas. Ve el impacto de cada decisión antes de tomarla.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
                        {[
                            { num: '100%', label: 'visibilidad de carga' },
                            { num: '< 30s', label: 'para detectar sobrecargas (indicadores visuales)' },
                            { num: '0', label: 'sorpresas de presupuesto' },
                        ].map(({ num, label }, i) => (
                            <div key={i} className="text-center p-3 rounded-xl bg-white/5 border border-white/10">
                                <p className="text-xl sm:text-2xl font-bold text-white">{num}</p>
                                <p className="text-xs text-indigo-200/70">{label}</p>
                            </div>
                        ))}
                    </div>
                    <div className="text-center">
                        <Link to="/login">
                            <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-12 py-7 text-lg font-bold shadow-2xl shadow-indigo-500/30 rounded-xl">
                                Probar gratis
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </Link>
                        <p className="mt-3 text-sm text-indigo-200/80">Sin tarjeta de crédito. Tu planificador estará listo en 2 minutos.</p>
                        <Link to="/guia/planificador" className="inline-flex items-center gap-1.5 mt-4 text-sm font-medium text-indigo-300/80 hover:text-white transition-colors">
                            📖 Ver guía técnica detallada del planificador
                            <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                    </div>
                </div>
            </section>
        </article>
    );
}
