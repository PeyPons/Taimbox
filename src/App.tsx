import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import { AgencyProvider } from "@/contexts/AgencyContext";
import { AppProvider } from "@/contexts/AppContext";
import { GoalsProvider } from "@/contexts/GoalsContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { NotificationProvider } from "@/contexts/NotificationContext";

// Componentes de auth
import Login from "./pages/Login";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { PermissionProtectedRoute } from "./components/auth/PermissionProtectedRoute";

// Página principal (carga inmediata para mejor UX)
import EmployeeDashboard from "./pages/EmployeeDashboard";
import LandingPage from "./pages/LandingPage";
import { ModuleGuard } from "./components/auth/ModuleGuard";
import { BrandingEffect } from "./components/layout/BrandingEffect";

// Loading fallback para páginas lazy
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="h-8 w-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
  </div>
);

// Error boundary para lazy loading
const LazyErrorFallback = ({ error, retry }: { error: Error; retry: () => void }) => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="text-center p-8">
      <h2 className="text-xl font-semibold text-slate-900 mb-2">Error al cargar la página</h2>
      <p className="text-slate-600 mb-4">{error.message}</p>
      <Button onClick={retry} className="bg-primary hover:bg-primary/90">
        Reintentar
      </Button>
    </div>
  </div>
);

// Wrapper para lazy loading con manejo de errores
// DEBE estar ANTES de su uso para evitar "Cannot access before initialization"
const lazyWithRetry = (importFn: () => Promise<{ default: React.ComponentType<unknown> }>) => {
  return lazy(() =>
    importFn().catch((error) => {
      console.error('Error cargando módulo:', error);
      // Si el error es de tipo MIME o fetch, intentar recargar la página
      if (error.message?.includes('MIME type') || error.message?.includes('Failed to fetch')) {
        console.warn('Error de servidor detectado, recargando página...');
        window.location.reload();
        throw error;
      }
      throw error;
    })
  );
};

