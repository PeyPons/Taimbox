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
    Eye,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { localizedPathFromEs } from '@/i18n/publicPaths';
import { i18nAsArray } from '@/lib/i18nReturnObjects';

const P = 'commercial.planner.page';

/* ─── Mockup: Planning Grid ─── */
function MockPlanningGrid() {
    const { t } = useTranslation('landing');
    const employees = [
        { name: 'María A.', initials: 'MA', color: 'from-indigo-400 to-purple-500', weeks: [8, 6, 10, 7, 4] },
        { name: 'Carlos R.', initials: 'CR', color: 'from-blue-400 to-cyan-500', weeks: [6, 8, 5, 9, 7] },
        { name: 'Julia L.', initials: 'JL', color: 'from-pink-400 to-rose-500', weeks: [10, 9, 8, 6, 3] },
        { name: 'Pedro S.', initials: 'PS', color: 'from-emerald-400 to-teal-500', weeks: [4, 7, 6, 8, 10] },
    ];
    const weeks = ['S1', 'S2', 'S3', 'S4', 'S5'];
    const weekDates = i18nAsArray<string>(t(`${P}.mockGrid.weekDates`, { returnObjects: true }));

    return (
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 sm:p-6 shadow-2xl backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-indigo-500/30 flex items-center justify-center">
                        <Calendar className="h-4 w-4 text-indigo-300" />
                    </div>
                    <span className="text-white font-semibold text-sm">{t(`${P}.mockGrid.title`)}</span>
                </div>
                <div className="flex gap-1">
                    <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold">
                        {t(`${P}.mockGrid.employeesBadge`)}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-6 gap-1 mb-2">
                <div className="text-[10px] font-bold text-slate-500 px-2 py-1">{t(`${P}.mockGrid.headerEmployee`)}</div>
                {weeks.map((w, i) => (
                    <div key={w} className="text-center">
                        <span className="text-[10px] font-bold text-slate-500">{w}</span>
                        <span className="block text-[8px] text-slate-600">{weekDates[i]}</span>
                    </div>
                ))}
            </div>

            {employees.map((emp, ei) => (
                <div
                    key={ei}
                    className={`grid grid-cols-6 gap-1 items-center rounded-lg p-1.5 mb-1 ${ei === 2 ? 'bg-red-500/10 border border-red-500/20' : 'bg-slate-800/60'}`}
                >
                    <div className="flex items-center gap-2 px-1">
                        <div
                            className={`w-6 h-6 rounded-full bg-gradient-to-br ${emp.color} flex items-center justify-center text-[9px] font-bold text-white`}
                        >
                            {emp.initials}
                        </div>
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
                <p className="text-[10px] text-red-200/80">
                    {t(`${P}.mockGrid.alertBefore`)}
                    <strong className="text-red-200">{t(`${P}.mockGrid.alertStrong`)}</strong>
                    {t(`${P}.mockGrid.alertAfter`)}
                </p>
            </div>
        </div>
    );
}

/* ─── Mockup: Allocation Sheet ─── */
function MockAllocationSheet() {
    const { t } = useTranslation('landing');

    return (
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 sm:p-6 shadow-2xl backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-purple-500/30 flex items-center justify-center">
                    <MousePointerClick className="h-4 w-4 text-purple-300" />
                </div>
                <span className="text-white font-semibold text-sm">{t(`${P}.mockAllocation.title`)}</span>
            </div>

            <div className="rounded-xl bg-slate-800/60 p-3 border border-slate-700/50 mb-3">
                <div className="flex items-center justify-between mb-2">
                    <div>
                        <p className="text-[10px] text-indigo-400">{t(`${P}.mockAllocation.clientProject`)}</p>
                        <p className="text-xs text-white font-semibold">{t(`${P}.mockAllocation.taskName`)}</p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold">
                        {t(`${P}.mockAllocation.hoursBadge`)}
                    </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <Clock className="h-3 w-3" />
                    <span>{t(`${P}.mockAllocation.deadlineLabel`)}</span>
                    <span className="text-slate-600">|</span>
                    <Users className="h-3 w-3" />
                    <span>{t(`${P}.mockAllocation.assignee`)}</span>
                </div>
            </div>

            <div className="rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 p-3 mb-3">
                <p className="text-[10px] text-indigo-300 font-semibold mb-2">{t(`${P}.mockAllocation.impactTitle`)}</p>
                <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-slate-800/60 p-2">
                        <p className="text-[9px] text-slate-400">{t(`${P}.mockAllocation.budgetLabel`)}</p>
                        <p className="text-xs font-bold text-white">
                            {t(`${P}.mockAllocation.budgetFrom`)}
                            <span className="text-emerald-400">{t(`${P}.mockAllocation.budgetArrow`)}</span>
                        </p>
                        <div className="w-full h-1 rounded-full bg-slate-700 mt-1 overflow-hidden">
                            <div className="h-full rounded-full bg-amber-500" style={{ width: '95%' }} />
                        </div>
                    </div>
                    <div className="rounded-lg bg-slate-800/60 p-2">
                        <p className="text-[9px] text-slate-400">{t(`${P}.mockAllocation.loadLabel`)}</p>
                        <p className="text-xs font-bold text-white">
                            {t(`${P}.mockAllocation.loadFrom`)}
                            <span className="text-amber-400">{t(`${P}.mockAllocation.loadArrow`)}</span>
                        </p>
                        <div className="w-full h-1 rounded-full bg-slate-700 mt-1 overflow-hidden">
                            <div className="h-full rounded-full bg-red-500" style={{ width: '120%' }} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex gap-2">
                <div className="flex-1 h-8 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center text-[11px] font-semibold text-white cursor-default">
                    {t(`${P}.mockAllocation.confirmBtn`)}
                </div>
                <div className="h-8 rounded-lg border border-slate-600 px-3 flex items-center justify-center text-[11px] text-slate-400 cursor-default">
                    {t(`${P}.mockAllocation.cancelBtn`)}
                </div>
            </div>
        </div>
    );
}

/* ─── Mockup: Dependencies ─── */
function MockDependencies() {
    const { t } = useTranslation('landing');

    return (
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 sm:p-6 shadow-2xl backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-amber-500/30 flex items-center justify-center">
                    <GitBranch className="h-4 w-4 text-amber-300" />
                </div>
                <span className="text-white font-semibold text-sm">{t(`${P}.mockDeps.title`)}</span>
            </div>

            <div className="space-y-2">
                <div className="rounded-xl bg-slate-800/60 p-3 border-l-4 border-emerald-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-white font-semibold">{t(`${P}.mockDeps.t1Title`)}</p>
                            <p className="text-[10px] text-slate-400">{t(`${P}.mockDeps.t1Sub`)}</p>
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
                            <p className="text-xs text-white font-semibold">{t(`${P}.mockDeps.t2Title`)}</p>
                            <p className="text-[10px] text-slate-400">{t(`${P}.mockDeps.t2Sub`)}</p>
                        </div>
                        <span className="text-[9px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 font-bold">
                            {t(`${P}.mockDeps.t2Badge`)}
                        </span>
                    </div>
                </div>

                <div className="flex justify-center">
                    <div className="w-px h-4 bg-slate-600" />
                </div>

                <div className="rounded-xl bg-red-500/10 p-3 border-l-4 border-red-500 border border-red-500/20">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-white font-semibold">{t(`${P}.mockDeps.t3Title`)}</p>
                            <p className="text-[10px] text-red-300">{t(`${P}.mockDeps.t3Sub`)}</p>
                        </div>
                        <AlertTriangle className="h-4 w-4 text-red-400" />
                    </div>
                </div>
            </div>

            <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2">
                <Zap className="h-3.5 w-3.5 text-amber-400 mt-0.5 shrink-0" />
                <p className="text-[10px] text-amber-200/80">
                    {t(`${P}.mockDeps.insightBefore`)}
                    <strong className="text-amber-200">{t(`${P}.mockDeps.insightStrong`)}</strong>
                    {t(`${P}.mockDeps.insightAfter`)}
                </p>
            </div>
        </div>
    );
}

/* ─── Mockup: Split Weeks ─── */
function MockSplitWeeks() {
    const { t } = useTranslation('landing');

    return (
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 sm:p-6 shadow-2xl backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-teal-500/30 flex items-center justify-center">
                    <ArrowLeftRight className="h-4 w-4 text-teal-300" />
                </div>
                <span className="text-white font-semibold text-sm">{t(`${P}.mockSplit.title`)}</span>
            </div>

            <div className="flex gap-2 mb-3">
                <div className="flex-1 rounded-xl bg-indigo-500/10 border border-indigo-500/20 p-3 text-center">
                    <p className="text-[10px] text-indigo-300 font-semibold">{t(`${P}.mockSplit.monthJan`)}</p>
                    <p className="text-[9px] text-slate-400 mt-1">{t(`${P}.mockSplit.janRange`)}</p>
                    <p className="text-sm font-bold text-white mt-1">{t(`${P}.mockSplit.days3`)}</p>
                    <p className="text-[10px] text-indigo-300 font-mono mt-1">{t(`${P}.mockSplit.pct60`)}</p>
                </div>
                <div className="flex items-center">
                    <ArrowLeftRight className="h-3.5 w-3.5 text-slate-500" />
                </div>
                <div className="flex-1 rounded-xl bg-purple-500/10 border border-purple-500/20 p-3 text-center">
                    <p className="text-[10px] text-purple-300 font-semibold">{t(`${P}.mockSplit.monthFeb`)}</p>
                    <p className="text-[9px] text-slate-400 mt-1">{t(`${P}.mockSplit.febRange`)}</p>
                    <p className="text-sm font-bold text-white mt-1">{t(`${P}.mockSplit.days2`)}</p>
                    <p className="text-[10px] text-purple-300 font-mono mt-1">{t(`${P}.mockSplit.pct40`)}</p>
                </div>
            </div>

            <div className="rounded-xl bg-slate-800/60 p-3 border border-slate-700/50">
                <p className="text-[10px] text-slate-400 mb-1">{t(`${P}.mockSplit.taskLine`)}</p>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-indigo-300">{t(`${P}.mockSplit.toJan`)}</span>
                    <span className="text-[10px] text-slate-500">|</span>
                    <span className="text-xs font-bold text-purple-300">{t(`${P}.mockSplit.toFeb`)}</span>
                </div>
                <p className="text-[9px] text-emerald-400/80 mt-1.5">{t(`${P}.mockSplit.foot`)}</p>
            </div>
        </div>
    );
}

/* ─── Main Article ─── */
export function PlannerArticle() {
    const { t, i18n } = useTranslation('landing');
    const pills = i18nAsArray<string>(t(`${P}.hero.pills`, { returnObjects: true }));
    const s1Bullets = i18nAsArray<string>(t(`${P}.s1.bullets`, { returnObjects: true }));
    const s2Tiles = i18nAsArray<{ label: string; desc: string }>(t(`${P}.s2.tiles`, { returnObjects: true }));
    const s3Bullets = i18nAsArray<string>(t(`${P}.s3.bullets`, { returnObjects: true }));
    const s5Cards = i18nAsArray<{ label: string; desc: string }>(t(`${P}.s5.cards`, { returnObjects: true }));
    const ctaStats = i18nAsArray<{ num: string; label: string }>(t(`${P}.cta.stats`, { returnObjects: true }));

    const s1Icons = [Eye, Calendar, AlertTriangle];
    const s3Icons = [GitBranch, AlertTriangle, Zap];
    const s2TileIcons = [BarChart3, Users, AlertTriangle, Target];
    const s5CardIcons = [Layers, Users, BarChart3, Shield];
    const s5CardColors = [
        'from-indigo-500 to-purple-500',
        'from-purple-500 to-pink-500',
        'from-blue-500 to-cyan-500',
        'from-emerald-500 to-teal-500',
    ];

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
                        <MockPlanningGrid />
                    </div>
                    <div className="order-1 lg:order-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-300/90 mb-3 block">
                            {t(`${P}.s1.kicker`)}
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 leading-tight">{t(`${P}.s1.h2`)}</h2>
                        <p className="text-indigo-100/90 mb-4 leading-relaxed">{t(`${P}.s1.p`)}</p>
                        <ul className="space-y-3">
                            {s1Bullets.map((text, i) => {
                                const Icon = s1Icons[i] ?? Eye;
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
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-300/90 mb-3 block">
                            {t(`${P}.s2.kicker`)}
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 leading-tight">{t(`${P}.s2.h2`)}</h2>
                        <p className="text-indigo-100/90 mb-4 leading-relaxed">{t(`${P}.s2.p`)}</p>
                        <div className="grid grid-cols-2 gap-3">
                            {s2Tiles.map(({ label, desc }, i) => {
                                const Icon = s2TileIcons[i] ?? BarChart3;
                                return (
                                    <div key={i} className="rounded-xl bg-white/5 border border-white/10 p-3">
                                        <Icon className="h-4 w-4 text-purple-400 mb-1.5" />
                                        <p className="text-xs text-white font-semibold">{label}</p>
                                        <p className="text-[10px] text-indigo-200/70">{desc}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div>
                        <MockAllocationSheet />
                    </div>
                </div>
            </section>

            <section className="mb-16 sm:mb-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    <div className="order-2 lg:order-1">
                        <MockDependencies />
                    </div>
                    <div className="order-1 lg:order-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-300/90 mb-3 block">
                            {t(`${P}.s3.kicker`)}
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 leading-tight">{t(`${P}.s3.h2`)}</h2>
                        <p className="text-indigo-100/90 mb-4 leading-relaxed">{t(`${P}.s3.p`)}</p>
                        <ul className="space-y-3">
                            {s3Bullets.map((text, i) => {
                                const Icon = s3Icons[i] ?? GitBranch;
                                const color = i === 0 ? 'text-amber-400' : i === 1 ? 'text-red-400' : 'text-emerald-400';
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
                </div>
            </section>

            <section className="mb-16 sm:mb-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    <div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-teal-300/90 mb-3 block">
                            {t(`${P}.s4.kicker`)}
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 leading-tight">{t(`${P}.s4.h2`)}</h2>
                        <p className="text-indigo-100/90 mb-4 leading-relaxed">{t(`${P}.s4.p`)}</p>
                        <div className="rounded-xl border-l-4 border-teal-400 bg-teal-500/10 border border-teal-500/20 p-4">
                            <p className="text-indigo-100/90 text-sm m-0">
                                {t(`${P}.s4.quote`)}
                                <strong className="text-white">{t(`${P}.s4.quoteStrong`)}</strong>
                                {t(`${P}.s4.quoteAfter`)}
                            </p>
                        </div>
                    </div>
                    <div>
                        <MockSplitWeeks />
                    </div>
                </div>
            </section>

            <section className="mb-16 sm:mb-20">
                <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 p-6 sm:p-10">
                    <div className="text-center mb-8">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-300/90 mb-3 block">
                            {t(`${P}.s5.kicker`)}
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">{t(`${P}.s5.h2`)}</h2>
                        <p className="text-indigo-100/90 max-w-2xl mx-auto">{t(`${P}.s5.p`)}</p>
                        <p className="text-indigo-100/80 text-sm max-w-2xl mx-auto mt-3">
                            {t(`${P}.s5.p2Before`)}
                            <strong className="text-white">{t(`${P}.s5.p2Strong`)}</strong>
                            {t(`${P}.s5.p2After`)}
                        </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {s5Cards.map(({ label, desc }, i) => {
                            const Icon = s5CardIcons[i] ?? Layers;
                            const grad = s5CardColors[i] ?? 'from-indigo-500 to-purple-500';
                            return (
                                <div key={i} className="rounded-xl bg-slate-900/60 border border-white/10 p-4 text-center">
                                    <div
                                        className={`w-12 h-12 mx-auto rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center mb-3`}
                                    >
                                        <Icon className="h-6 w-6 text-white" />
                                    </div>
                                    <p className="text-sm text-white font-semibold mb-1">{label}</p>
                                    <p className="text-[11px] text-indigo-200/70">{desc}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            <section className="mb-0">
                <div className="rounded-3xl border-2 border-indigo-500/30 bg-gradient-to-br from-indigo-600/20 via-purple-600/20 to-indigo-600/20 p-6 sm:p-10">
                    <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4 text-center">{t(`${P}.cta.h2`)}</h2>
                    <p className="text-indigo-100/95 mb-6 text-base sm:text-lg leading-relaxed text-center max-w-2xl mx-auto">
                        {t(`${P}.cta.p`)}
                    </p>
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
                                className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-12 py-7 text-lg font-bold shadow-2xl shadow-indigo-500/30 rounded-xl"
                            >
                                {t(`${P}.cta.btn`)}
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </Link>
                        <p className="mt-3 text-sm text-indigo-200/80">{t(`${P}.cta.sub`)}</p>
                        <Link
                            to={localizedPathFromEs('/guia/planificador', i18n.language)}
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
