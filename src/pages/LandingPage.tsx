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
import { DemoProvider } from '@/contexts/DemoContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Helmet } from 'react-helmet-async';

export default function LandingPage() {
  return (
    <>
      <Helmet>
        <title>Timeboxing - Gestión de Recursos y Planificación</title>
        <meta name="description" content="Plataforma de gestión de recursos y planificación para equipos SEO. Visualiza, planifica y optimiza el trabajo de tu equipo." />
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-indigo-900 relative overflow-hidden">
        {/* Efectos de fondo animados */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-indigo-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '2s' }} />
        </div>
        
        {/* Hero Section */}
        <div className="relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 md:pt-28 pb-16 sm:pb-20 md:pb-28">
            <div className="text-center relative">
              {/* Badge animado */}
              <div className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-indigo-500/30 via-purple-500/30 to-indigo-500/30 backdrop-blur-md rounded-full text-indigo-100 text-sm sm:text-base font-semibold mb-8 sm:mb-12 border border-indigo-400/40 shadow-lg shadow-indigo-500/20 animate-fade-in">
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 animate-spin-slow" />
                <span className="whitespace-nowrap">Tu equipo, tu tiempo, tu control</span>
              </div>
              
              {/* Título principal con efecto */}
              <div className="relative mb-6 sm:mb-8">
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black text-white mb-2 sm:mb-4 leading-[1.1] tracking-tight">
                  <span className="block">El tiempo de tu</span>
                  <span className="block bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
                    equipo visualizado
                  </span>
                </h1>
                <div className="absolute -inset-4 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 blur-2xl opacity-50 -z-10" />
              </div>
              
              {/* Descripción más impactante */}
              <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-indigo-100/90 mb-10 sm:mb-14 max-w-4xl mx-auto leading-relaxed font-light px-4">
                No más hojas de cálculo. No más adivinanzas.
                <br className="hidden sm:block" />
                <span className="text-indigo-200 font-medium">Ve quién hace qué, cuándo y por qué.</span>
              </p>
              
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

              {/* Preview visual mejorado - Calendario semanal */}
              <div className="relative mt-12 sm:mt-16">
                <div className="absolute inset-0 bg-gradient-to-t from-indigo-950/50 to-transparent -z-10" />
                <div className="relative bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/20 p-6 sm:p-8 md:p-10 shadow-2xl transform hover:scale-[1.01] transition-transform duration-500">
                  <div className="mb-4">
                    <h3 className="text-sm sm:text-base font-semibold text-white/90 mb-2 text-center">
                      Vista previa del calendario
                    </h3>
                    <p className="text-xs sm:text-sm text-indigo-200/70 text-center">
                      Semana del equipo en tiempo real
                    </p>
                  </div>
                  <div className="grid grid-cols-5 gap-2 sm:gap-3">
                    {['L', 'M', 'X', 'J', 'V'].map((day, i) => (
                      <div key={day} className="flex flex-col items-center gap-2">
                        <div className="text-[10px] sm:text-xs font-bold text-indigo-300/70 uppercase">
                          {day}
                        </div>
                        <div className="w-full aspect-square bg-gradient-to-br from-indigo-500/30 via-purple-500/30 to-indigo-500/30 rounded-lg border border-indigo-400/40 flex flex-col items-center justify-center backdrop-blur-sm relative overflow-hidden group">
                          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="text-[10px] sm:text-xs font-bold text-white relative z-10">
                            {[8, 6, 7, 8, 5][i]}h
                          </div>
                          <div className="absolute bottom-1 left-1 right-1 h-1 bg-white/20 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full"
                              style={{ width: `${[100, 75, 87, 100, 62][i]}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section - Rediseñado */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 md:py-28">
          <div className="text-center mb-12 sm:mb-16 md:mb-20">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 sm:mb-6 px-4">
              <span className="bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200 bg-clip-text text-transparent">
                Todo en un vistazo
              </span>
            </h2>
            <p className="text-lg sm:text-xl md:text-2xl text-indigo-200/80 max-w-3xl mx-auto px-4 font-light">
              Sin complicaciones. Sin perder tiempo. Solo resultados.
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
                    Carga de trabajo del equipo en tiempo real
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
                    Gestiona bloqueos entre tareas
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
                    Objetivos mensuales y coherencia
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
                    Precisión, balance y fiabilidad
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
                    Horarios, ausencias y objetivos
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
                    Control de horas y presupuestos
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
                    Bloqueos y redistribuciones
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
                    Notificaciones inteligentes
                  </p>
                </CardContent>
              </Card>
            </div>
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
              <DemoProvider>
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
              </DemoProvider>
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
