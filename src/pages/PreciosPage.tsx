import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { Button } from '@/components/ui/button';
import { Check, Zap, Building2, Sparkles, ArrowRight, Shield, RefreshCw, CreditCard } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: '0',
    period: 'siempre',
    description: 'El estándar operativo para equipos pequeños.',
    features: [
      'Planificador ilimitado',
      'Sistema de Deadlines',
      'Hasta 5 personas',
      'Histórico Inteligencia: últimos 30 días',
    ],
    cta: 'Empezar gratis',
    href: '/login?tab=register',
    recommended: false,
    icon: Zap,
    iconBg: 'bg-indigo-500/30',
    iconColor: 'text-indigo-300',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '49',
    period: 'mes',
    description: 'La agencia eficiente.',
    features: [
      'Todo Starter',
      'Hasta 20 personas',
      'Módulo Weekly',
      'Matriz de Fiabilidad completa',
      'EHR básico (rentabilidad)',
      'Histórico ilimitado',
    ],
    cta: 'Elegir Pro',
    href: '/login?tab=register',
    recommended: true,
    icon: Sparkles,
    iconBg: 'bg-purple-500/30',
    iconColor: 'text-purple-300',
  },
  {
    id: 'business',
    name: 'Business',
    price: '149',
    period: 'mes',
    description: 'Inteligencia financiera total.',
    features: [
      'Todo Pro',
      'Hasta 50 personas',
      'Radar de Hemorragias (P&L)',
      'Integración Google Ads y Meta Ads',
      'API y webhooks',
      'OKRs y metas',
      '14 días de prueba',
    ],
    cta: 'Probar Business 14 días',
    href: '/login?tab=register',
    recommended: false,
    icon: Building2,
    iconBg: 'bg-amber-500/30',
    iconColor: 'text-amber-300',
  },
];

const TRUST_ITEMS = [
  { icon: RefreshCw, text: '14 días de prueba en Business', sub: 'Sin tarjeta' },
  { icon: Shield, text: 'Sin permanencia', sub: 'Cancela cuando quieras' },
  { icon: CreditCard, text: 'Facturación mensual', sub: 'Pago seguro con Stripe' },
];

const FAQ_ITEMS = [
  { q: '¿Puedo cambiar de plan en cualquier momento?', a: 'Sí. Puedes subir o bajar de plan desde Configuración → Plan y facturación. Los cambios se aplican de forma prorrateada.' },
  { q: '¿Qué pasa si supero el límite de empleados?', a: 'Verás un aviso y el modo solo lectura hasta que subas de plan o ajustes el equipo. No borramos datos.' },
  { q: '¿Hay descuentos por pago anual?', a: 'De momento ofrecemos facturación mensual. Para equipos grandes o necesidades especiales: hola@taimbox.com o Soporte en la app.' },
  { q: '¿El trial de Business requiere tarjeta?', a: 'No. Puedes probar Business 14 días sin introducir tarjeta.' },
];

