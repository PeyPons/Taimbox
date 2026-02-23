# Aplicar migraciones en el servidor (cronómetro y cleanup_employee_data)

Para que el **cronómetro de tareas** y la **función cleanup_employee_data** funcionen en producción, hay que aplicar las migraciones de Supabase en la base de datos. Orden obligatorio:

1. `20260221000000_create_active_timers_and_log_timer_hours.sql` — tabla `active_timers`, RLS, constraint en `time_entries`, RPC `log_timer_hours`
2. `20260221100000_time_entries_max_hours_configurable.sql` — límite 24h en `time_entries`
3. `20260221110000_cleanup_employee_data.sql` — función `cleanup_employee_data(p_employee_id)`
4. `20260221130000_time_entries_add_unique_constraint.sql` — UNIQUE (allocation_id, date) en `time_entries` (permite UPSERT en la RPC)
5. `20260221140000_create_timer_sessions.sql` — tabla `timer_sessions` (caja negra para webhooks/Perfex), RPC `log_timer_hours` con captura de start/end e UPSERT en time_entries, `cleanup_employee_data` incluye timer_sessions
6. `20260221150000_time_entries_rls.sql` — RLS en `time_entries` y política SELECT para que el empleado vea sus propias filas (sin esto, tras recargar la web las horas guardadas aparecen en 0)
7. `20260221160000_time_entries_unique_per_employee.sql` — UNIQUE por (employee_id, allocation_id, date) y RPC actualizada; así cada empleado tiene su fila y el UPSERT no pisa la de otro (evita ver horas en 0 tras guardar)
8. `20260221170000_log_timer_hours_conflict_employee.sql` — **Solo** reemplaza la función `log_timer_hours` para ON CONFLICT (employee_id, allocation_id, date).
9. `20260221180000_drop_time_entries_allocation_date_key.sql` — **Elimina** `time_entries_allocation_id_date_key` (allocation_id, date). Si sigue existiendo junto con el unique por empleado, solo puede haber una fila por tarea/día y las horas se guardan en la fila equivocada; al recargar se ve 0.

**Convención del proyecto (self-hosted):** Mismas rutas y variables que en [supabase/scripts/README-deploy.md](../supabase/scripts/README-deploy.md) para Edge Functions: Taimbox en `~/Taimbox`, Supabase en `~/supabase-pi/supabase/docker`. Las migraciones se aplican conectando por `psql` al contenedor de Postgres de ese mismo entorno.

---

## Opción A: Supabase Cloud (Dashboard)

