import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { Button } from '@/components/ui/button';
import {
  Check,
  Zap,
  Building2,
  Sparkles,
  ArrowRight,
  Shield,
  RefreshCw,
  CreditCard,
  LayoutGrid,
  Users,
  PieChart,
  Activity,
  Lock,
  Rocket
} from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: '0',
    originalPrice: undefined as string | undefined,
    period: 'siempre',
    description: 'El estándar operativo para organizar el equipo.',
    features: [
      'Planificador visual ilimitado',
      'Sistema de Deadlines',
      'Cronómetro de tiempos integrado',
      'Hasta 5 personas',
      'Histórico: mes actual y anterior',
    ],
    cta: 'Empezar gratis',
    href: '/login?tab=register',
    recommended: false,
    icon: Zap,
    iconBg: 'bg-indigo-500/20 border border-indigo-500/30',
    iconColor: 'text-indigo-400',
    cardStyle: 'bg-slate-900/80 border-white/10 hover:border-indigo-500/30 transition-all duration-300',
  },
  {
    id: 'pro',
    name: 'Pro',
    originalPrice: '99',
    price: '49',
    period: 'mes',
    description: 'La agencia eficiente.',
    features: [
      'Todo lo de Starter, más:',
      'Hasta 20 personas',
      'Histórico ilimitado',
      'Módulo Weekly y pronósticos',
      'Matriz de Fiabilidad (Performance)',
      'Rentabilidad por proyecto (EHR)',
    ],
    cta: 'Elegir Pro',
    href: '/login?tab=register',
    recommended: false,
    icon: Sparkles,
    iconBg: 'bg-purple-500/20 border border-purple-500/30',
    iconColor: 'text-purple-400',
    cardStyle: 'bg-slate-900/80 border-white/10 hover:border-purple-500/30 transition-all duration-300',
  },
  {
    id: 'business',
    name: 'Business',
    originalPrice: '249',
    price: '149',
    period: 'mes',
    description: 'Automatización y control para agencias Performance.',
    features: [
      'Todo lo de Pro, más:',
      'Hasta 50 personas',
      'Monitor de presupuestos clientes (PPC)',
      'Prevención de sobrecostes (Google/Meta Ads)',
      'Radar de Hemorragias (P&L en vivo)',
      'API REST y webhooks',
      'OKRs y alineación estratégica',
    ],
    cta: 'Probar Business 14 días',
    href: '/login?tab=register',
    recommended: true,
    icon: Building2,
    iconBg: 'bg-amber-500/20 border border-amber-500/30',
    iconColor: 'text-amber-400',
    cardStyle: 'bg-gradient-to-b from-indigo-500/10 to-purple-500/10 border-indigo-500/40 relative transform lg:-translate-y-2 shadow-2xl shadow-purple-500/20 transition-all duration-300',
  },
];

const UNIVERSAL_FEATURES = [
  { icon: LayoutGrid, title: 'Multi-proyecto', desc: 'Gestiona infinitos clientes y proyectos en paralelo sin restricciones.' },
  { icon: Users, title: 'Colaboración en vivo', desc: 'Sincronización instantánea de estados y asignaciones para tu equipo.' },
  { icon: PieChart, title: 'Reportes de tiempos', desc: 'Cronómetro integrado y partes de horas manuales o automatizados.' },
  { icon: Activity, title: 'Alertas de sobrecarga', desc: 'Detección automática de empleados superando su capacidad semanal.' },
  { icon: Lock, title: 'Seguridad y privacidad', desc: 'Infraestructura cloud robusta y aislamiento de datos por agencia.' },
  { icon: Shield, title: 'Permisos granulares', desc: 'Cada usuario (Empleado o Manager) ve estrictamente lo que necesita ver.' }
];

const TRUST_ITEMS = [
  { icon: RefreshCw, text: '14 días de prueba en Business', sub: 'Gratis hasta que decidas' },
  { icon: Shield, text: 'Sin permanencia limitante', sub: 'Cancela o cambia de plan cuando quieras' },
  { icon: CreditCard, text: 'Facturación mensual clara', sub: 'Pago 100% seguro a través de Stripe' },
];

