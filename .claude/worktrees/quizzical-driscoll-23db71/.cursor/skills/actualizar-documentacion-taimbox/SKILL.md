---
name: actualizar-documentacion-taimbox
description: >-
  Cuándo alinear docs modulares (docs/*) y DOCUMENTACION.md tras un cambio de
  código. Usar cuando el usuario pida documentación, al cerrar una feature de
  producto, al tocar Edge Functions/contratos descritos en docs, o al editar
  archivos bajo docs/. No usar para refactors internos, fixes triviales o UI
  cosmética sin cambio de comportamiento. Complementa la regla
  documentacion-cambios-producto.
---

# Actualizar documentación (Taimbox)

## Objetivo

Mantener **`docs/*.md`** y el índice **`DOCUMENTACION.md`** útiles como referencia, **sin rellenarlos de ruido** (entradas al índice o párrafos que no aportan porque el cambio no era documentable).

## Regla Cursor asociada

En el repo existe **[`.cursor/rules/documentacion-cambios-producto.mdc`](../../rules/documentacion-cambios-producto.mdc)**. **No usa `alwaysApply: true`**: si estuviera siempre activa, el agente tendería a “tocar docs” en cada conversación, incluso en arreglos de una línea, y **`DOCUMENTACION.md`** acabaría lleno de filas o menciones irrelevantes.

- **Alcance de la regla:** se engancha sobre todo al trabajar en **`docs/**/*.md`** y **`DOCUMENTACION.md`** (y el agente puede seguir estos criterios cuando la tarea sea claramente de producto o contratos).
- Si el usuario pide **documentar** o **alinear docs**, aplica esta skill y esa regla aunque no tengas esos archivos abiertos.

## Cuándo **sí** actualizar documentación (criterio explícito)

Actualiza el módulo `docs/*` pertinente y, si aplica, **`DOCUMENTACION.md`**, **solo** si el cambio afecta a alguno de estos ámbitos:

1. **Comportamiento observable por el usuario:** flujos de pantalla, reglas de negocio que cambian lo que ve o puede hacer, permisos efectivos en UI, textos orientados a usuario (copy de producto, no solo claves i18n internas), rutas o navegación.
2. **Contrato entre módulos o con el exterior:** API documentada, Edge Functions, webhooks, shape de payloads, RLS o modelo de datos **que ya esté descrito en `docs/`** o que deba describirse para que otro dev o integración no se equivoque.
3. **Estructura de la documentación:** añades, renombras o partes archivos bajo `docs/` → **en el mismo PR** actualiza la fila correspondiente en **`DOCUMENTACION.md`** (eso sí es obligatorio cuando cambia el índice real de módulos).

En todos los casos: usa **`DOCUMENTACION.md`** como entrada y abre **solo** los `docs/*.md` que correspondan al tema; no cargues toda la carpeta.

## Cuándo **no** hace falta (evitar falsos positivos)

**No** amplíes `docs/` ni **`DOCUMENTACION.md`** por:

- Refactors internos sin efecto en producto (renombres locales, extracción de helpers, tipado más estricto sin cambiar comportamiento).
- Fixes triviales (off-by-one, null check, rendimiento invisible, una clase de Tailwind).
- Ajustes de UI **puramente cosméticos** (espaciado, color) que no cambian flujo ni significado para el usuario.
- El usuario pide explícitamente **omitir documentación** en esa tarea.

Si el **código** corrige un doc obsoleto, puedes **limitarte a indicar la divergencia** al usuario; no hace falta reescribir `docs/` entera. La fuente de verdad sigue siendo el código frente a texto desactualizado.

## `DOCUMENTACION.md` en concreto

- **Sí** añade o modifica una **fila del índice** cuando haya un **archivo nuevo** en `docs/`, un **renombre** o un **split** claro de módulos.
- **No** añadas filas “por si acaso” tras cada fix en `src/`; eso degrada el índice.

## Impacto y otros docs

Si además tocas types centrales, `AppContext`, permisos, Realtime, RLS, etc., sigue **[docs/08-mapa-dependencias.md](../../../docs/08-mapa-dependencias.md)** y **[docs/09-checklist-modificacion.md](../../../docs/09-checklist-modificacion.md)** como hasta ahora (skill **modificacion-segura-taimbox**).
