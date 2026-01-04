# Migración para Permitir Múltiples Empleados por Email

## Resumen

Esta migración permite que un usuario aparezca en el equipo de todas sus agencias simultáneamente, eliminando la restricción única de `email` y creando una restricción única compuesta de `(email, agency_id)`.

## Cambios en la Base de Datos

### 1. Ejecutar la Migración SQL

Ejecuta el archivo `supabase/migrations/allow_multiple_employees_per_email.sql` en tu base de datos de Supabase.

**Pasos:**

1. Ve al Dashboard de Supabase: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a "SQL Editor"
4. Copia y pega el contenido de `supabase/migrations/allow_multiple_employees_per_email.sql`
5. Ejecuta la migración

**O usando Supabase CLI:**

```bash
cd /Users/alex/.cursor/worktrees/Timeboxing-2/cyt
npx supabase db push
```

### 2. Cambios Realizados

- **Eliminada**: Restricción única `employees_email_key` en el campo `email`
- **Creada**: Restricción única compuesta `employees_email_agency_unique` en `(email, agency_id)`
- **Creados**: Índices para mejorar el rendimiento:
  - `idx_employees_email`: Para búsquedas por email
  - `idx_employees_user_agency`: Para búsquedas por `(user_id, agency_id)`

### 3. Comportamiento Después de la Migración

- ✅ Un usuario puede tener múltiples registros de empleado (uno por agencia)
- ✅ El mismo email puede existir en diferentes agencias
- ✅ No se permiten duplicados de `(email, agency_id)` en la misma agencia
- ✅ Mejor rendimiento en búsquedas por email y por usuario/agencia

## Cambios en el Código

### Edge Function Actualizada

La función `invite-user-to-agency` ha sido actualizada para:

1. **Crear un nuevo empleado por agencia**: En lugar de mover el empleado existente, ahora crea un nuevo registro para cada agencia.
2. **Verificar duplicados**: Solo verifica si existe un empleado con el mismo `user_id` y `agency_id`, no por email.
3. **Manejo simplificado**: Ya no necesita manejar el caso especial de restricción única de email.

### Despliegue de la Edge Function

La Edge Function ya está actualizada en el código. Despliega los cambios:

```bash
cd /Users/alex/.cursor/worktrees/Timeboxing-2/cyt
npx supabase functions deploy invite-user-to-agency
```

## Verificación

Después de ejecutar la migración y desplegar la función:

1. **Invita a un usuario existente a una nueva agencia**
2. **Verifica que el usuario aparece en ambas agencias**:
   - En la agencia original: debe seguir apareciendo
   - En la nueva agencia: debe aparecer como nuevo miembro
3. **Verifica en la base de datos**:
   ```sql
   SELECT id, email, agency_id, user_id 
   FROM employees 
   WHERE email = 'usuario@ejemplo.com';
   ```
   Deberías ver múltiples registros con el mismo email pero diferentes `agency_id`.

## Rollback (Si es Necesario)

Si necesitas revertir los cambios:

```sql
-- Eliminar la restricción única compuesta
DROP INDEX IF EXISTS employees_email_agency_unique;

-- Restaurar la restricción única de email
ALTER TABLE employees ADD CONSTRAINT employees_email_key UNIQUE (email);
```

**Nota**: El rollback moverá todos los empleados duplicados a una sola agencia (la primera encontrada), lo que puede causar pérdida de datos.

## Notas Importantes

- ⚠️ **Backup**: Haz un backup de la base de datos antes de ejecutar la migración
- ⚠️ **Testing**: Prueba en un entorno de desarrollo primero
- ⚠️ **Datos existentes**: Los empleados existentes no se verán afectados, pero ahora podrás crear nuevos empleados con el mismo email en diferentes agencias

