import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/lib/supabase';
import { useAgency } from '@/contexts/AgencyContext';
import { toast } from 'sonner';
import {
  Building2, Settings, Users, Palette, Save, Loader2,
  Filter, Plus, Trash2, HelpCircle, Info, X,
  Rocket, Facebook, Megaphone, PlusCircle, ShieldCheck, GitBranch, Database, AlertTriangle
} from 'lucide-react';
import { AVAILABLE_INTEGRATIONS } from '@/config/integrations';
import { CustomProjectFilter, RolePermissions } from '@/types';
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

export default function AgencySettingsPage() {
  const { currentAgency, refreshAgency, updateSettings, updateAgencyName, isLoading: isAgencyLoading } = useAgency();
  const [saving, setSaving] = useState(false);

  // Estado local para edición
  const [agencyName, setAgencyName] = useState(currentAgency?.name || '');
  const [modules, setModules] = useState(currentAgency?.settings?.modules || {
    seo: true,
    ppc: true,
    weeklyFeedback: true,
    professionalGoals: true,
    deadlines: true
  });
  const [primaryColor, setPrimaryColor] = useState(
    currentAgency?.settings?.branding?.primaryColor || '#6366f1'
  );
  const [projectFilters, setProjectFilters] = useState<CustomProjectFilter[]>(
    currentAgency?.settings?.projectFilters || DEFAULT_FILTERS
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
    if (!existingRoles) {
      return [
        { name: 'Responsable', permissions: DEFAULT_PERMISSIONS },
        { name: 'Especialista', permissions: { ...DEFAULT_PERMISSIONS, can_access_team: false, can_access_agency_settings: false } }
      ];
    }
    // Migration check: if elements are strings, convert them
    if (existingRoles.length > 0 && typeof existingRoles[0] === 'string') {
      return (existingRoles as unknown as string[]).map(r => ({
        name: r,
        permissions: r.toLowerCase().includes('responsable') || r.toLowerCase().includes('ceo')
          ? DEFAULT_PERMISSIONS
          : { ...DEFAULT_PERMISSIONS, can_access_team: false, can_access_agency_settings: false }
      }));
    }
    return existingRoles as RolePermissions[];
  });

  const [departments, setDepartments] = useState<string[]>(
    currentAgency?.settings?.departments || ['SEO', 'PPC']
  );
  const [expandedRoleIndex, setExpandedRoleIndex] = useState<number | null>(null);
  const [newDepartment, setNewDepartment] = useState('');
  const [enabledIntegrations, setEnabledIntegrations] = useState<Record<string, boolean>>(
    currentAgency?.settings?.enabledIntegrations || {}
  );

  // Sync state when agency loads
  useEffect(() => {
    if (currentAgency) {
      setAgencyName(currentAgency.name || '');
      setModules(currentAgency.settings?.modules || {
        seo: true,
        ppc: true,
        weeklyFeedback: true,
        professionalGoals: true,
        deadlines: true
      });
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
          permissions: r.toLowerCase().includes('responsable') || r.toLowerCase().includes('ceo')
            ? DEFAULT_PERMISSIONS
            : { ...DEFAULT_PERMISSIONS, can_access_team: false, can_access_agency_settings: false }
        }));
        setRoles(migratedRoles);
      } else {
        setRoles(currentAgency.settings?.roles || [
          { name: 'Responsable', permissions: DEFAULT_PERMISSIONS },
          { name: 'Especialista', permissions: { ...DEFAULT_PERMISSIONS, can_access_team: false, can_access_agency_settings: false } }
        ]);
      }

      setDepartments(currentAgency.settings?.departments || ['SEO', 'PPC']);
      setEnabledIntegrations(currentAgency.settings?.enabledIntegrations || {});
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
  const addNewRole = () => {
    setRoles([...roles, { name: 'Nuevo Rol', permissions: { ...DEFAULT_PERMISSIONS, can_access_agency_settings: false } }]);
    setExpandedRoleIndex(roles.length); // Open the new role
  };

  const deleteRole = (index: number) => {
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
    if (!newDepartment.trim()) return;
    if (departments.includes(newDepartment.trim())) {
      toast.error('Este departamento ya existe');
      return;
    }
    setDepartments([...departments, newDepartment.trim()]);
    setNewDepartment('');
  };

  const deleteDepartment = (dept: string) => {
    setDepartments(departments.filter(d => d !== dept));
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
        integrations,
        enabledIntegrations
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
      displayName: 'Nuevo Filtro',
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
    <div className="max-w-4xl mx-auto p-6 space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            Configuración de Agencia
          </h1>
          <p className="text-slate-500 mt-1">Gestiona la configuración de tu agencia</p>
        </div>
        <Badge variant="outline" className="text-sm">
          {currentAgency.slug}
        </Badge>
      </div>

      {/* Información General */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Información General
          </CardTitle>
          <CardDescription>
            Datos básicos de tu agencia
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="agency-name">Nombre de la Agencia</Label>
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

      {/* Roles y Departamentos */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Roles y Permisos */}
        <Card className="h-full">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-indigo-600" />
                  Roles y Permisos
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
                            checked={role.permissions && role.permissions[p] !== false}
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
                            checked={role.permissions && role.permissions[p] !== false}
                            onCheckedChange={(checked) => toggleRolePermission(index, p, checked)}
                            className="scale-75"
                          />
                        </div>
                      ))}
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-slate-500 uppercase">Otros</Label>
                      {(['can_access_reports', 'can_access_client_reports', 'can_access_deadlines', 'can_access_okrs'] as const).map(p => (
                        <div key={p} className="flex items-center justify-between py-1 px-2 rounded hover:bg-white">
                          <Label htmlFor={`role-${index}-${p}`} className="text-sm font-normal cursor-pointer flex-1">{PERMISSION_LABELS[p]}</Label>
                          <Switch
                            id={`role-${index}-${p}`}
                            checked={role.permissions && role.permissions[p] !== false}
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

        {/* Departamentos */}
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              Departamentos
            </CardTitle>
            <CardDescription>
              Organiza a tu equipo en departamentos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Nuevo departamento..."
                value={newDepartment}
                onChange={(e) => setNewDepartment(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addNewDepartment()}
              />
              <Button onClick={addNewDepartment} disabled={!newDepartment.trim()}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              {departments.length === 0 ? (
                <p className="text-sm text-slate-400 italic text-center py-4">No hay departamentos definidos.</p>
              ) : (
                departments.map((dept) => (
                  <div key={dept} className="flex items-center justify-between p-3 bg-white border rounded-lg shadow-sm">
                    <span className="font-medium text-slate-700">{dept}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                      onClick={() => deleteDepartment(dept)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Módulos Habilitados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-emerald-600" />
            Módulos Habilitados
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
                <Label className="font-medium">Weekly Feedback</Label>
                <p className="text-xs text-slate-500">Sistema de feedback semanal</p>
              </div>
              <Switch
                checked={modules.weeklyFeedback}
                onCheckedChange={() => toggleModule('weeklyFeedback')}
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
          </div>
        </CardContent>
      </Card>

      {/* Integraciones Activables */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-purple-600" />
            Integraciones Activables
          </CardTitle>
          <CardDescription>
            Activa o desactiva integraciones específicas para tu agencia. Cada agencia puede tener configuraciones independientes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Workflow */}
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
                  <div key={integration.id} className="flex items-start justify-between p-4 rounded-lg border bg-white">
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
                );
              })}
          </div>

          <Separator />

          {/* CRM */}
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
                        // Validar dependencias antes de activar
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

                        // Si se desactiva una integración que tiene dependencias, advertir
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
        </CardContent>
      </Card>

      {/* Filtros de Proyectos */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-blue-600" />
                Filtros de Proyectos
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
                Añadir Filtro
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

      {/* Integrations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-blue-600" />
            Integraciones
          </CardTitle>
          <CardDescription>
            Configura las claves de API para conectar con plataformas externas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Meta Ads */}
          <div className="space-y-4 border rounded-lg p-4 bg-slate-50/50">
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
                  Añadir Cuenta Publicitaria
                </h4>
                <div className="flex flex-col md:flex-row gap-3 items-end">
                  <div className="space-y-1.5 w-full">
                    <Label className="text-xs">ID de Cuenta (Meta Ads)</Label>
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
                <h4 className="text-xs font-semibold text-slate-500 uppercase">Cuentas Conectadas ({connectedAccounts.length})</h4>
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
          <div className="space-y-4 border rounded-lg p-4 bg-slate-50/50">
            <div className="flex items-center gap-2 mb-2">
              <Megaphone className="h-5 w-5 text-amber-500" />
              <h3 className="font-semibold text-slate-900">Google Ads</h3>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="google-customer-id">Customer ID</Label>
                <Input
                  id="google-customer-id"
                  value={integrations.googleAdsCustomerId || ''}
                  onChange={(e) => setIntegrations(prev => ({ ...prev, googleAdsCustomerId: e.target.value }))}
                  placeholder="Ej: 9810132048"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="google-dev-token">Developer Token</Label>
                <Input
                  id="google-dev-token"
                  type="password"
                  value={integrations.googleAdsDevToken || ''}
                  onChange={(e) => setIntegrations(prev => ({ ...prev, googleAdsDevToken: e.target.value }))}
                  placeholder="Token de desarrollador"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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

      <Separator />

      {/* Botón Guardar (mantener al final para usuarios que prefieren scroll) */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-primary hover:bg-primary/90"
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
