# Taimbox · Dirección de arte (Inés)

18/11/2026 · Encargo de Ramón (órdenes de Alexander). Propuesta para rehacer la web pública y un logotipo nuevo. Nada se publica ni se envía al cliente. Dashboard fuera de alcance. SVG: `aportes/ines/svg/`. Prueba final: `aportes/ines/_build/proof-logos-v4.png` (completo, compacto y signo; claro, oscuro y mono; 16–64 px).

## 1. Identidad actual

Fuentes: `investigacion/repo/src/components/brand/TaimboxLogo.tsx`, `public/favicon.svg`, `tailwind.config.ts`, `src/index.css`, `LandingHeader.tsx` y `LandingFooter.tsx`. El reloj de las láminas se redibuja a partir de esos ficheros (sin dato: no hay vector original aparte).

`TaimboxMark` (viewBox 14×14): círculo exterior r 5,5, interior punteado r 2,5, manecilla con punto (giro 24 s) y punto central. En claro, manecilla `#7C3AED` y punto `#A855F7`; en oscuro, `#A78BFA` y `#C084FC`. Palabra «Taimbox» en DM Sans (600, 16 px, −0,012 em en cabecera clara; 700 en la oscura). Favicon: cuadrado rx 3 `#6366F1` con el reloj en blanco. Primario `#2C2FED` (`hsl(239 84% 55%)`), acento `#DEDFF7`, fondo `#F9FAFB`, texto `#1D2530`, borde `#DAE0E7`; carga `#21C45D` / `#F59F0A` / `#EF4343`. Degradado 239→262, «glow» índigo, radio 0,625 rem. Cabecera clara 68 px (máx. 1280) u oscura (índigo-950, 56 px). Pie en cuatro columnas. Tailwind, Shadcn y Lucide.

## 2. Tres líneas de logotipo

El timeboxing encaja el tiempo en cajas con límite; una agencia reparte carga. Las tres líneas son palabra integrada (la idea vive en la letra, no en un icono al lado). Variantes: completo, compacto y signo extraído de la propia palabra.

| Línea | Gesto | Tipo (OFL) | Paleta | Signo |
|---|---|---|---|---|
| **A «Caja con sector»** (recomendada) | «taimbox»: «taim» en tinta; «box» entero (la «b» incluida) en blanco dentro de una caja índigo, con margen interior igual. Sector ámbar en la esquina superior derecha, sin tapar la «x». Compacto: caja con «b» blanca y sector. | Bricolage Grotesque 700, −0,02 em | Tinta `#14123B`, índigo `#4F46E5`, ámbar `#FFB020`. Sobre oscuro, la caja va en `#6366F1` | Caja índigo con sector ámbar (≈ un tercio del alto), sin letra |
| **B «Franjas de carga»** | «Taimbox» en Sora 600 y tinta sólida; solo la «T» se construye con tres franjas (barra superior ancha y asta en tramos sano, aviso y sobrecarga), sin cola. Compacto: «Tb». | Sora 600 | `#22C55E`, `#FFB020`, `#F15B4A` (solo relleno) | La «T» a tres franjas |
| **C «Palabra con reloj»** | «taimbox» tipográfica en Familjen Grotesk 600, con la «b» real (sin deformar). La personalidad está en la «o» reloj con sector. Compacto: «bo». | Familjen Grotesk 600 | Tinta, violeta `#7C3AED`; lavanda `#C4B5FD` en oscuro | La «o» reloj |

**Recomiendo la A.** Pasa el reloj de hoy a un sector reservado y suma la caja del timeboxing, sin pictograma al lado del nombre. El signo se sostiene a 16 px. La B expresa el reparto de carga en la T, y el resto de la palabra queda en tinta (más legible); verde y ámbar no sirven como texto sobre claro (2,28:1 y 1,72:1: solo relleno). La C mantiene el violeta actual; la personalidad está en la «o» reloj, y el signo se lee a 16–32 px. Contrastes de la A: tinta sobre niebla `#F7F8FC` 16,78:1; blanco sobre `#4F46E5` 6,29:1; tinta sobre ámbar 9,74:1 (texto ≥ 4,5:1, gráfico ≥ 3:1). El índigo de marca sobre tinta es 2,83:1; sobre oscuro la caja usa `#6366F1` (3,99:1). El ámbar no se usa como texto sobre claro.

