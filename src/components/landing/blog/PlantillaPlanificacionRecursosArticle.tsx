import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  Download,
  Table2,
  Sparkles,
  Wallet,
  LayoutGrid,
  ChevronRight,
  Users,
  AlertTriangle,
  Zap,
  FileSpreadsheet,
  Calculator,
  TrendingUp,
  Clock,
  HelpCircle,
  BarChart3,
  Shield,
  ListChecks,
  CalendarRange,
} from 'lucide-react';
import { RevealOnScroll } from './RevealOnScroll';
import { BlogReadingTime } from './BlogReadingTime';
import { BlogTOC } from './BlogTOC';
import { BlogRelatedPost } from './BlogRelatedPost';
import type { BlogTOCItem } from './BlogTOC';

const PLANTILLA_XLSX_HREF = '/recursos/plantilla-planificacion-recursos-taimbox.xlsx';

export interface PlantillaPlanificacionRecursosArticleProps {
  readingMinutes?: number;
  tocItems?: BlogTOCItem[];
  relatedPost?: { title: string; description: string; href: string };
}

export function PlantillaPlanificacionRecursosArticle({
  readingMinutes,
  tocItems,
  relatedPost,
}: PlantillaPlanificacionRecursosArticleProps) {
  return (
    <article
      id="plantilla-planificacion-recursos-agencia"
      className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 md:py-16 text-left overflow-x-hidden"
    >
      {/* Hero */}
      <section className="mb-12 sm:mb-14">
        <div className="mb-6 text-center flex flex-col items-center gap-3">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-indigo-300 bg-indigo-500/20 border border-indigo-400/30">
            <Sparkles className="inline h-3.5 w-3.5 mr-1" />
            Recursos gratuitos
          </span>
          {readingMinutes != null && <BlogReadingTime minutes={readingMinutes} />}
        </div>
        <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-[2.75rem] font-black text-white mb-5 sm:mb-6 leading-[1.15] tracking-tight text-center">
          Plantilla de planificación de recursos para agencias
        </h1>
        <div className="space-y-4 text-indigo-100/95 text-base sm:text-lg leading-[1.75]">
          <p>
            Todas las agencias empiezan igual: un Excel con nombres en columna, proyectos en fila y una fórmula que suma
            horas. Funciona mientras el equipo cabe en una pantalla. Cuando no cabe, el problema no es la hoja en sí: es
            el <strong>tiempo que consume mantenerla viva</strong> y la facilidad con la que oculta sobrecargas.
          </p>
          <p>
            Este artículo no es un «Excel vs software»: es una guía para <strong>montar la plantilla más útil
            posible</strong>, entender cuándo flaquea y saber qué criterio mantener si decides dar el salto a una
            herramienta integrada. Al final hay una plantilla .xlsx con cinco hojas listas para usar: instrucciones,
            equipo, proyectos, asignación semanal e insights con formato condicional y KPIs.
          </p>
          <div className="rounded-2xl border-l-4 border-indigo-400 bg-indigo-500/10 border border-indigo-500/20 p-4 sm:p-6 my-6">
            <p className="text-white/95 font-medium m-0">
              Si buscas las métricas que acompañan a esta plantilla, el tema se amplía en{' '}
              <Link
                to="/blog/kpis-agencias-marketing-2026"
                className="text-indigo-300 hover:text-white underline underline-offset-2"
              >
                KPIs para agencias de marketing: 5 métricas que sí importan en 2026
              </Link>
              . Aquí el foco está en <strong>la estructura de la hoja</strong>, las fórmulas y el momento en que
              deja de compensar.
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mt-8">
          <a href={PLANTILLA_XLSX_HREF} download>
            <Button
              size="lg"
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold px-8 py-6 text-base shadow-xl shadow-indigo-500/30 rounded-xl transition-all duration-300 hover:scale-105"
            >
              <Download className="mr-2 h-5 w-5" />
              Descargar plantilla .xlsx
            </Button>
          </a>
          <p className="text-indigo-200/80 text-sm m-0 sm:max-w-xs text-center sm:text-left">
            5 hojas, fórmulas nativas, formato condicional, desplegables y protección de celdas. Funciona en Excel y Google Sheets.
          </p>
        </div>
      </section>

      {tocItems != null && tocItems.length > 0 && (
        <div className="mb-12">
          <BlogTOC items={tocItems} />
        </div>
      )}

      {/* I. Introducción */}
      <RevealOnScroll>
        <section id="intro-excel-primer-amor" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6 flex items-center gap-3">
            <FileSpreadsheet className="h-8 w-8 text-emerald-400 shrink-0" />
            I. Por qué el Excel es el «primer amor» de toda agencia
          </h2>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            <p>
              <strong>Coste cero, flexibilidad total y curva de aprendizaje que el equipo ya domina.</strong> Para cinco
              personas y cuatro clientes, una hoja bien pensada basta para ver quién está cargado y dónde hay margen.
              Nadie necesita justificar una licencia ni configurar permisos: abres, escribes y compartes.
            </p>
            <p>
              El romance dura mientras el mantenimiento es anecdótico. Con ocho o diez personas, varios proyectos
              simultáneos y un par de incorporaciones recientes, el escenario cambia: <strong>alguien tiene que ser el
              guardián de la hoja</strong>. Actualizar quién trabaja en qué, perseguir a quien no rellena sus horas y
              detectar que una fórmula se descuadró hace tres semanas.
            </p>
            <p>
              Ese rol de guardián suele recaer en el <strong>Traffic Manager</strong> o el PM. Y ahí aparece un coste
              invisible: las horas que dedica a la hoja no van a gestión de cuenta ni a producción. La herramienta
              gratuita tiene un peaje en tiempo de gente que factura.
            </p>
          </div>
          <div className="rounded-2xl border border-indigo-500/25 bg-indigo-950/40 p-5 sm:p-6 mt-6 flex gap-4">
            <Clock className="h-8 w-8 text-indigo-400 shrink-0 mt-0.5" />
            <p className="text-indigo-100/95 m-0">
              Según estudios de productividad en agencias de servicios, los mandos intermedios gastan entre{' '}
              <strong>3 y 6 horas semanales</strong> en tareas de reporting manual (preparar datos, reconciliar versiones,
              actualizar cuadros). Tiempo que no se factura ni se ve como «coste» hasta que se mide.
            </p>
          </div>
        </section>
      </RevealOnScroll>

      {/* II. Capacidad bruta vs neta */}
      <RevealOnScroll delay={1}>
        <section id="capacidad-bruta-vs-neta" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6 flex items-center gap-3">
            <Users className="h-8 w-8 text-purple-400 shrink-0" />
            II. Capacidad bruta vs capacidad neta: la primera fórmula que importa
          </h2>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            <p>
              <strong>Capacidad bruta</strong> es el contrato: normalmente 40 h/semana. <strong>Capacidad neta</strong> es
              lo que queda para trabajo de producción o cliente después de descontar reuniones recurrentes, formación,
              administración interna y ausencias puntuales (vacaciones, festivos, bajas).
            </p>
            <p>
              La diferencia importa porque, si comparas horas asignadas contra la bruta, la utilización siempre parece baja
              y «hay margen» que en realidad no existe. Es el error más común en plantillas de agencia y el que más
              sobrecargas oculta.
            </p>
          </div>
          <div className="rounded-2xl border border-purple-500/30 bg-purple-950/30 p-5 sm:p-6 mt-6">
            <h3 className="text-white font-semibold mb-3 text-base sm:text-lg">Ejemplo con números</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm sm:text-base">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5">
                    <th className="p-3 text-indigo-200 font-semibold">Persona</th>
                    <th className="p-3 text-indigo-200 font-semibold">Bruta (h)</th>
                    <th className="p-3 text-indigo-200 font-semibold">Reuniones</th>
                    <th className="p-3 text-indigo-200 font-semibold">Admin</th>
                    <th className="p-3 text-indigo-200 font-semibold">Ausencias</th>
                    <th className="p-3 text-indigo-200 font-semibold">Neta (h)</th>
                  </tr>
                </thead>
                <tbody className="text-indigo-100/90">
                  <tr className="border-b border-white/10">
                    <td className="p-3 font-medium text-white">Ana L. (Paid Media)</td>
                    <td className="p-3">40</td>
                    <td className="p-3">6</td>
                    <td className="p-3">2</td>
                    <td className="p-3">0</td>
                    <td className="p-3 font-semibold text-emerald-300">32</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="p-3 font-medium text-white">Luis G. (Diseño)</td>
                    <td className="p-3">40</td>
                    <td className="p-3">4</td>
                    <td className="p-3">2</td>
                    <td className="p-3">0</td>
                    <td className="p-3 font-semibold text-emerald-300">34</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-white">María P. (Cuentas)</td>
                    <td className="p-3">40</td>
                    <td className="p-3">8</td>
                    <td className="p-3">3</td>
                    <td className="p-3">0</td>
                    <td className="p-3 font-semibold text-emerald-300">29</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-indigo-100/80 text-sm mt-4 m-0">
              Ana tiene 32 h reales para trabajo de cliente, no 40. Si le asignas 35 h en proyectos, no está «al 87 %»: está
              al <strong>109 %</strong> de su capacidad real, y eso se traduce en horas extra invisibles.
            </p>
          </div>
          <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-5 sm:p-6 mt-6">
            <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
              <Calculator className="h-5 w-5 text-indigo-400" />
              Fórmula en la plantilla (hoja «Equipo», columna G)
            </h3>
            <pre className="text-sm sm:text-base font-mono text-indigo-100 bg-white/5 border border-white/10 rounded-lg p-4 overflow-x-auto m-0">
              =C2-D2-E2-F2
            </pre>
            <p className="text-indigo-200/80 text-sm mt-3 m-0">
              Es decir: <span className="font-mono">Jornada − Reuniones − Admin − Ausencias</span>. Cuatro columnas de
              descuento; la neta se calcula sola al rellenar las otras.
            </p>
          </div>
        </section>
      </RevealOnScroll>

      {/* III. Anatomía plantilla: 4 hojas */}
      <RevealOnScroll delay={1}>
        <section id="anatomia-plantilla-profesional" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6 flex items-center gap-3">
            <Table2 className="h-8 w-8 text-indigo-400 shrink-0" />
            III. Anatomía de la plantilla: cuatro hojas y cómo se conectan
          </h2>
          <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-6">
            La estructura profesional se apoya en <strong>cuatro hojas encadenadas</strong> (más una de instrucciones): inventario de equipo,
            catálogo de proyectos, cuadrante de asignación semanal y dashboard de insights. Cada una alimenta a la
            siguiente; si alguna falla, el resultado final pierde sentido.
          </p>

          <div className="space-y-8 mb-8">
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/25 p-5 sm:p-6">
              <h3 className="text-white font-bold mb-3 text-lg flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500/30 text-emerald-300 text-sm font-bold">1</span>
                Hoja «Equipo» — Inventario de capacidad
              </h3>
              <p className="text-indigo-100/90 text-base leading-relaxed m-0 mb-3">
                Aquí defines <strong>quiénes sois</strong> y <strong>cuántas horas reales tiene cada uno</strong>.
                Ocho columnas: persona, rol, jornada, reuniones, admin/formación, ausencias semanales, capacidad neta
                (fórmula automática) y coste hora interno. La fila de totales suma jornada, reuniones, admin, ausencias
                y capacidad neta de todo el equipo.
              </p>
              <p className="text-indigo-200/80 text-sm m-0">
                <strong>Clave:</strong> actualizar la columna «Ausencias semana» cuando alguien tenga festivos, vacaciones o baja.
                Si no se toca, el % de utilización en Insights empieza a mentir en silencio.
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/25 p-5 sm:p-6">
              <h3 className="text-white font-bold mb-3 text-lg flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500/30 text-emerald-300 text-sm font-bold">2</span>
                Hoja «Proyectos» — Fee, presupuesto y margen
              </h3>
              <p className="text-indigo-100/90 text-base leading-relaxed m-0 mb-3">
                Cada proyecto (o servicio-cliente) ocupa una fila. Tú rellenas nombre, tipo (Retainer / Proyecto / Interno
                con desplegable), fee mensual y horas presupuestadas al mes. Las columnas de cálculo hacen el resto:
              </p>
              <ul className="text-indigo-100/90 text-sm space-y-1.5 list-disc pl-6 mb-3">
                <li><strong>Horas asignadas semana:</strong> suma automática desde la hoja de Asignación (<span className="font-mono text-indigo-300">SUMIF</span>).</li>
                <li><strong>Pacing (%):</strong> horas asignadas esta semana vs media semanal presupuestada (horas mes ÷ 4). Si supera el 100 % vas «por delante» del presupuesto.</li>
                <li><strong>Coste semana estimado:</strong> cruza horas asignadas con el coste hora de cada persona (<span className="font-mono text-indigo-300">SUMPRODUCT × VLOOKUP</span>).</li>
                <li><strong>Margen mensual estimado:</strong> fee − (coste semana × 4). Si sale negativo, la celda se pinta en rojo.</li>
              </ul>
              <p className="text-indigo-200/80 text-sm m-0">
                <strong>Clave:</strong> el margen es una estimación basada en la asignación actual; no sustituye al cierre contable
                real, pero anticipa tendencias antes de que sea tarde.
              </p>
            </div>

            <div className="rounded-2xl border border-indigo-500/30 bg-indigo-950/30 p-5 sm:p-6">
              <h3 className="text-white font-bold mb-3 text-lg flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-indigo-500/30 text-indigo-300 text-sm font-bold">3</span>
                Hoja «Asignación» — El cuadrante semanal
              </h3>
              <p className="text-indigo-100/90 text-base leading-relaxed m-0 mb-3">
                El cruce <strong>personas × proyectos × semana</strong>. Cada fila es un bloque de asignación: quién, en qué
                proyecto, qué semana, cuántas horas y una nota libre. Las columnas Persona y Proyecto tienen{' '}
                <strong>desplegables enlazados</strong> a las hojas Equipo y Proyectos, lo que evita errores de escritura
                que rompen las fórmulas SUMIF.
              </p>
              <p className="text-indigo-100/90 text-base leading-relaxed m-0 mb-3">
                La plantilla incluye <strong>dos semanas de datos de ejemplo</strong> (S12 y S13) con 8 personas y 6 proyectos
                repartidos de forma realista, más 20 filas vacías con los desplegables ya configurados para que empieces a rellenar
                directamente.
              </p>
              <p className="text-indigo-200/80 text-sm m-0">
                <strong>Clave:</strong> el nivel de granularidad. Semanas suele ser el término medio ideal en agencias; por
                día es demasiado fino para mantener en Excel y por mes es demasiado grueso para detectar picos.
              </p>
            </div>

            <div className="rounded-2xl border border-amber-500/30 bg-amber-950/25 p-5 sm:p-6">
              <h3 className="text-white font-bold mb-3 text-lg flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-500/30 text-amber-300 text-sm font-bold">4</span>
                Hoja «Insights» — Dashboard de alertas y KPIs
              </h3>
              <p className="text-indigo-100/90 text-base leading-relaxed m-0 mb-3">
                Todo automático: departamento, capacidad neta, horas asignadas, horas libres,{' '}
                <strong>utilización (%)</strong>, estado, coste semanal y número de proyectos por persona. La columna
                de utilización tiene <strong>formato condicional real</strong> con tres niveles de color:
              </p>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="inline-block rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 font-mono text-sm">
                  70–90% → verde
                </span>
                <span className="inline-block rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-1 font-mono text-sm">
                  {'>'} 90% → ámbar
                </span>
                <span className="inline-block rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2.5 py-1 font-mono text-sm">
                  ≥ 100% → rojo
                </span>
              </div>
              <p className="text-indigo-100/90 text-base leading-relaxed m-0 mb-3">
                La columna «Estado» va un paso más con <strong>cuatro niveles</strong>:{' '}
                <span className="text-emerald-300">✅ ÓPTIMO</span>,{' '}
                <span className="text-amber-300">⚠️ RIESGO</span>,{' '}
                <span className="text-rose-300">⛔ SOBRECARGA</span> y{' '}
                <span className="text-indigo-300">💤 BAJA CARGA</span>.
              </p>
              <p className="text-indigo-100/90 text-base leading-relaxed m-0 mb-3">
                Debajo de la tabla, un bloque de <strong>KPIs de resumen</strong>: utilización media del equipo, personas en
                riesgo o sobrecarga, horas libres totales, coste semanal total e <strong>impuesto Excel estimado</strong>{' '}
                (semanal y anual, en rojo).
              </p>
              <p className="text-indigo-200/80 text-sm m-0">
                <strong>Clave:</strong> mirar esta hoja al principio de cada semana, no al final del mes. La alerta
                temprana es lo que diferencia una plantilla decorativa de una operativa.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5 mb-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-300/80 px-4 pt-4 m-0">
              Mockup: cuadrante semanal (ejemplo visual)
            </p>
            <table className="w-full text-left text-sm sm:text-base">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="p-3 sm:p-4 text-indigo-200 font-semibold">Persona</th>
                  <th className="p-3 sm:p-4 text-indigo-200 font-semibold">Cap. neta (h)</th>
                  <th className="p-3 sm:p-4 text-indigo-200 font-semibold">H. asignadas</th>
                  <th className="p-3 sm:p-4 text-indigo-200 font-semibold">H. libres</th>
                  <th className="p-3 sm:p-4 text-indigo-200 font-semibold">Utilización</th>
                  <th className="p-3 sm:p-4 text-indigo-200 font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody className="text-indigo-100/90">
                <tr className="border-b border-white/10">
                  <td className="p-3 sm:p-4 font-medium text-white">Ana L.</td>
                  <td className="p-3 sm:p-4">32</td>
                  <td className="p-3 sm:p-4">30</td>
                  <td className="p-3 sm:p-4">2</td>
                  <td className="p-3 sm:p-4">
                    <span className="inline-block rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 font-mono text-sm">94%</span>
                  </td>
                  <td className="p-3 sm:p-4 text-amber-300">⚠️ RIESGO</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="p-3 sm:p-4 font-medium text-white">Luis G.</td>
                  <td className="p-3 sm:p-4">34</td>
                  <td className="p-3 sm:p-4">32</td>
                  <td className="p-3 sm:p-4">2</td>
                  <td className="p-3 sm:p-4">
                    <span className="inline-block rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 font-mono text-sm">94%</span>
                  </td>
                  <td className="p-3 sm:p-4 text-amber-300">⚠️ RIESGO</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="p-3 sm:p-4 font-medium text-white">María P.</td>
                  <td className="p-3 sm:p-4">29</td>
                  <td className="p-3 sm:p-4">29</td>
                  <td className="p-3 sm:p-4">0</td>
                  <td className="p-3 sm:p-4">
                    <span className="inline-block rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 font-mono text-sm">100%</span>
                  </td>
                  <td className="p-3 sm:p-4 text-rose-300">⛔ SOBRECARGA</td>
                </tr>
                <tr>
                  <td className="p-3 sm:p-4 font-medium text-white">Jorge N.</td>
                  <td className="p-3 sm:p-4">36</td>
                  <td className="p-3 sm:p-4">34</td>
                  <td className="p-3 sm:p-4">2</td>
                  <td className="p-3 sm:p-4">
                    <span className="inline-block rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 font-mono text-sm">94%</span>
                  </td>
                  <td className="p-3 sm:p-4 text-amber-300">⚠️ RIESGO</td>
                </tr>
              </tbody>
            </table>
          </div>

          <a href={PLANTILLA_XLSX_HREF} download className="flex justify-center">
            <Button variant="outline" className="border-indigo-400/50 bg-transparent text-white hover:bg-indigo-500/25 hover:text-white">
              <Download className="mr-2 h-4 w-4" />
              Descargar plantilla con las cuatro hojas
            </Button>
          </a>
        </section>
      </RevealOnScroll>

      {/* IV. Fórmula maestra + formato condicional */}
      <RevealOnScroll delay={2}>
        <section id="formula-utilizacion-formato" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6 flex items-center gap-3">
            <Calculator className="h-8 w-8 text-emerald-400 shrink-0" />
            IV. Fórmula de utilización y formato condicional
          </h2>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-6">
            <p>
              La métrica central de la plantilla es la <strong>tasa de utilización</strong>: qué proporción de la
              capacidad neta de una persona está asignada a proyectos. La fórmula es directa:
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6 mb-6">
            <h3 className="text-white font-semibold mb-3">Fórmula maestra (hoja «Insights», columna F)</h3>
            <pre className="text-sm sm:text-base font-mono text-indigo-100 bg-indigo-950/50 border border-white/10 rounded-lg p-4 overflow-x-auto m-0 mb-4">
              =IFERROR(D2/C2, 0)
            </pre>
            <p className="text-indigo-100/90 text-sm sm:text-base m-0 mb-4">
              Donde <span className="font-mono text-indigo-300">D2</span> son las horas asignadas (calculadas con{' '}
              <span className="font-mono text-indigo-300">SUMIF</span> desde Asignación) y{' '}
              <span className="font-mono text-indigo-300">C2</span> es la capacidad neta (traída de Equipo). El{' '}
              <span className="font-mono text-indigo-300">IFERROR</span> evita el error #DIV/0! si la neta es cero.
            </p>
            <div className="border-t border-white/10 pt-4 mb-4">
              <h4 className="text-white font-semibold mb-2">Formato condicional (tres niveles de color)</h4>
              <p className="text-indigo-100/90 text-sm sm:text-base m-0 mb-3">
                La plantilla aplica formato condicional nativo en la columna de utilización. Excel y Google Sheets lo
                interpretan directamente al abrir el archivo:
              </p>
              <ul className="text-indigo-100/90 text-sm space-y-1.5 list-disc pl-6">
                <li><strong className="text-emerald-300">Verde (70–90%):</strong> zona óptima, hay colchón para imprevistos.</li>
                <li><strong className="text-amber-300">Ámbar ({'>'} 90%):</strong> zona de riesgo, cualquier imprevisto desborda.</li>
                <li><strong className="text-rose-300">Rojo (≥ 100%):</strong> sobrecarga declarada, la persona ya no tiene horas.</li>
              </ul>
            </div>
            <div className="border-t border-white/10 pt-4">
              <h4 className="text-white font-semibold mb-2">Columna «Estado» (cuatro niveles con fórmula IF anidada)</h4>
              <pre className="text-sm font-mono text-indigo-100 bg-indigo-950/50 border border-white/10 rounded-lg p-4 overflow-x-auto m-0 mb-3">
{`=IF(F2>=1, "⛔ SOBRECARGA",
  IF(F2>0.9, "⚠️ RIESGO",
    IF(F2>0.7, "✅ ÓPTIMO",
      "💤 BAJA CARGA")))`}
              </pre>
              <p className="text-indigo-200/80 text-sm m-0">
                Cuatro estados que se leen de un vistazo. «Baja carga» no significa que la persona no trabaje; puede estar
                en formación o tener ausencias esa semana. El valor está en el patrón a lo largo de varias semanas.
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/25 p-5 sm:p-6">
            <h3 className="text-white font-semibold mb-2 text-base sm:text-lg">Ejemplo con números (semana 12)</h3>
            <p className="text-indigo-100/90 text-sm sm:text-base leading-relaxed m-0">
              María tiene <strong>29 h netas</strong> (40 − 8 reuniones − 3 admin). Esta semana tiene asignadas{' '}
              <strong>29 h</strong> en cuatro proyectos. Utilización: <strong>29 / 29 = 100 %</strong>. Estado:{' '}
              <strong className="text-rose-300">⛔ SOBRECARGA</strong>. No tiene ni una hora libre para un imprevisto. Si
              un cliente pide algo urgente, alguien va a hacer horas extra o un entregable se va a retrasar.
            </p>
          </div>
        </section>
      </RevealOnScroll>

      {/* V. Pacing por proyecto y margen */}
      <RevealOnScroll delay={2}>
        <section id="pacing-proyecto-margen" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6 flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-purple-400 shrink-0" />
            V. Pacing por proyecto y margen estimado
          </h2>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            <p>
              La hoja <strong>Proyectos</strong> añade dos métricas que un cuadrante sencillo no suele incluir:
              el <strong>pacing</strong> (ritmo de consumo de horas) y el <strong>margen mensual estimado</strong>.
            </p>
            <p>
              El pacing compara las horas asignadas esta semana con lo que «debería» asignarse si repartes el presupuesto
              mensual de forma lineal (horas presupuestadas ÷ 4 semanas). Un pacing del 120 % significa que estás
              consumiendo horas un 20 % más rápido de lo presupuestado; si se mantiene, el fee se agotará antes de fin
              de mes.
            </p>
          </div>
          <div className="rounded-2xl border border-purple-500/30 bg-purple-950/30 p-5 sm:p-6 mt-6">
            <h3 className="text-white font-semibold mb-2 text-base sm:text-lg">Ejemplo: proyecto «Marca Beta — Web»</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm sm:text-base">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5">
                    <th className="p-3 text-indigo-200 font-semibold">Métrica</th>
                    <th className="p-3 text-indigo-200 font-semibold">Valor</th>
                  </tr>
                </thead>
                <tbody className="text-indigo-100/90">
                  <tr className="border-b border-white/10">
                    <td className="p-3">Fee mensual</td>
                    <td className="p-3 font-semibold text-white">8.000 €</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="p-3">Horas presupuestadas / mes</td>
                    <td className="p-3">100 h</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="p-3">Media semanal presupuestada</td>
                    <td className="p-3">25 h (100 ÷ 4)</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="p-3">Horas asignadas esta semana</td>
                    <td className="p-3 font-semibold text-amber-300">30 h</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="p-3">Pacing</td>
                    <td className="p-3">
                      <span className="inline-block rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 font-mono text-sm">
                        120%
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3">Margen mensual estimado</td>
                    <td className="p-3 font-semibold text-emerald-300">8.000 − (coste sem. × 4)</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-indigo-100/80 text-sm mt-4 m-0">
              Si el pacing supera el 100 % dos semanas seguidas, es una señal clara de que el alcance se ha expandido
              o la estimación se quedó corta. El formato condicional pinta la celda en ámbar ({'>'}100 %) o rojo ({'>'}120 %)
              para que salte a la vista.
            </p>
          </div>
        </section>
      </RevealOnScroll>

      {/* VI. Impuesto Excel */}
      <RevealOnScroll delay={2}>
        <section id="impuesto-excel-techo" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6 flex items-center gap-3">
            <Wallet className="h-8 w-8 text-amber-400 shrink-0" />
            VI. El «impuesto Excel»: cuánto cuesta mantener la hoja
          </h2>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            <p>
              Si un PM con coste hora de <strong>40 €</strong> dedica <strong>4 horas semanales</strong> a actualizar el
              Excel (perseguir datos, corregir fórmulas, reconciliar versiones, preparar el resumen para la reunión de
              carga), el coste directo es:
            </p>
          </div>
          <div className="rounded-2xl border border-amber-500/30 bg-amber-950/30 p-5 sm:p-6 mt-4 mb-6">
            <p className="text-white font-semibold text-xl sm:text-2xl text-center m-0 mb-2">
              4 h × 40 €/h × 4 semanas = <span className="text-amber-300">640 €/mes</span>
            </p>
            <p className="text-indigo-200/80 text-sm text-center m-0">
              Son <strong>7.680 €/año</strong> en mantener un archivo estático. Si dos personas lo tocan, multiplica.
            </p>
          </div>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            <p>
              No es «gratis»: es un <strong>impuesto fijo sobre el margen</strong> que no aparece en ninguna línea de coste
              porque nadie lo factura. Y a eso se suma lo que el PM <em>no hace</em> mientras alimenta la hoja: gestión de
              cuenta, negociación de alcance, tiempo con el equipo creativo.
            </p>
            <p>
              La plantilla incluye este cálculo en el bloque de KPIs de la hoja Insights ({' '}
              <span className="font-mono text-rose-300">4 × coste hora del PM × 52 semanas</span>{' '}
              ), para que el número esté visible cada vez que se abre el archivo.
            </p>
          </div>
        </section>
      </RevealOnScroll>

      {/* VII. Techo de cristal */}
      <RevealOnScroll delay={2}>
        <section id="techo-cristal-errores" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6 flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-rose-400 shrink-0" />
            VII. Techo de cristal: tres puntos donde la hoja se rompe
          </h2>
          <div className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
              <h3 className="text-white font-bold mb-2">1. Arqueología de datos</h3>
              <p className="text-indigo-100/90 text-base leading-relaxed m-0">
                Perseguir a todo el equipo para que rellene sus horas, cuadrar versiones del archivo y descubrir que la
                hoja de la semana pasada no se actualizó. El dato existe, pero llegar a él cuesta más que el propio valor
                que aporta.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
              <h3 className="text-white font-bold mb-2">2. Desconexión con la realidad</h3>
              <p className="text-indigo-100/90 text-base leading-relaxed m-0">
                El Excel dice que las horas están asignadas, pero no sabe si las tareas se ejecutan ni si el margen del
                proyecto está bajando. Puedes tener «100 % de asignación» y descubrir al cerrar el mes que el fee se agotó
                en la segunda semana. No hay <strong>pacing en tiempo real</strong>: solo el que tú calcules.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
              <h3 className="text-white font-bold mb-2">3. Error de fórmula humano</h3>
              <p className="text-indigo-100/90 text-base leading-relaxed m-0">
                Una celda borrada por error, una fila que no se copió bien o un rango que se desplazó al insertar columnas.
                El resultado: un diseñador lleva tres semanas al <strong>140 % de carga</strong> y nadie lo vio porque la
                fórmula apuntaba al rango equivocado. Cuando se detecta, el daño ya está hecho. La protección de celdas
                de la plantilla reduce este riesgo, pero no lo elimina del todo.
              </p>
            </div>
          </div>
          <div className="rounded-2xl border-l-4 border-rose-400 bg-rose-500/10 border border-rose-500/20 p-4 sm:p-6 mt-6">
            <p className="text-white/95 font-medium m-0">
              Ninguno de estos problemas es del Excel como herramienta: es del <strong>flujo manual</strong>. Cualquier
              hoja, por bien pensada que esté, necesita que alguien la alimente puntualmente y que nadie la toque por error.
              En equipos pequeños el coste es asumible; al escalar, se vuelve un riesgo operativo.
            </p>
          </div>
        </section>
      </RevealOnScroll>

      {/* VIII. Validación y protección */}
      <RevealOnScroll delay={3}>
        <section id="validacion-proteccion-errores" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6 flex items-center gap-3">
            <Shield className="h-8 w-8 text-indigo-400 shrink-0" />
            VIII. Validación de datos y protección: cómo evitar que la hoja se rompa
          </h2>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-6">
            <p>
              El 80 % de los errores en una plantilla de recursos viene de dos sitios: alguien escribe un nombre con una
              tilde distinta y el SUMIF no cruza, o alguien borra una fórmula sin querer. La plantilla incluye dos
              mecanismos para minimizar ambos:
            </p>
          </div>
          <div className="space-y-6">
            <div className="rounded-2xl border border-indigo-500/25 bg-indigo-950/40 p-5 sm:p-6">
              <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                <ListChecks className="h-5 w-5 text-indigo-400" />
                Desplegables (data validation)
              </h3>
              <p className="text-indigo-100/90 text-base leading-relaxed m-0 mb-3">
                Las columnas «Persona» y «Proyecto» de la hoja Asignación tienen <strong>listas desplegables</strong>{' '}
                enlazadas a los nombres de Equipo y Proyectos. Al hacer clic en la celda aparece la flechita y se
                selecciona en lugar de escribir. Esto garantiza que el nombre coincida carácter por carácter con la hoja
                de origen, y que SUMIF, VLOOKUP y COUNTIF funcionen.
              </p>
              <p className="text-indigo-200/80 text-sm m-0">
                Si necesitas añadir una persona o proyecto nuevo, añádelo primero en la hoja correspondiente y luego
                actualiza la lista del desplegable (Datos → Validación de datos).
              </p>
            </div>
            <div className="rounded-2xl border border-indigo-500/25 bg-indigo-950/40 p-5 sm:p-6">
              <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                <Shield className="h-5 w-5 text-indigo-400" />
                Protección de celdas
              </h3>
              <p className="text-indigo-100/90 text-base leading-relaxed m-0 mb-3">
                Todas las celdas con fórmula (Capacidad neta, Utilización, Estado, Margen, KPIs…) están{' '}
                <strong>protegidas</strong>: si intentas escribir encima, Excel te avisa. Las celdas de entrada (nombre,
                horas, notas) quedan libres. La protección se puede desactivar sin contraseña (Revisar → Desproteger hoja)
                si necesitas ajustar algo, pero mientras esté activa evita el borrado accidental.
              </p>
              <p className="text-indigo-200/80 text-sm m-0">
                En Google Sheets, al importar el .xlsx la protección se convierte en «rangos protegidos» con el mismo efecto.
              </p>
            </div>
          </div>
        </section>
      </RevealOnScroll>

      {/* IX. Escalar semana a semana */}
      <RevealOnScroll delay={3}>
        <section id="escalar-semana-semana" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6 flex items-center gap-3">
            <CalendarRange className="h-8 w-8 text-emerald-400 shrink-0" />
            IX. Cómo escalar la plantilla semana a semana
          </h2>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-6">
            <p>
              La plantilla viene con dos semanas de ejemplo (S12 y S13). Para añadir una nueva semana, el proceso es:
            </p>
            <ol className="list-decimal pl-6 space-y-3">
              <li>
                <strong>Hoja Equipo:</strong> revisar la columna «Ausencias semana». Si alguien tiene vacaciones o un
                festivo, actualizar las horas. La capacidad neta se recalcula sola.
              </li>
              <li>
                <strong>Hoja Asignación:</strong> añadir filas nuevas para la semana siguiente. Usa los desplegables
                de Persona y Proyecto. Puedes copiar las filas de la semana anterior y cambiar la columna «Semana» y las horas.
              </li>
              <li>
                <strong>Hoja Insights:</strong> no tocar nada. Las fórmulas SUMIF suman todas las filas de Asignación
                independientemente de la semana, así que el dashboard se actualiza solo.
              </li>
            </ol>
          </div>
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/25 p-5 sm:p-6">
            <h3 className="text-white font-semibold mb-2 text-base sm:text-lg">Truco: filtrar por semana</h3>
            <p className="text-indigo-100/90 text-sm sm:text-base leading-relaxed m-0">
              Todas las hojas de datos tienen <strong>autofiltros</strong> activados. En Asignación puedes filtrar por la
              columna «Semana» para ver solo la semana actual. En Insights puedes filtrar por departamento para revisar
              la carga de un equipo concreto. Los totales de la plantilla suman el rango completo, pero el filtro visual
              te permite centrarte en lo que importa en cada reunión.
            </p>
          </div>
          <div className="rounded-2xl border-l-4 border-amber-400 bg-amber-500/10 border border-amber-500/20 p-4 sm:p-6 mt-6">
            <p className="text-white/95 font-medium m-0">
              <strong>Limitación:</strong> como Insights suma todas las semanas, si dejas las filas antiguas de Asignación,
              las horas acumuladas crecen semana tras semana. Para un dashboard «solo esta semana», filtra o borra las filas
              de semanas anteriores. Es una de las fricciones del modelo manual que una herramienta integrada resuelve
              automáticamente.
            </p>
          </div>
        </section>
      </RevealOnScroll>

      {/* X. Google Sheets */}
      <RevealOnScroll delay={3}>
        <section id="google-sheets-diferencias" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6">
            X. Google Sheets vs Excel: ¿cambia algo?
          </h2>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            <p>
              La plantilla funciona en los dos; las fórmulas son compatibles. La diferencia relevante es operativa:
            </p>
            <ul className="space-y-2 list-disc pl-6 text-indigo-100/90">
              <li>
                <strong>Colaboración en tiempo real:</strong> Sheets permite que varias personas editen a la vez, lo que
                reduce el problema de «versión 3 o versión 4». Pero no elimina el riesgo de pisarse celdas ni de romper
                una fórmula sin querer.
              </li>
              <li>
                <strong>Historial de cambios:</strong> Sheets guarda versiones automáticamente. Excel solo si usas
                OneDrive/SharePoint. En la práctica, ambos cubren el caso de «quién rompió la fila 12».
              </li>
              <li>
                <strong>Desplegables y protección:</strong> al importar el .xlsx en Google Sheets, los desplegables se
                convierten en validación de datos nativa y la protección en rangos protegidos. No hay que reconfigurar nada.
              </li>
              <li>
                <strong>Rendimiento:</strong> con muchas filas y fórmulas cruzadas, Excel local suele ir más fluido que
                Sheets en el navegador. Para plantillas de 5–30 personas, la diferencia es despreciable.
              </li>
            </ul>
            <p>
              La conclusión: da igual el formato. <strong>El techo está en el modelo manual</strong>, no en si abres
              <span className="font-mono">.xlsx</span> o lo importas en Drive.
            </p>
          </div>
        </section>
      </RevealOnScroll>

      {/* XI. Evolución a Taimbox */}
      <RevealOnScroll delay={3}>
        <section id="evolucion-taimbox-passiva" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6 flex items-center gap-3">
            <LayoutGrid className="h-8 w-8 text-indigo-400 shrink-0" />
            XI. Evolución: de rellenar celdas a planificación pasiva
          </h2>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-6">
            <p>
              La lógica que acabas de estructurar —capacidad neta, cuadrante de asignación, pacing, margen y utilización— es
              exactamente la misma que usa un sistema integrado. La diferencia es <strong>quién la mantiene</strong>: tú a
              mano o la herramienta de forma pasiva.
            </p>
            <p>
              En <strong>Taimbox</strong>, mueves bloques en el planificador por horas. Los informes de utilización, carga
              por departamento y margen por proyecto se alimentan de ese movimiento sin que alguien reimporte números cada
              lunes. El criterio es el tuyo; la ejecución del dato deja de depender de copiar y pegar.
            </p>
            <p className="m-0">
              No es «tirar el Excel» el primer día: es <strong>llevar la plantilla mental (y las fórmulas) a un sitio
              donde el dato no se descuadra</strong>. La evolución natural cuando el equipo ya no cabe en filas y
              columnas compartidas.
            </p>
          </div>
          <div className="rounded-2xl border border-indigo-500/25 bg-indigo-950/40 p-5 sm:p-6 flex gap-4">
            <Zap className="h-8 w-8 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-indigo-100/95 m-0 mb-2">
                <strong>Planificación pasiva:</strong> tú planificas; Taimbox calcula utilización, margen y capacidad en
                segundo plano. Las métricas que antes montabas a mano nacen de la forma en que trabajáis, sin
                reconciliar hojas.
              </p>
              <p className="text-indigo-200/70 text-sm m-0">
                Los reportes de rentabilidad y el planificador de recursos detallan el enfoque en sus landings.
              </p>
            </div>
          </div>
        </section>
      </RevealOnScroll>

      {/* XII. FAQ */}
      <RevealOnScroll delay={3}>
        <section id="faq-plantilla-recursos" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6 flex items-center gap-3">
            <HelpCircle className="h-8 w-8 text-purple-400 shrink-0" />
            Preguntas frecuentes
          </h2>
          <div className="rounded-2xl border border-white/10 bg-white/5 divide-y divide-white/10">
            <div className="p-5 sm:p-6">
              <h4 className="text-white font-semibold mb-2">¿Necesito macros o VBA para que funcione la plantilla?</h4>
              <p className="text-sm text-indigo-200/90 m-0">
                No. Solo usa fórmulas estándar (SUMA, SI, SUMIF, VLOOKUP, SUMPRODUCT, COUNTIF) y formato condicional nativo.
                Funciona en Excel, LibreOffice y Google Sheets sin necesidad de habilitar macros.
              </p>
            </div>
            <div className="p-5 sm:p-6">
              <h4 className="text-white font-semibold mb-2">¿Cada cuánto hay que actualizar la plantilla?</h4>
              <p className="text-sm text-indigo-200/90 m-0">
                Lo ideal es revisarla <strong>al inicio de cada semana</strong> (o al final de la anterior): ajustar
                ausencias en Equipo y añadir las asignaciones de la nueva semana. La frecuencia semanal da tiempo a
                reaccionar antes de que una sobrecarga se convierta en crisis.
              </p>
            </div>
            <div className="p-5 sm:p-6">
              <h4 className="text-white font-semibold mb-2">¿A partir de cuántas personas deja de ser práctico el Excel?</h4>
              <p className="text-sm text-indigo-200/90 m-0">
                No hay un número mágico; depende más del ritmo de cambios (proyectos nuevos, rotaciones) que del tamaño.
                En la práctica, muchas agencias notan la fricción entre <strong>8 y 15 personas</strong> con múltiples
                proyectos simultáneos: ahí el mantenimiento semanal empieza a no compensar.
              </p>
            </div>
            <div className="p-5 sm:p-6">
              <h4 className="text-white font-semibold mb-2">¿Puedo usar esta plantilla junto a un tablero Kanban (Trello, Asana…)?</h4>
              <p className="text-sm text-indigo-200/90 m-0">
                Sí: el Kanban gestiona el flujo de tareas; la plantilla de recursos gestiona <strong>horas y
                capacidad</strong>. Se complementan: el tablero dice «qué se está haciendo» y la plantilla dice «quién
                tiene horas libres para hacerlo».
              </p>
            </div>
            <div className="p-5 sm:p-6">
              <h4 className="text-white font-semibold mb-2">¿Qué rango de utilización es «sano» en una agencia?</h4>
              <p className="text-sm text-indigo-200/90 m-0">
                Orientativo: <strong>70–85 %</strong> sobre capacidad neta en muchas agencias de servicios. Por debajo
                puede indicar falta de pipeline; por encima del 90 % empieza el riesgo de quemazo y errores. El mix de
                negocio (retainers, proyectos puntuales, I+D interna) cambia el objetivo.
              </p>
            </div>
            <div className="p-5 sm:p-6">
              <h4 className="text-white font-semibold mb-2">¿Qué diferencia hay entre esta plantilla y un diagrama de Gantt?</h4>
              <p className="text-sm text-indigo-200/90 m-0">
                El Gantt ordena tareas en un <strong>eje temporal</strong> (quién hace qué y cuándo); la plantilla de
                recursos se centra en <strong>capacidad y carga</strong> (cuántas horas tiene cada persona y cuántas están
                asignadas). En proyectos complejos, ambas vistas se complementan. La combinación se detalla en la guía de{' '}
                <Link to="/blog/planificacion-proyectos-cronograma-recursos" className="text-indigo-300 hover:text-white underline underline-offset-2">
                  planificación de proyectos: cronograma, presupuesto y recursos
                </Link>
                .
              </p>
            </div>
            <div className="p-5 sm:p-6">
              <h4 className="text-white font-semibold mb-2">¿El pacing tiene en cuenta que no todos los meses duran lo mismo?</h4>
              <p className="text-sm text-indigo-200/90 m-0">
                La fórmula divide las horas presupuestadas entre 4 semanas como aproximación. En meses de 5 semanas
                laborales, el pacing real será ligeramente inferior al mostrado. Para la mayoría de agencias la
                aproximación es suficiente; si necesitas precisión al día, un sistema integrado lo resuelve mejor.
              </p>
            </div>
            <div className="p-5 sm:p-6">
              <h4 className="text-white font-semibold mb-2">¿Cómo actualizo los desplegables si añado una persona o proyecto nuevo?</h4>
              <p className="text-sm text-indigo-200/90 m-0">
                En Excel: ve a la hoja Asignación, selecciona la columna con el desplegable, Datos → Validación de datos,
                y amplía la lista. En Google Sheets: clic en la celda, icono de desplegable, editar lista. Los nombres
                deben coincidir exactamente con las hojas Equipo o Proyectos.
              </p>
            </div>
          </div>
        </section>
      </RevealOnScroll>

      {/* Resumen + enlaces */}
      <RevealOnScroll delay={3}>
        <section id="resumen-recursos" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6 flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-emerald-400 shrink-0" />
            Resumen: lo que cambia con una plantilla bien hecha
          </h2>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-6">
            <p>
              La diferencia entre una agencia que «cree que va bien» y una que <strong>sabe que va bien</strong> suele
              estar en unas pocas columnas de un Excel: capacidad neta, horas asignadas, utilización, pacing y margen.
              No es rocket science: es disciplina de datos, desplegables para no romper nada, protección para no borrar
              lo importante y revisión semanal.
            </p>
            <p>
              Cuando esa disciplina ya no escala con la hoja, la <strong>misma lógica</strong> puede vivir en una
              herramienta que actualiza los números de forma pasiva. El criterio que acabas de aprender no caduca; el
              soporte donde lo aplicas, sí puede evolucionar.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 sm:p-8 mb-8">
            <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-4">
              Los KPIs que acompañan a esta plantilla —utilización, pacing, estimado vs real— están desarrollados en{' '}
              <Link to="/blog/kpis-agencias-marketing-2026" className="text-indigo-300 hover:text-white underline underline-offset-2">
                KPIs para agencias de marketing
              </Link>
              . La gestión del tiempo que evita que las tareas se expandan sin control aparece en{' '}
              <Link to="/blog/ley-parkinson" className="text-indigo-300 hover:text-white underline underline-offset-2">
                Ley de Parkinson
              </Link>{' '}
              y{' '}
              <Link to="/blog/que-es-timeboxing" className="text-indigo-300 hover:text-white underline underline-offset-2">
                timeboxing
              </Link>
              . Y la visión global de cronograma + presupuesto + equipo se detalla en{' '}
              <Link to="/blog/planificacion-proyectos-cronograma-recursos" className="text-indigo-300 hover:text-white underline underline-offset-2">
                planificación de proyectos
              </Link>
              .
            </p>
          </div>
        </section>
      </RevealOnScroll>

      {/* CTA */}
      <RevealOnScroll delay={3}>
        <section className="mb-12">
          <div className="flex flex-wrap gap-3 justify-center mb-8">
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
            <Link to="/guia">
              <Button
                size="sm"
                variant="outline"
                className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                Guía de funcionalidades <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div id="cta-plantilla-recursos" className="text-center mt-12 mb-8 scroll-mt-24">
            <h2 className="text-2xl sm:text-4xl font-bold text-white mb-4">
              La plantilla es el primer paso; el planificador es el siguiente
            </h2>
            <p className="text-indigo-100/90 text-lg mb-8 max-w-2xl mx-auto">
              Capacidad, asignación, pacing y utilización sin mantener la hoja a mano. Taimbox se puede explorar sin compromiso.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Link to="/planificador-recursos">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-8 py-6 text-base font-bold shadow-xl shadow-indigo-500/30 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-indigo-500/40"
                >
                  Cómo Taimbox automatiza tu plantilla <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <a href={PLANTILLA_XLSX_HREF} download>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-indigo-400/60 bg-transparent px-8 py-6 text-base font-semibold text-white shadow-none hover:bg-indigo-500/20 hover:text-white rounded-xl"
                >
                  <Download className="mr-2 h-5 w-5" />
                  Descargar plantilla .xlsx
                </Button>
              </a>
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
