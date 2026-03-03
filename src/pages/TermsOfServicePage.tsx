import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingFooter } from '@/components/landing/LandingFooter';
import {
    Scale,
    Users,
    Settings2,
    CreditCard,
    ShieldAlert,
    ArchiveX,
    RefreshCcw,
    BookOpen,
    LayoutTemplate,
    Gavel,
    ShieldCheck,
    Building2,
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

export default function TermsOfServicePage() {
    return (
        <div className="min-h-screen bg-slate-950 flex flex-col font-sans selection:bg-indigo-500/30 overflow-x-hidden">
            <Helmet>
                <title>Condiciones del Servicio | Taimbox</title>
                <meta name="description" content="Términos y Condiciones del Servicio de Taimbox. Reglas de uso, pagos, propiedad intelectual y responsabilidades aplicables a tu uso de la plataforma." />
                <link rel="canonical" href="/condiciones" />
            </Helmet>

            <LandingHeader />

            <main className="flex-1 relative z-10 pt-32 pb-24">
                {/* Ambient glow */}
                <div className="absolute top-0 inset-x-0 h-[600px] bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 pointer-events-none" />

                {/* ─── HERO ─── */}
                <section className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto mb-16 relative">
                    <div className="text-center max-w-3xl mx-auto">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 text-sm font-medium mb-8">
                            <Scale className="h-4 w-4" />
                            Marco Legal
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight leading-tight">
                            Condiciones del Servicio
                        </h1>
                        <p className="text-base text-slate-400 leading-relaxed max-w-2xl mx-auto">
                            Este documento establece las condiciones vinculantes que rigen el uso de Taimbox por parte de agencias y profesionales. Al crear una cuenta y acceder a nuestra plataforma, aceptas estos términos en su totalidad.
                        </p>
                        <p className="text-xs text-slate-500 mt-4">
                            Última actualización: 2 de marzo de 2026
                        </p>
                    </div>
                </section>

                {/* ─── SECTIONS ─── */}
                <div className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-6 relative z-10">

                    <SectionCard icon={BookOpen} iconColor="indigo" title="1. Definiciones">
                        <p>A los efectos de estas Condiciones del Servicio:</p>
                        <ul className="space-y-2 ml-1">
                            <li className="flex items-start gap-2">
                                <span className="text-indigo-400 mt-1.5 shrink-0">•</span>
                                <span><strong className="text-slate-200">"Taimbox" o el "Servicio":</strong> La plataforma SaaS de gestión operativa y financiera para agencias accesible a través de app.taimbox.com.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-indigo-400 mt-1.5 shrink-0">•</span>
                                <span><strong className="text-slate-200">"Agencia" o "Cliente":</strong> La entidad legal o profesional autónomo que contrata el Servicio.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-indigo-400 mt-1.5 shrink-0">•</span>
                                <span><strong className="text-slate-200">"Usuario":</strong> Cualquier empleado, manager o administrador con acceso a la cuenta de la Agencia.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-indigo-400 mt-1.5 shrink-0">•</span>
                                <span><strong className="text-slate-200">"Datos de la Agencia":</strong> La información operativa introducida o generada mediante el Servicio por parte de los Usuarios.</span>
                            </li>
                        </ul>
                    </SectionCard>

                    <SectionCard icon={Users} iconColor="emerald" title="2. Aceptación y Creación de Cuenta">
                        <p>
                            Para utilizar el Servicio, el representante de la Agencia debe crear una cuenta proporcionando información veraz, precisa y actualizada. La persona que registra la cuenta declara poseer <strong>capacidad de representación legal</strong> para vincular a la Agencia a estos términos.
                        </p>
                        <p>
                            Al completar el registro, la Agencia acepta estas Condiciones del Servicio y nuestra Política de Privacidad. La Agencia es responsable de mantener la confidencialidad de las credenciales de acceso y de todas las acciones que ocurran bajo las cuentas de sus Usuarios.
                        </p>
                    </SectionCard>

                    <SectionCard icon={CreditCard} iconColor="blue" title="3. Suscripciones y Pagos">
                        <p><strong className="text-slate-200">Planes y Tarifas:</strong> El Servicio se ofrece mediante planes de suscripción (ej. Starter, Pro, Business). Las funcionalidades y límites (ej. número máximo de empleados) de cada plan se detallan en la página de precios.</p>
                        <p><strong className="text-slate-200">Proceso de Pago:</strong> Los pagos se procesan a través de Stripe y se renuevan automáticamente al final de cada ciclo de facturación (mensual o anual) salvo cancelación previa. Si un pago falla, Taimbox suspenderá temporalmente el acceso hasta que se actualice el método de pago.</p>
                        <p><strong className="text-slate-200">Período de Prueba (Trial):</strong> Los nuevos registros pueden incluir un período de prueba gratuito de 14 días. Solo se permite un período de prueba por Agencia. Al finalizar la prueba, si no se suscribe un plan de pago, la cuenta puede degradarse automáticamente a la versión gratuita (Plan Starter) con menores prestaciones.</p>
                        <p><strong className="text-slate-200">Modificación del Plan:</strong> La Agencia puede ampliar (upgrade) o reducir (downgrade) su plan en cualquier momento desde los ajustes de la plataforma. La mejora se prorrateará y facturará inmediatamente, mientras que la reducción se aplicará en el siguiente ciclo.</p>
                    </SectionCard>

                    <SectionCard icon={Settings2} iconColor="orange" title="4. Uso Aceptable del Servicio">
                        <p>
                            La Agencia y sus Usuarios se comprometen a utilizar Taimbox de forma lícita y de acuerdo con estos términos, comprometiéndose específicamente a:
                        </p>
                        <ul className="space-y-2 ml-1">
                            <li className="flex items-start gap-2">
                                <span className="text-orange-400 mt-1.5 shrink-0">•</span>
                                <span>No utilizar el Servicio para procesar ni almacenar datos ilícitos o de naturaleza abusiva.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-orange-400 mt-1.5 shrink-0">•</span>
                                <span>No comprometer la seguridad del Servicio mediante técnicas como hacking, introducción de malware, inyección SQL o similares.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-orange-400 mt-1.5 shrink-0">•</span>
                                <span>No someter la plataforma a cargas de tráfico abusivas ni utilizar herramientas automatizadas de scraping (salvo autorización explícita a través de nuestra API documentada).</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-orange-400 mt-1.5 shrink-0">•</span>
                                <span>No aplicar ingeniería inversa al código de la plataforma.</span>
                            </li>
                        </ul>
                        <p>
                            Taimbox se reserva el derecho de suspender o cancelar la cuenta de cualquier Agencia que incumpla estas normas de uso aceptable.
                        </p>
                    </SectionCard>

                    <SectionCard icon={Building2} iconColor="fuchsia" title="5. Acceso a Plataformas Externas (Ads)">
                        <p>
                            Para el módulo de control de rentabilidad e integraciones PPC (ej. Monitor PPC), Taimbox solicitará permisos de lectura a tus cuentas de Google Ads o Meta Ads.
                        </p>
                        <p>
                            <strong>Rol de solo lectura:</strong> Taimbox utiliza tokens OAuth2 restrictivos y limitados ('readonly scopes') y no puede ni intentará modificar, pausar ni alterar las campañas de la Agencia. En ningún caso Taimbox asumirá responsabilidad por el rendimiento publicitario, gasto o funcionamiento interno de estas plataformas de terceros.
                        </p>
                        <p>
                            <strong className="text-slate-200">Uso de APIs de Google (Limited Use):</strong> El uso y la transferencia por parte de Taimbox a cualquier otra aplicación de la información recibida de las API de Google se ajustarán a la{' '}
                            <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2">
                                Política de datos del usuario de los servicios API de Google
                            </a>
                            , incluidos los requisitos de Uso Limitado (Limited Use).
                        </p>
                    </SectionCard>

                    <SectionCard icon={LayoutTemplate} iconColor="teal" title="6. Propiedad Intelectual">
                        <p><strong className="text-slate-200">Software y Marca:</strong> Todo el código fuente, diseño, logotipos, interfaces e infraestructura relativas a Taimbox son propiedad exclusiva nuestra y están protegidos por leyes de propiedad intelectual.</p>
                        <p><strong className="text-slate-200">Datos de la Agencia:</strong> La Agencia es la única propietaria y responsable de todos los "Datos de la Agencia". Taimbox no adquiere ningún derecho sobre ellos, más allá del permiso necesario para almacenarlos y procesarlos con el fin de prestar el Servicio de acuerdo con nuestra Política de Privacidad.</p>
                    </SectionCard>

                    <SectionCard icon={ShieldCheck} iconColor="cyan" title="7. Privacidad y Protección de Datos">
                        <p>
                            Nuestra base de datos aplica separación nativa (Row Level Security) para asegurar que los datos de una Agencia sean técnica y criptográficamente invisibles para cualquier otra.
                        </p>
                        <p>
                            El tratamiento de datos personales vinculado a la prestación del Servicio se realiza conforme a nuestra <Link to="/privacidad" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2">Política de Privacidad</Link>. Taimbox actúa como <strong className="text-slate-200">Encargado del Tratamiento</strong> respecto a los datos alojados por la Agencia, y la propia Agencia actúa como Responsable del Tratamiento frente a sus clientes y empleados.
                        </p>
                    </SectionCard>

                    <SectionCard icon={RefreshCcw} iconColor="rose" title="8. Disponibilidad y Mantenimiento (SLA)">
                        <p>
                            Hacemos el mayor esfuerzo para que el Servicio esté disponible ininterrumpidamente, estableciendo el objetivo de un 99.9% de uptime (tiempo de actividad).
                        </p>
                        <p>
                            No obstante, nos reservamos el derecho de interrumpir el servicio temporalmente por tareas de mantenimiento programado (idealmente fuera de horario laboral de Europa) o de emergencia. No garantizamos que el uso del Servicio esté libre de interrupciones, retrasos o imperfecciones bajo cualquier circunstancia y red.
                        </p>
                    </SectionCard>

                    <SectionCard icon={ShieldAlert} iconColor="amber" title="9. Limitación de Responsabilidad">
                        <p>
                            Taimbox se proporciona "tal cual" (as is) y "según disponibilidad". Excluimos expresamente, en la medida en que la ley aplicable lo permita, toda garantía, ya sea expresa o implícita.
                        </p>
                        <p>
                            Bajo ninguna circunstancia Taimbox será responsable ante la Agencia o la empresa de la Agencia por: lucros cesantes, pérdida de negocios, alteración o corrupción de datos financieros reportados, ni por daños indirectos, incidentales o derivados en el marco del uso del Servicio.
                        </p>
                        <p>
                            En cualquier caso, de probarse responsabilidad por parte de Taimbox, nuestra responsabilidad total acumulada no superará nunca <strong>la suma de las cuotas abonadas por la Agencia durante los doce (12) meses anteriores</strong> al evento que motive la reclamación.
                        </p>
                    </SectionCard>

                    <SectionCard icon={ArchiveX} iconColor="violet" title="10. Cancelación y Supresión de Datos">
                        <p><strong className="text-slate-200">Por parte de la Agencia:</strong> La Agencia puede cancelar su suscripción en cualquier momento desde la plataforma mediante el Customer Portal de Stripe. Al cancelar, el acceso a funciones premium continuará hasta el final del periodo de facturación actual.</p>
                        <p><strong className="text-slate-200">Por parte de Taimbox:</strong> Nos reservamos el derecho de suspender temporal o permanentemente el acceso por impago reiterado de cuotas (superior a 14 días), violación sustancial de estos Términos o por requerimiento de orden gubernamental.</p>
                        <p><strong className="text-slate-200">Supresión:</strong> Al confirmar la cancelación definitiva y cierre de la cuenta (no solo de la suscripción de pago), Taimbox aplicará borrados en cascada para purgar todo el histórico operativo de la Agencia. Se podrá disponer de un margen de hasta 30 días mientras los backups de seguridad terminan su rotación estándar para desaparecer del todo.</p>
                    </SectionCard>

                    <SectionCard icon={Gavel} iconColor="indigo" title="11. Modificaciones y Ley Aplicable">
                        <p><strong className="text-slate-200">Cambios:</strong> Podemos modificar estos Términos del Servicio. Cualquier cambio material será notificado mediante anuncio en la plataforma o correo electrónico, concediendo un derecho de cancelación sin penalización si la Agencia no estuviera de acuerdo.</p>
                        <p><strong className="text-slate-200">Ley Aplicable y Jurisdicción:</strong> Estas Condiciones del Servicio están regidas bajo la legislación de España. Cualquier disputa quedará sometida a la jurisdicción exclusiva de los tribunales de la ciudad de residencia comercial de nuestra empresa matriz u oficinas principales autorizadas.</p>
                    </SectionCard>

                    {/* ─── Links ─── */}
                    <div className="pt-8 flex flex-wrap gap-4 justify-center text-sm">
                        <Link to="/privacidad" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2">
                            Política de Privacidad
                        </Link>
                        <Link to="/seguridad" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2">
                            Seguridad de Datos
                        </Link>
                        <a href="mailto:hola@taimbox.com" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2">
                            Contactar Soporte Legal
                        </a>
                    </div>
                </div>
            </main>

            <LandingFooter />
        </div>
    );
}
