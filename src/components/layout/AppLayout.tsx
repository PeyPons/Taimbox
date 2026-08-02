import { Suspense, useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { PageLoader } from './PageLoader';
import { RouteErrorBoundary } from '@/components/routing/RouteErrorBoundary';
import { Header } from './Header';
import { ImpersonationProvider } from '@/components/admin/ImpersonationBanner';
import { DepartmentViewBanner } from '@/components/layout/DepartmentViewBanner';
import { SubscriptionSoftLockBanner } from '@/components/layout/SubscriptionSoftLockBanner';
import { PlannerMonthBanner } from '@/components/layout/PlannerMonthBanner';
import { PrivacyDemoIndicator } from '@/components/privacy/PrivacyDemoIndicator';
import { useAllocationNotesRealtime } from '@/hooks/useAllocationNotes';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

export function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isMobile = useIsMobile();
  const location = useLocation();
  useAllocationNotesRealtime();

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  return (
    <ImpersonationProvider>
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header onMenuClick={() => setIsSidebarOpen(true)} />
      {/*
        En móvil el Header es fixed (h-16). Los banners deben vivir DENTRO del
        offset (pt-16), no debajo del header a medias + margin-top del main
        (eso dejaba el texto del aviso tapado y un hueco blanco).
      */}
      <div className="flex flex-col flex-1 min-w-0 pt-16 lg:pt-0">
        <SubscriptionSoftLockBanner />
        <DepartmentViewBanner />
        <PlannerMonthBanner />
        <PrivacyDemoIndicator />

        <div className="flex flex-1 min-w-0">
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />

          <main className={cn(
            "flex-1 min-w-0 min-h-0 transition-all duration-300 max-w-full w-full",
            "lg:ml-64",
          )}>
            <RouteErrorBoundary resetKey={location.pathname}>
              <Suspense key={location.pathname} fallback={<PageLoader />}>
                <Outlet />
              </Suspense>
            </RouteErrorBoundary>
          </main>
        </div>
      </div>
    </div>
    </ImpersonationProvider>
  );
}
