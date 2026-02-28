# Plan de implementación completo: Suscripciones Stripe (Taimbox)

Plan único para ejecutar el sistema de suscripciones: BD, backend, frontend (app + landings), registro, configuración y límites. Complementa [PLAN-SUSCRIPCIONES-DECISIONES-ESTRATEGICAS.md](./PLAN-SUSCRIPCIONES-DECISIONES-ESTRATEGICAS.md).

---

## 1. ¿Tenemos todo lo necesario?

| Requisito | Estado |
|-----------|--------|
| Esquema BD (agencies y tablas relacionadas) | Sí – proporcionado; `agencies` actual no tiene columnas Stripe/plan |
| Stripe conectado a Cursor | Sí – usuario lo ha conectado; si hace falta API key o webhook secret para Edge Functions, pedir que los comparta (env en Supabase) |
| Módulos e integraciones por plan | Sí – definidos en planes Starter/Pro/Business y en `AgencySettings` |
| Landings y rutas públicas | Sí – `LandingPage`, `LandingHeader`, `LandingFooter`, rutas en `App.tsx`; falta página de precios y enlaces |
| Configuración de agencia | Sí – `AgencySettingsPage` con pestañas (General, Equipo, Proyectos, Módulos, Integraciones, Departamentos, Apariencia); falta pestaña/sección Plan y facturación |
| Flujo de registro | Sí – `Login.tsx` + `register-agency` Edge Function; hay que asignar plan inicial (Starter o trial Business) |
| Tipos TypeScript (Agency) | Parcial – `src/types/index.ts` y `AgencyContext` mapean agencia; faltan campos de billing en tipo e interfaz Supabase |

**Conclusión:** Tenemos lo necesario para llevar a cabo el plan. Solo puede hacer falta que compartas **STRIPE_SECRET_KEY** y **STRIPE_WEBHOOK_SECRET** (o equivalentes) como variables de entorno en Supabase para las Edge Functions; el resto es código y migraciones en el repo.

---

## 2. Base de datos

### 2.1 Tabla `agencies` (actual según tu schema)

```sql
-- Columnas actuales
id, name, slug, settings, created_at, updated_at, setup_completed, status,
google_ads_refresh_token, google_ads_customer_id
```

### 2.2 Migración: columnas a añadir

Crear migración (por ejemplo `supabase/migrations/YYYYMMDD_add_agency_billing.sql`) con:

- `plan_id` – `text NOT NULL DEFAULT 'starter'`  
  Valores: `'starter' | 'pro' | 'business'`.  
  Opcional: `CHECK (plan_id IN ('starter','pro','business'))`.

- `subscription_status` – `text DEFAULT 'active'`  
  Valores típicos: `'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete' | 'incomplete_expired'`.  
  Permite saber si la suscripción está activa, en trial o cancelada.

- `stripe_customer_id` – `text` (nullable).  
  ID del Customer en Stripe; se rellena al crear/recuperar cliente desde la Edge Function.

- `stripe_subscription_id` – `text` (nullable).  
  ID de la Subscription en Stripe; útil para actualizar/cancelar desde backend o Customer Portal.

- `trial_ends_at` – `timestamp with time zone` (nullable).  
  Fin del trial (ej. 14 días); el webhook o un job puede comparar con `now()` para hacer downgrade a Starter.

Agencias existentes: quedarán con `plan_id = 'starter'` y `subscription_status = 'active'` por defecto. Si se decide que agencias actuales entren en trial Business, añadir un script o migración que ponga `plan_id = 'business'`, `subscription_status = 'trialing'` y `trial_ends_at = now() + interval '14 days'` (opcional).

### 2.3 RLS y políticas

Las columnas nuevas están en `agencies`. Si ya existe RLS por `requesting_agency_id()` y los usuarios solo ven su agencia, no hace falta cambiar políticas; solo asegurar que las Edge Functions que actualicen `agencies` usen `service_role` o un rol con permisos de escritura.

---

## 3. Backend (Supabase Edge Functions)

### 3.1 Variables de entorno

En el proyecto Supabase (Dashboard o self-hosted):

- `STRIPE_SECRET_KEY` – clave secreta de Stripe (sk_live_... o sk_test_...).
- `STRIPE_WEBHOOK_SECRET` – signing secret del webhook (whsec_...).

Si no están en el repo, el desarrollador debe añadirlas en la configuración de Edge Functions; no hace falta que las compartas en el chat si ya están en Supabase.