const FAQ_ITEMS = [
  { q: '¿Puedo cambiar de plan en cualquier momento?', a: 'Sí. Puedes subir o bajar de plan en cualquier momento desde Configuración. Los cambios se aplican de forma prorrateada.' },
  { q: '¿Qué pasa si supero el límite de empleados de mi plan?', a: 'Recibirás un aviso y tu agencia entrará en modo solo lectura hasta que actualices tu plan o ajustes el número de empleados activos. Nunca borraremos tus datos.' },
  { q: '¿Qué pasa si somos más de 50 empleados?', a: 'Tenemos planes Enterprise sin límite de usuarios y con soporte dedicado. Contáctanos por el chat de la app o a hola@taimbox.com.' },
  { q: '¿Los precios de early adopter se mantendrán?', a: 'Sí. Si contratas ahora, tu tarifa queda congelada de por vida aunque los precios suban a 99€/249€ en el futuro.' },
  { q: '¿La prueba de Business requiere tarjeta de crédito?', a: 'Sí, Stripe te pedirá un método de pago al iniciar la suscripción, pero no se cobrará absolutamente nada durante los 14 días de prueba. Al finalizar se cobrarán 149€/mes. Si cancelas antes, no habrá cargo.' },
  { q: '¿Hay descuentos por pago anual?', a: 'Por el momento ofrecemos facturación mensual flexible. Si sois un equipo muy grande (>50 personas) o requerís facturación especial, podéis contactar con Soporte en la app o en hola@taimbox.com.' },
];