// Páginas con lazy loading (carga diferida para mejor rendimiento)
// Usando lazyWithRetry para manejar errores de carga de módulos
const DashboardAI = lazyWithRetry(() => import("./pages/DashboardAI"));
const ClientReportsPage = lazyWithRetry(() => import("@/pages/ClientReportsPage"));
const Index = lazyWithRetry(() => import("./pages/Index"));
const TeamPage = lazyWithRetry(() => import("./pages/TeamPage"));
const ClientsAndProjectsPage = lazyWithRetry(() => import("./pages/ClientsAndProjectsPage"));
const ReportsPage = lazyWithRetry(() => import("./pages/ReportsPage"));
const SettingsPage = lazyWithRetry(() => import("./pages/SettingsPage"));
const MetaAdsPage = lazyWithRetry(() => import("./pages/MetaAdsPage"));
const AdsPage = lazyWithRetry(() => import("@/pages/AdsPage"));
const DeadlinesPage = lazyWithRetry(() => import("./pages/DeadlinesPage"));
const WeeklyForecastPage = lazyWithRetry(() => import("./pages/WeeklyForecastPage"));
const OkrsPage = lazyWithRetry(() => import("./pages/OkrsPage"));
const AgencySettingsPage = lazyWithRetry(() => import("./pages/AgencySettingsPage"));
const TeamCapacityPage = lazyWithRetry(() => import("./pages/TeamCapacityPage"));
const OnboardingWizard = lazyWithRetry(() => import("./components/onboarding/OnboardingWizard"));
const NotFound = lazyWithRetry(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos - datos se consideran frescos
      gcTime: 30 * 60 * 1000, // 30 minutos - tiempo en cache (antes cacheTime)
      refetchOnWindowFocus: false, // No refetch al cambiar de pestaña
      retry: 1, // Solo 1 reintento en caso de error
    },
  },
});

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AgencyProvider>
          <AppProvider>
            <GoalsProvider>
              <NotificationProvider>
                <TooltipProvider>
                  <Toaster />
                  <Sonner />
                  <BrandingEffect />
                  <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                    <Routes>
                      {/* Ruta pública Landing */}
                      <Route path="/" element={<LandingPage />} />

                      {/* Ruta pública Login */}
                      <Route path="/login" element={<Login />} />

                      {/* Rutas Protegidas */}
                      <Route element={<ProtectedRoute />}>
                        {/* Onboarding Wizard (sin AppLayout) */}
                        <Route path="/onboarding" element={<Suspense fallback={<PageLoader />}><OnboardingWizard /></Suspense>} />

                        <Route element={<AppLayout />}>
                          {/* Dashboard Personal */}
                          <Route path="/dashboard" element={<EmployeeDashboard />} />

                          {/* Resto de rutas protegidas por permisos - con Suspense para lazy loading */}
                          <Route path="/planner" element={<Suspense fallback={<PageLoader />}><PermissionProtectedRoute requiredPermission="/planner"><Index /></PermissionProtectedRoute></Suspense>} />
                          <Route path="/deadlines" element={<Suspense fallback={<PageLoader />}><PermissionProtectedRoute requiredPermission="/deadlines"><ModuleGuard module="deadlines"><DeadlinesPage /></ModuleGuard></PermissionProtectedRoute></Suspense>} />
                          <Route path="/team" element={<Suspense fallback={<PageLoader />}><PermissionProtectedRoute requiredPermission="/team"><TeamPage /></PermissionProtectedRoute></Suspense>} />
                          <Route path="/team-capacity" element={<Suspense fallback={<PageLoader />}><PermissionProtectedRoute requiredPermission="/team-capacity"><TeamCapacityPage /></PermissionProtectedRoute></Suspense>} />
                          <Route path="/clients" element={<Suspense fallback={<PageLoader />}><PermissionProtectedRoute requiredPermission="/clients"><ClientsAndProjectsPage /></PermissionProtectedRoute></Suspense>} />
                          <Route path="/projects" element={<Suspense fallback={<PageLoader />}><PermissionProtectedRoute requiredPermission="/projects"><ClientsAndProjectsPage /></PermissionProtectedRoute></Suspense>} />
                          <Route path="/okrs" element={<Suspense fallback={<PageLoader />}><PermissionProtectedRoute requiredPermission="/okrs"><OkrsPage /></PermissionProtectedRoute></Suspense>} />
                          <Route path="/reports" element={<Suspense fallback={<PageLoader />}><PermissionProtectedRoute requiredPermission="/reports"><ReportsPage /></PermissionProtectedRoute></Suspense>} />
                          <Route path="/informes-clientes" element={<Suspense fallback={<PageLoader />}><PermissionProtectedRoute requiredPermission="/informes-clientes"><ClientReportsPage /></PermissionProtectedRoute></Suspense>} />
                          <Route path="/settings" element={<Suspense fallback={<PageLoader />}><PermissionProtectedRoute requiredPermission="/settings"><SettingsPage /></PermissionProtectedRoute></Suspense>} />
                          <Route path="/agency" element={<Suspense fallback={<PageLoader />}><PermissionProtectedRoute requiredPermission="/settings"><AgencySettingsPage /></PermissionProtectedRoute></Suspense>} />
                          <Route path="/ads" element={<Suspense fallback={<PageLoader />}><PermissionProtectedRoute requiredPermission="/ads"><ModuleGuard module="ppc"><AdsPage /></ModuleGuard></PermissionProtectedRoute></Suspense>} />
                          <Route path="/meta-ads" element={<Suspense fallback={<PageLoader />}><PermissionProtectedRoute requiredPermission="/meta-ads"><ModuleGuard module="ppc"><MetaAdsPage /></ModuleGuard></PermissionProtectedRoute></Suspense>} />
                          <Route path="/weekly-forecast" element={<Suspense fallback={<PageLoader />}><PermissionProtectedRoute requiredPermission="/weekly-forecast"><ModuleGuard module="weeklyFeedback"><WeeklyForecastPage /></ModuleGuard></PermissionProtectedRoute></Suspense>} />
                          <Route path="/dashboard-ai" element={<Suspense fallback={<PageLoader />}><DashboardAI /></Suspense>} />
                        </Route>
                      </Route>

                      {/* 404 */}
                      <Route path="*" element={<Suspense fallback={<PageLoader />}><NotFound /></Suspense>} />

                    </Routes>
                  </BrowserRouter>
                </TooltipProvider>
              </NotificationProvider>
            </GoalsProvider>
          </AppProvider>
        </AgencyProvider>
      </AuthProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
