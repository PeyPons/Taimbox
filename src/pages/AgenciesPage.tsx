import { useState, useEffect } from 'react';
import { useAgency } from '@/contexts/AgencyContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Building2, Plus, Settings, LogOut, Loader2, Check, Shield, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { usePermissions } from '@/hooks/usePermissions';
import { Badge } from '@/components/ui/badge';

export default function AgenciesPage() {
  const { userAgencies, currentAgency, createAgency, switchAgency, leaveAgency, isLoading } = useAgency();
  const { hasPermission } = usePermissions();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
  const [agencyToLeave, setAgencyToLeave] = useState<string | null>(null);
  const [newAgencyName, setNewAgencyName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isSwitching, setIsSwitching] = useState<string | null>(null);

  // Abrir diálogo de creación si viene de la URL
  useEffect(() => {
    if (searchParams.get('action') === 'create') {
      setIsCreateDialogOpen(true);
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  const handleCreateAgency = async () => {
    if (!newAgencyName.trim()) {
      toast.error('El nombre de la agencia es obligatorio');
      return;
    }

    setIsCreating(true);
    try {
      const agency = await createAgency(newAgencyName.trim());
      toast.success(`Agencia "${agency.name}" creada correctamente`);
      setIsCreateDialogOpen(false);
      setNewAgencyName('');
      
      // Cambiar a la nueva agencia
      await switchAgency(agency.id);
      // Disparar evento para que AppContext recargue datos
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('agency-changed'));
      }, 100);
    } catch (error: any) {
      console.error('Error creando agencia:', error);
      toast.error(error.message || 'Error al crear la agencia');
    } finally {
      setIsCreating(false);
    }
  };

  const handleSwitchAgency = async (agencyId: string) => {
    if (agencyId === currentAgency?.id) return;

    setIsSwitching(agencyId);
    try {
      await switchAgency(agencyId);
      toast.success('Agencia cambiada correctamente');
      // Disparar evento para que AppContext recargue datos
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('agency-changed'));
      }, 100);
    } catch (error: any) {
      console.error('Error cambiando agencia:', error);
      toast.error(error.message || 'Error al cambiar de agencia');
    } finally {
      setIsSwitching(null);
    }
  };

  const handleLeaveAgency = async () => {
    if (!agencyToLeave) return;

    setIsLeaving(true);
    try {
      await leaveAgency(agencyToLeave);
      toast.success('Has salido de la agencia');
      setIsLeaveDialogOpen(false);
      setAgencyToLeave(null);
    } catch (error: any) {
      console.error('Error saliendo de agencia:', error);
      toast.error(error.message || 'Error al salir de la agencia');
    } finally {
      setIsLeaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Mis Agencias</h1>
          <p className="text-slate-600 mt-1">
            Gestiona las agencias a las que perteneces
            {userAgencies.length > 0 && (
              <span className="ml-2 text-slate-400">
                ({userAgencies.length} {userAgencies.length === 1 ? 'agencia' : 'agencias'})
              </span>
            )}
          </p>
        </div>
        {hasPermission('can_access_agency_settings') && (
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Crear Agencia
          </Button>
        )}
      </div>

      {userAgencies.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-slate-400 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              No tienes agencias
            </h3>
            <p className="text-slate-600 text-center mb-6 max-w-md">
              Crea tu primera agencia para comenzar a gestionar proyectos y equipos.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Crear Primera Agencia
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {userAgencies.map((userAgency) => {
            const isCurrent = currentAgency?.id === userAgency.agency.id;
            const isSwitchingThis = isSwitching === userAgency.agency.id;

            return (
              <Card
                key={userAgency.agency.id}
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
                        <CardTitle className="text-lg">{userAgency.agency.name}</CardTitle>
                        {userAgency.role && (
                          <CardDescription className="mt-1">
                            {userAgency.role}
                            {userAgency.department && ` • ${userAgency.department}`}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isCurrent && (
                        <Badge variant="default" className="text-xs">
                          <Check className="h-3 w-3 mr-1" />
                          Actual
                        </Badge>
                      )}
                      {hasPermission('can_access_agency_settings') && (
                        <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                          <Shield className="h-3 w-3 mr-1" />
                          Admin
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {!isCurrent && (
                      <Button
                        variant="default"
                        className="w-full"
                        onClick={() => handleSwitchAgency(userAgency.agency.id)}
                        disabled={isSwitchingThis}
                      >
                        {isSwitchingThis ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Cambiando...
                          </>
                        ) : (
                          'Cambiar a esta agencia'
                        )}
                      </Button>
                    )}
                    
                    <div className="flex gap-2 flex-wrap">
                      {hasPermission('can_access_agency_settings') && (
                        <Button
                          variant="outline"
                          className="flex-1 min-w-0"
                          onClick={() => {
                            navigate(`/agencies/${userAgency.agency.id}/manage`);
                          }}
                        >
                          <Users className="h-4 w-4 mr-2" />
                          Gestionar
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        className="flex-1 min-w-0"
                        onClick={() => {
                          navigate('/agency');
                        }}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Configuración
                      </Button>
                      
                      {userAgencies.length > 1 && (
                        <Button
                          variant="outline"
                          className="flex-1 min-w-0 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300"
                          onClick={() => {
                            setAgencyToLeave(userAgency.agency.id);
                            setIsLeaveDialogOpen(true);
                          }}
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Salir
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialog: Crear Agencia */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Nueva Agencia</DialogTitle>
            <DialogDescription>
              Crea una nueva agencia para gestionar proyectos y equipos de forma independiente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="agency-name">Nombre de la agencia</Label>
              <Input
                id="agency-name"
                placeholder="Ej: mi nueva agencia"
                value={newAgencyName}
                onChange={(e) => setNewAgencyName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isCreating) {
                    handleCreateAgency();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                setNewAgencyName('');
              }}
              disabled={isCreating}
            >
              Cancelar
            </Button>
            <Button onClick={handleCreateAgency} disabled={isCreating || !newAgencyName.trim()}>
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Agencia
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog: Salir de Agencia */}
      <AlertDialog open={isLeaveDialogOpen} onOpenChange={setIsLeaveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Salir de esta agencia?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Perderás acceso a todos los proyectos y datos de esta agencia.
              {userAgencies.length === 1 && (
                <span className="block mt-2 text-red-600 font-medium">
                  ⚠️ Esta es tu única agencia. No podrás acceder al sistema después de salir.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLeaving}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLeaveAgency}
              disabled={isLeaving}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLeaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saliendo...
                </>
              ) : (
                'Salir de la Agencia'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

