import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  BarChart3,
  Target,
  Wallet,
  Gauge,
  Building2,
  ChevronRight,
  FileSpreadsheet,
  Zap,
  AlertTriangle,
} from 'lucide-react';
import { RevealOnScroll } from './RevealOnScroll';
import { BlogReadingTime } from './BlogReadingTime';
import { BlogTOC } from './BlogTOC';
import { BlogRelatedPost } from './BlogRelatedPost';
import type { BlogTOCItem } from './BlogTOC';

export interface KpisAgenciasMarketingArticleProps {
  readingMinutes?: number;
  tocItems?: BlogTOCItem[];
  relatedPost?: { title: string; description: string; href: string };
}

export function KpisAgenciasMarketingArticle({
  readingMinutes,
  tocItems,
  relatedPost,
}: KpisAgenciasMarketingArticleProps) {
  return (
    <article
      id="kpis-agencias-marketing-2026"
      className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 md:py-16 text-left overflow-x-hidden"
    >
      <section className="mb-12 sm:mb-14">
        <div className="mb-6 text-center flex flex-col items-center gap-3">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-indigo-300 bg-indigo-500/20 border border-indigo-400/30">
            KPIs y operaciones
          </span>
          {readingMinutes != null && <BlogReadingTime minutes={readingMinutes} />}
        </div>
        <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-[2.75rem] font-black text-white mb-5 sm:mb-6 leading-[1.15] tracking-tight text-center">
          KPIs para agencias de marketing: 5 métricas que sí importan en 2026
        </h1>
        <div className="space-y-4 text-indigo-100/95 text-base sm:text-lg leading-[1.75]">
          <p>
            Medir la productividad en una fábrica es sencillo: cuentas unidades producidas. En una agencia creativa o de
            marketing, es un campo de minas. ¿Estar ocupado es ser productivo? No necesariamente. Si tu equipo está al
            límite de capacidad pero los proyectos no salen o el margen se esfuma, el problema suele ser de{' '}
            <strong>visibilidad</strong>, no de esfuerzo.
          </p>
          <p>
            En 2026, además, la pregunta ya no es solo <em>qué</em> KPI mirar: es <strong>cuánto tiempo te va a costar</strong>{' '}
            medirlo bien cada semana. El coste oculto no es la fórmula; es la <strong>fricción</strong>: perseguir datos,
            reconciliar hojas y convencer a todo el mundo de que rellene la misma plantilla.
          </p>
          <div className="rounded-2xl border-l-4 border-indigo-400 bg-indigo-500/10 border border-indigo-500/20 p-4 sm:p-6 my-6">
            <p className="text-white/95 font-medium m-0">
              Cronograma, Gantt y recursos los tratamos a fondo en{' '}
              <Link
                to="/blog/planificacion-proyectos-cronograma-recursos"
                className="text-indigo-300 hover:text-white underline underline-offset-2"
              >
                Planificación de proyectos: cronograma, presupuesto y recursos
              </Link>
              . En este texto el foco es <strong>qué medir</strong>, con qué frecuencia y qué hacer cuando el número sale
              mal.
            </p>
          </div>
        </div>
      </section>

      {tocItems != null && tocItems.length > 0 && (
        <div className="mb-12">
          <BlogTOC items={tocItems} />
        </div>
      )}

      {/* Tabla rápida */}
      <RevealOnScroll>
        <section id="tabla-rapida-kpis" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6">
            Tabla rápida: qué mide cada KPI y qué decisión habilita
          </h2>
          <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-6">
            Tercera columna a propósito <strong>ejecutiva</strong>: si el KPI no te ayuda a decidir algo incómodo (contratar,
            subir precio, cortar scope), no es un KPI; es un adorno.
            En la práctica, lo notas cuando el comité mira el número y la conversación se queda en “vale… ¿y ahora qué?”.
          </p>
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
            <table className="w-full text-left text-sm sm:text-base">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="p-3 sm:p-4 text-indigo-200 font-semibold">KPI</th>
                  <th className="p-3 sm:p-4 text-indigo-200 font-semibold">Qué mide</th>
                  <th className="p-3 sm:p-4 text-indigo-200 font-semibold">Decisión que habilita</th>
                </tr>
              </thead>
              <tbody className="text-indigo-100/90">
                <tr className="border-b border-white/10">
                  <td className="p-3 sm:p-4 font-medium text-white align-top">Utilización</td>
                  <td className="p-3 sm:p-4 align-top">Horas de trabajo útil (cliente/producción) frente a capacidad neta.</td>
                  <td className="p-3 sm:p-4 align-top">Decidir si contratar, frenar ventas o mover horas de interno a cliente.</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="p-3 sm:p-4 font-medium text-white align-top">Rentabilidad + pacing</td>
                  <td className="p-3 sm:p-4 align-top">Margen por proyecto y ritmo de consumo de horas vs. el mes.</td>
                  <td className="p-3 sm:p-4 align-top">Decidir si subir fee, recortar alcance o replanificar antes de facturar.</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="p-3 sm:p-4 font-medium text-white align-top">Estimado vs real</td>
                  <td className="p-3 sm:p-4 align-top">Precisión de presupuestos y plannings.</td>
                  <td className="p-3 sm:p-4 align-top">Decidir buffers y plantillas de presupuesto por tipo de entregable.</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="p-3 sm:p-4 font-medium text-white align-top">Capacidad por área</td>
                  <td className="p-3 sm:p-4 align-top">Dónde está el cuello de botella (Paid, Diseño, etc.).</td>
                  <td className="p-3 sm:p-4 align-top">Decidir si externalizar, reasignar entre departamentos o negociar plazos.</td>
                </tr>
                <tr>
                  <td className="p-3 sm:p-4 font-medium text-white align-top">OKRs / objetivos</td>
                  <td className="p-3 sm:p-4 align-top">Si el esfuerzo se traduce en resultados de negocio.</td>
                  <td className="p-3 sm:p-4 align-top">Decidir si los KR miden actividad o impacto; alinear estrategia y margen.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </RevealOnScroll>

      {/* 1 Utilización */}
      <RevealOnScroll delay={1}>
        <section id="kpi-utilizacion" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6 flex items-center gap-3">
            <Gauge className="h-8 w-8 text-indigo-400 shrink-0" />
            1. Tasa de utilización (carga útil vs capacidad)
          </h2>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            <p>
              Es el KPI operativo por excelencia: qué parte del tiempo disponible del equipo va a trabajo que alimenta
              ingresos o producción frente a capacidad real (descontando ausencias). Fórmula típica:{' '}
              <strong>(horas en trabajo de cliente o producción / horas disponibles netas) × 100</strong>. Define en el
              equipo qué contáis como «disponible» y qué horas son de cliente vs internas para que el número sea comparable
              mes a mes.
            </p>
            <p>
              Un rango <strong>orientativo</strong> en muchas agencias de servicios ronda el 70–85%; el mix de negocio
              (retainers, proyectos puntuales, I+D interna) cambia el objetivo. No es una verdad absoluta.
              Se ve clarísimo cuando “estamos a tope” en el standup… pero en dos días el proyecto ya va tarde y el margen empieza a temblar.
            </p>
            <p>
              <strong>Si lo haces a mano:</strong> puedes obtener el mismo número con papel y boli o una hoja de cálculo:
              horas por persona y semana, capacidad neta (restando ausencias) y qué parte va a cliente o producción frente
              al total. Es farragoso, pero el KPI es el mismo; el coste es el tiempo de actualizarlo cada semana. Una
              estructura de partida —inventario de horas, cuadrante y % de carga— está en la{' '}
              <Link
                to="/blog/plantilla-planificacion-recursos-agencia"
                className="text-indigo-300 hover:text-white underline underline-offset-2"
              >
                plantilla de planificación de recursos para agencias
              </Link>{' '}
              (Excel o Sheets, con descarga).
            </p>
            <p>
              En <strong>Taimbox</strong> ves la carga por persona y semana frente a la capacidad en el tablero de capacidad
              del equipo y en las vistas de planificación, sin depender de una hoja paralela que se quede obsoleta.
            </p>
          </div>
          <div className="rounded-2xl border border-amber-500/30 bg-amber-950/35 p-5 sm:p-6 mt-6">
            <div className="flex gap-3">
              <AlertTriangle className="h-6 w-6 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-white font-semibold mb-2">Si el número está alto o bajo</h3>
                <p className="text-indigo-100/90 text-sm sm:text-base m-0 mb-3">
                  <strong>Por encima de ~90%:</strong> no celebres el «lleno». Es señal de riesgo de quemazo y errores.
                  Sube tarifas, contrata o reduce ventas a corto plazo; el sobreesfuerzo sostenido precede a la fuga de
                  talento.
                </p>
                <p className="text-indigo-100/90 text-sm sm:text-base m-0">
                  <strong>Muy por debajo del rango esperado:</strong> revisa pipeline y precios, y si demasiadas horas
                  viven en interno o administración que podrían asignarse a cliente con mejor comercialización.
                </p>
              </div>
            </div>
          </div>
        </section>
      </RevealOnScroll>

      {/* 2 Rentabilidad */}
      <RevealOnScroll delay={1}>
        <section id="kpi-rentabilidad-pacing" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6 flex items-center gap-3">
            <Wallet className="h-8 w-8 text-emerald-400 shrink-0" />
            2. Rentabilidad por proyecto y pacing (ritmo)
          </h2>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            <p>
              No todos los fees mensuales son iguales: algunos se ven jugosos hasta que sumas revisiones infinitas. La
              rentabilidad por proyecto relaciona <strong>ingreso</strong> (fee, devengo) con <strong>coste de horas</strong>{' '}
              y te dice si ese cliente es sostenible.
            </p>
            <p>
              En 2026 las agencias no pueden esperar al <strong>cierre de mes</strong> para saber si un proyecto se comió
              el margen. Hace falta <strong>pacing</strong>: comparar el consumo de horas con el tiempo transcurrido del
              mes (¿vas por delante o por detrás del ritmo?). Si a mitad de mes ya vas desproporcionado, la conversión con
              el cliente va con tiempo.
              La cicatriz típica: “vamos bien” hasta el día 12, y de repente todo el mundo empieza a preguntarte por el mismo
              proyecto… con el Excel ya en versiones y el cliente ya en modo urgencia.
            </p>
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/25 p-5 sm:p-6 my-2">
              <h3 className="text-white font-semibold mb-2 text-base sm:text-lg">Ejemplo con números (mitad de mes)</h3>
              <p className="text-indigo-100/90 text-sm sm:text-base leading-relaxed m-0">
                Tienes un fee de <strong>60 h</strong> para el mes. A día <strong>15</strong> suele haber pasado{' '}
                <strong>~50 %</strong> del calendario: a ese ritmo &quot;equilibrado&quot; llevarías unas{' '}
                <strong>30 h</strong> consumidas (la mitad del cupo). Si a esa fecha el equipo lleva{' '}
                <strong>40 h</strong> imputadas, vas <strong>10 h por encima</strong> del ritmo esperado; en una sola
                métrica, el <strong>pacing</strong> ronda el <strong>133 %</strong> frente al tiempo transcurrido (40
                frente a 30: has usado <strong>40/60</strong> del fee cuando el reloj solo marca el{' '}
                <strong>50 %</strong> del mes).
              </p>
            </div>
            <p>
              <strong>Si lo haces en Excel:</strong> basta una fila por proyecto con fee del mes, horas consumidas,
              horas presupuestadas y una columna con el <strong>porcentaje de mes transcurrido</strong>; si las horas
              consumidas crecen más rápido que el calendario, el pacing va mal. El truco es mantener los datos al día sin
              pelearse con cinco versiones de la misma hoja.
            </p>
            <p>
              En <strong>Taimbox</strong>, la <strong>salud financiera</strong> y el <strong>forecast semanal</strong>{' '}
              conectan presupuesto en horas, fee y ritmo de consumo para que no te enteres tarde. Más detalle visual en{' '}
              <Link to="/reportes-rentabilidad" className="text-indigo-300 hover:text-white underline underline-offset-2">
                reportes de rentabilidad
              </Link>
              .
            </p>
          </div>
          <div className="rounded-2xl border border-rose-500/25 bg-rose-950/30 p-5 sm:p-6 mt-6">
            <h3 className="text-white font-semibold mb-2">Si el número está alto o bajo</h3>
            <p className="text-indigo-100/90 text-sm sm:text-base m-0">
              <strong>Pacing en rojo a mitad de mes:</strong> conversación de alcance, pausa en scope o repriorizar equipo{' '}
              <em>antes</em> de cerrar el mes. <strong>Margen alto pero caos operativo:</strong> atesora el margen pero
              documenta el proceso; puede no repetirse si el equipo no aguanta el ritmo.
            </p>
          </div>
        </section>
      </RevealOnScroll>

      {/* 3 Estimación */}
      <RevealOnScroll delay={2}>
        <section id="kpi-estimado-real" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6 flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-purple-400 shrink-0" />
            3. Desviación entre estimación y realidad
          </h2>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            <p>
              Fórmula útil: <strong>(horas reales − horas estimadas) / horas estimadas</strong> por tipo de trabajo o
              proyecto. Sirve para <strong>aprender a presupuestar</strong>, no para castigar al project manager en
              público: si el diseño siempre se sale un 20%, el siguiente presupuesto lleva ese buffer explícito.
              En la vida real, te lo pregunta el director cuando ya estás en la fase de “otra ronda más” y aún no sabes si la desviación era
              un bache o el patrón.
            </p>
            <p>
              <strong>Si lo haces a mano:</strong> una tabla en Excel (o en tu ERP) con columnas de estimado y real por
              proyecto o tipo de entregable; un filtro por disciplina te muestra si la desviación es sistemática. Las
              retrospectivas al cerrar proyecto son el momento de actualizar los ratios para el siguiente presupuesto.
            </p>
          </div>
          <div className="rounded-2xl border border-violet-500/25 bg-violet-950/30 p-5 sm:p-6 mt-6">
            <h3 className="text-white font-semibold mb-2">Si el número está alto o bajo</h3>
            <p className="text-indigo-100/90 text-sm sm:text-base m-0">
              <strong>Desviación sistemática (ej. +20%) en un tipo de entregable:</strong> añade buffer en la plantilla de
              presupuesto y un mini checklist de alcance en la propuesta. <strong>Si siempre aciertas por suerte:</strong>{' '}
              revisa si estás sobreasignando horas internas no registradas.
            </p>
          </div>
        </section>
      </RevealOnScroll>

      {/* 4 Departamento */}
      <RevealOnScroll delay={2}>
        <section id="kpi-capacidad-departamento" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6 flex items-center gap-3">
            <Building2 className="h-8 w-8 text-cyan-400 shrink-0" />
            4. Capacidad por departamento o skill
          </h2>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            <p>
              A veces la agencia «está a tope» pero solo un área (Paid, producción, diseño) arrastra el cuello de botella.
              Sin esta vista, mezclas sensación global con datos y tomas decisiones tarde.
              Se nota cuando el resto del equipo va “verde” en la semana… y diseño/producción se come la cola sin que nadie lo vea hasta que se entregan tarde.
            </p>
            <p>
              <strong>Si lo haces a mano:</strong> una matriz simple (incluso en Excel) con departamentos en filas y horas
              cargadas o % de capacidad por semana; o una reunión breve semanal donde cada lead declare estado
              (verde/ámbar/rojo) en su equipo. Sin granularidad por área, solo ves el promedio y no sabes dónde meter
              refuerzo.
            </p>
          </div>
          <div className="rounded-2xl border border-cyan-500/25 bg-cyan-950/25 p-5 sm:p-6 mt-6">
            <h3 className="text-white font-semibold mb-2">Si el número está alto o bajo</h3>
            <p className="text-indigo-100/90 text-sm sm:text-base m-0">
              <strong>Un solo departamento en rojo:</strong> reasignar entre áreas, externalizar una pieza o negociar
              plazos con el cliente. <strong>Todos en verde pero facturación floja:</strong> el problema es de pipeline o
              precio, no de capacidad horaria.
            </p>
          </div>
        </section>
      </RevealOnScroll>

      {/* 5 OKRs */}
      <RevealOnScroll delay={3}>
        <section id="kpi-okrs" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6 flex items-center gap-3">
            <Target className="h-8 w-8 text-amber-400 shrink-0" />
            5. Alineación con OKRs y objetivos trimestrales
          </h2>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            <p>
              La productividad no es solo «picar horas»: es avanzar hacia objetivos que importan al negocio. Este KPI mide{' '}
              <strong>eficacia</strong> (¿vamos donde dijimos?), no solo eficiencia. Si la utilización es alta pero los
              resultados estratégicos no llegan, algo desalinea prioridades.
              Lo ves cuando los OKRs van “cumplidos” por entregables… pero el margen y la retención siguen igual, y te toca explicar por qué en dirección.
            </p>
            <p>
              <strong>Si lo haces a mano:</strong> una tabla con key results, responsable y % de avance (Notion, Google Sheets
              o Excel) más una revisión trimestral sincera. Lo importante es que los KR no midan solo actividad: si el
              margen sube pero el resultado de negocio no, el indicador estratégico está mal elegido.
            </p>
          </div>
          <div className="rounded-2xl border border-amber-500/25 bg-amber-950/30 p-5 sm:p-6 mt-6">
            <h3 className="text-white font-semibold mb-2">Si el número está alto o bajo</h3>
            <p className="text-indigo-100/90 text-sm sm:text-base m-0">
              <strong>OKRs «verdes» pero margen malo:</strong> revisa si los key results miden actividad (reuniones,
              entregas) en lugar de resultado de negocio. <strong>Buen margen pero OKRs en rojo:</strong> riesgo de optimizar
              el corto plazo y descuidar posición estratégica (marca, producto, retención).
            </p>
          </div>
        </section>
      </RevealOnScroll>

      {/* Excel vs Taimbox */}
      <RevealOnScroll delay={3}>
        <section id="excel-vs-taimbox" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6 flex items-center gap-3">
            <FileSpreadsheet className="h-8 w-8 text-slate-300 shrink-0" />
            Excel vs una herramienta integrada: fricción y tiempo
          </h2>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            <p>
              <strong>Sí, puedes cerrar esta pestaña y seguir con Excel.</strong> Todo lo anterior es aplicable con
              método, reuniones y plantillas: el valor educativo no depende de una herramienta concreta. Si ya tienes
              tablas que cuadran y un ritual semanal que las alimenta, no necesitas cambiar nada por leer este artículo.
            </p>
            <p>
              Donde muchos equipos se atascan no es en la fórmula, sino en el coste de mantenerla:{' '}
              <strong>arqueología de datos</strong> — perseguir a la gente para que rellene horas, cuadrar versiones y
              reconciliar el fee del mes con las horas consumidas cuando el ritmo del proyecto ya se desvió hace diez días.
              El problema no es solo que Excel sea estático; es que el día a día de una agencia es líquido.
              En algún punto, esa líquidoidad te explota en la cara: el lunes ya tienes “versión 4”, el martes hay cambios y el jueves nadie quiere tocar el archivo.
            </p>
            <p>
              En 2026 el sector empuja hacia herramientas que <strong>reducen trabajo manual</strong> en reporting; lo que
              importa para tu agencia es si la métrica nace de cómo trabajáis (planificación y seguimiento de horas en
              flujo), no de un lunes de «montar el cuadro de mando».
            </p>
            <p>
              Ahí es donde una <strong>plataforma integrada</strong> entra en juego: no sustituye el criterio humano, pero
              concentra planificación y lectura de carga y margen para que dediques las reuniones a decidir, no a
              discutir si el número es el de la versión 3 o la 4 del Excel. En{' '}
              <strong>Taimbox</strong>, las métricas que antes montabas a mano se derivan de la planificación y del
              seguimiento de horas en el mismo flujo, con mucha menos fricción que reconciliar hojas cada lunes.
            </p>
          </div>
          <div className="rounded-2xl border border-indigo-500/25 bg-indigo-950/40 p-5 sm:p-6 mt-6 flex gap-4">
            <Zap className="h-8 w-8 text-indigo-400 shrink-0" />
            <p className="text-indigo-100/95 m-0">
              El valor no es solo el dato: es la <strong>fricción casi cero</strong> cuando las métricas se derivan de la
              planificación y del registro de horas en el mismo sitio.
            </p>
          </div>
        </section>
      </RevealOnScroll>

      {/* Enlaces útiles */}
      <RevealOnScroll delay={1}>
        <section id="enlaces-guia-landings" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">Por si quieres verlo en la herramienta</h2>
          <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-4">
            La{' '}
            <Link to="/guia" className="text-indigo-300 hover:text-white underline underline-offset-2">
              guía de funcionalidades
            </Link>{' '}
            recorre planificador, informes y equipos con vistas parecidas a lo que hemos contado arriba (capacidad,
            rentabilidad, departamentos).
            Si eres de los que prefieren “verlo una vez” antes de montar otro Excel desde cero, aquí es donde encaja.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/planificador-recursos">
              <Button
                size="sm"
                variant="outline"
                className="border-indigo-400/50 bg-transparent text-white hover:bg-indigo-500/25 hover:text-white"
              >
                Planificador <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/reportes-rentabilidad">
              <Button
                size="sm"
                variant="outline"
                className="border-emerald-400/50 bg-transparent text-white hover:bg-emerald-500/20 hover:text-white"
              >
                Reportes de rentabilidad <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/integraciones">
              <Button
                size="sm"
                variant="outline"
                className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                Integraciones <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </RevealOnScroll>

      {/* Cierre + enlaces artículos */}
      <RevealOnScroll delay={2}>
        <section className="mb-12">
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 sm:p-8 mb-8">
            <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-4">
              Medir productividad no es vigilar al equipo: es darles visibilidad para que el trabajo rentable se vea y la
              agencia sea sostenible. Cuando el trabajo se estira sin freno, suele aparecer en la misma conversación la{' '}
              <Link to="/blog/ley-parkinson" className="text-indigo-300 hover:text-white underline underline-offset-2">
                Ley de Parkinson
              </Link>{' '}
              y el{' '}
              <Link to="/blog/que-es-timeboxing" className="text-indigo-300 hover:text-white underline underline-offset-2">
                timeboxing
              </Link>
              : límites de tiempo y plazos como contrapeso cultural.
            </p>
          </div>

          <div id="cta-kpis-agencias" className="text-center mt-12 mb-8 scroll-mt-24">
            <h2 className="text-2xl sm:text-4xl font-bold text-white mb-4">Rentabilidad con cifras claras</h2>
            <p className="text-indigo-100/90 text-lg mb-8 max-w-2xl mx-auto">
              Capacidad y ritmo de proyectos en un solo flujo en <strong>Taimbox</strong>, para quien ya haya cerrado
              Excel los lunes. Sin compromiso al empezar.
            </p>
            <p className="text-indigo-200/70 text-sm m-0 max-w-2xl mx-auto">
              La cicatriz final suele ser la misma: el día que preguntas “¿por qué el margen no aparece?”, te responden con un “porque el mes
              se nos fue”, y tú quieres que el número te diga dónde se fugó.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Link to="/reportes-rentabilidad">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-8 py-6 text-base font-bold shadow-xl shadow-emerald-500/30 rounded-xl transition-all duration-300 hover:scale-105"
                >
                  Ver rentabilidad y forecast <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/planificador-recursos">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-indigo-400/60 bg-transparent px-8 py-6 text-base font-semibold text-white shadow-none hover:bg-indigo-500/20 hover:text-white rounded-xl"
                >
                  Planificador de recursos <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
            <p className="text-indigo-200/70 text-sm mb-8">
              <Link to="/precios" className="text-indigo-300 hover:text-white underline underline-offset-2">
                Ver precios y planes
              </Link>
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
              Escrito por el equipo de Taimbox — Gestión de recursos y rentabilidad para agencias.
            </p>
          </div>
        </section>
      </RevealOnScroll>
    </article>
  );
}
