import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
    ArrowRight,
    CheckCircle2,
    Clock,
    Users,
    CalendarDays,
    Heart,
    Shield,
    UserCog,
    CalendarOff,
    BarChart3,
    Activity,
    TrendingUp,
    Sun,
    Moon,
    Thermometer,
    AlertTriangle,
    Timer,
} from 'lucide-react';

/* ─── Mockup: Employee Profiles ─── */
function MockProfiles() {
    const employees = [
        { name: 'María A.', role: 'Diseñadora', initials: 'MA', color: 'from-indigo-400 to-purple-500', hours: '40h/sem', schedule: 'L-V 9:00-18:00' },
        { name: 'Carlos R.', role: 'Developer', initials: 'CR', color: 'from-blue-400 to-cyan-500', hours: '35h/sem', schedule: 'L-V 8:00-15:00' },
        { name: 'Julia L.', role: 'Copywriter', initials: 'JL', color: 'from-pink-400 to-rose-500', hours: '40h/sem', schedule: 'L-J 9:00-18:30' },
    ];

    return (
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 sm:p-6 shadow-2xl backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-indigo-500/30 flex items-center justify-center">
                    <UserCog className="h-4 w-4 text-indigo-300" />
                </div>
                <span className="text-white font-semibold text-sm">Perfiles del equipo</span>
            </div>

            <div className="space-y-2.5">
                {employees.map((emp, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-xl bg-slate-800/60 p-3 border border-slate-700/50">
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${emp.color} flex items-center justify-center text-sm font-bold text-white shrink-0`}>{emp.initials}</div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-white/90 font-semibold">{emp.name}</p>
                            <p className="text-[10px] text-slate-400">{emp.role}</p>
                        </div>
                        <div className="text-right hidden sm:block">
                            <p className="text-[10px] text-indigo-300 font-mono">{emp.hours}</p>
                            <p className="text-[9px] text-slate-500">{emp.schedule}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
                {[
                    { icon: Sun, label: 'Mañana', value: '2' },
                    { icon: Clock, label: 'Partido', value: '1' },
                    { icon: Moon, label: 'Intensiva', value: '0' },
                ].map(({ icon: Icon, label, value }, i) => (
                    <div key={i} className="rounded-lg bg-slate-800/60 p-2 text-center border border-slate-700/50">
                        <Icon className="h-3 w-3 text-indigo-400 mx-auto mb-1" />
                        <p className="text-[9px] text-slate-400">{label}</p>
                        <p className="text-xs font-bold text-white">{value}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ─── Mockup: Absences Calendar ─── */
function MockAbsences() {
    return (
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 sm:p-6 shadow-2xl backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-amber-500/30 flex items-center justify-center">
                    <CalendarOff className="h-4 w-4 text-amber-300" />
                </div>
                <span className="text-white font-semibold text-sm">Ausencias — Febrero 2026</span>
            </div>

            <div className="space-y-2">
                <div className="flex items-center gap-3 rounded-xl bg-amber-500/10 p-3 border border-amber-500/20">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-[10px] font-bold text-white">MA</div>
                    <div className="flex-1">
                        <p className="text-xs text-white/90 font-semibold">María A.</p>
                        <p className="text-[10px] text-amber-300">Vacaciones • 17-21 feb</p>
                    </div>
                    <span className="text-[9px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold">5 días</span>
                </div>

                <div className="flex items-center gap-3 rounded-xl bg-red-500/10 p-3 border border-red-500/20">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center text-[10px] font-bold text-white">CR</div>
                    <div className="flex-1">
                        <p className="text-xs text-white/90 font-semibold">Carlos R.</p>
                        <p className="text-[10px] text-red-300">Baja médica • 3-7 feb</p>
                    </div>
                    <span className="text-[9px] px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-bold">5 días</span>
                </div>

                <div className="flex items-center gap-3 rounded-xl bg-indigo-500/10 p-3 border border-indigo-500/20">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-[10px] font-bold text-white">PS</div>
                    <div className="flex-1">
                        <p className="text-xs text-white/90 font-semibold">Pedro S.</p>
                        <p className="text-[10px] text-indigo-300">Asuntos propios • 14 feb</p>
                    </div>
                    <span className="text-[9px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 font-bold">1 día</span>
                </div>
            </div>

            <div className="mt-3 rounded-lg bg-slate-800/60 p-3 border border-slate-700/50">
                <p className="text-[10px] text-slate-400 mb-1">Impacto en capacidad</p>
                <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 rounded-full bg-slate-700 overflow-hidden">
                        <div className="h-full rounded-full bg-amber-500" style={{ width: '72%' }} />
                    </div>
                    <span className="text-xs font-bold text-amber-400">-28%</span>
                </div>
                <p className="text-[9px] text-slate-500 mt-1">Capacidad reducida de 800h a 576h este mes</p>
            </div>
        </div>
    );
}

/* ─── Mockup: Capacity ─── */
function MockCapacity() {
    const team = [
        { name: 'María A.', available: 32, total: 40, color: 'emerald' },
        { name: 'Carlos R.', available: 35, total: 35, color: 'emerald' },
        { name: 'Julia L.', available: 38, total: 40, color: 'amber' },
        { name: 'Pedro S.', available: 10, total: 40, color: 'red' },
    ];

    return (
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 sm:p-6 shadow-2xl backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-emerald-500/30 flex items-center justify-center">
                        <BarChart3 className="h-4 w-4 text-emerald-300" />
                    </div>
                    <span className="text-white font-semibold text-sm">Capacidad mensual</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">Feb 2026</span>
            </div>

            <div className="space-y-3">
                {team.map((t, i) => {
                    const pct = Math.round((t.available / t.total) * 100);
                    const barColor = t.color === 'red' ? 'bg-red-500' : t.color === 'amber' ? 'bg-amber-500' : 'bg-emerald-500';
                    const textColor = t.color === 'red' ? 'text-red-400' : t.color === 'amber' ? 'text-amber-400' : 'text-emerald-400';
                    return (
                        <div key={i} className="flex items-center gap-3">
                            <span className="text-[10px] text-white/80 w-16 truncate font-medium">{t.name}</span>
                            <div className="flex-1 h-3 rounded-full bg-slate-700/60 overflow-hidden">
                                <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                            </div>
                            <span className={`text-[10px] font-bold ${textColor} w-10 text-right`}>{t.available}h</span>
                            <span className="text-[9px] text-slate-500 w-8 text-right">/{t.total}h</span>
                        </div>
                    );
                })}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-slate-800/60 p-2 text-center border border-slate-700/50">
                    <p className="text-lg font-bold text-white">115h</p>
                    <p className="text-[9px] text-slate-400">Disponibles</p>
                </div>
                <div className="rounded-lg bg-slate-800/60 p-2 text-center border border-slate-700/50">
                    <p className="text-lg font-bold text-white">155h</p>
                    <p className="text-[9px] text-slate-400">Capacidad total</p>
                </div>
            </div>
        </div>
    );
}

/* ─── Mockup: Vista Tiempos ─── */
function MockTiempos() {
    const rows = [
        { name: 'María A.', task: 'Diseño landing', client: 'Acme', time: '1h 23m', color: 'from-indigo-400 to-purple-500', active: true },
        { name: 'Carlos R.', task: 'Revisión SEO', client: 'StartupX', time: '0h 45m', color: 'from-blue-400 to-cyan-500', active: true },
        { name: 'Julia L.', task: '—', client: '—', time: '—', color: 'from-pink-400 to-rose-500', active: false },
        { name: 'Pedro S.', task: 'Bugs TechCo', client: 'TechCo', time: '2h 10m', color: 'from-emerald-400 to-teal-500', active: true },
    ];
    return (
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 sm:p-6 shadow-2xl backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-teal-500/30 flex items-center justify-center">
                    <Timer className="h-4 w-4 text-teal-300" />
                </div>
                <span className="text-white font-semibold text-sm">Tiempos en vivo</span>
            </div>

            <div className="space-y-2">
                {rows.map((r, i) => (
                    <div key={i} className={`flex items-center gap-3 rounded-xl p-3 border ${r.active ? 'bg-teal-500/10 border-teal-500/20' : 'bg-slate-800/60 border-slate-700/50'}`}>
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${r.color} flex items-center justify-center text-[10px] font-bold text-white shrink-0`}>
                            {r.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-white/90 font-semibold truncate">{r.task}</p>
                            <p className="text-[10px] text-slate-400">{r.client}</p>
                        </div>
                        <span className="text-[10px] font-mono text-teal-400 font-semibold shrink-0">{r.time}</span>
                    </div>
                ))}
            </div>

            <div className="mt-3 flex items-center justify-between rounded-lg bg-slate-800/60 p-3 border border-slate-700/50">
                <span className="text-[10px] text-slate-400">Total hoy (equipo)</span>
                <span className="text-sm font-bold text-white font-mono">4h 18m</span>
            </div>
        </div>
    );
}

