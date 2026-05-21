import { describe, expect, it, vi } from 'vitest';
import { ROUTE_PERMISSIONS } from '@/types/permissions';
import {
  RESTRICTED_PERMISSIONS,
  canAccessRoute,
  findRoleConfigByName,
  hasPermissionFlag,
  resolveUserPermissions,
} from '@/utils/permissionsUtils';

describe('permissionsUtils', () => {
  describe('findRoleConfigByName', () => {
    it('devuelve null si el rol del usuario está vacío', () => {
      expect(findRoleConfigByName([{ name: 'Admin', permissions: {} }], '   ')).toBeNull();
    });

    it('coincide por nombre normalizado (mayúsculas / espacios)', () => {
      const cfg = findRoleConfigByName([{ name: '  Project Lead ', permissions: { can_access_planner: true } }], 'project lead');
      expect(cfg?.permissions?.can_access_planner).toBe(true);
    });

    it('si el rol existe solo como string en la lista, devuelve null (sin objeto de permisos)', () => {
      expect(findRoleConfigByName(['Manager', { name: 'Other', permissions: {} }], 'manager')).toBeNull();
    });
  });

  describe('resolveUserPermissions', () => {
    it('sin rol asignado devuelve permisos mínimos (no acceso planner ni weekly forecast)', () => {
      expect(resolveUserPermissions({ currentUserRole: null, agencyRoles: [] })).toEqual(RESTRICTED_PERMISSIONS);
      expect(resolveUserPermissions({ currentUserRole: '   ', agencyRoles: [] }).can_access_planner).toBe(false);
      expect(resolveUserPermissions({ currentUserRole: '', agencyRoles: [] }).can_access_weekly_forecast).toBe(false);
      expect(resolveUserPermissions({ currentUserRole: null, agencyRoles: [] }).can_access_deadlines).toBe(true);
    });

    it('hereda operaciones y finanzas desde can_access_reports si faltan flags explícitos', () => {
      const p = resolveUserPermissions({
        currentUserRole: 'Analista',
        agencyRoles: [
          {
            name: 'Analista',
            permissions: { can_access_reports: true },
          },
        ],
      });
      expect(p.can_access_operations_radar).toBe(true);
      expect(p.can_access_financial_health).toBe(true);
    });

    it('si el rol no tiene configuración conocida, aplica restringido y avisa en consola', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const p = resolveUserPermissions({
        currentUserRole: 'RolInexistente',
        agencyRoles: [{ name: 'Otro', permissions: { can_access_planner: true } }],
      });
      expect(p).toEqual(RESTRICTED_PERMISSIONS);
      expect(warn).toHaveBeenCalled();
      warn.mockRestore();
    });
  });

  describe('canAccessRoute', () => {
    it('bloquea /weekly-forecast cuando el flag está en false', () => {
      const perms = { ...RESTRICTED_PERMISSIONS, can_access_weekly_forecast: false };
      expect(canAccessRoute(perms, '/weekly-forecast', ROUTE_PERMISSIONS)).toBe(false);
    });

    it('permite rutas no mapeadas', () => {
      expect(canAccessRoute(RESTRICTED_PERMISSIONS, '/ruta-sin-mapeo', ROUTE_PERMISSIONS)).toBe(true);
    });
  });

  describe('hasPermissionFlag', () => {
    it('trata undefined como permitido (solo false niega)', () => {
      expect(hasPermissionFlag({}, 'can_access_planner')).toBe(true);
      expect(hasPermissionFlag({ can_access_planner: false }, 'can_access_planner')).toBe(false);
    });
  });
});
