import { LocaleLink } from './LocaleLink';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  BarChart3,
  Users,
  Target,
  LayoutGrid,
  Wallet,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  GanttChart,
  PieChart,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { RevealOnScroll } from './RevealOnScroll';
import { BlogReadingTime } from './BlogReadingTime';
import { BlogTOC } from './BlogTOC';
import { BlogRelatedPost } from './BlogRelatedPost';
import type { BlogTOCItem } from './BlogTOC';

export interface PlanificacionProyectosArticleProps {
  readingMinutes?: number;
  tocItems?: BlogTOCItem[];
  relatedPost?: { title: string; description: string; href: string };
}

export function PlanificacionProyectosArticle({
  readingMinutes,
  tocItems,
  relatedPost,
}: PlanificacionProyectosArticleProps) {
  const { t } = useTranslation('blog');

  return (
    <article
      id="planificacion-proyectos-cronograma-recursos"
      className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 md:py-16 text-left overflow-x-hidden"
    >
      {/* Gancho y título */}
      <section className="mb-12 sm:mb-14">
        <div className="mb-6 text-center flex flex-col items-center gap-3">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-indigo-300 bg-indigo-500/20 border border-indigo-400/30">
            {t('posts.planificacionProyectos.badge')}
          </span>
          {readingMinutes != null && <BlogReadingTime minutes={readingMinutes} />}
        </div>
        <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-[2.75rem] font-black text-white mb-5 sm:mb-6 leading-[1.15] tracking-tight text-center">
          {t('posts.planificacionProyectos.title')}
        </h1>
        <div className="space-y-4 text-indigo-100/95 text-base sm:text-lg leading-[1.75]">
          <p>
            {t('posts.planificacionProyectos.intro.p1')}
          </p>
          <div className="rounded-2xl border-l-4 border-indigo-400 bg-indigo-500/10 border border-indigo-500/20 p-4 sm:p-6 my-6">
            <p className="text-white/95 font-medium m-0">
              {t('posts.planificacionProyectos.intro.callout')}
            </p>
          </div>
        </div>
      </section>

      {tocItems != null && tocItems.length > 0 && (
        <div className="mb-12">
          <BlogTOC items={tocItems} />
        </div>
      )}

      {/* 1. Qué es la planificación de proyectos */}
      <RevealOnScroll>
        <section id="que-es-planificacion" className="mb-12 sm:mb-16">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6">
            {t('posts.planificacionProyectos.section1.title')}
          </h2>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-6">
            <p>
              {t('posts.planificacionProyectos.section1.p1')}
            </p>
            <p>
              {t('posts.planificacionProyectos.section1.p2')}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 sm:p-8 mb-6 transition-all duration-300 hover:border-white/20 hover:shadow-xl hover:shadow-indigo-500/10">
          <h3 className="text-lg sm:text-xl font-bold text-white mb-4">
            {t('posts.planificacionProyectos.section1.phasesTitle')}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-indigo-950/50 border border-indigo-500/20 text-center flex flex-col items-center">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/30 flex items-center justify-center mb-2">
                <Target className="h-5 w-5 text-indigo-300" />
              </div>
              <h4 className="text-white font-semibold text-sm mb-1">
                {t('posts.planificacionProyectos.section1.phaseStartTitle')}
              </h4>
              <p className="text-xs text-indigo-200/85">
                {t('posts.planificacionProyectos.section1.phaseStartText')}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-purple-950/50 border border-purple-500/20 text-center flex flex-col items-center">
              <div className="w-10 h-10 rounded-lg bg-purple-500/30 flex items-center justify-center mb-2">
                <LayoutGrid className="h-5 w-5 text-purple-300" />
              </div>
              <h4 className="text-white font-semibold text-sm mb-1">
                {t('posts.planificacionProyectos.section1.phasePlanningTitle')}
              </h4>
              <p className="text-xs text-indigo-200/85">
                {t('posts.planificacionProyectos.section1.phasePlanningText')}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-emerald-950/50 border border-emerald-500/20 text-center flex flex-col items-center">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/30 flex items-center justify-center mb-2">
                <Clock className="h-5 w-5 text-emerald-300" />
              </div>
              <h4 className="text-white font-semibold text-sm mb-1">
                {t('posts.planificacionProyectos.section1.phaseExecutionTitle')}
              </h4>
              <p className="text-xs text-indigo-200/85">
                {t('posts.planificacionProyectos.section1.phaseExecutionText')}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-amber-950/50 border border-amber-500/20 text-center flex flex-col items-center">
              <div className="w-10 h-10 rounded-lg bg-amber-500/30 flex items-center justify-center mb-2">
                <CheckCircle2 className="h-5 w-5 text-amber-300" />
              </div>
              <h4 className="text-white font-semibold text-sm mb-1">
                {t('posts.planificacionProyectos.section1.phaseCloseTitle')}
              </h4>
              <p className="text-xs text-indigo-200/85">
                {t('posts.planificacionProyectos.section1.phaseCloseText')}
              </p>
            </div>
          </div>
        </div>

          <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            {t('posts.planificacionProyectos.section1.p3')}
          </p>
        </section>
      </RevealOnScroll>

      {/* 2. El cronograma y el diagrama de Gantt */}
      <RevealOnScroll delay={1}>
        <section id="cronograma-gantt" className="mb-12 sm:mb-16">
        <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6">
          {t('posts.planificacionProyectos.section2.title')}
        </h2>
        <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-6">
          <p>
            {t('posts.planificacionProyectos.section2.p1')}
          </p>
          <p>
            {t('posts.planificacionProyectos.section2.p2')}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 sm:p-8 mb-6 transition-all duration-300 hover:border-white/20 hover:shadow-xl hover:shadow-amber-500/10">
          <h3 className="text-lg sm:text-xl font-bold text-white mb-3">
            {t('posts.planificacionProyectos.section2.compareTitle')}
          </h3>
          <p className="text-indigo-100/90 mb-4">
            {t('posts.planificacionProyectos.section2.compareIntro')}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-800/50 border border-white/10 text-center flex flex-col items-center">
              <GanttChart className="h-8 w-8 text-amber-400 mb-3" />
              <h4 className="text-white font-semibold mb-2">
                {t('posts.planificacionProyectos.section2.onlyTasksTitle')}
              </h4>
              <p className="text-sm text-indigo-200/90">
                {t('posts.planificacionProyectos.section2.onlyTasksText')}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-indigo-950/50 border border-indigo-500/20 text-center flex flex-col items-center">
              <div className="flex items-center gap-2 mb-3">
                <GanttChart className="h-6 w-6 text-indigo-400" />
                <Users className="h-6 w-6 text-indigo-400" />
              </div>
              <h4 className="text-white font-semibold mb-2">
                {t('posts.planificacionProyectos.section2.tasksResourcesTitle')}
              </h4>
              <p className="text-sm text-indigo-200/90">
                {t('posts.planificacionProyectos.section2.tasksResourcesText')}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border-l-4 border-amber-400 bg-amber-500/10 border border-amber-500/20 p-4 sm:p-6">
          <h3 className="text-lg font-bold text-white mb-2">
            {t('posts.planificacionProyectos.section2.limitationTitle')}
          </h3>
          <p className="text-indigo-100/90 m-0">
            {t('posts.planificacionProyectos.section2.limitationText')}
          </p>
        </div>
        </section>
      </RevealOnScroll>

      {/* 3. Presupuesto del proyecto */}
      <RevealOnScroll delay={2}>
        <section id="presupuesto-proyecto" className="mb-12 sm:mb-16">
        <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6">
          {t('posts.planificacionProyectos.section3.title')}
        </h2>
        <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-6">
          <p>
            {t('posts.planificacionProyectos.section3.p1')}
          </p>
          <p>
            {t('posts.planificacionProyectos.section3.p2')}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 sm:p-8 mb-6 transition-all duration-300 hover:border-white/20 hover:shadow-xl hover:shadow-purple-500/10">
          <h3 className="text-lg sm:text-xl font-bold text-white mb-4">
            {t('posts.planificacionProyectos.section3.triangleTitle')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-indigo-950/50 border border-indigo-500/20 text-center">
              <Target className="h-7 w-7 text-indigo-400 mx-auto mb-2" />
              <h4 className="text-white font-semibold text-sm mb-1">
                {t('posts.planificacionProyectos.section3.triangleScopeTitle')}
              </h4>
              <p className="text-xs text-indigo-200/85">
                {t('posts.planificacionProyectos.section3.triangleScopeText')}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-purple-950/50 border border-purple-500/20 text-center">
              <Clock className="h-7 w-7 text-purple-400 mx-auto mb-2" />
              <h4 className="text-white font-semibold text-sm mb-1">
                {t('posts.planificacionProyectos.section3.triangleTimeTitle')}
              </h4>
              <p className="text-xs text-indigo-200/85">
                {t('posts.planificacionProyectos.section3.triangleTimeText')}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-emerald-950/50 border border-emerald-500/20 text-center">
              <Wallet className="h-7 w-7 text-emerald-400 mx-auto mb-2" />
              <h4 className="text-white font-semibold text-sm mb-1">
                {t('posts.planificacionProyectos.section3.triangleCostTitle')}
              </h4>
              <p className="text-xs text-indigo-200/85">
                {t('posts.planificacionProyectos.section3.triangleCostText')}
              </p>
            </div>
          </div>
          <p className="text-indigo-200/80 text-sm mt-4 text-center">
            {t('posts.planificacionProyectos.section3.triangleNote')}
          </p>
        </div>

        <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed">
          {t('posts.planificacionProyectos.section3.p3')}
        </p>
        </section>
      </RevealOnScroll>

      {/* 4. Recursos y capacidad */}
      <RevealOnScroll delay={3}>
        <section id="recursos-capacidad" className="mb-12 sm:mb-16">
        <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6">
          {t('posts.planificacionProyectos.section4.title')}
        </h2>
        <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-6">
          <p>
            {t('posts.planificacionProyectos.section4.p1')}
          </p>
          <p>
            {t('posts.planificacionProyectos.section4.p2')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
          <div className="rounded-2xl border border-red-500/30 bg-gradient-to-br from-red-900/40 to-orange-900/20 p-5 sm:p-6 flex flex-col items-center text-center shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:border-red-400/50">
            <div className="w-12 h-12 rounded-xl bg-red-500/30 flex items-center justify-center mb-4">
              <AlertTriangle className="h-6 w-6 text-red-300" />
            </div>
            <h3 className="text-white font-bold mb-3 text-lg">
              {t('posts.planificacionProyectos.section4.noVisibilityTitle')}
            </h3>
            <p className="text-indigo-100/90 text-sm leading-relaxed">
              {t('posts.planificacionProyectos.section4.noVisibilityText')}
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-900/40 to-teal-900/20 p-5 sm:p-6 flex flex-col items-center text-center shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:border-emerald-400/50">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/30 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-6 w-6 text-emerald-300" />
            </div>
            <h3 className="text-white font-bold mb-3 text-lg">
              {t('posts.planificacionProyectos.section4.capacityPlanningTitle')}
            </h3>
            <p className="text-indigo-100/90 text-sm leading-relaxed">
              {t('posts.planificacionProyectos.section4.capacityPlanningText')}
            </p>
          </div>
        </div>

        <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-6">
          {t('posts.planificacionProyectos.section4.p3')}{' '}
          <LocaleLink to="/blog/que-es-timeboxing" className="text-indigo-300 hover:text-white underline underline-offset-2">
            {t('posts.planificacionProyectos.section4.timeboxingLink')}
          </LocaleLink>
          .
        </p>

        <div className="rounded-2xl border-2 border-indigo-500/40 bg-indigo-900/30 p-5 sm:p-8 flex flex-col md:flex-row gap-6 items-center shadow-2xl transition-all duration-300 hover:shadow-indigo-500/20 hover:border-indigo-400/60 hover:scale-[1.01]">
          <div className="flex-1">
            <h4 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <span className="text-xl">💡</span> {t('posts.planificacionProyectos.section4.capsuleTitle')}
            </h4>
            <p className="text-indigo-200/90 text-sm sm:text-base leading-relaxed mb-4">
              {t('posts.planificacionProyectos.section4.capsuleText')}
            </p>
            <LocaleLink to="/planificador-recursos">
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-lg shadow-indigo-500/30 transition-all duration-200 hover:scale-105">
                {t('posts.planificacionProyectos.section4.capsuleCta')}{' '}
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </LocaleLink>
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/30 p-5 sm:p-6 mt-6">
          <p className="text-indigo-100/90 m-0">
            {t('posts.planificacionProyectos.section4.summaryText')}
          </p>
        </div>
        </section>
      </RevealOnScroll>

      {/* 5. Seguimiento, KPIs y dashboard */}
      <RevealOnScroll>
        <section id="seguimiento-kpis-dashboard" className="mb-12 sm:mb-16">
        <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6">
          {t('posts.planificacionProyectos.section5.title')}
        </h2>
        <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-6">
          {t('posts.planificacionProyectos.section5.p1')}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 mb-8">
          <div className="rounded-2xl border border-indigo-500/20 bg-indigo-950/30 p-5 flex flex-col items-center text-center transition-all duration-300 hover:border-indigo-400/40 hover:scale-[1.02] hover:shadow-lg hover:shadow-indigo-500/20">
            <BarChart3 className="h-8 w-8 text-indigo-400 mb-4" />
            <h4 className="text-white font-bold mb-2">
              {t('posts.planificacionProyectos.section5.kpiProgressTitle')}
            </h4>
            <p className="text-sm text-indigo-200/85">
              {t('posts.planificacionProyectos.section5.kpiProgressText')}
            </p>
          </div>
          <div className="rounded-2xl border border-purple-500/20 bg-purple-950/30 p-5 flex flex-col items-center text-center transition-all duration-300 hover:border-purple-400/40 hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/20">
            <Clock className="h-8 w-8 text-purple-400 mb-4" />
            <h4 className="text-white font-bold mb-2">
              {t('posts.planificacionProyectos.section5.kpiHoursTitle')}
            </h4>
            <p className="text-sm text-indigo-200/85">
              {t('posts.planificacionProyectos.section5.kpiHoursText')}
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/30 p-5 flex flex-col items-center text-center transition-all duration-300 hover:border-emerald-400/40 hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-500/20">
            <PieChart className="h-8 w-8 text-emerald-400 mb-4" />
            <h4 className="text-white font-bold mb-2">
              {t('posts.planificacionProyectos.section5.kpiMarginTitle')}
            </h4>
            <p className="text-sm text-indigo-200/85">
              {t('posts.planificacionProyectos.section5.kpiMarginText')}
            </p>
          </div>
        </div>

        <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-4">
          {t('posts.planificacionProyectos.section5.p2')}
        </p>
        <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed">
          {t('posts.planificacionProyectos.section5.p3')}
        </p>
        </section>
      </RevealOnScroll>

      {/* 6. Herramientas */}
      <RevealOnScroll delay={1}>
        <section id="herramientas-gestion-proyectos" className="mb-12 sm:mb-16">
        <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6">
          {t('posts.planificacionProyectos.section6.title')}
        </h2>
        <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-6">
          {t('posts.planificacionProyectos.section6.p1')}
        </p>

        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 sm:p-8 mb-6 transition-all duration-300 hover:border-white/20 hover:shadow-xl">
          <h3 className="text-lg sm:text-xl font-bold text-white mb-3">
            {t('posts.planificacionProyectos.section6.toolsTitle')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-800/50 border border-white/10 flex flex-col transition-all duration-300 hover:border-white/20 hover:scale-[1.02]">
              <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                <LayoutGrid className="h-5 w-5 text-indigo-400" />{' '}
                {t('posts.planificacionProyectos.section6.toolsBoardsTitle')}
              </h4>
              <p className="text-sm text-indigo-200/90">
                {t('posts.planificacionProyectos.section6.toolsBoardsText')}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-indigo-950/50 border border-indigo-500/20 flex flex-col transition-all duration-300 hover:border-indigo-400/40 hover:scale-[1.02] hover:shadow-lg hover:shadow-indigo-500/20">
              <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-400" />{' '}
                {t('posts.planificacionProyectos.section6.toolsPlanningTitle')}
              </h4>
              <p className="text-sm text-indigo-200/90">
                {t('posts.planificacionProyectos.section6.toolsPlanningText')}
              </p>
            </div>
          </div>
        </div>

        <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-6">
          {t('posts.planificacionProyectos.section6.p2')}
        </p>

        <div className="rounded-2xl border-2 border-purple-500/40 bg-purple-900/30 p-5 sm:p-8 flex flex-col md:flex-row gap-6 items-center shadow-2xl transition-all duration-300 hover:shadow-purple-500/20 hover:border-purple-400/60 hover:scale-[1.01]">
          <div className="flex-1">
            <h4 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <span className="text-xl">📊</span> {t('posts.planificacionProyectos.section6.capsuleTitle')}
            </h4>
            <p className="text-indigo-200/90 text-sm sm:text-base leading-relaxed mb-4">
              {t('posts.planificacionProyectos.section6.capsuleText')}
            </p>
            <div className="flex flex-wrap gap-3">
              <LocaleLink to="/planificador-recursos">
                <Button size="sm" className="bg-purple-600 hover:bg-purple-500 text-white font-medium shadow-lg shadow-purple-500/30 transition-all duration-200 hover:scale-105 hover:shadow-purple-500/40">
                  {t('posts.planificacionProyectos.section6.capsulePlannerCta')}{' '}
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </LocaleLink>
              <LocaleLink to="/reportes-rentabilidad">
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-lg shadow-emerald-500/30 transition-all duration-200 hover:scale-105 hover:shadow-emerald-500/40 border-0">
                  {t('posts.planificacionProyectos.section6.capsuleReportsCta')}{' '}
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </LocaleLink>
            </div>
          </div>
        </div>

        <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed mt-6">
          {t('posts.planificacionProyectos.section6.pricesIntro')}{' '}
          <LocaleLink to="/precios" className="text-indigo-300 hover:text-white underline underline-offset-2">
            {t('posts.planificacionProyectos.section6.pricesLink')}
          </LocaleLink>
          .
        </p>
        </section>
      </RevealOnScroll>

      {/* 7. Resumen, FAQ y CTA */}
      <RevealOnScroll delay={2}>
        <section className="mb-12">
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 sm:p-8 mb-8">
          <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-4">
            {t('posts.planificacionProyectos.section7.summary.p1')}
          </p>
          <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed m-0">
            {t('posts.planificacionProyectos.section7.summary.p2')}
          </p>
        </div>

        <div id="preguntas-frecuentes" className="rounded-3xl border border-indigo-500/30 bg-indigo-950/40 p-6 sm:p-10 mb-10 transition-all duration-300 hover:border-indigo-400/50 hover:shadow-xl hover:shadow-indigo-500/10 scroll-mt-24">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-5 text-center">
            {t('posts.planificacionProyectos.section7.faqTitle')}
          </h2>
          <div className="space-y-6">
            <div>
              <h4 className="text-white font-semibold mb-2">
                {t('posts.planificacionProyectos.section7.faq1Question')}
              </h4>
              <p className="text-sm text-indigo-200/90">
                {t('posts.planificacionProyectos.section7.faq1Answer')}
              </p>
            </div>
            <div className="w-full h-px bg-white/10" />
            <div>
              <h4 className="text-white font-semibold mb-2">
                {t('posts.planificacionProyectos.section7.faq2Question')}
              </h4>
              <p className="text-sm text-indigo-200/90">
                {t('posts.planificacionProyectos.section7.faq2Answer')}
              </p>
            </div>
            <div className="w-full h-px bg-white/10" />
            <div>
              <h4 className="text-white font-semibold mb-2">
                {t('posts.planificacionProyectos.section7.faq3Question')}
              </h4>
              <p className="text-sm text-indigo-200/90">
                {t('posts.planificacionProyectos.section7.faq3Answer')}
              </p>
            </div>
          </div>
        </div>

        <div id="cta-planifica" className="text-center mt-12 mb-8 scroll-mt-24">
          <h2 className="text-2xl sm:text-4xl font-bold text-white mb-4">
            {t('posts.planificacionProyectos.section7.ctaTitle')}
          </h2>
          <p className="text-indigo-100/90 text-lg mb-8 max-w-2xl mx-auto">
            {t('posts.planificacionProyectos.section7.ctaText')}
          </p>
          <LocaleLink to="/planificador-recursos">
            <Button
              size="lg"
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-10 py-6 text-lg font-bold shadow-xl shadow-indigo-500/30 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-indigo-500/40"
            >
              {t('posts.planificacionProyectos.section7.ctaButton')}{' '}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </LocaleLink>
          {relatedPost != null && (
            <div className="mt-12 max-w-xl mx-auto">
              <BlogRelatedPost
                title={relatedPost.title}
                description={relatedPost.description}
                href={relatedPost.href}
              />
            </div>
          )}
          <p className="text-indigo-300 text-sm mt-6 italic">
            {t('posts.planificacionProyectos.section7.authorNote')}
          </p>
        </div>
        </section>
      </RevealOnScroll>
    </article>
  );
}
