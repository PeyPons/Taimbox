---
name: qa-ui-responsive-taimbox
description: >-
  Tras cambios de UI/maquetación en Taimbox: verificar layout en viewports
  mobile/tablet/desktop, capturar screenshots, revisar overflow/tablas/controles
  densos y claridad de uso (no solo “se ve bien”). Usar en páginas con tablas,
  tabs, desgloses o toolbars (p. ej. /finanzas, /operaciones, planner). También
  tras pedir “responsive”, “pixel”, “QA visual” o “probar en móvil”.
---

# QA UI responsive (Taimbox)

## Objetivo

Asegurar que la UI **funciona y se entiende** en todos los anchos relevantes:
sin scroll horizontal indeseado, sin columnas cortadas, con controles usables
y jerarquía clara. “Se ve bien” no basta si el usuario no encuentra lo
importante o no puede expandir/desglosar con comodidad.

## Cuándo aplicar

- Cambios en `src/pages/**`, `src/components/**` con layout, tablas, tabs, sheets o toolbars.
- Páginas densas: **Rentabilidad** (`/finanzas`), Seguimiento operativo (`/operaciones`), planner, listados con muchas columnas.
- Pedidos explícitos de QA visual / responsive / mobile / “pixel”.

## Stack y herramientas

- Dev server: `npm run dev` (Vite en **puerto 8080** por defecto: `http://localhost:8080`).
- Browser / GUI: subagente **`computerUse`** (o browser MCP del entorno) para navegar, redimensionar, capturar y leer pantallas.
- Tailwind del repo: breakpoints por defecto (`sm` 640, `md` 768, `lg` 1024, `xl` 1280, `2xl` 1536). El `container` limita a `2xl: 1400px`.
- No inventar puertos ni rutas: confirmar en `vite.config.ts` y `src/App.tsx`.

## Credenciales y secretos

- **Nunca** escribir contraseñas, tokens ni `.env` en esta skill, en commits ni en PRs.
- Si el usuario da acceso en el chat, usarlo solo en la sesión de prueba y no persistirlo en archivos del repo.
- Preferir cuentas de prueba / demo. Si hay que loguearse, hacerlo vía UI; no hardcodear.

## Viewports obligatorios

| Nombre | Ancho × alto | Uso |
|--------|--------------|-----|
| Mobile S | 375 × 812 | iPhone SE / compacto |
| Mobile L | 428 × 926 | móvil grande |
| Tablet | 768 × 1024 | `md` |
| Desktop | 1280 × 800 | trabajo diario |
| Wide | 1536 × 900 | `2xl` / ultrawide |

Mínimo en un pase rápido: **375, 768, 1280**. Completar 428 y 1536 en páginas densas o PRs de UI.

## Flujo

1. **Servidor** — Si no hay dev server, `npm run dev` y esperar a que responda en `:8080`.
2. **Ruta** — Ir a la URL concreta del cambio (p. ej. `/finanzas`), no solo a `/`.
3. **Auth** — Si redirige a login, autenticar con la cuenta de prueba indicada por el usuario (sin guardar secretos).
4. **Por cada viewport** — Redimensionar → esperar layout estable → screenshot (viewport y, si hace falta, scroll de zonas críticas) → checklist abajo.
5. **Interacción** — Probar lo que el cambio toca: tabs, expandir fila, desglose, filtros, mes anterior/siguiente, diálogos, scroll de tabla.
6. **Claridad (además del layout)** — Preguntar: ¿qué es lo más importante en el primer viewport? ¿se entiende sin tooltip? ¿hay demasiados botones al mismo nivel?
7. **Informar** — Tabla PASS / WARN / FAIL por viewport + lista de hallazgos accionables.
8. **Corregir y re-probar** — Solo viewports afectados; no dejar FAIL sin fix o sin justificación explícita.

## Checklist de rotura (layout)

