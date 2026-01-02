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
  Rocket, Facebook, Megaphone
} from 'lucide-react';
import { CustomProjectFilter } from '@/types';
import { DEFAULT_FILTERS } from '@/hooks/useProjectFilters';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function AgencySettingsPage() {
  const { currentAgency, refreshAgency, isLoading: isAgencyLoading } = useAgency();
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
    metaAdAccountIds: '',
    googleAdsCustomerId: '',
    googleAdsDevToken: ''
  });

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
        metaAdAccountIds: '',
        googleAdsCustomerId: '',
        googleAdsDevToken: ''
      });
    }
  }, [currentAgency]);

  const handleSave = async () => {
    if (!currentAgency?.id) {
      toast.error('No hay agencia seleccionada');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('agencies')
        .update({
          name: agencyName,
          settings: {
            ...currentAgency.settings,
            modules,
            branding: {
              ...currentAgency.settings?.branding,
              primaryColor
            },
            projectFilters,
            integrations
          }
        })
        .eq('id', currentAgency.id);

      if (error) throw error;

      toast.success('Configuración de agencia guardada');
      await refreshAgency();
    } catch (error) {
      console.error('Error guardando agencia:', error);
      toast.error('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
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
    <div className="max-w-4xl mx-auto p-6 space-y-6">
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
              <div className="space-y-2">
                <Label htmlFor="meta-accounts">Ad Account IDs</Label>
                <Input
                  id="meta-accounts"
                  value={integrations.metaAdAccountIds || ''}
                  onChange={(e) => setIntegrations(prev => ({ ...prev, metaAdAccountIds: e.target.value }))}
                  placeholder="act_123, act_456"
                />
                <p className="text-xs text-slate-500">Separados por comas</p>
                <MetaAccountList accountIds={integrations.metaAdAccountIds || ''} />
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

      {/* Botón Guardar */}
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
    </div>
  );
}

function MetaAccountList({ accountIds }: { accountIds: string }) {
  const [accounts, setAccounts] = useState<{ account_id: string, account_name: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!accountIds) {
      setAccounts([]);
      return;
    }

    const fetchAccounts = async () => {
      setLoading(true);
      const ids = accountIds.split(',').map(id => id.trim()).filter(Boolean);
      if (ids.length === 0) {
        setLoading(false);
        return;
      }

      // Fetch known names from ad_accounts_config
      const { data } = await supabase
        .from('ad_accounts_config')
        .select('account_id, account_name')
        .in('account_id', ids)
        .eq('platform', 'meta');

      // Combine with IDs (some might not have names yet if worker hasn't run)
      const mapped = ids.map(id => {
        const found = data?.find(d => d.account_id === id);
        return {
          account_id: id,
          account_name: found?.account_name || 'Pendiente de sincronización...'
        };
      });

      setAccounts(mapped);
      setLoading(false);
    };

    fetchAccounts();
  }, [accountIds]);

  if (!accountIds) return null;

  return (
    <div className="mt-4 border-t pt-4">
      <h4 className="text-sm font-medium text-slate-700 mb-2">Cuentas Configuradas</h4>
      {loading ? (
        <div className="text-sm text-slate-500 flex items-center gap-2">
          <Loader2 className="h-3 w-3 animate-spin" /> Verificando cuentas...
        </div>
      ) : (
        <div className="space-y-2">
          {accounts.map(acc => (
            <div key={acc.account_id} className="flex items-center justify-between p-2 bg-white border rounded text-sm">
              <span className="font-medium text-slate-900">{acc.account_name}</span>
              <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">{acc.account_id}</span>
            </div>
          ))}
          {accounts.length === 0 && (
            <p className="text-sm text-slate-500 italic">Ninguna cuenta válida detectada.</p>
          )}
        </div>
      )}
    </div>
  );
}
