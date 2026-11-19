# Auditoría de veracidad de la web pública

Fecha: 2026-11-19. Alcance: páginas públicas en español y en inglés (home, precios, landings de funcionalidad, páginas por tipo de agencia, integraciones, monitor PPC, guía, FAQ de planes, blog solo si afirma una función del producto, API docs pública). No se ha tocado el Dashboard ni las páginas legales.

Los mockups con personas o marcas de ejemplo se tratan como ilustración. Solo se marcan si enseñan un botón, una métrica o una integración que el producto no tiene.

La fuente de contraste es el código del panel: `src/config/plans.ts`, rutas en `src/App.tsx`, pantallas y servicios, y las Edge Functions y tablas citadas abajo. No se usan cifras de una propuesta comercial.

## Recuento

| Categoría | Afirmaciones |
|-----------|--------------|
| REAL | 48 |
| PARCIAL | 7 |
| NO EXISTE | 16 |
| Total revisado | 71 |

Las 16 que no existen y las 7 parciales están corregidas en los JSON de la web (`src/locales/{es,en}/landing.json`, `homeLiteral.json` y la nota de horas en `apiDocs.json`). El tono sigue siendo comercial y el aspecto oscuro no cambia.

## NO EXISTE

| # | Dónde | Lo que decía | Corrección | Por qué no está |
|---|--------|----------------|------------|-----------------|
| 1 | Home, usos para líderes (`landing.json` `home.useCasesLeaderItems`; la clave no se pinta en la portada actual) | Bajar las reuniones de coordinación un 70 % | Menos idas y venidas para ver quién hace qué | No hay medición de reuniones en el producto |
| 2 | Home, usos para empleados (misma clave, tampoco pintada) | Priorización automática de tareas | Las tareas de la semana, con las dependencias a la vista | No hay un ordenador automático de tareas. Sí hay dependencias en el planificador |
| 3 | `/precios` y cierre de la home | Descuento o tarifa congelada de por vida | Los precios de la página son los que se cobran hoy. La app no congela la tarifa | `publicPricing.ts` guarda el importe vigente. No hay cupón ni lógica que bloquee una subida posterior |
| 4 | FAQ de `/precios` | Chat dentro de la app | Escribir a hello@taimbox.com. No hay chat | No hay widget de chat. Sí hay formulario en `/contacto` y correo |
| 5 | FAQ de `/precios` | Toda la agencia pasa a solo lectura al superar el cupo | En Free, por encima de 5 personas no se añaden personas ni asignaciones. En los planes de pago no se dan de alta más personas al llegar al tope. No se borra nada | `useSubscriptionLimits.ts`: el bloqueo de escritura (`isSoftLocked`) solo aplica a Free. El resto solo impide altas |
| 6 | `/precios` Scale y «Para quién» | Varias agencias o marcas dentro de una sola cuenta | Se puede crear otra agencia y cambiar de una a otra. No hay un holding dentro de una cuenta | `multiAgency` en `plans.ts` no lo lee ninguna pantalla. El cambio de agencia está en `AgenciesPage.tsx` |
| 7 | `/precios` Scale | Límites de API más altos | La misma API REST que Agency | No hay cupo de API distinto por plan. El rate limit del repo es de formularios públicos |
| 8 | `/precios` Scale | Onboarding trimestral | Se quitó de la lista | El onboarding es el alta y el asistente inicial, no una sesión trimestral |
| 9 | Landing de proyectos | Los OKR se alimentan solos con el planner | El avance del OKR se escribe a mano | `OkrsPage.tsx` guarda título, progreso y key results. No los calcula desde allocations |
| 10 | Guía, Weekly Forecast | Las horas se reasignan solas | El sistema propone y la persona decide | `WeeklyForecastPage.tsx` y `useDeadlinesRedistribution.ts` proponen. No hay un apply automático |
| 11 | Integraciones, pie del mock de weekly | Aviso fijo los viernes a las 18:00 | El aviso sale si hay una regla con día y hora | `process-notification-rules` usa `schedule_hour_utc`. No hay un viernes a las 18:00 fijo |
| 12 | Integraciones, PPC y páginas de agencia de medios | Sincronización de Ads cada hora, como promesa del producto | Los datos son los de la última sincronización. Desde Agency hay un cron de servidor, sin hora prometida | `scheduled-ads-sync` existe y filtra Agency/Scale/Enterprise. La cadencia la pone quien opera el cron, no la app |
| 13 | Home, bloque de API | SDK de JavaScript publicado | Endpoints documentados y ejemplos HTTP. No hay un SDK publicado | Los ejemplos de la API docs usan el cliente HTTP. No hay paquete `@taimbox` |
| 14 | Home, monitor PPC (texto y etiquetas del esquema) | Métrica CPL | Se habla de CPC, que sí calcula la pantalla de Google Ads | `AdsPage.tsx` muestra CPC, CPA, CTR y ROAS. No hay un campo CPL |
| 15 | API docs, tutorial de horas | Webhook de `timer_sessions` | Se leen `timer_sessions` y `time_entries` si el token tiene scope. Nada las empuja | Las tablas existen. No hay Edge Function que las publique |
| 16 | Monitor PPC, tarjeta de sync manual | Conexión a Google Ads sin latencia ni espera | Al pulsar, el servidor llama a la API. No es un streaming | `sync-google-ads` es una petición. El realtime del panel es otra cosa (cambios de Postgres) |

