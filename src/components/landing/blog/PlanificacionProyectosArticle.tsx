import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  BarChart3,
  Users,
  Target,
  LayoutGrid,
  Wallet,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  GanttChart,
  PieChart,
} from 'lucide-react';
import { RevealOnScroll } from './RevealOnScroll';
import { BlogReadingTime } from './BlogReadingTime';
import { BlogTOC } from './BlogTOC';
import { BlogRelatedPost } from './BlogRelatedPost';
import type { BlogTOCItem } from './BlogTOC';

export interface PlanificacionProyectosArticleProps {
  readingMinutes?: number;
  tocItems?: BlogTOCItem[];
  relatedPost?: { title: string; description: string; href: string };
}

export function PlanificacionProyectosArticle({
  readingMinutes,
  tocItems,
  relatedPost,
}: PlanificacionProyectosArticleProps) {
  return (
    <article
      id="planificacion-proyectos-cronograma-recursos"
      className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 md:py-16 text-left overflow-x-hidden"
    >
      {/* Gancho y título */}
      <section className="mb-12 sm:mb-14">
        <div className="mb-6 text-center flex flex-col items-center gap-3">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-indigo-300 bg-indigo-500/20 border border-indigo-400/30">
            Guía práctica
          </span>
          {readingMinutes != null && <BlogReadingTime minutes={readingMinutes} />}
        </div>
        <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-[2.75rem] font-black text-white mb-5 sm:mb-6 leading-[1.15] tracking-tight text-center">
          Planificación de proyectos: cronograma, presupuesto y recursos
        </h1>
        <div className="space-y-4 text-indigo-100/95 text-base sm:text-lg leading-[1.75]">
          <p>
            Has visto el patrón una y otra vez: el cronograma dice que el proyecto termina en marzo, pero en abril
            siguen reasignando gente. El presupuesto se aprobó en enero y en junio descubres que llevas el doble de
            horas consumidas. La gestión de proyectos se queda en el tablero de tareas y nadie conecta esas tareas con
            quién hace qué, cuántas horas tiene cada uno y qué margen deja el proyecto.
          </p>
          <div className="rounded-2xl border-l-4 border-indigo-400 bg-indigo-500/10 border border-indigo-500/20 p-4 sm:p-6 my-6">
            <p className="text-white/95 font-medium m-0">
              Cuando el cronograma, el presupuesto y los recursos no van de la mano, los proyectos se retrasan, se
              disparan los costes o el equipo termina sobrecargado. Esta guía recorre cómo unir las tres piezas:
              cronograma, presupuesto por proyectos y capacidad del equipo, con ejemplos prácticos y un repaso a las
              herramientas que realmente ayudan.
            </p>
          </div>
        </div>
      </section>

      {tocItems != null && tocItems.length > 0 && (
        <div className="mb-12">
          <BlogTOC items={tocItems} />
        </div>
      )}

      {/* 1. Qué es la planificación de proyectos */}
      <RevealOnScroll>
        <section id="que-es-planificacion" className="mb-12 sm:mb-16">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6">
            1. Qué es la planificación de proyectos
          </h2>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-6">
            <p>
              La planificación de proyectos es la parte de la gestión de proyectos en la que defines qué hay que hacer,
              en qué orden, con qué recursos y en qué plazos. No es solo una lista de tareas: es decidir las fases de un
              proyecto, asignar responsabilidades, estimar tiempos y costes y dejar un marco claro para el seguimiento y
              la evaluación.
            </p>
            <p>
              En la práctica, la planificación suele organizarse en fases. Aunque cada metodología las nombra distinto
              (project management clásico, Scrum, etc.), suele haber un inicio (alcance y objetivos), una fase de
              planificación (cronograma, presupuesto, recursos), la ejecución y el cierre. Lo que nos interesa aquí es que
              en la fase de planificación es donde se construye el cronograma, se fija el presupuesto del proyecto y se
              decide cómo se cubren los recursos para llevarlo a cabo.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 sm:p-8 mb-6 transition-all duration-300 hover:border-white/20 hover:shadow-xl hover:shadow-indigo-500/10">
          <h3 className="text-lg sm:text-xl font-bold text-white mb-4">Las fases de un proyecto (resumen)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-indigo-950/50 border border-indigo-500/20 text-center flex flex-col items-center">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/30 flex items-center justify-center mb-2">
                <Target className="h-5 w-5 text-indigo-300" />
              </div>
              <h4 className="text-white font-semibold text-sm mb-1">Inicio</h4>
              <p className="text-xs text-indigo-200/85">Alcance y objetivos</p>
            </div>
            <div className="p-4 rounded-xl bg-purple-950/50 border border-purple-500/20 text-center flex flex-col items-center">
              <div className="w-10 h-10 rounded-lg bg-purple-500/30 flex items-center justify-center mb-2">
                <LayoutGrid className="h-5 w-5 text-purple-300" />
              </div>
              <h4 className="text-white font-semibold text-sm mb-1">Planificación</h4>
              <p className="text-xs text-indigo-200/85">Cronograma, presupuesto, recursos</p>
            </div>
            <div className="p-4 rounded-xl bg-emerald-950/50 border border-emerald-500/20 text-center flex flex-col items-center">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/30 flex items-center justify-center mb-2">
                <Clock className="h-5 w-5 text-emerald-300" />
              </div>
              <h4 className="text-white font-semibold text-sm mb-1">Ejecución</h4>
              <p className="text-xs text-indigo-200/85">Seguimiento y ajustes</p>
            </div>
            <div className="p-4 rounded-xl bg-amber-950/50 border border-amber-500/20 text-center flex flex-col items-center">
              <div className="w-10 h-10 rounded-lg bg-amber-500/30 flex items-center justify-center mb-2">
                <CheckCircle2 className="h-5 w-5 text-amber-300" />
              </div>
              <h4 className="text-white font-semibold text-sm mb-1">Cierre</h4>
              <p className="text-xs text-indigo-200/85">Evaluación y lecciones</p>
            </div>
          </div>
        </div>

          <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            Sin esa base, el proyecto se convierte en una sucesión de urgencias: no sabes si vas bien o mal hasta que
            llega la facturación o el cliente reclama. Por eso tiene sentido tratar el cronograma, el presupuesto y los
            recursos como un mismo sistema, no como tres documentos sueltos.
          </p>
        </section>
      </RevealOnScroll>

      {/* 2. El cronograma y el diagrama de Gantt */}
      <RevealOnScroll delay={1}>
        <section id="cronograma-gantt" className="mb-12 sm:mb-16">
        <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6">
          2. El cronograma y el diagrama de Gantt
        </h2>
        <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-6">
          <p>
            El cronograma de un proyecto es la línea temporal de hitos y tareas: qué se hace y cuándo. La forma más
            visual de representarlo es el diagrama de Gantt: barras sobre una escala de tiempo que muestran la duración
            de cada actividad y, en muchas herramientas, las dependencias entre ellas. Sirve para ver de un vistazo si
            las fechas encajan y qué tareas son críticas.
          </p>
          <p>
            Un diagrama de Gantt bien usado te ayuda a responder preguntas como: ¿cuándo empieza y termina cada fase?,
            ¿qué tareas bloquean a otras?, ¿hay huecos o solapamientos evidentes? Herramientas como cronogramas online
            o software de project management suelen incluir una vista Gantt; también puedes hacer un diagrama de Gantt
            en Excel con una plantilla o usar una herramienta específica. Lo importante es que el cronograma sea
            creíble: que refleje dependencias reales y que, en la medida de lo posible, esté alineado con la capacidad
            de quien va a ejecutar el trabajo.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 sm:p-8 mb-6 transition-all duration-300 hover:border-white/20 hover:shadow-xl hover:shadow-amber-500/10">
          <h3 className="text-lg sm:text-xl font-bold text-white mb-3">Cronograma solo por tareas vs. cronograma con recursos</h3>
          <p className="text-indigo-100/90 mb-4">El Gantt clásico muestra plazos; no suele mostrar quién hace qué ni cuántas horas tiene cada uno.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-800/50 border border-white/10 text-center flex flex-col items-center">
              <GanttChart className="h-8 w-8 text-amber-400 mb-3" />
              <h4 className="text-white font-semibold mb-2">Solo tareas y plazos</h4>
              <p className="text-sm text-indigo-200/90">Ves fechas y dependencias. No ves si la misma persona está en tres proyectos la misma semana.</p>
            </div>
            <div className="p-4 rounded-xl bg-indigo-950/50 border border-indigo-500/20 text-center flex flex-col items-center">
              <div className="flex items-center gap-2 mb-3">
                <GanttChart className="h-6 w-6 text-indigo-400" />
                <Users className="h-6 w-6 text-indigo-400" />
              </div>
              <h4 className="text-white font-semibold mb-2">Tareas + recursos y horas</h4>
              <p className="text-sm text-indigo-200/90">Cronograma alineado con capacidad: quién hace qué y con cuántas horas. Evita sobrecargas ocultas.</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border-l-4 border-amber-400 bg-amber-500/10 border border-amber-500/20 p-4 sm:p-6">
          <h3 className="text-lg font-bold text-white mb-2">Limitación habitual del Gantt</h3>
          <p className="text-indigo-100/90 m-0">
            Puedes tener un cronograma perfecto en el papel y, en la realidad, que tres proyectos pidan al mismo recurso
            en la misma semana. Por eso el siguiente paso lógico es conectar el cronograma con los recursos: quién hace
            qué y con cuántas horas.
          </p>
        </div>
        </section>
      </RevealOnScroll>

      {/* 3. Presupuesto del proyecto */}
      <RevealOnScroll delay={2}>
        <section id="presupuesto-proyecto" className="mb-12 sm:mb-16">
        <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6">
          3. Presupuesto del proyecto
        </h2>
        <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-6">
          <p>
            El presupuesto de un proyecto fija cuánto vas a gastar (o cuánto vas a invertir en horas y costes) para
            entregar el alcance acordado. En muchas agencias y equipos de servicios, el presupuesto por proyectos se
            construye a partir de las horas: horas estimadas por rol o por persona, multiplicadas por un coste o por
            un precio de venta. Una matriz de presupuesto del proyecto puede desglosar por fases, por paquetes de
            trabajo o por mes, según cómo factures o controles.
          </p>
          <p>
            La relación con el cronograma es directa: si el cronograma se alarga, las horas reales suelen dispararse y
            el presupuesto se desvía. El famoso triángulo de la gestión de proyectos (alcance, tiempo, coste) sigue
            vigente: si cambias uno, sueles afectar a los otros.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 sm:p-8 mb-6 transition-all duration-300 hover:border-white/20 hover:shadow-xl hover:shadow-purple-500/10">
          <h3 className="text-lg sm:text-xl font-bold text-white mb-4">El triángulo alcance – tiempo – coste</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-indigo-950/50 border border-indigo-500/20 text-center">
              <Target className="h-7 w-7 text-indigo-400 mx-auto mb-2" />
              <h4 className="text-white font-semibold text-sm mb-1">Alcance</h4>
              <p className="text-xs text-indigo-200/85">Qué se entrega (entregables, requisitos)</p>
            </div>
            <div className="p-4 rounded-xl bg-purple-950/50 border border-purple-500/20 text-center">
              <Clock className="h-7 w-7 text-purple-400 mx-auto mb-2" />
              <h4 className="text-white font-semibold text-sm mb-1">Tiempo</h4>
              <p className="text-xs text-indigo-200/85">Plazos y cronograma</p>
            </div>
            <div className="p-4 rounded-xl bg-emerald-950/50 border border-emerald-500/20 text-center">
              <Wallet className="h-7 w-7 text-emerald-400 mx-auto mb-2" />
              <h4 className="text-white font-semibold text-sm mb-1">Coste</h4>
              <p className="text-xs text-indigo-200/85">Presupuesto (horas × tarifa, otros costes)</p>
            </div>
          </div>
          <p className="text-indigo-200/80 text-sm mt-4 text-center">
            Cambiar uno suele impactar en los otros dos. Por eso el presupuesto debe ligarse a las mismas fases y tareas del cronograma.
          </p>
        </div>

        <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed">
          Por eso tiene sentido que el presupuesto no sea un número suelto, sino horas y costes asignados a las mismas
          fases y tareas que ya tienes en el cronograma. Así, cuando hagas el seguimiento, podrás comparar horas
          presupuestadas con horas reales y ver si el proyecto sigue dentro del margen.
        </p>
        </section>
      </RevealOnScroll>

      {/* 4. Recursos y capacidad */}
      <RevealOnScroll delay={3}>
        <section id="recursos-capacidad" className="mb-12 sm:mb-16">
        <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6">
          4. Recursos y capacidad
        </h2>
        <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-6">
          <p>
            Los recursos para llevar a cabo un proyecto son, en la mayoría de los casos, las personas: su tiempo y su
            capacidad. La capacidad del equipo es la cantidad de horas disponibles en un periodo (día, semana, mes)
            descontando vacaciones, bajas y otras ausencias. Si no tienes claro cuántas horas tiene cada persona por
            semana, es muy fácil asignar más trabajo del que pueden hacer o, al revés, dejar capacidad sin usar.
          </p>
          <p>
            La asignación de horas es el puente entre el cronograma y el presupuesto: quién dedica cuántas horas a qué
            proyecto en cada semana. Cuando esa asignación se hace de forma explícita (por ejemplo con un planificador
            semanal o mensual por horas), puedes ver sobrecargas e infrautilización antes de que se conviertan en
            retrasos o en márgenes comidos.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
          <div className="rounded-2xl border border-red-500/30 bg-gradient-to-br from-red-900/40 to-orange-900/20 p-5 sm:p-6 flex flex-col items-center text-center shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:border-red-400/50">
            <div className="w-12 h-12 rounded-xl bg-red-500/30 flex items-center justify-center mb-4">
              <AlertTriangle className="h-6 w-6 text-red-300" />
            </div>
            <h3 className="text-white font-bold mb-3 text-lg">Sin visibilidad de capacidad</h3>
            <p className="text-indigo-100/90 text-sm leading-relaxed">
              Asignas tareas sin saber cuántas horas tiene cada persona. Resultado: sobrecarga, retrasos y márgenes que se comen sin que nadie lo vea a tiempo.
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-900/40 to-teal-900/20 p-5 sm:p-6 flex flex-col items-center text-center shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:border-emerald-400/50">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/30 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-6 w-6 text-emerald-300" />
            </div>
            <h3 className="text-white font-bold mb-3 text-lg">Planificación por horas</h3>
            <p className="text-indigo-100/90 text-sm leading-relaxed">
              Ves quién tiene cuántas horas libres y cuántas asignadas por proyecto. Detectas sobrecargas antes de que ocurran y ajustas el cronograma o el alcance.
            </p>
          </div>
        </div>

        <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-6">
          Esta forma de trabajar está muy alineada con el timeboxing: asignar bloques de tiempo concretos a proyectos
          o tareas en lugar de solo listar tareas sin tiempo. Si quieres profundizar en la técnica, tenemos una guía dedicada:{' '}
          <Link to="/blog/que-es-timeboxing" className="text-indigo-300 hover:text-white underline underline-offset-2">
            qué es el timeboxing
          </Link>
          .
        </p>

        <div className="rounded-2xl border-2 border-indigo-500/40 bg-indigo-900/30 p-5 sm:p-8 flex flex-col md:flex-row gap-6 items-center shadow-2xl transition-all duration-300 hover:shadow-indigo-500/20 hover:border-indigo-400/60 hover:scale-[1.01]">
          <div className="flex-1">
            <h4 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <span className="text-xl">💡</span> Cápsula Taimbox: Cronograma y capacidad en un solo sitio
            </h4>
            <p className="text-indigo-200/90 text-sm sm:text-base leading-relaxed mb-4">
              En Taimbox el planificador muestra semana a semana quién hace qué y con cuántas horas. Así unes cronograma, presupuesto por proyectos y recursos sin tener que cruzar tres herramientas.
            </p>
            <Link to="/planificador-recursos">
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-lg shadow-indigo-500/30 transition-all duration-200 hover:scale-105">
                Ver planificador de recursos <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/30 p-5 sm:p-6 mt-6">
          <p className="text-indigo-100/90 m-0">
            En resumen: el cronograma te dice cuándo; el presupuesto, cuánto; los recursos y la capacidad, quién y con
            cuántas horas. Unir los tres evita que los proyectos vivan solo en el tablero de tareas y que la
            rentabilidad se descubra cuando ya es tarde.
          </p>
        </div>
        </section>
      </RevealOnScroll>

      {/* 5. Seguimiento, KPIs y dashboard */}
      <RevealOnScroll>
        <section id="seguimiento-kpis-dashboard" className="mb-12 sm:mb-16">
        <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6">
          5. Seguimiento, KPIs y dashboard de proyectos
        </h2>
        <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-6">
          El seguimiento y la evaluación de proyectos consisten en comparar lo planificado con lo real: avance,
          horas consumidas, costes y, si aplica, satisfacción del cliente. Para eso sirven los indicadores: el KPI de
          un proyecto puede ser el avance frente al plan, las horas reales frente a las presupuestadas o el margen
          actual del proyecto.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 mb-8">
          <div className="rounded-2xl border border-indigo-500/20 bg-indigo-950/30 p-5 flex flex-col items-center text-center transition-all duration-300 hover:border-indigo-400/40 hover:scale-[1.02] hover:shadow-lg hover:shadow-indigo-500/20">
            <BarChart3 className="h-8 w-8 text-indigo-400 mb-4" />
            <h4 className="text-white font-bold mb-2">Avance vs. plan</h4>
            <p className="text-sm text-indigo-200/85">¿Vamos por donde tocaba? Porcentaje de tareas o hitos completados respecto al cronograma.</p>
          </div>
          <div className="rounded-2xl border border-purple-500/20 bg-purple-950/30 p-5 flex flex-col items-center text-center transition-all duration-300 hover:border-purple-400/40 hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/20">
            <Clock className="h-8 w-8 text-purple-400 mb-4" />
            <h4 className="text-white font-bold mb-2">Horas reales vs. presupuestadas</h4>
            <p className="text-sm text-indigo-200/85">¿Nos estamos pasando de horas? Si las reales superan las previstas, el margen cae.</p>
          </div>
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/30 p-5 flex flex-col items-center text-center transition-all duration-300 hover:border-emerald-400/40 hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-500/20">
            <PieChart className="h-8 w-8 text-emerald-400 mb-4" />
            <h4 className="text-white font-bold mb-2">Margen del proyecto</h4>
            <p className="text-sm text-indigo-200/85">Ingresos menos costes (horas × tarifa, etc.). El indicador que conecta tiempo y rentabilidad.</p>
          </div>
        </div>

        <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-4">
          Un dashboard de proyectos que merezca la pena suele mostrar al menos: estado de cada proyecto (en plazo,
          en riesgo, retrasado), horas asignadas vs. horas reales (o vs. presupuesto) y carga por persona o por
          equipo. Así ves si un proyecto se está comiendo más horas de las previstas y si alguien está sobreasignado.
        </p>
        <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed">
          En una agencia pequeña o mediana, tener un único lugar donde cruzar cronograma, presupuesto y horas reales
          suele marcar la diferencia entre reaccionar a tiempo y enterarte cuando el cliente ya está enfadado.
        </p>
        </section>
      </RevealOnScroll>

      {/* 6. Herramientas */}
      <RevealOnScroll delay={1}>
        <section id="herramientas-gestion-proyectos" className="mb-12 sm:mb-16">
        <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6">
          6. Herramientas de gestión de proyectos
        </h2>
        <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-6">
          Las herramientas de gestión de proyectos cubren necesidades distintas. Los tableros tipo Kanban (Trello,
          Asana, ClickUp, Notion para proyectos) son muy útiles para el estado de las tareas y el flujo de trabajo;
          muchos incluyen también vista de cronograma o diagrama de Gantt.
        </p>

        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 sm:p-8 mb-6 transition-all duration-300 hover:border-white/20 hover:shadow-xl">
          <h3 className="text-lg sm:text-xl font-bold text-white mb-3">¿Qué resuelve cada tipo de herramienta?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-800/50 border border-white/10 flex flex-col transition-all duration-300 hover:border-white/20 hover:scale-[1.02]">
              <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                <LayoutGrid className="h-5 w-5 text-indigo-400" /> Tableros y Gantt
              </h4>
              <p className="text-sm text-indigo-200/90">
                Estado de tareas, flujo de trabajo, dependencias y plazos. No suelen mostrar capacidad ni horas por persona ni margen por proyecto.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-indigo-950/50 border border-indigo-500/20 flex flex-col transition-all duration-300 hover:border-indigo-400/40 hover:scale-[1.02] hover:shadow-lg hover:shadow-indigo-500/20">
              <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-400" /> Planificación por horas y recursos
              </h4>
              <p className="text-sm text-indigo-200/90">
                Quién hace qué y con cuántas horas. Presupuesto por proyectos ligado a esas horas y reportes de margen (asignado vs. real).
              </p>
            </div>
          </div>
        </div>

        <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-6">
          Para conectar tiempo, capacidad y rentabilidad hacen falta herramientas que trabajen con horas de forma
          explícita. En Taimbox nos centramos en ese tramo: planificación de recursos por horas, cronograma de quién
          hace qué cada semana, y reportes de rentabilidad por proyecto y por cliente.
        </p>

        <div className="rounded-2xl border-2 border-purple-500/40 bg-purple-900/30 p-5 sm:p-8 flex flex-col md:flex-row gap-6 items-center shadow-2xl transition-all duration-300 hover:shadow-purple-500/20 hover:border-purple-400/60 hover:scale-[1.01]">
          <div className="flex-1">
            <h4 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <span className="text-xl">📊</span> Cápsula Taimbox: Planificador + reportes de rentabilidad
            </h4>
            <p className="text-indigo-200/90 text-sm sm:text-base leading-relaxed mb-4">
              Planifica por horas en el planificador, sigue el avance en el dashboard y revisa margen por proyecto y por cliente en los reportes de rentabilidad. Todo en una sola plataforma.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/planificador-recursos">
                <Button size="sm" className="bg-purple-600 hover:bg-purple-500 text-white font-medium shadow-lg shadow-purple-500/30 transition-all duration-200 hover:scale-105 hover:shadow-purple-500/40">
                  Planificador <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/reportes-rentabilidad">
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-lg shadow-emerald-500/30 transition-all duration-200 hover:scale-105 hover:shadow-emerald-500/40 border-0">
                  Reportes de rentabilidad <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed mt-6">
          Si quieres ver cómo encaja en tu flujo, las opciones de precios están en la página de{' '}
          <Link to="/precios" className="text-indigo-300 hover:text-white underline underline-offset-2">
            precios
          </Link>
          .
        </p>
        </section>
      </RevealOnScroll>

      {/* 7. Resumen, FAQ y CTA */}
      <RevealOnScroll delay={2}>
        <section className="mb-12">
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 sm:p-8 mb-8">
          <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-4">
            Planificar un proyecto de forma sólida implica alinear cronograma, presupuesto y recursos: qué se hace y
            cuándo, cuánto cuesta y quién lo hace con cuántas horas. El diagrama de Gantt y el cronograma son la base
            visual; el presupuesto por proyectos y la asignación de horas son lo que evita que todo se quede en
            intenciones. El seguimiento con KPIs y un dashboard sencillo te permite corregir antes de que el proyecto se
            desvíe del todo.
          </p>
          <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed m-0">
            Si en tu agencia o equipo ya usáis tableros de tareas pero os falta ese enlace entre tiempo, capacidad y
            rentabilidad, probar un planificador por horas puede ser el siguiente paso.
          </p>
        </div>

        <div id="preguntas-frecuentes" className="rounded-3xl border border-indigo-500/30 bg-indigo-950/40 p-6 sm:p-10 mb-10 transition-all duration-300 hover:border-indigo-400/50 hover:shadow-xl hover:shadow-indigo-500/10 scroll-mt-24">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-5 text-center">
            Preguntas frecuentes sobre planificación de proyectos
          </h2>
          <div className="space-y-6">
            <div>
              <h4 className="text-white font-semibold mb-2">¿El diagrama de Gantt es suficiente para gestionar un proyecto?</h4>
              <p className="text-sm text-indigo-200/90">
                Para plazos y dependencias sí. Para saber si vas a cumplir el presupuesto y si tu equipo tiene capacidad real, no: necesitas cruzar el cronograma con las horas por persona y con el presupuesto por proyecto.
              </p>
            </div>
            <div className="w-full h-px bg-white/10" />
            <div>
              <h4 className="text-white font-semibold mb-2">¿Qué KPI de proyecto tiene más sentido en una agencia?</h4>
              <p className="text-sm text-indigo-200/90">
                Horas reales vs. presupuestadas y margen por proyecto (o por cliente). Son los que conectan el tiempo con la rentabilidad. El avance frente al cronograma ayuda, pero sin horas y margen no ves si el proyecto es rentable.
              </p>
            </div>
            <div className="w-full h-px bg-white/10" />
            <div>
              <h4 className="text-white font-semibold mb-2">¿Puedo usar un tablero Kanban y un planificador por horas a la vez?</h4>
              <p className="text-sm text-indigo-200/90">
                Sí. Muchos equipos usan Trello, Asana o similar para el día a día de las tareas y una herramienta de planificación por horas (como Taimbox) para capacidad, presupuesto y margen. Se complementan: el tablero para el flujo, el planificador para el tiempo y el dinero.
              </p>
            </div>
          </div>
        </div>

        <div id="cta-planifica" className="text-center mt-12 mb-8 scroll-mt-24">
          <h2 className="text-2xl sm:text-4xl font-bold text-white mb-4">
            Planifica por horas y recupera el control del margen
          </h2>
          <p className="text-indigo-100/90 text-lg mb-8 max-w-2xl mx-auto">
            Cronograma, presupuesto y recursos en un solo lugar. Prueba Taimbox sin compromiso.
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
