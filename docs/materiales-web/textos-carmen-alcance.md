# Taimbox · Contenido de la web pública

Aporte de Carmen (SEO de contenido) para la propuesta de rehacer taimbox.com y el logotipo nuevo. 18 de noviembre de 2026 (hora de Canarias). Solo contenido de la web pública (español e inglés). No entra el Dashboard.

**Fuentes leídas (copia local de solo lectura):** `investigacion/ALCANCE-PUBLICO-vs-DASHBOARD.md`; `investigacion/repo/src/locales/es` y `en` (`landing.json`, `homeLiteral.json`, `blog.json`, `apiDocs.json`); `docs/15-cms-blog.md`; `docs/16-planes-suscripcion-precios.md`; `docs/11-notas-adicionales-readme.md`; `src/config/publicPricing.ts`; `src/data/blogPosts.ts`; `src/pages/PresentationPage.tsx`. No he consultado la base de datos ni he inventado cifras de tráfico, clientes o resultados.

Las cantidades de palabras de este documento son **estimaciones de redacción**, no un recuento de la web actual. Los honorarios de cada paquete los cierran Rosario o Ramón.

---

## 1. Tono y propuesta de valor actuales

Taimbox se presenta como una plataforma web para agencias (sobre todo de marketing, también de desarrollo o consultoría) que planifican equipos, proyectos y el cruce entre tiempo y dinero. El pie de página lo resume así: «Sistema operativo financiero basado en tiempo para agencias. Gestiona el tiempo, no solo las tareas.» (`landing.json`, `footer.tagline`).

La web habla de **tú** a quien dirige o trabaja en la agencia. El registro es comercial y directo, con vocabulario de oficio (capacidad, sobrecarga, deadlines, margen, pacing, ingreso devengado, semanas partidas) y, en páginas de producto y seguridad, con detalle técnico (RLS, TLS, API, OAuth de solo lectura). Hay dos capas de copy en la home: un registro más genérico en `landing.json` → `home` (titulares como «El tiempo de tu equipo visualizado», «Funcionalidades que transforman») y otro más concreto en `homeLiteral.json` (el grid del equipo, el flujo planificar-ejecutar-medir-predecir, los planes). Las landings de funcionalidad se dirigen por rol: empleados, dirección, RRHH, finanzas, project managers, equipos técnicos y agencias de performance.

La promesa central es dejar atrás la hoja de cálculo y ver, en un mismo sistema, quién hace qué, cuándo y con qué impacto en el margen. Se ofrece un plan gratuito, una prueba de 14 días del plan Agency sin tarjeta, precios «early adopter» y, como segundo camino, una presentación de ROI en `/pitch` (noindex, unos tres minutos). El producto se describe en **español e inglés** (`/en` como espejo). La paridad es amplia: en los locales públicos hay, de forma aproximada, 14.800 palabras de landings en ES frente a 12.800 en EN, 20.700 de blog en ES frente a 19.500 en EN, y 6.700 de documentación de API en ES frente a 6.100 en EN (recuento de cadenas en los JSON, no de palabras visibles en pantalla).

Hoy la web pública incluye, según el alcance de Ramón (a confirmar por Lola): la home; `/por-que-timeboxing`; siete landings de funcionalidad más `/seguridad`; `/precios`; la guía (`/guia` y nueve apartados); el blog (índice y nueve artículos); `/contacto`; `/api-docs`; `/privacidad` y `/condiciones`; `/pitch`; 404; cabecera, pie y cookies. El blog se organiza en cinco categorías (plantillas, KPIs, planificación, productividad y gestión). La guía documenta el producto: planificador, Mi espacio, Deadlines, Informes, Weekly Forecast, Equipo, Tiempos, Clientes y proyectos, y Configuración.

---

## 2. Arquitectura de contenido de la web nueva

