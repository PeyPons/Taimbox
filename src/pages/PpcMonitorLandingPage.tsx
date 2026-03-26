import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
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

/* ─── Mockup: Dashboard centralizado (Stripe Effect) ─── */
function MockDashboard() {
    return (
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 sm:p-6 shadow-2xl backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-blue-500/30 flex items-center justify-center">
                    <BarChart3 className="h-4 w-4 text-blue-300" />
                </div>
                <span className="text-white font-semibold text-sm">Monitor de presupuestos</span>
                <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold ml-auto flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    En vivo
                </span>
            </div>
            <div className="space-y-2.5">
                {[
                    { client: 'Grupo Holdings S.L.', badge: 'GRUPO', budget: '2.000€', spent: '1.870€', pct: 93.5, status: 'warning' },
                    { client: 'E-com Latam (Performance)', badge: 'REGLA (Cuentas virtuales)', budget: '5.000€', spent: '5.260€', pct: 105.2, status: 'danger' },
                    { client: 'SaaS Innovator B2B', badge: null, budget: '3.000€', spent: '1.350€', pct: 45.0, status: 'ok' },
                ].map((c, i) => {
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
                                <span className={`text-[9px] px-2 py-0.5 rounded font-bold ${statusColors[c.status as keyof typeof statusColors]}`}>
                                    {c.pct}%
                                </span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-slate-700/50 overflow-hidden">
                                <div className={`h-full rounded-full transition-all ${barColors[c.status as keyof typeof barColors]}`} style={{ width: `${Math.min(c.pct, 100)}%` }} />
                            </div>
                            <div className="flex justify-between mt-1.5">
                                <span className="text-[10px] text-slate-400">Gastado: {c.spent}</span>
                                <span className="text-[10px] text-slate-400">Presupuesto: {c.budget}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-slate-700/50 pt-3">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 hover:text-white transition-colors cursor-pointer">
                    <RefreshCw className="h-3 w-3" />
                    <span>Sync a demanda con un botón</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">
                    <span>ROAS Global: 3.42x</span>
                </div>
            </div>
        </div>
    );
}

/* ─── Mockup: Forecast ─── */
function MockForecast() {
    return (
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-5 sm:p-6 shadow-2xl backdrop-blur-sm relative overflow-hidden h-full min-h-[560px] sm:min-h-[640px] flex flex-col justify-start">
            <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none" />
            <div className="flex items-center gap-3 mb-4 shrink-0">
                <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-amber-500/25 to-orange-500/20 border border-amber-500/35 flex items-center justify-center shadow-lg shadow-amber-500/10">
                    <TrendingUp className="h-5 w-5 text-amber-300" />
                </div>
                <div>
                    <h4 className="text-white font-bold text-base sm:text-lg">Proyección a fin de mes</h4>
                    <span className="text-xs sm:text-sm text-amber-200/75">Pacing acumulado: lo gastado hasta hoy vs ritmo objetivo</span>
                </div>
            </div>

            <div className="space-y-3 flex-1 min-h-0 flex flex-col">
                <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-400/20 shadow-[inset_0_1px_0_rgb(255_255_255/0.06)] shrink-0">
                    <h3 className="text-base sm:text-lg font-bold text-amber-300 mb-2 tracking-tight">
                        Calculadora de Previsiones
                    </h3>
                    <p className="text-xs sm:text-sm text-indigo-100/95 leading-relaxed m-0">
                        Proyecta el gasto a fin de mes a partir del ritmo actual y compáralo con el presupuesto objetivo. Así ves
                        qué cuentas necesitan actuar en Google Ads o ajustar límites en Meta (campaña, conjunto o cuenta).
                    </p>
                </div>

                <div className="flex-1 min-h-[260px] sm:min-h-[320px]">
                    <PpcMonitorPacingChart />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 shrink-0">
                    <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-600/40">
                        <p className="text-xs uppercase tracking-wider text-slate-400 mb-1">Gasto final estimado</p>
                        <p className="text-2xl font-bold text-rose-400 tabular-nums m-0">12.500€</p>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-600/40">
                        <p className="text-xs uppercase tracking-wider text-slate-400 mb-1">Presupuesto objetivo</p>
                        <p className="text-2xl font-bold text-white tabular-nums m-0">10.000€</p>
                    </div>
                </div>

                <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-950/50 to-violet-950/40 border border-indigo-400/25 shrink-0">
                    <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-amber-500/15 p-2 border border-amber-400/25 shrink-0">
                            <AlertTriangle className="h-5 w-5 text-amber-300" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm text-indigo-50 font-semibold mb-1">Ritmo recomendado</p>
                            <p className="text-xs text-indigo-200/80 mb-3 leading-relaxed">
                                Para aterrizar en el techo, baja el gasto medio diario respecto al ritmo actual.
                            </p>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm text-slate-400 line-through tabular-nums">416€/día</span>
                                <ArrowRight className="h-4 w-4 text-slate-500 shrink-0" />
                                <span className="text-sm font-bold text-emerald-300 bg-emerald-500/15 px-3 py-1 rounded-lg border border-emerald-400/30 tabular-nums">
                                    250€/día objetivo
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ─── Mockup: Reglas de Segmentación ─── */
function MockSegmentation() {
    return (
        <div className="rounded-2xl border border-white/10 bg-slate-900/90 p-4 sm:p-5 shadow-[0_20px_50px_-12px_rgb(0_0_0/0.45)] backdrop-blur-sm relative overflow-hidden w-full ring-1 ring-white/5">
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-fuchsia-500/10 rounded-full blur-3xl -mr-10 -mb-10 pointer-events-none" />
            <div className="relative flex items-start gap-3 mb-4">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-fuchsia-500/30 to-pink-500/15 border border-fuchsia-400/25 flex items-center justify-center shrink-0">
                    <Scissors className="h-[18px] w-[18px] text-fuchsia-200" />
                </div>
                <div className="min-w-0 pt-0.5">
                    <h4 className="text-white font-semibold text-sm sm:text-base leading-tight">Reglas de segmentación</h4>
                    <p className="text-[11px] sm:text-xs text-fuchsia-200/70 mt-0.5 leading-snug">Una cuenta → varios presupuestos virtuales</p>
                </div>
            </div>

            <div className="relative rounded-xl border border-white/10 bg-slate-950/50 p-3 sm:p-4 space-y-3.5">
                <div className="rounded-lg bg-slate-800/70 border border-slate-600/40 px-3 py-2.5 text-center">
                    <p className="text-xs sm:text-sm font-semibold text-white">Google Ads · cuenta holding</p>
                    <p className="text-[10px] sm:text-xs text-slate-400 font-mono tabular-nums mt-0.5">883-291-0021</p>
                </div>

                <div className="flex items-center gap-2">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-fuchsia-500/35 to-fuchsia-500/20" />
                    <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-fuchsia-300/90 px-2 whitespace-nowrap">
                        Reglas aplicadas
                    </span>
                    <div className="h-px flex-1 bg-gradient-to-l from-transparent via-fuchsia-500/35 to-fuchsia-500/20" />
                </div>

                <div className="grid grid-cols-1 min-[440px]:grid-cols-2 gap-2.5 sm:gap-3">
                    <div className="rounded-lg bg-slate-800/60 border border-fuchsia-500/25 p-2.5 sm:p-3">
                        <div className="flex justify-between items-start gap-1 mb-2">
                            <p className="text-[11px] sm:text-xs font-semibold text-white leading-tight">B2B Software</p>
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        </div>
                        <code className="block text-[9px] sm:text-[10px] text-fuchsia-100/90 bg-fuchsia-950/40 px-1.5 py-1 rounded border border-fuchsia-500/20 font-mono leading-snug mb-2">
                            name contains &quot;B2B&quot;
                        </code>
                        <div className="h-1.5 rounded-full bg-slate-700/80 overflow-hidden mb-1">
                            <div className="h-full rounded-full bg-emerald-500" style={{ width: '45%' }} />
                        </div>
                        <p className="text-[10px] text-slate-400 text-right tabular-nums">45% virtual</p>
                    </div>
                    <div className="rounded-lg bg-slate-800/60 border border-fuchsia-500/25 p-2.5 sm:p-3">
                        <div className="flex justify-between items-start gap-1 mb-2">
                            <p className="text-[11px] sm:text-xs font-semibold text-white leading-tight">Retail Shop</p>
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                        </div>
                        <code className="block text-[9px] sm:text-[10px] text-fuchsia-100/90 bg-fuchsia-950/40 px-1.5 py-1 rounded border border-fuchsia-500/20 font-mono leading-snug mb-2">
                            name contains &quot;ecommerce&quot;
                        </code>
                        <div className="h-1.5 rounded-full bg-slate-700/80 overflow-hidden mb-1">
                            <div className="h-full rounded-full bg-amber-500" style={{ width: '85%' }} />
                        </div>
                        <p className="text-[10px] text-slate-400 text-right tabular-nums">85% virtual</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ─── Mockup: Grupos y Holdings ─── */
function MockHoldings() {
    return (
        <div className="rounded-2xl border border-white/10 bg-slate-900/90 p-4 sm:p-5 shadow-[0_20px_50px_-12px_rgb(0_0_0/0.45)] backdrop-blur-sm relative overflow-hidden w-full ring-1 ring-white/5">
            <div className="absolute top-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -ml-10 -mt-10 pointer-events-none" />
            <div className="relative flex items-start gap-3 mb-4">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500/30 to-cyan-500/15 border border-blue-400/25 flex items-center justify-center shrink-0">
                    <Layers className="h-[18px] w-[18px] text-cyan-200" />
                </div>
                <div className="min-w-0 pt-0.5">
                    <h4 className="text-white font-semibold text-sm sm:text-base leading-tight">Control de holdings</h4>
                    <p className="text-[11px] sm:text-xs text-blue-200/70 mt-0.5 leading-snug">Un paraguas para varias cuentas</p>
                </div>
            </div>

            <div className="relative rounded-xl border border-white/10 bg-slate-950/50 p-3 sm:p-4 space-y-3">
                <div className="rounded-lg bg-gradient-to-br from-blue-950/70 to-slate-900/90 border border-blue-400/25 px-3 py-2.5">
                    <div className="flex justify-between items-start gap-2 mb-2">
                        <span className="text-xs sm:text-sm font-semibold text-white leading-snug">Grupo Inditex (consolidado)</span>
                        <span className="text-xs sm:text-sm font-bold text-emerald-400 tabular-nums shrink-0">62%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-900 overflow-hidden mb-2 ring-1 ring-white/5">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-cyan-400 to-blue-500"
                            style={{ width: '62%' }}
                        />
                    </div>
                    <div className="flex flex-wrap justify-between gap-x-2 gap-y-0.5 text-[10px] sm:text-xs text-slate-400">
                        <span>4 subcuentas</span>
                        <span className="tabular-nums text-slate-300">620.000€ / 1.000.000€</span>
                    </div>
                </div>

                <div className="pl-2.5 sm:pl-3 space-y-1.5 border-l-2 border-blue-500/40">
                    <div className="flex justify-between items-center gap-2 px-2 py-2 rounded-md bg-slate-800/50 border border-slate-600/35">
                        <span className="text-[11px] sm:text-xs text-slate-200 leading-snug">Zara Global · Google Ads</span>
                        <span className="text-[10px] text-slate-400 tabular-nums shrink-0">300k / 500k</span>
                    </div>
                    <div className="flex justify-between items-center gap-2 px-2 py-2 rounded-md bg-slate-800/50 border border-slate-600/35">
                        <span className="text-[11px] sm:text-xs text-slate-200 leading-snug">Massimo Dutti · Meta Ads</span>
                        <span className="text-[10px] text-slate-400 tabular-nums shrink-0">200k / 300k</span>
                    </div>
                    <div className="flex justify-between items-center gap-2 px-2 py-2 rounded-md bg-slate-800/25 border border-dashed border-slate-600/45">
                        <span className="text-[11px] sm:text-xs text-slate-500 flex items-center gap-1.5">
                            <EyeOff className="h-3.5 w-3.5 shrink-0" />
                            Stradivarius (oculta)
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function PpcMonitorLandingPage() {
    return (
        <>
            <Helmet>
                <title>Monitor de presupuestos PPC | Taimbox</title>
                <meta name="description" content="Controla el presupuesto publicitario de todos tus clientes desde un solo dashboard. Google Ads y Meta Ads unificados. Prevención de sobrecostes en tiempo real." />
                <link rel="canonical" href="/monitor-ppc" />
            </Helmet>

            <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-indigo-900 relative overflow-hidden">
                {/* Ambient Effects */}
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

                    {/* ─── HERO ─── */}
                    <section className="mb-16 sm:mb-20 text-center">
                        <div className="mb-6">
                            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider text-amber-300 bg-amber-500/20 border border-amber-400/30">
                                Exclusivo del Plan Business
                            </span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-[1.1] tracking-tight">
                            Duerme tranquilo.{' '}
                            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                                Controla el presupuesto
                            </span>{' '}
                            de todos tus clientes desde un solo lugar.
                        </h1>
                        <p className="text-indigo-100/90 text-base sm:text-lg lg:text-xl leading-relaxed max-w-3xl mx-auto mb-8">
                            Olvídate de abrir 20 pestañas de Google y Meta Ads cada mañana. Taimbox unifica el gasto de tus campañas en tiempo real y te avisa antes de que te pases del budget pactado.
                        </p>
                        <Link to="/login?tab=register">
                            <Button size="lg" className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white px-10 py-7 text-lg font-bold shadow-2xl shadow-amber-500/30 rounded-xl">
                                Probar gratis (14 días)
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </Link>
                        <p className="mt-3 text-sm text-indigo-200/70">Prueba Business gratis · Sincroniza en 2 clics</p>
                    </section>

                    {/* ─── PROBLEMA ─── */}
                    <section className="mb-16 sm:mb-20">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                            <div>
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-red-300/90 mb-3 block">El dolor</span>
                                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 leading-tight">
                                    Un despiste en Ads cuesta muy caro
                                </h2>
                                <p className="text-indigo-100/90 mb-4 leading-relaxed">
                                    En Google Ads, un error al configurar el <strong className="text-white">presupuesto diario</strong> de una campaña puede disparar el gasto. En Meta Ads los límites se reparten entre campaña, conjunto y presupuesto compartido: el riesgo es el mismo (sobrecoste), pero el origen del fallo es distinto. Deja de depender de Excel y de revisar cuenta por cuenta cada mañana.
                                </p>
                                <div className="rounded-xl border-l-4 border-red-400 bg-red-500/10 border border-red-500/20 p-4">
                                    <p className="text-red-100/90 text-sm m-0">
                                        <strong className="text-white">Dato real:</strong> Un despiste en el límite de gasto (especialmente en Google, donde el «presupuesto diario» es muy explícito) puede hacer que quemes varias veces el budget pactado con tu cliente en pocos días.
                                    </p>
                                </div>
                            </div>
                            <div>
                                <MockDashboard />
                            </div>
                        </div>
                    </section>

                    {/* ─── 3 FUNCIONALIDADES CLAVE ─── */}
                    <section className="mb-16 sm:mb-20">
                        <div className="text-center mb-10">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-300/90 mb-3 block">
                                Funcionalidades clave
                            </span>
                            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                                Todo lo que necesitas para proteger tus márgenes
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[
                                {
                                    icon: Eye,
                                    title: 'Dashboard centralizado',
                                    desc: 'Mira el consumo de todos tus clientes en menos de 5 segundos. Detecta al instante si una cuenta está en riesgo de sobregasto, va al alza, a la baja o está bajo control.',
                                    gradient: 'from-blue-500 to-cyan-500',
                                    color: 'text-blue-300',
                                    border: 'border-blue-500/30',
                                    bg: 'from-blue-900/40 to-cyan-900/30',
                                },
                                {
                                    icon: AlertTriangle,
                                    title: 'Calculadora de previsiones',
                                    desc: 'El sistema extrapola el ritmo de gasto (pacing) para prever cuánto gastarás a final de mes y sugiere un objetivo medio diario para aterrizar en el presupuesto acordado (en Meta comparas contra el objetivo que fijas en Taimbox).',
                                    gradient: 'from-amber-500 to-orange-500',
                                    color: 'text-amber-300',
                                    border: 'border-amber-500/30',
                                    bg: 'from-amber-900/40 to-orange-900/30',
                                },
                                {
                                    icon: DollarSign,
                                    title: 'Métricas de Rentabilidad',
                                    desc: 'Controla no solo el gasto, sino el rendimiento. Visualiza automáticamente el ROAS global, CPA, CPC y CTR de cada cuenta sin necesidad de cruzar datos manualmente.',
                                    gradient: 'from-emerald-500 to-teal-500',
                                    color: 'text-emerald-300',
                                    border: 'border-emerald-500/30',
                                    bg: 'from-emerald-900/40 to-teal-900/30',
                                },
                                {
                                    icon: Clock,
                                    title: 'Sincronización manual bajo demanda',
                                    desc: 'Tú controlas cuándo quieres actualizar los datos. Presiona un botón en el dashboard y conéctate en tiempo real con la API de Google Ads sin latencias ni esperas programadas.',
                                    gradient: 'from-fuchsia-500 to-pink-500',
                                    color: 'text-fuchsia-300',
                                    border: 'border-fuchsia-500/30',
                                    bg: 'from-fuchsia-900/40 to-pink-900/30',
                                },
                            ].map(({ icon: Icon, title, desc, gradient, color, border, bg }, i) => (
                                <div key={i} className={`rounded-2xl border ${border} bg-gradient-to-br ${bg} p-6 sm:p-8 flex flex-col`}>
                                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-5 shadow-lg`}>
                                        <Icon className="h-7 w-7 text-white" />
                                    </div>
                                    <h3 className={`text-lg font-bold ${color} mb-3`}>{title}</h3>
                                    <p className="text-indigo-100/85 text-sm leading-relaxed flex-1">{desc}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* ─── MÓDULO AVANZADO DE CONTROL ─── */}
                    <section className="mb-16 sm:mb-20">
                        <div className="text-center mb-10">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-fuchsia-300/90 mb-3 block">
                                Herramientas Avanzadas
                            </span>
                            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                                Diseñado para agencias complejas
                            </h2>
                            <p className="text-indigo-100/80 max-w-2xl mx-auto text-sm sm:text-base">
                                Ve un paso más allá de visualizar datos. Configura proyecciones de gasto en tiempo real, agrupa corporaciones bajo un solo paraguas, y divide cuentas masivas.
                            </p>
                        </div>

                        <div className="space-y-8 pt-4">
                            {/* Forecast destacado */}
                            <div className="space-y-4">
                                <div className="min-h-[560px] sm:min-h-[640px] xl:min-h-[740px]">
                                    <MockForecast />
                                </div>
                            </div>

                            {/* Módulos complementarios: mock + título + copy (como en la versión anterior) */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-start">
                                <div className="flex flex-col gap-4 sm:gap-5">
                                    <div className="w-full">
                                        <MockSegmentation />
                                    </div>
                                    <div className="px-1 sm:px-2 flex flex-col shrink-0">
                                        <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-fuchsia-300 via-pink-200 to-fuchsia-200 bg-clip-text text-transparent mb-3">
                                            Reglas de segmentación automáticas
                                        </h3>
                                        <p className="text-indigo-100/90 text-sm sm:text-base leading-relaxed m-0">
                                            ¿Un mismo ID de Ads para distintos modelos de negocio? Crea reglas por palabras clave y divide las campañas en
                                            sub-cuentas virtuales para fraccionar sus presupuestos.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-4 sm:gap-5">
                                    <div className="w-full">
                                        <MockHoldings />
                                    </div>
                                    <div className="px-1 sm:px-2 flex flex-col shrink-0">
                                        <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-300 via-cyan-200 to-blue-200 bg-clip-text text-transparent mb-3">
                                            Control de holdings y ocultación
                                        </h3>
                                        <p className="text-indigo-100/90 text-sm sm:text-base leading-relaxed m-0">
                                            Asigna a los clientes a su Grupo Corporativo para unificar el seguimiento general. Oculta las cuentas pausadas o
                                            irrelevantes para mantener el dashboard ultra limpio.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ─── INTEGRACIONES ─── */}
                    <section className="mb-16 sm:mb-20">
                        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 p-6 sm:p-10">
                            <div className="text-center mb-8">
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-cyan-300/90 mb-3 block">
                                    Plataformas soportadas
                                </span>
                                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                                    Conectamos con las plataformas que ya usas
                                </h2>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {[
                                    { icon: Globe, label: 'Google Ads', desc: 'Campañas, gasto, presupuesto', color: 'from-blue-500 to-cyan-500' },
                                    { icon: MessageSquare, label: 'Meta Ads', desc: 'Gasto, campañas, ritmo vs objetivo', color: 'from-indigo-500 to-purple-500' },
                                    { icon: DollarSign, label: 'Costes de equipo', desc: 'Horas × coste/hora', color: 'from-emerald-500 to-teal-500' },
                                    { icon: TrendingUp, label: 'P&L en vivo', desc: 'Margen neto por cliente', color: 'from-amber-500 to-orange-500' },
                                ].map(({ icon: Icon, label, desc, color }, i) => (
                                    <div key={i} className="rounded-xl bg-slate-900/60 border border-white/10 p-4 text-center">
                                        <div className={`w-12 h-12 mx-auto rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3`}>
                                            <Icon className="h-6 w-6 text-white" />
                                        </div>
                                        <p className="text-sm text-white font-semibold mb-1">{label}</p>
                                        <p className="text-[11px] text-indigo-200/70">{desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* ─── SEGURIDAD ─── */}
                    <section className="mb-16 sm:mb-20">
                        <div className="flex flex-col sm:flex-row gap-4">
                            {[
                                { icon: Shield, text: 'Tus datos publicitarios están cifrados y aislados por agencia (RLS).', color: 'text-emerald-400', border: 'border-emerald-500/25', bg: 'bg-emerald-950/30' },
                                { icon: RefreshCw, text: 'Tokens OAuth2 protegidos. Taimbox no almacena credenciales ni puede editar campañas.', color: 'text-blue-400', border: 'border-blue-500/25', bg: 'bg-blue-950/30' },
                            ].map(({ icon: Icon, text, color, border, bg }, i) => (
                                <div key={i} className={`flex-1 rounded-xl ${border} ${bg} p-4 flex gap-3`}>
                                    <Icon className={`h-5 w-5 ${color} shrink-0 mt-0.5`} />
                                    <p className="text-indigo-100/90 text-sm m-0">{text}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* ─── CTA FINAL ─── */}
                    <section className="mb-0">
                        <div className="rounded-3xl border-2 border-amber-500/30 bg-gradient-to-br from-amber-600/20 via-orange-600/20 to-amber-600/20 p-6 sm:p-10">
                            <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4 text-center">
                                Protege los márgenes de tu agencia hoy mismo
                            </h2>
                            <p className="text-indigo-100/95 mb-6 text-base sm:text-lg leading-relaxed text-center max-w-2xl mx-auto">
                                Empieza tu prueba de 14 días sin tarjeta y sincroniza tus cuentas publicitarias en 2 clics.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
                                {[
                                    { num: '0€', label: 'durante 14 días' },
                                    { num: '2 clics', label: 'para conectar Ads' },
                                    { num: '−1h/día', label: 'por gestor de cuentas' },
                                ].map(({ num, label }, i) => (
                                    <div key={i} className="text-center p-3 rounded-xl bg-white/5 border border-white/10">
                                        <p className="text-xl sm:text-2xl font-bold text-white">{num}</p>
                                        <p className="text-xs text-indigo-200/70">{label}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="text-center">
                                <Link to="/login?tab=register">
                                    <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white px-12 py-7 text-lg font-bold shadow-2xl shadow-amber-500/30 rounded-xl">
                                        Empezar prueba gratuita del Plan Business
                                        <ArrowRight className="ml-2 h-5 w-5" />
                                    </Button>
                                </Link>
                                <p className="mt-3 text-sm text-indigo-200/80">Sin tarjeta de crédito. Configuración en 2 minutos.</p>
                                <div className="mt-4 flex flex-wrap justify-center gap-3 text-xs text-indigo-200/60">
                                    {['Google Ads', 'Meta Ads', 'Dashboard unificado', 'Alertas automáticas'].map((f, i) => (
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
            </div >
        </>
    );
}
