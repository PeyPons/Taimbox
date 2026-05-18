import { describe, expect, it, vi, afterEach } from 'vitest';
import {
  canAccessRoute,
  findRoleConfigByName,
  resolveUserPermissions,
} from '@/utils/permissionsUtils';
import { ROUTE_PERMISSIONS, type UserPermissions } from '@/types/permissions';

describe('findRoleConfigByName', () => {
  it('encuentra el rol ignorando mayúsculas y espacios', () => {
    const roles = [{ name: '  Planner  ', permissions: { can_access_planner: true } }];
    expect(findRoleConfigByName(roles, 'planner')).toEqual(roles[0]);
  });

  it('devuelve null si el nombre de rol del usuario está vacío', () => {
    expect(findRoleConfigByName([{ name: 'x', permissions: {} }], '   ')).toBeNull();
  });

  it('ignora entradas que son solo string y sigue buscando', () => {
    const target = { name: 'Senior', permissions: { can_access_weekly_forecast: false } };
    expect(findRoleConfigByName(['planner', target], 'senior')).toBe(target);
  });
});

describe('resolveUserPermissions', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sin rol asignado devuelve permisos mínimos (weekly forecast denegado)', () => {
    const p = resolveUserPermissions({ currentUserRole: null, agencyRoles: [] });
    expect(p.can_access_weekly_forecast).toBe(false);
    expect(p.can_access_deadlines).toBe(true);
  });

  it('rol desconocido en la agencia devuelve permisos restringidos y avisa', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const p = resolveUserPermissions({
      currentUserRole: 'RolInexistente',
      agencyRoles: [{ name: 'Otro', permissions: { can_access_planner: true } }],
    });
    expect(p.can_access_weekly_forecast).toBe(false);
    expect(warn).toHaveBeenCalled();
  });

  it('respeta can_access_weekly_forecast en false cuando el rol está configurado', () => {
    const p = resolveUserPermissions({
      currentUserRole: 'PM',
      agencyRoles: [
        {
          name: 'PM',
          permissions: { can_access_weekly_forecast: false, can_access_planner: true },
        },
      ],
    });
    expect(p.can_access_weekly_forecast).toBe(false);
    expect(p.can_access_planner).toBe(true);
  });

  it('hereda operaciones/rentabilidad desde can_access_reports legacy', () => {
    const p = resolveUserPermissions({
      currentUserRole: 'Legacy',
      agencyRoles: [
        {
          name: 'Legacy',
          permissions: {
            can_access_reports: true,
            can_access_operations_radar: undefined,
            can_access_financial_health: undefined,
          },
        },
      ],
    });
    expect(p.can_access_operations_radar).toBe(true);
    expect(p.can_access_financial_health).toBe(true);
  });
});

describe('canAccessRoute', () => {
  it('bloquea /weekly-forecast cuando el permiso explícito es false', () => {
    const perms: UserPermissions = { can_access_weekly_forecast: false };
    expect(canAccessRoute(perms, '/weekly-forecast', ROUTE_PERMISSIONS)).toBe(false);
  });

  it('permite /weekly-forecast cuando el permiso no está en false (incl. undefined)', () => {
    const perms: UserPermissions = { can_access_weekly_forecast: undefined };
    expect(canAccessRoute(perms, '/weekly-forecast', ROUTE_PERMISSIONS)).toBe(true);
  });

  it('ruta sin mapeo en ROUTE_PERMISSIONS se considera accesible', () => {
    expect(canAccessRoute({ can_access_planner: false }, '/ruta-libre', ROUTE_PERMISSIONS)).toBe(true);
  });
});
