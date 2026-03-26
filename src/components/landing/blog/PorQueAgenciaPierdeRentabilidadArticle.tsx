import { Link } from 'react-router-dom';
import {
  Percent,
  Shuffle,
  MonitorSmartphone,
  TimerOff,
  GitBranchPlus,
  Table2,
  ListChecks,
} from 'lucide-react';
import { RevealOnScroll } from './RevealOnScroll';
import { BlogReadingTime } from './BlogReadingTime';
import { BlogTOC } from './BlogTOC';
import { BlogRelatedPost } from './BlogRelatedPost';
import type { BlogTOCItem } from './BlogTOC';
import { OcupacionVsRentabilidadChart } from './OcupacionVsRentabilidadChart';

export interface PorQueAgenciaPierdeRentabilidadArticleProps {
  readingMinutes?: number;
  tocItems?: BlogTOCItem[];
  relatedPost?: { title: string; description: string; href: string };
}

export function PorQueAgenciaPierdeRentabilidadArticle({
  readingMinutes,
  tocItems,
  relatedPost,
}: PorQueAgenciaPierdeRentabilidadArticleProps) {
  return (
    <article
      id="por-que-agencia-pierde-rentabilidad"
      className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 md:py-16 text-left overflow-x-hidden"
    >
      <section className="mb-12 sm:mb-14">
        <div className="mb-6 text-center flex flex-col items-center gap-3">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-emerald-300 bg-emerald-500/20 border border-emerald-400/30">
            Gestión y rentabilidad
          </span>
          {readingMinutes != null && <BlogReadingTime minutes={readingMinutes} />}
        </div>
        <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-[2.75rem] font-black text-white mb-5 sm:mb-6 leading-[1.15] tracking-tight text-center">
          Por qué tu agencia pierde rentabilidad aunque el equipo esté siempre ocupado
        </h1>

        <div className="rounded-2xl border border-amber-400/40 bg-amber-500/10 p-4 sm:p-6 mb-8">
          <p className="text-amber-100/95 text-sm font-semibold uppercase tracking-wide mb-3">TL;DR — Lo esencial en 3 puntos</p>
          <ol className="space-y-3 text-indigo-100/95 text-base sm:text-lg leading-relaxed list-decimal list-outside pl-5 sm:pl-6 marker:text-amber-300 marker:font-semibold">
            <li>
              Tener el equipo al 100% de ocupación no significa ser más rentable — por encima del 80%, cada hora extra
              genera costes ocultos que erosionan el margen más rápido de lo que crece el ingreso.
            </li>
            <li>
              El context switching puede acercarse al 40% de la capacidad productiva real en algunos entornos. En una
              agencia con 5 personas, eso equivale a pagar 2 sueldos que no generan valor facturable.
            </li>
            <li>
              La rentabilidad de una agencia no se construye trabajando más horas — se construye controlando qué tipo de
              trabajo ocupa cada hora y eliminando los agujeros que nadie ve en el P&amp;L.
            </li>
          </ol>
        </div>

        <div className="space-y-5 text-indigo-100/95 text-base sm:text-lg leading-[1.75]">
          <p>
            El tablero de proyectos siempre tiene algo en curso. Los clientes firman con un «todo bien». El equipo llega
            antes y sale después. Y aun así, a final de mes, el margen no cuadra con el esfuerzo que ves en la sala o en
            el chat.
          </p>
          <p>
            No estás loco: <strong>estar ocupado y ser rentable son dos cosas distintas</strong>. Confundirlas es el error
            más frecuente —y más caro— en la gestión de agencias de servicios. Abajo vas a ver por qué la utilización alta
            puede destruir margen, qué papel juega el cambio de contexto, cómo el «siempre disponible» digital te cuesta
            foco, dónde se van las horas que no facturas y qué métricas mirar antes de tomar otra decisión a ciegas.
          </p>
        </div>
      </section>

      {tocItems != null && tocItems.length > 0 && (
        <div className="mb-12">
          <BlogTOC items={tocItems} />
        </div>
      )}

      <RevealOnScroll>
        <section id="tasa-utilizacion" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6 flex items-center gap-3">
            <Percent className="h-8 w-8 text-emerald-400 shrink-0" aria-hidden />
            1. La trampa de la ocupación: por qué el 100% de utilización destruye márgenes
          </h2>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            <p>
              Te tienta pensar que si todo el mundo está a tope, la agencia gana más. El problema es que{' '}
              <strong>sin holgura no hay reacción</strong>: un imprevisto deja de ser una excepción y pasa a ser la norma
              financiada con horas que no estaban en ningún presupuesto.
            </p>
            <p>
              El viernes a las 19:45 tu diseñadora senior no dice “no puedo”. Solo deja de mandar GIFs por Slack,
              responde con un “ok” seco y, cuando por fin suena el canal, ya ha saltado el retraso al siguiente
              entregable. Ese retraso no es drama; es margen que se evapora.
            </p>
            <p>
              Piensa en una agencia de quince personas con cuentas estables: si la utilización media se va al 92% tres
              meses seguidos, no estás viendo «más compromiso»; estás viendo <strong>un sistema sin colchón</strong>.
              Cualquier campaña que se mueve, cualquier baja médica o cualquier error de estimación se paga con margen o
              con calidad —y a veces con las dos.
            </p>
            <p>
              La <strong>tasa de utilización</strong> —en la forma más útil para dirección— suele expresarse como:{' '}
              <em>horas facturables trabajadas / horas totales disponibles × 100</em>. Ojo: «facturables» no es lo mismo
              que «ocupadas»: puedes estar en reuniones internas, formación o herramientas y seguir «ocupado» sin que eso
              entre en una factura.
            </p>
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-white mt-8 mb-3">Qué es la tasa de utilización y cuál es el rango saludable</h3>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            <p>
              En la práctica, la referencia habitual del sector sitúa el rango óptimo <strong>entre el 70% y el 80%</strong> para muchos
              perfiles productivos en agencias de servicios. Por debajo hay capacidad ociosa; por encima, el sistema suele
              empezar a pagar facturas invisibles: errores, retrabajo y presión sostenida.
            </p>
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-white mt-8 mb-3">Qué pasa cuando se supera ese umbral</h3>
          <ul className="space-y-3 text-indigo-100/90 text-base sm:text-lg leading-relaxed list-disc list-outside pl-5 sm:pl-6 marker:text-emerald-400">
            <li>
              Cada imprevisto genera <strong>horas extra no planificadas</strong>: el coste es real aunque no tenga línea
              propia en el Excel del proyecto.
            </li>
            <li>
              La calidad baja bajo presión sostenida y aparece el <strong>retrabajo</strong> —otra vez coste real, otra vez
              invisible en el presupuesto original.
            </li>
            <li>
              El agotamiento acumulado empuja la <strong>rotación</strong>. Y la rotación, en euros, es brutal.
            </li>
          </ul>

          <h3 className="text-lg sm:text-xl font-bold text-white mt-8 mb-3">El coste real de la rotación que nadie incluye en el P&amp;L</h3>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            <p>
              Según estudios de <strong>SHRM</strong> (Society for Human Resource Management), sustituir a un empleado
              puede costar <strong>entre el 50% y el 200% de su salario anual</strong>, según el perfil. Para alguien con
              un coste anual en torno a 30.000€, hablamos de un rango amplísimo: de 15.000€ a 60.000€ por baja, antes de
              contar el tiempo en el que el puesto no rinde al 100%.
            </p>
            <p>
              Pregunta incómoda: <em>¿cuántas bajas ha tenido tu agencia este año? ¿Ese coste aparece en algún dashboard?</em>
            </p>
          </div>

          <p className="mb-6 text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            Fíjate en la zona roja del gráfico: <strong>ese desplome es el coste de perder a tu mejor creativo</strong>{' '}
            porque le obligaste a vivir en el cuadrante de urgencia permanente. No es un número abstracto: es la factura de
            alguien que ya no puede sostener el ritmo y el margen se va antes que el Excel te avise.
          </p>

          <OcupacionVsRentabilidadChart />

          <p className="mt-6 text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            Cuando la curva vuelve a hundirse a la derecha, no suele ser porque el trabajo sea “malo”: es porque el sistema
            no deja hueco para pensar con cabeza —y ahí empieza el retrabajo que nadie presupuestó.
          </p>
        </section>
      </RevealOnScroll>

      <RevealOnScroll delay={1}>
        <section id="context-switching" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6 flex items-center gap-3">
            <Shuffle className="h-8 w-8 text-violet-400 shrink-0" aria-hidden />
            2. El coste invisible que más dinero destruye: el context switching
          </h2>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            <p>
              El <strong>context switching</strong> es el salto mental entre tareas o proyectos que no comparten el mismo
              marco. No es «hacer varias cosas a la vez»: es <strong>dejar una cabeza puesta y tener que volver a
              engancharla</strong> en otra. En agencia, el daño se multiplica: el mismo perfil arrastra varios briefs a la
              vez, con tonos de marca distintos, ritmos distintos y urgencias distintas.
            </p>
            <p>
              Te pasa así: estás cerrando un layout y te entra un “¿me lo pasas en 20 minutos?” de otro cliente.
              No hay ticket, no hay contexto, y cuando vuelves a tu tarea original ya no es la misma mañana.
            </p>
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-white mt-8 mb-3">Los datos que hay detrás</h3>
          <ul className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed list-disc list-outside pl-5 sm:pl-6 marker:text-violet-400">
            <li>
              Investigaciones de la <strong>Universidad de California en Irvine</strong> (Gloria Mark y equipo) sitúan
              en torno a <strong>23–25 minutos</strong> el tiempo medio para recuperar el foco profundo tras una
              interrupción relevante. No es un detalle de productividad personal: es un dato de economía de la atención.
            </li>
            <li>
              En síntesis de estudios sobre productividad cognitiva en equipos de conocimiento, la dispersión puede
              consumir <strong>una fracción muy alta</strong> del tiempo disponible —en el orden de lo que muchos equipos
              resumen como «casi la mitad del día en cambios de tarea».
            </li>
            <li>
              Traducción a euros (ejemplo hipotético, para orden de magnitud): si alguien con un coste cargado de 50.000€
              al año pierde una parte grande de su capacidad por dispersión, <strong>no estás perdiendo «un poco de
              foco»</strong>: estás financiando capacidad que no se factura.
            </li>
          </ul>

          <h3 className="text-lg sm:text-xl font-bold text-white mt-8 mb-3">El ejercicio de los 30 segundos</h3>
          <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-6">
            Piensa en una persona de tu equipo: cuántos proyectos lleva abiertos a la vez, cuántas interrupciones de
            cliente o internas recibe al día, y qué pasa si multiplicas eso por semanas. No hace falta una hoja perfecta:
            <strong> el ejercicio mental ya duele lo suficiente</strong> como para tomar decisiones.
          </p>

          <h3 className="text-lg sm:text-xl font-bold text-white mt-8 mb-3">Las interrupciones que nadie registra</h3>
          <ul className="space-y-2 text-indigo-100/90 text-base sm:text-lg leading-relaxed list-disc list-outside pl-5 sm:pl-6 marker:text-violet-400">
            <li>Mensajes del cliente en canales donde la respuesta se interpreta como urgencia.</li>
            <li>Correos entre reuniones que rompen el bloque de trabajo profundo.</li>
            <li>Cambios de prioridad de última hora sin ticket ni registro.</li>
            <li>Petición verbal «rápida» que no entra en ninguna estimación.</li>
          </ul>
          <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed mt-6 mb-0">
            Ninguna de esas líneas aparece como partida en el presupuesto del cliente; todas compiten por la misma atención
            que debería ir a entregar valor cobrable. Por eso el problema no es «la gente mira el móvil»: es que el modelo
            de trabajo <strong>premia la reactividad</strong> y encarece el trabajo bueno.
          </p>
        </section>
      </RevealOnScroll>

      <RevealOnScroll delay={2}>
        <section id="presencialismo-digital" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6 flex items-center gap-3">
            <MonitorSmartphone className="h-8 w-8 text-amber-400 shrink-0" aria-hidden />
            3. La cultura que lo genera: el presencialismo digital
          </h2>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            <p>
              El presencialismo clásico —estar en la oficina aunque no rindas— ha mutado: ahora es el{' '}
              <strong>«siempre en línea»</strong>, el verde perpetuo, el correo abierto y la sensación de que responder tarde
              es fallar. El resultado es el mismo: <strong>la apariencia de disponibilidad sustituye a la entrega de valor
              medible</strong>.
            </p>
            <p>
              Lo ves en el chat: el canal tiene a todo el mundo “en verde” y aun así nadie termina una entrega. En una
              reunión de feedback, los comentarios suenan a prisa, no a criterio: “solo un ajuste rápido” acaba siendo un
              retrabajo que no cabía en el plan.
            </p>
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-white mt-8 mb-3">Cómo se refuerza sin malicia</h3>
          <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-4">
            La mayoría de mandos no lo hacen a propósito. Suele bastar con una combinación de hábitos que parecen inocuos:
          </p>
          <ul className="space-y-3 text-indigo-100/90 text-base sm:text-lg leading-relaxed list-disc list-outside pl-5 sm:pl-6 marker:text-amber-400">
            <li>Mensajes fuera de horario que «no exigen» respuesta, pero generan presión implícita.</li>
            <li>Responder al cliente en canales visibles para el equipo y normalizar la disponibilidad total.</li>
            <li>Elogiar la rapidez de respuesta por encima de la calidad del entregable o del criterio.</li>
          </ul>

          <h3 className="text-lg sm:text-xl font-bold text-white mt-8 mb-3">Tres cambios de liderazgo (sin comprar nada)</h3>
          <ol className="space-y-3 text-indigo-100/90 text-base sm:text-lg leading-relaxed list-decimal list-outside pl-5 sm:pl-6 marker:text-amber-300 marker:font-semibold">
            <li>
              <strong className="text-white">Definir canales síncronos y asíncronos</strong> —y respetar la regla desde
              arriba.
            </li>
            <li>
              <strong className="text-white">Proteger bloques de no interrupciones</strong> en el calendario del equipo.
            </li>
            <li>
              <strong className="text-white">Medir reconocimiento por resultados</strong>, no por horas de presencia
              digital.
            </li>
          </ol>
        </section>
      </RevealOnScroll>

      <RevealOnScroll>
        <section id="horas-no-facturables" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6 flex items-center gap-3">
            <TimerOff className="h-8 w-8 text-rose-400 shrink-0" aria-hidden />
            4. Las horas no facturables: el agujero negro de los márgenes
          </h2>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            <p>
              Las <strong>horas no facturables</strong> son las que trabajas pero no metes en ninguna factura. Muchas
              agencias las conocen en teoría; pocas las miden con rigor, así que tampoco las presupuestan bien. El
              resultado es un P&amp;L que parece «razonable» hasta que empiezas a sumar lo que no se cobró.
            </p>
            <p>
              En agencias de servicios creativos, según referencias del sector, esas horas pueden representar{' '}
              <strong>entre el 30% y el 50%</strong> del total trabajado. Si tu ratio cae por debajo de ciertos umbrales,
              el problema deja de ser «un mes malo» y pasa a ser estructural.
            </p>
            <p>
              Mira tu calendario: hay un bloque “alineación” de 45 minutos que nadie llama por su nombre de entregable,
              pero todos salen con acciones nuevas. Eso, sumado, es tiempo que no se vende y que acaba comiéndose el
              margen del proyecto.
            </p>
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-white mt-8 mb-3">Categorías que más suelen pesar</h3>
          <ul className="space-y-3 text-indigo-100/90 text-base sm:text-lg leading-relaxed list-disc list-outside pl-5 sm:pl-6 marker:text-rose-400">
            <li>Reuniones internas de coordinación sin entregable claro — media hora que no estaba en el presupuesto.</li>
            <li>Correcciones por briefing flojo o incompleto — se rehace, no se avanza.</li>
            <li>Preventas que no se cierran — cada “te lo paso luego” es coste sin retorno.</li>
          </ul>
          <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed mt-6">
            Si quieres ordenar <strong>quién hace qué y con qué calendario</strong>, la guía de{' '}
            <Link
              to="/blog/planificacion-proyectos-cronograma-recursos"
              className="text-violet-300 hover:text-white underline underline-offset-2"
            >
              planificación de recursos del equipo
            </Link>{' '}
            conecta cronograma, presupuesto y capacidad sin tratarlo como tres mundos distintos. Y te ayuda a que no se
            te escapen dos sombras típicas: la gestión de herramientas (subir archivos, permisos, estados) y la
            comunicación fuera de alcance que entra por el chat.
          </p>

          <h3 className="text-lg sm:text-xl font-bold text-white mt-8 mb-3">Cómo calcular el ratio de horas facturables</h3>
          <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            Fórmula aplicable: <em>(horas facturadas al cliente en el último mes / horas totales trabajadas en el último
            mes) × 100</em>. Referencias habituales: por encima del <strong>65%</strong> suele ser un terreno «normal»;
            entre 50% y 65% hay margen de mejora; por debajo del <strong>50%</strong> conviene asumir que el problema es
            sistémico, no puntual.
          </p>
        </section>
      </RevealOnScroll>

      <RevealOnScroll delay={1}>
        <section id="scope-creep" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6 flex items-center gap-3">
            <GitBranchPlus className="h-8 w-8 text-orange-400 shrink-0" aria-hidden />
            5. El scope creep silencioso: cómo los proyectos se comen su propio margen
          </h2>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            <p>
              El <strong>scope creep</strong> es el alcance que crece sin ajuste de presupuesto. En agencias es casi una
              constante: la relación continúa, entra petición tras petición y el miedo a «romper el clima» hace que muchas
              cosas se asuman gratis.
            </p>
            <p>
              El momento es casi siempre el mismo: el cliente suelta “solo un cambio pequeño” a media tarde.
              Parece inofensivo… hasta que esa frase termina en nuevas revisiones, reestimaciones y otra vuelta de
              feedback que ya no cabía en el margen.
            </p>
            <p>
              Si el trabajo no tiene <strong>contenedor temporal</strong> claro, tiende a expandirse: aquí encaja la{' '}
              <Link to="/blog/ley-parkinson" className="text-violet-300 hover:text-white underline underline-offset-2">
                Ley de Parkinson y los plazos de los proyectos
              </Link>
              —sin topes, el esfuerzo llena el hueco disponible y el margen desaparece en «pulir detalles».
            </p>
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-white mt-8 mb-3">Cómo cuantificarlo sin complicarte la vida</h3>
          <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            Compara horas presupuestadas frente a horas reales en tus últimos diez proyectos. Si la desviación media
            supera el <strong>20–30%</strong>, el alcance se está moviendo de forma sistemática —no por un mal mes, sino
            por un patrón.
          </p>

          <h3 className="text-lg sm:text-xl font-bold text-white mt-8 mb-3">Por qué es síntoma, no «mala suerte»</h3>
          <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            El problema rara vez es «el cliente es imposible». Lo habitual es que no existan límites claros ni un sitio
            donde quede registrado qué entra y qué no. La solución es de <strong>proceso y conversación</strong>, no de
            heroísmo individual.
          </p>
        </section>
      </RevealOnScroll>

      <RevealOnScroll delay={2}>
        <section id="metricas-rentabilidad" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6 flex items-center gap-3">
            <Table2 className="h-8 w-8 text-cyan-400 shrink-0" aria-hidden />
            6. Las métricas que sí predicen si tu agencia es rentable
          </h2>
          <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-6">
            La facturación puede subir y el beneficio quedarse plano: sin margen por proyecto, solo estás moviendo
            volumen. La tabla siguiente es una brújula mensual; si quieres profundizar en el detalle operativo, los{' '}
            <Link to="/blog/kpis-agencias-marketing-2026" className="text-violet-300 hover:text-white underline underline-offset-2">
              KPIs de rendimiento para agencias de marketing
            </Link>{' '}
            desarrollan cada ratio con ejemplos. Para pasar del diagnóstico a números por encargo, también tiene sentido
            leer{' '}
            <Link
              to="/blog/como-medir-rentabilidad-proyecto-agencia-dejar-vender-horas"
              className="text-violet-300 hover:text-white underline underline-offset-2"
            >
              cómo medir la rentabilidad real por proyecto
            </Link>
            .
          </p>
          <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-6">
            Te das cuenta en el comité: si la pregunta recurrente es “¿cuántas horas habéis vendido?”, probablemente estás
            gestionando el síntoma, no la causa. El P&amp;L no negocia; se mueve con margen por proyecto.
          </p>
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
            <table className="w-full text-left text-sm sm:text-base">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="p-3 sm:p-4 text-cyan-200 font-semibold">Métrica</th>
                  <th className="p-3 sm:p-4 text-cyan-200 font-semibold">Fórmula</th>
                  <th className="p-3 sm:p-4 text-cyan-200 font-semibold">Umbral saludable</th>
                  <th className="p-3 sm:p-4 text-cyan-200 font-semibold">Señal de alarma</th>
                </tr>
              </thead>
              <tbody className="text-indigo-100/90">
                <tr className="border-b border-white/10">
                  <td className="p-3 sm:p-4 font-medium text-white align-top">Tasa de utilización</td>
                  <td className="p-3 sm:p-4 align-top">Horas facturadas / horas totales × 100</td>
                  <td className="p-3 sm:p-4 align-top">70–80%</td>
                  <td className="p-3 sm:p-4 align-top">&gt; 85% sostenido</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="p-3 sm:p-4 font-medium text-white align-top">Margen bruto por proyecto</td>
                  <td className="p-3 sm:p-4 align-top">(Ingresos − coste directo) / ingresos × 100</td>
                  <td className="p-3 sm:p-4 align-top">&gt; 50%</td>
                  <td className="p-3 sm:p-4 align-top">&lt; 40%</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="p-3 sm:p-4 font-medium text-white align-top">Desviación presupuestaria</td>
                  <td className="p-3 sm:p-4 align-top">(Horas reales − estimadas) / estimadas × 100</td>
                  <td className="p-3 sm:p-4 align-top">&lt; 15% media</td>
                  <td className="p-3 sm:p-4 align-top">&gt; 30% habitual</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="p-3 sm:p-4 font-medium text-white align-top">Facturación por empleado</td>
                  <td className="p-3 sm:p-4 align-top">Ingresos totales / nº empleados (anual)</td>
                  <td className="p-3 sm:p-4 align-top">60k–120k€/año</td>
                  <td className="p-3 sm:p-4 align-top">&lt; 50k€/año</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="p-3 sm:p-4 font-medium text-white align-top">Ratio horas facturables</td>
                  <td className="p-3 sm:p-4 align-top">Horas facturadas / horas trabajadas × 100</td>
                  <td className="p-3 sm:p-4 align-top">&gt; 65%</td>
                  <td className="p-3 sm:p-4 align-top">&lt; 50%</td>
                </tr>
                <tr>
                  <td className="p-3 sm:p-4 font-medium text-white align-top">Tasa de rotación voluntaria</td>
                  <td className="p-3 sm:p-4 align-top">Bajas voluntarias / plantilla media × 100</td>
                  <td className="p-3 sm:p-4 align-top">&lt; 15% anual</td>
                  <td className="p-3 sm:p-4 align-top">&gt; 20% anual</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-white mt-8 mb-3">El error más frecuente: medir ingresos en lugar de márgenes</h3>
          <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            Puedes facturar mucho y quedarte con un margen ridículo si los costes directos se han ido comiendo el proyecto.
            La facturación es vanidad útil para la foto; <strong>el margen por proyecto y por tipo de servicio</strong> es
            lo que permite decidir qué vender, a qué precio y con qué equipo.
          </p>
        </section>
      </RevealOnScroll>

      <RevealOnScroll>
        <section id="acciones-inmediatas" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6 flex items-center gap-3">
            <ListChecks className="h-8 w-8 text-lime-400 shrink-0" aria-hidden />
            7. Qué cambiar esta semana para empezar a recuperar margen
          </h2>
          <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-6">
            El lunes a las 9:00, cuando el equipo aún está con la primera tanda de mensajes, no necesitas un nuevo
            framework: necesitas romper un hábito. Lo que midas esta semana te dirá dónde se está fugando el margen.
          </p>
          <ol className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed list-decimal list-outside pl-5 sm:pl-6 marker:text-lime-300 marker:font-semibold">
            <li>
              <strong className="text-white">Audita las últimas diez facturas:</strong> compara horas presupuestadas vs.
              reales. Si la desviación media supera el 20%, tienes un problema de estimación o de alcance que sí se puede
              medir.
            </li>
            <li>
              <strong className="text-white">Calcula tu ratio de horas facturables.</strong> Si no tienes datos, el primer
              arreglo es hacer visibles las horas —no comprar otro software.
            </li>
            <li>
              <strong className="text-white">Elimina una reunión interna semanal</strong> y sustitúyela por un update
              escrito. Comprueba si la comunicación empeora; muchas veces no pasa nada.
            </li>
            <li>
              <strong className="text-white">Define un protocolo mínimo de alcance:</strong> cualquier petición fuera del
              acuerdo original se registra por escrito antes de ejecutarse, aunque parezca pequeña.
            </li>
          </ol>
          <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed mt-6">
            Y una verdad incómoda: si el equipo vive al 90–100% de utilización, no hay buffer; solo hay retraso financiado
            con calidad y margen. Ajusta ese objetivo antes de seguir “ganando ocupación”.
          </p>
        </section>
      </RevealOnScroll>

      <RevealOnScroll delay={1}>
        <section id="faq-rentabilidad-ocupacion" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-6">Preguntas frecuentes</h2>
          <div className="space-y-6 text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            <div className="rounded-xl border border-white/10 bg-white/5 p-5 sm:p-6 space-y-3">
              <h3 className="text-white font-bold text-lg m-0">¿Qué tasa de utilización es saludable en una agencia?</h3>
              <p className="m-0">
                En la práctica, la referencia habitual del sector sitúa el rango óptimo entre el 70% y el 80%. Por debajo de ese umbral hay
                capacidad ociosa; por encima, el equipo empieza a generar costes ocultos por errores, retrabajo y burnout
                que erosionan el margen más rápido de lo que crece el ingreso.
                Lo notas cuando “todo va bien” hasta que un canal de equipo se queda en silencio y los entregables empiezan a
                llegar tarde.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-5 sm:p-6 space-y-3">
              <h3 className="text-white font-bold text-lg m-0">
                ¿Cómo sé si mi agencia está perdiendo rentabilidad por el context switching?
              </h3>
              <p className="m-0">
                El indicador más directo es comparar las horas estimadas con las reales en tus últimos 10 proyectos. Si la
                desviación media supera el 20%, el context switching y las interrupciones no planificadas son parte del
                problema. También puedes preguntar directamente al equipo cuántos proyectos lleva cada persona
                simultáneamente.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-5 sm:p-6 space-y-3">
              <h3 className="text-white font-bold text-lg m-0">¿Cuántas horas no facturables tiene de media una agencia?</h3>
              <p className="m-0">
                Depende mucho del modelo, pero en agencias de servicios creativos las horas no facturables pueden
                representar entre el 30% y el 50% del total de horas trabajadas. La forma de saberlo en tu caso es calcular
                el ratio: horas facturadas / horas totales trabajadas × 100.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-5 sm:p-6 space-y-3">
              <h3 className="text-white font-bold text-lg m-0">¿Qué diferencia hay entre ocupación y rentabilidad en una agencia?</h3>
              <p className="m-0">
                Ocupación mide el porcentaje de tiempo que el equipo está trabajando. Rentabilidad mide cuánto margen
                genera ese trabajo. Son variables distintas: un equipo puede estar al 100% de ocupación y tener márgenes
                negativos si hay mucho retrabajo, horas no facturables o scope creep no controlado.
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
