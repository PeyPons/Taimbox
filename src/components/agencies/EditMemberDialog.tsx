import { useState, useEffect } from 'react';
import { useAgency } from '@/contexts/AgencyContext';
import { AgencyMember } from '@/contexts/AgencyContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, UserCog } from 'lucide-react';
import { toast } from 'sonner';

interface EditMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: AgencyMember | null;
  onSuccess?: () => void;
}

export function EditMemberDialog({ open, onOpenChange, member, onSuccess }: EditMemberDialogProps) {
  const { currentAgency, updateUserAgencyRole } = useAgency();
  const [role, setRole] = useState<string>('');
  const [department, setDepartment] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Obtener roles y departamentos disponibles
  const availableRoles = currentAgency?.settings?.roles || [];
  const availableDepartments = currentAgency?.settings?.departments || [];

  // Asegurar que el rol "Administrador" siempre esté disponible
  const ADMIN_ROLE_NAME = 'Administrador';
  const roleNamesFromAgency = availableRoles.map((r: any) => typeof r === 'string' ? r : r.name);
  const roleNames = roleNamesFromAgency.includes(ADMIN_ROLE_NAME) 
    ? roleNamesFromAgency 
    : [ADMIN_ROLE_NAME, ...roleNamesFromAgency];

  // Inicializar valores cuando se abre el diálogo
  useEffect(() => {
    if (open && member) {
      setRole(member.role || '');
      setDepartment(member.department || '');
    }
  }, [open, member]);

  const handleUpdate = async () => {
    if (!member || !member.userId || !currentAgency?.id) {
      toast.error('Datos del miembro no válidos');
      return;
    }

    setIsUpdating(true);
    try {
      await updateUserAgencyRole(
        member.userId,
        currentAgency.id,
        role || '',
        department || undefined
      );
      toast.success('Miembro actualizado correctamente');
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Error actualizando miembro:', error);
      toast.error(error.message || 'Error al actualizar el miembro');
    } finally {
      setIsUpdating(false);
    }
  };

  if (!member) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            Editar Miembro
          </DialogTitle>
          <DialogDescription>
            Actualiza el rol y departamento de {member.name} en esta agencia.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Miembro</Label>
            <div className="p-3 bg-slate-50 rounded-md border border-slate-200">
              <p className="font-medium text-slate-900">{member.name}</p>
              {member.email && (
                <p className="text-sm text-slate-500">{member.email}</p>
              )}
            </div>
          </div>

          {roleNames.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="edit-role">Rol</Label>
              <Select value={role || undefined} onValueChange={(value) => setRole(value || '')}>
                <SelectTrigger id="edit-role">
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent>
                  {roleNames.map((roleName) => (
                    <SelectItem key={roleName} value={roleName}>
                      {roleName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {availableDepartments.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="edit-department">Departamento</Label>
              <Select value={department || undefined} onValueChange={(value) => setDepartment(value || '')}>
                <SelectTrigger id="edit-department">
                  <SelectValue placeholder="Selecciona un departamento" />
                </SelectTrigger>
                <SelectContent>
                  {availableDepartments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-md border border-slate-200">
            <div>
              <Label>Estado</Label>
              <p className="text-sm text-slate-500">
                {member.isActive ? 'Activo' : 'Inactivo'}
              </p>
            </div>
            {member.isAdmin && (
              <div className="flex items-center gap-2 text-primary">
                <span className="text-sm font-medium">Administrador</span>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isUpdating}
          >
            Cancelar
          </Button>
          <Button onClick={handleUpdate} disabled={isUpdating}>
            {isUpdating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Actualizando...
              </>
            ) : (
              'Guardar Cambios'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

