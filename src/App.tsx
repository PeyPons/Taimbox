import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppProvider } from "@/contexts/AppContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";

// Componentes de Auth
import Login from "./pages/Login";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { PermissionProtectedRoute } from "./components/auth/PermissionProtectedRoute";

// Página principal (carga inmediata para mejor UX)
import EmployeeDashboard from "./pages/EmployeeDashboard";

// Loading fallback para páginas lazy
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="h-8 w-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
  </div>
);

// Error boundary para lazy loading
const LazyErrorFallback = ({ error, retry }: { error: Error; retry: () => void }) => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="text-center p-8">
      <h2 className="text-xl font-semibold text-slate-900 mb-2">Error al cargar la página</h2>
      <p className="text-slate-600 mb-4">{error.message}</p>
      <Button onClick={retry} className="bg-indigo-600 hover:bg-indigo-700">
        Reintentar
      </Button>
    </div>
  </div>
);

// Wrapper para lazy loading con manejo de errores
// DEBE estar ANTES de su uso para evitar "Cannot access before initialization"
const lazyWithRetry = (importFn: () => Promise<any>) => {
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
const AdsReportGenerator = lazyWithRetry(() => import("./pages/AdsReportGenerator"));
const DeadlinesPage = lazyWithRetry(() => import("./pages/DeadlinesPage"));
const WeeklyForecastPage = lazyWithRetry(() => import("./pages/WeeklyForecastPage"));
const NotFound = lazyWithRetry(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                {/* Ruta pública Login */}
                <Route path="/login" element={<Login />} />

                {/* Rutas Protegidas */}
                <Route element={<ProtectedRoute />}>
                  <Route element={<AppLayout />}>
                    {/* Dashboard Personal como página de inicio - Siempre accesible */}
                    <Route path="/" element={<EmployeeDashboard />} />

                    {/* Resto de rutas protegidas por permisos - con Suspense para lazy loading */}
                    <Route path="/planner" element={<Suspense fallback={<PageLoader />}><PermissionProtectedRoute requiredPermission="/planner"><Index /></PermissionProtectedRoute></Suspense>} />
                    <Route path="/deadlines" element={<Suspense fallback={<PageLoader />}><PermissionProtectedRoute requiredPermission="/deadlines"><DeadlinesPage /></PermissionProtectedRoute></Suspense>} />
                    <Route path="/team" element={<Suspense fallback={<PageLoader />}><PermissionProtectedRoute requiredPermission="/team"><TeamPage /></PermissionProtectedRoute></Suspense>} />
                    <Route path="/clients" element={<Suspense fallback={<PageLoader />}><PermissionProtectedRoute requiredPermission="/clients"><ClientsAndProjectsPage /></PermissionProtectedRoute></Suspense>} />
                    <Route path="/projects" element={<Suspense fallback={<PageLoader />}><PermissionProtectedRoute requiredPermission="/projects"><ClientsAndProjectsPage /></PermissionProtectedRoute></Suspense>} />
                    <Route path="/reports" element={<Suspense fallback={<PageLoader />}><PermissionProtectedRoute requiredPermission="/reports"><ReportsPage /></PermissionProtectedRoute></Suspense>} />
                    <Route path="/informes-clientes" element={<Suspense fallback={<PageLoader />}><PermissionProtectedRoute requiredPermission="/informes-clientes"><ClientReportsPage /></PermissionProtectedRoute></Suspense>} />
                    <Route path="/settings" element={<Suspense fallback={<PageLoader />}><SettingsPage /></Suspense>} />
                    <Route path="/ads" element={<Suspense fallback={<PageLoader />}><PermissionProtectedRoute requiredPermission="/ads"><AdsPage /></PermissionProtectedRoute></Suspense>} />
                    <Route path="/meta-ads" element={<Suspense fallback={<PageLoader />}><PermissionProtectedRoute requiredPermission="/meta-ads"><MetaAdsPage /></PermissionProtectedRoute></Suspense>} />
                    <Route path="/ads-reports" element={<Suspense fallback={<PageLoader />}><PermissionProtectedRoute requiredPermission="/ads-reports"><AdsReportGenerator /></PermissionProtectedRoute></Suspense>} />
                    <Route path="/weekly-forecast" element={<Suspense fallback={<PageLoader />}><PermissionProtectedRoute requiredPermission="/planner"><WeeklyForecastPage /></PermissionProtectedRoute></Suspense>} />
                    <Route path="/dashboard-ai" element={<Suspense fallback={<PageLoader />}><DashboardAI /></Suspense>} />
                  </Route>
                </Route>

                {/* 404 */}
                <Route path="*" element={<Suspense fallback={<PageLoader />}><NotFound /></Suspense>} />
                
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AppProvider>
      </AuthProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
