import { lazy, Suspense, useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Toaster } from "@/lib/notify";
import { lazyWithRetry } from "@/lib/lazyWithRetry";
import { ScrollToTop } from "@/components/ScrollToTop";
import { CookieBanner } from "@/components/landing/CookieBanner";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { PublicLocaleSync } from "@/i18n/PublicLocaleSync";
import { RouteHreflangSync } from "@/seo/RouteHreflangSync";

const LandingPage = lazyWithRetry(() => import("./pages/LandingPage"));
const ArticlePage = lazyWithRetry(() => import("./pages/ArticlePage"));
const BlogPage = lazyWithRetry(() => import("./pages/BlogPage"));
const BlogArticleDynamicPage = lazyWithRetry(() => import("./pages/BlogArticleDynamicPage"));
const EmployeeDashboardLandingPage = lazyWithRetry(() => import("./pages/EmployeeDashboardLandingPage"));
const PlannerLandingPage = lazyWithRetry(() => import("./pages/PlannerLandingPage"));
const TeamLandingPage = lazyWithRetry(() => import("./pages/TeamLandingPage"));
const ReportsLandingPage = lazyWithRetry(() => import("./pages/ReportsLandingPage"));
const ProjectsLandingPage = lazyWithRetry(() => import("./pages/ProjectsLandingPage"));
const IntegrationsLandingPage = lazyWithRetry(() => import("./pages/IntegrationsLandingPage"));
const PpcMonitorLandingPage = lazyWithRetry(() => import("./pages/PpcMonitorLandingPage"));
const SecurityLandingPage = lazyWithRetry(() => import("./pages/SecurityLandingPage"));
const PrivacyPolicyPage = lazyWithRetry(() => import("./pages/PrivacyPolicyPage"));
const TermsOfServicePage = lazyWithRetry(() => import("./pages/TermsOfServicePage"));
const PreciosPage = lazyWithRetry(() => import("./pages/PreciosPage"));
const GuiaPage = lazyWithRetry(() => import("./pages/GuiaPage"));
const ApiDocsPage = lazyWithRetry(() => import("./pages/ApiDocsPage"));
const OpenApiViewerPage = lazyWithRetry(() => import("./pages/OpenApiViewerPage"));
const PresentationPage = lazyWithRetry(() => import("./pages/PresentationPage"));
const ContactoPage = lazyWithRetry(() => import("./pages/ContactoPage"));
const AudienceHubPage = lazyWithRetry(() =>
  import("./pages/AudienceLandingPage").then((m) => ({ default: m.AudienceHubPage })),
);
const PerformanceAudiencePage = lazyWithRetry(() =>
  import("./pages/AudienceLandingPage").then((m) => ({ default: m.PerformanceAudiencePage })),
);
const CreativeAudiencePage = lazyWithRetry(() =>
  import("./pages/AudienceLandingPage").then((m) => ({ default: m.CreativeAudiencePage })),
);
const FullServiceAudiencePage = lazyWithRetry(() =>
  import("./pages/AudienceLandingPage").then((m) => ({ default: m.FullServiceAudiencePage })),
);
const BlogPathSync = lazy(() =>
  import("@/i18n/BlogPathSync").then((m) => ({ default: m.BlogPathSync })),
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function PublicNotFound() {
  const { i18n } = useTranslation("landing");
  const en = i18n.language.startsWith("en");
  return (
    <div className="pub-stage pub-stage--plain min-h-screen bg-[#14123B]">
      <LandingHeader />
      <main className="mx-auto max-w-xl px-6 py-24 text-center">
        <h1 className="text-3xl font-semibold text-white">{en ? "Page not found" : "Página no encontrada"}</h1>
        <a href={en ? "/en" : "/"} className="mt-6 inline-flex text-[#C4B5FD] underline underline-offset-4">
          {en ? "Home" : "Inicio"}
        </a>
      </main>
      <LandingFooter variant="stage" />
    </div>
  );
}

/** El hero está fuera de #root para el LCP. Al salir de la home no debe seguir encima. */
function PrerenderHeroGate() {
  const { pathname } = useLocation();
  useEffect(() => {
    const hero = document.getElementById("prerender-hero");
    if (!hero) return;
    const home = pathname === "/" || pathname === "/en";
    hero.toggleAttribute("hidden", !home);
  }, [pathname]);
  return null;
}

function DeferredBlogPaths() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const win = window as Window & { requestIdleCallback?: (cb: () => void) => number };
    const id = win.requestIdleCallback
      ? win.requestIdleCallback(() => setReady(true))
      : window.setTimeout(() => setReady(true), 1200);
    return () => {
      if (typeof id === "number" && !win.requestIdleCallback) window.clearTimeout(id);
    };
  }, []);
  if (!ready) return null;
  return (
    <Suspense fallback={null}>
      <BlogPathSync />
    </Suspense>
  );
}

