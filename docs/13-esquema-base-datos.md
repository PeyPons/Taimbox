# 13. Esquema de base de datos (referencia)

Este módulo documenta una **foto del modelo relacional** útil para agentes, onboarding técnico y revisiones de RLS. **No sustituye** a las migraciones ejecutables del repo.

## 13.1. Fuente de verdad

| Origen | Uso |
|--------|-----|
| **`supabase/migrations/*.sql`** | Lo que realmente se aplica al crear o actualizar una instancia. |
| **[`docs/sql/schema-snapshot-context.sql`](sql/schema-snapshot-context.sql)** | DDL agregado como **contexto** (orden de tablas y dependencias puede no ser aplicable tal cual). Útil para búsqueda rápida de columnas y FK. |
| **MCP Supabase (Cursor)** | Inspección **en vivo** de la instancia self-hosted (`execute_sql`, `get_advisors`). Ver [05-integraciones-automatizacion.md](05-integraciones-automatizacion.md) (§ MCP) y [`.cursor/mcp.json`](../.cursor/mcp.json). No sustituye migraciones versionadas. |

Si el código o una migración **contradice** el snapshot, **prevalece el código y las migraciones**.

## 13.2. Multi-tenant y membresía

- **`agencies`**: tenant (nombre único, `slug`, `settings` JSONB, facturación Stripe, planes, tokens Ads opcionales).
- **`employees`**: persona en una agencia (`agency_id` obligatorio); `user_id` enlaza con `auth.users` cuando tiene login.
- **`user_agencies`**: membresía Auth ↔ agencia (`role` / `department` opcionales, duplican en parte la ficha de empleado).
  - **`is_primary`**: agencia **por defecto** para ese usuario cuando tiene varias (login, selector). No es “propietario de la agencia”; el propietario de negocio/facturación debe reflejarse en **`agencies.settings.ownerUserId`** (ver cambios recientes en app y Edge Functions).
  - **`is_impersonation`**: fila usada cuando un platform admin “entra como” agencia (soporte).

## 13.3. Planificador y tiempo

- **`allocations`**: tareas semanales (horas, estado, transferencias, `focus_date`, `user_priority`, bloqueo). **No tiene `agency_id`**; la agencia se deduce por `employee_id` / `project_id` y RLS. Las queries PostgREST directas a `allocations` no deben pedir columnas ajenas a esta tabla (p. ej. un `select` con `agency_id` devuelve 400).
- **`allocation_notes`**: anotaciones append-only por allocation (`body`, `author_employee_id`, `agency_id`, `source`). Distinto de `weekly_feedback.comments` (cierre semanal) y `time_entries.notes` (cronómetro). La columna legacy `allocations.description` ya no se escribe desde la app; datos migrados a notas con `source = legacy_description`. RPC `copy_allocation_notes` en rollover/transfer/distribución.
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
- **`notification_rules`**, **`notification_deliveries`**: reglas de avisos por email por agencia y registro/dedupe de envíos (ver `docs/05`, Edge `notify-task-transfer`, `process-event-notifications`, `process-notification-rules`).
- **`audit_logs`**: auditoría (usuario, agencia, recurso); se elimina al purgar la agencia.
- **`platform_audit_logs`**: auditoría **a nivel plataforma** (sin `agency_id`); sobrevive al purge. Evento típico `agency_purged` con payload (slug, conteos, `had_stripe_subscription`, `by_user_id`). RLS: solo `platform_admins` pueden `SELECT`; inserción desde RPC `admin_delete_agency` (SECURITY DEFINER). Migración `20260503120000_platform_audit_logs.sql`.
- **`platform_admins`**: acceso al panel `/admin`.

## 13.6. Soporte

- **`support_tickets`**, **`support_ticket_replies`**.

## 13.6b. Review Agents (Ollama)

Migración: `20260526120000_review_agents.sql`. Procesamiento en **ia-srv** (`packages/review-agents/`); Postgres/Auth/Storage/Realtime en Supabase.

| Tabla | Uso |
|-------|-----|
| `review_profiles` | Perfil por `user_id` + `agency_id` (`role_key`, email aviso) |
| `review_skills` / `review_skill_versions` | Skills de revisión (plantillas globales `agency_id` NULL) |
| `review_jobs` | Trabajo async (`queued` → … → `completed`) |
| `review_job_inputs` | Archivos, URLs, texto |
| `review_job_chunks` | Map-reduce parcial |
| `review_job_events` | Timeline UI |

- **RLS:** patrón `user_agencies`; visibilidad de skills vía `review_skill_visible_to_user(skill_id)`.
- **Storage:** bucket privado `review-documents` (`{agency_id}/{job_id}/…`).
- **Realtime:** `review_jobs`, `review_job_events` en `supabase_realtime`.
- **Taimbox:** permiso `can_access_review_agents`, ruta `/review-agents` (enlace al portal).

Baseline MCP: [`docs/review-agents-mcp-baseline.md`](review-agents-mcp-baseline.md).

## 13.7. Tipos y matices del snapshot

- Aparecen tipos **`USER-DEFINED`** (`preferred_view`, `default_view` en `department_config`): en PostgreSQL corresponden a enums del esquema real; el archivo SQL de contexto no es ejecutable literal sin esos tipos creados antes.
- Algunos **CHECK** del volcado (p. ej. `allocations.status`) pueden diferir de lo que usa la aplicación en tipos TypeScript; validar siempre contra migraciones vigentes.

## 13.8. Lectura relacionada

- [05-integraciones-automatizacion.md](05-integraciones-automatizacion.md) — MCP, Edge Functions, despliegue self-hosted.
- [02-entidades-modelos.md](02-entidades-modelos.md) — glosario funcional.
- [07-mantenimiento-extension.md](07-mantenimiento-extension.md) — RLS, `user_agency_ids`, extensión de tablas.
- [12-onboarding-registro.md](12-onboarding-registro.md) — registro, invitaciones, `user_agencies`.
