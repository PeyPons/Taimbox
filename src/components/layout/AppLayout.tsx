import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
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
      <Header onMenuClick={() => setIsSidebarOpen(true)} />

      <div className="flex flex-1">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        <main className={cn(
          "flex-1 min-h-screen transition-all duration-300 overflow-x-hidden max-w-full",
          "lg:ml-64", // Margin on desktop
          "mt-16 lg:mt-0" // Top margin on mobile for header
        )}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
