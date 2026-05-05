import { LocaleLink } from './LocaleLink';
import { Button } from '@/components/ui/button';
import { CalendarClock, Package, ClipboardList, ListChecks, BookOpen } from 'lucide-react';
import { RevealOnScroll } from './RevealOnScroll';
import { BlogReadingTime } from './BlogReadingTime';
import { BlogTOC } from './BlogTOC';
import { BlogRelatedPost } from './BlogRelatedPost';
import type { BlogTOCItem } from './BlogTOC';
import { useTranslation } from 'react-i18next';

export interface CapacidadCalendarioVsProductivaArticleProps {
  readingMinutes?: number;
  tocItems?: BlogTOCItem[];
  relatedPost?: { title: string; description: string; href: string };
}

export function CapacidadCalendarioVsProductivaArticle({
  readingMinutes,
  tocItems,
  relatedPost,
}: CapacidadCalendarioVsProductivaArticleProps) {
  const { t } = useTranslation('blog');
  const postKey = 'capacidadCalendarioVsProductiva';

  return (
    <article
      id="capacidad-calendario-vs-capacidad-productiva-equipo"
      className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 md:py-16 text-left overflow-x-hidden"
    >
      <section className="mb-12 sm:mb-14">
        <div className="mb-6 text-center flex flex-col items-center gap-3">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-sky-300 bg-sky-500/20 border border-sky-400/30">
            {t(`posts.${postKey}.badge`)}
          </span>
          {readingMinutes != null && <BlogReadingTime minutes={readingMinutes} />}
        </div>
        <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-[2.75rem] font-black text-white mb-5 sm:mb-6 leading-[1.15] tracking-tight text-center">
          {t(`posts.${postKey}.title`)}
        </h1>
        <div className="space-y-5 text-indigo-100/95 text-base sm:text-lg leading-[1.75]">
          <p dangerouslySetInnerHTML={{ __html: t(`posts.${postKey}.intro.p1`) }} />
          <p dangerouslySetInnerHTML={{ __html: t(`posts.${postKey}.intro.p2`) }} />
          <div className="rounded-2xl border-l-4 border-sky-400 bg-sky-500/10 border border-sky-500/20 p-4 sm:p-6 my-6">
            <p className="text-white/95 font-medium m-0">
              {t(`posts.${postKey}.intro.callout.prefix`)}{' '}
              <LocaleLink
                to="/blog/planificacion-proyectos-cronograma-recursos"
                className="text-sky-300 hover:text-white underline underline-offset-2"
              >
                {t(`posts.${postKey}.intro.callout.linkPlan`)}
              </LocaleLink>
              {t(`posts.${postKey}.intro.callout.mid`)}{' '}
              <LocaleLink
                to="/blog/gestion-carga-trabajo-equipo-sin-burnout"
                className="text-sky-300 hover:text-white underline underline-offset-2"
              >
                {t(`posts.${postKey}.intro.callout.linkCarga`)}
              </LocaleLink>{' '}
              {t(`posts.${postKey}.intro.callout.suffix`)}
            </p>
          </div>
        </div>
      </section>

      <RevealOnScroll>
        <section id="mapa-capacidad-calendario-productiva" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-4">
            {t(`posts.${postKey}.sections.map.title`)}
          </h2>
          <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-6">
            {t(`posts.${postKey}.sections.map.p1`)}
          </p>
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
            <table className="w-full text-left text-sm sm:text-base">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="p-3 sm:p-4 text-sky-200 font-semibold">
                    {t(`posts.${postKey}.sections.map.table.headers.0`)}
                  </th>
                  <th className="p-3 sm:p-4 text-sky-200 font-semibold">
                    {t(`posts.${postKey}.sections.map.table.headers.1`)}
                  </th>
                  <th className="p-3 sm:p-4 text-sky-200 font-semibold">
                    {t(`posts.${postKey}.sections.map.table.headers.2`)}
                  </th>
                </tr>
              </thead>
              <tbody className="text-indigo-100/90">
                <tr className="border-b border-white/10">
                  <td className="p-3 sm:p-4 font-medium text-white align-top">
                    {t(`posts.${postKey}.sections.map.table.row0.c0`)}
                  </td>
                  <td className="p-3 sm:p-4 align-top">{t(`posts.${postKey}.sections.map.table.row0.c1`)}</td>
                  <td className="p-3 sm:p-4 align-top">{t(`posts.${postKey}.sections.map.table.row0.c2`)}</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="p-3 sm:p-4 font-medium text-white align-top">
                    {t(`posts.${postKey}.sections.map.table.row1.c0`)}
                  </td>
                  <td className="p-3 sm:p-4 align-top">{t(`posts.${postKey}.sections.map.table.row1.c1`)}</td>
                  <td className="p-3 sm:p-4 align-top">{t(`posts.${postKey}.sections.map.table.row1.c2`)}</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="p-3 sm:p-4 font-medium text-white align-top">
                    {t(`posts.${postKey}.sections.map.table.row2.c0`)}
                  </td>
                  <td className="p-3 sm:p-4 align-top">{t(`posts.${postKey}.sections.map.table.row2.c1`)}</td>
                  <td className="p-3 sm:p-4 align-top">{t(`posts.${postKey}.sections.map.table.row2.c2`)}</td>
                </tr>
                <tr>
                  <td className="p-3 sm:p-4 font-medium text-white align-top">
                    {t(`posts.${postKey}.sections.map.table.row3.c0`)}
                  </td>
                  <td className="p-3 sm:p-4 align-top">{t(`posts.${postKey}.sections.map.table.row3.c1`)}</td>
                  <td className="p-3 sm:p-4 align-top">{t(`posts.${postKey}.sections.map.table.row3.c2`)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </RevealOnScroll>

      {tocItems != null && tocItems.length > 0 && (
        <div className="mb-12">
          <BlogTOC items={tocItems} />
        </div>
      )}

      <RevealOnScroll>
        <section id="calendario-verde-engana" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6 flex items-center gap-3">
            <CalendarClock className="h-8 w-8 text-sky-400 shrink-0" aria-hidden />
            {t(`posts.${postKey}.sections.calendarLie.title`)}
          </h2>
          <div className="space-y-6 text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            <p dangerouslySetInnerHTML={{ __html: t(`posts.${postKey}.sections.calendarLie.p1`) }} />
            <p dangerouslySetInnerHTML={{ __html: t(`posts.${postKey}.sections.calendarLie.p2`) }} />
          </div>
        </section>
      </RevealOnScroll>

      <RevealOnScroll delay={1}>
        <section id="entregables-contra-calendario" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6 flex items-center gap-3">
            <Package className="h-8 w-8 text-amber-400 shrink-0" aria-hidden />
            {t(`posts.${postKey}.sections.deliverables.title`)}
          </h2>
          <div className="space-y-6 text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            <p dangerouslySetInnerHTML={{ __html: t(`posts.${postKey}.sections.deliverables.p1`) }} />
            <p dangerouslySetInnerHTML={{ __html: t(`posts.${postKey}.sections.deliverables.p2`) }} />
          </div>
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5 mt-8">
            <table className="w-full text-left text-sm sm:text-base">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="p-3 sm:p-4 text-sky-200 font-semibold">
                    {t(`posts.${postKey}.sections.deliverables.table.headers.0`)}
                  </th>
                  <th className="p-3 sm:p-4 text-sky-200 font-semibold">
                    {t(`posts.${postKey}.sections.deliverables.table.headers.1`)}
                  </th>
                  <th className="p-3 sm:p-4 text-sky-200 font-semibold">
                    {t(`posts.${postKey}.sections.deliverables.table.headers.2`)}
                  </th>
                </tr>
              </thead>
              <tbody className="text-indigo-100/90">
                <tr className="border-b border-white/10">
                  <td className="p-3 sm:p-4 font-medium text-white align-top">
                    {t(`posts.${postKey}.sections.deliverables.table.row0.c0`)}
                  </td>
                  <td className="p-3 sm:p-4 align-top">{t(`posts.${postKey}.sections.deliverables.table.row0.c1`)}</td>
                  <td className="p-3 sm:p-4 align-top">{t(`posts.${postKey}.sections.deliverables.table.row0.c2`)}</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="p-3 sm:p-4 font-medium text-white align-top">
                    {t(`posts.${postKey}.sections.deliverables.table.row1.c0`)}
                  </td>
                  <td className="p-3 sm:p-4 align-top">{t(`posts.${postKey}.sections.deliverables.table.row1.c1`)}</td>
                  <td className="p-3 sm:p-4 align-top">{t(`posts.${postKey}.sections.deliverables.table.row1.c2`)}</td>
                </tr>
                <tr>
                  <td className="p-3 sm:p-4 font-medium text-white align-top">
                    {t(`posts.${postKey}.sections.deliverables.table.row2.c0`)}
                  </td>
                  <td className="p-3 sm:p-4 align-top">{t(`posts.${postKey}.sections.deliverables.table.row2.c1`)}</td>
                  <td className="p-3 sm:p-4 align-top">{t(`posts.${postKey}.sections.deliverables.table.row2.c2`)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </RevealOnScroll>

      <RevealOnScroll delay={2}>
        <section id="lunes-capacidad-neta" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6 flex items-center gap-3">
            <ClipboardList className="h-8 w-8 text-emerald-400 shrink-0" aria-hidden />
            {t(`posts.${postKey}.sections.monday.title`)}
          </h2>
          <div className="space-y-6 text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            <p dangerouslySetInnerHTML={{ __html: t(`posts.${postKey}.sections.monday.p1`) }} />
            <ul className="list-disc pl-5 space-y-3 marker:text-emerald-400">
              <li dangerouslySetInnerHTML={{ __html: t(`posts.${postKey}.sections.monday.li1`) }} />
              <li dangerouslySetInnerHTML={{ __html: t(`posts.${postKey}.sections.monday.li2`) }} />
              <li dangerouslySetInnerHTML={{ __html: t(`posts.${postKey}.sections.monday.li3`) }} />
              <li dangerouslySetInnerHTML={{ __html: t(`posts.${postKey}.sections.monday.li4`) }} />
            </ul>
            <p className="mb-6" dangerouslySetInnerHTML={{ __html: t(`posts.${postKey}.sections.monday.p2`) }} />
          </div>
        </section>
      </RevealOnScroll>

      <RevealOnScroll delay={1}>
        <section id="checklist-capacidad-productiva" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6 flex items-center gap-3">
            <ListChecks className="h-8 w-8 text-cyan-300 shrink-0" aria-hidden />
            {t(`posts.${postKey}.sections.checklist.title`)}
          </h2>
          <div className="space-y-6 text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            <p dangerouslySetInnerHTML={{ __html: t(`posts.${postKey}.sections.checklist.p1`) }} />
            <p dangerouslySetInnerHTML={{ __html: t(`posts.${postKey}.sections.checklist.p2`) }} />
            <ol className="list-decimal pl-6 space-y-3 marker:text-cyan-300">
              <li dangerouslySetInnerHTML={{ __html: t(`posts.${postKey}.sections.checklist.step1`) }} />
              <li dangerouslySetInnerHTML={{ __html: t(`posts.${postKey}.sections.checklist.step2`) }} />
              <li dangerouslySetInnerHTML={{ __html: t(`posts.${postKey}.sections.checklist.step3`) }} />
              <li dangerouslySetInnerHTML={{ __html: t(`posts.${postKey}.sections.checklist.step4`) }} />
              <li dangerouslySetInnerHTML={{ __html: t(`posts.${postKey}.sections.checklist.step5`) }} />
            </ol>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5 mt-8">
            <table className="w-full text-left text-sm sm:text-base">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="p-3 sm:p-4 text-sky-200 font-semibold">
                    {t(`posts.${postKey}.sections.checklist.antiTable.headers.0`)}
                  </th>
                  <th className="p-3 sm:p-4 text-sky-200 font-semibold">
                    {t(`posts.${postKey}.sections.checklist.antiTable.headers.1`)}
                  </th>
                  <th className="p-3 sm:p-4 text-sky-200 font-semibold">
                    {t(`posts.${postKey}.sections.checklist.antiTable.headers.2`)}
                  </th>
                </tr>
              </thead>
              <tbody className="text-indigo-100/90">
                <tr className="border-b border-white/10">
                  <td className="p-3 sm:p-4 font-medium text-white align-top">
                    {t(`posts.${postKey}.sections.checklist.antiTable.row0.c0`)}
                  </td>
                  <td className="p-3 sm:p-4 align-top">{t(`posts.${postKey}.sections.checklist.antiTable.row0.c1`)}</td>
                  <td className="p-3 sm:p-4 align-top">{t(`posts.${postKey}.sections.checklist.antiTable.row0.c2`)}</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="p-3 sm:p-4 font-medium text-white align-top">
                    {t(`posts.${postKey}.sections.checklist.antiTable.row1.c0`)}
                  </td>
                  <td className="p-3 sm:p-4 align-top">{t(`posts.${postKey}.sections.checklist.antiTable.row1.c1`)}</td>
                  <td className="p-3 sm:p-4 align-top">{t(`posts.${postKey}.sections.checklist.antiTable.row1.c2`)}</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="p-3 sm:p-4 font-medium text-white align-top">
                    {t(`posts.${postKey}.sections.checklist.antiTable.row2.c0`)}
                  </td>
                  <td className="p-3 sm:p-4 align-top">{t(`posts.${postKey}.sections.checklist.antiTable.row2.c1`)}</td>
                  <td className="p-3 sm:p-4 align-top">{t(`posts.${postKey}.sections.checklist.antiTable.row2.c2`)}</td>
                </tr>
                <tr>
                  <td className="p-3 sm:p-4 font-medium text-white align-top">
                    {t(`posts.${postKey}.sections.checklist.antiTable.row3.c0`)}
                  </td>
                  <td className="p-3 sm:p-4 align-top">{t(`posts.${postKey}.sections.checklist.antiTable.row3.c1`)}</td>
                  <td className="p-3 sm:p-4 align-top">{t(`posts.${postKey}.sections.checklist.antiTable.row3.c2`)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </RevealOnScroll>

      <RevealOnScroll>
        <section id="leer-siguiente-capacidad" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6 flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-violet-400 shrink-0" aria-hidden />
            {t(`posts.${postKey}.sections.readMore.title`)}
          </h2>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            <p>{t(`posts.${postKey}.sections.readMore.p1`)}</p>
            <ul className="space-y-3 list-none pl-0">
              <li>
                <LocaleLink
                  to="/blog/que-es-timeboxing"
                  className="text-sky-300 hover:text-white underline underline-offset-2 font-medium"
                >
                  {t(`posts.${postKey}.sections.readMore.linkTimeboxing`)}
                </LocaleLink>
                {' — '}
                {t(`posts.${postKey}.sections.readMore.descTimeboxing`)}
              </li>
              <li>
                <LocaleLink
                  to="/blog/ley-parkinson"
                  className="text-sky-300 hover:text-white underline underline-offset-2 font-medium"
                >
                  {t(`posts.${postKey}.sections.readMore.linkParkinson`)}
                </LocaleLink>
                {' — '}
                {t(`posts.${postKey}.sections.readMore.descParkinson`)}
              </li>
              <li>
                <LocaleLink
                  to="/blog/kpis-agencias-marketing-2026"
                  className="text-sky-300 hover:text-white underline underline-offset-2 font-medium"
                >
                  {t(`posts.${postKey}.sections.readMore.linkKpis`)}
                </LocaleLink>
                {' — '}
                {t(`posts.${postKey}.sections.readMore.descKpis`)}
              </li>
            </ul>
          </div>
        </section>
      </RevealOnScroll>

      <RevealOnScroll delay={1}>
        <section id="faq-capacidad-calendario" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-6">{t(`posts.${postKey}.faq.title`)}</h2>
          <div className="space-y-6 text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-5 sm:p-6 space-y-3">
                <h3 className="text-white font-bold text-lg m-0">{t(`posts.${postKey}.faq.q${i}.q`)}</h3>
                <p className="m-0" dangerouslySetInnerHTML={{ __html: t(`posts.${postKey}.faq.q${i}.a`) }} />
              </div>
            ))}
          </div>
        </section>
      </RevealOnScroll>

      <RevealOnScroll delay={2}>
        <section id="cta-capacidad-calendario" className="text-center mt-12 mb-8 scroll-mt-24">
          <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto mb-8">
            {t(`posts.${postKey}.cta.p1`)}
          </p>
          <LocaleLink to="/planificador-recursos">
            <Button
              size="lg"
              className="bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white px-10 py-6 text-lg font-bold shadow-xl shadow-sky-500/30 rounded-xl transition-all duration-300 hover:scale-105"
            >
              {t(`posts.${postKey}.cta.button`)}
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
        </section>
      </RevealOnScroll>
    </article>
  );
}