/* ─── Mockup: Team Pulse ─── */
function MockTeamPulse() {
    return (
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 sm:p-6 shadow-2xl backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-pink-500/30 flex items-center justify-center">
                    <Heart className="h-4 w-4 text-pink-300" />
                </div>
                <span className="text-white font-semibold text-sm">Team Pulse</span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 p-3 text-center">
                    <Thermometer className="h-5 w-5 text-emerald-400 mx-auto mb-1" />
                    <p className="text-lg font-bold text-emerald-400">72%</p>
                    <p className="text-[9px] text-slate-400">Carga media</p>
                </div>
                <div className="rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 p-3 text-center">
                    <Shield className="h-5 w-5 text-indigo-400 mx-auto mb-1" />
                    <p className="text-lg font-bold text-indigo-400">91%</p>
                    <p className="text-[9px] text-slate-400">Fiabilidad equipo</p>
                </div>
            </div>

            <div className="space-y-2">
                <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 p-2 border border-emerald-500/20">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <p className="text-[10px] text-emerald-200/80">3 de 4 empleados dentro de rango óptimo</p>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-red-500/10 p-2 border border-red-500/20">
                    <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0" />
                    <p className="text-[10px] text-red-200/80">Pedro S. al 25% — riesgo de infrautilización</p>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-indigo-500/10 p-2 border border-indigo-500/20">
                    <TrendingUp className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                    <p className="text-[10px] text-indigo-200/80">Tendencia positiva vs mes anterior (+5%)</p>
                </div>
            </div>
        </div>
    );
}


