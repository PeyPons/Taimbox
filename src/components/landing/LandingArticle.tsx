import { lazy, Suspense, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DemoProvider } from '@/contexts/DemoContext';
import {
  ArrowRight,
  Brain,
  AlertTriangle,
  Shield,
  Code,
  Zap,
  BarChart3,
  Radio,
  Megaphone,
  Clock,
  ListTodo,
} from 'lucide-react';

const DemoPlannerLazy = lazy(() =>
  import('@/components/demo/DemoDashboard').then((m) => ({ default: m.DemoPlanner }))
);

function BudgetOverflowChart() {
  return (
    <div className="my-6 flex flex-col gap-3 max-w-md mx-auto">
      <p className="text-center text-xs font-medium text-indigo-200/80 uppercase tracking-wider">Presupuesto (50h) vs real (90h)</p>
      <div className="relative w-full h-11 rounded-xl bg-indigo-900/50 border border-indigo-500/20 overflow-hidden shadow-inner">
        <div className="absolute inset-0 flex">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-l-xl transition-[width] duration-1000 ease-out"
            style={{ width: '55.5%' }}
          />
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-red-500 rounded-r-xl transition-[width] duration-700 ease-out delay-300"
            style={{ width: '44.5%' }}
          />
        </div>
        <div className="absolute left-[55.5%] top-0 bottom-0 w-0.5 bg-white/80 z-10 shadow-sm" title="Límite 50h" />
      </div>
      <div className="flex justify-between w-full text-[11px] text-indigo-200/60 font-medium text-center">
        <span>0h</span>
        <span>50h (límite)</span>
        <span className="text-red-400">90h — desbordado</span>
      </div>
    </div>
  );
}

