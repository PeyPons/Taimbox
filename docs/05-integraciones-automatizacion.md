
## 5. Integraciones y Automatización

Google Ads y Meta Ads se sincronizan **solo** mediante **Edge Functions** de Supabase (Deno en el contenedor `supabase-edge-functions`), invocadas desde la app, por cron o por automatización que llame a la API de funciones.

### 5.1. Edge Functions (Supabase)

Funciones serverless que corren en Deno dentro del contenedor `supabase-edge-functions`.

#### Inventario de funciones

| Función | Archivo | Descripción |
|---------|---------|-------------|
| `sync-google-ads` | `supabase/functions/sync-google-ads/index.ts` | Sincroniza campañas. Usa credenciales plataforma + refresh token (DB). Si no hay filas en `ad_accounts_config`, obtiene toda la jerarquía del MCC (MCC + sub-MCCs + subcuentas) vía `customer_client` recursivo y sincroniza cada cuenta; si hay filas, solo esas. Escribe en `google_ads_campaigns` con `agency_id`. La API devuelve el coste en **micros** (1 unidad de moneda = 1.000.000 micros); la función convierte dividiendo por 1.000.000 antes de persistir. |
| `oauth-google-ads` | `supabase/functions/oauth-google-ads/index.ts` | **(Nuevo)** Intercambia código OAuth y guarda `refresh_token` en columna de agencia. |
| `exchange-google-token` | `supabase/functions/exchange-google-token/index.ts` | *(Legacy)* Versión anterior que guardaba en JSON. |
| `sync-meta-ads` | `supabase/functions/sync-meta-ads/index.ts` | Sincroniza insights a nivel campaña (gasto, clics, conversiones, etc.) vía Graph API; **no** persiste presupuesto diario de Meta en `meta_ads_campaigns` (la integración actual no solicita esos campos). |
| `generate-api-token` | `supabase/functions/generate-api-token/index.ts` | Genera JWT con claim `agency_id` para acceso API. |
| `revoke-api-token` | `supabase/functions/revoke-api-token/index.ts` | Revoca un token API (marca `is_active = false`). |
| `create-user` | `supabase/functions/create-user/index.ts` | Crea usuario en Auth + `employees`. |
| `update-user` | `supabase/functions/update-user/index.ts` | Actualiza usuario en Auth. |
| `delete-user` | `supabase/functions/delete-user/index.ts` | Elimina usuario de Auth; antes limpia `user_agencies`, pone `employees.user_id` a null, quita `platform_admins` y `audit_logs` del usuario, y anula `support_tickets.reporter_user_id`. |
| `admin-delete-agency` | `supabase/functions/admin-delete-agency/index.ts` | Solo si `is_platform_admin`: cancela suscripción Stripe si hay `stripe_subscription_id`, luego RPC `admin_delete_agency`. **Irreversible.** |
| `invite-user-to-agency` | `supabase/functions/invite-user-to-agency/index.ts` | Invita a un usuario existente a una agencia. |
| `register-agency` | `supabase/functions/register-agency/index.ts` | Registra una nueva agencia (alta inicial). Asigna plan Business con trial 14 días por defecto. Inserta `settings` mínimos (módulos base); el asistente en app completa el resto. |
| `add-platform-admin` | `supabase/functions/add-platform-admin/index.ts` | Añade un usuario como admin de plataforma. |
| `create-checkout-session` | `supabase/functions/create-checkout-session/index.ts` | Crea sesión de Stripe Checkout para suscripción (Pro/Business). Crea o recupera Customer, devuelve URL. Requiere `STRIPE_SECRET_KEY`. |
| `create-billing-portal-session` | `supabase/functions/create-billing-portal-session/index.ts` | Crea sesión del Stripe Customer Portal (body: `agency_id`). Redirige al portal para gestionar tarjeta, facturas o cancelar suscripción. Requiere `STRIPE_SECRET_KEY`. |
| `stripe-webhook` | `supabase/functions/stripe-webhook/index.ts` | Webhook Stripe: actualiza `agencies` (plan_id, subscription_status, trial_ends_at) según eventos de suscripción. Requiere `STRIPE_WEBHOOK_SECRET`. Opcional: `STRIPE_PRICE_ID_PRO` y `STRIPE_PRICE_ID_BUSINESS` para mapear plan por precio cuando los metadatos de la suscripción no reflejan el tier real. |
| `send-welcome-email` | `supabase/functions/send-welcome-email/index.ts` | Endpoint HTTP opcional; delega en `_shared/welcome-and-invitation-email.ts` (misma lógica que `register-agency` / `invite-user-to-agency` / `create-user`). Body: `{ email, name, agencyName, type }`. Invitaciones: enlace recovery vía `_shared/password-recovery-url.ts`. Envío: `_shared/resend.ts` (igual que `request-password-reset`). Requiere `RESEND_API_KEY`. |
| `send-contact-email` | `supabase/functions/send-contact-email/index.ts` | Envía email interno a `CONTACT_TO_EMAIL` (default `hello@taimbox.com`) desde el formulario público `/contacto` vía Resend. Body: `{ name, email, subject, message }`. Requiere `RESEND_API_KEY`. La página `src/pages/ContactoPage.tsx` usa `useTranslation('landing')` y las claves `static.contact.seoTitle` / `static.contact.seoDescription` en `src/locales/{es,en}/landing.json` para `SeoTags`. |
| `request-password-reset` | `supabase/functions/request-password-reset/index.ts` | Genera enlace de recuperación (`_shared/password-recovery-url.ts`) y lo envía por email vía Resend. Body: `{ email }`. Funciona para cualquier usuario en `auth.users`. Siempre devuelve 200 (previene enumeración). No requiere autenticación. |

