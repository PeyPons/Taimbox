import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
    ArrowRight,
    CheckCircle2,
    Zap,
    RefreshCw,
    Globe,
    Code2,
    Plug,
    TrendingUp,
    DollarSign,
    Target,
    Calendar,
    MessageSquare,
    ArrowLeftRight,
    Shield,
    Eye,
    Webhook,
    FileDown,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { localizedPathFromEs } from '@/i18n/publicPaths';
import { i18nAsArray } from '@/lib/i18nReturnObjects';

const P = 'commercial.integrations.page';

type Trend = 'up' | 'down';

type GoogleCampaignRow = {
    campaign: string;
    spend: string;
    conv: number;
    cpa: string;
    roas: string;
    trend: Trend;
};

type MetaCampaignRow = {
    campaign: string;
    spend: string;
    reach: string;
    ctr: string;
    platform: string;
};

type WeeklyEmployee = { name: string; status: 'confirmed' | 'pending' };

/* ─── Mockup: Google Ads ─── */
function MockGoogleAds() {
    const { t } = useTranslation('landing');
    const campaigns = i18nAsArray<GoogleCampaignRow>(t(`${P}.mockGoogle.campaigns`, { returnObjects: true }));

    return (
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 sm:p-6 shadow-2xl backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-blue-500/30 flex items-center justify-center">
                    <Globe className="h-4 w-4 text-blue-300" />
                </div>
                <span className="text-white font-semibold text-sm">{t(`${P}.mockGoogle.title`)}</span>
                <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold ml-auto">
                    {t(`${P}.mockGoogle.syncBadge`)}
                </span>
            </div>

            <div className="space-y-2.5">
                {campaigns.map((c, i) => (
                    <div key={i} className="rounded-xl bg-slate-800/60 p-3 border border-slate-700/50">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs text-white/90 font-semibold">{c.campaign}</p>
                            <div className="flex items-center gap-1">
                                <TrendingUp
                                    className={`h-3 w-3 ${c.trend === 'up' ? 'text-emerald-400' : 'text-red-400 rotate-180'}`}
                                />
                                <span
                                    className={`text-[10px] font-bold ${c.trend === 'up' ? 'text-emerald-400' : 'text-red-400'}`}
                                >
                                    {c.roas}
                                </span>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <div>
                                <p className="text-[9px] text-slate-400">{t(`${P}.mockGoogle.colSpend`)}</p>
                                <p className="text-[10px] font-bold text-white">{c.spend}</p>
                            </div>
                            <div>
                                <p className="text-[9px] text-slate-400">{t(`${P}.mockGoogle.colConv`)}</p>
                                <p className="text-[10px] font-bold text-white">{c.conv}</p>
                            </div>
                            <div>
                                <p className="text-[9px] text-slate-400">{t(`${P}.mockGoogle.colCpa`)}</p>
                                <p className="text-[10px] font-bold text-white">{c.cpa}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-500">
                <RefreshCw className="h-3 w-3" />
                <span>{t(`${P}.mockGoogle.lastSync`)}</span>
            </div>
        </div>
    );
}

/* ─── Mockup: Meta Ads ─── */
function MockMetaAds() {
    const { t } = useTranslation('landing');
    const campaigns = i18nAsArray<MetaCampaignRow>(t(`${P}.mockMeta.campaigns`, { returnObjects: true }));

    return (
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 sm:p-6 shadow-2xl backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-indigo-500/30 flex items-center justify-center">
                    <MessageSquare className="h-4 w-4 text-indigo-300" />
                </div>
                <span className="text-white font-semibold text-sm">{t(`${P}.mockMeta.title`)}</span>
                <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold ml-auto">
                    {t(`${P}.mockMeta.activeBadge`)}
                </span>
            </div>

            <div className="space-y-2.5">
                {campaigns.map((c, i) => (
                    <div key={i} className="rounded-xl bg-slate-800/60 p-3 border border-slate-700/50">
                        <div className="flex items-center justify-between mb-2">
                            <div>
                                <p className="text-xs text-white/90 font-semibold">{c.campaign}</p>
                                <p className="text-[9px] text-indigo-400">{c.platform}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <div>
                                <p className="text-[9px] text-slate-400">{t(`${P}.mockMeta.colSpend`)}</p>
                                <p className="text-[10px] font-bold text-white">{c.spend}</p>
                            </div>
                            <div>
                                <p className="text-[9px] text-slate-400">{t(`${P}.mockMeta.colReach`)}</p>
                                <p className="text-[10px] font-bold text-white">{c.reach}</p>
                            </div>
                            <div>
                                <p className="text-[9px] text-slate-400">{t(`${P}.mockMeta.colCtr`)}</p>
                                <p className="text-[10px] font-bold text-white">{c.ctr}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-3 rounded-lg bg-indigo-500/10 p-2 border border-indigo-500/20">
                <p className="text-[10px] text-indigo-200/80">
                    {t(`${P}.mockMeta.footBefore`)}
                    <strong className="text-white">{t(`${P}.mockMeta.footStrong`)}</strong>
                    {t(`${P}.mockMeta.footAfter`)}
                </p>
            </div>
        </div>
    );
}

/* ─── Mockup: API ─── */
function MockAPI() {
    const { t } = useTranslation('landing');
    const pills = [
        { icon: Shield, labelKey: `${P}.mockApi.pillJwt`, color: 'text-emerald-400' },
        { icon: Webhook, labelKey: `${P}.mockApi.pillCrm`, color: 'text-purple-400' },
        { icon: FileDown, labelKey: `${P}.mockApi.pillSdk`, color: 'text-indigo-400' },
    ] as const;

    return (
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 sm:p-6 shadow-2xl backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-purple-500/30 flex items-center justify-center">
                    <Code2 className="h-4 w-4 text-purple-300" />
                </div>
                <span className="text-white font-semibold text-sm">{t(`${P}.mockApi.title`)}</span>
            </div>

            <div className="rounded-xl bg-slate-950 p-3 border border-slate-700/50 font-mono text-[10px] mb-3 overflow-x-auto">
                <p className="text-purple-400">
                    GET <span className="text-emerald-400">/api/v1/tasks</span>
                </p>
                <p className="text-slate-500 mt-1">Authorization: Bearer {'<token>'}</p>
                <p className="text-slate-500">Content-Type: application/json</p>
                <div className="mt-2 border-t border-slate-700/50 pt-2">
                    <p className="text-amber-400">{'{'}</p>
                    <p className="text-slate-300 ml-3">"tasks": [</p>
                    <p className="text-slate-300 ml-6">{`{ "id": "abc123", "name": "${t(`${P}.mockApi.codeTaskName`)}", }`}</p>
                    <p className="text-slate-300 ml-3">],</p>
                    <p className="text-slate-300 ml-3">"total": 42</p>
                    <p className="text-amber-400">{'}'}</p>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
                {pills.map(({ icon: Icon, labelKey, color }, i) => (
                    <div key={i} className="rounded-lg bg-slate-800/60 p-2 text-center border border-slate-700/50">
                        <Icon className={`h-3.5 w-3.5 ${color} mx-auto mb-1`} />
                        <p className="text-[9px] text-slate-400">{t(labelKey)}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ─── Mockup: Weekly Feedback ─── */
function MockWeeklyFeedback() {
    const { t } = useTranslation('landing');
    const employees = i18nAsArray<WeeklyEmployee>(t(`${P}.mockWeekly.employees`, { returnObjects: true }));

    return (
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 sm:p-6 shadow-2xl backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-teal-500/30 flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-teal-300" />
                </div>
                <span className="text-white font-semibold text-sm">{t(`${P}.mockWeekly.title`)}</span>
            </div>

            <div className="rounded-xl bg-slate-800/60 p-3 border border-slate-700/50 mb-3">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-white/90 font-semibold">{t(`${P}.mockWeekly.weekLine`)}</p>
                    <span className="text-[9px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold">
                        {t(`${P}.mockWeekly.pendingBadge`)}
                    </span>
                </div>
                <p className="text-[10px] text-slate-400 mb-2">{t(`${P}.mockWeekly.intro`)}</p>
                <div className="space-y-1.5">
                    {employees.map((e, i) => (
                        <div key={i} className="flex items-center justify-between">
                            <span className="text-[10px] text-white/80">{e.name}</span>
                            <span
                                className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                                    e.status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-600/40 text-slate-400'
                                }`}
                            >
                                {e.status === 'confirmed' ? t(`${P}.mockWeekly.confirmed`) : t(`${P}.mockWeekly.pending`)}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex items-start gap-2 rounded-lg bg-teal-500/10 border border-teal-500/20 px-3 py-2">
                <Zap className="h-3.5 w-3.5 text-teal-400 mt-0.5 shrink-0" />
                <p className="text-[10px] text-teal-200/80">{t(`${P}.mockWeekly.foot`)}</p>
            </div>
        </div>
    );
}

/* ─── Main Article ─── */
export function IntegrationsArticle() {
    const { t, i18n } = useTranslation('landing');
    const pills = i18nAsArray<string>(t(`${P}.hero.pills`, { returnObjects: true }));
    const s1Bullets = i18nAsArray<string>(t(`${P}.s1.bullets`, { returnObjects: true }));
    const s3Tiles = i18nAsArray<{ label: string; desc: string }>(t(`${P}.s3.tiles`, { returnObjects: true }));
    const s4Bullets = i18nAsArray<string>(t(`${P}.s4.bullets`, { returnObjects: true }));
    const s5Cards = i18nAsArray<{ label: string; desc: string }>(t(`${P}.s5.cards`, { returnObjects: true }));
    const ctaStats = i18nAsArray<{ num: string; label: string }>(t(`${P}.cta.stats`, { returnObjects: true }));

    const s1Icons = [DollarSign, Target, TrendingUp];
    const s3Icons = [Code2, Webhook, Shield, Plug];
    const s5Icons = [Globe, MessageSquare, Code2, Calendar, ArrowLeftRight, Eye];
    const s5Colors = [
        'from-blue-500 to-cyan-500',
        'from-indigo-500 to-purple-500',
        'from-purple-500 to-pink-500',
        'from-teal-500 to-emerald-500',
        'from-amber-500 to-orange-500',
        'from-rose-500 to-red-500',
    ];

    return (
        <article className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 md:py-16 text-left overflow-x-hidden">
            <section className="mb-16 sm:mb-20 text-center">
                <div className="mb-6">
                    <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider text-cyan-300 bg-cyan-500/20 border border-cyan-400/30">
                        {t(`${P}.hero.badge`)}
                    </span>
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-[1.1] tracking-tight">
                    {t(`${P}.hero.titleBefore`)}{' '}
                    <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
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
                        <MockGoogleAds />
                    </div>
                    <div className="order-1 lg:order-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-300/90 mb-3 block">
                            {t(`${P}.s1.kicker`)}
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 leading-tight">{t(`${P}.s1.h2`)}</h2>
                        <p className="text-indigo-100/90 mb-4 leading-relaxed">{t(`${P}.s1.p`)}</p>
                        <ul className="space-y-3">
                            {s1Bullets.map((text, i) => {
                                const Icon = s1Icons[i] ?? DollarSign;
                                const color = i === 0 ? 'text-emerald-400' : i === 1 ? 'text-blue-400' : 'text-amber-400';
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
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-300/90 mb-3 block">
                            {t(`${P}.s2.kicker`)}
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 leading-tight">{t(`${P}.s2.h2`)}</h2>
                        <p className="text-indigo-100/90 mb-4 leading-relaxed">
                            {t(`${P}.s2.pBefore`)}
                            <strong className="text-white">{t(`${P}.s2.pStrong`)}</strong>
                            {t(`${P}.s2.pAfter`)}
                        </p>
                        <div className="rounded-xl border-l-4 border-indigo-400 bg-indigo-500/10 border border-indigo-500/20 p-4">
                            <p className="text-indigo-100/90 text-sm m-0">
                                {t(`${P}.s2.quoteBefore`)}
                                <strong className="text-white">{t(`${P}.s2.quoteStrong`)}</strong>
                                {t(`${P}.s2.quoteAfter`)}
                            </p>
                        </div>
                    </div>
                    <div>
                        <MockMetaAds />
                    </div>
                </div>
            </section>

            <section className="mb-16 sm:mb-20">
                <div className="rounded-2xl border border-amber-400/20 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-amber-500/10 p-5 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-center sm:text-left">
                        <p className="text-white font-semibold text-base mb-1">{t(`${P}.ppcCta.title`)}</p>
                        <p className="text-amber-200/70 text-sm m-0">{t(`${P}.ppcCta.subtitle`)}</p>
                    </div>
                    <Link
                        to={localizedPathFromEs('/monitor-ppc', i18n.language)}
                        className="shrink-0 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white text-sm font-bold transition-colors shadow-lg shadow-amber-500/20"
                    >
                        {t(`${P}.ppcCta.btn`)}
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
            </section>

            <section className="mb-16 sm:mb-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    <div className="order-2 lg:order-1">
                        <MockAPI />
                    </div>
                    <div className="order-1 lg:order-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-300/90 mb-3 block">
                            {t(`${P}.s3.kicker`)}
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 leading-tight">{t(`${P}.s3.h2`)}</h2>
                        <p className="text-indigo-100/90 mb-4 leading-relaxed">{t(`${P}.s3.p`)}</p>
                        <div className="grid grid-cols-2 gap-3">
                            {s3Tiles.map(({ label, desc }, i) => {
                                const Icon = s3Icons[i] ?? Code2;
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
                        <ul className="space-y-3">
                            {s4Bullets.map((text, i) => (
                                <li key={i} className="flex items-center gap-3 text-indigo-100/90 text-sm">
                                    <CheckCircle2 className="h-4 w-4 text-teal-400 shrink-0" />
                                    {text}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <MockWeeklyFeedback />
                    </div>
                </div>
            </section>

            <section className="mb-16 sm:mb-20">
                <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 p-6 sm:p-10">
                    <div className="text-center mb-8">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-cyan-300/90 mb-3 block">
                            {t(`${P}.s5.kicker`)}
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">{t(`${P}.s5.h2`)}</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {s5Cards.map(({ label, desc }, i) => {
                            const Icon = s5Icons[i] ?? Globe;
                            const color = s5Colors[i] ?? 'from-blue-500 to-cyan-500';
                            return (
                                <div key={i} className="rounded-xl bg-slate-900/60 border border-white/10 p-4 text-center">
                                    <div
                                        className={`w-12 h-12 mx-auto rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3`}
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
                <div className="rounded-3xl border-2 border-cyan-500/30 bg-gradient-to-br from-cyan-600/20 via-blue-600/20 to-cyan-600/20 p-6 sm:p-10">
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
                                className="w-full sm:w-auto bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white px-12 py-7 text-lg font-bold shadow-2xl shadow-cyan-500/30 rounded-xl"
                            >
                                {t(`${P}.cta.btn`)}
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </Link>
                        <p className="mt-3 text-sm text-indigo-200/80">{t(`${P}.cta.sub`)}</p>
                        <Link
                            to={localizedPathFromEs('/guia/configuracion', i18n.language)}
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