Se mantiene el mapa de URLs actuales, en español y en su espejo `/en`, para no abrir destinos nuevos sin necesidad. Se añade una sola página de «para quién» y se trata `/recursos` como hub ligero (guía, blog, plantilla y documentación de API), no como un árbol paralelo. Las páginas de acceso (login y restablecer contraseña) quedan fuera hasta que Alexander decida si entran en la web pública.

### 2.1 Landings (ES y EN)

| Página (URL actual) | Objetivo | Mensaje principal | Bloques | CTA | Keyword e intención (orientativa, sin volúmenes) |
|---|---|---|---|---|---|
| Home `/` | Hacer entender el producto en una visita y llevar a registro o a precios | En un mismo sistema ves la carga del equipo, los plazos y el margen de cada proyecto | Hero con la promesa y el grid; para quién es; flujo planificar, ejecutar, medir y predecir; tres funciones clave; integraciones reales; planes resumidos; FAQ honesta; cierre | Empezar con el plan Free / Ver planes | Planificación de recursos para agencias; intención comercial |
| Por qué timeboxing `/por-que-timeboxing` | Explicar el método y por qué una lista de tareas no basta en una agencia | El tiempo se fija de antemano y se ata a un coste; el alcance es lo que se ajusta | Qué es el timeboxing; dónde se queda corto un calendario genérico; cómo lo resuelve Taimbox (horas computadas, semanas partidas, margen); CTA | Probar Taimbox / Ver el planificador | Qué es el timeboxing; intención informacional con salida al producto |
| Planificador `/planificador-recursos` | Convencer a dirección de que la carga se puede ver y ajustar antes de guardar | Ves quién hace qué, cuándo, y el impacto de cada asignación | Hero; grid; impacto antes de guardar; dependencias y ausencias; semanas partidas; CTA | Probar el planificador | Planificador de recursos; intención comercial |
| Rentabilidad `/reportes-rentabilidad` | Dar a dirección financiera un motivo claro para medir el mes en curso | Cada proyecto muestra coste, ingreso, margen y euros por hora, con la fórmula a la vista | Hero; rentabilidad por proyecto; forecast; cómo se calcula (con los nombres reales de las cifras); exportación y API; CTA | Ver reportes en una cuenta Free | Rentabilidad por proyecto en una agencia; intención comercial |
| Proyectos `/control-proyectos` | Ordenar clientes, presupuestos, deadlines y coherencia | Del briefing al plazo, con avisos cuando el plan no cuadra | Clientes y presupuestos; deadlines; OKRs (indicando el plan en el que están); coherencia; CTA | Empezar a planificar proyectos | Control de proyectos y deadlines; intención comercial |
| Equipos `/gestion-equipos` | Mostrar horarios, ausencias, capacidad y tiempos en vivo | La capacidad real tiene en cuenta festivos, bajas y el horario de cada persona | Horarios; ausencias; capacidad; vista de tiempos; CTA | Probar la gestión de equipos | Gestión de capacidad de un equipo; intención comercial |
| Panel del empleado `/dashboard-empleado` | Mostrar qué ve cada persona, sin vender micromanagement | Cada persona sabe qué tiene hoy, cuánto tiempo lleva y cómo cierra la semana | Calendario personal; dependencias; tareas; cierre weekly; métricas personales (solo las que existan); CTA | Invitar al equipo | Dashboard de empleado y cronómetro; intención comercial |
| Integraciones `/integraciones` | Dejar claro qué se conecta de verdad y cómo salen los datos | Google Ads y Meta en solo lectura, API REST y exportaciones; sin prometer un CRM si no está | Cada integración con su alcance; API; exports; CTA | Ver documentación de API / Probar | Integraciones Taimbox; Google Ads y Meta para agencias; intención comercial |
| Monitor PPC `/monitor-ppc` | Explicar el control de presupuesto publicitario y en qué plan está | Unificas el gasto de las cuentas de cliente tras una sincronización, en los planes que lo incluyen | Problema; qué se ve (gasto, ritmo, desviación); Google y Meta; requisitos de plan; CTA | Probar el plan Agency 14 días | Monitor de presupuestos PPC; intención comercial |
| Seguridad `/seguridad` | Dar a un comprador o a su equipo legal hechos comprobables | Dónde están los datos, cómo se aíslan por agencia y qué hace cada tercero | Aislamiento RLS; cifrado y región; Ads en solo lectura; pagos con Stripe; copias de seguridad; FAQ; contacto | Escribir a contacto / Ver API | Seguridad y privacidad de Taimbox; intención de confianza |
| Precios `/precios` | Ayudar a elegir plan sin contradicciones de nombre o cifra | Empiezas gratis; subes de plan cuando necesitas forecast, rentabilidad avanzada, API o Ads | Hero; planes (nombres y límites alineados con producto); qué entra en todos; FAQ de facturación; Enterprise; CTA | Empezar con Free / Probar Agency / Hablar con el equipo | Precios Taimbox; intención transaccional |
| Para quién (nueva, p. ej. `/para-quien`) | Recoger los casos de uso que hoy están repartidos por badges | Taimbox encaja si facturáis por proyecto o por fee y necesitáis cruzar horas y margen | Cuatro perfiles: dirección, project management, finanzas y equipo; un ejemplo de día de cada uno (etiquetado como ejemplo); CTA | Ver la función que le toca a cada perfil | Software para agencias de servicios; intención comercial |
| Recursos `/guia` (índice como hub) | Orientar a quien quiere aprender el producto o llevarse un material | Aquí está la guía de uso, el blog, la plantilla y la API | Índice de la guía; enlace al lead magnet; blog destacado; API; CTA | Leer la guía / Descargar la guía operativa | Guía Taimbox; intención informacional |
| Contacto `/contacto` | Abrir una conversación de ventas, soporte o duda | Escribe con un asunto claro; si ya tienes cuenta, el soporte va por el panel | Hero breve; correo; formulario; nota para clientes; CTA | Enviar mensaje | Contacto Taimbox; intención transaccional |
| API `/api-docs` | Documentar la API para un perfil técnico | Qué puedes leer o integrar, con autenticación y ejemplos | Intro en lenguaje claro; autenticación; tutoriales; referencia (se parte de la documentación actual, con una pasada editorial en el paquete Completo) | Ir al primer tutorial | API Taimbox; intención técnica |
| Presentación `/pitch` | Apoyar una conversación de ventas en unos minutos | Qué cuesta no medir, con cifras solo si están contrastadas y presentadas como supuesto | Problema; cómo trabaja Taimbox; un ejemplo de cálculo con hipótesis visibles; CTA a prueba o a contacto | Empezar o pedir una conversación | (noindex, apoyo comercial) |
| Legales `/privacidad`, `/condiciones` y cookies | Cumplir y enlazar con claridad | Textos legales vigentes, con microcopy de cookies comprensible | Se mantienen como páginas legales. Este alcance de contenido no reescribe cláusulas (la propuesta no incluye parte legal). Sí cubre el banner y los enlaces del pie | Sin CTA comercial | Intención legal |