- [ ] Scroll horizontal en `body` / contenedor principal: **FAIL** si existe. En móvil denso, **no** basta con `overflow-x-auto` en la página: sustituir por **cards/lista** (`md:hidden` + tabla `hidden md:block`).
- [ ] Texto cortado, truncado sin acceso al valor completo, o columnas que “desaparecen” sin alternativa mobile.
- [ ] Toolbar / filtros: botones apilados o wrap legible; touch targets ≥ ~40px en móvil.
- [ ] Tabs: etiquetas legibles; no se solapan; scroll horizontal de tabs solo si es inevitable y obvio.
- [ ] Tablas: en móvil preferir **cards** con métricas clave (nombre, margen/horas, EHR). Ocultar columnas con `hidden md:table-cell` solo si la fila sigue legible **sin** scroll horizontal.
- [ ] Header fijo móvil (`Header` `fixed h-16`): banners globales (`PlannerMonthBanner`, etc.) deben vivir **dentro** del offset (`pt-16` en el wrapper de AppLayout), no con `margin-top` solo en `<main>` (deja hueco y tapa el texto).
- [ ] Sticky headers / sidebars / modales: no tapan CTAs ni el teclado virtual de forma grave.
- [ ] Imágenes / avatares / badges: no provocan overflow; en filas móviles limitar badges a alertas críticas.
- [ ] Consola: sin errores JS nuevos (`TypeError`, hydration, imports fallidos).

## Checklist de claridad (producto denso)

Aplica sobre todo a `/finanzas` y pantallas con KPIs + tablas + desgloses:

- [ ] **Primero lo importante**: margen / semáforo / totales antes que controles secundarios.
- [ ] Controles (Horas reales/computadas, Coste operativo/dinámico, Objetivo y gastos) agrupados y secundarios respecto a los KPIs.
- [ ] Filas expandibles: el desglose se entiende (quién, horas, coste, margen) sin tabla anidada ilegible.
- [ ] En móvil: preferir ** Tarjetas o filas resumidas + detalle al expandir** frente a tablas de muchas columnas comprimidas.
- [ ] No ocultar métricas críticas solo para “que quepa”; reestructurar (resumen → detalle), no eliminar datos clave.
- [ ] Copy de columnas/tooltips en el idioma de la UI (`react-i18next`); no hardcodear solo ES si la clave ya existe.

## Formato de informe

```
QA UI — <ruta> (<fecha breve>)
Viewport | Veredicto | Notas
375      | PASS/WARN/FAIL | …
768      | … | …
1280     | … | …

Hallazgos:
1. [FAIL/WARN] … → fix propuesto / aplicado
2. …

Claridad:
- Lo más importante visible: sí/no
- Desgloses usables: sí/no
- Siguiente mejora opcional: …
```

## Alcance de código al corregir

- Cambios mínimos orientados a layout/UX de la pantalla tocada.
- Reutilizar patrones del design system (`Card`, `Tabs`, `Button`, `cn`, tokens Tailwind del proyecto).
- No meter librerías nuevas ni stores globales.
- Si el cambio es estructural en rentabilidad/métricas, revisar impacto en `docs/08-mapa-dependencias.md` / skill `modificacion-segura-taimbox` solo cuando toque lógica de datos, no solo CSS/JSX de presentación.
- No actualizar `docs/` salvo que el usuario lo pida o cambie comportamiento de producto documentado.

## Anti-patrones

- Dar por bueno un screenshot desktop único.
- “Pixel-perfect” contra Figma sin pedirlo (esta skill prioriza usabilidad multi-dispositivo).
- Añadir más botones/badges en el primer viewport para “arreglar” densidad.
- Compactar una tabla ancha en móvil dejando 3–4 columnas + scroll horizontal: **no es solución**; usar cards.
- Offset del header con `margin-top` en main mientras los banners quedan fuera: el aviso de “otro mes” queda tapado.
- Persistir credenciales o URLs con secretos en el repo.
