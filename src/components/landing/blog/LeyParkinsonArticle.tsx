import { LocaleLink } from './LocaleLink';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  Clock,
  BookOpen,
  AlertTriangle,
  CheckCircle2,
  Target,
  TrendingUp,
  Users,
  CalendarDays,
  ChevronRight,
  Quote,
  Zap,
  Building2,
  Wallet,
  MessageSquareWarning,
} from 'lucide-react';
import { RevealOnScroll } from './RevealOnScroll';
import { BlogReadingTime } from './BlogReadingTime';
import { BlogTOC } from './BlogTOC';
import { BlogRelatedPost } from './BlogRelatedPost';
import { ParkinsonLawVisual } from './ParkinsonLawVisual';
import type { BlogTOCItem } from './BlogTOC';

export interface LeyParkinsonArticleProps {
  readingMinutes?: number;
  tocItems?: BlogTOCItem[];
  relatedPost?: { title: string; description: string; href: string };
}

export function LeyParkinsonArticle({
  readingMinutes,
  tocItems,
  relatedPost,
}: LeyParkinsonArticleProps) {
  const { t } = useTranslation('blog');

  return (
    <article
      id="ley-parkinson"
      className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 md:py-16 text-left overflow-x-hidden"
    >
      {/* Gancho y título */}
      <section className="mb-12 sm:mb-14">
        <div className="mb-6 text-center flex flex-col items-center gap-3">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-indigo-300 bg-indigo-500/20 border border-indigo-400/30">
            {t('posts.leyParkinson.badge')}
          </span>
          {readingMinutes != null && <BlogReadingTime minutes={readingMinutes} />}
        </div>
        <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-[2.75rem] font-black text-white mb-5 sm:mb-6 leading-[1.15] tracking-tight text-center">
          {t('posts.leyParkinson.title')}
        </h1>
        <div className="space-y-4 text-indigo-100/95 text-base sm:text-lg leading-[1.75]">
          <p>
            {t('posts.leyParkinson.intro.paragraph1.part1')}{' '}
            <strong>{t('posts.leyParkinson.intro.paragraph1.highlight')}</strong>
            {t('posts.leyParkinson.intro.paragraph1.part2')}
          </p>
          <div className="rounded-2xl border-l-4 border-indigo-400 bg-indigo-500/10 border border-indigo-500/20 p-4 sm:p-6 my-6">
            <p className="text-white/95 font-medium m-0">
              {t('posts.leyParkinson.intro.highlightBox.part1')}{' '}
              <strong>{t('posts.leyParkinson.intro.highlightBox.originHighlight')}</strong>
              {t('posts.leyParkinson.intro.highlightBox.part2')}{' '}
              <strong>{t('posts.leyParkinson.intro.highlightBox.secondLawHighlight')}</strong>
              {t('posts.leyParkinson.intro.highlightBox.part3')}{' '}
              <strong>{t('posts.leyParkinson.intro.highlightBox.trivialityHighlight')}</strong>
              {t('posts.leyParkinson.intro.highlightBox.part4')}
            </p>
          </div>
        </div>
      </section>

      {tocItems != null && tocItems.length > 0 && (
        <div className="mb-12">
          <BlogTOC items={tocItems} />
        </div>
      )}

      {/* 1. Qué es la Ley de Parkinson */}
      <RevealOnScroll>
        <section id="que-es-ley-parkinson" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6">
            {t('posts.leyParkinson.sections.whatIs.title')}
          </h2>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-6">
            <p>
              {t('posts.leyParkinson.sections.whatIs.paragraph1.part1')}{' '}
              <strong>{t('posts.leyParkinson.sections.whatIs.paragraph1.highlight1')}</strong>{' '}
              {t('posts.leyParkinson.sections.whatIs.paragraph1.part2')}{' '}
              <strong>{t('posts.leyParkinson.sections.whatIs.paragraph1.highlight2')}</strong>{' '}
              {t('posts.leyParkinson.sections.whatIs.paragraph1.part3')}
            </p>
            <p>
              {t('posts.leyParkinson.sections.whatIs.paragraph2')}
            </p>
          </div>

          <div className="my-8">
            <ParkinsonLawVisual />
          </div>

          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            <p>
              {t('posts.leyParkinson.sections.whatIs.paragraph3.part1')}{' '}
              <strong>{t('posts.leyParkinson.sections.whatIs.paragraph3.highlight')}</strong>
              {t('posts.leyParkinson.sections.whatIs.paragraph3.part2')}
            </p>
          </div>
        </section>
      </RevealOnScroll>

      {/* 2. Formulación y origen */}
      <RevealOnScroll delay={1}>
        <section id="formulacion-origen" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6">
            {t('posts.leyParkinson.sections.formulation.title')}
          </h2>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-6">
            <p>
              {t('posts.leyParkinson.sections.formulation.paragraph1.part1')}{' '}
              <strong>{t('posts.leyParkinson.sections.formulation.paragraph1.quote')}</strong>
              {t('posts.leyParkinson.sections.formulation.paragraph1.part2')}
            </p>
          </div>

          <div className="rounded-2xl border border-amber-500/20 bg-amber-950/30 p-5 sm:p-6 flex gap-4">
            <Quote className="h-8 w-8 text-amber-400/80 shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-100/95 font-medium italic mb-2">
                {t('posts.leyParkinson.sections.formulation.quoteBox.text')}
              </p>
              <p className="text-amber-200/80 text-sm">
                {t('posts.leyParkinson.sections.formulation.quoteBox.attribution')}
              </p>
            </div>
          </div>

          <p className="text-indigo-200/85 text-sm sm:text-base mt-6 mb-0">
            {t('posts.leyParkinson.sections.formulation.caption')}
          </p>
        </section>
      </RevealOnScroll>

      {/* Origen burocrático y estructura */}
      <RevealOnScroll delay={1}>
        <section id="parkinson-estructura-burocracia" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6 flex items-center gap-3">
            <Building2 className="h-8 w-8 text-slate-300 shrink-0" />
            {t('posts.leyParkinson.sections.origin.title')}
          </h2>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            <p>
              {t('posts.leyParkinson.sections.origin.paragraph1.part1')}{' '}
              <strong>{t('posts.leyParkinson.sections.origin.paragraph1.highlight')}</strong>
              {t('posts.leyParkinson.sections.origin.paragraph1.part2')}
            </p>
            <p>
              {t('posts.leyParkinson.sections.origin.paragraph2.part1')}{' '}
              <strong>{t('posts.leyParkinson.sections.origin.paragraph2.highlight1')}</strong>
              {t('posts.leyParkinson.sections.origin.paragraph2.part2')}{' '}
              <strong>{t('posts.leyParkinson.sections.origin.paragraph2.highlight2')}</strong>
              {t('posts.leyParkinson.sections.origin.paragraph2.part3')}
            </p>
            <div className="rounded-2xl border border-indigo-500/30 bg-indigo-950/50 p-5 sm:p-6 my-6">
              <p className="text-white font-medium m-0 text-base sm:text-lg leading-relaxed">
                {t('posts.leyParkinson.sections.origin.highlightBox.part1')}{' '}
                <strong>{t('posts.leyParkinson.sections.origin.highlightBox.highlight')}</strong>
                {t('posts.leyParkinson.sections.origin.highlightBox.part2')}
              </p>
            </div>
            <p>
              {t('posts.leyParkinson.sections.origin.paragraph3.part1')}{' '}
              <strong>{t('posts.leyParkinson.sections.origin.paragraph3.highlight')}</strong>
              {t('posts.leyParkinson.sections.origin.paragraph3.part2')}
            </p>
          </div>
        </section>
      </RevealOnScroll>

      {/* Segunda ley: gastos */}
      <RevealOnScroll delay={1}>
        <section id="segunda-ley-gastos" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6 flex items-center gap-3">
            <Wallet className="h-8 w-8 text-emerald-400 shrink-0" />
            {t('posts.leyParkinson.sections.secondLaw.title')}
          </h2>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            <p>
              {t('posts.leyParkinson.sections.secondLaw.paragraph1.part1')}{' '}
              <strong>{t('posts.leyParkinson.sections.secondLaw.paragraph1.highlight1')}</strong>
              {t('posts.leyParkinson.sections.secondLaw.paragraph1.part2')}{' '}
              <strong>{t('posts.leyParkinson.sections.secondLaw.paragraph1.highlight2')}</strong>
              {t('posts.leyParkinson.sections.secondLaw.paragraph1.part3')}
            </p>
            <p>
              {t('posts.leyParkinson.sections.secondLaw.paragraph2.part1')}{' '}
              <strong>{t('posts.leyParkinson.sections.secondLaw.paragraph2.highlight')}</strong>
              {t('posts.leyParkinson.sections.secondLaw.paragraph2.part2')}
            </p>
            <p>
              {t('posts.leyParkinson.sections.secondLaw.paragraph3.part1')}{' '}
              <strong>{t('posts.leyParkinson.sections.secondLaw.paragraph3.highlight1')}</strong>,{' '}
              <strong>{t('posts.leyParkinson.sections.secondLaw.paragraph3.highlight2')}</strong>{' '}
              {t('posts.leyParkinson.sections.secondLaw.paragraph3.part2')}{' '}
              <strong>{t('posts.leyParkinson.sections.secondLaw.paragraph3.highlight3')}</strong>
              {t('posts.leyParkinson.sections.secondLaw.paragraph3.part3')}
            </p>
          </div>
        </section>
      </RevealOnScroll>

      {/* 3. Ejemplos */}
      <RevealOnScroll delay={1}>
        <section id="ejemplos-ley-parkinson" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6">
            {t('posts.leyParkinson.sections.examples.title')}
          </h2>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-6">
            <p>
              {t('posts.leyParkinson.sections.examples.paragraph')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                <Clock className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <h4 className="text-white font-semibold mb-2">
                  {t('posts.leyParkinson.sections.examples.cards.reports.title')}
                </h4>
                <p className="text-sm text-indigo-200/90">
                  {t('posts.leyParkinson.sections.examples.cards.reports.description')}
                </p>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0">
                <Users className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <h4 className="text-white font-semibold mb-2">
                  {t('posts.leyParkinson.sections.examples.cards.meetings.title')}
                </h4>
                <p className="text-sm text-indigo-200/90">
                  {t('posts.leyParkinson.sections.examples.cards.meetings.description')}
                </p>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center shrink-0">
                <Target className="h-5 w-5 text-indigo-400" />
              </div>
              <div>
                <h4 className="text-white font-semibold mb-2">
                  {t('posts.leyParkinson.sections.examples.cards.projects.title')}
                </h4>
                <p className="text-sm text-indigo-200/90">
                  {t('posts.leyParkinson.sections.examples.cards.projects.description')}
                </p>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                <TrendingUp className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <h4 className="text-white font-semibold mb-2">
                  {t('posts.leyParkinson.sections.examples.cards.budget.title')}
                </h4>
                <p className="text-sm text-indigo-200/90">
                  {t('posts.leyParkinson.sections.examples.cards.budget.description')}
                </p>
              </div>
            </div>
          </div>
        </section>
      </RevealOnScroll>

      {/* Ley de la trivialidad */}
      <RevealOnScroll delay={1}>
        <section id="ley-trivialidad" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6 flex items-center gap-3">
            <MessageSquareWarning className="h-8 w-8 text-amber-400 shrink-0" />
            {t('posts.leyParkinson.sections.triviality.title')}
          </h2>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            <p>
              {t('posts.leyParkinson.sections.triviality.paragraph1.part1')}{' '}
              <strong>{t('posts.leyParkinson.sections.triviality.paragraph1.highlight1')}</strong>
              {t('posts.leyParkinson.sections.triviality.paragraph1.part2')}{' '}
              <strong>{t('posts.leyParkinson.sections.triviality.paragraph1.highlight2')}</strong>
              {t('posts.leyParkinson.sections.triviality.paragraph1.part3')}
            </p>
            <div className="rounded-2xl border border-amber-500/25 bg-amber-950/30 p-5 sm:p-6 my-6">
              <p className="text-amber-100/95 font-medium m-0">
                <strong>{t('posts.leyParkinson.sections.triviality.warningBox.title')}</strong>{' '}
                {t('posts.leyParkinson.sections.triviality.warningBox.body')}
              </p>
            </div>
            <p>
              <strong>{t('posts.leyParkinson.sections.triviality.howTo.title')}</strong>{' '}
              {t('posts.leyParkinson.sections.triviality.howTo.body')}
            </p>
          </div>
        </section>
      </RevealOnScroll>

      {/* 4. Evidencia y estudios */}
      <RevealOnScroll delay={1}>
        <section id="evidencia-estudios" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6">
            {t('posts.leyParkinson.sections.evidence.title')}
          </h2>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-6">
            <p>
              {t('posts.leyParkinson.sections.evidence.paragraph')}
            </p>
            <ul className="space-y-2 list-disc pl-6 text-indigo-100/90">
              <li>
                <strong className="text-white">
                  {t('posts.leyParkinson.sections.evidence.bullets.deadlines.title')}
                </strong>{' '}
                {t('posts.leyParkinson.sections.evidence.bullets.deadlines.body')}
              </li>
              <li>
                <strong className="text-white">
                  {t('posts.leyParkinson.sections.evidence.bullets.availableTime.title')}
                </strong>{' '}
                {t('posts.leyParkinson.sections.evidence.bullets.availableTime.body')}
              </li>
              <li>
                <strong className="text-white">
                  {t('posts.leyParkinson.sections.evidence.bullets.timeboxing.title')}
                </strong>{' '}
                {t('posts.leyParkinson.sections.evidence.bullets.timeboxing.body')}
              </li>
            </ul>
            <p>
              {t('posts.leyParkinson.sections.evidence.paragraph2')}
            </p>
          </div>
        </section>
      </RevealOnScroll>

      {/* 5. Consecuencias en negocio */}
      <RevealOnScroll delay={1}>
        <section id="consecuencias-negocio" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6">
            {t('posts.leyParkinson.sections.consequences.title')}
          </h2>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-6">
            <p>
              {t('posts.leyParkinson.sections.consequences.paragraph')}
            </p>
          </div>

          <div className="rounded-2xl border border-red-500/20 bg-red-950/20 p-5 sm:p-6 mb-6">
            <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              {t('posts.leyParkinson.sections.consequences.risksTitle')}
            </h4>
            <ul className="space-y-2 text-indigo-100/90 text-sm sm:text-base">
              <li>{t('posts.leyParkinson.sections.consequences.risks.projects')}</li>
              <li>{t('posts.leyParkinson.sections.consequences.risks.meetings')}</li>
              <li>{t('posts.leyParkinson.sections.consequences.risks.budget')}</li>
              <li>{t('posts.leyParkinson.sections.consequences.risks.perfectionism')}</li>
            </ul>
          </div>

          <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            {t('posts.leyParkinson.sections.consequences.paragraph2')}
          </p>
        </section>
      </RevealOnScroll>

      {/* 6. Antídotos: timeboxing y plazos */}
      <RevealOnScroll delay={1}>
        <section id="antidotos-timeboxing" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6">
            {t('posts.leyParkinson.sections.antidotes.title')}
          </h2>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-6">
            <p>
              {t('posts.leyParkinson.sections.antidotes.paragraph')}
            </p>
          </div>

          <div className="space-y-4 mb-8">
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-5 flex gap-4">
              <CheckCircle2 className="h-6 w-6 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-white font-semibold mb-1">
                  {t('posts.leyParkinson.sections.antidotes.cards.timeboxing.title')}
                </h4>
                <p className="text-indigo-200/90 text-sm sm:text-base">
                  {t('posts.leyParkinson.sections.antidotes.cards.timeboxing.description')}
                </p>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 flex gap-4">
              <CalendarDays className="h-6 w-6 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-white font-semibold mb-1">
                  {t('posts.leyParkinson.sections.antidotes.cards.deadlines.title')}
                </h4>
                <p className="text-indigo-200/90 text-sm sm:text-base">
                  {t('posts.leyParkinson.sections.antidotes.cards.deadlines.description')}
                </p>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 flex gap-4">
              <Zap className="h-6 w-6 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-white font-semibold mb-1">
                  {t('posts.leyParkinson.sections.antidotes.cards.meetings.title')}
                </h4>
                <p className="text-indigo-200/90 text-sm sm:text-base">
                  {t('posts.leyParkinson.sections.antidotes.cards.meetings.description')}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border-2 border-purple-500/40 bg-purple-900/30 p-5 sm:p-8 flex flex-col md:flex-row gap-6 items-center">
            <div className="flex-1">
              <h4 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-purple-300" />
                {t('posts.leyParkinson.sections.antidotes.capsule.title')}
              </h4>
              <p className="text-indigo-200/90 text-sm sm:text-base leading-relaxed mb-4">
                {t('posts.leyParkinson.sections.antidotes.capsule.body')}
              </p>
              <LocaleLink to="/blog/que-es-timeboxing">
                <Button size="sm" className="bg-purple-600 hover:bg-purple-500 text-white font-medium">
                  {t('posts.leyParkinson.sections.antidotes.capsule.button')}{' '}
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </LocaleLink>
            </div>
          </div>
        </section>
      </RevealOnScroll>

      {/* 7. Aplicación en equipos */}
      <RevealOnScroll delay={1}>
        <section id="aplicacion-equipos" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6">
            {t('posts.leyParkinson.sections.application.title')}
          </h2>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-6">
            <p>
              {t('posts.leyParkinson.sections.application.paragraph')}
            </p>
            <ul className="space-y-2 list-disc pl-6 text-indigo-100/90">
              <li>{t('posts.leyParkinson.sections.application.bullets.planner')}</li>
              <li>{t('posts.leyParkinson.sections.application.bullets.budget')}</li>
              <li>{t('posts.leyParkinson.sections.application.bullets.meetings')}</li>
              <li>{t('posts.leyParkinson.sections.application.bullets.reviews')}</li>
            </ul>
            <p>
              {t('posts.leyParkinson.sections.application.paragraph2')}
            </p>
          </div>
        </section>
      </RevealOnScroll>

      {/* 8. Resumen, FAQ y CTA */}
      <RevealOnScroll delay={2}>
        <section className="mb-12">
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 sm:p-8 mb-8">
            <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-4">
              {t('posts.leyParkinson.sections.summary.paragraph1.part1')}{' '}
              <strong>{t('posts.leyParkinson.sections.summary.paragraph1.highlight1')}</strong>
              {t('posts.leyParkinson.sections.summary.paragraph1.part2')}{' '}
              <strong>{t('posts.leyParkinson.sections.summary.paragraph1.highlight2')}</strong>
              {t('posts.leyParkinson.sections.summary.paragraph1.part3')}
            </p>
            <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed m-0">
              {t('posts.leyParkinson.sections.summary.paragraph2')}
            </p>
          </div>

          <div id="preguntas-frecuentes" className="rounded-3xl border border-indigo-500/30 bg-indigo-950/40 p-6 sm:p-10 mb-10 scroll-mt-24">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-5 text-center">
              {t('posts.leyParkinson.sections.faq.title')}
            </h2>
            <div className="space-y-6">
              <div>
                <h4 className="text-white font-semibold mb-2">
                  {t('posts.leyParkinson.sections.faq.items.scientific.question')}
                </h4>
                <p className="text-sm text-indigo-200/90">
                  {t('posts.leyParkinson.sections.faq.items.scientific.answer')}
                </p>
              </div>
              <div className="w-full h-px bg-white/10" />
              <div>
                <h4 className="text-white font-semibold mb-2">
                  {t('posts.leyParkinson.sections.faq.items.quality.question')}
                </h4>
                <p className="text-sm text-indigo-200/90">
                  {t('posts.leyParkinson.sections.faq.items.quality.answer')}
                </p>
              </div>
              <div className="w-full h-px bg-white/10" />
              <div>
                <h4 className="text-white font-semibold mb-2">
                  {t('posts.leyParkinson.sections.faq.items.timeboxingRelation.question')}
                </h4>
                <p className="text-sm text-indigo-200/90">
                  {t('posts.leyParkinson.sections.faq.items.timeboxingRelation.answer')}
                </p>
              </div>
              <div className="w-full h-px bg-white/10" />
              <div>
                <h4 className="text-white font-semibold mb-2">
                  {t('posts.leyParkinson.sections.faq.items.secondLaw.question')}
                </h4>
                <p className="text-sm text-indigo-200/90">
                  {t('posts.leyParkinson.sections.faq.items.secondLaw.answer')}
                </p>
              </div>
              <div className="w-full h-px bg-white/10" />
              <div>
                <h4 className="text-white font-semibold mb-2">¿Qué es la ley de la trivialidad?</h4>
                <p className="text-sm text-indigo-200/90">
                  Es el patrón por el que los equipos dedican tiempo desproporcionado a temas fáciles de entender (detalles
                  menores) y poco a decisiones complejas y críticas. En reuniones, se reduce priorizando lo importante,
                  acotando tiempo por tema y evitando que lo &quot;cómodo de discutir&quot; se coma la agenda.
                </p>
              </div>
            </div>
          </div>

          <div id="cta-ley-parkinson" className="text-center mt-12 mb-8 scroll-mt-24">
            <h2 className="text-2xl sm:text-4xl font-bold text-white mb-4">
              {t('posts.leyParkinson.sections.cta.title')}
            </h2>
            <p className="text-indigo-100/90 text-lg mb-8 max-w-2xl mx-auto">
              {t('posts.leyParkinson.sections.cta.description')}
            </p>
            <LocaleLink to="/planificador-recursos">
              <Button
                size="lg"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-10 py-6 text-lg font-bold shadow-xl shadow-indigo-500/30 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-indigo-500/40"
              >
                {t('posts.leyParkinson.sections.cta.button')}{' '}
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
              {t('posts.leyParkinson.sections.cta.signature')}
            </p>
          </div>
        </section>
      </RevealOnScroll>
    </article>
  );
}
