import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Helmet } from 'react-helmet-async';

export default function LandingPage() {
  return (
    <>
      <Helmet>
        <title>Timeboxing - Gestión de Recursos y Planificación</title>
        <meta name="description" content="Plataforma de gestión de recursos y planificación para equipos SEO. Visualiza, planifica y optimiza el trabajo de tu equipo." />
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-indigo-900">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.1),transparent_50%)] -z-10" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(168,85,247,0.1),transparent_50%)] -z-10" />
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 md:pt-20 pb-12 sm:pb-16">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-indigo-500/20 backdrop-blur-sm rounded-full text-indigo-200 text-xs sm:text-sm font-medium mb-6 sm:mb-8 border border-indigo-400/30">
                <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="whitespace-nowrap">Plataforma de Gestión de Recursos</span>
              </div>
              
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-4 sm:mb-6 leading-tight px-2">
                Gestiona tu equipo
                <br />
                <span className="bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">
                  de forma inteligente
                </span>
              </h1>
              
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-indigo-100 mb-8 sm:mb-12 max-w-3xl mx-auto leading-relaxed px-4">
                Visualiza, planifica y optimiza el trabajo de tu equipo con nuestra plataforma de gestión de recursos.
                Toma decisiones basadas en datos y mejora la productividad.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-4">
                <Link to="/login" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg shadow-lg hover:shadow-xl transition-all">
                    Acceder al Dashboard
                    <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </Link>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="w-full sm:w-auto px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg border-2 border-indigo-400/50 text-indigo-200 hover:bg-indigo-500/20 hover:border-indigo-400 bg-indigo-500/10 backdrop-blur-sm"
                  onClick={() => {
                    const demoSection = document.getElementById('demo');
                    demoSection?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Ver Demo
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20">
          <div className="text-center mb-10 sm:mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4 px-4">
              Todo lo que necesitas en un solo lugar
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-indigo-200 max-w-2xl mx-auto px-4">
              Funcionalidades diseñadas para optimizar la gestión de recursos y mejorar la productividad del equipo
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            <Card className="border-2 border-indigo-500/30 bg-indigo-900/30 backdrop-blur-sm hover:border-indigo-400/50 transition-all hover:shadow-xl hover:shadow-indigo-500/20">
              <CardContent className="p-4 sm:p-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-500/20 rounded-lg flex items-center justify-center mb-3 sm:mb-4 border border-indigo-400/30">
                  <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-300" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Planificación Visual</h3>
                <p className="text-sm sm:text-base text-indigo-200">
                  Visualiza la carga de trabajo de tu equipo en un calendario interactivo. Identifica sobrecargas y optimiza la distribución.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-purple-500/30 bg-purple-900/30 backdrop-blur-sm hover:border-purple-400/50 transition-all hover:shadow-xl hover:shadow-purple-500/20">
              <CardContent className="p-4 sm:p-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-3 sm:mb-4 border border-purple-400/30">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 text-purple-300" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Gestión de Equipo</h3>
                <p className="text-sm sm:text-base text-indigo-200">
                  Administra empleados, horarios, ausencias y objetivos. Todo centralizado para una gestión eficiente.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-indigo-500/30 bg-indigo-900/30 backdrop-blur-sm hover:border-indigo-400/50 transition-all hover:shadow-xl hover:shadow-indigo-500/20">
              <CardContent className="p-4 sm:p-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-500/20 rounded-lg flex items-center justify-center mb-3 sm:mb-4 border border-indigo-400/30">
                  <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-300" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Reportes y Métricas</h3>
                <p className="text-sm sm:text-base text-indigo-200">
                  Analiza el rendimiento con reportes detallados. Toma decisiones basadas en datos reales.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-purple-500/30 bg-purple-900/30 backdrop-blur-sm hover:border-purple-400/50 transition-all hover:shadow-xl hover:shadow-purple-500/20">
              <CardContent className="p-4 sm:p-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-3 sm:mb-4 border border-purple-400/30">
                  <Target className="h-5 w-5 sm:h-6 sm:w-6 text-purple-300" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Gestión de Proyectos</h3>
                <p className="text-sm sm:text-base text-indigo-200">
                  Controla horas contratadas, planificadas y computadas. Mantén el control total de tus proyectos.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-indigo-500/30 bg-indigo-900/30 backdrop-blur-sm hover:border-indigo-400/50 transition-all hover:shadow-xl hover:shadow-indigo-500/20">
              <CardContent className="p-4 sm:p-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-500/20 rounded-lg flex items-center justify-center mb-3 sm:mb-4 border border-indigo-400/30">
                  <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-300" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Dependencias</h3>
                <p className="text-sm sm:text-base text-indigo-200">
                  Gestiona dependencias entre tareas. Identifica bloqueos y optimiza el flujo de trabajo.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-purple-500/30 bg-purple-900/30 backdrop-blur-sm hover:border-purple-400/50 transition-all hover:shadow-xl hover:shadow-purple-500/20">
              <CardContent className="p-4 sm:p-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-3 sm:mb-4 border border-purple-400/30">
                  <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-purple-300" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Análisis Predictivo</h3>
                <p className="text-sm sm:text-base text-indigo-200">
                  Predice sobrecargas y optimiza la distribución de trabajo antes de que sea un problema.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-indigo-500/30 bg-indigo-900/30 backdrop-blur-sm hover:border-indigo-400/50 transition-all hover:shadow-xl hover:shadow-indigo-500/20">
              <CardContent className="p-4 sm:p-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-500/20 rounded-lg flex items-center justify-center mb-3 sm:mb-4 border border-indigo-400/30">
                  <Link2 className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-300" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Gestión de Dependencias</h3>
                <p className="text-sm sm:text-base text-indigo-200">
                  Visualiza y gestiona dependencias entre tareas. Identifica bloqueos y coordina el trabajo del equipo.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-purple-500/30 bg-purple-900/30 backdrop-blur-sm hover:border-purple-400/50 transition-all hover:shadow-xl hover:shadow-purple-500/20">
              <CardContent className="p-4 sm:p-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-3 sm:mb-4 border border-purple-400/30">
                  <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-purple-300" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Deadlines y Coherencia</h3>
                <p className="text-sm sm:text-base text-indigo-200">
                  Establece deadlines por proyecto y detecta inconsistencias en la planificación del equipo.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-indigo-500/30 bg-indigo-900/30 backdrop-blur-sm hover:border-indigo-400/50 transition-all hover:shadow-xl hover:shadow-indigo-500/20">
              <CardContent className="p-4 sm:p-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-500/20 rounded-lg flex items-center justify-center mb-3 sm:mb-4 border border-indigo-400/30">
                  <Gauge className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-300" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Precisión de Planificación</h3>
                <p className="text-sm sm:text-base text-indigo-200">
                  Analiza la precisión entre horas planificadas y reales. Mejora tus estimaciones con datos históricos.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-purple-500/30 bg-purple-900/30 backdrop-blur-sm hover:border-purple-400/50 transition-all hover:shadow-xl hover:shadow-purple-500/20">
              <CardContent className="p-4 sm:p-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-3 sm:mb-4 border border-purple-400/30">
                  <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-purple-300" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Weekly Reports</h3>
                <p className="text-sm sm:text-base text-indigo-200">
                  Sistema de reportes semanales para registrar bloqueos, redistribuciones y feedback del equipo.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-indigo-500/30 bg-indigo-900/30 backdrop-blur-sm hover:border-indigo-400/50 transition-all hover:shadow-xl hover:shadow-indigo-500/20">
              <CardContent className="p-4 sm:p-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-500/20 rounded-lg flex items-center justify-center mb-3 sm:mb-4 border border-indigo-400/30">
                  <Activity className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-300" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Análisis de Carga</h3>
                <p className="text-sm sm:text-base text-indigo-200">
                  Monitorea la carga de trabajo en tiempo real. Identifica sobrecargas y redistribuye tareas automáticamente.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-purple-500/30 bg-purple-900/30 backdrop-blur-sm hover:border-purple-400/50 transition-all hover:shadow-xl hover:shadow-purple-500/20">
              <CardContent className="p-4 sm:p-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-3 sm:mb-4 border border-purple-400/30">
                  <Bell className="h-5 w-5 sm:h-6 sm:w-6 text-purple-300" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Alertas Inteligentes</h3>
                <p className="text-sm sm:text-base text-indigo-200">
                  Recibe notificaciones sobre sobrecargas, dependencias bloqueadas y tareas pendientes.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-indigo-500/30 bg-indigo-900/30 backdrop-blur-sm hover:border-indigo-400/50 transition-all hover:shadow-xl hover:shadow-indigo-500/20">
              <CardContent className="p-4 sm:p-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-500/20 rounded-lg flex items-center justify-center mb-3 sm:mb-4 border border-indigo-400/30">
                  <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-300" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Control de Accesos</h3>
                <p className="text-sm sm:text-base text-indigo-200">
                  Sistema de permisos granular. Cada empleado ve solo lo que necesita para su trabajo.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-purple-500/30 bg-purple-900/30 backdrop-blur-sm hover:border-purple-400/50 transition-all hover:shadow-xl hover:shadow-purple-500/20">
              <CardContent className="p-4 sm:p-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-3 sm:mb-4 border border-purple-400/30">
                  <GitBranch className="h-5 w-5 sm:h-6 sm:w-6 text-purple-300" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Transferencias de Horas</h3>
                <p className="text-sm sm:text-base text-indigo-200">
                  Transfiere y redistribuye horas entre proyectos y empleados de forma flexible y controlada.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Demo Section */}
        <div id="demo" className="bg-white/5 backdrop-blur-sm border-t border-indigo-500/20 py-12 sm:py-16 md:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 sm:mb-10 md:mb-12">
              <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-indigo-500/20 backdrop-blur-sm rounded-full text-indigo-200 text-xs sm:text-sm font-medium mb-3 sm:mb-4 border border-indigo-400/30">
                <Award className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>Demo Interactivo</span>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4 px-4">
                Explora la plataforma
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-indigo-200 max-w-2xl mx-auto px-4">
                Descubre cómo funciona nuestra plataforma con datos de ejemplo. 
                Explora diferentes escenarios: equipos equilibrados, sobrecargas y optimizaciones.
              </p>
            </div>
            
            <div className="bg-white rounded-xl sm:rounded-2xl border-2 border-indigo-200/50 shadow-2xl overflow-hidden">
              <Tabs defaultValue="dashboard" className="w-full">
                <TabsList className="w-full justify-start h-auto p-1 bg-indigo-50/50 border-b border-indigo-200/50 rounded-none rounded-t-xl">
                  <TabsTrigger value="dashboard" className="data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs sm:text-sm">
                    Dashboard
                  </TabsTrigger>
                  <TabsTrigger value="deadlines" className="data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs sm:text-sm">
                    Deadlines
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="dashboard" className="m-0 p-3 sm:p-4 md:p-6">
                  <DemoDashboard />
                </TabsContent>
                <TabsContent value="deadlines" className="m-0 p-0">
                  <DemoDeadlinesPage />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 py-12 sm:py-16 md:py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_70%)] -z-10" />
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
              ¿Listo para optimizar tu equipo?
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-indigo-100 mb-6 sm:mb-8">
              Accede a tu dashboard y comienza a gestionar tus recursos de forma inteligente.
            </p>
            <Link to="/login" className="inline-block">
              <Button size="lg" className="w-full sm:w-auto bg-white text-indigo-600 hover:bg-slate-100 px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg shadow-lg hover:shadow-xl transition-all">
                Acceder al Dashboard
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
