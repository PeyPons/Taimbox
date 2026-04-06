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
    Timer,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { localizedPathFromEs } from '@/i18n/publicPaths';

const P = 'commercial.employeeDashboard.page';

/* ─── Mockup Components ─── */

function MockCalendarGrid() {
    const { t } = useTranslation('landing');
    const weeks = ['S1', 'S2', 'S3', 'S4', 'S5'];
    const hours = [8, 6, 10, 7, 4];
    const maxHours = 10;

    return (
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 sm:p-6 shadow-2xl backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-indigo-500/30 flex items-center justify-center">
                        <Calendar className="h-4 w-4 text-indigo-300" />
                    </div>
                    <div>
                        <span className="text-white font-semibold text-sm">{t(`${P}.mockCalendar.month`)}</span>
                        <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">2026</span>
                    </div>
                </div>
                <div className="flex gap-1">
                    <div className="h-6 w-6 rounded bg-slate-800 flex items-center justify-center text-slate-400 text-xs">←</div>
                    <div className="h-6 px-2 rounded bg-slate-800 flex items-center justify-center text-slate-400 text-[10px]">{t(`${P}.mockCalendar.today`)}</div>
                    <div className="h-6 w-6 rounded bg-slate-800 flex items-center justify-center text-slate-400 text-xs">→</div>
                </div>
            </div>

            <div className="grid grid-cols-6 gap-1 mb-2">
                <div className="text-[10px] font-bold text-slate-500 px-2 py-1">{t(`${P}.mockCalendar.gridHeader`)}</div>
                {weeks.map((w, i) => (
                    <div key={w} className="text-center">
                        <span className="text-[10px] font-bold text-slate-500">{w}</span>
                        <span className="block text-[8px] text-slate-600">{3 + i * 7}-{9 + i * 7} feb</span>
                    </div>
                ))}
            </div>

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

            <div className="mt-3 flex items-center justify-end gap-3">
                <div className="text-right">
                    <span className="text-sm font-bold text-white">35h</span>
                    <span className="text-[10px] text-slate-400 ml-1">/ 40h</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">87.5%</span>
            </div>

            <div className="mt-3 flex items-start gap-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 px-3 py-2">
                <Zap className="h-3.5 w-3.5 text-indigo-400 mt-0.5 shrink-0" />
                <p className="text-[10px] text-indigo-200/80 leading-relaxed">
                    {t(`${P}.mockCalendar.calloutBefore`)}
                    <strong className="text-indigo-200">{t(`${P}.mockCalendar.calloutStrong`)}</strong>
                    {t(`${P}.mockCalendar.calloutAfter`)}
                </p>
            </div>
        </div>
    );
}

