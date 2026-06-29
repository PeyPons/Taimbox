import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { NavLink } from '@/components/NavLink';
import { useApp } from '@/contexts/AppContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';
import { useAgency } from '@/contexts/AgencyContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePlatformAdmin } from '@/hooks/usePlatformAdmin';
import { DepartmentViewSelector } from '@/components/layout/DepartmentViewSelector';
import { useAppTranslation } from '@/hooks/useAppTranslation';
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
  Activity,
  DollarSign,
  FileText,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { useActiveTimerForSidebar } from '@/hooks/useActiveTimerForSidebar';
import { SidebarTimerPanel } from '@/components/layout/SidebarTimerPanel';
import { buildAgencyAwarePath, useSupportAgencyView } from '@/hooks/useSupportAgencyView';
import { SensitiveText } from '@/components/privacy/SensitiveText';
import { TaimboxLogo } from '@/components/brand/TaimboxLogo';
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
  const { currentUser, employees, projects, isLoading: isAppDataLoading } = useApp();
  const { canAccess, hasPermission } = usePermissions();
  const { canAccessRouteByPlan, planIncludesAds } = useSubscriptionLimits();
  const canAccessNav = (route: string) => canAccess(route) && canAccessRouteByPlan(route);
  const { agencyId } = useSupportAgencyView();
  const { currentAgency, isLoading: isAgencyLoading } = useAgency();
  const { t } = useAppTranslation();

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
  const hasAgencyPaths = location.pathname === '/agency' || location.pathname === '/agencies' || location.pathname.startsWith('/agencies/');
  const searchParams = new URLSearchParams(location.search || '');
  const isAgenciesCreate = location.pathname === '/agencies' && searchParams.get('action') === 'create';
  const { signOut, user: authUser } = useAuth();
  const { isPlatformAdmin } = usePlatformAdmin();
  const authSessionProfile = useMemo(() => {
    if (!authUser) return null;
    const m = authUser.user_metadata as Record<string, unknown> | undefined;
    const str = (k: string) => (typeof m?.[k] === 'string' ? (m[k] as string) : undefined);
    const avatarUrl = str('avatar_url') ?? str('picture');
    const fullName = str('full_name') ?? str('name');
    const email = authUser.email ?? '';
    const displayName = fullName || (email ? email.split('@')[0]! : 'Usuario');
    return { avatarUrl, displayName, email };
  }, [authUser]);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const modules = currentAgency?.settings?.modules || {
    ppc: true,
    weeklyFeedback: true,
    professionalGoals: true,
    deadlines: true,
    timeTracker: false,
  };

  const isTimeTrackerEnabled = modules.timeTracker === true;
  const activeTimer = useActiveTimerForSidebar(isTimeTrackerEnabled ? currentUser?.id : undefined);
  const canOpenTimes = modules.timeTracker && canAccess('/team');
  const timesHref = canOpenTimes ? buildAgencyAwarePath('/tiempos', agencyId) : null;

  // Misma magnitud que TaskTimer/useTaskTimer: base hoy en la tarea + sesión en curso (tick 1s)
  const [displayTotalSeconds, setDisplayTotalSeconds] = useState(0);
  useEffect(() => {
    if (!activeTimer.isActive || activeTimer.sessionStartedAtMs == null) {
      setDisplayTotalSeconds(0);
      return;
    }
    const tick = () => {
      const session = Math.max(0, Math.floor((Date.now() - activeTimer.sessionStartedAtMs!) / 1000));
      setDisplayTotalSeconds(activeTimer.baseSecondsAllocationToday + session);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [activeTimer.isActive, activeTimer.sessionStartedAtMs, activeTimer.baseSecondsAllocationToday]);
  const formattedLiveTime = (() => {
    const s = displayTotalSeconds;
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  })();

  const showTrackingGroup =
    canAccessNav('/operaciones') ||
    canAccessNav('/finanzas') ||
    canAccessNav('/team-capacity') ||
    canAccessNav('/weekly-forecast');

  const showPlanningGroup =
    canAccess('/planner') || (modules.deadlines && canAccess('/deadlines'));

  const showTeamGroup =
    canAccess('/team') ||
    canAccessNav('/okrs') ||
    (modules.timeTracker && canAccess('/team'));

  const showPortfolioGroup = canAccess('/projects') || canAccess('/clients');

  const showPpcGroup =
    modules.ppc && planIncludesAds && (canAccessNav('/ads') || canAccessNav('/meta-ads'));

  const showSettingsGroup =
    canAccess('/agency') ||
    hasPermission('can_access_agency_settings') ||
    canAccessNav('/api-keys') ||
    canAccess('/soporte');

  const hasRoleNav =
    showTrackingGroup ||
    showPlanningGroup ||
    showTeamGroup ||
    showPortfolioGroup ||
    showPpcGroup ||
    showSettingsGroup;

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
          <TaimboxLogo
            variant="dark"
            markClassName="h-8 w-8"
            wordmarkClassName="text-slate-100 font-bold text-xl tracking-tight"
          />

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
              {t('sidebar.menu.mySpace', 'Mi espacio')}
            </NavLink>
          </div>

          {isTimeTrackerEnabled && (
            <SidebarTimerPanel
              activeTimer={activeTimer}
              formattedLiveTime={formattedLiveTime}
              timesHref={timesHref}
              timesActive={location.pathname === '/tiempos'}
              onStop={async () => {
                await activeTimer.stopCurrentTimer();
                onClose();
              }}
            />
          )}

          {hasRoleNav && (
            <div className="space-y-4">
              {/* SEGUIMIENTO */}
              {showTrackingGroup && (
                <NavGroup
                  label={t('sidebar.groups.tracking', 'Seguimiento')}
                  isActive={['/operaciones', '/finanzas', '/capacidad', '/weekly-forecast'].includes(location.pathname)}
                >
                  {canAccessNav('/operaciones') && (
                    <NavLink to="/operaciones" icon={Activity} active={location.pathname === '/operaciones'}>
                      {t('sidebar.menu.operations', 'Seguimiento operativo')}
                    </NavLink>
                  )}
                  {canAccessNav('/finanzas') && (
                    <NavLink to="/finanzas" icon={DollarSign} active={location.pathname === '/finanzas'}>
                      {t('sidebar.menu.profitability', 'Rentabilidad')}
                    </NavLink>
                  )}
                  {canAccessNav('/team-capacity') && (
                    <NavLink to="/capacidad" icon={Users} active={location.pathname === '/capacidad'}>
                      {t('sidebar.menu.teamCapacity', 'Capacidad de Equipo')}
                    </NavLink>
                  )}
                  {canAccessNav('/weekly-forecast') && (
                    <NavLink to="/weekly-forecast" icon={FileText} active={location.pathname === '/weekly-forecast'}>
                      {t('sidebar.menu.weeklyForecast', 'Weekly Forecast')}
                    </NavLink>
                  )}
                </NavGroup>
              )}

              {/* PLANIFICACIÓN */}
              {showPlanningGroup && (
                <NavGroup
                  label={t('sidebar.groups.planning', 'Planificación')}
                  isActive={location.pathname === '/planner' || location.pathname === '/deadlines'}
                >
                  {canAccess('/planner') && (
                    <NavLink to="/planner" icon={LayoutDashboard} active={location.pathname === '/planner'}>
                      {t('sidebar.menu.planner', 'Planificador')}
                    </NavLink>
                  )}
                  {modules.deadlines && canAccess('/deadlines') && (
                    <NavLink to="/deadlines" icon={Calendar} active={location.pathname === '/deadlines'}>
                      {t('sidebar.menu.deadlines', 'Deadlines')}
                    </NavLink>
                  )}
                </NavGroup>
              )}

              {/* EQUIPO */}
              {showTeamGroup && (
                <NavGroup
                  label={t('sidebar.groups.team', 'Equipo')}
                  isActive={['/team', '/okrs', '/tiempos'].includes(location.pathname)}
                >
                  {canAccess('/team') && (
                    <NavLink to="/team" icon={Users} active={location.pathname === '/team'}>
                      {t('sidebar.menu.members', 'Miembros')}
                    </NavLink>
                  )}
                  {modules.timeTracker && canAccess('/team') && (
                    <NavLink to="/tiempos" icon={Clock} active={location.pathname === '/tiempos'}>
                      {t('sidebar.menu.times', 'Tiempos')}
                    </NavLink>
                  )}
                  {modules.professionalGoals !== false && canAccessNav('/okrs') && (
                    <NavLink to="/okrs" icon={Rocket} active={location.pathname === '/okrs'}>
                      {t('sidebar.menu.okrs', 'Objetivos')}
                    </NavLink>
                  )}
                </NavGroup>
              )}

              {/* PROYECTOS */}
              {showPortfolioGroup && (
                <NavGroup
                  label={t('sidebar.groups.portfolio', 'Cartera')}
                  isActive={['/clients', '/projects'].includes(location.pathname)}
                >
                  <NavLink
                    to={canAccess('/clients') ? "/clients" : "/projects"}
                    icon={Briefcase}
                    active={location.pathname === '/clients' || location.pathname === '/projects'}
                  >
                    {t('sidebar.menu.clientsAndProjects', 'Clientes y proyectos')}
                  </NavLink>
                </NavGroup>
              )}

              {/* PPC */}
              {showPpcGroup && (
                <NavGroup
                  label={t('sidebar.groups.ppc', 'PPC & medios')}
                  isActive={['/ads', '/meta-ads'].includes(location.pathname)}
                >
                  {canAccessNav('/ads') && (
                    <NavLink to="/ads" icon={Megaphone} active={location.pathname === '/ads'}>
                      {t('sidebar.menu.googleAds', 'Google Ads')}
                    </NavLink>
                  )}
                  {canAccessNav('/meta-ads') && (
                    <NavLink to="/meta-ads" icon={Facebook} active={location.pathname === '/meta-ads'}>
                      {t('sidebar.menu.metaAds', 'Meta Ads')}
                    </NavLink>
                  )}
                </NavGroup>
              )}

              {/* CONFIGURACIÓN */}
              {showSettingsGroup && (
                <NavGroup
                  label={t('sidebar.groups.settings', 'Configuración')}
                  icon={Settings}
                  isActive={['/agency', '/settings', '/api-keys', '/soporte', '/agencies'].includes(location.pathname) || hasAgencyPaths}
                >
                  {canAccess('/agency') && (
                    <NavLink to="/agency" icon={Settings} active={location.pathname === '/agency'}>
                      {t('sidebar.menu.agencySettings', 'Configuración de agencia')}
                    </NavLink>
                  )}
                  {hasPermission('can_access_agency_settings') && (
                    <NavLink to="/agencies" icon={Building2} active={location.pathname === '/agencies' && !isAgenciesCreate}>
                      {t('sidebar.menu.myAgencies', 'Mis Agencias')}
                    </NavLink>
                  )}
                  {canAccessNav('/api-keys') && (
                    <NavLink to="/api-keys" icon={Key} active={location.pathname === '/api-keys'}>
                      {t('sidebar.menu.apiIntegrations', 'API & Integraciones')}
                    </NavLink>
                  )}
                  {canAccess('/soporte') && (
                    <NavLink to="/soporte" icon={MessageCircle} active={location.pathname === '/soporte'}>
                      {t('sidebar.menu.support', 'Soporte')}
                    </NavLink>
                  )}
                </NavGroup>
              )}

            </div>
          )}

          {/* ADMINISTRACIÓN (solo platform admins) */}
          {isPlatformAdmin && (
            <div className="pt-2 mt-2 border-t border-slate-800">
              <NavLink to="/admin" icon={Shield} active={location.pathname.startsWith('/admin')} preserveAgency={false}>
                {t('sidebar.menu.admin', 'Administración')}
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
                  {t('sidebar.pitch.welcome', 'Bienvenido. Recuerda por qué tu equipo necesita esta disciplina.')}
                </p>
                <a
                  href={`${typeof window !== 'undefined' ? window.location.origin : ''}/pitch`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-indigo-300 hover:text-indigo-200 mt-1 inline-block"
                >
                  {t('sidebar.pitch.viewVision', 'Ver visión del sistema →')}
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

        {/* Footer: empleado en agencia actual, o sesión Auth si no hay fila de empleado (p. ej. admin en vista de agencia) */}
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
              <DepartmentViewSelector inline />
              <button
                onClick={handleLogout}
                className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-950/30 rounded shrink-0"
                title={t('sidebar.footer.logout', 'Cerrar sesión')}
              >
                <LogOut className="h-3 w-3" />
              </button>
            </div>
          ) : authSessionProfile && !isAppDataLoading && !isAgencyLoading ? (
            <div className="flex items-center gap-1.5 min-h-0 text-[11px] overflow-hidden">
              <Avatar className="h-6 w-6 shrink-0 border border-amber-500/35">
                <AvatarImage src={authSessionProfile.avatarUrl} alt={authSessionProfile.displayName} />
                <AvatarFallback className="bg-amber-700/80 text-white text-[10px]">
                  {authSessionProfile.displayName.charAt(0).toUpperCase() || <User className="h-2.5 w-2.5" />}
                </AvatarFallback>
              </Avatar>
              <span className="text-slate-200 truncate min-w-0 flex-1 flex flex-col leading-tight">
                <span className="font-medium truncate">{authSessionProfile.displayName}</span>
                {authSessionProfile.email ? (
                  <span className="text-[9px] text-slate-400 font-normal truncate" title={authSessionProfile.email}>
                    {authSessionProfile.email}
                  </span>
                ) : null}
              </span>
              <DepartmentViewSelector inline />
              <button
                onClick={handleLogout}
                className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-950/30 rounded shrink-0"
                title={t('sidebar.footer.logout', 'Cerrar sesión')}
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
