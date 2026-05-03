import { LocaleLink } from './LocaleLink';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  Download,
  Table2,
  Sparkles,
  Wallet,
  LayoutGrid,
  ChevronRight,
  Users,
  AlertTriangle,
  Zap,
  FileSpreadsheet,
  Calculator,
  TrendingUp,
  Clock,
  HelpCircle,
  BarChart3,
  Shield,
  ListChecks,
  CalendarRange,
} from 'lucide-react';
import { RevealOnScroll } from './RevealOnScroll';
import { BlogReadingTime } from './BlogReadingTime';
import { BlogTOC } from './BlogTOC';
import { BlogRelatedPost } from './BlogRelatedPost';
import type { BlogTOCItem } from './BlogTOC';

const PLANTILLA_XLSX_HREF = '/recursos/plantilla-planificacion-recursos-taimbox.xlsx';

export interface PlantillaPlanificacionRecursosArticleProps {
  readingMinutes?: number;
  tocItems?: BlogTOCItem[];
  relatedPost?: { title: string; description: string; href: string };
}

export function PlantillaPlanificacionRecursosArticle({
  readingMinutes,
  tocItems,
  relatedPost,
}: PlantillaPlanificacionRecursosArticleProps) {
  const { t } = useTranslation('blog');
  const tp = (key: string) => t(`posts.plantillaPlanificacionRecursos.${key}`);

  return (
    <article
      id="plantilla-planificacion-recursos-agencia"
      className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 md:py-16 text-left overflow-x-hidden"
    >
      {/* Hero */}
      <section className="mb-12 sm:mb-14">
        <div className="mb-6 text-center flex flex-col items-center gap-3">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-indigo-300 bg-indigo-500/20 border border-indigo-400/30">
            <Sparkles className="inline h-3.5 w-3.5 mr-1" />
            {tp('hero.badge')}
          </span>
          {readingMinutes != null && <BlogReadingTime minutes={readingMinutes} />}
        </div>
        <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-[2.75rem] font-black text-white mb-5 sm:mb-6 leading-[1.15] tracking-tight text-center">
          {tp('hero.title')}
        </h1>
        <div className="space-y-4 text-indigo-100/95 text-base sm:text-lg leading-[1.75]">
          <p>
            {tp('hero.p1')}
          </p>
          <p>
            {tp('hero.p2')}
          </p>
          <p>
            {tp('hero.p3')}
          </p>
          <div className="rounded-2xl border-l-4 border-indigo-400 bg-indigo-500/10 border border-indigo-500/20 p-4 sm:p-6 my-6">
            <p className="text-white/95 font-medium m-0">
              {tp('hero.metricsPrefix')}{' '}
              <LocaleLink
                to="/blog/kpis-agencias-marketing-2026"
                className="text-indigo-300 hover:text-white underline underline-offset-2"
              >
                {tp('hero.metricsLink')}
              </LocaleLink>
              {tp('hero.metricsSuffix')}
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mt-8">
          <a href={PLANTILLA_XLSX_HREF} download>
            <Button
              size="lg"
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold px-8 py-6 text-base shadow-xl shadow-indigo-500/30 rounded-xl transition-all duration-300 hover:scale-105"
            >
              <Download className="mr-2 h-5 w-5" />
              {tp('hero.downloadCta')}
            </Button>
          </a>
          <p className="text-indigo-200/80 text-sm m-0 sm:max-w-xs text-center sm:text-left">
            {tp('hero.downloadHint')}
          </p>
        </div>
      </section>

      {tocItems != null && tocItems.length > 0 && (
        <div className="mb-12">
          <BlogTOC items={tocItems} />
        </div>
      )}

      {/* 1 Introducción */}
      <RevealOnScroll>
        <section id="intro-excel-primer-amor" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6 flex items-center gap-3">
            <FileSpreadsheet className="h-8 w-8 text-emerald-400 shrink-0" />
            {tp('sections.intro.title')}
          </h2>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            <p>
              {tp('sections.intro.p1')}
            </p>
            <p>
              {tp('sections.intro.p2')}
            </p>
            <p>
              {tp('sections.intro.p3')}
            </p>
          </div>
          <div className="rounded-2xl border border-indigo-500/25 bg-indigo-950/40 p-5 sm:p-6 mt-6 flex gap-4">
            <Clock className="h-8 w-8 text-indigo-400 shrink-0 mt-0.5" />
            <p className="text-indigo-100/95 m-0">
              {tp('sections.intro.callout')}
            </p>
          </div>
        </section>
      </RevealOnScroll>

      {/* 2 Capacidad bruta vs neta */}
      <RevealOnScroll delay={1}>
        <section id="capacidad-bruta-vs-neta" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6 flex items-center gap-3">
            <Users className="h-8 w-8 text-purple-400 shrink-0" />
            {tp('sections.capacity.title')}
          </h2>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            <p>
              {tp('sections.capacity.p1')}
            </p>
            <p>
              {tp('sections.capacity.p2')}
            </p>
          </div>
          <div className="rounded-2xl border border-purple-500/30 bg-purple-950/30 p-5 sm:p-6 mt-6">
            <h3 className="text-white font-semibold mb-3 text-base sm:text-lg">
              {tp('sections.capacity.exampleTitle')}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm sm:text-base">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5">
                    <th className="p-3 text-indigo-200 font-semibold">
                      {tp('sections.capacity.table.headers.person')}
                    </th>
                    <th className="p-3 text-indigo-200 font-semibold">
                      {tp('sections.capacity.table.headers.gross')}
                    </th>
                    <th className="p-3 text-indigo-200 font-semibold">
                      {tp('sections.capacity.table.headers.meetings')}
                    </th>
                    <th className="p-3 text-indigo-200 font-semibold">
                      {tp('sections.capacity.table.headers.admin')}
                    </th>
                    <th className="p-3 text-indigo-200 font-semibold">
                      {tp('sections.capacity.table.headers.absences')}
                    </th>
                    <th className="p-3 text-indigo-200 font-semibold">
                      {tp('sections.capacity.table.headers.net')}
                    </th>
                  </tr>
                </thead>
                <tbody className="text-indigo-100/90">
                  <tr className="border-b border-white/10">
                    <td className="p-3 font-medium text-white">
                      {tp('sections.capacity.table.rows.ana')}
                    </td>
                    <td className="p-3">40</td>
                    <td className="p-3">6</td>
                    <td className="p-3">2</td>
                    <td className="p-3">0</td>
                    <td className="p-3 font-semibold text-emerald-300">32</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="p-3 font-medium text-white">
                      {tp('sections.capacity.table.rows.luis')}
                    </td>
                    <td className="p-3">40</td>
                    <td className="p-3">4</td>
                    <td className="p-3">2</td>
                    <td className="p-3">0</td>
                    <td className="p-3 font-semibold text-emerald-300">34</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-white">
                      {tp('sections.capacity.table.rows.maria')}
                    </td>
                    <td className="p-3">40</td>
                    <td className="p-3">8</td>
                    <td className="p-3">3</td>
                    <td className="p-3">0</td>
                    <td className="p-3 font-semibold text-emerald-300">29</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-indigo-100/80 text-sm mt-4 m-0">
              {tp('sections.capacity.exampleNote')}
            </p>
          </div>
          <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-5 sm:p-6 mt-6">
            <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
              <Calculator className="h-5 w-5 text-indigo-400" />
              {tp('sections.capacity.formulaTitle')}
            </h3>
            <pre className="text-sm sm:text-base font-mono text-indigo-100 bg-white/5 border border-white/10 rounded-lg p-4 overflow-x-auto m-0">
              =C2-D2-E2-F2
            </pre>
            <p className="text-indigo-200/80 text-sm mt-3 m-0">
              {tp('sections.capacity.formulaNote')}
            </p>
          </div>
        </section>
      </RevealOnScroll>

      {/* 3 Anatomía plantilla: 4 hojas */}
      <RevealOnScroll delay={1}>
        <section id="anatomia-plantilla-profesional" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6 flex items-center gap-3">
            <Table2 className="h-8 w-8 text-indigo-400 shrink-0" />
            {tp('sections.anatomy.title')}
          </h2>
          <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-6">
            {tp('sections.anatomy.intro')}
          </p>

          <div className="space-y-8 mb-8">
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/25 p-5 sm:p-6">
              <h3 className="text-white font-bold mb-3 text-lg flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500/30 text-emerald-300 text-sm font-bold">
                  1
                </span>
                {tp('sections.anatomy.sheetTeam.title')}
              </h3>
              <p className="text-indigo-100/90 text-base leading-relaxed m-0 mb-3">
                {tp('sections.anatomy.sheetTeam.body')}
              </p>
              <p className="text-indigo-200/80 text-sm m-0">
                {tp('sections.anatomy.sheetTeam.note')}
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/25 p-5 sm:p-6">
              <h3 className="text-white font-bold mb-3 text-lg flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500/30 text-emerald-300 text-sm font-bold">
                  2
                </span>
                {tp('sections.anatomy.sheetProjects.title')}
              </h3>
              <p className="text-indigo-100/90 text-base leading-relaxed m-0 mb-3">
                {tp('sections.anatomy.sheetProjects.body')}
              </p>
              <ul className="text-indigo-100/90 text-sm space-y-1.5 list-disc pl-6 mb-3">
                <li>{tp('sections.anatomy.sheetProjects.points.hoursAssigned')}</li>
                <li>{tp('sections.anatomy.sheetProjects.points.pacing')}</li>
                <li>{tp('sections.anatomy.sheetProjects.points.cost')}</li>
                <li>{tp('sections.anatomy.sheetProjects.points.margin')}</li>
              </ul>
              <p className="text-indigo-200/80 text-sm m-0">
                {tp('sections.anatomy.sheetProjects.note')}
              </p>
            </div>

            <div className="rounded-2xl border border-indigo-500/30 bg-indigo-950/30 p-5 sm:p-6">
              <h3 className="text-white font-bold mb-3 text-lg flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-indigo-500/30 text-indigo-300 text-sm font-bold">
                  3
                </span>
                {tp('sections.anatomy.sheetAssignment.title')}
              </h3>
              <p className="text-indigo-100/90 text-base leading-relaxed m-0 mb-3">
                {tp('sections.anatomy.sheetAssignment.body1')}
              </p>
              <p className="text-indigo-100/90 text-base leading-relaxed m-0 mb-3">
                {tp('sections.anatomy.sheetAssignment.body2')}
              </p>
              <p className="text-indigo-200/80 text-sm m-0">
                {tp('sections.anatomy.sheetAssignment.note')}
              </p>
            </div>

            <div className="rounded-2xl border border-amber-500/30 bg-amber-950/25 p-5 sm:p-6">
              <h3 className="text-white font-bold mb-3 text-lg flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-500/30 text-amber-300 text-sm font-bold">
                  4
                </span>
                {tp('sections.anatomy.sheetInsights.title')}
              </h3>
              <p className="text-indigo-100/90 text-base leading-relaxed m-0 mb-3">
                {tp('sections.anatomy.sheetInsights.body')}
              </p>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="inline-block rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 font-mono text-sm">
                  {tp('sections.anatomy.sheetInsights.badges.optimal')}
                </span>
                <span className="inline-block rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-1 font-mono text-sm">
                  {tp('sections.anatomy.sheetInsights.badges.risk')}
                </span>
                <span className="inline-block rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2.5 py-1 font-mono text-sm">
                  {tp('sections.anatomy.sheetInsights.badges.overload')}
                </span>
              </div>
              <p className="text-indigo-100/90 text-base leading-relaxed m-0 mb-3">
                {tp('sections.anatomy.sheetInsights.status')}
              </p>
              <p className="text-indigo-100/90 text-base leading-relaxed m-0 mb-3">
                {tp('sections.anatomy.sheetInsights.kpis')}
              </p>
              <p className="text-indigo-200/80 text-sm m-0">
                {tp('sections.anatomy.sheetInsights.note')}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5 mb-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-300/80 px-4 pt-4 m-0">
              {tp('sections.anatomy.mockup.caption')}
            </p>
            <table className="w-full text-left text-sm sm:text-base">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="p-3 sm:p-4 text-indigo-200 font-semibold">
                    {tp('sections.anatomy.mockup.headers.person')}
                  </th>
                  <th className="p-3 sm:p-4 text-indigo-200 font-semibold">
                    {tp('sections.anatomy.mockup.headers.netCapacity')}
                  </th>
                  <th className="p-3 sm:p-4 text-indigo-200 font-semibold">
                    {tp('sections.anatomy.mockup.headers.assigned')}
                  </th>
                  <th className="p-3 sm:p-4 text-indigo-200 font-semibold">
                    {tp('sections.anatomy.mockup.headers.free')}
                  </th>
                  <th className="p-3 sm:p-4 text-indigo-200 font-semibold">
                    {tp('sections.anatomy.mockup.headers.utilization')}
                  </th>
                  <th className="p-3 sm:p-4 text-indigo-200 font-semibold">
                    {tp('sections.anatomy.mockup.headers.status')}
                  </th>
                </tr>
              </thead>
              <tbody className="text-indigo-100/90">
                <tr className="border-b border-white/10">
                  <td className="p-3 sm:p-4 font-medium text-white">
                    {tp('sections.anatomy.mockup.rows.ana.name')}
                  </td>
                  <td className="p-3 sm:p-4">32</td>
                  <td className="p-3 sm:p-4">30</td>
                  <td className="p-3 sm:p-4">2</td>
                  <td className="p-3 sm:p-4">
                    <span className="inline-block rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 font-mono text-sm">94%</span>
                  </td>
                  <td className="p-3 sm:p-4 text-amber-300">
                    {tp('sections.anatomy.mockup.rows.ana.status')}
                  </td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="p-3 sm:p-4 font-medium text-white">
                    {tp('sections.anatomy.mockup.rows.luis.name')}
                  </td>
                  <td className="p-3 sm:p-4">34</td>
                  <td className="p-3 sm:p-4">32</td>
                  <td className="p-3 sm:p-4">2</td>
                  <td className="p-3 sm:p-4">
                    <span className="inline-block rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 font-mono text-sm">94%</span>
                  </td>
                  <td className="p-3 sm:p-4 text-amber-300">
                    {tp('sections.anatomy.mockup.rows.luis.status')}
                  </td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="p-3 sm:p-4 font-medium text-white">
                    {tp('sections.anatomy.mockup.rows.maria.name')}
                  </td>
                  <td className="p-3 sm:p-4">29</td>
                  <td className="p-3 sm:p-4">29</td>
                  <td className="p-3 sm:p-4">0</td>
                  <td className="p-3 sm:p-4">
                    <span className="inline-block rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 font-mono text-sm">100%</span>
                  </td>
                  <td className="p-3 sm:p-4 text-rose-300">
                    {tp('sections.anatomy.mockup.rows.maria.status')}
                  </td>
                </tr>
                <tr>
                  <td className="p-3 sm:p-4 font-medium text-white">
                    {tp('sections.anatomy.mockup.rows.jorge.name')}
                  </td>
                  <td className="p-3 sm:p-4">36</td>
                  <td className="p-3 sm:p-4">34</td>
                  <td className="p-3 sm:p-4">2</td>
                  <td className="p-3 sm:p-4">
                    <span className="inline-block rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 font-mono text-sm">94%</span>
                  </td>
                  <td className="p-3 sm:p-4 text-amber-300">
                    {tp('sections.anatomy.mockup.rows.jorge.status')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <a href={PLANTILLA_XLSX_HREF} download className="flex justify-center">
            <Button variant="outline" className="border-indigo-400/50 bg-transparent text-white hover:bg-indigo-500/25 hover:text-white">
              <Download className="mr-2 h-4 w-4" />
              {tp('sections.anatomy.downloadCta')}
            </Button>
          </a>
        </section>
      </RevealOnScroll>

      {/* 4 Fórmula maestra + formato condicional */}
      <RevealOnScroll delay={2}>
        <section id="formula-utilizacion-formato" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6 flex items-center gap-3">
            <Calculator className="h-8 w-8 text-emerald-400 shrink-0" />
            {tp('sections.utilization.title')}
          </h2>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-6">
            <p>
              {tp('sections.utilization.intro')}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6 mb-6">
            <h3 className="text-white font-semibold mb-3">
              {tp('sections.utilization.masterFormulaTitle')}
            </h3>
            <pre className="text-sm sm:text-base font-mono text-indigo-100 bg-indigo-950/50 border border-white/10 rounded-lg p-4 overflow-x-auto m-0 mb-4">
              =IFERROR(D2/C2, 0)
            </pre>
            <p className="text-indigo-100/90 text-sm sm:text-base m-0 mb-4">
              {tp('sections.utilization.masterFormulaNote')}
            </p>
            <div className="border-t border-white/10 pt-4 mb-4">
              <h4 className="text-white font-semibold mb-2">
                {tp('sections.utilization.conditionalTitle')}
              </h4>
              <p className="text-indigo-100/90 text-sm sm:text-base m-0 mb-3">
                {tp('sections.utilization.conditionalIntro')}
              </p>
              <ul className="text-indigo-100/90 text-sm space-y-1.5 list-disc pl-6">
                <li>{tp('sections.utilization.conditionalPoints.optimal')}</li>
                <li>{tp('sections.utilization.conditionalPoints.risk')}</li>
                <li>{tp('sections.utilization.conditionalPoints.overload')}</li>
              </ul>
            </div>
            <div className="border-t border-white/10 pt-4">
              <h4 className="text-white font-semibold mb-2">
                {tp('sections.utilization.statusTitle')}
              </h4>
              <pre className="text-sm font-mono text-indigo-100 bg-indigo-950/50 border border-white/10 rounded-lg p-4 overflow-x-auto m-0 mb-3">
{`=IF(F2>=1, "⛔ SOBRECARGA",
  IF(F2>0.9, "⚠️ RIESGO",
    IF(F2>0.7, "✅ ÓPTIMO",
      "💤 BAJA CARGA")))`}
              </pre>
              <p className="text-indigo-200/80 text-sm m-0">
                {tp('sections.utilization.statusNote')}
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/25 p-5 sm:p-6">
            <h3 className="text-white font-semibold mb-2 text-base sm:text-lg">
              {tp('sections.utilization.exampleTitle')}
            </h3>
            <p className="text-indigo-100/90 text-sm sm:text-base leading-relaxed m-0">
              {tp('sections.utilization.exampleBody')}
            </p>
          </div>
        </section>
      </RevealOnScroll>

      {/* 5 Pacing por proyecto y margen */}
      <RevealOnScroll delay={2}>
        <section id="pacing-proyecto-margen" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6 flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-purple-400 shrink-0" />
            {tp('sections.pacing.title')}
          </h2>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            <p>
              {tp('sections.pacing.p1')}
            </p>
            <p>
              {tp('sections.pacing.p2')}
            </p>
          </div>
          <div className="rounded-2xl border border-purple-500/30 bg-purple-950/30 p-5 sm:p-6 mt-6">
            <h3 className="text-white font-semibold mb-2 text-base sm:text-lg">
              {tp('sections.pacing.exampleTitle')}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm sm:text-base">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5">
                    <th className="p-3 text-indigo-200 font-semibold">
                      {tp('sections.pacing.table.headers.metric')}
                    </th>
                    <th className="p-3 text-indigo-200 font-semibold">
                      {tp('sections.pacing.table.headers.value')}
                    </th>
                  </tr>
                </thead>
                <tbody className="text-indigo-100/90">
                  <tr className="border-b border-white/10">
                    <td className="p-3">{tp('sections.pacing.table.rows.fee.label')}</td>
                    <td className="p-3 font-semibold text-white">
                      {tp('sections.pacing.table.rows.fee.value')}
                    </td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="p-3">{tp('sections.pacing.table.rows.budgetedHours.label')}</td>
                    <td className="p-3">{tp('sections.pacing.table.rows.budgetedHours.value')}</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="p-3">
                      {tp('sections.pacing.table.rows.weeklyAverage.label')}
                    </td>
                    <td className="p-3">
                      {tp('sections.pacing.table.rows.weeklyAverage.value')}
                    </td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="p-3">
                      {tp('sections.pacing.table.rows.assignedThisWeek.label')}
                    </td>
                    <td className="p-3 font-semibold text-amber-300">
                      {tp('sections.pacing.table.rows.assignedThisWeek.value')}
                    </td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="p-3">{tp('sections.pacing.table.rows.pacing.label')}</td>
                    <td className="p-3">
                      <span className="inline-block rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 font-mono text-sm">
                        {tp('sections.pacing.table.rows.pacing.value')}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3">
                      {tp('sections.pacing.table.rows.margin.label')}
                    </td>
                    <td className="p-3 font-semibold text-emerald-300">
                      {tp('sections.pacing.table.rows.margin.value')}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-indigo-100/80 text-sm mt-4 m-0">
              {tp('sections.pacing.note')}
            </p>
          </div>
        </section>
      </RevealOnScroll>

      {/* 6 Impuesto Excel */}
      <RevealOnScroll delay={2}>
        <section id="impuesto-excel-techo" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6 flex items-center gap-3">
            <Wallet className="h-8 w-8 text-amber-400 shrink-0" />
            {tp('sections.excelTax.title')}
          </h2>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            <p>
              {tp('sections.excelTax.p1')}
            </p>
          </div>
          <div className="rounded-2xl border border-amber-500/30 bg-amber-950/30 p-5 sm:p-6 mt-4 mb-6">
            <p className="text-white font-semibold text-xl sm:text-2xl text-center m-0 mb-2">
              {tp('sections.excelTax.formula')}
            </p>
            <p className="text-indigo-200/80 text-sm text-center m-0">
              {tp('sections.excelTax.formulaNote')}
            </p>
          </div>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            <p>
              {tp('sections.excelTax.p2')}
            </p>
            <p>
              {tp('sections.excelTax.p3')}
            </p>
          </div>
        </section>
      </RevealOnScroll>

      {/* 7 Techo de cristal */}
      <RevealOnScroll delay={2}>
        <section id="techo-cristal-errores" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6 flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-rose-400 shrink-0" />
            {tp('sections.ceiling.title')}
          </h2>
          <div className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
              <h3 className="text-white font-bold mb-2">
                {tp('sections.ceiling.blocks.dataArcheology.title')}
              </h3>
              <p className="text-indigo-100/90 text-base leading-relaxed m-0">
                {tp('sections.ceiling.blocks.dataArcheology.body')}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
              <h3 className="text-white font-bold mb-2">
                {tp('sections.ceiling.blocks.realityGap.title')}
              </h3>
              <p className="text-indigo-100/90 text-base leading-relaxed m-0">
                {tp('sections.ceiling.blocks.realityGap.body')}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
              <h3 className="text-white font-bold mb-2">
                {tp('sections.ceiling.blocks.humanError.title')}
              </h3>
              <p className="text-indigo-100/90 text-base leading-relaxed m-0">
                {tp('sections.ceiling.blocks.humanError.body')}
              </p>
            </div>
          </div>
          <div className="rounded-2xl border-l-4 border-rose-400 bg-rose-500/10 border border-rose-500/20 p-4 sm:p-6 mt-6">
            <p className="text-white/95 font-medium m-0">
              {tp('sections.ceiling.conclusion')}
            </p>
          </div>
        </section>
      </RevealOnScroll>

      {/* 8 Validación y protección */}
      <RevealOnScroll delay={3}>
        <section id="validacion-proteccion-errores" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6 flex items-center gap-3">
            <Shield className="h-8 w-8 text-indigo-400 shrink-0" />
            {tp('sections.validation.title')}
          </h2>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-6">
            <p>
              {tp('sections.validation.intro')}
            </p>
          </div>
          <div className="space-y-6">
            <div className="rounded-2xl border border-indigo-500/25 bg-indigo-950/40 p-5 sm:p-6">
              <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                <ListChecks className="h-5 w-5 text-indigo-400" />
                {tp('sections.validation.dropdowns.title')}
              </h3>
              <p className="text-indigo-100/90 text-base leading-relaxed m-0 mb-3">
                {tp('sections.validation.dropdowns.body')}
              </p>
              <p className="text-indigo-200/80 text-sm m-0">
                {tp('sections.validation.dropdowns.note')}
              </p>
            </div>
            <div className="rounded-2xl border border-indigo-500/25 bg-indigo-950/40 p-5 sm:p-6">
              <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                <Shield className="h-5 w-5 text-indigo-400" />
                {tp('sections.validation.protection.title')}
              </h3>
              <p className="text-indigo-100/90 text-base leading-relaxed m-0 mb-3">
                {tp('sections.validation.protection.body')}
              </p>
              <p className="text-indigo-200/80 text-sm m-0">
                {tp('sections.validation.protection.note')}
              </p>
            </div>
          </div>
        </section>
      </RevealOnScroll>

      {/* 9 Escalar semana a semana */}
      <RevealOnScroll delay={3}>
        <section id="escalar-semana-semana" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6 flex items-center gap-3">
            <CalendarRange className="h-8 w-8 text-emerald-400 shrink-0" />
            {tp('sections.scale.title')}
          </h2>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-6">
            <p>
              {tp('sections.scale.intro')}
            </p>
            <ol className="list-decimal pl-6 space-y-3">
              <li>
                {tp('sections.scale.steps.step1')}
              </li>
              <li>
                {tp('sections.scale.steps.step2')}
              </li>
              <li>
                {tp('sections.scale.steps.step3')}
              </li>
            </ol>
          </div>
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/25 p-5 sm:p-6">
            <h3 className="text-white font-semibold mb-2 text-base sm:text-lg">
              {tp('sections.scale.trickTitle')}
            </h3>
            <p className="text-indigo-100/90 text-sm sm:text-base leading-relaxed m-0">
              {tp('sections.scale.trickBody')}
            </p>
          </div>
          <div className="rounded-2xl border-l-4 border-amber-400 bg-amber-500/10 border border-amber-500/20 p-4 sm:p-6 mt-6">
            <p className="text-white/95 font-medium m-0">
              {tp('sections.scale.limitation')}
            </p>
          </div>
        </section>
      </RevealOnScroll>

      {/* 10 Google Sheets */}
      <RevealOnScroll delay={3}>
        <section id="google-sheets-diferencias" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6">
            {tp('sections.sheetsVsExcel.title')}
          </h2>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            <p>
              {tp('sections.sheetsVsExcel.intro')}
            </p>
            <ul className="space-y-2 list-disc pl-6 text-indigo-100/90">
              <li>
                {tp('sections.sheetsVsExcel.points.collaboration')}
              </li>
              <li>
                {tp('sections.sheetsVsExcel.points.history')}
              </li>
              <li>
                {tp('sections.sheetsVsExcel.points.dropdownProtection')}
              </li>
              <li>
                {tp('sections.sheetsVsExcel.points.performance')}
              </li>
            </ul>
            <p>
              {tp('sections.sheetsVsExcel.conclusion')}
            </p>
          </div>
        </section>
      </RevealOnScroll>

      {/* 11 Evolución a Taimbox */}
      <RevealOnScroll delay={3}>
        <section id="evolucion-taimbox-passiva" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6 flex items-center gap-3">
            <LayoutGrid className="h-8 w-8 text-indigo-400 shrink-0" />
            {tp('sections.evolution.title')}
          </h2>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-6">
            <p>
              {tp('sections.evolution.p1')}
            </p>
            <p>
              {tp('sections.evolution.p2')}
            </p>
            <p className="m-0">
              {tp('sections.evolution.p3')}
            </p>
          </div>
          <div className="rounded-2xl border border-indigo-500/25 bg-indigo-950/40 p-5 sm:p-6 flex gap-4">
            <Zap className="h-8 w-8 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-indigo-100/95 m-0 mb-2">
                {tp('sections.evolution.calloutBody')}
              </p>
              <p className="text-indigo-200/70 text-sm m-0">
                {tp('sections.evolution.calloutNote')}
              </p>
            </div>
          </div>
        </section>
      </RevealOnScroll>

      {/* FAQ */}
      <RevealOnScroll delay={3}>
        <section id="faq-plantilla-recursos" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6 flex items-center gap-3">
            <HelpCircle className="h-8 w-8 text-purple-400 shrink-0" />
            {tp('faq.title')}
          </h2>
          <div className="rounded-2xl border border-white/10 bg-white/5 divide-y divide-white/10">
            <div className="p-5 sm:p-6">
              <h4 className="text-white font-semibold mb-2">
                {tp('faq.items.needMacros.question')}
              </h4>
              <p className="text-sm text-indigo-200/90 m-0">
                {tp('faq.items.needMacros.answer')}
              </p>
            </div>
            <div className="p-5 sm:p-6">
              <h4 className="text-white font-semibold mb-2">
                {tp('faq.items.frequency.question')}
              </h4>
              <p className="text-sm text-indigo-200/90 m-0">
                {tp('faq.items.frequency.answer')}
              </p>
            </div>
            <div className="p-5 sm:p-6">
              <h4 className="text-white font-semibold mb-2">
                {tp('faq.items.whenExcelBreaks.question')}
              </h4>
              <p className="text-sm text-indigo-200/90 m-0">
                {tp('faq.items.whenExcelBreaks.answer')}
              </p>
            </div>
            <div className="p-5 sm:p-6">
              <h4 className="text-white font-semibold mb-2">
                {tp('faq.items.kanban.question')}
              </h4>
              <p className="text-sm text-indigo-200/90 m-0">
                {tp('faq.items.kanban.answer')}
              </p>
            </div>
            <div className="p-5 sm:p-6">
              <h4 className="text-white font-semibold mb-2">
                {tp('faq.items.healthyRange.question')}
              </h4>
              <p className="text-sm text-indigo-200/90 m-0">
                {tp('faq.items.healthyRange.answer')}
              </p>
            </div>
            <div className="p-5 sm:p-6">
              <h4 className="text-white font-semibold mb-2">
                {tp('faq.items.gantt.question')}
              </h4>
              <p className="text-sm text-indigo-200/90 m-0">
                {tp('faq.items.gantt.answerPrefix')}{' '}
                <LocaleLink
                  to="/blog/planificacion-proyectos-cronograma-recursos"
                  className="text-indigo-300 hover:text-white underline underline-offset-2"
                >
                  {tp('faq.items.gantt.answerLink')}
                </LocaleLink>
                {tp('faq.items.gantt.answerSuffix')}
              </p>
            </div>
            <div className="p-5 sm:p-6">
              <h4 className="text-white font-semibold mb-2">
                {tp('faq.items.pacingMonths.question')}
              </h4>
              <p className="text-sm text-indigo-200/90 m-0">
                {tp('faq.items.pacingMonths.answer')}
              </p>
            </div>
            <div className="p-5 sm:p-6">
              <h4 className="text-white font-semibold mb-2">
                {tp('faq.items.updateDropdowns.question')}
              </h4>
              <p className="text-sm text-indigo-200/90 m-0">
                {tp('faq.items.updateDropdowns.answer')}
              </p>
            </div>
          </div>
        </section>
      </RevealOnScroll>

      {/* Resumen + enlaces */}
      <RevealOnScroll delay={3}>
        <section id="resumen-recursos" className="mb-12 sm:mb-16 scroll-mt-24">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-5 sm:mb-6 flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-emerald-400 shrink-0" />
            {tp('summary.title')}
          </h2>
          <div className="space-y-4 text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-6">
            <p>
              {tp('summary.p1')}
            </p>
            <p>
              {tp('summary.p2')}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 sm:p-8 mb-8">
            <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-4">
              {tp('summary.links.prefix')}{' '}
              <LocaleLink
                to="/blog/kpis-agencias-marketing-2026"
                className="text-indigo-300 hover:text-white underline underline-offset-2"
              >
                {tp('summary.links.kpis')}
              </LocaleLink>
              {tp('summary.links.middle1')}{' '}
              <LocaleLink
                to="/blog/ley-parkinson"
                className="text-indigo-300 hover:text-white underline underline-offset-2"
              >
                {tp('summary.links.parkinson')}
              </LocaleLink>{' '}
              {tp('summary.links.middle2')}{' '}
              <LocaleLink
                to="/blog/que-es-timeboxing"
                className="text-indigo-300 hover:text-white underline underline-offset-2"
              >
                {tp('summary.links.timeboxing')}
              </LocaleLink>
              {tp('summary.links.middle3')}{' '}
              <LocaleLink
                to="/blog/planificacion-proyectos-cronograma-recursos"
                className="text-indigo-300 hover:text-white underline underline-offset-2"
              >
                {tp('summary.links.projects')}
              </LocaleLink>
              {tp('summary.links.suffix')}
            </p>
          </div>
        </section>
      </RevealOnScroll>

      {/* CTA */}
      <RevealOnScroll delay={3}>
        <section className="mb-12">
          <div className="flex flex-wrap gap-3 justify-center mb-8">
            <LocaleLink to="/planificador-recursos">
              <Button
                size="sm"
                variant="outline"
                className="border-indigo-400/50 bg-transparent text-white hover:bg-indigo-500/25 hover:text-white"
              >
                {tp('cta.links.planner')} <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </LocaleLink>
            <LocaleLink to="/reportes-rentabilidad">
              <Button
                size="sm"
                variant="outline"
                className="border-emerald-400/50 bg-transparent text-white hover:bg-emerald-500/20 hover:text-white"
              >
                {tp('cta.links.reports')} <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </LocaleLink>
            <LocaleLink to="/guia">
              <Button
                size="sm"
                variant="outline"
                className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                {tp('cta.links.guide')} <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </LocaleLink>
          </div>

          <div id="cta-plantilla-recursos" className="text-center mt-12 mb-8 scroll-mt-24">
            <h2 className="text-2xl sm:text-4xl font-bold text-white mb-4">
              {tp('cta.mainTitle')}
            </h2>
            <p className="text-indigo-100/90 text-lg mb-8 max-w-2xl mx-auto">
              {tp('cta.mainSubtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <LocaleLink to="/planificador-recursos">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-8 py-6 text-base font-bold shadow-xl shadow-indigo-500/30 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-indigo-500/40"
                >
                  {tp('cta.primaryCta')} <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </LocaleLink>
              <a href={PLANTILLA_XLSX_HREF} download>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-indigo-400/60 bg-transparent px-8 py-6 text-base font-semibold text-white shadow-none hover:bg-indigo-500/20 hover:text-white rounded-xl"
                >
                  <Download className="mr-2 h-5 w-5" />
                  {tp('cta.secondaryCta')}
                </Button>
              </a>
            </div>
            <p className="text-indigo-200/70 text-sm mb-8">
              <LocaleLink to="/precios" className="text-indigo-300 hover:text-white underline underline-offset-2">
                {tp('cta.pricingLink')}
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
              {tp('cta.footerNote')}
            </p>
          </div>
        </section>
      </RevealOnScroll>
    </article>
  );
}
