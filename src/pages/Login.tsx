import { useEffect, useState } from "react";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useNavigate, useLocation } from "react-router-dom";
import { Rocket, LogIn } from "lucide-react";

// Schema de Login
const loginFormSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
});

// Schema de Registro
const registerFormSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string().min(6, 'Confirma tu contraseña'),
  agencyName: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginFormSchema>;
type RegisterFormValues = z.infer<typeof registerFormSchema>;

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [isRegistering, setIsRegistering] = useState(false);

  // Obtener la ruta de origen desde el state de navegación
  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || "/dashboard";

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      agencyName: '',
    },
  });

  // Si ya estamos logueados, redirigir
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate(from, { replace: true });
      }
    });
  }, [navigate, from]);

  const onLogin = async (data: LoginFormValues) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      toast.error("Error de acceso: " + error.message);
    } else {
      toast.success("¡Bienvenido!");
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 100);
    }
  };

  const onRegister = async (data: RegisterFormValues) => {
    setIsRegistering(true);

    try {
      // Llamar a la edge function para crear usuario + agencia + empleado
      const { data: responseData, error } = await supabase.functions.invoke('register-agency', {
        body: {
          email: data.email,
          password: data.password,
          name: data.name,
          agencyName: data.agencyName || undefined
        }
      });

      if (error) {
        console.error('Error en registro:', error);

        // Extraer mensaje de error
        let errorMessage = 'Error al registrar';
        if (error.message) {
          errorMessage = error.message;
        } else if (error.context?.body) {
          try {
            const body = typeof error.context.body === 'string'
              ? JSON.parse(error.context.body)
              : error.context.body;
            if (body.error) errorMessage = body.error;
          } catch {
            // ignorar
          }
        }

        toast.error(errorMessage);
        return;
      }

      if (responseData?.error) {
        toast.error(responseData.error);
        return;
      }

      toast.success("¡Cuenta creada! Iniciando sesión...");

      // Auto-login con las credenciales recién creadas
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (loginError) {
        toast.error("Cuenta creada pero hubo un error al iniciar sesión. Por favor, inicia sesión manualmente.");
        setActiveTab('login');
        return;
      }

      // Redirigir - el onboarding wizard lo manejará ProtectedRoute
      setTimeout(() => {
        navigate('/onboarding', { replace: true });
      }, 100);

    } catch (err) {
      console.error('Error inesperado:', err);
      toast.error('Error inesperado. Por favor, inténtalo de nuevo.');
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <Card className="w-full max-w-md bg-white shadow-xl">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <CardTitle className="text-2xl text-center font-bold text-slate-900">Timeboxing</CardTitle>
          <CardDescription className="text-center text-slate-500">
            Gestiona tu equipo y proyectos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'register')}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login" className="gap-2">
                <LogIn className="h-4 w-4" />
                Acceder
              </TabsTrigger>
              <TabsTrigger value="register" className="gap-2">
                <Rocket className="h-4 w-4" />
                Registrarse
              </TabsTrigger>
            </TabsList>

            {/* Tab Login */}
            <TabsContent value="login">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="usuario@empresa.com"
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
                        <FormLabel>Contraseña</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="••••••••"
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
                    className="w-full bg-primary hover:bg-primary/90 text-white font-medium"
                    disabled={loginForm.formState.isSubmitting}
                  >
                    {loginForm.formState.isSubmitting ? "Entrando..." : "Acceder"}
                  </Button>
                </form>
              </Form>
            </TabsContent>

            {/* Tab Registro */}
            <TabsContent value="register">
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                  <FormField
                    control={registerForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tu nombre</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Juan García"
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
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="tu@empresa.com"
                            className="bg-slate-50 border-slate-200 focus:border-indigo-500"
                            {...field}
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
                          <FormLabel>Contraseña</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
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
                          <FormLabel>Confirmar</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
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
                        <FormLabel>Nombre de tu empresa <span className="text-slate-400 font-normal">(opcional)</span></FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Mi Agencia"
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
                    className="w-full bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 text-white font-medium"
                    disabled={isRegistering}
                  >
                    {isRegistering ? "Creando cuenta..." : "Crear cuenta gratis"}
                  </Button>
                  <p className="text-xs text-center text-slate-500">
                    Al registrarte, crearás una nueva empresa y serás el administrador.
                  </p>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
