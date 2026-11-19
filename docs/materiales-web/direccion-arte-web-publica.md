# Dirección de arte — web pública

Noviembre 2026. Solo la web pública. El Dashboard, el login y las páginas legales no cambian de sistema.

## Concepto

**Sector sobre tinta.** La página es una sala oscura. La única figura de marca es el sector del reloj del logo (línea C): un arco violeta, fino, en un sitio. No es un degradado de fondo ni un icono al lado del nombre.

El producto se enseña como un instrumento: planificador, precios y monitor sobre papel cálido (`#F7F4EC`) o sobre un panel de tinta con filete. Las cifras de esos instrumentos son las del propio mock (carga, semanas, planes). No hay clientes, logos ni testimonios inventados.

## Decisión del hero

**Se mantiene el banner orbital y se afina.** Alexander lo señaló como la pieza que quiere conservar, y el rediseño claro (`f66a3a9`, `62d2e3f`) lo sustituyó por un titular quieto sobre niebla: eso es lo que se rechazó.

Se queda: titular de Carmen, órbita con fichas de capacidad, cinta inferior, CTAs en píldora, logo en variante papel.

Se quita lo que no era el reloj: el velo violeta detrás del titular, la entrada en fade, el resplandor ámbar que sigue al ratón y la altura en `vh` (pasa a `svh`, para que la barra del móvil no recorte el primer pantallazo).

Sustituirlo por un pantallazo grande de dashboard habría sido el gesto de plantilla que este encargo pide no repetir.

## Paleta

| Uso | Color |
|-----|--------|
| Campo | `#14123B` (tinta del logo) |
| Menú | `#100E24` |
| Papel de los instrumentos | `#F7F4EC` |
| Texto | `#F4F1FF` |
| Texto secundario | `#D4CEF0` |
| Sector y foco | `#7C3AED` (relleno con texto blanco, 5,7:1) |
| Filete y kicker | `#C4B5FD` (sobre tinta, ~9:1) |

El violeta no se usa como texto pequeño sobre tinta (no llega a 4,5:1). El ámbar, el verde y el rojo viven solo dentro de los mocks, con el mismo sentido que en el planificador: holgura, aviso, sobrecarga.

## Tipografía

DM Sans, que ya es la voz del hero. No se carga otra familia: un display nuevo no mejora el banner y pesa en el móvil.

Escala del titular de portada, sin cambio de copia. En el resto, titulares con tracking negativo y una sola palabra o frase en `#C4B5FD`, en sólido, no en degradado. Las páginas de audiencia conservan la serif ya usada (`font-public`): ahí se lee una lista, no se enseña una pantalla.

## Motion

Como máximo dos ideas por página, y ninguna es un fade de entrada.

- **Home.** 1) La órbita y la cinta del hero. 2) Las fases del producto, que cambian al hacer scroll en la sección de método. Los roles se cambian al pasar el foco o pulsar; no rotan solos.
- **Resto.** Hover y foco (filete, subrayado, píldora). El monitor PPC conserva su gráfico. `prefers-reduced-motion` deja la órbita quieta, la cinta quieta y el cambio de fase instantáneo.

## Lo que no se repite

Fondo niebla, Bricolage, cards grises, métricas en «—», fade-up en cada bloque, degradado violeta de fondo, cuadrícula de tres iconos, botón con degradado índigo-púrpura.
