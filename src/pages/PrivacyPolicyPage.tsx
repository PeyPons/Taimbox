import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingFooter } from '@/components/landing/LandingFooter';
import {
    Shield,
    Database,
    Cookie,
    Globe,
    Clock,
    UserCheck,
    Mail,
    Server,
    CreditCard,
    FileText,
    Lock,
    KeyRound,
} from 'lucide-react';

function SectionCard({ icon: Icon, iconColor, title, children }: {
    icon: React.ElementType;
    iconColor: string;
    title: string;
    children: React.ReactNode;
}) {
    const colorMap: Record<string, string> = {
        indigo: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
        emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
        blue: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
        orange: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
        fuchsia: 'bg-fuchsia-500/10 border-fuchsia-500/20 text-fuchsia-400',
        teal: 'bg-teal-500/10 border-teal-500/20 text-teal-400',
        amber: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
        rose: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
        cyan: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
        violet: 'bg-violet-500/10 border-violet-500/20 text-violet-400',
    };
    return (
        <section className="p-6 sm:p-8 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-slate-700 transition-colors">
            <div className="flex items-center gap-4 mb-5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${colorMap[iconColor] || colorMap.indigo}`}>
                    <Icon className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-bold text-white">{title}</h2>
            </div>
            <div className="text-slate-400 text-sm leading-relaxed space-y-4">
                {children}
            </div>
        </section>
    );
}

