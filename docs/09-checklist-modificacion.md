---

## 9. Checklist de Modificación

Antes de modificar cualquier archivo crítico, usa este checklist:

### Al modificar `src/types/index.ts`:
- [ ] ¿Actualicé todos los mappers en Context? (snake_case → camelCase)
- [ ] ¿Los nuevos campos son opcionales si la DB puede no tenerlos?
- [ ] ¿Revisé la sección 8.1 de dependencias?

### Al modificar `AppContext.tsx`:
- [ ] ¿Mantuve la lógica de UPSERT si es datos incrementales?
- [ ] ¿Actualicé `loadedMonthsRef` si es necesario?
- [ ] ¿Los componentes que usan `useApp()` siguen funcionando?

### Al modificar `capacityUtils.ts` o `dateUtils.ts`:
- [ ] ¿Las funciones mantienen la firma anterior?
- [ ] ¿El algoritmo de Split Weeks sigue funcionando en cambios de año?
- [ ] ¿Probé con fechas edge (31 dic, 1 ene)?

### Al añadir nuevo permiso:
- [ ] Añadido a `UserPermissions` en `src/types/permissions.ts`
- [ ] Añadido a `ROUTE_PERMISSIONS` si protege una ruta
- [ ] Añadido a `DEFAULT_PERMISSIONS` y `RESTRICTED_PERMISSIONS` (en `src/utils/permissionsUtils.ts`)
- [ ] Añadido label en `PERMISSION_LABELS`

### Al modificar lógica de Realtime:
- [ ] ¿Usé un canal unificado `room-{id}` en lugar de múltiples canales?
- [ ] ¿Limpié el canal al desmontar (`removeChannel`)?
- [ ] ¿Filtré eventos por `agency_id` o contexto (ej. `project_id` en lista de proyectos de la agencia) para evitar fugas de datos?

### Al modificar políticas RLS o tokens API:
- [ ] ¿La función `requesting_agency_id()` sigue devolviendo el `agency_id` correcto para ambos escenarios (usuario normal y API token)?
- [ ] ¿Las edge functions `generate-api-token` y `revoke-api-token` verifican permisos del caller (`can_access_api_keys` o `can_access_agency_settings`)?
- [ ] ¿La nueva tabla tiene política RLS? Si no, el acceso será denegado por defecto (RLS habilitado sin policy).
- [ ] ¿El `service_role` key sigue funcionando? (Bypasea RLS, no necesita policy).

### Al cargar o modificar deadlines:
- [ ] ¿Uso `fetchDeadlinesForMonth(monthKey, currentAgency?.id)` o `useDeadlines({ agencyId: currentAgency?.id })` para no mezclar datos entre agencias en el mismo Supabase?
- [ ] ¿Las operaciones de borrado masivo (ej. "Resetear mes") filtran por proyectos de la agencia?

### Al crear componente que muestra nombres de proyectos:
- [ ] Importar `useProjectAliasing` de `@/hooks/useProjectAliasing`
- [ ] Llamar `const { formatName: formatProjectName } = useProjectAliasing()`
- [ ] Usar `formatProjectName(project.name)` en el renderizado
- [ ] Actualizar la tabla en Sección 2.1 "Componentes que usan aliasing"

---