La página 404, la cabecera, el pie y el banner de cookies se reescriben en el mismo tono en ambos idiomas. Los mocks de interfaz pueden seguir usando nombres de ejemplo (María, Carlos, un cliente inventado) si se entiende que son una simulación, no testimonios.

### 2.2 Guía (producto y lead magnet)

Hay dos piezas distintas, que conviene no mezclar:

1. **Guía in situ** (`/guia` y las nueve secciones ya existentes). Es la documentación de uso: qué hace cada módulo, un ejemplo y la relación con el resto. Se reescribe en el mismo tuteo y con el vocabulario de la voz nueva, sin hincharla. Sirve a quien ya está evaluando o acaba de entrar.
2. **Lead magnet** (PDF, «Guía operativa para agencias: de la capacidad al margen»). Material descargable, útil fuera de la herramienta: cómo estimar capacidad neta, cómo atar un fee o un presupuesto de horas a un margen, cómo cerrar la semana y qué cifras mirar a fin de mes. Un capítulo final puede mostrar cómo se ve eso en Taimbox, sin convertir el PDF entero en un folleto. Se ofrece desde la home, la guía y los artículos de planificación o rentabilidad. El formato de captura (correo o descarga directa) lo decide Alexander.

### 2.3 Blog: líneas editoriales y diez temas

