import { useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Users,
  BarChart3,
  Target,
  FileText,
  Clock,
  CheckCircle2,
  LayoutGrid,
  PieChart,
  TrendingUp,
  TrendingDown,
  Building2,
  Settings,
  Link2,
  Bell,
  Zap,
  ChevronRight,
  ChevronLeft,
  Home,
  BookOpen,
  Lightbulb,
  AlertTriangle,
  Eye,
  MousePointerClick,
  Layers,
  GitBranch,
  Shield,
  Download,
  Filter,
  Pencil,
  Plus,
  Search,
  ToggleLeft,
  UserPlus,
  CalendarOff,
  Gauge,
  DollarSign,
  FolderOpen,
  Tag,
  Activity,
  Timer,
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { cn } from '@/lib/utils';
import { LandingHeader } from '@/components/landing/LandingHeader';

/* ─── SECTIONS DATA ─── */
const SECTIONS: { slug: string; title: string; icon: React.ElementType; short: string; color: string }[] = [
  { slug: 'planificador', title: 'Planificador', icon: Calendar, short: 'Calendario visual del equipo y asignación de tareas', color: 'from-indigo-500 to-purple-500' },
  { slug: 'mi-espacio', title: 'Mi espacio', icon: LayoutGrid, short: 'Tu dashboard personal: carga, prioridades y control de planificación', color: 'from-purple-500 to-pink-500' },
  { slug: 'deadlines', title: 'Deadlines', icon: Target, short: 'Objetivos mensuales por proyecto y empleado', color: 'from-amber-500 to-orange-500' },
  { slug: 'informes', title: 'Informes', icon: BarChart3, short: 'Reportes, métricas y exportación de datos', color: 'from-rose-500 to-pink-500' },
  { slug: 'weekly-forecast', title: 'Weekly Forecast', icon: FileText, short: 'Cierre semanal y redistribución inteligente de horas', color: 'from-violet-500 to-purple-500' },
  { slug: 'equipo', title: 'Equipo', icon: Users, short: 'Miembros, ausencias, horarios y capacidad', color: 'from-blue-500 to-cyan-500' },
  { slug: 'tiempos', title: 'Tiempos', icon: Timer, short: 'Cronómetro por tarea y vista en vivo del equipo', color: 'from-teal-500 to-emerald-500' },
  { slug: 'clientes-proyectos', title: 'Clientes y proyectos', icon: Building2, short: 'Catálogo de clientes, proyectos y horas contratadas', color: 'from-slate-500 to-indigo-500' },
  { slug: 'configuracion', title: 'Configuración', icon: Settings, short: 'Agencia, roles, permisos e integraciones', color: 'from-slate-600 to-slate-800' },
];

/* ─── LAYOUT ─── */
function GuiaLayout({ children, title, description }: { children: React.ReactNode; title?: string; description?: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-indigo-900 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
      </div>
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
        backgroundSize: '50px 50px'
      }} />
      <LandingHeader />
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {title && (
          <div className="mb-10">
            <h1 className="text-3xl sm:text-5xl font-black text-white mb-3">{title}</h1>
            {description && <p className="text-lg sm:text-xl text-indigo-200/90 max-w-2xl">{description}</p>}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

/* ─── SECTION CARD (index) ─── */
function SectionCard({ slug, title, icon: Icon, short, color }: typeof SECTIONS[0]) {
  return (
    <Link to={`/guia/${slug}`} className="block">
      <Card className="border-2 border-white/15 bg-gradient-to-br from-indigo-900/90 to-purple-900/90 backdrop-blur-xl hover:border-white/40 hover:scale-[1.02] hover:shadow-2xl hover:shadow-indigo-500/20 transition-all duration-300 group cursor-pointer">
        <CardContent className="p-5 sm:p-6 flex items-center gap-4 relative overflow-hidden">
          {/* Glow behind icon on hover */}
          <div className={cn("absolute -left-4 top-1/2 -translate-y-1/2 w-24 h-24 rounded-full b lur-2xl opacity-0 group-hover:opacity-40 transition-opacity duration-500 bg-gradient-to-br", color)} />
          <div className={cn("relative w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-br shrink-0 shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300", color)}>
            <Icon className="h-7 w-7 text-white" />
          </div>
          <div className="flex-1 min-w-0 relative">
            <h2 className="text-lg sm:text-xl font-bold text-white group-hover:text-indigo-200 transition-colors duration-200">{title}</h2>
            <p className="text-sm text-indigo-200/70 mt-0.5">{short}</p>
          </div>
          <ChevronRight className="h-5 w-5 text-white/40 group-hover:text-white group-hover:translate-x-1 shrink-0 transition-all duration-300" />
        </CardContent>
      </Card>
    </Link>
  );
}

/* ─── REUSABLE CONTENT COMPONENTS ─── */

function ContentBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-10">
      <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-2.5">
        <span className="w-1.5 h-7 bg-gradient-to-b from-indigo-400 to-purple-400 rounded-full" />
        {title}
      </h2>
      <div className="text-indigo-100/90 leading-relaxed space-y-4">{children}</div>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description, color = 'from-indigo-500 to-purple-500' }: { icon: React.ElementType; title: string; description: string; color?: string }) {
  return (
    <div className="p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-200 group">
      <div className="flex items-start gap-3">
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br shrink-0 shadow-md group-hover:scale-110 transition-transform duration-200", color)}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-white text-sm mb-1">{title}</h3>
          <p className="text-indigo-200/80 text-sm leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
}

function ExampleBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative p-4 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-xl border border-indigo-400/25 overflow-hidden">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-400 to-purple-400" />
      <div className="flex items-start gap-3 pl-2">
        <Lightbulb className="h-5 w-5 text-indigo-300 shrink-0 mt-0.5" />
        <div className="text-sm text-indigo-200/90 leading-relaxed italic">{children}</div>
      </div>
    </div>
  );
}

function TipBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-400/25">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-500/20 shrink-0">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
        </div>
        <div className="text-sm text-emerald-100/90 leading-relaxed"><strong className="text-emerald-300">Consejo:</strong> {children}</div>
      </div>
    </div>
  );
}

function WarningBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-4 bg-amber-500/10 rounded-xl border border-amber-400/25">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-amber-500/20 shrink-0">
          <AlertTriangle className="h-4 w-4 text-amber-400" />
        </div>
        <div className="text-sm text-amber-100/90 leading-relaxed"><strong className="text-amber-300">Importante:</strong> {children}</div>
      </div>
    </div>
  );
}

function StepList({ steps }: { steps: { title: string; description: string }[] }) {
  return (
    <div className="space-y-0">
      {steps.map((step, i) => (
        <div key={i} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-lg shrink-0">
              {i + 1}
            </div>
            {i < steps.length - 1 && <div className="w-0.5 flex-1 bg-gradient-to-b from-indigo-500/50 to-transparent my-1" />}
          </div>
          <div className={cn("pb-6 min-w-0", i === steps.length - 1 && "pb-0")}>
            <h4 className="font-semibold text-white text-sm mb-1">{step.title}</h4>
            <p className="text-indigo-200/80 text-sm leading-relaxed">{step.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function InfoGrid({ items }: { items: { icon: React.ElementType; label: string; value: string; color: string }[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {items.map((item, i) => {
        const ItemIcon = item.icon;
        return (
          <div key={i} className={cn("p-3 rounded-xl border text-center", item.color)}>
            <ItemIcon className="h-6 w-6 mx-auto mb-1.5" />
            <div className="font-bold text-sm">{item.value}</div>
            <div className="text-[11px] opacity-80 mt-0.5">{item.label}</div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── PREV / NEXT NAV ─── */
function SectionNav({ currentSlug }: { currentSlug: string }) {
  const idx = SECTIONS.findIndex(s => s.slug === currentSlug);
  const prev = idx > 0 ? SECTIONS[idx - 1] : null;
  const next = idx < SECTIONS.length - 1 ? SECTIONS[idx + 1] : null;
  return (
    <div className="flex flex-col sm:flex-row gap-3 mt-10 mb-2">
      {prev ? (
        <Link to={`/guia/${prev.slug}`} className="flex-1">
          <div className="p-4 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 hover:border-white/30 hover:scale-[1.02] hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300 group flex items-center gap-3">
            <ChevronLeft className="h-5 w-5 text-white/50 group-hover:text-white group-hover:-translate-x-0.5 transition-all duration-200 shrink-0" />
            <div className="min-w-0">
              <div className="text-[11px] text-indigo-300/70 uppercase font-semibold tracking-wider">Anterior</div>
              <div className="text-sm font-bold text-white truncate">{prev.title}</div>
            </div>
          </div>
        </Link>
      ) : <div className="flex-1" />}
      {next ? (
        <Link to={`/guia/${next.slug}`} className="flex-1">
          <div className="p-4 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 hover:border-white/30 hover:scale-[1.02] hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300 group flex items-center gap-3 justify-end text-right">
            <div className="min-w-0">
              <div className="text-[11px] text-indigo-300/70 uppercase font-semibold tracking-wider">Siguiente</div>
              <div className="text-sm font-bold text-white truncate">{next.title}</div>
            </div>
            <ChevronRight className="h-5 w-5 text-white/50 group-hover:text-white group-hover:translate-x-0.5 transition-all duration-200 shrink-0" />
          </div>
        </Link>
      ) : <div className="flex-1" />}
    </div>
  );
}

/* ─── SECTION CONTENT RENDERERS ─── */

function PlanificadorContent() {
  return (
    <>
      <ContentBlock title="Qué es el Planificador">
        <p>El Planificador es la <strong className="text-white">vista central</strong> de Taimbox. Muestra qué tareas tiene asignada cada persona en cada semana del mes, con código de colores por proyecto y alertas de sobrecarga en tiempo real.</p>
        <ExampleBox>María está al 120% esta semana. Con un vistazo al calendario ves que tiene 3 proyectos superpuestos y puedes redistribuir antes de que sea tarde.</ExampleBox>
      </ContentBlock>

      <ContentBlock title="Vistas disponibles">
        <div className="grid sm:grid-cols-2 gap-3">
          <FeatureCard icon={Calendar} title="Vista semanal" description="Una columna por empleado con las horas planificadas. Ideal para ver la carga de un vistazo rápido." color="from-indigo-500 to-blue-500" />
          <FeatureCard icon={Layers} title="Vista mensual" description="Tarjetas por semana con listado de tareas completadas y pendientes. Perfecto para visión global del mes." color="from-purple-500 to-pink-500" />
          <FeatureCard icon={LayoutGrid} title="Vista móvil" description="Tarjetas por empleado y selector de semana. Diseñada para tacto con áreas mínimas de 44px." color="from-emerald-500 to-teal-500" />
          <FeatureCard icon={Eye} title="Panel de proyecto" description="Al hacer clic en un proyecto ves presupuesto total, equipo asignado, barra de progreso y alertas." color="from-amber-500 to-orange-500" />
        </div>
      </ContentBlock>

      <ContentBlock title="Cómo añadir una tarea">
        <StepList steps={[
          { title: 'Pulsa el botón +', description: 'En la cabecera de la semana o en el botón "Añadir" de la vista semanal.' },
          { title: 'Selecciona el proyecto', description: 'Busca entre tus proyectos activos. Verás las horas disponibles y el porcentaje usado en cada uno.' },
          { title: 'Nombre, horas y semana', description: 'Escribe el nombre de la tarea, las horas estimadas y en qué semana va.' },
          { title: 'Dependencias (opcional)', description: 'Si la tarea depende de otra, selecciónala. El sistema avisará si la dependencia no está lista.' },
          { title: 'Guardar', description: 'La tarea aparece en el calendario inmediatamente y las barras de carga se actualizan en tiempo real.' },
        ]} />
      </ContentBlock>

      <ContentBlock title="Indicadores de carga">
        <InfoGrid items={[
          { icon: CheckCircle2, label: 'Saludable', value: '< 85%', color: 'bg-emerald-500/15 border-emerald-400/25 text-emerald-300' },
          { icon: AlertTriangle, label: 'Aviso', value: '85-100%', color: 'bg-amber-500/15 border-amber-400/25 text-amber-300' },
          { icon: AlertTriangle, label: 'Sobrecarga', value: '> 100%', color: 'bg-red-500/15 border-red-400/25 text-red-300' },
          { icon: Gauge, label: 'Barra visual', value: 'Tiempo real', color: 'bg-blue-500/15 border-blue-400/25 text-blue-300' },
        ]} />
        <div className="mt-3" />
        <TipBox>La barra de progreso se actualiza en tiempo real al añadir, completar o mover tareas. Si un empleado está en rojo, puedes hacer clic en su celda para abrir el panel de tareas y redistribuir.</TipBox>
      </ContentBlock>

      <ContentBlock title="Dependencias entre tareas">
        <p>Puedes marcar que una tarea <strong className="text-white">depende de otra</strong> (por ejemplo, Diseño bloquea a Desarrollo). El sistema muestra:</p>
        <div className="grid sm:grid-cols-2 gap-3 mt-3">
          <FeatureCard icon={GitBranch} title="Quién te bloquea" description="Badge visible en la tarea con el nombre del compañero y si su tarea ya está completada." color="from-amber-500 to-orange-500" />
          <FeatureCard icon={Bell} title="A quién bloqueas" description="Si tu tarea bloquea a otros, lo verás con un icono de usuarios esperando." color="from-rose-500 to-red-500" />
        </div>
        <div className="mt-3" />
        <WarningBox>Si una dependencia no está completada, la tarea dependiente se resalta en ámbar para que no la olvides.</WarningBox>
      </ContentBlock>
    </>
  );
}

function MiEspacioContent() {
  return (
    <>
      <ContentBlock title="Qué es Mi espacio">
        <p>Mi espacio es tu <strong className="text-white">dashboard personal</strong>. Aquí ves tu carga de trabajo, tus proyectos, el control de planificación y las prioridades del día o de la semana.</p>
        <ExampleBox>Es lunes por la mañana. Abres Mi espacio y ves que tienes 3 tareas que bloquean a compañeros. Sabes exactamente por dónde empezar.</ExampleBox>
      </ContentBlock>

      <ContentBlock title="Pestañas principales">
        <div className="grid sm:grid-cols-2 gap-3">
          <FeatureCard icon={AlertTriangle} title="Prioridades" description="Tareas que te bloquean o que bloqueas a otros. Insights de dependencias para saber qué hacer primero." color="from-orange-500 to-amber-500" />
          <FeatureCard icon={FolderOpen} title="Mis proyectos" description="Vista de tu semana con tareas agrupadas por proyecto. Ve rápidamente qué tienes pendiente en cada uno." color="from-indigo-500 to-blue-500" />
          <FeatureCard icon={Target} title="Control de planificación" description="Alertas cuando lo planificado no coincide con el deadline. Te dice si te faltan o sobran horas." color="from-red-500 to-rose-500" />
          <FeatureCard icon={Users} title="Compañeros" description="Vista de colaboración y carga del equipo. Ve quién está sobrecargado y quién tiene disponibilidad." color="from-blue-500 to-cyan-500" />
          <FeatureCard icon={TrendingUp} title="Mis métricas" description="Balance mensual (horas estimadas vs reales) e índice de fiabilidad de estimaciones." color="from-emerald-500 to-teal-500" />
        </div>
      </ContentBlock>

      <ContentBlock title="Control de planificación en detalle">
        <p>Detecta <strong className="text-white">variaciones</strong> entre lo que tienes en el deadline y lo realmente planificado/computado. Cada alerta muestra:</p>
        <StepList steps={[
          { title: 'Proyecto con variación', description: 'El nombre del proyecto y la diferencia en horas (déficit o exceso).' },
          { title: 'Tus datos (TU)', description: 'Deadline asignado, horas planificadas, horas computadas y balance. Si te faltan horas por planificar, se muestra un aviso rojo.' },
          { title: 'Estado del equipo', description: 'Al expandir ves a los compañeros que también trabajan en ese proyecto con su propio balance.' },
        ]} />
        <div className="mt-3" />
        <WarningBox>Si ves déficit (rojo), significa que aún no has planificado todas las horas que el deadline te asigna en ese proyecto. Añade tareas desde el planificador para cubrir la diferencia.</WarningBox>
      </ContentBlock>

      <ContentBlock title="Acciones rápidas">
        <div className="grid sm:grid-cols-2 gap-3">
          <FeatureCard icon={Clock} title="Registrar gestión interna" description="Reuniones, formaciones u otras tareas no facturables. Se crean como tareas de gestión interna." color="from-slate-500 to-slate-700" />
          <FeatureCard icon={Plus} title="Añadir tareas" description="Acceso rápido al mismo flujo de añadir tarea del planificador, sin salir de tu dashboard." color="from-indigo-500 to-purple-500" />
        </div>
        <div className="mt-3" />
        <TipBox>Puedes abrir cualquier celda de semana para ver el panel completo de tareas con opciones de editar, completar y transferir.</TipBox>
      </ContentBlock>
    </>
  );
}

function DeadlinesContent() {
  return (
    <>
      <ContentBlock title="Qué son los Deadlines">
        <p>Los Deadlines definen los <strong className="text-white">objetivos de horas</strong> por mes, por proyecto y por empleado. Son la referencia para comparar lo que debía hacerse frente a lo planificado y lo computado.</p>
        <ExampleBox>Tu proyecto &quot;SEO Mensual&quot; tiene 35h contratadas. En Deadlines repartes: 16h para Ana, 12h para Pedro y 7h para ti. El sistema sabe cuánto le toca a cada uno.</ExampleBox>
      </ContentBlock>

      <ContentBlock title="Funcionalidades">
        <div className="grid sm:grid-cols-2 gap-3">
          <FeatureCard icon={Users} title="Asignar horas" description="Distribuye las horas del proyecto entre los miembros del equipo para cada mes." color="from-indigo-500 to-blue-500" />
          <FeatureCard icon={DollarSign} title="Ajuste de presupuesto" description="Override del budget por proyecto y mes si el cliente cambia las horas contratadas." color="from-amber-500 to-orange-500" />
          <FeatureCard icon={Filter} title="Filtros avanzados" description="Filtra por tipo de proyecto, empleado, orden. Oculta proyectos sin asignar." color="from-slate-500 to-indigo-500" />
          <FeatureCard icon={Pencil} title="Edición rápida" description="Toca un proyecto para editar horas por persona, notas y visibilidad. En móvil se abre un Sheet." color="from-purple-500 to-pink-500" />
        </div>
      </ContentBlock>

      <ContentBlock title="Relación con el Planificador">
        <p>Lo que configuras en Deadlines es lo que el Planificador y el Control de planificación de Mi espacio usan para mostrar si vas bien o si te faltan/sobran horas.</p>
        <WarningBox>Si no defines deadlines para un proyecto, no aparecerán alertas de coherencia para ese proyecto en Mi espacio. Los proyectos sin deadline se muestran como &quot;sin límite&quot;.</WarningBox>
        <div className="mt-3" />
        <TipBox>Configura los deadlines al inicio de cada mes para tener alertas precisas durante todo el periodo.</TipBox>
      </ContentBlock>
    </>
  );
}

function InformesContent() {
  return (
    <>
      <ContentBlock title="Qué son los Informes">
        <p>Los informes se organizan en la <strong className="text-white">Seguimiento</strong> (Seguimiento operativo, Rentabilidad, Capacidad de Equipo), en <strong className="text-white">Reportes clásicos</strong> (índice de fiabilidad, predicción de carga) y en <strong className="text-white">Informes por cliente</strong>. Permiten exportar en PDF y consultar datos históricos vía API.</p>
      </ContentBlock>

      <ContentBlock title="Secciones disponibles">
        <div className="grid sm:grid-cols-2 gap-3">
          <FeatureCard icon={Activity} title="Seguimiento operativo" description="Coherencia planificación vs deadlines por proyecto, filtros por proyecto y empleado, navegación por mes y proyectos en alerta que explican por qué estás en riesgo." color="from-indigo-500 to-blue-500" />
          <FeatureCard icon={BarChart3} title="Rentabilidad" description="Valor planificado, horas computadas y avance operativo por proyecto. Navegación por mes." color="from-emerald-500 to-teal-500" />
          <FeatureCard icon={BarChart3} title="Capacidad de Equipo" description="Mapa de calor semanal, ocupación media y tareas bloqueadas por dependencias." color="from-blue-500 to-cyan-500" />
          <FeatureCard icon={Activity} title="Reportes clásicos" description="Índice de fiabilidad de estimaciones, predicción de carga y métricas detalladas. Acceso desde Análisis en el menú." color="from-amber-500 to-orange-500" />
          <FeatureCard icon={Download} title="Exportación" description="Informes de cliente en PDF con un clic. Datos históricos e integración vía API REST para otros formatos." color="from-emerald-500 to-teal-500" />
          <FeatureCard icon={Filter} title="Filtros" description="En Coherencia: por proyecto y empleado (respetando la vista por departamento del Sidebar). En el resto de vistas: por período y contexto." color="from-purple-500 to-pink-500" />
        </div>
      </ContentBlock>

      <ContentBlock title="Informes por cliente">
        <p>Existe un apartado específico de <strong className="text-white">informes por cliente</strong> para generar reportes orientados a facturación o entrega a cliente, con las horas y el desglose que necesites.</p>
        <ExampleBox>Al final de mes generas un informe para &quot;Cliente X&quot; con el desglose de horas por proyecto: SEO 35h, Paid Media 20h, Contenido 15h. Lo exportas en PDF y se lo envías directamente.</ExampleBox>
        <div className="mt-3" />
        <TipBox>Los informes por cliente respetan el aliasing de proyectos: si tienes reglas de renombrado (ej. Kit Digital → KD:), se aplican automáticamente en los reportes.</TipBox>
      </ContentBlock>
    </>
  );
}

function WeeklyContent() {
  return (
    <>
      <ContentBlock title="Qué es Weekly Forecast">
        <p>Weekly Forecast es el módulo de <strong className="text-white">cierre semanal</strong>. Al final de cada semana laboral, el sistema genera un resumen de lo planificado vs lo completado y puede redistribuir horas no completadas.</p>
        <ExampleBox>Carlos no completó 15h esta semana. El sistema detecta que Laura tiene 10h libres y Pedro 5h, y sugiere redistribuir el trabajo automáticamente.</ExampleBox>
      </ContentBlock>

      <ContentBlock title="Dónde acceder">
        <p>Weekly Forecast está en el menú lateral bajo <strong className="text-white">Seguimiento</strong> (junto a Seguimiento operativo, Rentabilidad y Capacidad de Equipo). Solo visible si tienes permiso de capacidad de equipo.</p>
      </ContentBlock>

      <ContentBlock title="Cómo funciona">
        <StepList steps={[
          { title: 'Revisar la semana', description: 'Ves un resumen por empleado y por proyecto con horas estimadas, reales y computadas.' },
          { title: 'Ajustar horas', description: 'Si hace falta, corriges horas reales antes del cierre. Puedes ajustar por tarea individual.' },
          { title: 'Redistribuir pendientes', description: 'Las horas no completadas se pueden redistribuir a compañeros con disponibilidad, de forma sugerida o automática.' },
          { title: 'Cerrar semana', description: 'Al confirmar, las tareas completadas se marcan y los ajustes se reflejan en el planificador para la semana siguiente.' },
        ]} />
      </ContentBlock>

      <ContentBlock title="Integración con el Planificador">
        <p>Todo lo que ocurre en Weekly se refleja en el calendario: tareas completadas, horas ajustadas y redistribuciones aparecen con un <strong className="text-white">badge &quot;Weekly&quot;</strong> en el planificador.</p>
        <WarningBox>Si el módulo Weekly no está activado en tu agencia, esta opción no aparecerá en el menú. Un administrador puede activarlo desde Configuración.</WarningBox>
      </ContentBlock>
    </>
  );
}

function EquipoContent() {
  return (
    <>
      <ContentBlock title="Qué es la sección Equipo">
        <p>En Equipo se gestionan los <strong className="text-white">miembros de la agencia</strong>: alta, edición, horarios, ausencias y capacidad. También puedes ver Team Capacity (capacidad del equipo) y Team Pulse si tu agencia tiene esas opciones.</p>
      </ContentBlock>

      <ContentBlock title="Funcionalidades">
        <div className="grid sm:grid-cols-2 gap-3">
          <FeatureCard icon={Users} title="Listado de empleados" description="Nombre, rol, avatar y datos de contacto. Busca y filtra rápidamente." color="from-blue-500 to-cyan-500" />
          <FeatureCard icon={Clock} title="Horarios personalizados" description="Configura horas laborables por día (lunes a domingo) para calcular capacidad real." color="from-indigo-500 to-blue-500" />
          <FeatureCard icon={CalendarOff} title="Ausencias y vacaciones" description="Fechas de inicio y fin. El planificador descuenta capacidad automáticamente." color="from-amber-500 to-orange-500" />
          <FeatureCard icon={Gauge} title="Capacidad" description="Capacidad mensual y semanal derivada del horario y las ausencias registradas." color="from-emerald-500 to-teal-500" />
        </div>
      </ContentBlock>

      <ContentBlock title="Alta de empleados">
        <StepList steps={[
          { title: 'Crear empleado', description: 'Rellena nombre, email, rol y horario laboral.' },
          { title: 'Crear usuario de acceso', description: 'Se genera automáticamente el usuario para que pueda entrar a la plataforma.' },
          { title: 'Asignar permisos', description: 'Los permisos se heredan del rol asignado (administrador, manager, empleado, etc.).' },
        ]} />
        <div className="mt-3" />
        <TipBox>Si un empleado tiene vacaciones la próxima semana, el sistema ya lo considera y no permite asignarle tareas en ese periodo.</TipBox>
      </ContentBlock>
    </>
  );
}

function TiemposContent() {
  return (
    <>
      <ContentBlock title="Qué es Tiempos">
        <p>El módulo de <strong className="text-white">Tiempos</strong> permite registrar las horas reales trabajadas por tarea mediante un <strong className="text-white">cronómetro</strong>. Puedes ver en qué está cada persona del equipo ahora mismo en la página Tiempos (menú Equipo) y parar tu propio crono desde el sidebar o desde esa página. El total del día se muestra en todo momento.</p>
        <ExampleBox>María lleva 1h 23m en "Diseño landing" (Acme). Desde la página Tiempos ves a todo el equipo; si eres tú quien tiene el crono activo, puedes pararlo con un clic sin ir al planificador.</ExampleBox>
      </ContentBlock>

      <ContentBlock title="Dónde está">
        <div className="grid sm:grid-cols-2 gap-3">
          <FeatureCard icon={Calendar} title="Planificador" description="Cronómetro por tarea en vista semanal y mensual. Solo ves y controlas tu propio tiempo." color="from-indigo-500 to-purple-500" />
          <FeatureCard icon={LayoutGrid} title="Mi Día" description="En el dashboard personal, cada tarea del día puede llevar su cronómetro para registrar horas reales." color="from-purple-500 to-pink-500" />
          <FeatureCard icon={Clock} title="Sidebar" description="Cuando tienes un crono activo, el bloque muestra la tarea, cliente, tiempo en curso y botón Parar. También el total del día." color="from-teal-500 to-emerald-500" />
          <FeatureCard icon={Users} title="Página Tiempos" description="En Equipo → Tiempos verás en qué está cada persona: tarea, cliente y tiempo transcurrido. Parar tu crono desde ahí." color="from-blue-500 to-cyan-500" />
        </div>
        <div className="mt-3" />
        <TipBox>La página Tiempos y el cronómetro solo aparecen si tu agencia tiene activado el módulo &quot;Cronómetro de tareas&quot; en Configuración.</TipBox>
      </ContentBlock>

      <ContentBlock title="Cómo usar">
        <StepList steps={[
          { title: 'Iniciar', description: 'En el planificador o Mi Día, pulsa Play en la tarea que quieras cronometrar. Solo puede haber un crono activo por persona.' },
          { title: 'Parar', description: 'Pulsa Stop en la misma tarea, en el sidebar o en la página Tiempos. Las horas se guardan con precisión de segundos en time_entries.' },
          { title: 'Cambiar de tarea', description: 'Si inicias el crono en otra tarea, el anterior se cierra automáticamente y se registran sus horas antes de empezar el nuevo.' },
          { title: 'Total del día', description: 'El sidebar y cada cronómetro muestran el total de horas registradas hoy para esa tarea (base + sesión actual si está en marcha).' },
        ]} />
      </ContentBlock>
    </>
  );
}

function ClientesContent() {
  return (
    <>
      <ContentBlock title="Qué son Clientes y Proyectos">
        <p>Es el <strong className="text-white">catálogo</strong> de clientes de la agencia y de los proyectos asociados. Cada proyecto tiene horas contratadas (presupuesto), mínimo de horas si aplica y estado.</p>
        <ExampleBox>Un cliente puede tener varios proyectos: por ejemplo SEO Mensual (35h), Paid Media (20h) y Contenido (15h). Cada uno con su presupuesto y estado independiente.</ExampleBox>
      </ContentBlock>

      <ContentBlock title="Funcionalidades">
        <div className="grid sm:grid-cols-2 gap-3">
          <FeatureCard icon={Building2} title="Clientes" description="Nombre, datos de facturación, color identificativo y proyectos vinculados." color="from-slate-500 to-indigo-500" />
          <FeatureCard icon={FolderOpen} title="Proyectos" description="Nombre, cliente, horas contratadas (budget), mínimo, fee mensual y estado (activo/pausado/completado)." color="from-indigo-500 to-purple-500" />
          <FeatureCard icon={Tag} title="Alias de proyectos" description="Reglas para mostrar nombres abreviados (ej. Kit Digital → KD:) en planificador e informes." color="from-purple-500 to-pink-500" />
          <FeatureCard icon={ToggleLeft} title="Estado del proyecto" description="Si archivas un proyecto deja de aparecer en asignación nueva pero conserva el histórico." color="from-amber-500 to-orange-500" />
        </div>
      </ContentBlock>

      <ContentBlock title="Relación con el Planificador">
        <p>Cada tarea del planificador está ligada a un proyecto. Las horas contratadas se usan para mostrar avisos de sobrepaso de presupuesto.</p>
        <WarningBox>Sin proyectos activos no podrás asignar tareas nuevas. Asegúrate de tener al menos un proyecto en estado &quot;activo&quot; para poder planificar.</WarningBox>
      </ContentBlock>
    </>
  );
}

function ConfiguracionContent() {
  return (
    <>
      <ContentBlock title="Qué incluye Configuración">
        <p>Configuración agrupa los <strong className="text-white">ajustes de la agencia</strong>: roles, permisos, módulos activos e integraciones. En entornos multi-agencia también existe la gestión de agencias.</p>
      </ContentBlock>

      <ContentBlock title="Roles y permisos">
        <div className="grid sm:grid-cols-2 gap-3">
          <FeatureCard icon={Shield} title="Roles" description="Cada rol tiene un conjunto de permisos: acceso al planificador, editar tareas, ver informes, gestionar equipo, etc." color="from-indigo-500 to-blue-500" />
          <FeatureCard icon={Settings} title="Permisos granulares" description="Más de 18 flags para controlar qué puede hacer cada rol con precisión." color="from-purple-500 to-pink-500" />
        </div>
        <div className="mt-3" />
        <ExampleBox>Cambias el permiso &quot;can_edit_tasks&quot; en el rol &quot;Empleado&quot;. Automáticamente, todos los empleados con ese rol pierden (o ganan) esa capacidad.</ExampleBox>
      </ContentBlock>

      <ContentBlock title="Módulos">
        <p>Se pueden <strong className="text-white">activar o desactivar</strong> módulos individualmente:</p>
        <InfoGrid items={[
          { icon: Target, label: 'Deadlines', value: 'On/Off', color: 'bg-amber-500/15 border-amber-400/25 text-amber-300' },
          { icon: FileText, label: 'Weekly', value: 'On/Off', color: 'bg-violet-500/15 border-violet-400/25 text-violet-300' },
          { icon: BarChart3, label: 'PPC / Ads', value: 'On/Off', color: 'bg-blue-500/15 border-blue-400/25 text-blue-300' },
        ]} />
        <div className="mt-3" />
        <TipBox>Si un módulo está desactivado, el menú y las rutas asociadas desaparecen para todos los usuarios de la agencia.</TipBox>
      </ContentBlock>

      <ContentBlock title="Configuración de agencia">
        <p>En Agency Settings se configura el nombre de la agencia, zona horaria y otras opciones globales. En <strong className="text-white">multi-tenant</strong>, cada agencia tiene sus propios datos (empleados, proyectos, allocations) completamente aislados.</p>
      </ContentBlock>

      <ContentBlock title="API e integraciones">
        <p>Desde el menú lateral, en <strong className="text-white">Configuración → API & Integraciones</strong>, los administradores pueden crear y revocar <strong className="text-white">tokens de acceso</strong> para conectar sistemas externos (CRM, ERP, dashboards) con los datos de la agencia. Cada token es un JWT vinculado a la agencia y protegido por políticas RLS.</p>
        <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10">
          <p className="text-sm text-indigo-200/90 mb-3">
            La <Link to="/api-docs" className="text-indigo-300 hover:text-white font-medium underline underline-offset-2">documentación pública de la API</Link> incluye:
          </p>
          <ul className="text-sm text-indigo-200/80 space-y-1.5 list-disc list-inside">
            <li>Overview (autenticación, base URL, respuestas, changelog)</li>
            <li>Cinco tutoriales paso a paso (primeros pasos, sincronizar equipo, planificación, reportes, ausencias)</li>
            <li>SDK JavaScript, API REST, filtrado y suscripciones Realtime</li>
            <li>Referencia completa de 17 recursos (tablas) con ejemplos de respuesta</li>
            <li>Búsqueda rápida (Ctrl+K) y menú lateral fijo para navegar en la doc</li>
          </ul>
          <Link to="/api-docs">
            <Button className="mt-4 bg-indigo-600 hover:bg-indigo-500 text-white border-0">
              Ver documentación API
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </ContentBlock>
    </>
  );
}

/* ─── CONTENT MAP ─── */
const CONTENT_MAP: Record<string, React.FC> = {
  'planificador': PlanificadorContent,
  'mi-espacio': MiEspacioContent,
  'deadlines': DeadlinesContent,
  'informes': InformesContent,
  'weekly-forecast': WeeklyContent,
  'equipo': EquipoContent,
  'tiempos': TiemposContent,
  'clientes-proyectos': ClientesContent,
  'configuracion': ConfiguracionContent,
};

/* ─── MAIN PAGE ─── */
export default function GuiaPage() {
  const { section } = useParams<{ section: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (section) window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [section]);

  if (!section) {
    return (
      <GuiaLayout title="Guía completa de Taimbox" description="Todas las funcionalidades explicadas al detalle. Elige un apartado para leer la documentación.">
        <Helmet><title>Guía de funcionalidades - Taimbox</title></Helmet>
        <div className="space-y-6">
          {SECTIONS.map((s) => (
            <SectionCard key={s.slug} {...s} />
          ))}
        </div>
        <div className="mt-12 text-center">
          <Link to="/">
            <Button variant="outline" className="border-white/40 !bg-white/10 text-white hover:text-white hover:!bg-white/20 hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-200">
              <Home className="h-4 w-4 mr-2" /> Volver al inicio
            </Button>
          </Link>
        </div>
      </GuiaLayout>
    );
  }

  const current = SECTIONS.find((s) => s.slug === section);
  if (!current) {
    navigate('/guia', { replace: true });
    return null;
  }

  const Icon = current.icon;
  const SectionContent = CONTENT_MAP[section];

  return (
    <>
      <Helmet><title>{current.title} - Guía Taimbox</title></Helmet>
      <GuiaLayout>
        <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10 hover:scale-105 mb-6 -ml-2 transition-all duration-200" onClick={() => navigate('/guia')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Volver al índice
        </Button>

        <Card className="border-2 border-white/20 bg-gradient-to-br from-indigo-900/90 to-purple-900/90 backdrop-blur-xl overflow-hidden mb-4">
          <CardContent className="p-6 sm:p-8">
            {/* Hero header */}
            <div className="flex items-center gap-4 mb-8 pb-6 border-b border-white/10">
              <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center bg-gradient-to-br shadow-xl", current.color)}>
                <Icon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white">{current.title}</h1>
                <p className="text-indigo-200/80 mt-1">{current.short}</p>
              </div>
            </div>

            {SectionContent && <SectionContent />}
          </CardContent>
        </Card>

        {/* Prev / Next navigation */}
        <SectionNav currentSlug={section} />

        <div className="flex flex-wrap gap-3 justify-center mt-6">
          <Button variant="outline" className="border-white/40 !bg-white/10 text-white hover:text-white hover:!bg-white/20 hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-200" onClick={() => navigate('/guia')}>
            <BookOpen className="h-4 w-4 mr-2" /> Índice de la guía
          </Button>
          <Link to="/">
            <Button variant="outline" className="border-white/40 !bg-white/10 text-white hover:text-white hover:!bg-white/20 hover:scale-105 hover:shadow-lg transition-all duration-200">
              <Home className="h-4 w-4 mr-2" /> Inicio
            </Button>
          </Link>
        </div>
      </GuiaLayout>
    </>
  );
}
