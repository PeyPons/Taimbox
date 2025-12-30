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
  GitBranch
} from 'lucide-react';
import { DemoDashboard } from '@/components/demo/DemoDashboard';
import { DemoDeadlinesPage } from '@/components/demo/DemoDeadlinesPage';
import { DemoProvider } from '@/contexts/DemoContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Helmet } from 'react-helmet-async';
import { cn } from '@/lib/utils';
import { CalendarPreview } from '@/components/landing/CalendarPreview';

export default function LandingPage() {
  return (
    <>
      <Helmet>
        <title>Timeboxing - Gestión de Recursos y Planificación</title>
        <meta name="description" content="Plataforma de gestión de recursos y planificación para agencias digitales. Visualiza, planifica y optimiza el trabajo de tu equipo." />
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-indigo-900 relative overflow-hidden">
        {/* Efectos de fondo animados mejorados */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 md:pt-28 pb-16 sm:pb-20 md:pb-28">
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
              <div className="mb-10 sm:mb-14 max-w-4xl mx-auto px-4">
                <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-indigo-100/90 leading-relaxed font-light mb-2">
                  No más hojas de cálculo. No más adivinanzas.
                </p>
                <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-white font-semibold leading-tight">
                  Ve quién hace qué, <span className="bg-gradient-to-r from-indigo-200 to-purple-200 bg-clip-text text-transparent">cuándo</span> y <span className="bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-transparent">por qué</span>.
                </p>
              </div>
              
              {/* CTA mejorado */}
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center px-4 mb-12 sm:mb-16">
                <Link to="/login" className="group relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-300" />
                  <Button size="lg" className="relative w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 sm:px-10 py-6 sm:py-7 text-lg sm:text-xl font-semibold shadow-2xl hover:shadow-indigo-500/50 transition-all transform hover:scale-105">
                    Acceder ahora
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="w-full sm:w-auto px-8 sm:px-10 py-6 sm:py-7 text-lg sm:text-xl font-semibold border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/50 bg-white/5 backdrop-blur-md shadow-xl"
                  onClick={() => {
                    const demoSection = document.getElementById('demo');
                    demoSection?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Explorar demo
                </Button>
              </div>

              {/* Preview visual - Calendario completo */}
              <div className="relative mt-12 sm:mt-16 max-w-5xl mx-auto">
                <div className="absolute inset-0 bg-gradient-to-t from-indigo-950/50 to-transparent -z-10" />
                <div className="relative transform hover:scale-[1.01] transition-all duration-500">
                  <CalendarPreview />
                  <div className="mt-4 text-center">
                    <Button
                      variant="outline"
                      className="bg-white/10 backdrop-blur-md border-white/30 text-white hover:bg-white/20 hover:border-white/50"
                      onClick={() => {
                        const demoSection = document.getElementById('demo');
                        demoSection?.scrollIntoView({ behavior: 'smooth' });
                      }}
                    >
                      Ver demo completo
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section - Rediseñado con copywriting expandido */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 md:py-28">
          <div className="text-center mb-12 sm:mb-16 md:mb-20">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 sm:mb-6 px-4">
              <span className="bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200 bg-clip-text text-transparent">
                Todo en un vistazo
              </span>
            </h2>
            <p className="text-lg sm:text-xl md:text-2xl text-indigo-200/80 max-w-3xl mx-auto px-4 font-light mb-6">
              Sin complicaciones. Sin perder tiempo. Solo resultados.
            </p>
            <p className="text-base sm:text-lg text-indigo-200/70 max-w-4xl mx-auto px-4 leading-relaxed">
              Olvídate de las hojas de cálculo interminables y las reuniones para coordinar quién hace qué. 
              Nuestra plataforma te muestra en tiempo real la carga de trabajo de cada miembro del equipo, 
              identifica sobrecargas antes de que ocurran y te ayuda a tomar decisiones informadas sobre 
              la distribución de recursos. Todo en una interfaz visual e intuitiva que tu equipo adoptará desde el primer día.
            </p>
          </div>
          
          {/* Grid con todas las funcionalidades sin repetir */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
            {/* Feature 1: Planificación Visual */}
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl blur opacity-0 group-hover:opacity-50 transition duration-300" />
              <Card className="relative h-full border-2 border-white/10 bg-white/5 backdrop-blur-xl hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-indigo-500/20">
                <CardContent className="p-5 sm:p-6 flex flex-col items-center text-center">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center mb-3 sm:mb-4 shadow-lg shadow-indigo-500/30 group-hover:scale-110 transition-transform">
                    <Calendar className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Calendario Visual</h3>
                  <p className="text-xs sm:text-sm text-indigo-200/80 leading-relaxed">
                    Visualiza la carga de trabajo de todo tu equipo en un calendario semanal y mensual. 
                    Identifica sobrecargas, subcargas y oportunidades de redistribución al instante. 
                    Cada semana muestra horas estimadas, reales y computadas con códigos de color intuitivos.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Feature 2: Dependencias */}
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-0 group-hover:opacity-50 transition duration-300" />
              <Card className="relative h-full border-2 border-white/10 bg-white/5 backdrop-blur-xl hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20">
                <CardContent className="p-5 sm:p-6 flex flex-col items-center text-center">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-3 sm:mb-4 shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform">
                    <Link2 className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Dependencias</h3>
                  <p className="text-xs sm:text-sm text-indigo-200/80 leading-relaxed">
                    Define qué tareas dependen de otras y visualiza el flujo de trabajo completo. 
                    Recibe alertas cuando una tarea bloquea a otras, prioriza automáticamente las tareas críticas 
                    y asegúrate de que tu equipo siempre sepa qué hacer primero.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Feature 3: Deadlines */}
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-600 to-orange-600 rounded-2xl blur opacity-0 group-hover:opacity-50 transition duration-300" />
              <Card className="relative h-full border-2 border-white/10 bg-white/5 backdrop-blur-xl hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-amber-500/20">
                <CardContent className="p-5 sm:p-6 flex flex-col items-center text-center">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center mb-3 sm:mb-4 shadow-lg shadow-amber-500/30 group-hover:scale-110 transition-transform">
                    <Target className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Deadlines</h3>
                  <p className="text-xs sm:text-sm text-indigo-200/80 leading-relaxed">
                    Establece objetivos mensuales de horas por proyecto y empleado. Compara lo planificado 
                    con lo realmente ejecutado y detecta desviaciones antes de que se conviertan en problemas. 
                    Mantén la coherencia entre lo que prometes y lo que entregas.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Feature 4: Métricas */}
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl blur opacity-0 group-hover:opacity-50 transition duration-300" />
              <Card className="relative h-full border-2 border-white/10 bg-white/5 backdrop-blur-xl hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-emerald-500/20">
                <CardContent className="p-5 sm:p-6 flex flex-col items-center text-center">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center mb-3 sm:mb-4 shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform">
                    <BarChart3 className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Métricas</h3>
                  <p className="text-xs sm:text-sm text-indigo-200/80 leading-relaxed">
                    Mide la precisión de tu planificación, el balance motivacional del equipo y el índice de fiabilidad. 
                    Descubre patrones, mejora tus estimaciones y toma decisiones basadas en datos reales, no en intuiciones.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Feature 5: Gestión de Equipo */}
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl blur opacity-0 group-hover:opacity-50 transition duration-300" />
              <Card className="relative h-full border-2 border-white/10 bg-white/5 backdrop-blur-xl hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20">
                <CardContent className="p-5 sm:p-6 flex flex-col items-center text-center">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-3 sm:mb-4 shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                    <Users className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Equipo</h3>
                  <p className="text-xs sm:text-sm text-indigo-200/80 leading-relaxed">
                    Gestiona horarios personalizados por empleado, registra ausencias y vacaciones que se reflejan automáticamente 
                    en la capacidad, y establece objetivos profesionales individuales. Todo centralizado para una gestión eficiente 
                    de recursos humanos.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Feature 6: Proyectos */}
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-rose-600 to-pink-600 rounded-2xl blur opacity-0 group-hover:opacity-50 transition duration-300" />
              <Card className="relative h-full border-2 border-white/10 bg-white/5 backdrop-blur-xl hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-rose-500/20">
                <CardContent className="p-5 sm:p-6 flex flex-col items-center text-center">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-rose-500 to-pink-500 rounded-xl flex items-center justify-center mb-3 sm:mb-4 shadow-lg shadow-rose-500/30 group-hover:scale-110 transition-transform">
                    <Target className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Proyectos</h3>
                  <p className="text-xs sm:text-sm text-indigo-200/80 leading-relaxed">
                    Controla las horas contratadas por proyecto y compara con lo planificado y ejecutado. Visualiza el estado 
                    de salud de cada proyecto con alertas cuando te acercas o excedes el presupuesto. Gestiona objetivos y métricas 
                    en tiempo real para cada cliente.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Feature 7: Weekly Reports */}
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl blur opacity-0 group-hover:opacity-50 transition duration-300" />
              <Card className="relative h-full border-2 border-white/10 bg-white/5 backdrop-blur-xl hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-violet-500/20">
                <CardContent className="p-5 sm:p-6 flex flex-col items-center text-center">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-violet-500 to-purple-500 rounded-xl flex items-center justify-center mb-3 sm:mb-4 shadow-lg shadow-violet-500/30 group-hover:scale-110 transition-transform">
                    <FileText className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Weekly Reports</h3>
                  <p className="text-xs sm:text-sm text-indigo-200/80 leading-relaxed">
                    Sistema de cierre semanal que identifica tareas pendientes y bloqueos. Los empleados revisan su trabajo 
                    semanal y pueden transferir, redistribuir o mantener tareas. Los managers ven un feed completo de 
                    transferencias y pueden redistribuir horas rápidamente.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Feature 8: Alertas */}
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-600 to-amber-600 rounded-2xl blur opacity-0 group-hover:opacity-50 transition duration-300" />
              <Card className="relative h-full border-2 border-white/10 bg-white/5 backdrop-blur-xl hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-yellow-500/20">
                <CardContent className="p-5 sm:p-6 flex flex-col items-center text-center">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-xl flex items-center justify-center mb-3 sm:mb-4 shadow-lg shadow-yellow-500/30 group-hover:scale-110 transition-transform">
                    <Bell className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Alertas</h3>
                  <p className="text-xs sm:text-sm text-indigo-200/80 leading-relaxed">
                    Sistema de notificaciones inteligentes que te avisa de sobrecargas, dependencias bloqueantes, proyectos 
                    en riesgo y desviaciones de deadlines. Recibe alertas contextuales que te ayudan a tomar decisiones 
                    proactivas antes de que los problemas se agraven.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Sección de Problemas y Soluciones */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 md:py-28">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-6 px-4">
              <span className="bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200 bg-clip-text text-transparent">
                ¿Cansado de gestionar el tiempo a ciegas?
              </span>
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <Card className="border-2 border-red-500/30 bg-red-500/10 backdrop-blur-xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <AlertTriangle className="h-8 w-8 text-red-400" />
                  <h3 className="text-xl font-bold text-white">Los Problemas</h3>
                </div>
                <ul className="space-y-3 text-indigo-200/90">
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-1">✗</span>
                    <span>No sabes quién está sobrecargado hasta que es demasiado tarde</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-1">✗</span>
                    <span>Las estimaciones nunca coinciden con la realidad</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-1">✗</span>
                    <span>Las dependencias entre tareas causan bloqueos inesperados</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-1">✗</span>
                    <span>Reuniones interminables para coordinar quién hace qué</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-1">✗</span>
                    <span>No tienes visibilidad de la carga real del equipo</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 border-emerald-500/30 bg-emerald-500/10 backdrop-blur-xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                  <h3 className="text-xl font-bold text-white">Nuestra Solución</h3>
                </div>
                <ul className="space-y-3 text-indigo-200/90">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-1">✓</span>
                    <span>Visualización en tiempo real de la carga de cada miembro</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-1">✓</span>
                    <span>Comparación automática entre estimado, real y computado</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-1">✓</span>
                    <span>Gestión visual de dependencias con alertas inteligentes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-1">✓</span>
                    <span>Dashboard centralizado que elimina la necesidad de reuniones</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-1">✓</span>
                    <span>Métricas que te ayudan a mejorar tu planificación</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <Button
              size="lg"
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-6 text-lg font-semibold shadow-2xl"
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

        {/* Sección específica de Deadlines */}
        <div className="relative z-10 bg-gradient-to-br from-amber-950/30 via-orange-950/30 to-amber-950/30 border-y border-amber-500/20 py-16 sm:py-20 md:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 backdrop-blur-sm rounded-full text-amber-200 text-sm font-medium mb-4 border border-amber-400/30">
                <Target className="h-4 w-4" />
                <span>Gestión de Deadlines</span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-6 px-4">
                <span className="bg-gradient-to-r from-amber-200 via-orange-200 to-amber-200 bg-clip-text text-transparent">
                  Cumple tus compromisos, siempre
                </span>
              </h2>
              <p className="text-lg sm:text-xl text-indigo-200/80 max-w-3xl mx-auto px-4 leading-relaxed">
                Los deadlines no son solo números en una hoja de cálculo. Son compromisos con tus clientes 
                y tu equipo. Nuestra plataforma te ayuda a establecer objetivos realistas, monitorear el progreso 
                en tiempo real y detectar desviaciones antes de que se conviertan en problemas.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <Card className="border-2 border-amber-500/30 bg-amber-500/10 backdrop-blur-xl">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center mb-4">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">Objetivos Mensuales</h3>
                  <p className="text-indigo-200/80 text-sm leading-relaxed">
                    Establece objetivos de horas por proyecto y empleado para cada mes. 
                    Visualiza la distribución de carga y asegúrate de que todos tengan objetivos alcanzables.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 border-amber-500/30 bg-amber-500/10 backdrop-blur-xl">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center mb-4">
                    <Activity className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">Coherencia de Planificación</h3>
                  <p className="text-indigo-200/80 text-sm leading-relaxed">
                    Compara lo que planificaste con lo que realmente se ejecutó. Identifica patrones, 
                    mejora tus estimaciones y mantén la coherencia entre lo prometido y lo entregado.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 border-amber-500/30 bg-amber-500/10 backdrop-blur-xl">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center mb-4">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">Sugerencias Inteligentes</h3>
                  <p className="text-indigo-200/80 text-sm leading-relaxed">
                    Recibe sugerencias automáticas de redistribución de horas cuando detectamos desequilibrios. 
                    Optimiza la carga del equipo y maximiza la productividad sin sobrecargar a nadie.
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="text-center">
              <Button
                size="lg"
                className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white px-8 py-6 text-lg font-semibold shadow-2xl"
                onClick={() => {
                  const demoSection = document.getElementById('demo');
                  demoSection?.scrollIntoView({ behavior: 'smooth' });
                  // Cambiar a tab de deadlines después de un pequeño delay
                  setTimeout(() => {
                    const deadlinesTab = document.querySelector('[value="deadlines"]') as HTMLElement;
                    deadlinesTab?.click();
                  }, 500);
                }}
              >
                Ver demo de Deadlines
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
                const demoSection = document.getElementById('demo');
                demoSection?.scrollIntoView({ behavior: 'smooth' });
                setTimeout(() => {
                  const deadlinesTab = document.querySelector('[value="deadlines"]') as HTMLElement;
                  deadlinesTab?.click();
                }, 500);
              }}
            >
              <Target className="h-5 w-5 mr-2" />
              Ver Deadlines
            </Button>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 sm:mb-10 md:mb-12">
              <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-indigo-500/20 backdrop-blur-sm rounded-full text-indigo-200 text-xs sm:text-sm font-medium mb-3 sm:mb-4 border border-indigo-400/30">
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
                Navega por el dashboard del empleado, gestiona deadlines mensuales, visualiza dependencias 
                entre tareas y descubre cómo nuestras métricas te ayudan a tomar mejores decisiones. 
                Todo con datos simulados que reflejan situaciones reales que enfrentas día a día.
              </p>
            </div>
            
            <div className="bg-white rounded-xl sm:rounded-2xl border-2 border-indigo-200/50 shadow-2xl overflow-hidden relative">
              <DemoProvider>
                <Tabs defaultValue="dashboard" className="w-full">
                  <TabsList className="w-full justify-start h-auto p-1 bg-indigo-50/50 border-b border-indigo-200/50 rounded-none rounded-t-xl">
                    <TabsTrigger value="dashboard" className="data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs sm:text-sm">
                      Dashboard
                    </TabsTrigger>
                    <TabsTrigger value="deadlines" className="data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs sm:text-sm relative">
                      Deadlines
                      <Badge className="ml-2 bg-amber-500 text-white text-[10px] px-1.5 py-0">Nuevo</Badge>
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="dashboard" className="m-0 p-3 sm:p-4 md:p-6">
                    <DemoDashboard />
                  </TabsContent>
                  <TabsContent value="deadlines" className="m-0 p-0">
                    <DemoDeadlinesPage />
                  </TabsContent>
                </Tabs>
              </DemoProvider>
            </div>
          </div>
        </div>

        {/* Sección para Managers y Administrativos */}
        <div className="relative z-10 bg-gradient-to-br from-indigo-950/50 via-purple-950/50 to-indigo-950/50 border-y border-indigo-500/20 py-16 sm:py-20 md:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 sm:mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/20 backdrop-blur-sm rounded-full text-indigo-200 text-sm font-medium mb-4 border border-indigo-400/30">
                <Users className="h-4 w-4" />
                <span>Para managers y responsables</span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-6 px-4">
                <span className="bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200 bg-clip-text text-transparent">
                  Control total sobre tu equipo y proyectos
                </span>
              </h2>
              <p className="text-lg sm:text-xl text-indigo-200/80 max-w-3xl mx-auto px-4 leading-relaxed">
                Como manager o responsable, necesitas visibilidad completa, herramientas de control y métricas que te ayuden 
                a tomar decisiones estratégicas. Nuestra plataforma está diseñada para darte el poder y la información que necesitas.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <Card className="border-2 border-indigo-500/30 bg-indigo-500/10 backdrop-blur-xl">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                      <BarChart3 className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Visibilidad completa</h3>
                  </div>
                  <ul className="space-y-3 text-indigo-200/90 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-400 mt-1">•</span>
                      <span>Vista panorámica de toda la carga del equipo en tiempo real</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-400 mt-1">•</span>
                      <span>Acceso al planificador mensual con todas las asignaciones</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-400 mt-1">•</span>
                      <span>Reportes detallados de ocupación, rentabilidad y fiabilidad</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-400 mt-1">•</span>
                      <span>Métricas de coherencia entre deadlines y planificación</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-400 mt-1">•</span>
                      <span>Dashboard de weekly forecast con semáforo de proyectos</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-2 border-purple-500/30 bg-purple-500/10 backdrop-blur-xl">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                      <Zap className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Herramientas de control</h3>
                  </div>
                  <ul className="space-y-3 text-indigo-200/90 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-purple-400 mt-1">•</span>
                      <span>Redistribución rápida de horas entre empleados</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-400 mt-1">•</span>
                      <span>Gestión de deadlines mensuales por proyecto y empleado</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-400 mt-1">•</span>
                      <span>Control de permisos granulares por usuario</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-400 mt-1">•</span>
                      <span>Revisión y aprobación de transferencias semanales</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-400 mt-1">•</span>
                      <span>Configuración de horarios, ausencias y eventos de equipo</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <div className="bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-indigo-500/20 rounded-2xl border border-indigo-400/30 p-8 backdrop-blur-xl">
              <h3 className="text-2xl sm:text-3xl font-bold text-white mb-6 text-center">
                Ventajas específicas para tu rol
              </h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300 mb-2">
                    Toma decisiones informadas
                  </div>
                  <p className="text-indigo-200/80 text-sm leading-relaxed">
                    Con métricas en tiempo real, índices de fiabilidad y análisis de coherencia, 
                    siempre sabes exactamente qué está pasando en tu equipo.
                  </p>
                </div>
                <div>
                  <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300 mb-2">
                    Optimiza recursos
                  </div>
                  <p className="text-indigo-200/80 text-sm leading-relaxed">
                    Identifica sobrecargas y subcargas al instante. Las sugerencias automáticas 
                    te ayudan a redistribuir horas de forma equilibrada.
                  </p>
                </div>
                <div>
                  <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-300 to-amber-300 mb-2">
                    Reduce reuniones
                  </div>
                  <p className="text-indigo-200/80 text-sm leading-relaxed">
                    El dashboard centralizado y el sistema de weekly eliminan la necesidad de 
                    reuniones constantes de coordinación. Todo está visible y accesible.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Casos de Uso y Beneficios */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 md:py-28">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-6 px-4">
              <span className="bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200 bg-clip-text text-transparent">
                Para equipos que valoran su tiempo
              </span>
            </h2>
            <p className="text-lg sm:text-xl text-indigo-200/80 max-w-3xl mx-auto px-4 leading-relaxed">
              Ya sea que gestiones un equipo de marketing digital, desarrolladores, diseñadores o cualquier equipo que necesite 
              coordinar trabajo, nuestra plataforma se adapta a tus necesidades.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <Card className="border-2 border-indigo-500/30 bg-indigo-500/10 backdrop-blur-xl">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Para Líderes de Equipo</h3>
                <p className="text-indigo-200/80 text-sm leading-relaxed mb-4">
                  Toma decisiones informadas sobre la distribución de trabajo. Identifica quién necesita ayuda 
                  y quién puede asumir más responsabilidades. Reduce las reuniones de coordinación en un 70%.
                </p>
                <ul className="space-y-2 text-xs text-indigo-200/70">
                  <li>• Visibilidad completa del equipo</li>
                  <li>• Alertas de sobrecarga automáticas</li>
                  <li>• Sugerencias de redistribución</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 border-purple-500/30 bg-purple-500/10 backdrop-blur-xl">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Para Project Managers</h3>
                <p className="text-indigo-200/80 text-sm leading-relaxed mb-4">
                  Gestiona múltiples proyectos simultáneamente sin perder el control. Visualiza dependencias, 
                  identifica cuellos de botella y asegúrate de que los deadlines se cumplan.
                </p>
                <ul className="space-y-2 text-xs text-indigo-200/70">
                  <li>• Gestión de múltiples proyectos</li>
                  <li>• Control de presupuestos y horas</li>
                  <li>• Seguimiento de deadlines</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 border-emerald-500/30 bg-emerald-500/10 backdrop-blur-xl">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Para Empleados</h3>
                <p className="text-indigo-200/80 text-sm leading-relaxed mb-4">
                  Ve tu carga de trabajo de forma clara, entiende tus prioridades y gestiona tus tareas de manera eficiente. 
                  Sabes exactamente qué hacer y cuándo hacerlo.
                </p>
                <ul className="space-y-2 text-xs text-indigo-200/70">
                  <li>• Vista clara de tus tareas</li>
                  <li>• Priorización automática</li>
                  <li>• Seguimiento de tu progreso</li>
                </ul>
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
                    Menos sobrecargas detectadas a tiempo
                  </p>
                </div>
              </div>
            </div>
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
              {' '}tu equipo?
            </h2>
            <p className="text-lg sm:text-xl md:text-2xl text-indigo-100 mb-8 sm:mb-10 font-light max-w-2xl mx-auto">
              Accede ahora y descubre cómo gestionar el tiempo de forma inteligente.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/login" className="group relative">
                <div className="absolute -inset-1 bg-white rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-300" />
                <Button size="lg" className="relative w-full sm:w-auto bg-white text-indigo-600 hover:bg-slate-50 px-8 sm:px-10 py-6 sm:py-7 text-lg sm:text-xl font-bold shadow-2xl hover:shadow-white/50 transition-all transform hover:scale-105">
                  Acceder ahora
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button 
                size="lg" 
                variant="outline" 
                className="w-full sm:w-auto px-8 sm:px-10 py-6 sm:py-7 text-lg sm:text-xl font-semibold border-2 border-white/40 text-white hover:bg-white/20 hover:border-white/60 bg-white/10 backdrop-blur-md shadow-xl"
                onClick={() => {
                  const demoSection = document.getElementById('demo');
                  demoSection?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Ver demo completo
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
