import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ImpersonationBanner } from '@/components/admin/ImpersonationBanner';
import { DepartmentViewBanner } from '@/components/layout/DepartmentViewBanner';
import { SubscriptionSoftLockBanner } from '@/components/layout/SubscriptionSoftLockBanner';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

export function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isMobile = useIsMobile();
  const location = useLocation();

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <ImpersonationBanner />
      <Header onMenuClick={() => setIsSidebarOpen(true)} />
      <DepartmentViewBanner />
      <SubscriptionSoftLockBanner />

      <div className="flex flex-1">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        <main className={cn(
          "flex-1 min-w-0 min-h-screen transition-all duration-300 overflow-x-hidden max-w-full w-full",
          "lg:ml-64",
          "main-content-area" // En móvil: header + banner impersonación (CSS variable)
        )}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