### 3.2 Edge Function: crear Customer + sesión Checkout

Nueva función (ej. `create-checkout-session` o `stripe-create-subscription`):

- **Input:** `agency_id`, `price_id` (Stripe Price para Pro o Business), opcional `success_url` / `cancel_url`.
- **Lógica:**
  - Con `SUPABASE_SERVICE_ROLE_KEY` leer la agencia; si no tiene `stripe_customer_id`, crear Customer en Stripe (nombre/email del admin o de la agencia) y guardar `stripe_customer_id` en `agencies`.
  - Crear Stripe Checkout Session en modo subscription con ese `customer`, el `price_id` y, si aplica, `subscription_data.trial_period_days = 14` para Business.
  - Devolver `{ url: session.url }` para redirigir al usuario.
- **Seguridad:** Verificar que el JWT del caller pertenezca a la agencia y tenga permiso de admin (por ejemplo `can_access_agency_settings` o rol administrador).

### 3.3 Edge Function: Webhook Stripe

Nueva función (ej. `stripe-webhook`):

- **Endpoint:** POST; cuerpo raw para verificar firma con `STRIPE_WEBHOOK_SECRET`.
- **Eventos a manejar:**
  - `customer.subscription.created` / `customer.subscription.updated`: leer `subscription.metadata.agency_id` (hay que pasar `agency_id` al crear la sesión/checkout vía metadata) o localizar agencia por `customer`; actualizar `agencies`: `stripe_subscription_id`, `plan_id` (mapeando price_id → plan), `subscription_status`, `trial_ends_at` si hay trial.
  - `customer.subscription.deleted`: poner `subscription_status = 'canceled'`, `plan_id = 'starter'` (downgrade).
  - `invoice.payment_failed`: opcional; mantener o actualizar `subscription_status` (ej. `past_due`) y, si se quiere, notificar.
- **Idempotencia:** usar `event.id` de Stripe para no procesar dos veces el mismo evento.

En Stripe Dashboard: configurar la URL del webhook (ej. `https://xxx.supabase.co/functions/v1/stripe-webhook`) y elegir los eventos anteriores.

---

## 4. Frontend: app (dentro de la herramienta)

### 4.1 Tipos y contexto

- **`src/types/index.ts`**  
  En el tipo `Agency` (y en la interfaz que mapea desde Supabase): añadir `planId`, `subscriptionStatus`, `stripeCustomerId`, `stripeSubscriptionId`, `trialEndsAt` (opcional). Mantener naming alineado con snake_case de BD si se usa transformación.

- **`AgencyContext`**  
  Al cargar la agencia desde Supabase, incluir las nuevas columnas. Exponer:
  - `planId`, `subscriptionStatus`, `trialEndsAt`
  - `isOverLimit`: `employeesCount > getPlanLimit(planId)` (Starter 5, Pro 20, Business 50)
  - `isSoftLocked`: `isOverLimit && planId === 'starter'` (solo lectura + banner)

- **Constantes de planes**  
  Crear `src/config/plans.ts` (o similar) con: límites por plan (empleados), `maxReportingDays` (30 para Starter, null para Pro/Business), mapa de módulos/integraciones permitidos por plan. Usar en toda la app.

### 4.2 Hook `useSubscriptionLimits`

- Devuelve: `{ planId, limitEmployees, currentEmployees, isOverLimit, isSoftLocked, canAccessModule(moduleKey), maxReportingDays }`.
- Lee de `AgencyContext` (o de un contexto derivado) el plan y el conteo de empleados activos.
- Para rutas/páginas: si el plan no incluye el módulo (ej. Radar, Ads, API), redirigir a “Plan y facturación” o mostrar mensaje de upgrade.
- Para escritura: si `isSoftLocked`, bloquear y mostrar CTA a Plan y facturación.

### 4.3 Banner soft lock

- En `AppLayout` (o layout principal dentro de `AppLayout`): si `isSoftLocked`, mostrar un banner fijo (rojo, prominente) con el texto acordado: *"Tu agencia excede los límites del Plan Starter. Pasa a Pro o Business para volver a planificar."* y botón/link a `/agency` (pestaña Plan y facturación) o a la página de precios.

### 4.4 Configuración de agencia: Plan y facturación

