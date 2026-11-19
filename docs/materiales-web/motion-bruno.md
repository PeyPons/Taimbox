# Movimiento e interacción de la web pública nueva

*Sección para la propuesta de Taimbox · Bruno (motion e interacción) · 19/11/2026 · versión 1.1*

*Paleta y tipografía de Inés, línea A «Caja con sector» (`aportes/ines/paleta.json`): tinta, índigo, violeta, ámbar, lavanda y niebla; Bricolage Grotesque 700 en titulares y DM Sans en el texto. Logotipo A v4 integrado (`aportes/ines/svg/logo-A.svg` y `logo-A-dark.svg`), sin icono al lado de la palabra. Trato de «ustedes» en lo que va al PDF.*

---

## Registro de cambios

- **v1.1 · 19/11/2026.** Láminas rehechas a página apaisada (PNG 2246×1588, ancho de inserción 267 mm, letra mínima 7 pt) y con el logotipo A v4 integrado, sin icono al lado. Las de la v1.0 quedaban ilegibles (unos 3,5 a 4 pt) al entrar en la página 23 del PDF. Copia de la v1 en `bruno/esquemas/_v1/`.
- **v1.0 · 18/11/2026.** Primera entrega: inventario de la web pública, sistema de motion, dos láminas de storyboard y horquillas internas. Sin Cursor, por encargo de Alexander.

---

## En pocas palabras

En una web que explica timeboxing a agencias, el movimiento tiene que hacer visible la idea del producto, no competir con ella. Por eso proponemos muy poco movimiento, y solo cuando hay un motivo:

- **Solo dos ideas de movimiento en toda la web pública**: el sector de la caja que se rellena una vez en la portada (el mismo gesto, breve, en el logotipo) y, en el plan completo, una demostración del planificador que la persona puede poner en marcha y pausar.
- Todo lo demás es **respuesta inmediata** a lo que hace la persona (pulsar, leer, escribir, enviar), en menos de un quinto de segundo.
- **Nada se pone en marcha por su cuenta si la persona ha pedido menos movimiento** en su dispositivo, y el contenido se ve completo aunque falle la carga de los scripts.
- **La velocidad va primero**: ninguna animación retrasa el título ni los botones. **El título de la portada no se anima.**

---

## 1. Texto sugerido para el PDF

En la web pública nueva, el movimiento debe ayudar a entender el producto, no distraer. Por eso la propuesta lleva solo dos ideas de movimiento en toda la web, y un solo gesto en la primera pantalla.

En la portada, el título, la frase y los botones están quietos desde el primer instante. El título no se anima. Lo único que se mueve, una vez por visita y en menos de medio segundo, es el sector de su logotipo: la porción de tiempo que entra en la caja. Así se entiende de un vistazo la idea de reservar el trabajo en bloques con límite.

La segunda idea está en una demostración del planificador, que la persona puede poner en marcha y pausar. Un bloque de trabajo se va ocupando a la vista; si se pulsa «Pausa», el movimiento se detiene y se retoma desde el mismo punto. Los datos de la demostración son esquemáticos, no operativos.

El resto son respuestas breves a lo que hace la persona: botones, tarjetas, menú y formularios. Si alguien ha pedido menos movimiento en su dispositivo, o si no cargan los scripts, todo el contenido se ve completo, en su sitio y usable.

En el plan base entran el gesto de la portada, la animación breve del logotipo (con una versión quieta para la cabecera y para quien pida menos movimiento) y esas microinteracciones, en la home y en los elementos compartidos de la web pública.

En el plan completo se añade la demostración del planificador y se aplica la misma norma a las landings de funcionalidad, al blog, a la guía y al resto de páginas públicas. El panel de trabajo interno queda fuera de este alcance.

---

## 2. Qué entra en cada plan

| | Plan base | Plan completo |
|---|---|---|
| Gesto de la portada (sector de la caja, una vez, título quieto) | Incluido | Incluido |
| Animación breve del logotipo, con versión quieta | Incluido | Incluido |
| Microinteracciones (botones, tarjetas, menú, formularios, aviso de cookies) | Incluido | Incluido |
| Menú y formularios usables aunque no carguen los scripts | Incluido | Incluido |
| Respeto a «menos movimiento» y estado final a la vista | Incluido | Incluido |
| Demostración del planificador, con pausa | No | Incluido |
| La misma norma en landings de funcionalidad, blog, guía y resto de páginas públicas | Home y piezas compartidas | Todas las páginas públicas |

