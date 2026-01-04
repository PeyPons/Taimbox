import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAgency } from '@/contexts/AgencyContext';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AgencyMembersList } from '@/components/agencies/AgencyMembersList';
import { InviteUserDialog } from '@/components/agencies/InviteUserDialog';
import { EditMemberDialog } from '@/components/agencies/EditMemberDialog';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2, UserPlus, Loader2, ArrowLeft, Users, Shield, Crown, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { AgencyMember } from '@/contexts/AgencyContext';
import { supabase } from '@/lib/supabase';

export default function AgencyManagementPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentAgency, userAgencies, getAgencyMembers, removeUserFromAgency, transferAgencyOwnership } = useAgency();
  const { hasPermission, permissions } = usePermissions();
  
  const [members, setMembers] = useState<AgencyMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<AgencyMember | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<AgencyMember | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [selectedNewOwnerId, setSelectedNewOwnerId] = useState<string>('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [memberInOtherAgencies, setMemberInOtherAgencies] = useState<boolean | null>(null);
  
  // Ref para evitar recargas múltiples
  const loadingRef = useRef(false);
  const lastAgencyIdRef = useRef<string | null>(null);
  
  // Calcular hasAccess de forma estable usando permissions directamente
  const hasAccess = useMemo(() => {
    return permissions.can_access_agency_settings !== false;
  }, [permissions.can_access_agency_settings]);

  // Determinar el ID real de la agencia (puede ser slug o UUID)
  const agencyId = useMemo(() => {
    if (!id) return null;
    
    // Si es un UUID válido, usarlo directamente
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(id)) {
      return id;
    }
    
    // Si no es UUID, buscar por slug en userAgencies
    const userAgency = userAgencies.find(ua => ua.agency.slug === id || ua.agency.id === id);
    return userAgency?.agency.id || null;
  }, [id, userAgencies]); // Mantener userAgencies completo pero useMemo evitará cambios innecesarios

  // Verificar acceso a la agencia
  const hasAgencyAccess = useMemo(() => {
    if (agencyId) {
      const userAgency = userAgencies.find(ua => ua.agency.id === agencyId);
      if (!userAgency && currentAgency?.id !== agencyId) {
        return false;
      }
    } else if (id) {
      return false;
    }
    return true;
  }, [agencyId, id, currentAgency?.id, userAgencies.length]);

  // Verificar permisos solo una vez al montar o cuando cambia agencyId
  useEffect(() => {
    if (!hasAccess) {
      toast.error('No tienes permisos para acceder a esta página');
      navigate('/agencies');
      return;
    }
    
    if (!hasAgencyAccess) {
      if (id && !agencyId) {
        toast.error('Agencia no encontrada');
      } else {
        toast.error('No tienes acceso a esta agencia');
      }
      navigate('/agencies');
    }
  }, [hasAccess, hasAgencyAccess, id, agencyId, navigate]);

  // Cargar miembros - solo cuando cambia agencyId
  useEffect(() => {
    // Solo cargar si el agencyId realmente cambió
    if (agencyId === lastAgencyIdRef.current) {
      return; // No hacer nada si el ID no cambió
    }

    if (!agencyId) {
      setIsLoading(false);
      loadingRef.current = false;
      lastAgencyIdRef.current = null;
      return;
    }

    // Verificar permisos antes de intentar cargar (sin incluir en dependencias)
    const currentHasAccess = permissions.can_access_agency_settings !== false;
    const currentHasAgencyAccess = (() => {
      const userAgency = userAgencies.find(ua => ua.agency.id === agencyId);
      return !!(userAgency || currentAgency?.id === agencyId);
    })();

    if (!currentHasAccess || !currentHasAgencyAccess) {
      setIsLoading(false);
      loadingRef.current = false;
      return;
    }

    // Evitar múltiples cargas simultáneas
    if (loadingRef.current) {
      return;
    }

    // Marcar que estamos cargando este agencyId
    lastAgencyIdRef.current = agencyId;
    loadingRef.current = true;
    setIsLoading(true);

    const loadMembers = async () => {
      try {
        const membersData = await getAgencyMembers(agencyId);
        // Verificar que el agencyId no cambió durante la carga
        if (lastAgencyIdRef.current === agencyId) {
          setMembers(membersData);
          setIsLoading(false);
          loadingRef.current = false;
        }
      } catch (error: any) {
        console.error('[AgencyManagementPage] Error cargando miembros:', error);
        if (lastAgencyIdRef.current === agencyId) {
          toast.error(error.message || 'Error al cargar los miembros');
          setMembers([]);
          setIsLoading(false);
          loadingRef.current = false;
        }
      }
    };

    loadMembers();
  }, [agencyId]); // SOLO depender de agencyId - todo lo demás se verifica dentro

  const handleEdit = (member: AgencyMember) => {
    setSelectedMember(member);
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (member: AgencyMember) => {
    setMemberToDelete(member);
    
    // Verificar si el miembro está en otras agencias
    if (member.userId && agencyId) {
      try {
        const { data: otherAgencies } = await supabase
          .from('user_agencies')
          .select('agency_id')
          .eq('user_id', member.userId)
          .neq('agency_id', agencyId);
        
        setMemberInOtherAgencies(otherAgencies && otherAgencies.length > 0);
      } catch (error) {
        console.error('Error verificando otras agencias:', error);
        setMemberInOtherAgencies(null);
      }
    } else {
      setMemberInOtherAgencies(null);
    }
    
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!memberToDelete || !memberToDelete.userId || !agencyId) return;

    // Validar que no se elimine al último admin
    const adminMembers = members.filter(m => m.isAdmin);
    if (adminMembers.length === 1 && memberToDelete.isAdmin) {
      toast.error('No puedes eliminar al último administrador de la agencia');
      setIsDeleteDialogOpen(false);
      setMemberToDelete(null);
      return;
    }

    setIsRemoving(true);
    try {
      const result = await removeUserFromAgency(memberToDelete.userId, agencyId);
      if (result.completelyRemoved) {
        toast.success('Usuario eliminado completamente del sistema');
      } else {
        toast.success('Usuario desvinculado de esta agencia (permanece en otras agencias)');
      }
      setIsDeleteDialogOpen(false);
      setMemberToDelete(null);
      
      // Recargar miembros
      if (!loadingRef.current) {
        loadingRef.current = true;
        setIsLoading(true);
        try {
          const membersData = await getAgencyMembers(agencyId);
          setMembers(membersData);
        } catch (reloadError: any) {
          console.error('Error recargando miembros:', reloadError);
          toast.error(reloadError.message || 'Error al recargar los miembros');
        } finally {
          setIsLoading(false);
          loadingRef.current = false;
        }
      }
    } catch (error: any) {
      console.error('Error eliminando miembro:', error);
      toast.error(error.message || 'Error al eliminar el miembro');
      setIsRemoving(false);
    } finally {
      setIsRemoving(false);
    }
  };

  const handleInviteSuccess = async () => {
    if (!agencyId || loadingRef.current) return;
    loadingRef.current = true;
    setIsLoading(true);
    try {
      const membersData = await getAgencyMembers(agencyId);
      setMembers(membersData);
    } catch (error: any) {
      console.error('Error recargando miembros:', error);
      toast.error(error.message || 'Error al recargar los miembros');
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  };

  const handleEditSuccess = async () => {
    if (!agencyId) return;
    
    // Forzar recarga incluso si loadingRef está activo
    lastAgencyIdRef.current = null; // Invalidar cache de agencyId para forzar recarga
    loadingRef.current = false; // Permitir nueva carga
    
    setIsLoading(true);
    try {
      const membersData = await getAgencyMembers(agencyId);
      setMembers(membersData);
      setIsEditDialogOpen(false);
      setSelectedMember(null);
    } catch (error: any) {
      console.error('Error recargando miembros:', error);
      toast.error(error.message || 'Error al recargar los miembros');
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  };

  const handleTransferOwnership = async () => {
    if (!selectedNewOwnerId || !agencyId) return;

    setIsTransferring(true);
    try {
      await transferAgencyOwnership(selectedNewOwnerId, agencyId);
      toast.success('Propiedad de la agencia transferida correctamente');
      setIsTransferDialogOpen(false);
      setSelectedNewOwnerId('');
      
      // Recargar miembros y agencias
      if (!loadingRef.current) {
        loadingRef.current = true;
        setIsLoading(true);
        try {
          const membersData = await getAgencyMembers(agencyId);
          setMembers(membersData);
        } catch (reloadError: any) {
          console.error('Error recargando miembros:', reloadError);
          toast.error(reloadError.message || 'Error al recargar los miembros');
        } finally {
          setIsLoading(false);
          loadingRef.current = false;
        }
      }
      
      // Recargar agencias para actualizar isPrimary
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('agency-changed'));
      }, 100);
    } catch (error: any) {
      console.error('Error transfiriendo propiedad:', error);
      toast.error(error.message || 'Error al transferir la propiedad');
    } finally {
      setIsTransferring(false);
    }
  };

  // Estadísticas
  const stats = {
    total: members.length,
    active: members.filter(m => m.isActive).length,
    inactive: members.filter(m => m.isActive === false).length,
    admins: members.filter(m => m.isAdmin).length,
    byRole: members.reduce((acc, m) => {
      const role = m.role || 'Sin rol';
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    byDepartment: members.reduce((acc, m) => {
      const dept = m.department || 'Sin departamento';
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  };

  const agency = userAgencies.find(ua => ua.agency.id === agencyId)?.agency || currentAgency;

  if (!hasAccess) {
    return null;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/agencies')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Gestión de Agencia</h1>
            <p className="text-slate-600 mt-1">
              {agency?.name}
            </p>
          </div>
        </div>
        <Button onClick={() => setIsInviteDialogOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Invitar Usuario
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Total Miembros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Activos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Administradores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.admins}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Inactivos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-400">{stats.inactive}</div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de miembros */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Miembros de la agencia
              </CardTitle>
              <CardDescription>
                Gestiona los miembros de la agencia, sus roles y permisos
              </CardDescription>
            </div>
            {/* Botón para transferir propiedad - solo si hay más de un miembro */}
            {members.length > 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsTransferDialogOpen(true)}
                className="gap-2"
              >
                <Crown className="h-4 w-4" />
                Transferir propiedad
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <AgencyMembersList
            members={members}
            onEdit={handleEdit}
            onDelete={handleDelete}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      {/* Diálogos */}
      <InviteUserDialog
        open={isInviteDialogOpen}
        onOpenChange={setIsInviteDialogOpen}
        onSuccess={handleInviteSuccess}
      />

      <EditMemberDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        member={selectedMember}
        onSuccess={handleEditSuccess}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar miembro de la agencia?</AlertDialogTitle>
            <AlertDialogDescription>
              {memberInOtherAgencies === true ? (
                <>
                  Esta acción desvinculará a {memberToDelete?.name} de esta agencia.
                  El usuario permanecerá en otras agencias y mantendrá su cuenta.
                  {memberToDelete?.isAdmin && stats.admins === 1 && (
                    <span className="block mt-2 text-red-600 font-medium">
                      ⚠️ Este es el último administrador. No puedes eliminarlo.
                    </span>
                  )}
                </>
              ) : memberInOtherAgencies === false ? (
                <>
                  Esta acción eliminará completamente a {memberToDelete?.name} del sistema.
                  Se eliminará de esta agencia y de todas las demás, y perderá acceso a su cuenta.
                  {memberToDelete?.isAdmin && stats.admins === 1 && (
                    <span className="block mt-2 text-red-600 font-medium">
                      ⚠️ Este es el último administrador. No puedes eliminarlo.
                    </span>
                  )}
                </>
              ) : (
                <>
                  Esta acción eliminará a {memberToDelete?.name} de esta agencia.
                  {memberToDelete?.isAdmin && stats.admins === 1 && (
                    <span className="block mt-2 text-red-600 font-medium">
                      ⚠️ Este es el último administrador. No puedes eliminarlo.
                    </span>
                  )}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isRemoving || (memberToDelete?.isAdmin && stats.admins === 1)}
              className="bg-red-600 hover:bg-red-700"
            >
              {isRemoving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                'Eliminar de la Agencia'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo de transferencia de propiedad */}
      <AlertDialog open={isTransferDialogOpen} onOpenChange={setIsTransferDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-600" />
              Transferir propiedad de la agencia
            </AlertDialogTitle>
            <AlertDialogDescription>
              Selecciona el nuevo propietario de la agencia. El propietario actual perderá sus privilegios de administrador.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium text-slate-700 mb-2 block">
              Nuevo propietario
            </label>
            <Select value={selectedNewOwnerId} onValueChange={setSelectedNewOwnerId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un miembro" />
              </SelectTrigger>
              <SelectContent>
                {members
                  .filter(m => m.isActive && m.userId) // Solo miembros activos con userId
                  .map(member => (
                    <SelectItem key={member.id} value={member.userId || ''}>
                      <div className="flex items-center gap-2">
                        {member.name}
                        {member.isAdmin && (
                          <Badge variant="outline" className="text-xs">
                            Admin
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {selectedNewOwnerId && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-md">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium mb-1">Advertencia</p>
                    <p>Esta acción transferirá la propiedad de la agencia al miembro seleccionado. Asegúrate de que es la persona correcta.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isTransferring}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleTransferOwnership}
              disabled={isTransferring || !selectedNewOwnerId}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {isTransferring ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Transfiriendo...
                </>
              ) : (
                <>
                  <Crown className="h-4 w-4 mr-2" />
                  Transferir propiedad
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

