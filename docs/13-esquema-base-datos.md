# 13. Esquema de base de datos (referencia)

Este módulo documenta una **foto del modelo relacional** útil para agentes, onboarding técnico y revisiones de RLS. **No sustituye** a las migraciones ejecutables del repo.

## 13.1. Fuente de verdad

| Origen | Uso |
|--------|-----|
| **`supabase/migrations/*.sql`** | Lo que realmente se aplica al crear o actualizar una instancia. |
| **[`docs/sql/schema-snapshot-context.sql`](sql/schema-snapshot-context.sql)** | DDL agregado como **contexto** (orden de tablas y dependencias puede no ser aplicable tal cual). Útil para búsqueda rápida de columnas y FK. |

Si el código o una migración **contradice** el snapshot, **prevalece el código y las migraciones**.

## 13.2. Multi-tenant y membresía

- **`agencies`**: tenant (nombre único, `slug`, `settings` JSONB, facturación Stripe, planes, tokens Ads opcionales).
- **`employees`**: persona en una agencia (`agency_id` obligatorio); `user_id` enlaza con `auth.users` cuando tiene login.
- **`user_agencies`**: membresía Auth ↔ agencia (`role` / `department` opcionales, duplican en parte la ficha de empleado).
  - **`is_primary`**: agencia **por defecto** para ese usuario cuando tiene varias (login, selector). No es “propietario de la agencia”; el propietario de negocio/facturación debe reflejarse en **`agencies.settings.ownerUserId`** (ver cambios recientes en app y Edge Functions).
  - **`is_impersonation`**: fila usada cuando un platform admin “entra como” agencia (soporte).

## 13.3. Planificador y tiempo

- **`allocations`**: tareas semanales (horas, estado, transferencias, `focus_date`, `user_priority`, bloqueo).
- **`absences`**, **`team_events`**: capacidad y calendario.
- **`time_entries`**, **`timer_sessions`**, **`active_timers`**: registro de tiempo y cronómetro (muchas tablas llevan `agency_id` para RLS directo).
- **`weekly_feedback`**, **`user_routines`**, **`professional_goals`**: feedback y hábitos del empleado.
- **`deadlines`**: foto mensual por proyecto (sin `agency_id`; agencia vía `projects`).
- **`global_assignments`**, **`task_transfers`**, **`project_editing_locks`**: asignaciones globales, transferencias de tareas y bloqueos de edición.

## 13.4. Proyectos y clientes

- **`clients`**, **`projects`**, **`client_settings`** (clave `client_id` text en settings), **`department_config`**.

## 13.5. Ads, API y plataforma

- **`ad_accounts_config`**, **`ads_sync_logs`**, **`meta_sync_logs`**, **`google_ads_campaigns`**, **`meta_ads_campaigns`**, **`google_ads_changes`**, **`segmentation_rules`**.
- **`api_tokens`**: tokens de integración por agencia.
- **`notification_rules`**, **`notification_deliveries`**: reglas de avisos por email por agencia y registro/dedupe de envíos (ver `docs/05`, Edge `notify-task-transfer` / `process-notification-rules`).
- **`audit_logs`**: auditoría (usuario, agencia, recurso).
- **`platform_admins`**: acceso al panel `/admin`.

## 13.6. Soporte

- **`support_tickets`**, **`support_ticket_replies`**.

## 13.7. Tipos y matices del snapshot

- Aparecen tipos **`USER-DEFINED`** (`preferred_view`, `default_view` en `department_config`): en PostgreSQL corresponden a enums del esquema real; el archivo SQL de contexto no es ejecutable literal sin esos tipos creados antes.
- Algunos **CHECK** del volcado (p. ej. `allocations.status`) pueden diferir de lo que usa la aplicación en tipos TypeScript; validar siempre contra migraciones vigentes.

## 13.8. Lectura relacionada

- [02-entidades-modelos.md](02-entidades-modelos.md) — glosario funcional.
- [07-mantenimiento-extension.md](07-mantenimiento-extension.md) — RLS, `user_agency_ids`, extensión de tablas.
- [12-onboarding-registro.md](12-onboarding-registro.md) — registro, invitaciones, `user_agencies`.
