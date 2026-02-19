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
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-3 sm:p-5 shadow-2xl backdrop-blur-sm w-full max-w-md">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-indigo-500/30 flex items-center justify-center">
                        <Calendar className="h-3.5 w-3.5 text-indigo-300" />
                    </div>
                    <span className="text-white font-semibold text-xs">Planificador — Feb 2026</span>
                </div>
                <span className="text-[8px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold">4 empleados</span>
            </div>
            <div className="grid grid-cols-5 gap-1 mb-1.5">
                <div className="text-[9px] font-bold text-slate-500 px-1">Empleado</div>
                {weeks.map(w => (
                    <div key={w} className="text-center text-[9px] font-bold text-slate-500">{w}</div>
                ))}
            </div>
            {employees.map((emp, ei) => (
                <div key={ei} className={`grid grid-cols-5 gap-1 items-center rounded-lg p-1 mb-0.5 ${ei === 2 ? 'bg-red-500/10 border border-red-500/20' : 'bg-slate-800/60'}`}>
                    <div className="flex items-center gap-1.5 px-1">
                        <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${emp.color} flex items-center justify-center text-[8px] font-bold text-white`}>{emp.initials}</div>
                        <span className="text-[9px] text-white/90 font-medium hidden sm:inline">{emp.name}</span>
                    </div>
                    {emp.weeks.map((h, i) => {
                        const pct = (h / 10) * 100;
                        const color = pct > 90 ? 'bg-red-500/80' : pct > 70 ? 'bg-amber-500/80' : 'bg-emerald-500/80';
                        return (
                            <div key={i} className="flex flex-col items-center gap-0.5">
                                <div className="w-full h-3 rounded bg-slate-700/50 relative overflow-hidden">
                                    <div className={`absolute inset-y-0 left-0 rounded ${color}`} style={{ width: `${pct}%` }} />
                                </div>
                                <span className="text-[8px] font-mono text-white/70">{h}h</span>
                            </div>
                        );
                    })}
                </div>
            ))}
            <div className="mt-1.5 flex items-start gap-1.5 rounded-lg bg-red-500/10 border border-red-500/20 px-2 py-1.5">
                <AlertTriangle className="h-3 w-3 text-red-400 mt-0.5 shrink-0" />
                <p className="text-[9px] text-red-200/80">Julia al <strong className="text-red-200">100%</strong> en S1-S2. Redistribuir carga.</p>
            </div>
        </div>
    );
}

/* ─── Mockup: Allocation Sheet ─── */
export function MockAllocationSheet() {
    return (
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-3 sm:p-5 shadow-2xl backdrop-blur-sm w-full max-w-sm">
            <div className="flex items-center gap-2 mb-3">
                <div className="h-7 w-7 rounded-lg bg-purple-500/30 flex items-center justify-center">
                    <MousePointerClick className="h-3.5 w-3.5 text-purple-300" />
                </div>
                <span className="text-white font-semibold text-xs">Asignar tarea</span>
            </div>
            <div className="rounded-xl bg-slate-800/60 p-2.5 border border-slate-700/50 mb-2">
                <p className="text-[9px] text-indigo-400">Acme Corp — Rediseño Web</p>
                <p className="text-[11px] text-white font-semibold">Maquetación producto</p>
                <div className="flex items-center gap-2 text-[9px] text-slate-400 mt-1">
                    <Clock className="h-3 w-3" /><span>Deadline: 14 feb</span>
                    <span className="text-slate-600">|</span>
                    <Users className="h-3 w-3" /><span>María A.</span>
                </div>
            </div>
            <div className="rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 p-2.5 mb-2">
                <p className="text-[9px] text-indigo-300 font-semibold mb-1.5">Impacto antes de guardar</p>
                <div className="grid grid-cols-2 gap-1.5">
                    <div className="rounded-lg bg-slate-800/60 p-2">
                        <p className="text-[8px] text-slate-400">Presupuesto</p>
                        <p className="text-[11px] font-bold text-white">32h <span className="text-emerald-400">→ 38h</span></p>
                        <div className="w-full h-1 rounded-full bg-slate-700 mt-1 overflow-hidden">
                            <div className="h-full rounded-full bg-amber-500" style={{ width: '95%' }} />
                        </div>
                    </div>
                    <div className="rounded-lg bg-slate-800/60 p-2">
                        <p className="text-[8px] text-slate-400">Carga María S2</p>
                        <p className="text-[11px] font-bold text-white">6h <span className="text-red-400">→ 12h</span></p>
                        <div className="w-full h-1 rounded-full bg-slate-700 mt-1 overflow-hidden">
                            <div className="h-full rounded-full bg-red-500" style={{ width: '100%' }} />
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex gap-1.5">
                <div className="flex-1 h-7 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center text-[10px] font-semibold text-white">Confirmar</div>
                <div className="h-7 rounded-lg border border-slate-600 px-3 flex items-center justify-center text-[10px] text-slate-400">Cancelar</div>
            </div>
        </div>
    );
}

/* ─── Mockup: Employee Dashboard ─── */
export function MockDashboard() {
    const tasks = [
        { project: 'Acme Corp', task: 'Diseño landing', hours: '3h', status: 'emerald' },
        { project: 'Beta Inc', task: 'Revisión copy ads', hours: '1.5h', status: 'amber' },
        { project: 'Gamma Ltd', task: 'Informe mensual', hours: '2h', status: 'indigo' },
    ];
    return (
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-3 sm:p-5 shadow-2xl backdrop-blur-sm w-full max-w-sm">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-[9px] font-bold text-white">MA</div>
                    <div>
                        <p className="text-xs text-white font-semibold">Mi día — Lunes 10 feb</p>
                        <p className="text-[9px] text-slate-400">3 tareas · 6.5h planificadas</p>
                    </div>
                </div>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">On track</span>
            </div>
            <div className="space-y-1.5">
                {tasks.map((t, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-xl bg-slate-800/60 p-2 border border-slate-700/50">
                        <div className={`w-1 h-8 rounded-full bg-${t.status}-500`} />
                        <div className="flex-1 min-w-0">
                            <p className="text-[9px] text-slate-400">{t.project}</p>
                            <p className="text-[11px] text-white font-medium truncate">{t.task}</p>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-white/70">{t.hours}</span>
                    </div>
                ))}
            </div>
            <div className="mt-2 rounded-xl bg-gradient-to-r from-emerald-900/40 to-teal-900/30 border border-emerald-500/20 p-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                        <Shield className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-[10px] text-white/90 font-semibold">Fiabilidad</span>
                    </div>
                    <span className="text-xs font-bold text-emerald-400">94%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-800/60 overflow-hidden mt-1">
                    <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400" style={{ width: '94%' }} />
                </div>
            </div>
        </div>
    );
}

/* ─── Mockup: Team Capacity ─── */
export function MockTeamCapacity() {
    const team = [
        { name: 'María A.', role: 'Diseño', pct: 87, status: 'emerald' },
        { name: 'Carlos R.', role: 'Desarrollo', pct: 95, status: 'amber' },
        { name: 'Julia L.', role: 'PPC', pct: 100, status: 'red' },
        { name: 'Pedro S.', role: 'Contenido', pct: 60, status: 'emerald' },
    ];
    return (
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-3 sm:p-5 shadow-2xl backdrop-blur-sm w-full max-w-sm">
            <div className="flex items-center gap-2 mb-3">
                <div className="h-7 w-7 rounded-lg bg-blue-500/30 flex items-center justify-center">
                    <Users className="h-3.5 w-3.5 text-blue-300" />
                </div>
                <span className="text-white font-semibold text-xs">Capacidad del equipo — Feb 2026</span>
            </div>
            <div className="space-y-2">
                {team.map((m, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <div className="w-16 text-right">
                            <p className="text-[10px] text-white font-medium">{m.name}</p>
                            <p className="text-[8px] text-slate-500">{m.role}</p>
                        </div>
                        <div className="flex-1 h-3 rounded-full bg-slate-700/50 overflow-hidden">
                            <div className={`h-full rounded-full bg-${m.status}-500`} style={{ width: `${Math.min(m.pct, 100)}%` }} />
                        </div>
                        <span className={`text-[10px] font-bold text-${m.status}-400 w-8 text-right`}>{m.pct}%</span>
                    </div>
                ))}
            </div>
            <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 px-2 py-1.5">
                <AlertTriangle className="h-3 w-3 text-amber-400 mt-0.5 shrink-0" />
                <p className="text-[9px] text-amber-200/80">Carlos está al 95%. Julia sobrecargada (100%). Considera reasignar.</p>
            </div>
        </div>
    );
}

/* ─── Mockup: Reports ─── */
export function MockReportsDashboard() {
    const clients = [
        { name: 'Acme Corp', budget: '40h', used: '35h', pct: 87, profit: '+2.400€', color: 'emerald' },
        { name: 'Beta Inc', budget: '25h', used: '28h', pct: 112, profit: '-1.200€', color: 'red' },
        { name: 'Gamma Ltd', budget: '60h', used: '45h', pct: 75, profit: '+5.100€', color: 'emerald' },
    ];
    return (
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-3 sm:p-5 shadow-2xl backdrop-blur-sm w-full max-w-md">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-emerald-500/30 flex items-center justify-center">
                        <BarChart3 className="h-3.5 w-3.5 text-emerald-300" />
                    </div>
                    <span className="text-white font-semibold text-xs">Rentabilidad por cliente</span>
                </div>
                <div className="flex gap-1">
                    <FileDown className="h-3.5 w-3.5 text-slate-400" />
                </div>
            </div>
            <div className="space-y-1.5">
                {clients.map((c, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-xl bg-slate-800/60 p-2 border border-slate-700/50">
                        <div className="flex-1 min-w-0">
                            <p className="text-[11px] text-white font-medium">{c.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[9px] text-slate-400">{c.used} / {c.budget}</span>
                                <div className="flex-1 h-1.5 rounded-full bg-slate-700/50 overflow-hidden">
                                    <div className={`h-full rounded-full bg-${c.color}-500`} style={{ width: `${Math.min(c.pct, 100)}%` }} />
                                </div>
                            </div>
                        </div>
                        <span className={`text-[11px] font-bold text-${c.color}-400`}>{c.profit}</span>
                    </div>
                ))}
            </div>
            <div className="mt-2 p-2 rounded-xl bg-gradient-to-r from-emerald-900/40 to-teal-900/30 border border-emerald-500/20 flex items-center justify-between">
                <span className="text-[10px] text-white font-semibold">Rentabilidad neta mes</span>
                <span className="text-sm font-black text-emerald-400">+6.300€</span>
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
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-3 sm:p-5 shadow-2xl backdrop-blur-sm w-full max-w-sm">
            <div className="flex items-center gap-2 mb-3">
                <div className="h-7 w-7 rounded-lg bg-amber-500/30 flex items-center justify-center">
                    <FolderKanban className="h-3.5 w-3.5 text-amber-300" />
                </div>
                <span className="text-white font-semibold text-xs">Deadlines — Febrero 2026</span>
            </div>
            <div className="space-y-1.5">
                {projects.map((p, i) => (
                    <div key={i} className={`flex items-center gap-2 rounded-xl p-2 border ${p.ok ? 'bg-slate-800/60 border-slate-700/50' : 'bg-red-500/10 border-red-500/20'}`}>
                        {p.ok ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" /> : <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0" />}
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-white font-medium truncate">{p.name}</p>
                            <p className="text-[9px] text-slate-400">{p.planned} / {p.deadline}</p>
                        </div>
                        <span className={`text-[10px] font-bold ${p.ok ? 'text-emerald-400' : 'text-red-400'}`}>{p.pct}%</span>
                    </div>
                ))}
            </div>
            <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-red-500/10 border border-red-500/20 px-2 py-1.5">
                <Target className="h-3 w-3 text-red-400 mt-0.5 shrink-0" />
                <p className="text-[9px] text-red-200/80"><strong>Beta Inc</strong> supera deadline en 5h. Necesita override o redistribución.</p>
            </div>
        </div>
    );
}

/* ─── Mockup: Integrations ─── */
export function MockIntegrations() {
    const integrations = [
        { name: 'Google Ads', status: 'Sincronizado', icon: TrendingUp, color: 'emerald', lastSync: 'Hace 2h' },
        { name: 'Meta Ads', status: 'Sincronizado', icon: BarChart3, color: 'emerald', lastSync: 'Hace 3h' },
        { name: 'API REST', status: 'Activo', icon: Plug, color: 'blue', lastSync: '3 tokens' },
        { name: 'Webhooks', status: 'Configurado', icon: Wifi, color: 'purple', lastSync: '2 endpoints' },
    ];
    return (
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-3 sm:p-5 shadow-2xl backdrop-blur-sm w-full max-w-sm">
            <div className="flex items-center gap-2 mb-3">
                <div className="h-7 w-7 rounded-lg bg-cyan-500/30 flex items-center justify-center">
                    <Plug className="h-3.5 w-3.5 text-cyan-300" />
                </div>
                <span className="text-white font-semibold text-xs">Integraciones activas</span>
            </div>
            <div className="space-y-1.5">
                {integrations.map((integ, i) => {
                    const Icon = integ.icon;
                    return (
                        <div key={i} className="flex items-center gap-2 rounded-xl bg-slate-800/60 p-2 border border-slate-700/50">
                            <div className={`w-7 h-7 rounded-lg bg-${integ.color}-500/20 flex items-center justify-center`}>
                                <Icon className={`h-3.5 w-3.5 text-${integ.color}-400`} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[11px] text-white font-medium">{integ.name}</p>
                                <p className="text-[8px] text-slate-400">{integ.lastSync}</p>
                            </div>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full bg-${integ.color}-500/20 text-${integ.color}-400 font-semibold`}>{integ.status}</span>
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
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-3 sm:p-5 shadow-2xl backdrop-blur-sm w-full max-w-sm">
            <div className="flex items-center gap-2 mb-3">
                <div className="h-7 w-7 rounded-lg bg-indigo-500/30 flex items-center justify-center">
                    <MessageSquare className="h-3.5 w-3.5 text-indigo-300" />
                </div>
                <span className="text-white font-semibold text-xs">Weekly Forecast — S2 Feb</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 mb-2">
                <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2 text-center">
                    <p className="text-sm font-bold text-emerald-400">12</p>
                    <p className="text-[8px] text-emerald-200/60">Completadas</p>
                </div>
                <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-2 text-center">
                    <p className="text-sm font-bold text-amber-400">3</p>
                    <p className="text-[8px] text-amber-200/60">En progreso</p>
                </div>
                <div className="rounded-lg bg-slate-800/60 border border-slate-700/50 p-2 text-center">
                    <p className="text-sm font-bold text-white">2</p>
                    <p className="text-[8px] text-slate-400">Pendientes</p>
                </div>
            </div>
            <div className="rounded-xl bg-indigo-500/10 border border-indigo-500/20 p-2">
                <div className="flex items-center gap-1.5 mb-1">
                    <Zap className="h-3 w-3 text-indigo-400" />
                    <span className="text-[10px] text-indigo-200 font-semibold">Predicción cierre</span>
                </div>
                <p className="text-[9px] text-indigo-200/70">Al ritmo actual, el equipo cerrará la semana con <strong className="text-indigo-200">95% de cumplimiento</strong>. +3h redistribuibles.</p>
            </div>
        </div>
    );
}

