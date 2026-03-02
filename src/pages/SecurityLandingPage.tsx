import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { Button } from '@/components/ui/button';
import {
    Shield,
    Lock,
    Key,
    Database,
    Server,
    CheckCircle2,
    Building2,
    ArrowRight,
    Globe,
    FileText,
    Users,
    Activity,
    AlertTriangle,
    Mail,
    CreditCard,
    Download,
} from 'lucide-react';

export default function SecurityLandingPage() {
    return (
        <div className="min-h-screen bg-slate-950 flex flex-col font-sans selection:bg-indigo-500/30 overflow-x-hidden">
            <Helmet>
                <title>Seguridad y Privacidad nivel Enterprise | Taimbox</title>
                <meta name="description" content="Descubre cómo Taimbox protege los datos de tu agencia y los de tus clientes con cifrado AES-256, aislamiento RLS estricto y conexiones OAuth2 seguras sin contraseñas." />
                <link rel="canonical" href="/seguridad" />
            </Helmet>

            <LandingHeader />

            <main className="flex-1 relative z-10 pt-32 pb-24">
                {/* Ambient glow */}
                <div className="absolute top-0 inset-x-0 h-[600px] bg-gradient-to-b from-emerald-900/10 via-slate-950 to-slate-950 pointer-events-none" />

                {/* ─── HERO SECTION ─── */}
                <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-20 relative">
                    <div className="text-center max-w-3xl mx-auto">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-medium mb-8">
                            <Shield className="h-4 w-4" />
                            Arquitectura de confianza Zero-Trust
                        </div>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 tracking-tight leading-tight">
                            La seguridad de tu agencia no es negociable. <br />
                            <span className="bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
                                La nuestra tampoco.
                            </span>
                        </h1>
                        <p className="text-lg text-slate-400 mb-10 leading-relaxed max-w-2xl mx-auto">
                            Sabemos que manejas la rentabilidad, los salarios y el gasto publicitario de decenas de clientes. Por eso hemos construido Taimbox sobre una arquitectura de seguridad estricta, diseñada para repeler accesos no autorizados por diseño, no como una capa añadida al final.
                        </p>
                    </div>
                </section>

                {/* ─── LOS 3 PILARES (CARACTERÍSTICAS PRINCIPALES) ─── */}
                <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-32">
                    <div className="text-center mb-12">
                        <h2 className="text-sm font-semibold text-emerald-500 tracking-wider uppercase mb-2">Fundamentos Técnicos</h2>
                        <h3 className="text-3xl font-bold text-white">Los 3 pilares de nuestra infraestructura</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Aislamiento (RLS) */}
                        <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-slate-700 transition-colors flex flex-col">
                            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 mb-6">
                                <Database className="h-6 w-6 text-indigo-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Aislamiento Físico (RLS)</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Utilizamos <strong className="text-slate-200">PostgreSQL Row Level Security (RLS)</strong> de forma nativa. Esto significa que la separación de agencias ocurre en el motor de la base de datos, no en el código de la aplicación. Es criptográficamente imposible que un error en nuestro frontend exponga datos de una agencia a otra.
                            </p>
                        </div>

                        {/* Cifrado AES-256 */}
                        <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-slate-700 transition-colors flex flex-col">
                            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 mb-6">
                                <Lock className="h-6 w-6 text-emerald-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Cifrado en Tránsito y Reposo</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Toda comunicación viaja sobre <strong className="text-slate-200">TLS 1.3</strong> (cifrado en tránsito) y todos los discos de la base de datos utilizan el estándar <strong className="text-slate-200">AES-256</strong> (cifrado en reposo). El acceso interno a bases de datos de producción está estrictamente restringido por políticas de 'Mínimo Privilegio' y requiere justificación expresa para labores de soporte.
                            </p>
                        </div>

                        {/* Cero Contraseñas Ads */}
                        <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-slate-700 transition-colors flex flex-col">
                            <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 mb-6">
                                <Key className="h-6 w-6 text-orange-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Cero credenciales compartidas</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Al conectar Google o Meta Ads, <strong className="text-slate-200">nunca almacenamos tus contraseñas</strong>. Se procesan delegaciones mediante OAuth2 (Tokens JWT de corta vida) avalados directamente por los proveedores externos. Puedes revocar el acceso desde Google en 1 clic.
                            </p>
                        </div>
                    </div>
                </section>

                {/* ─── INFRAESTRUCTURA VISUAL DETALLADA ─── */}
                <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-32">
                    <div className="rounded-3xl border border-slate-800 bg-slate-900/30 p-8 sm:p-12 overflow-hidden relative shadow-2xl">
                        {/* Glow effect */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-3xl" />

                        <div className="grid md:grid-cols-2 gap-12 items-center relative z-10">
                            <div>
                                <h2 className="text-3xl font-bold text-white mb-6">Infraestructura Certificada (AWS)</h2>
                                <p className="text-slate-400 leading-relaxed mb-6">
                                    Alojamos Taimbox en infraestructuras y centros de datos certificados con ISO 27001 y SOC 2, ubicados estrictamente dentro de la Unión Europea (Frankfurt / Irlanda), manteniendo total cumplimiento con las directivas del <strong>Reglamento General de Protección de Datos (RGPD)</strong> europeo.
                                </p>
                                <ul className="space-y-4 mb-8">
                                    {[
                                        'Infraestructura de datos certificada (ISO 27001, SOC 2 Type II).',
                                        'Backups automáticos Point-in-Time Recovery (PITR) retenidos 7 días.',
                                        'Réplicas de lectura (Read-Replicas) para alta disponibilidad (99.99% Uptime).',
                                        'Protección avanzada contra ataques DDoS (AWS Shield).'
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-start gap-3">
                                            <CheckCircle2 className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
                                            <span className="text-slate-300 text-sm">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="flex justify-center relative">
                                {/* Diagrama Mockup Seguro */}
                                <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl w-full max-w-sm relative z-10">
                                    <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
                                        <span className="text-sm font-mono text-slate-400 flex items-center gap-2">
                                            <Server className="h-4 w-4" /> Node 01 (EU-Central-1)
                                        </span>
                                        <span className="flex items-center gap-2 text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">
                                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            Healthy
                                        </span>
                                    </div>
                                    <div className="space-y-4">
                                        {/* Agencia A */}
                                        <div className="flex items-center gap-4 p-3 rounded-lg bg-slate-900 border border-slate-800 opacity-90 relative overflow-hidden group">
                                            <div className="absolute inset-0 bg-indigo-500/5 group-hover:bg-indigo-500/10 transition-colors" />
                                            <Building2 className="h-5 w-5 text-indigo-400 relative z-10" />
                                            <div className="flex-1 relative z-10">
                                                <div className="flex justify-between items-center mb-1.5">
                                                    <span className="text-[10px] text-slate-400 font-mono">Agencia: a3f9-ba21</span>
                                                    <Lock className="h-3 w-3 text-emerald-400" />
                                                </div>
                                                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                    <div className="w-1/3 h-full bg-indigo-500" />
                                                </div>
                                            </div>
                                        </div>
                                        {/* Firewall visual */}
                                        <div className="flex justify-center -my-1 relative z-20">
                                            <div className="px-3 py-0.5 rounded text-[8px] bg-slate-800 text-slate-400 border border-slate-700 font-bold uppercase tracking-widest shadow-lg">
                                                Row Level Security Wall
                                            </div>
                                        </div>
                                        {/* Agencia B */}
                                        <div className="flex items-center gap-4 p-3 rounded-lg bg-slate-900 border border-slate-800 opacity-90 relative overflow-hidden group">
                                            <div className="absolute inset-0 bg-orange-500/5 group-hover:bg-orange-500/10 transition-colors" />
                                            <Building2 className="h-5 w-5 text-orange-400 relative z-10" />
                                            <div className="flex-1 relative z-10">
                                                <div className="flex justify-between items-center mb-1.5">
                                                    <span className="text-[10px] text-slate-400 font-mono">Agencia: 88cf-991x</span>
                                                    <Lock className="h-3 w-3 text-emerald-400" />
                                                </div>
                                                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                    <div className="w-2/3 h-full bg-orange-500" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-center text-[10px] text-slate-500 mt-6 uppercase tracking-widest font-semibold flex items-center justify-center gap-2">
                                        <Shield className="h-3 w-3 text-emerald-500" /> Strict Data Partitioning
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ─── PERMISOS DE GOOGLE ADS / API ─── */}
                <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-32">
                    <div className="text-center mb-12">
                        <h2 className="text-sm font-semibold text-blue-500 tracking-wider uppercase mb-2">Conectores Externos (PPC)</h2>
                        <h3 className="text-3xl font-bold text-white">Solo leemos, jamás escribimos</h3>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div className="order-2 lg:order-1">
                            {/* Visual representation of Google Ads read-only access */}
                            <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-blue-900/10 to-indigo-900/10 border border-blue-500/20 shadow-2xl">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -mr-10 -mt-10" />
                                <div className="flex flex-col gap-4 relative z-10">
                                    <div className="flex justify-between items-center p-4 rounded-xl bg-slate-900/90 border border-slate-800 backdrop-blur-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-white/5 p-2 rounded-lg">
                                                <Globe className="h-6 w-6 text-blue-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white">Google Ads API</p>
                                                <p className="text-[10px] text-slate-400 font-mono">auth/adwords.readonly</p>
                                            </div>
                                        </div>
                                        <div className="text-[10px] font-bold px-2 py-1 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
                                            OAuth2 Scope
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-center py-2 relative h-12">
                                        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-blue-500/50 to-emerald-500/50 -translate-x-1/2 border-dashed border-l border-white/20" />
                                        <ArrowRight className="h-5 w-5 text-emerald-400 rotate-90 transform bg-slate-950 p-1 z-10 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.3)]" />
                                    </div>

                                    <div className="p-5 rounded-xl bg-slate-900/90 border border-emerald-500/20 relative shadow-xl backdrop-blur-sm">
                                        <p className="text-xs font-bold text-emerald-400 mb-4 px-1">Permisos otorgados a Taimbox:</p>
                                        <ul className="space-y-3">
                                            <li className="flex items-center gap-3 text-xs text-slate-200 bg-slate-800/50 p-2 rounded-lg border border-slate-700/50">
                                                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /> Leer presupuestos e informes diarios
                                            </li>
                                            <li className="flex items-center gap-3 text-xs text-slate-200 bg-slate-800/50 p-2 rounded-lg border border-slate-700/50">
                                                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /> Sincronizar métricas de gasto en campaña
                                            </li>
                                            <li className="flex items-center gap-3 text-xs text-slate-500 opacity-60 px-2 mt-4">
                                                <AlertTriangle className="h-3.5 w-3.5 text-red-500" /> <span className="line-through decoration-red-500/50">Pausar/Activar campañas</span> (Denegado)
                                            </li>
                                            <li className="flex items-center gap-3 text-xs text-slate-500 opacity-60 px-2">
                                                <AlertTriangle className="h-3.5 w-3.5 text-red-500" /> <span className="line-through decoration-red-500/50">Modificar pujas o kws</span> (Denegado)
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="order-1 lg:order-2">
                            <h4 className="text-xl font-bold text-white mb-4">La seguridad de tu ROAS garantizada por infraestructura</h4>
                            <p className="text-slate-400 mb-6 leading-relaxed">
                                El mayor temor de un Director de Performance es que un software externo de monitorización modifique accidentalmente las campañas en producción tirando por tierra el historial.
                                En Taimbox, esto es técnicamente imposible.
                            </p>
                            <p className="text-slate-400 mb-6 leading-relaxed">
                                Cuando conectas Google Ads o Meta Ads en la sección de Integraciones, nosotros reclamamos <strong>exclusivamente los 'Scopes' de API de solo lectura</strong> de informes. El servidor de autorización rechaza automáticamente pedir accesos de escritura al usuario.
                            </p>
                            <p className="text-slate-400 mb-8 leading-relaxed">
                                Si, hipotéticamente, alguien intentara ejecutar una pausa de campaña desde nuestro código o servidor, la propia API de Google Ads Server devolvería un <code className="text-xs bg-slate-800 px-1 py-0.5 rounded text-fuchsia-300">HTTP 403 Forbidden</code> y rechazaría la inyección de la petición.
                            </p>
                            <Link to="/monitor-ppc">
                                <Button className="bg-white/10 hover:bg-white/20 text-white border-0 transition-colors">
                                    Conocer el Monitor de Presupuestos <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </section>

                {/* ─── SEGURIDAD APLICATIVA (EQUIPOS) ─── */}
                <section className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto mb-32">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-white mb-4">Control de accesos interno en tu agencia</h2>
                        <p className="text-slate-400 max-w-2xl mx-auto">
                            La seguridad interna ante fugas de información importa tanto como la externa. Taimbox te otorga un control de vista absoluto sobre el organigrama operativo de tus empleados.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-8 rounded-2xl bg-slate-900/30 border border-slate-800 hover:border-blue-500/20 transition-all group flex items-start gap-5">
                            <div className="mt-1 bg-blue-500/10 p-3 rounded-xl border border-blue-500/20 group-hover:scale-105 transition-transform">
                                <Users className="h-6 w-6 text-blue-400" />
                            </div>
                            <div>
                                <h4 className="text-lg text-white font-bold mb-2">Roles Customizables Multi-nivel</h4>
                                <p className="text-sm text-slate-400 leading-relaxed">
                                    Crea perfiles exactos. ¿Un 'Traffic Manager' que solo pueda ver campañas PPC pero no las rentabilidades generales de la agencia? Hecho. Taimbox no te obliga a dar acceso masivo. Las restricciones se aplican a nivel de base de datos antes de pintar cualquier UI o gráfica del panel.
                                </p>
                            </div>
                        </div>

                        <div className="p-8 rounded-2xl bg-slate-900/30 border border-slate-800 hover:border-fuchsia-500/20 transition-all group flex items-start gap-5">
                            <div className="mt-1 bg-fuchsia-500/10 p-3 rounded-xl border border-fuchsia-500/20 group-hover:scale-105 transition-transform">
                                <Activity className="h-6 w-6 text-fuchsia-400" />
                            </div>
                            <div>
                                <h4 className="text-lg text-white font-bold mb-2">Módulos ciegos para empleados base</h4>
                                <p className="text-sm text-slate-400 leading-relaxed">
                                    Por defecto, un trabajador 'estándar' solo visualiza de forma estrecha su propio dashboard de trabajo enfocado ("Mi Semana"). No tienen posibilidad lógica de consultar el módulo completo de Rentabilidad, los costes financieros en nómina / hora de los compañeros, ni el estado financiero global total de la agencia.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ─── CUMPLIMIENTO CORPORATIVO (PAGOS Y DATOS) ─── */}
                <section className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto mb-32">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-white mb-4">Cumplimiento B2B y Soberanía de Datos</h2>
                        <p className="text-slate-400 max-w-2xl mx-auto">
                            Requisitos indispensables para operar con tranquilidad en entornos corporativos modernos.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-8 rounded-2xl bg-slate-900/30 border border-slate-800 hover:border-emerald-500/20 transition-all group flex items-start gap-5">
                            <div className="mt-1 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 group-hover:scale-105 transition-transform">
                                <CreditCard className="h-6 w-6 text-emerald-400" />
                            </div>
                            <div>
                                <h4 className="text-lg text-white font-bold mb-2">Cumplimiento PCI-DSS (Pagos Seguros)</h4>
                                <p className="text-sm text-slate-400 leading-relaxed">
                                    Taimbox <strong className="text-slate-200">no procesa, almacena ni transmite</strong> los datos de tu tarjeta de crédito. Delegamos el 100% del procesamiento transaccional a Stripe, proveedor auditado como Nivel 1 de PCI (el estándar más estricto de la industria financiera mundial).
                                </p>
                            </div>
                        </div>

                        <div className="p-8 rounded-2xl bg-slate-900/30 border border-slate-800 hover:border-indigo-500/20 transition-all group flex items-start gap-5">
                            <div className="mt-1 bg-indigo-500/10 p-3 rounded-xl border border-indigo-500/20 group-hover:scale-105 transition-transform">
                                <Download className="h-6 w-6 text-indigo-400" />
                            </div>
                            <div>
                                <h4 className="text-lg text-white font-bold mb-2">Portabilidad absoluta de tus datos</h4>
                                <p className="text-sm text-slate-400 leading-relaxed">
                                    Tus datos son tuyos. No practicamos el 'Vendor Lock-in'. Ofrecemos endpoints a través de nuestra API REST para que puedas exportar el histórico de tu agencia, tus métricas de rentabilidad y tus tablas de tiempos a CSV/JSON en el momento que lo necesites.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ─── FAQ DE SEGURIDAD ─── */}
                <section className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto mb-20 bg-slate-950">
                    <h3 className="text-2xl font-bold text-white mb-8 text-center">Preguntas Frecuentes sobre Seguridad IT e ISO</h3>

                    <div className="space-y-4">
                        <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-800 transition-colors hover:bg-slate-900/80">
                            <h4 className="text-white font-semibold mb-3 text-lg">¿Qué terceros (Subencargados) intervienen en Taimbox?</h4>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Para ofrecerte un servicio de grado Enterprise, nos apoyamos exclusivamente en líderes de la industria tecnológica: <strong>Amazon Web Services (AWS)</strong> (Hosting físico en Frankfurt), <strong>Supabase</strong> (Gestión de Base de Datos y Autenticación), <strong>Stripe</strong> (Procesamiento de pagos) y <strong>Google/Meta</strong> (Solo lectura mediante API oficial OAuth2). Tienes total visibilidad sobre nuestra cadena de suministro digital.
                            </p>
                        </div>
                        <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-800 transition-colors hover:bg-slate-900/80">
                            <h4 className="text-white font-semibold mb-3 text-lg">¿Dónde están hospedados físicamente los servidores?</h4>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                La infraestructura base operativa recae sobre Amazon Web Services (AWS) en conjunto con Supabase Managed Provider, concretamente en la región principal de <strong>Frankfurt (eu-central-1)</strong>, dentro del marco de la Unión Europea. Cumplimos sin excepciones con los mandatos de soberanía de datos y tratamiento del Reglamento General de Protección de Datos (RGPD / GDPR) europeo.
                            </p>
                        </div>
                        <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-800 transition-colors hover:bg-slate-900/80">
                            <h4 className="text-white font-semibold mb-3 text-lg">¿Qué ocurre con mis datos en caso de cancelación total?</h4>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Entendemos y defendemos en los marcos contractuales del Software tu Derecho al borrado permanente (Derecho al Olvido RGPD). Al solicitar la cancelación definitiva, se activan procesos atómicos en cascada (ON DELETE CASCADE) que purgan para siempre y de un plumazo todo el histórico de tu agencia: cuentas de clientes, integraciones, cronómetros, costes salariales y tokens Ads. Todas las copias de retención o Back-ups automatizados se descartan de forma técnica en un plazo máximo no superior a 30 días.
                            </p>
                        </div>
                        <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-800 transition-colors hover:bg-slate-900/80">
                            <h4 className="text-white font-semibold mb-3 text-lg">¿Cómo protegen el acceso al sistema los ingenieros de Taimbox?</h4>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Mantenemos una estricta separación física entre los entornos de Desarrollo (Staging) y Producción. Nuestro equipo de ingeniería trabaja exclusivamente con datos simulados. El acceso a la base de datos de Producción está fuertemente restringido, carece de interfaces públicas y cada intervención técnica o query de mantenimiento queda registrada en logs de auditoría interna. Si necesitas ayuda técnica, nuestro equipo solo accederá a tu instancia bajo tu petición expresa.
                            </p>
                        </div>
                    </div>
                </section>

                {/* ─── CTA FINAL ─── */}
                <section className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
                    <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-slate-900 to-emerald-950/20 p-8 sm:p-14 text-center shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                            <Lock className="w-64 h-64 text-emerald-500" />
                        </div>

                        <div className="relative z-10">
                            <h2 className="text-2xl md:text-4xl font-black text-white mb-6">
                                ¿Tu equipo legal necesita más detalles técnicos?
                            </h2>
                            <p className="text-slate-400 mb-10 max-w-2xl mx-auto text-base">
                                Entendemos la necesidad de someter nuestro producto a test de proveedores exigentes en las agencias. Estamos preparados para pasar los cuestionarios de cumplimiento (IT Compliance / ISO Checklists). Escríbenos directamente para firmar acuerdos o consulta nuestra API para auditar endpoints tú mismo.
                            </p>
                            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                                <Link to="/api-docs" className="w-full sm:w-auto">
                                    <Button className="w-full h-12 bg-white hover:bg-slate-200 text-slate-950 font-bold px-8 transition-colors">
                                        <FileText className="mr-2 h-4 w-4" />
                                        Auditar Arquitectura API
                                    </Button>
                                </Link>
                                <a href="mailto:security@taimbox.com" className="w-full sm:w-auto">
                                    <Button variant="outline" className="w-full h-12 bg-transparent border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 px-8 transition-colors">
                                        <Mail className="mr-2 h-4 w-4" />
                                        Contactar al equipo DPO
                                    </Button>
                                </a>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <LandingFooter />
        </div>
    );
}
