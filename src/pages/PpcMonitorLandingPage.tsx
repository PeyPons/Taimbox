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
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-5 shadow-2xl backdrop-blur-sm relative overflow-hidden h-full flex flex-col justify-center">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
            <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                    <h4 className="text-white font-bold text-sm">Proyección a fin de mes</h4>
                    <span className="text-[10px] text-amber-200/70">Campaña Black Friday (Día 15/30)</span>
                </div>
            </div>

            <div className="space-y-4">
                <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-slate-400">Gasto final estimado</span>
                        <span className="text-sm font-bold text-red-400">12.500€</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-400">Presupuesto real objetivo</span>
                        <span className="text-sm font-bold text-white">10.000€</span>
                    </div>
                </div>

                <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-900/30 to-purple-900/30 border border-indigo-500/30">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-xs text-indigo-100/90 font-medium mb-1">Ajuste diario recomendado</p>
                            <p className="text-[11px] text-indigo-200/70 mb-2">Para aterrizar en 10.000€ el día 30, debes bajar el gasto diario de inmediato.</p>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-400 line-through">416€ / día</span>
                                <ArrowRight className="h-3 w-3 text-slate-500" />
                                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 animate-pulse">250€ / día</span>
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
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-5 shadow-2xl backdrop-blur-sm relative overflow-hidden h-full flex flex-col justify-center">
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-fuchsia-500/10 rounded-full blur-2xl -mr-10 -mb-10 pointer-events-none" />
            <div className="flex items-center gap-3 mb-5">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-fuchsia-500/20 to-pink-500/20 border border-fuchsia-500/30 flex items-center justify-center">
                    <Scissors className="h-5 w-5 text-fuchsia-400" />
                </div>
                <div>
                    <h4 className="text-white font-bold text-sm">Reglas de Segmentación</h4>
                    <span className="text-[10px] text-fuchsia-200/70">Divide 1 cuenta en presupuestos múltiples</span>
                </div>
            </div>

            <div className="relative">
                {/* Cuenta Madre */}
                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 mx-auto w-3/4 mb-3 relative z-10 text-center shadow-lg">
                    <p className="text-xs font-bold text-white mb-0.5">Google Ads - Cuenta Holding</p>
                    <p className="text-[10px] text-slate-400">ID: 883-291-0021</p>
                </div>

                {/* Líneas conectoras */}
                <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[70%] h-6 border-b-2 border-l-2 border-r-2 border-slate-700/50 rounded-b-xl z-0" />

                {/* Cuentas Hijas Virtuales */}
                <div className="grid grid-cols-2 gap-3 mt-6 relative z-10">
                    <div className="p-3 rounded-xl bg-slate-800/40 border border-fuchsia-500/30 hover:bg-slate-800/60 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-[11px] font-bold text-white">B2B Software</p>
                            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                        </div>
                        <span className="text-[9px] text-fuchsia-300 bg-fuchsia-500/10 px-1.5 py-0.5 rounded border border-fuchsia-500/20 block w-full truncate mb-2">
                            if name contains "B2B"
                        </span>
                        <div className="w-full h-1.5 rounded-full bg-slate-700/50 overflow-hidden mb-1">
                            <div className="h-full rounded-full bg-emerald-500" style={{ width: '45%' }} />
                        </div>
                        <p className="text-[9px] text-slate-400 text-right">45%</p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-800/40 border border-fuchsia-500/30 hover:bg-slate-800/60 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-[11px] font-bold text-white">Retail Shop</p>
                            <AlertTriangle className="h-3 w-3 text-amber-400" />
                        </div>
                        <span className="text-[9px] text-fuchsia-300 bg-fuchsia-500/10 px-1.5 py-0.5 rounded border border-fuchsia-500/20 block w-full truncate mb-2">
                            if name contains "ecommerce"
                        </span>
                        <div className="w-full h-1.5 rounded-full bg-slate-700/50 overflow-hidden mb-1">
                            <div className="h-full rounded-full bg-amber-500" style={{ width: '85%' }} />
                        </div>
                        <p className="text-[9px] text-slate-400 text-right">85%</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ─── Mockup: Grupos y Holdings ─── */
