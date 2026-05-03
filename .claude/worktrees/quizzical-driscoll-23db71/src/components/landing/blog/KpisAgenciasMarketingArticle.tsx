import { LocaleLink } from './LocaleLink';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  BarChart3,
  Target,
  Wallet,
  Gauge,
  Building2,
  ChevronRight,
  FileSpreadsheet,
  Zap,
  AlertTriangle,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { RevealOnScroll } from './RevealOnScroll';
import { BlogReadingTime } from './BlogReadingTime';
import { BlogTOC } from './BlogTOC';
import { BlogRelatedPost } from './BlogRelatedPost';
import type { BlogTOCItem } from './BlogTOC';

export interface KpisAgenciasMarketingArticleProps {
  readingMinutes?: number;
  tocItems?: BlogTOCItem[];
  relatedPost?: { title: string; description: string; href: string };
}

export function KpisAgenciasMarketingArticle({
  readingMinutes,
  tocItems,
  relatedPost,
}: KpisAgenciasMarketingArticleProps) {
  const { t } = useTranslation('blog');

  return (
    <article
      id="kpis-agencias-marketing-2026"
      className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 md:py-16 text-left overflow-x-hidden"
    >
      <section className="mb-12 sm:mb-14">
        <div className="mb-6 text-center flex flex-col items-center gap-3">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-indigo-300 bg-indigo-500/20 border border-indigo-400/30">
            {t('posts.kpisAgenciasMarketing.badge')}
          </span>
          {readingMinutes != null && <BlogReadingTime minutes={readingMinutes} />}
        </div>
        <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-[2.75rem] font-black text-white mb-5 sm:mb-6 leading-[1.15] tracking-tight text-center">
          {t('posts.kpisAgenciasMarketing.title')}
        </h1>
        <div className="space-y-4 text-indigo-100/95 text-base sm:text-lg leading-[1.75]">
          <p>{t('posts.kpisAgenciasMarketing.intro.p1')}</p>
          <p>{t('posts.kpisAgenciasMarketing.intro.p2')}</p>
          <div className="rounded-2xl border-l-4 border-indigo-400 bg-indigo-500/10 border border-indigo-500/20 p-4 sm:p-6 my-6">
            <p className="text-white/95 font-medium m-0">
              {t('posts.kpisAgenciasMarketing.intro.callout.prefix')}{' '}
              <LocaleLink
                to="/blog/planificacion-proyectos-cronograma-recursos"
                className="text-indigo-300 hover:text-white underline underline-offset-2"
              >
                {t('posts.kpisAgenciasMarketing.intro.callout.linkText')}
              </LocaleLink>
              {t('posts.kpisAgenciasMarketing.intro.callout.suffix')}
            </p>
          </div>
        </div>
      </section>

      {tocItems != null && tocItems.length > 0 && (
        <div className="mb-12">
          <BlogTOC items={tocItems} />
        </div>
      )}

      {/* Tabla rápida */}
      <RevealOnScroll>
        <section id="tabla-rapida-kpis" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6">
            {t('posts.kpisAgenciasMarketing.table.title')}
          </h2>
          <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-6">
            {t('posts.kpisAgenciasMarketing.table.descriptionPrefix')}{' '}
            <strong>{t('posts.kpisAgenciasMarketing.table.descriptionStrong')}</strong>
            {t('posts.kpisAgenciasMarketing.table.descriptionSuffix')}
          </p>
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
            <table className="w-full text-left text-sm sm:text-base">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="p-3 sm:p-4 text-indigo-200 font-semibold">
                    {t('posts.kpisAgenciasMarketing.table.headers.kpi')}
                  </th>
                  <th className="p-3 sm:p-4 text-indigo-200 font-semibold">
                    {t('posts.kpisAgenciasMarketing.table.headers.measure')}
                  </th>
                  <th className="p-3 sm:p-4 text-indigo-200 font-semibold">
                    {t('posts.kpisAgenciasMarketing.table.headers.decision')}
                  </th>
                </tr>
              </thead>
              <tbody className="text-indigo-100/90">
                <tr className="border-b border-white/10">
                  <td className="p-3 sm:p-4 font-medium text-white align-top">
                    {t('posts.kpisAgenciasMarketing.table.rows.utilizacion.kpi')}
                  </td>
                  <td className="p-3 sm:p-4 align-top">
                    {t('posts.kpisAgenciasMarketing.table.rows.utilizacion.measure')}
                  </td>
                  <td className="p-3 sm:p-4 align-top">
                    {t('posts.kpisAgenciasMarketing.table.rows.utilizacion.decision')}
                  </td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="p-3 sm:p-4 font-medium text-white align-top">
                    {t('posts.kpisAgenciasMarketing.table.rows.rentabilidad.kpi')}
                  </td>
                  <td className="p-3 sm:p-4 align-top">
                    {t('posts.kpisAgenciasMarketing.table.rows.rentabilidad.measure')}
                  </td>
                  <td className="p-3 sm:p-4 align-top">
                    {t('posts.kpisAgenciasMarketing.table.rows.rentabilidad.decision')}
                  </td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="p-3 sm:p-4 font-medium text-white align-top">
                    {t('posts.kpisAgenciasMarketing.table.rows.estimadoReal.kpi')}
                  </td>
                  <td className="p-3 sm:p-4 align-top">
                    {t('posts.kpisAgenciasMarketing.table.rows.estimadoReal.measure')}
                  </td>
                  <td className="p-3 sm:p-4 align-top">
                    {t('posts.kpisAgenciasMarketing.table.rows.estimadoReal.decision')}
                  </td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="p-3 sm:p-4 font-medium text-white align-top">
                    {t('posts.kpisAgenciasMarketing.table.rows.capacidadArea.kpi')}
                  </td>
                  <td className="p-3 sm:p-4 align-top">
                    {t('posts.kpisAgenciasMarketing.table.rows.capacidadArea.measure')}
                  </td>
                  <td className="p-3 sm:p-4 align-top">
                    {t('posts.kpisAgenciasMarketing.table.rows.capacidadArea.decision')}
                  </td>
                </tr>
                <tr>
                  <td className="p-3 sm:p-4 font-medium text-white align-top">
                    {t('posts.kpisAgenciasMarketing.table.rows.okrs.kpi')}
                  </td>
                  <td className="p-3 sm:p-4 align-top">
                    {t('posts.kpisAgenciasMarketing.table.rows.okrs.measure')}
                  </td>
                  <td className="p-3 sm:p-4 align-top">
                    {t('posts.kpisAgenciasMarketing.table.rows.okrs.decision')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </RevealOnScroll>

      {/* 1 Utilización */}
      <RevealOnScroll delay={1}>
        <section id="kpi-utilizacion" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6 flex items-center gap-3">
            <Gauge className="h-8 w-8 text-indigo-400 shrink-0" />
            {t('posts.kpisAgenciasMarketing.sections.utilizacion.title')}
          </h2>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            <p>
              {t('posts.kpisAgenciasMarketing.sections.utilizacion.p1.prefix')}{' '}
              <strong>{t('posts.kpisAgenciasMarketing.sections.utilizacion.p1.strong')}</strong>
              {t('posts.kpisAgenciasMarketing.sections.utilizacion.p1.suffix')}
            </p>
            <p>{t('posts.kpisAgenciasMarketing.sections.utilizacion.p2')}</p>
            <p>
              <strong>{t('posts.kpisAgenciasMarketing.sections.utilizacion.p3.strong')}</strong>
              {t('posts.kpisAgenciasMarketing.sections.utilizacion.p3.text')}{' '}
              <LocaleLink
                to="/blog/plantilla-planificacion-recursos-agencia"
                className="text-indigo-300 hover:text-white underline underline-offset-2"
              >
                {t('posts.kpisAgenciasMarketing.sections.utilizacion.p3.linkText')}
              </LocaleLink>{' '}
              {t('posts.kpisAgenciasMarketing.sections.utilizacion.p3.suffix')}
            </p>
            <p>
              {t('posts.kpisAgenciasMarketing.sections.utilizacion.p4.prefix')}{' '}
              <strong>{t('posts.kpisAgenciasMarketing.sections.utilizacion.p4.strong')}</strong>
              {t('posts.kpisAgenciasMarketing.sections.utilizacion.p4.suffix')}
            </p>
          </div>
          <div className="rounded-2xl border border-amber-500/30 bg-amber-950/35 p-5 sm:p-6 mt-6">
            <div className="flex gap-3">
              <AlertTriangle className="h-6 w-6 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-white font-semibold mb-2">
                  {t('posts.kpisAgenciasMarketing.sections.utilizacion.warning.title')}
                </h3>
                <p className="text-indigo-100/90 text-sm sm:text-base m-0 mb-3">
                  <strong>
                    {t('posts.kpisAgenciasMarketing.sections.utilizacion.warning.high.strong')}
                  </strong>
                  {t('posts.kpisAgenciasMarketing.sections.utilizacion.warning.high.text')}
                </p>
                <p className="text-indigo-100/90 text-sm sm:text-base m-0">
                  <strong>
                    {t('posts.kpisAgenciasMarketing.sections.utilizacion.warning.low.strong')}
                  </strong>
                  {t('posts.kpisAgenciasMarketing.sections.utilizacion.warning.low.text')}
                </p>
              </div>
            </div>
          </div>
        </section>
      </RevealOnScroll>

      {/* 2 Rentabilidad */}
      <RevealOnScroll delay={1}>
        <section id="kpi-rentabilidad-pacing" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6 flex items-center gap-3">
            <Wallet className="h-8 w-8 text-emerald-400 shrink-0" />
            {t('posts.kpisAgenciasMarketing.sections.rentabilidad.title')}
          </h2>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            <p>
              {t('posts.kpisAgenciasMarketing.sections.rentabilidad.p1.prefix')}{' '}
              <strong>{t('posts.kpisAgenciasMarketing.sections.rentabilidad.p1.strong1')}</strong>{' '}
              {t('posts.kpisAgenciasMarketing.sections.rentabilidad.p1.middle')}{' '}
              <strong>{t('posts.kpisAgenciasMarketing.sections.rentabilidad.p1.strong2')}</strong>
              {t('posts.kpisAgenciasMarketing.sections.rentabilidad.p1.suffix')}
            </p>
            <p>
              {t('posts.kpisAgenciasMarketing.sections.rentabilidad.p2')}
            </p>
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/25 p-5 sm:p-6 my-2">
              <h3 className="text-white font-semibold mb-2 text-base sm:text-lg">
                {t('posts.kpisAgenciasMarketing.sections.rentabilidad.example.title')}
              </h3>
              <p className="text-indigo-100/90 text-sm sm:text-base leading-relaxed m-0">
                {t('posts.kpisAgenciasMarketing.sections.rentabilidad.example.text.prefix')}{' '}
                <strong>{t('posts.kpisAgenciasMarketing.sections.rentabilidad.example.text.strong1')}</strong>{' '}
                {t('posts.kpisAgenciasMarketing.sections.rentabilidad.example.text.middle1')}{' '}
                <strong>{t('posts.kpisAgenciasMarketing.sections.rentabilidad.example.text.strong2')}</strong>{' '}
                {t('posts.kpisAgenciasMarketing.sections.rentabilidad.example.text.middle2')}{' '}
                <strong>{t('posts.kpisAgenciasMarketing.sections.rentabilidad.example.text.strong3')}</strong>{' '}
                {t('posts.kpisAgenciasMarketing.sections.rentabilidad.example.text.middle3')}{' '}
                <strong>{t('posts.kpisAgenciasMarketing.sections.rentabilidad.example.text.strong4')}</strong>{' '}
                {t('posts.kpisAgenciasMarketing.sections.rentabilidad.example.text.suffix')}
              </p>
            </div>
            <p>
              <strong>{t('posts.kpisAgenciasMarketing.sections.rentabilidad.p3.strong')}</strong>
              {t('posts.kpisAgenciasMarketing.sections.rentabilidad.p3.text')}
            </p>
            <p>
              {t('posts.kpisAgenciasMarketing.sections.rentabilidad.p4.prefix')}{' '}
              <strong>{t('posts.kpisAgenciasMarketing.sections.rentabilidad.p4.strong1')}</strong>{' '}
              {t('posts.kpisAgenciasMarketing.sections.rentabilidad.p4.middle')}{' '}
              <strong>{t('posts.kpisAgenciasMarketing.sections.rentabilidad.p4.strong2')}</strong>{' '}
              {t('posts.kpisAgenciasMarketing.sections.rentabilidad.p4.middle2')}{' '}
              <LocaleLink
                to="/reportes-rentabilidad"
                className="text-indigo-300 hover:text-white underline underline-offset-2"
              >
                {t('posts.kpisAgenciasMarketing.sections.rentabilidad.p4.linkText')}
              </LocaleLink>
              {t('posts.kpisAgenciasMarketing.sections.rentabilidad.p4.suffix')}
            </p>
          </div>
          <div className="rounded-2xl border border-rose-500/25 bg-rose-950/30 p-5 sm:p-6 mt-6">
            <h3 className="text-white font-semibold mb-2">
              {t('posts.kpisAgenciasMarketing.sections.rentabilidad.warning.title')}
            </h3>
            <p className="text-indigo-100/90 text-sm sm:text-base m-0">
              <strong>{t('posts.kpisAgenciasMarketing.sections.rentabilidad.warning.strong1')}</strong>
              {t('posts.kpisAgenciasMarketing.sections.rentabilidad.warning.text1')}{' '}
              <em>{t('posts.kpisAgenciasMarketing.sections.rentabilidad.warning.em')}</em>{' '}
              {t('posts.kpisAgenciasMarketing.sections.rentabilidad.warning.middle')}{' '}
              <strong>{t('posts.kpisAgenciasMarketing.sections.rentabilidad.warning.strong2')}</strong>
              {t('posts.kpisAgenciasMarketing.sections.rentabilidad.warning.text2')}
            </p>
          </div>
        </section>
      </RevealOnScroll>

      {/* 3 Estimación */}
      <RevealOnScroll delay={2}>
        <section id="kpi-estimado-real" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6 flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-purple-400 shrink-0" />
            {t('posts.kpisAgenciasMarketing.sections.estimacion.title')}
          </h2>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            <p>
              {t('posts.kpisAgenciasMarketing.sections.estimacion.p1.prefix')}{' '}
              <strong>{t('posts.kpisAgenciasMarketing.sections.estimacion.p1.strong1')}</strong>{' '}
              {t('posts.kpisAgenciasMarketing.sections.estimacion.p1.middle')}{' '}
              <strong>{t('posts.kpisAgenciasMarketing.sections.estimacion.p1.strong2')}</strong>
              {t('posts.kpisAgenciasMarketing.sections.estimacion.p1.suffix')}
            </p>
            <p>
              {t('posts.kpisAgenciasMarketing.sections.estimacion.p2')}
            </p>
          </div>
          <div className="rounded-2xl border border-violet-500/25 bg-violet-950/30 p-5 sm:p-6 mt-6">
            <h3 className="text-white font-semibold mb-2">
              {t('posts.kpisAgenciasMarketing.sections.estimacion.warning.title')}
            </h3>
            <p className="text-indigo-100/90 text-sm sm:text-base m-0">
              <strong>{t('posts.kpisAgenciasMarketing.sections.estimacion.warning.strong1')}</strong>
              {t('posts.kpisAgenciasMarketing.sections.estimacion.warning.text1')}{' '}
              <strong>{t('posts.kpisAgenciasMarketing.sections.estimacion.warning.strong2')}</strong>{' '}
              {t('posts.kpisAgenciasMarketing.sections.estimacion.warning.text2')}
            </p>
          </div>
        </section>
      </RevealOnScroll>

      {/* 4 Departamento */}
      <RevealOnScroll delay={2}>
        <section id="kpi-capacidad-departamento" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6 flex items-center gap-3">
            <Building2 className="h-8 w-8 text-cyan-400 shrink-0" />
            {t('posts.kpisAgenciasMarketing.sections.departamento.title')}
          </h2>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            <p>{t('posts.kpisAgenciasMarketing.sections.departamento.p1')}</p>
            <p>
              <strong>{t('posts.kpisAgenciasMarketing.sections.departamento.p2.strong')}</strong>
              {t('posts.kpisAgenciasMarketing.sections.departamento.p2.text')}
            </p>
          </div>
          <div className="rounded-2xl border border-cyan-500/25 bg-cyan-950/25 p-5 sm:p-6 mt-6">
            <h3 className="text-white font-semibold mb-2">
              {t('posts.kpisAgenciasMarketing.sections.departamento.warning.title')}
            </h3>
            <p className="text-indigo-100/90 text-sm sm:text-base m-0">
              <strong>{t('posts.kpisAgenciasMarketing.sections.departamento.warning.strong1')}</strong>
              {t('posts.kpisAgenciasMarketing.sections.departamento.warning.text1')}{' '}
              <strong>{t('posts.kpisAgenciasMarketing.sections.departamento.warning.strong2')}</strong>
              {t('posts.kpisAgenciasMarketing.sections.departamento.warning.text2')}
            </p>
          </div>
        </section>
      </RevealOnScroll>

      {/* 5 OKRs */}
      <RevealOnScroll delay={3}>
        <section id="kpi-okrs" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6 flex items-center gap-3">
            <Target className="h-8 w-8 text-amber-400 shrink-0" />
            {t('posts.kpisAgenciasMarketing.sections.okrs.title')}
          </h2>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            <p>
              {t('posts.kpisAgenciasMarketing.sections.okrs.p1.prefix')}{' '}
              <strong>{t('posts.kpisAgenciasMarketing.sections.okrs.p1.strong')}</strong>
              {t('posts.kpisAgenciasMarketing.sections.okrs.p1.suffix')}
            </p>
            <p>
              {t('posts.kpisAgenciasMarketing.sections.okrs.p2')}
            </p>
          </div>
          <div className="rounded-2xl border border-amber-500/25 bg-amber-950/30 p-5 sm:p-6 mt-6">
            <h3 className="text-white font-semibold mb-2">
              {t('posts.kpisAgenciasMarketing.sections.okrs.warning.title')}
            </h3>
            <p className="text-indigo-100/90 text-sm sm:text-base m-0">
              <strong>{t('posts.kpisAgenciasMarketing.sections.okrs.warning.strong1')}</strong>
              {t('posts.kpisAgenciasMarketing.sections.okrs.warning.text1')}{' '}
              <strong>{t('posts.kpisAgenciasMarketing.sections.okrs.warning.strong2')}</strong>
              {t('posts.kpisAgenciasMarketing.sections.okrs.warning.text2')}
            </p>
          </div>
        </section>
      </RevealOnScroll>

      {/* Excel vs Taimbox */}
      <RevealOnScroll delay={3}>
        <section id="excel-vs-taimbox" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6 flex items-center gap-3">
            <FileSpreadsheet className="h-8 w-8 text-slate-300 shrink-0" />
            {t('posts.kpisAgenciasMarketing.sections.excelVsTaimbox.title')}
          </h2>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            <p>
              <strong>{t('posts.kpisAgenciasMarketing.sections.excelVsTaimbox.p1.strong')}</strong>
              {t('posts.kpisAgenciasMarketing.sections.excelVsTaimbox.p1.text')}
            </p>
            <p>
              {t('posts.kpisAgenciasMarketing.sections.excelVsTaimbox.p2.prefix')}{' '}
              <strong>{t('posts.kpisAgenciasMarketing.sections.excelVsTaimbox.p2.strong')}</strong>
              {t('posts.kpisAgenciasMarketing.sections.excelVsTaimbox.p2.suffix')}
            </p>
            <p>
              {t('posts.kpisAgenciasMarketing.sections.excelVsTaimbox.p3')}
            </p>
            <p>
              {t('posts.kpisAgenciasMarketing.sections.excelVsTaimbox.p4.prefix')}{' '}
              <strong>{t('posts.kpisAgenciasMarketing.sections.excelVsTaimbox.p4.strong1')}</strong>
              {t('posts.kpisAgenciasMarketing.sections.excelVsTaimbox.p4.middle')}{' '}
              <strong>{t('posts.kpisAgenciasMarketing.sections.excelVsTaimbox.p4.strong2')}</strong>
              {t('posts.kpisAgenciasMarketing.sections.excelVsTaimbox.p4.suffix')}
            </p>
          </div>
          <div className="rounded-2xl border border-indigo-500/25 bg-indigo-950/40 p-5 sm:p-6 mt-6 flex gap-4">
            <Zap className="h-8 w-8 text-indigo-400 shrink-0" />
            <p className="text-indigo-100/95 m-0">
              {t('posts.kpisAgenciasMarketing.sections.excelVsTaimbox.callout.prefix')}{' '}
              <strong>{t('posts.kpisAgenciasMarketing.sections.excelVsTaimbox.callout.strong')}</strong>
              {t('posts.kpisAgenciasMarketing.sections.excelVsTaimbox.callout.suffix')}
            </p>
          </div>
        </section>
      </RevealOnScroll>

      {/* Enlaces útiles */}
      <RevealOnScroll delay={1}>
        <section id="enlaces-guia-landings" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">
            {t('posts.kpisAgenciasMarketing.sections.links.title')}
          </h2>
          <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-4">
            {t('posts.kpisAgenciasMarketing.sections.links.p1.prefix')}{' '}
            <LocaleLink to="/guia" className="text-indigo-300 hover:text-white underline underline-offset-2">
              {t('posts.kpisAgenciasMarketing.sections.links.p1.linkText')}
            </LocaleLink>{' '}
            {t('posts.kpisAgenciasMarketing.sections.links.p1.suffix')}
          </p>
          <div className="flex flex-wrap gap-3">
            <LocaleLink to="/planificador-recursos">
              <Button
                size="sm"
                variant="outline"
                className="border-indigo-400/50 bg-transparent text-white hover:bg-indigo-500/25 hover:text-white"
              >
                {t('posts.kpisAgenciasMarketing.sections.links.buttons.planner')}{' '}
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </LocaleLink>
            <LocaleLink to="/reportes-rentabilidad">
              <Button
                size="sm"
                variant="outline"
                className="border-emerald-400/50 bg-transparent text-white hover:bg-emerald-500/20 hover:text-white"
              >
                {t('posts.kpisAgenciasMarketing.sections.links.buttons.reports')}{' '}
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </LocaleLink>
            <LocaleLink to="/integraciones">
              <Button
                size="sm"
                variant="outline"
                className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                {t('posts.kpisAgenciasMarketing.sections.links.buttons.integrations')}{' '}
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </LocaleLink>
          </div>
        </section>
      </RevealOnScroll>

      {/* Cierre + enlaces artículos */}
      <RevealOnScroll delay={2}>
        <section className="mb-12">
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 sm:p-8 mb-8">
            <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-4">
              {t('posts.kpisAgenciasMarketing.sections.closing.p1.prefix')}{' '}
              <LocaleLink to="/blog/ley-parkinson" className="text-indigo-300 hover:text-white underline underline-offset-2">
                {t('posts.kpisAgenciasMarketing.sections.closing.p1.linkParkinson')}
              </LocaleLink>{' '}
              {t('posts.kpisAgenciasMarketing.sections.closing.p1.middle')}{' '}
              <LocaleLink to="/blog/que-es-timeboxing" className="text-indigo-300 hover:text-white underline underline-offset-2">
                {t('posts.kpisAgenciasMarketing.sections.closing.p1.linkTimeboxing')}
              </LocaleLink>
              {t('posts.kpisAgenciasMarketing.sections.closing.p1.suffix')}
            </p>
          </div>

          <div id="cta-kpis-agencias" className="text-center mt-12 mb-8 scroll-mt-24">
            <h2 className="text-2xl sm:text-4xl font-bold text-white mb-4">
              {t('posts.kpisAgenciasMarketing.sections.closing.cta.title')}
            </h2>
            <p className="text-indigo-100/90 text-lg mb-8 max-w-2xl mx-auto">
              {t('posts.kpisAgenciasMarketing.sections.closing.cta.text.prefix')}{' '}
              <strong>{t('posts.kpisAgenciasMarketing.sections.closing.cta.text.strong')}</strong>
              {t('posts.kpisAgenciasMarketing.sections.closing.cta.text.suffix')}
            </p>
            <p className="text-indigo-200/70 text-sm m-0 max-w-2xl mx-auto">
              {t('posts.kpisAgenciasMarketing.sections.closing.cta.caption')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <LocaleLink to="/reportes-rentabilidad">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-8 py-6 text-base font-bold shadow-xl shadow-emerald-500/30 rounded-xl transition-all duration-300 hover:scale-105"
                >
                  {t('posts.kpisAgenciasMarketing.sections.closing.cta.buttons.reports')}{' '}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </LocaleLink>
              <LocaleLink to="/planificador-recursos">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-indigo-400/60 bg-transparent px-8 py-6 text-base font-semibold text-white shadow-none hover:bg-indigo-500/20 hover:text-white rounded-xl"
                >
                  {t('posts.kpisAgenciasMarketing.sections.closing.cta.buttons.planner')}{' '}
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </LocaleLink>
            </div>
            <p className="text-indigo-200/70 text-sm mb-8">
              <LocaleLink to="/precios" className="text-indigo-300 hover:text-white underline underline-offset-2">
                {t('posts.kpisAgenciasMarketing.sections.closing.cta.pricingLink')}
              </LocaleLink>
            </p>
            {relatedPost != null && (
              <div className="max-w-xl mx-auto mb-8">
                <BlogRelatedPost
                  title={relatedPost.title}
                  description={relatedPost.description}
                  href={relatedPost.href}
                />
              </div>
            )}
            <p className="text-indigo-300 text-sm italic m-0">
              {t('posts.kpisAgenciasMarketing.sections.closing.signature')}
            </p>
          </div>
        </section>
      </RevealOnScroll>
    </article>
  );
}
