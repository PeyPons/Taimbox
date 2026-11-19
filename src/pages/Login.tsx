import { useEffect, useMemo, useState } from "react";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/lib/notify";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Rocket, LogIn } from "lucide-react";
import { useAppTranslation } from "@/hooks/useAppTranslation";
import { INPUT_LIMITS } from "@/constants/inputLimits";
import { ONBOARDING_WIZARD_ALLOWED_KEY } from "@/utils/onboardingDefaults";
import { CurrencySelect } from "@/components/agency/CurrencySelect";
import { DEFAULT_AGENCY_CURRENCY, type AgencyCurrencyCode } from "@/constants/currencies";
import { trackGoogleAdsRegistrationConversion } from "@/lib/googleAdsConversion";
import { getStripePriceIdForCheckout } from "@/config/billingDisplay";
import { primaryAgencyIdForUser, startPlanCheckout } from "@/lib/startPlanCheckout";

type LoginFormValues = {
  email: string;
  password: string;
};

type RegisterFormValues = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  agencyName: string;
  currency: AgencyCurrencyCode;
};

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(tabParam === 'register' ? 'register' : 'login');
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerCurrency, setRegisterCurrency] = useState<AgencyCurrencyCode>(DEFAULT_AGENCY_CURRENCY);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const { t } = useAppTranslation();
  const { t: tLanding } = useTranslation("landing");
  const planIntent = searchParams.get("plan");
  const intentKey =
    planIntent === "starter" || planIntent === "pro" || planIntent === "business" ? planIntent : null;

  const loginFormSchema = useMemo(
    () =>
      z.object({
        email: z.string().email(t("auth.login.errors.invalidEmail")).max(INPUT_LIMITS.email),
        password: z.string().min(1, t("auth.login.errors.passwordRequired")).max(INPUT_LIMITS.password),
      }),
    [t]
  );

  const registerFormSchema = useMemo(
    () =>
      z
        .object({
          name: z.string().min(2, t("auth.register.errors.nameTooShort")).max(INPUT_LIMITS.personName),
          email: z.string().email(t("auth.register.errors.invalidEmail")).max(INPUT_LIMITS.email),
          password: z.string().min(8, t("auth.register.errors.passwordTooShort")).max(INPUT_LIMITS.password),
          confirmPassword: z
            .string()
            .min(6, t("auth.register.errors.confirmPasswordRequired"))
            .max(INPUT_LIMITS.password),
          agencyName: z.string().min(2, t("auth.register.errors.agencyNameRequired")).max(INPUT_LIMITS.agencyName),
        })
        .refine((data) => data.password === data.confirmPassword, {
          message: t("auth.register.errors.passwordsDontMatch"),
          path: ['confirmPassword'],
        }),
    [t]
  );

  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || "/dashboard";

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: '', password: '' },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      agencyName: '',
      currency: DEFAULT_AGENCY_CURRENCY,
    },
  });

  useEffect(() => {
    if (tabParam === 'register') setActiveTab('register');
  }, [tabParam]);

  const openTeamCheckout = async (agencyId: string): Promise<"left" | "stay"> => {
    const priceId = getStripePriceIdForCheckout("pro");
    if (!priceId) return "stay";
    const result = await startPlanCheckout({
      agencyId,
      planId: "pro",
      priceId,
      successPath: "/onboarding/choose",
      cancelPath: "/agency?tab=billing",
    });
    if (result.url) {
      window.location.assign(result.url);
      return "left";
    }
    if (result.updated) {
      navigate("/agency?tab=billing", { replace: true });
      return "left";
    }
    return "stay";
  };

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session || cancelled) return;
      if (planIntent === "pro") {
        const agencyId = await primaryAgencyIdForUser(session.user.id);
        if (cancelled) return;
        if (agencyId && (await openTeamCheckout(agencyId)) === "left") return;
        if (!cancelled) {
          toast.error(tLanding("pricing.checkoutUnavailable"));
          navigate("/agency?tab=billing", { replace: true });
        }
        return;
      }
      navigate(from, { replace: true });
    });
    return () => {
      cancelled = true;
    };
    // openTeamCheckout se recrea cada render; el efecto solo debe reaccionar al intent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, from, planIntent]);

  const onLogin = async (data: LoginFormValues) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      toast.error(
        t("auth.login.toast.error", {
          message: error.message,
        })
      );
    } else {
      toast.success(t("auth.login.toast.success"));
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 100);
    }
  };

  const onForgotPassword = async () => {
    if (!forgotEmail?.trim()) {
      toast.error(t("auth.forgotPassword.toast.missingEmail"));
      return;
    }

    setIsSendingReset(true);
    try {
      await supabase.functions.invoke('request-password-reset', {
        body: { email: forgotEmail.trim() },
      });
      setResetSent(true);
      toast.success(t("auth.forgotPassword.toast.success"));
    } catch {
      toast.success(t("auth.forgotPassword.toast.success"));
    } finally {
      setIsSendingReset(false);
    }
  };

  const checkAvailability = async (field: 'agencyName' | 'email', value: string) => {
    if (!value || value.length < 2) return;

    try {
      const { data: exists, error } = await supabase.rpc('check_availability', {
        check_type: field === 'agencyName' ? 'agency_name' : 'email',
        value: value,
      });

      if (error) {
        console.error('Error verificando disponibilidad:', error);
        return;
      }

      if (exists) {
        if (field === 'agencyName') {
          registerForm.setError('agencyName', {
            type: 'manual',
            message: t('auth.register.errors.agencyNameTaken', 'Esta empresa ya existe. Prueba con otro nombre.'),
          });
        }
        if (field === 'email') {
          registerForm.setError('email', {
            type: 'manual',
            message: t('auth.register.errors.emailTaken', 'Este email ya está registrado.'),
          });
        }
      } else {
        registerForm.clearErrors(field);
      }
    } catch (err) {
      console.error('Error calling RPC:', err);
    }
  };

  const onRegister = async (data: RegisterFormValues) => {
    setIsRegistering(true);

    try {
      const agencyNameTrimmed = data.agencyName.trim();
      const { data: agencyExists } = await supabase.rpc('check_availability', {
        check_type: 'agency_name',
        value: agencyNameTrimmed,
      });

      if (agencyExists) {
        registerForm.setError('agencyName', {
          type: 'manual',
          message: t("auth.register.errors.agencyAlreadyExists"),
        });
        setIsRegistering(false);
        return;
      }

      const { data: responseData, error } = await supabase.functions.invoke('register-agency', {
        body: {
          email: data.email,
          password: data.password,
          name: data.name.trim(),
          agencyName: agencyNameTrimmed,
          currency: registerCurrency,
          ...(intentKey ? { plan: intentKey } : {}),
        },
      });

      if (error) {
        console.error('Error en registro:', error);
        let errorMessage = t("auth.register.toast.genericError");
        if (error.message) {
          errorMessage = error.message;
        } else if (error.context?.body) {
          try {
            const body = typeof error.context.body === 'string'
              ? JSON.parse(error.context.body)
              : error.context.body;
            if (body.error) errorMessage = body.error;
          } catch {
            /* ignore */
          }
        }
        toast.error(errorMessage);
        return;
      }

      if (responseData?.error) {
        toast.error(responseData.error);
        return;
      }

      toast.success(t("auth.register.toast.success"));

      void trackGoogleAdsRegistrationConversion({
        email: data.email,
        fullName: data.name.trim(),
        transactionId:
          typeof responseData?.user?.id === 'string' ? responseData.user.id : undefined,
      });

      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (loginError) {
        toast.error(t("auth.register.toast.loginAfterRegisterError"));
        setActiveTab('login');
        return;
      }

      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(ONBOARDING_WIZARD_ALLOWED_KEY);
      }

      const wantsTeamCheckout = responseData?.checkoutPlan === 'pro' || intentKey === 'pro';
      if (wantsTeamCheckout) {
        const agencyId = typeof responseData?.agency?.id === 'string' ? responseData.agency.id : null;
        if (agencyId && (await openTeamCheckout(agencyId)) === 'left') return;
        toast.error(tLanding('pricing.checkoutUnavailable'));
        navigate('/agency?tab=billing', { replace: true });
        return;
      }

      setTimeout(() => {
        navigate('/onboarding/choose', { replace: true });
      }, 100);
    } catch (err) {
      console.error('Error inesperado:', err);
      toast.error(t("auth.register.toast.unexpectedError"));
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#14123B] px-4 py-8">
      <Card className="w-full max-w-md border-[#E4DDD0] bg-[#F7F4EC] text-[#14123B] shadow-none">
        <CardHeader className="pb-8 pt-8">
          <div className="flex justify-center">
            <img src="/brand/logo-C.svg" alt="Taimbox" className="h-8 w-auto" />
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'register')}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login" className="gap-2">
                <LogIn className="h-4 w-4" />
                {t("auth.tabs.login")}
              </TabsTrigger>
              <TabsTrigger value="register" className="gap-2">
                <Rocket className="h-4 w-4" />
                {t("auth.tabs.register")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("auth.login.fields.email.label")}</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            autoComplete="username"
                            maxLength={INPUT_LIMITS.email}
                            placeholder={t("auth.login.fields.email.placeholder")}
                            className="bg-slate-50 border-slate-200 focus:border-indigo-500"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("auth.login.fields.password.label")}</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            autoComplete="current-password"
                            maxLength={INPUT_LIMITS.password}
                            placeholder={t("auth.login.fields.password.placeholder")}
                            className="bg-slate-50 border-slate-200 focus:border-indigo-500"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full bg-[#7C3AED] text-white font-medium hover:bg-[#6D28D9]"
                    disabled={loginForm.formState.isSubmitting}
                  >
                    {loginForm.formState.isSubmitting
                      ? t("auth.login.actions.submitting")
                      : t("auth.login.actions.submit")}
                  </Button>
                </form>
              </Form>

              <div className="mt-4 text-center">
                {!showForgotPassword ? (
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-[#7C3AED] transition-colors hover:text-[#6D28D9] hover:underline"
                  >
                    {t("auth.forgotPassword.link")}
                  </button>
                ) : resetSent ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800">
                    <p className="font-medium mb-1">{t("auth.forgotPassword.success.title")}</p>
                    <p className="text-green-600 text-xs">{t("auth.forgotPassword.success.body")}</p>
                    <button
                      type="button"
                      onClick={() => { setShowForgotPassword(false); setResetSent(false); setForgotEmail(''); }}
                      className="mt-2 text-xs text-[#7C3AED] hover:underline"
                    >
                      {t("auth.forgotPassword.success.backToLogin")}
                    </button>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
                    <p className="text-sm text-slate-600">{t("auth.forgotPassword.description")}</p>
                    <Input
                      type="email"
                      autoComplete="email"
                      maxLength={INPUT_LIMITS.email}
                      placeholder={t("auth.forgotPassword.emailPlaceholder")}
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="bg-white border-slate-200 focus:border-indigo-500"
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onForgotPassword(); } }}
                    />
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => { setShowForgotPassword(false); setForgotEmail(''); }}>
                        {t("auth.forgotPassword.actions.cancel")}
                      </Button>
                      <Button type="button" size="sm" className="flex-1 bg-[#7C3AED] text-white hover:bg-[#6D28D9]" onClick={onForgotPassword} disabled={isSendingReset}>
                        {isSendingReset ? t("auth.forgotPassword.actions.sending") : t("auth.forgotPassword.actions.sendLink")}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="register">
              {intentKey ? (
                <p className="mb-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-snug text-slate-700">
                  {tLanding(`pricing.intent.${intentKey}`)}
                </p>
              ) : null}
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                  <FormField
                    control={registerForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("auth.register.fields.name.label")}</FormLabel>
                        <FormControl>
                          <Input
                            autoComplete="name"
                            maxLength={INPUT_LIMITS.personName}
                            placeholder={t("auth.register.fields.name.placeholder")}
                            className="bg-slate-50 border-slate-200 focus:border-indigo-500"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={registerForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("auth.register.fields.email.label")}</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            autoComplete="email"
                            maxLength={INPUT_LIMITS.email}
                            placeholder={t("auth.register.fields.email.placeholder")}
                            className="bg-slate-50 border-slate-200 focus:border-indigo-500"
                            {...field}
                            onBlur={(e) => checkAvailability('email', e.target.value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("auth.register.fields.password.label")}</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              autoComplete="new-password"
                              maxLength={INPUT_LIMITS.password}
                              placeholder="••••••••"
                              className="bg-slate-50 border-slate-200 focus:border-indigo-500"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("auth.register.fields.confirmPassword.label")}</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              autoComplete="new-password"
                              maxLength={INPUT_LIMITS.password}
                              placeholder="••••••••"
                              className="bg-slate-50 border-slate-200 focus:border-indigo-500"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={registerForm.control}
                    name="agencyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("auth.register.fields.agencyName.label")}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t("auth.register.fields.agencyName.placeholder")}
                            maxLength={INPUT_LIMITS.agencyName}
                            className="bg-slate-50 border-slate-200 focus:border-indigo-500"
                            {...field}
                            onBlur={(e) => checkAvailability('agencyName', e.target.value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none" htmlFor="register-currency">
                      {t('auth.register.fields.currency.label', 'Moneda de la agencia')}
                    </label>
                    <CurrencySelect
                      id="register-currency"
                      value={registerCurrency}
                      onValueChange={setRegisterCurrency}
                    />
                    <p className="text-xs text-slate-500">
                      {t(
                        'auth.register.fields.currency.hint',
                        'Rentabilidad, fees y costes del equipo. Puedes cambiarla después en Configuración.',
                      )}
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-[#7C3AED] text-white font-medium hover:bg-[#6D28D9]"
                    disabled={isRegistering}
                  >
                    {isRegistering
                      ? t("auth.register.actions.submitting")
                      : t("auth.register.actions.submit")}
                  </Button>

                  <p className="text-xs text-center text-slate-500 leading-snug">
                    {t("auth.register.footer")}
                  </p>
                  {intentKey == null ? (
                    <p className="text-[11px] text-center text-indigo-700/90 leading-snug">
                      {t(
                        'auth.register.trialNote',
                        '14 días de prueba del plan Business. Sin tarjeta al registrarte.'
                      )}
                    </p>
                  ) : null}
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