---

## 3. Láminas

Dos storyboards, cada uno en una página apaisada del PDF (página 23 y la siguiente, o las que correspondan al bloque de motion). PNG de 2246×1588, pensados para ocupar 267 mm de ancho. Texto a 7,4 pt como mínimo. Logotipo A v4 integrado, sin icono al lado. Sin porcentajes, sin nombres de tiendas ni de plataformas. Las de la v1 quedan en `bruno/esquemas/_v1/`.

![Fotogramas de la primera pantalla y del primer desplazamiento](bruno/esquemas/bruno-01-v2.png)

**Lámina 1** (`bruno-01-v2`). Primera pantalla y primer desplazamiento. El título no se mueve. El sector se rellena una vez (0,00 s, 0,24 s, 0,48 s). Al bajar, la sección de tres pasos ya tiene su hueco y aparece en 0,32 s. Si se ha pedido menos movimiento, se ve desde el principio el estado final.

![Fotogramas de la demostración del planificador, con pausa](bruno/esquemas/bruno-02-v2.png)

**Lámina 2** (`bruno-02-v2`). Demostración del planificador (plan completo). La persona pulsa «Reproducir» o «Pausa». Los bloques Trabajo, Revisión y Cierre se ocupan a la vista; en pausa, el bloque en curso queda a medias (en ámbar) y al reanudar sigue desde ahí. En 2,00 s el plan queda quieto. Datos esquemáticos, en marco recto, con el rótulo «Ilustración de ejemplo».

---

## 4. Sistema propuesto (notas para el equipo)

Principios: como mucho dos ideas expresivas; un solo gesto en el hero; el H1 no se anima y es el elemento que debe verse primero; altura de la primera pantalla en `100svh`; solo `transform` y `opacity`; sin parallax, sin zoom, sin bucles decorativos, sin texto que aparezca letra a letra; cursor nativo.

**Tokens** (los de `aportes/ines/paleta.json`):

- Microinteracción: 180 ms, curva `cubic-bezier(0.22, 1, 0.36, 1)`, desplazamiento 2 unidades.
- Gesto de portada y de logotipo: 320 ms el sector, sin retardo de arranque; total del gesto unos 480 ms. Desplazamiento 0 (solo el relleno del sector, que es un cambio de recorte, no de layout). Una vez por visita; si la persona vuelve a la portada en la misma visita, ya está en su sitio.
- Entrada al bajar: 320 ms, 8 unidades hacia arriba, hueco reservado desde el primer fotograma.
- Demostración: el avance de cada bloque, unos 400 ms; pausa y reanudación inmediatas, sin cola.

**Rendimiento (objetivos internos, no van al PDF):** LCP de 2,5 s o menos en móvil (CPU ×4, red 4G lenta); CLS de 0,1 o menos, y 0 en las rutas medidas si se puede; INP de 200 ms o menos, medido con 40 toques o más. Con `prefers-reduced-motion: reduce`, los cambios son instantáneos. Sin JavaScript se ve el estado final (patrón: estado final en el CSS; una clase que enciende el gesto, puesta por un script del `head`, solo en la primera visita a la portada).

**Presupuesto de peso:** no añadir una librería de animación. El motion nuevo va en CSS más un script propio de 8 KB gzip o menos (techo interno, medible en el build). El punto de partida actual se detalla en el inventario.

**Cómo se mide:** Playwright, Chromium headless, 1440 y 375, CPU ×4, 4G lenta para LCP y CLS, 40 toques o más para INP, un contexto con `javaScriptEnabled: false` y otro con `reducedMotion: "reduce"`. Falta comprobarlo en un iPhone y un Android reales cuando exista una web compilada.

---

## 5. Inventario de motion hoy (web pública)

