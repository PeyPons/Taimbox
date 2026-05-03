import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
    ArrowRight,
    CheckCircle2,
    Target,
    FolderOpen,
    BarChart3,
    AlertTriangle,
    TrendingUp,
    CalendarCheck,
    Briefcase,
    Flag,
    Settings,
    Zap,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { localizedPathFromEs } from '@/i18n/publicPaths';
import { i18nAsArray } from '@/lib/i18nReturnObjects';

const P = 'commercial.projects.page';

type MockProjectRow = { client: string; name: string };
type MockDeadlineRow = {
    project: string;
    target: number;
    current: number;
    remaining: number;
    weeks: number;
    status: string;
};
type MockKr = { kr: string; pct: number; color: string };
type CoherenceItem = { text: string; variant: string };

/* ─── Mockup: Projects CRUD ─── */
function MockProjects() {
    const { t } = useTranslation('landing');
    const labelRows = i18nAsArray<MockProjectRow>(t(`${P}.mockProjects.rows`, { returnObjects: true }));
    const budgetMeta = [
        { budget: 40, used: 32, status: 'active', color: 'emerald' },
        { budget: 25, used: 18, status: 'active', color: 'emerald' },
        { budget: 15, used: 14, status: 'warning', color: 'amber' },
        { budget: 30, used: 30, status: 'full', color: 'red' },
    ] as const;
    const projects = labelRows.map((row, i) => ({ ...row, ...budgetMeta[i] }));

    return (
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 sm:p-6 shadow-2xl backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-indigo-500/30 flex items-center justify-center">
                        <Briefcase className="h-4 w-4 text-indigo-300" />
                    </div>
                    <span className="text-white font-semibold text-sm">{t(`${P}.mockProjects.title`)}</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold">
                    {t(`${P}.mockProjects.countBadge`, { count: projects.length })}
                </span>
            </div>

            <div className="space-y-2.5">
                {projects.map((p, i) => {
                    const pct = Math.round((p.used / p.budget) * 100);
                    const barColor = p.color === 'red' ? 'bg-red-500' : p.color === 'amber' ? 'bg-amber-500' : 'bg-emerald-500';
                    const textColor = p.color === 'red' ? 'text-red-400' : p.color === 'amber' ? 'text-amber-400' : 'text-emerald-400';
                    return (
                        <div key={i} className={`rounded-xl p-3 border ${p.color === 'red' ? 'bg-red-500/10 border-red-500/20' : 'bg-slate-800/60 border-slate-700/50'}`}>
                            <div className="flex items-center justify-between mb-1.5">
                                <div>
                                    <p className="text-[10px] text-indigo-400">{p.client}</p>
                                    <p className="text-xs text-white/90 font-semibold">{p.name}</p>
                                </div>
                                <span className={`text-[9px] px-2 py-0.5 rounded font-bold ${p.color === 'red' ? 'bg-red-500/20 text-red-400' :
                                    p.color === 'amber' ? 'bg-amber-500/20 text-amber-400' :
                                        'bg-emerald-500/20 text-emerald-400'
                                    }`}>{pct}%</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 rounded-full bg-slate-700/60 overflow-hidden">
                                    <div className={`h-full rounded-full ${barColor}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                                </div>
                                <span className="text-[9px] font-mono text-slate-400">{p.used}/{p.budget}h</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/* ─── Mockup: Deadlines ─── */
function MockDeadlines() {
    const { t } = useTranslation('landing');
    const deadlines = i18nAsArray<MockDeadlineRow>(t(`${P}.mockDeadlines.rows`, { returnObjects: true }));

    return (
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 sm:p-6 shadow-2xl backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-amber-500/30 flex items-center justify-center">
                    <Target className="h-4 w-4 text-amber-300" />
                </div>
                <span className="text-white font-semibold text-sm">{t(`${P}.mockDeadlines.title`)}</span>
            </div>

            <div className="space-y-2.5">
                {deadlines.map((d, i) => (
                    <div key={i} className={`rounded-xl p-3 border ${d.status === 'tight' ? 'bg-amber-500/10 border-amber-500/20' : 'bg-slate-800/60 border-slate-700/50'}`}>
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs text-white/90 font-semibold">{d.project}</p>
                            <div className="flex items-center gap-1">
                                {d.status === 'tight' ? (
                                    <AlertTriangle className="h-3 w-3 text-amber-400" />
                                ) : (
                                    <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                                )}
                                <span className={`text-[9px] font-bold ${d.status === 'tight' ? 'text-amber-400' : 'text-emerald-400'}`}>
                                    {d.status === 'tight' ? t(`${P}.mockDeadlines.statusTight`) : t(`${P}.mockDeadlines.statusOnTrack`)}
                                </span>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                            <div>
                                <p className="text-[9px] text-slate-400">{t(`${P}.mockDeadlines.colObjective`)}</p>
                                <p className="text-xs font-bold text-white">{d.target}h</p>
                            </div>
                            <div>
                                <p className="text-[9px] text-slate-400">{t(`${P}.mockDeadlines.colExecuted`)}</p>
                                <p className="text-xs font-bold text-emerald-400">{d.current}h</p>
                            </div>
                            <div>
                                <p className="text-[9px] text-slate-400">{t(`${P}.mockDeadlines.colRemaining`)}</p>
                                <p className={`text-xs font-bold ${d.status === 'tight' ? 'text-amber-400' : 'text-indigo-300'}`}>
                                    {t(`${P}.mockDeadlines.remainingValue`, { remaining: d.remaining, weeks: d.weeks })}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2">
                <Zap className="h-3.5 w-3.5 text-amber-400 mt-0.5 shrink-0" />
                <p className="text-[10px] text-amber-200/80">
                    {t(`${P}.mockDeadlines.zapBefore`)}
                    <strong className="text-amber-200">{t(`${P}.mockDeadlines.zapStrong`)}</strong>
                    {t(`${P}.mockDeadlines.zapAfter`)}
                </p>
            </div>
        </div>
    );
}

/* ─── Mockup: OKRs ─── */
function MockOKRs() {
    const { t } = useTranslation('landing');
    const krs = i18nAsArray<MockKr>(t(`${P}.mockOKRs.krs`, { returnObjects: true }));
    const globalPct = t(`${P}.mockOKRs.globalProgressPct`);

    return (
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 sm:p-6 shadow-2xl backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-purple-500/30 flex items-center justify-center">
                    <Flag className="h-4 w-4 text-purple-300" />
                </div>
                <span className="text-white font-semibold text-sm">{t(`${P}.mockOKRs.title`)}</span>
            </div>

            <div className="space-y-3">
                <div className="rounded-xl bg-slate-800/60 p-3 border border-slate-700/50">
                    <p className="text-xs text-white/90 font-semibold mb-2">{t(`${P}.mockOKRs.objective`)}</p>
                    <div className="space-y-2">
                        {krs.map((kr, i) => (
                            <div key={i}>
                                <div className="flex items-center justify-between mb-0.5">
                                    <p className="text-[10px] text-slate-400">{kr.kr}</p>
                                    <span className={`text-[9px] font-bold ${kr.color === 'emerald' ? 'text-emerald-400' : 'text-amber-400'}`}>{kr.pct}%</span>
                                </div>
                                <div className="w-full h-1.5 rounded-full bg-slate-700 overflow-hidden">
                                    <div className={`h-full rounded-full ${kr.color === 'emerald' ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${kr.pct}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-xl bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/20 p-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-white/90 font-semibold">{t(`${P}.mockOKRs.globalProgressLabel`)}</span>
                        <span className="text-sm font-bold text-purple-400">{globalPct}</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden mt-2">
                        <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500" style={{ width: globalPct }} />
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ─── Mockup: Coherence Check ─── */
function MockCoherence() {
    const { t } = useTranslation('landing');
    const items = i18nAsArray<CoherenceItem>(t(`${P}.mockCoherence.items`, { returnObjects: true }));

    return (
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 sm:p-6 shadow-2xl backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-emerald-500/30 flex items-center justify-center">
                    <Settings className="h-4 w-4 text-emerald-300" />
                </div>
                <span className="text-white font-semibold text-sm">{t(`${P}.mockCoherence.title`)}</span>
            </div>

            <div className="space-y-2">
                {items.map((item, i) => (
                    <div
                        key={i}
                        className={`flex items-center gap-2 rounded-lg p-2.5 border ${item.variant === 'warn'
                            ? 'bg-amber-500/10 border-amber-500/20'
                            : 'bg-emerald-500/10 border-emerald-500/20'
                            }`}
                    >
                        {item.variant === 'warn' ? (
                            <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                        ) : (
                            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                        )}
                        <p className={`text-[10px] ${item.variant === 'warn' ? 'text-amber-200/80' : 'text-emerald-200/80'}`}>{item.text}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}


/* ─── Main Article ─── */
export function ProjectsArticle() {
    const { t, i18n } = useTranslation('landing');
    const heroPills = i18nAsArray<string>(t(`${P}.hero.pills`, { returnObjects: true }));
    const s1Bullets = i18nAsArray<string>(t(`${P}.s1.bullets`, { returnObjects: true }));
    const s2Bullets = i18nAsArray<string>(t(`${P}.s2.bullets`, { returnObjects: true }));
    const s3Tiles = i18nAsArray<{ label: string; desc: string }>(t(`${P}.s3.tiles`, { returnObjects: true }));
    const s4Bullets = i18nAsArray<string>(t(`${P}.s4.bullets`, { returnObjects: true }));
    const ctaStats = i18nAsArray<{ num: string; label: string }>(t(`${P}.cta.stats`, { returnObjects: true }));

    const s1Icons = [FolderOpen, BarChart3, AlertTriangle];
    const s3Icons = [Flag, Target, TrendingUp, CalendarCheck];

    return (
        <article className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 md:py-16 text-left overflow-x-hidden">

            {/* HERO */}
            <section className="mb-16 sm:mb-20 text-center">
                <div className="mb-6">
                    <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider text-amber-300 bg-amber-500/20 border border-amber-400/30">
                        {t(`${P}.hero.badge`)}
                    </span>
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-[1.1] tracking-tight">
                    {t(`${P}.hero.title1`)}{' '}
                    <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
                        {t(`${P}.hero.titleHighlight`)}
                    </span>
                </h1>
                <p className="text-indigo-100/90 text-base sm:text-lg lg:text-xl leading-relaxed max-w-3xl mx-auto mb-8">
                    {t(`${P}.hero.subtitle`)}
                </p>
                <div className="flex flex-wrap justify-center gap-3 text-sm">
                    {heroPills.map((f, i) => (
                        <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-indigo-200/90 text-xs font-medium">
                            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                            {f}
                        </span>
                    ))}
                </div>
            </section>

            {/* SECTION 1: Proyectos */}
            <section className="mb-16 sm:mb-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    <div className="order-2 lg:order-1">
                        <MockProjects />
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
                            {s1Bullets.map((text, i) => {
                                const Icon = s1Icons[i] ?? FolderOpen;
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

            {/* SECTION 2: Deadlines */}
            <section className="mb-16 sm:mb-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    <div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-300/90 mb-3 block">{t(`${P}.s2.kicker`)}</span>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 leading-tight">
                            {t(`${P}.s2.h2`)}
                        </h2>
                        <p className="text-indigo-100/90 mb-4 leading-relaxed">
                            {t(`${P}.s2.pBefore`)}
                            <strong className="text-white">{t(`${P}.s2.pStrong`)}</strong>
                            {t(`${P}.s2.pAfter`)}
                        </p>
                        <div className="rounded-xl border-l-4 border-amber-400 bg-amber-500/10 border border-amber-500/20 p-4 mb-4">
                            <p className="text-indigo-100/90 text-sm m-0">
                                <strong className="text-white">{t(`${P}.s2.boxStrong`)}</strong>
                                {t(`${P}.s2.boxAfter`)}
                            </p>
                        </div>
                        <ul className="space-y-2 text-sm text-indigo-100/90">
                            {s2Bullets.map((item, i) => (
                                <li key={i} className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <MockDeadlines />
                    </div>
                </div>
            </section>

            {/* SECTION 3: OKRs */}
            <section className="mb-16 sm:mb-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    <div className="order-2 lg:order-1">
                        <MockOKRs />
                    </div>
                    <div className="order-1 lg:order-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-300/90 mb-3 block">{t(`${P}.s3.kicker`)}</span>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 leading-tight">
                            {t(`${P}.s3.h2`)}
                        </h2>
                        <p className="text-indigo-100/90 mb-4 leading-relaxed">
                            {t(`${P}.s3.p`)}
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            {s3Tiles.map(({ label, desc }, i) => {
                                const Icon = s3Icons[i] ?? Flag;
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

            {/* SECTION 4: Coherencia */}
            <section className="mb-16 sm:mb-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    <div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300/90 mb-3 block">{t(`${P}.s4.kicker`)}</span>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 leading-tight">
                            {t(`${P}.s4.h2`)}
                        </h2>
                        <p className="text-indigo-100/90 mb-4 leading-relaxed">
                            {t(`${P}.s4.p`)}
                        </p>
                        <ul className="space-y-3">
                            {s4Bullets.map((text, i) => (
                                <li key={i} className="flex items-center gap-3 text-indigo-100/90 text-sm">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                                    {text}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <MockCoherence />
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="mb-0">
                <div className="rounded-3xl border-2 border-amber-500/30 bg-gradient-to-br from-amber-600/20 via-orange-600/20 to-amber-600/20 p-6 sm:p-10">
                    <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4 text-center">
                        {t(`${P}.cta.h2`)}
                    </h2>
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
                            <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white px-12 py-7 text-lg font-bold shadow-2xl shadow-amber-500/30 rounded-xl">
                                {t(`${P}.cta.btn`)}
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </Link>
                        <p className="mt-3 text-sm text-indigo-200/80">{t(`${P}.cta.sub`)}</p>
                        <Link
                            to={localizedPathFromEs('/guia/clientes-proyectos', i18n.language)}
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
