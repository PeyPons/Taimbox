import {
    Calendar, Clock, Users, BarChart3, CheckCircle2, AlertTriangle,
    Zap, Shield, Target, FolderKanban, Plug, MousePointerClick,
    TrendingUp, ArrowRight, FileDown, MessageSquare, Wifi,
} from 'lucide-react';

/* ─── Mockup: Planning Grid ─── */
export function MockPlanningGrid() {
    const employees = [
        { name: 'María A.', initials: 'MA', color: 'from-indigo-400 to-purple-500', weeks: [8, 6, 10, 7] },
        { name: 'Carlos R.', initials: 'CR', color: 'from-blue-400 to-cyan-500', weeks: [6, 8, 5, 9] },
        { name: 'Julia L.', initials: 'JL', color: 'from-pink-400 to-rose-500', weeks: [10, 9, 8, 6] },
        { name: 'Pedro S.', initials: 'PS', color: 'from-emerald-400 to-teal-500', weeks: [4, 7, 6, 8] },
    ];
    const weeks = ['S1', 'S2', 'S3', 'S4'];

    return (
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 sm:p-5 shadow-2xl backdrop-blur-sm w-full max-w-md">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-indigo-500/30 flex items-center justify-center">
                        <Calendar className="h-4 w-4 text-indigo-300" />
                    </div>
                    <span className="text-white font-semibold text-sm">Planificador — Feb 2026</span>
                </div>
                <span className="text-xs px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 font-semibold">4 empleados</span>
            </div>
            <div className="grid grid-cols-5 gap-1.5 mb-2">
                <div className="text-xs font-bold text-slate-500 px-1">Empleado</div>
                {weeks.map(w => (
                    <div key={w} className="text-center text-xs font-bold text-slate-500">{w}</div>
                ))}
            </div>
            {employees.map((emp, ei) => (
                <div key={ei} className={`grid grid-cols-5 gap-1.5 items-center rounded-lg p-2 mb-1 ${ei === 2 ? 'bg-red-500/10 border border-red-500/20' : 'bg-slate-800/60'}`}>
                    <div className="flex items-center gap-2 px-1">
                        <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${emp.color} flex items-center justify-center text-xs font-bold text-white`}>{emp.initials}</div>
                        <span className="text-xs text-white/90 font-medium hidden sm:inline">{emp.name}</span>
                    </div>
                    {emp.weeks.map((h, i) => {
                        const pct = (h / 10) * 100;
                        const color = pct > 90 ? 'bg-red-500/80' : pct > 70 ? 'bg-amber-500/80' : 'bg-emerald-500/80';
                        return (
                            <div key={i} className="flex flex-col items-center gap-0.5">
                                <div className="w-full h-3.5 rounded bg-slate-700/50 relative overflow-hidden">
                                    <div className={`absolute inset-y-0 left-0 rounded ${color}`} style={{ width: `${pct}%` }} />
                                </div>
                                <span className="text-xs font-mono text-white/70">{h}h</span>
                            </div>
                        );
                    })}
                </div>
            ))}
            <div className="mt-2 flex items-start gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-2.5 py-2">
                <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                <p className="text-xs text-red-200/90">Julia al <strong className="text-red-200">100%</strong> en S1-S2. Redistribuir carga.</p>
            </div>
        </div>
    );
}

/* ─── Mockup: Allocation Sheet ─── */
export function MockAllocationSheet() {
    return (
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 sm:p-5 shadow-2xl backdrop-blur-sm w-full max-w-sm">
            <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-lg bg-purple-500/30 flex items-center justify-center">
                    <MousePointerClick className="h-4 w-4 text-purple-300" />
                </div>
                <span className="text-white font-semibold text-sm">Asignar tarea</span>
            </div>
            <div className="rounded-xl bg-slate-800/60 p-3 border border-slate-700/50 mb-2">
                <p className="text-xs text-indigo-400">Acme Corp — Rediseño Web</p>
                <p className="text-sm text-white font-semibold">Maquetación producto</p>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-1.5">
                    <Clock className="h-3.5 w-3.5" /><span>Deadline: 14 feb</span>
                    <span className="text-slate-600">|</span>
                    <Users className="h-3.5 w-3.5" /><span>María A.</span>
                </div>
            </div>
            <div className="rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 p-3 mb-2">
                <p className="text-xs text-indigo-300 font-semibold mb-2">Impacto antes de guardar</p>
                <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-slate-800/60 p-2.5">
                        <p className="text-xs text-slate-400">Presupuesto</p>
                        <p className="text-sm font-bold text-white">32h <span className="text-emerald-400">→ 38h</span></p>
                        <div className="w-full h-1.5 rounded-full bg-slate-700 mt-1 overflow-hidden">
                            <div className="h-full rounded-full bg-amber-500" style={{ width: '95%' }} />
                        </div>
                    </div>
                    <div className="rounded-lg bg-slate-800/60 p-2.5">
                        <p className="text-xs text-slate-400">Carga María S2</p>
                        <p className="text-sm font-bold text-white">6h <span className="text-red-400">→ 12h</span></p>
                        <div className="w-full h-1.5 rounded-full bg-slate-700 mt-1 overflow-hidden">
                            <div className="h-full rounded-full bg-red-500" style={{ width: '100%' }} />
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex gap-2">
                <div className="flex-1 h-8 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center text-sm font-semibold text-white">Confirmar</div>
                <div className="h-8 rounded-lg border border-slate-600 px-4 flex items-center justify-center text-sm text-slate-400">Cancelar</div>
            </div>
        </div>
    );
}

/* ─── Mockup: Employee Dashboard ─── */
export function MockDashboard() {
    const tasks = [
        { project: 'Acme Corp', task: 'Diseño landing', hours: '3h', statusColor: 'bg-emerald-500' },
        { project: 'Beta Inc', task: 'Revisión copy ads', hours: '1.5h', statusColor: 'bg-amber-500' },
        { project: 'Gamma Ltd', task: 'Informe mensual', hours: '2h', statusColor: 'bg-indigo-500' },
    ];
    return (
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 sm:p-5 shadow-2xl backdrop-blur-sm w-full max-w-sm">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-xs font-bold text-white">MA</div>
                    <div>
                        <p className="text-sm text-white font-semibold">Mi día — Lunes 10 feb</p>
                        <p className="text-xs text-slate-400">3 tareas · 6.5h planificadas</p>
                    </div>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">On track</span>
            </div>
            <div className="space-y-2">
                {tasks.map((t, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-xl bg-slate-800/60 p-2.5 border border-slate-700/50">
                        <div className={`w-1.5 h-8 rounded-full ${t.statusColor}`} />
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-slate-400">{t.project}</p>
                            <p className="text-sm text-white font-medium truncate">{t.task}</p>
                        </div>
                        <span className="text-sm font-mono font-bold text-white/70">{t.hours}</span>
                    </div>
                ))}
            </div>
            <div className="mt-3 rounded-xl bg-gradient-to-r from-emerald-900/40 to-teal-900/30 border border-emerald-500/20 p-2.5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-emerald-400" />
                        <span className="text-sm text-white/90 font-semibold">Fiabilidad</span>
                    </div>
                    <span className="text-sm font-bold text-emerald-400">94%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800/60 overflow-hidden mt-1.5">
                    <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400" style={{ width: '94%' }} />
                </div>
            </div>
        </div>
    );
}

/* ─── Mockup: Team Capacity ─── */
export function MockTeamCapacity() {
    const team = [
        { name: 'María A.', role: 'Diseño', pct: 87, bg: 'bg-emerald-500', text: 'text-emerald-400' },
        { name: 'Carlos R.', role: 'Desarrollo', pct: 95, bg: 'bg-amber-500', text: 'text-amber-400' },
        { name: 'Julia L.', role: 'PPC', pct: 100, bg: 'bg-red-500', text: 'text-red-400' },
        { name: 'Pedro S.', role: 'Contenido', pct: 60, bg: 'bg-emerald-500', text: 'text-emerald-400' },
    ];
    return (
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 sm:p-5 shadow-2xl backdrop-blur-sm w-full max-w-sm">
            <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-lg bg-blue-500/30 flex items-center justify-center">
                    <Users className="h-4 w-4 text-blue-300" />
                </div>
                <span className="text-white font-semibold text-sm">Capacidad del equipo — Feb 2026</span>
            </div>
            <div className="space-y-2.5">
                {team.map((m, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <div className="w-20 text-right">
                            <p className="text-sm text-white font-medium">{m.name}</p>
                            <p className="text-xs text-slate-500">{m.role}</p>
                        </div>
                        <div className="flex-1 h-3.5 rounded-full bg-slate-700/50 overflow-hidden">
                            <div className={`h-full rounded-full ${m.bg}`} style={{ width: `${Math.min(m.pct, 100)}%` }} />
                        </div>
                        <span className={`text-sm font-bold ${m.text} w-9 text-right`}>{m.pct}%</span>
                    </div>
                ))}
            </div>
            <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-2.5 py-2">
                <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-200/90">Carlos está al 95%. Julia sobrecargada (100%). Considera reasignar.</p>
            </div>
        </div>
    );
}

/* ─── Mockup: Reports ─── */
export function MockReportsDashboard() {
    const clients = [
        { name: 'Acme Corp', budget: '40h', used: '35h', pct: 87, profit: '+2.400€', bg: 'bg-emerald-500', text: 'text-emerald-400' },
        { name: 'Beta Inc', budget: '25h', used: '28h', pct: 112, profit: '-1.200€', bg: 'bg-red-500', text: 'text-red-400' },
        { name: 'Gamma Ltd', budget: '60h', used: '45h', pct: 75, profit: '+5.100€', bg: 'bg-emerald-500', text: 'text-emerald-400' },
    ];
    return (
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 sm:p-5 shadow-2xl backdrop-blur-sm w-full max-w-md">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-emerald-500/30 flex items-center justify-center">
                        <BarChart3 className="h-4 w-4 text-emerald-300" />
                    </div>
                    <span className="text-white font-semibold text-sm">Rentabilidad por cliente</span>
                </div>
                <div className="flex gap-1">
                    <FileDown className="h-4 w-4 text-slate-400" />
                </div>
            </div>
            <div className="space-y-2">
                {clients.map((c, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-xl bg-slate-800/60 p-2.5 border border-slate-700/50">
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-white font-medium">{c.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-slate-400">{c.used} / {c.budget}</span>
                                <div className="flex-1 h-2 rounded-full bg-slate-700/50 overflow-hidden">
                                    <div className={`h-full rounded-full ${c.bg}`} style={{ width: `${Math.min(c.pct, 100)}%` }} />
                                </div>
                            </div>
                        </div>
                        <span className={`text-sm font-bold ${c.text}`}>{c.profit}</span>
                    </div>
                ))}
            </div>
            <div className="mt-3 p-2.5 rounded-xl bg-gradient-to-r from-emerald-900/40 to-teal-900/30 border border-emerald-500/20 flex items-center justify-between">
                <span className="text-sm text-white font-semibold">Rentabilidad neta mes</span>
                <span className="text-base font-black text-emerald-400">+6.300€</span>
            </div>
        </div>
    );
}

/* ─── Mockup: Deadlines ─── */
export function MockDeadlines() {
    const projects = [
        { name: 'Web Acme Corp', deadline: '40h', planned: '38h', pct: 95, ok: true },
        { name: 'App Beta Inc', deadline: '25h', planned: '30h', pct: 120, ok: false },
        { name: 'SEO Gamma', deadline: '15h', planned: '12h', pct: 80, ok: true },
    ];
    return (
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 sm:p-5 shadow-2xl backdrop-blur-sm w-full max-w-sm">
            <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-lg bg-amber-500/30 flex items-center justify-center">
                    <FolderKanban className="h-4 w-4 text-amber-300" />
                </div>
                <span className="text-white font-semibold text-sm">Deadlines — Febrero 2026</span>
            </div>
            <div className="space-y-2">
                {projects.map((p, i) => (
                    <div key={i} className={`flex items-center gap-2 rounded-xl p-2.5 border ${p.ok ? 'bg-slate-800/60 border-slate-700/50' : 'bg-red-500/10 border-red-500/20'}`}>
                        {p.ok ? <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" /> : <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-white font-medium truncate">{p.name}</p>
                            <p className="text-xs text-slate-400">{p.planned} / {p.deadline}</p>
                        </div>
                        <span className={`text-sm font-bold ${p.ok ? 'text-emerald-400' : 'text-red-400'}`}>{p.pct}%</span>
                    </div>
                ))}
            </div>
            <div className="mt-3 flex items-start gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-2.5 py-2">
                <Target className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                <p className="text-xs text-red-200/90"><strong>Beta Inc</strong> supera deadline en 5h. Necesita override o redistribución.</p>
            </div>
        </div>
    );
}

/* ─── Mockup: Integrations ─── */
export function MockIntegrations() {
    const integrations = [
        { name: 'Google Ads', status: 'Sincronizado', icon: TrendingUp, bg: 'bg-emerald-500/20', text: 'text-emerald-400', lastSync: 'Hace 2h' },
        { name: 'Meta Ads', status: 'Sincronizado', icon: BarChart3, bg: 'bg-emerald-500/20', text: 'text-emerald-400', lastSync: 'Hace 3h' },
        { name: 'API REST', status: 'Activo', icon: Plug, bg: 'bg-blue-500/20', text: 'text-blue-400', lastSync: '3 tokens' },
        { name: 'Webhooks', status: 'Configurado', icon: Wifi, bg: 'bg-purple-500/20', text: 'text-purple-400', lastSync: '2 endpoints' },
    ];
    return (
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 sm:p-5 shadow-2xl backdrop-blur-sm w-full max-w-sm">
            <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-lg bg-cyan-500/30 flex items-center justify-center">
                    <Plug className="h-4 w-4 text-cyan-300" />
                </div>
                <span className="text-white font-semibold text-sm">Integraciones activas</span>
            </div>
            <div className="space-y-2">
                {integrations.map((integ, i) => {
                    const Icon = integ.icon;
                    return (
                        <div key={i} className="flex items-center gap-2 rounded-xl bg-slate-800/60 p-2.5 border border-slate-700/50">
                            <div className={`w-8 h-8 rounded-lg ${integ.bg} flex items-center justify-center`}>
                                <Icon className={`h-4 w-4 ${integ.text}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-white font-medium">{integ.name}</p>
                                <p className="text-xs text-slate-400">{integ.lastSync}</p>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full ${integ.bg} ${integ.text} font-semibold`}>{integ.status}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/* ─── Mockup: Weekly Forecast ─── */
export function MockWeeklyForecast() {
    return (
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 sm:p-5 shadow-2xl backdrop-blur-sm w-full max-w-sm">
            <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-lg bg-indigo-500/30 flex items-center justify-center">
                    <MessageSquare className="h-4 w-4 text-indigo-300" />
                </div>
                <span className="text-white font-semibold text-sm">Weekly Forecast — S2 Feb</span>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2.5 text-center">
                    <p className="text-base font-bold text-emerald-400">12</p>
                    <p className="text-xs text-emerald-200/70">Completadas</p>
                </div>
                <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-2.5 text-center">
                    <p className="text-base font-bold text-amber-400">3</p>
                    <p className="text-xs text-amber-200/70">En progreso</p>
                </div>
                <div className="rounded-lg bg-slate-800/60 border border-slate-700/50 p-2.5 text-center">
                    <p className="text-base font-bold text-white">2</p>
                    <p className="text-xs text-slate-400">Pendientes</p>
                </div>
            </div>
            <div className="rounded-xl bg-indigo-500/10 border border-indigo-500/20 p-2.5">
                <div className="flex items-center gap-2 mb-1.5">
                    <Zap className="h-4 w-4 text-indigo-400" />
                    <span className="text-sm text-indigo-200 font-semibold">Predicción cierre</span>
                </div>
                <p className="text-xs text-indigo-200/80">Al ritmo actual, el equipo cerrará la semana con <strong className="text-indigo-200">95% de cumplimiento</strong>. +3h redistribuibles.</p>
            </div>
        </div>
    );
}

/* ─── Mockup: Before/After comparison ─── */
export function MockBeforeAfter() {
    const beforeItems = ['Excel y hojas sueltas', 'Horas sin registrar', 'Desvíos invisibles', 'Reporting manual', 'Estimaciones a ojo'];
    const afterItems = ['Plataforma centralizada', '100% horas planificadas', 'Alertas automáticas', 'Informes en 1 clic', 'Datos reales por proyecto'];
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6 w-full max-w-2xl">
            {/* Before */}
            <div className="rounded-xl sm:rounded-2xl border-2 border-red-500/30 bg-red-500/10 p-4 sm:p-6 shadow-lg shadow-red-950/20">
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-red-500/40 flex items-center justify-center shrink-0">
                        <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-300" />
                    </div>
                    <span className="text-base sm:text-xl font-bold text-red-200">Sin Taimbox</span>
                </div>
                <ul className="space-y-2 sm:space-y-3">
                    {beforeItems.map((t, i) => (
                        <li key={t} className={`flex items-center gap-2 sm:gap-3 ${i >= 3 ? 'hidden sm:flex' : ''}`}>
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-red-400 shrink-0" aria-hidden />
                            <span className="text-sm sm:text-lg text-red-100/90 font-medium">{t}</span>
                        </li>
                    ))}
                </ul>
            </div>
            {/* After */}
            <div className="rounded-xl sm:rounded-2xl border-2 border-emerald-500/30 bg-emerald-500/10 p-4 sm:p-6 shadow-lg shadow-emerald-950/20">
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-emerald-500/40 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-300" />
                    </div>
                    <span className="text-base sm:text-xl font-bold text-emerald-200">Con Taimbox</span>
                </div>
                <ul className="space-y-2 sm:space-y-3">
                    {afterItems.map((t, i) => (
                        <li key={t} className={`flex items-center gap-2 sm:gap-3 ${i >= 3 ? 'hidden sm:flex' : ''}`}>
                            <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400 shrink-0" />
                            <span className="text-sm sm:text-lg text-emerald-100/95 font-medium">{t}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