## PARCIAL

| # | Dónde | Lo que decía | Qué hay de verdad | Corrección |
|---|--------|----------------|-------------------|------------|
| 1 | `/precios` Enterprise | SLA, DPA, hosting dedicado y cuenta técnica incluidos | Esos acuerdos no son interruptores. Las condiciones ya dicen que el SLA no va en los planes estándar | El texto dice que se pactan con ventas |
| 2 | `/precios` Scale | Auditoría y soporte prioritario como producto | El registro de actividad existe (`/actividad`, `audit_logs`) desde Team. No hay una cola de soporte prioritario | Se deja el registro de actividad. El soporte se nombra como conversación, no como cola |
| 3 | `/precios`, incluido en todos | Partes de horas automatizados | Hay cronómetro (`timer_sessions`) y horas introducidas a mano (`time_entries`) | El texto dice cronómetro y horas a mano. No se genera un parte solo |
| 4 | Landing de proyectos, coherencia | Revisa tareas huérfanas, presupuestos por encima del override y conflictos de agenda | `planningCoherenceCompute.ts` compara horas de deadline con planificadas y computadas, por persona y proyecto | El texto describe esa comparación |
| 5 | Integraciones, cierre semanal | Avisa solo, recoge el feedback y reescribe el forecast | La persona confirma. El aviso depende de una regla. Las horas confirmadas quedan en el seguimiento | El titular pasa a «cierre que confirma el equipo» |
| 6 | Monitor PPC | ROAS, CPA, CPC y CTR en cada cuenta de Google y de Meta | `AdsPage.tsx` (Google) calcula los cuatro. `MetaAdsPage.tsx` enseña gasto, ritmo y ROAS si hay valor de conversión | El texto separa Google y Meta |
| 7 | Home, Meta | Desviaciones en vivo | El dato entra al sincronizar, igual que Google | «Las cifras entran al sincronizar, no en streaming» |

## REAL

Capacidades que la web puede seguir diciendo. Cada fila cita el código.

