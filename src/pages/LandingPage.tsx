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
  Sparkles
} from 'lucide-react';
import { DemoDashboard } from '@/components/demo/DemoDashboard';
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
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/20 backdrop-blur-sm rounded-full text-indigo-200 text-sm font-medium mb-8 border border-indigo-400/30">
                <Sparkles className="h-4 w-4" />
                <span>Plataforma de Gestión de Recursos</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                Gestiona tu equipo
                <br />
                <span className="bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">
                  de forma inteligente
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-indigo-100 mb-12 max-w-3xl mx-auto leading-relaxed">
                Visualiza, planifica y optimiza el trabajo de tu equipo con nuestra plataforma de gestión de recursos.
                Toma decisiones basadas en datos y mejora la productividad.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link to="/login">
                  <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all">
                    Acceder al Dashboard
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="px-8 py-6 text-lg border-2 border-indigo-400/50 text-indigo-200 hover:bg-indigo-500/20 hover:border-indigo-400 bg-indigo-500/10 backdrop-blur-sm"
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Todo lo que necesitas en un solo lugar
            </h2>
            <p className="text-xl text-indigo-200 max-w-2xl mx-auto">
              Funcionalidades diseñadas para optimizar la gestión de recursos y mejorar la productividad del equipo
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-2 border-indigo-500/30 bg-indigo-900/30 backdrop-blur-sm hover:border-indigo-400/50 transition-all hover:shadow-xl hover:shadow-indigo-500/20">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-indigo-500/20 rounded-lg flex items-center justify-center mb-4 border border-indigo-400/30">
                  <Calendar className="h-6 w-6 text-indigo-300" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Planificación Visual</h3>
                <p className="text-indigo-200">
                  Visualiza la carga de trabajo de tu equipo en un calendario interactivo. Identifica sobrecargas y optimiza la distribución.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-purple-500/30 bg-purple-900/30 backdrop-blur-sm hover:border-purple-400/50 transition-all hover:shadow-xl hover:shadow-purple-500/20">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4 border border-purple-400/30">
                  <Users className="h-6 w-6 text-purple-300" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Gestión de Equipo</h3>
                <p className="text-indigo-200">
                  Administra empleados, horarios, ausencias y objetivos. Todo centralizado para una gestión eficiente.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-indigo-500/30 bg-indigo-900/30 backdrop-blur-sm hover:border-indigo-400/50 transition-all hover:shadow-xl hover:shadow-indigo-500/20">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-indigo-500/20 rounded-lg flex items-center justify-center mb-4 border border-indigo-400/30">
                  <BarChart3 className="h-6 w-6 text-indigo-300" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Reportes y Métricas</h3>
                <p className="text-indigo-200">
                  Analiza el rendimiento con reportes detallados. Toma decisiones basadas en datos reales.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-purple-500/30 bg-purple-900/30 backdrop-blur-sm hover:border-purple-400/50 transition-all hover:shadow-xl hover:shadow-purple-500/20">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4 border border-purple-400/30">
                  <Target className="h-6 w-6 text-purple-300" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Gestión de Proyectos</h3>
                <p className="text-indigo-200">
                  Controla horas contratadas, planificadas y computadas. Mantén el control total de tus proyectos.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-indigo-500/30 bg-indigo-900/30 backdrop-blur-sm hover:border-indigo-400/50 transition-all hover:shadow-xl hover:shadow-indigo-500/20">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-indigo-500/20 rounded-lg flex items-center justify-center mb-4 border border-indigo-400/30">
                  <Zap className="h-6 w-6 text-indigo-300" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Dependencias</h3>
                <p className="text-indigo-200">
                  Gestiona dependencias entre tareas. Identifica bloqueos y optimiza el flujo de trabajo.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-purple-500/30 bg-purple-900/30 backdrop-blur-sm hover:border-purple-400/50 transition-all hover:shadow-xl hover:shadow-purple-500/20">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4 border border-purple-400/30">
                  <TrendingUp className="h-6 w-6 text-purple-300" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Análisis Predictivo</h3>
                <p className="text-indigo-200">
                  Predice sobrecargas y optimiza la distribución de trabajo antes de que sea un problema.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Demo Section */}
        <div id="demo" className="bg-white/5 backdrop-blur-sm border-t border-indigo-500/20 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/20 backdrop-blur-sm rounded-full text-indigo-200 text-sm font-medium mb-4 border border-indigo-400/30">
                <Award className="h-4 w-4" />
                <span>Demo Interactivo</span>
              </div>
              <h2 className="text-4xl font-bold text-white mb-4">
                Explora la plataforma
              </h2>
              <p className="text-xl text-indigo-200 max-w-2xl mx-auto">
                Descubre cómo funciona nuestra plataforma con datos de ejemplo. 
                Explora diferentes escenarios: equipos equilibrados, sobrecargas y optimizaciones.
              </p>
            </div>
            
            <div className="bg-white rounded-2xl p-6 border-2 border-indigo-200/50 shadow-2xl">
              <DemoDashboard />
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_70%)] -z-10" />
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <h2 className="text-4xl font-bold text-white mb-4">
              ¿Listo para optimizar tu equipo?
            </h2>
            <p className="text-xl text-indigo-100 mb-8">
              Accede a tu dashboard y comienza a gestionar tus recursos de forma inteligente.
            </p>
            <Link to="/login">
              <Button size="lg" className="bg-white text-indigo-600 hover:bg-slate-100 px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all">
                Acceder al Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
