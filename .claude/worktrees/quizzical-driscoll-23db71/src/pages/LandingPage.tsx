import { useEffect, useMemo, useState } from 'react';
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
  FileDown,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  LayoutDashboard,
  CalendarCheck
} from 'lucide-react';
import { DemoPlanner } from '@/components/demo/DemoDashboard';
import { DemoEmployeeDashboard } from '@/components/demo/DemoEmployeeDashboard';
import { DemoDeadlinesPage } from '@/components/demo/DemoDeadlinesPage';
import { DemoWeeklyForecastPage } from '@/components/demo/DemoWeeklyForecastPage';
import { DemoProvider } from '@/contexts/DemoContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { i18nAsArray } from '@/lib/i18nReturnObjects';
import { SeoTags } from '@/seo/SeoTags';
import { CalendarPreview } from '@/components/landing/CalendarPreview';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { localizedPathFromEs } from '@/i18n/publicPaths';

type HomeCarouselJson = {
  label: string;
  title: string;
  subtitle: string;
  description: string;
  featureList: string[];
  example: string;
  stat: string;
  statLabel: string;
  landingUrl: string;
};

type HomeFaqJson = {
  question: string;
  answer?: string;
  answerBefore?: string;
  answerLinkText?: string;
  answerAfter?: string;
  answerLinkPath?: string;
};

const FEATURE_CAROUSEL_META: { icon: typeof Calendar; color: string }[] = [
  { icon: Calendar, color: 'from-indigo-500 to-purple-500' },
  { icon: Link2, color: 'from-purple-500 to-pink-500' },
  { icon: Target, color: 'from-amber-500 to-orange-500' },
  { icon: Users, color: 'from-blue-500 to-cyan-500' },
  { icon: Clock, color: 'from-teal-500 to-emerald-500' },
  { icon: FileText, color: 'from-violet-500 to-purple-500' },
  { icon: Bell, color: 'from-yellow-500 to-amber-500' },
  { icon: BarChart3, color: 'from-rose-500 to-pink-500' },
];