**Meta Ads — presupuesto y ritmo en la UI (`MetaAdsPage.tsx`):** El objetivo mensual y las alertas se basan en el **presupuesto mensual** que la agencia introduce en pantalla (persistido en `client_settings.budget_limit` por cuenta o cliente virtual). La vista compara **gasto medio diario** (lo gastado en el mes ÷ días transcurridos) con **objetivo medio diario** (presupuesto restante ÷ días que faltan). Los límites nativos de gasto siguen configurándose en Meta (campaña, conjunto, presupuesto compartido, etc.); no se muestra un «presupuesto diario importado» desde la API, para alinear el mensaje con el modelo de Meta y con lo que realmente sincroniza `sync-meta-ads`. En **Google Ads** (`AdsPage.tsx`) sí se usa `daily_budget` devuelto por la API cuando está disponible. La página importa desde `react` los hooks (`useState`, `useEffect`, `useMemo`, `useRef`) y `memo` usados por el componente memoizado de las tarjetas de estadísticas. Los filtros de la barra (cuentas ocultas, **sin inversión en el mes**) replican el comportamiento de `AdsPage` (`showHidden`, `showZeroSpend`).

**Proyección fin de mes (Ads):** En **Google Ads**, si hay suma de presupuestos diarios en campañas `ENABLED`, la proyección es `gasto acumulado + (esa suma × días restantes del mes)` para alinearla con el «Diario actual» y con el diario recomendado (reparto del saldo). Si no hay presupuestos diarios en los datos, se mantiene el ritmo medio del mes proyectado al calendario completo (`gasto_medio_diario × días del mes`). En **Meta Ads** no hay equivalente importado a diario: la proyección sigue siendo **ritmo medio del mes × días del mes**; puede desviarse del objetivo medio diario si el ritmo real cambió a mitad de mes (tooltip en la propia fila).

#### Integración: Modo demostración (ocultar datos sensibles en toda la app)

En Configuración → Integraciones → Privacidad y demostración, la opción **"Modo demostración (ocultar datos sensibles)"** activa una capa de anonimización en la UI, además de Google Ads y Meta Ads. **Prioridad de negocio**: para demos con terceros conviene ocultar **nombres de proyecto** y **nombres de cliente** (identifican cuentas reales). El resto (empleados, tareas, etc.) puede mostrarse o anonimizarse según la pantalla.

Cuando el modo está activo, los textos sustituidos se muestran con efecto blur y una **etiqueta semántica genérica** según el tipo (`kind`: cuenta/campaña, empleado, proyecto, tarea, departamento). Los **nombres de cliente** en listados y tablas usan `SensitiveText` con **`kind="account"`** y el **id del cliente** (misma familia de etiquetas que cuentas de anuncios). Los **IDs** que ya se mostraban en la UI (p. ej. cuentas de anuncios) **siguen visibles** donde aplica.

**Auditoría / búsqueda en el código** (para encontrar fugas de nombres reales): en el repo, buscar patrones como `{client.name}`, `client?.name`, `{clientName}`, `clients.find(... )?.name`, `formatProjectName(...)` en JSX de solo lectura, y `title={...}` con nombres de proyecto o cliente. Revisar también `OkrsPage.tsx`, `ClientsAndProjectsPage.tsx`, `FinancialHealthPage.tsx` (rentabilidad) cuando se añadan filas nuevas.

**Deadlines** (`DeadlinesPage.tsx`): los **nombres de proyecto** van envueltos en `SensitiveText` con `kind="project"` en `DeadlinesProjectList.tsx`, `DeadlinesProjectEditSheet.tsx`, `DeadlinesSuggestionsPanel.tsx` (lista, filtros por proyecto, desglose por proyecto); la demo estática `DemoDeadlinesPage.tsx` alinea el mismo criterio en el título del proyecto.

**Indicador global**: una franja discreta (no el banner verde de Ads) en el layout principal (`PrivacyDemoIndicator` en `AppLayout.tsx`). En **escritorio** usa `lg:pl-64` para que el texto no quede bajo el **sidebar fijo** (`z-50`, `w-64`); lo mismo aplica a `DepartmentViewBanner` y `SubscriptionSoftLockBanner`. La **vista admin como agencia** va en una línea al pie del sidebar (`SidebarImpersonationPanel`), encima del selector de vista global, no en franja superior. En las páginas de Ads se eliminó el banner verde duplicado y los badges "Datos protegidos" redundantes para no repetir avisos.

**Implementación**: `PrivacyDemoProvider` + `usePrivacyDemo` / `SensitiveText` (`src/contexts/PrivacyDemoContext.tsx`, `src/components/privacy/SensitiveText.tsx`), motor `createPrivacyAnonymizer` (`src/lib/privacyDemoAnonymizer.ts`). `useAnonymizeAds` reutiliza el mismo contexto para `AdsPage.tsx` y `MetaAdsPage.tsx` con `AnonymizedContent`, `account(id)` y `campaign(id)`.

**Cobertura ampliada (UI)**: en varias pantallas el modo también anonimiza otros campos (p. ej. empleados o clientes) además del nombre de proyecto; eso es **opcional por pantalla** y no sustituye el foco en **proyectos** como dato crítico frente a demos con terceros.

#### Módulo compartido `_shared/resend.ts`
Módulo reutilizable que exporta `sendEmail({ to, subject, html, text? })`. Usa la API HTTP de Resend (`https://api.resend.com/emails`). Variables: `RESEND_API_KEY` (obligatoria), `RESEND_FROM_EMAIL` (default: `Taimbox <onboarding@resend.dev>`). Sin dependencias externas.

#### Módulo `_shared/welcome-and-invitation-email.ts`
Exporta `sendWelcomeOrInvitationEmail(supabaseAdmin, { email, name, agencyName, type })` con `type`: `registration` | `invitation`. Construye HTML/texto y llama a `sendEmail` en el mismo runtime (no hace `fetch` a `send-welcome-email`). Lo usan `register-agency`, `invite-user-to-agency` y `create-user` para alinearse con el envío directo de `request-password-reset`.

