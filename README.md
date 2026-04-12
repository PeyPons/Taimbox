# Taimbox

![React](https://img.shields.io/badge/React-18-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Database-green?logo=supabase)
![Vite](https://img.shields.io/badge/Vite-Build-yellow?logo=vite)

**Taimbox** es una aplicación web para planificación de equipos, proyectos y control operativo y financiero en agencias de marketing. Frontend SPA (React + TypeScript + Vite) con datos y auth en **Supabase** (PostgreSQL, RLS, Edge Functions).

Repositorio **interno**; arranque local, scripts y variables de entorno no se documentan aquí (uso del equipo y [`docs/`](./docs/), en particular integración y despliegue en [`docs/05-integraciones-automatizacion.md`](./docs/05-integraciones-automatizacion.md)).

---

> [!IMPORTANT]
> **IA y desarrollo:** Arquitectura, reglas de negocio, integraciones y checklists en **[`DOCUMENTACION.md`](./DOCUMENTACION.md)** y **[`docs/`](./docs/)** (módulos numerados).

## Stack principal

- **UI:** React 18, TypeScript, Vite, Tailwind CSS, Radix UI / shadcn, react-router-dom, TanStack Query, react-i18next  
- **Backend BaaS:** Supabase (Auth, Postgres, Realtime; funciones en `supabase/functions/`)  
- **Calidad:** ESLint, Vitest  

## Documentación técnica

| Recurso | Contenido |
|---------|-----------|
| [`DOCUMENTACION.md`](./DOCUMENTACION.md) | Índice general y enlaces a módulos |
| [`docs/00-introduccion.md`](./docs/00-introduccion.md) | Propósito del paquete técnico |
| [`docs/01-arquitectura.md`](./docs/01-arquitectura.md) | SPA, GTM, i18n, SEO, blog, API pública |
| [`docs/02-entidades-modelos.md`](./docs/02-entidades-modelos.md) | Entidades, aliasing, multi-tenant |
| [`docs/03-logica-negocio.md`](./docs/03-logica-negocio.md) | Capacidad, split weeks, presupuesto, rentabilidad |
| [`docs/04-contextos-realtime.md`](./docs/04-contextos-realtime.md) | AppContext, Realtime, Deadlines |
| [`docs/05-integraciones-automatizacion.md`](./docs/05-integraciones-automatizacion.md) | Workers, Edge Functions, OAuth, Stripe, deploy, variables |
| [`docs/06-glosario-variables.md`](./docs/06-glosario-variables.md) | Términos técnicos |
| [`docs/07-mantenimiento-extension.md`](./docs/07-mantenimiento-extension.md) | RLS, API tokens, admin, cronómetro, permisos |
| [`docs/08-mapa-dependencias.md`](./docs/08-mapa-dependencias.md) | Impacto por types, hooks, componentes |
| [`docs/09-checklist-modificacion.md`](./docs/09-checklist-modificacion.md) | Checklist antes de cambios críticos |
| [`docs/10-gotchas-y-contenido.md`](./docs/10-gotchas-y-contenido.md) | Patrones UI/datos, copy, landings, tours |
| [`docs/11-notas-adicionales-readme.md`](./docs/11-notas-adicionales-readme.md) | Rescate del README antiguo (páginas, servicios, config, checklist UI) |

Lectura continua sugerida: `docs/00` → `docs/11`.