Cuatro líneas, con la misma voz que la web, en ES y EN, y con enlaces al producto solo cuando aportan (un artículo de captación puede no nombrar Taimbox, como ya hace el de rentabilidad y equipo ocupado):

1. **Rentabilidad y margen** de una agencia de servicios.
2. **Capacidad, planificación y carga** del equipo.
3. **Método:** timeboxing y formas de organizar el trabajo.
4. **Recursos prácticos:** plantillas, cierre semanal e integraciones de Ads.

Diez temas concretos (varios reutilizan una URL ya publicada; otros serían piezas nuevas). La intención es orientativa, sin volúmenes:

| Tema | Línea | Intención | Nota |
|---|---|---|---|
| Qué es el timeboxing y cómo se aplica en una agencia | Método | Informacional | Reescritura de `/blog/que-es-timeboxing` |
| Por qué un equipo ocupado puede no ser rentable | Rentabilidad | Informacional | Reescritura de `/blog/por-que-tu-agencia-pierde-rentabilidad-equipo-ocupado` |
| Cómo medir la rentabilidad por proyecto | Rentabilidad | Investigación comercial | Reescritura de `/blog/como-medir-rentabilidad-proyecto-agencia-dejar-vender-horas` |
| Capacidad calendario frente a capacidad productiva | Capacidad | Informacional | Reescritura de `/blog/capacidad-calendario-vs-capacidad-productiva-equipo` |
| KPIs de una agencia de marketing que se pueden mirar cada semana | Rentabilidad | Informacional | Reescritura de `/blog/kpis-agencias-marketing-2026` (hoy el título habla de 5 métricas y el titular de metadatos, de 15) |
| Cómo gestionar la carga de trabajo del equipo | Capacidad | Informacional | Reescritura de `/blog/gestion-carga-trabajo-equipo-sin-burnout` |
| Plantilla de planificación de recursos para agencias | Recursos | Recurso / transaccional | Pulido de `/blog/plantilla-planificacion-recursos-agencia` |
| Cierre semanal y forecast de horas en una agencia | Recursos | Informacional | Pieza nueva |
| Cómo vigilar el presupuesto de Google Ads y Meta desde operaciones | Recursos | Informacional | Pieza nueva |
| Criterios para elegir un planificador de recursos en una agencia | Capacidad | Investigación comercial | Pieza nueva, sin ranking ni superlativos |

Los artículos actuales de planificación de proyectos y de la ley de Parkinson se pueden mantener, acortar o fusionar según la intención de cada URL, dentro del paquete Completo, sin sumar un tercer calendario editorial.

### 2.4 Voz de marca

**Principios**

1. Hablar de tú a la persona que lleva o trabaja en la agencia, con palabras del oficio: capacidad, sobrecarga, fee, margen, pacing, deadline, horas planificadas y horas reales.
2. Una idea por frase, ritmo variado, y un hecho comprobable al lado de cada afirmación (qué hace el producto, en qué plan, con qué límite).
3. Prometer solo funciones que existan en el código o en `docs/16-planes-suscripcion-precios.md`. Si algo es de un plan concreto, se dice.
4. Los ejemplos de pantalla son simulaciones. No se presentan como clientes, resultados ni testimonios.
5. El inglés dice lo mismo que el español: misma promesa, no un calco palabra por palabra.

**Trato.** En la web, tuteo, que es el registro actual y encaja con un producto que habla con quien dirige el día a día. El «ustedes» del brief se reserva para la propuesta comercial del equipo hacia Alexander. Si se prefiere usted en la web, se unifica en todas las páginas, no se mezcla.

**Sí / no**

