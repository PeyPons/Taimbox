import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  Calendar,
  Users,
  BarChart3,
  Target,
  Zap,
  CheckCircle2,
  TrendingUp,
  Clock,
  Award,
  Sparkles,
  Link2,
  AlertTriangle,
  FileText,
  Gauge,
  Activity,
  Bell,
  Shield,
  GitBranch,
  Lock,
  Database,
  Download,
  HelpCircle,
  Plug,
  Code,
  FileDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { DemoPlanner } from '@/components/demo/DemoDashboard';
import { DemoEmployeeDashboard } from '@/components/demo/DemoEmployeeDashboard';
import { DemoDeadlinesPage } from '@/components/demo/DemoDeadlinesPage';
import { DemoWeeklyForecastPage } from '@/components/demo/DemoWeeklyForecastPage';
import { DemoProvider } from '@/contexts/DemoContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Helmet } from 'react-helmet-async';
import { cn } from '@/lib/utils';
import { CalendarPreview } from '@/components/landing/CalendarPreview';
import { useIsMobile } from '@/hooks/use-mobile';
import { Monitor, AlertCircle } from 'lucide-react';

export default function LandingPage() {
  const isMobile = useIsMobile();
  const [demoTab, setDemoTab] = useState('planner');
  const [activeFeature, setActiveFeature] = useState(0);

  return (
    <>
      <Helmet>
        <title>Timeboxing - Gestión de Recursos y Planificación</title>
        <meta name="description" content="Plataforma de gestión de recursos y planificación para agencias digitales. Visualiza, planifica y optimiza el trabajo de tu equipo." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-indigo-900 relative overflow-hidden">
        {/* Efectos de fondo animados mejorados */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/100/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-indigo-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '2s' }} />
          {/* Partículas flotantes */}
          <div className="absolute top-20 left-10 w-2 h-2 bg-indigo-400/40 rounded-full animate-pulse" style={{ animationDuration: '3s', animationDelay: '0s' }} />
          <div className="absolute top-40 right-20 w-1.5 h-1.5 bg-purple-400/40 rounded-full animate-pulse" style={{ animationDuration: '4s', animationDelay: '1s' }} />
          <div className="absolute bottom-40 left-1/3 w-2 h-2 bg-pink-400/30 rounded-full animate-pulse" style={{ animationDuration: '5s', animationDelay: '2s' }} />
        </div>

        {/* Grid pattern sutil */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }} />

        {/* Hero Section */}
        <div className="relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 md:pt-20 pb-10 sm:pb-12 md:pb-16">
            <div className="text-center relative">
              {/* Badge animado mejorado */}
              <div className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-indigo-500/40 via-purple-500/40 to-pink-500/40 backdrop-blur-md rounded-full text-white text-sm sm:text-base font-bold mb-8 sm:mb-12 border border-white/20 shadow-2xl shadow-indigo-500/30 animate-fade-in relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 animate-spin-slow relative z-10" />
                <span className="whitespace-nowrap relative z-10">Tu equipo, tu tiempo, tu control</span>
              </div>

              {/* Título principal con efecto mejorado */}
              <div className="relative mb-6 sm:mb-8">
                <div className="absolute -inset-8 bg-gradient-to-r from-indigo-600/30 via-purple-600/30 to-pink-600/30 blur-3xl opacity-60 -z-10 animate-pulse" />
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black mb-2 sm:mb-4 leading-[1.1] tracking-tight relative">
                  <span className="block text-white drop-shadow-2xl">El tiempo de tu</span>
                  <span className="block relative">
                    <span className="absolute inset-0 bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 blur-xl opacity-50 animate-pulse" />
                    <span className="relative bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto] drop-shadow-lg">
                      equipo visualizado
                    </span>
                  </span>
                </h1>
              </div>

              {/* Descripción más impactante */}
              <div className="mb-6 sm:mb-8 max-w-4xl mx-auto px-4">
                <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-indigo-100/90 leading-relaxed font-light mb-2">
                  No más hojas de cálculo. No más adivinanzas.
                </p>
                <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-white font-semibold leading-tight">
                  Ve quién hace qué, <span className="bg-gradient-to-r from-indigo-200 to-purple-200 bg-clip-text text-transparent">cuándo</span> y <span className="bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-transparent">por qué</span>.
                </p>
              </div>

              {/* CTA mejorado */}
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center px-4 mb-8 sm:mb-10">
                <Link to="/login" className="group relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-300" />
                  <Button size="lg" className="relative w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 sm:px-10 py-6 sm:py-7 text-lg sm:text-xl font-semibold shadow-2xl hover:shadow-indigo-500/50 transition-all transform hover:scale-105">
                    Acceder ahora
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Button
                  size="lg"
                  className="w-full sm:w-auto px-8 sm:px-10 py-6 sm:py-7 text-lg sm:text-xl font-semibold border-2 border-white/30 text-white hover:text-white hover:bg-white/10 hover:border-white/50 bg-white/5 backdrop-blur-md shadow-xl"
                  onClick={() => {
                    const demoSection = document.getElementById('demo');
                    demoSection?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Explorar demo
                </Button>
                <Link to="/guia">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto px-8 sm:px-10 py-6 sm:py-7 text-lg sm:text-xl font-semibold border-2 border-white/30 text-white hover:text-white hover:bg-white/10 hover:border-white/50 bg-white/5 backdrop-blur-md shadow-xl"
                  >
                    Guía completa de funcionalidades
                  </Button>
                </Link>
                <Link to="/api-docs">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto px-8 sm:px-10 py-6 sm:py-7 text-lg sm:text-xl font-semibold border-2 border-white/30 text-white hover:text-white hover:bg-white/10 hover:border-white/50 bg-white/5 backdrop-blur-md shadow-xl"
                  >
                    Documentación API
                  </Button>
                </Link>
              </div>

              {/* Preview visual - Calendario completo */}
              <div className="relative mt-6 sm:mt-8 md:mt-10 max-w-5xl mx-auto px-2 sm:px-0">
                <div className="absolute inset-0 bg-gradient-to-t from-indigo-950/50 to-transparent -z-10" />
                <div className="relative transform hover:scale-[1.01] transition-all duration-500">
                  <CalendarPreview />
                  <div className="mt-3 sm:mt-4 text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-white/10 backdrop-blur-md border-white/30 text-white hover:text-white hover:bg-white/20 hover:border-white/50 text-xs sm:text-sm"
                      onClick={() => {
                        const demoSection = document.getElementById('demo');
                        demoSection?.scrollIntoView({ behavior: 'smooth' });
                      }}
                    >
                      Ver demo completa
                      <ArrowRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Feature Carousel - Futuristic Design */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-3 px-4">
              <span className="bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200 bg-clip-text text-transparent">
                Funcionalidades que transforman
              </span>
            </h2>
            <p className="text-lg sm:text-xl text-white/70 max-w-2xl mx-auto">
              Explora cada herramienta. Haz clic para ver detalles y ejemplos.
            </p>
            <Link to="/guia" className="inline-block mt-3 text-sm font-medium text-indigo-200 hover:text-white underline underline-offset-2 transition-colors">
              Ver guía completa de todas las funcionalidades →
            </Link>
          </div>

          {/* Feature Bubbles Row */}
          {(() => {
            const features = [
              { icon: Calendar, label: 'Calendario', color: 'from-indigo-500 to-purple-500', title: 'Calendario Visual', subtitle: 'La vista principal de tu equipo', description: 'Ve quién hace qué, cuándo y por qué. Identifica sobrecargas al instante con un vistazo al calendario completo de tu equipo.', featureList: ['Vista semanal y mensual', 'Código de colores por proyecto', 'Drag & drop para reasignar', 'Filtros por empleado o proyecto'], example: 'María está al 120% esta semana. Con un vistazo al calendario, ves que tiene 3 proyectos superpuestos y puedes redistribuir antes de que sea tarde.', stat: '+40%', statLabel: 'visibilidad del equipo' },
              { icon: Link2, label: 'Dependencias', color: 'from-purple-500 to-pink-500', title: 'Dependencias', subtitle: 'Gestión inteligente de bloqueos', description: 'Visualiza qué tareas bloquean a otras y recibe alertas cuando una dependencia está en riesgo.', featureList: ['Mapa visual de dependencias', 'Alertas de cuellos de botella', 'Priorización automática', 'Notificaciones en cascada'], example: 'El diseño bloquea al desarrollo. Si el diseño se retrasa, automáticamente recibes alerta de que 3 tareas de desarrollo se verán afectadas.', stat: '100%', statLabel: 'visibilidad de bloqueos' },
              { icon: Target, label: 'Deadlines', color: 'from-amber-500 to-orange-500', title: 'Deadlines', subtitle: 'Objetivos mensuales por proyecto', description: 'Define metas de horas por proyecto y empleado. Compara lo planificado vs ejecutado en tiempo real.', featureList: ['Objetivos por proyecto', 'Seguimiento en tiempo real', 'Sugerencias de redistribución', 'Alertas de desviación'], example: 'Tienes 200h asignadas al proyecto X pero solo 150h disponibles. El sistema te sugiere redistribuir 50h a otro mes o empleado.', stat: '85%', statLabel: 'cumplimiento de deadlines' },
              { icon: Users, label: 'Equipo', color: 'from-blue-500 to-cyan-500', title: 'Gestión de Equipo', subtitle: 'Todo sobre tu equipo en un lugar', description: 'Horarios, ausencias, vacaciones y capacidad. Cada empleado tiene su perfil completo.', featureList: ['Horarios personalizados', 'Gestión de ausencias', 'Capacidad mensual', 'Objetivos profesionales'], example: 'Juan tiene vacaciones la próxima semana. El sistema ya lo considera y no permite asignarle tareas en ese período.', stat: '0', statLabel: 'conflictos de agenda' },
              { icon: FileText, label: 'Weekly', color: 'from-violet-500 to-purple-500', title: 'Weekly Reports', subtitle: 'Cierre semanal automático', description: 'Cada semana, el sistema genera un resumen con métricas, redistribuye horas no completadas a compañeros con disponibilidad y prepara la siguiente semana.', featureList: ['Resumen semanal automático', 'Redistribución inteligente', 'Métricas de productividad', 'Comparativa semanal'], example: 'Carlos no completó 15h esta semana. El sistema detecta que Laura tiene 10h libres y Pedro 5h, y les redistribuye el trabajo automáticamente.', stat: 'Auto', statLabel: 'redistribución de carga' },
              { icon: Bell, label: 'Alertas', color: 'from-yellow-500 to-amber-500', title: 'Alertas Inteligentes', subtitle: 'Nunca más sorpresas', description: 'Recibe notificaciones cuando detectamos sobrecargas, dependencias en riesgo o desviaciones de presupuesto.', featureList: ['Alertas de sobrecarga', 'Notificaciones de dependencias', 'Avisos de presupuesto', 'Recordatorios de deadlines'], example: '3 días antes del deadline, recibes alerta de que el proyecto lleva solo 60% completado. Tiempo de actuar.', stat: '60%', statLabel: 'problemas detectados antes' },
              { icon: BarChart3, label: 'Métricas', color: 'from-rose-500 to-pink-500', title: 'Métricas y Analytics', subtitle: 'Decisiones basadas en datos', description: 'Índice de fiabilidad de estimaciones, productividad por empleado y proyecto, y tendencias históricas.', featureList: ['Índice de fiabilidad', 'Productividad por equipo', 'Tendencias históricas', 'Exportación de reportes'], example: 'Tu índice de fiabilidad es del 78%. Históricamente, subestimas proyectos de diseño en un 20%. Ahora lo sabes y puedes ajustar.', stat: '+78%', statLabel: 'precisión en estimaciones' },
            ];
            const current = features[activeFeature];
            const FeatureIcon = current.icon;

            return (
              <>
                {/* Mobile: Horizontal scroll carousel */}
                <div className="md:hidden mb-4">
                  <div className="flex gap-2 overflow-x-auto pb-3 px-1 snap-x snap-mandatory scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {features.map((feature, index) => {
                      const Icon = feature.icon;
                      return (
                        <button
                          key={index}
                          onClick={() => setActiveFeature(index)}
                          className={cn(
                            "flex-shrink-0 snap-center flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-300",
                            activeFeature === index
                              ? `bg-gradient-to-br ${feature.color} shadow-lg`
                              : "bg-white/10 border border-white/20"
                          )}
                        >
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center",
                            activeFeature === index ? "bg-white/20" : `bg-gradient-to-br ${feature.color}`
                          )}>
                            <Icon className="h-4 w-4 text-white" />
                          </div>
                          <span className={cn(
                            "text-xs font-semibold whitespace-nowrap",
                            activeFeature === index ? "text-white" : "text-white/80"
                          )}>
                            {feature.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {/* Mobile navigation dots */}
                  <div className="flex justify-center gap-1.5 mt-2">
                    {features.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setActiveFeature(index)}
                        className={cn(
                          "w-2 h-2 rounded-full transition-all",
                          activeFeature === index ? "bg-white w-4" : "bg-white/30"
                        )}
                      />
                    ))}
                  </div>
                </div>

                {/* Desktop: Grid layout */}
                <div className="hidden md:flex flex-wrap justify-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                  {features.map((feature, index) => {
                    const Icon = feature.icon;
                    return (
                      <button
                        key={index}
                        onClick={() => setActiveFeature(index)}
                        className={cn(
                          "group relative flex flex-col items-center gap-2 p-3 sm:p-4 rounded-2xl transition-all duration-300 cursor-pointer",
                          activeFeature === index
                            ? `bg-gradient-to-br ${feature.color} shadow-xl scale-105`
                            : "bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20"
                        )}
                      >
                        <div className={cn(
                          "w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
                          activeFeature === index ? "bg-white/20" : `bg-gradient-to-br ${feature.color} shadow-lg`
                        )}>
                          <Icon className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                        </div>
                        <span className={cn(
                          "text-xs sm:text-sm font-semibold transition-colors",
                          activeFeature === index ? "text-white" : "text-white/80"
                        )}>
                          {feature.label}
                        </span>
                        {activeFeature === index && (
                          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-gradient-to-br from-indigo-900/90 to-purple-900/90" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Feature Detail Panel - Optimized for mobile */}
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl md:rounded-3xl blur opacity-30" />
                  <Card className="relative border-2 border-white/20 bg-gradient-to-br from-indigo-900/90 to-purple-900/90 backdrop-blur-xl">
                    <CardContent className="p-4 sm:p-6 md:p-8 lg:p-10">
                      {/* Mobile: Stacked layout */}
                      <div className="md:hidden space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br", current.color)}>
                              <FeatureIcon className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-white">{current.title}</h3>
                              <p className="text-xs text-indigo-200/70">{current.subtitle}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-black bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">
                              {current.stat}
                            </div>
                            <p className="text-[10px] text-white/60">{current.statLabel}</p>
                          </div>
                        </div>

                        <p className="text-sm text-white/90 leading-relaxed">{current.description}</p>

                        <div className="grid grid-cols-2 gap-2">
                          {current.featureList.map((feat, i) => (
                            <div key={i} className="flex items-center gap-1.5 p-2 bg-white/5 rounded-lg border border-white/10">
                              <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
                              <span className="text-[11px] text-white/90 leading-tight">{feat}</span>
                            </div>
                          ))}
                        </div>

                        <div className="p-3 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-lg border border-indigo-400/20">
                          <p className="text-xs text-indigo-200/90 italic">💡 {current.example}</p>
                        </div>

                        <div className="flex justify-between items-center pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-white/5 border-white/20 text-white hover:text-white hover:bg-white/10"
                            onClick={() => setActiveFeature(prev => prev === 0 ? 6 : prev - 1)}
                          >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Anterior
                          </Button>
                          <span className="text-xs text-white/50">{activeFeature + 1} / {features.length}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-white/5 border-white/20 text-white hover:text-white hover:bg-white/10"
                            onClick={() => setActiveFeature(prev => prev === 6 ? 0 : prev + 1)}
                          >
                            Siguiente
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      </div>

                      {/* Desktop: Original grid layout */}
                      <div className="hidden md:grid lg:grid-cols-5 gap-6 sm:gap-8">
                        <div className="lg:col-span-3">
                          <div className="flex items-center gap-3 mb-4">
                            <Badge className="bg-primary/100/30 text-indigo-200 border-indigo-400/30 px-3 py-1">
                              {current.label}
                            </Badge>
                          </div>
                          <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">{current.title}</h3>
                          <p className="text-indigo-200/70 text-sm mb-4">{current.subtitle}</p>
                          <p className="text-white/90 text-base sm:text-lg leading-relaxed mb-6">{current.description}</p>

                          <div className="grid grid-cols-2 gap-3 mb-6">
                            {current.featureList.map((feat, i) => (
                              <div key={i} className="flex items-center gap-2 p-2 bg-white/5 rounded-lg border border-white/10">
                                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                                <span className="text-sm text-white/90">{feat}</span>
                              </div>
                            ))}
                          </div>

                          <div className="p-4 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-xl border border-indigo-400/20">
                            <p className="text-sm text-indigo-200/90 italic">💡 {current.example}</p>
                          </div>
                        </div>

                        <div className="lg:col-span-2 flex flex-col justify-between">
                          <div className="text-center p-6 bg-gradient-to-br from-white/5 to-white/10 rounded-2xl border border-white/10 mb-4">
                            <div className="text-5xl sm:text-6xl font-black bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent mb-2">
                              {current.stat}
                            </div>
                            <p className="text-sm text-white/70">{current.statLabel}</p>
                          </div>

                          <div className="flex justify-center gap-4">
                            <Button
                              variant="outline"
                              size="lg"
                              className="bg-white/5 border-white/20 text-white hover:text-white hover:bg-white/10"
                              onClick={() => setActiveFeature(prev => prev === 0 ? 6 : prev - 1)}
                            >
                              <ChevronLeft className="h-5 w-5" />
                            </Button>
                            <Button
                              variant="outline"
                              size="lg"
                              className="bg-white/5 border-white/20 text-white hover:text-white hover:bg-white/10"
                              onClick={() => setActiveFeature(prev => prev === 6 ? 0 : prev + 1)}
                            >
                              <ChevronRight className="h-5 w-5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            );
          })()}
        </div>


        {/* Sección de Integraciones - Rediseño creativo */}
        <div className="relative z-10 py-12 sm:py-16 md:py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-950/30 to-transparent" />

          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="text-center mb-10 sm:mb-14">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500/30 to-purple-500/30 backdrop-blur-sm rounded-full text-white text-sm font-semibold mb-4 border border-white/20">
                <Plug className="h-4 w-4" />
                <span>Conecta todo</span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4 px-4">
                Tu flujo de trabajo,
                <span className="block bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  amplificado
                </span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 relative">
              <div className="hidden md:block absolute top-1/2 left-[20%] right-[20%] h-px bg-gradient-to-r from-indigo-500/50 via-purple-500/50 to-blue-500/50" />

              <div className="relative group">
                <div className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 backdrop-blur-xl rounded-3xl p-8 text-center border border-indigo-500/30 hover:border-indigo-400/50 transition-all hover:scale-105 hover:shadow-2xl hover:shadow-indigo-500/20">
                  <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-xl shadow-indigo-500/40 group-hover:scale-110 transition-transform">
                    <Download className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">Exporta</h3>
                  <p className="text-indigo-200/80 text-base leading-relaxed">
                    Reportes en Excel, CSV y JSON. Datos históricos completos.
                  </p>
                </div>
              </div>

              <div className="relative group md:-mt-4">
                <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-xl rounded-3xl p-8 text-center border border-purple-500/30 hover:border-purple-400/50 transition-all hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-xl shadow-purple-500/40 group-hover:scale-110 transition-transform">
                    <Code className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">Conecta</h3>
                  <p className="text-purple-200/80 text-base leading-relaxed">
                    API REST completa para integraciones personalizadas.
                  </p>
                </div>
              </div>

              <div className="relative group">
                <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 backdrop-blur-xl rounded-3xl p-8 text-center border border-blue-500/30 hover:border-blue-400/50 transition-all hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-xl shadow-blue-500/40 group-hover:scale-110 transition-transform">
                    <Calendar className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">Sincroniza</h3>
                  <p className="text-blue-200/80 text-base leading-relaxed">
                    Conecta con calendarios externos en tiempo real.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sección de Problemas y Soluciones - Diseño visual transformación */}
        <div className="relative z-10 py-12 sm:py-16 md:py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10 sm:mb-14">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4 px-4">
                <span className="bg-gradient-to-r from-red-300 via-white to-emerald-300 bg-clip-text text-transparent">
                  ¿Cansado de gestionar el tiempo a ciegas?
                </span>
              </h2>
              <p className="text-lg text-white/70 max-w-xl mx-auto">
                Transforma el caos en claridad
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 md:gap-8 mb-10 relative">
              <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                <div className="bg-gradient-to-r from-red-500 to-emerald-500 rounded-full p-3 shadow-xl">
                  <ArrowRight className="h-6 w-6 text-white" />
                </div>
              </div>

              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-950/60 via-red-900/40 to-gray-900/60 border border-red-500/30 p-6 sm:p-8">
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-3xl" />
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-red-500/30 rounded-xl flex items-center justify-center">
                    <AlertTriangle className="h-6 w-6 text-red-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Sin Timeboxing</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                    <Clock className="h-5 w-5 text-red-400 shrink-0" />
                    <span className="text-white/90 font-medium">Sobrecargas detectadas tarde</span>
                  </div>
                  <div className="flex items-center gap-4 p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                    <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />
                    <span className="text-white/90 font-medium">Estimaciones irrealistas</span>
                  </div>
                  <div className="flex items-center gap-4 p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                    <Users className="h-5 w-5 text-red-400 shrink-0" />
                    <span className="text-white/90 font-medium">Reuniones interminables</span>
                  </div>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950/60 via-emerald-900/40 to-gray-900/60 border border-emerald-500/30 p-6 sm:p-8">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl" />
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-emerald-500/30 rounded-xl flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Con Timeboxing</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                    <Zap className="h-5 w-5 text-emerald-400 shrink-0" />
                    <span className="text-white/90 font-medium">Visibilidad en tiempo real</span>
                  </div>
                  <div className="flex items-center gap-4 p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                    <BarChart3 className="h-5 w-5 text-emerald-400 shrink-0" />
                    <span className="text-white/90 font-medium">Métricas precisas</span>
                  </div>
                  <div className="flex items-center gap-4 p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                    <Target className="h-5 w-5 text-emerald-400 shrink-0" />
                    <span className="text-white/90 font-medium">Decisiones informadas</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <Button
                size="lg"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-6 text-lg font-semibold shadow-2xl shadow-indigo-500/30"
                onClick={() => {
                  const demoSection = document.getElementById('demo');
                  demoSection?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Ver cómo funciona
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>


        {/* Sección específica de Deadlines - Diseño flow horizontal */}
        <div className="relative z-10 bg-gradient-to-br from-amber-950/40 via-orange-950/40 to-amber-950/40 border-y border-amber-500/30 py-12 sm:py-16 md:py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10 sm:mb-14">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500/30 to-orange-500/30 backdrop-blur-sm rounded-full text-white text-sm font-semibold mb-4 border border-amber-400/40">
                <Target className="h-4 w-4" />
                <span>Deadlines</span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4 px-4">
                <span className="bg-gradient-to-r from-amber-300 via-orange-300 to-amber-300 bg-clip-text text-transparent">
                  Cumple tus compromisos, siempre
                </span>
              </h2>
              <p className="text-lg text-amber-200/70 max-w-xl mx-auto">
                Define, rastrea y logra tus objetivos mensuales
              </p>
            </div>

            {/* Horizontal Flow - 3 Steps */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-4 mb-12 relative">
              {/* Connecting lines (desktop) */}
              <div className="hidden md:block absolute top-1/2 left-[22%] right-[22%] h-1 bg-gradient-to-r from-amber-500/40 via-orange-500/40 to-amber-500/40 rounded-full" />

              {/* Step 1: Define */}
              <div className="relative group">
                <div className="bg-gradient-to-br from-amber-600/20 to-orange-600/20 backdrop-blur-xl rounded-3xl p-6 sm:p-8 text-center border border-amber-500/30 hover:border-amber-400/50 transition-all">
                  <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-amber-500/40">
                    <Target className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Define</h3>
                  <p className="text-amber-200/70 text-sm">
                    Objetivos mensuales por proyecto y empleado
                  </p>
                </div>
              </div>

              {/* Step 2: Track */}
              <div className="relative group md:-mt-4">
                <div className="bg-gradient-to-br from-orange-600/25 to-amber-600/25 backdrop-blur-xl rounded-3xl p-6 sm:p-8 text-center border border-orange-500/40 hover:border-orange-400/50 transition-all">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-orange-500/40">
                    <Activity className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Rastrea</h3>
                  <p className="text-orange-200/70 text-sm">
                    Compara planificado vs ejecutado en tiempo real
                  </p>
                </div>
              </div>

              {/* Step 3: Achieve */}
              <div className="relative group">
                <div className="bg-gradient-to-br from-amber-600/20 to-orange-600/20 backdrop-blur-xl rounded-3xl p-6 sm:p-8 text-center border border-amber-500/30 hover:border-amber-400/50 transition-all">
                  <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-amber-500/40">
                    <TrendingUp className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Logra</h3>
                  <p className="text-amber-200/70 text-sm">
                    Sugerencias inteligentes de redistribución
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center">
              <Button
                size="lg"
                className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white px-8 py-6 text-lg font-semibold shadow-2xl shadow-amber-500/30"
                onClick={() => {
                  setDemoTab('deadlines');
                  const demoSection = document.getElementById('demo');
                  demoSection?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Ver demo de Deadlines
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Sección de Seguridad - Diseño visual trust badges */}
        <div className="relative z-10 py-12 sm:py-16 md:py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-950/20 to-transparent" />

          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="text-center mb-10 sm:mb-14">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500/30 to-teal-500/30 backdrop-blur-sm rounded-full text-white text-sm font-semibold mb-4 border border-emerald-400/40">
                <Shield className="h-4 w-4" />
                <span>Seguridad</span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4 px-4">
                <span className="bg-gradient-to-r from-emerald-300 via-teal-300 to-emerald-300 bg-clip-text text-transparent">
                  Tus datos, protegidos
                </span>
              </h2>
              <p className="text-lg text-emerald-200/70 max-w-xl mx-auto">
                Cumplimos los más altos estándares de seguridad
              </p>
            </div>

            {/* Trust Badges Row */}
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mb-10">
              <div className="flex items-center gap-3 px-5 py-3 bg-emerald-500/20 rounded-2xl border border-emerald-500/30">
                <Lock className="h-6 w-6 text-emerald-400" />
                <span className="text-white font-semibold">TLS/SSL</span>
              </div>
              <div className="flex items-center gap-3 px-5 py-3 bg-emerald-500/20 rounded-2xl border border-emerald-500/30">
                <Shield className="h-6 w-6 text-emerald-400" />
                <span className="text-white font-semibold">GDPR</span>
              </div>

              <div className="flex items-center gap-3 px-5 py-3 bg-emerald-500/20 rounded-2xl border border-emerald-500/30">
                <Activity className="h-6 w-6 text-emerald-400" />
                <span className="text-white font-semibold">24/7</span>
              </div>
            </div>

            {/* 3 Visual Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <div className="relative group">
                <div className="bg-gradient-to-br from-emerald-600/20 to-teal-600/20 backdrop-blur-xl rounded-3xl p-6 sm:p-8 text-center border border-emerald-500/30 hover:border-emerald-400/50 transition-all">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-emerald-500/40">
                    <Lock className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Encriptación</h3>
                  <p className="text-emerald-200/70 text-sm">
                    Datos encriptados en tránsito y en reposo con algoritmos empresariales
                  </p>
                </div>
              </div>

              <div className="relative group md:-mt-4">
                <div className="bg-gradient-to-br from-teal-600/25 to-emerald-600/25 backdrop-blur-xl rounded-3xl p-6 sm:p-8 text-center border border-teal-500/40 hover:border-teal-400/50 transition-all">
                  <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-teal-500/40">
                    <Shield className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Privacidad</h3>
                  <p className="text-teal-200/70 text-sm">
                    Control total sobre tus datos. Exportación y eliminación cuando quieras.
                  </p>
                </div>
              </div>

              <div className="relative group">
                <div className="bg-gradient-to-br from-emerald-600/20 to-teal-600/20 backdrop-blur-xl rounded-3xl p-6 sm:p-8 text-center border border-emerald-500/30 hover:border-emerald-400/50 transition-all">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-emerald-500/40">
                    <Database className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Infraestructura</h3>
                  <p className="text-emerald-200/70 text-sm">
                    Servidores certificados, backups diarios y monitoreo continuo
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center">
              <Button
                size="lg"
                variant="outline"
                className="bg-emerald-500/10 border-2 border-emerald-400/40 text-white hover:text-white hover:bg-emerald-500/20 hover:border-emerald-400/60 px-8 py-6 text-lg font-semibold backdrop-blur-md"
                onClick={() => {
                  const demoSection = document.getElementById('demo');
                  demoSection?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Ver demo
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Demo Section */}
        <div id="demo" className="bg-white/5 backdrop-blur-sm border-t border-indigo-500/20 py-12 sm:py-16 md:py-20 relative">
          {/* Botón flotante para deadlines */}
          <div className="fixed bottom-6 right-6 z-50 hidden lg:block">
            <Button
              size="lg"
              className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-2xl rounded-full px-6 py-6 h-auto animate-bounce"
              onClick={() => {
                setDemoTab('deadlines');
                const demoSection = document.getElementById('demo');
                demoSection?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <Target className="h-5 w-5 mr-2" />
              Ver Deadlines
            </Button>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 sm:mb-10 md:mb-12">
              <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-primary/100/20 backdrop-blur-sm rounded-full text-indigo-200 text-xs sm:text-sm font-medium mb-3 sm:mb-4 border border-indigo-400/30">
                <Award className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>Demo interactivo</span>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4 px-4">
                Explora la plataforma en acción
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-indigo-200 max-w-3xl mx-auto px-4 mb-4">
                Descubre cómo funciona nuestra plataforma con datos de ejemplo realistas.
                Explora diferentes escenarios: equipos equilibrados, sobrecargas, optimizaciones y más.
              </p>
              <p className="text-sm sm:text-base text-indigo-200/70 max-w-2xl mx-auto px-4">
                Navega por tu dashboard, gestiona deadlines mensuales, visualiza dependencias
                entre tareas y descubre cómo nuestras métricas te ayudan a tomar mejores decisiones.
                Todo con datos simulados que reflejan situaciones reales que enfrentas día a día.
              </p>
            </div>

            <div className="bg-white rounded-xl sm:rounded-2xl border-2 border-indigo-200/50 shadow-2xl overflow-hidden relative">
              {/* Overlay oscuro en mobile que bloquea la demo */}
              {isMobile && (
                <>
                  <div className="absolute inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-6 rounded-xl">
                    <div className="text-center max-w-md">
                      <div className="mb-6 flex justify-center">
                        <div className="rounded-full bg-primary/100/20 p-6 backdrop-blur-sm border border-indigo-500/30">
                          <Monitor className="h-12 w-12 text-indigo-300" />
                        </div>
                      </div>
                      <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                        Demo optimizada para escritorio
                      </h3>
                      <p className="text-base text-gray-300 mb-6 leading-relaxed">
                        Esta demo está diseñada para pantallas de escritorio. En dispositivos móviles puede verse de manera incorrecta.
                        Por favor, accede desde un ordenador o tablet en modo horizontal para explorar la demo completa.
                      </p>
                      <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-4 mb-6">
                        <p className="text-gray-400 text-sm">
                          La herramienta completa está optimizada para escritorio y ofrece la mejor experiencia en pantallas grandes.
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <DemoProvider>
                <Tabs value={demoTab} onValueChange={setDemoTab} className="w-full">
                  <TabsList className="w-full justify-start h-auto p-1 bg-primary/10/50 border-b border-indigo-200/50 rounded-none rounded-t-xl overflow-x-auto flex-nowrap">
                    <TabsTrigger value="planner" className="data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs sm:text-sm whitespace-nowrap">
                      Planificador
                    </TabsTrigger>
                    <TabsTrigger value="dashboard" className="data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs sm:text-sm whitespace-nowrap">
                      Dashboard Empleado
                      <Badge className="ml-2 bg-primary/100 text-white text-[10px] px-1.5 py-0">Nuevo</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="weeklys" className="data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs sm:text-sm whitespace-nowrap">
                      Weeklys Forecast
                    </TabsTrigger>
                    <TabsTrigger value="deadlines" className="data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs sm:text-sm relative whitespace-nowrap">
                      Deadlines
                      <Badge className="ml-2 bg-amber-500 text-white text-[10px] px-1.5 py-0">Beta</Badge>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="planner" className="m-0 p-3 sm:p-4 md:p-6 bg-white min-h-[600px]">
                    <DemoPlanner />
                  </TabsContent>

                  <TabsContent value="dashboard" className="m-0 p-0 bg-slate-50 min-h-[600px]">
                    <DemoEmployeeDashboard />
                  </TabsContent>

                  <TabsContent value="weeklys" className="m-0 p-0 bg-slate-50 min-h-[600px]">
                    <DemoWeeklyForecastPage />
                  </TabsContent>

                  <TabsContent value="deadlines" className="m-0 p-0 bg-slate-50 min-h-[600px]">
                    <DemoDeadlinesPage />
                  </TabsContent>
                </Tabs>
              </DemoProvider>
            </div>
          </div>
        </div>

        {/* Casos de uso y beneficios - Para equipos que valoran su tiempo */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16">
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-6 px-4">
              <span className="bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200 bg-clip-text text-transparent">
                Para equipos que valoran su tiempo
              </span>
            </h2>
            {/* Audience badges */}
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-4">
              <span className="px-4 py-1.5 bg-primary/100/20 rounded-full text-indigo-200 text-sm font-medium border border-indigo-500/30">Equipos de marketing digital</span>
              <span className="px-4 py-1.5 bg-purple-500/20 rounded-full text-purple-200 text-sm font-medium border border-purple-500/30">Desarrolladores y diseñadores</span>
              <span className="px-4 py-1.5 bg-pink-500/20 rounded-full text-pink-200 text-sm font-medium border border-pink-500/30">Cualquier equipo que coordine trabajo</span>
            </div>
          </div>



          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {/* Card: Líderes de equipo */}
            <Card className="border-2 border-indigo-500/40 bg-gradient-to-br from-indigo-950/80 to-purple-950/80 backdrop-blur-xl overflow-hidden group hover:border-indigo-400/60 transition-all">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Para líderes de equipo</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-2.5 bg-primary/100/10 rounded-lg border border-indigo-500/20">
                    <CheckCircle2 className="h-4 w-4 text-indigo-400 shrink-0" />
                    <span className="text-sm text-white/90">Decisiones informadas sobre distribución</span>
                  </div>
                  <div className="flex items-center gap-3 p-2.5 bg-primary/100/10 rounded-lg border border-indigo-500/20">
                    <CheckCircle2 className="h-4 w-4 text-indigo-400 shrink-0" />
                    <span className="text-sm text-white/90">Identifica quién necesita ayuda</span>
                  </div>
                  <div className="flex items-center gap-3 p-2.5 bg-primary/100/10 rounded-lg border border-indigo-500/20">
                    <CheckCircle2 className="h-4 w-4 text-indigo-400 shrink-0" />
                    <span className="text-sm text-white/90">Reduce reuniones en un 70%</span>
                  </div>
                  <div className="flex items-center gap-3 p-2.5 bg-primary/100/10 rounded-lg border border-indigo-500/20">
                    <CheckCircle2 className="h-4 w-4 text-indigo-400 shrink-0" />
                    <span className="text-sm text-white/90">Alertas automáticas de sobrecarga</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card: Project Managers */}
            <Card className="border-2 border-purple-500/40 bg-gradient-to-br from-purple-950/80 to-pink-950/80 backdrop-blur-xl overflow-hidden group hover:border-purple-400/60 transition-all">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Para project managers</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-2.5 bg-purple-500/10 rounded-lg border border-purple-500/20">
                    <CheckCircle2 className="h-4 w-4 text-purple-400 shrink-0" />
                    <span className="text-sm text-white/90">Gestión de múltiples proyectos</span>
                  </div>
                  <div className="flex items-center gap-3 p-2.5 bg-purple-500/10 rounded-lg border border-purple-500/20">
                    <CheckCircle2 className="h-4 w-4 text-purple-400 shrink-0" />
                    <span className="text-sm text-white/90">Visualiza dependencias y cuellos de botella</span>
                  </div>
                  <div className="flex items-center gap-3 p-2.5 bg-purple-500/10 rounded-lg border border-purple-500/20">
                    <CheckCircle2 className="h-4 w-4 text-purple-400 shrink-0" />
                    <span className="text-sm text-white/90">Control de presupuestos y horas</span>
                  </div>
                  <div className="flex items-center gap-3 p-2.5 bg-purple-500/10 rounded-lg border border-purple-500/20">
                    <CheckCircle2 className="h-4 w-4 text-purple-400 shrink-0" />
                    <span className="text-sm text-white/90">Seguimiento de deadlines</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card: Empleados */}
            <Card className="border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-950/80 to-teal-950/80 backdrop-blur-xl overflow-hidden group hover:border-emerald-400/60 transition-all">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                    <BarChart3 className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Para empleados</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-2.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span className="text-sm text-white/90">Vista clara de tu carga de trabajo</span>
                  </div>
                  <div className="flex items-center gap-3 p-2.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span className="text-sm text-white/90">Priorización automática de tareas</span>
                  </div>
                  <div className="flex items-center gap-3 p-2.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span className="text-sm text-white/90">Seguimiento de tu progreso</span>
                  </div>
                  <div className="flex items-center gap-3 p-2.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span className="text-sm text-white/90">Sabes qué hacer y cuándo</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-indigo-500/20 rounded-2xl border border-indigo-400/30 p-8 backdrop-blur-xl">
            <div className="text-center">
              <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                Resultados que hablan por sí solos
              </h3>
              <div className="grid md:grid-cols-3 gap-6 mt-8">
                <div>
                  <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300 mb-2">
                    70%
                  </div>
                  <p className="text-indigo-200/80 text-sm">
                    Reducción en reuniones de coordinación
                  </p>
                </div>
                <div>
                  <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300 mb-2">
                    85%
                  </div>
                  <p className="text-indigo-200/80 text-sm">
                    Mejora en precisión de estimaciones
                  </p>
                </div>
                <div>
                  <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-300 to-amber-300 mb-2">
                    60%
                  </div>
                  <p className="text-indigo-200/80 text-sm">
                    Más sobrecargas detectadas a tiempo
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sección FAQ */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16">
          <div className="text-center mb-8 sm:mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/100/20 backdrop-blur-sm rounded-full text-indigo-200 text-sm font-medium mb-3 sm:mb-4 border border-indigo-400/30">
              <HelpCircle className="h-4 w-4" />
              <span>Preguntas frecuentes</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4 sm:mb-5 px-4">
              <span className="bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200 bg-clip-text text-transparent">
                Resolvemos tus dudas
              </span>
            </h2>
            <p className="text-base sm:text-lg text-white/90 max-w-2xl mx-auto px-4">
              Todo lo que necesitas saber sobre nuestra plataforma.
            </p>
          </div>

          <Card className="border-2 border-white/10 bg-white/5 backdrop-blur-xl">
            <CardContent className="p-4 sm:p-6">
              <Accordion type="single" collapsible className="w-full space-y-2">
                <AccordionItem value="item-1" className="border-b border-white/10">
                  <AccordionTrigger className="text-white hover:text-indigo-200 text-left py-4">
                    <div className="flex items-center gap-3">
                      <HelpCircle className="h-5 w-5 text-indigo-300 shrink-0" />
                      <span className="font-semibold">¿Cómo funciona la plataforma?</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-white/90 text-sm sm:text-base leading-relaxed pt-2 pb-4 pl-8">
                    Nuestra plataforma te permite visualizar y gestionar la carga de trabajo de tu equipo en tiempo real.
                    Puedes planificar tareas, establecer deadlines, gestionar dependencias y recibir alertas automáticas
                    cuando detectamos sobrecargas o problemas. Todo desde una interfaz visual e intuitiva que no requiere
                    instalación de software adicional.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2" className="border-b border-white/10">
                  <AccordionTrigger className="text-white hover:text-indigo-200 text-left py-4">
                    <div className="flex items-center gap-3">
                      <HelpCircle className="h-5 w-5 text-indigo-300 shrink-0" />
                      <span className="font-semibold">¿Necesito instalar algo?</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-white/90 text-sm sm:text-base leading-relaxed pt-2 pb-4 pl-8">
                    No, nuestra plataforma es completamente web. Solo necesitas un navegador moderno y acceso a internet.
                    Funciona en cualquier dispositivo: ordenador, tablet o móvil. No requiere instalación de software ni
                    configuraciones complicadas.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3" className="border-b border-white/10">
                  <AccordionTrigger className="text-white hover:text-indigo-200 text-left py-4">
                    <div className="flex items-center gap-3">
                      <HelpCircle className="h-5 w-5 text-indigo-300 shrink-0" />
                      <span className="font-semibold">¿Son seguros mis datos?</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-white/90 text-sm sm:text-base leading-relaxed pt-2 pb-4 pl-8">
                    Absolutamente. Utilizamos encriptación de extremo a extremo para proteger tus datos tanto en tránsito
                    como en reposo. Cumplimos con el GDPR y todos los estándares de seguridad internacionales. Tienes control
                    total sobre tus datos y puedes exportarlos o eliminarlos en cualquier momento.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4" className="border-b border-white/10">
                  <AccordionTrigger className="text-white hover:text-indigo-200 text-left py-4">
                    <div className="flex items-center gap-3">
                      <HelpCircle className="h-5 w-5 text-indigo-300 shrink-0" />
                      <span className="font-semibold">¿Puedo integrarlo con otras herramientas?</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-white/90 text-sm sm:text-base leading-relaxed pt-2 pb-4 pl-8">
                    Sí, ofrecemos una API REST completa que te permite integrar la plataforma con tus herramientas existentes.
                    Puedes consultar la <Link to="/api-docs" className="text-indigo-300 hover:text-white underline underline-offset-2">documentación de la API</Link> para conexión, autenticación y referencia de tablas.
                    También puedes exportar datos en múltiples formatos para trabajar con hojas de cálculo u otros sistemas.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-5" className="border-b border-white/10">
                  <AccordionTrigger className="text-white hover:text-indigo-200 text-left py-4">
                    <div className="flex items-center gap-3">
                      <HelpCircle className="h-5 w-5 text-indigo-300 shrink-0" />
                      <span className="font-semibold">¿Cuánto tiempo toma implementarlo?</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-white/90 text-sm sm:text-base leading-relaxed pt-2 pb-4 pl-8">
                    La plataforma está lista para usar desde el primer día. Puedes empezar a añadir tu equipo y proyectos
                    inmediatamente. La curva de aprendizaje es mínima gracias a nuestra interfaz intuitiva. La mayoría de
                    los equipos están completamente operativos en menos de una semana.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-6" className="border-b border-white/10">
                  <AccordionTrigger className="text-white hover:text-indigo-200 text-left py-4">
                    <div className="flex items-center gap-3">
                      <HelpCircle className="h-5 w-5 text-indigo-300 shrink-0" />
                      <span className="font-semibold">¿Hay soporte técnico?</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-white/90 text-sm sm:text-base leading-relaxed pt-2 pb-4 pl-8">
                    Sí, ofrecemos soporte técnico completo. Puedes contactarnos por correo electrónico y nuestro equipo te ayudará con
                    cualquier duda o problema. Además, tenemos documentación completa, tutoriales y una comunidad activa
                    donde puedes encontrar respuestas y compartir experiencias.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-7" className="border-b border-white/10">
                  <AccordionTrigger className="text-white hover:text-indigo-200 text-left py-4">
                    <div className="flex items-center gap-3">
                      <Shield className="h-5 w-5 text-emerald-300 shrink-0" />
                      <span className="font-semibold">¿Dónde se almacenan mis datos?</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-white/90 text-sm sm:text-base leading-relaxed pt-2 pb-4 pl-8">
                    Tus datos se almacenan en servidores seguros ubicados en centros de datos con certificaciones internacionales de seguridad.
                    Utilizamos infraestructura en la nube de nivel empresarial que garantiza alta disponibilidad, respaldo automático y
                    protección física de los servidores. Todos los datos están encriptados y protegidos por múltiples capas de seguridad.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-8" className="border-b border-white/10">
                  <AccordionTrigger className="text-white hover:text-indigo-200 text-left py-4">
                    <div className="flex items-center gap-3">
                      <Shield className="h-5 w-5 text-emerald-300 shrink-0" />
                      <span className="font-semibold">¿Quién puede acceder a mis datos?</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-white/90 text-sm sm:text-base leading-relaxed pt-2 pb-4 pl-8">
                    Solo tú y las personas de tu equipo a las que otorgues permisos específicos pueden acceder a los datos.
                    Utilizamos un sistema de permisos granulares que te permite controlar exactamente qué puede ver y hacer cada usuario.
                    Nuestro equipo técnico solo accede a los datos cuando es estrictamente necesario para proporcionar soporte,
                    y siempre con tu autorización previa. Todos los accesos quedan registrados en un log de auditoría.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-9" className="border-b border-white/10">
                  <AccordionTrigger className="text-white hover:text-indigo-200 text-left py-4">
                    <div className="flex items-center gap-3">
                      <Lock className="h-5 w-5 text-emerald-300 shrink-0" />
                      <span className="font-semibold">¿Qué medidas de seguridad tienen las contraseñas?</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-white/90 text-sm sm:text-base leading-relaxed pt-2 pb-4 pl-8">
                    Las contraseñas se almacenan utilizando algoritmos de hash seguros (bcrypt) que hacen imposible recuperar la contraseña original.
                    Nunca almacenamos contraseñas en texto plano. Además, todas las conexiones utilizan encriptación TLS/SSL para proteger
                    las credenciales durante el inicio de sesión. Te recomendamos usar contraseñas fuertes y únicas, y cambiarlas periódicamente.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-10" className="border-b-0">
                  <AccordionTrigger className="text-white hover:text-indigo-200 text-left py-4">
                    <div className="flex items-center gap-3">
                      <Database className="h-5 w-5 text-emerald-300 shrink-0" />
                      <span className="font-semibold">¿Qué pasa si quiero eliminar todos mis datos?</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-white/90 text-sm sm:text-base leading-relaxed pt-2 pb-4 pl-8">
                    Puedes eliminar todos tus datos en cualquier momento desde la configuración de tu cuenta. El proceso de eliminación es
                    completo e irreversible: se eliminan todos los datos asociados a tu cuenta, incluyendo proyectos, asignaciones,
                    historial y cualquier otra información. También puedes exportar todos tus datos antes de eliminarlos si lo deseas.
                    Este proceso cumple con el derecho al olvido establecido en el GDPR.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          <div className="text-center mt-8">
            <Link to="/login">
              <Button
                size="lg"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-6 text-lg font-semibold shadow-2xl"
              >
                Empezar ahora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* CTA Section mejorado */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 py-16 sm:py-20 md:py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.15),transparent_70%)] -z-10" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.1),transparent_50%)] -z-10" />
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <div className="inline-block mb-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
                <CheckCircle2 className="h-4 w-4 text-white" />
                <span className="text-sm font-semibold text-white">Sin compromiso</span>
              </div>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 sm:mb-6 leading-tight">
              ¿Listo para{' '}
              <span className="bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200 bg-clip-text text-transparent">
                transformar
              </span>
              {' '}a tu equipo?
            </h2>
            <p className="text-lg sm:text-xl md:text-2xl text-indigo-100 mb-8 sm:mb-10 font-light max-w-2xl mx-auto">
              Accede ahora y descubre cómo gestionar el tiempo de tu equipo de forma inteligente.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/login" className="group relative">
                <div className="absolute -inset-1 bg-white rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-300" />
                <Button size="lg" className="relative w-full sm:w-auto bg-white text-primary hover:bg-slate-50 px-8 sm:px-10 py-6 sm:py-7 text-lg sm:text-xl font-bold shadow-2xl hover:shadow-white/50 transition-all transform hover:scale-105">
                  Acceder ahora
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto px-8 sm:px-10 py-6 sm:py-7 text-lg sm:text-xl font-semibold border-2 border-white/40 text-white hover:text-white hover:bg-white/20 hover:border-white/60 bg-white/10 backdrop-blur-md shadow-xl"
                onClick={() => {
                  const demoSection = document.getElementById('demo');
                  demoSection?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Ver demo completa
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
