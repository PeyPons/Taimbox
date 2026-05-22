import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  RESTRICTED_PERMISSIONS,
  findRoleConfigByName,
  resolveUserPermissions,
  canAccessRoute,
  hasPermissionFlag,
} from '@/utils/permissionsUtils';
import { ROUTE_PERMISSIONS, type UserPermissions } from '@/types/permissions';

describe('findRoleConfigByName', () => {
  it('resuelve por nombre ignorando mayúsculas y espacios', () => {
    const roles = [{ name: '  Senior  ', permissions: { can_access_planner: true } }];
    expect(findRoleConfigByName(roles, 'senior')).toEqual(roles[0]);
  });

  it('entrada solo string que coincide con el rol del usuario devuelve null (sin objeto de permisos)', () => {
    const roles = ['Senior'];
    expect(findRoleConfigByName(roles, 'Senior')).toBeNull();
  });

  it('sin coincidencia devuelve null', () => {
    expect(findRoleConfigByName([{ name: 'Junior', permissions: {} }], 'Senior')).toBeNull();
  });
});

describe('resolveUserPermissions', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('rol vacío o solo espacios devuelve permisos restringidos (no DEFAULT)', () => {
    expect(resolveUserPermissions({ currentUserRole: '', agencyRoles: [] })).toEqual(RESTRICTED_PERMISSIONS);
    expect(resolveUserPermissions({ currentUserRole: '   ', agencyRoles: [] })).toEqual(RESTRICTED_PERMISSIONS);
    expect(resolveUserPermissions({ currentUserRole: null, agencyRoles: [] })).toEqual(RESTRICTED_PERMISSIONS);
  });

  it('rol desconocido en agencyRoles emite aviso y devuelve permisos restringidos', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const p = resolveUserPermissions({ currentUserRole: 'Ghost', agencyRoles: [{ name: 'Admin', permissions: {} }] });
    expect(p).toEqual(RESTRICTED_PERMISSIONS);
    expect(warn).toHaveBeenCalled();
  });

  it('hereda operaciones/rentabilidad desde reportes cuando faltan flags explícitos', () => {
    const rolePerms: UserPermissions = {
      can_access_reports: true,
      can_access_operations_radar: undefined,
      can_access_financial_health: undefined,
    };
    const p = resolveUserPermissions({
      currentUserRole: 'Analyst',
      agencyRoles: [{ name: 'Analyst', permissions: rolePerms }],
    });
    expect(p.can_access_operations_radar).toBe(true);
    expect(p.can_access_financial_health).toBe(true);
  });

  it('operaciones/rentabilidad explícitos en false no se sobrescriben con reports true', () => {
    const rolePerms: UserPermissions = {
      can_access_reports: true,
      can_access_operations_radar: false,
      can_access_financial_health: false,
    };
    const p = resolveUserPermissions({
      currentUserRole: 'Analyst',
      agencyRoles: [{ name: 'Analyst', permissions: rolePerms }],
    });
    expect(p.can_access_operations_radar).toBe(false);
    expect(p.can_access_financial_health).toBe(false);
  });
});

describe('canAccessRoute', () => {
  const base: UserPermissions = { ...RESTRICTED_PERMISSIONS, can_access_weekly_forecast: true };

  it('/weekly-forecast exige can_access_weekly_forecast distinto de false', () => {
    expect(canAccessRoute({ ...base, can_access_weekly_forecast: false }, '/weekly-forecast', ROUTE_PERMISSIONS)).toBe(
      false
    );
    expect(canAccessRoute({ ...base, can_access_weekly_forecast: true }, '/weekly-forecast', ROUTE_PERMISSIONS)).toBe(
      true
    );
    expect(canAccessRoute({ ...base, can_access_weekly_forecast: undefined }, '/weekly-forecast', ROUTE_PERMISSIONS)).toBe(
      true
    );
  });

  it('ruta sin mapeo en ROUTE_PERMISSIONS permite acceso', () => {
    expect(canAccessRoute({ ...base, can_access_planner: false }, '/ruta-legacy-sin-permiso', ROUTE_PERMISSIONS)).toBe(
      true
    );
  });
});

describe('hasPermissionFlag', () => {
  it('false deniega; undefined y true permiten', () => {
    expect(hasPermissionFlag({ can_access_okrs: false }, 'can_access_okrs')).toBe(false);
    expect(hasPermissionFlag({ can_access_okrs: undefined }, 'can_access_okrs')).toBe(true);
    expect(hasPermissionFlag({ can_access_okrs: true }, 'can_access_okrs')).toBe(true);
  });
});
