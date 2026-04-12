# Taimbox — Índice de documentación técnica

**Taimbox** es una aplicación para planificación de equipos, proyectos y control operativo/financiero en agencias (SPA React + Supabase). Este archivo es el **índice**: el detalle técnico está modularizado en [`docs/`](docs/) para cargar solo el contexto necesario en el editor o en agentes de IA.

## Contenido modular (`docs/`)

| Documento | Qué encontrarás |
|-----------|-----------------|
| [docs/00-introduccion.md](docs/00-introduccion.md) | Título y propósito del documento técnico detallado original (incluye referencia al mapa de dependencias). |
| [docs/01-arquitectura.md](docs/01-arquitectura.md) | Stack SPA, GTM y Consent Mode, i18n y rutas `/en`, reglas SEO y páginas públicas, convenciones del blog y API docs. |
| [docs/02-entidades-modelos.md](docs/02-entidades-modelos.md) | Glosario de entidades (Agency, Employee, Project, Deadline, Allocation), aliasing, tablas de componentes y reglas multi-tenant. |
| [docs/03-logica-negocio.md](docs/03-logica-negocio.md) | Capacidad efectiva, split weeks, presupuesto efectivo y métricas de rentabilidad. |
| [docs/04-contextos-realtime.md](docs/04-contextos-realtime.md) | AppContext (carga, upsert, `loadedMonthsRef`), Realtime, canales unificados en Deadlines y bloqueos. |
| [docs/05-integraciones-automatizacion.md](docs/05-integraciones-automatizacion.md) | Workers Ads, Edge Functions (inventario, OAuth Google/Meta, emails, modo demo), Stripe, variables de entorno, despliegue y troubleshooting. |
| [docs/06-glosario-variables.md](docs/06-glosario-variables.md) | Tabla corta de términos técnicos (RLS, RBAC, micros, etc.). |
| [docs/07-mantenimiento-extension.md](docs/07-mantenimiento-extension.md) | Cómo extender tablas, cronómetro, RLS y API tokens, admin de plataforma, operaciones, rentabilidad y permisos. |
| [docs/08-mapa-dependencias.md](docs/08-mapa-dependencias.md) | Mapa de impacto por types, contextos, hooks, componentes y flujo de carga de mes. |
| [docs/09-checklist-modificacion.md](docs/09-checklist-modificacion.md) | Checklist antes de tocar types, AppContext, fechas, permisos, Realtime, RLS, deadlines o aliasing. |
| [docs/10-gotchas-y-contenido.md](docs/10-gotchas-y-contenido.md) | Patrones problemáticos en React/ datos, mantenimiento de copy, landings, notificaciones, tours y ortografía. |
| [docs/11-notas-adicionales-readme.md](docs/11-notas-adicionales-readme.md) | Rescate del README histórico: inventario de páginas, pitch/outreach, `errorService`/`auditService`, `constants`/`integrations`, fragmentos de checklist (móvil, Popover+Command). |

Para una lectura continua equivalente al monolito antiguo, abre los archivos en orden numérico (`00` → `11`).
