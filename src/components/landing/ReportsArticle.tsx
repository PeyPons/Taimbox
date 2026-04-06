import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
    ArrowRight,
    CheckCircle2,
    BarChart3,
    TrendingUp,
    DollarSign,
    FileDown,
    PieChart,
    Users,
    ArrowUpRight,
    ArrowDownRight,
    FileSpreadsheet,
    Zap,
    Shield,
    Calculator,
    Clock,
    Percent,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { localizedPathFromEs } from '@/i18n/publicPaths';
import { i18nAsArray } from '@/lib/i18nReturnObjects';

const P = 'commercial.reports.page';

const MOCK_PROFIT_NUMS = [
    { revenue: 12000, cost: 8500, profit: 3500, margin: 29 },
    { revenue: 5000, cost: 3200, profit: 1800, margin: 36 },
    { revenue: 8000, cost: 9100, profit: -1100, margin: -14 },
];

/* ─── Mockup: Profitability Dashboard ─── */
function MockProfitability() {
    const { t } = useTranslation('landing');
    const rows = i18nAsArray<{ client: string; name: string }>(
        t(`${P}.mockProfit.rows`, { returnObjects: true }),
    );

    return (
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 sm:p-6 shadow-2xl backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-emerald-500/30 flex items-center justify-center">
                        <PieChart className="h-4 w-4 text-emerald-300" />
                    </div>
                    <span className="text-white font-semibold text-sm">{t(`${P}.mockProfit.title`)}</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold">
                    {t(`${P}.mockProfit.monthBadge`)}
                </span>
            </div>

            <div className="space-y-2.5">
                {rows.map((p, i) => {
                    const nums = MOCK_PROFIT_NUMS[i];
                    if (!nums) return null;
                    const isNegative = nums.profit < 0;
                    return (
                        <div
                            key={i}
                            className={`rounded-xl p-3 border ${isNegative ? 'bg-red-500/10 border-red-500/20' : 'bg-slate-800/60 border-slate-700/50'}`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div>
                                    <p className="text-[10px] text-indigo-400">{p.client}</p>
                                    <p className="text-xs text-white/90 font-semibold">{p.name}</p>
                                </div>
                                <div className="flex items-center gap-1">
                                    {isNegative ? (
                                        <ArrowDownRight className="h-3 w-3 text-red-400" />
                                    ) : (
                                        <ArrowUpRight className="h-3 w-3 text-emerald-400" />
                                    )}
                                    <span className={`text-sm font-bold ${isNegative ? 'text-red-400' : 'text-emerald-400'}`}>{nums.margin}%</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <p className="text-[9px] text-slate-400">{t(`${P}.mockProfit.income`)}</p>
                                    <p className="text-[10px] font-bold text-white">{(nums.revenue / 1000).toFixed(1)}k€</p>
                                </div>
                                <div>
                                    <p className="text-[9px] text-slate-400">{t(`${P}.mockProfit.cost`)}</p>
                                    <p className="text-[10px] font-bold text-white">{(nums.cost / 1000).toFixed(1)}k€</p>
                                </div>
                                <div>
                                    <p className="text-[9px] text-slate-400">{t(`${P}.mockProfit.profit`)}</p>
                                    <p className={`text-[10px] font-bold ${isNegative ? 'text-red-400' : 'text-emerald-400'}`}>
                                        {(nums.profit / 1000).toFixed(1)}k€
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/* ─── Mockup: Client Report ─── */
function MockClientReport() {
    const { t } = useTranslation('landing');
    const lines = i18nAsArray<{ label: string; hours: string; pct: number }>(
        t(`${P}.mockClient.lines`, { returnObjects: true }),
    );

    return (
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 sm:p-6 shadow-2xl backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-purple-500/30 flex items-center justify-center">
                    <FileSpreadsheet className="h-4 w-4 text-purple-300" />
                </div>
                <span className="text-white font-semibold text-sm">{t(`${P}.mockClient.title`)}</span>
            </div>

            <div className="rounded-xl bg-slate-800/60 p-3 border border-slate-700/50 mb-3">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-white font-semibold">{t(`${P}.mockClient.header`)}</p>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">{t(`${P}.mockClient.ready`)}</span>
                </div>
                <div className="space-y-1.5">
                    {lines.map((item, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400 w-24 truncate">{item.label}</span>
                            <div className="flex-1 h-1.5 rounded-full bg-slate-700 overflow-hidden">
                                <div className="h-full rounded-full bg-indigo-500" style={{ width: `${item.pct}%` }} />
                            </div>
                            <span className="text-[10px] font-mono text-white/80 w-8 text-right">{item.hours}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex gap-2">
                <div className="flex-1 h-8 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center text-[10px] font-semibold text-white cursor-default gap-1.5">
                    <FileDown className="h-3 w-3" />
                    {t(`${P}.mockClient.exportPdf`)}
                </div>
                <div className="h-8 rounded-lg border border-slate-600 px-3 flex items-center justify-center text-[10px] text-slate-400 cursor-default gap-1.5">
                    <FileDown className="h-3 w-3" />
                    {t(`${P}.mockClient.exportExcel`)}
                </div>
            </div>
        </div>
    );
}

/* ─── Mockup: Weekly Forecast ─── */
function MockForecast() {
    const { t } = useTranslation('landing');
    const weeks = [
        { label: 'S1', planned: 120, executed: 115, pct: 96 },
        { label: 'S2', planned: 130, executed: 128, pct: 98 },
        { label: 'S3', planned: 110, executed: 95, pct: 86 },
        { label: 'S4', planned: 125, executed: 0, pct: 0 },
    ];

    return (
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 sm:p-6 shadow-2xl backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-amber-500/30 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-amber-300" />
                </div>
                <span className="text-white font-semibold text-sm">{t(`${P}.mockForecast.title`)}</span>
            </div>

            <div className="space-y-2.5">
                {weeks.map((w, i) => {
                    const isCurrentWeek = i === 3;
                    return (
                        <div
                            key={i}
                            className={`rounded-xl p-3 border ${isCurrentWeek ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-slate-800/60 border-slate-700/50'}`}
                        >
                            <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-white font-bold">{w.label}</span>
                                    {isCurrentWeek && (
                                        <span className="text-[8px] px-1.5 py-0.5 rounded bg-indigo-500/30 text-indigo-300 font-bold">
                                            {t(`${P}.mockForecast.currentBadge`)}
                                        </span>
                                    )}
                                </div>
                                <span
                                    className={`text-[10px] font-bold ${w.pct >= 90 ? 'text-emerald-400' : w.pct >= 80 ? 'text-amber-400' : w.pct > 0 ? 'text-red-400' : 'text-slate-500'}`}
                                >
                                    {w.pct > 0 ? `${w.pct}%` : '—'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 h-2 rounded-full bg-slate-700/60 overflow-hidden">
                                    {w.pct > 0 && (
                                        <div
                                            className={`h-full rounded-full ${w.pct >= 90 ? 'bg-emerald-500' : w.pct >= 80 ? 'bg-amber-500' : 'bg-red-500'}`}
                                            style={{ width: `${w.pct}%` }}
                                        />
                                    )}
                                </div>
                                <span className="text-[9px] text-slate-400 font-mono">
                                    {w.executed > 0 ? w.executed : '?'}/{w.planned}h
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2">
                <Zap className="h-3.5 w-3.5 text-amber-400 mt-0.5 shrink-0" />
                <p className="text-[10px] text-amber-200/80">
                    {t(`${P}.mockForecast.footBefore`)}
                    <strong className="text-amber-200">{t(`${P}.mockForecast.footStrong`)}</strong>
                    {t(`${P}.mockForecast.footAfter`)}
                </p>
            </div>
        </div>
    );
}

/* ─── Main Article ─── */
export function ReportsArticle() {
    const { t, i18n } = useTranslation('landing');
    const pills = i18nAsArray<string>(t(`${P}.hero.pills`, { returnObjects: true }));
    const s1Bullets = i18nAsArray<string>(t(`${P}.s1.bullets`, { returnObjects: true }));
    const s2Bullets = i18nAsArray<string>(t(`${P}.s2.bullets`, { returnObjects: true }));
    const exportCards = i18nAsArray<{ label: string; desc: string }>(
        t(`${P}.export.cards`, { returnObjects: true }),
    );
    const ctaStats = i18nAsArray<{ num: string; label: string }>(t(`${P}.cta.stats`, { returnObjects: true }));

    const formulaKeys = ['f1', 'f2', 'f3', 'f4'] as const;
    const formulaIcons = [Clock, DollarSign, Percent, BarChart3];
    const s1Icons = [DollarSign, Users, TrendingUp];
    const exportIcons = [BarChart3, Shield];
    const exportColors = ['from-purple-500 to-pink-500', 'from-amber-500 to-orange-500'];

    return (
        <article className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 md:py-16 text-left overflow-x-hidden">
            {/* HERO */}
            <section className="mb-16 sm:mb-20 text-center">
                <div className="mb-6">
                    <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider text-emerald-300 bg-emerald-500/20 border border-emerald-400/30">
                        {t(`${P}.hero.badge`)}
                    </span>
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-[1.1] tracking-tight">
                    {t(`${P}.hero.title1`)}{' '}
                    <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                        {t(`${P}.hero.titleHighlight`)}
                    </span>
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

            {/* SECTION 1: Rentabilidad */}
            <section className="mb-16 sm:mb-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    <div className="order-2 lg:order-1">
                        <MockProfitability />
                    </div>
                    <div className="order-1 lg:order-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300/90 mb-3 block">{t(`${P}.s1.kicker`)}</span>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 leading-tight">{t(`${P}.s1.h2`)}</h2>
                        <p className="text-indigo-100/90 mb-4 leading-relaxed">{t(`${P}.s1.p`)}</p>
                        <ul className="space-y-3">
                            {s1Bullets.map((text, i) => {
                                const Icon = s1Icons[i] ?? DollarSign;
                                const color = i === 0 ? 'text-emerald-400' : i === 1 ? 'text-indigo-400' : 'text-amber-400';
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

            {/* SECTION 2: Weekly Forecast */}
            <section className="mb-16 sm:mb-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    <div className="order-2 lg:order-1">
                        <MockForecast />
                    </div>
                    <div className="order-1 lg:order-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-300/90 mb-3 block">{t(`${P}.s2.kicker`)}</span>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 leading-tight">{t(`${P}.s2.h2`)}</h2>
                        <p className="text-indigo-100/90 mb-4 leading-relaxed">{t(`${P}.s2.p`)}</p>
                        <ul className="space-y-3">
                            {s2Bullets.map((text, i) => (
                                <li key={i} className="flex items-center gap-3 text-indigo-100/90 text-sm">
                                    <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
                                    {text}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </section>

            {/* SECTION: Lógica financiera (F1–F4 y EHR) */}
            <section className="mb-16 sm:mb-20" id="formulas">
                <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-800/80 to-slate-900/80 p-6 sm:p-10">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="h-10 w-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                            <Calculator className="h-5 w-5 text-cyan-300" />
                        </div>
                        <div>
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-cyan-300/90 block">{t(`${P}.formulas.kicker`)}</span>
                            <h2 className="text-xl sm:text-2xl font-bold text-white">{t(`${P}.formulas.h2`)}</h2>
                        </div>
                    </div>
                    <p className="text-indigo-100/90 text-sm mb-6 max-w-3xl">
                        {t(`${P}.formulas.introBefore`)}
                        <strong className="text-white">{t(`${P}.formulas.introStrong`)}</strong>
                        {t(`${P}.formulas.introAfter`)}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        {formulaKeys.map((fk, i) => {
                            const Icon = formulaIcons[i] ?? BarChart3;
                            return (
                                <div key={fk} className="rounded-xl bg-slate-900/60 border border-white/10 p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Icon className="h-4 w-4 text-cyan-400 shrink-0" />
                                        <span className="text-sm font-bold text-white">{t(`${P}.formulas.${fk}.title`)}</span>
                                    </div>
                                    <p className="text-xs font-mono text-cyan-200/90 mb-2 bg-slate-800/60 px-2 py-1.5 rounded border border-white/5">
                                        {t(`${P}.formulas.${fk}.formula`)}
                                    </p>
                                    <p className="text-[11px] text-indigo-200/80">{t(`${P}.formulas.${fk}.desc`)}</p>
                                </div>
                            );
                        })}
                    </div>
                    <div className="rounded-xl border-l-4 border-amber-500/50 bg-amber-500/10 border border-amber-500/20 p-4">
                        <p className="text-indigo-100/90 text-sm m-0">
                            <strong className="text-white">{t(`${P}.formulas.noteStrong`)}</strong>
                            {t(`${P}.formulas.noteAfter`)}
                        </p>
                    </div>
                </div>
            </section>

            {/* SECTION 4: Exportaciones */}
            <section className="mb-16 sm:mb-20">
                <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 p-6 sm:p-10">
                    <div className="text-center mb-8">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300/90 mb-3 block">{t(`${P}.export.kicker`)}</span>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">{t(`${P}.export.h2`)}</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {exportCards.map(({ label, desc }, i) => {
                            const Icon = exportIcons[i] ?? BarChart3;
                            const color = exportColors[i] ?? 'from-purple-500 to-pink-500';
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

            {/* CTA */}
            <section className="mb-0">
                <div className="rounded-3xl border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-600/20 via-teal-600/20 to-emerald-600/20 p-6 sm:p-10">
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
                                className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-12 py-7 text-lg font-bold shadow-2xl shadow-emerald-500/30 rounded-xl"
                            >
                                {t(`${P}.cta.btn`)}
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </Link>
                        <p className="mt-3 text-sm text-indigo-200/80">{t(`${P}.cta.sub`)}</p>
                        <div className="flex flex-wrap justify-center gap-4 mt-4">
                            <Link
                                to={localizedPathFromEs('/guia/informes', i18n.language)}
                                className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-300/80 hover:text-white transition-colors"
                            >
                                {t(`${P}.cta.guideLink`)}
                                <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                            <Link
                                to={`${localizedPathFromEs('/reportes-rentabilidad', i18n.language)}#formulas`}
                                className="inline-flex items-center gap-1.5 text-sm font-medium text-cyan-300/80 hover:text-white transition-colors"
                            >
                                {t(`${P}.cta.formulasLink`)}
                                <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </article>
    );
}
