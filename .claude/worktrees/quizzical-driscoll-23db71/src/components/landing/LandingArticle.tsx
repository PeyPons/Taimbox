import { lazy, Suspense, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DemoProvider } from '@/contexts/DemoContext';
import { useTranslation, Trans } from 'react-i18next';
import {
  ArrowRight,
  Brain,
  AlertTriangle,
  Shield,
  Code,
  Zap,
  Radio,
  Megaphone,
  Clock,
  ListTodo,
} from 'lucide-react';

const DemoPlannerLazy = lazy(() =>
  import('@/components/demo/DemoDashboard').then((m) => ({ default: m.DemoPlanner }))
);

function BudgetOverflowChart() {
  const { t } = useTranslation('landing');
  return (
    <div className="my-6 flex flex-col gap-3 max-w-md mx-auto">
      <p className="text-center text-xs font-medium text-indigo-200/80 uppercase tracking-wider">{t('articleWhy.chartTitle')}</p>
      <div className="relative w-full h-11 rounded-xl bg-indigo-900/50 border border-indigo-500/20 overflow-hidden shadow-inner">
        <div className="absolute inset-0 flex">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-l-xl transition-[width] duration-1000 ease-out"
            style={{ width: '55.5%' }}
          />
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-red-500 rounded-r-xl transition-[width] duration-700 ease-out delay-300"
            style={{ width: '44.5%' }}
          />
        </div>
        <div className="absolute left-[55.5%] top-0 bottom-0 w-0.5 bg-white/80 z-10 shadow-sm" title={t('articleWhy.chartMax')} />
      </div>
      <div className="flex justify-between w-full text-[11px] text-indigo-200/60 font-medium text-center">
        <span>0h</span>
        <span>{t('articleWhy.chartMax')}</span>
        <span className="text-red-400">{t('articleWhy.chartOverflow')}</span>
      </div>
    </div>
  );
}

