import { Outlet, Link, useLocation } from "react-router-dom";
import { Building2, ArrowLeft, MessageSquare, BarChart3, FileText, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

import { useAppTranslation } from "@/hooks/useAppTranslation";

/**
 * Layout del área administrativa de plataforma.
 * No usa AgencyContext ni AppContext; solo Auth. Universo paralelo a la app principal.
 */
export function AdminLayout() {
  const { t } = useAppTranslation();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <header className="bg-slate-900 text-white border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild className="text-slate-300 hover:text-white">
            <Link to="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-1" />
              {t('admin.layout.backApp', 'Volver a la app')}
            </Link>
          </Button>
          <span className="text-slate-500">|</span>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-amber-400" />
            <span className="font-semibold">{t('admin.layout.title', 'Panel de administración')}</span>
          </div>
        </div>
        <nav className="flex gap-2">
          <Button
            variant={location.pathname.startsWith("/admin/agencies") ? "secondary" : "ghost"}
            size="sm"
            asChild
          >
            <Link to="/admin/agencies">{t('common.agencies', 'Agencias')}</Link>
          </Button>
          <Button
            variant={location.pathname.startsWith("/admin/admins") ? "secondary" : "ghost"}
            size="sm"
            asChild
          >
            <Link to="/admin/admins" className="gap-1">
              <Shield className="h-4 w-4" />
              {t('common.administrators', 'Administradores')}
            </Link>
          </Button>
          <Button
            variant={location.pathname.startsWith("/admin/support") ? "secondary" : "ghost"}
            size="sm"
            asChild
          >
            <Link to="/admin/support" className="gap-1">
              <MessageSquare className="h-4 w-4" />
              {t('common.support', 'Soporte')}
            </Link>
          </Button>
          <Button
            variant={location.pathname.startsWith("/admin/metrics") ? "secondary" : "ghost"}
            size="sm"
            asChild
          >
            <Link to="/admin/metrics" className="gap-1">
              <BarChart3 className="h-4 w-4" />
              {t('common.metrics', 'Métricas')}
            </Link>
          </Button>
          <Button
            variant={location.pathname.startsWith("/admin/docs") ? "secondary" : "ghost"}
            size="sm"
            asChild
          >
            <Link to="/admin/docs" className="gap-1">
              <FileText className="h-4 w-4" />
              Docs
            </Link>
          </Button>
        </nav>
      </header>
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}