function MockHoldings() {
    return (
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-5 shadow-2xl backdrop-blur-sm relative overflow-hidden h-full flex flex-col justify-center">
            <div className="absolute top-1/2 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -ml-10 -mt-16 pointer-events-none" />
            <div className="flex items-center gap-3 mb-5">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 flex items-center justify-center">
                    <Layers className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                    <h4 className="text-white font-bold text-sm">Control de Holdings</h4>
                    <span className="text-[10px] text-blue-200/70">Agrupa clientes bajo un mismo paraguas</span>
                </div>
            </div>

            <div className="space-y-3 relative z-10">
                <div className="p-3 rounded-xl bg-gradient-to-r from-blue-900/30 to-transparent border-l-2 border-blue-500">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-white">Grupo Inditex (Consolidado)</span>
                        <span className="text-[10px] font-bold text-emerald-400">62%</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-400">4 Sub-cuentas</span>
                        <span className="text-slate-400">Total: 620.000€ / 1.000.000€</span>
                    </div>
                </div>

                <div className="pl-4 space-y-2 border-l border-slate-700/50 ml-3">
                    <div className="flex justify-between items-center p-2 rounded-lg bg-slate-800/40 border border-slate-700/50">
                        <span className="text-[10px] text-slate-300">Zara Global (Google Ads)</span>
                        <span className="text-[9px] text-slate-500">300k / 500k</span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded-lg bg-slate-800/40 border border-slate-700/50">
                        <span className="text-[10px] text-slate-300">Massimo Dutti (Meta Ads)</span>
                        <span className="text-[9px] text-slate-500">200k / 300k</span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded-lg bg-slate-800/40 border border-slate-700/50">
                        <span className="text-[10px] text-slate-300 text-slate-500 flex items-center gap-1">
                            <EyeOff className="h-3 w-3" /> Stradivarius (Oculta)
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

                <article className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 md:py-16 text-left overflow-x-hidden">

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
                                    En una agencia, un error humano al configurar el presupuesto diario significa que <strong className="text-white">la agencia paga la diferencia</strong>. Deja de depender de hojas de Excel desactualizadas y de la memoria de tus Media Buyers.
                                </p>
                                <div className="rounded-xl border-l-4 border-red-400 bg-red-500/10 border border-red-500/20 p-4">
                                    <p className="text-red-100/90 text-sm m-0">
                                        <strong className="text-white">Dato real:</strong> Basta un «0» de más en el presupuesto diario de una campaña para quemar 10× el budget pactado con tu cliente en un solo fin de semana.
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
                                    desc: 'El sistema extrapola el ritmo diario (pacing) para prever cuánto gastará a final de mes. Te recomienda el presupuesto diario óptimo para aterrizar justo en el target.',
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

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch pt-4">
                            {/* Forecast */}
                            <div className="flex flex-col gap-6">
                                <div className="h-[320px]">
                                    <MockForecast />
                                </div>
                                <div className="px-2">
                                    <h3 className="text-lg font-bold text-amber-300 mb-2">Calculadora de Previsiones</h3>
                                    <p className="text-indigo-100/80 text-sm leading-relaxed">
                                        El sistema extrapola el ritmo diario (pacing) para prever cuánto gastará la campaña el último día del mes. Descubre de inmediato qué cuentas necesitan bajada de presupuesto.
                                    </p>
                                </div>
                            </div>

                            {/* Segmentation */}
                            <div className="flex flex-col gap-6">
                                <div className="h-[320px]">
                                    <MockSegmentation />
                                </div>
                                <div className="px-2">
                                    <h3 className="text-lg font-bold text-fuchsia-300 mb-2">Reglas de Segmentación Automáticas</h3>
                                    <p className="text-indigo-100/80 text-sm leading-relaxed">
                                        ¿Un mismo ID de Ads para distintos modelos de negocio? Crea reglas por palabras clave y divide las campañas en sub-cuentas virtuales para fraccionar sus presupuestos.
                                    </p>
                                </div>
                            </div>

                            {/* Holdings */}
                            <div className="flex flex-col gap-6">
                                <div className="h-[320px]">
                                    <MockHoldings />
                                </div>
                                <div className="px-2">
                                    <h3 className="text-lg font-bold text-blue-300 mb-2">Control de Holdings y Ocultación</h3>
                                    <p className="text-indigo-100/80 text-sm leading-relaxed">
                                        Asigna a los clientes a su Grupo Corporativo para unificar el seguimiento general. Oculta las cuentas pausadas o irrelevantes para mantener el dashboard ultra limpio.
                                    </p>
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
                                    { icon: MessageSquare, label: 'Meta Ads', desc: 'Facebook e Instagram', color: 'from-indigo-500 to-purple-500' },
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
