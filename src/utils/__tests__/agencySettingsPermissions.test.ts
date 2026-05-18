import { describe, expect, it } from 'vitest';
import {
  ALL_EDITABLE_ROLE_PERMISSIONS,
  isProtectedAdminRole,
  isRolePermissionEnabled,
  normalizeRoleForSave,
} from '@/utils/agencySettingsPermissions';
import { DEFAULT_PERMISSIONS } from '@/types/permissions';
import type { RolePermissions } from '@/types';

describe('isProtectedAdminRole', () => {
  it('trata como protegido si is_system_role es true', () => {
    expect(
      isProtectedAdminRole({
        name: 'Custom',
        is_system_role: true,
        permissions: { can_access_planner: false },
      })
    ).toBe(true);
  });

  it('reconoce nombres reservados en minúsculas tras trim', () => {
    expect(isProtectedAdminRole({ name: '  Administrador  ', permissions: {} })).toBe(true);
    expect(isProtectedAdminRole({ name: 'ADMIN', permissions: {} })).toBe(true);
    expect(isProtectedAdminRole({ name: 'Administrator', permissions: {} })).toBe(true);
  });

  it('no protege roles operativos habituales', () => {
    expect(isProtectedAdminRole({ name: 'Planner', permissions: {} })).toBe(false);
  });
});

describe('isRolePermissionEnabled', () => {
  const base: RolePermissions = { name: 'Editor', permissions: {} };

  it('rol protegido siempre tiene el permiso habilitado', () => {
    expect(isRolePermissionEnabled({ ...base, is_system_role: true }, 'can_access_weekly_forecast')).toBe(
      true
    );
  });

  it('opt-out: ausencia de clave equivale a permitido', () => {
    expect(isRolePermissionEnabled(base, 'can_access_weekly_forecast')).toBe(true);
  });

  it('opt-out: false explícito deniega', () => {
    expect(
      isRolePermissionEnabled(
        { ...base, permissions: { can_access_weekly_forecast: false } },
        'can_access_weekly_forecast'
      )
    ).toBe(false);
  });
});

describe('normalizeRoleForSave', () => {
  it('rol administrador persiste DEFAULT_PERMISSIONS completos', () => {
    const out = normalizeRoleForSave({
      name: 'admin',
      permissions: { can_access_weekly_forecast: false },
    });
    expect(out.is_system_role).toBe(true);
    expect(out.permissions).toEqual(DEFAULT_PERMISSIONS);
  });

  it('rol no protegido materializa todos los permisos editables incluido weekly forecast', () => {
    const out = normalizeRoleForSave({
      name: 'Consultor',
      permissions: { can_access_weekly_forecast: false, can_access_planner: true },
    });
    expect(ALL_EDITABLE_ROLE_PERMISSIONS).toContain('can_access_weekly_forecast');
    expect(out.permissions?.can_access_weekly_forecast).toBe(false);
    expect(out.permissions?.can_access_planner).toBe(true);
  });
});