- **`AgencySettingsPage`**: nueva pestaña en el `TabsList` (ej. “Plan y facturación” con icono CreditCard o similar), junto a General, Equipo, Proyectos, Módulos, Integraciones, Departamentos, Apariencia.
- **Contenido de la pestaña:**
  - Plan actual: nombre (Starter / Pro / Business), límite de usuarios, uso actual (X de Y empleados).
  - Si hay trial: “Tu trial termina el {trialEndsAt}”.
  - Botones: “Cambiar de plan” / “Subir a Pro” / “Subir a Business” que llamen a la Edge Function de Checkout con el `price_id` correspondiente y redirijan a la URL de Stripe.
  - Opcional: enlace a Stripe Customer Portal (otra Edge Function que devuelva la URL del portal de Stripe) para gestionar tarjeta, facturas y cancelación.
- Solo visible para usuarios con permiso de administración de agencia.

### 4.5 Límites de empleados

- Donde se **crea** un empleado (p. ej. `TeamPage` o componente de alta): antes de abrir el formulario o enviar, comprobar `currentEmployees < limitEmployees`; si no, mostrar mensaje y enlace a “Plan y facturación”.
- Con soft lock: el mismo hook puede deshabilitar el botón “Añadir empleado” y mostrar el CTA.

### 4.6 Límite de 30 días (Starter) en Inteligencia/Reportes

- **FinancialHealthPage:** si `planId === 'starter'`, filtrar datos (meses) a `month >= (hoy - 30 días)` en las consultas o en el estado que alimenta KPIs y tablas.
- **Matriz de Fiabilidad / precisión de planificación:** si la vista muestra histórico por mes, aplicar el mismo filtro para Starter.
- **Tiempos / reportes de tiempo:** si hay vistas por mes antiguo, limitar a 30 días para Starter.
- **API (si se limita por plan):** en el middleware o en la documentación, indicar que cuentas Starter solo pueden pedir datos de los últimos 30 días para recursos de rentabilidad/coherencia (y aplicarlo en la implementación si la API expone esos datos).

No aplicar este filtro en: Planner, Deadlines, listados de tareas/proyectos, Weekly (para Pro).

### 4.7 Protección de rutas por plan

- **ModuleGuard / PermissionProtectedRoute:** además del módulo y permiso, comprobar que el plan permita el módulo (ej. Radar, Ads, OKRs, API solo Pro/Business). Si no, redirigir a “Plan y facturación” o a `/precios` con mensaje.
- Páginas clave a proteger según plan: `OperationsRadarPage` (Radar de Hemorragias), `AdsPage`, `MetaAdsPage`, `OkrsPage`, `ApiKeysPage` (o la ruta de API), `FinancialHealthPage` (solo filtro 30 días en Starter, no bloquear la ruta).

---

## 5. Landings y página de precios

### 5.1 Página de precios (`/precios`)

- Crear `PreciosPage.tsx` (o `PricingPage.tsx`) con `LandingHeader` y `LandingFooter`.
- Contenido: tabla o cards de los tres planes (Starter, Pro, Business) con precio (0 €, 49 €/mes, 149 €/mes), límites (5/20/50 usuarios, histórico 30 días solo Starter), características por plan (Planner + Deadlines, Weekly, EHR, Radar, Ads, API, OKRs).
- CTAs: “Empezar gratis” (Starter) → `/login?tab=register`, “Probar Business 14 días” / “Elegir Pro” / “Elegir Business” → para usuarios no logueados pueden ir a registro con query param o a login; para logueados se puede redirigir a la app y abrir Checkout desde “Plan y facturación”.
- Añadir ruta en `App.tsx`: `<Route path="/precios" element={<PreciosPage />} />`.

### 5.2 Actualizar landings principales

- **LandingPage (home):**
  - Añadir enlace visible a “Precios” o “Planes” en el header o en el hero/CTA.
  - Ajustar copy si es necesario: “Prueba gratuita”, “Plan Starter gratis”, “14 días de Business sin tarjeta” (según mensaje que quieras dar).
- **LandingHeader:**
  - Añadir enlace “Precios” (o “Planes”) en la navegación desktop y en el menú móvil, por ejemplo junto a Guía y API.
- **LandingFooter:**
  - En la columna “Producto” (o una nueva), enlace a `/precios`. Opcional: en “Empieza gratis” matizar que es Plan Starter y enlazar también a Precios.
- **Otras landings** (planificador, equipos, reportes, proyectos, integraciones): opcional añadir un CTA secundario tipo “Ver planes y precios” que apunte a `/precios`.

### 5.3 Login y registro