export default function PreciosPage() {
  return (
    <>
      <Helmet>
        <title>Precios y planes | Taimbox</title>
        <meta name="description" content="Planes Starter, Pro y Business con Taimbox. Gestión operativa, financiera y de tiempos para agencias de todos los tamaños." />
        <link rel="canonical" href="/precios" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-indigo-900 relative overflow-hidden">
        {/* Ambient Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-50" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl opacity-50" />
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

          {/* Hero Section */}
          <section className="mb-16 sm:mb-20 text-center">
            <div className="mb-6">
              <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider text-indigo-300 bg-indigo-500/20 border border-indigo-400/30">
                Para agencias y equipos creativos
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-[1.1] tracking-tight">
              Precios diseñados para escalar con tu{' '}
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                rentabilidad
              </span>
            </h1>

            {/* Early adopter banner — corto, arriba */}
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-200 text-xs font-semibold uppercase tracking-wider">
              <Rocket className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              Precios Early Adopter — 50% de descuento de por vida
            </div>

            <p className="text-indigo-100/90 text-base sm:text-lg lg:text-xl leading-relaxed max-w-3xl mx-auto mb-8">
              Empieza gratis. Sube de plan cuando requieras más inteligencia financiera, reportes avanzados o integraciones complejas para tu agencia.
            </p>
            <div className="flex flex-wrap justify-center gap-3 text-sm">
              {['Plan gratuito disponible', 'Prueba de 14 días (Business)', 'Sin permanencia'].map((f, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-indigo-200/90 text-xs font-medium">
                  <Check className="h-3 w-3 text-emerald-400" />
                  {f}
                </span>
              ))}
            </div>
          </section>

          {/* Pricing Cards */}
          <section className="mb-16 sm:mb-24">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              {PLANS.map((plan) => {
                const Icon = plan.icon;
                return (
                  <div
                    key={plan.id}
                    className={`rounded-2xl border p-5 sm:p-8 backdrop-blur-md flex flex-col ${plan.cardStyle}`}
                  >
                    {plan.recommended && (
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                        <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white bg-gradient-to-r from-indigo-500 to-purple-500 shadow-lg shadow-purple-500/30">
                          Recomendado
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-3 mb-4">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${plan.iconBg}`}>
                        <Icon className={`h-5 w-5 ${plan.iconColor}`} />
                      </div>
                      <span className="text-white font-bold text-lg">{plan.name}</span>
                    </div>

                    <p className="text-indigo-200/80 text-sm mb-6 min-h-[40px]">{plan.description}</p>

                    <div className="flex flex-col mb-6 pb-6 border-b border-white/10">
                      <div className="flex items-baseline gap-2">
                        {plan.originalPrice && (
                          <span className="text-sm font-medium text-indigo-300/40 line-through">
                            {plan.originalPrice} €
                          </span>
                        )}
                        <span className="text-4xl sm:text-5xl font-black text-white">{plan.price} €</span>
                        <span className="text-sm font-medium text-indigo-300/80">/ {plan.period}</span>
                      </div>
                      {plan.originalPrice && (
                        <span className="mt-1.5 text-[11px] font-semibold text-amber-400/90 uppercase tracking-wide">
                          Tarifa Early Adopter · de por vida
                        </span>
                      )}
                    </div>

                    <ul className="space-y-4 flex-1 mb-8">
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm">
                          <Check className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400" />
                          <span className={`${i === 0 && plan.id !== 'starter' ? 'text-white font-semibold' : 'text-indigo-100/90'}`}>
                            {f}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <Link to={plan.href} className="mt-auto block">
                      <Button
                        size="lg"
                        className={`w-full text-sm font-bold h-12 rounded-xl transition-all ${plan.recommended
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/25'
                          : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                          }`}
                      >
                        {plan.cta}
                        {plan.recommended && <ArrowRight className="ml-2 h-4 w-4" />}
                      </Button>
                    </Link>
                  </div>
                );
              })}
            </div>

            {/* Trust Badges */}
            <div className="mt-12 flex flex-wrap justify-center gap-6 sm:gap-10">
              {TRUST_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.text} className="flex items-center gap-3 text-indigo-100/90">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                      <Icon className="h-4 w-4 text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{item.text}</p>
                      <p className="text-xs text-indigo-200/70">{item.sub}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Early adopter — banner persistente debajo de las cards */}
            <div className="mt-10 rounded-2xl border border-amber-400/20 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-amber-500/10 p-5 sm:p-6 text-center">
              <p className="text-amber-100/90 text-sm sm:text-base leading-relaxed">
                <span className="text-white font-semibold">🎯 Premiaremos a las primeras agencias que confíen en nosotros</span>{' '}
                manteniendo esta cuota de por vida, antes de aplicar las tarifas oficiales de{' '}
                <span className="line-through text-indigo-300/60">99€</span> y <span className="line-through text-indigo-300/60">249€</span>.
              </p>
            </div>

            {/* Enterprise Contact */}
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                <p className="text-white font-semibold text-sm">¿Más de 50 personas o necesitas algo a medida?</p>
                <p className="text-indigo-200/70 text-xs mt-0.5">Enterprise sin límites · SLA · Soporte dedicado · Facturación personalizada</p>
              </div>
              <a
                href="mailto:hola@taimbox.com?subject=Plan Enterprise"
                className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-semibold transition-colors"
              >
                Hablar con ventas
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </section>

          {/* Transversal Features Section */}
          <section className="mb-20 sm:mb-24">
            <div className="text-center mb-10">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-300/90 mb-3 block">
                Todo lo que necesitas
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                Incluido en todos los planes
              </h2>
              <p className="text-indigo-100/80 text-sm sm:text-base max-w-2xl mx-auto">
                No importa si estás en el plan Starter o en Business, Taimbox siempre ofrece recursos robustos y premium de base.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              {UNIVERSAL_FEATURES.map(({ icon: Icon, title, desc }, i) => (
                <div key={i} className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-sm p-6 hover:bg-slate-800/60 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4">
                    <Icon className="h-5 w-5 text-indigo-400" />
                  </div>
                  <h3 className="text-base text-white font-semibold mb-2">{title}</h3>
                  <p className="text-sm text-indigo-200/70 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* FAQ Section */}
          <section className="mb-20 sm:mb-24">
            <div className="text-center mb-10">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-300/90 mb-3 block">
                Preguntas frecuentes
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                Todo sobre planes y facturación
              </h2>
            </div>
            <div className="max-w-3xl mx-auto space-y-3">
              <Accordion type="single" collapsible className="w-full">
                {FAQ_ITEMS.map((item, i) => (
                  <AccordionItem
                    key={i}
                    value={`faq-${i}`}
                    className="rounded-2xl border border-white/10 bg-slate-900/60 px-5 sm:px-6 data-[state=open]:bg-slate-800/80 transition-colors mb-3 last:mb-0"
                  >
                    <AccordionTrigger className="text-left text-white font-semibold hover:text-indigo-200 hover:no-underline py-5 text-sm sm:text-base">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-indigo-200/90 text-sm sm:text-base pb-5 leading-relaxed">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </section>

          {/* Final CTA Section */}
          <section className="mb-0">
            <div className="rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-indigo-500/10 p-8 sm:p-12 relative overflow-hidden">
              <div className="absolute top-0 right-0 -m-20 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 -m-20 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl" />

              <div className="relative z-10">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-4 text-center">
                  ¿Listo para tomar el control de tu agencia?
                </h2>
                <p className="text-indigo-100/90 mb-8 text-base sm:text-lg leading-relaxed text-center max-w-2xl mx-auto">
                  Crea tu cuenta en menos de un minuto. Sin necesidad de métodos de pago para crear la cuenta y usar nuestro plan Starter libremente.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mb-10">
                  {[
                    { num: '0€', label: 'para empezar a operar' },
                    { num: '14', label: 'días de prueba en Business' },
                    { num: '1 min', label: 'para invitar al equipo' },
                  ].map(({ num, label }, i) => (
                    <div key={i} className="text-center p-4 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-sm">
                      <p className="text-2xl sm:text-3xl font-black text-white">{num}</p>
                      <p className="text-xs text-indigo-300/80 mt-1 font-medium">{label}</p>
                    </div>
                  ))}
                </div>

                <div className="text-center">
                  <Link to="/login?tab=register">
                    <Button
                      size="lg"
                      className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-12 py-7 text-lg font-bold shadow-2xl shadow-indigo-500/30 rounded-xl"
                    >
                      Empezar gratis
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <p className="mt-4 text-sm text-indigo-200/80">
                    ¿Ya tienes cuenta? <Link to="/login" className="text-white font-semibold hover:text-indigo-300 transition-colors">Iniciar sesión</Link>.
                  </p>
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
