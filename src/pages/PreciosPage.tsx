import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { Button } from '@/components/ui/button';
import { Check, Zap, Building2, Sparkles, ArrowRight, Shield, RefreshCw, CreditCard, HelpCircle } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';

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
    primary: false,
    icon: Zap,
    gradient: 'from-slate-500 to-slate-600',
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
    primary: true,
    icon: Sparkles,
    gradient: 'from-indigo-500 to-purple-500',
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
    primary: false,
    icon: Building2,
    gradient: 'from-violet-500 to-fuchsia-500',
  },
];

const TRUST_ITEMS = [
  { icon: RefreshCw, text: '14 días de prueba en Business', sub: 'Sin tarjeta' },
  { icon: Shield, text: 'Sin permanencia', sub: 'Cancela cuando quieras' },
  { icon: CreditCard, text: 'Facturación mensual', sub: 'Pago seguro con Stripe' },
];

const FAQ_ITEMS = [
  {
    q: '¿Puedo cambiar de plan en cualquier momento?',
    a: 'Sí. Puedes subir o bajar de plan cuando quieras desde Configuración → Plan y facturación. Los cambios se aplican de forma prorrateada.',
  },
  {
    q: '¿Qué pasa si supero el límite de empleados?',
    a: 'Verás un aviso y el modo solo lectura hasta que subas de plan o ajustes el equipo. No borramos datos; solo bloqueamos la edición hasta estar dentro del límite.',
  },
  {
    q: '¿Hay descuentos por pago anual?',
    a: 'De momento ofrecemos facturación mensual. Si tienes un equipo grande o necesidades especiales, escríbenos desde la app (Soporte) o a hola@taimbox.com.',
  },
  {
    q: '¿El trial de Business requiere tarjeta?',
    a: 'No. Puedes probar Business 14 días sin introducir tarjeta. Si te convence, añades el método de pago al final del trial.',
  },
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
        {/* Background: orbs + grid (igual que el resto de landings) */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-50 animate-pulse" style={{ animationDuration: '4s' }} />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl opacity-50 animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-indigo-400/10 rounded-full blur-3xl opacity-40 animate-pulse" style={{ animationDuration: '5s', animationDelay: '2s' }} />
        </div>
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }}
        />

        <LandingHeader />

        {/* Hero */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 pb-10 sm:pb-14">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-indigo-500/40 via-purple-500/40 to-pink-500/40 backdrop-blur-md rounded-full text-white text-xs sm:text-sm font-semibold mb-6 border border-white/20 shadow-xl animate-fade-in">
              <Sparkles className="h-4 w-4 sm:h-4 sm:w-4" />
              <span>Planes para cada etapa</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight mb-4">
              <span className="block text-white">Precios que escalan</span>
              <span className="block bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                con tu equipo
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-indigo-100/90 max-w-2xl mx-auto">
              Empieza gratis con el planificador y los deadlines. Sube cuando necesites más equipo, reportes o integraciones.
            </p>
          </div>
        </div>

        {/* Pricing cards */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {PLANS.map((plan) => {
              const Icon = plan.icon;
              return (
                <div
                  key={plan.id}
                  className={cn(
                    'relative rounded-2xl flex flex-col transition-all duration-300',
                    plan.primary
                      ? 'md:scale-105 z-20'
                      : 'hover:scale-[1.02] z-10'
                  )}
                >
                  {plan.primary && (
                    <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 opacity-60 blur-sm" />
                  )}
                  <div
                    className={cn(
                      'relative rounded-2xl border flex flex-col flex-1 overflow-hidden',
                      plan.primary
                        ? 'bg-white/98 border-white/50 shadow-2xl shadow-indigo-500/25'
                        : 'bg-white/10 border-white/20 backdrop-blur-xl'
                    )}
                  >
                    {plan.primary && (
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
                    )}
                    <div className="p-6 sm:p-8 flex flex-col flex-1">
                      {plan.primary && (
                        <span className="absolute top-4 right-4 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-bold shadow-lg">
                          Recomendado
                        </span>
                      )}
                      <div className="flex items-center gap-3 mb-4">
                        <div
                          className={cn(
                            'w-12 h-12 rounded-xl flex items-center justify-center shadow-lg bg-gradient-to-br',
                            plan.primary ? `${plan.gradient} text-white` : `${plan.gradient} opacity-80`
                          )}
                        >
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h2 className={cn('text-xl font-bold', plan.primary ? 'text-slate-900' : 'text-white')}>
                            {plan.name}
                          </h2>
                          <p className={cn('text-sm', plan.primary ? 'text-slate-600' : 'text-indigo-200/90')}>
                            {plan.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-baseline gap-1 mb-6 mt-2">
                        <span className={cn('text-4xl sm:text-5xl font-black tracking-tight', plan.primary ? 'text-slate-900' : 'text-white')}>
                          {plan.price} €
                        </span>
                        <span className={cn('text-base font-medium', plan.primary ? 'text-slate-500' : 'text-indigo-200/80')}>
                          / {plan.period}
                        </span>
                      </div>
                      <ul className="space-y-3.5 flex-1">
                        {plan.features.map((f) => (
                          <li key={f} className="flex items-start gap-3 text-sm">
                            <Check className={cn('h-5 w-5 shrink-0 mt-0.5', plan.primary ? 'text-emerald-600' : 'text-emerald-400')} />
                            <span className={plan.primary ? 'text-slate-700' : 'text-indigo-100'}>{f}</span>
                          </li>
                        ))}
                      </ul>
                      <Link to={plan.href} className="mt-8 block group">
                        <Button
                          size="lg"
                          className={cn(
                            'w-full text-base font-semibold transition-all duration-200',
                            plan.primary
                              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl hover:scale-[1.02]'
                              : 'bg-white/20 hover:bg-white/30 text-white border border-white/30 hover:border-white/50 backdrop-blur'
                          )}
                        >
                          {plan.cta}
                          <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Trust strip */}
          <div className="mt-14 sm:mt-16 flex flex-wrap justify-center gap-8 sm:gap-12">
            {TRUST_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.text} className="flex items-center gap-3 text-indigo-100/90">
                  <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-indigo-300" />
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm sm:text-base">{item.text}</p>
                    <p className="text-xs sm:text-sm text-indigo-200/70">{item.sub}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* FAQ */}
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-24">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-white flex items-center justify-center gap-2">
              <HelpCircle className="h-8 w-8 text-indigo-400" />
              Preguntas frecuentes
            </h2>
            <p className="mt-2 text-indigo-200/80 text-sm sm:text-base">
              Todo lo que necesitas saber sobre planes y facturación
            </p>
          </div>
          <Accordion type="single" collapsible className="space-y-2">
            {FAQ_ITEMS.map((item, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="rounded-xl border border-white/20 bg-white/5 backdrop-blur-xl px-4 sm:px-5 data-[state=open]:bg-white/10"
              >
                <AccordionTrigger className="text-left text-white font-medium hover:text-indigo-200 hover:no-underline py-4">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-indigo-200/90 text-sm pb-4">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* CTA final */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 sm:pb-28">
          <div className="rounded-2xl border border-white/20 bg-gradient-to-br from-indigo-900/50 to-purple-900/50 backdrop-blur-xl p-8 sm:p-12 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              ¿Listo para empezar?
            </h2>
            <p className="text-indigo-200/90 mb-6 max-w-xl mx-auto">
              Crea tu cuenta en un minuto. Sin tarjeta para el plan gratuito ni para probar Business.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/login?tab=register" className="group inline-flex justify-center">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-6 text-base font-semibold shadow-xl hover:shadow-indigo-500/30 transition-all hover:scale-105"
                >
                  Empezar gratis
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </Button>
              </Link>
              <Link to="/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/50 bg-white/5 px-8 py-6 text-base font-semibold"
                >
                  Iniciar sesión
                </Button>
              </Link>
            </div>
            <p className="text-sm text-indigo-200/70 mt-6">
              ¿Ya tienes cuenta? Gestiona tu plan en <strong className="text-white">Configuración → Plan y facturación</strong>.
            </p>
          </div>
        </div>

        <LandingFooter />
      </div>
    </>
  );
}
