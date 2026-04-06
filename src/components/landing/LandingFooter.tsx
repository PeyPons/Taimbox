import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Calendar, FileText, Code, HelpCircle, Mail, BookOpen, PlayCircle, LayoutDashboard, CalendarRange, Users, BarChart3, FolderKanban, Plug, Presentation, Shield, Scale, Newspaper, Tag } from 'lucide-react';
import { localizedHashPath, localizedPathFromEs } from '@/i18n/publicPaths';

const PRODUCT_LINKS = [
  { hrefEs: '/precios', linkKey: 'pricing' as const, icon: Tag },
  { hrefEs: '/pitch', linkKey: 'roi' as const, icon: Presentation },
  { hrefEs: '/por-que-timeboxing', linkKey: 'why' as const, icon: BookOpen },
  { hrefEs: '/blog', linkKey: 'blog' as const, icon: Newspaper },
  { hrefEs: '/dashboard-empleado', linkKey: 'dashboard' as const, icon: LayoutDashboard },
  { hrefEs: '/planificador-recursos', linkKey: 'planner' as const, icon: CalendarRange },
  { hrefEs: '/gestion-equipos', linkKey: 'teams' as const, icon: Users },
  { hrefEs: '/reportes-rentabilidad', linkKey: 'reports' as const, icon: BarChart3 },
  { hrefEs: '/control-proyectos', linkKey: 'projects' as const, icon: FolderKanban },
  { hrefEs: '/integraciones', linkKey: 'integrations' as const, icon: Plug },
  { hrefEs: '/guia', linkKey: 'guide' as const, icon: FileText },
  { hrefEs: '/api-docs', linkKey: 'api' as const, icon: Code },
] as const;

export function LandingFooter() {
  const { t, i18n } = useTranslation('landing');
  const currentYear = new Date().getFullYear();

  const linkClass = 'text-sm text-indigo-200/80 hover:text-white flex items-center gap-2 transition-colors';
  return (
    <footer className="relative z-10 border-t border-white/10 bg-indigo-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to={localizedPathFromEs('/', i18n.language)} className="inline-flex items-center gap-2 text-white font-bold text-lg hover:text-indigo-200 transition-colors">
              <Calendar className="h-5 w-5 text-indigo-400" />
              Taimbox
            </Link>
            <p className="mt-2 text-xs text-indigo-200/80 max-w-xs leading-snug">
              {t('footer.tagline')}
            </p>
          </div>

          {/* Producto: 2 columnas internas para no alargar */}
          <div className="lg:col-span-1">
            <h4 className="text-white font-semibold text-sm mb-3">{t('footer.productTitle')}</h4>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
              {PRODUCT_LINKS.map(({ hrefEs, linkKey, icon: Icon }) => (
                <li key={hrefEs}>
                  <Link to={localizedPathFromEs(hrefEs, i18n.language)} className={linkClass}>
                    <Icon className="h-3.5 w-3.5 shrink-0" /> {t(`footer.links.${linkKey}`)}
                  </Link>
                </li>
              ))}
              <li className="col-span-2">
                <Link to={localizedHashPath('/#demo', i18n.language)} className={linkClass}>
                  <PlayCircle className="h-3.5 w-3.5 shrink-0" /> {t('footer.links.demo')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Soporte y Seguridad */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">{t('footer.companyTitle')}</h4>
            <ul className="space-y-1.5">
              <li>
                <Link to={localizedPathFromEs('/seguridad', i18n.language)} className={linkClass}>
                  <Shield className="h-3.5 w-3.5 shrink-0" />
                  {t('footer.links.security')}
                </Link>
              </li>
              <li>
                <Link to="/soporte" className={linkClass}>
                  <HelpCircle className="h-3.5 w-3.5 shrink-0" />
                  {t('footer.links.support')}
                </Link>
              </li>
              <li>
                <Link to={localizedPathFromEs('/contacto', i18n.language)} className={linkClass}>
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  {t('footer.links.contact')}
                </Link>
              </li>
              <li>
                <a href="mailto:hello@taimbox.com" className={linkClass}>
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  hello@taimbox.com
                </a>
              </li>
            </ul>
          </div>

          {/* CTA principal: registro para nuevos usuarios */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">{t('footer.ctaTitle')}</h4>
            <Link
              to="/login?tab=register"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-sm font-semibold rounded-lg transition-all shadow-lg"
            >
              {t('footer.ctaButton')}
            </Link>
            <p className="mt-2 text-xs text-indigo-200/60">
              {t('footer.ctaTrial')}
            </p>
            <p className="mt-2 text-xs text-indigo-200/70">
              {t('footer.ctaPitchLead')}{' '}
              <Link to={localizedPathFromEs('/pitch', i18n.language)} className="text-white font-medium hover:underline underline-offset-2">
                {t('footer.ctaPitch')}
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-6 pt-5 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-indigo-200/60">
            {t('footer.copyright', { year: currentYear })}
          </p>
          <div className="flex flex-wrap gap-4 text-xs text-indigo-200/60 justify-center sm:justify-end">
            <Link to={localizedPathFromEs('/privacidad', i18n.language)} className="hover:text-white flex items-center gap-1.5 transition-colors">
              <Shield className="h-3.5 w-3.5" />
              {t('footer.privacy')}
            </Link>
            <Link to={localizedPathFromEs('/condiciones', i18n.language)} className="hover:text-white flex items-center gap-1.5 transition-colors">
              <Scale className="h-3.5 w-3.5" />
              {t('footer.terms')}
            </Link>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent("open-cookie-preferences"))}
              className="hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer bg-transparent border-none"
            >
              {t('footer.cookies')}
            </button>
            <Link to={localizedPathFromEs('/api-docs', i18n.language)} className="hover:text-white flex items-center gap-1.5 transition-colors">
              <Code className="h-3.5 w-3.5" />
              {t('header.api')}
            </Link>
            <Link to={localizedPathFromEs('/guia', i18n.language)} className="hover:text-white flex items-center gap-1.5 transition-colors">
              <FileText className="h-3.5 w-3.5" />
              {t('header.guide')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