function MockPriorityCards() {
    const { t } = useTranslation('landing');
    const priorities = t<{ name: string; hours: string; deadline: string }[]>(`${P}.mockPriority.items`, { returnObjects: true });

    return (
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 sm:p-6 shadow-2xl backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-orange-500/30 flex items-center justify-center">
                    <AlertCircle className="h-4 w-4 text-orange-300" />
                </div>
                <span className="text-white font-semibold text-sm">{t(`${P}.mockPriority.title`)}</span>
            </div>

            <div className="space-y-2.5">
                {Array.isArray(priorities) && priorities.map((p, i) => {
                    const urgency = i === 0 ? 'critical' : i === 1 ? 'warning' : 'normal';
                    const color = urgency === 'critical' ? 'red' : urgency === 'warning' ? 'amber' : 'emerald';
                    return (
                        <div key={i} className="flex items-center gap-3 rounded-xl bg-slate-800/60 p-3 border border-slate-700/50 hover:border-slate-600/50 transition-colors">
                            <div className={`w-2 h-8 rounded-full ${color === 'red' ? 'bg-red-500' : color === 'amber' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-white/90 font-medium truncate">{p.name}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] text-slate-400 font-mono">{p.hours}</span>
                                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${color === 'red' ? 'bg-red-500/20 text-red-400' :
                                        color === 'amber' ? 'bg-amber-500/20 text-amber-400' :
                                            'bg-emerald-500/20 text-emerald-400'
                                        }`}>{p.deadline}</span>
                                </div>
                            </div>
                            <ChevronRight className="h-3.5 w-3.5 text-slate-600 shrink-0" />
                        </div>
                    );
                })}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-700/50">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">{t(`${P}.mockPriority.peersLabel`)}</span>
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
    const { t } = useTranslation('landing');
    const projects = t<{ client: string; name: string; tasks: number }[]>(`${P}.mockProject.projects`, { returnObjects: true });
    const count = Array.isArray(projects) ? projects.length : 0;

    return (
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 sm:p-6 shadow-2xl backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-indigo-500/30 flex items-center justify-center">
                        <ListPlus className="h-4 w-4 text-indigo-300" />
                    </div>
                    <span className="text-white font-semibold text-sm">{t(`${P}.mockProject.title`)}</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold">{count}{t(`${P}.mockProject.activeSuffix`)}</span>
            </div>

            <div className="space-y-3">
                {Array.isArray(projects) && projects.map((p, i) => {
                    const hours = [32, 18, 12][i] ?? 12;
                    const budget = [40, 25, 15][i] ?? 15;
                    const pct = Math.round((hours / budget) * 100);
                    const color = pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-amber-500' : 'bg-emerald-500';
                    const textColor = pct > 90 ? 'text-red-400' : pct > 70 ? 'text-amber-400' : 'text-emerald-400';
                    return (
                        <div key={i} className="rounded-xl bg-slate-800/60 p-3 border border-slate-700/50">
                            <div className="flex items-center justify-between mb-2">
                                <div>
                                    <p className="text-[10px] text-indigo-400 font-medium">{p.client}</p>
                                    <p className="text-xs text-white/90 font-semibold">{p.name}</p>
                                </div>
                                <span className="text-[10px] text-slate-400">{p.tasks}{t(`${P}.mockProject.tasksSuffix`)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 rounded-full bg-slate-700/60 overflow-hidden">
                                    <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${pct}%` }} />
                                </div>
                                <span className={`text-[10px] font-bold ${textColor}`}>{pct}%</span>
                                <span className="text-[10px] text-slate-500 font-mono">{hours}/{budget}h</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-3 flex gap-2">
                <div className="flex-1 rounded-lg border border-dashed border-slate-600 p-2 flex items-center justify-center gap-1.5 text-slate-500 hover:text-slate-400 hover:border-slate-500 transition-colors cursor-default">
                    <ListPlus className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-medium">{t(`${P}.mockProject.addTasks`)}</span>
                </div>
                <div className="rounded-lg border border-dashed border-slate-600 p-2 flex items-center justify-center gap-1.5 text-slate-500 cursor-default">
                    <Clock className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-medium">{t(`${P}.mockProject.internal`)}</span>
                </div>
            </div>
        </div>
    );
}

function MockCollaborationCards() {
    const { t } = useTranslation('landing');
    const teammates = t<{ name: string; role: string; projects: number; avatar: string }[]>(`${P}.mockCollab.teammates`, { returnObjects: true });

    return (
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 sm:p-6 shadow-2xl backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-purple-500/30 flex items-center justify-center">
                    <Users className="h-4 w-4 text-purple-300" />
                </div>
                <span className="text-white font-semibold text-sm">{t(`${P}.mockCollab.title`)}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {Array.isArray(teammates) && teammates.map((tm, i) => {
                    const load = [78, 92, 55][i] ?? 55;
                    const loadColor = load > 90 ? 'text-red-400' : load > 70 ? 'text-amber-400' : 'text-emerald-400';
                    const bgColor = load > 90 ? 'bg-red-500' : load > 70 ? 'bg-amber-500' : 'bg-emerald-500';
                    return (
                        <div key={i} className="rounded-xl bg-slate-800/60 p-3 border border-slate-700/50 flex flex-col items-center text-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white mb-2 ${i === 0 ? 'bg-gradient-to-br from-pink-500 to-purple-500' :
                                i === 1 ? 'bg-gradient-to-br from-blue-500 to-cyan-500' :
                                    'bg-gradient-to-br from-emerald-500 to-teal-500'
                                }`}>{tm.avatar}</div>
                            <p className="text-xs text-white/90 font-semibold">{tm.name}</p>
                            <p className="text-[10px] text-slate-400">{tm.role}</p>
                            <div className="mt-2 flex items-center gap-1.5">
                                <div className="w-12 h-1 rounded-full bg-slate-700/60 overflow-hidden">
                                    <div className={`h-full rounded-full ${bgColor}`} style={{ width: `${load}%` }} />
                                </div>
                                <span className={`text-[10px] font-bold ${loadColor}`}>{load}%</span>
                            </div>
                            <p className="text-[9px] text-slate-500 mt-1">{tm.projects}{t(`${P}.mockCollab.sharedProjects`)}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function MockMetricsPanel() {
    const { t } = useTranslation('landing');
    return (
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 sm:p-6 shadow-2xl backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-emerald-500/30 flex items-center justify-center">
                    <BarChart3 className="h-4 w-4 text-emerald-300" />
                </div>
                <span className="text-white font-semibold text-sm">{t(`${P}.mockMetrics.title`)}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="rounded-xl bg-slate-800/60 p-3 border border-slate-700/50">
                    <p className="text-[10px] text-slate-400 mb-1">{t(`${P}.mockMetrics.plannedHours`)}</p>
                    <p className="text-lg font-bold text-white">35h</p>
                    <p className="text-[10px] text-slate-500">{t(`${P}.mockMetrics.ofAvailable`)}</p>
                </div>
                <div className="rounded-xl bg-slate-800/60 p-3 border border-slate-700/50">
                    <p className="text-[10px] text-slate-400 mb-1">{t(`${P}.mockMetrics.tasksDone`)}</p>
                    <p className="text-lg font-bold text-emerald-400">12</p>
                    <p className="text-[10px] text-slate-500">{t(`${P}.mockMetrics.ofAssigned`)}</p>
                </div>
            </div>

            <div className="rounded-xl bg-gradient-to-r from-emerald-900/40 to-teal-900/30 border border-emerald-500/20 p-3">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-emerald-400" />
                        <span className="text-xs text-white/90 font-semibold">{t(`${P}.mockMetrics.reliability`)}</span>
                    </div>
                    <span className="text-sm font-bold text-emerald-400">94%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800/60 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700" style={{ width: '94%' }} />
                </div>
                <p className="text-[9px] text-emerald-200/60 mt-1.5">{t(`${P}.mockMetrics.reliabilitySub`)}</p>
            </div>

            <div className="mt-3 rounded-xl bg-slate-800/60 p-3 border border-slate-700/50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-indigo-400" />
                        <span className="text-xs text-white/90 font-medium">{t(`${P}.mockMetrics.planningControl`)}</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">{t(`${P}.mockMetrics.ok`)}</span>
                </div>
                <p className="text-[9px] text-slate-500 mt-1">{t(`${P}.mockMetrics.noInconsistency`)}</p>
            </div>
        </div>
    );
}

function MockWeeklyActions() {
    const { t } = useTranslation('landing');
    const rows = t<{ name: string; action: string }[]>(`${P}.mockWeekly.rows`, { returnObjects: true });
    const rowMeta = [
        { icon: '✓', color: 'emerald' as const },
        { icon: '→', color: 'amber' as const },
        { icon: '✓', color: 'indigo' as const },
    ];

    return (
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 sm:p-6 shadow-2xl backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-amber-500/30 flex items-center justify-center">
                    <CheckSquare className="h-4 w-4 text-amber-300" />
                </div>
                <span className="text-white font-semibold text-sm">{t(`${P}.mockWeekly.title`)}</span>
            </div>

            <div className="space-y-2">
                {Array.isArray(rows) && rows.map((row, i) => {
                    const meta = rowMeta[i] ?? rowMeta[0];
                    const c = meta.color;
                    return (
                        <div key={i} className="flex items-center gap-2 rounded-lg bg-slate-800/60 p-2.5 border border-slate-700/50">
                            <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold ${c === 'emerald' ? 'bg-emerald-500/20 text-emerald-400' :
                                c === 'amber' ? 'bg-amber-500/20 text-amber-400' :
                                    'bg-indigo-500/20 text-indigo-400'
                                }`}>{meta.icon}</div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[11px] text-white/90 font-medium truncate">{row.name}</p>
                            </div>
                            <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${c === 'emerald' ? 'bg-emerald-500/20 text-emerald-400' :
                                c === 'amber' ? 'bg-amber-500/20 text-amber-400' :
                                    'bg-indigo-500/20 text-indigo-400'
                                }`}>{row.action}</span>
                        </div>
                    );
                })}
            </div>

            <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 h-8 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center text-[11px] font-semibold text-white cursor-default">
                    {t(`${P}.mockWeekly.confirmBtn`)}
                </div>
                <div className="h-8 w-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center cursor-default">
                    <MoreHorizontal className="h-3.5 w-3.5 text-slate-400" />
                </div>
            </div>

            <div className="mt-3 flex items-center gap-3 pt-2 border-t border-slate-700/50">
                <div className="flex items-center gap-1.5">
                    <FileDown className="h-3 w-3 text-purple-400" />
                    <span className="text-[9px] text-slate-400">{t(`${P}.mockWeekly.exportCrm`)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <TrendingUp className="h-3 w-3 text-emerald-400" />
                    <span className="text-[9px] text-slate-400">{t(`${P}.mockWeekly.goals`)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <Calendar className="h-3 w-3 text-amber-400" />
                    <span className="text-[9px] text-slate-400">{t(`${P}.mockWeekly.absences`)}</span>
                </div>
            </div>
        </div>
    );
}


/* ─── Main Article ─── */

export function EmployeeDashboardArticle() {
    const { t, i18n } = useTranslation('landing');
    const heroPills = t<string[]>(`${P}.hero.pills`, { returnObjects: true });
    const s1Bullets = t<string[]>(`${P}.s1.bullets`, { returnObjects: true });
    const s2Bullets = t<string[]>(`${P}.s2.bullets`, { returnObjects: true });
    const s3Tiles = t<{ label: string; desc: string }[]>(`${P}.s3.tiles`, { returnObjects: true });
    const s3Icons = [ListPlus, Clock, BarChart3, Target, Timer];
    const s5Bullets = t<string[]>(`${P}.s5.bullets`, { returnObjects: true });
    const s6Bullets = t<string[]>(`${P}.s6.bullets`, { returnObjects: true });
    const s6Icons = [Shield, BarChart3, CheckCircle2];
    const s2Icons = [AlertCircle, Users, TrendingUp];
    const s1Icons = [Calendar, Zap, Target];
    const ctaStats = t<{ num: string; label: string }[]>(`${P}.cta.stats`, { returnObjects: true });
    const guidePath = localizedPathFromEs('/guia/mi-espacio', i18n.language);

    return (
        <article className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 md:py-16 text-left overflow-x-hidden">

            <section className="mb-16 sm:mb-20 text-center">
                <div className="mb-6">
                    <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider text-indigo-300 bg-indigo-500/20 border border-indigo-400/30">
                        {t(`${P}.hero.badge`)}
                    </span>
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-[1.1] tracking-tight">
                    {t(`${P}.hero.title1`)}{' '}
                    <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                        {t(`${P}.hero.titleHighlight`)}
                    </span>
                </h1>
                <p className="text-indigo-100/90 text-base sm:text-lg lg:text-xl leading-relaxed max-w-3xl mx-auto mb-8">
                    {t(`${P}.hero.subtitle`)}
                </p>
                <div className="flex flex-wrap justify-center gap-3 text-sm">
                    {Array.isArray(heroPills) && heroPills.map((f, i) => (
                        <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-indigo-200/90 text-xs font-medium">
                            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                            {f}
                        </span>
                    ))}
                </div>
            </section>

            <section className="mb-16 sm:mb-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    <div className="order-2 lg:order-1">
                        <MockCalendarGrid />
                    </div>
                    <div className="order-1 lg:order-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-300/90 mb-3 block">{t(`${P}.s1.kicker`)}</span>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 leading-tight">
                            {t(`${P}.s1.h2`)}
                        </h2>
                        <p className="text-indigo-100/90 mb-4 leading-relaxed">
                            {t(`${P}.s1.p`)}
                        </p>
                        <ul className="space-y-3">
                            {Array.isArray(s1Bullets) && s1Bullets.map((text, i) => {
                                const Icon = s1Icons[i] ?? Calendar;
                                return (
                                    <li key={i} className="flex items-center gap-3 text-indigo-100/90 text-sm">
                                        <div className="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center shrink-0">
                                            <Icon className="h-3.5 w-3.5 text-indigo-400" />
                                        </div>
                                        {text}
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </div>
            </section>

            <section className="mb-16 sm:mb-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    <div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-orange-300/90 mb-3 block">{t(`${P}.s2.kicker`)}</span>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 leading-tight">
                            {t(`${P}.s2.h2`)}
                        </h2>
                        <p className="text-indigo-100/90 mb-4 leading-relaxed">
                            {t(`${P}.s2.p`)}
                        </p>
                        <ul className="space-y-3">
                            {Array.isArray(s2Bullets) && s2Bullets.map((text, i) => {
                                const Icon = s2Icons[i] ?? AlertCircle;
                                const color = ['text-red-400', 'text-purple-400', 'text-emerald-400'][i] ?? 'text-emerald-400';
                                return (
                                    <li key={i} className="flex items-center gap-3 text-indigo-100/90 text-sm">
                                        <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                                            <Icon className={`h-3.5 w-3.5 ${color}`} />
                                        </div>
                                        {text}
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                    <div>
                        <MockPriorityCards />
                    </div>
                </div>
            </section>

            <section className="mb-16 sm:mb-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    <div className="order-2 lg:order-1">
                        <MockProjectList />
                    </div>
                    <div className="order-1 lg:order-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-300/90 mb-3 block">{t(`${P}.s3.kicker`)}</span>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 leading-tight">
                            {t(`${P}.s3.h2`)}
                        </h2>
                        <p className="text-indigo-100/90 mb-4 leading-relaxed">
                            {t(`${P}.s3.p`)}
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            {Array.isArray(s3Tiles) && s3Tiles.map((tile, i) => {
                                const Icon = s3Icons[i] ?? ListPlus;
                                return (
                                    <div key={i} className="rounded-xl bg-white/5 border border-white/10 p-3">
                                        <Icon className="h-4 w-4 text-indigo-400 mb-1.5" />
                                        <p className="text-xs text-white font-semibold">{tile.label}</p>
                                        <p className="text-[10px] text-indigo-200/70">{tile.desc}</p>
                                    </div>
                                );
                            })}
                        </div>
                        <p className="text-indigo-100/80 text-sm mt-3">
                            {t(`${P}.s3.timesNoteBefore`)}
                            <strong className="text-white">{t(`${P}.s3.timesStrong`)}</strong>
                            {t(`${P}.s3.timesNoteAfter`)}
                        </p>
                    </div>
                </div>
            </section>

            <section className="mb-16 sm:mb-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    <div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-300/90 mb-3 block">{t(`${P}.s4.kicker`)}</span>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 leading-tight">
                            {t(`${P}.s4.h2`)}
                        </h2>
                        <p className="text-indigo-100/90 mb-4 leading-relaxed">
                            {t(`${P}.s4.p`)}
                        </p>
                        <div className="rounded-xl border-l-4 border-amber-400 bg-amber-500/10 border border-amber-500/20 p-4">
                            <p className="text-indigo-100/90 text-sm m-0">
                                {t(`${P}.s4.quoteBefore`)}
                                <strong className="text-white">{t(`${P}.s4.quoteStrong`)}</strong>
                                {t(`${P}.s4.quoteAfter`)}
                            </p>
                        </div>
                    </div>
                    <div>
                        <MockWeeklyActions />
                    </div>
                </div>
            </section>

            <section className="mb-16 sm:mb-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    <div className="order-2 lg:order-1">
                        <MockCollaborationCards />
                    </div>
                    <div className="order-1 lg:order-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-300/90 mb-3 block">{t(`${P}.s5.kicker`)}</span>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 leading-tight">
                            {t(`${P}.s5.h2`)}
                        </h2>
                        <p className="text-indigo-100/90 mb-4 leading-relaxed">
                            {t(`${P}.s5.p`)}
                        </p>
                        <ul className="space-y-3">
                            {Array.isArray(s5Bullets) && s5Bullets.map((text, i) => (
                                <li key={i} className="flex items-center gap-3 text-indigo-100/90 text-sm">
                                    <CheckCircle2 className="h-4 w-4 text-purple-400 shrink-0" />
                                    {text}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </section>

            <section className="mb-16 sm:mb-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    <div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300/90 mb-3 block">{t(`${P}.s6.kicker`)}</span>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 leading-tight">
                            {t(`${P}.s6.h2`)}
                        </h2>
                        <p className="text-indigo-100/90 mb-4 leading-relaxed">
                            {t(`${P}.s6.p`)}
                        </p>
                        <ul className="space-y-3">
                            {Array.isArray(s6Bullets) && s6Bullets.map((text, i) => {
                                const Icon = s6Icons[i] ?? Shield;
                                const color = ['text-emerald-400', 'text-indigo-400', 'text-amber-400'][i] ?? 'text-emerald-400';
                                return (
                                    <li key={i} className="flex items-center gap-3 text-indigo-100/90 text-sm">
                                        <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                                            <Icon className={`h-3.5 w-3.5 ${color}`} />
                                        </div>
                                        {text}
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                    <div>
                        <MockMetricsPanel />
                    </div>
                </div>
            </section>

            <section className="mb-0">
                <div className="rounded-3xl border-2 border-indigo-500/30 bg-gradient-to-br from-indigo-600/20 via-purple-600/20 to-indigo-600/20 p-6 sm:p-10">
                    <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4 text-center">
                        {t(`${P}.cta.h2`)}
                    </h2>
                    <p className="text-indigo-100/95 mb-4 text-base sm:text-lg leading-relaxed text-center max-w-2xl mx-auto">
                        {t(`${P}.cta.p`)}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
                        {Array.isArray(ctaStats) && ctaStats.map(({ num, label }, i) => (
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
                                {t(`${P}.cta.btn`)}
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </Link>
                        <p className="mt-3 text-sm text-indigo-200/80">
                            {t(`${P}.cta.sub`)}
                        </p>
                        <Link to={guidePath} className="inline-flex items-center gap-1.5 mt-4 text-sm font-medium text-indigo-300/80 hover:text-white transition-colors">
                            {t(`${P}.cta.guideLink`)}
                            <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                    </div>
                </div>
            </section>
        </article>
    );
}