## 3. Sistema visual (línea A)

Títulos: Bricolage Grotesque 700 (opsz alto, −0,02 em en ≥ 40 px). Texto: DM Sans 400/500 (se mantiene). Cifras: DM Sans `tabular-nums`, ceros sin tachar. Mono opcional: JetBrains Mono. Escala 14/16/18/20/24/32/44/60/76 px; interlineado 1,1 / 1,6. CTA índigo con blanco (6,29:1); sobre oscuro, ámbar con tinta (9,74:1). Ámbar solo en relleno. Sin degradado en el texto. Lavanda `#EEF0FF`, niebla `#F7F8FC`, borde `#E3E6F0`. Rejilla 12 columnas, máx. 1280, gutter 24, margen 32 (20 en móvil), módulo 8 px. Radio 12 / 8 px. Motivo: caja con sector. Iconos Lucide a 1,5 px. Mockups esquemáticos, sin datos reales. Wireframes (home, `/planificador-recursos`, precios con Free, Team, Agency, Scale y Enterprise; importes en «—») en láminas aparte.

## 4. Entregables de identidad y horas

Sin precios. Horas: estimación de Inés en `aportes/ines-horas.md` (diseño y revisión visual; no incluye programación ni motion). En la lámina de entregables no van horas ni plazos; las cifras quedan aquí, para Ramón.

| Nivel | Incluye | No incluye | Rondas | Horas | Plazo |
|---|---|---|---|---|---|
| Esencial | Completo, compacto, signo, mono, favicon (SVG+ICO+PNG), mini guía de 2 págs | Claro/oscuro, avatar, OG, firma, tokens, iconos, patrón, diapositivas | 1 | 14 h | 5 días hábiles |
| Identidad de producto (recomendado) | Lo anterior + claro/oscuro, avatar, OG 1200×630, firma, guía de 6 págs | Tokens Tailwind, iconos de producto, patrón, diapositivas | 2 | 26 h | 8 días hábiles |
| Sistema de marca | Lo anterior + tokens Tailwind (CSS vars) y SVG para Figma, 12 iconos, patrón, 3 diapositivas, guía de 12 págs | Fotografía de pago, motion, programación | 3 | 44 h | 12 días hábiles |

Horas por bloque (fuente: `aportes/ines-horas.md`):

| Bloque | Horas |
|---|---|
| Identidad Esencial / Identidad de producto (recomendado) / Sistema de marca | 14 / 26 / 44 h |
| Sistema visual de la web pública | 32 h (22 h si se contrata el nivel Sistema de marca: tokens y patrón se comparten) |
| Diseño de páginas (wireframe + alta fidelidad, incl. 375) | 80 h |
| Revisión visual (1440 y 375, y antes/después) | 12 h |
| **Total con Identidad de producto** | **150 h** (rango 138–158 h) |

138 h con identidad Esencial (14+32+80+12); 158 h con identidad Sistema de marca y sistema visual compartido (44+22+80+12). Supuestos del mismo fichero: se rehace la web pública, no el Dashboard; textos finales, Carmen; sin fotografía de pago; ES y el espejo EN comparten diseño.

## 5. Fuentes, huecos y preguntas

**Fuentes.** § 1. Planes: `src/config/publicPricing.ts`, `publicPricingLayout.ts`, `PreciosPage.tsx`, `src/locales/es/landing.json`. Alcance: `investigacion/ALCANCE-PUBLICO-vs-DASHBOARD.md`. Horas: `aportes/ines-horas.md`. OFL 1.1 comprobada (nameID 13) en Bricolage Grotesque, DM Sans, Sora, Familjen Grotesk y JetBrains Mono.

**Sin dato.** Vector original del reloj, aparte del componente y del favicon. Textos finales (Carmen). Importes de los planes: en láminas, «—».

**Preguntas para Alexander.** 1) ¿El logotipo nuevo sustituye también al reloj animado del producto (Dashboard, fuera de esta propuesta) o solo a la web pública? 2) ¿Prefieren minúsculas («taimbox», A y C) o inicial («Taimbox», B y uso actual)? 3) Login / restablecer contraseña: ¿web pública o Dashboard? 4) El CMS del blog en `/admin` se trata como Dashboard (fuera de alcance); ¿lo confirman?
