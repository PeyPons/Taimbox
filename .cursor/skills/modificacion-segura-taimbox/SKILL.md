---
name: modificacion-segura-taimbox
description: >-
  Antes o durante cambios en tipos compartidos, AppContext u otros contextos,
  capacityUtils/dateUtils, permisos, Realtime, RLS o contratos sensibles: lee solo
  la documentación pertinente, consulta el mapa de impacto (docs/08) y la
  checklist (docs/09). Si la tarea es un barrido amplio del repo, sugiere o usa
  delegación en exploración paralela (Task explore) en lugar de cargar todo el
  árbol. Usar cuando el usuario toque esas áreas o pida impacto/seguridad en
  cambios de datos o suscripción en vivo.
---

# Modificación segura (Taimbox)

## Objetivo

Reducir regresiones al tocar **tipos**, **contextos**, **fechas/capacidad**, **permisos**, **Realtime**, **RLS / API** o **contratos** compartidos entre frontend y Supabase.

## Enfoque: agente único vs subagentes (Task)

- **Cambio acotado** (pocos archivos conocidos): el agente principal aplica este skill y abre solo los docs necesarios.
- **Exploración amplia** (“¿dónde se usa X?” en `src/`, `supabase/`, `docs/`): conviene **Task** con `subagent_type: explore` (readonly) y, si aplica, varias búsquedas en paralelo. No sustituye leer `docs/08` y `docs/09` cuando el cambio toque áreas críticas listadas abajo.

## Fuente de verdad y lectura de documentación

- Si el **código** contradice `docs/`, **prevalece el código**; indica la divergencia al usuario.
- Entrada al índice: [DOCUMENTACION.md](../../../DOCUMENTACION.md). **No cargues toda la carpeta `docs/`**; abre solo módulos relevantes al cambio.

## Documentos obligatorios según el tipo de cambio

| Si tocas… | Abre primero |
|-----------|----------------|
| Impacto entre archivos (types, contextos, hooks, planner, etc.) | [docs/08-mapa-dependencias.md](../../../docs/08-mapa-dependencias.md) |
| Checklist antes de cerrar (AppContext, types, capacity/date, permisos, Realtime, RLS…) | [docs/09-checklist-modificacion.md](../../../docs/09-checklist-modificacion.md) |

Según el tema, el índice en `DOCUMENTACION.md` apunta a otros módulos (`docs/02`, `docs/04`, `docs/05`, `docs/07`, etc.); ábrelos **solo** si el cambio lo exige.

## Checklist mínima de trabajo

1. Identificar qué filas de la **sección 8** de `docs/08` aplican (types / contexto / utilidades).
2. Recorrer los ítems pertinentes de `docs/09` antes de dar por buena la PR o el cambio.
3. Si el usuario pidió solo “auditoría” o “mapa de usos” sin editar aún, priorizar **explore** paralelo y devolver rutas de archivo concretas + riesgos.

## Convenciones del repo (recordatorio)

- TypeScript estricto; sin estado global tipo Redux/Zustand salvo petición explícita.
- Cambios mínimos al objetivo; no refactors colaterales no pedidos.