export default function LandingPage() {
  const { t, i18n } = useTranslation('landing');
  const lang = i18n.language.startsWith('en') ? 'en' : 'es';
  const [demoTab, setDemoTab] = useState('planner');
  const [activeFeature, setActiveFeature] = useState(0);

  const homeFeatures = useMemo(() => {
    const raw = i18nAsArray<HomeCarouselJson>(t('home.featuresCarousel', { returnObjects: true }));
    return raw.map((item, i) => {
      const meta = FEATURE_CAROUSEL_META[i];
      if (!meta) return null;
      return { ...item, icon: meta.icon, color: meta.color };
    }).filter((x): x is HomeCarouselJson & { icon: typeof Calendar; color: string } => x != null);
  }, [t]);

  const faqItems = useMemo(
    () => i18nAsArray<HomeFaqJson>(t('home.faqItems', { returnObjects: true })),
    [t],
  );

  useEffect(() => {
    if (homeFeatures.length === 0) return;
    if (activeFeature >= homeFeatures.length) {
      setActiveFeature(0);
    }
  }, [homeFeatures.length, activeFeature]);

  return (
    <>
      <SeoTags
        pathEs="/"
        pathEn="/en"
        title={t('home.seoTitle')}
        description={t('home.seoDescription')}
        lang={lang}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'Taimbox',
          applicationCategory: 'BusinessApplication',
          description: t('home.jsonLdDescription'),
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
        } as Record<string, unknown>}
      />

      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-indigo-900 relative overflow-x-hidden min-w-0">
        <LandingHeader />
        {/* Efectos de fondo animados mejorados */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/100/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-16 md:pt-20 pb-8 sm:pb-12 md:pb-16">
            <div className="text-center relative min-w-0">
              {/* Badge animado mejorado */}
              <div className="inline-flex items-center gap-2 px-3 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-indigo-500/40 via-purple-500/40 to-pink-500/40 backdrop-blur-md rounded-full text-white text-xs sm:text-base font-bold mb-6 sm:mb-12 border border-white/20 shadow-2xl shadow-indigo-500/30 animate-fade-in relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <Sparkles className="h-3.5 w-3.5 sm:h-5 sm:w-5 animate-spin-slow relative z-10" />
                <span className="whitespace-nowrap relative z-10">{t('home.heroBadge')}</span>
              </div>

              {/* Título principal: escalado para móvil */}
              <div className="relative mb-4 sm:mb-8">
                <div className="absolute -inset-4 sm:-inset-8 bg-gradient-to-r from-indigo-600/30 via-purple-600/30 to-pink-600/30 blur-3xl opacity-60 -z-10 animate-pulse" />
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black mb-2 sm:mb-4 leading-[1.15] tracking-tight relative px-1">
                  <span className="block text-white drop-shadow-2xl">{t('home.heroTitleLine1')}</span>
                  <span className="block relative">
                    <span className="absolute inset-0 bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 blur-xl opacity-50 animate-pulse" />
                    <span className="relative bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto] drop-shadow-lg">
                      {t('home.heroTitleHighlight')}
                    </span>
                  </span>
                </h1>
              </div>

              {/* Descripción: más legible en móvil */}
              <div className="mb-5 sm:mb-8 max-w-4xl mx-auto px-2 sm:px-4">
                <p className="text-base sm:text-xl md:text-2xl lg:text-3xl text-indigo-100/90 leading-relaxed font-light mb-2">
                  {t('home.heroSubtitleLine1')}
                </p>
                <p className="text-lg sm:text-2xl md:text-3xl lg:text-4xl text-white font-semibold leading-tight break-words">
                  {t('home.heroSubtitleLine2Prefix')}{' '}
                  <span className="bg-gradient-to-r from-indigo-200 to-purple-200 bg-clip-text text-transparent">
                    {t('home.heroSubtitleLine2When')}
                  </span>{' '}
                  {t('home.heroSubtitleLine2And')}{' '}
                  <span className="bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-transparent">
                    {t('home.heroSubtitleLine2Why')}
                  </span>
                  .
                </p>
              </div>

              {/* CTA: solo lo prioritario, botones más compactos en móvil */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center px-2 sm:px-4 mb-6 sm:mb-10 max-w-md sm:max-w-none mx-auto">
                <Link to="/login?tab=register" className="group relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-300" />
                  <Button size="lg" className="relative w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 sm:px-10 py-5 sm:py-7 text-base sm:text-xl font-semibold shadow-2xl hover:shadow-indigo-500/50 transition-all transform hover:scale-105 min-h-[48px]">
                    {t('home.heroPrimaryCta')}
                    <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link to="/pitch">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto px-5 sm:px-8 py-5 sm:py-7 text-sm sm:text-lg font-semibold border-2 border-white/30 text-white hover:text-white hover:bg-white/10 hover:border-white/50 bg-white/5 backdrop-blur-md shadow-xl min-h-[48px]"
                  >
                    {t('home.heroSecondaryCta')}
                  </Button>
                </Link>
              </div>
              <p className="text-center text-sm text-indigo-200/80">
                <Link to="/precios" className="hover:text-white underline underline-offset-2">
                  {t('home.heroPricingLink')}
                </Link>
              </p>

              {/* Preview visual - Calendario completo (scroll interno en móvil) */}
              <div className="relative mt-4 sm:mt-8 md:mt-10 max-w-5xl mx-auto px-2 sm:px-0 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-indigo-950/50 to-transparent -z-10" />
                <div className="relative transform hover:scale-[1.01] transition-all duration-500">
                  <CalendarPreview />
                  <div className="mt-3 sm:mt-4 text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-white/10 backdrop-blur-md border-white/30 text-white hover:text-white hover:bg-white/20 hover:border-white/50 text-xs sm:text-sm"
                      onClick={() => {
                        const demoSection = document.getElementById('demo');
                        demoSection?.scrollIntoView({ behavior: 'smooth' });
                      }}
                    >
                      {t('home.heroCalendarButton')}
                      <ArrowRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Feature Carousel - Futuristic Design */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-3 px-4">
              <span className="bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200 bg-clip-text text-transparent">
                {t('home.featuresTitle')}
              </span>
            </h2>
            <p className="text-lg sm:text-xl text-white/70 max-w-2xl mx-auto">
              {t('home.featuresSubtitle')}
            </p>
            <Link to="/guia" className="inline-block mt-3 text-sm font-medium text-indigo-200 hover:text-white underline underline-offset-2 transition-colors">
              {t('home.featuresGuideLink')}
            </Link>
          </div>

          {/* Feature Bubbles Row */}
          {(() => {
            const features = homeFeatures;
            const current = features[activeFeature];
            if (!current) return null;
            const FeatureIcon = current.icon;

            return (
              <>
                {/* Mobile: Horizontal scroll carousel (contenido dentro del ancho) */}
                <div className="md:hidden mb-4 overflow-x-hidden">
                  <div className="flex gap-2 overflow-x-auto pb-3 -mx-2 px-2 snap-x snap-mandatory scrollbar-hide min-h-[44px] items-center" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}>
                    {features.map((feature, index) => {
                      const Icon = feature.icon;
                      return (
                        <button
                          key={index}
                          onClick={() => setActiveFeature(index)}
                          className={cn(
                            "flex-shrink-0 snap-center flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-300",
                            activeFeature === index
                              ? `bg-gradient-to-br ${feature.color} shadow-lg`
                              : "bg-white/10 border border-white/20"
                          )}
                        >
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center",
                            activeFeature === index ? "bg-white/20" : `bg-gradient-to-br ${feature.color}`
                          )}>
                            <Icon className="h-4 w-4 text-white" />
                          </div>
                          <span className={cn(
                            "text-xs font-semibold whitespace-nowrap",
                            activeFeature === index ? "text-white" : "text-white/80"
                          )}>
                            {feature.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {/* Mobile navigation dots */}
                  <div className="flex justify-center gap-1.5 mt-2">
                    {features.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setActiveFeature(index)}
                        className={cn(
                          "w-2 h-2 rounded-full transition-all",
                          activeFeature === index ? "bg-white w-4" : "bg-white/30"
                        )}
                      />
                    ))}
                  </div>
                </div>

                {/* Desktop: Grid layout */}
                <div className="hidden md:flex flex-wrap justify-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                  {features.map((feature, index) => {
                    const Icon = feature.icon;
                    return (
                      <button
                        key={index}
                        onClick={() => setActiveFeature(index)}
                        className={cn(
                          "group relative flex flex-col items-center gap-2 p-3 sm:p-4 rounded-2xl transition-all duration-300 cursor-pointer",
                          activeFeature === index
                            ? `bg-gradient-to-br ${feature.color} shadow-xl scale-105`
                            : "bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20"
                        )}
                      >
                        <div className={cn(
                          "w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
                          activeFeature === index ? "bg-white/20" : `bg-gradient-to-br ${feature.color} shadow-lg`
                        )}>
                          <Icon className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                        </div>
                        <span className={cn(
                          "text-xs sm:text-sm font-semibold transition-colors",
                          activeFeature === index ? "text-white" : "text-white/80"
                        )}>
                          {feature.label}
                        </span>
                        {activeFeature === index && (
                          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-gradient-to-br from-indigo-900/90 to-purple-900/90" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Feature Detail Panel - Optimized for mobile */}
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl md:rounded-3xl blur opacity-30" />
                  <Card className="relative border-2 border-white/20 bg-gradient-to-br from-indigo-900/90 to-purple-900/90 backdrop-blur-xl">
                    <CardContent className="p-4 sm:p-6 md:p-8 lg:p-10">
                      {/* Mobile: Stacked layout */}
                      <div className="md:hidden space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br", current.color)}>
                              <FeatureIcon className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-white">{current.title}</h3>
                              <p className="text-xs text-indigo-200/70">{current.subtitle}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-black bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">
                              {current.stat}
                            </div>
                            <p className="text-[10px] text-white/60">{current.statLabel}</p>
                          </div>
                        </div>

                        <p className="text-sm text-white/90 leading-relaxed">{current.description}</p>

                        <div className="grid grid-cols-2 gap-2">
                          {current.featureList.map((feat, i) => (
                            <div key={i} className="flex items-center gap-1.5 p-2 bg-white/5 rounded-lg border border-white/10">
                              <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
                              <span className="text-[11px] text-white/90 leading-tight">{feat}</span>
                            </div>
                          ))}
                        </div>

                        <div className="p-3 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-lg border border-indigo-400/20">
                          <p className="text-xs text-indigo-200/90 italic">💡 {current.example}</p>
                        </div>

                        <Link to={localizedPathFromEs(current.landingUrl, i18n.language)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-300 hover:text-white transition-colors">
                          {t('home.featuresDesktopCta')}
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>

                        <div className="flex justify-between items-center pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-white/5 border-white/20 text-white hover:text-white hover:bg-white/10"
                            onClick={() => setActiveFeature(prev => prev === 0 ? features.length - 1 : prev - 1)}
                          >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            {t('home.featuresMobilePrev')}
                          </Button>
                          <span className="text-xs text-white/50">
                            {activeFeature + 1} / {features.length}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-white/5 border-white/20 text-white hover:text-white hover:bg-white/10"
                            onClick={() => setActiveFeature(prev => prev === features.length - 1 ? 0 : prev + 1)}
                          >
                            {t('home.featuresMobileNext')}
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      </div>

                      {/* Desktop: Original grid layout */}
                      <div className="hidden md:grid lg:grid-cols-5 gap-6 sm:gap-8">
                        <div className="lg:col-span-3">
                          <div className="flex items-center gap-3 mb-4">
                            <Badge className="bg-primary/100/30 text-indigo-200 border-indigo-400/30 px-3 py-1">
                              {current.label}
                            </Badge>
                          </div>
                          <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">{current.title}</h3>
                          <p className="text-indigo-200/70 text-sm mb-4">{current.subtitle}</p>
                          <p className="text-white/90 text-base sm:text-lg leading-relaxed mb-6">{current.description}</p>

                          <div className="grid grid-cols-2 gap-3 mb-6">
                            {current.featureList.map((feat, i) => (
                              <div key={i} className="flex items-center gap-2 p-2 bg-white/5 rounded-lg border border-white/10">
                                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                                <span className="text-sm text-white/90">{feat}</span>
                              </div>
                            ))}
                          </div>

                          <div className="p-4 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-xl border border-indigo-400/20">
                            <p className="text-sm text-indigo-200/90 italic">💡 {current.example}</p>
                          </div>

                          <Link to={localizedPathFromEs(current.landingUrl, i18n.language)} className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-300 hover:text-white transition-colors mt-2">
                            {t('home.featuresDesktopCtaFull')}
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </div>

                        <div className="lg:col-span-2 flex flex-col justify-between">
                          <div className="text-center p-6 bg-gradient-to-br from-white/5 to-white/10 rounded-2xl border border-white/10 mb-4">
                            <div className="text-5xl sm:text-6xl font-black bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent mb-2">
                              {current.stat}
                            </div>
                            <p className="text-sm text-white/70">{current.statLabel}</p>
                          </div>

                          <div className="flex justify-center gap-4">
                            <Button
                              variant="outline"
                              size="lg"
                              className="bg-white/5 border-white/20 text-white hover:text-white hover:bg-white/10"
                              onClick={() => setActiveFeature(prev => prev === 0 ? features.length - 1 : prev - 1)}
                            >
                              <ChevronLeft className="h-5 w-5" />
                            </Button>
                            <Button
                              variant="outline"
                              size="lg"
                              className="bg-white/5 border-white/20 text-white hover:text-white hover:bg-white/10"
                              onClick={() => setActiveFeature(prev => prev === features.length - 1 ? 0 : prev + 1)}
                            >
                              <ChevronRight className="h-5 w-5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            );
          })()}
        </div>


        {/* Sección de Integraciones - Rediseño creativo */}
        <div className="relative z-10 py-12 sm:py-16 md:py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-950/30 to-transparent" />

          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="text-center mb-10 sm:mb-14">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500/30 to-purple-500/30 backdrop-blur-sm rounded-full text-white text-sm font-semibold mb-4 border border-white/20">
                <Plug className="h-4 w-4" />
                <span>{t('home.integrationsKicker')}</span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4 px-4">
                {t('home.integrationsTitleLine1')}
                <span className="block bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {t('home.integrationsTitleHighlight')}
                </span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 relative">
              <div className="hidden md:block absolute top-1/2 left-[20%] right-[20%] h-px bg-gradient-to-r from-indigo-500/50 via-purple-500/50 to-blue-500/50" />

              {i18nAsArray<{ title: string; description: string }>(
                t('home.integrationsCards', { returnObjects: true }),
              ).map((card, idx) => {
                const icons = [Download, Code, Calendar];
                const Icon = icons[idx] ?? Download;
                const wrapClass =
                  idx === 0
                    ? 'from-indigo-600/20 to-purple-600/20 border-indigo-500/30 hover:border-indigo-400/50 hover:shadow-indigo-500/20'
                    : idx === 1
                      ? 'from-purple-600/20 to-pink-600/20 border-purple-500/30 hover:border-purple-400/50 hover:shadow-purple-500/20'
                      : 'from-blue-600/20 to-cyan-600/20 border-blue-500/30 hover:border-blue-400/50 hover:shadow-blue-500/20';
                const iconGrad =
                  idx === 0
                    ? 'from-indigo-500 to-purple-600 shadow-indigo-500/40'
                    : idx === 1
                      ? 'from-purple-500 to-pink-600 shadow-purple-500/40'
                      : 'from-blue-500 to-cyan-600 shadow-blue-500/40';
                const textClass =
                  idx === 0 ? 'text-indigo-200/80' : idx === 1 ? 'text-purple-200/80' : 'text-blue-200/80';
                return (
                  <div key={idx} className={idx === 1 ? 'relative group md:-mt-4' : 'relative group'}>
                    <div
                      className={`bg-gradient-to-br ${wrapClass} backdrop-blur-xl rounded-3xl p-8 text-center border transition-all hover:scale-105 hover:shadow-2xl`}
                    >
                      <div
                        className={`w-20 h-20 bg-gradient-to-br ${iconGrad} rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-xl group-hover:scale-110 transition-transform`}
                      >
                        <Icon className="h-10 w-10 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-3">{card.title}</h3>
                      <p className={`${textClass} text-base leading-relaxed`}>{card.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sección de Problemas y Soluciones - Diseño visual transformación */}
        <div className="relative z-10 py-12 sm:py-16 md:py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10 sm:mb-14">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4 px-4">
                <span className="bg-gradient-to-r from-red-300 via-white to-emerald-300 bg-clip-text text-transparent">
                  {t('home.problemsTitle')}
                </span>
              </h2>
              <p className="text-lg text-white/70 max-w-xl mx-auto">
                {t('home.problemsSubtitle')}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 md:gap-8 mb-10 relative">
              <div className="hidden md:flex absolute left-1/2 top-[55%] -translate-x-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-indigo-500/20 rounded-full border border-indigo-500/30 items-center justify-center backdrop-blur-md">
                <ArrowRight className="h-5 w-5 text-indigo-300" />
              </div>

              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-950/60 via-red-900/40 to-gray-900/60 border border-red-500/30 p-6 sm:p-8">
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-3xl" />
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-red-500/30 rounded-xl flex items-center justify-center">
                    <AlertTriangle className="h-6 w-6 text-red-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">{t('home.problemsWithoutTitle')}</h3>
                </div>
                <div className="space-y-4">
                  {i18nAsArray<string>(t('home.problemsWithoutItems', { returnObjects: true })).map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                      <Clock className="h-5 w-5 text-red-400 shrink-0" />
                      <span className="text-white/90 font-medium">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950/60 via-emerald-900/40 to-gray-900/60 border border-emerald-500/30 p-6 sm:p-8">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl" />
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-emerald-500/30 rounded-xl flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">{t('home.problemsWithTitle')}</h3>
                </div>
                <div className="space-y-4">
                  {i18nAsArray<string>(t('home.problemsWithItems', { returnObjects: true })).map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                      <Zap className="h-5 w-5 text-emerald-400 shrink-0" />
                      <span className="text-white/90 font-medium">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="text-center">
              <Button
                size="lg"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-6 text-lg font-semibold shadow-2xl shadow-indigo-500/30"
                onClick={() => {
                  const demoSection = document.getElementById('demo');
                  demoSection?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                {t('home.problemsButton')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>


        {/* Sección específica de Deadlines - Diseño flow horizontal */}
        <div className="relative z-10 bg-gradient-to-br from-amber-950/40 via-orange-950/40 to-amber-950/40 border-y border-amber-500/30 py-12 sm:py-16 md:py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10 sm:mb-14">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500/30 to-orange-500/30 backdrop-blur-sm rounded-full text-white text-sm font-semibold mb-4 border border-amber-400/40">
                <Target className="h-4 w-4" />
                <span>{t('home.deadlinesKicker')}</span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4 px-4">
                <span className="bg-gradient-to-r from-amber-300 via-orange-300 to-amber-300 bg-clip-text text-transparent">
                  {t('home.deadlinesTitle')}
                </span>
              </h2>
              <p className="text-lg text-amber-200/70 max-w-xl mx-auto">
                {t('home.deadlinesSubtitle')}
              </p>
            </div>

            {/* Horizontal Flow - 3 Steps */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 relative items-stretch">
              {/* Connecting lines (desktop) */}
              <div className="hidden md:block absolute top-[45%] left-[22%] right-[22%] h-1 bg-gradient-to-r from-amber-500/40 via-orange-500/40 to-amber-500/40 rounded-full" />

              {/* Step 1: Define */}
              <div className="relative group flex">
                <div className="w-full bg-gradient-to-br from-amber-600/20 to-orange-600/20 backdrop-blur-xl rounded-3xl p-6 sm:p-8 text-center border border-amber-500/30 hover:border-amber-400/50 transition-all flex flex-col items-center justify-start">
                  <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mb-4 shadow-xl shadow-amber-500/40 shrink-0">
                    <Target className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{t('home.deadlinesStepDefineTitle')}</h3>
                  <p className="text-amber-200/70 text-sm m-0">
                    {t('home.deadlinesStepDefineDesc')}
                  </p>
                </div>
              </div>

              {/* Step 2: Track */}
              <div className="relative group flex">
                <div className="w-full bg-gradient-to-br from-orange-600/25 to-amber-600/25 backdrop-blur-xl rounded-3xl p-6 sm:p-8 text-center border border-orange-500/40 hover:border-orange-400/50 transition-all flex flex-col items-center justify-start">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center mb-4 shadow-xl shadow-orange-500/40 shrink-0">
                    <Activity className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{t('home.deadlinesStepTrackTitle')}</h3>
                  <p className="text-orange-200/70 text-sm m-0">
                    {t('home.deadlinesStepTrackDesc')}
                  </p>
                </div>
              </div>

              {/* Step 3: Achieve */}
              <div className="relative group flex">
                <div className="w-full bg-gradient-to-br from-amber-600/20 to-orange-600/20 backdrop-blur-xl rounded-3xl p-6 sm:p-8 text-center border border-amber-500/30 hover:border-amber-400/50 transition-all flex flex-col items-center justify-start">
                  <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mb-4 shadow-xl shadow-amber-500/40 shrink-0">
                    <TrendingUp className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{t('home.deadlinesStepAchieveTitle')}</h3>
                  <p className="text-amber-200/70 text-sm m-0">
                    {t('home.deadlinesStepAchieveDesc')}
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center">
              <Button
                size="lg"
                className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white px-8 py-6 text-lg font-semibold shadow-2xl shadow-amber-500/30"
                onClick={() => {
                  setDemoTab('deadlines');
                  const demoSection = document.getElementById('demo');
                  demoSection?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                {t('home.deadlinesButton')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Sección de Seguridad - Diseño visual trust badges */}
        <div className="relative z-10 py-12 sm:py-16 md:py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-950/20 to-transparent" />

          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="text-center mb-10 sm:mb-14">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500/30 to-teal-500/30 backdrop-blur-sm rounded-full text-white text-sm font-semibold mb-4 border border-emerald-400/40">
                <Shield className="h-4 w-4" />
                <span>{t('home.securityKicker')}</span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4 px-4">
                <span className="bg-gradient-to-r from-emerald-300 via-teal-300 to-emerald-300 bg-clip-text text-transparent">
                  {t('home.securityTitle')}
                </span>
              </h2>
              <p className="text-lg text-emerald-200/70 max-w-xl mx-auto">
                {t('home.securitySubtitle')}
              </p>
            </div>

            {/* Trust Badges Row */}
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mb-10">
              <div className="flex items-center gap-3 px-5 py-3 bg-emerald-500/20 rounded-2xl border border-emerald-500/30">
                <Lock className="h-6 w-6 text-emerald-400" />
                <span className="text-white font-semibold">{t('home.securityBadgeTls')}</span>
              </div>
              <div className="flex items-center gap-3 px-5 py-3 bg-emerald-500/20 rounded-2xl border border-emerald-500/30">
                <Shield className="h-6 w-6 text-emerald-400" />
                <span className="text-white font-semibold">{t('home.securityBadgeGdpr')}</span>
              </div>

              <div className="flex items-center gap-3 px-5 py-3 bg-emerald-500/20 rounded-2xl border border-emerald-500/30">
                <Activity className="h-6 w-6 text-emerald-400" />
                <span className="text-white font-semibold">{t('home.securityBadge247')}</span>
              </div>
            </div>

            {/* 3 Visual Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <div className="relative group">
                <div className="bg-gradient-to-br from-emerald-600/20 to-teal-600/20 backdrop-blur-xl rounded-3xl p-6 sm:p-8 text-center border border-emerald-500/30 hover:border-emerald-400/50 transition-all">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-emerald-500/40">
                    <Lock className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{t('home.securityCardEncryptionTitle')}</h3>
                  <p className="text-emerald-200/70 text-sm">
                    {t('home.securityCardEncryptionDesc')}
                  </p>
                </div>
              </div>

              <div className="relative group md:-mt-4">
                <div className="bg-gradient-to-br from-teal-600/25 to-emerald-600/25 backdrop-blur-xl rounded-3xl p-6 sm:p-8 text-center border border-teal-500/40 hover:border-teal-400/50 transition-all">
                  <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-teal-500/40">
                    <Shield className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{t('home.securityCardPrivacyTitle')}</h3>
                  <p className="text-teal-200/70 text-sm">
                    {t('home.securityCardPrivacyDesc')}
                  </p>
                </div>
              </div>

              <div className="relative group">
                <div className="bg-gradient-to-br from-emerald-600/20 to-teal-600/20 backdrop-blur-xl rounded-3xl p-6 sm:p-8 text-center border border-emerald-500/30 hover:border-emerald-400/50 transition-all">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-emerald-500/40">
                    <Database className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{t('home.securityCardInfraTitle')}</h3>
                  <p className="text-emerald-200/70 text-sm">
                    {t('home.securityCardInfraDesc')}
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center">
              <Button
                size="lg"
                variant="outline"
                className="bg-emerald-500/10 border-2 border-emerald-400/40 text-white hover:text-white hover:bg-emerald-500/20 hover:border-emerald-400/60 px-8 py-6 text-lg font-semibold backdrop-blur-md"
                onClick={() => {
                  const demoSection = document.getElementById('demo');
                  demoSection?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                {t('home.securityButton')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Demo Section */}
        <div id="demo" className="bg-white/5 backdrop-blur-sm border-t border-indigo-500/20 py-12 sm:py-16 md:py-20 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-6 sm:mb-8">
              <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-primary/100/20 backdrop-blur-sm rounded-full text-indigo-200 text-xs sm:text-sm font-medium mb-3 border border-indigo-400/30">
                <Award className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>{t('home.demoKicker')}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 sm:mb-3 px-4">
                {t('home.demoTitle')}
              </h2>
              <p className="text-sm sm:text-base text-indigo-200/90 max-w-2xl mx-auto px-4">
                {t('home.demoSubtitle')}
              </p>
            </div>

            <div className="bg-white rounded-xl sm:rounded-2xl border-2 border-indigo-200/50 shadow-2xl overflow-hidden relative">
              <DemoProvider>
                <Tabs value={demoTab} onValueChange={setDemoTab} className="w-full">
                  {/* Barra de navegación de la demo: en móvil scroll horizontal; en desktop grid 2x2 */}
                  <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-3 sm:px-4 py-3 sm:py-4 border-b-2 border-indigo-500/50">
                    <p className="text-indigo-100 text-xs sm:text-sm font-medium mb-2 sm:mb-3">
                      {t('home.demoChooseLabel')}
                    </p>
                    <TabsList className="w-full justify-start h-auto p-0 bg-transparent border-0 flex flex-nowrap sm:flex-wrap gap-2 sm:gap-3 rounded-none overflow-x-auto overflow-y-hidden custom-scrollbar min-h-[44px] -mx-1 px-1 sm:mx-0 sm:px-0">
                      <TabsTrigger
                        value="planner"
                        className={cn(
                          "flex items-center gap-2 rounded-lg px-4 py-2.5 sm:px-5 sm:py-3 min-h-[44px] min-w-0 sm:min-w-[auto] text-sm font-semibold transition-all shrink-0",
                          "bg-white/10 text-white hover:bg-white/20 data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-lg data-[state=active]:ring-2 data-[state=active]:ring-white/50"
                        )}
                      >
                        <LayoutGrid className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                        <span className="whitespace-nowrap">{t('home.demoTabPlanner')}</span>
                      </TabsTrigger>
                      <TabsTrigger
                        value="dashboard"
                        className={cn(
                          "flex items-center gap-2 rounded-lg px-4 py-2.5 sm:px-5 sm:py-3 min-h-[44px] min-w-0 sm:min-w-[auto] text-sm font-semibold transition-all shrink-0",
                          "bg-white/10 text-white hover:bg-white/20 data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-lg data-[state=active]:ring-2 data-[state=active]:ring-white/50"
                        )}
                      >
                        <LayoutDashboard className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                        <span className="whitespace-nowrap">{t('home.demoTabDashboard')}</span>
                      </TabsTrigger>
                      <TabsTrigger
                        value="weeklys"
                        className={cn(
                          "flex items-center gap-2 rounded-lg px-4 py-2.5 sm:px-5 sm:py-3 min-h-[44px] min-w-0 sm:min-w-[auto] text-sm font-semibold transition-all shrink-0",
                          "bg-white/10 text-white hover:bg-white/20 data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-lg data-[state=active]:ring-2 data-[state=active]:ring-white/50"
                        )}
                      >
                        <CalendarCheck className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                        <span className="whitespace-nowrap">{t('home.demoTabWeeklys')}</span>
                      </TabsTrigger>
                      <TabsTrigger
                        value="deadlines"
                        className={cn(
                          "flex items-center gap-2 rounded-lg px-4 py-2.5 sm:px-5 sm:py-3 min-h-[44px] min-w-0 sm:min-w-[auto] text-sm font-semibold transition-all shrink-0",
                          "bg-white/10 text-white hover:bg-white/20 data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-lg data-[state=active]:ring-2 data-[state=active]:ring-white/50"
                        )}
                      >
                        <Target className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                        <span className="whitespace-nowrap">{t('home.demoTabDeadlines')}</span>
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value="planner" className="m-0 p-3 sm:p-4 md:p-6 bg-white min-h-[380px] sm:min-h-[500px] md:min-h-[600px]">
                    <DemoPlanner />
                  </TabsContent>

                  <TabsContent value="dashboard" className="m-0 p-0 bg-slate-50 min-h-[380px] sm:min-h-[500px] md:min-h-[600px]">
                    <DemoEmployeeDashboard />
                  </TabsContent>

                  <TabsContent value="weeklys" className="m-0 p-0 bg-slate-50 min-h-[380px] sm:min-h-[500px] md:min-h-[600px]">
                    <DemoWeeklyForecastPage />
                  </TabsContent>

                  <TabsContent value="deadlines" className="m-0 p-0 bg-slate-50 min-h-[380px] sm:min-h-[500px] md:min-h-[600px]">
                    <DemoDeadlinesPage />
                  </TabsContent>
                </Tabs>
              </DemoProvider>
            </div>
          </div>
        </div>

        {/* Casos de uso y beneficios - Para equipos que valoran su tiempo */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16">
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white mb-4 sm:mb-6 px-2 sm:px-4">
              <span className="bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200 bg-clip-text text-transparent">
                {t('home.audienceTitle')}
              </span>
            </h2>
            {/* Audience badges: adaptados a móvil */}
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-4">
              {i18nAsArray<string>(t('home.audienceBadges', { returnObjects: true })).map((badge, idx) => (
                <span
                  key={idx}
                  className="px-3 sm:px-4 py-1.5 bg-primary/100/20 rounded-full text-indigo-200 text-xs sm:text-sm font-medium border border-indigo-500/30 text-center"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>



          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {/* Card: Líderes de equipo */}
            <Card className="border-2 border-indigo-500/40 bg-gradient-to-br from-indigo-950/80 to-purple-950/80 backdrop-blur-xl overflow-hidden group hover:border-indigo-400/60 transition-all">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white">{t('home.useCasesLeaderTitle')}</h3>
                </div>
                <div className="space-y-3">
                  {i18nAsArray<string>(t('home.useCasesLeaderItems', { returnObjects: true })).map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-2.5 bg-primary/100/10 rounded-lg border border-indigo-500/20">
                      <CheckCircle2 className="h-4 w-4 text-indigo-400 shrink-0" />
                      <span className="text-sm text-white/90">{item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Card: Project Managers */}
            <Card className="border-2 border-purple-500/40 bg-gradient-to-br from-purple-950/80 to-pink-950/80 backdrop-blur-xl overflow-hidden group hover:border-purple-400/60 transition-all">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white">{t('home.useCasesPmTitle')}</h3>
                </div>
                <div className="space-y-3">
                  {i18nAsArray<string>(t('home.useCasesPmItems', { returnObjects: true })).map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-2.5 bg-purple-500/10 rounded-lg border border-purple-500/20">
                      <CheckCircle2 className="h-4 w-4 text-purple-400 shrink-0" />
                      <span className="text-sm text-white/90">{item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Card: Empleados */}
            <Card className="border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-950/80 to-teal-950/80 backdrop-blur-xl overflow-hidden group hover:border-emerald-400/60 transition-all">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                    <BarChart3 className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white">{t('home.useCasesEmployeeTitle')}</h3>
                </div>
                <div className="space-y-3">
                  {i18nAsArray<string>(t('home.useCasesEmployeeItems', { returnObjects: true })).map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-2.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span className="text-sm text-white/90">{item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-indigo-500/20 rounded-2xl border border-indigo-400/30 p-8 backdrop-blur-xl">
            <div className="text-center">
              <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                {t('home.resultsTitle')}
              </h3>
              <div className="grid md:grid-cols-3 gap-6 mt-8">
                {i18nAsArray<string>(t('home.resultsMetrics', { returnObjects: true })).map((label, idx) => {
                  const values = ['70%', '85%', '60%'];
                  const gradients = [
                    'bg-gradient-to-r from-indigo-300 to-purple-300',
                    'bg-gradient-to-r from-purple-300 to-pink-300',
                    'bg-gradient-to-r from-pink-300 to-amber-300',
                  ];
                  return (
                    <div key={idx}>
                      <div className={`text-4xl font-black text-transparent bg-clip-text ${gradients[idx]} mb-2`}>
                        {values[idx]}
                      </div>
                      <p className="text-indigo-200/80 text-sm">{label}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Sección FAQ */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16">
          <div className="text-center mb-8 sm:mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/100/20 backdrop-blur-sm rounded-full text-indigo-200 text-sm font-medium mb-3 sm:mb-4 border border-indigo-400/30">
              <HelpCircle className="h-4 w-4" />
              <span>{t('home.faqKicker')}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4 sm:mb-5 px-4">
              <span className="bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200 bg-clip-text text-transparent">
                {t('home.faqTitle')}
              </span>
            </h2>
            <p className="text-base sm:text-lg text-white/90 max-w-2xl mx-auto px-4">
              {t('home.faqSubtitle')}
            </p>
          </div>

          <Card className="border-2 border-white/10 bg-white/5 backdrop-blur-xl">
            <CardContent className="p-4 sm:p-6">
              <Accordion type="single" collapsible className="w-full space-y-2">
                {Array.isArray(faqItems) &&
                  faqItems.map((item, idx) => {
                    const FaqIcon = idx < 6 ? HelpCircle : idx < 8 ? Shield : idx === 8 ? Lock : Database;
                    const iconClass =
                      idx < 6 ? 'text-indigo-300' : idx < 10 ? 'text-emerald-300' : 'text-emerald-300';
                    const isLast = idx === faqItems.length - 1;
                    return (
                      <AccordionItem
                        key={idx}
                        value={`item-${idx + 1}`}
                        className={isLast ? 'border-b-0' : 'border-b border-white/10'}
                      >
                        <AccordionTrigger className="text-white hover:text-indigo-200 text-left py-4">
                          <div className="flex items-center gap-3">
                            <FaqIcon className={`h-5 w-5 shrink-0 ${iconClass}`} />
                            <span className="font-semibold">{item.question}</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="text-white/90 text-sm sm:text-base leading-relaxed pt-2 pb-4 pl-8">
                          {item.answer ? (
                            item.answer
                          ) : (
                            <>
                              {item.answerBefore}
                              <Link
                                to={localizedPathFromEs(item.answerLinkPath ?? '/api-docs', i18n.language)}
                                className="text-indigo-300 hover:text-white underline underline-offset-2"
                              >
                                {item.answerLinkText}
                              </Link>
                              {item.answerAfter}
                            </>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
              </Accordion>
            </CardContent>
          </Card>

          <div className="text-center mt-8">
            <Link to="/login?tab=register">
              <Button
                size="lg"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-6 text-lg font-semibold shadow-2xl"
              >
                {t('home.faqCta')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* CTA Section: adaptado a móvil */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 py-12 sm:py-20 md:py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.15),transparent_70%)] -z-10" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.1),transparent_50%)] -z-10" />
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <div className="inline-block mb-3 sm:mb-4">
              <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
                <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                <span className="text-xs sm:text-sm font-semibold text-white">{t('home.ctaBadgeLabel')}</span>
              </div>
            </div>
            <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-3 sm:mb-6 leading-tight px-1">
              {t('home.ctaTitle')}
            </h2>
            <p className="text-base sm:text-xl md:text-2xl text-indigo-100 mb-6 sm:mb-10 font-light max-w-2xl mx-auto px-2">
              {t('home.ctaSubtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center flex-wrap w-full sm:w-auto max-w-sm sm:max-w-none mx-auto">
              <Link to="/login?tab=register" className="group relative">
                <div className="absolute -inset-1 bg-white rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-300" />
                <Button size="lg" className="relative w-full sm:w-auto bg-white text-primary hover:bg-slate-50 px-6 sm:px-10 py-5 sm:py-7 text-base sm:text-xl font-bold shadow-2xl hover:shadow-white/50 transition-all transform hover:scale-105 min-h-[48px]">
                  {t('home.ctaPrimary')}
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/pitch">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto px-5 sm:px-8 py-5 sm:py-7 text-sm sm:text-lg font-semibold border-2 border-white/40 text-white hover:text-white hover:bg-white/20 hover:border-white/60 bg-white/10 backdrop-blur-md shadow-xl min-h-[48px]"
                >
                  {t('home.ctaPitch')}
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto px-6 sm:px-10 py-5 sm:py-7 text-base sm:text-xl font-semibold border-2 border-white/40 text-white hover:text-white hover:bg-white/20 hover:border-white/60 bg-white/10 backdrop-blur-md shadow-xl min-h-[48px]"
                onClick={() => {
                  const demoSection = document.getElementById('demo');
                  demoSection?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                {t('home.ctaDemo')}
              </Button>
            </div>
          </div>
        </div>

        <LandingFooter />
      </div>
    </>
  );
}
