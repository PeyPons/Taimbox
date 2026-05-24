import { Link } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Key, Database, FileJson, Zap, Filter, Terminal, Shield, Map } from 'lucide-react';
import { localizedPathFromEs } from '@/i18n/publicPaths';
import { i18nAsArray } from '@/lib/i18nReturnObjects';
import { SectionHeading } from '../components/SectionHeading';

const USE_CASE_ICONS = [Database, FileJson, Zap, Filter, Terminal, Shield] as const;

type RecommendedPathStep = {
  targetId: string;
  label: string;
  description: string;
};

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function OverviewIntro() {
  const { t, i18n } = useTranslation('apiDocs');
  const cases = i18nAsArray<string>(t('overview.intro.useCases', { returnObjects: true }));
  const pathSteps = i18nAsArray<RecommendedPathStep>(
    t('overview.intro.recommendedPathSteps', { returnObjects: true }),
  );

  return (
    <section>
      <div className="mb-8">
        <SectionHeading id="intro" level="h1" className="mb-3">
          {t('overview.intro.title')}
        </SectionHeading>
        <p className="text-lg text-indigo-200/90 max-w-2xl">
          {t('overview.intro.subtitle')}
        </p>
      </div>

      <Card className="border border-emerald-500/25 bg-emerald-500/[0.06] backdrop-blur-xl mb-6">
        <CardContent className="p-5">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
              <Map className="h-4 w-4 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">{t('overview.intro.recommendedPathTitle')}</h3>
              <p className="text-xs text-emerald-100/75 mt-1">{t('overview.intro.recommendedPathSubtitle')}</p>
            </div>
          </div>
          <ol className="grid sm:grid-cols-3 gap-2">
            {pathSteps.map((step, i) => (
              <li key={step.targetId}>
                <button
                  type="button"
                  onClick={() => scrollToSection(step.targetId)}
                  className="w-full h-full text-left p-3 rounded-lg bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] hover:border-emerald-500/30 transition-colors"
                >
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/25 text-emerald-200 text-[10px] font-bold mb-2">
                    {i + 1}
                  </span>
                  <span className="block text-sm font-medium text-white mb-1">{step.label}</span>
                  <span className="block text-xs text-indigo-200/65 leading-relaxed">{step.description}</span>
                </button>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <Card className="border-2 border-indigo-300/40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl mb-6 shadow-xl shadow-indigo-950/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shrink-0 shadow-lg">
              <Key className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-slate-900 dark:text-white font-bold text-lg mb-2">
                {t('overview.intro.tokenTitle')}
              </h3>
              <p className="text-slate-700 dark:text-white/95 text-sm leading-relaxed mb-3">
                <Trans
                  i18nKey="overview.intro.tokenBody"
                  ns="apiDocs"
                  components={{
                    strong: <strong />,
                    code: (
                      <code className="px-1 py-0.5 rounded bg-slate-200 dark:bg-white/20 font-mono text-xs text-slate-800 dark:text-white" />
                    ),
                  }}
                />
              </p>
              <p className="text-slate-600 dark:text-white/85 text-xs leading-relaxed mb-3">
                {t('overview.intro.tokenRls')}
              </p>
              <Link to={localizedPathFromEs('/api-keys', i18n.language)}>
                <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 border-0 text-white text-sm hover:from-indigo-500 hover:to-purple-500">
                  <Key className="h-4 w-4 mr-2" />
                  {t('overview.intro.tokenCta')}
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-white/10 bg-white/5 backdrop-blur-xl">
        <CardContent className="p-6">
          <h3 className="text-white font-semibold mb-4">{t('overview.intro.useCasesTitle')}</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {cases.map((text, i) => {
              const Icon = USE_CASE_ICONS[i] ?? Database;
              return (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/5"
                >
                  <Icon className="h-4 w-4 text-indigo-300 mt-0.5 shrink-0" />
                  <span className="text-sm text-indigo-100/85">{text}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
