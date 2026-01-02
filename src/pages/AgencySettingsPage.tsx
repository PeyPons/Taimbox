import { useState } from 'react';
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
import { Building2, Settings, Users, Palette, Save, Loader2 } from 'lucide-react';

export default function AgencySettingsPage() {
  const { currentAgency, refreshAgency, isLoading: isAgencyLoading } = useAgency();
  const [saving, setSaving] = useState(false);

  // Estado local para edición
  const [agencyName, setAgencyName] = useState(currentAgency?.name || '');
  const [modules, setModules] = useState(currentAgency?.settings?.modules || {
    seo: true,
    ppc: true,
    analytics: true,
    weeklyFeedback: true,
    professionalGoals: true,
    deadlines: true
  });
  const [primaryColor, setPrimaryColor] = useState(
    currentAgency?.settings?.branding?.primaryColor || '#6366f1'
  );

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
            }
          }
        })
        .eq('id', currentAgency.id);

      if (error) throw error;

      toast.success('Configuracion de agencia guardada');
      await refreshAgency();
    } catch (error) {
      console.error('Error guardando agencia:', error);
      toast.error('Error al guardar la configuracion');
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
            Configuracion de Agencia
          </h1>
          <p className="text-slate-500 mt-1">Gestiona la configuracion de tu agencia</p>
        </div>
        <Badge variant="outline" className="text-sm">
          {currentAgency.slug}
        </Badge>
      </div>

      {/* Informacion General */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-indigo-600" />
            Informacion General
          </CardTitle>
          <CardDescription>
            Datos basicos de tu agencia
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

      {/* Modulos Habilitados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-emerald-600" />
            Modulos Habilitados
          </CardTitle>
          <CardDescription>
            Activa o desactiva funcionalidades segun las necesidades de tu equipo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <Label className="font-medium">SEO</Label>
                <p className="text-xs text-slate-500">Gestion de proyectos SEO</p>
              </div>
              <Switch
                checked={modules.seo}
                onCheckedChange={() => toggleModule('seo')}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <Label className="font-medium">PPC</Label>
                <p className="text-xs text-slate-500">Campanas publicitarias</p>
              </div>
              <Switch
                checked={modules.ppc}
                onCheckedChange={() => toggleModule('ppc')}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <Label className="font-medium">Analytics</Label>
                <p className="text-xs text-slate-500">Integracion con Google Analytics</p>
              </div>
              <Switch
                checked={modules.analytics}
                onCheckedChange={() => toggleModule('analytics')}
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
                <p className="text-xs text-slate-500">Sistema de gestion de fechas limite</p>
              </div>
              <Switch
                checked={modules.deadlines}
                onCheckedChange={() => toggleModule('deadlines')}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personalizacion */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-purple-600" />
            Personalizacion
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

      {/* Boton Guardar */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-indigo-600 hover:bg-indigo-700"
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