/* ─── Mockup: Before/After comparison ─── */
export function MockBeforeAfter() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
            {/* Before */}
            <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-3 sm:p-4">
                <div className="flex items-center gap-1.5 mb-2">
                    <div className="w-5 h-5 rounded bg-red-500/30 flex items-center justify-center">
                        <AlertTriangle className="h-3 w-3 text-red-400" />
                    </div>
                    <span className="text-[11px] font-bold text-red-300">Sin Timeboxing</span>
                </div>
                <div className="space-y-1.5">
                    {['Excel y hojas sueltas', 'Horas sin registrar', 'Desvíos invisibles', 'Reporting manual', 'Estimaciones a ojo'].map(t => (
                        <div key={t} className="flex items-center gap-1.5">
                            <div className="w-1 h-1 rounded-full bg-red-400" />
                            <span className="text-[10px] text-red-200/70">{t}</span>
                        </div>
                    ))}
                </div>
            </div>
            {/* After */}
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3 sm:p-4">
                <div className="flex items-center gap-1.5 mb-2">
                    <div className="w-5 h-5 rounded bg-emerald-500/30 flex items-center justify-center">
                        <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                    </div>
                    <span className="text-[11px] font-bold text-emerald-300">Con Timeboxing</span>
                </div>
                <div className="space-y-1.5">
                    {['Plataforma centralizada', '100% horas planificadas', 'Alertas automáticas', 'Informes en 1 clic', 'Datos reales por proyecto'].map(t => (
                        <div key={t} className="flex items-center gap-1.5">
                            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                            <span className="text-[10px] text-emerald-200/80">{t}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
