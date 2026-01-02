import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { Monitor } from 'lucide-react';

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

  // Aviso de acceso solo desde escritorio para todo el panel
  if (isMobile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
        <div className="text-center space-y-6 max-w-sm">
          <div className="mx-auto w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center">
            <Monitor className="h-10 w-10 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-800">Acceso desde escritorio</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              El panel de gestión está optimizado para pantallas de escritorio.
              Por favor, accede desde un ordenador para una mejor experiencia.
            </p>
          </div>
          <div className="pt-4">
            <p className="text-xs text-slate-400">
              Estamos trabajando en la versión móvil. ¡Pronto estará disponible!
            </p>
          </div>
        </div>
      </div>
    );
  }

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
