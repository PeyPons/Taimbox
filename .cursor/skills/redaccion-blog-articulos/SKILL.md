---
name: redaccion-blog-articulos
description: >-
  Redacta y revisa artículos de blog en español con tono humano, capas visuales en
  HTML/React (tablas, infografías, iconos en títulos) y criterio SEO editorial sin
  copy para máquinas. Incluye cuándo usar componentes dinámicos solo si aportan
  valor. Usar al escribir o revisar posts del blog, guías largas, TOC, JSON-LD,
  infografías en `src/components/landing/blog/`, o cuando el usuario pida voz
  natural frente a jerga SEO/inglés innecesario.
---

# Redacción de artículos de blog (Taimbox y similares)

## Objetivo

El lector es una **persona**, no un crawler. El texto debe sonar a conversación informada, no a plantilla rellenada con palabras clave, ni a manual de consultoría con “palancas” y “accionable” en cada párrafo.

## Voz y tono

- **Español natural**: frases completas, ritmo variado. Evitar listas de etiquetas (“paso opcional”, “bloque muy buscado”, “orientativo” repetido sin necesidad).
- **Inglés solo con sentido**: si un término se usa en el día a día del lector (p. ej. en agencias), puede aparecer **una vez** en contexto (“en inglés lo llaman…”). No llenar el párrafo de anglicismos intercambiables por castellano.
- **Sustituir jerga de máquina**:
  - “Workload vs recursos” → ideas en castellano: “quién hace qué” y “con qué medios”.
  - “Palancas” → “cosas concretas que puedes hacer”, “qué cambiar primero”.
  - Riesgos genéricos (“rotación”) → consecuencias humanas creíbles cuando encaje el tono del sitio.
- **Inyectar Cicatrices de Realidad**: > "Cada sección debe incluir al menos una 'cicatriz': un escenario real, mundano y específico que solo alguien que trabaja en una agencia reconocería. No hables de 'empleados estresados'; habla de 'tu diseñadora senior que deja de enviar GIFs por Slack y empieza a responder con un frío recibido'. Sustituye las abstracciones por consecuencias sensoriales: el silencio en un canal de equipo, las entregas a las 11 de la noche de un domingo o el 'cinismo' en una reunión de feedback."
- **Pasar la Prueba del Café (Peer-to-Peer)**: > "El tono no es de consultor, es de colega experto. Escribe como si estuvieras contándole esto a otro Director de Operaciones en un café. Si una frase suena a presentación de PowerPoint o a manual de recursos humanos, bórrala. Prohibido el 'Efecto Espejo': no resumas lo que acabas de decir con frases tipo 'En conclusión...' o 'Como hemos visto...'. Confía en la inteligencia del lector y pasa directamente al siguiente punto de dolor."
- **Romper la Simetría y la Tibieza**: > "Evita las listas perfectas de 5 o 10 puntos si no son necesarias; la realidad es desordenada. Si una idea es la más importante, dale un párrafo de una sola frase corta para que impacte. Sé intelectualmente honesto y provocador: si un proceso es una pérdida de tiempo o si el 'presencialismo digital' es una toxicidad fomentada por el propio director, dilo sin rodeos. No busques el consenso, busca la verdad operativa."
- **Énfasis (`strong`)**: con mesura; no tres negritas seguidas en cada línea.
- **Enlaces internos**: anclajes descriptivos (“el hilo sobre X lo desarrollamos en…”), no “lee también” ni mandatos vacíos.
- **CTA / producto**: útiles y editoriales (“explorar sin compromiso”), sin venta dura ni repetición de marca en cada sección.

## Presentación visual (HTML / React)

Los bloques que **organizan** y **rompen** la densidad mejoran la lectura:

- **Tablas** para mapas rápidos (columnas con títulos claros para humanos, no solo para SEO).
- **Listas** con `<ul>`/`<ol>` cuando hay pasos o señales; párrafos cortos entre bloques densos.
- **Secciones** con `<section id="...">`, `scroll-mt-24` si el header es fijo.
- **H2 con icono (patrón único del blog)**: igual que en `KpisAgenciasMarketingArticle` y `PlantillaPlanificacionRecursosArticle` — el `<h2>` lleva `flex items-center gap-3`, primero el icono Lucide (`h-8 w-8 … shrink-0`), **después** el texto del título (que puede ser de varias líneas). Así el icono queda **centrado en vertical** respecto al bloque de texto. No usar `items-start` ni `mt-0.5` en el icono para “bajarlo”: rompe la alineación cuando el título hace salto de línea.
- **Numeración de secciones (guías largas)**: en artículos tipo guía, numerar los **H2 principales** en orden (`1.`, `2.`, …) y repetir el mismo orden en las **etiquetas del TOC** (`blogPosts` / `TOC_ITEMS`). Los **subpasos** van en **H3** (`Paso 1:`, apartados dentro de un bloque, etc.). El bloque **FAQ** al final puede usar H2 sin número (`Preguntas frecuentes`) para no competir con la numeración del cuerpo; mantener el mismo criterio en todos los posts largos.
- **Espacio entre párrafos**: si dos `<p>` seguidos son bloques distintos (idea nueva), añadir margen explícito (`mb-6` al primero u otro patrón coherente con el artículo) para que no se peguen visualmente.
- **Gráficos / visualizaciones**: rodea el bloque con al menos un **párrafo cicatriz** que conecte la forma visual con una consecuencia humana (p. ej. “ese desplome rojo es el coste de perder a tu mejor creativo…”). No dejes que el lector “lea solo el dibujo”: ancla el trazo a una escena reconocible. Si el gráfico tiene datos o avisos importantes, **no los escondas solo en hover**: repítelos en texto o en un callout siempre visible.
  - Si el gráfico usa animación tipo “GIF” (evolución en el tiempo), el mensaje debe seguir siendo entendible **sin interacciones**: avisos/callouts siempre visibles.
  - Si hay controles `pause/play`, al reanudar el gráfico debe **continuar desde donde se pausó** (no reiniciar desde el principio).