- **Login.tsx:** no es obligatorio cambiar el flujo; el copy “Crear cuenta gratis” puede seguir llevando a registro que crea agencia en plan Starter (o en trial Business si se decide así).
- **register-agency:** tras hacer `insert` en `agencies`, no incluye hoy columnas de billing; con la migración existirán valores por defecto (`plan_id = 'starter'`, etc.). Si se quiere que nuevos registros entren en trial Business de 14 días, en esta función (o en un trigger Postgres) asignar `plan_id = 'business'`, `subscription_status = 'trialing'`, `trial_ends_at = now() + interval '14 days'`. Si no, dejar que usen el default Starter.

---

## 6. Registro y configuración: impacto resumido

| Área | Cambio |
|------|--------|
| **Registro** | Agencia creada con `plan_id` (default `starter`) y, opcional, trial Business; `register-agency` no necesita crear Customer en Stripe aún (se crea al ir a “Plan y facturación” o al hacer upgrade). |
| **Onboarding** | Opcional: mencionar planes o enlazar a “Plan y facturación” al final del wizard. No bloqueante para el MVP. |
| **Configuración de agencia** | Nueva pestaña “Plan y facturación”; resto de pestañas pueden seguir igual. En “Módulos” e “Integraciones”, se puede mostrar como “disponible en plan X” los que no incluya el plan actual y deshabilitar su activación (o dejarlos activables solo si el plan los incluye). |
| **Suspensión** | Si ya existe lógica por `agencies.status = 'suspended'`, mantenerla; el soft lock por plan es independiente (solo lectura por exceso de usuarios en Starter). |

---

## 7. Orden de implementación sugerido

1. **Migración BD:** añadir columnas a `agencies` y desplegar.
2. **Tipos y AgencyContext:** actualizar tipo `Agency` y lectura de agencia; exponer `planId`, `subscriptionStatus`, `isOverLimit`, `isSoftLocked` y constante de límites.
3. **Config de planes:** `src/config/plans.ts` con límites y módulos por plan.
4. **Edge Function Checkout:** crear Customer si no existe, crear sesión Checkout, devolver URL.
5. **Edge Function Webhook:** actualizar `agencies` según eventos de suscripción y trial.
6. **Hook useSubscriptionLimits y banner soft lock:** implementar y conectar en layout.
7. **Pestaña Plan y facturación** en AgencySettingsPage y protección de creación de empleados.
8. **Filtro 30 días** en FinancialHealthPage (y en otras vistas de Inteligencia/Reportes que apliquen).
9. **Protección de rutas** por plan (ModuleGuard / permisos + plan).
10. **Página de precios** y rutas; actualizar **LandingHeader**, **LandingFooter** y **LandingPage** con enlaces y copy.
11. **Ajuste de registro** (opcional): trial 14 días en `register-agency` o script para agencias existentes.
12. **Documentación:** actualizar README y DOCUMENTACION con flujo de suscripciones, nuevas columnas y Edge Functions (según tu regla de mantener contexto).

---

## 8. Stripe: productos y precios

- En Stripe Dashboard (o vía MCP): crear Product “Taimbox Pro” y “Taimbox Business” (Starter es gratis, no hace falta producto).
- Crear Prices: Pro 49 €/mes (recurring month), Business 149 €/mes (recurring month); opcional precios anuales con descuento.
- Usar los `price_id` en la Edge Function de Checkout y en el webhook para mapear `price_id` → `plan_id` (pro/business).
- Para trial de 14 días en Business: al crear la Checkout Session, `subscription_data.trial_period_days = 14`; Stripe enviará `customer.subscription.updated` con `status: trialing` y `trial_end`.

---

## 9. Comportamiento: una suscripción, cancelación y trial

### 9.1 Una sola suscripción activa (cambio de plan)

Si un usuario con Business (o Pro) hace clic en "Pasarse a Pro" (o a Business), **no** se crea una segunda suscripción. La Edge Function `create-checkout-session` comprueba si la agencia tiene ya `stripe_subscription_id` con estado `active` o `trialing`. En ese caso:

- Se llama a **Stripe Subscription Update API**: se actualiza el ítem de la suscripción al nuevo `price_id` (Pro o Business), con prorrateo.
- Si pasaba de Business (en trial) a Pro, se fuerza `trial_end: 'now'` para que se cobre Pro desde ese momento.
- Se devuelve `{ updated: true }`; el frontend muestra un toast y refresca la agencia. El webhook `customer.subscription.updated` actualiza `plan_id`, `subscription_status` y `subscription_period_ends_at` en la BD.

