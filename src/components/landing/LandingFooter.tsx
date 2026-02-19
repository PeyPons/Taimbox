import { Link } from 'react-router-dom';
import { Calendar, FileText, Code, HelpCircle, Mail, BookOpen, PlayCircle, LayoutDashboard, CalendarRange, Users, BarChart3, FolderKanban, Plug } from 'lucide-react';

export function LandingFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative z-10 border-t border-white/10 bg-indigo-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="inline-flex items-center gap-2 text-white font-bold text-lg hover:text-indigo-200 transition-colors">
              <Calendar className="h-6 w-6 text-indigo-400" />
              Timeboxing
            </Link>
            <p className="mt-3 text-sm text-indigo-200/80 max-w-xs">
              Sistema operativo financiero basado en tiempo para agencias. Gestiona el tiempo, no solo las tareas.
            </p>
          </div>

          {/* Producto */}
          <div>
            <h4 className="text-white font-semibold mb-4">Producto</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/por-que-timeboxing" className="text-sm text-indigo-200/80 hover:text-white flex items-center gap-2 transition-colors">
                  <BookOpen className="h-4 w-4" />
                  Por qué Timeboxing
                </Link>
              </li>
              <li>
                <Link to="/dashboard-empleado" className="text-sm text-indigo-200/80 hover:text-white flex items-center gap-2 transition-colors">
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard del Empleado
                </Link>
              </li>
              <li>
                <Link to="/planificador-recursos" className="text-sm text-indigo-200/80 hover:text-white flex items-center gap-2 transition-colors">
                  <CalendarRange className="h-4 w-4" />
                  Planificador de Recursos
                </Link>
              </li>
              <li>
                <Link to="/gestion-equipos" className="text-sm text-indigo-200/80 hover:text-white flex items-center gap-2 transition-colors">
                  <Users className="h-4 w-4" />
                  Gestión de Equipos
                </Link>
              </li>
              <li>
                <Link to="/reportes-rentabilidad" className="text-sm text-indigo-200/80 hover:text-white flex items-center gap-2 transition-colors">
                  <BarChart3 className="h-4 w-4" />
                  Reportes y Rentabilidad
                </Link>
              </li>
              <li>
                <Link to="/control-proyectos" className="text-sm text-indigo-200/80 hover:text-white flex items-center gap-2 transition-colors">
                  <FolderKanban className="h-4 w-4" />
                  Proyectos y Deadlines
                </Link>
              </li>
              <li>
                <Link to="/integraciones" className="text-sm text-indigo-200/80 hover:text-white flex items-center gap-2 transition-colors">
                  <Plug className="h-4 w-4" />
                  Integraciones
                </Link>
              </li>
              <li>
                <Link to="/guia" className="text-sm text-indigo-200/80 hover:text-white flex items-center gap-2 transition-colors">
                  <FileText className="h-4 w-4" />
                  Guía de funcionalidades
                </Link>
              </li>
              <li>
                <Link to="/api-docs" className="text-sm text-indigo-200/80 hover:text-white flex items-center gap-2 transition-colors">
                  <Code className="h-4 w-4" />
                  Documentación API
                </Link>
              </li>
              <li>
                <Link to="/#demo" className="text-sm text-indigo-200/80 hover:text-white flex items-center gap-2 transition-colors">
                  <PlayCircle className="h-4 w-4" />
                  Demo interactiva
                </Link>
              </li>
            </ul>
          </div>

          {/* Soporte */}
          <div>
            <h4 className="text-white font-semibold mb-4">Soporte</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/soporte" className="text-sm text-indigo-200/80 hover:text-white flex items-center gap-2 transition-colors">
                  <HelpCircle className="h-4 w-4" />
                  Contactar soporte
                </Link>
              </li>
              <li>
                <a href="mailto:soporte@timeboxing.app" className="text-sm text-indigo-200/80 hover:text-white flex items-center gap-2 transition-colors">
                  <Mail className="h-4 w-4" />
                  Correo
                </a>
              </li>
            </ul>
          </div>

          {/* CTA */}
          <div>
            <h4 className="text-white font-semibold mb-4">Acceso</h4>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-sm font-semibold rounded-xl transition-all shadow-lg"
            >
              Iniciar sesión
            </Link>
            <p className="mt-3 text-xs text-indigo-200/60">
              Prueba gratuita. Sin tarjeta de crédito.
            </p>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-indigo-200/60">
            © {currentYear} Timeboxing. Todos los derechos reservados.
          </p>
          <div className="flex gap-6 text-sm text-indigo-200/60">
            <Link to="/api-docs" className="hover:text-white flex items-center gap-1.5 transition-colors">
              <Code className="h-4 w-4" />
              API
            </Link>
            <Link to="/guia" className="hover:text-white flex items-center gap-1.5 transition-colors">
              <FileText className="h-4 w-4" />
              Guía
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
