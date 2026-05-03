import { LocaleLink } from './LocaleLink';
import {
  Percent,
  Shuffle,
  MonitorSmartphone,
  TimerOff,
  GitBranchPlus,
  Table2,
  ListChecks,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { RevealOnScroll } from './RevealOnScroll';
import { BlogReadingTime } from './BlogReadingTime';
import { BlogTOC } from './BlogTOC';
import { BlogRelatedPost } from './BlogRelatedPost';
import type { BlogTOCItem } from './BlogTOC';
import { OcupacionVsRentabilidadChart } from './OcupacionVsRentabilidadChart';

export interface PorQueAgenciaPierdeRentabilidadArticleProps {
  readingMinutes?: number;
  tocItems?: BlogTOCItem[];
  relatedPost?: { title: string; description: string; href: string };
}

export function PorQueAgenciaPierdeRentabilidadArticle({
  readingMinutes,
  tocItems,
  relatedPost,
}: PorQueAgenciaPierdeRentabilidadArticleProps) {
  const { t } = useTranslation('blog');

  return (
    <article
      id="por-que-agencia-pierde-rentabilidad"
      className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 md:py-16 text-left overflow-x-hidden"
    >
      <section className="mb-12 sm:mb-14">
        <div className="mb-6 text-center flex flex-col items-center gap-3">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-emerald-300 bg-emerald-500/20 border border-emerald-400/30">
            {t('posts.porQueAgenciaPierdeRentabilidad.badge')}
          </span>
          {readingMinutes != null && <BlogReadingTime minutes={readingMinutes} />}
        </div>
        <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-[2.75rem] font-black text-white mb-5 sm:mb-6 leading-[1.15] tracking-tight text-center">
          {t('posts.porQueAgenciaPierdeRentabilidad.title')}
        </h1>

        <div className="rounded-2xl border border-amber-400/40 bg-amber-500/10 p-4 sm:p-6 mb-8">
          <p className="text-amber-100/95 text-sm font-semibold uppercase tracking-wide mb-3">
            {t('posts.porQueAgenciaPierdeRentabilidad.tldr.title')}
          </p>
          <ol className="space-y-3 text-indigo-100/95 text-base sm:text-lg leading-relaxed list-decimal list-outside pl-5 sm:pl-6 marker:text-amber-300 marker:font-semibold">
            <li>{t('posts.porQueAgenciaPierdeRentabilidad.tldr.item1')}</li>
            <li>{t('posts.porQueAgenciaPierdeRentabilidad.tldr.item2')}</li>
            <li>{t('posts.porQueAgenciaPierdeRentabilidad.tldr.item3')}</li>
          </ol>
        </div>

        <div className="space-y-5 text-indigo-100/95 text-base sm:text-lg leading-[1.75]">
          <p>{t('posts.porQueAgenciaPierdeRentabilidad.intro.p1')}</p>
          <p>
            {t('posts.porQueAgenciaPierdeRentabilidad.intro.p2.part1')}{' '}
            <strong>{t('posts.porQueAgenciaPierdeRentabilidad.intro.p2.strong')}</strong>{' '}
            {t('posts.porQueAgenciaPierdeRentabilidad.intro.p2.part2')}
          </p>
        </div>
      </section>

      {tocItems != null && tocItems.length > 0 && (
        <div className="mb-12">
          <BlogTOC items={tocItems} />
        </div>
      )}

      <RevealOnScroll>
        <section id="tasa-utilizacion" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6 flex items-center gap-3">
            <Percent className="h-8 w-8 text-emerald-400 shrink-0" aria-hidden />
            {t('posts.porQueAgenciaPierdeRentabilidad.section1.title')}
          </h2>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            <p>
              {t('posts.porQueAgenciaPierdeRentabilidad.section1.p1.part1')}{' '}
              <strong>{t('posts.porQueAgenciaPierdeRentabilidad.section1.p1.strong')}</strong>{' '}
              {t('posts.porQueAgenciaPierdeRentabilidad.section1.p1.part2')}
            </p>
            <p>
              {t('posts.porQueAgenciaPierdeRentabilidad.section1.p2')}
            </p>
            <p>
              {t('posts.porQueAgenciaPierdeRentabilidad.section1.p3.part1')}{' '}
              <strong>{t('posts.porQueAgenciaPierdeRentabilidad.section1.p3.strong')}</strong>{' '}
              {t('posts.porQueAgenciaPierdeRentabilidad.section1.p3.part2')}
            </p>
            <p>
              {t('posts.porQueAgenciaPierdeRentabilidad.section1.p4.part1')}{' '}
              <strong>{t('posts.porQueAgenciaPierdeRentabilidad.section1.p4.strong')}</strong>{' '}
              {t('posts.porQueAgenciaPierdeRentabilidad.section1.p4.part2')}{' '}
              <em>{t('posts.porQueAgenciaPierdeRentabilidad.section1.p4.em')}</em>{' '}
              {t('posts.porQueAgenciaPierdeRentabilidad.section1.p4.part3')}
            </p>
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-white mt-8 mb-3">
            {t('posts.porQueAgenciaPierdeRentabilidad.section1.sub1.title')}
          </h3>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            <p>
              {t('posts.porQueAgenciaPierdeRentabilidad.section1.sub1.p1.part1')}{' '}
              <strong>{t('posts.porQueAgenciaPierdeRentabilidad.section1.sub1.p1.strong')}</strong>{' '}
              {t('posts.porQueAgenciaPierdeRentabilidad.section1.sub1.p1.part2')}
            </p>
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-white mt-8 mb-3">
            {t('posts.porQueAgenciaPierdeRentabilidad.section1.sub2.title')}
          </h3>
          <ul className="space-y-3 text-indigo-100/90 text-base sm:text-lg leading-relaxed list-disc list-outside pl-5 sm:pl-6 marker:text-emerald-400">
            <li>
              {t('posts.porQueAgenciaPierdeRentabilidad.section1.sub2.li1.part1')}{' '}
              <strong>{t('posts.porQueAgenciaPierdeRentabilidad.section1.sub2.li1.strong')}</strong>{' '}
              {t('posts.porQueAgenciaPierdeRentabilidad.section1.sub2.li1.part2')}
            </li>
            <li>
              {t('posts.porQueAgenciaPierdeRentabilidad.section1.sub2.li2.part1')}{' '}
              <strong>{t('posts.porQueAgenciaPierdeRentabilidad.section1.sub2.li2.strong')}</strong>{' '}
              {t('posts.porQueAgenciaPierdeRentabilidad.section1.sub2.li2.part2')}
            </li>
            <li>
              {t('posts.porQueAgenciaPierdeRentabilidad.section1.sub2.li3.part1')}{' '}
              <strong>{t('posts.porQueAgenciaPierdeRentabilidad.section1.sub2.li3.strong')}</strong>{' '}
              {t('posts.porQueAgenciaPierdeRentabilidad.section1.sub2.li3.part2')}
            </li>
          </ul>

          <h3 className="text-lg sm:text-xl font-bold text-white mt-8 mb-3">
            {t('posts.porQueAgenciaPierdeRentabilidad.section1.sub3.title')}
          </h3>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            <p>
              {t('posts.porQueAgenciaPierdeRentabilidad.section1.sub3.p1.part1')}{' '}
              <strong>{t('posts.porQueAgenciaPierdeRentabilidad.section1.sub3.p1.strong1')}</strong>{' '}
              {t('posts.porQueAgenciaPierdeRentabilidad.section1.sub3.p1.part2')}{' '}
              <strong>{t('posts.porQueAgenciaPierdeRentabilidad.section1.sub3.p1.strong2')}</strong>{' '}
              {t('posts.porQueAgenciaPierdeRentabilidad.section1.sub3.p1.part3')}
            </p>
            <p>
              {t('posts.porQueAgenciaPierdeRentabilidad.section1.sub3.p2.part1')}{' '}
              <em>{t('posts.porQueAgenciaPierdeRentabilidad.section1.sub3.p2.em')}</em>
            </p>
          </div>

          <p className="mb-6 text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            {t('posts.porQueAgenciaPierdeRentabilidad.section1.sub4.p1.part1')}{' '}
            <strong>{t('posts.porQueAgenciaPierdeRentabilidad.section1.sub4.p1.strong')}</strong>{' '}
            {t('posts.porQueAgenciaPierdeRentabilidad.section1.sub4.p1.part2')}
          </p>

          <OcupacionVsRentabilidadChart />

          <p className="mt-6 text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            {t('posts.porQueAgenciaPierdeRentabilidad.section1.sub4.p2')}
          </p>
        </section>
      </RevealOnScroll>

      <RevealOnScroll delay={1}>
        <section id="context-switching" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6 flex items-center gap-3">
            <Shuffle className="h-8 w-8 text-violet-400 shrink-0" aria-hidden />
            {t('posts.porQueAgenciaPierdeRentabilidad.section2.title')}
          </h2>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            <p>
              {t('posts.porQueAgenciaPierdeRentabilidad.section2.p1.part1')}{' '}
              <strong>{t('posts.porQueAgenciaPierdeRentabilidad.section2.p1.strong1')}</strong>{' '}
              {t('posts.porQueAgenciaPierdeRentabilidad.section2.p1.part2')}{' '}
              <strong>{t('posts.porQueAgenciaPierdeRentabilidad.section2.p1.strong2')}</strong>{' '}
              {t('posts.porQueAgenciaPierdeRentabilidad.section2.p1.part3')}
            </p>
            <p>
              {t('posts.porQueAgenciaPierdeRentabilidad.section2.p2')}
            </p>
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-white mt-8 mb-3">
            {t('posts.porQueAgenciaPierdeRentabilidad.section2.sub1.title')}
          </h3>
          <ul className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed list-disc list-outside pl-5 sm:pl-6 marker:text-violet-400">
            <li>
              {t('posts.porQueAgenciaPierdeRentabilidad.section2.sub1.li1.part1')}{' '}
              <strong>{t('posts.porQueAgenciaPierdeRentabilidad.section2.sub1.li1.strong1')}</strong>{' '}
              {t('posts.porQueAgenciaPierdeRentabilidad.section2.sub1.li1.part2')}{' '}
              <strong>{t('posts.porQueAgenciaPierdeRentabilidad.section2.sub1.li1.strong2')}</strong>{' '}
              {t('posts.porQueAgenciaPierdeRentabilidad.section2.sub1.li1.part3')}
            </li>
            <li>
              {t('posts.porQueAgenciaPierdeRentabilidad.section2.sub1.li2.part1')}{' '}
              <strong>{t('posts.porQueAgenciaPierdeRentabilidad.section2.sub1.li2.strong')}</strong>{' '}
              {t('posts.porQueAgenciaPierdeRentabilidad.section2.sub1.li2.part2')}
            </li>
            <li>
              {t('posts.porQueAgenciaPierdeRentabilidad.section2.sub1.li3.part1')}{' '}
              <strong>{t('posts.porQueAgenciaPierdeRentabilidad.section2.sub1.li3.strong')}</strong>{' '}
              {t('posts.porQueAgenciaPierdeRentabilidad.section2.sub1.li3.part2')}
            </li>
          </ul>

          <h3 className="text-lg sm:text-xl font-bold text-white mt-8 mb-3">
            {t('posts.porQueAgenciaPierdeRentabilidad.section2.sub2.title')}
          </h3>
          <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-6">
            {t('posts.porQueAgenciaPierdeRentabilidad.section2.sub2.p1.part1')}{' '}
            <strong>{t('posts.porQueAgenciaPierdeRentabilidad.section2.sub2.p1.strong')}</strong>{' '}
            {t('posts.porQueAgenciaPierdeRentabilidad.section2.sub2.p1.part2')}
          </p>

          <h3 className="text-lg sm:text-xl font-bold text-white mt-8 mb-3">
            {t('posts.porQueAgenciaPierdeRentabilidad.section2.sub3.title')}
          </h3>
          <ul className="space-y-2 text-indigo-100/90 text-base sm:text-lg leading-relaxed list-disc list-outside pl-5 sm:pl-6 marker:text-violet-400">
            <li>{t('posts.porQueAgenciaPierdeRentabilidad.section2.sub3.li1')}</li>
            <li>{t('posts.porQueAgenciaPierdeRentabilidad.section2.sub3.li2')}</li>
            <li>{t('posts.porQueAgenciaPierdeRentabilidad.section2.sub3.li3')}</li>
            <li>{t('posts.porQueAgenciaPierdeRentabilidad.section2.sub3.li4')}</li>
          </ul>
          <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed mt-6 mb-0">
            {t('posts.porQueAgenciaPierdeRentabilidad.section2.sub3.p1.part1')}{' '}
            <strong>{t('posts.porQueAgenciaPierdeRentabilidad.section2.sub3.p1.strong')}</strong>{' '}
            {t('posts.porQueAgenciaPierdeRentabilidad.section2.sub3.p1.part2')}
          </p>
        </section>
      </RevealOnScroll>

      <RevealOnScroll delay={2}>
        <section id="presencialismo-digital" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6 flex items-center gap-3">
            <MonitorSmartphone className="h-8 w-8 text-amber-400 shrink-0" aria-hidden />
            {t('posts.porQueAgenciaPierdeRentabilidad.section3.title')}
          </h2>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            <p>
              {t('posts.porQueAgenciaPierdeRentabilidad.section3.p1.part1')}{' '}
              <strong>{t('posts.porQueAgenciaPierdeRentabilidad.section3.p1.strong1')}</strong>{' '}
              {t('posts.porQueAgenciaPierdeRentabilidad.section3.p1.part2')}{' '}
              <strong>{t('posts.porQueAgenciaPierdeRentabilidad.section3.p1.strong2')}</strong>{' '}
              {t('posts.porQueAgenciaPierdeRentabilidad.section3.p1.part3')}
            </p>
            <p>
              {t('posts.porQueAgenciaPierdeRentabilidad.section3.p2')}
            </p>
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-white mt-8 mb-3">
            {t('posts.porQueAgenciaPierdeRentabilidad.section3.sub1.title')}
          </h3>
          <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-4">
            {t('posts.porQueAgenciaPierdeRentabilidad.section3.sub1.p1')}
          </p>
          <ul className="space-y-3 text-indigo-100/90 text-base sm:text-lg leading-relaxed list-disc list-outside pl-5 sm:pl-6 marker:text-amber-400">
            <li>{t('posts.porQueAgenciaPierdeRentabilidad.section3.sub1.li1')}</li>
            <li>{t('posts.porQueAgenciaPierdeRentabilidad.section3.sub1.li2')}</li>
            <li>{t('posts.porQueAgenciaPierdeRentabilidad.section3.sub1.li3')}</li>
          </ul>

          <h3 className="text-lg sm:text-xl font-bold text-white mt-8 mb-3">
            {t('posts.porQueAgenciaPierdeRentabilidad.section3.sub2.title')}
          </h3>
          <ol className="space-y-3 text-indigo-100/90 text-base sm:text-lg leading-relaxed list-decimal list-outside pl-5 sm:pl-6 marker:text-amber-300 marker:font-semibold">
            <li>
              <strong className="text-white">
                {t('posts.porQueAgenciaPierdeRentabilidad.section3.sub2.li1')}
              </strong>
            </li>
            <li>
              <strong className="text-white">
                {t('posts.porQueAgenciaPierdeRentabilidad.section3.sub2.li2')}
              </strong>
            </li>
            <li>
              <strong className="text-white">
                {t('posts.porQueAgenciaPierdeRentabilidad.section3.sub2.li3')}
              </strong>
            </li>
          </ol>
        </section>
      </RevealOnScroll>

      <RevealOnScroll>
        <section id="horas-no-facturables" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6 flex items-center gap-3">
            <TimerOff className="h-8 w-8 text-rose-400 shrink-0" aria-hidden />
            {t('posts.porQueAgenciaPierdeRentabilidad.section4.title')}
          </h2>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            <p>
              {t('posts.porQueAgenciaPierdeRentabilidad.section4.p1.part1')}{' '}
              <strong>{t('posts.porQueAgenciaPierdeRentabilidad.section4.p1.strong')}</strong>{' '}
              {t('posts.porQueAgenciaPierdeRentabilidad.section4.p1.part2')}
            </p>
            <p>
              {t('posts.porQueAgenciaPierdeRentabilidad.section4.p2.part1')}{' '}
              <strong>{t('posts.porQueAgenciaPierdeRentabilidad.section4.p2.strong')}</strong>{' '}
              {t('posts.porQueAgenciaPierdeRentabilidad.section4.p2.part2')}
            </p>
            <p>
              {t('posts.porQueAgenciaPierdeRentabilidad.section4.p3')}
            </p>
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-white mt-8 mb-3">
            {t('posts.porQueAgenciaPierdeRentabilidad.section4.sub1.title')}
          </h3>
          <ul className="space-y-3 text-indigo-100/90 text-base sm:text-lg leading-relaxed list-disc list-outside pl-5 sm:pl-6 marker:text-rose-400">
            <li>{t('posts.porQueAgenciaPierdeRentabilidad.section4.sub1.li1')}</li>
            <li>{t('posts.porQueAgenciaPierdeRentabilidad.section4.sub1.li2')}</li>
            <li>{t('posts.porQueAgenciaPierdeRentabilidad.section4.sub1.li3')}</li>
          </ul>
          <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed mt-6">
            {t('posts.porQueAgenciaPierdeRentabilidad.section4.sub1.p1.part1')}{' '}
            <strong>{t('posts.porQueAgenciaPierdeRentabilidad.section4.sub1.p1.strong')}</strong>{' '}
            {t('posts.porQueAgenciaPierdeRentabilidad.section4.sub1.p1.part2')}{' '}
            <LocaleLink
              to="/blog/planificacion-proyectos-cronograma-recursos"
              className="text-violet-300 hover:text-white underline underline-offset-2"
            >
              {t('posts.porQueAgenciaPierdeRentabilidad.section4.sub1.p1.link')}
            </LocaleLink>{' '}
            {t('posts.porQueAgenciaPierdeRentabilidad.section4.sub1.p1.part3')}
          </p>

          <h3 className="text-lg sm:text-xl font-bold text-white mt-8 mb-3">
            {t('posts.porQueAgenciaPierdeRentabilidad.section4.sub2.title')}
          </h3>
          <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            {t('posts.porQueAgenciaPierdeRentabilidad.section4.sub2.p1.part1')}{' '}
            <em>{t('posts.porQueAgenciaPierdeRentabilidad.section4.sub2.p1.em')}</em>{' '}
            {t('posts.porQueAgenciaPierdeRentabilidad.section4.sub2.p1.part2')}{' '}
            <strong>{t('posts.porQueAgenciaPierdeRentabilidad.section4.sub2.p1.strong1')}</strong>{' '}
            {t('posts.porQueAgenciaPierdeRentabilidad.section4.sub2.p1.part3')}{' '}
            <strong>{t('posts.porQueAgenciaPierdeRentabilidad.section4.sub2.p1.strong2')}</strong>{' '}
            {t('posts.porQueAgenciaPierdeRentabilidad.section4.sub2.p1.part4')}
          </p>
        </section>
      </RevealOnScroll>

      <RevealOnScroll delay={1}>
        <section id="scope-creep" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6 flex items-center gap-3">
            <GitBranchPlus className="h-8 w-8 text-orange-400 shrink-0" aria-hidden />
            {t('posts.porQueAgenciaPierdeRentabilidad.section5.title')}
          </h2>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            <p>
              {t('posts.porQueAgenciaPierdeRentabilidad.section5.p1.part1')}{' '}
              <strong>{t('posts.porQueAgenciaPierdeRentabilidad.section5.p1.strong')}</strong>{' '}
              {t('posts.porQueAgenciaPierdeRentabilidad.section5.p1.part2')}
            </p>
            <p>
              {t('posts.porQueAgenciaPierdeRentabilidad.section5.p2')}
            </p>
            <p>
              {t('posts.porQueAgenciaPierdeRentabilidad.section5.p3.part1')}{' '}
              <strong>{t('posts.porQueAgenciaPierdeRentabilidad.section5.p3.strong')}</strong>{' '}
              {t('posts.porQueAgenciaPierdeRentabilidad.section5.p3.part2')}{' '}
              <LocaleLink to="/blog/ley-parkinson" className="text-violet-300 hover:text-white underline underline-offset-2">
                {t('posts.porQueAgenciaPierdeRentabilidad.section5.p3.link')}
              </LocaleLink>
              {t('posts.porQueAgenciaPierdeRentabilidad.section5.p3.part3')}
            </p>
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-white mt-8 mb-3">
            {t('posts.porQueAgenciaPierdeRentabilidad.section5.sub1.title')}
          </h3>
          <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            {t('posts.porQueAgenciaPierdeRentabilidad.section5.sub1.p1.part1')}{' '}
            <strong>{t('posts.porQueAgenciaPierdeRentabilidad.section5.sub1.p1.strong')}</strong>{' '}
            {t('posts.porQueAgenciaPierdeRentabilidad.section5.sub1.p1.part2')}
          </p>

          <h3 className="text-lg sm:text-xl font-bold text-white mt-8 mb-3">
            {t('posts.porQueAgenciaPierdeRentabilidad.section5.sub2.title')}
          </h3>
          <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            {t('posts.porQueAgenciaPierdeRentabilidad.section5.sub2.p1.part1')}{' '}
            <strong>{t('posts.porQueAgenciaPierdeRentabilidad.section5.sub2.p1.strong')}</strong>{' '}
            {t('posts.porQueAgenciaPierdeRentabilidad.section5.sub2.p1.part2')}
          </p>
        </section>
      </RevealOnScroll>

      <RevealOnScroll delay={2}>
        <section id="metricas-rentabilidad" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6 flex items-center gap-3">
            <Table2 className="h-8 w-8 text-cyan-400 shrink-0" aria-hidden />
            {t('posts.porQueAgenciaPierdeRentabilidad.section6.title')}
          </h2>
          <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-6">
            {t('posts.porQueAgenciaPierdeRentabilidad.section6.p1.part1')}{' '}
            <LocaleLink to="/blog/kpis-agencias-marketing-2026" className="text-violet-300 hover:text-white underline underline-offset-2">
              {t('posts.porQueAgenciaPierdeRentabilidad.section6.p1.link1')}
            </LocaleLink>{' '}
            {t('posts.porQueAgenciaPierdeRentabilidad.section6.p1.part2')}{' '}
            <LocaleLink
              to="/blog/como-medir-rentabilidad-proyecto-agencia-dejar-vender-horas"
              className="text-violet-300 hover:text-white underline underline-offset-2"
            >
              {t('posts.porQueAgenciaPierdeRentabilidad.section6.p1.link2')}
            </LocaleLink>
            {t('posts.porQueAgenciaPierdeRentabilidad.section6.p1.part3')}
          </p>
          <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-6">
            {t('posts.porQueAgenciaPierdeRentabilidad.section6.p2')}
          </p>
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
            <table className="w-full text-left text-sm sm:text-base">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="p-3 sm:p-4 text-cyan-200 font-semibold">
                    {t('posts.porQueAgenciaPierdeRentabilidad.section6.table.header.metric')}
                  </th>
                  <th className="p-3 sm:p-4 text-cyan-200 font-semibold">
                    {t('posts.porQueAgenciaPierdeRentabilidad.section6.table.header.formula')}
                  </th>
                  <th className="p-3 sm:p-4 text-cyan-200 font-semibold">
                    {t('posts.porQueAgenciaPierdeRentabilidad.section6.table.header.healthy')}
                  </th>
                  <th className="p-3 sm:p-4 text-cyan-200 font-semibold">
                    {t('posts.porQueAgenciaPierdeRentabilidad.section6.table.header.warning')}
                  </th>
                </tr>
              </thead>
              <tbody className="text-indigo-100/90">
                <tr className="border-b border-white/10">
                  <td className="p-3 sm:p-4 font-medium text-white align-top">
                    {t('posts.porQueAgenciaPierdeRentabilidad.section6.table.rows.utilization.metric')}
                  </td>
                  <td className="p-3 sm:p-4 align-top">
                    {t('posts.porQueAgenciaPierdeRentabilidad.section6.table.rows.utilization.formula')}
                  </td>
                  <td className="p-3 sm:p-4 align-top">
                    {t('posts.porQueAgenciaPierdeRentabilidad.section6.table.rows.utilization.healthy')}
                  </td>
                  <td className="p-3 sm:p-4 align-top">
                    {t('posts.porQueAgenciaPierdeRentabilidad.section6.table.rows.utilization.warning')}
                  </td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="p-3 sm:p-4 font-medium text-white align-top">
                    {t('posts.porQueAgenciaPierdeRentabilidad.section6.table.rows.grossMargin.metric')}
                  </td>
                  <td className="p-3 sm:p-4 align-top">
                    {t('posts.porQueAgenciaPierdeRentabilidad.section6.table.rows.grossMargin.formula')}
                  </td>
                  <td className="p-3 sm:p-4 align-top">
                    {t('posts.porQueAgenciaPierdeRentabilidad.section6.table.rows.grossMargin.healthy')}
                  </td>
                  <td className="p-3 sm:p-4 align-top">
                    {t('posts.porQueAgenciaPierdeRentabilidad.section6.table.rows.grossMargin.warning')}
                  </td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="p-3 sm:p-4 font-medium text-white align-top">
                    {t('posts.porQueAgenciaPierdeRentabilidad.section6.table.rows.budgetDeviation.metric')}
                  </td>
                  <td className="p-3 sm:p-4 align-top">
                    {t('posts.porQueAgenciaPierdeRentabilidad.section6.table.rows.budgetDeviation.formula')}
                  </td>
                  <td className="p-3 sm:p-4 align-top">
                    {t('posts.porQueAgenciaPierdeRentabilidad.section6.table.rows.budgetDeviation.healthy')}
                  </td>
                  <td className="p-3 sm:p-4 align-top">
                    {t('posts.porQueAgenciaPierdeRentabilidad.section6.table.rows.budgetDeviation.warning')}
                  </td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="p-3 sm:p-4 font-medium text-white align-top">
                    {t('posts.porQueAgenciaPierdeRentabilidad.section6.table.rows.revenuePerEmployee.metric')}
                  </td>
                  <td className="p-3 sm:p-4 align-top">
                    {t('posts.porQueAgenciaPierdeRentabilidad.section6.table.rows.revenuePerEmployee.formula')}
                  </td>
                  <td className="p-3 sm:p-4 align-top">
                    {t('posts.porQueAgenciaPierdeRentabilidad.section6.table.rows.revenuePerEmployee.healthy')}
                  </td>
                  <td className="p-3 sm:p-4 align-top">
                    {t('posts.porQueAgenciaPierdeRentabilidad.section6.table.rows.revenuePerEmployee.warning')}
                  </td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="p-3 sm:p-4 font-medium text-white align-top">
                    {t('posts.porQueAgenciaPierdeRentabilidad.section6.table.rows.billableRatio.metric')}
                  </td>
                  <td className="p-3 sm:p-4 align-top">
                    {t('posts.porQueAgenciaPierdeRentabilidad.section6.table.rows.billableRatio.formula')}
                  </td>
                  <td className="p-3 sm:p-4 align-top">
                    {t('posts.porQueAgenciaPierdeRentabilidad.section6.table.rows.billableRatio.healthy')}
                  </td>
                  <td className="p-3 sm:p-4 align-top">
                    {t('posts.porQueAgenciaPierdeRentabilidad.section6.table.rows.billableRatio.warning')}
                  </td>
                </tr>
                <tr>
                  <td className="p-3 sm:p-4 font-medium text-white align-top">
                    {t('posts.porQueAgenciaPierdeRentabilidad.section6.table.rows.turnover.metric')}
                  </td>
                  <td className="p-3 sm:p-4 align-top">
                    {t('posts.porQueAgenciaPierdeRentabilidad.section6.table.rows.turnover.formula')}
                  </td>
                  <td className="p-3 sm:p-4 align-top">
                    {t('posts.porQueAgenciaPierdeRentabilidad.section6.table.rows.turnover.healthy')}
                  </td>
                  <td className="p-3 sm:p-4 align-top">
                    {t('posts.porQueAgenciaPierdeRentabilidad.section6.table.rows.turnover.warning')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-white mt-8 mb-3">
            {t('posts.porQueAgenciaPierdeRentabilidad.section6.sub1.title')}
          </h3>
          <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            {t('posts.porQueAgenciaPierdeRentabilidad.section6.sub1.p1.part1')}{' '}
            <strong>{t('posts.porQueAgenciaPierdeRentabilidad.section6.sub1.p1.strong')}</strong>{' '}
            {t('posts.porQueAgenciaPierdeRentabilidad.section6.sub1.p1.part2')}
          </p>
        </section>
      </RevealOnScroll>

      <RevealOnScroll>
        <section id="acciones-inmediatas" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6 flex items-center gap-3">
            <ListChecks className="h-8 w-8 text-lime-400 shrink-0" aria-hidden />
            {t('posts.porQueAgenciaPierdeRentabilidad.section7.title')}
          </h2>
          <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-6">
            {t('posts.porQueAgenciaPierdeRentabilidad.section7.p1')}
          </p>
          <ol className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed list-decimal list-outside pl-5 sm:pl-6 marker:text-lime-300 marker:font-semibold">
            <li>
              <strong className="text-white">
                {t('posts.porQueAgenciaPierdeRentabilidad.section7.li1.strong')}
              </strong>{' '}
              {t('posts.porQueAgenciaPierdeRentabilidad.section7.li1.part2')}
            </li>
            <li>
              <strong className="text-white">
                {t('posts.porQueAgenciaPierdeRentabilidad.section7.li2.strong')}
              </strong>{' '}
              {t('posts.porQueAgenciaPierdeRentabilidad.section7.li2.part2')}
            </li>
            <li>
              <strong className="text-white">
                {t('posts.porQueAgenciaPierdeRentabilidad.section7.li3.strong')}
              </strong>{' '}
              {t('posts.porQueAgenciaPierdeRentabilidad.section7.li3.part2')}
            </li>
            <li>
              <strong className="text-white">
                {t('posts.porQueAgenciaPierdeRentabilidad.section7.li4.strong')}
              </strong>{' '}
              {t('posts.porQueAgenciaPierdeRentabilidad.section7.li4.part2')}
            </li>
          </ol>
          <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed mt-6">
            {t('posts.porQueAgenciaPierdeRentabilidad.section7.p2')}
          </p>
        </section>
      </RevealOnScroll>

      <RevealOnScroll delay={1}>
        <section id="faq-rentabilidad-ocupacion" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-6">
            {t('posts.porQueAgenciaPierdeRentabilidad.faq.title')}
          </h2>
          <div className="space-y-6 text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            <div className="rounded-xl border border-white/10 bg-white/5 p-5 sm:p-6 space-y-3">
              <h3 className="text-white font-bold text-lg m-0">
                {t('posts.porQueAgenciaPierdeRentabilidad.faq.q1.question')}
              </h3>
              <p className="m-0">
                {t('posts.porQueAgenciaPierdeRentabilidad.faq.q1.answer')}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-5 sm:p-6 space-y-3">
              <h3 className="text-white font-bold text-lg m-0">
                {t('posts.porQueAgenciaPierdeRentabilidad.faq.q2.question')}
              </h3>
              <p className="m-0">
                {t('posts.porQueAgenciaPierdeRentabilidad.faq.q2.answer')}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-5 sm:p-6 space-y-3">
              <h3 className="text-white font-bold text-lg m-0">
                {t('posts.porQueAgenciaPierdeRentabilidad.faq.q3.question')}
              </h3>
              <p className="m-0">
                {t('posts.porQueAgenciaPierdeRentabilidad.faq.q3.answer')}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-5 sm:p-6 space-y-3">
              <h3 className="text-white font-bold text-lg m-0">
                {t('posts.porQueAgenciaPierdeRentabilidad.faq.q4.question')}
              </h3>
              <p className="m-0">
                {t('posts.porQueAgenciaPierdeRentabilidad.faq.q4.answer')}
              </p>
            </div>
          </div>
        </section>
      </RevealOnScroll>

      {relatedPost != null && (
        <BlogRelatedPost
          title={relatedPost.title}
          description={relatedPost.description}
          href={relatedPost.href}
        />
      )}
    </article>
  );
}
