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
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 rounded-full text-indigo-700 text-sm font-medium mb-8">
                <Sparkles className="h-4 w-4" />
                <span>Plataforma de Gestión de Recursos</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-slate-900 mb-6 leading-tight">
                Gestiona tu equipo
                <br />
                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  de forma inteligente
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-slate-600 mb-12 max-w-3xl mx-auto leading-relaxed">
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
                  className="px-8 py-6 text-lg border-2"
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
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Todo lo que necesitas en un solo lugar
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Funcionalidades diseñadas para optimizar la gestión de recursos y mejorar la productividad del equipo
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-2 hover:border-indigo-300 transition-all hover:shadow-lg">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                  <Calendar className="h-6 w-6 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Planificación Visual</h3>
                <p className="text-slate-600">
                  Visualiza la carga de trabajo de tu equipo en un calendario interactivo. Identifica sobrecargas y optimiza la distribución.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-indigo-300 transition-all hover:shadow-lg">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Gestión de Equipo</h3>
                <p className="text-slate-600">
                  Administra empleados, horarios, ausencias y objetivos. Todo centralizado para una gestión eficiente.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-indigo-300 transition-all hover:shadow-lg">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Reportes y Métricas</h3>
                <p className="text-slate-600">
                  Analiza el rendimiento con reportes detallados. Toma decisiones basadas en datos reales.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-indigo-300 transition-all hover:shadow-lg">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-4">
                  <Target className="h-6 w-6 text-amber-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Gestión de Proyectos</h3>
                <p className="text-slate-600">
                  Controla horas contratadas, planificadas y computadas. Mantén el control total de tus proyectos.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-indigo-300 transition-all hover:shadow-lg">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Dependencias</h3>
                <p className="text-slate-600">
                  Gestiona dependencias entre tareas. Identifica bloqueos y optimiza el flujo de trabajo.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-indigo-300 transition-all hover:shadow-lg">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-rose-100 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-rose-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Análisis Predictivo</h3>
                <p className="text-slate-600">
                  Predice sobrecargas y optimiza la distribución de trabajo antes de que sea un problema.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Demo Section */}
        <div id="demo" className="bg-white border-t border-slate-200 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 rounded-full text-indigo-700 text-sm font-medium mb-4">
                <Award className="h-4 w-4" />
                <span>Demo Interactivo</span>
              </div>
              <h2 className="text-4xl font-bold text-slate-900 mb-4">
                Explora la plataforma
              </h2>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                Descubre cómo funciona nuestra plataforma con datos de ejemplo. 
                Explora diferentes escenarios: equipos equilibrados, sobrecargas y optimizaciones.
              </p>
            </div>
            
            <div className="bg-slate-50 rounded-2xl p-8 border-2 border-slate-200 shadow-xl">
              <DemoDashboard />
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
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
