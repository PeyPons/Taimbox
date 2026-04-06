import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { localizedPathFromEs } from '@/i18n/publicPaths';
import {
    Calendar,
    Menu,
    X,
    ArrowRight,
    LayoutDashboard,
    CalendarRange,
    Users,
    BarChart3,
    FolderKanban,
    Plug,
    DollarSign,
    Shield,
} from 'lucide-react';
import { FeaturesDropdown } from './FeaturesDropdown';
import { LanguageSelector } from './LanguageSelector';

const MOBILE_FEATURE_META = [
    { id: 'employeeDashboard' as const, hrefEs: '/dashboard-empleado', icon: LayoutDashboard, gradient: 'from-indigo-500 to-purple-500' },
    { id: 'resourcePlanner' as const, hrefEs: '/planificador-recursos', icon: CalendarRange, gradient: 'from-indigo-500 to-blue-500' },
    { id: 'teamManagement' as const, hrefEs: '/gestion-equipos', icon: Users, gradient: 'from-blue-500 to-cyan-500' },
    { id: 'reports' as const, hrefEs: '/reportes-rentabilidad', icon: BarChart3, gradient: 'from-emerald-500 to-teal-500' },
    { id: 'projects' as const, hrefEs: '/control-proyectos', icon: FolderKanban, gradient: 'from-amber-500 to-orange-500' },
    { id: 'integrations' as const, hrefEs: '/integraciones', icon: Plug, gradient: 'from-cyan-500 to-blue-500' },
    { id: 'ppc' as const, hrefEs: '/monitor-ppc', icon: DollarSign, gradient: 'from-fuchsia-500 to-pink-500' },
    { id: 'security' as const, hrefEs: '/seguridad', icon: Shield, gradient: 'from-emerald-500 to-teal-500' },
];

export function LandingHeader() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const { t, i18n } = useTranslation('landing');

    return (
        <>
            <header className="fixed top-0 left-0 right-0 z-50 w-full border-b border-white/10 bg-indigo-950/90 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
                    {/* Logo */}
                    <Link to={localizedPathFromEs('/', i18n.language)} className="flex items-center gap-2 text-white font-bold text-lg hover:text-indigo-200 transition-colors">
                        <Calendar className="h-5 w-5 text-indigo-400" />
                        Taimbox
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden sm:flex items-center gap-4">
                        <FeaturesDropdown />
                        <Link to={localizedPathFromEs('/precios', i18n.language)} className="text-sm text-indigo-200 hover:text-white transition-colors">
                            {t('header.pricing')}
                        </Link>
                        <Link to={localizedPathFromEs('/guia', i18n.language)} className="text-sm text-indigo-200 hover:text-white transition-colors">
                            {t('header.guide')}
                        </Link>
                        <Link to={localizedPathFromEs('/api-docs', i18n.language)} className="text-sm text-indigo-200 hover:text-white transition-colors">
                            {t('header.api')}
                        </Link>
                        <Link to={localizedPathFromEs('/contacto', i18n.language)} className="text-sm text-indigo-200 hover:text-white transition-colors">
                            {t('header.contact')}
                        </Link>
                        <LanguageSelector />
                        <Link to="/login">
                            <Button size="sm" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white">
                                {t('header.login')}
                            </Button>
                        </Link>
                    </div>

                    {/* Mobile: Login + Hamburger */}
                    <div className="flex sm:hidden items-center gap-2">
                        <Link to="/login">
                            <Button size="sm" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs px-3">
                                {t('header.login')}
                            </Button>
                        </Link>
                        <LanguageSelector />
                        <button
                            onClick={() => setMobileOpen(!mobileOpen)}
                            className="p-1.5 rounded-lg text-indigo-200 hover:text-white hover:bg-white/10 transition-colors"
                            aria-label={t('header.menuAria')}
                        >
                            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </button>
                    </div>
                </div>
            </header>
            {/* Spacer for fixed header */}
            <div className="h-14" />

            {/* Mobile Menu Panel */}
            <div
                className={`sm:hidden fixed inset-x-0 top-[57px] z-40 transition-all duration-300 ${mobileOpen
                    ? 'opacity-100 translate-y-0 pointer-events-auto'
                    : 'opacity-0 -translate-y-4 pointer-events-none'
                    }`}
            >
                {/* Backdrop */}
                <div
                    className={`fixed inset-0 top-[57px] bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${mobileOpen ? 'opacity-100' : 'opacity-0'
                        }`}
                    onClick={() => setMobileOpen(false)}
                />

                {/* Panel */}
                <div className="relative mx-3 mt-2 rounded-2xl border border-white/15 bg-slate-900/98 backdrop-blur-2xl shadow-2xl shadow-black/50 overflow-hidden max-h-[70vh] overflow-y-auto">
                    {/* Quick links */}
                    <div className="px-4 py-3 border-b border-white/10 flex flex-wrap gap-2">
                        <Link
                            to={localizedPathFromEs('/precios', i18n.language)}
                            onClick={() => setMobileOpen(false)}
                            className="flex-1 min-w-[80px] text-center text-sm font-medium text-indigo-200 hover:text-white py-2 rounded-lg bg-white/5 border border-white/10 transition-colors"
                        >
                            {t('header.pricing')}
                        </Link>
                        <Link
                            to={localizedPathFromEs('/guia', i18n.language)}
                            onClick={() => setMobileOpen(false)}
                            className="flex-1 min-w-[80px] text-center text-sm font-medium text-indigo-200 hover:text-white py-2 rounded-lg bg-white/5 border border-white/10 transition-colors"
                        >
                            {t('header.guide')}
                        </Link>
                        <Link
                            to={localizedPathFromEs('/api-docs', i18n.language)}
                            onClick={() => setMobileOpen(false)}
                            className="flex-1 min-w-[80px] text-center text-sm font-medium text-indigo-200 hover:text-white py-2 rounded-lg bg-white/5 border border-white/10 transition-colors"
                        >
                            {t('header.api')}
                        </Link>
                    </div>

                    {/* Features list */}
                    <div className="px-3 py-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-300/80 px-2 mb-2">
                            {t('header.featuresTrigger')}
                        </p>
                        <div className="space-y-1">
                            {MOBILE_FEATURE_META.map((feature) => {
                                const Icon = feature.icon;
                                const href = localizedPathFromEs(feature.hrefEs, i18n.language);
                                return (
                                    <Link
                                        key={feature.hrefEs}
                                        to={href}
                                        onClick={() => setMobileOpen(false)}
                                        className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-white/5 transition-colors"
                                    >
                                        <div className={`w-9 h-9 shrink-0 rounded-lg bg-gradient-to-br ${feature.gradient} flex items-center justify-center`}>
                                            <Icon className="h-4 w-4 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-white font-medium truncate">{t(`mobileFeatures.${feature.id}.title`)}</p>
                                            <p className="text-[10px] text-white/50">{t(`mobileFeatures.${feature.id}.badge`)}</p>
                                        </div>
                                        <ArrowRight className="h-3.5 w-3.5 text-slate-500" />
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div >
        </>
    );
}
