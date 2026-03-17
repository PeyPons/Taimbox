import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
    ArrowRight,
    Clock,
    Target,
    Brain,
    Zap,
    AlertTriangle,
    TrendingUp,
    Users,
    CalendarDays,
    ListTodo,
    CheckCircle2,
    ChevronRight
} from 'lucide-react';
import { BlogReadingTime } from '@/components/landing/blog/BlogReadingTime';
import { BlogTOC, type BlogTOCItem } from '@/components/landing/blog/BlogTOC';
import { BlogRelatedPost } from '@/components/landing/blog/BlogRelatedPost';

export interface WhatIsTimeboxingArticleProps {
  readingMinutes?: number;
  tocItems?: BlogTOCItem[];
  relatedPost?: { title: string; description: string; href: string };
}

export function WhatIsTimeboxingArticle({ readingMinutes, tocItems, relatedPost }: WhatIsTimeboxingArticleProps = {}) {
    return (
        <article id="que-es-timeboxing" className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 md:py-16 text-left overflow-x-hidden">

            {/* Gancho y Título Principal */}
            <section className="mb-12 sm:mb-14">
                <div className="mb-6 text-center flex flex-col sm:flex-row items-center justify-center gap-3">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-indigo-300 bg-indigo-500/20 border border-indigo-400/30">
                        Guía Definitiva
                    </span>
                    {readingMinutes != null && <BlogReadingTime minutes={readingMinutes} />}
                </div>
                <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-[2.75rem] font-black text-white mb-5 sm:mb-6 leading-[1.15] tracking-tight text-center">
                    Qué es el Timeboxing: La Guía Definitiva de Productividad para Empresas
                </h1>
                <div className="space-y-4 text-indigo-100/95 text-base sm:text-lg leading-[1.75]">
                    <p>
                        Todos hemos lidiado con esa tarea que, en teoría, iba a tomar 30 minutos, pero que por distracciones o perfeccionismo terminó devorando nuestro día completo. Si no establecemos reglas o límites, el trabajo se expande sin control. De hecho, existe una ley para esto: <strong>La Ley de Parkinson</strong>, que postula que <em>"el trabajo se expande hasta llenar el tiempo disponible para su finalización"</em>.
                    </p>
                    <div className="rounded-2xl border-l-4 border-indigo-400 bg-indigo-500/10 border border-indigo-500/20 p-4 sm:p-6 my-6">
                        <p className="text-white/95 font-medium m-0">
                            Para combatir esta pérdida de tiempo y recursos, las empresas más eficientes y los profesionales de alto rendimiento utilizan una estrategia implacable: el <strong>Timeboxing</strong>.
                        </p>
                    </div>
                    <p>
                        En esta guía definitiva, desglosaremos qué es exactamente el Timeboxing, cómo implementarlo paso a paso en tu día a día, cómo escalarlo a todo tu equipo y, lo más importante, cómo convertir esta técnica de productividad en <strong>rentabilidad real para tu empresa</strong>.
                    </p>
                </div>
                {tocItems != null && tocItems.length > 0 && (
                    <div className="mt-8">
                        <BlogTOC items={tocItems} />
                    </div>
                )}
            </section>

            {/* 1. Qué es el Timeboxing */}
            <section id="que-es-timeboxing-diferencia" className="mb-12 sm:mb-16 scroll-mt-24">
                <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
                    1. ¿Qué es el Timeboxing y en qué se diferencia?
                </h2>
                <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-6">
                    <p>
                        El <strong>Timeboxing</strong> es una estrategia de gestión del tiempo orientada a objetivos que consiste en asignar un período de tiempo estricto, fijo y máximo (una "caja de tiempo" o <em>timebox</em>) a una tarea o actividad específica. Cuando el tiempo se acaba, la tarea se detiene, independientemente de si está terminada al 100% o no.
                    </p>
                    <p>Esta metodología propone una <strong>inversión radical</strong> de cómo entendemos el trabajo tradicional:</p>
                    <ul className="space-y-3 mt-4">
                        <li className="flex gap-3">
                            <AlertTriangle className="h-6 w-6 text-red-400 shrink-0" />
                            <span><strong className="text-white">Enfoque tradicional:</strong> El alcance de la tarea es fijo (hay que terminarla perfecta) y el tiempo es variable (tardas lo que haga falta).</span>
                        </li>
                        <li className="flex gap-3">
                            <CheckCircle2 className="h-6 w-6 text-emerald-400 shrink-0" />
                            <span><strong className="text-white">Enfoque Timeboxing:</strong> El tiempo es fijo (tienes exactamente 45 minutos) y el alcance es variable (haces el mejor trabajo posible dentro de ese límite).</span>
                        </li>
                    </ul>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 sm:p-8">
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-3">Timeboxing vs. Time Blocking: No son lo mismo</h3>
                    <p className="text-indigo-100/90 mb-4">Es común confundirlos, pero hay una diferencia vital:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-indigo-950/50 border border-indigo-500/20 text-center flex flex-col items-center">
                            <h4 className="text-white font-semibold mb-2 flex items-center justify-center gap-2"><CalendarDays className="h-5 w-5 text-indigo-400" /> Time Blocking</h4>
                            <p className="text-sm text-indigo-200/90">Reservar un espacio en el calendario (ej. "De 10:00 a 12:00 trabajaré en el proyecto X").</p>
                        </div>
                        <div className="p-4 rounded-xl bg-purple-950/50 border border-purple-500/20 text-center flex flex-col items-center">
                            <h4 className="text-white font-semibold mb-2 flex items-center justify-center gap-2"><Target className="h-5 w-5 text-purple-400" /> Timeboxing</h4>
                            <p className="text-sm text-indigo-200/90">Añade un límite estricto y un objetivo. (ej. "A las 11:30, el borrador se da por concluido y paso a lo siguiente").</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. Bloques de Tiempo Rígidos vs. Flexibles */}
            <section id="bloques-rigidos-flexibles" className="mb-12 sm:mb-16 scroll-mt-24">
                <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6">
                    2. Bloques de Tiempo Rígidos vs. Flexibles
                </h2>
                <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-6">
                    Antes de empezar a crear tus cajas de tiempo, debes decidir qué tipo de enfoque necesita la tarea a la que te enfrentas.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
                    <div className="rounded-2xl border border-red-500/30 bg-gradient-to-br from-red-900/40 to-orange-900/20 p-5 sm:p-6 flex flex-col items-center text-center shadow-lg">
                        <div className="w-12 h-12 rounded-xl bg-red-500/30 flex items-center justify-center mb-4">
                            <Clock className="h-6 w-6 text-red-300" />
                        </div>
                        <h3 className="text-white font-bold mb-3 text-xl">Timebox Rígido (Hard Timebox)</h3>
                        <p className="text-indigo-100/90 text-sm leading-relaxed mb-4">
                            Implica que <strong>debes detener tu trabajo obligatoriamente</strong> cuando suene el cronómetro.
                        </p>
                        <ul className="text-sm text-indigo-200/85 space-y-2 mt-auto">
                            <li><strong className="text-white">Cuándo usarlo:</strong> Tareas propensas al perfeccionismo (diseño), investigación o reuniones limitadas.</li>
                            <li><strong className="text-white">El beneficio:</strong> Cura el perfeccionismo tóxico y garantiza que el resto del día no sufra retrasos.</li>
                        </ul>
                    </div>

                    <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-900/40 to-teal-900/20 p-5 sm:p-6 flex flex-col items-center text-center shadow-lg">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/30 flex items-center justify-center mb-4">
                            <Zap className="h-6 w-6 text-emerald-300" />
                        </div>
                        <h3 className="text-white font-bold mb-3 text-xl">Timebox Flexible (Soft Timebox)</h3>
                        <p className="text-indigo-100/90 text-sm leading-relaxed mb-4">
                            El límite actúa como <strong>aviso o punto de control</strong>. Sabes que debes ir concluyendo, pero tienes margen para cerrar bien la tarea.
                        </p>
                        <ul className="text-sm text-indigo-200/85 space-y-2 mt-auto">
                            <li><strong className="text-white">Cuándo usarlo:</strong> Trabajos creativos complejos (redacción, programación) o entregas a clientes inamovibles.</li>
                        </ul>
                    </div>
                </div>

                {/* Cápsula Taimbox 1 */}
                <div className="rounded-2xl border-2 border-indigo-500/40 bg-indigo-900/30 p-5 sm:p-8 flex flex-col md:flex-row gap-6 items-center shadow-2xl">
                    <div className="flex-1">
                        <h4 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                            <span className="text-xl">💡</span> Cápsula Taimbox: Visualiza y Controla tu Semana
                        </h4>
                        <p className="text-indigo-200/90 text-sm sm:text-base leading-relaxed mb-4">
                            La teoría del Timeboxing falla si solo la tienes en tu cabeza. En <strong>Taimbox</strong>, hemos diseñado un Planificador de Recursos que permite a managers y empleados "dibujar" estas cajas de tiempo visualmente.
                        </p>
                        <Link to="/planificador-recursos" target="_blank" rel="noopener noreferrer">
                            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium">
                                Descubre el Planificador de Recursos <ChevronRight className="ml-1 h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* 3. Neurociencia */}
            <section id="neurociencia" className="mb-12 sm:mb-16 scroll-mt-24">
                <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6">
                    3. La Neurociencia: ¿Por qué funciona el Timeboxing?
                </h2>
                <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-6">
                    Harvard Business Review clasificó el Timeboxing como la habilidad #1 de productividad. ¿El motivo? Su impacto directo en la neurociencia humana:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
                    <div className="rounded-2xl border border-purple-500/20 bg-purple-950/30 p-5 flex flex-col items-center text-center">
                        <Brain className="h-8 w-8 text-purple-400 mb-4" />
                        <h4 className="text-white font-bold mb-2">Elimina la fatiga de decisión</h4>
                        <p className="text-sm text-indigo-200/85">Al planificar tus cajas de tiempo el día anterior, eliminas la pregunta diaria de "¿Qué hago ahora?". Tu cerebro simplemente ejecuta el plan.</p>
                    </div>
                    <div className="rounded-2xl border border-indigo-500/20 bg-indigo-950/30 p-5 flex flex-col items-center text-center">
                        <Target className="h-8 w-8 text-indigo-400 mb-4" />
                        <h4 className="text-white font-bold mb-2">Induce el Estado de Flujo</h4>
                        <p className="text-sm text-indigo-200/85">Saber que tienes un tiempo limitado crea un sentido de urgencia positivo, obligando a tu cerebro a ignorar distracciones y concentrarse.</p>
                    </div>
                    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/30 p-5 flex flex-col items-center text-center">
                        <Zap className="h-8 w-8 text-emerald-400 mb-4" />
                        <h4 className="text-white font-bold mb-2">Recompensa por objetivos</h4>
                        <p className="text-sm text-indigo-200/85">Cada vez que terminas una "caja", tu cerebro libera dopamina, manteniéndote motivado para la siguiente tarea de la jornada.</p>
                    </div>
                </div>
            </section>

            {/* 4. Implementación paso a paso */}
            <section id="implementacion-paso-a-paso" className="mb-12 sm:mb-16 scroll-mt-24">
                <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6">
                    4. Cómo aplicar el Timeboxing paso a paso
                </h2>

                <div className="space-y-6 mb-8">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 md:p-6 flex flex-col md:flex-row gap-5">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-500/30 text-indigo-300 font-bold text-lg">1</div>
                        <div className="flex-1 w-full">
                            <h4 className="text-white font-bold text-lg mb-2">Identifica y divide la tarea</h4>
                            <p className="text-indigo-200/90 text-sm sm:text-base mb-2">Si tienes una tarea de más de 3 horas, divídela. Los bloques grandes fomentan la pérdida de atención.</p>
                            <div className="text-sm px-4 py-3 bg-indigo-950/50 rounded-lg border border-indigo-500/30 text-indigo-100">
                                <strong className="text-indigo-300">Ejemplo B2B:</strong> En lugar de 4h para "Crear Propuesta", usa "Investigación" (45 min), "Redacción" (90 min), y "Revisión" (30 min).
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 md:p-6 flex flex-col md:flex-row gap-5">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-500/30 text-indigo-300 font-bold text-lg">2</div>
                        <div className="flex-1 w-full">
                            <h4 className="text-white font-bold text-lg mb-2">Asigna la caja de tiempo y un objetivo</h4>
                            <p className="text-indigo-200/90 text-sm sm:text-base mb-2">Define cuánto durará y qué debe estar terminado estrictamente al finalizar.</p>
                            <div className="text-sm px-4 py-3 bg-indigo-950/50 rounded-lg border border-indigo-500/30 text-indigo-100">
                                <strong className="text-indigo-300">Ejemplo:</strong> "45 minutos. Objetivo: Tener un esquema en viñetas de los 5 puntos clave."
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 md:p-6 flex flex-col md:flex-row gap-5">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-500/30 text-indigo-300 font-bold text-lg">3</div>
                        <div>
                            <h4 className="text-white font-bold text-lg mb-2">Configura el entorno y ejecuta</h4>
                            <p className="text-indigo-200/90 text-sm sm:text-base">Apaga las notificaciones, pon en marcha un cronómetro real y evalúa al final si sobró o faltó tiempo. La retrospectiva mejora tus futuras estimaciones.</p>
                        </div>
                    </div>
                </div>

                {/* Cápsula Taimbox 2 */}
                <div className="rounded-2xl border-2 border-purple-500/40 bg-purple-900/30 p-5 sm:p-8 flex flex-col md:flex-row gap-6 items-center shadow-2xl">
                    <div className="flex-1">
                        <h4 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                            <span className="text-xl">⏱️</span> Cápsula Taimbox: El Cronómetro Integrado
                        </h4>
                        <p className="text-indigo-200/90 text-sm sm:text-base leading-relaxed mb-4">
                            Olvídate de usar el cronómetro del móvil. En el Dashboard del Empleado de Taimbox, cada tarea tiene un cronómetro nativo vinculado a los proyectos de la agencia.
                        </p>
                        <Link to="/dashboard-empleado" target="_blank" rel="noopener noreferrer">
                            <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white font-medium">
                                Descubre el Dashboard del Empleado <ChevronRight className="ml-1 h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* 5. Equipos y Rentabilidad */}
            <section id="equipos-rentabilidad" className="mb-12 sm:mb-16 scroll-mt-24">
                <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6">
                    5. Timeboxing para Equipos: De la Tarea a la Rentabilidad
                </h2>
                <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-6">
                    El Timeboxing individual te hace rápido. El <strong>Timeboxing en equipo</strong> hace a tu empresa más rentable. Cuando coordinas a decenas de empleados, aseguras que el tiempo invertido en un cliente no supere el presupuesto.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
                    <div className="p-5 rounded-xl border border-white/10 bg-gradient-to-br from-indigo-900/30 to-slate-900/50 flex flex-col items-center text-center">
                        <h4 className="text-white font-semibold mb-3 flex items-center justify-center gap-2">
                            <TrendingUp className="h-5 w-5 text-indigo-400" />
                            Identificación de Fugas
                        </h4>
                        <p className="text-sm text-indigo-200/85 leading-relaxed">
                            Si una "Caja de Auditoría" se estima en 2 horas, pero el equipo sistemáticamente usa 4 horas, como Manager acabas de detectar un cuello de botella y una fuga de rentabilidad.
                        </p>
                    </div>
                    <div className="p-5 rounded-xl border border-white/10 bg-gradient-to-br from-indigo-900/30 to-slate-900/50 flex flex-col items-center text-center">
                        <h4 className="text-white font-semibold mb-3 flex items-center justify-center gap-2">
                            <Users className="h-5 w-5 text-indigo-400" />
                            Capacidad Operativa
                        </h4>
                        <p className="text-sm text-indigo-200/85 leading-relaxed">
                            Al planificar con bloques predefinidos, es imposible sobrecargar a un empleado. La semana tiene 40h; si las cajas suman 42h, el sistema evita el <em>burnout</em> previniendo antes de actuar.
                        </p>
                    </div>
                </div>

                {/* Cápsula Taimbox 3 */}
                <div className="rounded-2xl border-2 border-emerald-500/40 bg-emerald-900/30 p-5 sm:p-8 flex flex-col md:flex-row gap-6 items-center shadow-2xl">
                    <div className="flex-1">
                        <h4 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                            <span className="text-xl">💰</span> Cápsula Taimbox: El Salto a la Rentabilidad Financiera
                        </h4>
                        <p className="text-indigo-200/90 text-sm sm:text-base leading-relaxed mb-4">
                            Taimbox es el único software que cruza el tiempo consumido de estas cajas con los datos financieros. A través de integraciones nativas cruzamos los costes laborales con el gasto publicitario y los ingresos, dándote informes de margen en tiempo real.
                        </p>
                        <Link to="/integraciones" target="_blank" rel="noopener noreferrer">
                            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium">
                                Ver Integraciones y Finanzas <ChevronRight className="ml-1 h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* 6. Reuniones */}
            <section id="timeboxing-reuniones" className="mb-12 sm:mb-16 scroll-mt-24">
                <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6">
                    6. Timeboxing en reuniones empresariales
                </h2>
                <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-6">
                    ¿Harto de la "reunionitis"? El Timeboxing es la solución definitiva para evitar que las sesiones se extiendan sin llegar a conclusiones.
                </p>
                <ul className="space-y-4">
                    <li className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
                        <CheckCircle2 className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
                        <p className="text-sm sm:text-base text-indigo-100/90 m-0"><strong className="text-white">Agenda Timeboxeada:</strong> Asigna minutos a cada tema (Ej: Intro 5 min, Análisis 15 min, Pasos 10 min).</p>
                    </li>
                    <li className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
                        <CheckCircle2 className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
                        <p className="text-sm sm:text-base text-indigo-100/90 m-0"><strong className="text-white">El Moderador Implacable:</strong> Una persona controla el reloj y avisa: "Quedan 2 minutos, decidamos".</p>
                    </li>
                    <li className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
                        <CheckCircle2 className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
                        <p className="text-sm sm:text-base text-indigo-100/90 m-0"><strong className="text-white">Regla Rígida:</strong> Si el tiempo acaba y no hay acuerdo, se aparca. La reunión siempre avanza.</p>
                    </li>
                </ul>
            </section>

            {/* FAQ y Conclusión */}
            <section className="mb-12">
                <div id="preguntas-frecuentes" className="rounded-3xl border border-indigo-500/30 bg-indigo-950/40 p-6 sm:p-10 mb-10 scroll-mt-24">
                    <h2 className="text-xl sm:text-2xl font-bold text-white mb-5 text-center">
                        Preguntas Frecuentes sobre Timeboxing
                    </h2>
                    <div className="space-y-6">
                        <div>
                            <h4 className="text-white font-semibold mb-2">¿Qué es la Ley de Parkinson?</h4>
                            <p className="text-sm text-indigo-200/90">Afirma que "el trabajo se expande hasta llenar el tiempo disponible". Si te das una semana para un reporte de 2 horas, tardarás una semana. El timeboxing es su antídoto.</p>
                        </div>
                        <div className="w-full h-px bg-white/10" />
                        <div>
                            <h4 className="text-white font-semibold mb-2">¿Cuánto debe durar un Timebox?</h4>
                            <p className="text-sm text-indigo-200/90">No hay regla de oro, pero la neurociencia sugiere que los bloques de entre 25 minutos (Pomodoro) y 90 minutos son ideales para el <em>Deep Work</em> sin fatiga mental.</p>
                        </div>
                        <div className="w-full h-px bg-white/10" />
                        <div>
                            <h4 className="text-white font-semibold mb-2">¿Sirve para trabajos creativos?</h4>
                            <p className="text-sm text-indigo-200/90">Absolutamente. Poner un límite evita el "perfeccionismo infinito". Obliga al creativo a finalizar un borrador base sobre el cual iterar en lugar de paralizarse frente a la página en blanco.</p>
                        </div>
                    </div>
                </div>

                {relatedPost != null && (
                    <div className="mb-10">
                        <BlogRelatedPost title={relatedPost.title} description={relatedPost.description} href={relatedPost.href} />
                    </div>
                )}
                <div id="cta-rentabilidad" className="text-center mt-12 mb-8 scroll-mt-24">
                    <h2 className="text-2xl sm:text-4xl font-bold text-white mb-4">
                        Empezar a ganar rentabilidad real
                    </h2>
                    <p className="text-indigo-100/90 text-lg mb-8 max-w-2xl mx-auto">
                        Dejar el tiempo al azar es dejar los beneficios al azar. Únete a las agencias que ya operan con máxima eficiencia.
                    </p>
                    <Link to="/">
                        <Button
                            size="lg"
                            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-10 py-6 text-lg font-bold shadow-xl shadow-indigo-500/20 rounded-xl"
                        >
                            Conoce Taimbox <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                    </Link>
                    <p className="text-indigo-300 text-sm mt-6 italic">
                        Escrito por el equipo de Análisis de Taimbox - Expertos en Gestión de Recursos y Rentabilidad.
                    </p>
                </div>
            </section>
        </article>
    );
}
