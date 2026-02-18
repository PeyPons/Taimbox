import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import { AgencyProvider } from "@/contexts/AgencyContext";
import { DepartmentViewProvider } from "@/contexts/DepartmentViewContext";
import { AppProvider } from "@/contexts/AppContext";
import { GoalsProvider } from "@/contexts/GoalsContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { NotificationProvider } from "@/contexts/NotificationContext";

// Componentes de auth
import Login from "./pages/Login";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { PermissionProtectedRoute } from "./components/auth/PermissionProtectedRoute";
import { PlatformAdminRoute } from "./components/auth/PlatformAdminRoute";
import { AdminLayout } from "./components/layout/AdminLayout";
import SuspendedPage from "./pages/SuspendedPage";
import AdminAgenciesPage from "./pages/admin/AdminAgenciesPage";
import AdminAdminsPage from "./pages/admin/AdminAdminsPage";
import AdminSupportPage from "./pages/admin/AdminSupportPage";
import AdminMetricsPage from "./pages/admin/AdminMetricsPage";
import AdminDocsPage from "./pages/admin/AdminDocsPage";

// Página principal (carga inmediata para mejor UX)
import EmployeeDashboard from "./pages/EmployeeDashboard";
import LandingPage from "./pages/LandingPage";
import ArticlePage from "./pages/ArticlePage";
import GuiaPage from "./pages/GuiaPage";
import ApiDocsPage from "./pages/ApiDocsPage";
import { ModuleGuard } from "./components/auth/ModuleGuard";
import { BrandingEffect } from "./components/layout/BrandingEffect";
import { ScrollToTop } from "./components/ScrollToTop";

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
      // No recargar automáticamente para evitar bucles infinitos
      throw error;
    })
  );
};

