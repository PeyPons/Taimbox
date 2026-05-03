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
import { useTranslation } from 'react-i18next';
import { localizedPathFromEs } from '@/i18n/publicPaths';
import { i18nAsArray } from '@/lib/i18nReturnObjects';

const P = 'commercial.team.page';

const PROFILE_GRADIENTS = [
    'from-indigo-400 to-purple-500',
    'from-blue-400 to-cyan-500',
    'from-pink-400 to-rose-500',
] as const;

const TIEMPOS_GRADIENTS = [
    'from-indigo-400 to-purple-500',
    'from-blue-400 to-cyan-500',
    'from-pink-400 to-rose-500',
    'from-emerald-400 to-teal-500',
] as const;

const ABSENCE_AVATAR_GRADIENTS: Record<string, string> = {
    MA: 'from-indigo-400 to-purple-500',
    CR: 'from-blue-400 to-cyan-500',
    PS: 'from-emerald-400 to-teal-500',
};

/* ─── Mockup: Employee Profiles ─── */
function MockProfiles() {
    const { t } = useTranslation('landing');
    const employees = i18nAsArray<{
        name: string;
        role: string;
        initials: string;
        hours: string;
        schedule: string;
    }>(t(`${P}.mockProfiles.employees`, { returnObjects: true }));
    const scheduleTypes = i18nAsArray<{ label: string; value: string }>(
        t(`${P}.mockProfiles.scheduleTypes`, { returnObjects: true }),
    );
    const scheduleIcons = [Sun, Clock, Moon];

    return (
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 sm:p-6 shadow-2xl backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-indigo-500/30 flex items-center justify-center">
                    <UserCog className="h-4 w-4 text-indigo-300" />
                </div>
                <span className="text-white font-semibold text-sm">{t(`${P}.mockProfiles.title`)}</span>
            </div>

            <div className="space-y-2.5">
                {employees.map((emp, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-xl bg-slate-800/60 p-3 border border-slate-700/50">
                        <div
                            className={`w-10 h-10 rounded-full bg-gradient-to-br ${PROFILE_GRADIENTS[i] ?? PROFILE_GRADIENTS[0]} flex items-center justify-center text-sm font-bold text-white shrink-0`}
                        >
                            {emp.initials}
                        </div>
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
                {scheduleTypes.map(({ label, value }, i) => {
                    const Icon = scheduleIcons[i] ?? Sun;
                    return (
                        <div key={i} className="rounded-lg bg-slate-800/60 p-2 text-center border border-slate-700/50">
                            <Icon className="h-3 w-3 text-indigo-400 mx-auto mb-1" />
                            <p className="text-[9px] text-slate-400">{label}</p>
                            <p className="text-xs font-bold text-white">{value}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/* ─── Mockup: Absences Calendar ─── */
function MockAbsences() {
    const { t } = useTranslation('landing');
    const rows = i18nAsArray<{
        initials: string;
        name: string;
        detail: string;
        badge: string;
        tone: string;
    }>(t(`${P}.mockAbsences.rows`, { returnObjects: true }));

    const rowClass = (tone: string) => {
        if (tone === 'red') return 'bg-red-500/10 border border-red-500/20';
        if (tone === 'indigo') return 'bg-indigo-500/10 border border-indigo-500/20';
        return 'bg-amber-500/10 border border-amber-500/20';
    };

    const badgeClass = (tone: string) => {
        if (tone === 'red') return 'bg-red-500/20 text-red-400';
        if (tone === 'indigo') return 'bg-indigo-500/20 text-indigo-400';
        return 'bg-amber-500/20 text-amber-400';
    };

    const detailClass = (tone: string) => {
        if (tone === 'red') return 'text-red-300';
        if (tone === 'indigo') return 'text-indigo-300';
        return 'text-amber-300';
    };

    return (
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 sm:p-6 shadow-2xl backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-amber-500/30 flex items-center justify-center">
                    <CalendarOff className="h-4 w-4 text-amber-300" />
                </div>
                <span className="text-white font-semibold text-sm">{t(`${P}.mockAbsences.title`)}</span>
            </div>

            <div className="space-y-2">
                {rows.map((row, i) => (
                    <div key={i} className={`flex items-center gap-3 rounded-xl p-3 ${rowClass(row.tone)}`}>
                        <div
                            className={`w-8 h-8 rounded-full bg-gradient-to-br ${ABSENCE_AVATAR_GRADIENTS[row.initials] ?? 'from-slate-500 to-slate-600'} flex items-center justify-center text-[10px] font-bold text-white`}
                        >
                            {row.initials}
                        </div>
                        <div className="flex-1">
                            <p className="text-xs text-white/90 font-semibold">{row.name}</p>
                            <p className={`text-[10px] ${detailClass(row.tone)}`}>{row.detail}</p>
                        </div>
                        <span className={`text-[9px] px-2 py-0.5 rounded font-bold ${badgeClass(row.tone)}`}>{row.badge}</span>
                    </div>
                ))}
            </div>

            <div className="mt-3 rounded-lg bg-slate-800/60 p-3 border border-slate-700/50">
                <p className="text-[10px] text-slate-400 mb-1">{t(`${P}.mockAbsences.impactTitle`)}</p>
                <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 rounded-full bg-slate-700 overflow-hidden">
                        <div className="h-full rounded-full bg-amber-500" style={{ width: '72%' }} />
                    </div>
                    <span className="text-xs font-bold text-amber-400">{t(`${P}.mockAbsences.impactPct`)}</span>
                </div>
                <p className="text-[9px] text-slate-500 mt-1">{t(`${P}.mockAbsences.impactFoot`)}</p>
            </div>
        </div>
    );
}

/* ─── Mockup: Capacity ─── */
function MockCapacity() {
    const { t } = useTranslation('landing');
    const team = i18nAsArray<{
        name: string;
        available: number;
        total: number;
        tone: string;
    }>(t(`${P}.mockCapacity.team`, { returnObjects: true }));

    const barText = (tone: string) => {
        if (tone === 'red') return { bar: 'bg-red-500', text: 'text-red-400' };
        if (tone === 'amber') return { bar: 'bg-amber-500', text: 'text-amber-400' };
        return { bar: 'bg-emerald-500', text: 'text-emerald-400' };
    };

    return (
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 sm:p-6 shadow-2xl backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-emerald-500/30 flex items-center justify-center">
                        <BarChart3 className="h-4 w-4 text-emerald-300" />
                    </div>
                    <span className="text-white font-semibold text-sm">{t(`${P}.mockCapacity.title`)}</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">
                    {t(`${P}.mockCapacity.badgeMonth`)}
                </span>
            </div>

            <div className="space-y-3">
                {team.map((row, i) => {
                    const pct = Math.round((row.available / row.total) * 100);
                    const { bar, text } = barText(row.tone);
                    return (
                        <div key={i} className="flex items-center gap-3">
                            <span className="text-[10px] text-white/80 w-16 truncate font-medium">{row.name}</span>
                            <div className="flex-1 h-3 rounded-full bg-slate-700/60 overflow-hidden">
                                <div className={`h-full rounded-full ${bar}`} style={{ width: `${pct}%` }} />
                            </div>
                            <span className={`text-[10px] font-bold ${text} w-10 text-right`}>{row.available}h</span>
                            <span className="text-[9px] text-slate-500 w-8 text-right">/{row.total}h</span>
                        </div>
                    );
                })}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-slate-800/60 p-2 text-center border border-slate-700/50">
                    <p className="text-lg font-bold text-white">{t(`${P}.mockCapacity.statAvailable.num`)}</p>
                    <p className="text-[9px] text-slate-400">{t(`${P}.mockCapacity.statAvailable.label`)}</p>
                </div>
                <div className="rounded-lg bg-slate-800/60 p-2 text-center border border-slate-700/50">
                    <p className="text-lg font-bold text-white">{t(`${P}.mockCapacity.statTotal.num`)}</p>
                    <p className="text-[9px] text-slate-400">{t(`${P}.mockCapacity.statTotal.label`)}</p>
                </div>
            </div>
        </div>
    );
}

/* ─── Mockup: Vista Tiempos ─── */
function MockTiempos() {
    const { t } = useTranslation('landing');
    const rows = i18nAsArray<{
        name: string;
        task: string;
        client: string;
        time: string;
        active: boolean;
    }>(t(`${P}.mockTiempos.rows`, { returnObjects: true }));
    const empty = t(`${P}.mockTiempos.empty`);

    return (
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 sm:p-6 shadow-2xl backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-teal-500/30 flex items-center justify-center">
                    <Timer className="h-4 w-4 text-teal-300" />
                </div>
                <span className="text-white font-semibold text-sm">{t(`${P}.mockTiempos.title`)}</span>
            </div>

            <div className="space-y-2">
                {rows.map((r, i) => (
                    <div
                        key={i}
                        className={`flex items-center gap-3 rounded-xl p-3 border ${r.active ? 'bg-teal-500/10 border-teal-500/20' : 'bg-slate-800/60 border-slate-700/50'}`}
                    >
                        <div
                            className={`w-8 h-8 rounded-full bg-gradient-to-br ${TIEMPOS_GRADIENTS[i] ?? TIEMPOS_GRADIENTS[0]} flex items-center justify-center text-[10px] font-bold text-white shrink-0`}
                        >
                            {(r.name ?? '')
                                .split(' ')
                                .map((n) => n[0])
                                .join('')}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-white/90 font-semibold truncate">{r.task || empty}</p>
                            <p className="text-[10px] text-slate-400">{r.client || empty}</p>
                        </div>
                        <span className="text-[10px] font-mono text-teal-400 font-semibold shrink-0">{r.time || empty}</span>
                    </div>
                ))}
            </div>

            <div className="mt-3 flex items-center justify-between rounded-lg bg-slate-800/60 p-3 border border-slate-700/50">
                <span className="text-[10px] text-slate-400">{t(`${P}.mockTiempos.footerLabel`)}</span>
                <span className="text-sm font-bold text-white font-mono">{t(`${P}.mockTiempos.footerTotal`)}</span>
            </div>
        </div>
    );
}

/* ─── Mockup: Team Pulse ─── */
function MockTeamPulse() {
    const { t } = useTranslation('landing');
    const insights = i18nAsArray<string>(t(`${P}.mockPulse.insights`, { returnObjects: true }));
    const insightMeta = [
        { Icon: CheckCircle2, wrap: 'bg-emerald-500/10 border border-emerald-500/20', icon: 'text-emerald-400', text: 'text-emerald-200/80' },
        { Icon: AlertTriangle, wrap: 'bg-red-500/10 border border-red-500/20', icon: 'text-red-400', text: 'text-red-200/80' },
        { Icon: TrendingUp, wrap: 'bg-indigo-500/10 border border-indigo-500/20', icon: 'text-indigo-400', text: 'text-indigo-200/80' },
    ];

    return (
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 sm:p-6 shadow-2xl backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-pink-500/30 flex items-center justify-center">
                    <Heart className="h-4 w-4 text-pink-300" />
                </div>
                <span className="text-white font-semibold text-sm">{t(`${P}.mockPulse.title`)}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 p-3 text-center">
                    <Thermometer className="h-5 w-5 text-emerald-400 mx-auto mb-1" />
                    <p className="text-lg font-bold text-emerald-400">{t(`${P}.mockPulse.loadPct`)}</p>
                    <p className="text-[9px] text-slate-400">{t(`${P}.mockPulse.loadLabel`)}</p>
                </div>
                <div className="rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 p-3 text-center">
                    <Shield className="h-5 w-5 text-indigo-400 mx-auto mb-1" />
                    <p className="text-lg font-bold text-indigo-400">{t(`${P}.mockPulse.reliabilityPct`)}</p>
                    <p className="text-[9px] text-slate-400">{t(`${P}.mockPulse.reliabilityLabel`)}</p>
                </div>
            </div>

            <div className="space-y-2">
                {insights.map((line, i) => {
                    const meta = insightMeta[i] ?? insightMeta[0];
                    const Icon = meta.Icon;
                    return (
                        <div key={i} className={`flex items-center gap-2 rounded-lg p-2 ${meta.wrap}`}>
                            <Icon className={`h-3.5 w-3.5 shrink-0 ${meta.icon}`} />
                            <p className={`text-[10px] ${meta.text}`}>{line}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/* ─── Main Article ─── */
export function TeamArticle() {
    const { t, i18n } = useTranslation('landing');
    const pills = i18nAsArray<string>(t(`${P}.hero.pills`, { returnObjects: true }));
    const s1Bullets = i18nAsArray<string>(t(`${P}.s1.bullets`, { returnObjects: true }));
    const s3Bullets = i18nAsArray<string>(t(`${P}.s3.bullets`, { returnObjects: true }));
    const s4Tiles = i18nAsArray<{ label: string; desc: string }>(t(`${P}.s4.tiles`, { returnObjects: true }));
    const s5Tiles = i18nAsArray<{ label: string; desc: string }>(t(`${P}.s5.tiles`, { returnObjects: true }));
    const ctaStats = i18nAsArray<{ num: string; label: string }>(t(`${P}.cta.stats`, { returnObjects: true }));

    const s1Icons = [Clock, CalendarDays, UserCog];
    const s4TileIcons = [Activity, Shield, TrendingUp, AlertTriangle];
    const s5TileIcons = [Timer, Clock, Users];

    return (
        <article className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 md:py-16 text-left overflow-x-hidden">
            <section className="mb-16 sm:mb-20 text-center">
                <div className="mb-6">
                    <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider text-blue-300 bg-blue-500/20 border border-blue-400/30">
                        {t(`${P}.hero.badge`)}
                    </span>
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-[1.1] tracking-tight">
                    {t(`${P}.hero.title1`)}{' '}
                    <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">{t(`${P}.hero.titleHighlight`)}</span>
                </h1>
                <p className="text-indigo-100/90 text-base sm:text-lg lg:text-xl leading-relaxed max-w-3xl mx-auto mb-8">{t(`${P}.hero.subtitle`)}</p>
                <div className="flex flex-wrap justify-center gap-3 text-sm">
                    {pills.map((f, i) => (
                        <span
                            key={i}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-indigo-200/90 text-xs font-medium"
                        >
                            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                            {f}
                        </span>
                    ))}
                </div>
            </section>

            <section className="mb-16 sm:mb-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    <div className="order-2 lg:order-1">
                        <MockProfiles />
                    </div>
                    <div className="order-1 lg:order-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-300/90 mb-3 block">{t(`${P}.s1.kicker`)}</span>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 leading-tight">{t(`${P}.s1.h2`)}</h2>
                        <p className="text-indigo-100/90 mb-4 leading-relaxed">{t(`${P}.s1.p`)}</p>
                        <ul className="space-y-3">
                            {s1Bullets.map((text, i) => {
                                const Icon = s1Icons[i] ?? Clock;
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
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-300/90 mb-3 block">{t(`${P}.s2.kicker`)}</span>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 leading-tight">{t(`${P}.s2.h2`)}</h2>
                        <p className="text-indigo-100/90 mb-4 leading-relaxed">{t(`${P}.s2.p`)}</p>
                        <div className="rounded-xl border-l-4 border-amber-400 bg-amber-500/10 border border-amber-500/20 p-4">
                            <p className="text-indigo-100/90 text-sm m-0">
                                {t(`${P}.s2.quoteBefore`)}
                                <strong className="text-white">{t(`${P}.s2.quoteStrong`)}</strong>
                                {t(`${P}.s2.quoteAfter`)}
                            </p>
                        </div>
                    </div>
                    <div>
                        <MockAbsences />
                    </div>
                </div>
            </section>

            <section className="mb-16 sm:mb-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    <div className="order-2 lg:order-1">
                        <MockCapacity />
                    </div>
                    <div className="order-1 lg:order-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300/90 mb-3 block">{t(`${P}.s3.kicker`)}</span>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 leading-tight">{t(`${P}.s3.h2`)}</h2>
                        <p className="text-indigo-100/90 mb-4 leading-relaxed">{t(`${P}.s3.p`)}</p>
                        <ul className="space-y-3">
                            {s3Bullets.map((text, i) => (
                                <li key={i} className="flex items-center gap-3 text-indigo-100/90 text-sm">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
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
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-pink-300/90 mb-3 block">{t(`${P}.s4.kicker`)}</span>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 leading-tight">{t(`${P}.s4.h2`)}</h2>
                        <p className="text-indigo-100/90 mb-4 leading-relaxed">{t(`${P}.s4.p`)}</p>
                        <div className="grid grid-cols-2 gap-3">
                            {s4Tiles.map(({ label, desc }, i) => {
                                const Icon = s4TileIcons[i] ?? Activity;
                                return (
                                    <div key={i} className="rounded-xl bg-white/5 border border-white/10 p-3">
                                        <Icon className="h-4 w-4 text-pink-400 mb-1.5" />
                                        <p className="text-xs text-white font-semibold">{label}</p>
                                        <p className="text-[10px] text-indigo-200/70">{desc}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div>
                        <MockTeamPulse />
                    </div>
                </div>
            </section>

            <section className="mb-16 sm:mb-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    <div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-teal-300/90 mb-3 block">{t(`${P}.s5.kicker`)}</span>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 leading-tight">{t(`${P}.s5.h2`)}</h2>
                        <p className="text-indigo-100/90 mb-4 leading-relaxed">
                            {t(`${P}.s5.pBeforeStrong`)}
                            <strong className="text-white">{t(`${P}.s5.pStrong`)}</strong>
                            {t(`${P}.s5.pAfterStrong`)}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {s5Tiles.map(({ label, desc }, i) => {
                                const Icon = s5TileIcons[i] ?? Timer;
                                return (
                                    <div key={i} className="rounded-xl bg-white/5 border border-white/10 p-3">
                                        <Icon className="h-4 w-4 text-teal-400 mb-1.5" />
                                        <p className="text-xs text-white font-semibold">{label}</p>
                                        <p className="text-[10px] text-indigo-200/70">{desc}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div>
                        <MockTiempos />
                    </div>
                </div>
            </section>

            <section className="mb-0">
                <div className="rounded-3xl border-2 border-blue-500/30 bg-gradient-to-br from-blue-600/20 via-cyan-600/20 to-blue-600/20 p-6 sm:p-10">
                    <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4 text-center">{t(`${P}.cta.h2`)}</h2>
                    <p className="text-indigo-100/95 mb-6 text-base sm:text-lg leading-relaxed text-center max-w-2xl mx-auto">{t(`${P}.cta.p`)}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
                        {ctaStats.map(({ num, label }, i) => (
                            <div key={i} className="text-center p-3 rounded-xl bg-white/5 border border-white/10">
                                <p className="text-xl sm:text-2xl font-bold text-white">{num}</p>
                                <p className="text-xs text-indigo-200/70">{label}</p>
                            </div>
                        ))}
                    </div>
                    <div className="text-center">
                        <Link to={localizedPathFromEs('/login', i18n.language)}>
                            <Button
                                size="lg"
                                className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-12 py-7 text-lg font-bold shadow-2xl shadow-blue-500/30 rounded-xl"
                            >
                                {t(`${P}.cta.btn`)}
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </Link>
                        <p className="mt-3 text-sm text-indigo-200/80">{t(`${P}.cta.sub`)}</p>
                        <Link
                            to={localizedPathFromEs('/guia/equipo', i18n.language)}
                            className="inline-flex items-center gap-1.5 mt-4 text-sm font-medium text-indigo-300/80 hover:text-white transition-colors"
                        >
                            {t(`${P}.cta.guideLink`)}
                            <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                    </div>
                </div>
            </section>
        </article>
    );
}