Fuente: copia de solo lectura en `/workspace/clientes/taimbox/investigacion/repo` (no se tocó). Pesos de producción medidos el 18/11/2026 en `https://taimbox.com/` (HTML `/assets/index-BD9O5cnQ.js` y `/assets/index-BzyBebTw.css`). Pesos de la librería, del paquete npm `motion@12.38.0` y `framer-motion@12.38.0`. No se hizo un build local: la home y las landings públicas se importan de forma estática en `src/App.tsx`, así que van en el JS principal.

**Librerías**

- `motion` 12.38.0 (reexporta `framer-motion` 12.38.0), en `package.json`. Se usa en la home: `motion/react` (`MotionConfig`, `motion.div`, `useReducedMotion`) y `animate` de `motion` (hooks y la sección 4).
- `tailwindcss-animate` 1.0.7, plugin en `tailwind.config.ts`. Clases `animate-in`, `fade-in`, `slide-in-from-bottom` en el aviso de cookies (`src/components/landing/CookieBanner.tsx`).
- No hay Lottie, Rive ni vídeo en `src/components/landing` ni en `public/`.
- Artefacto de referencia de la librería: `dist/framer-motion.js` pesa 182 KB (59 KB gzip); `dist/motion.js`, 132 KB (43 KB gzip). En un bundle real parte se comparte. `tailwindcss-animate` es un tarball de 4 KB.

**Peso de la web pública en producción**

- JS principal: 3.477,8 KiB (977,6 KiB gzip). Incluye la home, las landings públicas y la librería de motion, más el resto del cascarón. No es un trozo solo de animación.
- CSS principal: 230,7 KiB (32,9 KiB gzip).
- Hay otros trozos que se cargan al pedirlos (artículos del blog, páginas del panel). El panel queda fuera del alcance.

**Qué hay hoy (punto de partida)**

- **Home.** El bloque del hero, título incluido, arranca en opacidad 0 y se desplaza 22 unidades (`LandingLiteralHero.tsx`, `initial: { opacity: 0, y: 22 }`, 520 ms). Una parte del título lleva un degradado que recorre el fondo en 9 s, en bucle, cuando no se ha pedido menos movimiento (`src/index.css`, selector del texto con `bg-clip-text`, dentro de `@media (prefers-reduced-motion: no-preference)`).
- **Decoración continua en el hero**, con `requestAnimationFrame` vía `animate(..., { onUpdate })`: cinta horizontal de 48 s, órbita de 96 s, rotación de fichas, «respiración» de escala del número central, barras que pulsan, ticker de estado cada 2,8 s. Fuentes: `useLandingLiteralDomMotion.ts`, `useLandingHeroAmbientMotion.ts`, fotogramas `hero-orbit` y `hero-pulse-bar` inyectados en el hero. Los dos hooks declaran por escrito que ignoran `prefers-reduced-motion` y usan el animador por valor para no pasar por el respeto interno de la librería.
- **La página envuelve todo en `<MotionConfig reducedMotion="never">`** (`src/pages/LandingPage.tsx`). A la vez, `useReducedMotion()` sí se lee y se pasa a algunos hijos. El parallax de manchas (`useLandingBackgroundParallax.ts`) y el reveal al bajar (`useLandingBelowReveal.ts`, `LandingBelowMotionSections.tsx`) sí se detienen si esa lectura es verdadera. El resplandor sigue el puntero en escritorio.
- **Al bajar.** Las secciones inferiores se revelan con opacidad y un desplazamiento de 28 unidades, en escalera, al entrar en el viewport (`IntersectionObserver` en `useLandingBelowReveal.ts`). La sección 4 cambia de diapositiva con el scroll y usa también escala (`LandingBelowSection04.tsx`, `useScrollDrivenPhase` + `useMockupSlideAnimation`).
- **Blog.** `RevealOnScroll.tsx` más la clase `.blog-reveal` en `src/index.css`: el bloque parte de opacidad 0 y solo pasa a visible con el observador. No hay regla de menos movimiento ni estado final sin scripts: sin JavaScript el artículo puede quedar invisible. Usado en la lista del blog y en varios artículos.
- **Logotipo actual.** Manecilla que gira en 24 s (`TaimboxMark` en `src/components/brand/TaimboxLogo.tsx`), con `motion-reduce:animate-none`.
- **Cabecera, menú, desplegable de funciones, cookies, contacto.** Transiciones de color, sombra y desplazamiento en CSS (`LandingHeader.tsx`, `FeaturesDropdown.tsx`). El menú móvil depende de estado en JavaScript. El formulario de contacto tiene estados de envío y un indicador que gira (`ContactoPage.tsx`); los avisos salen como tostada. Gráficos de la landing del monitor y de un artículo del blog usan `requestAnimationFrame` (`PpcMonitorPacingChart.tsx`, `OcupacionVsRentabilidadChart.tsx`).
- **Keyframes globales** en `src/index.css` y `tailwind.config.ts`: `gradient`, `spin-slow`, `fade-in`, `shimmer`, `fadeIn`, `slideUp`, `scaleIn`, `blogRevealUp`, `accordion-down` y `accordion-up`, `pulse-soft`.
- **Fuentes.** DM Sans se pide a Google Fonts desde `src/index.css` (`display=swap`).
- **Altura del hero.** `min-h-[calc(100vh-3.5rem)]` en `LandingLiteralHero.tsx` (viewport clásico, no `svh`).