/* ─── Main Article ─── */
export function TeamArticle() {
    return (
        <article className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 md:py-16 text-left overflow-x-hidden">

            {/* HERO */}
            <section className="mb-16 sm:mb-20 text-center">
                <div className="mb-6">
                    <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider text-blue-300 bg-blue-500/20 border border-blue-400/30">
                        Para RRHH y managers
                    </span>
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-[1.1] tracking-tight">
                    Tu equipo, visible{' '}
                    <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
                        y protegido
                    </span>
                </h1>
                <p className="text-indigo-100/90 text-base sm:text-lg lg:text-xl leading-relaxed max-w-3xl mx-auto mb-8">
                    Horarios personalizados, ausencias, capacidad mensual, vista de tiempos en vivo y métricas de salud del equipo. Todo lo que necesitas para entender y cuidar a tu equipo en un solo lugar.
                </p>
                <div className="flex flex-wrap justify-center gap-3 text-sm">
                    {['Perfiles individuales', 'Gestión de ausencias', 'Capacidad mensual', 'Tiempos en vivo', 'Team Pulse', 'Horarios flexibles'].map((f, i) => (
                        <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-indigo-200/90 text-xs font-medium">
                            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                            {f}
                        </span>
                    ))}
                </div>
            </section>

            {/* SECTION 1: Perfiles */}
            <section className="mb-16 sm:mb-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    <div className="order-2 lg:order-1">
                        <MockProfiles />
                    </div>
                    <div className="order-1 lg:order-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-300/90 mb-3 block">Configuración individual</span>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 leading-tight">
                            Cada persona es única. Su horario también.
                        </h2>
                        <p className="text-indigo-100/90 mb-4 leading-relaxed">
                            Configura horarios personalizados para cada empleado: jornada completa, intensiva, parcial o lo que necesites. El sistema calcula automáticamente las horas disponibles por semana y mes.
                        </p>
                        <ul className="space-y-3">
                            {[
                                { icon: Clock, text: 'Horarios personalizados por empleado' },
                                { icon: CalendarDays, text: 'Festivos y días no laborables' },
                                { icon: UserCog, text: 'Coste por hora y departamento' },
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

            {/* SECTION 2: Ausencias */}
            <section className="mb-16 sm:mb-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    <div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-300/90 mb-3 block">Gestión de ausencias</span>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 leading-tight">
                            Vacaciones, bajas y festivos bajo control
                        </h2>
                        <p className="text-indigo-100/90 mb-4 leading-relaxed">
                            Registra ausencias por tipo: vacaciones, baja médica, asuntos propios, permisos especiales. El sistema bloquea automáticamente las asignaciones en esos días y recalcula la capacidad del equipo.
                        </p>
                        <div className="rounded-xl border-l-4 border-amber-400 bg-amber-500/10 border border-amber-500/20 p-4">
                            <p className="text-indigo-100/90 text-sm m-0">
                                Si alguien tiene vacaciones la próxima semana, el planificador <strong className="text-white">no permite asignarle tareas</strong> en ese período. Cero errores.
                            </p>
                        </div>
                    </div>
                    <div>
                        <MockAbsences />
                    </div>
                </div>
            </section>

            {/* SECTION 3: Capacidad */}
            <section className="mb-16 sm:mb-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    <div className="order-2 lg:order-1">
                        <MockCapacity />
                    </div>
                    <div className="order-1 lg:order-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300/90 mb-3 block">Visión de capacidad</span>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 leading-tight">
                            ¿Quién tiene hueco? Velo al instante.
                        </h2>
                        <p className="text-indigo-100/90 mb-4 leading-relaxed">
                            La vista de capacidad mensual muestra las horas disponibles de cada empleado después de descontar ausencias, festivos y asignaciones existentes. Nunca más sobrecargar sin saberlo.
                        </p>
                        <ul className="space-y-3">
                            {[
                                'Horas disponibles vs capacidad total',
                                'Descuento automático de ausencias',
                                'Indicadores de color por nivel de carga',
                            ].map((text, i) => (
                                <li key={i} className="flex items-center gap-3 text-indigo-100/90 text-sm">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                                    {text}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </section>

            {/* SECTION 4: Team Pulse */}
            <section className="mb-16 sm:mb-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    <div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-pink-300/90 mb-3 block">Salud del equipo</span>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 leading-tight">
                            Team Pulse: el termómetro de tu equipo
                        </h2>
                        <p className="text-indigo-100/90 mb-4 leading-relaxed">
                            Métricas en tiempo real sobre la salud de tu equipo: carga media, fiabilidad promedio, tendencias e indicadores visuales de sobrecarga. Detecta problemas antes de que se conviertan en crisis.
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { label: 'Carga media', desc: 'Nivel de ocupación global', icon: Activity },
                                { label: 'Fiabilidad', desc: 'Cumplimiento de planificación', icon: Shield },
                                { label: 'Tendencias', desc: 'Evolución vs mes anterior', icon: TrendingUp },
                                { label: 'Indicadores', desc: 'Visuales de sobrecarga y desviación', icon: AlertTriangle },
                            ].map(({ label, desc, icon: Icon }, i) => (
                                <div key={i} className="rounded-xl bg-white/5 border border-white/10 p-3">
                                    <Icon className="h-4 w-4 text-pink-400 mb-1.5" />
                                    <p className="text-xs text-white font-semibold">{label}</p>
                                    <p className="text-[10px] text-indigo-200/70">{desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <MockTeamPulse />
                    </div>
                </div>
            </section>

            {/* SECTION 5: Vista Tiempos y cronómetro */}
            <section className="mb-16 sm:mb-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    <div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-teal-300/90 mb-3 block">Tiempos en vivo</span>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 leading-tight">
                            Vista Tiempos y cronómetro por tarea
                        </h2>
                        <p className="text-indigo-100/90 mb-4 leading-relaxed">
                            Cada persona puede registrar las horas reales trabajadas con el cronómetro por tarea (planificador o Mi Día). En la página <strong className="text-white">Tiempos</strong> (menú Equipo) ves en qué está cada miembro del equipo ahora mismo: tarea, cliente y tiempo transcurrido. Parar el crono desde ahí o desde el sidebar. Las horas alimentan reportes y facturación.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {[
                                { icon: Timer, label: 'Cronómetro', desc: 'Play/Stop por tarea', color: 'text-teal-400' },
                                { icon: Clock, label: 'Total del día', desc: 'Sidebar y página Tiempos', color: 'text-teal-400' },
                                { icon: Users, label: 'Vista en vivo', desc: 'Quién trabaja en qué', color: 'text-teal-400' },
                            ].map(({ icon: Icon, label, desc, color }, i) => (
                                <div key={i} className="rounded-xl bg-white/5 border border-white/10 p-3">
                                    <Icon className={`h-4 w-4 ${color} mb-1.5`} />
                                    <p className="text-xs text-white font-semibold">{label}</p>
                                    <p className="text-[10px] text-indigo-200/70">{desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <MockTiempos />
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="mb-0">
                <div className="rounded-3xl border-2 border-blue-500/30 bg-gradient-to-br from-blue-600/20 via-cyan-600/20 to-blue-600/20 p-6 sm:p-10">
                    <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4 text-center">
                        Un equipo bien gestionado es un equipo productivo
                    </h2>
                    <p className="text-indigo-100/95 mb-6 text-base sm:text-lg leading-relaxed text-center max-w-2xl mx-auto">
                        Horarios, ausencias, capacidad y métricas de salud — todo centralizado para que cuides a tu equipo mientras optimizas su rendimiento.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
                        {[
                            { num: '0', label: 'conflictos de agenda' },
                            { num: '100%', label: 'visibilidad de capacidad' },
                            { num: '91%', label: 'fiabilidad media' },
                        ].map(({ num, label }, i) => (
                            <div key={i} className="text-center p-3 rounded-xl bg-white/5 border border-white/10">
                                <p className="text-xl sm:text-2xl font-bold text-white">{num}</p>
                                <p className="text-xs text-indigo-200/70">{label}</p>
                            </div>
                        ))}
                    </div>
                    <div className="text-center">
                        <Link to="/login">
                            <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-12 py-7 text-lg font-bold shadow-2xl shadow-blue-500/30 rounded-xl">
                                Probar gratis
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </Link>
                        <p className="mt-3 text-sm text-indigo-200/80">Sin tarjeta de crédito. Configura tu equipo en 5 minutos.</p>
                        <Link to="/guia/equipo" className="inline-flex items-center gap-1.5 mt-4 text-sm font-medium text-indigo-300/80 hover:text-white transition-colors">
                            📖 Ver guía técnica de gestión de equipos
                            <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                    </div>
                </div>
            </section>
        </article>
    );
}
