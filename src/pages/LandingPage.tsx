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
  FileDown
} from 'lucide-react';
import { DemoDashboard } from '@/components/demo/DemoDashboard';
import { DemoDeadlinesPage } from '@/components/demo/DemoDeadlinesPage';
import { DemoProvider } from '@/contexts/DemoContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
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
              <div className="relative mt-8 sm:mt-12 md:mt-16 max-w-5xl mx-auto px-2 sm:px-0">
                <div className="absolute inset-0 bg-gradient-to-t from-indigo-950/50 to-transparent -z-10" />
                <div className="relative transform hover:scale-[1.01] transition-all duration-500">
                  <CalendarPreview />
                  <div className="mt-3 sm:mt-4 text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-white/10 backdrop-blur-md border-white/30 text-white hover:bg-white/20 hover:border-white/50 text-xs sm:text-sm"
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

        {/* Features Section - Rediseñado con copywriting expandido */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-3 sm:mb-4 px-4">
              <span className="bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200 bg-clip-text text-transparent">
                Todo en un vistazo
              </span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-white/90 max-w-2xl mx-auto px-4 font-medium mb-3">
              Sin complicaciones. Sin perder tiempo. Solo resultados.
            </p>
            <div className="max-w-3xl mx-auto px-4">
              <ul className="text-sm sm:text-base text-white/80 space-y-2 text-left inline-block">
                <li className="flex items-start gap-2">
                  <span className="text-indigo-300 mt-1">✓</span>
                  <span>Visualización en tiempo real de la carga del equipo</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-300 mt-1">✓</span>
                  <span>Identificación automática de sobrecargas</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-300 mt-1">✓</span>
                  <span>Interfaz visual e intuitiva desde el primer día</span>
                </li>
              </ul>
            </div>
          </div>
          
          {/* Grid con todas las funcionalidades sin repetir */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
            {/* Feature 1: Planificación Visual */}
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl blur opacity-0 group-hover:opacity-50 transition duration-300" />
              <Card className="relative h-full border-2 border-white/10 bg-white/5 backdrop-blur-xl hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-indigo-500/20">
                <CardContent className="p-5 sm:p-6 flex flex-col items-center text-center">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center mb-3 sm:mb-4 shadow-lg shadow-indigo-500/30 group-hover:scale-110 transition-transform">
                    <Calendar className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Calendario Visual</h3>
                  <ul className="text-xs sm:text-sm text-white/90 space-y-1.5 text-left">
                    <li className="flex items-start gap-1.5">
                      <span className="text-indigo-300 mt-0.5">•</span>
                      <span>Vista semanal y mensual del equipo</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-indigo-300 mt-0.5">•</span>
                      <span>Identifica sobrecargas al instante</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-indigo-300 mt-0.5">•</span>
                      <span>Horas estimadas, reales y computadas</span>
                    </li>
                  </ul>
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
                    y asegúrate de que tu equipo siempre sepa qué hacer primero y en qué orden.
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
                  <ul className="text-xs sm:text-sm text-white/90 space-y-1.5 text-left">
                    <li className="flex items-start gap-1.5">
                      <span className="text-amber-300 mt-0.5">•</span>
                      <span>Objetivos mensuales por proyecto</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-amber-300 mt-0.5">•</span>
                      <span>Compara planificado vs ejecutado</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-amber-300 mt-0.5">•</span>
                      <span>Detecta desviaciones a tiempo</span>
                    </li>
                  </ul>
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
                  <ul className="text-xs sm:text-sm text-white/90 space-y-1.5 text-left">
                    <li className="flex items-start gap-1.5">
                      <span className="text-emerald-300 mt-0.5">•</span>
                      <span>Precisión de planificación</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-emerald-300 mt-0.5">•</span>
                      <span>Índice de fiabilidad histórica</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-emerald-300 mt-0.5">•</span>
                      <span>Decisiones basadas en datos</span>
                    </li>
                  </ul>
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
                  <ul className="text-xs sm:text-sm text-white/90 space-y-1.5 text-left">
                    <li className="flex items-start gap-1.5">
                      <span className="text-blue-300 mt-0.5">•</span>
                      <span>Horarios personalizados</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-blue-300 mt-0.5">•</span>
                      <span>Gestión de ausencias y vacaciones</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-blue-300 mt-0.5">•</span>
                      <span>Objetivos profesionales individuales</span>
                    </li>
                  </ul>
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
                  <ul className="text-xs sm:text-sm text-white/90 space-y-1.5 text-left">
                    <li className="flex items-start gap-1.5">
                      <span className="text-rose-300 mt-0.5">•</span>
                      <span>Control de horas y presupuestos</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-rose-300 mt-0.5">•</span>
                      <span>Alertas de estado de salud</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-rose-300 mt-0.5">•</span>
                      <span>Métricas en tiempo real</span>
                    </li>
                  </ul>
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
                  <ul className="text-xs sm:text-sm text-white/90 space-y-1.5 text-left">
                    <li className="flex items-start gap-1.5">
                      <span className="text-violet-300 mt-0.5">•</span>
                      <span>Cierre semanal automático</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-violet-300 mt-0.5">•</span>
                      <span>Transferencias y redistribuciones</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-violet-300 mt-0.5">•</span>
                      <span>Feed completo para managers</span>
                    </li>
                  </ul>
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
                  <ul className="text-xs sm:text-sm text-white/90 space-y-1.5 text-left">
                    <li className="flex items-start gap-1.5">
                      <span className="text-yellow-300 mt-0.5">•</span>
                      <span>Notificaciones inteligentes</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-yellow-300 mt-0.5">•</span>
                      <span>Sobrecargas y bloqueos</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-yellow-300 mt-0.5">•</span>
                      <span>Decisiones proactivas</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Sección de Integraciones */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16">
          <div className="text-center mb-8 sm:mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/20 backdrop-blur-sm rounded-full text-indigo-200 text-sm font-medium mb-3 sm:mb-4 border border-indigo-400/30">
              <Plug className="h-4 w-4" />
              <span>Integraciones y exportación</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4 sm:mb-5 px-4">
              <span className="bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200 bg-clip-text text-transparent">
                Conecta con tu flujo de trabajo
              </span>
            </h2>
              <p className="text-base sm:text-lg text-white/90 max-w-2xl mx-auto px-4">
              Exporta datos, integra con tus herramientas y mantén todo sincronizado.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
            <Card className="border-2 border-indigo-500/30 bg-indigo-500/10 backdrop-blur-xl">
              <CardContent className="p-5 sm:p-6">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center mb-4">
                  <Download className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-3">Exportación de datos</h3>
                <ul className="text-white/90 text-sm space-y-1.5">
                  <li className="flex items-start gap-1.5">
                    <span className="text-indigo-300 mt-0.5">•</span>
                    <span>Exporta reportes en múltiples formatos</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-indigo-300 mt-0.5">•</span>
                    <span>Datos históricos completos</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-indigo-300 mt-0.5">•</span>
                    <span>Integra con hojas de cálculo</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 border-purple-500/30 bg-purple-500/10 backdrop-blur-xl">
              <CardContent className="p-5 sm:p-6">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4">
                  <Code className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-3">API disponible</h3>
                <ul className="text-white/90 text-sm space-y-1.5">
                  <li className="flex items-start gap-1.5">
                    <span className="text-purple-300 mt-0.5">•</span>
                    <span>API REST para integraciones personalizadas</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-purple-300 mt-0.5">•</span>
                    <span>Acceso programático a tus datos</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-purple-300 mt-0.5">•</span>
                    <span>Documentación completa incluida</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 border-blue-500/30 bg-blue-500/10 backdrop-blur-xl">
              <CardContent className="p-5 sm:p-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-4">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-3">Sincronización</h3>
                <ul className="text-white/90 text-sm space-y-1.5">
                  <li className="flex items-start gap-1.5">
                    <span className="text-blue-300 mt-0.5">•</span>
                    <span>Sincroniza con calendarios externos</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-blue-300 mt-0.5">•</span>
                    <span>Actualizaciones en tiempo real</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-blue-300 mt-0.5">•</span>
                    <span>Preparado para futuras integraciones</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sección de Problemas y Soluciones */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16">
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
                <ul className="space-y-2.5 text-white/90 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-1 shrink-0">✗</span>
                    <span>Sobrecargas detectadas demasiado tarde</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-1 shrink-0">✗</span>
                    <span>Estimaciones que no coinciden con la realidad</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-1 shrink-0">✗</span>
                    <span>Bloqueos inesperados por dependencias</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-1 shrink-0">✗</span>
                    <span>Reuniones interminables de coordinación</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-1 shrink-0">✗</span>
                    <span>Sin visibilidad de la carga del equipo</span>
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
                <ul className="space-y-2.5 text-white/90 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-1 shrink-0">✓</span>
                    <span>Visualización en tiempo real del equipo</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-1 shrink-0">✓</span>
                    <span>Comparación automática estimado vs real</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-1 shrink-0">✓</span>
                    <span>Alertas inteligentes de dependencias</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-1 shrink-0">✓</span>
                    <span>Dashboard que elimina reuniones</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-1 shrink-0">✓</span>
                    <span>Métricas para mejorar planificación</span>
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
        <div className="relative z-10 bg-gradient-to-br from-amber-950/30 via-orange-950/30 to-amber-950/30 border-y border-amber-500/20 py-8 sm:py-12 md:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 sm:mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 backdrop-blur-sm rounded-full text-amber-200 text-sm font-medium mb-3 sm:mb-4 border border-amber-400/30">
                <Target className="h-4 w-4" />
                <span>Gestión de deadlines</span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4 sm:mb-5 px-4">
                <span className="bg-gradient-to-r from-amber-200 via-orange-200 to-amber-200 bg-clip-text text-transparent">
                  Cumple tus compromisos, siempre
                </span>
              </h2>
              <div className="max-w-2xl mx-auto px-4">
                <ul className="text-sm sm:text-base text-white/90 space-y-2 text-left inline-block">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-300 mt-1">•</span>
                    <span>Objetivos realistas por proyecto y empleado</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-300 mt-1">•</span>
                    <span>Monitoreo en tiempo real del progreso</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-300 mt-1">•</span>
                    <span>Detección temprana de desviaciones</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <Card className="border-2 border-amber-500/30 bg-amber-500/10 backdrop-blur-xl">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center mb-4">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">Objetivos mensuales</h3>
                  <ul className="text-white/90 text-sm space-y-1.5">
                    <li className="flex items-start gap-1.5">
                      <span className="text-amber-300 mt-0.5">•</span>
                      <span>Horas por proyecto y empleado</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-amber-300 mt-0.5">•</span>
                      <span>Visualización de distribución</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-amber-300 mt-0.5">•</span>
                      <span>Objetivos alcanzables</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-2 border-amber-500/30 bg-amber-500/10 backdrop-blur-xl">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center mb-4">
                    <Activity className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">Coherencia de planificación</h3>
                  <ul className="text-white/90 text-sm space-y-1.5">
                    <li className="flex items-start gap-1.5">
                      <span className="text-amber-300 mt-0.5">•</span>
                      <span>Compara planificado vs ejecutado</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-amber-300 mt-0.5">•</span>
                      <span>Identifica patrones y mejora estimaciones</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-amber-300 mt-0.5">•</span>
                      <span>Mantén coherencia prometido-entregado</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-2 border-amber-500/30 bg-amber-500/10 backdrop-blur-xl">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center mb-4">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">Sugerencias inteligentes</h3>
                  <ul className="text-white/90 text-sm space-y-1.5">
                    <li className="flex items-start gap-1.5">
                      <span className="text-amber-300 mt-0.5">•</span>
                      <span>Redistribución automática de horas</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-amber-300 mt-0.5">•</span>
                      <span>Optimiza carga del equipo</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-amber-300 mt-0.5">•</span>
                      <span>Maximiza productividad equilibrada</span>
                    </li>
                  </ul>
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

        {/* Sección de Seguridad y Privacidad */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16">
          <div className="text-center mb-8 sm:mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 backdrop-blur-sm rounded-full text-emerald-200 text-sm font-medium mb-3 sm:mb-4 border border-emerald-400/30">
              <Shield className="h-4 w-4" />
              <span>Seguridad y privacidad</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4 sm:mb-5 px-4">
              <span className="bg-gradient-to-r from-emerald-200 via-teal-200 to-emerald-200 bg-clip-text text-transparent">
                Tus datos están protegidos
              </span>
            </h2>
            <p className="text-base sm:text-lg text-white/90 max-w-2xl mx-auto px-4">
              Cumplimos con los más altos estándares de seguridad y privacidad.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6 mb-8">
            <Card className="border-2 border-emerald-500/30 bg-emerald-500/10 backdrop-blur-xl">
              <CardContent className="p-5 sm:p-6">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center mb-4">
                  <Lock className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-3">Encriptación de datos</h3>
                <ul className="text-white/90 text-sm space-y-1.5">
                  <li className="flex items-start gap-1.5">
                    <span className="text-emerald-300 mt-0.5">•</span>
                    <span>Datos encriptados en tránsito y en reposo</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-emerald-300 mt-0.5">•</span>
                    <span>Protocolos de seguridad avanzados</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-emerald-300 mt-0.5">•</span>
                    <span>Certificaciones de seguridad</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 border-emerald-500/30 bg-emerald-500/10 backdrop-blur-xl">
              <CardContent className="p-5 sm:p-6">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-3">Cumplimiento GDPR</h3>
                <ul className="text-white/90 text-sm space-y-1.5">
                  <li className="flex items-start gap-1.5">
                    <span className="text-emerald-300 mt-0.5">•</span>
                    <span>Totalmente compatible con GDPR</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-emerald-300 mt-0.5">•</span>
                    <span>Control total sobre tus datos</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-emerald-300 mt-0.5">•</span>
                    <span>Derecho al olvido garantizado</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 border-emerald-500/30 bg-emerald-500/10 backdrop-blur-xl">
              <CardContent className="p-5 sm:p-6">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center mb-4">
                  <Database className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-3">Control de acceso</h3>
                <ul className="text-white/90 text-sm space-y-1.5">
                  <li className="flex items-start gap-1.5">
                    <span className="text-emerald-300 mt-0.5">•</span>
                    <span>Permisos granulares por usuario</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-emerald-300 mt-0.5">•</span>
                    <span>Autenticación segura</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-emerald-300 mt-0.5">•</span>
                    <span>Respaldo automático de datos</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <Button
              size="lg"
              variant="outline"
              className="bg-emerald-500/10 border-2 border-emerald-400/30 text-white hover:bg-emerald-500/20 hover:border-emerald-400/50 px-8 py-6 text-lg font-semibold backdrop-blur-md"
              onClick={() => {
                const demoSection = document.getElementById('demo');
                demoSection?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Más información sobre seguridad
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
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
                Navega por tu dashboard, gestiona deadlines mensuales, visualiza dependencias 
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

        {/* Casos de uso y beneficios */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-6 px-4">
              <span className="bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200 bg-clip-text text-transparent">
                Para equipos que valoran su tiempo
              </span>
            </h2>
            <div className="max-w-2xl mx-auto px-4">
              <ul className="text-sm sm:text-base text-white/90 space-y-2 text-left inline-block">
                <li className="flex items-start gap-2">
                  <span className="text-indigo-300 mt-1">•</span>
                  <span>Equipos de marketing digital</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-300 mt-1">•</span>
                  <span>Desarrolladores y diseñadores</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-300 mt-1">•</span>
                  <span>Cualquier equipo que coordine trabajo</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <Card className="border-2 border-indigo-500/30 bg-indigo-500/10 backdrop-blur-xl">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-white" />
                </div>
                  <h3 className="text-xl font-bold text-white mb-3">Para líderes de equipo</h3>
                  <ul className="text-white/90 text-sm space-y-2">
                    <li className="flex items-start gap-1.5">
                      <span className="text-indigo-300 mt-0.5">•</span>
                      <span>Decisiones informadas sobre distribución</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-indigo-300 mt-0.5">•</span>
                      <span>Identifica quién necesita ayuda</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-indigo-300 mt-0.5">•</span>
                      <span>Reduce reuniones en un 70%</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-indigo-300 mt-0.5">•</span>
                      <span>Alertas automáticas de sobrecarga</span>
                    </li>
                  </ul>
              </CardContent>
            </Card>

            <Card className="border-2 border-purple-500/30 bg-purple-500/10 backdrop-blur-xl">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4">
                  <Target className="h-6 w-6 text-white" />
                </div>
                  <h3 className="text-xl font-bold text-white mb-3">Para project managers</h3>
                  <ul className="text-white/90 text-sm space-y-2">
                    <li className="flex items-start gap-1.5">
                      <span className="text-purple-300 mt-0.5">•</span>
                      <span>Gestión de múltiples proyectos</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-purple-300 mt-0.5">•</span>
                      <span>Visualiza dependencias y cuellos de botella</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-purple-300 mt-0.5">•</span>
                      <span>Control de presupuestos y horas</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-purple-300 mt-0.5">•</span>
                      <span>Seguimiento de deadlines</span>
                    </li>
                  </ul>
              </CardContent>
            </Card>

            <Card className="border-2 border-emerald-500/30 bg-emerald-500/10 backdrop-blur-xl">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                  <h3 className="text-xl font-bold text-white mb-3">Para empleados</h3>
                  <ul className="text-white/90 text-sm space-y-2">
                    <li className="flex items-start gap-1.5">
                      <span className="text-emerald-300 mt-0.5">•</span>
                      <span>Vista clara de tu carga de trabajo</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-emerald-300 mt-0.5">•</span>
                      <span>Priorización automática de tareas</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-emerald-300 mt-0.5">•</span>
                      <span>Seguimiento de tu progreso</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-emerald-300 mt-0.5">•</span>
                      <span>Sabes qué hacer y cuándo</span>
                    </li>
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
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/20 backdrop-blur-sm rounded-full text-indigo-200 text-sm font-medium mb-3 sm:mb-4 border border-indigo-400/30">
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
                    También puedes exportar datos en múltiples formatos para trabajar con hojas de cálculo u otros sistemas. 
                    Además, estamos trabajando en integraciones nativas con herramientas populares.
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

                <AccordionItem value="item-6" className="border-b-0">
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
              {' '}tu equipo?
            </h2>
              <p className="text-lg sm:text-xl md:text-2xl text-indigo-100 mb-8 sm:mb-10 font-light max-w-2xl mx-auto">
              Accede ahora y descubre cómo gestionar el tiempo de tu equipo de forma inteligente.
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
                Ver demo completa
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