1. Entra en [Supabase Dashboard](https://app.supabase.com) → tu proyecto → **SQL Editor**.
2. Ejecuta **en este orden**, pegando todo el contenido de cada archivo y pulsando **Run**:
   - `supabase/migrations/20260221000000_create_active_timers_and_log_timer_hours.sql`
   - `supabase/migrations/20260221100000_time_entries_max_hours_configurable.sql`
   - `supabase/migrations/20260221110000_cleanup_employee_data.sql`
   - `supabase/migrations/20260221130000_time_entries_add_unique_constraint.sql`
   - `supabase/migrations/20260221140000_create_timer_sessions.sql`
   - `supabase/migrations/20260221150000_time_entries_rls.sql`
   - `supabase/migrations/20260221160000_time_entries_unique_per_employee.sql`
   - `supabase/migrations/20260221170000_log_timer_hours_conflict_employee.sql`
   - `supabase/migrations/20260221180000_drop_time_entries_allocation_date_key.sql`

Si alguna ya la aplicaste antes, puedes saltarla. Si 7 te dio error "relation ... already exists", ejecuta solo la 8. Si tras aplicar todo las horas siguen en 0 al recargar, ejecuta la 9 para quitar el constraint antiguo (allocation_id, date). (por ejemplo, para sesiones exactas/webhooks ejecuta solo la 5).

---

## Opción B: Self-hosted (mismo entorno que Edge Functions)

Rutas por defecto como en **README-deploy.md**: proyecto en `~/Taimbox`, Supabase Docker en `~/supabase-pi/supabase/docker`. Si usas otras rutas, define `TIMBOXING_DIR` y `SUPABASE_DOCKER_DIR` igual que para el deploy de funciones.

### 1. Subir las migraciones al servidor

**Desde tu PC** (carpeta del proyecto):

```bash
# Sustituye usuario e IP/dominio por los tuyos (mismo criterio que para subir functions)
rsync -avz supabase/migrations/ usuario@IP_O_DOMINIO:~/Taimbox/supabase/migrations/
```

Si no tienes `rsync`, usa `scp`:

```bash
scp -r supabase/migrations usuario@IP_O_DOMINIO:~/Taimbox/supabase/
```

O en el **servidor**, si el repo ya está clonado: `cd ~/Taimbox && git pull` para tener los archivos.

### 2. En el servidor: aplicar las migraciones

Conectado por SSH al servidor:

```bash
cd ~/Taimbox
# Rutas distintas: export TIMBOXING_DIR=/ruta/timeboxing  SUPABASE_DOCKER_DIR=/ruta/supabase-pi/supabase/docker
```

**Opción 2a – Con docker compose** (recomendado si usas el mismo compose que en README-deploy):

```bash
cd ~/Taimbox
SUPABASE_DOCKER_DIR="${SUPABASE_DOCKER_DIR:-$HOME/supabase-pi/supabase/docker}"
DB_SERVICE="db"   # nombre del servicio Postgres en tu docker-compose (puede ser "db" o "postgres")

for f in supabase/migrations/20260221000000_create_active_timers_and_log_timer_hours.sql \
         supabase/migrations/20260221100000_time_entries_max_hours_configurable.sql \
         supabase/migrations/20260221110000_cleanup_employee_data.sql \
         supabase/migrations/20260221130000_time_entries_add_unique_constraint.sql \
         supabase/migrations/20260221140000_create_timer_sessions.sql \
         supabase/migrations/20260221150000_time_entries_rls.sql \
         supabase/migrations/20260221160000_time_entries_unique_per_employee.sql \
         supabase/migrations/20260221170000_log_timer_hours_conflict_employee.sql \
         supabase/migrations/20260221180000_drop_time_entries_allocation_date_key.sql; do
  echo "Aplicando $f ..."
  docker compose -f "$SUPABASE_DOCKER_DIR/docker-compose.yml" exec -T "$DB_SERVICE" psql -U postgres -d postgres < "$f"
done
echo "Hecho."
```

**Opción 2b – Con nombre de contenedor** (si no usas compose o prefieres `docker exec`):

```bash
# Descubrir el contenedor de Postgres (mismo entorno que el Edge Runtime)
docker ps -a   # busca el que ejecuta postgres (ej. supabase-db o <proyecto>-db-1)

DB_CONTAINER="supabase-db"   # ajusta al nombre que tengas

for f in supabase/migrations/20260221000000_create_active_timers_and_log_timer_hours.sql \
         supabase/migrations/20260221100000_time_entries_max_hours_configurable.sql \
         supabase/migrations/20260221110000_cleanup_employee_data.sql \
         supabase/migrations/20260221130000_time_entries_add_unique_constraint.sql \
         supabase/migrations/20260221140000_create_timer_sessions.sql \
         supabase/migrations/20260221150000_time_entries_rls.sql \
         supabase/migrations/20260221160000_time_entries_unique_per_employee.sql \
         supabase/migrations/20260221170000_log_timer_hours_conflict_employee.sql \
         supabase/migrations/20260221180000_drop_time_entries_allocation_date_key.sql; do
  echo "Aplicando $f ..."
  docker exec -i "$DB_CONTAINER" psql -U postgres -d postgres < "$HOME/Taimbox/$f"
done
echo "Hecho."
```

Si tu base de datos o usuario no son `postgres`, cambia `-U postgres -d postgres` por los correctos (igual que en tu compose/variables de Supabase).

### 3. Solo una migración concreta

Si las anteriores ya están aplicadas y solo quieres la función de limpieza (3), el UNIQUE en time_entries (4) o timer_sessions/webhooks (5):

```bash
cd ~/Taimbox
# Con compose:
docker compose -f "$SUPABASE_DOCKER_DIR/docker-compose.yml" exec -T "$DB_SERVICE" psql -U postgres -d postgres < supabase/migrations/20260221140000_create_timer_sessions.sql

# O con contenedor:
docker exec -i supabase-db psql -U postgres -d postgres < supabase/migrations/20260221140000_create_timer_sessions.sql
```
Para aplicar solo la (3) cleanup: `20260221110000_cleanup_employee_data.sql`. Para solo sesiones/webhooks: `20260221140000_create_timer_sessions.sql`. Para que las horas se vean tras recargar: `20260221150000_time_entries_rls.sql`. Para UPSERT por empleado: `20260221160000_time_entries_unique_per_employee.sql`. Para solo actualizar la función: `20260221170000_log_timer_hours_conflict_employee.sql`. Si las horas siguen en 0 al recargar: `20260221180000_drop_time_entries_allocation_date_key.sql`.

### 4. Comprobar que la función existe

```bash
# Con compose (ajusta DB_SERVICE)
docker compose -f "$SUPABASE_DOCKER_DIR/docker-compose.yml" exec -T "$DB_SERVICE" psql -U postgres -d postgres -c "\df public.cleanup_employee_data"

# O con contenedor
docker exec -it supabase-db psql -U postgres -d postgres -c "\df public.cleanup_employee_data"
```

Deberías ver una línea con `cleanup_employee_data(uuid)`.

Para comprobar la tabla de cronómetros: mismo comando cambiando `-c "\df public.cleanup_employee_data"` por `-c "\dt public.active_timers"`.

---

## Desde tu PC: subir migraciones y aplicarlas en el servidor

Una sola secuencia desde la carpeta del proyecto en tu PC (mismo estilo que la sección "Desde tu PC" de README-deploy):

```bash
# 1. Subir migraciones
rsync -avz supabase/migrations/ usuario@TU_SERVIDOR:~/Taimbox/supabase/migrations/

# 2. Aplicar en el servidor (una línea por SSH; ajusta DB_SERVICE o DB_CONTAINER)
ssh usuario@TU_SERVIDOR "cd ~/Taimbox && SUPABASE_DOCKER_DIR=\$HOME/supabase-pi/supabase/docker DB_SERVICE=db && for f in supabase/migrations/20260221000000_create_active_timers_and_log_timer_hours.sql supabase/migrations/20260221100000_time_entries_max_hours_configurable.sql supabase/migrations/20260221110000_cleanup_employee_data.sql supabase/migrations/20260221130000_time_entries_add_unique_constraint.sql supabase/migrations/20260221140000_create_timer_sessions.sql supabase/migrations/20260221150000_time_entries_rls.sql supabase/migrations/20260221160000_time_entries_unique_per_employee.sql supabase/migrations/20260221170000_log_timer_hours_conflict_employee.sql supabase/migrations/20260221180000_drop_time_entries_allocation_date_key.sql; do echo \"Aplicando \$f ...\"; docker compose -f \$SUPABASE_DOCKER_DIR/docker-compose.yml exec -T \$DB_SERVICE psql -U postgres -d postgres < ~/Taimbox/\$f; done; echo Hecho."
```

Sustituye `usuario`, `TU_SERVIDOR` y `DB_SERVICE` (o usa el bloque con `DB_CONTAINER` y `docker exec` si no usas compose).

---

Tras aplicar las migraciones, la app podrá usar el cronómetro de tareas y, al eliminar un empleado, `cleanup_employee_data` limpiará sus datos (incluido `active_timers`) antes del borrado.
