import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useOnboardingQuickSetup } from '@/hooks/useOnboardingQuickSetup';
import { TaimboxMark } from '@/components/brand/TaimboxLogo';
import { toast } from '@/lib/notify';
import { ArrowRight, Rocket, Sparkles, Loader2 } from 'lucide-react';
import { useAgency } from '@/contexts/AgencyContext';
import { ONBOARDING_WIZARD_ALLOWED_KEY } from '@/utils/onboardingDefaults';

export default function OnboardingChoicePage() {
  const navigate = useNavigate();
  const { t } = useAppTranslation();
  const { applyQuickOnboardingDefaults, isApplying } = useOnboardingQuickSetup();
  const { currentAgency } = useAgency();

  const handleQuick = async () => {
    try {
      await applyQuickOnboardingDefaults();
      toast.success(t('onboarding.choice.quickSuccess', '¡Listo! Explora el planificador cuando quieras.'));
      navigate('/planner', { replace: true });
    } catch {
      toast.error(t('onboarding.errors.save', 'Error al guardar'));
    }
  };

  const handleGuided = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(ONBOARDING_WIZARD_ALLOWED_KEY, '1');
    }
    navigate('/onboarding?mode=guided', { replace: true });
  };

  const trialNote = currentAgency?.trialEndsAt
    ? t('onboarding.choice.trialNote', {
        defaultValue:
          'Tienes 14 días de prueba del plan Business (sin tarjeta). Puedes cambiar de plan después.',
      })
    : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 px-4 py-8">
      <Card className="w-full max-w-lg bg-white/95 shadow-2xl border border-slate-200/80">
        <CardHeader className="text-center space-y-3">
          <div className="flex justify-center">
            <TaimboxMark className="h-11 w-11" variant="light" />
          </div>
          <CardTitle className="text-xl sm:text-2xl">
            {t('onboarding.choice.title', '¿Cómo quieres empezar?')}
          </CardTitle>
          <CardDescription className="text-slate-600">
            {t(
              'onboarding.choice.subtitle',
              'Puedes cambiar la configuración más tarde en Configuración de agencia.'
            )}
          </CardDescription>
          {trialNote ? (
            <p className="text-xs text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2 leading-snug">
              {trialNote}
            </p>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-3 pb-6">
          <button
            type="button"
            onClick={handleQuick}
            disabled={isApplying}
            className="w-full rounded-xl border-2 border-indigo-200 bg-gradient-to-b from-indigo-50/80 to-white p-4 text-left transition-all hover:border-indigo-400 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 disabled:opacity-60"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
                {isApplying ? (
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                ) : (
                  <Rocket className="h-5 w-5" aria-hidden />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900">
                  {t('onboarding.choice.quickTitle', 'Explorar ya')}
                </p>
                <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                  {t(
                    'onboarding.choice.quickDesc',
                    'Entras al planificador en ~1 min con valores recomendados. Te guiaremos con una lista corta de pasos.'
                  )}
                </p>
              </div>
              <ArrowRight className="h-5 w-5 shrink-0 text-indigo-500 mt-1" aria-hidden />
            </div>
          </button>

          <button
            type="button"
            onClick={handleGuided}
            disabled={isApplying}
            className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left transition-all hover:border-slate-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 disabled:opacity-60"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                <Sparkles className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900">
                  {t('onboarding.choice.guidedTitle', 'Configurar mi agencia')}
                </p>
                <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                  {t(
                    'onboarding.choice.guidedDesc',
                    'Asistente paso a paso (~8–12 min): módulos, departamentos, equipo, primer cliente y proyecto. Puedes omitir lo opcional.'
                  )}
                </p>
              </div>
              <ArrowRight className="h-5 w-5 shrink-0 text-slate-400 mt-1" aria-hidden />
            </div>
          </button>

        </CardContent>
      </Card>
    </div>
  );
}
