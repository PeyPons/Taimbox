import { Link } from 'react-router-dom';
import { Hourglass, Scale, Calculator, Shield, Rocket } from 'lucide-react';
import { RevealOnScroll } from './RevealOnScroll';
import { BlogReadingTime } from './BlogReadingTime';
import { BlogTOC } from './BlogTOC';
import { BlogRelatedPost } from './BlogRelatedPost';
import type { BlogTOCItem } from './BlogTOC';
import { ScopeProtocoloInfographic } from './ScopeProtocoloInfographic';

export interface ComoMedirRentabilidadProyectoArticleProps {
  readingMinutes?: number;
  tocItems?: BlogTOCItem[];
  relatedPost?: { title: string; description: string; href: string };
}

export function ComoMedirRentabilidadProyectoArticle({
  readingMinutes,
  tocItems,
  relatedPost,
}: ComoMedirRentabilidadProyectoArticleProps) {
  return (
    <article
      id="como-medir-rentabilidad-proyecto"
      className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 md:py-16 text-left overflow-x-hidden"
    >
      <section className="mb-12 sm:mb-14">
        <div className="mb-6 text-center flex flex-col items-center gap-3">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-cyan-300 bg-cyan-500/20 border border-cyan-400/30">
            Rentabilidad y pricing
          </span>
          {readingMinutes != null && <BlogReadingTime minutes={readingMinutes} />}
        </div>
        <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-[2.75rem] font-black text-white mb-5 sm:mb-6 leading-[1.15] tracking-tight text-center">
          Cómo medir la rentabilidad real por proyecto en tu agencia (y dejar de vender horas)
        </h1>

        <div className="rounded-2xl border border-cyan-400/40 bg-cyan-500/10 p-4 sm:p-6 mb-8">
          <p className="text-cyan-100/95 text-sm font-semibold uppercase tracking-wide mb-3">TL;DR — Lo esencial en 3 puntos</p>
          <ol className="space-y-3 text-indigo-100/95 text-base sm:text-lg leading-relaxed list-decimal list-outside pl-5 sm:pl-6 marker:text-cyan-300 marker:font-semibold">
            <li>
              Vender horas tiene un techo natural: solo hay tantas horas al día por persona. Las agencias que ganan margen
              sin inflar plantilla suelen haber cambiado <strong>qué venden</strong>, no cuánto sudan.
            </li>
            <li>
              El <strong>margen bruto por proyecto</strong> es la métrica que separa quien factura mucho de quien se queda
              con dinero. Hacer el ejercicio con tus últimos diez proyectos suele ser incómodo y útil a la vez.
            </li>
            <li>
              El scope creep no es solo «clientes difíciles»: es falta de contenedor. Un protocolo de tres pasos —registrar,
              cuantificar, comunicar— se puede poner en marcha sin esperar al próximo trimestre.
            </li>
          </ol>
        </div>

        <div className="space-y-5 text-indigo-100/95 text-base sm:text-lg leading-[1.75]">
          <p>
            Si ya leíste por qué <Link to="/blog/por-que-tu-agencia-pierde-rentabilidad-equipo-ocupado" className="text-violet-300 hover:text-white underline underline-offset-2">estar ocupado no significa ser rentable</Link>, el siguiente paso es incómodo de verdad: mirar los proyectos uno a uno y preguntarte si el precio tenía sentido con el coste real —no con el coste que te gustaría creer.
          </p>
          <p>
            Aquí vas a encontrar <strong>modelos de pricing con pros y contras</strong>, un cálculo de margen que puedes
            llevar a una hoja sin filosofía, un protocolo de alcance que evita trabajar gratis por omisión, y una forma de
            enmarcar el trabajo en ciclos cortos para que el tiempo deje de ser un río sin orillas.
          </p>
        </div>
      </section>

      {tocItems != null && tocItems.length > 0 && (
        <div className="mb-12">
          <BlogTOC items={tocItems} />
        </div>
      )}

      <RevealOnScroll>
        <section id="techo-horas" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6 flex items-center gap-3">
            <Hourglass className="h-8 w-8 text-amber-400 shrink-0" aria-hidden />
            1. Por qué vender horas tiene un techo y cómo romperlo
          </h2>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            <p>
              Cuando el precio está atado al tiempo, <strong>la eficiencia se penaliza sola</strong>: si el equipo hace en
              dos horas lo que antes tardaba cuatro, cobras la mitad por el mismo resultado. Ese incentivo perverso explica
              por qué muchas agencias se quedan atrapadas en una carrera de más horas o más cabezas.
            </p>
            <p>
              Te lo encontrarás en el “buenas noticias”: el equipo mejora el proceso, reduce tiempos, y aun así el
              mes no cumple porque la facturación también baja. Es el techo hablando claro, no tú perdiendo
              motivación.
            </p>
            <p>
              Además, el precio hora es fácil de comparar entre proveedores; el precio atado a un <strong>resultado con
              alcance definido</strong> no lo es tanto. Eso cambia la conversación —si tienes autoridad y datos para
              sostenerla.
            </p>
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-white mt-8 mb-3">Pricing basado en valor: cuándo es realista</h3>
          <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-4">
            Desvincular el precio del tiempo y acercarlo al impacto para el cliente puede subir margen sin subir headcount.
            Pero no es magia: hace falta <strong>medir resultados con rigor razonable</strong> y un historial que aguante la
            conversación comercial. Sin eso, «valor» se queda en palabra bonita.
          </p>
          <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            Si quieres profundizar en ratios operativos antes de tocar precios, los{' '}
            <Link to="/blog/kpis-agencias-marketing-2026" className="text-violet-300 hover:text-white underline underline-offset-2">
              KPIs financieros para agencias
            </Link>{' '}
            sirven de mapa común para dirección y operaciones.
          </p>
        </section>
      </RevealOnScroll>

      <RevealOnScroll delay={1}>
        <section id="modelos-pricing" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6 flex items-center gap-3">
            <Scale className="h-8 w-8 text-violet-400 shrink-0" aria-hidden />
            2. Los tres modelos de pricing: cuál protege mejor tus márgenes
          </h2>
          <div className="space-y-6 text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            <p>
              No hay modelo perfecto: hay <strong>encaje con el tipo de trabajo</strong>. La tabla resume el equilibrio
              entre previsibilidad, defensa del alcance y complejidad de venta.
            </p>
            <p>
              En el café con Dirección te lo preguntan sin rodeos: “¿por qué aquí cobras esto y allá lo otro?”
              Tu trabajo no es convencer con eslóganes: es mostrar qué modelo protege el alcance y qué modelo deja
              que el alcance se te coma vivo.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5 my-6">
            <table className="w-full text-left text-sm sm:text-base min-w-[520px]">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="p-3 sm:p-4 text-violet-200 font-semibold">Modelo</th>
                  <th className="p-3 sm:p-4 text-violet-200 font-semibold">Predecibilidad ingresos</th>
                  <th className="p-3 sm:p-4 text-violet-200 font-semibold">Protección scope</th>
                  <th className="p-3 sm:p-4 text-violet-200 font-semibold">Escalabilidad margen</th>
                  <th className="p-3 sm:p-4 text-violet-200 font-semibold">Complejidad venta</th>
                </tr>
              </thead>
              <tbody className="text-indigo-100/90">
                <tr className="border-b border-white/10">
                  <td className="p-3 sm:p-4 font-medium text-white align-top">Por horas (T&amp;M)</td>
                  <td className="p-3 sm:p-4 align-top">Media</td>
                  <td className="p-3 sm:p-4 align-top">Baja</td>
                  <td className="p-3 sm:p-4 align-top">Baja</td>
                  <td className="p-3 sm:p-4 align-top">Baja</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="p-3 sm:p-4 font-medium text-white align-top">Retainer (cuota fija)</td>
                  <td className="p-3 sm:p-4 align-top">Alta</td>
                  <td className="p-3 sm:p-4 align-top">Media</td>
                  <td className="p-3 sm:p-4 align-top">Media</td>
                  <td className="p-3 sm:p-4 align-top">Media</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="p-3 sm:p-4 font-medium text-white align-top">Por valor</td>
                  <td className="p-3 sm:p-4 align-top">Media</td>
                  <td className="p-3 sm:p-4 align-top">Alta</td>
                  <td className="p-3 sm:p-4 align-top">Alta</td>
                  <td className="p-3 sm:p-4 align-top">Alta</td>
                </tr>
                <tr>
                  <td className="p-3 sm:p-4 font-medium text-white align-top">Híbrido (retainer + variable)</td>
                  <td className="p-3 sm:p-4 align-top">Alta</td>
                  <td className="p-3 sm:p-4 align-top">Alta</td>
                  <td className="p-3 sm:p-4 align-top">Alta</td>
                  <td className="p-3 sm:p-4 align-top">Media–alta</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            En muchas agencias que combinan estabilidad y flexibilidad aparece un patrón observado en el sector:{' '}
            <strong>alrededor del 60–70% de ingresos recurrentes</strong> (retainer con alcance claro) y{' '}
            <strong>un 30–40% en proyectos o variables</strong>. No es ley: es referencia para discutir mix, no dogma.
          </p>

          <h3 className="text-lg sm:text-xl font-bold text-white mt-10 mb-3">Por horas (time &amp; materials)</h3>
          <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-4">
            Transparencia para el cliente y simplicidad en cuentas; encaja cuando el alcance es difuso o el encargo es
            consultoría puntual. El límite está en la negociación permanente de la tarifa y en que <strong>mejorar
            procesos baje facturación</strong> si el precio sigue anclado al reloj.
          </p>

          <h3 className="text-lg sm:text-xl font-bold text-white mt-8 mb-3">Retainer</h3>
          <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-4">
            Ingresos previsibles y relación continua; muy útil cuando el servicio es repetible (SEO, redes, reporting).
            El riesgo es el retainer «caja de resonancia» donde entra de todo: si el alcance no está cerrado por escrito,
            <strong>das más valor del que cobras</strong> sin un momento claro para recortar o reclamar.
          </p>

          <h3 className="text-lg sm:text-xl font-bold text-white mt-8 mb-3">Precio por valor</h3>
          <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            Desacopla ingreso y horas cuando puedes demostrar impacto. La venta es más lenta y la responsabilidad de
            medir es tuya: sin métricas creíbles, el cliente vuelve a comparar horas porque es lo único que entiende con
            claridad.
          </p>
        </section>
      </RevealOnScroll>

      <RevealOnScroll delay={2}>
        <section id="calcular-rentabilidad" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6 flex items-center gap-3">
            <Calculator className="h-8 w-8 text-emerald-400 shrink-0" aria-hidden />
            3. Cómo calcular la rentabilidad real de cada proyecto (paso a paso)
          </h2>

          <h3 className="text-lg sm:text-xl font-bold text-white mt-6 mb-3">Paso 1 — Define el coste real del proyecto</h3>
          <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-4">
            El error típico es contar solo las horas «de producción». Te pasa cuando el PM mira el desglose “bonito”
            y se olvida de lo que nadie mete en la factura: ese rato de coordinación que no tiene entregable, el par de
            correcciones que nacen del briefing incompleto y la fricción que aparece cuando el proyecto cambia de
            rumbo a mitad de semana.
          </p>

          <h3 className="text-lg sm:text-xl font-bold text-white mt-8 mb-3">Paso 2 — Calcula el margen bruto por proyecto</h3>
          <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-4">
            <em>Margen bruto (%) = (ingresos del proyecto − coste directo total) / ingresos × 100.</em> La referencia
            habitual en servicios sitúa un margen bruto saludable <strong>por encima del 50%</strong>; por debajo del{' '}
            <strong>40%</strong>, el proyecto tiene muchas probabilidades de no estar cubriendo indirectos de forma
            sostenible.
          </p>

          <h3 className="text-lg sm:text-xl font-bold text-white mt-8 mb-3">Paso 3 — Compara proyectos entre sí</h3>
          <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-4">
            Con diez o quince proyectos recientes, casi siempre aparece el mismo dibujo: <strong>unos pocos tipos de
            encargo concentran la mayor parte del margen</strong> y otros absorben tiempo desproporcionado. Esa foto es
            la base para decidir precios, plantilla y qué servicios dejar de regalar.
          </p>

          <h3 className="text-lg sm:text-xl font-bold text-white mt-8 mb-3">Paso 4 — Introduce el tiempo como variable de control</h3>
          <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-4">
            Si un proyecto tiene presupuesto de horas pero no <strong>contenedor temporal</strong>, el trabajo tiende a
            expandirse —la{' '}
            <Link to="/blog/ley-parkinson" className="text-violet-300 hover:text-white underline underline-offset-2">
              Ley de Parkinson
            </Link>{' '}
            aplicada a cuentas y entregables. El timeboxing, en la práctica, es decidir cuántas horas tiene cada fase{' '}
            <em>antes</em> de empezar, y gestionar dentro de ese límite. La guía de{' '}
            <Link to="/blog/que-es-timeboxing" className="text-violet-300 hover:text-white underline underline-offset-2">
              qué es el timeboxing
            </Link>{' '}
            lo explica con calma; aquí nos quedamos con la idea: tiempo como diseño, no como excusa.
          </p>
          <div className="rounded-2xl border border-white/10 bg-indigo-950/40 p-5 sm:p-6 my-6">
            <p className="text-indigo-100/95 text-base sm:text-lg leading-relaxed m-0">
              Así se ve a menudo en la práctica cuando el equipo usa una herramienta pensada para eso: en{' '}
              <strong className="text-white">Taimbox</strong> los bloques de tiempo van asociados a proyecto y fase, con
              responsable y estado visibles. Cuando el tiempo asignado a un bloque se acaba, el sistema lo deja claro antes
              de que el margen lo pague el equipo en silencio —no es un anuncio, es una forma de hacer explícito lo que en
              una hoja dispersa suele llegar tarde.
            </p>
          </div>
        </section>
      </RevealOnScroll>

      <RevealOnScroll>
        <section id="scope-creep-protocolo" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6 flex items-center gap-3">
            <Shield className="h-8 w-8 text-orange-400 shrink-0" aria-hidden />
            4. El scope creep como destructor de margen: cómo bloquearlo sin perder al cliente
          </h2>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-6">
            <p>
              Las agencias aceptan scope creep por tres motivos que casi nunca son «falta de carácter»: miedo a dañar la
              relación, sensación de que «es poco» y no merece conversación, y ausencia de un sitio donde quede
              registrado lo que se acepta fuera de alcance. Las tres cosas se arreglan con <strong>proceso</strong>, no
              con más heroísmo.
            </p>
            <p>
              La escena: te dicen “solo es una cosa” justo después de un feedback. Y cuando te das cuenta ya estás
              rehaciendo versiones en un canal nuevo, con el cliente mirando el cambio “como si fuera gratis”.
              Sin registro, nadie discute el precio; discuten el resultado a posteriori.
            </p>
          </div>

          <ScopeProtocoloInfographic />

          <h3 className="text-lg sm:text-xl font-bold text-white mt-8 mb-3">La pregunta que cambia la conversación</h3>
          <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            Cuando entra un extra, la respuesta que suele funcionar mejor no es un «no» a la defensiva ni un «sí» gratis:
            <em> «Podemos incluir esto. ¿Lo añadimos al alcance actual ajustando el presupuesto, o lo dejamos para el
            próximo sprint?»</em> El cliente elige; en cualquier caso, dejas de financiar el trabajo por omisión.
          </p>
        </section>
      </RevealOnScroll>

      <RevealOnScroll delay={1}>
        <section id="modelo-sprint" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6 flex items-center gap-3">
            <Rocket className="h-8 w-8 text-sky-400 shrink-0" aria-hidden />
            5. De fee mensual a sprint: cómo estructurar proyectos para proteger rentabilidad
          </h2>
          <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-6">
            Los <strong>sprints de dos a cuatro semanas</strong> con entregables cerrados no son solo cosa de software:
            creatividad y cuenta también se benefician de un calendario que dice «hasta aquí llega este bloque» y obliga a
            revisar alcance al inicio del siguiente.
          </p>
          <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-6">
            Si hoy trabajas con fee abierto, es fácil: el cliente manda un “extra” y el equipo lo absorbe cuando puede.
            El problema llega cuando miras el mes y descubres que lo “pequeño” se juntó con lo “pequeño”… y ya no
            hay margen para lo importante.
          </p>

          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5 mb-6">
            <table className="w-full text-left text-sm sm:text-base min-w-[480px]">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="p-3 sm:p-4 text-sky-200 font-semibold">Aspecto</th>
                  <th className="p-3 sm:p-4 text-sky-200 font-semibold">Fee mensual abierto</th>
                  <th className="p-3 sm:p-4 text-sky-200 font-semibold">Sprint con alcance cerrado</th>
                </tr>
              </thead>
              <tbody className="text-indigo-100/90">
                <tr className="border-b border-white/10">
                  <td className="p-3 sm:p-4 font-medium text-white align-top">Control del scope</td>
                  <td className="p-3 sm:p-4 align-top">Bajo: el cliente puede pedir en cualquier momento</td>
                  <td className="p-3 sm:p-4 align-top">Alto: se cierra al inicio de cada ciclo</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="p-3 sm:p-4 font-medium text-white align-top">Previsibilidad de horas</td>
                  <td className="p-3 sm:p-4 align-top">Baja</td>
                  <td className="p-3 sm:p-4 align-top">Alta</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="p-3 sm:p-4 font-medium text-white align-top">Facilidad de upsell</td>
                  <td className="p-3 sm:p-4 align-top">Baja</td>
                  <td className="p-3 sm:p-4 align-top">Alta al inicio de cada sprint</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="p-3 sm:p-4 font-medium text-white align-top">Riesgo de scope creep</td>
                  <td className="p-3 sm:p-4 align-top">Alto</td>
                  <td className="p-3 sm:p-4 align-top">Bajo si se cumple la revisión</td>
                </tr>
                <tr>
                  <td className="p-3 sm:p-4 font-medium text-white align-top">Percepción del cliente</td>
                  <td className="p-3 sm:p-4 align-top">Variable</td>
                  <td className="p-3 sm:p-4 align-top">Alta: entregables concretos por ciclo</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-white mt-6 mb-3">Transición sin drama</h3>
          <ol className="space-y-3 text-indigo-100/90 text-base sm:text-lg leading-relaxed list-decimal list-outside pl-5 sm:pl-6 marker:text-sky-300 marker:font-semibold">
            <li>Prueba el modelo de sprint con <strong>clientes nuevos</strong> desde el inicio.</li>
            <li>Mide tres a seis meses: desviación presupuestaria, satisfacción y margen por proyecto.</li>
            <li>
              Usa esos datos para proponer el cambio a cuentas actuales —el argumento fuerte es que <strong>les beneficia
              visibilidad y ritmo</strong>, no solo a tu hoja de horas.
            </li>
          </ol>

          <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed mt-8">
            Si necesitas una base descargable para cuadrar capacidad y asignación antes de tocar contratos, la{' '}
            <Link
              to="/blog/plantilla-planificacion-recursos-agencia"
              className="text-violet-300 hover:text-white underline underline-offset-2"
            >
              plantilla de planificación de recursos
            </Link>{' '}
            es un punto de partida honesto —con límites, como cualquier Excel que no viva sola en el día a día.
          </p>
        </section>
      </RevealOnScroll>

      <RevealOnScroll delay={2}>
        <section id="faq-rentabilidad-proyecto" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-6">Preguntas frecuentes</h2>
          <div className="space-y-6 text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            <div className="rounded-xl border border-white/10 bg-white/5 p-5 sm:p-6 space-y-3">
              <h3 className="text-white font-bold text-lg m-0">¿Qué margen bruto debe tener una agencia de marketing?</h3>
              <p className="m-0">
                En la práctica, la referencia habitual en agencias de servicios sitúa un margen bruto saludable por encima del 50% por
                proyecto. Por debajo del 40%, el proyecto difícilmente cubre costes indirectos y overhead de forma
                sostenible. El margen bruto se calcula como (ingresos – coste directo) / ingresos × 100.
                Lo ves cuando el trabajo sale “a tiempo” pero el dinero no: el margen ya se lo ha comido el retraso silencioso.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-5 sm:p-6 space-y-3">
              <h3 className="text-white font-bold text-lg m-0">¿Cómo se cobra el trabajo extra fuera del alcance en una agencia?</h3>
              <p className="m-0">
                El proceso más efectivo tiene tres pasos: registrar la solicitud en el momento, estimar el tiempo antes de
                aceptar, y comunicar el impacto al cliente antes de ejecutar. La pregunta que cambia la conversación es:
                &quot;¿Lo añadimos ajustando el presupuesto, o lo dejamos para el próximo sprint?&quot;
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-5 sm:p-6 space-y-3">
              <h3 className="text-white font-bold text-lg m-0">¿Qué es mejor para una agencia: retainer o precio por proyecto?</h3>
              <p className="m-0">
                Depende del tipo de servicio. El retainer funciona mejor para servicios continuos y bien definidos (SEO,
                gestión de redes). El precio por proyecto funciona mejor para trabajos puntuales con scope variable. Los
                datos del sector apuntan a que el modelo híbrido — 60-70% retainer, 30-40% proyectos — ofrece el mejor
                equilibrio entre predecibilidad y flexibilidad.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-5 sm:p-6 space-y-3">
              <h3 className="text-white font-bold text-lg m-0">¿Cómo puedo saber qué proyectos son más rentables en mi agencia?</h3>
              <p className="m-0">
                Calculando el margen bruto real de tus últimos 10-15 proyectos: (ingresos – coste directo total) /
                ingresos × 100. El patrón que emerge casi siempre es el mismo: 2-3 tipos de proyecto concentran el 80% del
                margen. Esa información es la base de cualquier decisión estratégica de portfolio de servicios.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-5 sm:p-6 space-y-3">
              <h3 className="text-white font-bold text-lg m-0">¿Qué es el pricing basado en valor y cuándo aplicarlo?</h3>
              <p className="m-0">
                Es un modelo en el que el precio se fija en función del valor que el trabajo genera para el cliente, no del
                tiempo invertido. Tiene sentido cuando la agencia tiene datos de resultados previos y track record
                demostrable que justifique el precio. Sin esas condiciones, es difícil de sostener en la negociación.
              </p>
            </div>
          </div>
        </section>
      </RevealOnScroll>

      {relatedPost != null && (
        <BlogRelatedPost
          title={relatedPost.title}
          description={relatedPost.description}
          href={relatedPost.href}
        />
      )}
    </article>
  );
}
