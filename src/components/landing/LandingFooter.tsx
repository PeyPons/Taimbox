import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FileText, Code, HelpCircle, Mail, BookOpen, PlayCircle, LayoutDashboard, CalendarRange, Users, BarChart3, FolderKanban, Plug, Presentation, Shield, Scale, Newspaper, Tag } from 'lucide-react';
import { PublicWordmark } from '@/components/public/PublicMark';
import { localizedHashPath, localizedPathFromEs } from '@/i18n/publicPaths';
import { cn } from '@/lib/utils';

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

export type LandingFooterVariant = 'dark' | 'light' | 'stage';

export type LandingFooterProps = {
  variant?: LandingFooterVariant;
};

export function LandingFooter({ variant = 'dark' }: LandingFooterProps) {
  const { t, i18n } = useTranslation('landing');
  const currentYear = new Date().getFullYear();
  const stage = variant === 'stage';
  const light = false;

  const linkClass = cn(
    'text-sm flex items-center gap-2 transition-colors rounded-sm',
    stage
      ? 'text-[#D4CEF0] hover:text-white'
      : light
        ? 'text-slate-600 hover:text-violet-700'
        : 'text-[#F7F8FC]/75 hover:text-[#F7F8FC]',
  );
  return (
    <footer className={cn(
      'relative z-10 border-t backdrop-blur-xl',
      light ? 'border-slate-200 bg-slate-50/95' : 'border-[#F7F8FC]/10 bg-[#14123B]',
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to={localizedPathFromEs('/', i18n.language)} className={cn(
              'inline-flex transition-colors',
              light ? 'text-slate-900 hover:text-violet-700' : 'text-[#F7F8FC] hover:text-white',
            )}>
              <PublicWordmark tone="paper" markClassName="h-5 w-5" />
            </Link>
            <p className={cn('mt-3 text-xs max-w-xs leading-snug', stage ? 'text-[#D4CEF0]' : light ? 'text-slate-600' : 'text-[#F7F8FC]/70')}>
              {t('footer.tagline')}
            </p>
          </div>

          {/* Producto: 2 columnas internas para no alargar */}
          <div className="lg:col-span-1">
            <h4 className={cn('font-semibold text-sm mb-3', light ? 'text-slate-900' : 'text-white')}>{t('footer.productTitle')}</h4>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
              {PRODUCT_LINKS.map(({ hrefEs, linkKey, icon: Icon }) => (
                <li key={hrefEs}>
                  <Link to={localizedPathFromEs(hrefEs, i18n.language)} className={linkClass}>
                    {stage ? null : <Icon className="h-3.5 w-3.5 shrink-0" />} {t(`footer.links.${linkKey}`)}
                  </Link>
                </li>
              ))}
              <li className="col-span-2">
                <Link to={localizedHashPath('/#demo', i18n.language)} className={linkClass}>
                  {stage ? null : <PlayCircle className="h-3.5 w-3.5 shrink-0" />} {t('footer.links.demo')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Soporte y Seguridad */}
          <div>
            <h4 className={cn('font-semibold text-sm mb-3', light ? 'text-slate-900' : 'text-white')}>{t('footer.companyTitle')}</h4>
            <ul className="space-y-1.5">
              <li>
                <Link to={localizedPathFromEs('/para-quien', i18n.language)} className={linkClass}>
                  {t('footer.links.audiences')}
                </Link>
              </li>
              <li>
                <Link to={localizedPathFromEs('/agencias-performance', i18n.language)} className={linkClass}>
                  {t('footer.links.performance')}
                </Link>
              </li>
              <li>
                <Link to={localizedPathFromEs('/estudios-creativos', i18n.language)} className={linkClass}>
                  {t('footer.links.creative')}
                </Link>
              </li>
              <li>
                <Link to={localizedPathFromEs('/agencias-integrales', i18n.language)} className={linkClass}>
                  {t('footer.links.fullService')}
                </Link>
              </li>
              <li>
                <Link to={localizedPathFromEs('/seguridad', i18n.language)} className={linkClass}>
                  {stage ? null : <Shield className="h-3.5 w-3.5 shrink-0" />}
                  {t('footer.links.security')}
                </Link>
              </li>
              <li>
                <Link to="/soporte" className={linkClass}>
                  {stage ? null : <HelpCircle className="h-3.5 w-3.5 shrink-0" />}
                  {t('footer.links.support')}
                </Link>
              </li>
              <li>
                <Link to={localizedPathFromEs('/contacto', i18n.language)} className={linkClass}>
                  {stage ? null : <Mail className="h-3.5 w-3.5 shrink-0" />}
                  {t('footer.links.contact')}
                </Link>
              </li>
              <li>
                <a href="mailto:hello@taimbox.com" className={linkClass}>
                  {stage ? null : <Mail className="h-3.5 w-3.5 shrink-0" />}
                  hello@taimbox.com
                </a>
              </li>
            </ul>
          </div>

          {/* CTA principal: registro para nuevos usuarios */}
          <div>
            <h4 className={cn('font-semibold text-sm mb-3', light ? 'text-slate-900' : 'text-white')}>{t('footer.ctaTitle')}</h4>
            <Link
              to="/login?tab=register"
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2 bg-[#F7F8FC] text-[#14123B] text-sm font-medium hover:bg-white transition-colors',
                stage && 'h-11 rounded-full px-5',
              )}
            >
              {t('footer.ctaButton')}
            </Link>
            <p className={cn('mt-2 text-xs', stage ? 'text-[#D4CEF0]' : light ? 'text-slate-500' : 'text-[#F7F8FC]/55')}>
              {t('footer.ctaTrial')}
            </p>
            <p className={cn('mt-2 text-xs', stage ? 'text-[#D4CEF0]' : light ? 'text-slate-600' : 'text-[#F7F8FC]/65')}>
              {t('footer.ctaPitchLead')}{' '}
              <Link to={localizedPathFromEs('/pitch', i18n.language)} className={cn('font-medium hover:underline underline-offset-2', light ? 'text-violet-700 hover:text-violet-900' : 'text-white')}>
                {t('footer.ctaPitch')}
              </Link>
            </p>
          </div>
        </div>

        <div className={cn('mt-6 pt-5 flex flex-col sm:flex-row justify-between items-center gap-3 border-t', light ? 'border-slate-200' : 'border-white/10')}>
          <p className={cn('text-xs', stage ? 'text-[#D4CEF0]' : light ? 'text-slate-500' : 'text-[#F7F8FC]/55')}>
            {t('footer.copyright', { year: currentYear })}
          </p>
          <div className={cn('flex flex-wrap gap-4 text-xs justify-center sm:justify-end', stage ? 'text-[#D4CEF0]' : light ? 'text-slate-500' : 'text-[#F7F8FC]/55')}>
            <Link to={localizedPathFromEs('/privacidad', i18n.language)} className={cn('flex items-center gap-1.5 transition-colors', light ? 'hover:text-violet-700' : 'hover:text-white')}>
              {stage ? null : <Shield className="h-3.5 w-3.5" />}
              {t('footer.privacy')}
            </Link>
            <Link to={localizedPathFromEs('/condiciones', i18n.language)} className={cn('flex items-center gap-1.5 transition-colors', light ? 'hover:text-violet-700' : 'hover:text-white')}>
              {stage ? null : <Scale className="h-3.5 w-3.5" />}
              {t('footer.terms')}
            </Link>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent("open-cookie-preferences"))}
              className={cn('flex items-center gap-1.5 transition-colors cursor-pointer bg-transparent border-none', light ? 'hover:text-violet-700' : 'hover:text-white')}
            >
              {t('footer.cookies')}
            </button>
            <Link to={localizedPathFromEs('/api-docs', i18n.language)} className={cn('flex items-center gap-1.5 transition-colors', light ? 'hover:text-violet-700' : 'hover:text-white')}>
              {stage ? null : <Code className="h-3.5 w-3.5" />}
              {t('header.api')}
            </Link>
            <Link to={localizedPathFromEs('/guia', i18n.language)} className={cn('flex items-center gap-1.5 transition-colors', light ? 'hover:text-violet-700' : 'hover:text-white')}>
              {stage ? null : <FileText className="h-3.5 w-3.5" />}
              {t('header.guide')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