**Oportunidades para la web nueva** (sin crítica de la actual): dejar el título quieto y con el hueco y la prioridad de carga ya resueltos; un solo gesto, una vez, sin bucles ni parallax; respetar de verdad la preferencia de menos movimiento (hoy una parte se ignora a propósito); que sin scripts se vea el estado final, también en el blog y en el menú; no meter una librería de animación en el peso de la primera carga; medir LCP, CLS e INP con el método de la sección 4.

---

## 6. INTERNO, no va al PDF

Horas de motion e interacción, solo web pública (el panel queda fuera). Horquilla mín–máx, en horas internas. No son un precio.

**Plan base**

| Bloque | Mín | Máx |
|---|---:|---:|
| Tokens, menos movimiento, estado final sin scripts | 4 | 6 |
| Gesto único de portada (sector, una vez, H1 quieto) y logotipo breve con versión quieta | 8 | 12 |
| Microinteracciones (botones, tarjetas, menú, formularios, cookies) en home y piezas compartidas | 8 | 12 |
| QA automatizada (Playwright, CPU ×4, 40 toques o más) y notas para dispositivos reales | 6 | 8 |
| **Total plan base** | **26** | **38** |

**Plan completo** (incluye el base)

| Bloque añadido | Mín | Máx |
|---|---:|---:|
| Demostración del planificador, controlable, con pausa | 12 | 18 |
| Misma norma en landings de funcionalidad, blog, guía y resto de páginas públicas | 8 | 12 |
| QA ampliada (rutas públicas + iPhone y Android reales) | 4 | 6 |
| **Añadido** | **24** | **36** |
| **Total plan completo** | **50** | **74** |

Si las pantallas de acceso y de restablecimiento de contraseña entran al final en la web pública, habría que sumar una horquilla de 3 a 5 horas (microinteracciones y QA de esos formularios). No está incluido arriba.

**Decisiones abiertas**

- Si las pantallas de acceso y de restablecimiento de contraseña entran en la web pública (lo dejó abierto Ramón).
- Qué línea de logotipo se elige de forma definitiva (Inés recomienda la A; las láminas de motion ya usan el A v4 integrado).
- Copy definitivo de la portada; en las láminas el texto es esquemático.
- QA en un iPhone y un Android reales, cuando haya una web compilada.

---

## 7. Cómo se han preparado las láminas

Tubería: `python3 generar_esquemas.py && node a_png.mjs && node qa_esquemas.mjs` en `/workspace/clientes/taimbox/aportes/bruno/_fuente/`. Fuentes OFL incrustadas en el PNG (Bricolage Grotesque y DM Sans, licencias en `_fuente/fonts/`). Lienzo y PNG 2246×1588 (1×). QA v1.1: 2 de 2, 2246×1588 exactos, mínimo 7,41 pt a 267 mm, prohibidos 0, glifos 0. Cada PNG se ha mirado con Read antes de entregar. El logotipo se incrusta desde `aportes/ines/svg/logo-A.svg` (cabecera clara), sin modificar el fichero. Copia de la v1 en `bruno/esquemas/_v1/`.
