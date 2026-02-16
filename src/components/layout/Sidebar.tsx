import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { NavLink } from '@/components/NavLink';
import { useApp } from '@/contexts/AppContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useAgency } from '@/contexts/AgencyContext';
import { useAuth } from '@/contexts/AuthContext';
import { AgencySelectorCompact } from '@/components/agencies/AgencySelectorCompact';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  BarChart3,
  FolderKanban,
  Settings,
  Megaphone,
  Facebook,
  FileDown,
  LogOut,
  Home,
  Calendar,
  TrendingUp,
  Rocket,
  ChevronRight,
  ChevronDown,
  X,
  User
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavGroupProps {
  label: string;
  icon?: any;
  children: React.ReactNode;
  isActive?: boolean;
}

function NavGroup({ label, icon: Icon, children, isActive = false }: NavGroupProps) {
  const [isOpen, setIsOpen] = useState(isActive);

  // Auto-open if a child is active
  useEffect(() => {
    if (isActive) setIsOpen(true);
  }, [isActive]);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full space-y-1">
      <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 rounded-md transition-colors group">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4" />}
          <span>{label}</span>
        </div>
        <ChevronRight className={cn("h-4 w-4 transition-transform duration-200", isOpen && "rotate-90")} />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-1 pl-4 animate-in slide-in-from-top-1 data-[state=closed]:animate-out data-[state=closed]:slide-out-to-top-1 duration-200 overflow-hidden">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useApp();
  const { canAccess } = usePermissions();
  const { currentAgency } = useAgency();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const modules = currentAgency?.settings?.modules || {
    seo: true,
    ppc: true,
    weeklyFeedback: true,
    professionalGoals: true,
    deadlines: true
  };

  const isSuperior = canAccess('/planner') || canAccess('/team') || canAccess('/reports') || canAccess('/settings');

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      <aside className={cn(
        "bg-slate-900 text-white flex flex-col h-screen fixed left-0 top-0 border-r border-slate-800 z-50 transition-transform duration-300 ease-in-out w-64",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>

        {/* Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <LayoutDashboard className="h-5 w-5 text-white" />
            </div>
            <span className="text-slate-100">Timeboxing</span>
          </div>

          <div className="flex items-center gap-1">
            <div className="hidden lg:block">
              <NotificationBell />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="lg:hidden text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">

          <div className="mb-6">
            <NavLink to="/dashboard" icon={Home} active={location.pathname === '/dashboard'}>
              Mi espacio
            </NavLink>
          </div>

          {/* Employee View: Simple & Focused */}
          {!isSuperior && (
            <>
              {modules.deadlines && canAccess('/deadlines') && (
                <NavLink to="/deadlines" icon={Calendar} active={location.pathname === '/deadlines'}>
                  Deadlines
                </NavLink>
              )}
            </>
          )}

          {/* Superior View: Grouped Command Center */}
          {isSuperior && (
            <div className="space-y-4">
              {/* PLANIFICACIÓN */}
              {(canAccess('/planner') || (modules.deadlines && canAccess('/deadlines')) || (modules.weeklyFeedback && canAccess('/weekly-forecast'))) && (
                <NavGroup
                  label="Planificación"
                  isActive={location.pathname === '/planner' || location.pathname === '/deadlines' || location.pathname === '/weekly-forecast'}
                >
                  {canAccess('/planner') && (
                    <NavLink to="/planner" icon={LayoutDashboard} active={location.pathname === '/planner'}>
                      Planificador
                    </NavLink>
                  )}
                  {modules.deadlines && canAccess('/deadlines') && (
                    <NavLink to="/deadlines" icon={Calendar} active={location.pathname === '/deadlines'}>
                      Deadlines
                    </NavLink>
                  )}
                  {modules.weeklyFeedback && canAccess('/weekly-forecast') && (
                    <NavLink to="/weekly-forecast" icon={TrendingUp} active={location.pathname === '/weekly-forecast'}>
                      Weekly
                    </NavLink>
                  )}
                </NavGroup>
              )}

              {/* EQUIPO */}
              {(canAccess('/team') || canAccess('/team-capacity') || canAccess('/okrs')) && (
                <NavGroup
                  label="Equipo"
                  isActive={['/team', '/team-capacity', '/okrs'].includes(location.pathname)}
                >
                  {canAccess('/team') && (
                    <NavLink to="/team" icon={Users} active={location.pathname === '/team'}>
                      Miembros
                    </NavLink>
                  )}
                  {canAccess('/team-capacity') && (
                    <NavLink to="/team-capacity" icon={TrendingUp} active={location.pathname === '/team-capacity'}>
                      Capacidad
                    </NavLink>
                  )}
                  {canAccess('/okrs') && (
                    <NavLink to="/okrs" icon={Rocket} active={location.pathname === '/okrs'}>
                      Objetivos
                    </NavLink>
                  )}
                </NavGroup>
              )}

              {/* PROYECTOS */}
              {(canAccess('/projects') || canAccess('/clients')) && (
                <NavGroup
                  label="Cartera"
                  isActive={['/clients', '/projects'].includes(location.pathname)}
                >
                  <NavLink
                    to={canAccess('/clients') ? "/clients" : "/projects"}
                    icon={Briefcase}
                    active={location.pathname === '/clients' || location.pathname === '/projects'}
                  >
                    Clientes y proyectos
                  </NavLink>
                </NavGroup>
              )}

              {/* PPC */}
              {modules.ppc && (canAccess('/ads') || canAccess('/meta-ads')) && (
                <NavGroup
                  label="PPC & medios"
                  isActive={['/ads', '/meta-ads'].includes(location.pathname)}
                >
                  {canAccess('/ads') && (
                    <NavLink to="/ads" icon={Megaphone} active={location.pathname === '/ads'}>
                      Google Ads
                    </NavLink>
                  )}
                  {canAccess('/meta-ads') && (
                    <NavLink to="/meta-ads" icon={Facebook} active={location.pathname === '/meta-ads'}>
                      Meta Ads
                    </NavLink>
                  )}
                </NavGroup>
              )}

              {/* ANÁLISIS */}
              {(canAccess('/reports') || canAccess('/informes-clientes')) && (
                <NavGroup
                  label="Análisis"
                  isActive={['/reports', '/informes-clientes'].includes(location.pathname)}
                >
                  {canAccess('/reports') && (
                    <NavLink to="/reports" icon={BarChart3} active={location.pathname === '/reports'}>
                      Reportes
                    </NavLink>
                  )}
                  {canAccess('/informes-clientes') && (
                    <NavLink to="/informes-clientes" icon={FileDown} active={location.pathname === '/informes-clientes'}>
                      Informes clientes
                    </NavLink>
                  )}
                </NavGroup>
              )}
            </div>
          )}

        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/30 space-y-3">
          {currentUser ? (
            <>
              <div className="px-2 flex items-center gap-3 group">
                <Avatar className="h-8 w-8 border border-primary/30">
                  <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} />
                  <AvatarFallback className="bg-primary text-white">
                    {currentUser?.name?.charAt(0) || <User className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 overflow-hidden min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate" title={currentUser.name}>
                    {currentUser.first_name || currentUser.name}
                  </p>
                  <p className="text-xs text-slate-500 truncate" title={currentUser.email}>
                    {currentUser.email}
                  </p>
                </div>

                <button
                  onClick={handleLogout}
                  className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-950/30 rounded-md transition-colors"
                  title="Cerrar sesión"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
              
              {/* Agency Selector Compacto - Al final del footer */}
              <AgencySelectorCompact />
            </>
          ) : (
            <div className="px-2 flex items-center gap-3 opacity-50">
              <div className="h-8 w-8 rounded-full bg-slate-800 animate-pulse" />
              <div className="space-y-1">
                <div className="h-2 w-20 bg-slate-800 rounded animate-pulse" />
                <div className="h-2 w-16 bg-slate-800 rounded animate-pulse" />
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
