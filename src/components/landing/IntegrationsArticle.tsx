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
    BarChart3,
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

/* ─── Mockup: Google Ads ─── */
function MockGoogleAds() {
    return (
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 sm:p-6 shadow-2xl backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-blue-500/30 flex items-center justify-center">
                    <Globe className="h-4 w-4 text-blue-300" />
                </div>
                <span className="text-white font-semibold text-sm">Google Ads</span>
                <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold ml-auto">Sincronizado</span>
            </div>

            <div className="space-y-2.5">
                {[
                    { campaign: 'Brand Search Q1', spend: '2.450€', conv: 127, cpa: '19,29€', roas: '4.2x', trend: 'up' },
                    { campaign: 'Performance Max', spend: '5.100€', conv: 89, cpa: '57,30€', roas: '2.8x', trend: 'up' },
                    { campaign: 'Display Remarketing', spend: '890€', conv: 34, cpa: '26,18€', roas: '3.1x', trend: 'down' },
                ].map((c, i) => (
                    <div key={i} className="rounded-xl bg-slate-800/60 p-3 border border-slate-700/50">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs text-white/90 font-semibold">{c.campaign}</p>
                            <div className="flex items-center gap-1">
                                <TrendingUp className={`h-3 w-3 ${c.trend === 'up' ? 'text-emerald-400' : 'text-red-400 rotate-180'}`} />
                                <span className={`text-[10px] font-bold ${c.trend === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>{c.roas}</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <div>
                                <p className="text-[9px] text-slate-400">Gasto</p>
                                <p className="text-[10px] font-bold text-white">{c.spend}</p>
                            </div>
                            <div>
                                <p className="text-[9px] text-slate-400">Conv.</p>
                                <p className="text-[10px] font-bold text-white">{c.conv}</p>
                            </div>
                            <div>
                                <p className="text-[9px] text-slate-400">CPA</p>
                                <p className="text-[10px] font-bold text-white">{c.cpa}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-500">
                <RefreshCw className="h-3 w-3" />
                <span>Última sincronización: hace 15 min</span>
            </div>
        </div>
    );
}

/* ─── Mockup: Meta Ads ─── */
function MockMetaAds() {
    return (
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 sm:p-6 shadow-2xl backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-indigo-500/30 flex items-center justify-center">
                    <MessageSquare className="h-4 w-4 text-indigo-300" />
                </div>
                <span className="text-white font-semibold text-sm">Meta Ads</span>
                <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold ml-auto">Activo</span>
            </div>

            <div className="space-y-2.5">
                {[
                    { campaign: 'IG Stories — Promo Feb', spend: '1.200€', reach: '45K', ctr: '3.2%', platform: 'Instagram' },
                    { campaign: 'FB Lead Gen Q1', spend: '2.800€', reach: '120K', ctr: '1.8%', platform: 'Facebook' },
                ].map((c, i) => (
                    <div key={i} className="rounded-xl bg-slate-800/60 p-3 border border-slate-700/50">
                        <div className="flex items-center justify-between mb-2">
                            <div>
                                <p className="text-xs text-white/90 font-semibold">{c.campaign}</p>
                                <p className="text-[9px] text-indigo-400">{c.platform}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <div>
                                <p className="text-[9px] text-slate-400">Gasto</p>
                                <p className="text-[10px] font-bold text-white">{c.spend}</p>
                            </div>
                            <div>
                                <p className="text-[9px] text-slate-400">Alcance</p>
                                <p className="text-[10px] font-bold text-white">{c.reach}</p>
                            </div>
                            <div>
                                <p className="text-[9px] text-slate-400">CTR</p>
                                <p className="text-[10px] font-bold text-white">{c.ctr}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-3 rounded-lg bg-indigo-500/10 p-2 border border-indigo-500/20">
                <p className="text-[10px] text-indigo-200/80">Facebook e Instagram unificados. Gasto total: <strong className="text-white">4.000€</strong></p>
            </div>
        </div>
    );
}

/* ─── Mockup: API ─── */
function MockAPI() {
    return (
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 sm:p-6 shadow-2xl backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-purple-500/30 flex items-center justify-center">
                    <Code2 className="h-4 w-4 text-purple-300" />
                </div>
                <span className="text-white font-semibold text-sm">API REST</span>
            </div>

            {/* Code preview */}
            <div className="rounded-xl bg-slate-950 p-3 border border-slate-700/50 font-mono text-[10px] mb-3 overflow-x-auto">
                <p className="text-purple-400">GET <span className="text-emerald-400">/api/v1/tasks</span></p>
                <p className="text-slate-500 mt-1">Authorization: Bearer {'<token>'}</p>
                <p className="text-slate-500">Content-Type: application/json</p>
                <div className="mt-2 border-t border-slate-700/50 pt-2">
                    <p className="text-amber-400">{'{'}</p>
                    <p className="text-slate-300 ml-3">"tasks": [</p>
                    <p className="text-slate-300 ml-6">{"{"} "id": "abc123", "name": "Diseño Home" {"}"}</p>
                    <p className="text-slate-300 ml-3">],</p>
                    <p className="text-slate-300 ml-3">"total": 42</p>
                    <p className="text-amber-400">{'}'}</p>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
                {[
                    { icon: Shield, label: 'Auth JWT', color: 'text-emerald-400' },
                    { icon: Webhook, label: 'CRM/ERP', color: 'text-purple-400' },
                    { icon: FileDown, label: 'SDK', color: 'text-indigo-400' },
                ].map(({ icon: Icon, label, color }, i) => (
                    <div key={i} className="rounded-lg bg-slate-800/60 p-2 text-center border border-slate-700/50">
                        <Icon className={`h-3.5 w-3.5 ${color} mx-auto mb-1`} />
                        <p className="text-[9px] text-slate-400">{label}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ─── Mockup: Weekly Feedback ─── */
function MockWeeklyFeedback() {
    return (
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 sm:p-6 shadow-2xl backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-teal-500/30 flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-teal-300" />
                </div>
                <span className="text-white font-semibold text-sm">Weekly Feedback</span>
            </div>

            <div className="rounded-xl bg-slate-800/60 p-3 border border-slate-700/50 mb-3">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-white/90 font-semibold">Semana del 10-14 feb</p>
                    <span className="text-[9px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold">Pendiente</span>
                </div>
                <p className="text-[10px] text-slate-400 mb-2">Cada empleado confirma sus horas del weekly</p>
                <div className="space-y-1.5">
                    {[
                        { name: 'María A.', status: 'confirmed', label: 'Confirmado' },
                        { name: 'Carlos R.', status: 'confirmed', label: 'Confirmado' },
                        { name: 'Julia L.', status: 'pending', label: 'Pendiente' },
                        { name: 'Pedro S.', status: 'pending', label: 'Pendiente' },
                    ].map((e, i) => (
                        <div key={i} className="flex items-center justify-between">
                            <span className="text-[10px] text-white/80">{e.name}</span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${e.status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-600/40 text-slate-400'
                                }`}>{e.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex items-start gap-2 rounded-lg bg-teal-500/10 border border-teal-500/20 px-3 py-2">
                <Zap className="h-3.5 w-3.5 text-teal-400 mt-0.5 shrink-0" />
                <p className="text-[10px] text-teal-200/80">Los días configurables por integración. Notificación automática a las 18:00 del viernes.</p>
            </div>
        </div>
    );
}


/* ─── Main Article ─── */
export function IntegrationsArticle() {
    return (
        <article className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 md:py-16 text-left overflow-x-hidden">

            {/* HERO */}
            <section className="mb-16 sm:mb-20 text-center">
                <div className="mb-6">
                    <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider text-cyan-300 bg-cyan-500/20 border border-cyan-400/30">
                        Para equipos técnicos y ads
                    </span>
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-[1.1] tracking-tight">
                    Conecta{' '}
                    <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                        todo tu ecosistema
                    </span>
                </h1>
                <p className="text-indigo-100/90 text-base sm:text-lg lg:text-xl leading-relaxed max-w-3xl mx-auto mb-8">
                    Google Ads, Meta Ads, API REST y sistema weekly — todo sincronizado con tu planificación de recursos. Los datos de tus campañas y tu equipo en un solo lugar.
                </p>
                <div className="flex flex-wrap justify-center gap-3 text-sm">
                    {['Google Ads', 'Meta Ads', 'API REST', 'Sincronización CRM/ERP', 'Weekly Feedback'].map((f, i) => (
                        <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-indigo-200/90 text-xs font-medium">
                            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                            {f}
                        </span>
                    ))}
                </div>
            </section>

            {/* SECTION 1: Google Ads */}
            <section className="mb-16 sm:mb-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    <div className="order-2 lg:order-1">
                        <MockGoogleAds />
                    </div>
                    <div className="order-1 lg:order-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-300/90 mb-3 block">Google Ads</span>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 leading-tight">
                            Campañas de Google, datos en tiempo real
                        </h2>
                        <p className="text-indigo-100/90 mb-4 leading-relaxed">
                            Conecta tus cuentas de Google Ads y visualiza gasto, conversiones, CPA y ROAS directamente en el dashboard. Cruza el rendimiento publicitario con el coste real de las horas de tu equipo.
                        </p>
                        <ul className="space-y-3">
                            {[
                                { icon: DollarSign, text: 'Gasto por campaña en tiempo real', color: 'text-emerald-400' },
                                { icon: Target, text: 'Conversiones y CPA automáticos', color: 'text-blue-400' },
                                { icon: TrendingUp, text: 'ROAS conectado con costes de equipo', color: 'text-amber-400' },
                            ].map(({ icon: Icon, text, color }, i) => (
                                <li key={i} className="flex items-center gap-3 text-indigo-100/90 text-sm">
                                    <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                                        <Icon className={`h-3.5 w-3.5 ${color}`} />
                                    </div>
                                    {text}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </section>

            {/* SECTION 2: Meta Ads */}
            <section className="mb-16 sm:mb-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    <div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-300/90 mb-3 block">Meta Ads</span>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 leading-tight">
                            Facebook e Instagram, unificados
                        </h2>
                        <p className="text-indigo-100/90 mb-4 leading-relaxed">
                            Sincroniza tus campañas de Meta Ads (Facebook e Instagram) para ver gasto, alcance y CTR en un único dashboard. Ideal para agencias que gestionan múltiples cuentas publicitarias.
                        </p>
                        <div className="rounded-xl border-l-4 border-indigo-400 bg-indigo-500/10 border border-indigo-500/20 p-4">
                            <p className="text-indigo-100/90 text-sm m-0">
                                Ambas plataformas se gestionan como un solo origen de datos. <strong className="text-white">No necesitas cambiar entre dashboards.</strong>
                            </p>
                        </div>
                    </div>
                    <div>
                        <MockMetaAds />
                    </div>
                </div>
            </section>

            {/* SECTION 3: API */}
            <section className="mb-16 sm:mb-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    <div className="order-2 lg:order-1">
                        <MockAPI />
                    </div>
                    <div className="order-1 lg:order-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-300/90 mb-3 block">Para desarrolladores</span>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 leading-tight">
                            API REST: haz lo que quieras
                        </h2>
                        <p className="text-indigo-100/90 mb-4 leading-relaxed">
                            API completa con autenticación JWT, sincronización de tiempos con tu CRM/ERP y exportación directa a sistemas externos (sujeto a integración). Conecta Taimbox con cualquier herramienta de tu stack.
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { label: 'REST', desc: 'Endpoints documentados', icon: Code2 },
                                { label: 'CRM/ERP', desc: 'Sincronización de tiempos; exportación a sistemas externos', icon: Webhook },
                                { label: 'Auth JWT', desc: 'Tokens seguros', icon: Shield },
                                { label: 'SDK', desc: 'Node.js y Python', icon: Plug },
                            ].map(({ label, desc, icon: Icon }, i) => (
                                <div key={i} className="rounded-xl bg-white/5 border border-white/10 p-3">
                                    <Icon className="h-4 w-4 text-purple-400 mb-1.5" />
                                    <p className="text-xs text-white font-semibold">{label}</p>
                                    <p className="text-[10px] text-indigo-200/70">{desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* SECTION 4: Weekly */}
            <section className="mb-16 sm:mb-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    <div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-teal-300/90 mb-3 block">Sistema Weekly</span>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 leading-tight">
                            Cierre semanal automatizado
                        </h2>
                        <p className="text-indigo-100/90 mb-4 leading-relaxed">
                            Cada semana, los empleados confirman sus horas con un clic. El sistema notifica automáticamente, recoge el feedback y actualiza el forecast. Sin perseguir a nadie por email.
                        </p>
                        <ul className="space-y-3">
                            {[
                                'Notificación automática configurada por día',
                                'Confirmación individual de horas con un clic',
                                'Actualización automática del forecast con datos reales',
                            ].map((text, i) => (
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

            {/* SECTION 5: Ecosistema */}
            <section className="mb-16 sm:mb-20">
                <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 p-6 sm:p-10">
                    <div className="text-center mb-8">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-cyan-300/90 mb-3 block">Todo conectado</span>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                            Un ecosistema, infinitas posibilidades
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[
                            { icon: Globe, label: 'Google Ads', desc: 'Campañas, gasto, conversiones', color: 'from-blue-500 to-cyan-500' },
                            { icon: MessageSquare, label: 'Meta Ads', desc: 'Facebook e Instagram ads', color: 'from-indigo-500 to-purple-500' },
                            { icon: Code2, label: 'API REST', desc: 'Integraciones custom', color: 'from-purple-500 to-pink-500' },
                            { icon: Calendar, label: 'Weekly System', desc: 'Cierre semanal automático', color: 'from-teal-500 to-emerald-500' },
                            { icon: ArrowLeftRight, label: 'Importar/Exportar', desc: 'Excel, CSV, JSON', color: 'from-amber-500 to-orange-500' },
                            { icon: Eye, label: 'Dashboard unificado', desc: 'Todo en una sola vista', color: 'from-rose-500 to-red-500' },
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

            {/* CTA */}
            <section className="mb-0">
                <div className="rounded-3xl border-2 border-cyan-500/30 bg-gradient-to-br from-cyan-600/20 via-blue-600/20 to-cyan-600/20 p-6 sm:p-10">
                    <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4 text-center">
                        Tu stack, potenciado por Taimbox
                    </h2>
                    <p className="text-indigo-100/95 mb-6 text-base sm:text-lg leading-relaxed text-center max-w-2xl mx-auto">
                        Conecta Google Ads, Meta Ads y cualquier herramienta de tu stack. Toda la información de tu agencia centralizada y sincronizada.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
                        {[
                            { num: '5+', label: 'integraciones nativas' },
                            { num: '15min', label: 'sincronización automática' },
                            { num: '∞', label: 'integraciones vía API' },
                        ].map(({ num, label }, i) => (
                            <div key={i} className="text-center p-3 rounded-xl bg-white/5 border border-white/10">
                                <p className="text-xl sm:text-2xl font-bold text-white">{num}</p>
                                <p className="text-xs text-indigo-200/70">{label}</p>
                            </div>
                        ))}
                    </div>
                    <div className="text-center">
                        <Link to="/login">
                            <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white px-12 py-7 text-lg font-bold shadow-2xl shadow-cyan-500/30 rounded-xl">
                                Probar gratis
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </Link>
                        <p className="mt-3 text-sm text-indigo-200/80">Sin tarjeta de crédito. Conecta tu primera integración en minutos.</p>
                        <Link to="/guia/configuracion" className="inline-flex items-center gap-1.5 mt-4 text-sm font-medium text-indigo-300/80 hover:text-white transition-colors">
                            📖 Ver guía técnica de integraciones
                            <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                    </div>
                </div>
            </section>
        </article>
    );
}
