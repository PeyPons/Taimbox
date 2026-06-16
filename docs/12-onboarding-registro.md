# Onboarding y registro de agencia

## Flujo resumido

1. **Registro** (`/login?tab=register`): el cliente envía email, contraseña, nombre y nombre de agencia. La Edge Function `register-agency` crea usuario en Auth, fila en `agencies` con `plan_id = business` (plan **Agency** en UI) y trial 14 días si `trial_used_at` es null (un trial por agencia; ver [16-planes-suscripcion-precios.md](16-planes-suscripcion-precios.md)), empleado administrador y relación `user_agencies`. Inserta `settings` mínimos (módulos base: deadlines + timeTracker; roles con Administrador). Durante el trial la agencia tiene entitlements de Agency (OKR, finanzas, Ads, etc.).
2. **Login automático** y redirección a `/onboarding`.
3. **OnboardingWizard** (pasos en orden):
   - **Cómo trabaja tu agencia**: `ehrTarget`, `hoursTrackingPreference`, módulos (`ppc`, `professionalGoals`, `deadlines`, `timeTracker`) respetando `PLAN_MODULES` del plan efectivo, y `timeTrackerMaxHours` si el cronómetro está activo. Sin OAuth de anuncios.
   - **Integraciones**: `enabledIntegrations` según `AVAILABLE_INTEGRATIONS`; si `weekly_feedback`, `weeklyCloseDay`.
   - **Departamentos**: `settings.departments` como `DepartmentDefinition[]` + upsert en `department_config` (vista por defecto, estricta). Se sincronizan IDs reales de `department_config` tras el upsert.
   - **Roles**: lista de roles con permisos (Administrador completo).
   - **Equipo (opcional)**: invitación vía `invite-user-to-agency` (sin contraseña en UI); email con enlace **Establecer contraseña** (`_shared/welcome-and-invitation-email.ts` + `generateLink` recovery, misma vía Resend que `request-password-reset`). Tras invitar se actualizan nombre, `work_schedule`, `department`, `department_id` y capacidad semanal.
   - **Cliente y proyecto**: primer cliente; proyecto con `responsibleDepartmentId` y `projectType` opcional. Si el tipo es **Entregable**, el mismo paso permite importe total y fechas de fase (`deliverable_*`), alineado con la cartera (`addProject` en `AppContext`).
4. **`completeSetup`**: `agencies.setup_completed = true` y navegación a `/planner`.

## Invitaciones fuera del onboarding

- `invite-user-to-agency` envía el correo con `sendWelcomeOrInvitationEmail` (`_shared/welcome-and-invitation-email.ts`), que usa `password-recovery-url.ts` para el enlace de recuperación en el correo (igual que el reset de contraseña).
- `request-password-reset` reutiliza el mismo helper para construir la URL de `/reset-password`.

## Correos transaccionales (plantillas ya en código; entrega vía Resend)

Las plantillas HTML y el texto plano viven en `_shared/welcome-and-invitation-email.ts`; el envío lo hace `_shared/resend.ts` (misma pila que `request-password-reset`). `register-agency`, `invite-user-to-agency` y `create-user` llaman a ese módulo **en el mismo proceso**. La función HTTP `send-welcome-email` está **retirada (410)**; no invocarla desde integraciones externas.

Para que los correos **lleguen** (registro, invitación, reset):

1. **API key**: crea clave en Resend → configura el secreto `RESEND_API_KEY` en el entorno de las Edge Functions (Supabase Dashboard → *Edge Functions* → *Secrets*, o variables del contenedor en self-hosted). Sin esto, `sendEmail` devuelve error y solo verás trazas en logs.
2. **Remitente** (`RESEND_FROM_EMAIL`): opcional. Por defecto el código usa `Taimbox <onboarding@resend.dev>`. En cuenta gratuita de Resend, ese remitente **solo permite enviar al email con el que registraste Resend**; para usuarios reales verifica tu dominio en Resend y usa p. ej. `Taimbox <noreply@tudominio.com>`. **Importante:** usar el dominio raíz verificado en Resend (ej. `taimbox.com`), no el subdominio de los registros SPF/MX (ej. `send.taimbox.com`); ese subdominio es para el return-path, no para el `From:` (ver troubleshooting en `docs/05`, § Resend 403).
3. **Enlaces en el correo**: define `SITE_URL` (o `CHECKOUT_BASE_URL`, que tiene prioridad en el helper de reset) apuntando a tu app pública (`/login`, `/reset-password`).
4. **Local**: copia `supabase/.env.example` → `supabase/.env`, rellena valores y usa `supabase functions serve` (ver también tabla de troubleshooting en `docs/05-integraciones-automatizacion.md`, § emails).

Funciones que disparan correo: `register-agency` (bienvenida tras alta), `invite-user-to-agency` (invitación), `create-user` (invitación), `request-password-reset` (reset); las tres primeras usan `welcome-and-invitation-email.ts` + `resend.ts`; la de reset usa solo `resend.ts` con su plantilla propia.

## Variables y despliegue

- Emails y enlaces dependen de `RESEND_API_KEY`, `RESEND_FROM_EMAIL` (opcional), `SITE_URL` o `CHECKOUT_BASE_URL` en las Edge Functions. Referencia de variables: `supabase/.env.example`.
- Tras cambiar funciones: despliegue según `docs/05-integraciones-automatizacion.md` (§ Edge Functions).