export default function PreciosPage() {
  return (
    <>
      <Helmet>
        <title>Precios y planes | Taimbox</title>
        <meta name="description" content="Planes Starter, Pro y Business. Planificador y Deadlines gratis. Prueba Business 14 días sin tarjeta." />
        <link rel="canonical" href="/precios" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-indigo-900 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-50" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl opacity-50" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-3xl opacity-30" />
        </div>
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }}
        />

        <LandingHeader />

        <article className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 md:py-16 text-left overflow-x-hidden">
          {/* Hero — mismo patrón que PlannerArticle */}
          <section className="mb-16 sm:mb-20 text-center">
            <div className="mb-6">
              <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider text-indigo-300 bg-indigo-500/20 border border-indigo-400/30">
                Planes para cada etapa
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-[1.1] tracking-tight">
              Precios que escalan{' '}
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                con tu equipo
              </span>
            </h1>
            <p className="text-indigo-100/90 text-base sm:text-lg lg:text-xl leading-relaxed max-w-3xl mx-auto mb-8">
              Empieza gratis con el planificador y los deadlines. Sube cuando necesites más equipo, reportes o integraciones.
            </p>
            <div className="flex flex-wrap justify-center gap-3 text-sm">
              {['Sin tarjeta para empezar', '14 días de prueba en Business', 'Sin permanencia'].map((f, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-indigo-200/90 text-xs font-medium">
                  <Check className="h-3 w-3 text-emerald-400" />
                  {f}
                </span>
              ))}
            </div>
          </section>

          {/* Tarjetas de precios — mismo estilo que los mockups (bg-slate-900/80, border-white/10) */}
          <section className="mb-16 sm:mb-20">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              {PLANS.map((plan) => {
                const Icon = plan.icon;
                return (
                  <div
                    key={plan.id}
                    className={`rounded-2xl border p-4 sm:p-6 shadow-2xl backdrop-blur-sm flex flex-col ${
                      plan.recommended
                        ? 'border-indigo-500/40 bg-slate-900/90'
                        : 'border-white/10 bg-slate-900/80'
                    }`}
                  >
                    {plan.recommended && (
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-300 mb-3 block">
                        Recomendado
                      </span>
                    )}
                    <div className="flex items-center gap-2 mb-4">
                      <div className={`h-8 w-8 rounded-lg ${plan.iconBg} flex items-center justify-center`}>
                        <Icon className={`h-4 w-4 ${plan.iconColor}`} />
                      </div>
                      <span className="text-white font-semibold text-sm">{plan.name}</span>
                    </div>
                    <p className="text-indigo-200/80 text-sm mb-4">{plan.description}</p>
                    <div className="flex items-baseline gap-1 mb-6">
                      <span className="text-3xl sm:text-4xl font-bold text-white">{plan.price} €</span>
                      <span className="text-sm text-indigo-300/80">/ {plan.period}</span>
                    </div>
                    <ul className="space-y-3 flex-1">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400" />
                          <span className="text-indigo-100/90">{f}</span>
                        </li>
                      ))}
                    </ul>
                    <Link to={plan.href} className="mt-6 block">
                      <Button
                        size="lg"
                        className={`w-full text-sm font-semibold ${
                          plan.recommended
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white'
                            : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                        }`}
                      >
                        {plan.cta}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                );
              })}
            </div>

            {/* Franja de confianza — estilo discreto como en las landings */}
            <div className="mt-10 flex flex-wrap justify-center gap-6 sm:gap-10">
              {TRUST_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.text} className="flex items-center gap-3 text-indigo-100/90">
                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                      <Icon className="h-4 w-4 text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{item.text}</p>
                      <p className="text-[11px] text-indigo-200/70">{item.sub}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* FAQ — cards con mismo estilo (bg-white/5, border-white/10) */}
          <section className="mb-16 sm:mb-20">
            <div className="text-center mb-10">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-300/90 mb-3 block">
                Preguntas frecuentes
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                Todo sobre planes y facturación
              </h2>
            </div>
            <div className="max-w-3xl mx-auto space-y-2">
              <Accordion type="single" collapsible>
                {FAQ_ITEMS.map((item, i) => (
                  <AccordionItem
                    key={i}
                    value={`faq-${i}`}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 sm:px-5 data-[state=open]:bg-white/10"
                  >
                    <AccordionTrigger className="text-left text-white font-medium hover:text-indigo-200 hover:no-underline py-4 text-sm">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-indigo-200/90 text-sm pb-4">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </section>

          {/* CTA final — mismo bloque que PlannerArticle */}
          <section className="mb-0">
            <div className="rounded-3xl border-2 border-indigo-500/30 bg-gradient-to-br from-indigo-600/20 via-purple-600/20 to-indigo-600/20 p-6 sm:p-10">
              <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4 text-center">
                ¿Listo para empezar?
              </h2>
              <p className="text-indigo-100/95 mb-6 text-base sm:text-lg leading-relaxed text-center max-w-2xl mx-auto">
                Crea tu cuenta en un minuto. Sin tarjeta para el plan gratuito ni para probar Business.
              </p>
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
                <p className="mt-3 text-sm text-indigo-200/80">
                  ¿Ya tienes cuenta? <Link to="/login" className="text-white font-medium hover:underline">Iniciar sesión</Link>. Gestiona tu plan en Configuración → Plan y facturación.
                </p>
              </div>
            </div>
          </section>
        </article>

        <LandingFooter />
      </div>
    </>
  );
}
