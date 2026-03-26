import { Link } from 'react-router-dom';
import { HeartPulse, Scale, ShieldAlert, BarChart3 } from 'lucide-react';
import { RevealOnScroll } from './RevealOnScroll';
import { BlogReadingTime } from './BlogReadingTime';
import { BlogTOC } from './BlogTOC';
import { BlogRelatedPost } from './BlogRelatedPost';
import type { BlogTOCItem } from './BlogTOC';
import { CargaTrabajoFrameworkVisual } from './CargaTrabajoFrameworkVisual';
import { SenalesCargaAlertaVisual } from './SenalesCargaAlertaVisual';

export interface GestionCargaTrabajoEquipoArticleProps {
  readingMinutes?: number;
  tocItems?: BlogTOCItem[];
  relatedPost?: { title: string; description: string; href: string };
}

export function GestionCargaTrabajoEquipoArticle({
  readingMinutes,
  tocItems,
  relatedPost,
}: GestionCargaTrabajoEquipoArticleProps) {
  return (
    <article
      id="gestion-carga-trabajo-equipo-sin-burnout"
      className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 md:py-16 text-left overflow-x-hidden"
    >
      <section className="mb-12 sm:mb-14">
        <div className="mb-6 text-center flex flex-col items-center gap-3">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-violet-300 bg-violet-500/20 border border-violet-400/30">
            Equipos y bienestar laboral
          </span>
          {readingMinutes != null && <BlogReadingTime minutes={readingMinutes} />}
        </div>
        <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-[2.75rem] font-black text-white mb-5 sm:mb-6 leading-[1.15] tracking-tight text-center">
          Cómo gestionar la carga de trabajo de tu equipo sin burnout
        </h1>
        <div className="space-y-4 text-indigo-100/95 text-base sm:text-lg leading-[1.75]">
          <p>
            Según datos que sintetizan informes recientes en torno a <strong>Gallup</strong> y{' '}
            <strong>Workhuman</strong> (2024), una mayoría muy amplia de personas encuestadas ha experimentado, al
            menos en algún momento, síntomas asociados al agotamiento profesional. En <strong>marketing</strong>,{' '}
            <strong>agencias</strong> y entornos creativos, los estudios sectoriales suelen situar la prevalencia de una
            sensación <em>crónica</em> de estar al límite en torno a <strong>cuatro de cada diez profesionales</strong>
            —con matices según muestra, país y metodología—, lo que convierte el tema en un riesgo operativo, no solo
            humano.
          </p>
          <p>
            El problema rara vez es que la gente «no trabaje suficiente». Lo habitual es que el trabajo esté{' '}
            <strong>mal distribuido</strong>, sin <strong>visibilidad</strong> real de quién lleva qué, y sin{' '}
            <strong>límites</strong> claros ante nuevas peticiones. Esta guía es una respuesta práctica a búsquedas como{' '}
            <em>gestionar carga de trabajo equipo</em>, <em>cómo evitar burnout en el trabajo</em>,{' '}
            <em>workload management</em> en equipos o <em>sobrecarga de trabajo empleados</em>: definiciones, señales,
            un <strong>framework</strong> de seis pasos, métricas y herramientas, sin perder de vista la{' '}
            <strong>distribución de tareas</strong> y la <strong>gestión de recursos humanos</strong> en una{' '}
            <strong>agencia</strong>.
          </p>
          <div className="rounded-2xl border-l-4 border-violet-400 bg-violet-500/10 border border-violet-500/20 p-4 sm:p-6 my-6">
            <p className="text-white/95 font-medium m-0">
              La <strong>planificación de proyectos</strong> (cronograma, dependencias y capacidad) es el contexto
              donde vive la carga: si quieres profundizar en ese mapa, empieza por{' '}
              <Link
                to="/blog/planificacion-proyectos-cronograma-recursos"
                className="text-violet-300 hover:text-white underline underline-offset-2"
              >
                planificación de proyectos
              </Link>
              . Los <Link
                to="/blog/kpis-agencias-marketing-2026"
                className="text-violet-300 hover:text-white underline underline-offset-2"
              >
                KPIs de rendimiento en agencias
              </Link>{' '}
              te ayudan a cerrar el círculo con números accionables; y la{' '}
              <Link to="/blog/ley-parkinson" className="text-violet-300 hover:text-white underline underline-offset-2">
                Ley de Parkinson y los plazos
              </Link>{' '}
              explica por qué, sin límites explícitos, el trabajo tiende a expandirse hasta ocupar todo el tiempo
              disponible.
            </p>
          </div>
        </div>
      </section>

      <RevealOnScroll>
        <section id="lo-que-aprenderas" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-4">
            Lo que aprenderás en este artículo
          </h2>
          <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-6">
            Tabla resumen para decidir si esta guía responde a tu búsqueda (y para ahorrarte scroll si ya dominas un
            bloque).
          </p>
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
            <table className="w-full text-left text-sm sm:text-base">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="p-3 sm:p-4 text-violet-200 font-semibold">Sección</th>
                  <th className="p-3 sm:p-4 text-violet-200 font-semibold">Qué cubre</th>
                  <th className="p-3 sm:p-4 text-violet-200 font-semibold">Te sirve si buscas…</th>
                </tr>
              </thead>
              <tbody className="text-indigo-100/90">
                <tr className="border-b border-white/10">
                  <td className="p-3 sm:p-4 font-medium text-white align-top">Carga de trabajo</td>
                  <td className="p-3 sm:p-4 align-top">Qué es el workload management y cómo se diferencia del resource management.</td>
                  <td className="p-3 sm:p-4 align-top">Definir bien el problema antes de «meter más gente».</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="p-3 sm:p-4 font-medium text-white align-top">Causas del burnout</td>
                  <td className="p-3 sm:p-4 align-top">Estructura (OMS/CIE-11) y seis causas organizativas frecuentes.</td>
                  <td className="p-3 sm:p-4 align-top">Por qué se produce el burnout en equipos más allá del «estrés puntual».</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="p-3 sm:p-4 font-medium text-white align-top">Señales de alerta</td>
                  <td className="p-3 sm:p-4 align-top">Conducta observable + métricas (utilización, plazos, criticidad).</td>
                  <td className="p-3 sm:p-4 align-top">Cómo saber si mi equipo está saturado antes del cuelgue.</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="p-3 sm:p-4 font-medium text-white align-top">Framework de 6 pasos</td>
                  <td className="p-3 sm:p-4 align-top">De la visibilidad a la revisión periódica, con Eisenhower y timeboxing.</td>
                  <td className="p-3 sm:p-4 align-top">Priorizar tareas en equipo y repartir trabajo con criterio.</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="p-3 sm:p-4 font-medium text-white align-top">Manager + crisis</td>
                  <td className="p-3 sm:p-4 align-top">Liderazgo, seguridad psicológica y qué hacer si el burnout ya está instalado.</td>
                  <td className="p-3 sm:p-4 align-top">Prevenir rotación de personal y recuperar confianza.</td>
                </tr>
                <tr>
                  <td className="p-3 sm:p-4 font-medium text-white align-top">Métricas y herramientas</td>
                  <td className="p-3 sm:p-4 align-top">Tabla de KPIs de carga/bienestar y categorías de software neutras.</td>
                  <td className="p-3 sm:p-4 align-top">Herramientas para gestionar carga de trabajo sin sesgo de marca.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </RevealOnScroll>

      {tocItems != null && tocItems.length > 0 && (
        <div className="mb-12">
          <BlogTOC items={tocItems} />
        </div>
      )}

      <RevealOnScroll>
        <section id="que-es-carga-trabajo" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6">
            ¿Qué es realmente la carga de trabajo? (y por qué no es solo «tener mucho trabajo»)
          </h2>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            <p>
              Muchos equipos confunden <strong>carga alta</strong> con <strong>carga mal gestionada</strong>. No es lo
              mismo tener un trimestre intenso con picos planificados que vivir en permanente urgencia porque nadie sabe,
              en una sola vista, quién está al límite. El <strong>workload management</strong> es el proceso de{' '}
              <strong>planificar, distribuir y monitorizar</strong> tareas entre un equipo para que cada persona tenga un
              volumen razonable y sostenible en el tiempo. En una <strong>agencia de marketing</strong>, eso incluye
              campañas, creatividades, informes, reuniones con cliente y el «coste oculto» de coordinación.
            </p>
            <p>
              Desde la perspectiva de <strong>employee wellbeing</strong> y <strong>gestión de recursos humanos</strong>,
              el workload no es un detalle operativo menor: es la interfaz entre promesas comerciales y capacidad humana.
              Cuando esa interfaz falla, aparecen síntomas que el lenguaje médico asocia al <strong>síndrome del
              trabajador quemado</strong>, pero la palanca efectiva sigue siendo organizativa: expectativas, prioridades y
              justicia en el reparto. Los <strong>managers</strong> que trabajan un <strong>workload balance</strong>{' '}
              explícito suelen combinar mejor <strong>bienestar laboral</strong> y <strong>productividad</strong> porque
              reducen trabajo duplicado, esperas y rehacer entregables.
            </p>
            <p>
              Cuando alguien pregunta por <strong>employee wellbeing</strong> o <strong>bienestar laboral</strong> en
              relación con la <strong>productividad</strong>, la respuesta útil no es «más mindfulness»: es{' '}
              <strong>capacidad de equipo</strong> visible y <strong>planificación</strong> que respete límites humanos.
              Sin ese mapa, aparece el <strong>síndrome del trabajador quemado</strong> como síntoma organizativo, no
              como fallo individual de «resiliencia».
            </p>
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-white mt-8 mb-3">
            Diferencia entre workload management y resource management
          </h3>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            <p>
              <strong>Workload</strong> responde a <em>cómo</em> se asignan las tareas en el día a día: quién hace qué,
              esta semana, con qué prioridad y qué depende de qué. <strong>Resource management</strong> responde a{' '}
              <em>qué</em> se necesita para hacerlas: personas con ciertas habilidades, presupuesto, horas contratadas,
              mix junior/senior. Los dos forman un <strong>bucle continuo</strong>: si solo miras recursos en Excel sin
              mirar la cola de tareas real, tendrás «capacidad teórica» y caos operativo; si solo miras tareas sin
              encajar con coste y habilidades, tendrás burn rate y márgenes rotos.
            </p>
            <p>
              En la práctica de <strong>gestión de recursos humanos en agencia</strong>, el error típico es mezclar ambos
              en la misma reunión sin acuerdo de qué decisión se toma: contratación (recurso) frente a repriorización
              (carga). Separar el lenguaje ya reduce fricción.
            </p>
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-white mt-8 mb-3">
            Por qué la carga mal distribuida destruye equipos
          </h3>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            <p>
              En el sector se ha comentado durante años un patrón que suena a exageración pero es demasiado frecuente para
              ignorarlo: en equipos de tamaño medio, una fracción pequeña de personas acaba arrastrando la mayor parte
              del trabajo crítico —no porque sean «los únicos válidos», sino porque son los que dicen que sí, los que
              tienen el conocimiento tribal o los que el cliente pide por nombre. Eso no es siempre falta de{' '}
              <strong>recursos</strong>; muchas veces es falta de <strong>visibilidad</strong> y de reglas de reparto.
            </p>
            <p>
              La <strong>carga laboral excesiva</strong> concentra riesgo: un solo punto de fallo, cuellos de botella en
              revisiones creativas o en cuentas clave, y una percepción de <strong>injusticia</strong> («yo no puedo
              decir que no») que erosiona la confianza. Un <strong>workload balance</strong> sano para{' '}
              <strong>managers</strong> implica que las tareas <strong>críticas</strong> no vivan siempre en las mismas
              dos cabezas.
            </p>
          </div>
        </section>
      </RevealOnScroll>

      <RevealOnScroll delay={1}>
        <section id="causas-burnout-equipos" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6">
            Las causas reales del burnout (que los managers no suelen ver)
          </h2>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            <p>
              El <strong>estrés puntual</strong> (una lanzamiento, un pico de campaña) puede ser intenso y, aun así,
              sostenible si hay recuperación y claridad. El <strong>burnout</strong> es otra cosa: agotamiento
              prolongado con distanciamiento del trabajo y sensación de baja eficacia. La <strong>OMS</strong>, en la{' '}
              <strong>CIE-11</strong>, lo reconoce como <strong>fenómeno ocupacional</strong> vinculado al entorno
              laboral —no como un simple diagnóstico médico aislado—, lo que empuja la responsabilidad hacia la{' '}
              <strong>organización</strong> y el diseño del trabajo.
            </p>
            <p>
              Tres dimensiones habituales en marcos clínicos y organizativos: <strong>agotamiento emocional</strong>,{' '}
              <strong>despersonalización</strong> o cinismo hacia el trabajo, y <strong>baja realización personal</strong>{' '}
              (sensación de no rendir como antes). Para SEO y para tu equipo, esto responde a consultas del tipo{' '}
              <em>causas del burnout laboral</em> o <em>por qué se produce el burnout en equipos</em>: no es solo «muchas
              horas», es un cóctel de demandas y carencias de apoyo.
            </p>
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-white mt-8 mb-4">Las seis causas estructurales del burnout en equipos</h3>
          <ol className="list-decimal list-inside space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed marker:text-violet-300">
            <li>
              <strong className="text-white">Sobrecarga de trabajo real:</strong> más tareas o más alcance del que cabe en
              el tiempo disponible, sin ajuste de plazos ni de expectativas. Muy relacionado con{' '}
              <strong>sobrecarga de trabajo empleados</strong> medida en backlog, no solo en horas declaradas.
            </li>
            <li>
              <strong className="text-white">Delegación inadecuada:</strong> el reparto inicial falla: se asigna a quien
              «ya lo hizo bien una vez», reforzando cuellos de botella en lugar de desarrollar autonomía en el resto.
            </li>
            <li>
              <strong className="text-white">Falta de autonomía:</strong> microgestión, cambios de prioridad cada hora o
              imposibilidad de decidir cómo ejecutar el trabajo. La sensación de no controlar el propio día alimenta el
              agotamiento.
            </li>
            <li>
              <strong className="text-white">Ausencia de reconocimiento:</strong> el esfuerzo no se nombra; solo se habla
              cuando algo falla. La recompensa percibida cae y con ella la motivación intrínseca.
            </li>
            <li>
              <strong className="text-white">Objetivos inalcanzables o cambiantes:</strong> el <strong>scope creep</strong>{' '}
              (alcance que crece sin contrato ni tiempo) es uno de los generadores más silenciosos de horas no planificadas.
            </li>
            <li>
              <strong className="text-white">Desequilibrio vida–trabajo:</strong> especialmente en remoto o híbrido mal
              gobernado, donde los límites espacio/tiempo se diluyen y la disponibilidad se interpreta como disponibilidad
              infinita.
            </li>
          </ol>
          <p className="text-indigo-200/80 text-sm sm:text-base mt-6 italic">
            En <strong>burnout en agencias de marketing</strong>, las causas 1, 5 y 6 suelen aparecer juntas: plazos
            agresivos, peticiones fuera de alcance y cultura de respuesta inmediata en canales abiertos.
          </p>
        </section>
      </RevealOnScroll>

      <RevealOnScroll delay={2}>
        <section id="senales-equipo-riesgo" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6">
            Cómo detectar que tu equipo está en riesgo: señales de alerta tempranas
          </h2>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            <p>
              Este bloque concentra intención de búsqueda: <em>señales de burnout en el equipo</em>,{' '}
              <em>cómo saber si mi equipo está saturado</em>, <em>señales de sobrecarga laboral</em>. La clave es
              combinar <strong>lo que se ve</strong> en el día a día con <strong>lo que se mide</strong> sin esperar a
              que alguien pida ayuda en voz alta —porque muchas personas aguantan en silencio por miedo a parecer
              incapaces o por inseguridad laboral.
            </p>
          </div>

          <div className="my-8">
            <SenalesCargaAlertaVisual />
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-white mt-8 mb-3">Señales conductuales (las que se ven)</h3>
          <ul className="space-y-3 text-indigo-100/90 text-base sm:text-lg leading-relaxed list-disc list-inside marker:text-violet-400">
            <li>Irritabilidad, cambios de humor o aislamiento en canales donde antes participaban.</li>
            <li>Llegadas tarde, absentismo o <strong>presentismo</strong> improductivo (en el sitio, pero sin entregar).</li>
            <li>Menor calidad o más retrabajo en entregables que antes salían bien a la primera.</li>
            <li>Reducción de participación en reuniones o en dinámicas de equipo; respuestas mínimas.</li>
          </ul>

          <h3 className="text-lg sm:text-xl font-bold text-white mt-8 mb-3">Señales métricas (las que se miden)</h3>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            <p>
              Aquí el artículo gana profundidad frente a textos genéricos de <strong>RR.HH.</strong> Los datos no
              sustituyen la conversación, pero evitan que el manager dependa solo del «¿todo bien?» en el pasillo
              virtual.
            </p>
            <ul className="space-y-3 list-disc list-inside marker:text-violet-400">
              <li>
                <strong className="text-white">Volumen de tareas por persona:</strong> si alguien tiene el doble (o más)
                de tickets/tareas abiertas que la mediana del equipo, revisa si es rol, si es conocimiento único o si es
                desequilibrio evitable.
              </li>
              <li>
                <strong className="text-white">Tiempo estimado vs tiempo real:</strong> desviaciones sistemáticas indican
                sobrecarga, mala estimación o interrupciones no contabilizadas.
              </li>
              <li>
                <strong className="text-white">Número de tareas críticas por persona:</strong> no todo pesa igual; tres
                tareas «normales» pueden ser menos arriesgadas que dos con cliente en riesgo y fecha fija.
              </li>
              <li>
                <strong className="text-white">Cumplimiento de deadlines:</strong> una caída sostenida del cumplimiento
                suele señalar saturación o dependencias externas no gestionadas.
              </li>
              <li>
                <strong className="text-white">Tasa de utilización:</strong> porcentaje de tiempo dedicado a trabajo
                productivo o facturable frente a capacidad neta. En agencias, un rango orientativo «saludable» para muchos
                perfiles de producción suele situarse en torno al <strong>70–80%</strong>; por encima del{' '}
                <strong>85% de forma sostenida</strong>, el riesgo de error, conflicto y rotación crece. Ajusta según tu
                modelo (cuentas, creatividad, consultoría).
              </li>
            </ul>
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-white mt-8 mb-3">El problema silencioso: el burnout que no se verbaliza</h3>
          <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            Si nadie se queja, no implica que la <strong>carga laboral</strong> esté bien; puede implicar que nadie se
            atreve. El manager debe aprender a leer <strong>métricas de carga</strong> y señales conductuales antes del
            colapso. Complementa con preguntas directas en 1:1 («del 1 al 5, ¿cómo ves tu carga esta semana?») y con
            anonimato en encuestas puntuales si la cultura aún no es segura.
          </p>
          <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            Cruza siempre datos con contexto: una persona con muchas horas registradas puede estar en formación o en
            shadowing; otra con pocas horas puede estar bloqueada esperando feedback. La pregunta útil no es solo «¿cuánto
            trabaja?», sino «¿el flujo de trabajo permite terminar sin fricción excesiva?». Ahí es donde confluyen{' '}
            <strong>workload management</strong> y una <strong>planificación de proyectos</strong> seria: sin dependencias
            resueltas y sin ventanas de revisión, la <strong>sobrecarga de trabajo empleados</strong> se disfraza de mala
            planificación individual.
          </p>
        </section>
      </RevealOnScroll>

      <RevealOnScroll>
        <section id="framework-gestion-sostenible" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6 flex flex-wrap items-center gap-2">
            <Scale className="h-8 w-8 text-violet-400 shrink-0" aria-hidden />
            Framework para gestionar la carga de trabajo de forma sostenible
          </h2>
          <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-8">
            Corazón práctico del texto: seis pasos que puedes implementar sin esperar a un cambio de herramienta. Encajan
            con <strong>cómo repartir el trabajo equitativamente</strong> en sentido <em>justo</em> (no necesariamente
            igualitario): según capacidad, habilidad y momento vital del profesional.
          </p>

          <div className="mb-10">
            <CargaTrabajoFrameworkVisual />
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-white mt-8 mb-3">Paso 1: Haz visible lo invisible (mapea la carga real)</h3>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            <p>
              Antes de redistribuir, necesitas una foto común: tareas, <strong>estimaciones</strong>, responsables,
              dependencias y fechas. Puede ser un <strong>diagrama de Gantt</strong>, un tablero <strong>Kanban</strong> con
              WIP limits, o una hoja compartida si el equipo es pequeño. El objetivo es detectar «cuellos de botella
              humanos»: personas a las que siempre les caen los proyectos críticos. Esto conecta directamente con una buena{' '}
              <Link
                to="/blog/planificacion-proyectos-cronograma-recursos"
                className="text-violet-300 hover:text-white underline underline-offset-2"
              >
                planificación de proyectos
              </Link>{' '}
              donde cronograma y recursos no vivan en silos.
            </p>
            <p>
              Sin visibilidad, las decisiones de contratación o de venta son a ciegas: compras capacidad que no llega a
              aliviar a quien está saturado porque el cuello es de coordinación o de conocimiento.
            </p>
            <p>
              En equipos híbridos o remotos, el mapa debe incluir también reuniones recurrentes, handovers y tiempo de
              lectura de briefs: lo que en muchas hojas aparece como «cero horas» pero consume capacidad real. Cuando ese
              trabajo invisible no se nombra, la <strong>planificación</strong> parece realista y el equipo vive en
              permanente desfase. Un ritual simple —revisar cada viernes la foto de la semana siguiente— ya reduce
              sorpresas y mejora la <strong>distribución de tareas en equipo</strong> porque las conversaciones incómodas
              ocurren antes del lunes.
            </p>
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-white mt-8 mb-3">Paso 2: Diferencia urgente de importante (matriz de Eisenhower en equipo)</h3>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            <p>
              La <strong>matriz de Eisenhower</strong> no es solo para individuos. En equipo, el líder debe traducirla a
              decisiones explícitas: <strong>Urgente + importante</strong> → hacer ahora con dueño claro.{' '}
              <strong>Importante + no urgente</strong> → planificar (mejora de procesos, formación, deep work creativo).{' '}
              <strong>Urgente + no importante</strong> → delegar, automatizar o reducir frecuencia.{' '}
              <strong>Ni urgente ni importante</strong> → eliminar sin culpa.
            </p>
            <p>
              Muchos equipos viven atrapados en el cuadrante de <strong>urgencia permanente</strong>: es la antesala del
              burnout. Combatirla es política: proteger bloques para lo importante antes de que se incendie todo. La{' '}
              <Link to="/blog/ley-parkinson" className="text-violet-300 hover:text-white underline underline-offset-2">
                Ley de Parkinson y los plazos
              </Link>{' '}
              explica por qué, sin límites de tiempo, las tareas se hinchan: acota plazos y alcance a la vez.
            </p>
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-white mt-8 mb-3">Paso 3: Redistribuye la carga con criterio (no al azar)</h3>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            <p>
              <strong>Cómo priorizar tareas en equipo</strong> no es solo ordenar una lista: es alinear con{' '}
              <strong>capacidad disponible real</strong> (no la teórica de contrato), <strong>habilidades</strong>,
              afinidad con el tipo de trabajo y <strong>estado actual</strong> de la persona. No es lo mismo asignar a
              alguien que acaba de cerrar un lanzamiento largo que a alguien que lleva semanas en modo mantenimiento.
            </p>
            <p>
              Repartir «para que todos tengan lo mismo» en número de tareas puede ser injusto si las criticidades difieren.
              Mejor: reparto explícito de <strong>tareas críticas</strong> y rotación de roles de apoyo para reducir
              dependencia de estrellas silenciosas.
            </p>
            <p>
              Documenta decisiones de reparto en un lugar único (nota de proyecto, comentario en herramienta o acta breve)
              para que no dependan de memoria oral. Eso reduce conflictos del tipo «pensaba que esto lo llevaba X» y
              permite auditar, semanas después, si la <strong>carga laboral</strong> fue equitativa en sentido de riesgo,
              no solo en número de tickets. En <strong>agencias de marketing</strong>, donde cuentas y creativos comparten
              deadlines, esa trazabilidad es un antídoto contra la sobrecarga selectiva de un solo perfil.
            </p>
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-white mt-8 mb-3">Paso 4: Aprende a decir que no como equipo</h3>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            <p>
              En agencias, el patrón tóxico es aceptar todo lo que pide el cliente o el comercial. El manager debe ser
              <strong> cortafuegos</strong>. El <strong>scope creep</strong> absorbe horas invisibles que nadie planificó
              y destruye la confianza interna («otra vez prometieron sin preguntar»).
            </p>
            <p>
              Técnica práctica antes de aceptar un nuevo encargo: <em>«¿Qué dejamos de hacer para poder hacer esto?»</em>.
              Si no hay respuesta, no hay capacidad: hay que negociar fecha, alcance o recursos. Esto es gestión adulta de
              <strong> workload management</strong>, no falta de espíritu de servicio.
            </p>
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-white mt-8 mb-3">Paso 5: Crea ritmos de trabajo con bloques de tiempo protegidos</h3>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            <p>
              El <strong>timeboxing</strong> consiste en asignar un tiempo máximo a una tarea o bloque de trabajo y tratar
              ese límite como parte del método, no como sugerencia decorativa. En equipo, se combina con calendario:
              bloques de <strong>deep work</strong>, días con menos reuniones internas, y <strong>buffers</strong> entre
              proyectos para absorber imprevistos sin romper la semana entera.
            </p>
            <p>
              No hace falta dogmatismo: hace falta acuerdo cultural de que es legítimo estar en foco sin responder al
              instante. Eso reduce la sensación de urgencia constante y protege la capacidad cognitiva —especialmente en
              perfiles que crean o analizan. Si quieres la base conceptual, el artículo{' '}
              <Link to="/blog/que-es-timeboxing" className="text-violet-300 hover:text-white underline underline-offset-2">
                Qué es el timeboxing
              </Link>{' '}
              profundiza en la técnica; aquí la usamos como palanca de <strong>prevención de burnout</strong> por diseño
              del tiempo.
            </p>
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-white mt-8 mb-3">Paso 6: Revisa la carga periódicamente (no solo en crisis)</h3>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            <p>
              Instaura un <strong>weekly load check</strong> breve (diez minutos en 1:1 o en standup ampliado): escala del
              1 al 5 sobre carga, cuellos de botella y una sola acción de desbloqueo. Repite a nivel de equipo quincenal
              para ver distribución, no solo promedios individuales.
            </p>
            <p>
              Si solo hablas de carga cuando alguien «explota», hablarás siempre demasiado tarde. La revisión periódica es
              lo que diferencia un sistema de <strong>prevención</strong> de un parche emocional.
            </p>
          </div>
        </section>
      </RevealOnScroll>

      <RevealOnScroll delay={1}>
        <section id="rol-manager-equipo" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6 flex flex-wrap items-center gap-2">
            <HeartPulse className="h-8 w-8 text-rose-400 shrink-0" aria-hidden />
            El rol del manager: liderar sin quemar al equipo
          </h2>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            <p>
              El burnout no es solo un problema individual: es <strong>liderazgo</strong> y <strong>cultura</strong>.
              Directores de agencia y managers intermedios son quienes modelan si está permitido proteger el foco, si se
              negocia el alcance y si el reconocimiento existe fuera de los picos de crisis.
            </p>
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-white mt-8 mb-3">Feedback constante, no solo cuando algo falla</h3>
          <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            Los informes que relacionan <strong>feedback frecuente</strong> con menor probabilidad de agotamiento
            apuntan a diferencias del orden de <strong>decenas de puntos porcentuales</strong> entre quienes reciben
            comentarios regulares y quienes solo escuchan crítica en incidentes. El reconocimiento no tiene que ser solo
            vertical: fomentar que fluya entre pares reduce la carga emocional del líder y normaliza el buen trabajo
            invisible (documentación, handover, mejora de procesos).
          </p>

          <h3 className="text-lg sm:text-xl font-bold text-white mt-8 mb-3">Crear un entorno psicológicamente seguro</h3>
          <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            Que alguien pueda decir <em>«no puedo con esto esta semana»</em> sin castigo inmediato no es debilidad: es
            información temprana. Si el equipo solo dice «sí», o bien la carga es irrealmente baja —poco probable en una
            agencia— o bien la gente se autocensura. Señal de alarma: cero quejas + métricas de saturación altas.
          </p>

          <h3 className="text-lg sm:text-xl font-bold text-white mt-8 mb-3">Flexibilidad como herramienta de prevención</h3>
          <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            Horarios flexibles, remoto razonable y pausas protegidas funcionan cuando son parte del <strong>sistema</strong>{' '}
            de gestión de carga, no cuando son «beneficios» que contradicen expectativas de disponibilidad 24/7. La
            flexibilidad mal comunicada genera culpa: se promete libertad y se premia la permanencia conectada.
          </p>
        </section>
      </RevealOnScroll>

      <RevealOnScroll delay={2}>
        <section id="burnout-instalado" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6 flex flex-wrap items-center gap-2">
            <ShieldAlert className="h-8 w-8 text-amber-400 shrink-0" aria-hidden />
            Burnout ya instalado: qué hacer cuando es demasiado tarde para prevenir
          </h2>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            <p>
              Responde a búsquedas del tipo <em>qué hacer si mi equipo tiene burnout</em> o{' '}
              <em>cómo recuperar un equipo quemado</em>. Primero: dejar de minimizar. Segundo: actuar en tres frentes —
              carga, expectativas y apoyo — en paralelo, no en serie.
            </p>
            <ol className="list-decimal list-inside space-y-3 marker:text-amber-300">
              <li>
                <strong className="text-white">Normalizar la conversación</strong> sin tabúes ni juicio moral; el burnout
                es señal de sistema, no de «falta de actitud».
              </li>
              <li>
                <strong className="text-white">Redistribución inmediata</strong> de lo urgente; quitar peso real, no solo
                «ánimo».
              </li>
              <li>
                <strong className="text-white">Revisar objetivos y plazos</strong>: ¿son realistas con la capacidad
                disponible hoy?
              </li>
              <li>
                <strong className="text-white">Descanso o reducción temporal de carga</strong> donde sea posible (días,
                rebalanceo de cuenta, pausa de iniciativas no críticas).
              </li>
              <li>
                <strong className="text-white">Apoyo profesional</strong> si el caso es grave: orientación psicológica o
                recursos de salud laboral, según país y políticas de la empresa.
              </li>
            </ol>
            <p>
              No basta con fruta en la oficina o una suscripción genérica a meditación si la estructura de trabajo sigue
              exigiendo disponibilidad total y alcance infinito. Los parches cosméticos sin cambios en reparto y
              prioridades suelen empeorar el cinismo («otro programa de bienestar»).
            </p>
          </div>
        </section>
      </RevealOnScroll>

      <RevealOnScroll>
        <section id="metricas-carga-equipo" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6 flex flex-wrap items-center gap-2">
            <BarChart3 className="h-8 w-8 text-emerald-400 shrink-0" aria-hidden />
            Métricas que todo manager debería tener controladas
          </h2>
          <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-6">
            Bloque muy buscado en español: <em>cómo medir la carga de trabajo del equipo</em>,{' '}
            <em>KPIs de bienestar laboral</em>, <em>tasa de utilización empleados</em>. La tabla resume qué vigilar; los
            umbrales son orientativos: calibra con tu tipo de agencia y con los{' '}
            <Link to="/blog/kpis-agencias-marketing-2026" className="text-violet-300 hover:text-white underline underline-offset-2">
              KPIs de rendimiento en agencias
            </Link>{' '}
            que ya uses.
          </p>
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
            <table className="w-full text-left text-sm sm:text-base">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="p-3 sm:p-4 text-emerald-200 font-semibold">Métrica</th>
                  <th className="p-3 sm:p-4 text-emerald-200 font-semibold">Qué mide</th>
                  <th className="p-3 sm:p-4 text-emerald-200 font-semibold">Señal de alarma (orientativa)</th>
                </tr>
              </thead>
              <tbody className="text-indigo-100/90">
                <tr className="border-b border-white/10">
                  <td className="p-3 sm:p-4 font-medium text-white align-top">Tasa de utilización</td>
                  <td className="p-3 sm:p-4 align-top">% de tiempo productivo o facturable sobre capacidad neta.</td>
                  <td className="p-3 sm:p-4 align-top">&gt;85% de forma sostenida.</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="p-3 sm:p-4 font-medium text-white align-top">Tiempo estimado vs real</td>
                  <td className="p-3 sm:p-4 align-top">Precisión de planificación y calidad de estimaciones.</td>
                  <td className="p-3 sm:p-4 align-top">Desviación sistemática &gt;30% sin corrección de proceso.</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="p-3 sm:p-4 font-medium text-white align-top">Cumplimiento de deadlines</td>
                  <td className="p-3 sm:p-4 align-top">Capacidad real frente a compromisos.</td>
                  <td className="p-3 sm:p-4 align-top">Caída sostenida en el ratio de entregas a tiempo.</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="p-3 sm:p-4 font-medium text-white align-top">Tareas críticas por persona</td>
                  <td className="p-3 sm:p-4 align-top">Distribución de riesgo y dependencia de «héroes».</td>
                  <td className="p-3 sm:p-4 align-top">Concentración crónica en 1–2 personas.</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="p-3 sm:p-4 font-medium text-white align-top">Rotación voluntaria</td>
                  <td className="p-3 sm:p-4 align-top">Satisfacción y sostenibilidad del modelo de trabajo.</td>
                  <td className="p-3 sm:p-4 align-top">&gt;15–20% anual (según sector y contexto).</td>
                </tr>
                <tr>
                  <td className="p-3 sm:p-4 font-medium text-white align-top">Absentismo</td>
                  <td className="p-3 sm:p-4 align-top">Salud y agotamiento (junto a otros factores).</td>
                  <td className="p-3 sm:p-4 align-top">Picos repetidos o patrones por persona/equipo.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </RevealOnScroll>

      <RevealOnScroll delay={1}>
        <section id="herramientas-workload" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6">
            Herramientas útiles para gestionar la carga de trabajo (visión por categorías)
          </h2>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            <p>
              Sin recomendar una sola marca: lo que importa es que la herramienta responda a un vacío concreto de{' '}
              <strong>visibilidad</strong>, <strong>límites</strong> o <strong>feedback</strong>.
            </p>
            <ul className="space-y-3 list-disc list-inside marker:text-violet-400">
              <li>
                <strong className="text-white">Planificadores de tareas y tableros visuales:</strong> ver carga de un
                vistazo, límites WIP, estados claros.
              </li>
              <li>
                <strong className="text-white">Gestores de tiempo y reportes de horas:</strong> cruzar estimación vs
                realidad y alimentar la utilización.
              </li>
              <li>
                <strong className="text-white">Diagramas de Gantt:</strong> dependencias y solapes entre proyectos
                complejos.
              </li>
              <li>
                <strong className="text-white">Encuestas de clima y bienestar:</strong> pulso anónimo antes de que el
                malestar sea público.
              </li>
              <li>
                <strong className="text-white">Comunicación asíncrona bien usada:</strong> reducir presión de respuesta
                inmediata con normas de canal y expectativas de tiempo de respuesta.
              </li>
            </ul>
            <p className="text-sm text-indigo-200/80">
              Este bloque puede ampliarse en el futuro con menciones puntuales a producto sin reescribir el resto del
              artículo.
            </p>
            <p>
              En la práctica, la mayoría de equipos necesita al menos <strong>dos capas</strong>: una donde viva el flujo
              de trabajo (tareas y estados) y otra donde viva el <strong>tiempo</strong> (horas, utilización, estimación
              vs real). Si esas capas no hablan entre sí, el manager acaba reconciliando a mano y el sistema vuelve a
              depender de heroísmo. Las <strong>encuestas de clima</strong> bien diseñadas —cortas, frecuentes y con
              espacio para comentario libre opcional— actúan como termómetro cuando las métricas aún no muestran el
              problema. La <strong>comunicación asíncrona</strong>, por su parte, solo reduce el estrés si hay normas
              explícitas: qué canal es para urgencias reales, qué tiempo de respuesta es razonable por tipo de mensaje y
              cuándo se espera disponibilidad sincrónica. Sin esas reglas, «async» se convierte en «siempre encendido».
            </p>
          </div>
        </section>
      </RevealOnScroll>

      <RevealOnScroll delay={2}>
        <section id="conclusion-gestion-carga" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6">Conclusión</h2>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            <p>
              El <strong>burnout</strong> no es un problema de actitud ni de resistencia personal en solitario: es, con
              frecuencia, una <strong>señal organizativa</strong> de que la <strong>distribución del trabajo</strong> y
              los <strong>límites</strong> no están funcionando. La buena noticia es que tiene palancas claras: visibilidad,
              priorización explícita, reparto con criterio, cortafuegos ante el alcance, ritmos de foco y revisión
              periódica de carga —además de métricas que hablen antes que el silencio.
            </p>
            <p>
              <strong>Próxima acción:</strong> comparte este artículo con tu equipo directo o dedica los próximos diez
              minutos de tu reunión semanal a una sola pregunta: «¿Quién está por encima de su capacidad sostenible y qué
              quitamos o movemos esta semana?». Si la respuesta es incómoda, probablemente sea la correcta.
            </p>
            <p>
              Si llevas tiempo posponiendo este tema, empieza por un solo paso del framework —normalmente{' '}
              <strong>visibilidad</strong>— y mide durante dos semanas. Los datos humildes (una tabla compartida con
              tareas y horas) baten a menudo a la perfección aspiracional de un tablero nadie actualiza. La meta no es el
              documento: es que la conversación sobre <strong>carga</strong> deje de ser tabú y pase a ser un hábito de
              gestión tan habitual como revisar el pipeline comercial.
            </p>
          </div>
        </section>
      </RevealOnScroll>

      <RevealOnScroll>
        <section id="faq-gestion-carga-trabajo" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-6">Preguntas frecuentes</h2>
          <div className="space-y-6 text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            <div className="rounded-xl border border-white/10 bg-white/5 p-5 sm:p-6">
              <h3 className="text-white font-bold text-lg mb-2">¿Cuánto es demasiada carga de trabajo?</h3>
              <p className="m-0">
                Depende del rol, pero señales útiles: utilización sostenida muy por encima del ~85%, desviaciones
                sistemáticas estimado/real, aumento de retrabajo y caída de cumplimiento de plazos. Lo «demasiado» es
                cuando la carga deja de ser puntual y pasa a ser estructural sin ventanas de recuperación.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-5 sm:p-6">
              <h3 className="text-white font-bold text-lg mb-2">¿Cómo sé si mi equipo tiene burnout?</h3>
              <p className="m-0">
                Combina señales conductuales (cansancio, cinismo, baja calidad, aislamiento) con datos (plazos, carga por
                persona, criticidad). No esperes a la confesión explícita: pregunta de forma regular y crea canales
                seguros.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-5 sm:p-6">
              <h3 className="text-white font-bold text-lg mb-2">¿Qué diferencia hay entre estrés y burnout?</h3>
              <p className="m-0">
                El estrés agudo puede movilizar; suele tener un «después» de alivio. El burnout es más crónico: agotamiento
                sostenido, desconexión del trabajo y sensación de baja eficacia. Requiere cambios de carga y de sistema,
                no solo «aguantar».
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-5 sm:p-6">
              <h3 className="text-white font-bold text-lg mb-2">¿Cómo repartir tareas equitativamente en una agencia?</h3>
              <p className="m-0">
                Equitativo no siempre es «el mismo número»: reparte según capacidad neta, habilidad, criticidad y momento
                del proyecto. Usa visibilidad común y rota exposición a tareas de alto riesgo para no depender siempre de
                las mismas personas.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-5 sm:p-6">
              <h3 className="text-white font-bold text-lg mb-2">¿Qué herramienta es imprescindible para workload management?</h3>
              <p className="m-0">
                Ninguna por sí sola. Lo imprescindible es un acuerdo de equipo sobre dónde vive la verdad (tablero, hoja,
                ERP) y disciplina de actualización. Elige categorías (tareas, horas, Gantt, encuestas) según tu punto
                ciego principal.
              </p>
            </div>
          </div>
        </section>
      </RevealOnScroll>

      <RevealOnScroll delay={1}>
        <section id="cta-gestion-carga" className="text-center mt-12 mb-8 scroll-mt-24">
          <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto mb-8">
            Si quieres seguir en la misma línea operativa —métricas concretas y decisiones que se pueden tomar en
            comité—, el siguiente paso natural es revisar los{' '}
            <Link to="/blog/kpis-agencias-marketing-2026" className="text-violet-300 hover:text-white underline underline-offset-2">
              KPIs de rendimiento en agencias
            </Link>{' '}
            o profundizar en{' '}
            <Link
              to="/blog/planificacion-proyectos-cronograma-recursos"
              className="text-violet-300 hover:text-white underline underline-offset-2"
            >
              planificación de proyectos
            </Link>
            .
          </p>
          {relatedPost != null && (
            <div className="max-w-xl mx-auto mb-8">
              <BlogRelatedPost
                title={relatedPost.title}
                description={relatedPost.description}
                href={relatedPost.href}
              />
            </div>
          )}
          <p className="text-indigo-300 text-sm italic m-0">
            Escrito por el equipo de Taimbox — Guías de planificación y gestión de equipos para agencias.
          </p>
        </section>
      </RevealOnScroll>
    </article>
  );
}
