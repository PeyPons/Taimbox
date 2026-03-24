import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  Clock,
  BookOpen,
  AlertTriangle,
  CheckCircle2,
  Target,
  TrendingUp,
  Users,
  CalendarDays,
  ChevronRight,
  Quote,
  Zap,
  Building2,
  Wallet,
  MessageSquareWarning,
} from 'lucide-react';
import { RevealOnScroll } from './RevealOnScroll';
import { BlogReadingTime } from './BlogReadingTime';
import { BlogTOC } from './BlogTOC';
import { BlogRelatedPost } from './BlogRelatedPost';
import { ParkinsonLawVisual } from './ParkinsonLawVisual';
import type { BlogTOCItem } from './BlogTOC';

export interface LeyParkinsonArticleProps {
  readingMinutes?: number;
  tocItems?: BlogTOCItem[];
  relatedPost?: { title: string; description: string; href: string };
}

export function LeyParkinsonArticle({
  readingMinutes,
  tocItems,
  relatedPost,
}: LeyParkinsonArticleProps) {
  return (
    <article
      id="ley-parkinson"
      className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 md:py-16 text-left overflow-x-hidden"
    >
      {/* Gancho y título */}
      <section className="mb-12 sm:mb-14">
        <div className="mb-6 text-center flex flex-col items-center gap-3">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-indigo-300 bg-indigo-500/20 border border-indigo-400/30">
            Guía completa
          </span>
          {readingMinutes != null && <BlogReadingTime minutes={readingMinutes} />}
        </div>
        <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-[2.75rem] font-black text-white mb-5 sm:mb-6 leading-[1.15] tracking-tight text-center">
          Ley de Parkinson: qué es, ejemplos y cómo combatirla
        </h1>
        <div className="space-y-4 text-indigo-100/95 text-base sm:text-lg leading-[1.75]">
          <p>
            Si alguna vez has tenido una semana entera para un informe y lo entregaste el viernes a las 18:00, o un día
            para la misma tarea y la cerraste en unas horas, has vivido en carne propia la <strong>Ley de Parkinson</strong>:
            el trabajo se expande hasta llenar el tiempo disponible para su realización. No es una ley física ni
            matemática, pero describe un patrón de comportamiento tan común que, una vez que lo reconoces, cambia cómo
            planificas y cómo gestionas equipos.
          </p>
          <div className="rounded-2xl border-l-4 border-indigo-400 bg-indigo-500/10 border border-indigo-500/20 p-4 sm:p-6 my-6">
            <p className="text-white/95 font-medium m-0">
              En esta guía repasamos la formulación clásica del tiempo, el <strong>origen sociológico</strong> (crítica a
              la burocracia), la <strong>segunda ley</strong> sobre gastos e ingresos, la <strong>ley de la
              trivialidad</strong> en reuniones, ejemplos, evidencia, consecuencias en empresas y antídotos: timeboxing,
              plazos cortos y límites explícitos.
            </p>
          </div>
        </div>
      </section>

      {tocItems != null && tocItems.length > 0 && (
        <div className="mb-12">
          <BlogTOC items={tocItems} />
        </div>
      )}

      {/* 1. Qué es la Ley de Parkinson */}
      <RevealOnScroll>
        <section id="que-es-ley-parkinson" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6">
            1. Qué es la Ley de Parkinson
          </h2>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-6">
            <p>
              La <strong>Ley de Parkinson</strong> es un principio sobre el uso del tiempo formulado por el historiador y
              escritor británico <strong>Cyril Northcote Parkinson</strong> en un artículo publicado en <em>The
              Economist</em> en 1955. Más tarde lo desarrolló en el libro <em>Parkinson&apos;s Law: The Pursuit of
              Progress</em> (1957). La idea central es que el tiempo que dedicamos a una tarea tiende a ocupar todo el
              plazo que tenemos asignado, no el que objetivamente la tarea requiere.
            </p>
            <p>
              En la práctica: si das una semana para hacer un borrador, la gente usará la semana; si das un día para el
              mismo borrador, muchas veces el resultado se entrega en un día. La tarea &quot;crece&quot; o &quot;se
              expande&quot; hasta llenar el tiempo disponible, por inercia, perfeccionismo, distracciones o falta de
              límites claros.
            </p>
          </div>

          <div className="my-8">
            <ParkinsonLawVisual />
          </div>

          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            <p>
              Esta ley no dice que el trabajo sea de peor calidad en menos tiempo; en muchos casos, un plazo más corto
              obliga a priorizar y a evitar el trabajo innecesario. Lo que describe es un <strong>patrón de
              comportamiento</strong>: en ausencia de un límite estricto, tendemos a usar todo el tiempo que nos dan.
            </p>
          </div>
        </section>
      </RevealOnScroll>

      {/* 2. Formulación y origen */}
      <RevealOnScroll delay={1}>
        <section id="formulacion-origen" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6">
            2. La formulación exacta y el origen
          </h2>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-6">
            <p>
              La frase que resume la ley es: <strong>&quot;Work expands so as to fill the time available for its
              completion&quot;</strong> — &quot;El trabajo se expande de tal manera que llena el tiempo disponible para
              su realización&quot;. Parkinson la ilustró con ejemplos burocráticos (comités que se reúnen hasta que se
              acaba el tiempo, trámites que duran lo que tarda el horario de oficina), pero la ley se aplica a cualquier
              tipo de tarea: informes, reuniones, proyectos, correos o decisiones.
            </p>
          </div>

          <div className="rounded-2xl border border-amber-500/20 bg-amber-950/30 p-5 sm:p-6 flex gap-4">
            <Quote className="h-8 w-8 text-amber-400/80 shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-100/95 font-medium italic mb-2">
                &quot;El trabajo se expande hasta llenar el tiempo disponible para su finalización.&quot;
              </p>
              <p className="text-amber-200/80 text-sm">C. Northcote Parkinson, <em>The Economist</em>, 1955</p>
            </div>
          </div>

          <p className="text-indigo-200/85 text-sm sm:text-base mt-6 mb-0">
            Más abajo desarrollamos el resto del marco de Parkinson: origen burocrático, segunda ley financiera y ley de la
            trivialidad.
          </p>
        </section>
      </RevealOnScroll>

      {/* Origen burocrático y estructura */}
      <RevealOnScroll delay={1}>
        <section id="parkinson-estructura-burocracia" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6 flex items-center gap-3">
            <Building2 className="h-8 w-8 text-slate-300 shrink-0" />
            Origen sociológico: no es solo &quot;falta de foco&quot;
          </h2>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            <p>
              Parkinson formuló la ley del tiempo en un contexto de <strong>crítica a la burocracia</strong>, no como
              manual de autodisciplina personal. Su mirada era sociológica: las organizaciones tienden a generar trabajo y
              puestos que se perpetúan aunque la función real (barcos, servicios, clientes) no lo exija al mismo ritmo.
            </p>
            <p>
              Un ejemplo que él mismo popularizó es el de la <strong>administración naval británica</strong>: entre 1914 y
              1928 el personal de oficina creció de forma sostenida (en torno a un ritmo anual del orden del 5–7% en
              distintas ramas citadas en su análisis) mientras el número de <strong>barcos en servicio disminuía
              drásticamente</strong>. El mensaje no es un dato estadístico para un examen, sino una ilustración: el aparato
              administrativo puede hincharse con independencia del &quot;output&quot; que pretende servir.
            </p>
            <div className="rounded-2xl border border-indigo-500/30 bg-indigo-950/50 p-5 sm:p-6 my-6">
              <p className="text-white font-medium m-0 text-base sm:text-lg leading-relaxed">
                La Ley de Parkinson no es solo una trampa mental: es un <strong>defecto estructural</strong> de las
                organizaciones que tienden a crear trabajo innecesario o a multiplicar capas para justificar su
                existencia. Combatirla no depende solo de &quot;concentrarse más&quot;: hace falta revisar comités,
                aprobaciones, plantillas y cargas que fabrican trabajo sin valor.
              </p>
            </div>
            <p>
              Por eso los antídotos van en dos frentes: hábitos personales (timeboxing, plazos) y{' '}
              <strong>diseño organizativo</strong> (menos reuniones obligatorias, menos trámites, presupuestos y roles
              claros). En equipos de agencia, si solo pides &quot;más disciplina&quot; pero el sistema añade reuniones y
              capas, la ley sigue ganando.
            </p>
          </div>
        </section>
      </RevealOnScroll>

      {/* Segunda ley: gastos */}
      <RevealOnScroll delay={1}>
        <section id="segunda-ley-gastos" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6 flex items-center gap-3">
            <Wallet className="h-8 w-8 text-emerald-400 shrink-0" />
            Segunda ley de Parkinson: los gastos y los ingresos
          </h2>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            <p>
              En el mismo libro y ensayos, Parkinson enunció una ley espejo de la del tiempo:{' '}
              <strong>&quot;Los gastos aumentan hasta cubrir todos los ingresos&quot;</strong> (formulaciones equivalentes:
              el gasto sube para igualar el ingreso disponible). Es el paralelo financiero de &quot;el trabajo llena el
              tiempo&quot;: el dinero tiende a <strong>dispersarse</strong> mientras haya saldo percibido, no porque cada
              gasto sea racional.
            </p>
            <p>
              En una empresa, eso se ve en presupuestos que se consumen porque &quot;sobraba partida&quot;; en lo
              personal, en el efecto de que sube el sueldo y a los pocos meses el estilo de vida se ha ajustado de nuevo al
              límite. <strong>Aplique este principio a su presupuesto personal:</strong> si no asigna un destino
              concreto a cada parte del ingreso (ahorro automático, tope de variable, fondo de emergencia), el dinero
              tiende a &quot;expandirse&quot; en gastos hormiga hasta agotar lo disponible, igual que el trabajo llena el
              plazo.
            </p>
            <p>
              Los antídotos son análogos a los del tiempo: <strong>topes</strong> (presupuesto por categoría),{' '}
              <strong>reglas automáticas</strong> (transferencias el día de cobro) y <strong>revisión periódica</strong>, no
              solo fuerza de voluntad puntual.
            </p>
          </div>
        </section>
      </RevealOnScroll>

      {/* 3. Ejemplos */}
      <RevealOnScroll delay={1}>
        <section id="ejemplos-ley-parkinson" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6">
            3. Ejemplos de la Ley de Parkinson en el día a día y en negocio
          </h2>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-6">
            <p>
              Reconocer la ley en situaciones concretas ayuda a combatirla. Algunos ejemplos típicos:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                <Clock className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <h4 className="text-white font-semibold mb-2">Informes y entregables</h4>
                <p className="text-sm text-indigo-200/90">
                  Mismo informe: con &quot;para el viernes&quot; se entrega el viernes; con &quot;para esta tarde&quot; a
                  menudo se cierra en unas horas. El contenido esencial suele ser similar; lo que cambia es el tiempo
                  consumido.
                </p>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0">
                <Users className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <h4 className="text-white font-semibold mb-2">Reuniones</h4>
                <p className="text-sm text-indigo-200/90">
                  Una reunión programada para 1 hora suele durar 1 hora. Si la convocas para 30 minutos, muchas veces se
                  resuelve en 30 minutos. El orden del día se adapta al tiempo disponible.
                </p>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center shrink-0">
                <Target className="h-5 w-5 text-indigo-400" />
              </div>
              <div>
                <h4 className="text-white font-semibold mb-2">Proyectos y sprints</h4>
                <p className="text-sm text-indigo-200/90">
                  Un proyecto &quot;sin fecha fija&quot; se alarga. Un sprint de 2 semanas suele entregar en 2 semanas;
                  si el mismo equipo tiene 1 semana, prioriza y entrega menos alcance pero a tiempo.
                </p>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                <TrendingUp className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <h4 className="text-white font-semibold mb-2">Presupuesto por horas</h4>
                <p className="text-sm text-indigo-200/90">
                  Si un cliente paga &quot;lo que haga falta&quot;, las horas se disparan. Si el presupuesto es &quot;X
                  horas máximas&quot;, el trabajo se acopla a ese techo y se toman decisiones más claras sobre qué
                  incluir.
                </p>
              </div>
            </div>
          </div>
        </section>
      </RevealOnScroll>

      {/* Ley de la trivialidad */}
      <RevealOnScroll delay={1}>
        <section id="ley-trivialidad" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6 flex items-center gap-3">
            <MessageSquareWarning className="h-8 w-8 text-amber-400 shrink-0" />
            Ley de la trivialidad (efecto cobertizo)
          </h2>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            <p>
              Parkinson describió otro fenómeno que explica por qué las reuniones se comen la semana sin avanzar lo
              importante: la <strong>ley de la trivialidad</strong> (en la literatura anglosajona a veces ilustrada con
              la &quot;prioridad del cobertizo&quot; o <em>bicycle shed</em>). En un comité, el grupo dedica tiempo
              desproporcionado a temas <strong>fáciles de entender</strong> (el color de un cobertizo, un detalle de
              formato) pero dedica poco o nada a decisiones complejas y críticas (por ejemplo, un diseño técnico profundo)
              porque exigen esfuerzo cognitivo y riesgo.
            </p>
            <div className="rounded-2xl border border-amber-500/25 bg-amber-950/30 p-5 sm:p-6 my-6">
              <p className="text-amber-100/95 font-medium m-0">
                <strong>Cuidado con el efecto cobertizo:</strong> no permita que la facilidad de discutir un tema trivial
                consuma el tiempo reservado para las decisiones estratégicas de su proyecto. Si la reunión solo avanza en
                detalles cómodos, la Ley de Parkinson del tiempo se cumple en el lugar equivocado.
              </p>
            </div>
            <p>
              <strong>Cómo recortar reuniones esta semana:</strong> orden del día con prioridad explícita (lo crítico
              primero, tiempo acotado), límite de duración, y regla de &quot;decisión o aplazamiento&quot;: si el tema no
              es nuclear, se documenta y se sale. Así reduces el tiempo que el grupo invierte en lo que es fácil de opinar
              pero poco relevante.
            </p>
          </div>
        </section>
      </RevealOnScroll>

      {/* 4. Evidencia y estudios */}
      <RevealOnScroll delay={1}>
        <section id="evidencia-estudios" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6">
            4. Evidencia empírica y estudios
          </h2>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-6">
            <p>
              La observación de Parkinson era sobre todo cualitativa (burocracia y comités). En las últimas décadas,
              investigaciones en psicología y gestión del tiempo han aportado apoyo indirecto:
            </p>
            <ul className="space-y-2 list-disc pl-6 text-indigo-100/90">
              <li>
                <strong className="text-white">Plazos y rendimiento:</strong> en muchos estudios, plazos más cortos y
                claros se asocian a mejor foco y a que el trabajo no se dilate sin límite.
              </li>
              <li>
                <strong className="text-white">Efecto del tiempo disponible:</strong> cuando hay más tiempo, la gente
                suele dedicar más tiempo a la tarea (revisión, perfeccionismo, tareas secundarias), lo que encaja con la
                idea de que el trabajo &quot;llena&quot; el tiempo.
              </li>
              <li>
                <strong className="text-white">Timeboxing y productividad:</strong> técnicas que fijan un tiempo máximo
                (timeboxing, Pomodoro) suelen mejorar la sensación de control y la entrega a tiempo, sin empeorar
                necesariamente la calidad.
              </li>
            </ul>
            <p>
              La ley no es una verdad absoluta en todos los contextos: tareas muy complejas o creativas pueden necesitar
              tiempo de exploración. Pero como regla general en entornos de conocimiento y oficina, el patrón se
              repite una y otra vez.
            </p>
          </div>
        </section>
      </RevealOnScroll>

      {/* 5. Consecuencias en negocio */}
      <RevealOnScroll delay={1}>
        <section id="consecuencias-negocio" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6">
            5. Consecuencias de la Ley de Parkinson en empresas y equipos
          </h2>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-6">
            <p>
              Si no se gestiona activamente el tiempo, la ley se traduce en retrasos, sobrecoste y desenfoque:
            </p>
          </div>

          <div className="rounded-2xl border border-red-500/20 bg-red-950/20 p-5 sm:p-6 mb-6">
            <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              Riesgos típicos
            </h4>
            <ul className="space-y-2 text-indigo-100/90 text-sm sm:text-base">
              <li>Proyectos que se alargan porque &quot;hay tiempo&quot; hasta la fecha tope.</li>
              <li>Reuniones que ocupan toda la hora aunque el tema podría cerrarse en 20 minutos.</li>
              <li>Presupuestos de horas que se consumen por completo aunque el alcance no lo justifique.</li>
              <li>Perfeccionismo y retrabajo cuando no hay un límite explícito de tiempo por tarea.</li>
            </ul>
          </div>

          <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            En agencias y equipos que facturan o planifican por horas, esto se traduce directamente en menor
            rentabilidad y en clientes que perciben que &quot;siempre se usa todo el presupuesto&quot;. Fijar límites
            claros (timeboxing, plazos intermedios, reuniones más cortas) es una forma de invertir la ley a tu favor.
          </p>
        </section>
      </RevealOnScroll>

      {/* 6. Antídotos: timeboxing y plazos */}
      <RevealOnScroll delay={1}>
        <section id="antidotos-timeboxing" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6">
            6. Antídotos: timeboxing, plazos y límites explícitos
          </h2>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-6">
            <p>
              La Ley de Parkinson no es fatal: puedes usarla a tu favor reduciendo el tiempo &quot;disponible&quot; y
              haciendo que el trabajo se adapte a ese límite. Las prácticas más efectivas son:
            </p>
          </div>

          <div className="space-y-4 mb-8">
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-5 flex gap-4">
              <CheckCircle2 className="h-6 w-6 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-white font-semibold mb-1">Timeboxing</h4>
                <p className="text-indigo-200/90 text-sm sm:text-base">
                  Asignar un tiempo máximo fijo a cada tarea (ej. 45 minutos para el borrador). Cuando el tiempo se acaba,
                  se pasa a la siguiente tarea. El trabajo deja de expandirse porque el techo está definido.
                </p>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 flex gap-4">
              <CalendarDays className="h-6 w-6 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-white font-semibold mb-1">Plazos cortos e intermedios</h4>
                <p className="text-indigo-200/90 text-sm sm:text-base">
                  En lugar de &quot;entregar cuando puedas&quot;, definir hitos concretos (ej. primer borrador en 2
                  días, revisión en 1 día). El trabajo se reparte en bloques que no se dilatan.
                </p>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 flex gap-4">
              <Zap className="h-6 w-6 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-white font-semibold mb-1">Reuniones con duración fija y agenda timeboxeada</h4>
                <p className="text-indigo-200/90 text-sm sm:text-base">
                  Convocar reuniones de 25 o 30 minutos en lugar de 1 hora, y asignar minutos a cada punto del orden del
                  día. La reunión termina cuando toca, no cuando &quot;se acaba el tema&quot;.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border-2 border-purple-500/40 bg-purple-900/30 p-5 sm:p-8 flex flex-col md:flex-row gap-6 items-center">
            <div className="flex-1">
              <h4 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-purple-300" />
                Cápsula Taimbox: Timeboxing en equipo
              </h4>
              <p className="text-indigo-200/90 text-sm sm:text-base leading-relaxed mb-4">
                En Taimbox planificas por horas y defines cajas de tiempo por tarea y por persona. Así evitas que el
                trabajo se expanda sin control y conectas el tiempo con la rentabilidad del proyecto.
              </p>
              <Link to="/blog/que-es-timeboxing">
                <Button size="sm" className="bg-purple-600 hover:bg-purple-500 text-white font-medium">
                  Guía de timeboxing <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </RevealOnScroll>

      {/* 7. Aplicación en equipos */}
      <RevealOnScroll delay={1}>
        <section id="aplicacion-equipos" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6">
            7. Cómo aplicar esto en equipos y agencias
          </h2>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-6">
            <p>
              A nivel individual, cada persona puede usar timeboxing o plazos personales. A nivel de equipo y agencia,
              hace falta que los límites sean visibles y compartidos:
            </p>
            <ul className="space-y-2 list-disc pl-6 text-indigo-100/90">
              <li>Planificador por horas donde se vea el tiempo asignado por tarea y por persona.</li>
              <li>Presupuesto de horas por proyecto con alertas cuando se acerca al límite.</li>
              <li>Reuniones con duración y orden del día definidos de antemano.</li>
              <li>Revisiones periódicas de &quot;horas consumidas vs. presupuestadas&quot; para detectar si el trabajo
              está expandiéndose más de lo previsto.</li>
            </ul>
            <p>
              Cuando todo el equipo trabaja con la misma lógica de &quot;tiempo fijo, alcance variable&quot;, la Ley de
              Parkinson deja de ser una trampa y se convierte en una palanca: menos tiempo desperdiciado, más
              predictibilidad y mejor margen.
            </p>
          </div>
        </section>
      </RevealOnScroll>

      {/* 8. Resumen, FAQ y CTA */}
      <RevealOnScroll delay={2}>
        <section className="mb-12">
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 sm:p-8 mb-8">
            <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-4">
              La Ley de Parkinson afirma que el trabajo se expande hasta llenar el tiempo disponible; en el mismo marco,
              la segunda ley vincula <strong>gastos e ingresos</strong>, y la ley de la trivialidad explica el tiempo
              perdido en debates irrelevantes. Conocer las tres dimensiones (tiempo, dinero, foco en reuniones) permite
              actuar tanto en hábitos personales como en <strong>estructura</strong> de equipos y procesos.
            </p>
            <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed m-0">
              Los antídotos clásicos son timeboxing, plazos cortos y límites explícitos; en agencias, un planificador por
              horas y presupuestos claros mejora predictibilidad y rentabilidad.
            </p>
          </div>

          <div id="preguntas-frecuentes" className="rounded-3xl border border-indigo-500/30 bg-indigo-950/40 p-6 sm:p-10 mb-10 scroll-mt-24">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-5 text-center">
              Preguntas frecuentes sobre la Ley de Parkinson
            </h2>
            <div className="space-y-6">
              <div>
                <h4 className="text-white font-semibold mb-2">¿La Ley de Parkinson es científica?</h4>
                <p className="text-sm text-indigo-200/90">
                  Es una observación sobre el comportamiento humano, no una ley física. Tiene apoyo indirecto en estudios
                  de psicología y gestión del tiempo (plazos, timeboxing), pero se usa sobre todo como principio
                  práctico para diseñar plazos y límites.
                </p>
              </div>
              <div className="w-full h-px bg-white/10" />
              <div>
                <h4 className="text-white font-semibold mb-2">¿Si doy menos tiempo, empeora la calidad?</h4>
                <p className="text-sm text-indigo-200/90">
                  No necesariamente. Muchas veces un plazo corto obliga a priorizar lo esencial y a evitar trabajo
                  superfluo. La clave es que el plazo sea realista para el resultado esperado; si es imposible, genera
                  estrés y errores. Timeboxing con bloques de 25–90 minutos suele mantener o mejorar el foco sin
                  sacrificar calidad.
                </p>
              </div>
              <div className="w-full h-px bg-white/10" />
              <div>
                <h4 className="text-white font-semibold mb-2">¿Cómo se relaciona con el timeboxing?</h4>
                <p className="text-sm text-indigo-200/90">
                  El timeboxing es uno de los antídotos más directos: fijas un tiempo máximo para la tarea y, cuando se
                  acaba, pasas a la siguiente. Así el trabajo no puede expandirse más allá del límite. Por eso en
                  muchas guías de productividad se cita la Ley de Parkinson como motivación para usar timeboxing.
                </p>
              </div>
              <div className="w-full h-px bg-white/10" />
              <div>
                <h4 className="text-white font-semibold mb-2">¿Qué es la segunda ley de Parkinson sobre dinero?</h4>
                <p className="text-sm text-indigo-200/90">
                  Es la observación de que los gastos tienden a subir hasta ocupar el nivel de ingresos disponible, en
                  paralelo a la primera ley (el trabajo llena el tiempo). En finanzas personales o de empresa, se
                  mitiga con topes, reglas automáticas y revisión periódica, no solo con buenas intenciones.
                </p>
              </div>
              <div className="w-full h-px bg-white/10" />
              <div>
                <h4 className="text-white font-semibold mb-2">¿Qué es la ley de la trivialidad?</h4>
                <p className="text-sm text-indigo-200/90">
                  Es el patrón por el que los equipos dedican tiempo desproporcionado a temas fáciles de entender (detalles
                  menores) y poco a decisiones complejas y críticas. En reuniones, se reduce priorizando lo importante,
                  acotando tiempo por tema y evitando que lo &quot;cómodo de discutir&quot; se coma la agenda.
                </p>
              </div>
            </div>
          </div>

          <div id="cta-ley-parkinson" className="text-center mt-12 mb-8 scroll-mt-24">
            <h2 className="text-2xl sm:text-4xl font-bold text-white mb-4">
              Que el tiempo trabaje a tu favor, no en tu contra
            </h2>
            <p className="text-indigo-100/90 text-lg mb-8 max-w-2xl mx-auto">
              Planificación por horas, límites claros y margen a la vista; en Taimbox se puede probar sin compromiso.
            </p>
            <Link to="/planificador-recursos">
              <Button
                size="lg"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-10 py-6 text-lg font-bold shadow-xl shadow-indigo-500/30 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-indigo-500/40"
              >
                Ver planificador de recursos <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            {relatedPost != null && (
              <div className="mt-12 max-w-xl mx-auto">
                <BlogRelatedPost
                  title={relatedPost.title}
                  description={relatedPost.description}
                  href={relatedPost.href}
                />
              </div>
            )}
            <p className="text-indigo-300 text-sm mt-6 italic">
              Escrito por el equipo de Taimbox — Gestión de recursos y rentabilidad para agencias.
            </p>
          </div>
        </section>
      </RevealOnScroll>
    </article>
  );
}
