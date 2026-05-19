import { describe, expect, it } from 'vitest';
import { DEFAULT_PERMISSIONS } from '@/types/permissions';
import type { RolePermissions } from '@/types';
import {
  AGENCY_ROLE_PERMISSION_GROUPS,
  ALL_EDITABLE_ROLE_PERMISSIONS,
  isProtectedAdminRole,
  isRolePermissionEnabled,
  normalizeRoleForSave,
  normalizeRolesForSave,
  PERMISSION_LABELS,
} from '@/utils/agencySettingsPermissions';

function role(partial: Partial<RolePermissions> & Pick<RolePermissions, 'name'>): RolePermissions {
  return {
    name: partial.name,
    is_system_role: partial.is_system_role,
    permissions: partial.permissions ?? {},
  };
}

describe('isProtectedAdminRole', () => {
  it('marca roles de sistema como protegidos', () => {
    expect(isProtectedAdminRole(role({ name: 'Editor', is_system_role: true }))).toBe(true);
  });

  it('detecta nombres admin habituales sin distinguir mayúsculas y con espacios', () => {
    expect(isProtectedAdminRole(role({ name: '  Administrador  ' }))).toBe(true);
    expect(isProtectedAdminRole(role({ name: 'ADMIN' }))).toBe(true);
    expect(isProtectedAdminRole(role({ name: 'Administrator' }))).toBe(true);
  });

  it('no protege roles operativos con nombre distinto', () => {
    expect(isProtectedAdminRole(role({ name: 'Planificador' }))).toBe(false);
    expect(isProtectedAdminRole(role({ name: 'Admin junior' }))).toBe(false);
  });
});

describe('isRolePermissionEnabled', () => {
  const custom = role({
    name: 'Custom',
    permissions: {
      can_access_planner: false,
      can_access_weekly_forecast: true,
    },
  });

  it('en roles protegidos siempre permite', () => {
    expect(isRolePermissionEnabled(role({ name: 'Admin', is_system_role: true }), 'can_access_planner')).toBe(
      true,
    );
    expect(
      isRolePermissionEnabled(role({ name: 'Administrador', permissions: { can_access_planner: false } }), 'can_access_planner'),
    ).toBe(true);
  });

  it('opt-out: ausencia de clave equivale a permitido', () => {
    expect(isRolePermissionEnabled(custom, 'can_access_projects')).toBe(true);
  });

  it('respeta false explícito y true explícito', () => {
    expect(isRolePermissionEnabled(custom, 'can_access_planner')).toBe(false);
    expect(isRolePermissionEnabled(custom, 'can_access_weekly_forecast')).toBe(true);
  });
});

describe('normalizeRoleForSave', () => {
  it('roles protegidos persisten todos los permisos por defecto explícitos', () => {
    const input = role({
      name: 'Admin',
      is_system_role: true,
      permissions: { can_access_planner: false },
    });
    const out = normalizeRoleForSave(input);
    expect(out.is_system_role).toBe(true);
    expect(out.permissions).toEqual(DEFAULT_PERMISSIONS);
  });

  it('serializa booleanos explícitos para cada permiso editable (forecast incluido)', () => {
    const input = role({
      name: 'Limited',
      permissions: {
        can_access_planner: false,
        can_access_weekly_forecast: false,
      },
    });
    const out = normalizeRoleForSave(input);
    expect(out.permissions.can_access_planner).toBe(false);
    expect(out.permissions.can_access_weekly_forecast).toBe(false);
    expect(out.permissions.can_access_projects).toBe(true);
    for (const key of ALL_EDITABLE_ROLE_PERMISSIONS) {
      expect(typeof out.permissions[key]).toBe('boolean');
    }
  });

  it('normalizeRolesForSave aplica por elemento', () => {
    const a = role({ name: 'A', permissions: { can_access_okrs: false } });
    const b = role({ name: 'Administrador', permissions: { can_access_okrs: false } });
    const [na, nb] = normalizeRolesForSave([a, b]);
    expect(na.permissions.can_access_okrs).toBe(false);
    expect(nb.permissions.can_access_okrs).toBe(true);
  });
});

describe('AGENCY_ROLE_PERMISSION_GROUPS / ALL_EDITABLE_ROLE_PERMISSIONS', () => {
  it('incluye can_access_weekly_forecast en permisos editables (alineado con ruta /weekly-forecast)', () => {
    expect(ALL_EDITABLE_ROLE_PERMISSIONS).toContain('can_access_weekly_forecast');
  });

  it('cada permiso editable tiene etiqueta en PERMISSION_LABELS', () => {
    for (const key of ALL_EDITABLE_ROLE_PERMISSIONS) {
      expect(PERMISSION_LABELS[key]).toBeDefined();
    }
  });

  it('no hay permisos duplicados entre grupos', () => {
    const flat = AGENCY_ROLE_PERMISSION_GROUPS.flatMap((g) => g.permissions);
    const unique = new Set(flat);
    expect(unique.size).toBe(flat.length);
  });
});