// Páginas con lazy loading (carga diferida para mejor rendimiento)
// Usando lazyWithRetry para manejar errores de carga de módulos
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
const AgenciesPage = lazyWithRetry(() => import("./pages/AgenciesPage"));
const AgencyManagementPage = lazyWithRetry(() => import("./pages/AgencyManagementPage"));
const TeamCapacityPage = lazyWithRetry(() => import("./pages/TeamCapacityPage"));
const OnboardingWizard = lazyWithRetry(() => import("./components/onboarding/OnboardingWizard"));
const NotFound = lazyWithRetry(() => import("./pages/NotFound"));
const TeamPulsePage = lazyWithRetry(() => import("./pages/TeamPulsePage"));
const ApiKeysPage = lazyWithRetry(() => import("./pages/ApiKeysPage"));
const ContactSupportPage = lazyWithRetry(() => import("./pages/ContactSupportPage"));
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
          <DepartmentViewProvider>
            <AppProvider>
              <GoalsProvider>
                <NotificationProvider>
                  <TooltipProvider>
                    <Toaster />
                    <Sonner />
                    <BrandingEffect />
                    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                      <ScrollToTop />
                      <Routes>
                        {/* Página de inicio (Landing) */}
                        <Route path="/" element={<LandingPage />} />

                        {/* Artículo: por qué Timeboxing (página pública) */}
                        <Route path="/por-que-timeboxing" element={<ArticlePage />} />

                        {/* Guía de funcionalidades (páginas públicas detalladas) */}
                        <Route path="/guia" element={<GuiaPage />} />
                        <Route path="/guia/:section" element={<GuiaPage />} />

                        {/* Documentación API (pública) */}
                        <Route path="/api-docs" element={<ApiDocsPage />} />

                        {/* Ruta pública Login */}
                        <Route path="/login" element={<Login />} />

                        {/* Rutas Protegidas */}
                        <Route element={<ProtectedRoute />}>
                          {/* Onboarding Wizard (sin AppLayout) */}
                          <Route path="/onboarding" element={<Suspense fallback={<PageLoader />}><OnboardingWizard /></Suspense>} />

                          {/* Suspended: fuera de AppLayout, solo sesión */}
                          <Route path="/suspended" element={<SuspendedPage />} />

                          {/* Área admin: sin AgencyContext, solo platform_admin */}
                          <Route path="/admin" element={<PlatformAdminRoute />}>
                            <Route element={<AdminLayout />}>
                              <Route index element={<Navigate to="/admin/agencies" replace />} />
                              <Route path="agencies" element={<Suspense fallback={<PageLoader />}><AdminAgenciesPage /></Suspense>} />
                              <Route path="admins" element={<Suspense fallback={<PageLoader />}><AdminAdminsPage /></Suspense>} />
                              <Route path="support" element={<Suspense fallback={<PageLoader />}><AdminSupportPage /></Suspense>} />
                              <Route path="metrics" element={<Suspense fallback={<PageLoader />}><AdminMetricsPage /></Suspense>} />
                              <Route path="docs" element={<Suspense fallback={<PageLoader />}><AdminDocsPage /></Suspense>} />
                            </Route>
                          </Route>

                          <Route element={<AppLayout />}>
                            {/* Dashboard Personal */}
                            <Route path="/dashboard" element={<EmployeeDashboard />} />

                            {/* Resto de rutas protegidas por permisos - con Suspense para lazy loading */}
                            <Route path="/planner" element={<Suspense fallback={<PageLoader />}><PermissionProtectedRoute requiredPermission="/planner"><Index /></PermissionProtectedRoute></Suspense>} />
                            <Route path="/deadlines" element={<Suspense fallback={<PageLoader />}><PermissionProtectedRoute requiredPermission="/deadlines"><ModuleGuard module="deadlines"><DeadlinesPage /></ModuleGuard></PermissionProtectedRoute></Suspense>} />
                            <Route path="/team" element={<Suspense fallback={<PageLoader />}><PermissionProtectedRoute requiredPermission="/team"><TeamPage /></PermissionProtectedRoute></Suspense>} />
                            <Route path="/team/pulse" element={<Suspense fallback={<PageLoader />}><TeamPulsePage /></Suspense>} />
                            <Route path="/team-capacity" element={<Suspense fallback={<PageLoader />}><PermissionProtectedRoute requiredPermission="/team-capacity"><TeamCapacityPage /></PermissionProtectedRoute></Suspense>} />
                            <Route path="/clients" element={<Suspense fallback={<PageLoader />}><PermissionProtectedRoute requiredPermission="/clients"><ClientsAndProjectsPage /></PermissionProtectedRoute></Suspense>} />
                            <Route path="/projects" element={<Suspense fallback={<PageLoader />}><PermissionProtectedRoute requiredPermission="/projects"><ClientsAndProjectsPage /></PermissionProtectedRoute></Suspense>} />
                            <Route path="/okrs" element={<Suspense fallback={<PageLoader />}><PermissionProtectedRoute requiredPermission="/okrs"><OkrsPage /></PermissionProtectedRoute></Suspense>} />
                            <Route path="/reports" element={<Suspense fallback={<PageLoader />}><PermissionProtectedRoute requiredPermission="/reports"><ReportsPage /></PermissionProtectedRoute></Suspense>} />
                            <Route path="/informes-clientes" element={<Suspense fallback={<PageLoader />}><PermissionProtectedRoute requiredPermission="/informes-clientes"><ClientReportsPage /></PermissionProtectedRoute></Suspense>} />
                            <Route path="/settings" element={<Suspense fallback={<PageLoader />}><PermissionProtectedRoute requiredPermission="/settings"><SettingsPage /></PermissionProtectedRoute></Suspense>} />
                            <Route path="/agency" element={<Suspense fallback={<PageLoader />}><PermissionProtectedRoute requiredPermission="/agency"><AgencySettingsPage /></PermissionProtectedRoute></Suspense>} />
                            <Route path="/agencies" element={<Suspense fallback={<PageLoader />}><AgenciesPage /></Suspense>} />
                            <Route path="/agencies/:id/manage" element={<Suspense fallback={<PageLoader />}><PermissionProtectedRoute requiredPermission="/settings"><AgencyManagementPage /></PermissionProtectedRoute></Suspense>} />
                            <Route path="/ads" element={<Suspense fallback={<PageLoader />}><PermissionProtectedRoute requiredPermission="/ads"><ModuleGuard module="ppc"><AdsPage /></ModuleGuard></PermissionProtectedRoute></Suspense>} />
                            <Route path="/meta-ads" element={<Suspense fallback={<PageLoader />}><PermissionProtectedRoute requiredPermission="/meta-ads"><ModuleGuard module="ppc"><MetaAdsPage /></ModuleGuard></PermissionProtectedRoute></Suspense>} />
                            <Route path="/weekly-forecast" element={<Suspense fallback={<PageLoader />}><PermissionProtectedRoute requiredPermission="/weekly-forecast"><ModuleGuard module="weeklyFeedback"><WeeklyForecastPage /></ModuleGuard></PermissionProtectedRoute></Suspense>} />
                            <Route path="/api-keys" element={<Suspense fallback={<PageLoader />}><PermissionProtectedRoute requiredPermission="/api-keys"><ApiKeysPage /></PermissionProtectedRoute></Suspense>} />
                            <Route path="/soporte" element={<Suspense fallback={<PageLoader />}><PermissionProtectedRoute requiredPermission="/soporte"><ContactSupportPage /></PermissionProtectedRoute></Suspense>} />
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
          </DepartmentViewProvider>
        </AgencyProvider>
      </AuthProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
