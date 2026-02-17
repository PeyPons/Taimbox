# RLS: que todos los miembros de la agencia vean los mismos datos

## Problema

Si un usuario (no admin) entra y ve proyectos/empleados pero **0h asignadas y 0% disponibilidad**, suele ser que **`requesting_agency_id()` devuelve NULL** para ese usuario, así que las políticas RLS filtran todo.

## 1. Asegurar la función `requesting_agency_id()`

Ejecuta en el **SQL Editor** de Supabase:

**`supabase/scripts/rls_requesting_agency_id.sql`**

Esa función debe devolver:
- Para **tokens API**: el `agency_id` del JWT.
- Para **usuarios de la app**: el `agency_id` de la tabla **user_agencies** (donde `user_id = auth.uid()`), priorizando la fila con `is_primary = true`.

Si el usuario tiene fila en **user_agencies** pero la función no existe o está mal, devolverá NULL y verá 0 datos.

## 2. Políticas SELECT correctas (por agencia, no por usuario)

Todos los miembros de la agencia deben ver **los mismos** datos. Las políticas deben filtrar por **agencia**, no por “solo mis filas”:

| Tabla | Política SELECT correcta |
|-------|---------------------------|
| **employees** | `agency_id = requesting_agency_id()` |
| **projects** | `agency_id = requesting_agency_id()` |
| **allocations** | `employee_id IN (SELECT id FROM employees WHERE agency_id = requesting_agency_id())` |
| **deadlines** | `project_id IN (SELECT id FROM projects WHERE agency_id = requesting_agency_id())` |
| **absences** | `employee_id IN (SELECT id FROM employees WHERE agency_id = requesting_agency_id())` |
| **team_events** | `agency_id = requesting_agency_id()` |

**Incorrecto** (solo vería sus propios datos):  
`employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())`

En **Supabase** → **Authentication** → **Policies** (o **Table Editor** → tabla → RLS) revisa que las políticas **SELECT** de `allocations`, `deadlines`, `employees`, `projects` usen `requesting_agency_id()` como arriba, no `auth.uid()` para restringir a “solo yo”.

## 3. Comprobar qué devuelve la función (diagnóstico)

Con un usuario que tenga problema, no se puede ejecutar en el SQL Editor (ahí no hay JWT de ese usuario). En la app puedes añadir temporalmente en la consola del navegador (estando logueado):

```javascript
// En la consola del navegador (con el usuario problemático logueado):
const { data } = await window.__SUPABASE__?.rpc('requesting_agency_id');
console.log('requesting_agency_id:', data);
```

O crear una RPC de diagnóstico que devuelva `requesting_agency_id()` y llamarla desde la app; si devuelve `null`, el fallo está en esa función o en **user_agencies** para ese usuario.
