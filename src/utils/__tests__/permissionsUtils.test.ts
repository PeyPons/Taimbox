import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  RESTRICTED_PERMISSIONS,
  findRoleConfigByName,
  resolveUserPermissions,
  canAccessRoute,
  hasPermissionFlag,
} from '@/utils/permissionsUtils';
import type { UserPermissions } from '@/types/permissions';

describe('findRoleConfigByName', () => {
  it('devuelve el objeto de rol por nombre (insensible a mayúsculas y espacios)', () => {
    const roles = [{ name: '  Editor  ', permissions: { can_access_planner: true } }];
    expect(findRoleConfigByName(roles, 'editor')).toEqual(roles[0]);
  });

  it('devuelve null si el rol del usuario está solo como string en el array (sin permisos)', () => {
    const roles: unknown[] = ['Editor'];
    expect(findRoleConfigByName(roles, 'Editor')).toBeNull();
  });

  it('devuelve null si no hay coincidencia o el nombre de usuario está vacío', () => {
    expect(findRoleConfigByName([{ name: 'Admin', permissions: {} }], 'Otro')).toBeNull();
    expect(findRoleConfigByName([], 'Admin')).toBeNull();
    expect(findRoleConfigByName([{ name: 'Admin' }], '   ')).toBeNull();
  });

  it('ignora entradas que no son objeto con forma de rol', () => {
    const roles: unknown[] = [null, 42, { foo: 'bar' }, { name: 'Target', permissions: { can_access_team: true } }];
    expect(findRoleConfigByName(roles, 'Target')).toEqual({ name: 'Target', permissions: { can_access_team: true } });
  });
});

describe('resolveUserPermissions', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sin rol efectivo devuelve permisos restringidos (no DEFAULT)', () => {
    expect(resolveUserPermissions({ currentUserRole: null, agencyRoles: [] })).toEqual(RESTRICTED_PERMISSIONS);
    expect(resolveUserPermissions({ currentUserRole: '', agencyRoles: [] })).toEqual(RESTRICTED_PERMISSIONS);
    expect(resolveUserPermissions({ currentUserRole: '   ', agencyRoles: [] })).toEqual(RESTRICTED_PERMISSIONS);
  });

  it('usa permisos del rol configurado y hereda radar/finanzas desde informes si faltan', () => {
    const perms: UserPermissions = {
      can_access_reports: true,
      can_access_planner: true,
      can_access_operations_radar: undefined,
      can_access_financial_health: undefined,
    };
    const resolved = resolveUserPermissions({
      currentUserRole: 'Analista',
      agencyRoles: [{ name: 'Analista', permissions: perms }],
    });
    expect(resolved.can_access_operations_radar).toBe(true);
    expect(resolved.can_access_financial_health).toBe(true);
    expect(resolved.can_access_planner).toBe(true);
  });

  it('si can_access_reports es false, los flags radar/finanzas undefined quedan en false', () => {
    const resolved = resolveUserPermissions({
      currentUserRole: 'Rol',
      agencyRoles: [
        {
          name: 'Rol',
          permissions: {
            can_access_reports: false,
            can_access_operations_radar: undefined,
            can_access_financial_health: undefined,
          },
        },
      ],
    });
    expect(resolved.can_access_operations_radar).toBe(false);
    expect(resolved.can_access_financial_health).toBe(false);
  });

  it('sin configuración de rol coincide con permisos restringidos y avisa', () => {
    const roles = [{ name: 'Otro', permissions: { can_access_planner: true } }];
    const out = resolveUserPermissions({ currentUserRole: 'Desconocido', agencyRoles: roles });
    expect(out).toEqual(RESTRICTED_PERMISSIONS);
    expect(console.warn).toHaveBeenCalled();
  });
});

describe('canAccessRoute', () => {
  const map = { '/planner': 'can_access_planner' as const, '/weekly-forecast': 'can_access_weekly_forecast' as const };

  it('permite rutas sin clave en el mapa', () => {
    expect(canAccessRoute({ can_access_planner: false } as UserPermissions, '/sin-mapear', map)).toBe(true);
  });

  it('deniega cuando el permiso explícito es false', () => {
    expect(
      canAccessRoute({ can_access_weekly_forecast: false } as UserPermissions, '/weekly-forecast', map),
    ).toBe(false);
  });

  it('permite cuando el permiso no es false (true o ausente en sentido !== false)', () => {
    expect(canAccessRoute({ can_access_planner: true } as UserPermissions, '/planner', map)).toBe(true);
    expect(canAccessRoute({} as UserPermissions, '/planner', map)).toBe(true);
  });
});

describe('hasPermissionFlag', () => {
  it('es true salvo cuando el flag es explícitamente false', () => {
    expect(hasPermissionFlag({ can_access_okrs: true } as UserPermissions, 'can_access_okrs')).toBe(true);
    expect(hasPermissionFlag({} as UserPermissions, 'can_access_okrs')).toBe(true);
    expect(hasPermissionFlag({ can_access_okrs: false } as UserPermissions, 'can_access_okrs')).toBe(false);
  });
});
