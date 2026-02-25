import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { useAgency } from '@/contexts/AgencyContext';
import { toast } from 'sonner';
import {
  Building2, Settings, Users, Palette, Save, Loader2,
  Filter, Plus, Trash2, HelpCircle, Info, X,
  Rocket, Facebook, Megaphone, PlusCircle, ShieldCheck, GitBranch, Database, AlertTriangle,
  Eye, Lock, Unlock, Calendar, Check, ChevronDown, BarChart2, Layers
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { AVAILABLE_INTEGRATIONS } from '@/config/integrations';
import { CustomProjectFilter, RolePermissions, ProjectAliasingRule, DepartmentDefinition } from '@/types';
import { normalizeDepartments } from '@/utils/departmentUtils';
import { DEFAULT_FILTERS } from '@/hooks/useProjectFilters';
import { UserPermissions, PERMISSION_LABELS, DEFAULT_PERMISSIONS } from '@/types/permissions';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DepartmentViewConfigDialog } from '@/components/agencies/DepartmentViewConfigDialog';
import { useDepartmentConfigs } from '@/hooks/useDashboardView';
import { useApp } from '@/contexts/AppContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import React from 'react';

/** Selector de cuentas Google Ads: solo se monta cuando hay token, para no romper reglas de hooks al desvincular */
function GoogleAdsAccountSelect({
  agencyId,
  value,
  onValueChange,
}: {
  agencyId: string;
  value: string;
  onValueChange: (v: string) => void;
}) {
  const [accounts, setAccounts] = useState<{ id: string; resourceName: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchAccounts = async () => {
      if (!agencyId) return;
      setLoading(true);
      setError(null);
      try {
        const { data, err } = await supabase.functions.invoke('list-google-accounts', {
          body: { agency_id: agencyId }
        });
        if (cancelled) return;
        if (err) throw err;
        if (data?.error) throw new Error(data.error);
        setAccounts(data?.accounts ?? []);
      } catch (e: unknown) {
        if (cancelled) return;
        console.error('Error fetching Google accounts:', e);
        setError('Error cargando cuentas');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchAccounts();
    return () => { cancelled = true; };
  }, [agencyId]);

  if (loading) return <SelectItem value="__loading__" disabled>Cargando cuentas...</SelectItem>;
  if (error) return <SelectItem value="__error__" disabled>{error}</SelectItem>;
  if (accounts.length === 0) return <SelectItem value="__empty__" disabled>No se encontraron cuentas</SelectItem>;
  return (
    <>
      {accounts.map(acc => (
        <SelectItem key={acc.id} value={acc.id}>
          {acc.resourceName} ({acc.id})
        </SelectItem>
      ))}
    </>
  );
}

export default function AgencySettingsPage() {
  const { currentAgency, refreshAgency, updateSettings, updateAgencyName, isLoading: isAgencyLoading } = useAgency();
  const { projects, clients } = useApp();
  const [saving, setSaving] = useState(false);

  // Estado local para edición
  const [agencyName, setAgencyName] = useState(currentAgency?.name || '');
  const [modules, setModules] = useState(currentAgency?.settings?.modules || {
    seo: true,
    ppc: true,
    weeklyFeedback: true,
    professionalGoals: true,
    deadlines: true,
    timeTracker: false
  });
  const [timeTrackerMaxHours, setTimeTrackerMaxHours] = useState(
    currentAgency?.settings?.timeTrackerMaxHours ?? 12
  );
  const [primaryColor, setPrimaryColor] = useState(
    currentAgency?.settings?.branding?.primaryColor || '#6366f1'
  );
  const [projectFilters, setProjectFilters] = useState<CustomProjectFilter[]>(
    currentAgency?.settings?.projectFilters || DEFAULT_FILTERS
  );
  // Project aliasing rules (e.g., Kit Digital renaming)
  const DEFAULT_ALIASING_RULE: ProjectAliasingRule = {
    id: 'kit-digital',
    name: 'kit-digital',
    displayPrefix: 'KD:',
    enabled: true,
    matchPatterns: ['(KD)', '[KD]', 'KD ', 'KD:', 'kit digital', 'kitdigital'],
    groupAsVirtualClient: true,
    virtualClientName: 'Kit Digital',
    virtualClientColor: '#8B5CF6'
  };
  const [projectAliasingRules, setProjectAliasingRules] = useState<ProjectAliasingRule[]>(
    currentAgency?.settings?.projectAliasingRules || [DEFAULT_ALIASING_RULE]
  );
  const [integrations, setIntegrations] = useState(currentAgency?.settings?.integrations || {
    metaAccessToken: '',
    googleAdsCustomerId: '',
    googleAdsDevToken: ''
  });
  const [newAccountId, setNewAccountId] = useState('');
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [connectedAccounts, setConnectedAccounts] = useState<any[]>([]);
  const [accountToDelete, setAccountToDelete] = useState<string | null>(null);

  // Roles and Departments state
  // Safely initialize roles handling legacy string[] data
  const [roles, setRoles] = useState<RolePermissions[]>(() => {
    const existingRoles = currentAgency?.settings?.roles;
    if (!existingRoles || existingRoles.length === 0) {
      // Sin roles predefinidos - cada agencia crea los suyos
      return [];
    }
    // Migration check: if elements are strings, convert them
    if (existingRoles.length > 0 && typeof existingRoles[0] === 'string') {
      return (existingRoles as unknown as string[]).map(r => ({
        name: r,
        permissions: DEFAULT_PERMISSIONS
      }));
    }
    return existingRoles as RolePermissions[];
  });

  const [departments, setDepartments] = useState<DepartmentDefinition[]>(() =>
    normalizeDepartments(currentAgency?.settings?.departments)
  );
  const [expandedRoleIndex, setExpandedRoleIndex] = useState<number | null>(null);
  const [newDepartment, setNewDepartment] = useState('');
  const [newDepartmentColor, setNewDepartmentColor] = useState('#6366f1');
  const [enabledIntegrations, setEnabledIntegrations] = useState<Record<string, boolean>>(
    currentAgency?.settings?.enabledIntegrations || {}
  );
  const [weeklyCloseDay, setWeeklyCloseDay] = useState(
    currentAgency?.settings?.weeklyCloseDay ?? 4 // Default to Friday
  );
  const [openWeeklyCloseDay, setOpenWeeklyCloseDay] = useState(false);

  // Excluir proyectos/clientes del cálculo de precisión de planificación (índice de fiabilidad)
  const [planningPrecisionExclusions, setPlanningPrecisionExclusions] = useState<{ projectIds: string[]; clientIds: string[] }>({
    projectIds: currentAgency?.settings?.planningPrecisionExclusions?.projectIds ?? [],
    clientIds: currentAgency?.settings?.planningPrecisionExclusions?.clientIds ?? []
  });
  const [openExcludeProjects, setOpenExcludeProjects] = useState(false);
  const [openExcludeClients, setOpenExcludeClients] = useState(false);

  /** Objetivo Precio Hora Efectivo (€/h) en Rentabilidad. Por defecto 75. */
  const [ehrTarget, setEhrTarget] = useState(currentAgency?.settings?.ehrTarget ?? 75);

  // Department view configuration
  const [deptConfigDialogOpen, setDeptConfigDialogOpen] = useState(false);
  const [selectedDeptForConfig, setSelectedDeptForConfig] = useState<string>('');
  const { configs: departmentConfigs, getConfigForDepartment } = useDepartmentConfigs();

  // Sync state when agency loads
  useEffect(() => {
    if (currentAgency) {
      setAgencyName(currentAgency.name || '');
      setModules(currentAgency.settings?.modules || {
        seo: true,
        ppc: true,
        professionalGoals: true,
        deadlines: true,
        timeTracker: false
      });
      setTimeTrackerMaxHours(currentAgency.settings?.timeTrackerMaxHours ?? 12);
      setPrimaryColor(currentAgency.settings?.branding?.primaryColor || '#6366f1');
      setProjectFilters(currentAgency.settings?.projectFilters || DEFAULT_FILTERS);
      setIntegrations(currentAgency.settings?.integrations || {
        metaAccessToken: '',
        googleAdsCustomerId: '',
        googleAdsDevToken: ''
      });
      setIntegrations(currentAgency.settings?.integrations || {
        metaAccessToken: '',
        googleAdsCustomerId: '',
        googleAdsDevToken: ''
      });

      // Safely set roles with migration check
      const existingRoles = currentAgency.settings?.roles;
      if (existingRoles && existingRoles.length > 0 && typeof existingRoles[0] === 'string') {
        const migratedRoles = (existingRoles as unknown as string[]).map(r => ({
          name: r,
          permissions: DEFAULT_PERMISSIONS
        }));
        setRoles(migratedRoles);
      } else {
        setRoles(currentAgency.settings?.roles || []);
      }

      setDepartments(normalizeDepartments(currentAgency.settings?.departments));
      setEnabledIntegrations(currentAgency.settings?.enabledIntegrations || {});
      setWeeklyCloseDay(currentAgency.settings?.weeklyCloseDay ?? 4);
      setPlanningPrecisionExclusions({
        projectIds: currentAgency.settings?.planningPrecisionExclusions?.projectIds ?? [],
        clientIds: currentAgency.settings?.planningPrecisionExclusions?.clientIds ?? []
      });
      setEhrTarget(currentAgency.settings?.ehrTarget ?? 75);
      fetchConnectedAccounts();
    }
  }, [currentAgency]);

  const fetchConnectedAccounts = async () => {
    if (!currentAgency?.id) return;
    const { data } = await supabase
      .from('ad_accounts_config')
      .select('*')
      .eq('agency_id', currentAgency.id)
      .eq('platform', 'meta')
      .eq('is_active', true);
    setConnectedAccounts(data || []);
  };

  // Role Management
  const isSystemRole = (roleName: string) => {
    const systemRoles = ['administrador', 'admin', 'administrator'];
    return systemRoles.some(sr => sr === roleName.toLowerCase());
  };

  const addNewRole = () => {
    setRoles([...roles, { name: 'Nuevo rol', permissions: { ...DEFAULT_PERMISSIONS, can_access_agency_settings: false } }]);
    setExpandedRoleIndex(roles.length); // Open the new role
  };

  const deleteRole = (index: number) => {
    const role = roles[index];
    if (role.is_system_role || isSystemRole(role.name)) {
      toast.error('No puedes eliminar el rol de Administrador');
      return;
    }
    const newRoles = [...roles];
    newRoles.splice(index, 1);
    setRoles(newRoles);
    if (expandedRoleIndex === index) setExpandedRoleIndex(null);
  };

  const updateRoleName = (index: number, name: string) => {
    const newRoles = [...roles];
    newRoles[index].name = name;
    setRoles(newRoles);
  };

  const toggleRolePermission = (roleIndex: number, permission: keyof UserPermissions, checked: boolean) => {
    const newRoles = [...roles];
    // Asegurarse de que permissions objeto existe
    if (!newRoles[roleIndex].permissions) {
      newRoles[roleIndex].permissions = { ...DEFAULT_PERMISSIONS };
    }
    newRoles[roleIndex].permissions[permission] = checked;
    setRoles(newRoles);
  };

  // Department Management
  const addNewDepartment = () => {
    const name = newDepartment.trim();
    if (!name) return;
    if (departments.some(d => d.name.toLowerCase() === name.toLowerCase())) {
      toast.error('Ya existe un departamento con ese nombre');
      return;
    }
    const id = `dept-${Date.now()}-${name.replace(/\s+/g, '-').toLowerCase().slice(0, 12)}`;
    setDepartments([...departments, { id, name, color: newDepartmentColor }]);
    setNewDepartment('');
    setNewDepartmentColor('#6366f1');
  };

  const deleteDepartment = (deptId: string) => {
    setDepartments(departments.filter(d => d.id !== deptId));
  };
  const updateDepartmentColor = (deptId: string, color: string) => {
    setDepartments(departments.map(d => d.id === deptId ? { ...d, color } : d));
  };
  const updateDepartmentName = (deptId: string, name: string) => {
    if (!name.trim()) return;
    setDepartments(departments.map(d => d.id === deptId ? { ...d, name: name.trim() } : d));
  };

  const handleSave = async () => {
    if (!currentAgency?.id) {
      toast.error('No hay agencia seleccionada');
      return;
    }

    setSaving(true);
    try {
      await updateSettings({
        modules,
        roles,
        departments,
        branding: {
          ...currentAgency.settings?.branding,
          primaryColor
        },
        projectFilters,
        projectAliasingRules,
        integrations,
        enabledIntegrations,
        weeklyCloseDay,
        planningPrecisionExclusions,
        timeTrackerMaxHours,
        ehrTarget
      });

      // Si el nombre ha cambiado, actualizarlo por separado
      if (agencyName !== currentAgency.name) {
        await updateAgencyName(agencyName);
      }

      toast.success('Configuración de agencia guardada');
    } catch (error) {
      console.error('Error guardando agencia:', error);
      toast.error('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  const handleAddAccount = async () => {
    if (!newAccountId) return toast.error("Por favor, escribe un ID de cuenta.");

    setIsAddingAccount(true);
    // Insertamos en la tabla de configuración
    const { error } = await supabase.from('ad_accounts_config').insert({
      platform: 'meta',
      account_id: newAccountId,
      is_active: true,
      agency_id: currentAgency?.id
    });

    if (error) {
      console.error('Error guardando cuenta:', error);
      if (error.code === '23505') {
        toast.error("Esta cuenta ya está registrada.");
      } else {
        toast.error(error.message || 'Error al guardar la cuenta');
      }
    } else {
      toast.success('Cuenta añadida correctamente.');
      setNewAccountId('');
      fetchConnectedAccounts();
    }
    setIsAddingAccount(false);
  };

  const handleRemoveAccount = (id: string) => {
    setAccountToDelete(id);
  };

  const confirmDeleteAccount = async () => {
    if (!accountToDelete) return;

    const { error } = await supabase
      .from('ad_accounts_config')
      .delete()
      .eq('id', accountToDelete);

    if (error) {
      toast.error('Error al eliminar cuenta');
      console.error(error);
    } else {
      toast.success('Cuenta eliminada');
      fetchConnectedAccounts();
    }
    setAccountToDelete(null);
  };


  const toggleModule = (key: string) => {
    setModules(prev => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev]
    }));
  };

  // Filter management functions
  const toggleFilter = (filterId: string) => {
    setProjectFilters(prev => prev.map(f =>
      f.id === filterId ? { ...f, enabled: !f.enabled } : f
    ));
  };

  const updateFilterPatterns = (filterId: string, field: 'includePatterns' | 'excludePatterns', value: string) => {
    const patterns = value.split(',').map(p => p.trim()).filter(Boolean);
    setProjectFilters(prev => prev.map(f =>
      f.id === filterId ? { ...f, [field]: patterns } : f
    ));
  };

  const updateFilterName = (filterId: string, displayName: string) => {
    setProjectFilters(prev => prev.map(f =>
      f.id === filterId ? { ...f, displayName } : f
    ));
  };

  const updateFilterDescription = (filterId: string, description: string) => {
    setProjectFilters(prev => prev.map(f =>
      f.id === filterId ? { ...f, description } : f
    ));
  };

  const addNewFilter = () => {
    const newFilter: CustomProjectFilter = {
      id: `custom-${Date.now()}`,
      name: `custom-${projectFilters.length + 1}`,
      displayName: 'Nuevo filtro',
      enabled: true,
      includePatterns: [],
      excludePatterns: [],
      description: ''
    };
    setProjectFilters(prev => [...prev, newFilter]);
  };

  const removeFilter = (filterId: string) => {
    setProjectFilters(prev => prev.filter(f => f.id !== filterId));
  };

  const resetToDefaults = () => {
    setProjectFilters(DEFAULT_FILTERS);
    toast.info('Filtros restablecidos a valores por defecto');
  };

  // Aliasing rules management functions
  const toggleAliasingRule = (ruleId: string) => {
    setProjectAliasingRules(prev => prev.map(r =>
      r.id === ruleId ? { ...r, enabled: !r.enabled } : r
    ));
  };

  const updateAliasingRulePatterns = (ruleId: string, value: string) => {
    const patterns = value.split(',').map(p => p.trim()).filter(Boolean);
    setProjectAliasingRules(prev => prev.map(r =>
      r.id === ruleId ? { ...r, matchPatterns: patterns } : r
    ));
  };

  const updateAliasingRulePrefix = (ruleId: string, displayPrefix: string) => {
    setProjectAliasingRules(prev => prev.map(r =>
      r.id === ruleId ? { ...r, displayPrefix } : r
    ));
  };

  const updateAliasingRuleName = (ruleId: string, virtualClientName: string) => {
    setProjectAliasingRules(prev => prev.map(r =>
      r.id === ruleId ? { ...r, virtualClientName } : r
    ));
  };

  const addNewAliasingRule = () => {
    const newRule: ProjectAliasingRule = {
      id: `alias-${Date.now()}`,
      name: `custom-alias-${projectAliasingRules.length + 1}`,
      displayPrefix: 'NUEVO:',
      enabled: true,
      matchPatterns: [],
      groupAsVirtualClient: false
    };
    setProjectAliasingRules(prev => [...prev, newRule]);
  };

  const removeAliasingRule = (ruleId: string) => {
    setProjectAliasingRules(prev => prev.filter(r => r.id !== ruleId));
  };

  if (isAgencyLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!currentAgency) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-6">
            <p className="text-amber-800">No se ha encontrado una agencia asociada a tu cuenta.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            Configuración de agencia
          </h1>
          <p className="text-slate-500 mt-1">Elige una sección para ver y editar la configuración</p>
        </div>
        <Badge variant="outline" className="text-sm w-fit">
          {currentAgency.slug}
        </Badge>
      </div>

      <Tabs defaultValue="general" className="mt-6 flex flex-col lg:flex-row gap-6">
        <TabsList className="flex flex-row lg:flex-col lg:w-52 h-auto p-2 rounded-xl bg-slate-100 border border-slate-200 shrink-0 lg:sticky lg:top-4 self-start w-full overflow-x-auto flex-nowrap">
          <TabsTrigger value="general" className="flex-1 lg:flex-none justify-start gap-2 rounded-lg px-4 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm min-w-0">
            <Settings className="h-4 w-4 shrink-0" /> <span className="truncate">General</span>
          </TabsTrigger>
          <TabsTrigger value="team" className="flex-1 lg:flex-none justify-start gap-2 rounded-lg px-4 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm min-w-0">
            <Users className="h-4 w-4 shrink-0" /> <span className="truncate">Equipo</span>
          </TabsTrigger>
          <TabsTrigger value="projects" className="flex-1 lg:flex-none justify-start gap-2 rounded-lg px-4 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm min-w-0">
            <Filter className="h-4 w-4 shrink-0" /> <span className="truncate">Proyectos</span>
          </TabsTrigger>
          <TabsTrigger value="modules" className="flex-1 lg:flex-none justify-start gap-2 rounded-lg px-4 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm min-w-0">
            <BarChart2 className="h-4 w-4 shrink-0" /> <span className="truncate">Módulos</span>
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex-1 lg:flex-none justify-start gap-2 rounded-lg px-4 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm min-w-0">
            <Rocket className="h-4 w-4 shrink-0" /> <span className="truncate">Integraciones</span>
          </TabsTrigger>
          <TabsTrigger value="departments" className="flex-1 lg:flex-none justify-start gap-2 rounded-lg px-4 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm min-w-0">
            <Layers className="h-4 w-4 shrink-0" /> <span className="truncate">Departamentos</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex-1 lg:flex-none justify-start gap-2 rounded-lg px-4 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm min-w-0">
            <Palette className="h-4 w-4 shrink-0" /> <span className="truncate">Apariencia</span>
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 min-w-0 space-y-6">
          <TabsContent value="general" className="mt-0 space-y-6">
            {/* Información General */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" />
                  Información general
                </CardTitle>
                <CardDescription>
                  Datos básicos de tu agencia
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="agency-name">Nombre de la agencia</Label>
                    <Input
                      id="agency-name"
                      value={agencyName}
                      onChange={(e) => setAgencyName(e.target.value)}
                      placeholder="Nombre de tu agencia"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="agency-slug">Identificador (slug)</Label>
                    <Input
                      id="agency-slug"
                      value={currentAgency.slug}
                      disabled
                      className="bg-slate-50"
                    />
                    <p className="text-xs text-slate-500">El slug no se puede modificar</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Rentabilidad */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart2 className="h-5 w-5 text-primary" />
                  Rentabilidad
                </CardTitle>
                <CardDescription>
                  Objetivo de precio hora efectivo usado en la página Rentabilidad para KPIs y alertas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="max-w-xs space-y-2">
                  <Label htmlFor="ehr-target">Objetivo Precio Hora Efectivo (€/h)</Label>
                  <Input
                    id="ehr-target"
                    type="number"
                    min={1}
                    step={1}
                    value={ehrTarget}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (raw === '') {
                        setEhrTarget(75);
                        return;
                      }
                      const v = parseInt(raw, 10);
                      if (!Number.isNaN(v) && v >= 1) setEhrTarget(v);
                    }}
                  />
                  <p className="text-xs text-slate-500">Valor mínimo considerado saludable. Por defecto 75 €/h.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="team" className="mt-0 space-y-6">
            {/* Roles y Departamentos */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Roles y Permisos */}
              <Card className="h-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-indigo-600" />
                        Roles y permisos
                      </CardTitle>
                      <CardDescription>
                        Define los roles y sus accesos
                      </CardDescription>
                    </div>
                    <Button size="sm" onClick={addNewRole}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {roles.map((role, index) => (
                    <div key={index} className="border rounded-lg overflow-hidden">
                      <div
                        className={`p-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 ${expandedRoleIndex === index ? 'bg-slate-50' : ''}`}
                        onClick={() => setExpandedRoleIndex(expandedRoleIndex === index ? null : index)}
                      >
                        <Input
                          value={role.name}
                          onChange={(e) => updateRoleName(index, e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className="h-8 w-40 font-medium"
                          placeholder="Nombre del rol"
                        />
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-400 hover:text-red-600"
                            onClick={(e) => { e.stopPropagation(); deleteRole(index); }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Permissions Area */}
                      {expandedRoleIndex === index && (
                        <div className="p-3 border-t bg-slate-50/50 space-y-4">
                          <div className="space-y-2">
                            <Label className="text-xs font-semibold text-slate-500 uppercase">Gestión</Label>
                            {(['can_access_planner', 'can_access_projects', 'can_access_clients', 'can_access_team', 'can_access_settings'] as const).map(p => (
                              <div key={p} className="flex items-center justify-between py-1 px-2 rounded hover:bg-white">
                                <Label htmlFor={`role-${index}-${p}`} className="text-sm font-normal cursor-pointer flex-1">{PERMISSION_LABELS[p]}</Label>
                                <Switch
                                  id={`role-${index}-${p}`}
                                  checked={role.name === 'Administrador' ? true : (role.permissions && role.permissions[p] !== false)}
                                  disabled={role.name === 'Administrador'}
                                  onCheckedChange={(checked) => toggleRolePermission(index, p, checked)}
                                  className="scale-75"
                                />
                              </div>
                            ))}
                          </div>
                          <Separator />
                          <div className="space-y-2">
                            <Label className="text-xs font-semibold text-slate-500 uppercase">PPC & Ads</Label>
                            {(['can_access_google_ads', 'can_access_meta_ads', 'can_access_ads_reports'] as const).map(p => (
                              <div key={p} className="flex items-center justify-between py-1 px-2 rounded hover:bg-white">
                                <Label htmlFor={`role-${index}-${p}`} className="text-sm font-normal cursor-pointer flex-1">{PERMISSION_LABELS[p]}</Label>
                                <Switch
                                  id={`role-${index}-${p}`}
                                  checked={role.name === 'Administrador' ? true : (role.permissions && role.permissions[p] !== false)}
                                  disabled={role.name === 'Administrador'}
                                  onCheckedChange={(checked) => toggleRolePermission(index, p, checked)}
                                  className="scale-75"
                                />
                              </div>
                            ))}
                          </div>
                          <Separator />
                          <div className="space-y-2">
                            <Label className="text-xs font-semibold text-slate-500 uppercase">Otros</Label>
                            {(['can_access_reports', 'can_access_operations_radar', 'can_access_financial_health', 'can_access_client_reports', 'can_access_deadlines', 'can_access_okrs', 'can_access_team_capacity', 'can_assign_tasks_to_others', 'can_access_weekly_forecast'] as const).map(p => (
                              <div key={p} className="flex items-center justify-between py-1 px-2 rounded hover:bg-white">
                                <Label htmlFor={`role-${index}-${p}`} className="text-sm font-normal cursor-pointer flex-1">{PERMISSION_LABELS[p]}</Label>
                                <Switch
                                  id={`role-${index}-${p}`}
                                  checked={role.name === 'Administrador' ? true : (role.permissions && role.permissions[p] !== false)}
                                  disabled={role.name === 'Administrador'}
                                  onCheckedChange={(checked) => toggleRolePermission(index, p, checked)}
                                  className="scale-75"
                                />
                              </div>
                            ))}
                          </div>
                          <Separator />
                          <div className="space-y-2">
                            <Label className="text-xs font-semibold text-slate-500 uppercase">Configuración y soporte</Label>
                            {(['can_access_agency_settings', 'can_access_api_keys', 'can_access_support'] as const).map(p => (
                              <div key={p} className="flex items-center justify-between py-1 px-2 rounded hover:bg-white">
                                <Label htmlFor={`role-${index}-${p}`} className="text-sm font-normal cursor-pointer flex-1">{PERMISSION_LABELS[p]}</Label>
                                <Switch
                                  id={`role-${index}-${p}`}
                                  checked={role.name === 'Administrador' ? true : (role.permissions && role.permissions[p] !== false)}
                                  disabled={role.name === 'Administrador'}
                                  onCheckedChange={(checked) => toggleRolePermission(index, p, checked)}
                                  className="scale-75"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Enlace a pestaña Departamentos */}
              <Card className="h-full border-dashed">
                <CardContent className="py-6">
                  <p className="text-sm text-slate-500">
                    Los departamentos (nombre y color) se gestionan en la pestaña <strong>Departamentos</strong>. Así podrás filtrar la plataforma por área (Marketing, Desarrollo, etc.).
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="departments" className="mt-0 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-blue-600" />
                  Departamentos
                </CardTitle>
                <CardDescription>
                  Define las áreas de tu equipo (ej: Marketing, Desarrollo). El color se usa en la barra de aviso al filtrar por departamento.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-end gap-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-500">Nombre</Label>
                    <Input
                      placeholder="Ej: Equipo Creativo, Ventas..."
                      value={newDepartment}
                      onChange={(e) => setNewDepartment(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addNewDepartment()}
                      className="w-48"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-500">Color</Label>
                    <div className="flex items-center gap-1">
                      <input
                        type="color"
                        value={newDepartmentColor}
                        onChange={(e) => setNewDepartmentColor(e.target.value)}
                        className="h-9 w-12 cursor-pointer rounded border border-slate-200 bg-white"
                      />
                      <Input
                        value={newDepartmentColor}
                        onChange={(e) => setNewDepartmentColor(e.target.value)}
                        className="w-24 font-mono text-sm"
                      />
                    </div>
                  </div>
                  <Button onClick={addNewDepartment} disabled={!newDepartment.trim()}>
                    <Plus className="h-4 w-4 mr-1" />
                    Añadir departamento
                  </Button>
                </div>

                <div className="space-y-2">
                  {departments.length === 0 ? (
                    <p className="text-sm text-slate-400 italic text-center py-4">No hay departamentos. Añade uno para filtrar la vista por área.</p>
                  ) : (
                    departments.map((dept) => {
                      const config = getConfigForDepartment(dept.name);
                      return (
                        <div key={dept.id} className="flex items-center justify-between p-3 bg-white border rounded-lg shadow-sm gap-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div
                              className="h-6 w-6 rounded shrink-0 border border-slate-200"
                              style={{ backgroundColor: dept.color }}
                              title={dept.color}
                            />
                            <Input
                              value={dept.name}
                              onChange={(e) => updateDepartmentName(dept.id, e.target.value)}
                              className="h-8 w-40 font-medium border-0 shadow-none focus-visible:ring-0"
                            />
                            <input
                              type="color"
                              value={dept.color}
                              onChange={(e) => updateDepartmentColor(dept.id, e.target.value)}
                              className="h-7 w-8 cursor-pointer rounded border border-slate-200 bg-white shrink-0"
                            />
                            {config && (
                              <div className="flex items-center gap-1">
                                <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-5", config.defaultView === 'kanban' ? "bg-indigo-50 text-indigo-700 border-indigo-200" : "")}>
                                  {config.defaultView === 'kanban' ? 'Kanban' : 'Semanal'}
                                </Badge>
                                {config.isViewStrict && (
                                  <TooltipProvider delayDuration={300}>
                                    <Tooltip>
                                      <TooltipTrigger><Lock className="h-3 w-3 text-amber-600" /></TooltipTrigger>
                                      <TooltipContent><p className="text-xs">Vista estricta</p></TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <TooltipProvider delayDuration={300}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary hover:bg-primary/10" onClick={() => { setSelectedDeptForConfig(dept.name); setDeptConfigDialogOpen(true); }}>
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent><p className="text-xs">Configurar vista por defecto del dashboard</p></TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50" onClick={() => deleteDepartment(dept.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Department View Config Dialog - global */}
          <DepartmentViewConfigDialog
            open={deptConfigDialogOpen}
            onOpenChange={setDeptConfigDialogOpen}
            departmentName={selectedDeptForConfig}
          />

          <TabsContent value="modules" className="mt-0 space-y-6">
            {/* Módulos Habilitados */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-emerald-600" />
                  Módulos habilitados
                </CardTitle>
                <CardDescription>
                  Activa o desactiva funcionalidades según las necesidades de tu equipo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <Label className="font-medium">SEO</Label>
                      <p className="text-xs text-slate-500">Gestión de proyectos SEO</p>
                    </div>
                    <Switch
                      checked={modules.seo}
                      onCheckedChange={() => toggleModule('seo')}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <Label className="font-medium">PPC</Label>
                      <p className="text-xs text-slate-500">Campañas publicitarias</p>
                    </div>
                    <Switch
                      checked={modules.ppc}
                      onCheckedChange={() => toggleModule('ppc')}
                    />
                  </div>



                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <Label className="font-medium">Objetivos Profesionales</Label>
                      <p className="text-xs text-slate-500">Seguimiento de metas del equipo</p>
                    </div>
                    <Switch
                      checked={modules.professionalGoals}
                      onCheckedChange={() => toggleModule('professionalGoals')}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <Label className="font-medium">Deadlines</Label>
                      <p className="text-xs text-slate-500">Sistema de gestión de fechas límite</p>
                    </div>
                    <Switch
                      checked={modules.deadlines}
                      onCheckedChange={() => toggleModule('deadlines')}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <Label className="font-medium">Cronómetro de tareas</Label>
                      <p className="text-xs text-slate-500">Temporizador en tiempo real para imputar horas a las tareas</p>
                    </div>
                    <Switch
                      checked={modules.timeTracker}
                      onCheckedChange={() => toggleModule('timeTracker')}
                    />
                  </div>
                  {modules.timeTracker && (
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <Label className="font-medium text-sm">Máximo de horas por sesión</Label>
                        <p className="text-xs text-slate-500">Auto-pausa del cronómetro tras este tiempo (evita olvidos)</p>
                      </div>
                      <select
                        value={timeTrackerMaxHours}
                        onChange={(e) => setTimeTrackerMaxHours(Number(e.target.value))}
                        className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                      >
                        {[4, 6, 8, 10, 12, 16, 24].map((h) => (
                          <option key={h} value={h}>{h}h</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Precisión de planificación (exclusiones para el índice de fiabilidad) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart2 className="h-5 w-5 text-amber-600" />
                  Precisión de planificación
                </CardTitle>
                <CardDescription>
                  Excluye tareas de proyectos o clientes concretos del cálculo del índice de fiabilidad (precisión de planificación). Útil para no incluir, por ejemplo, gestiones internas.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Excluir proyectos</Label>
                    <Popover open={openExcludeProjects} onOpenChange={setOpenExcludeProjects}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-between bg-slate-50 font-normal" size="sm">
                          <span className="truncate">
                            {planningPrecisionExclusions.projectIds.length === 0
                              ? 'Ninguno seleccionado'
                              : `${planningPrecisionExclusions.projectIds.length} proyecto(s)`}
                          </span>
                          <ChevronDown className="h-3.5 w-3.5 opacity-50 shrink-0 ml-2" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[280px] max-w-[360px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Buscar proyecto..." />
                          <CommandList className="max-h-[260px]">
                            <CommandEmpty>No hay proyectos o no coincide la búsqueda</CommandEmpty>
                            <CommandGroup>
                              {(projects || []).map((p) => {
                                const selected = planningPrecisionExclusions.projectIds.includes(p.id);
                                return (
                                  <CommandItem
                                    key={p.id}
                                    value={p.name}
                                    onSelect={() => {
                                      setPlanningPrecisionExclusions(prev => ({
                                        ...prev,
                                        projectIds: selected
                                          ? prev.projectIds.filter(id => id !== p.id)
                                          : [...prev.projectIds, p.id]
                                      }));
                                    }}
                                  >
                                    <Check className={cn('mr-2 h-4 w-4 shrink-0', selected ? 'opacity-100' : 'opacity-0')} />
                                    <span className="truncate">{p.name}</span>
                                  </CommandItem>
                                );
                              })}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    {planningPrecisionExclusions.projectIds.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {planningPrecisionExclusions.projectIds.map((id) => {
                          const p = (projects || []).find(pr => pr.id === id);
                          return p ? (
                            <Badge key={id} variant="secondary" className="text-xs">
                              {p.name}
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Excluir clientes</Label>
                    <Popover open={openExcludeClients} onOpenChange={setOpenExcludeClients}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-between bg-slate-50 font-normal" size="sm">
                          <span className="truncate">
                            {planningPrecisionExclusions.clientIds.length === 0
                              ? 'Ninguno seleccionado'
                              : `${planningPrecisionExclusions.clientIds.length} cliente(s)`}
                          </span>
                          <ChevronDown className="h-3.5 w-3.5 opacity-50 shrink-0 ml-2" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[280px] max-w-[360px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Buscar cliente..." />
                          <CommandList className="max-h-[260px]">
                            <CommandEmpty>No hay clientes o no coincide la búsqueda</CommandEmpty>
                            <CommandGroup>
                              {(clients || []).map((c) => {
                                const selected = planningPrecisionExclusions.clientIds.includes(c.id);
                                return (
                                  <CommandItem
                                    key={c.id}
                                    value={c.name}
                                    onSelect={() => {
                                      setPlanningPrecisionExclusions(prev => ({
                                        ...prev,
                                        clientIds: selected
                                          ? prev.clientIds.filter(id => id !== c.id)
                                          : [...prev.clientIds, c.id]
                                      }));
                                    }}
                                  >
                                    <Check className={cn('mr-2 h-4 w-4 shrink-0', selected ? 'opacity-100' : 'opacity-0')} />
                                    <span className="truncate">{c.name}</span>
                                  </CommandItem>
                                );
                              })}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    {planningPrecisionExclusions.clientIds.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {planningPrecisionExclusions.clientIds.map((id) => {
                          const c = (clients || []).find(cl => cl.id === id);
                          return c ? (
                            <Badge key={id} variant="secondary" className="text-xs">
                              {c.name}
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="projects" className="mt-0 space-y-6">
            {/* Filtros de Proyectos */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Filter className="h-5 w-5 text-blue-600" />
                      Filtros de proyectos
                    </CardTitle>
                    <CardDescription>
                      Configura cómo se filtran los proyectos en las diferentes vistas
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={resetToDefaults}>
                      Restablecer
                    </Button>
                    <Button size="sm" onClick={addNewFilter}>
                      <Plus className="h-4 w-4 mr-1" />
                      Añadir filtro
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Info box */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
                  <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">¿Cómo funcionan los filtros?</p>
                    <ul className="space-y-1 text-blue-700">
                      <li>• <strong>Patrones de inclusión:</strong> El nombre del proyecto debe contener AL MENOS UNO de estos términos</li>
                      <li>• <strong>Patrones de exclusión:</strong> El nombre del proyecto NO puede contener NINGUNO de estos términos</li>
                      <li>• Si dejas vacío "Patrones de inclusión", se incluyen todos los proyectos por defecto</li>
                    </ul>
                  </div>
                </div>

                {/* Filter list */}
                <div className="space-y-4">
                  {projectFilters.map((filter) => (
                    <div
                      key={filter.id}
                      className={`border rounded-lg p-4 space-y-4 ${filter.enabled ? 'bg-white' : 'bg-slate-50 opacity-60'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={filter.enabled}
                            onCheckedChange={() => toggleFilter(filter.id)}
                          />
                          <Input
                            value={filter.displayName}
                            onChange={(e) => updateFilterName(filter.id, e.target.value)}
                            className="w-40 font-medium"
                            placeholder="Nombre del filtro"
                          />
                          <Badge variant={filter.enabled ? 'default' : 'secondary'}>
                            {filter.enabled ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFilter(filter.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Label className="text-sm">Patrones de inclusión</Label>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-xs">Términos separados por coma. El proyecto debe contener AL MENOS UNO para aparecer.</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <Input
                            value={filter.includePatterns.join(', ')}
                            onChange={(e) => updateFilterPatterns(filter.id, 'includePatterns', e.target.value)}
                            placeholder="Ej: SEM, PPC, DV360"
                            className="text-sm"
                          />
                          {filter.includePatterns.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {filter.includePatterns.map((p, i) => (
                                <Badge key={i} variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                  + {p}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Label className="text-sm">Patrones de exclusión</Label>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-xs">Términos separados por coma. El proyecto NO puede contener NINGUNO para aparecer.</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <Input
                            value={filter.excludePatterns.join(', ')}
                            onChange={(e) => updateFilterPatterns(filter.id, 'excludePatterns', e.target.value)}
                            placeholder="Ej: RRSS, SOCIAL"
                            className="text-sm"
                          />
                          {filter.excludePatterns.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {filter.excludePatterns.map((p, i) => (
                                <Badge key={i} variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                                  - {p}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm">Descripción (opcional)</Label>
                        <Input
                          value={filter.description || ''}
                          onChange={(e) => updateFilterDescription(filter.id, e.target.value)}
                          placeholder="Ej: Proyectos de posicionamiento orgánico"
                          className="text-sm"
                        />
                      </div>
                    </div>
                  ))}

                  {projectFilters.length === 0 && (
                    <div className="text-center py-8 text-slate-500">
                      <Filter className="h-12 w-12 mx-auto mb-2 opacity-30" />
                      <p>No hay filtros configurados</p>
                      <Button variant="link" onClick={addNewFilter}>
                        Añadir el primer filtro
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Project Aliasing Rules */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GitBranch className="h-5 w-5 text-purple-600" />
                  Aliasing de proyectos
                </CardTitle>
                <CardDescription>
                  Configura reglas para renombrar proyectos automáticamente (ej: Kit Digital → KD:)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-600">
                    Define patrones para detectar y renombrar proyectos especiales
                  </p>
                  <Button variant="outline" size="sm" onClick={addNewAliasingRule}>
                    <Plus className="h-4 w-4 mr-1" />
                    Nueva regla
                  </Button>
                </div>

                <div className="space-y-4">
                  {projectAliasingRules.map((rule) => (
                    <div
                      key={rule.id}
                      className={`p-4 rounded-lg border space-y-3 ${rule.enabled ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-200 opacity-60'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={rule.enabled}
                            onCheckedChange={() => toggleAliasingRule(rule.id)}
                          />
                          <div>
                            <span className="font-medium text-slate-900">{rule.virtualClientName || rule.name}</span>
                            {rule.displayPrefix && (
                              <Badge variant="outline" className="ml-2 text-xs bg-purple-50 text-purple-700">
                                {rule.displayPrefix}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAliasingRule(rule.id)}
                          className="text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label className="text-sm">Prefijo a mostrar</Label>
                          <Input
                            value={rule.displayPrefix}
                            onChange={(e) => updateAliasingRulePrefix(rule.id, e.target.value)}
                            placeholder="Ej: KD:"
                            className="text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Nombre del cliente virtual</Label>
                          <Input
                            value={rule.virtualClientName || ''}
                            onChange={(e) => updateAliasingRuleName(rule.id, e.target.value)}
                            placeholder="Ej: Kit Digital"
                            className="text-sm"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Label className="text-sm">Patrones de detección</Label>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">Términos separados por coma. Si el proyecto contiene alguno, se aplicará esta regla.</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <Input
                          value={rule.matchPatterns.join(', ')}
                          onChange={(e) => updateAliasingRulePatterns(rule.id, e.target.value)}
                          placeholder="Ej: (KD), [KD], kit digital, KD:"
                          className="text-sm"
                        />
                        {rule.matchPatterns.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {rule.matchPatterns.map((p, i) => (
                              <Badge key={i} variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                                {p}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {projectAliasingRules.length === 0 && (
                    <div className="text-center py-8 text-slate-500">
                      <GitBranch className="h-12 w-12 mx-auto mb-2 opacity-30" />
                      <p>No hay reglas de aliasing configuradas</p>
                      <Button variant="link" onClick={addNewAliasingRule}>
                        Añadir la primera regla
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations" className="mt-0 space-y-6">
            {/* Integrations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Rocket className="h-5 w-5 text-blue-600" />
                  Integraciones
                </CardTitle>
                <CardDescription>
                  Conecta tu agencia con herramientas externas y configura funcionalidades avanzadas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">

                {/* Workflow Integrations */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-3">
                    <GitBranch className="h-4 w-4 text-purple-600" />
                    <h3 className="font-semibold text-sm text-slate-700 uppercase">Workflow</h3>
                  </div>
                  {Object.values(AVAILABLE_INTEGRATIONS)
                    .filter(integration => integration.category === 'workflow')
                    .map(integration => {
                      const isEnabled = enabledIntegrations[integration.id] ?? false;
                      return (
                        <div key={integration.id} className="p-4 rounded-lg border bg-white">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <Label className="font-medium text-slate-900">{integration.name}</Label>
                                <Badge variant="outline" className="text-xs">
                                  {integration.category}
                                </Badge>
                              </div>
                              <p className="text-sm text-slate-600">{integration.description}</p>
                            </div>
                            <Switch
                              checked={isEnabled}
                              onCheckedChange={(checked) => {
                                setEnabledIntegrations(prev => ({
                                  ...prev,
                                  [integration.id]: checked
                                }));
                              }}
                              className="ml-4"
                            />
                          </div>

                          {/* Weekly System Config embedded in Workflow item */}
                          {integration.id === 'weekly_feedback' && isEnabled && (
                            <div className="mt-4 pt-4 border-t">
                              <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                  <Label htmlFor="weekly-close-day" className="text-xs font-semibold text-slate-700">
                                    Día de cierre semanal
                                  </Label>
                                  <Popover open={openWeeklyCloseDay} onOpenChange={setOpenWeeklyCloseDay}>
                                    <PopoverTrigger asChild>
                                      <Button id="weekly-close-day" variant="outline" className="h-8 text-sm bg-slate-50 justify-between font-normal w-full">
                                        <span className="truncate">{[0, 1, 2, 3, 4, 5, 6].indexOf(weeklyCloseDay) >= 0 ? (['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes (Recomendado)', 'Sábado', 'Domingo'][weeklyCloseDay]) : 'Selecciona un día'}</span>
                                        <ChevronDown className="h-3.5 w-3.5 opacity-50 shrink-0" />
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                      <Command>
                                        <CommandList>
                                          <CommandGroup>
                                            {(['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes (Recomendado)', 'Sábado', 'Domingo'] as const).map((label, i) => (
                                              <CommandItem key={i} value={label} onSelect={() => { setWeeklyCloseDay(i); setOpenWeeklyCloseDay(false); }}>
                                                <Check className={cn('mr-2 h-4 w-4 shrink-0', weeklyCloseDay === i ? 'opacity-100' : 'opacity-0')} />
                                                {label}
                                              </CommandItem>
                                            ))}
                                          </CommandGroup>
                                        </CommandList>
                                      </Command>
                                    </PopoverContent>
                                  </Popover>
                                  <p className="text-[10px] text-slate-500">
                                    Determina qué tareas se consideran "de esta semana".
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
                <Separator />

                {/* CRM Integrations */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-3">
                    <Database className="h-4 w-4 text-blue-600" />
                    <h3 className="font-semibold text-sm text-slate-700 uppercase">CRM</h3>
                  </div>
                  {Object.values(AVAILABLE_INTEGRATIONS)
                    .filter(integration => integration.category === 'crm')
                    .map(integration => {
                      const isEnabled = enabledIntegrations[integration.id] ?? false;
                      const hasDependencyIssue = integration.dependencies?.some(
                        depId => !(enabledIntegrations[depId] ?? false)
                      ) ?? false;

                      return (
                        <div key={integration.id} className="flex items-start justify-between p-4 rounded-lg border bg-white">
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <Label className="font-medium text-slate-900">{integration.name}</Label>
                              <Badge variant="outline" className="text-xs">
                                {integration.category}
                              </Badge>
                              {hasDependencyIssue && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Requiere que {integration.dependencies?.map(id => AVAILABLE_INTEGRATIONS[id]?.name).join(', ')} esté activo</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                            <p className="text-sm text-slate-600">{integration.description}</p>
                            {hasDependencyIssue && isEnabled && (
                              <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                Esta integración requiere dependencias activas
                              </p>
                            )}
                          </div>
                          <Switch
                            checked={isEnabled}
                            onCheckedChange={(checked) => {
                              // Validate dependencies before enabling
                              if (checked && integration.dependencies) {
                                const missingDeps = integration.dependencies.filter(
                                  depId => !(enabledIntegrations[depId] ?? false)
                                );
                                if (missingDeps.length > 0) {
                                  const depNames = missingDeps.map(id => AVAILABLE_INTEGRATIONS[id]?.name).join(', ');
                                  toast.warning(`Para activar "${integration.name}", primero debes activar: ${depNames}`);
                                  return;
                                }
                              }

                              // Warn if disabling a dependency
                              if (!checked && integration.id === 'crm_user_id') {
                                const hasCrmExport = enabledIntegrations['crm_export'] ?? false;
                                if (hasCrmExport) {
                                  toast.warning('Si desactivas "ID Usuario CRM", también se desactivará "Exportación de Tareas al CRM"');
                                  setEnabledIntegrations(prev => ({
                                    ...prev,
                                    [integration.id]: false,
                                    crm_export: false
                                  }));
                                  return;
                                }
                              }

                              setEnabledIntegrations(prev => ({
                                ...prev,
                                [integration.id]: checked
                              }));
                            }}
                            className="ml-4"
                          />
                        </div>
                      );
                    })}
                </div>

                <Separator />

                <div className="space-y-6 mt-6 pt-6 ">
                  <div className="flex items-center gap-2 mb-4">
                    <Settings className="h-5 w-5 text-slate-700" />
                    <h3 className="font-semibold text-lg text-slate-900">Configuración de Plataformas de Anuncios</h3>
                  </div>

                  <div className="space-y-4 border rounded-lg p-4 bg-slate-50/50 mt-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Facebook className="h-5 w-5 text-blue-600" />
                      <h3 className="font-semibold text-slate-900">Meta Ads</h3>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="meta-token">Access Token</Label>
                        <Input
                          id="meta-token"
                          type="password"
                          value={integrations.metaAccessToken || ''}
                          onChange={(e) => setIntegrations(prev => ({ ...prev, metaAccessToken: e.target.value }))}
                          placeholder="EAAB..."
                        />
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t">
                      <div className="space-y-4">
                        <h4 className="font-medium text-sm flex items-center gap-2">
                          <PlusCircle className="w-4 h-4 text-emerald-600" />
                          Añadir cuenta publicitaria
                        </h4>
                        <div className="flex flex-col md:flex-row gap-3 items-end">
                          <div className="space-y-1.5 w-full">
                            <Label className="text-xs">ID de cuenta (Meta Ads)</Label>
                            <Input
                              placeholder="Ej: act_123456789"
                              value={newAccountId}
                              onChange={(e) => setNewAccountId(e.target.value)}
                              className="bg-white"
                            />
                          </div>
                          <Button onClick={handleAddAccount} disabled={isAddingAccount} size="sm" className="w-full md:w-auto shrink-0">
                            {isAddingAccount ? '...' : 'Añadir'}
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-3 mt-4">
                        <h4 className="text-xs font-semibold text-slate-500 uppercase">Cuentas conectadas ({connectedAccounts.length})</h4>
                        {connectedAccounts.length === 0 ? (
                          <p className="text-sm text-slate-400 italic">No hay cuentas conectadas.</p>
                        ) : (
                          <div className="grid gap-2">
                            {connectedAccounts.map(acc => (
                              <div key={acc.id} className="flex items-center justify-between p-3 bg-white border rounded-lg shadow-sm">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                    <Facebook className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-slate-900">{acc.account_name || 'Cuenta de Anuncios'}</p>
                                    <p className="text-xs font-mono text-slate-500">{acc.account_id}</p>
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-slate-400 hover:text-red-500 hover:bg-red-50"
                                  onClick={() => handleRemoveAccount(acc.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Google Ads */}
                  <div className="space-y-4 border rounded-lg p-4 bg-slate-50/50 mt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Megaphone className="h-5 w-5 text-amber-500" />
                      <h3 className="font-semibold text-slate-900">Google Ads</h3>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="google-customer-id">Cuenta de Google Ads</Label>
                        {(currentAgency?.google_ads_refresh_token || integrations.googleRefreshToken) && currentAgency?.id ? (
                          <div className="space-y-2">
                            <Select
                              value={currentAgency?.google_ads_customer_id || integrations.googleAdsCustomerId || ''}
                              onValueChange={(value) => {
                                setIntegrations(prev => ({ ...prev, googleAdsCustomerId: value }));
                                supabase.from('agencies')
                                  .update({ google_ads_customer_id: value })
                                  .eq('id', currentAgency.id!)
                                  .then(({ error }) => {
                                    if (error) toast.error('Error guardando la cuenta seleccionada');
                                    else toast.success('Cuenta de Google Ads actualizada');
                                  });
                              }}
                            >
                              <SelectTrigger className="w-full bg-white">
                                <SelectValue placeholder="Selecciona una cuenta..." />
                              </SelectTrigger>
                              <SelectContent>
                                <GoogleAdsAccountSelect
                                  agencyId={currentAgency.id}
                                  value={currentAgency.google_ads_customer_id || integrations.googleAdsCustomerId || ''}
                                  onValueChange={(v) => setIntegrations(prev => ({ ...prev, googleAdsCustomerId: v }))}
                                />
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-slate-500">Selecciona la cuenta principal o MCC para sincronizar.</p>
                          </div>
                        ) : (currentAgency?.google_ads_refresh_token || integrations.googleRefreshToken) ? (
                          <div className="p-3 border border-dashed rounded bg-slate-100 text-slate-500 text-sm text-center">
                            Cargando...
                          </div>
                        ) : (
                          <div className="p-3 border border-dashed rounded bg-slate-100 text-slate-500 text-sm text-center">
                            Conecta primero con Google para ver tus cuentas disponibles.
                          </div>
                        )}
                      </div>

                      <div className="space-y-3 flex flex-col justify-center">
                        <Label>Conexión con Google Ads</Label>
                        {(currentAgency?.google_ads_refresh_token || integrations.googleRefreshToken) ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">✅ Vinculado</Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
                                if (!googleClientId) {
                                  toast.error('Error de configuración: Falta VITE_GOOGLE_CLIENT_ID en el entorno.');
                                  return;
                                }
                                const redirectUri = window.location.origin + '/google-callback';
                                const scope = 'https://www.googleapis.com/auth/adwords';
                                const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(googleClientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent`;
                                window.location.href = authUrl;
                              }}
                            >
                              Re-vincular
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-slate-500 hover:text-red-600"
                              onClick={async () => {
                                if (!currentAgency?.id) return;
                                try {
                                  const { googleRefreshToken: _rt, googleAdsCustomerId: _cid, ...restIntegrations } = currentAgency?.settings?.integrations || {};
                                  const newSettings = {
                                    ...currentAgency?.settings,
                                    integrations: { ...restIntegrations }
                                  };
                                  const { error } = await supabase
                                    .from('agencies')
                                    .update({
                                      google_ads_refresh_token: null,
                                      google_ads_customer_id: null,
                                      updated_at: new Date().toISOString(),
                                      settings: newSettings
                                    })
                                    .eq('id', currentAgency.id);
                                  if (error) throw error;
                                  setIntegrations(prev => ({ ...prev, googleRefreshToken: undefined, googleAdsCustomerId: '' }));
                                  await refreshAgency();
                                  toast.success('Cuenta de Google Ads desvinculada');
                                } catch (e: any) {
                                  toast.error(e?.message || 'Error al desvincular');
                                }
                              }}
                            >
                              Desvincular
                            </Button>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2">
                            <Button
                              variant="outline"
                              className="w-full justify-center gap-2 border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800"
                              onClick={() => {
                                const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
                                if (!googleClientId) {
                                  toast.error('Error de configuración: Falta VITE_GOOGLE_CLIENT_ID en el entorno.');
                                  return;
                                }
                                const redirectUri = window.location.origin + '/google-callback';
                                const scope = 'https://www.googleapis.com/auth/adwords';
                                const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(googleClientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent`;
                                window.location.href = authUrl;
                              }}
                            >
                              🔗 Conectar con Google
                            </Button>
                            <p className="text-xs text-slate-500">
                              Se abrirá la pantalla de consentimiento de Google. Al autorizar, podrás seleccionar tu cuenta.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance" className="mt-0 space-y-6">
            {/* Personalización */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-purple-600" />
                  Personalización
                </CardTitle>
                <CardDescription>
                  Personaliza la apariencia de tu agencia
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primary-color">Color Principal</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        id="primary-color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-12 h-10 rounded border cursor-pointer"
                      />
                      <Input
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-32"
                        placeholder="#6366f1"
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div
                      className="h-10 rounded-lg flex items-center justify-center text-white font-medium"
                      style={{ backgroundColor: primaryColor }}
                    >
                      Vista previa
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>

      {/* Botón Flotante de Guardar - Siempre visible */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 lg:left-auto lg:right-6 lg:transform-none">
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-700 p-3 backdrop-blur-sm">
          <Button
            onClick={handleSave}
            disabled={saving}
            size="lg"
            className="bg-primary hover:bg-primary/90 text-white min-w-[200px] shadow-lg"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Guardar Cambios
              </>
            )}
          </Button>
        </div>
      </div>
      <AlertDialog open={!!accountToDelete} onOpenChange={(open) => !open && setAccountToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará la cuenta de la configuración. Podrás volver a añadirla más tarde si lo necesitas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteAccount} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div >
  );
}
