import { Link } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import { CommercialSeoTags } from '@/seo/CommercialSeoTags';
import { Button } from '@/components/ui/button';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingFooter } from '@/components/landing/LandingFooter';
import {
    ArrowRight,
    Eye,
    AlertTriangle,
    Clock,
    Shield,
    BarChart3,
    DollarSign,
    TrendingUp,
    Globe,
    MessageSquare,
    CheckCircle2,
    RefreshCw,
    Scissors,
    Layers,
    EyeOff,
} from 'lucide-react';
import { PpcMonitorPacingChart } from '@/components/landing/PpcMonitorPacingChart';
import { localizedPathFromEs } from '@/i18n/publicPaths';
import { i18nAsArray } from '@/lib/i18nReturnObjects';

const P = 'commercial.ppc.page';

const FEATURE_ICONS = [Eye, AlertTriangle, DollarSign, Clock];
const PLATFORM_ICONS = [Globe, MessageSquare, DollarSign, TrendingUp];
const SECURITY_ICONS = [Shield, RefreshCw];

type RowStatus = 'ok' | 'warning' | 'danger';

function MockDashboard() {
    const { t } = useTranslation('landing');
    const rows = i18nAsArray<{
        client: string;
        badge: string | null;
        budget: string;
        spent: string;
        pct: number;
        status: RowStatus;
    }>(t(`${P}.mockDashboard.rows`, { returnObjects: true }));

    return (
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 sm:p-6 shadow-2xl backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-blue-500/30 flex items-center justify-center">
                    <BarChart3 className="h-4 w-4 text-blue-300" />
                </div>
                <span className="text-white font-semibold text-sm">{t(`${P}.mockDashboard.title`)}</span>
                <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold ml-auto flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {t(`${P}.mockDashboard.live`)}
                </span>
            </div>
            <div className="space-y-2.5">
                {rows.map((c, i) => {
                    const statusColors = {
                        ok: 'bg-emerald-500/20 text-emerald-400',
                        warning: 'bg-amber-500/20 text-amber-400',
                        danger: 'bg-red-500/20 text-red-400',
                    };
                    const barColors = {
                        ok: 'bg-emerald-500',
                        warning: 'bg-amber-500',
                        danger: 'bg-red-500',
                    };
                    return (
                        <div key={i} className="rounded-xl bg-slate-800/60 p-3 border border-slate-700/50 hover:bg-slate-800/80 transition-colors">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-1.5">
                                    <p className="text-xs text-white/90 font-semibold">{c.client}</p>
                                    {c.badge && (
                                        <span className="text-[9px] px-1 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold tracking-wider">
                                            {c.badge}
                                        </span>
                                    )}
                                </div>
                                <span
                                    className={`text-[9px] px-2 py-0.5 rounded font-bold ${statusColors[c.status as keyof typeof statusColors]}`}
                                >
                                    {c.pct}%
                                </span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-slate-700/50 overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all ${barColors[c.status as keyof typeof barColors]}`}
                                    style={{ width: `${Math.min(c.pct, 100)}%` }}
                                />
                            </div>
                            <div className="flex justify-between mt-1.5">
                                <span className="text-[10px] text-slate-400">
                                    {t(`${P}.mockDashboard.spent`)} {c.spent}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                    {t(`${P}.mockDashboard.budget`)} {c.budget}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-slate-700/50 pt-3">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 hover:text-white transition-colors cursor-pointer">
                    <RefreshCw className="h-3 w-3" />
                    <span>{t(`${P}.mockDashboard.syncHint`)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">
                    <span>{t(`${P}.mockDashboard.roasGlobal`)}</span>
                </div>
            </div>
        </div>
    );
}

function MockForecast() {
    const { t } = useTranslation('landing');

    return (
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-5 sm:p-6 shadow-2xl backdrop-blur-sm relative overflow-hidden h-full min-h-[560px] sm:min-h-[640px] flex flex-col justify-start">
            <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none" />
            <div className="flex items-center gap-3 mb-4 shrink-0">
                <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-amber-500/25 to-orange-500/20 border border-amber-500/35 flex items-center justify-center shadow-lg shadow-amber-500/10">
                    <TrendingUp className="h-5 w-5 text-amber-300" />
                </div>
                <div>
                    <h4 className="text-white font-bold text-base sm:text-lg">{t(`${P}.mockForecast.h4`)}</h4>
                    <span className="text-xs sm:text-sm text-amber-200/75">{t(`${P}.mockForecast.sub`)}</span>
                </div>
            </div>

            <div className="space-y-3 flex-1 min-h-0 flex flex-col">
                <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-400/20 shadow-[inset_0_1px_0_rgb(255_255_255/0.06)] shrink-0">
                    <h3 className="text-base sm:text-lg font-bold text-amber-300 mb-2 tracking-tight">{t(`${P}.mockForecast.calcTitle`)}</h3>
                    <p className="text-xs sm:text-sm text-indigo-100/95 leading-relaxed m-0">{t(`${P}.mockForecast.calcBody`)}</p>
                </div>

                <div className="flex-1 min-h-[260px] sm:min-h-[320px]">
                    <PpcMonitorPacingChart />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 shrink-0">
                    <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-600/40">
                        <p className="text-xs uppercase tracking-wider text-slate-400 mb-1">{t(`${P}.mockForecast.estFinal`)}</p>
                        <p className="text-2xl font-bold text-rose-400 tabular-nums m-0">{t(`${P}.mockForecast.estFinalVal`)}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-600/40">
                        <p className="text-xs uppercase tracking-wider text-slate-400 mb-1">{t(`${P}.mockForecast.targetBudget`)}</p>
                        <p className="text-2xl font-bold text-white tabular-nums m-0">{t(`${P}.mockForecast.targetBudgetVal`)}</p>
                    </div>
                </div>

                <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-950/50 to-violet-950/40 border border-indigo-400/25 shrink-0">
                    <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-amber-500/15 p-2 border border-amber-400/25 shrink-0">
                            <AlertTriangle className="h-5 w-5 text-amber-300" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm text-indigo-50 font-semibold mb-1">{t(`${P}.mockForecast.paceTitle`)}</p>
                            <p className="text-xs text-indigo-200/80 mb-3 leading-relaxed">{t(`${P}.mockForecast.paceBody`)}</p>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm text-slate-400 line-through tabular-nums">{t(`${P}.mockForecast.paceFrom`)}</span>
                                <ArrowRight className="h-4 w-4 text-slate-500 shrink-0" />
                                <span className="text-sm font-bold text-emerald-300 bg-emerald-500/15 px-3 py-1 rounded-lg border border-emerald-400/30 tabular-nums">
                                    {t(`${P}.mockForecast.paceTo`)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function MockSegmentation() {
    const { t } = useTranslation('landing');
    const suf = t(`${P}.mockSegmentation.virtualSuffix`);

    return (
        <div className="rounded-2xl border border-white/10 bg-slate-900/90 p-4 sm:p-5 shadow-[0_20px_50px_-12px_rgb(0_0_0/0.45)] backdrop-blur-sm relative overflow-hidden w-full ring-1 ring-white/5">
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-fuchsia-500/10 rounded-full blur-3xl -mr-10 -mb-10 pointer-events-none" />
            <div className="relative flex items-start gap-3 mb-4">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-fuchsia-500/30 to-pink-500/15 border border-fuchsia-400/25 flex items-center justify-center shrink-0">
                    <Scissors className="h-[18px] w-[18px] text-fuchsia-200" />
                </div>
                <div className="min-w-0 pt-0.5">
                    <h4 className="text-white font-semibold text-sm sm:text-base leading-tight">{t(`${P}.mockSegmentation.h4`)}</h4>
                    <p className="text-[11px] sm:text-xs text-fuchsia-200/70 mt-0.5 leading-snug">{t(`${P}.mockSegmentation.sub`)}</p>
                </div>
            </div>

            <div className="relative rounded-xl border border-white/10 bg-slate-950/50 p-3 sm:p-4 space-y-3.5">
                <div className="rounded-lg bg-slate-800/70 border border-slate-600/40 px-3 py-2.5 text-center">
                    <p className="text-xs sm:text-sm font-semibold text-white">{t(`${P}.mockSegmentation.accountLabel`)}</p>
                    <p className="text-[10px] sm:text-xs text-slate-400 font-mono tabular-nums mt-0.5">883-291-0021</p>
                </div>

                <div className="flex items-center gap-2">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-fuchsia-500/35 to-fuchsia-500/20" />
                    <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-fuchsia-300/90 px-2 whitespace-nowrap">
                        {t(`${P}.mockSegmentation.rulesApplied`)}
                    </span>
                    <div className="h-px flex-1 bg-gradient-to-l from-transparent via-fuchsia-500/35 to-fuchsia-500/20" />
                </div>

                <div className="grid grid-cols-1 min-[440px]:grid-cols-2 gap-2.5 sm:gap-3">
                    <div className="rounded-lg bg-slate-800/60 border border-fuchsia-500/25 p-2.5 sm:p-3">
                        <div className="flex justify-between items-start gap-1 mb-2">
                            <p className="text-[11px] sm:text-xs font-semibold text-white leading-tight">{t(`${P}.mockSegmentation.rule1Name`)}</p>
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        </div>
                        <code className="block text-[9px] sm:text-[10px] text-fuchsia-100/90 bg-fuchsia-950/40 px-1.5 py-1 rounded border border-fuchsia-500/20 font-mono leading-snug mb-2">
                            {t(`${P}.mockSegmentation.rule1Code`)}
                        </code>
                        <div className="h-1.5 rounded-full bg-slate-700/80 overflow-hidden mb-1">
                            <div className="h-full rounded-full bg-emerald-500" style={{ width: '45%' }} />
                        </div>
                        <p className="text-[10px] text-slate-400 text-right tabular-nums">{`45% ${suf}`}</p>
                    </div>
                    <div className="rounded-lg bg-slate-800/60 border border-fuchsia-500/25 p-2.5 sm:p-3">
                        <div className="flex justify-between items-start gap-1 mb-2">
                            <p className="text-[11px] sm:text-xs font-semibold text-white leading-tight">{t(`${P}.mockSegmentation.rule2Name`)}</p>
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                        </div>
                        <code className="block text-[9px] sm:text-[10px] text-fuchsia-100/90 bg-fuchsia-950/40 px-1.5 py-1 rounded border border-fuchsia-500/20 font-mono leading-snug mb-2">
                            {t(`${P}.mockSegmentation.rule2Code`)}
                        </code>
                        <div className="h-1.5 rounded-full bg-slate-700/80 overflow-hidden mb-1">
                            <div className="h-full rounded-full bg-amber-500" style={{ width: '85%' }} />
                        </div>
                        <p className="text-[10px] text-slate-400 text-right tabular-nums">{`85% ${suf}`}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function MockHoldings() {
    const { t } = useTranslation('landing');

    return (
        <div className="rounded-2xl border border-white/10 bg-slate-900/90 p-4 sm:p-5 shadow-[0_20px_50px_-12px_rgb(0_0_0/0.45)] backdrop-blur-sm relative overflow-hidden w-full ring-1 ring-white/5">
            <div className="absolute top-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -ml-10 -mt-10 pointer-events-none" />
            <div className="relative flex items-start gap-3 mb-4">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500/30 to-cyan-500/15 border border-blue-400/25 flex items-center justify-center shrink-0">
                    <Layers className="h-[18px] w-[18px] text-cyan-200" />
                </div>
                <div className="min-w-0 pt-0.5">
                    <h4 className="text-white font-semibold text-sm sm:text-base leading-tight">{t(`${P}.mockHoldings.h4`)}</h4>
                    <p className="text-[11px] sm:text-xs text-blue-200/70 mt-0.5 leading-snug">{t(`${P}.mockHoldings.sub`)}</p>
                </div>
            </div>

            <div className="relative rounded-xl border border-white/10 bg-slate-950/50 p-3 sm:p-4 space-y-3">
                <div className="rounded-lg bg-gradient-to-br from-blue-950/70 to-slate-900/90 border border-blue-400/25 px-3 py-2.5">
                    <div className="flex justify-between items-start gap-2 mb-2">
                        <span className="text-xs sm:text-sm font-semibold text-white leading-snug">{t(`${P}.mockHoldings.groupTitle`)}</span>
                        <span className="text-xs sm:text-sm font-bold text-emerald-400 tabular-nums shrink-0">62%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-900 overflow-hidden mb-2 ring-1 ring-white/5">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-cyan-400 to-blue-500"
                            style={{ width: '62%' }}
                        />
                    </div>
                    <div className="flex flex-wrap justify-between gap-x-2 gap-y-0.5 text-[10px] sm:text-xs text-slate-400">
                        <span>{t(`${P}.mockHoldings.subaccounts`)}</span>
                        <span className="tabular-nums text-slate-300">{t(`${P}.mockHoldings.totals`)}</span>
                    </div>
                </div>

                <div className="pl-2.5 sm:pl-3 space-y-1.5 border-l-2 border-blue-500/40">
                    <div className="flex justify-between items-center gap-2 px-2 py-2 rounded-md bg-slate-800/50 border border-slate-600/35">
                        <span className="text-[11px] sm:text-xs text-slate-200 leading-snug">{t(`${P}.mockHoldings.row1`)}</span>
                        <span className="text-[10px] text-slate-400 tabular-nums shrink-0">{t(`${P}.mockHoldings.row1nums`)}</span>
                    </div>
                    <div className="flex justify-between items-center gap-2 px-2 py-2 rounded-md bg-slate-800/50 border border-slate-600/35">
                        <span className="text-[11px] sm:text-xs text-slate-200 leading-snug">{t(`${P}.mockHoldings.row2`)}</span>
                        <span className="text-[10px] text-slate-400 tabular-nums shrink-0">{t(`${P}.mockHoldings.row2nums`)}</span>
                    </div>
                    <div className="flex justify-between items-center gap-2 px-2 py-2 rounded-md bg-slate-800/25 border border-dashed border-slate-600/45">
                        <span className="text-[11px] sm:text-xs text-slate-500 flex items-center gap-1.5">
                            <EyeOff className="h-3.5 w-3.5 shrink-0" />
                            {t(`${P}.mockHoldings.hidden`)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function PpcMonitorLandingPage() {
    const { t, i18n } = useTranslation('landing');
    const features = i18nAsArray<{
        title: string;
        desc: string;
        gradient: string;
        color: string;
        border: string;
        bg: string;
    }>(t(`${P}.features`, { returnObjects: true }));
    const platformItems = i18nAsArray<{ label: string; desc: string; color: string }>(
        t(`${P}.platforms.items`, { returnObjects: true }),
    );
    const securityStrip = i18nAsArray<{
        text: string;
        color: string;
        border: string;
        bg: string;
    }>(t(`${P}.securityStrip`, { returnObjects: true }));
    const ctaStats = i18nAsArray<{ num: string; label: string }>(t(`${P}.cta.stats`, { returnObjects: true }));
    const ctaFooters = i18nAsArray<string>(t(`${P}.cta.footers`, { returnObjects: true }));

    const loginHref = `${localizedPathFromEs('/login', i18n.language)}?tab=register`;

    return (
        <>
            <CommercialSeoTags pathEs="/monitor-ppc" pageKey="ppc" />

            <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-indigo-900 relative overflow-hidden">
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl opacity-50" />
                    <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl opacity-50" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-3xl opacity-30 pointer-events-none" />
                </div>
                <div
                    className="absolute inset-0 opacity-10 pointer-events-none"
                    style={{
                        backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                        backgroundSize: '50px 50px',
                    }}
                />

                <LandingHeader />

                <article className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 md:py-16 text-left overflow-x-hidden">
                    <section className="mb-16 sm:mb-20 text-center">
                        <div className="mb-6">
                            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider text-amber-300 bg-amber-500/20 border border-amber-400/30">
                                {t(`${P}.hero.badge`)}
                            </span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-[1.1] tracking-tight">
                            {t(`${P}.hero.titleBefore`)}{' '}
                            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                                {t(`${P}.hero.titleGradient`)}
                            </span>{' '}
                            {t(`${P}.hero.titleAfter`)}
                        </h1>
                        <p className="text-indigo-100/90 text-base sm:text-lg lg:text-xl leading-relaxed max-w-3xl mx-auto mb-8">
                            {t(`${P}.hero.subtitle`)}
                        </p>
                        <Link to={loginHref}>
                            <Button
                                size="lg"
                                className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white px-10 py-7 text-lg font-bold shadow-2xl shadow-amber-500/30 rounded-xl"
                            >
                                {t(`${P}.hero.cta`)}
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </Link>
                        <p className="mt-3 text-sm text-indigo-200/70">{t(`${P}.hero.ctaSub`)}</p>
                    </section>

                    <section className="mb-16 sm:mb-20">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                            <div>
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-red-300/90 mb-3 block">
                                    {t(`${P}.problem.kicker`)}
                                </span>
                                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 leading-tight">{t(`${P}.problem.h2`)}</h2>
                                <p className="text-indigo-100/90 mb-4 leading-relaxed">
                                    <Trans
                                        i18nKey={`${P}.problem.p`}
                                        ns="landing"
                                        components={{ strong: <strong className="text-white" /> }}
                                    />
                                </p>
                                <div className="rounded-xl border-l-4 border-red-400 bg-red-500/10 border border-red-500/20 p-4">
                                    <p className="text-red-100/90 text-sm m-0">
                                        <strong className="text-white">{t(`${P}.problem.quoteStrong`)}</strong>
                                        {t(`${P}.problem.quoteAfter`)}
                                    </p>
                                </div>
                            </div>
                            <div>
                                <MockDashboard />
                            </div>
                        </div>
                    </section>

                    <section className="mb-16 sm:mb-20">
                        <div className="text-center mb-10">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-300/90 mb-3 block">
                                {t(`${P}.featuresSection.kicker`)}
                            </span>
                            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">{t(`${P}.featuresSection.h2`)}</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {features.map((f, i) => {
                                const Icon = FEATURE_ICONS[i] ?? Eye;
                                return (
                                    <div key={i} className={`rounded-2xl border ${f.border} bg-gradient-to-br ${f.bg} p-6 sm:p-8 flex flex-col`}>
                                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-5 shadow-lg`}>
                                            <Icon className="h-7 w-7 text-white" />
                                        </div>
                                        <h3 className={`text-lg font-bold ${f.color} mb-3`}>{f.title}</h3>
                                        <p className="text-indigo-100/85 text-sm leading-relaxed flex-1">{f.desc}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    <section className="mb-16 sm:mb-20">
                        <div className="text-center mb-10">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-fuchsia-300/90 mb-3 block">
                                {t(`${P}.advanced.kicker`)}
                            </span>
                            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">{t(`${P}.advanced.h2`)}</h2>
                            <p className="text-indigo-100/80 max-w-2xl mx-auto text-sm sm:text-base">{t(`${P}.advanced.p`)}</p>
                        </div>

                        <div className="space-y-8 pt-4">
                            <div className="space-y-4">
                                <div className="min-h-[560px] sm:min-h-[640px] xl:min-h-[740px]">
                                    <MockForecast />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-start">
                                <div className="flex flex-col gap-4 sm:gap-5">
                                    <div className="w-full">
                                        <MockSegmentation />
                                    </div>
                                    <div className="px-1 sm:px-2 flex flex-col shrink-0">
                                        <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-fuchsia-300 via-pink-200 to-fuchsia-200 bg-clip-text text-transparent mb-3">
                                            {t(`${P}.segCopy.h3`)}
                                        </h3>
                                        <p className="text-indigo-100/90 text-sm sm:text-base leading-relaxed m-0">{t(`${P}.segCopy.p`)}</p>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-4 sm:gap-5">
                                    <div className="w-full">
                                        <MockHoldings />
                                    </div>
                                    <div className="px-1 sm:px-2 flex flex-col shrink-0">
                                        <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-300 via-cyan-200 to-blue-200 bg-clip-text text-transparent mb-3">
                                            {t(`${P}.holdCopy.h3`)}
                                        </h3>
                                        <p className="text-indigo-100/90 text-sm sm:text-base leading-relaxed m-0">{t(`${P}.holdCopy.p`)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="mb-16 sm:mb-20">
                        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 p-6 sm:p-10">
                            <div className="text-center mb-8">
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-cyan-300/90 mb-3 block">
                                    {t(`${P}.platforms.kicker`)}
                                </span>
                                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">{t(`${P}.platforms.h2`)}</h2>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {platformItems.map(({ label, desc, color }, i) => {
                                    const Icon = PLATFORM_ICONS[i] ?? Globe;
                                    return (
                                        <div key={i} className="rounded-xl bg-slate-900/60 border border-white/10 p-4 text-center">
                                            <div className={`w-12 h-12 mx-auto rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3`}>
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

                    <section className="mb-16 sm:mb-20">
                        <div className="flex flex-col sm:flex-row gap-4">
                            {securityStrip.map(({ text, color, border, bg }, i) => {
                                const Icon = SECURITY_ICONS[i] ?? Shield;
                                return (
                                    <div key={i} className={`flex-1 rounded-xl ${border} ${bg} p-4 flex gap-3`}>
                                        <Icon className={`h-5 w-5 ${color} shrink-0 mt-0.5`} />
                                        <p className="text-indigo-100/90 text-sm m-0">{text}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    <section className="mb-0">
                        <div className="rounded-3xl border-2 border-amber-500/30 bg-gradient-to-br from-amber-600/20 via-orange-600/20 to-amber-600/20 p-6 sm:p-10">
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
                                <Link to={loginHref}>
                                    <Button
                                        size="lg"
                                        className="w-full sm:w-auto bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white px-12 py-7 text-lg font-bold shadow-2xl shadow-amber-500/30 rounded-xl"
                                    >
                                        {t(`${P}.cta.btn`)}
                                        <ArrowRight className="ml-2 h-5 w-5" />
                                    </Button>
                                </Link>
                                <p className="mt-3 text-sm text-indigo-200/80">{t(`${P}.cta.sub`)}</p>
                                <div className="mt-4 flex flex-wrap justify-center gap-3 text-xs text-indigo-200/60">
                                    {ctaFooters.map((f, i) => (
                                        <span key={i} className="inline-flex items-center gap-1">
                                            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                                            {f}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>
                </article>

                <LandingFooter />
            </div>
        </>
    );
}
