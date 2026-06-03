# Planes, suscripción y precios (fuente de verdad producto)

Este módulo describe el **comportamiento actual del código** (junio 2026). Si contradice copy antiguo en landings o docs viejos, **prevalece el código** en:

- `src/config/plans.ts` — límites, módulos, rutas por plan
- `src/config/planExportBlocks.ts` — bloques del hub de exportación
- `src/config/publicPricing.ts` + `src/config/publicPricingLayout.ts` — precios públicos USD y layout home/`/precios`
- `src/hooks/useSubscriptionLimits.ts` — plan efectivo, histórico, flags
- `src/hooks/usePlanMonthNavigation.ts` — tope de meses en vistas con calendario
- `src/components/auth/PlanGuard.tsx` — bloqueo de rutas por plan
- Edge: `register-agency`, `create-checkout-session`, `stripe-webhook`, `expire-trials`, `_shared/sync-agency-modules.ts`, `scheduled-ads-sync`

Copy de marketing: `src/locales/{es,en}/landing.json` → `pricing.plans.*` (home y `/precios` leen el mismo bloque).

---

## 1. Identificadores y nombres comerciales

| `plan_id` (BD / Stripe metadata) | Nombre en UI pública | Cobro Stripe self-serve |
|----------------------------------|----------------------|-------------------------|
| `starter` | **Free** | No |
| `pro` | **Team** | Sí (49 USD/mes early, 99 USD oficial) |
| `business` | **Agency** | Sí (149 / 249 USD) |
| `scale` | **Scale** | Contacto ventas (`/contacto`) |
| `enterprise` | **Enterprise** | Contacto / contrato |

Los IDs internos **no** se renombran en BD (`pro` = Team, `business` = Agency).

---

## 2. Precios públicos (landing)

- **Moneda mostrada:** USD (conversión orientativa vía Frankfurter en selector; **cobro Stripe en USD**).
- **Early adopter:** precio tachado = `usdMonthlyOfficial`; precio activo = `usdMonthly` en `publicPricing.ts`.
- **Home (s07):** Free, Team, Agency (destacado), Enterprise — sin tarjeta Scale (`PRICING_HOME_PLAN_IDS`).
- **`/precios`:** fila 1: Free, Team, Agency; fila 2: Scale, Enterprise (`PRICING_ROW_PRIMARY` / `PRICING_ROW_SECONDARY`).

LATAM orientativo (solo display): Team 29 USD, Agency 89 USD, Scale 179 USD (`PLAN_REGIONAL_LATAM_USD`).

---

## 3. Personas gestionadas y facturación por asiento

Cuenta **personas gestionadas** (`countManagedUsers` en `src/utils/managedUsers.ts`), no solo “empleados activos”.

| Plan | Incluidas | Extra (USD/mes) | Máximo facturable |
|------|-----------|-----------------|-------------------|
| Free | 5 | — | 5 |
| Team | 10 | 5 $ | 25 |
| Agency | 40 | 3,50 $ | 100 |
| Scale | 100 | 2,50 $ | Sin tope en producto |
| Enterprise | — | — | Sin tope (límite técnico alto en config) |

Checkout Stripe puede añadir línea `extra_managed_users` (`create-checkout-session` + precios seat en env).

---

## 4. Histórico de meses (Free)

- `limitHistoryToTwoMonths: true` solo en **Free**.
- `useSubscriptionLimits` expone `historyMinDate` = inicio del **mes anterior al actual** (2 meses de calendario: actual + anterior).
- `usePlanMonthNavigation` aplica ese mínimo en: planificador, deadlines, capacidad, clientes/proyectos, dashboard empleado, finanzas, radar operativo.
- Exportación y finanzas: el selector de meses no permite ir antes de `historyMinDate`.

**Team+:** histórico ilimitado en producto (sin `historyMinDate`).

---

## 5. Módulos por plan (`PLAN_MODULES` + sync servidor)

Tras cambio de plan, `stripe-webhook` y `expire-trials` llaman `syncAgencyModulesForPlan` (fusiona flags en `agencies.settings.modules`).

| Módulo | Free | Team | Agency+ |
|--------|------|------|---------|
| `deadlines` | Sí | Sí | Sí |
| `timeTracker` | Sí | Sí | Sí |
| `weeklyFeedback` | No | Sí | Sí |
| `professionalGoals` (OKR) | No | Sí | Sí |
| `ppc` (Ads) | No | No | Sí (Agency, Scale, Enterprise) |

El onboarding y ajustes de agencia **no pueden activar** módulos no permitidos por plan (`moduleAllowed` en `OnboardingWizard`).

---

## 6. Rutas protegidas por plan

### 6.1 `PlanGuard` (redirige a `/agency?tab=billing`)

Rutas que requieren **Team o superior** (`ROUTES_REQUIRE_PRO`):

- `/weekly-forecast`
- `/okrs`
- `/operaciones`
- `/finanzas`
- `/capacidad` (alias `/team-capacity`)
- `/exportacion-informes`

Rutas que requieren **Agency o superior** (`ROUTES_REQUIRE_BUSINESS`):

- `/ads`
- `/meta-ads`
- `/api-keys`

**Scale** y **Enterprise:** `canAccessRoute` devuelve `true` para todas las rutas anteriores.

### 6.2 `ModuleGuard` (además del plan)

