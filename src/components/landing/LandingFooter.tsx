import { Link } from 'react-router-dom';
import { Calendar, FileText, Code, HelpCircle, Mail, BookOpen, PlayCircle, LayoutDashboard, CalendarRange, Users, BarChart3, FolderKanban, Plug, Presentation, Shield, Scale } from 'lucide-react';

export function LandingFooter() {
  const currentYear = new Date().getFullYear();

  const linkClass = 'text-sm text-indigo-200/80 hover:text-white flex items-center gap-2 transition-colors';
  return (
    <footer className="relative z-10 border-t border-white/10 bg-indigo-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="inline-flex items-center gap-2 text-white font-bold text-lg hover:text-indigo-200 transition-colors">
              <Calendar className="h-5 w-5 text-indigo-400" />
              Taimbox
            </Link>
            <p className="mt-2 text-xs text-indigo-200/80 max-w-xs leading-snug">
              Sistema operativo financiero basado en tiempo para agencias. Gestiona el tiempo, no solo las tareas.
            </p>
          </div>

          {/* Producto: 2 columnas internas para no alargar */}
          <div className="lg:col-span-1">
            <h4 className="text-white font-semibold text-sm mb-3">Producto</h4>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
              <li><Link to="/precios" className={linkClass}>Precios</Link></li>
              <li><Link to="/pitch" className={linkClass}><Presentation className="h-3.5 w-3.5 shrink-0" /> ROI (3 min)</Link></li>
              <li><Link to="/por-que-timeboxing" className={linkClass}><BookOpen className="h-3.5 w-3.5 shrink-0" /> Por qué</Link></li>
              <li><Link to="/dashboard-empleado" className={linkClass}><LayoutDashboard className="h-3.5 w-3.5 shrink-0" /> Dashboard</Link></li>
              <li><Link to="/planificador-recursos" className={linkClass}><CalendarRange className="h-3.5 w-3.5 shrink-0" /> Planificador</Link></li>
              <li><Link to="/gestion-equipos" className={linkClass}><Users className="h-3.5 w-3.5 shrink-0" /> Equipos</Link></li>
              <li><Link to="/reportes-rentabilidad" className={linkClass}><BarChart3 className="h-3.5 w-3.5 shrink-0" /> Reportes</Link></li>
              <li><Link to="/control-proyectos" className={linkClass}><FolderKanban className="h-3.5 w-3.5 shrink-0" /> Proyectos</Link></li>
              <li><Link to="/integraciones" className={linkClass}><Plug className="h-3.5 w-3.5 shrink-0" /> Integraciones</Link></li>
              <li><Link to="/guia" className={linkClass}><FileText className="h-3.5 w-3.5 shrink-0" /> Guía</Link></li>
              <li><Link to="/api-docs" className={linkClass}><Code className="h-3.5 w-3.5 shrink-0" /> API</Link></li>
              <li className="col-span-2"><Link to="/#demo" className={linkClass}><PlayCircle className="h-3.5 w-3.5 shrink-0" /> Demo interactiva</Link></li>
            </ul>
          </div>

          {/* Soporte y Seguridad */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Empresa</h4>
            <ul className="space-y-1.5">
              <li>
                <Link to="/seguridad" className={linkClass}>
                  <Shield className="h-3.5 w-3.5 shrink-0" />
                  Seguridad
                </Link>
              </li>
              <li>
                <Link to="/soporte" className={linkClass}>
                  <HelpCircle className="h-3.5 w-3.5 shrink-0" />
                  Contactar soporte
                </Link>
              </li>
              <li>
                <Link to="/contacto" className={linkClass}>
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  Contacto
                </Link>
              </li>
              <li>
                <a href="mailto:hola@taimbox.com" className={linkClass}>
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  hola@taimbox.com
                </a>
              </li>
            </ul>
          </div>

          {/* CTA principal: registro para nuevos usuarios */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Empieza gratis</h4>
            <Link
              to="/login?tab=register"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-sm font-semibold rounded-lg transition-all shadow-lg"
            >
              Crear mi cuenta
            </Link>
            <p className="mt-2 text-xs text-indigo-200/60">
              Prueba gratuita. Sin tarjeta de crédito.
            </p>
            <p className="mt-2 text-xs text-indigo-200/70">
              ¿Te parece caro?{' '}
              <Link to="/pitch" className="text-white font-medium hover:underline underline-offset-2">
                Recupera la inversión en el primer mes
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-6 pt-5 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-indigo-200/60">
            © {currentYear} Taimbox. Todos los derechos reservados.
          </p>
          <div className="flex flex-wrap gap-4 text-xs text-indigo-200/60 justify-center sm:justify-end">
            <Link to="/privacidad" className="hover:text-white flex items-center gap-1.5 transition-colors">
              <Shield className="h-3.5 w-3.5" />
              Privacidad
            </Link>
            <Link to="/condiciones" className="hover:text-white flex items-center gap-1.5 transition-colors">
              <Scale className="h-3.5 w-3.5" />
              Condiciones
            </Link>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent("open-cookie-preferences"))}
              className="hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer bg-transparent border-none"
            >
              Cookies
            </button>
            <Link to="/api-docs" className="hover:text-white flex items-center gap-1.5 transition-colors">
              <Code className="h-3.5 w-3.5" />
              API
            </Link>
            <Link to="/guia" className="hover:text-white flex items-center gap-1.5 transition-colors">
              <FileText className="h-3.5 w-3.5" />
              Guía
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