1. Planificador por persona y semana. `src/pages` del planner y `AllocationSheet.tsx`.
2. Deadlines mensuales por proyecto. Ruta de deadlines y `DeadlinesPage`.
3. Cronómetro por tarea y página Tiempos. `timer_sessions`.
4. Free: hasta 5 personas e histórico del mes actual y el anterior. `PLAN_LIMITS.starter` en `src/config/plans.ts`.
5. Team: 10 incluidas, extra de pago, máximo 25, histórico sin el tope de dos meses. `PLAN_LIMITS.pro`.
6. Weekly Forecast, actividad, OKR (a mano), radar, rentabilidad y exports básicos desde Team. `ROUTES_REQUIRE_PRO`, `planIncludesWeekly`, `planIncludesOkrs`, `planIncludesRadar`, `planIncludesFullReports`.
7. Agency: 40 incluidas, extra, máximo 100, monitor PPC, sync manual y programada, API y exports avanzados. `PLAN_LIMITS.business`, `ROUTES_REQUIRE_BUSINESS`, `scheduled-ads-sync`.
8. Scale: 100 incluidas, extra, sin tope de personas en la config, mismos Ads y API que Agency. `PLAN_LIMITS.scale`.
9. Alta con 14 días del plan Agency (`plan_id` business) y un solo trial. `supabase/functions/create-agency/index.ts`. El registro no pide tarjeta.
10. Cambio de plan con prorrateo si ya hay suscripción Stripe. `create-checkout-session` (`proration_behavior: create_prorations`).
11. Cobro de la suscripción en USD vía Stripe. `publicPricing.ts` y el webhook de Stripe.
12. Aislamiento por agencia con RLS. Políticas en migraciones y el texto de seguridad que ya lo dice sin SOC 2 ni ISO propios.
13. Cambios del planificador en cuanto se guardan. `AppContext.tsx` se suscribe a `postgres_changes`.
14. Sugerencias de redistribución con proyectos en común. `useDeadlinesRedistribution.ts`. Las aplica una persona.
15. Las ausencias restan capacidad. `src/utils/absenceUtils.ts`.
16. Semanas partidas y horas computadas con la regla de no restar dos veces ausencia y evento. Cálculo de rentabilidad y el artículo «por qué».
17. Reglas de segmentación de campañas y agrupación de cuentas. Tabla `segmentation_rules` y el monitor de Ads. Los nombres de marca del esquema son ilustración.
18. ROAS, CPA, CPC y CTR en la pantalla de Google Ads. `AdsPage.tsx`.
19. Proyección de cierre de mes a partir del ritmo de gasto ya sincronizado. Calculadora de pacing del monitor.
20. OAuth de Google Ads y Meta en solo lectura. `sync-google-ads` y `sync-meta-ads`.
21. Exportaciones CSV y JSON, básicas o avanzadas según plan. `src/config/planExportBlocks.ts`.
22. Tokens de API firmados HMAC SHA-256 (JWT). `supabase/functions/generate-api-token/index.ts`.
23. Permisos por rol. `src/types/permissions.ts`.
24. Formulario de contacto y correo hello@taimbox.com. `ContactoPage.tsx`.
25. Panel de soporte dentro del área de agencia para quien ya es cliente. Ruta de soporte del panel.
26. Sin tope de clientes ni de proyectos en `PLAN_LIMITS`.
27. Indicadores de color cuando alguien pasa de su capacidad semanal. Barras del planificador.
28. Avisos configurables (día y hora UTC), no un horario fijo. `process-notification-rules`.
29. El usuario puede pertenecer a más de una agencia y cambiar. `AgencyContext.switchAgency`. No es un holding.
30. Cierre semanal con resumen de horas estimadas, reales y computadas. `WeeklyForecastPage.tsx`.
31. Dependencias entre tareas. Selector de dependencias del planificador.
32. Control de coherencia deadline frente a horas planificadas y computadas. `planningCoherenceCompute.ts`.
33. Google Ads y Meta como únicas plataformas de anuncios conectadas. No hay otras redes en el código.
34. API REST documentada con scopes y RLS. `src/pages/api-docs`.
35. Histórico sin límite de meses desde Team. `historyMonths: null`.
36. El trial vencido vuelve a Free y conserva los datos. `expire-trials` y `useSubscriptionLimits`.
37. Sync manual de Ads con un botón, en planes con PPC. `sync-google-ads` (`source: manual`).
38. Presupuesto mensual objetivo en Meta, comparado con el ritmo. `MetaAdsPage.tsx`.
39. Horarios por persona y capacidad que sale de ese horario. Ajustes de empleado.
40. Registro de actividad desde Team. `ActivityPage.tsx`, tabla `audit_logs`.
41. Infraestructura descrita como PostgreSQL/Supabase propio, sin afirmar SOC 2 ni un 99,99 % de disponibilidad. Texto de `/seguridad`, ya alineado con `scripts/check-marketing-claims.mjs`.
42. Pagos con Stripe y baja de la suscripción. `stripe-webhook` y la pestaña de facturación.
43. Vista de equipo de quién tiene el cronómetro en marcha. Página Tiempos.
44. Impacto de una asignación antes de guardarla, en el flujo de deadlines y sugerencias.
45. Módulos que un admin enciende (weekly, objetivos, deadlines, cronómetro, PPC) según plan. `PLAN_MODULES`.
46. Ejemplos HTTP de la API, incluidos fragmentos en Python, sin un SDK de Python. Tile de integraciones, que ya decía «ejemplos».
47. La home no inventa un segundo producto: planner, Ads en solo lectura, API, cronómetro, weekly y exports. `homeLiteral.json`, tras quitar CPL, el SDK y la tarifa de por vida.
48. El blog de método (timeboxing, Parkinson, plantillas) no afirma un botón que no exista. No se ha reescrito.

## Qué no se ha cambiado

- Páginas de privacidad y condiciones.
- Código, rutas y datos del Dashboard.
- Precios numéricos vigentes de `publicPricing.ts`.
- Mockups de personas y de marcas como dibujo del concepto, salvo la etiqueta CPL, que se ha sustituido por CPC porque esa cifra sí existe en Google Ads.
