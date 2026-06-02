import { useState } from 'react';
import { useAgency } from '@/contexts/AgencyContext';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, UserPlus } from 'lucide-react';
import { toast } from '@/lib/notify';

interface InviteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function InviteUserDialog({ open, onOpenChange, onSuccess }: InviteUserDialogProps) {
  const { currentAgency, inviteUserToAgency } = useAgency();
  const { t } = useAppTranslation();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<string>('');
  const [department, setDepartment] = useState<string>('');
  const [isInviting, setIsInviting] = useState(false);

  // Obtener roles y departamentos disponibles de la agencia
  const availableRoles = currentAgency?.settings?.roles || [];
  const availableDepartments = (() => {
    const raw = currentAgency?.settings?.departments;
    if (!raw || !Array.isArray(raw)) return [];
    return raw.map((d: string | { id: string; name: string }) => (typeof d === 'string' ? { id: d, name: d } : d));
  })();

  // Asegurar que el rol "Administrador" siempre esté disponible
  const ADMIN_ROLE_NAME = 'Administrador';
  const roleNamesFromAgency = availableRoles.map((r: any) => typeof r === 'string' ? r : r.name);
  const roleNames = roleNamesFromAgency.includes(ADMIN_ROLE_NAME) 
    ? roleNamesFromAgency 
    : [ADMIN_ROLE_NAME, ...roleNamesFromAgency];

  const handleInvite = async () => {
    if (!email.trim()) {
      toast.error(t('agencies.inviteDialog.emailRequired'));
      return;
    }

    // Validar formato de email básico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast.error(t('agencies.inviteDialog.invalidEmail'));
      return;
    }

    setIsInviting(true);
    try {
      await inviteUserToAgency(
        email.trim(),
        role || undefined,
        department || undefined
      );
      toast.success(t('agencies.inviteDialog.success'));
      setEmail('');
      setRole('');
      setDepartment('');
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Error invitando usuario:', error);
      toast.error(error.message || t('agencies.inviteDialog.error'));
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            {t('agencies.inviteDialog.title')}
          </DialogTitle>
          <DialogDescription>
            {t('agencies.inviteDialog.description', { agency: currentAgency?.name })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="invite-email">Email *</Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="usuario@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isInviting) {
                  handleInvite();
                }
              }}
            />
          </div>

          {roleNames.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="invite-role">Rol</Label>
              <Select value={role || undefined} onValueChange={(value) => setRole(value || '')}>
                <SelectTrigger id="invite-role">
                  <SelectValue placeholder={t('agencies.inviteDialog.rolePlaceholder')} />
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
              <Label htmlFor="invite-department">Departamento</Label>
              <Select value={department || undefined} onValueChange={(value) => setDepartment(value || '')}>
                <SelectTrigger id="invite-department">
                  <SelectValue placeholder={t('agencies.inviteDialog.departmentPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {availableDepartments.map((dept: { id: string; name: string }) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setEmail('');
              setRole('');
              setDepartment('');
            }}
            disabled={isInviting}
          >
            {t('common.cancel')}
          </Button>
          <Button onClick={handleInvite} disabled={isInviting || !email.trim()}>
            {isInviting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('agencies.inviteDialog.inviting')}
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                {t('agencies.inviteDialog.inviteButton')}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