#### Emails transaccionales (Resend)
- **Registro**: Al registrar una agencia (`register-agency`), se envía email de bienvenida (fire-and-forget).
- **Crear usuario**: Al crear un usuario desde la app (`create-user`), se envía email de invitación (fire-and-forget).
- **Invitar usuario**: Al invitar a un usuario existente (`invite-user-to-agency`), se envía email de invitación (fire-and-forget).
- **Olvidé mi contraseña**: El frontend (`Login.tsx`) llama a `request-password-reset` que genera un enlace de recuperación (`supabase.auth.admin.generateLink`) y lo envía por email. Funciona para cualquier usuario en `auth.users` (empleados, admins de plataforma). El usuario recibe un enlace a `/reset-password?token_hash=...&type=recovery`. La página `ResetPasswordPage.tsx` verifica el token con `supabase.auth.verifyOtp()` y permite establecer nueva contraseña con `supabase.auth.updateUser()`.

#### Solución de problemas: Emails (Resend)

| Problema | Causa | Solución |
|----------|-------|----------|
| **No llegan emails** (bienvenida, invitación, reset contraseña) | `RESEND_API_KEY` no configurada o faltante en el contenedor | Añadir en `.env`: `RESEND_API_KEY=re_xxxxxxxx` (obtener en [resend.com](https://resend.com) → API Keys). Si usas el contenedor manual, incluir `-e RESEND_API_KEY="$RESEND_API_KEY"` en el `docker run`. |
| **Emails van a spam** | Dominio no verificado en Resend | En Resend Dashboard verificar el dominio (p. ej. `taimbox.com`) y añadir los registros DNS que indique. |
| **Emails con remitente genérico** | `RESEND_FROM_EMAIL` no configurada | Añadir en `.env`: `RESEND_FROM_EMAIL=Taimbox <no-reply@taimbox.com>`. El dominio debe estar verificado en Resend. |
| **"Olvidé mi contraseña" no envía email** | Usuario no existe en `auth.users` o error en Resend | La función siempre devuelve 200 (previene enumeración). Revisar logs: `docker logs functions --tail 50` y buscar `[request-password-reset]` o `[Resend]`. |
| **Contenedor manual sin emails** | Variables Resend no pasadas al `docker run` | Incluir `-e RESEND_API_KEY="$RESEND_API_KEY"` y `-e RESEND_FROM_EMAIL="${RESEND_FROM_EMAIL:-Taimbox <no-reply@taimbox.com>}"` en el comando. Ver sección "Workaround: usar contenedor manual". |

#### Arquitectura Google Ads OAuth (Modelo SaaS)

El flujo de Google Ads sigue un modelo SaaS donde la plataforma posee las credenciales OAuth y cada agencia solo autoriza su cuenta:

| Credencial | Origen | Quién la gestiona |
|---|---|---|
| `GOOGLE_CLIENT_ID` | Variable de entorno (servidor + frontend) | **Plataforma** |
| `GOOGLE_CLIENT_SECRET` | Variable de entorno (servidor) | **Plataforma** |
| `GOOGLE_DEVELOPER_TOKEN` | Variable de entorno (servidor) | **Plataforma** |
| `agencies.google_ads_refresh_token` | Columna en BD (obtenido vía OAuth) | **Automático** |
| `agencies.google_ads_customer_id` | Columna en BD (MCC ID) | **Cliente** (en Ajustes → Integraciones) |

**Flujo OAuth completo:**
1. Cliente entra en Configuración → Integraciones → Google Ads.
2. Hace clic en "Conectar con Google" (el MCC/Customer ID se elige después de vincular, con el selector de cuentas).
3. El frontend redirige a Google con `VITE_GOOGLE_CLIENT_ID`, `scope=adwords`, y `state=agency_id` (para recuperar la agencia en el callback).
4. Google redirige a `/google-callback?code=...&state=agency_id` → `GoogleCallbackPage.tsx` captura el código y usa `agency_id` del `state` o del contexto.
5. El frontend invoca `oauth-google-ads` con `{ code, redirect_uri, agency_id }`.
6. La Edge Function intercambia el código por tokens usando `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET`.
7. Guarda el `refresh_token` en la columna `agencies.google_ads_refresh_token`.
8. El usuario selecciona la cuenta (MCC o subcuenta) en el desplegable; se guarda en `agencies.google_ads_customer_id`.
9. `sync-google-ads` y `list-google-accounts` usan `GOOGLE_DEVELOPER_TOKEN` + credenciales plataforma + `refresh_token` (columna) + `customer_id` (columna cuando aplica). **MCC:** si la agencia no tiene cuentas en `ad_accounts_config`, la sync obtiene **toda la jerarquía** del MCC seleccionado (consultando `customer_client` de forma recursiva: MCC raíz, sub-MCCs y todas sus subcuentas) y sincroniza campañas de cada cuenta; los datos se guardan en `google_ads_campaigns` con el mismo `agency_id`.

**Comportamiento de datos al desvincular / cambiar cuenta / re-sincronizar:**
- **Desvincular:** Al desvincular Google Ads (Configuración → Integraciones), se borran todos los registros de `google_ads_campaigns` de esa agencia, para no dejar datos huérfanos.
- **Cambiar de cuenta (selector):** Al elegir otro MCC/cuenta en el desplegable, se borran todos los datos de Google Ads de la agencia; la próxima sincronización rellenará solo con la nueva cuenta.
- **Volver a sincronizar:** La sync **sobrescribe** los datos del mes en curso por cuenta: para cada cuenta, borra filas en el rango de fechas del mes y hace upsert con lo que devuelve la API. No se suman ni se duplican importes; el gasto proviene siempre de la API (coste en micros convertido a unidad), por lo que no se pierden decimales por doble escritura. Tras cada sync se eliminan filas de la agencia cuyo `client_id` ya no está en la lista sincronizada (p. ej. al haber cambiado de MCC).
- **Cuentas con muchas campañas:** La sync hace una petición por cuenta y carga la respuesta en memoria. Con cuentas que tengan decenas de miles de campañas puede acercarse al límite de memoria o tiempo del Edge Runtime. Si aparecen timeouts o errores de memoria, se puede valorar paginar por rango de fechas o limitar campañas por petición.

**Con la API de Google Ads aprobada:** El flujo de conexión está listo para producción. Asegúrate de tener `GOOGLE_DEVELOPER_TOKEN` aprobado en la cuenta de desarrollador de Google Ads; sin ello, `list-google-accounts` y `sync-google-ads` pueden devolver HTML de error en lugar de JSON. Ver sección "Solución de problemas: Google OAuth y API Google Ads" más abajo.

**URIs de redirección autorizadas en Google Cloud Console:**
- `http://localhost:8080/google-callback` (desarrollo)
- `https://taimbox.com/google-callback` (producción)

#### Arquitectura Meta Ads OAuth (Modelo SaaS)

Mismo patrón que Google Ads: credenciales de la app en la plataforma y un token por agencia almacenado en BD.

| Credencial | Origen | Quién la gestiona |
|---|---|---|
| `META_APP_ID` | Variable de entorno en **Edge Functions** (Docker); mismo número que en Meta | **Plataforma** |
| `VITE_META_APP_ID` | Variable en **`.env` del frontend** (Vite); mismo valor que **Identificador de la aplicación** en Meta | **Plataforma** |
| `META_APP_SECRET` | Solo en **Edge Functions** (nunca en el frontend) | **Plataforma** |
| `agencies.meta_ads_access_token` | Columna en BD (token de usuario long-lived tras OAuth) | **Automático** |

Si en BD antigua quedó `settings.integrations.metaAccessToken`, el backend aún puede leerlo como respaldo; la UI ya no permite introducir token manual.

**Flujo OAuth:**
1. Configuración → Integraciones → Meta Ads → **Conectar con Meta**.
2. El frontend redirige a Facebook con `VITE_META_APP_ID`, `scope=ads_read` y `state` (identifica la agencia vía `sessionStorage`). No incluir `read_insights` en el OAuth: no es un permiso válido del diálogo de Login; el acceso a métricas de campañas publicitarias queda cubierto por `ads_read`.
3. Meta redirige a `/meta-callback?code=...` → `MetaCallbackPage.tsx` invoca `oauth-meta` con `{ code, redirect_uri, agency_id }`.
4. La Edge Function intercambia el código por token corto y luego por **long-lived token** (Graph API `oauth/access_token` con `fb_exchange_token`) y guarda el resultado en `agencies.meta_ads_access_token`.
5. Opcionalmente se llama a `list-meta-accounts` para rellenar/actualizar `ad_accounts_config` con las cuentas publicitarias (`/me/adaccounts`).
6. `sync-meta-ads` usa el token en este orden: columna `meta_ads_access_token` → (respaldo) `integrations.metaAccessToken` en JSON legado → `META_ACCESS_TOKEN` (entorno, opcional).

**Ajustes en Meta for Developers (app Taimbox):**
- **Inicio de sesión con Facebook para empresas** → Configuración: URI de redirección OAuth válidos → deben coincidir **exactamente** con el origen real de la SPA + `/meta-callback`: p. ej. `https://taimbox.com/meta-callback` y, si los usuarios entran por subdominio `www`, también `https://www.taimbox.com/meta-callback`. En local: `http://localhost:8080/meta-callback` (o el puerto que use Vite; debe ser el mismo que `window.location.origin` al pulsar "Conectar").
- **Dominios admitidos para el SDK para JavaScript:** incluir cada host desde el que se carga la app (p. ej. `taimbox.com` y, si aplica, `www.taimbox.com`; para pruebas en máquina, `localhost`).
- **Información básica → Dominios de la aplicación:** sin `http://` ni `https://`. Como mínimo `taimbox.com`. Si el tráfico entra por **www**, añade también **`www.taimbox.com`** como entrada aparte (Meta trata apex y www como hosts distintos). Para desarrollo local añade **`localhost`**. La URL del sitio puede ser `https://taimbox.com/` o `https://www.taimbox.com/` según el canónico que uses; política y condiciones (`/privacidad`, `/condiciones`) como ya están documentadas.
- **Verificación de dominio (Meta Business / Developers):** la meta `facebook-domain-verification` está en `index.html` (raíz del build Vite) para que Meta pueda comprobar la propiedad del dominio. Si Meta genera un nuevo código, sustituye el `content` en ese archivo y vuelve a desplegar el frontend.
- La URL de Supabase/API (`api.taimbox.com`) **no** debe usarse como redirect OAuth del frontend; el callback es siempre el origen de la app (`taimbox.com`, `www` si aplica, o `localhost`).

**Solución de problemas — error Meta: «No se puede cargar la URL / El dominio de esta URL no está incluido en los dominios de la aplicación»:**
1. Identifica el **host exacto** de la barra de direcciones cuando falla (p. ej. `www.taimbox.com` frente a `taimbox.com`, o `localhost:5173` en dev).
2. En **Información básica → Dominios de la aplicación**, añade ese dominio **sin puerto** (solo `localhost` para local; el puerto va en las URIs de redirección OAuth, no en "dominios de la aplicación").
3. En **Inicio de sesión con Facebook para empresas → Configuración**, añade la **URI de redirección OAuth válida** completa: `https://<mismo-host>/meta-callback` (incluido esquema `http`/`https` y puerto si no es 80/443).
4. En **Dominios admitidos para el SDK para JavaScript**, alinea los mismos hosts que en el paso 2.
5. Guarda cambios en Meta y vuelve a probar; el `redirect_uri` que envía el frontend es siempre `${window.location.origin}/meta-callback` (`AgencySettingsPage.tsx` / `MetaCallbackPage.tsx`).

**Migración SQL:** `supabase/migrations/20250322120000_meta_ads_access_token.sql` añade la columna `meta_ads_access_token` en `agencies` (ejecutar en la instancia antes de usar OAuth en producción).

**Migración SQL (cuentas Meta en BD):** `supabase/migrations/20250322140000_ad_accounts_config_unique.sql` añade `UNIQUE (account_id, agency_id, platform)` en `ad_accounts_config` para que el upsert desde `list-meta-accounts` / `sync-meta-ads` funcione.

**Verificación del negocio y App Review (Meta):** Taimbox es un SaaS: cada agencia conecta **su** cuenta publicitaria. Para que usuarios que no sean administradores de la app puedan autorizar OAuth y para **acceso avanzado** a permisos como `ads_read`, Meta suele exigir **verificación del negocio** y, según el caso, **revisión de la aplicación (App Review)**.

1. **Modo desarrollo vs producción**  
   Con la app en modo desarrollo, solo cuentas con rol en la app (admin, desarrollador, tester) o usuarios de prueba pueden completar el flujo. Para clientes reales sin rol, la app debe estar **publicada** y los permisos necesarios aprobados.

2. **Verificación del negocio (Business Verification)**  
   En [Meta for Developers](https://developers.facebook.com) → tu app → **Configuración de la aplicación** → sección relacionada con verificación / **Business Manager** (o [documentación oficial de verificación de negocio](https://developers.facebook.com/docs/development/release/business-verification)). Debes vincular la app a un **Meta Business** y completar la verificación de identidad del negocio (documentación legal, dominio, etc.). Solo administradores del negocio pueden iniciar el proceso.

3. **App Review — permiso `ads_read`**  
   En el panel: **Casos de uso** / **Permisos y funciones** (según la versión del panel) → solicitar **acceso avanzado** a `ads_read` si Meta lo marca como necesario para “acceso a datos de anuncios de otros usuarios”.  
   Meta suele pedir: **política de privacidad** y **condiciones** públicas (ya enlazadas en Información básica), **vídeo o capturas** del flujo real (login → Configuración → Integraciones → Conectar Meta → callback), e **instrucciones de prueba** (URL `https://taimbox.com`, cuenta de prueba o pasos para revisor). Redacta en inglés si el formulario lo exige.

4. **Qué decir en la descripción del caso de uso**  
   Ejemplo: *“Taimbox is a B2B workforce planning platform. Agencies connect their own Meta Ads account via OAuth to read campaign spend and performance for reporting. We only request `ads_read`. Data is stored per agency and used only inside the app.”*

5. **Tras la aprobación**  
   Publica los cambios en la app si el panel lo pide y comprueba el flujo con una cuenta que **no** sea admin de la app.

### 5.2. Suscripciones (Stripe)

Sistema de planes **Starter** (gratis), **Pro** (49 €/mes early adopter, 99 €/mes estándar) y **Business** (149 €/mes early adopter, 249 €/mes estándar). Plan **Enterprise** (personalizado, sin límite). Nuevos registros reciben trial Business 14 días. **Un solo trial por agencia.** Los precios early adopter se congelan de por vida para el cliente (grandfathering vía `price_id` en Stripe).

- **Campos en `agencies`:** `plan_id` (starter/pro/business/enterprise), `subscription_status`, `stripe_customer_id`, `stripe_subscription_id`, `trial_ends_at`, `subscription_period_ends_at`, `subscription_cancel_at_period_end`, `trial_used_at`.
- **Config de planes:** `src/config/plans.ts`. Límites: Starter 5 emp + histórico 2 meses (`limitHistoryToTwoMonths`), Pro 20 emp, Business 50 emp, Enterprise ilimitado. **Starter incluye cronómetro** (`timeTracker: true`). `/tiempos` ya no requiere Pro. Módulos PPC (Ads) solo en Business/Enterprise.
- **Flujo:** El usuario entra en Configuración → Plan y facturación; la app llama a `create-checkout-session` con `agency_id`, `price_id` y `plan_id`. La función crea o recupera el Customer en Stripe, crea una sesión de Checkout y devuelve la URL. Si ya existe una suscripción activa, la función actualiza la suscripción directamente (sin Checkout) previo **diálogo de confirmación** en el frontend (`AgencyBillingTab`). Si el usuario está en trial Business y cambia a Pro, el diálogo avisa que la **prueba terminará inmediatamente** y se cobrará Pro. Tras el pago, Stripe envía webhooks; `stripe-webhook` actualiza `plan_id`, `subscription_status`, `trial_ends_at` y `subscription_period_ends_at` en `agencies`. En Plan y facturación se muestran estado de la suscripción, días restantes de prueba (trialing), próxima facturación y días restantes del periodo (suscripción activa). Si la suscripción está en **`past_due`**, se muestra un banner naranja con CTA para actualizar el método de pago. **Cancelar o gestionar suscripción:** botón "Gestionar suscripción / Cancelar" (visible en planes Pro/Business con `stripe_customer_id`) que llama a `create-billing-portal-session` (body: `agency_id`); la función crea una sesión del Stripe Customer Portal y devuelve la URL; el usuario es redirigido al portal donde puede actualizar tarjeta, ver facturas o cancelar (al cancelar, Stripe envía `customer.subscription.deleted` y el webhook hace downgrade a Starter).
- **Límites y soft-lock:** Definidos en `src/config/plans.ts`. Starter: 5 empleados, histórico Inteligencia/Reportes 30 días. Pro: 20 empleados. Business: 50 empleados. El hook `useSubscriptionLimits` expone `isOverLimit`, `isSoftLocked`, `canAddEmployee`, `canAccessRouteByPlan`. Incluye **safety net client-side**: si `subscription_status === 'trialing'` y `trial_ends_at` ya pasó, trata como Starter aunque el webhook no haya llegado. Si la agencia excede el límite de su plan, la app entra en modo solo lectura: `SubscriptionSoftLockBanner` (banner rojo), bloqueo de altas en `TeamPage`, y **bloqueo de escritura en el planificador** (`useAllocationActions`: add, edit, delete, toggle, move tareas).
- **Texto condicionado por `trialUsedAt`:** El botón Business en `AgencyBillingTab` muestra "14 días de prueba" solo si `trialUsedAt` es `null`. El campo se mapea desde `trial_used_at` en `SupabaseAgency` → `trialUsedAt` en `Agency` (vía `AgencyContext.mapSupabaseAgency`).
- **Rutas por plan:** `PlanGuard` redirige a Plan y facturación si el plan no incluye la ruta (ej. /operaciones, /ads, /api-keys requieren Business; /weekly-forecast, /okrs, /tiempos requieren Pro).
- **Variables de entorno (Edge Functions):** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`. Opcional: `CHECKOUT_BASE_URL` (default `https://taimbox.com`). **Recomendado en el contenedor de `stripe-webhook`:** `STRIPE_PRICE_ID_PRO` y `STRIPE_PRICE_ID_BUSINESS` (mismos valores que `VITE_STRIPE_PRICE_ID_PRO` y `VITE_STRIPE_PRICE_ID_BUSINESS` en el frontend). El webhook usa el **Price ID** del ítem de suscripción en Stripe para decidir Pro vs Business cuando los metadatos de la suscripción no van acordes (p. ej. suscripción creada o cambiada desde el Dashboard de Stripe sin `metadata.plan_id`). Frontend: `VITE_STRIPE_PRICE_ID_PRO` y `VITE_STRIPE_PRICE_ID_BUSINESS` para los botones de checkout.
- **Si el plan en `agencies` vuelve solo a Pro** tras editar en el Table Editor o tras “Forzar Business” en admin: casi siempre es el **webhook** `customer.subscription.updated` escribiendo de nuevo `plan_id` según Stripe. Solución: (1) En Stripe → Suscripción → **Metadata**, fija `agency_id` (UUID de la agencia) y `plan_id` = `business` o `pro` según corresponda. (2) Configura `STRIPE_PRICE_ID_PRO` / `STRIPE_PRICE_ID_BUSINESS` en el contenedor de edge functions y redespliega el webhook. (3) Evita depender solo de ediciones manuales en Supabase mientras la suscripción siga activa: el siguiente evento de Stripe las sobrescribe.

#### Variables de entorno requeridas

**En el contenedor `supabase-edge-functions`** (Docker):
```
SUPABASE_URL=http://kong:8000
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
GOOGLE_CLIENT_ID=<client_id>.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-<secret>
GOOGLE_DEVELOPER_TOKEN=<developer_token>
META_APP_ID=<facebook_app_id>
META_APP_SECRET=<facebook_app_secret>
RESEND_API_KEY=<resend_api_key>
RESEND_FROM_EMAIL=Taimbox <no-reply@taimbox.com>
```

Opcional (solo lectura / pruebas sin OAuth por agencia): `META_ACCESS_TOKEN`.

**En el frontend** (`.env` de Vite en la raíz del proyecto, **no** en el Docker de Supabase):
```
VITE_GOOGLE_CLIENT_ID=<mismo_client_id>.apps.googleusercontent.com
VITE_META_APP_ID=<identificador_de_la_aplicacion_meta>
```

**Valores exactos para Meta (copiar desde el panel):** en [Meta for Developers](https://developers.facebook.com) → tu app → **Configuración de la aplicación** → **Información básica**. El campo **Identificador de la aplicación** (solo dígitos) es el valor de `META_APP_ID` y de `VITE_META_APP_ID` (el mismo número en ambos sitios). La **Clave secreta de la aplicación** (botón *Mostrar*) es **solo** `META_APP_SECRET` en el contenedor de Edge Functions; no la subas al repo ni al build del frontend.

**Dónde van en Docker:** las variables del bloque “contenedor `supabase-edge-functions`” se definen donde ya tienes `GOOGLE_CLIENT_ID` (por ejemplo `.env` junto al `docker-compose` de Supabase, o `environment:` del servicio `functions`). Ahí añade `META_APP_ID`, `META_APP_SECRET` y reinicia ese contenedor. `VITE_META_APP_ID` no se pone en Docker de funciones: va en el `.env` local/CI del **proyecto Vite** y se inyecta al hacer `npm run build`.

#### Despliegue de Edge Functions (self-hosted)

El entorno usa Supabase self-hosted con Docker. El contenedor `supabase-edge-functions` lee las funciones desde un volumen montado. Rutas por defecto: Taimbox `~/Taimbox`, Supabase `~/supabase-pi/supabase/docker`. El script `supabase/scripts/deploy-edge-functions-supabase-pi.sh` hace rsync de `supabase/functions/` al volumen y reinicia el servicio `functions`.

**Comandos para desplegar (en el servidor, copiar y pegar):**
```bash
cd ~/Taimbox
git pull
chmod +x supabase/scripts/deploy-edge-functions-supabase-pi.sh
./supabase/scripts/deploy-edge-functions-supabase-pi.sh
```

Si el proyecto está en otra ruta o Supabase en otro sitio: `export TIMBOXING_DIR=/ruta/Taimbox` y `export SUPABASE_DOCKER_DIR=/ruta/supabase-pi/supabase/docker` antes de ejecutar el script.

**Resumen una línea:** `cd ~/Taimbox && git pull && chmod +x supabase/scripts/deploy-edge-functions-supabase-pi.sh && ./supabase/scripts/deploy-edge-functions-supabase-pi.sh`

**Para una sola función (más rápido):**
```bash
cp -r ~/Taimbox/supabase/functions/<nombre-funcion> \
      ~/supabase-pi/supabase/docker/volumes/functions/ \
   && docker restart supabase-edge-functions
```

**Verificar variables de entorno del contenedor:**
```bash
docker inspect supabase-edge-functions --format '{{range .Config.Env}}{{println .}}{{end}}' | grep GOOGLE
```

**Verificar logs:**
```bash
docker logs supabase-edge-functions --tail 50 -f
```

#### Solución de problemas: 503 Service Unavailable

Si al vincular **Google Ads**, **Meta Ads** o listar cuentas aparece **503 (Service Unavailable)** en `oauth-google-ads`, `list-google-accounts`, `oauth-meta` o `list-meta-accounts`, suele deberse a:

1. **Funciones no desplegadas o desactualizadas**  
   Asegúrate de haber copiado las funciones al volumen y reiniciado el contenedor (ver comandos de despliegue arriba).

2. **Variables de entorno faltantes en el contenedor**  
   Las funciones necesitan en el contenedor `supabase-edge-functions`:
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (para `oauth-google-ads`)
   - `GOOGLE_DEVELOPER_TOKEN` (para `list-google-accounts`)
   - `META_APP_ID`, `META_APP_SECRET` (para `oauth-meta` / Meta Ads)  
   Si falta alguna, la función puede fallar antes de devolver una respuesta controlada y el runtime devuelve 503.

3. **Crash no capturado**  
   Si el body de la petición está vacío o no es JSON válido, las funciones devuelven **400** con mensaje claro. Si aun así ves 503, revisa los logs del contenedor para ver el stack trace.

4. **DNS / «name resolution failed» (Meta Ads, Google, listados)**  
   Si el body del error o los logs mencionan **`name resolution failed`** o fallos al resolver `graph.facebook.com` / `googleapis.com`, el contenedor **`supabase-edge-functions`** no está resolviendo nombres correctamente (común en Docker con DNS del host defectuoso o redes aisladas). El frontend reintenta automáticamente algunas llamadas ante 503, pero hay que corregir la red:
   - En el `docker-compose` del servicio `functions`, añadir DNS públicos, p. ej.:
     ```yaml
     dns:
       - 8.8.8.8
       - 8.8.4.4
     ```
   - Reiniciar: `docker compose up -d functions` (o el comando equivalente en tu stack).
   - Comprobar desde el contenedor: `docker exec -it supabase-edge-functions wget -qO- --timeout=5 https://graph.facebook.com/v21.0/ 2>&1 | head` (o `curl` si está instalado). Si falla por DNS, el problema es de resolución, no de código.
   - Asegurar también que `SUPABASE_URL` sea alcanzable **desde dentro** del contenedor (p. ej. `http://kong:8000` en la red Docker de Supabase); si el runtime no puede resolver `kong`, el cliente de Supabase fallará al guardar el token tras OAuth.
   - **Vite en local:** el hot reload puede remontar la página de Configuración y repetir muchas veces la llamada a `list-google-accounts`. El frontend **deduplica** la petición por `agency_id`, aplica un **debounce** y solo carga el listado cuando la pestaña **Integraciones** está activa, para no saturar la API mientras el 503 persiste en el servidor.

**Comprobar en el servidor:**
- Que existan las carpetas `oauth-google-ads` y `list-google-accounts` dentro del volumen de functions.
- Que el contenedor tenga las variables anteriores (`docker inspect ... | grep GOOGLE` y comprobar SUPABASE_*).
- Reproducir el error y ejecutar `docker logs supabase-edge-functions --tail 100` para ver el error exacto.

#### Solución de problemas: HTTP 000, 404 y 301 al probar Edge Functions

Al hacer `curl` a las funciones, los códigos indican lo siguiente:

| Código | Significado | Acción |
|--------|-------------|--------|
| **HTTP:000** | Conexión fallida (timeout, conexión rechazada). El Edge Runtime no responde. | 1) Verificar IP del contenedor: `docker inspect supabase-edge-functions --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'`. 2) Comprobar que el contenedor está levantado: `docker ps \| grep edge-functions`. 3) Revisar logs: `docker logs supabase-edge-functions --tail 100` — si hay `shutdown signal received: 15` en bucle, el contenedor se reinicia; revisar que exista la carpeta `main` en `volumes/functions/` (el Edge Runtime la requiere). |
| **HTTP:404** | Kong responde pero la ruta no existe. | Verificar que Kong enruta a `/functions/v1/` y que el puerto expuesto es el correcto (típicamente 8000). Probar también contra la URL pública con HTTPS. |
| **HTTP:301** | Redirección (p. ej. HTTP → HTTPS). | Usar **HTTPS** en la URL: `https://api.taimbox.com/functions/v1/oauth-google-ads` en lugar de `http://`. |

**Prueba recomendada con HTTPS y anon key real:**

```bash
curl -s -w "\nHTTP:%{http_code}" -X POST \
  https://api.taimbox.com/functions/v1/oauth-google-ads \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_ANON_KEY_REAL" \
  -d '{"code":"x","redirect_uri":"https://taimbox.com/google-callback","agency_id":"60eb6a6f-c3ec-4b52-b9bb-3cb1886ad892"}'
```

- Si devuelve **400** con mensaje de error (p. ej. "Falta el código" o "Google devolvió...") → la función **sí está alcanzable**; el problema es el flujo OAuth o los datos enviados.
- Si devuelve **503** → Kong no puede alcanzar el Edge Runtime; revisar que el contenedor `supabase-edge-functions` esté estable y que Kong tenga la ruta correcta a `functions:9000`.

#### Solución de problemas: Edge Runtime reiniciándose en bucle (SIGTERM → 503)

Si los logs muestran `main function started` seguido de `shutdown signal received: 15` en bucle, el contenedor se reinicia continuamente y no llega a servir peticiones. Kong devuelve 503 porque el upstream no responde.

**Síntomas:** `docker logs supabase-edge-functions --tail 50` muestra el patrón repetido; `docker ps` indica "Up X minutes" (el contenedor lleva poco tiempo reiniciado).

**Causas habituales y soluciones:**

1. **Health check fallando**  
   El docker-compose oficial de Supabase no define healthcheck para `functions`, pero si usas una variante (p. ej. supabase-pi) que sí lo tenga, puede estar fallando. Comprobar:
   ```bash
   docker inspect supabase-edge-functions --format '{{json .Config.Healthcheck}}'
   ```
   Si hay healthcheck y falla, opciones:
   - Aumentar `start_period` y `interval` en el docker-compose del servicio `functions`.
   - Comentar o eliminar el healthcheck temporalmente para verificar si el contenedor se estabiliza.

2. **Memoria insuficiente (Raspberry Pi / máquinas con poca RAM)**  
   El Edge Runtime usa ~150 MB por worker. En un Pi con varios servicios Supabase, la memoria puede agotarse y el sistema puede terminar el proceso.
   - Revisar RAM libre: `free -h`
   - Reducir servicios que no uses (p. ej. analytics, storage) si es posible.
   - Aumentar swap: `sudo dphys-swapfile swapoff && sudo nano /etc/dphys-swapfile` (cambiar `CONF_SWAPSIZE` a 2048) y `sudo dphys-swapfile setup && sudo dphys-swapfile swapon`.

3. **Probar sin healthcheck (diagnóstico)**  
   Editar el `docker-compose.yml` del servicio `functions` y comentar o eliminar el bloque `healthcheck` si existe. Luego:
   ```bash
   cd ~/supabase-pi/supabase/docker
   docker compose up -d functions
   docker logs supabase-edge-functions -f
   ```
   Si el contenedor deja de reiniciarse, el problema era el healthcheck.

4. **Verificar que el main responde**  
   Con el contenedor estable, desde el host:
   ```bash
   FUNC_IP=$(docker inspect supabase-edge-functions --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}')
   curl -s -w "\nHTTP:%{http_code}" -m 5 "http://${FUNC_IP}:9000/_internal/health"
   ```
   Debe devolver `{"message":"ok"}` y HTTP:200.

5. **Workaround: usar contenedor manual**  
   Si el contenedor de Compose sigue en bucle y las causas anteriores no aplican, levantar el Edge Runtime manualmente. Kong enruta a `functions:9000`, así que el contenedor debe llamarse `functions` para que resuelva en la red.

   **Importante:** No usar `--env-file .env` porque el `.env` tiene nombres como `SERVICE_ROLE_KEY` y la función espera `SUPABASE_SERVICE_ROLE_KEY`. Hay que pasar las variables explícitamente:

   ```bash
   cd /home/alex/supabase-pi/supabase/docker
   docker stop supabase-edge-functions 2>/dev/null
   docker rm -f functions 2>/dev/null

   set -a
   source .env
   set +a

   docker run -d --name functions \
     -v /home/alex/supabase-pi/supabase/docker/volumes/functions:/home/deno/functions:Z \
     --network supabase_default \
     -e SUPABASE_URL=http://kong:8000 \
     -e SUPABASE_SERVICE_ROLE_KEY="$SERVICE_ROLE_KEY" \
     -e SUPABASE_ANON_KEY="$ANON_KEY" \
     -e JWT_SECRET="$JWT_SECRET" \
     -e SUPABASE_DB_URL="postgresql://postgres:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}" \
     -e GOOGLE_CLIENT_ID="$GOOGLE_CLIENT_ID" \
     -e GOOGLE_CLIENT_SECRET="$GOOGLE_CLIENT_SECRET" \
     -e GOOGLE_DEVELOPER_TOKEN="$GOOGLE_DEVELOPER_TOKEN" \
     -e STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY" \
     -e STRIPE_WEBHOOK_SECRET="$STRIPE_WEBHOOK_SECRET" \
     -e STRIPE_PRICE_ID_PRO="${STRIPE_PRICE_ID_PRO:-}" \
     -e STRIPE_PRICE_ID_BUSINESS="${STRIPE_PRICE_ID_BUSINESS:-}" \
     -e RESEND_API_KEY="$RESEND_API_KEY" \
     -e RESEND_FROM_EMAIL="${RESEND_FROM_EMAIL:-Taimbox <no-reply@taimbox.com>}" \
     -e VERIFY_JWT="${FUNCTIONS_VERIFY_JWT:-true}" \
     supabase/edge-runtime:v1.69.28 \
     start --main-service /home/deno/functions/main
   ```

   Ajustar la ruta `/home/alex/` si el usuario o la instalación son distintos.

   Verificar que responde: `curl -s https://api.taimbox.com/functions/v1/hello -H "Authorization: Bearer ANON_KEY"` debe devolver algo distinto de 503. O probar `oauth-google-ads` con un código de prueba: si devuelve 400 con "Google Error: Malformed auth code" → la función está operativa.

   Para volver al contenedor de Compose:
   ```bash
   docker stop functions
   docker rm functions
   docker compose up -d functions
   ```

   Si tras volver a Compose el bucle reaparece, mantener el contenedor manual como solución estable. Puedes crear un script `start-functions-manual.sh` con el bloque anterior para ejecutarlo tras reinicios del servidor.

#### Solución de problemas: Google OAuth y API Google Ads

- **`unauthorized_client` / "Refresh token no válido para este Client ID/Secret"**  
  El refresh token guardado en la agencia se generó con **otro** OAuth Client (otro Client ID/Secret en Google Cloud) distinto al configurado en las variables de entorno del contenedor. Solución: en la app, **desvincular** la cuenta de Google Ads y **volver a vincular**; así se obtiene un refresh token con el Client ID/Secret actual. Asegúrate de que en el contenedor solo haya un juego de credenciales y que coincidan con el proyecto OAuth usado en el flujo de consentimiento.

- **"Google devolvió una página HTML" / "Unexpected token '<', \"<!DOCTYPE\"..."**  
  La llamada a Google (intercambio de token o Google Ads API) está devolviendo una página de error HTML en lugar de JSON. Posibles causas:
  - **Intercambio de token**: mismo origen que `unauthorized_client`; desvincular y vincular de nuevo.
  - **Google Ads API**: comprueba que `GOOGLE_DEVELOPER_TOKEN` sea el token de **cuenta de desarrollador de Google Ads** (aprobado o en modo test). Con cuenta MCC, la sync usa `login-customer-id` y obtiene MCC + subcuentas vía `customer_client`; si no ves datos, revisa los logs de la sync (cada cuenta muestra "X campañas" o "0 campañas con datos en el rango").

#### Crear una nueva Edge Function

1. Crear carpeta en `supabase/functions/<nombre>/index.ts`.
2. Seguir la estructura estándar (ver `exchange-google-token` como referencia):
   - Import de Supabase: `import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'`
   - Headers CORS
   - `Deno.serve(async (req) => { ... })`
   - Crear cliente Supabase con `SUPABASE_SERVICE_ROLE_KEY`
3. Añadir la función al script `deploy-functions.sh`.
4. Copiar al volumen de Docker y reiniciar `supabase-edge-functions`.
5. La función estará accesible en `<SUPABASE_URL>/functions/v1/<nombre>`.

> **⚠️ IMPORTANTE**: Los lints de VS Code sobre `Deno`, `esm.sh` y tipos implícitos `any` en archivos de Edge Functions son **esperados** — el IDE no tiene los tipos de Deno instalados. Estos errores no afectan al runtime en el servidor.