| Sí | No |
|---|---|
| «En el planificador ves la carga por persona y por semana, con las ausencias en el mismo grid.» | «Funcionalidades que transforman» / «Tu flujo de trabajo, amplificado» |
| «El plan Free incluye planificador, deadlines y cronómetro, para hasta 5 personas, con dos meses de histórico.» | «Incluido en todos los planes: recursos robustos y premium de base» |
| «Esta cifra es un ejemplo con una tarifa de 50 €/hora y 300 horas. No es un resultado medio de clientes.» | «Hasta 180.000 €/año» o «Reduce reuniones en un 70 %» sin fuente ni supuesto |
| «Conectas Google Ads y Meta en solo lectura.» | «Conecta todo tu ecosistema» o un CRM en el título si no hay integración |

**Palabras y giros a evitar:** descubre, explora, sumérgete, eleva, potencia, transforma, empodera, experiencia única, de vanguardia, siguiente nivel, definitivo, infinito, al céntimo (salvo que se quiera mantener y esté contrastado), los más altos estándares, resultados que hablan por sí solos, «no es solo X, es Y»; en inglés, delve, elevate, unlock, seamless, crafted, robust, journey, empower. También las frases absolutas que pide evitar el brief: «el mejor», «el único», «siempre», «nunca», «garantizado», «100 %».

---

## 3. Qué redactaríamos y cuánto

Estimaciones de extensión del texto editorial (sin navegación repetida, sin mocks y sin la referencia técnica íntegra de la API). Cada pieza de la web pública se entrega en **español y en inglés**, salvo el lead magnet del paquete Base, que iría solo en español. Los honorarios no van en esta tabla.

### Paquete Base

Lo necesario para lanzar la web nueva con una voz coherente, precios alineados y las páginas que más pesan en la decisión.

| Pieza | Nº de piezas | Palabras por pieza (est.) | Idioma | Total estimado |
|---|---|---|---|---|
| Cabecera, pie, cookies y 404 | 1 conjunto | 400 | ES y EN | 800 |
| Home | 1 | 1.050 | ES y EN | 2.100 |
| Precios (planes, comparativa, FAQ) | 1 | 900 | ES y EN | 1.800 |
| Contacto | 1 | 250 | ES y EN | 500 |
| Por qué timeboxing | 1 | 1.200 | ES y EN | 2.400 |
| Landings de producto: planificador, rentabilidad y proyectos | 3 | 800 | ES y EN | 4.800 |
| Seguridad (versión de lanzamiento) | 1 | 700 | ES y EN | 1.400 |
| **Total Base** | **9 piezas** (7 páginas + chrome + 3 landings) | | | **Aprox. 13.800 palabras** |

En Base, la guía in situ, el blog, el pitch, la API, «para quién» y las landings de empleado, equipos, integraciones y PPC se dejan para el paquete Completo (o se mantienen en su texto actual de forma provisional).

### Paquete Completo

Incluye el Base y el resto de la web pública de contenido.

| Pieza adicional | Nº de piezas | Palabras por pieza (est.) | Idioma | Total estimado |
|---|---|---|---|---|
| Landings de empleado, equipos, integraciones y monitor PPC | 4 | 800 | ES y EN | 6.400 |
| Para quién | 1 | 900 | ES y EN | 1.800 |
| Guía in situ (índice y 9 secciones) | 10 | 450 | ES y EN | 9.000 |
| Lead magnet en PDF (guía operativa) | 1 | 4.000 | ES y EN | 8.000 |
| Índice del blog | 1 | 200 | ES y EN | 400 |
| Diez artículos del plan editorial | 10 | 1.500 | ES y EN | 30.000 |
| Presentación `/pitch` (copy de las diapositivas) | 1 | 1.200 | ES y EN | 2.400 |
| Pasada editorial de la intro y los títulos de `/api-docs` | 1 | 800 | ES y EN | 1.600 |
| **Suma de lo adicional** | | | | **Aprox. 59.600 palabras** |
| **Total Completo (Base + adicional)** | | | | **Aprox. 73.400 palabras** |