export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen bg-slate-950 flex flex-col font-sans selection:bg-indigo-500/30 overflow-x-hidden">
            <Helmet>
                <title>Política de Privacidad | Taimbox</title>
                <meta name="description" content="Política de Privacidad de Taimbox. Conoce cómo recopilamos, tratamos y protegemos tus datos personales conforme al RGPD europeo." />
                <link rel="canonical" href="/privacidad" />
            </Helmet>

            <LandingHeader />

            <main className="flex-1 relative z-10 pt-32 pb-24">
                {/* Ambient glow */}
                <div className="absolute top-0 inset-x-0 h-[600px] bg-gradient-to-b from-indigo-900/10 via-slate-950 to-slate-950 pointer-events-none" />

                {/* ─── HERO ─── */}
                <section className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto mb-16 relative">
                    <div className="text-center max-w-3xl mx-auto">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-sm font-medium mb-8">
                            <Shield className="h-4 w-4" />
                            Protección de datos
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight leading-tight">
                            Política de Privacidad
                        </h1>
                        <p className="text-base text-slate-400 leading-relaxed max-w-2xl mx-auto">
                            En Taimbox nos tomamos muy en serio la privacidad de tus datos. Este documento describe qué información recopilamos, cómo la utilizamos y tus derechos como usuario conforme al Reglamento General de Protección de Datos (RGPD) de la Unión Europea.
                        </p>
                        <p className="text-xs text-slate-500 mt-4">
                            Última actualización: 2 de marzo de 2026
                        </p>
                    </div>
                </section>

                {/* ─── SECTIONS ─── */}
                <div className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-6 relative z-10">

                    <SectionCard icon={UserCheck} iconColor="indigo" title="1. Responsable del Tratamiento">
                        <p>
                            El responsable del tratamiento de tus datos personales es <strong className="text-slate-200">Taimbox</strong> (en adelante, «Taimbox», «nosotros» o «la Plataforma»).
                        </p>
                        <p>
                            Para cualquier consulta relacionada con la privacidad, puedes contactarnos en:{' '}
                            <a href="mailto:hola@taimbox.com" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2">hola@taimbox.com</a>.
                        </p>
                    </SectionCard>

                    <SectionCard icon={Database} iconColor="emerald" title="2. Datos que Recopilamos">
                        <p><strong className="text-slate-200">Datos de la Cuenta:</strong> Nombre, dirección de correo electrónico y contraseña (almacenada con hash seguro) necesarios para crear tu cuenta y acceder al servicio.</p>
                        <p><strong className="text-slate-200">Datos de la Agencia:</strong> Nombre de la agencia, empleados, proyectos, clientes, asignaciones, horas y configuración operativa que introduces en la plataforma para gestionar tu flujo de trabajo.</p>
                        <p><strong className="text-slate-200">Datos de Pago:</strong> No almacenamos datos de tarjeta de crédito. Toda la información de pago es procesada directamente por <strong className="text-slate-200">Stripe</strong> (PCI-DSS Level 1). Solo almacenamos el identificador del cliente de Stripe y el estado de la suscripción.</p>
                        <p><strong className="text-slate-200">Datos de Integraciones:</strong> Si conectas Google Ads o Meta Ads, almacenamos tokens OAuth2 de solo lectura (cifrados en reposo) para sincronizar métricas de campañas como impresiones, clics, coste y conversiones. Nunca almacenamos tus contraseñas de estas plataformas. Para más información sobre los datos de Google específicamente, consulta la sección 3.</p>
                        <p><strong className="text-slate-200">Datos de Uso:</strong> Registros de acceso, navegación dentro de la aplicación y cookies de análisis (sujetas a tu consentimiento). Ver sección de Cookies.</p>
                    </SectionCard>

                    <SectionCard icon={KeyRound} iconColor="emerald" title="3. Datos de Google API Services (Uso Limitado)">
                        <p>
                            Taimbox utiliza las API de Google Ads para proporcionar sus funcionalidades de integración PPC. Esta sección detalla de forma específica cómo tratamos la información recibida a través de estas API, en cumplimiento de la{' '}
                            <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2">
                                Política de datos del usuario de los servicios API de Google
                            </a>
                            , incluidos los requisitos de uso limitado (<em>Limited Use</em>).
                        </p>

                        <p><strong className="text-slate-200">3.1 Datos de Google que accedemos y almacenamos:</strong></p>
                        <ul className="space-y-2 ml-1">
                            <li className="flex items-start gap-2">
                                <span className="text-emerald-400 mt-1.5 shrink-0">•</span>
                                <span>Estructura de la cuenta publicitaria: campañas, grupos de anuncios y anuncios (nombres, estados e identificadores).</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-emerald-400 mt-1.5 shrink-0">•</span>
                                <span>Métricas de rendimiento: impresiones, clics, coste, conversiones y métricas derivadas (CTR, CPC, CPA) agregadas por campaña y periodo.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-emerald-400 mt-1.5 shrink-0">•</span>
                                <span>Tokens OAuth2 de actualización (<em>refresh tokens</em>) necesarios para mantener la conexión, almacenados con cifrado en reposo.</span>
                            </li>
                        </ul>

                        <p><strong className="text-slate-200">3.2 Cómo utilizamos los datos de Google:</strong> Estos datos se utilizan <strong className="text-slate-200">exclusivamente</strong> para mostrar informes de rendimiento de campañas publicitarias dentro del panel de Taimbox, permitiéndote monitorizar el gasto y retorno de inversión (ROI) de tus clientes. No utilizamos estos datos para ningún otro fin más allá de proporcionar y mejorar las funcionalidades de la aplicación directamente visibles para el usuario.</p>

                        <p><strong className="text-slate-200">3.3 No vendemos datos de Google:</strong> En ningún caso vendemos, cedemos ni facilitamos a terceros datos obtenidos a través de las API de Google, ya sea de forma gratuita o por contraprestación económica.</p>

                        <p><strong className="text-slate-200">3.4 Compartición con terceros:</strong> No compartimos, transferimos ni divulgamos datos de Google a terceros, salvo cuando sea estrictamente necesario para la prestación del servicio (por ejemplo, el almacenamiento cifrado en nuestra infraestructura de Supabase/AWS dentro de la UE) o cuando así lo requiera la legislación aplicable mediante orden judicial o gubernamental.</p>

                        <p><strong className="text-slate-200">3.5 Usos prohibidos:</strong> Los datos recibidos de las API de Google <strong className="text-slate-200">nunca</strong> se utilizarán para:</p>
                        <ul className="space-y-2 ml-1">
                            <li className="flex items-start gap-2">
                                <span className="text-emerald-400 mt-1.5 shrink-0">•</span>
                                <span>Publicidad dirigida, segmentada, personalizada o retargeting.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-emerald-400 mt-1.5 shrink-0">•</span>
                                <span>Venta a intermediarios de datos (<em>data brokers</em>) o revendedores de información.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-emerald-400 mt-1.5 shrink-0">•</span>
                                <span>Determinación de solvencia crediticia o fines de préstamo.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-emerald-400 mt-1.5 shrink-0">•</span>
                                <span>Entrenamiento de modelos de inteligencia artificial o aprendizaje automático.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-emerald-400 mt-1.5 shrink-0">•</span>
                                <span>Creación de bases de datos independientes o perfiles de usuario.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-emerald-400 mt-1.5 shrink-0">•</span>
                                <span>Cualquier otro fin no relacionado directamente con las funcionalidades visibles para el usuario dentro de Taimbox.</span>
                            </li>
                        </ul>

                        <p><strong className="text-slate-200">3.6 Protección de los datos de Google:</strong> Los tokens OAuth2 se almacenan con cifrado en reposo en nuestra base de datos. Todas las comunicaciones con las API de Google se realizan a través de HTTPS/TLS 1.2+. El acceso a estos datos está restringido mediante políticas de seguridad a nivel de fila (<em>Row Level Security</em>), garantizando que solo la agencia propietaria puede acceder a su información.</p>

                        <p><strong className="text-slate-200">3.7 Retención y eliminación:</strong> Los datos de Google Ads se conservan mientras la integración esté activa. La Agencia puede desconectar su cuenta de Google Ads en cualquier momento desde los ajustes de la plataforma, lo que provocará la eliminación inmediata de los tokens de acceso y los datos sincronizados. Al cancelar la cuenta de Taimbox, todos los datos de Google se eliminan en cascada como parte del proceso de supresión descrito en la sección 8.</p>

                        <p>
                            <strong className="text-slate-200">3.8 Revocación del acceso:</strong> Además de desconectar la integración desde Taimbox, puedes revocar el acceso de Taimbox a tus datos de Google en cualquier momento visitando la página de{' '}
                            <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2">
                                permisos de tu cuenta de Google
                            </a>.
                        </p>
                    </SectionCard>

                    <SectionCard icon={FileText} iconColor="blue" title="4. Finalidad y Base Legal del Tratamiento">
                        <p>Tratamos tus datos con las siguientes finalidades y bases legales:</p>
                        <ul className="space-y-2 ml-1">
                            <li className="flex items-start gap-2">
                                <span className="text-blue-400 mt-1.5 shrink-0">•</span>
                                <span><strong className="text-slate-200">Prestación del servicio</strong> (ejecución del contrato): Gestionar tu cuenta, procesar pagos, proporcionar las funcionalidades de la plataforma y atender tus solicitudes de soporte.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-400 mt-1.5 shrink-0">•</span>
                                <span><strong className="text-slate-200">Seguridad y mantenimiento</strong> (interés legítimo): Proteger la plataforma frente a accesos no autorizados, detectar fraudes y mantener la estabilidad del servicio.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-400 mt-1.5 shrink-0">•</span>
                                <span><strong className="text-slate-200">Mejora del producto</strong> (interés legítimo): Análisis agregado y anonimizado del uso de la plataforma para mejorar la experiencia de usuario.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-400 mt-1.5 shrink-0">•</span>
                                <span><strong className="text-slate-200">Cookies analíticas y de marketing</strong> (consentimiento): Solo se activan si aceptas cookies no esenciales en el banner de consentimiento.</span>
                            </li>
                        </ul>
                    </SectionCard>

                    <SectionCard icon={Cookie} iconColor="orange" title="5. Cookies">
                        <p>
                            Utilizamos cookies para el funcionamiento del servicio y, con tu consentimiento, para análisis y marketing. Puedes gestionar tus preferencias en cualquier momento:
                        </p>
                        <ul className="space-y-2 ml-1">
                            <li className="flex items-start gap-2">
                                <span className="text-orange-400 mt-1.5 shrink-0">•</span>
                                <span><strong className="text-slate-200">Cookies necesarias:</strong> Autenticación, preferencias de sesión y seguridad. No se pueden desactivar.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-orange-400 mt-1.5 shrink-0">•</span>
                                <span><strong className="text-slate-200">Cookies analíticas:</strong> Google Analytics / GTM para conocer el uso del sitio web. Requieren consentimiento.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-orange-400 mt-1.5 shrink-0">•</span>
                                <span><strong className="text-slate-200">Cookies de marketing:</strong> Seguimiento para medir la efectividad de campañas. Requieren consentimiento.</span>
                            </li>
                        </ul>
                        <p>
                            <button
                                type="button"
                                onClick={() => window.dispatchEvent(new CustomEvent('open-cookie-preferences'))}
                                className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 cursor-pointer bg-transparent border-none p-0 text-sm"
                            >
                                Abrir preferencias de cookies
                            </button>
                        </p>
                    </SectionCard>

                    <SectionCard icon={Server} iconColor="teal" title="6. Subencargados del Tratamiento">
                        <p>
                            Para ofrecer un servicio seguro y escalable, nos apoyamos en los siguientes proveedores (subencargados):
                        </p>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm border-collapse mt-2">
                                <thead>
                                    <tr className="text-left border-b border-slate-700">
                                        <th className="py-2 pr-4 text-slate-200 font-semibold">Proveedor</th>
                                        <th className="py-2 pr-4 text-slate-200 font-semibold">Función</th>
                                        <th className="py-2 text-slate-200 font-semibold">Ubicación</th>
                                    </tr>
                                </thead>
                                <tbody className="text-slate-400">
                                    <tr className="border-b border-slate-800/50">
                                        <td className="py-2 pr-4 font-medium text-slate-300">Amazon Web Services (AWS)</td>
                                        <td className="py-2 pr-4">Hosting e infraestructura</td>
                                        <td className="py-2">Frankfurt, UE</td>
                                    </tr>
                                    <tr className="border-b border-slate-800/50">
                                        <td className="py-2 pr-4 font-medium text-slate-300">Supabase</td>
                                        <td className="py-2 pr-4">Base de datos y autenticación</td>
                                        <td className="py-2">UE (AWS Frankfurt)</td>
                                    </tr>
                                    <tr className="border-b border-slate-800/50">
                                        <td className="py-2 pr-4 font-medium text-slate-300">Stripe</td>
                                        <td className="py-2 pr-4">Procesamiento de pagos</td>
                                        <td className="py-2">UE / EE.UU. (PCI-DSS L1)</td>
                                    </tr>
                                    <tr className="border-b border-slate-800/50">
                                        <td className="py-2 pr-4 font-medium text-slate-300">Google (API Ads)</td>
                                        <td className="py-2 pr-4">Sincronización de campañas (solo lectura)</td>
                                        <td className="py-2">Global (Cláusulas Contractuales Tipo)</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 pr-4 font-medium text-slate-300">Meta (API Ads)</td>
                                        <td className="py-2 pr-4">Sincronización de campañas (solo lectura)</td>
                                        <td className="py-2">Global (Cláusulas Contractuales Tipo)</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </SectionCard>

                    <SectionCard icon={Globe} iconColor="cyan" title="7. Transferencias Internacionales de Datos">
                        <p>
                            Alojamos la infraestructura principal de Taimbox en centros de datos de <strong className="text-slate-200">Amazon Web Services en Frankfurt (UE)</strong>, garantizando que tus datos permanecen dentro de la Unión Europea.
                        </p>
                        <p>
                            En los casos donde intervienen proveedores con presencia fuera del Espacio Económico Europeo (Stripe, Google, Meta), las transferencias se amparan en <strong className="text-slate-200">Cláusulas Contractuales Tipo (SCC)</strong> aprobadas por la Comisión Europea, decisiones de adecuación o mecanismos equivalentes que garantizan un nivel adecuado de protección.
                        </p>
                    </SectionCard>

                    <SectionCard icon={Clock} iconColor="amber" title="8. Plazos de Conservación">
                        <p>
                            Conservamos tus datos personales mientras mantengas una cuenta activa en Taimbox y sean necesarios para prestarte el servicio.
                        </p>
                        <p>
                            Al solicitar la cancelación definitiva de tu cuenta, ejecutamos procesos de eliminación en cascada que purgan de forma permanente todo el histórico de tu agencia (clientes, proyectos, asignaciones, integraciones, cronómetros, tokens). Las copias de seguridad automatizadas se eliminan en un plazo máximo de <strong className="text-slate-200">30 días naturales</strong> desde la cancelación.
                        </p>
                        <p>
                            Podemos conservar datos anonimizados o agregados con fines estadísticos de forma indefinida, siempre que no permitan identificar a ningún usuario.
                        </p>
                    </SectionCard>

                    <SectionCard icon={Lock} iconColor="violet" title="9. Tus Derechos">
                        <p>
                            Conforme al RGPD, tienes los siguientes derechos sobre tus datos personales:
                        </p>
                        <ul className="space-y-2 ml-1">
                            {[
                                { label: 'Acceso', desc: 'Solicitar una copia de los datos personales que tratamos sobre ti.' },
                                { label: 'Rectificación', desc: 'Corregir datos inexactos o incompletos.' },
                                { label: 'Supresión', desc: 'Solicitar la eliminación de tus datos (derecho al olvido).' },
                                { label: 'Portabilidad', desc: 'Recibir tus datos en un formato estructurado y legible por máquina (JSON/CSV vía nuestra API).' },
                                { label: 'Oposición', desc: 'Oponerte al tratamiento basado en interés legítimo.' },
                                { label: 'Limitación', desc: 'Solicitar la restricción del tratamiento en determinadas circunstancias.' },
                            ].map((right) => (
                                <li key={right.label} className="flex items-start gap-2">
                                    <span className="text-violet-400 mt-1.5 shrink-0">•</span>
                                    <span><strong className="text-slate-200">{right.label}:</strong> {right.desc}</span>
                                </li>
                            ))}
                        </ul>
                        <p>
                            Para ejercer cualquiera de estos derechos, envía un correo a{' '}
                            <a href="mailto:hola@taimbox.com" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2">hola@taimbox.com</a> indicando tu nombre, correo de la cuenta y el derecho que deseas ejercer.
                        </p>
                    </SectionCard>

                    <SectionCard icon={Mail} iconColor="rose" title="10. Contacto y Reclamaciones">
                        <p>
                            Si tienes dudas sobre el tratamiento de tus datos o deseas presentar una reclamación, puedes contactarnos en{' '}
                            <a href="mailto:hola@taimbox.com" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2">hola@taimbox.com</a>.
                        </p>
                        <p>
                            Asimismo, tienes derecho a presentar una reclamación ante la autoridad de protección de datos competente. En España, la autoridad es la{' '}
                            <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2">
                                Agencia Española de Protección de Datos (AEPD)
                            </a>.
                        </p>
                    </SectionCard>

                    <SectionCard icon={CreditCard} iconColor="fuchsia" title="11. Modificaciones de esta Política">
                        <p>
                            Nos reservamos el derecho de actualizar esta Política de Privacidad para reflejar cambios en nuestras prácticas o en la legislación aplicable. En caso de cambios sustanciales, te notificaremos a través de la plataforma o por correo electrónico.
                        </p>
                        <p>
                            Te recomendamos revisar periódicamente esta página. La fecha de última actualización figura al inicio de este documento.
                        </p>
                    </SectionCard>

                    {/* ─── Otros enlaces ─── */}
                    <div className="pt-8 flex flex-wrap gap-4 justify-center text-sm">
                        <Link to="/condiciones" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2">
                            Condiciones del Servicio
                        </Link>
                        <Link to="/seguridad" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2">
                            Seguridad
                        </Link>
                        <button
                            type="button"
                            onClick={() => window.dispatchEvent(new CustomEvent('open-cookie-preferences'))}
                            className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 cursor-pointer bg-transparent border-none p-0"
                        >
                            Preferencias de Cookies
                        </button>
                    </div>
                </div>
            </main>

            <LandingFooter />
        </div>
    );
}
