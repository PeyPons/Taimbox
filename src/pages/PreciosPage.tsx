import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { Button } from '@/components/ui/button';
import { Check, Zap, Building2, Sparkles } from 'lucide-react';

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
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-50" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl opacity-50" />
        </div>

        <LandingHeader />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center mb-14">
            <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
              Planes para cada etapa
            </h1>
            <p className="mt-4 text-lg text-indigo-200/90 max-w-2xl mx-auto">
              Empieza gratis con el planificador y los deadlines. Sube cuando necesites más equipo, reportes o integraciones.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {PLANS.map((plan) => {
              const Icon = plan.icon;
              return (
                <div
                  key={plan.id}
                  className={`relative rounded-2xl border p-6 sm:p-8 flex flex-col ${
                    plan.primary
                      ? 'bg-white/95 border-indigo-400 shadow-xl shadow-indigo-500/20 scale-[1.02]'
                      : 'bg-white/10 border-white/20 backdrop-blur'
                  }`}
                >
                  {plan.primary && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-indigo-500 text-white text-xs font-semibold">
                      Recomendado
                    </span>
                  )}
                  <div className="flex items-center gap-2 mb-4">
                    <Icon className={`h-6 w-6 ${plan.primary ? 'text-indigo-600' : 'text-indigo-300'}`} />
                    <h2 className={`text-xl font-bold ${plan.primary ? 'text-slate-900' : 'text-white'}`}>
                      {plan.name}
                    </h2>
                  </div>
                  <p className={`text-sm mb-6 ${plan.primary ? 'text-slate-600' : 'text-indigo-200/90'}`}>
                    {plan.description}
                  </p>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className={`text-4xl font-bold ${plan.primary ? 'text-slate-900' : 'text-white'}`}>
                      {plan.price} €
                    </span>
                    <span className={plan.primary ? 'text-slate-500' : 'text-indigo-200/80'}>/ {plan.period}</span>
                  </div>
                  <ul className="space-y-3 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Check className={`h-5 w-5 shrink-0 mt-0.5 ${plan.primary ? 'text-emerald-600' : 'text-emerald-400'}`} />
                        <span className={plan.primary ? 'text-slate-700' : 'text-indigo-100'}>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link to={plan.href} className="mt-8 block">
                    <Button
                      className={`w-full ${plan.primary ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-white/20 hover:bg-white/30 text-white border border-white/30'}`}
                      size="lg"
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>

          <p className="text-center text-indigo-200/70 text-sm mt-10">
            ¿Ya tienes cuenta? <Link to="/login" className="text-white font-medium hover:underline">Iniciar sesión</Link> y gestiona tu plan en Configuración → Plan y facturación.
          </p>
        </div>

        <LandingFooter />
      </div>
    </>
  );
}