export function PublicApp() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter future={{ v7_relativeSplatPath: true }}>
          <PrerenderHeroGate />
          <PublicLocaleSync />
          <RouteHreflangSync />
          <DeferredBlogPaths />
          <Toaster />
          <ScrollToTop />
          <CookieBanner />
          <Suspense fallback={null}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/por-que-timeboxing" element={<ArticlePage />} />
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/blog/:slug" element={<BlogArticleDynamicPage />} />
              <Route path="/que-es-timeboxing" element={<Navigate to="/blog/que-es-timeboxing" replace />} />
              <Route path="/dashboard-empleado" element={<EmployeeDashboardLandingPage />} />
              <Route path="/planificador-recursos" element={<PlannerLandingPage />} />
              <Route path="/gestion-equipos" element={<TeamLandingPage />} />
              <Route path="/reportes-rentabilidad" element={<ReportsLandingPage />} />
              <Route path="/control-proyectos" element={<ProjectsLandingPage />} />
              <Route path="/integraciones" element={<IntegrationsLandingPage />} />
              <Route path="/monitor-ppc" element={<PpcMonitorLandingPage />} />
              <Route path="/seguridad" element={<SecurityLandingPage />} />
              <Route path="/para-quien" element={<AudienceHubPage />} />
              <Route path="/agencias-performance" element={<PerformanceAudiencePage />} />
              <Route path="/estudios-creativos" element={<CreativeAudiencePage />} />
              <Route path="/agencias-integrales" element={<FullServiceAudiencePage />} />
              <Route path="/privacidad" element={<PrivacyPolicyPage />} />
              <Route path="/condiciones" element={<TermsOfServicePage />} />
              <Route path="/precios" element={<PreciosPage />} />
              <Route path="/guia" element={<GuiaPage />} />
              <Route path="/guia/:section" element={<GuiaPage />} />
              <Route path="/contacto" element={<ContactoPage />} />
              <Route path="/api-docs" element={<ApiDocsPage />} />
              <Route path="/api-docs/openapi" element={<OpenApiViewerPage />} />
              <Route path="/pitch" element={<PresentationPage />} />
              <Route path="/en" element={<LandingPage />} />
              <Route path="/en/why-taimbox" element={<ArticlePage />} />
              <Route path="/en/blog" element={<BlogPage />} />
              <Route path="/en/blog/:slug" element={<BlogArticleDynamicPage />} />
              <Route path="/en/employee-dashboard" element={<EmployeeDashboardLandingPage />} />
              <Route path="/en/resource-planner" element={<PlannerLandingPage />} />
              <Route path="/en/team-management" element={<TeamLandingPage />} />
              <Route path="/en/reports-profitability" element={<ReportsLandingPage />} />
              <Route path="/en/project-control" element={<ProjectsLandingPage />} />
              <Route path="/en/integrations" element={<IntegrationsLandingPage />} />
              <Route path="/en/ppc-monitor" element={<PpcMonitorLandingPage />} />
              <Route path="/en/security" element={<SecurityLandingPage />} />
              <Route path="/en/who-its-for" element={<AudienceHubPage />} />
              <Route path="/en/performance-agencies" element={<PerformanceAudiencePage />} />
              <Route path="/en/creative-studios" element={<CreativeAudiencePage />} />
              <Route path="/en/full-service-agencies" element={<FullServiceAudiencePage />} />
              <Route path="/en/privacy" element={<PrivacyPolicyPage />} />
              <Route path="/en/terms" element={<TermsOfServicePage />} />
              <Route path="/en/pricing" element={<PreciosPage />} />
              <Route path="/en/guide" element={<GuiaPage />} />
              <Route path="/en/guide/:section" element={<GuiaPage />} />
              <Route path="/en/contact" element={<ContactoPage />} />
              <Route path="/en/api-docs" element={<ApiDocsPage />} />
              <Route path="/en/api-docs/openapi" element={<OpenApiViewerPage />} />
              <Route path="/en/pitch" element={<PresentationPage />} />
              <Route path="*" element={<PublicNotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </QueryClientProvider>
    </HelmetProvider>
  );
}