Así se evita tener dos suscripciones activas a la vez.

### 9.2 Cancelar en Stripe → se refleja en la plataforma

Sí. Cuando el usuario cancela la suscripción en el **Customer Portal de Stripe** (o si se cancela por cualquier medio), Stripe envía el evento **`customer.subscription.deleted`**. El webhook `stripe-webhook` lo maneja y actualiza la agencia:

- `plan_id = 'starter'`
- `subscription_status = 'canceled'`
- `stripe_subscription_id`, `trial_ends_at`, `subscription_period_ends_at` a `null`

No hace falta ningún job ni polling: la fuente de verdad es Stripe y el webhook sincroniza el estado en Taimbox.

### 9.3 Trial: quién avisa y qué pasa al final

- **Durante el trial:** Stripe mantiene la suscripción con `status: trialing` y `trial_end` (fecha fin). El webhook ya guardó ese estado en `agencies` al crear/actualizar la suscripción.
- **Al finalizar el trial:** Stripe intenta cobrar automáticamente la primera factura. Si hay método de pago y el cobro va bien, Stripe envía **`customer.subscription.updated`** con `status: active` y sin trial; el webhook actualiza `subscription_status` y `trial_ends_at` (null). Si el cobro falla o no hay tarjeta, la suscripción puede pasar a `past_due`, `unpaid` o ser cancelada; Stripe envía **`customer.subscription.updated`** o **`customer.subscription.deleted`**, y el webhook actualiza (o hace downgrade a Starter).

Taimbox **no** tiene que comprobar fechas ni enviar avisos: Stripe es quien gestiona el ciclo de vida del trial y del cobro, y los webhooks son los que notifican a la plataforma. Basta con tener configurados los eventos `customer.subscription.created`, `customer.subscription.updated` y `customer.subscription.deleted` en el webhook.

### 9.4 Un solo trial por agencia

**Regla:** La misma agencia no puede volver a tener la prueba gratuita de 14 días. Si ya la usó (por registro con trial Business o por una suscripción Stripe en trial), al volver a contratar Business se cobra desde el primer día.

- **BD:** Columna `agencies.trial_used_at` (timestamptz, nullable). Migración: `20260228160000_agency_trial_used_at.sql`.
- **Webhook:** En `customer.subscription.updated` o `created`, si `status === 'trialing'`, se guarda `trial_used_at = now()` para esa agencia.
- **register-agency:** Al crear agencia con plan Business y trial 14 días, se setea `trial_used_at = now()`.
- **create-checkout-session:** Solo se añade `trial_period_days: 14` para Business cuando `trial_used_at` es null. Si la agencia ya tiene `trial_used_at`, el Checkout es sin trial (cobro desde el primer día).

### 9.5 Cancelar al final del periodo

Cuando el usuario cancela en el portal de Stripe con la opción "al final del periodo", Stripe mantiene la suscripción **activa** hasta `current_period_end` y envía **`customer.subscription.updated`** con `cancel_at_period_end: true` (no envía `subscription.deleted` hasta que termina el periodo).

- **BD:** La tabla `agencies` tiene la columna `subscription_cancel_at_period_end` (boolean). Migración: `20260228150000_agency_subscription_cancel_at_period_end.sql`.
- **Webhook:** En `customer.subscription.updated` (y `created`) se guarda `subscription_cancel_at_period_end` desde `sub.cancel_at_period_end`. En `customer.subscription.deleted` se pone a `false` junto con el resto del reset.
- **Taimbox (UI):** Aunque el plan siga activo hasta el fin del periodo, en Plan y facturación se muestra de cara al usuario que ya está cancelada: badge "Se cancela el {fecha}" y texto "Tu servicio finalizará el {fecha}. Después pasarás a Starter." El acceso no se quita hasta que Stripe envíe `subscription.deleted` y el webhook haga el downgrade a Starter.

---

Cuando quieras ejecutar, este plan y [PLAN-SUSCRIPCIONES-DECISIONES-ESTRATEGICAS.md](./PLAN-SUSCRIPCIONES-DECISIONES-ESTRATEGICAS.md) son la referencia única. Si necesitas que te pida explícitamente la API key o el webhook secret en algún paso, lo indico en la tarea correspondiente; si ya están en Supabase, no hace falta compartirlos en el chat.