- `/okrs` → `professionalGoals`
- `/ads`, `/meta-ads` → `ppc`
- `/weekly-forecast` → `weeklyFeedback`
- `/tiempos` → `timeTracker` (ruta no exige Team; solo módulo + permiso rol)

### 6.3 Permisos de rol (`ROUTE_PERMISSIONS`)

Siguen siendo necesarios (p. ej. `can_access_financial_health` para `/finanzas`). **Plan y rol son independientes:** un rol con permiso pero plan Free verá el enlace solo si `canAccessRouteByPlan` lo permite; al entrar, `PlanGuard` redirige a facturación.

### 6.4 Sidebar

`Sidebar` usa `canAccessNav(route) = canAccess(route) && canAccessRouteByPlan(route)` para seguimiento, OKR, PPC y API.

---

## 7. Funcionalidad vs copy de precios (matriz)

| Promesa en pricing (Team) | Implementación |
|---------------------------|----------------|
| 10 personas (+5 $/extra, máx. 25) | `PLAN_LIMITS.pro` + `canAddEmployee` |
| Histórico ilimitado | Sin `historyMinDate` en Team+ |
| Weekly y pronósticos | `/weekly-forecast` + módulo `weeklyFeedback` |
| OKRs y radar operativo | `/okrs` + `/operaciones` |
| Reportes completos | `/finanzas` (Team+) |
| Exports básicos | Hub `/exportacion-informes` (Team+): bloques básicos en `planExportBlocks.ts` |

| Promesa (Agency) | Implementación |
|------------------|----------------|
| 40 personas (+3,50 $/extra, máx. 100) | `PLAN_LIMITS.business` |
| Monitor PPC, API, sync programada | Rutas Ads/API + cron `scheduled-ads-sync` solo `plan_id IN ('business','scale','enterprise')` |
| Exports avanzados | Coherencia, radar, rentabilidad, burnout, ZIP/bundle JSON |

| Free | Planificador, deadlines, cronómetro, 5 personas, histórico 2 meses |

---

## 8. Hub de exportación (`/exportacion-informes`)

Requiere permiso `can_access_agency_settings` **y** plan Team+ (`PlanGuard`).

| Bloque | Team | Agency+ |
|--------|------|---------|
| Deadlines, asignaciones globales, planificación, ausencias/eventos | Sí | Sí |
| Coherencia, radar, rentabilidad, burnout | No | Sí |
| ZIP completo / bundle JSON único | No | Sí |

---

## 9. Trial Agency (14 días)

- **Registro:** `register-agency` asigna `plan_id = business`, `subscription_status = trialing`, `trial_ends_at` (+14 d), marca `trial_used_at` si es el primer trial.
- **Un trial por agencia** (`trial_used_at` no null → no se ofrece trial en checkout).
- **Checkout:** sin periodo de prueba en Stripe (solo registro).
- **Expiración:** Edge `expire-trials` + RPC `expire_agency_trials()`; cron recomendado en servidor.
- **Cliente:** si `trialing` y `trial_ends_at` pasado, `useSubscriptionLimits` trata como **Free** hasta que el webhook actualice.

Durante el trial, la agencia tiene **entitlements de Agency** (OKR, finanzas, Ads, exports avanzados).

---

## 10. Stripe y facturación

Ver detalle operativo en [05-integraciones-automatizacion.md](05-integraciones-automatizacion.md) § 5.2.

Resumen:

- Campos `agencies`: `plan_id`, `subscription_status`, `stripe_*`, `trial_*`, `subscription_period_ends_at`, `subscription_cancel_at_period_end`, `trial_used_at`.
- `create-checkout-session`: `pro`, `business`, `scale`; extras de asientos.
- `stripe-webhook`: actualiza plan + `syncAgencyModulesForPlan`.
- Portal: `create-billing-portal-session`.
- Soft-lock por exceso de personas: solo **Free** (`isSoftLocked`); Team/Agency bloquean altas con `canAddEmployee` pero no el mismo banner global.

---

## 11. Admin plataforma

- `/admin/agencies`: forzar plan vía `admin-set-agency-plan` / RPC `admin_set_agency_plan` — valores `starter|pro|business|scale|enterprise`.
- UI admin puede listar solo Starter/Pro/Business en filtros; Scale/Enterprise existen en RPC.

---

## 12. Archivos a tocar al cambiar planes

1. `src/config/plans.ts` + tests `src/config/plans.access.test.ts`
2. `src/config/planExportBlocks.ts` (si cambian exports)
3. `src/config/publicPricing.ts` + layout + Stripe price IDs
4. `src/locales/*/landing.json` (`pricing.plans`)
5. Edge `sync-agency-modules.ts` (mantener alineado con `PLAN_MODULES`)
6. Migración SQL si nuevos `plan_id` o columnas
7. Este documento y [DOCUMENTACION.md](../DOCUMENTACION.md)

---

## 13. Enlaces relacionados

- [05-integraciones-automatizacion.md](05-integraciones-automatizacion.md) — Stripe, cron Ads, deploy Edge
- [07-mantenimiento-extension.md](07-mantenimiento-extension.md) — permisos de rol vs plan
- [08-mapa-dependencias.md](08-mapa-dependencias.md) — hooks y páginas afectadas
- [12-onboarding-registro.md](12-onboarding-registro.md) — trial y módulos iniciales
- [11-notas-adicionales-readme.md](11-notas-adicionales-readme.md) — inventario de páginas públicas y admin