El bloque más grande es el blog bilingüe. Si se prefiere un ritmo más contenido, se puede publicar primero la versión en español de los diez artículos y del lead magnet, y el inglés en un segundo envío; el resto de landings seguiría saliendo en los dos idiomas, como ahora.

---

## 4. Datos a confirmar con Alexander o a verificar en producto

Sin estos puntos no se deberían publicar cifras, nombres de plan ni promesas de integración. Fuente de cada duda:

1. **Nombres de plan.** En producto y en `publicPricing.ts` el plan gratuito se llama Free (`plan_id` `starter`). En el cierre de `/precios` todavía se lee «plan Starter» (`landing.json`, `pricing.finalSub`). Conviene un solo nombre público.
2. **Precios y early adopter.** En código, Team 49 USD/mes (oficial 99), Agency 149 (oficial 249), Scale 299 USD, Enterprise a medida, cobro en USD (`src/config/publicPricing.ts` y `docs/16-planes-suscripcion-precios.md`). El copy promete un 50 % «de por vida» y menciona tarifas oficiales de 99 y 249 USD (`pricing.earlyAdopter`, `pricing.rewardBanner`, FAQ). Confirmar si esa condición se mantiene, cómo se comunica y si Scale se muestra con precio (299) o solo como «contactar».
3. **Precios LATAM** (29, 89 y 179 USD en `PUBLIC_PLAN_LATAM_USD`): si se siguen mostrando y con qué texto.
4. **Límites por plan** (personas incluidas y asientos extra, histórico de dos meses en Free, módulos Weekly, OKR, finanzas, PPC y API): alinear el copy con `docs/16-planes-suscripcion-precios.md`, que prevalece sobre el texto antiguo.
5. **Prueba de 14 días del plan Agency sin tarjeta** y un trial por agencia: confirmar que se sigue ofreciendo así.
6. **Integraciones reales.** En producto aparecen Google Ads y Meta Ads en solo lectura, API REST y exports CSV/JSON. El título SEO de integraciones cita un CRM, y un mock del panel del empleado dice «Exportar a CRM». Confirmar si hay CRM o si se retira esa mención. Confirmar también la frecuencia de sincronización de Ads (el copy de `homeLiteral.json`, sección 5, dice «cada hora»).
7. **Funciones nombradas que hay que contrastar:** «priorización automática de tareas» (`home.useCasesEmployeeItems`); «redistribución sugerida» por un «asistente»; cierre weekly «en 2 minutos»; costes de semanas partidas «al céntimo» o «perfectos».
8. **Cifras de resultado sin fuente visible**, a retirar o a reescribir como supuesto etiquetado: «Reduce reuniones en un 70 %» (`home.useCasesLeaderItems`); en `/pitch`, 15.000 €/mes, 180.000 €/año, «+25 % horas facturables», «90 % precisión en estimaciones», «−40 % tiempo en reporting» y «100 % visibilidad financiera» (`PresentationPage.tsx`).
9. **Afirmaciones de seguridad y cumplimiento:** TLS 1.3, AES-256, datos en la UE, backups diarios, DPO, PCI delegado a Stripe, «grado Enterprise», cuestionarios ISO. Deben coincidir con la práctica real antes de reiterarlas (`homeLiteral.json` s06, `commercial.security`, FAQ).
10. **Correo público** `hello@taimbox.com` (FAQ de precios) y el canal de «hablar con ventas».
11. **Público e idiomas.** Si el destinatario principal son agencias o, como dicen varios title, «empresas» en general. Si se mantiene solo ES y EN.
12. **Alcance fino de contenido:** si login y restablecer contraseña entran en la web pública; si `/pitch` se reescribe o se retira del pie y del hero; cómo se captura el lead magnet; si la plantilla Excel se actualiza junto al artículo.

Hasta que esto esté cerrado, la redacción usará formulaciones provisionales o dejará un hueco, y no presentará esas cifras como un resultado de Taimbox.
