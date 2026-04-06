import { useState, useEffect } from 'react';
import { useAgency } from '@/contexts/AgencyContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Settings, Loader2, Check, Users, Shield, Plus } from 'lucide-react';
import { toast } from '@/lib/notify';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { usePermissions } from '@/hooks/usePermissions';
import { Badge } from '@/components/ui/badge';
import { useAppTranslation } from '@/hooks/useAppTranslation';

export default function AgenciesPage() {
  const { availableAgencies, currentAgency, switchAgency, isLoading } = useAgency();
  const { hasPermission } = usePermissions();
  const navigate = useNavigate();
  const { t } = useAppTranslation();

  const [isSwitching, setIsSwitching] = useState<string | null>(null);

  const handleSwitchAgency = async (agencyId: string) => {
    if (agencyId === currentAgency?.id) return;

    setIsSwitching(agencyId);
    try {
      await switchAgency(agencyId);
      toast.success(t('agencies.toast.switchSuccess', 'Agencia cambiada correctamente'));
      // Disparar evento para que AppContext recargue datos
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('agency-changed'));
      }, 100);
    } catch (error: any) {
      console.error('Error cambiando agencia:', error);
      toast.error(error.message || t('agencies.toast.switchError', 'Error al cambiar de agencia'));
    } finally {
      setIsSwitching(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Si solo hay una agencia o ninguna, mostrar vista simplificada
  const hasMultipleAgencies = availableAgencies && availableAgencies.length > 1;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{t('agencies.title', 'Mis Agencias')}</h1>
          <p className="text-slate-600 mt-1">
            {hasMultipleAgencies
              ? t('agencies.accessCount_other', { count: availableAgencies.length, defaultValue: `Tienes acceso a ${availableAgencies.length} agencias` })
              : t('agencies.manageCurrent', 'Gestiona tu agencia actual')
            }
          </p>
        </div>
        {hasPermission('can_access_agency_settings') && (
          <Button onClick={() => navigate('/agencies?action=create')} className="gap-2 shrink-0">
            <Plus className="h-4 w-4" />
            {t('agencies.createNew', 'Crear nueva agencia')}
          </Button>
        )}
      </div>

      {!hasMultipleAgencies ? (
        // Vista cuando solo hay una agencia
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">{currentAgency?.name || t('agencies.myAgency', 'Mi Agencia')}</CardTitle>
                <p className="text-sm text-slate-500 mt-1">{t('agencies.currentAgencyText', 'Agencia actual')}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 flex-wrap">
              {hasPermission('can_access_team') && (
                <Button
                  variant="outline"
                  onClick={() => navigate('/team')}
                  className="gap-2"
                >
                  <Users className="h-4 w-4" />
                  {t('agencies.buttons.team', 'Equipo')}
                </Button>
              )}
              {hasPermission('can_access_agency_settings') && (
                <Button
                  variant="outline"
                  onClick={() => navigate(`/agencies/${currentAgency?.id}/manage`)}
                  className="gap-2"
                >
                  <Shield className="h-4 w-4" />
                  {t('agencies.buttons.admins', 'Administradores')}
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => navigate('/agency')}
                className="gap-2"
              >
                <Settings className="h-4 w-4" />
                {t('agencies.buttons.settings', 'Configuración')}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        // Vista con múltiples agencias
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableAgencies.map((agency) => {
            const isCurrent = currentAgency?.id === agency.agencyId;
            const isSwitchingThis = isSwitching === agency.agencyId;

            return (
              <Card
                key={agency.agencyId}
                className={cn(
                  "transition-all hover:shadow-md",
                  isCurrent && "ring-2 ring-primary"
                )}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{agency.agencyName}</CardTitle>
                      </div>
                    </div>
                    {isCurrent && (
                      <Badge variant="default" className="text-xs">
                        <Check className="h-3 w-3 mr-1" />
                        {t('agencies.currentBadge', 'Actual')}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {!isCurrent && (
                      <Button
                        variant="default"
                        className="w-full"
                        onClick={() => handleSwitchAgency(agency.agencyId)}
                        disabled={isSwitchingThis}
                      >
                        {isSwitchingThis ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            {t('agencies.buttons.switching', 'Cambiando...')}
                          </>
                        ) : (
                          t('agencies.buttons.switchToThis', 'Cambiar a esta agencia')
                        )}
                      </Button>
                    )}

                    {isCurrent && (
                      <div className="flex gap-2 flex-wrap">
                        {hasPermission('can_access_team') && (
                          <Button
                            variant="outline"
                            className="flex-1 min-w-0"
                            onClick={() => navigate('/team')}
                          >
                            <Users className="h-4 w-4 mr-2" />
                            {t('agencies.buttons.team', 'Equipo')}
                          </Button>
                        )}
                        {hasPermission('can_access_agency_settings') && (
                          <Button
                            variant="outline"
                            className="flex-1 min-w-0"
                            onClick={() => navigate(`/agencies/${agency.agencyId}/manage`)}
                          >
                            <Shield className="h-4 w-4 mr-2" />
                            {t('agencies.buttons.adminsShort', 'Admins')}
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          className="flex-1 min-w-0"
                          onClick={() => navigate('/agency')}
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          {t('agencies.buttons.settingsShort', 'Config')}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