## Elementos dinámicos o “especiales”

- **No es obligatorio** que cada post tenga animaciones, demos o componentes interactivos.
- **Añadir** un componente visual o dinámico (p. ej. infografía por pasos, diagrama animado leve, `RevealOnScroll`) solo cuando:
  - aclara algo que en texto sería larguísimo o confuso, o
  - el lector gana **comprensión real** (no decoración).
- Si se duda: **texto + tabla + ilustración estática** suele bastar; reservar lo dinámico para guías donde el flujo lo merezca.

## Fecha de publicación (no inventar)

- La **`date` en `blogPosts.ts`** y el **`datePublished`** del JSON-LD (y el fallback `post?.date ?? '…'` en la página) deben ser la **fecha real del día en que se publica** el artículo (calendario actual al hacer el cambio).
- **No** pongas fechas futuras “por redondear” ni fechas supuestas: si hoy es 26, el post de hoy es `YYYY-MM-26`, no mañana.
- Al publicar o revisar, confirma el día (sistema o pregunta explícita) y mantén **una sola fuente de verdad**: `blogPosts.ts` + mismos valores en schema.

## Implementación en este repo (recordatorio)

Para artículos nuevos o cambios grandes, alinear con `DOCUMENTACION.md` (§ blog): `blogPosts.ts`, `App.tsx`, `public/sitemap.xml`, página en `src/pages/blog/`, componente en `src/components/landing/blog/`, Helmet + JSON-LD (`Article`, y si aplica `HowTo`, `FAQPage`, `SoftwareApplication`), FAQs alineadas con el copy visible.

Tras editar contenido o schema, mantener **coherencia** entre H3 del artículo, FAQ en página y preguntas del JSON-LD.

## Checklist rápida de revisión

- [ ] ¿Suena a persona o a “artículo optimizado”?
- [ ] ¿Los párrafos largos están partidos donde cambia la idea?
- [ ] ¿Hay margen visual entre bloques que deben separarse?
- [ ] ¿Tablas y listas tienen encabezados/ítems legibles sin abuso de negritas?
- [ ] ¿Los ids de sección y la TOC siguen coincidiendo?
- [ ] ¿H2 numerados y TOC en el mismo orden? ¿Iconos con `items-center`?
- [ ] ¿El JSON-LD refleja el título visible de cada FAQ?
- [ ] ¿`date` / `datePublished` coinciden con el **día real de publicación** (sin fechas inventadas ni futuras)?
- [ ] ¿Si hay gráfico o visual fuerte, hay **cicatriz** alrededor (o callout visible) y no dependemos solo del hover para lo importante?
- [ ] ¿Si hay animación con `pause/play`, el `play` retoma el mismo estado (no empieza de 0)?
- [ ] ¿Hay 'cicatrices'? (¿Aparecen situaciones específicas de la 'trinchera' de una agencia?).
- [ ] ¿He evitado la jerga de relleno? (¿He eliminado frases como 'cabe destacar' o 'es vital mencionar'?). 
- [ ] ¿He 'mojado la camiseta'? (¿He tomado una postura clara sobre un problema incómodo del sector?).
- [ ] ¿Suena a conversación entre pares? (¿Evita sonar como un profesor o un robot optimizando SEO?).

Ejemplo del cambio que esto genera:

- Antes (IA estándar): "El burnout reduce la productividad de los equipos creativos y genera rotación".
- Después (Con tu skill actualizada): "El burnout no llega con un aviso; llega cuando tu mejor creativo empieza a entregar diseños en 'gris' porque ya no tiene energía para pelear el briefing. Es ese silencio incómodo en Slack el que te está avisando de que tu margen se va a desplomar antes de que termine el trimestre".

## Referencia

Convenciones técnicas y lista de componentes del blog: [DOCUMENTACION.md](../../../DOCUMENTACION.md) (sección base de artículos del blog).