export function LandingArticle() {
  const { t } = useTranslation('landing');
  const [apiTab, setApiTab] = useState<'curl' | 'js'>('js');

  return (
    <article id="por-que-timeboxing" className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 md:py-16 text-left overflow-x-hidden">
      {/* Bloque 1: El gancho */}
      <section className="mb-12 sm:mb-14">
        <div className="mb-6 text-center">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-indigo-300 bg-indigo-500/20 border border-indigo-400/30">
            {t('articleWhy.badge')}
          </span>
        </div>
        <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-[2.75rem] font-black text-white mb-5 sm:mb-6 leading-[1.15] tracking-tight text-center">
          {t('articleWhy.heroTitle')}
        </h1>
        <div className="space-y-4 text-indigo-100/95 text-base sm:text-lg leading-[1.75]">
          <p>{t('articleWhy.heroP1')}</p>
          <p>{t('articleWhy.heroP2')}</p>
          <div className="rounded-2xl border-l-4 border-indigo-400 bg-indigo-500/10 border border-indigo-500/20 p-4 sm:p-6 my-6">
            <p className="text-white/95 font-medium m-0">
              {t('articleWhy.heroHighlight')}
            </p>
          </div>
        </div>
        <BudgetOverflowChart />
      </section>

      {/* Bloque 2: La teoría (Bento grid) */}
      <section className="mb-12 sm:mb-14">
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-4 sm:p-8 mb-6">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
            {t('articleWhy.whatIsTitle')}
          </h2>
          <p className="text-indigo-100/90 mb-4 text-base sm:text-lg leading-relaxed">
            {t('articleWhy.whatIsP1')}
          </p>
          <p className="text-indigo-100/90 font-medium">
            <Trans
              i18nKey="articleWhy.whatIsP2"
              ns="landing"
              components={[<span className="text-white" key="0" />]}
            />
          </p>
        </div>

        <h3 className="text-xl font-bold text-white mb-4">{t('articleWhy.principlesTitle')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-900/70 to-purple-900/50 p-4 sm:p-6 flex flex-col shadow-lg shadow-indigo-950/50 hover:border-indigo-400/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/30 flex items-center justify-center mb-4">
              <Clock className="h-6 w-6 text-indigo-300" />
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-300/90 mb-2">{t('articleWhy.principle1.kicker')}</span>
            <h4 className="text-white font-semibold mb-2 text-lg">{t('articleWhy.principle1.title')}</h4>
            <p className="text-sm text-indigo-200/85 flex-1 leading-relaxed">
              {t('articleWhy.principle1.desc')}
            </p>
          </div>
          <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-900/70 to-pink-900/50 p-4 sm:p-6 flex flex-col shadow-lg shadow-purple-950/50 hover:border-purple-400/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-purple-500/30 flex items-center justify-center mb-4">
              <Brain className="h-6 w-6 text-purple-300" />
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-300/90 mb-2">{t('articleWhy.principle2.kicker')}</span>
            <h4 className="text-white font-semibold mb-2 text-lg">{t('articleWhy.principle2.title')}</h4>
            <p className="text-sm text-indigo-200/85 flex-1 leading-relaxed">
              {t('articleWhy.principle2.desc')}
            </p>
          </div>
          <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-900/70 to-orange-900/50 p-4 sm:p-6 flex flex-col shadow-lg shadow-amber-950/50 hover:border-amber-400/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-amber-500/30 flex items-center justify-center mb-4">
              <ListTodo className="h-6 w-6 text-amber-300" />
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-300/90 mb-2">{t('articleWhy.principle3.kicker')}</span>
            <h4 className="text-white font-semibold mb-2 text-lg">{t('articleWhy.principle3.title')}</h4>
            <p className="text-sm text-indigo-200/85 flex-1 leading-relaxed">
              {t('articleWhy.principle3.desc')}
            </p>
          </div>
        </div>
      </section>

      {/* Bloque 3: El problema en agencias */}
      <section className="mb-12 sm:mb-14">
        <div className="rounded-2xl border border-amber-500/20 bg-amber-950/30 backdrop-blur-sm p-4 sm:p-8 mb-6">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
            {t('articleWhy.agenciesTitle')}
          </h2>
          <p className="text-indigo-100/90 mb-4 text-base leading-relaxed">
            {t('articleWhy.agenciesP1')}
          </p>
          <p className="text-indigo-100/90 mb-4">
            <Trans
              i18nKey="articleWhy.agenciesP2"
              ns="landing"
              components={[<strong className="text-white" key="0" />]}
            />
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-900/50 to-orange-900/30 p-4 sm:p-6 flex flex-col">
            <div className="w-10 h-10 rounded-lg bg-amber-500/30 flex items-center justify-center mb-3 sm:mb-4">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
            </div>
            <h4 className="text-white font-semibold mb-2 text-base sm:text-inherit">{t('articleWhy.threat1Title')}</h4>
            <p className="text-sm text-indigo-200/85 leading-relaxed">
              {t('articleWhy.threat1Desc')}
            </p>
          </div>
          <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-900/50 to-orange-900/30 p-4 sm:p-6 flex flex-col">
            <div className="w-10 h-10 rounded-lg bg-amber-500/30 flex items-center justify-center mb-3 sm:mb-4">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
            </div>
            <h4 className="text-white font-semibold mb-2 text-base sm:text-inherit">{t('articleWhy.threat2Title')}</h4>
            <p className="text-sm text-indigo-200/85 leading-relaxed">
              {t('articleWhy.threat2Desc')}
            </p>
          </div>
          <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-900/50 to-orange-900/30 p-4 sm:p-6 flex flex-col">
            <div className="w-10 h-10 rounded-lg bg-amber-500/30 flex items-center justify-center mb-3 sm:mb-4">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
            </div>
            <h4 className="text-white font-semibold mb-2 text-base sm:text-inherit">{t('articleWhy.threat3Title')}</h4>
            <p className="text-sm text-indigo-200/85 leading-relaxed">
              {t('articleWhy.threat3Desc')}
            </p>
          </div>
        </div>
        <div className="mt-6 rounded-2xl border-l-4 border-indigo-400 bg-indigo-500/10 border border-indigo-500/20 p-4 sm:p-6">
          <p className="text-indigo-100/95 font-medium m-0">
            <Trans
              i18nKey="articleWhy.agenciesHighlight"
              ns="landing"
              components={[<span className="text-white" key="0" />]}
            />
          </p>
        </div>
      </section>

      {/* Bloque 4: La solución tecnológica */}
      <section className="mb-12 sm:mb-14">
        <div className="rounded-2xl border border-indigo-500/20 bg-indigo-950/40 backdrop-blur-sm p-4 sm:p-8 mb-6">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
            {t('articleWhy.solutionTitle')}
          </h2>
          <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed">
            {t('articleWhy.solutionP1')}
          </p>
        </div>
        <p className="text-indigo-100/90 mb-6 font-medium">{t('articleWhy.solutionP2')}</p>

        <div className="space-y-8">
          <div className="rounded-2xl border border-indigo-500/25 bg-white/5 p-4 sm:p-8">
            <div className="flex items-center gap-3 mb-3 sm:mb-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/30 text-indigo-300 font-bold text-sm">1</span>
              <h3 className="text-lg sm:text-xl font-bold text-white m-0 min-w-0">
                {t('articleWhy.feature1Title')}
              </h3>
            </div>
            <p className="text-indigo-100/90 mb-4">
              {t('articleWhy.feature1P')}
            </p>
            <ul className="space-y-4 mb-6 text-indigo-100/90">
              <li className="flex flex-col gap-1 sm:flex-row sm:gap-3">
                <span className="text-indigo-400 font-medium shrink-0 sm:min-w-[11rem]">{t('articleWhy.feature1L1Title')}</span>
                <span className="min-w-0">{t('articleWhy.feature1L1Desc')}</span>
              </li>
              <li className="flex flex-col gap-1 sm:flex-row sm:gap-3">
                <span className="text-indigo-400 font-medium shrink-0 sm:min-w-[11rem]">{t('articleWhy.feature1L2Title')}</span>
                <span className="min-w-0">{t('articleWhy.feature1L2Desc')}</span>
              </li>
            </ul>
            <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/60 p-3 sm:p-4 min-h-[280px] sm:min-h-[320px] min-w-0 max-w-full overflow-x-auto">
              <p className="text-xs text-indigo-200/80 mb-3 font-medium">{t('articleWhy.feature1Demo')}</p>
              <Suspense fallback={<div className="flex items-center justify-center h-64 text-indigo-200/70">{t('articleWhy.feature1Loading')}</div>}>
                <DemoProvider>
                  <div className="min-w-0 max-w-full">
                    <DemoPlannerLazy />
                  </div>
                </DemoProvider>
              </Suspense>
            </div>
          </div>

          <div className="rounded-2xl border border-indigo-500/25 bg-white/5 p-4 sm:p-8">
            <div className="flex items-center gap-3 mb-3 sm:mb-4">
              <Radio className="h-6 w-6 shrink-0 text-indigo-400" />
              <h3 className="text-lg sm:text-xl font-bold text-white m-0 min-w-0">
                {t('articleWhy.feature2Title')}
              </h3>
            </div>
            <p className="text-indigo-100/90 mb-4">
              {t('articleWhy.feature2P')}
            </p>
            <ul className="flex flex-wrap gap-2 sm:gap-3 text-indigo-100/90 justify-center">
              <li className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <strong className="text-emerald-300">{t('articleWhy.feature2Idle')}</strong>
              </li>
              <li className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/30">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <strong className="text-amber-300">{t('articleWhy.feature2Busy')}</strong>
              </li>
              <li className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/30">
                <span className="w-2 h-2 rounded-full bg-red-400" />
                <strong className="text-red-300">{t('articleWhy.feature2Blocked')}</strong>
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-indigo-500/25 bg-white/5 p-4 sm:p-8">
            <div className="flex items-center gap-3 mb-3 sm:mb-4">
              <Megaphone className="h-6 w-6 shrink-0 text-indigo-400" />
              <h3 className="text-lg sm:text-xl font-bold text-white m-0 min-w-0">
                {t('articleWhy.feature3Title')}
              </h3>
            </div>
            <p className="text-indigo-100/90 m-0">
              {t('articleWhy.feature3P')}
            </p>
          </div>
        </div>
      </section>

      {/* Bloque 5: Arquitectura y seguridad */}
      <section className="mb-12 sm:mb-14">
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-4 sm:p-8 mb-6">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
            {t('articleWhy.scaleTitle')}
          </h2>
          <p className="text-indigo-100/90 leading-relaxed">
            {t('articleWhy.scaleP')}
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <div className="rounded-xl border border-indigo-500/25 bg-indigo-950/40 p-4 sm:p-5 flex flex-col gap-2 sm:flex-row sm:gap-4">
            <Code className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-white font-semibold mb-1">{t('articleWhy.apiTitle')}</p>
              <p className="text-indigo-100/90 text-sm m-0">
                <Trans
                  i18nKey="articleWhy.apiDesc"
                  ns="landing"
                  components={[
                    <Link to="/api-docs" className="text-indigo-300 hover:text-white underline underline-offset-2 font-medium" key="1" />
                  ]}
                />
              </p>
            </div>
          </div>
          <div className="rounded-xl border border-emerald-500/25 bg-emerald-950/30 p-4 sm:p-5 flex flex-col gap-2 sm:flex-row sm:gap-4">
            <Shield className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-white font-semibold mb-1">{t('articleWhy.securityTitle')}</p>
              <p className="text-indigo-100/90 text-sm m-0">
                {t('articleWhy.securityDesc')}
              </p>
            </div>
          </div>
          <div className="rounded-xl border border-amber-500/25 bg-amber-950/30 p-4 sm:p-5 flex flex-col gap-2 sm:flex-row sm:gap-4">
            <Zap className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-white font-semibold mb-1">{t('articleWhy.tokensTitle')}</p>
              <p className="text-indigo-100/90 text-sm m-0">
                {t('articleWhy.tokensDesc')}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-indigo-500/30 bg-slate-950/90 overflow-hidden shadow-xl overflow-x-auto">
          <Tabs value={apiTab} onValueChange={(v) => setApiTab(v as 'curl' | 'js')}>
            <TabsList className="w-full justify-start rounded-none border-b border-white/10 bg-slate-900/90 p-0 h-auto min-w-0">
              <TabsTrigger value="js" className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-400 data-[state=active]:bg-transparent data-[state=active]:text-white px-5 py-3 text-sm font-medium">
                JS SDK
              </TabsTrigger>
              <TabsTrigger value="curl" className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-400 data-[state=active]:bg-transparent data-[state=active]:text-white px-5 py-3 text-sm font-medium">
                cURL
              </TabsTrigger>
            </TabsList>
            <TabsContent value="js" className="m-0 p-3 sm:p-5">
              <p className="text-xs text-slate-400 mb-2 font-medium">{t('articleWhy.apiPreview1')}</p>
              <pre className="p-3 sm:p-4 rounded-lg bg-slate-900 text-xs sm:text-sm text-slate-200 overflow-x-auto font-mono leading-relaxed border border-white/5 min-w-0">
                <code>{`const { data: projects } = await timeboxing
  .from('projects')
  .select('id, name, budget_hours, monthly_fee')
  .eq('status', 'active')

const report = projects?.map(p => {
  const hours = byProject[p.id] || { planned: 0, actual: 0, computed: 0 }
  const progress = p.budget_hours > 0
    ? Math.round((hours.computed / p.budget_hours) * 100)
    : 0
  const hourValue = p.budget_hours > 0
    ? (p.monthly_fee / p.budget_hours).toFixed(2)
    : '0'
  return {
    project: p.name,
    budgetHours: p.budget_hours,
    hoursPlanned: hours.planned,
    hoursActual: hours.actual,
    progress: \`\${progress}%\`,
    hourValue: \`\${hourValue} EUR/h\`
  }
})`}</code>
              </pre>
            </TabsContent>
            <TabsContent value="curl" className="m-0 p-3 sm:p-5">
              <p className="text-xs text-slate-400 mb-2 font-medium">
                <Trans
                  i18nKey="articleWhy.apiPreview2"
                  ns="landing"
                  components={[
                    <Link to="/api-docs" className="text-indigo-300 hover:text-white underline" key="1" />
                  ]}
                />
              </p>
              <pre className="p-3 sm:p-4 rounded-lg bg-slate-900 text-xs sm:text-sm text-slate-200 overflow-x-auto font-mono leading-relaxed border border-white/5 min-w-0">
                <code>{`curl -X GET "https://api.taimbox.com/rest/v1/allocations?week_start_date=gte.2026-02-01&week_start_date=lte.2026-02-28&select=project_id,hours_assigned,hours_actual,hours_computed" \\
  -H "apikey: <ANON_KEY>" \\
  -H "Authorization: Bearer <TU_API_TOKEN>" \\
  -H "Content-Type: application/json"`}</code>
              </pre>
              <p className="text-[11px] text-slate-500 mt-2">
                <Trans
                  i18nKey="articleWhy.apiPreviewLegend"
                  ns="landing"
                  components={[
                    <strong className="text-slate-400" key="0" />,
                    <span key="1" />,
                    <strong className="text-slate-400" key="2" />
                  ]}
                />
              </p>
            </TabsContent>
          </Tabs>
          <div className="px-3 sm:px-5 pb-4">
            <Link to="/api-docs" className="text-sm text-indigo-300 hover:text-white underline underline-offset-2 font-medium">
              {t('articleWhy.apiFullTutorialLink')}
            </Link>
          </div>
        </div>
      </section>

      {/* Bloque 6: Conclusión y CTA */}
      <section className="mb-0">
        <div className="rounded-3xl border-2 border-indigo-500/30 bg-gradient-to-br from-indigo-600/20 via-purple-600/20 to-indigo-600/20 p-4 sm:p-10">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4 text-center">
            {t('articleWhy.finalTitle')}
          </h2>
          <p className="text-indigo-100/95 mb-4 text-base sm:text-lg leading-relaxed text-center">
            {t('articleWhy.finalP')}
          </p>
          <ol className="list-decimal list-inside text-indigo-100/95 space-y-2 mb-6 pl-1 text-left max-w-lg mx-auto">
            <li>{t('articleWhy.finalL1')}</li>
            <li>{t('articleWhy.finalL2')}</li>
          </ol>
          <p className="text-indigo-100/90 mb-8 text-base text-center">
            {t('articleWhy.finalOutro')}
          </p>
          <div className="text-center">
            <Link to="/login">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-12 py-7 text-lg font-bold shadow-2xl shadow-indigo-500/30 rounded-xl"
              >
                {t('articleWhy.finalCta')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <p className="mt-3 text-sm text-indigo-200/80">
              {t('articleWhy.finalNotice')}
            </p>
          </div>
        </div>
      </section>
    </article>
  );
}