export function LandingArticle() {
  const [apiTab, setApiTab] = useState<'curl' | 'js'>('js');

  return (
    <article id="por-que-timeboxing" className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 md:py-16 text-left overflow-x-hidden">
      {/* Bloque 1: El gancho */}
      <section className="mb-12 sm:mb-14">
        <div className="mb-6 text-center">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-indigo-300 bg-indigo-500/20 border border-indigo-400/30">
            Para agencias
          </span>
        </div>
        <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-[2.75rem] font-black text-white mb-5 sm:mb-6 leading-[1.15] tracking-tight text-center">
          Taimbox: por qué tu lista de tareas está matando la rentabilidad de tu agencia
        </h1>
        <div className="space-y-4 text-indigo-100/95 text-base sm:text-lg leading-[1.75]">
          <p>
            Si diriges una agencia de marketing, desarrollo o consultoría, conoces esta historia: vendes un proyecto por 5.000€ calculado a 50 horas. El equipo empieza a trabajar. Surgen reuniones, imprevistos, «pequeños cambios» y correcciones. Un mes después, miras los números: habéis invertido 90 horas. Has perdido dinero.
          </p>
          <p>
            El problema no es tu equipo. El problema no es el cliente. El problema es que gestionas tareas, cuando deberías estar gestionando cajas de tiempo vinculadas a dinero.
          </p>
          <div className="rounded-2xl border-l-4 border-indigo-400 bg-indigo-500/10 border border-indigo-500/20 p-4 sm:p-6 my-6">
            <p className="text-white/95 font-medium m-0">
              Aquí es donde entra el timeboxing: una metodología que ha pasado de ser un truco de productividad personal a convertirse en el estándar operativo de las empresas de servicios más rentables del mundo.
            </p>
          </div>
        </div>
        <BudgetOverflowChart />
      </section>

      {/* Bloque 2: La teoría (Bento grid) */}
      <section className="mb-12 sm:mb-14">
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-4 sm:p-8 mb-6">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
            ¿Qué es exactamente el timeboxing?
          </h2>
          <p className="text-indigo-100/90 mb-4 text-base sm:text-lg leading-relaxed">
            El timeboxing no es una lista de tareas (to-do list). En una lista de tareas, trabajas en algo hasta que lo terminas. En el timeboxing, decides cuánto tiempo vas a dedicar a una tarea antes de empezarla.
          </p>
          <p className="text-indigo-100/90 font-medium">
            La premisa es simple pero revolucionaria: <span className="text-white">el tiempo es una restricción fija, el alcance es variable.</span>
          </p>
        </div>

        <h3 className="text-xl font-bold text-white mb-4">Los 3 principios científicos del timeboxing</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-900/70 to-purple-900/50 p-4 sm:p-6 flex flex-col shadow-lg shadow-indigo-950/50 hover:border-indigo-400/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/30 flex items-center justify-center mb-4">
              <Clock className="h-6 w-6 text-indigo-300" />
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-300/90 mb-2">Principio 1</span>
            <h4 className="text-white font-semibold mb-2 text-lg">Ley de Parkinson</h4>
            <p className="text-sm text-indigo-200/85 flex-1 leading-relaxed">
              «El trabajo se expande hasta llenar el tiempo disponible para que se termine». Si te das una semana para escribir un copy, tardarás una semana. Si te das 2 horas (una «time box»), lo harás en 2 horas.
            </p>
          </div>
          <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-900/70 to-pink-900/50 p-4 sm:p-6 flex flex-col shadow-lg shadow-purple-950/50 hover:border-purple-400/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-purple-500/30 flex items-center justify-center mb-4">
              <Brain className="h-6 w-6 text-purple-300" />
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-300/90 mb-2">Principio 2</span>
            <h4 className="text-white font-semibold mb-2 text-lg">Carga cognitiva</h4>
            <p className="text-sm text-indigo-200/85 flex-1 leading-relaxed">
              Decidir «qué hacer ahora» gasta energía mental. Con el timeboxing, esa decisión ya está tomada en la planificación. Solo ejecutas.
            </p>
          </div>
          <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-900/70 to-orange-900/50 p-4 sm:p-6 flex flex-col shadow-lg shadow-amber-950/50 hover:border-amber-400/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-amber-500/30 flex items-center justify-center mb-4">
              <ListTodo className="h-6 w-6 text-amber-300" />
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-300/90 mb-2">Principio 3</span>
            <h4 className="text-white font-semibold mb-2 text-lg">Realismo brutal</h4>
            <p className="text-sm text-indigo-200/85 flex-1 leading-relaxed">
              Una lista de tareas es una carta a los Reyes Magos. Un calendario con bloques de tiempo es la realidad física de tu día.
            </p>
          </div>
        </div>
      </section>

      {/* Bloque 3: El problema en agencias */}
      <section className="mb-12 sm:mb-14">
        <div className="rounded-2xl border border-amber-500/20 bg-amber-950/30 backdrop-blur-sm p-4 sm:p-8 mb-6">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
            Por qué el timeboxing tradicional no funciona en agencias
          </h2>
          <p className="text-indigo-100/90 mb-4 text-base leading-relaxed">
            Las herramientas como Google Calendar o Notion son fantásticas para individuos, pero son ciegas financieramente para una empresa.
          </p>
          <p className="text-indigo-100/90 mb-4">
            Cuando aplicas timeboxing en una agencia, te enfrentas a la <strong className="text-white">«triple amenaza»</strong>:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-900/50 to-orange-900/30 p-4 sm:p-6 flex flex-col">
            <div className="w-10 h-10 rounded-lg bg-amber-500/30 flex items-center justify-center mb-3 sm:mb-4">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
            </div>
            <h4 className="text-white font-semibold mb-2 text-base sm:text-inherit">La paradoja del festivo</h4>
            <p className="text-sm text-indigo-200/85 leading-relaxed">
              Si planificas 40 horas semanales y hay un festivo, tu Excel se rompe.
            </p>
          </div>
          <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-900/50 to-orange-900/30 p-4 sm:p-6 flex flex-col">
            <div className="w-10 h-10 rounded-lg bg-amber-500/30 flex items-center justify-center mb-3 sm:mb-4">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
            </div>
            <h4 className="text-white font-semibold mb-2 text-base sm:text-inherit">La doble contabilidad</h4>
            <p className="text-sm text-indigo-200/85 leading-relaxed">
              ¿Qué pasa si un empleado está de baja y a la vez hay un evento de equipo? La mayoría de herramientas restan las horas dos veces, falseando la capacidad real.
            </p>
          </div>
          <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-900/50 to-orange-900/30 p-4 sm:p-6 flex flex-col">
            <div className="w-10 h-10 rounded-lg bg-amber-500/30 flex items-center justify-center mb-3 sm:mb-4">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
            </div>
            <h4 className="text-white font-semibold mb-2 text-base sm:text-inherit">El muro financiero</h4>
            <p className="text-sm text-indigo-200/85 leading-relaxed">
              Tu calendario dice «Diseñar Home (4h)», pero no te dice que esas 4 horas cuestan 200€ de nómina y el cliente solo paga 150€.
            </p>
          </div>
        </div>
        <div className="mt-6 rounded-2xl border-l-4 border-indigo-400 bg-indigo-500/10 border border-indigo-500/20 p-4 sm:p-6">
          <p className="text-indigo-100/95 font-medium m-0">
            Las agencias necesitan algo más que un calendario. Necesitan un <span className="text-white">sistema operativo financiero basado en tiempo</span>.
          </p>
        </div>
      </section>

      {/* Bloque 4: La solución tecnológica */}
      <section className="mb-12 sm:mb-14">
        <div className="rounded-2xl border border-indigo-500/20 bg-indigo-950/40 backdrop-blur-sm p-4 sm:p-8 mb-6">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
            Taimbox + inteligencia financiera: la evolución
          </h2>
          <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            Hemos construido una plataforma que no solo gestiona el tiempo, sino que entiende la economía de tu agencia. No es solo un calendario; es un cerebro que calcula rentabilidad en tiempo real.
          </p>
        </div>
        <p className="text-indigo-100/90 mb-6 font-medium">Así es como nuestra tecnología soluciona lo que otros ignoran:</p>

        <div className="space-y-8">
          <div className="rounded-2xl border border-indigo-500/25 bg-white/5 p-4 sm:p-8">
            <div className="flex items-center gap-3 mb-3 sm:mb-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/30 text-indigo-300 font-bold text-sm">1</span>
              <h3 className="text-lg sm:text-xl font-bold text-white m-0 min-w-0">
                Cálculo de «horas computadas» (el cerebro)
              </h3>
            </div>
            <p className="text-indigo-100/90 mb-4">
              Olvídate de las hojas de cálculo. Nuestro algoritmo de backend procesa automáticamente:
            </p>
            <ul className="space-y-4 mb-6 text-indigo-100/90">
              <li className="flex flex-col gap-1 sm:flex-row sm:gap-3">
                <span className="text-indigo-400 font-medium shrink-0 sm:min-w-[11rem]">Semanas partidas:</span>
                <span className="min-w-0">Si una semana laboral empieza en enero y acaba en febrero, el sistema divide los costes proporcionalmente para que tu cierre de mes sea exacto al céntimo.</span>
              </li>
              <li className="flex flex-col gap-1 sm:flex-row sm:gap-3">
                <span className="text-indigo-400 font-medium shrink-0 sm:min-w-[11rem]">Gestión de capacidad real:</span>
                <span className="min-w-0">Utilizamos una lógica de Max(Ausencia, Evento) para calcular la disponibilidad. Si es festivo y alguien está enfermo, el sistema sabe que no se pierden el doble de horas.</span>
              </li>
            </ul>
            <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/60 p-3 sm:p-4 min-h-[280px] sm:min-h-[320px] min-w-0 max-w-full overflow-x-auto">
              <p className="text-xs text-indigo-200/80 mb-3 font-medium">Vista previa del planificador con datos de ejemplo. Explora la distribución de horas por empleado y proyecto.</p>
              <Suspense fallback={<div className="flex items-center justify-center h-64 text-indigo-200/70">Cargando planificador…</div>}>
                <DemoProvider>
                  <div className="min-w-0 max-w-full">
                    <DemoPlannerLazy />
                  </div>
                </DemoProvider>
              </Suspense>
            </div>
          </div>

          <div className="rounded-2xl border border-indigo-500/25 bg-white/5 p-4 sm:p-8">
            <div className="flex items-center gap-3 mb-3 sm:mb-4">
              <Radio className="h-6 w-6 shrink-0 text-indigo-400" />
              <h3 className="text-lg sm:text-xl font-bold text-white m-0 min-w-0">
                2. «Team Pulse»: operaciones en tiempo real
              </h3>
            </div>
            <p className="text-indigo-100/90 mb-4">
              Mientras las herramientas tradicionales te muestran reportes estáticos del mes pasado, nuestro Team Pulse utiliza WebSockets para mostrarte el estado de tu agencia ahora mismo.
            </p>
            <ul className="flex flex-wrap gap-2 sm:gap-3 text-indigo-100/90 justify-center">
              <li className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <strong className="text-emerald-300">Idle</strong> (libre)
              </li>
              <li className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/30">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <strong className="text-amber-300">Busy</strong> (saturado)
              </li>
              <li className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/30">
                <span className="w-2 h-2 rounded-full bg-red-400" />
                <strong className="text-red-300">Bloqueado</strong>
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-indigo-500/25 bg-white/5 p-4 sm:p-8">
            <div className="flex items-center gap-3 mb-3 sm:mb-4">
              <Megaphone className="h-6 w-6 shrink-0 text-indigo-400" />
              <h3 className="text-lg sm:text-xl font-bold text-white m-0 min-w-0">
                3. Monitor de presupuestos de clientes (PPC)
              </h3>
            </div>
            <p className="text-indigo-100/90 m-0">
              Integramos vía API los datos de Meta Ads y Google Ads de tus clientes. Resultado: un panel donde controlas el consumo de las campañas de todos tus clientes en un solo lugar. Detecta sobrecostes antes de que ocurran y evita que la agencia pague de su bolsillo los errores humanos en presupuestos.
            </p>
          </div>
        </div>
      </section>

      {/* Bloque 5: Arquitectura y seguridad */}
      <section className="mb-12 sm:mb-14">
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-4 sm:p-8 mb-6">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
            Construido para escalar (developer-first)
          </h2>
          <p className="text-indigo-100/90 leading-relaxed">
            No somos una herramienta «low-code» hecha con parches. Somos una infraestructura de ingeniería de software diseñada para empresas que se toman en serio sus datos.
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <div className="rounded-xl border border-indigo-500/25 bg-indigo-950/40 p-4 sm:p-5 flex flex-col gap-2 sm:flex-row sm:gap-4">
            <Code className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-white font-semibold mb-1">API abierta y documentada</p>
              <p className="text-indigo-100/90 text-sm m-0">
                ¿Tienes un ERP o un CRM propio? Conecta nuestra API RESTful en minutos. Te entregamos los datos ya procesados (hours_computed), ahorrándote cientos de horas de ingeniería matemática.{' '}
                <Link to="/api-docs" className="text-indigo-300 hover:text-white underline underline-offset-2 font-medium">
                  Documentación completa →
                </Link>
              </p>
            </div>
          </div>
          <div className="rounded-xl border border-emerald-500/25 bg-emerald-950/30 p-4 sm:p-5 flex flex-col gap-2 sm:flex-row sm:gap-4">
            <Shield className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-white font-semibold mb-1">Seguridad bancaria (RLS)</p>
              <p className="text-indigo-100/90 text-sm m-0">
                Tus datos están aislados a nivel de base de datos mediante Row Level Security. Es matemáticamente imposible que otra agencia acceda a tu información.
              </p>
            </div>
          </div>
          <div className="rounded-xl border border-amber-500/25 bg-amber-950/30 p-4 sm:p-5 flex flex-col gap-2 sm:flex-row sm:gap-4">
            <Zap className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-white font-semibold mb-1">Tokens criptográficos</p>
              <p className="text-indigo-100/90 text-sm m-0">
                Sistema de autenticación propio con firma HMAC SHA-256.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-indigo-500/30 bg-slate-950/90 overflow-hidden shadow-xl overflow-x-auto">
          <Tabs value={apiTab} onValueChange={(v) => setApiTab(v as 'curl' | 'js')}>
            <TabsList className="w-full justify-start rounded-none border-b border-white/10 bg-slate-900/90 p-0 h-auto min-w-0">
              <TabsTrigger value="js" className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-400 data-[state=active]:bg-transparent data-[state=active]:text-white px-5 py-3 text-sm font-medium">
                JS SDK
              </TabsTrigger>
              <TabsTrigger value="curl" className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-400 data-[state=active]:bg-transparent data-[state=active]:text-white px-5 py-3 text-sm font-medium">
                cURL
              </TabsTrigger>
            </TabsList>
            <TabsContent value="js" className="m-0 p-3 sm:p-5">
              <p className="text-xs text-slate-400 mb-2 font-medium">Obtener rentabilidad por proyecto (paso 2 del tutorial de reportes)</p>
              <pre className="p-3 sm:p-4 rounded-lg bg-slate-900 text-xs sm:text-sm text-slate-200 overflow-x-auto font-mono leading-relaxed border border-white/5 min-w-0">
                <code>{`const { data: projects } = await timeboxing
  .from('projects')
  .select('id, name, budget_hours, monthly_fee')
  .eq('status', 'active')

const report = projects?.map(p => {
  const hours = byProject[p.id] || { planned: 0, actual: 0, computed: 0 }
  const progress = p.budget_hours > 0
    ? Math.round((hours.computed / p.budget_hours) * 100)
    : 0
  const hourValue = p.budget_hours > 0
    ? (p.monthly_fee / p.budget_hours).toFixed(2)
    : '0'
  return {
    project: p.name,
    budgetHours: p.budget_hours,
    hoursPlanned: hours.planned,
    hoursActual: hours.actual,
    progress: \`\${progress}%\`,
    hourValue: \`\${hourValue} EUR/h\`
  }
})`}</code>
              </pre>
            </TabsContent>
            <TabsContent value="curl" className="m-0 p-3 sm:p-5">
              <p className="text-xs text-slate-400 mb-2 font-medium">Ejemplo de consulta a la API (allocations + hours_computed). Base URL y tokens: <Link to="/api-docs" className="text-indigo-300 hover:text-white underline">ver documentación</Link>.</p>
              <pre className="p-3 sm:p-4 rounded-lg bg-slate-900 text-xs sm:text-sm text-slate-200 overflow-x-auto font-mono leading-relaxed border border-white/5 min-w-0">
                <code>{`curl -X GET "https://api.taimbox.com/rest/v1/allocations?week_start_date=gte.2026-02-01&week_start_date=lte.2026-02-28&select=project_id,hours_assigned,hours_actual,hours_computed" \\
  -H "apikey: <ANON_KEY>" \\
  -H "Authorization: Bearer <TU_API_TOKEN>" \\
  -H "Content-Type: application/json"`}</code>
              </pre>
              <p className="text-[11px] text-slate-500 mt-2">
                <strong className="text-slate-400">ANON_KEY:</strong> clave anónima de tu instancia Supabase. <strong className="text-slate-400">TU_API_TOKEN:</strong> JWT generado en Configuración → API & Integraciones.
              </p>
            </TabsContent>
          </Tabs>
          <div className="px-3 sm:px-5 pb-4">
            <Link to="/api-docs" className="text-sm text-indigo-300 hover:text-white underline underline-offset-2 font-medium">
              Ver tutorial completo de reportes y rentabilidad →
            </Link>
          </div>
        </div>
      </section>

      {/* Bloque 6: Conclusión y CTA */}
      <section className="mb-0">
        <div className="rounded-3xl border-2 border-indigo-500/30 bg-gradient-to-br from-indigo-600/20 via-purple-600/20 to-indigo-600/20 p-4 sm:p-10">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4 text-center">
            Deja de adivinar, empieza a saber
          </h2>
          <p className="text-indigo-100/95 mb-4 text-base sm:text-lg leading-relaxed text-center">
            El timeboxing es la metodología. Nuestra plataforma es la herramienta. Tienes dos opciones:
          </p>
          <ol className="list-decimal list-inside text-indigo-100/95 space-y-2 mb-6 pl-1 text-left max-w-lg mx-auto">
            <li>Seguir gestionando tu agencia con intuición y hojas de Excel que se rompen.</li>
            <li>Implementar un sistema que alinea tus operaciones con tus finanzas automáticamente.</li>
          </ol>
          <p className="text-indigo-100/90 mb-8 text-base text-center">
            La tecnología ya está aquí. La API está lista. Tu equipo te lo agradecerá.
          </p>
          <div className="text-center">
            <Link to="/login">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-12 py-7 text-lg font-bold shadow-2xl shadow-indigo-500/30 rounded-xl"
              >
                Empezar prueba gratuita
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <p className="mt-3 text-sm text-indigo-200/80">
              No requiere tarjeta de crédito. Configuración en 2 minutos.
            </p>
          </div>
        </div>
      </section>
    </article>
  );
}
