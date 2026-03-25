import { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { NavLink } from '@/components/NavLink';
import { useApp } from '@/contexts/AppContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useAgency } from '@/contexts/AgencyContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePlatformAdmin } from '@/hooks/usePlatformAdmin';
import { AgencySelectorCompact } from '@/components/agencies/AgencySelectorCompact';
import { DepartmentViewSelector } from '@/components/layout/DepartmentViewSelector';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  BarChart3,
  FolderKanban,
  Settings,
  Megaphone,
  Facebook,
  LogOut,
  Home,
  Calendar,
  Rocket,
  ChevronRight,
  ChevronDown,
  X,
  User,
  Presentation,
  Key,
  Shield,
  MessageCircle,
  Building2,
  Clock,
  Square,
  Activity,
  DollarSign,
  FileText,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { useActiveTimerForSidebar } from '@/hooks/useActiveTimerForSidebar';
import { SensitiveText } from '@/components/privacy/SensitiveText';
import { SidebarImpersonationPanel } from '@/components/admin/ImpersonationBanner';
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
  const { currentUser, employees, projects } = useApp();
  const { canAccess, hasPermission } = usePermissions();
  const { currentAgency, availableAgencies } = useAgency();

  const showPitchBanner = useMemo(() => {
    if (!currentAgency?.id || !hasPermission('can_access_agency_settings')) return false;
    const isEmpty = (employees?.length ?? 0) === 0 && (projects?.length ?? 0) === 0;
    return isEmpty;
  }, [currentAgency?.id, employees?.length, projects?.length, hasPermission]);

  const pitchBannerDismissedKey = `timeboxing_pitch_banner_dismissed_${currentAgency?.id ?? ''}`;
  const [pitchBannerDismissed, setPitchBannerDismissed] = useState(() => {
    try {
      return localStorage.getItem(pitchBannerDismissedKey) === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (!showPitchBanner) return;
    try {
      setPitchBannerDismissed(localStorage.getItem(pitchBannerDismissedKey) === '1');
    } catch {
      setPitchBannerDismissed(false);
    }
  }, [showPitchBanner, pitchBannerDismissedKey]);

  const dismissPitchBanner = () => {
    try {
      localStorage.setItem(pitchBannerDismissedKey, '1');
      setPitchBannerDismissed(true);
    } catch {
      setPitchBannerDismissed(true);
    }
  };
  const hasMultipleAgencies = (availableAgencies?.length || 0) > 1;
  const hasAgencyPaths = location.pathname === '/agency' || location.pathname === '/agencies' || location.pathname.startsWith('/agencies/');
  const searchParams = new URLSearchParams(location.search || '');
  const isAgenciesCreate = location.pathname === '/agencies' && searchParams.get('action') === 'create';
  const { signOut } = useAuth();
  const { isPlatformAdmin } = usePlatformAdmin();

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
    deadlines: true,
    timeTracker: false
  };

  const isTimeTrackerEnabled = (modules.timeTracker === true) && (currentUser?.user_id != null);
  const activeTimer = useActiveTimerForSidebar(isTimeTrackerEnabled ? currentUser?.id : undefined);

  // Tiempo mostrado en tiempo real (cada 1s) sin tocar el polling del hook (60s)
  const startedAtRef = useRef<number>(0);
  const [displayElapsedSeconds, setDisplayElapsedSeconds] = useState(0);
  useEffect(() => {
    if (activeTimer.isActive && activeTimer.elapsedSeconds >= 0) {
      startedAtRef.current = Date.now() - activeTimer.elapsedSeconds * 1000;
      setDisplayElapsedSeconds(activeTimer.elapsedSeconds);
    }
  }, [activeTimer.isActive, activeTimer.elapsedSeconds]);
  useEffect(() => {
    if (!activeTimer.isActive) return;
    const tick = () => setDisplayElapsedSeconds(Math.max(0, Math.floor((Date.now() - startedAtRef.current) / 1000)));
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [activeTimer.isActive]);
  const formattedLiveTime = (() => {
    const s = displayElapsedSeconds;
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  })();

  const isSuperior = canAccess('/planner') || canAccess('/team') || canAccess('/operaciones') || canAccess('/finanzas') || canAccess('/settings');

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
            <span className="text-slate-100">Taimbox</span>
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

          {/* Cronómetro: tarea primero, cliente debajo (UX clara) */}
          {isTimeTrackerEnabled && (
            <div className="mb-4 px-3 py-2 rounded-lg bg-slate-800/60 border border-slate-700/50 min-w-0">
              <div className="flex items-start gap-2 min-w-0 mb-1.5">
                <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <div
                    className="text-slate-200 text-xs font-medium truncate"
                    title={activeTimer.isActive ? (activeTimer.taskName || '') + (activeTimer.clientName ? ` · Cliente: ${activeTimer.clientName}` : '') : undefined}
                  >
                    {activeTimer.isActive ? (activeTimer.taskName || 'Tarea en curso') : 'Total registrado'}
                  </div>
                  {activeTimer.isActive && activeTimer.clientName && (
                    <div className="text-[11px] text-slate-500 truncate mt-0.5">
                      Cliente: {activeTimer.clientName}
                    </div>
                  )}
                </div>
              </div>
              {activeTimer.isActive ? (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm text-emerald-400 font-mono tabular-nums">{formattedLiveTime}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-red-400 hover:text-red-300 hover:bg-red-950/40 text-xs shrink-0"
                      onClick={async () => {
                        await activeTimer.stopCurrentTimer();
                        onClose();
                      }}
                    >
                      <Square className="h-3 w-3 fill-current mr-1" />
                      Parar
                    </Button>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Hoy en total: {activeTimer.formattedTimeLabel}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-slate-400">
                  {activeTimer.formattedTimeLabel}
                </div>
              )}
            </div>
          )}

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
              {/* SEGUIMIENTO */}
              {(canAccess('/operaciones') || canAccess('/finanzas') || canAccess('/team-capacity')) && (
                <NavGroup
                  label="Seguimiento"
                  isActive={['/operaciones', '/finanzas', '/capacidad', '/weekly-forecast'].includes(location.pathname)}
                >
                  {canAccess('/operaciones') && (
                    <NavLink to="/operaciones" icon={Activity} active={location.pathname === '/operaciones'}>
                      Seguimiento operativo
                    </NavLink>
                  )}
                  {canAccess('/finanzas') && (
                    <NavLink to="/finanzas" icon={DollarSign} active={location.pathname === '/finanzas'}>
                      Rentabilidad
                    </NavLink>
                  )}
                  {canAccess('/team-capacity') && (
                    <NavLink to="/capacidad" icon={Users} active={location.pathname === '/capacidad'}>
                      Capacidad de Equipo
                    </NavLink>
                  )}
                  {canAccess('/team-capacity') && (
                    <NavLink to="/weekly-forecast" icon={FileText} active={location.pathname === '/weekly-forecast'}>
                      Weekly Forecast
                    </NavLink>
                  )}
                </NavGroup>
              )}

              {/* PLANIFICACIÓN */}
              {(canAccess('/planner') || (modules.deadlines && canAccess('/deadlines'))) && (
                <NavGroup
                  label="Planificación"
                  isActive={location.pathname === '/planner' || location.pathname === '/deadlines'}
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
                </NavGroup>
              )}

              {/* EQUIPO */}
              {(canAccess('/team') || canAccess('/okrs') || (modules.timeTracker && canAccess('/team'))) && (
                <NavGroup
                  label="Equipo"
                  isActive={['/team', '/okrs', '/tiempos'].includes(location.pathname)}
                >
                  {canAccess('/team') && (
                    <NavLink to="/team" icon={Users} active={location.pathname === '/team'}>
                      Miembros
                    </NavLink>
                  )}
                  {modules.timeTracker && canAccess('/team') && (
                    <NavLink to="/tiempos" icon={Clock} active={location.pathname === '/tiempos'}>
                      Tiempos
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

              {/* CONFIGURACIÓN: reducido (agencia, ajustes, API, soporte); miembros y crear agencia desde sus páginas) */}
              {canAccess('/settings') && (
                <NavGroup
                  label="Configuración"
                  icon={Settings}
                  isActive={['/agency', '/settings', '/api-keys', '/soporte', '/agencies'].includes(location.pathname) || hasAgencyPaths}
                >
                  {canAccess('/agency') && (
                    <NavLink to="/agency" icon={Settings} active={location.pathname === '/agency'}>
                      Configuración de agencia
                    </NavLink>
                  )}
                  {hasPermission('can_access_agency_settings') && (
                    <NavLink to="/agencies" icon={Building2} active={location.pathname === '/agencies' && !isAgenciesCreate}>
                      Mis Agencias
                    </NavLink>
                  )}
                  {canAccess('/api-keys') && (
                    <NavLink to="/api-keys" icon={Key} active={location.pathname === '/api-keys'}>
                      API & Integraciones
                    </NavLink>
                  )}
                  {canAccess('/soporte') && (
                    <NavLink to="/soporte" icon={MessageCircle} active={location.pathname === '/soporte'}>
                      Soporte
                    </NavLink>
                  )}
                </NavGroup>
              )}

            </div>
          )}

          {/* ADMINISTRACIÓN (solo platform admins; visible aunque no sea isSuperior) */}
          {isPlatformAdmin && (
            <div className="pt-2 mt-2 border-t border-slate-800">
              <NavLink to="/admin" icon={Shield} active={location.pathname.startsWith('/admin')}>
                Administración
              </NavLink>
            </div>
          )}

        </nav>

        {/* Banner onboarding: administradores con agencia vacía */}
        {showPitchBanner && !pitchBannerDismissed && (
          <div className="mx-2 mb-2 p-2.5 rounded-lg bg-indigo-500/15 border border-indigo-400/25 text-left">
            <div className="flex items-start gap-2">
              <Presentation className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-200 leading-snug">
                  Bienvenido. Recuerda por qué tu equipo necesita esta disciplina.
                </p>
                <a
                  href={`${typeof window !== 'undefined' ? window.location.origin : ''}/pitch`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-indigo-300 hover:text-indigo-200 mt-1 inline-block"
                >
                  Ver visión del sistema →
                </a>
              </div>
              <button
                type="button"
                onClick={dismissPitchBanner}
                className="p-0.5 text-slate-500 hover:text-slate-300 shrink-0"
                aria-label="Cerrar"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        <SidebarImpersonationPanel />

        {/* Footer: una sola línea — avatar, nombre, vista, logout (sin nombre agencia) */}
        <div className="px-2 py-1.5 border-t border-slate-800 bg-slate-950/50">
          {currentUser ? (
            <div className="flex items-center gap-1.5 min-h-0 text-[11px] overflow-hidden">
              <Avatar className="h-6 w-6 shrink-0 border border-primary/30">
                <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} />
                <AvatarFallback className="bg-primary text-white text-[10px]">
                  {currentUser?.name?.charAt(0) || <User className="h-2.5 w-2.5" />}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium text-slate-200 truncate min-w-0 flex-1" title={currentUser.email}>
                <SensitiveText kind="employee" id={currentUser.id}>
                  {currentUser.first_name || currentUser.name}
                </SensitiveText>
              </span>
              {hasMultipleAgencies && <AgencySelectorCompact inline />}
              <DepartmentViewSelector inline />
              <button
                onClick={handleLogout}
                className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-950/30 rounded shrink-0"
                title="Cerrar sesión"
              >
                <LogOut className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 opacity-50">
              <div className="h-6 w-6 rounded-full bg-slate-800 animate-pulse shrink-0" />
              <div className="h-2 flex-1 bg-slate-800 rounded animate-pulse" />
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
