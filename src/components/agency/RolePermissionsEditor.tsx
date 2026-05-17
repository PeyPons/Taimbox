import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import type { RolePermissions } from '@/types';
import type { UserPermissions } from '@/types/permissions';
import {
  AGENCY_ROLE_PERMISSION_GROUPS,
  isProtectedAdminRole,
  isRolePermissionEnabled,
  PERMISSION_LABELS,
} from '@/utils/agencySettingsPermissions';

interface RolePermissionsEditorProps {
  role: RolePermissions;
  roleIndex: number;
  onToggle: (roleIndex: number, permission: keyof UserPermissions, checked: boolean) => void;
  t: (key: string, fallback: string) => string;
}

export function RolePermissionsEditor({ role, roleIndex, onToggle, t }: RolePermissionsEditorProps) {
  return (
    <div className="p-3 border-t bg-slate-50/50 space-y-4">
      {AGENCY_ROLE_PERMISSION_GROUPS.map((group, groupIndex) => (
        <div key={group.groupKey}>
          {groupIndex > 0 && <Separator className="mb-4" />}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-slate-500 uppercase">
              {t(group.labelKey, group.fallback)}
            </Label>
            {group.permissions.map((p) => (
              <div key={p} className="flex items-center justify-between py-1 px-2 rounded hover:bg-white">
                <Label htmlFor={`role-${roleIndex}-${p}`} className="text-sm font-normal cursor-pointer flex-1">
                  {PERMISSION_LABELS[p]}
                </Label>
                <Switch
                  id={`role-${roleIndex}-${p}`}
                  checked={isRolePermissionEnabled(role, p)}
                  disabled={isProtectedAdminRole(role)}
                  onCheckedChange={(checked) => onToggle(roleIndex, p, checked)}
                  className="scale-75"
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
