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
        <div className="space-y-5 text-indigo-100/95 text-base sm:text-lg leading-[1.75]">
          <p>
            Los informes de <strong>Gallup</strong> y <strong>Workhuman</strong> (2024) dibujan un panorama duro: una
            mayoría muy amplia de personas dice haber sentido, al menos una vez, síntomas de agotamiento profesional. En
            marketing y agencias, además, no es raro encontrar equipos donde casi la mitad describe una tensión{' '}
            <em>constante</em>, no un mal mes puntual. Ahí el problema deja de ser «anecdótico» y pasa a ser de{' '}
            <strong>operaciones</strong> y de <strong>personas</strong> a la vez.
          </p>
          <p>
            Lo que falla casi nunca es que «no se trabaje». Lo que falla es que el trabajo está{' '}
            <strong>mal repartido</strong>, que nadie ve de un vistazo quién arrastra qué, y que faltan{' '}
            <strong>límites</strong> claros cuando entra una petición nueva. Abajo vas a encontrar definiciones que
            aclaran el lío entre «quién hace qué» y «con qué medios», señales para detectar saturación antes del colapso, un marco de seis
            pasos que puedes robar para tu próxima reunión, y una tabla de métricas para dejar de adivinar.
          </p>
          <div className="rounded-2xl border-l-4 border-violet-400 bg-violet-500/10 border border-violet-500/20 p-4 sm:p-6 my-6">
            <p className="text-white/95 font-medium m-0">
              La carga no flota en el vacío: vive dentro de la <strong>planificación de proyectos</strong> —fechas,
              dependencias, quién puede cuando—. Si quieres ese mapa con calma, está todo hilado en{' '}
              <Link
                to="/blog/planificacion-proyectos-cronograma-recursos"
                className="text-violet-300 hover:text-white underline underline-offset-2"
              >
                planificación de proyectos
              </Link>
              . Para cerrar con cifras que sirvan en una reunión de números, los{' '}
              <Link
                to="/blog/kpis-agencias-marketing-2026"
                className="text-violet-300 hover:text-white underline underline-offset-2"
              >
                KPIs de rendimiento en agencias
              </Link>{' '}
              van al detalle. Y si te frustra que todo «se alargue», la{' '}
              <Link to="/blog/ley-parkinson" className="text-violet-300 hover:text-white underline underline-offset-2">
                Ley de Parkinson y los plazos
              </Link>{' '}
              cuenta por qué, sin topes claros, el trabajo ocupa todo el hueco que le dejas.
            </p>
          </div>
        </div>
      </section>

      <RevealOnScroll>
        <section id="lo-que-aprenderas" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-4">
            1. Mapa rápido (por si quieres saltar)
          </h2>
          <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-6">
            Cada bloque va al grano. Si algo ya lo tienes claro, adelante con el siguiente.
            Se nota cuando el lunes te venden “tranquilidad”… y a las 11 ya hay dos urgencias peleándose por el mismo diseñador.
          </p>
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
            <table className="w-full text-left text-sm sm:text-base">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="p-3 sm:p-4 text-violet-200 font-semibold">Tema</th>
                  <th className="p-3 sm:p-4 text-violet-200 font-semibold">De qué hablamos</th>
                  <th className="p-3 sm:p-4 text-violet-200 font-semibold">Te viene bien si…</th>
                </tr>
              </thead>
              <tbody className="text-indigo-100/90">
                <tr className="border-b border-white/10">
                  <td className="p-3 sm:p-4 font-medium text-white align-top">Carga de trabajo</td>
                  <td className="p-3 sm:p-4 align-top">
                    Qué significa repartir bien el día a día frente a planificar personas y presupuesto a medio plazo.
                  </td>
                  <td className="p-3 sm:p-4 align-top">Sientes que el problema no es «falta de gente» sino de orden.</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="p-3 sm:p-4 font-medium text-white align-top">Causas del burnout</td>
                  <td className="p-3 sm:p-4 align-top">
                    Cómo lo enmarca la OMS (CIE-11) y seis causas que suelen venir del trabajo, no del carácter.
                  </td>
                  <td className="p-3 sm:p-4 align-top">Necesitas explicar por qué el equipo pincha más allá de «están estresados».</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="p-3 sm:p-4 font-medium text-white align-top">Señales de alerta</td>
                  <td className="p-3 sm:p-4 align-top">Lo que se nota en el día a día y lo que enseñan utilización, plazos y tareas gordas.</td>
                  <td className="p-3 sm:p-4 align-top">Intuyes saturación pero nadie lo dice en voz alta todavía.</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="p-3 sm:p-4 font-medium text-white align-top">Seis pasos prácticos</td>
                  <td className="p-3 sm:p-4 align-top">
                    De ver la carga real a revisarla cada semana, pasando por Eisenhower y bloques de tiempo.
                  </td>
                  <td className="p-3 sm:p-4 align-top">Quieres algo que puedas llevar a la reunión del lunes.</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="p-3 sm:p-4 font-medium text-white align-top">Tu rol y las crisis</td>
                  <td className="p-3 sm:p-4 align-top">Qué hace de verdad un manager y qué hacer cuando el burnout ya está encima.</td>
                  <td className="p-3 sm:p-4 align-top">Te toca liderar, dar ejemplo o levantar un equipo tocado.</td>
                </tr>
                <tr>
                  <td className="p-3 sm:p-4 font-medium text-white align-top">Métricas y herramientas</td>
                  <td className="p-3 sm:p-4 align-top">Una tabla para mirar cada mes y tipos de software que suelen ayudar, sin nombres de marca.</td>
                  <td className="p-3 sm:p-4 align-top">Estás harto de decidir a ojo y quieres algo más tangible.</td>
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
            2. ¿Qué es realmente la carga de trabajo? (y por qué no es solo «tener mucho trabajo»)
          </h2>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            <p>
              Muchos equipos confunden <strong>carga alta</strong> con <strong>carga mal llevada</strong>. No es lo
              mismo un trimestre duro pero avisado que vivir en modo eterna emergencia porque nadie tiene una foto clara
              de quién va justo. <strong>Gestionar la carga</strong> es, en la práctica, planificar quién hace qué,
              repartir con cabeza y mirar si eso se sostiene en el tiempo —no solo el lunes. En una agencia eso incluye
              campañas, creatividades, informes, reuniones con el cliente y todo el tiempo que se va en coordinar sin que
              aparezca en ningún sitio.
              La cicatriz suele ser el “te lo reenvío” que vuelve tres veces porque el bloqueo real era coordinación, no capacidad.
            </p>
            <p>
              Para <strong>RR. HH.</strong> y para dirección, esto no es un apéndice del Excel: es donde chocan lo que se
              vende y lo que la gente puede aguantar. Cuando revienta, a veces llegan etiquetas como el{' '}
              <strong>síndrome del trabajador quemado</strong>, pero lo que suele fallar son las expectativas, el orden de
              prioridades y si el reparto se ve justo. Cuando el equipo puede hablar de eso sin miedo, suele ganar tanto
              calidad de vida como calidad de entrega: menos duplicar trabajo, menos esperar a que «alguien conteste» y
              menos entregar la versión séptima de lo mismo.
            </p>
            <p>
              No hace falta otro taller de respiración si el calendario sigue siendo un campo de batalla. Lo que hace
              falta es <strong>capacidad de equipo</strong> visible y una <strong>planificación</strong> que no asuma que
              «ya se apañará». Sin ese mapa, el agotamiento se lee como culpa individual; con él, se lee como señal de que
              algo en el sistema pide cambio.
            </p>
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-white mt-8 mb-3">
            Día a día frente a plantilla y presupuesto
          </h3>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            <p>
              Uno es <em>cómo</em> circulan las tareas esta semana: quién tiene el balón, qué es urgente, qué bloquea a
              qué. Otro es <em>con qué</em> cuentas para hacerlo: perfiles, coste, horas contratadas, mezcla junior y
              senior. En inglés lo llaman workload y resource management; aquí importa no mezclarlos sin querer. Si solo
              miras plantilla y Excel de capacidad pero no la cola real de trabajo, tienes «todo cuadra en papel» y caos
              en el Slack. Si solo miras tickets y no el coste ni quién puede hacer qué, el margen se come solo.
            </p>
            <p>
              En agencia, el lío clásico es una reunión donde medio mundo habla de contratar y el otro medio de parar
              cosas. Si dejas claro si la decisión es «meter gente» o «ordenar lo que hay», ya habéis ganado media batalla.
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
              Cuando la carga se amontona en pocas personas, el riesgo es de verdad: un solo cuello de botella en la
              revisión creativa o en la cuenta estrella, y además la sensación de <strong>injusticia</strong> —«a mí no me
              dejan decir que no»— que corroe el equipo. Si quien manda puede ver eso, lo razonable es que las piezas
              gordas no caigan siempre en las mismas dos cabezas.
            </p>
          </div>
        </section>
      </RevealOnScroll>

      <RevealOnScroll delay={1}>
        <section id="causas-burnout-equipos" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6">
            3. Las causas reales del burnout (que los managers no suelen ver)
          </h2>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            <p>
              El <strong>estrés puntual</strong> —un lanzamiento, una campaña que se dispara— puede ser brutal y, aun así,
              llevadero si después hay respiro y las reglas del juego son claras. El <strong>burnout</strong> es otra
              historia: se queda, te desconecta del trabajo y te hace sentir que rindes menos aunque sigas currando. La{' '}
              <strong>OMS</strong> lo recoge en la <strong>CIE-11</strong> como algo ligado al trabajo mal gestionado, no
              como un capricho personal. Traducción para el día a día: mirar a la organización, no solo al «ánimo» de cada
              uno.
              Lo ves cuando tu mejor creativo deja de mandar GIFs por Slack, responde con frío y el equipo ya no discute el scope: solo lo traga.
            </p>
            <p>
              En la práctica se suelen ver tres cosas a la vez: <strong>agotamiento emocional</strong>,{' '}
              <strong>despersonalización</strong> (el cinismo hacia el trabajo) y <strong>baja realización personal</strong>{' '}
              —esa sensación de «antes daba para más». No es solo «muchas horas»: es mezcla de exigencias y de cosas que el
              equipo debería tener (claridad, apoyo, reconocimiento) y no tiene.
            </p>
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-white mt-8 mb-4">Las seis causas estructurales del burnout en equipos</h3>
          <ol className="list-decimal list-outside space-y-5 pl-5 sm:pl-6 text-indigo-100/90 text-base sm:text-lg leading-relaxed marker:text-violet-300 marker:font-semibold">
            <li>
              <strong className="text-white">Sobrecarga de trabajo real:</strong> más tareas o más alcance de los que
              caben en el tiempo que hay, sin tocar plazos ni expectativas. Se nota en el backlog y en la cara del equipo,
              no solo en la hoja de horas.
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
              <strong className="text-white">Ausencia de reconocimiento:</strong> solo se habla cuando algo salta por
              los aires; lo que va bien pasa desapercibido. La moral no aguanta solo de críticas.
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
          <p className="text-indigo-200/80 text-sm sm:text-base mt-6 not-italic">
            En marketing y agencias, la primera, la quinta y la sexta suelen ir del brazo: demasiado encima de la mesa,
            alcance que crece sin contrato ni tiempo, y el chat encendido como si fuera guardia en urgencias.
          </p>
        </section>
      </RevealOnScroll>

      <RevealOnScroll delay={2}>
        <section id="senales-equipo-riesgo" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6">
            4. Cómo detectar que tu equipo está en riesgo: señales de alerta tempranas
          </h2>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            <p>
              ¿Cómo saber si el equipo va justo antes de que alguien explote? Mezcla intuición con números. Mucha gente no
              dice «no puedo más» hasta muy tarde: por miedo a quedar mal, por el sueldo a fin de mes o porque cree que
              aguantar es parte del trabajo.
              La señal de campo es el tono del canal: antes había preguntas, luego solo mensajes cortos y silencios largos “porque estoy saturado”.
            </p>
            <p>
              Por eso conviene mirar a la vez <strong>lo que ves</strong> y <strong>lo que dicen los datos</strong>. Si solo
              confías en el pasillo —o en el canal general—, casi siempre llegas tarde.
            </p>
          </div>

          <div className="my-8">
            <SenalesCargaAlertaVisual />
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-white mt-8 mb-3">Señales conductuales (las que se ven)</h3>
          <ul className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed list-disc list-outside pl-5 sm:pl-6 marker:text-violet-400">
            <li>Irritabilidad, cambios de humor o que alguien se «apague» en Slack donde antes metía mano.</li>
            <li>
              Llegadas tarde, absentismo o <strong>presentismo</strong> de manual: físicamente ahí, mentalmente en otro
              sitio.
            </li>
            <li>Entregables que antes salían finos y ahora llegan con más tiritas o más rondas de corrección.</li>
            <li>En reuniones, solo monosílabos; en dinámicas de equipo, desaparición gradual.</li>
          </ul>

          <h3 className="text-lg sm:text-xl font-bold text-white mt-8 mb-3">Lo que cuentan los números</h3>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            <p>
              Los números no sustituyen una conversación honesta, pero sí evitan que todo dependa del «¿todo bien?» que
              todo el mundo contesta con un sí por inercia.
            </p>
            <ul className="space-y-4 list-disc list-outside pl-5 sm:pl-6 marker:text-violet-400">
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
                perfiles de producción suele rondar el <strong>70–80%</strong>. Si te pasas del <strong>85% muchas
                semanas seguidas</strong>, suele subir el error, el cabreo y las ganas de mirar ofertas en LinkedIn. Cada
                agencia es un mundo: cuentas, creatividad, consultoría… tú ajustas.
              </li>
            </ul>
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-white mt-8 mb-3">El problema silencioso: el burnout que no se verbaliza</h3>
          <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-6">
            Que nadie se queje no significa que vaya bien: muchas veces significa que nadie se atreve. A quien lidera le
            toca aprender a leer el tablero —tareas, plazos, caras— antes del pinchazo. En los 1:1, una pregunta simple
            suele abrir más que un discurso: «del 1 al 5, ¿cómo llevas la carga esta semana?». Y si el ambiente aún no da
            para sinceridad a cara descubierta, un pulso anónimo de vez en cuando también vale.
          </p>
          <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            Ojo al interpretar cifras: muchas horas puede ser alguien en formación o acompañando a otro; pocas horas puede
            ser alguien bloqueado esperando feedback. Lo que importa es si el flujo deja terminar sin fricción absurda. Si
            las dependencias están mal resueltas o no hay hueco para revisar, no es «que Fulano vaga»: es que el sistema
            lo está frenando.
          </p>
        </section>
      </RevealOnScroll>

      <RevealOnScroll>
        <section id="framework-gestion-sostenible" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6 flex items-center gap-3">
            <Scale className="h-8 w-8 text-violet-400 shrink-0" aria-hidden />
            5. Framework para gestionar la carga de trabajo de forma sostenible
          </h2>
          <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-6">
            Seis pasos que puedes aplicar el lunes que viene, aunque sigas con la misma herramienta de siempre. Aquí{' '}
            <strong>repartir bien</strong> no es darle a todos el mismo número de tareas: es repartir según capacidad real,
            habilidad y el momento que lleva cada persona (recién salido de un pico vs en una racha más tranquila).
            La cicatriz es el “viernes perfecto” que el lunes no se sostiene: el bloque de revisión se rompe y nadie sabe a qué hora liberar.
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
              sorpresas y mejora el reparto entre el equipo porque las conversaciones incómodas ocurren antes del lunes.
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
              Priorizar en equipo no es solo ordenar un backlog bonito. Es cuadrar con la <strong>capacidad real</strong>{' '}
              (no la del contrato en papel), con quién sabe hacer qué, con qué le apetece o aguanta cada uno ahora mismo.
              No es lo mismo cargar a quien acaba de salir de un infierno de lanzamiento que a quien lleva semanas en
              ritmo mantenimiento.
            </p>
            <p>
              Repartir «para que todos tengan lo mismo» en número de tareas puede ser injusto si las criticidades difieren.
              Mejor: reparto explícito de <strong>tareas críticas</strong> y rotación de roles de apoyo para reducir
              dependencia de estrellas silenciosas.
            </p>
            <p>
              Documenta decisiones de reparto en un lugar único (nota de proyecto, comentario en herramienta o acta breve)
              para que no dependan de memoria oral. Eso reduce conflictos del tipo «pensaba que esto lo llevaba X» y
              permite mirar atrás y ver si el riesgo se repartió o si solo se contaron tickets. En agencia, donde cuenta y
              creativo comparten la misma fecha límite, eso evita que solo uno de los dos se lleve el golpe.
            </p>
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-white mt-8 mb-3">Paso 4: Aprende a decir que no como equipo</h3>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            <p>
              En agencias, el patrón tóxico es decir sí a todo lo que pide el cliente o el comercial. Ahí el manager tiene
              que hacer de <strong>cortafuegos</strong>. El <strong>scope creep</strong> se come horas que no estaban en
              ningún sitio y, de paso, rompe la confianza («otra vez prometieron sin preguntarnos»).
            </p>
            <p>
              Antes de meter un encargo nuevo en el saco, prueba esta frase en serio:{' '}
              <em>«¿Qué dejamos de hacer para poder hacer esto?»</em>. Si no sale nada de la lista, no hay hueco: toca
              negociar fecha, alcance o gente. Eso no es ser antipático; es cuidar al equipo.
            </p>
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-white mt-8 mb-3">Paso 5: Crea ritmos de trabajo con bloques de tiempo protegidos</h3>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            <p>
              El <strong>timeboxing</strong> es ponerle techo al tiempo de una tarea y tomarse ese techo en serio, no como
              adorno del calendario. En equipo se traduce en bloques para concentrarse, días con menos reuniones internas
              y un poco de aire entre proyectos para que el imprevisto no rompa la semana entera.
            </p>
            <p>
              No hace falta secta del cronómetro: hace falta que el grupo entienda que está bien estar en foco sin
              responder al minuto. Eso baja la fiebre de la urgencia permanente y cuida la cabeza de quien crea o mete
              mano a datos. Si quieres la explicación pausada de la técnica, está en{' '}
              <Link to="/blog/que-es-timeboxing" className="text-violet-300 hover:text-white underline underline-offset-2">
                Qué es el timeboxing
              </Link>
              ; aquí nos quedamos con la idea de proteger el tiempo como proteges el margen.
            </p>
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-white mt-8 mb-3">Paso 6: Revisa la carga periódicamente (no solo en crisis)</h3>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            <p>
              Cada semana, diez minutos bastan: en el 1:1 o en un standup un poco más largo, pregunta por la carga del 1
              al 5, por un cuello de botella y por <em>una</em> cosa que desbloquee la semana. Cada dos semanas, haz zoom
              out en equipo: no solo cómo está cada uno, sino si el reparto huele raro.
            </p>
            <p>
              Si la carga solo sale en conversación cuando alguien revienta, siempre irás tarde. El hábito de mirarla
              con calma es lo que separa prevenir de poner parches cuando ya duele.
            </p>
          </div>
        </section>
      </RevealOnScroll>

      <RevealOnScroll delay={1}>
        <section id="rol-manager-equipo" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6 flex items-center gap-3">
            <HeartPulse className="h-8 w-8 text-rose-400 shrink-0" aria-hidden />
            6. El rol del manager: liderar sin quemar al equipo
          </h2>
          <div className="space-y-8 text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            <p>
              El burnout no es un «tema personal» que se arregla con más fuerza de voluntad. Es, en buena parte,{' '}
              <strong>cultura</strong> y <strong>liderazgo</strong>: lo que tú permites en reuniones, cómo reaccionas cuando
              alguien pide margen, y si el reconocimiento solo sale cuando hay incendio.
              La cicatriz de manager llega cuando en el 1:1 la persona sonríe y dice “estoy bien”, y una semana después desaparecen entregas “porque no da”.
            </p>

            <div className="space-y-3">
              <h3 className="text-lg sm:text-xl font-bold text-white m-0">Feedback constante, no solo cuando algo falla</h3>
              <p className="m-0">
                Gallup y Workhuman llevan tiempo diciendo algo que molesta: quien recibe feedback a menudo aguanta mejor
                el ritmo que quien solo escucha crítica cuando algo estalla. Y el «bien hecho» no tiene que salir solo del
                jefe: cuando los compañeros nombran el trabajo invisible —documentar, dejar el relevo claro, mejorar un
                proceso—, el ambiente cambia.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg sm:text-xl font-bold text-white m-0">Crear un entorno psicológicamente seguro</h3>
              <p className="m-0">
                Que alguien pueda decir <em>«esta semana no me da la vida»</em> sin miedo a represalias no es debilidad: es
                aviso a tiempo. Si en tu equipo nunca pasa nada, desconfía: o estáis en un paraíso poco creíble, o la gente
                se está callando. Ojo si las métricas gritan saturación y el chat sigue en modo «todo bien».
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg sm:text-xl font-bold text-white m-0">Flexibilidad como herramienta de prevención</h3>
              <p className="m-0">
                Horarios flexibles o remoto solo ayudan si encajan en cómo se gestiona la carga de verdad. Si en el fondo
                se premia estar conectado a todas horas, la «flexibilidad» acaba siendo culpa disfrazada: libertad en el
                papel, presión en la práctica.
              </p>
            </div>
          </div>
        </section>
      </RevealOnScroll>

      <RevealOnScroll delay={2}>
        <section id="burnout-instalado" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6 flex items-center gap-3">
            <ShieldAlert className="h-8 w-8 text-amber-400 shrink-0" aria-hidden />
            7. Burnout ya instalado: qué hacer cuando es demasiado tarde para prevenir
          </h2>
          <div className="space-y-6 text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            <p>
              Si ya estás en fase «equipo fundido», el peor error es restarle importancia con frases hechas. Hay que
              actuar en varios frentes a la vez —carga, expectativas y apoyo— en lugar de ir paliativo por paliativo.
              Se ve en el correo de urgencia a las 19:30, con el “ok, lo saco como sea” aunque el calendario grite que no hay hueco.
            </p>
            <ol className="list-decimal list-outside space-y-5 pl-5 sm:pl-6 marker:text-amber-300 marker:font-semibold m-0">
              <li>
                <strong className="text-white">Hablarlo sin tabú.</strong> El agotamiento prolongado es señal de cómo está
                montado el trabajo, no de «falta de actitud».
              </li>
              <li>
                <strong className="text-white">Quitar peso de verdad.</strong> Redistribuir lo urgente hoy, no solo mandar
                ánimos.
              </li>
              <li>
                <strong className="text-white">Releer objetivos y fechas.</strong> Pregunta incómoda: ¿esto es viable con
                la cabeza y las horas que tenemos <em>ahora</em>?
              </li>
              <li>
                <strong className="text-white">Tiempo para recuperar.</strong> Días, rebalancear cuentas o aparcar
                iniciativas que no son vitales esta semana.
              </li>
              <li>
                <strong className="text-white">Apoyo profesional si hace falta.</strong> Según tu país y políticas: salud
                laboral, orientación psicológica, EAP… sin sustituir los cambios estructurales.
              </li>
            </ol>
            <p>
              La fruta en recepción o la app de meditación no arreglan un calendario imposible. Si el mensaje es «cuidaos»
              pero el sistema sigue pidiendo disponibilidad total, lo único que sube es el cinismo —«otro parche»— y baja
              la confianza en la dirección.
            </p>
          </div>
        </section>
      </RevealOnScroll>

      <RevealOnScroll>
        <section id="metricas-carga-equipo" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6 flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-emerald-400 shrink-0" aria-hidden />
            8. Métricas que todo manager debería tener controladas
          </h2>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-6">
            <p>
              Si quieres medir la carga sin quedarte solo con el «yo creo que van justos», esta tabla es un buen punto de
              partida. Los porcentajes son orientativos: lo que vale en una consultora no tiene por qué valer en una casa
              de producción.
              La cicatriz es cuando el director mira la tabla y dice “utilización ok”… y el backlog sigue creciendo cada día.
            </p>
            <p>
              Para bajar al detalle —utilización, márgenes, ritmo del proyecto— el artículo de{' '}
              <Link to="/blog/kpis-agencias-marketing-2026" className="text-violet-300 hover:text-white underline underline-offset-2">
                KPIs de rendimiento en agencias
              </Link>{' '}
              lo cuenta con más mimo.
            </p>
          </div>
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
            9. Herramientas que suelen ayudar (por tipo, sin marcas)
          </h2>
          <div className="space-y-5 text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            <p>
              No te voy a vender un nombre propio: lo que importa es qué agujero estás tapando. ¿Falta ver quién lleva
              qué? ¿Falta cruzar horas reales con lo presupuestado? ¿O falta saber cómo está el ánimo antes de que reviente
              en público?
              La cicatriz es la misma siempre: abres el tablero, lo usas dos días, lo dejas y el mes entero se te va a “actualizo luego”.
            </p>
            <ul className="space-y-4 list-disc list-outside pl-5 sm:pl-6 marker:text-violet-400">
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
            <p>
              Casi siempre hace falta <strong>dos capas</strong> que conversen entre sí: una para el flujo (tareas,
              estados, quién tiene el balón) y otra para el <strong>tiempo</strong> (horas, utilización, estimado vs
              real). Si no hablan, el director de proyecto acaba siendo contable a mano y el equipo vuelve al modo
              «salvavidas».
            </p>
            <p>
              Las <strong>encuestas de clima</strong>, si son cortas y no cada trimestre en forma de tesis, sirven de
              termómetro cuando los números aún «cuadran» pero el ambiente no.
            </p>
            <p>
              Y sobre la <strong>comunicación asíncrona</strong>: solo alivia si hay reglas claras —qué canal es para
              fuego real, qué tiempo de respuesta es razonable, cuándo hace falta estar en vivo. Sin eso, «trabajar async»
              es sinónimo de estar enganchado al móvil a todas horas.
            </p>
          </div>
        </section>
      </RevealOnScroll>

      <RevealOnScroll delay={2}>
        <section id="conclusion-gestion-carga" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6">10. Conclusión</h2>
          <div className="space-y-5 text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            <p>
              El <strong>burnout</strong> no es que la gente «no aguante». Es, muchas veces, la foto de que la{' '}
              <strong>distribución del trabajo</strong> y los <strong>límites</strong> no están a la altura. La parte
              buena es que hay cosas concretas que sí puedes hacer: ver la carga, decidir prioridades en voz alta, repartir con cabeza,
              cortar alcance cuando toca, proteger foco y revisar cómo va la semana sin esperar al drama.
              Si esto se queda en una charla y no vuelves a mirar la carga con calma, el burnout vuelve con otro nombre antes de fin de trimestre.
            </p>
            <p>
              Si solo te llevas una cosa de aquí, que sea esta pregunta en tu próxima reunión (diez minutos bastan):{' '}
              <em>«¿Quién va sobrado de verdad y qué quitamos o movemos para esta semana?»</em>. Si la respuesta pica un
              poco, probablemente vais por buen camino.
            </p>
            <p>
              Y si llevas meses posponiéndolo, empieza por <strong>visibilidad</strong>: dos semanas con una tabla
              compartida honesta suelen enseñar más que un tablero bonito que nadie actualiza. El objetivo no es el
              documento; es que hablar de <strong>carga</strong> deje de ser raro y pase a ser tan normal como mirar el
              pipeline.
            </p>
          </div>
        </section>
      </RevealOnScroll>

      <RevealOnScroll>
        <section id="faq-gestion-carga-trabajo" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-6">Preguntas frecuentes</h2>
          <div className="space-y-6 text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            <div className="rounded-xl border border-white/10 bg-white/5 p-5 sm:p-6 space-y-3">
              <h3 className="text-white font-bold text-lg m-0">¿Cuánto es demasiada carga de trabajo?</h3>
              <p className="m-0">
                No hay un número mágico: depende del rol. Pero ojo si la utilización se queda muy por encima del ~85%
                durante largo rato, si estimado y real nunca coinciden, si hay más retrabajo o si los plazos empiezan a
                caerse todos a la vez.
                La cicatriz típica es cuando el equipo sigue respondiendo “todo bien” y los retrasos pasan a ser normales, no excepciones.
              </p>
              <p className="m-0 text-indigo-200/90">
                En la práctica, «demasiado» es cuando deja de ser un pico y se convierte en rutina sin respiro.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-5 sm:p-6 space-y-3">
              <h3 className="text-white font-bold text-lg m-0">¿Cómo sé si mi equipo tiene burnout?</h3>
              <p className="m-0">
                Cruza lo que ves (cansancio, cinismo, calidad bajando, gente que se encierra) con lo que miden los datos:
                plazos, reparto de tareas gordas, quién acumula riesgo.
              </p>
              <p className="m-0 text-indigo-200/90">
                Y no esperes a que alguien lo diga en una reunión: pregunta a menudo y deja sitio para respuestas honestas.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-5 sm:p-6 space-y-3">
              <h3 className="text-white font-bold text-lg m-0">¿Qué diferencia hay entre estrés y burnout?</h3>
              <p className="m-0">
                El estrés puede venir con una fecha de caducidad: termina el lanzamiento y baja la tensión. El burnout se
                queda: agotamiento que no recuperas con un fin de semana, desgana con el trabajo y sensación de ir más
                lento pese a esforzarte.
              </p>
              <p className="m-0 text-indigo-200/90">
                Ahí hace falta tocar el sistema, no solo «más aguante».
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-5 sm:p-6 space-y-3">
              <h3 className="text-white font-bold text-lg m-0">¿Cómo repartir tareas equitativamente en una agencia?</h3>
              <p className="m-0">
                «Equitativo» no es repartir el mismo número de tickets. Es que el <em>riesgo</em> y el esfuerzo vivan
                repartidos: capacidad real, habilidad, qué tan crítico es cada encargo y en qué fase está el proyecto.
              </p>
              <p className="m-0 text-indigo-200/90">
                Rota lo que pesa para que no siempre caiga en los mismos dos perfiles.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-5 sm:p-6 space-y-3">
              <h3 className="text-white font-bold text-lg m-0">¿Hay alguna herramienta imprescindible para la carga de trabajo?</h3>
              <p className="m-0">
                Ninguna salva un equipo sin acuerdos. Lo que cuenta es decidir dónde está «la verdad» (tablero, hoja, ERP)
                y cumplirla entre todos.
              </p>
              <p className="m-0 text-indigo-200/90">
                Elige categorías —tareas, horas, Gantt, encuestas— según lo que ahora mismo no estás viendo.
              </p>
            </div>
          </div>
        </section>
      </RevealOnScroll>

      <RevealOnScroll delay={1}>
        <section id="cta-gestion-carga" className="text-center mt-12 mb-8 scroll-mt-24">
          <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto mb-8">
            Si te ha picado el gusanillo de pasar de intuición a números que sirvan en comité, aquí van dos lecturas que
            suelen cerrar el círculo:{' '}
            <Link to="/blog/kpis-agencias-marketing-2026" className="text-violet-300 hover:text-white underline underline-offset-2">
              KPIs de rendimiento en agencias
            </Link>{' '}
            y{' '}
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
