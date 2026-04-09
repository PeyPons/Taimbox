import { Link } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Key, Database, FileJson, Zap, Filter, Terminal, Shield } from 'lucide-react';
import { localizedPathFromEs } from '@/i18n/publicPaths';
import { i18nAsArray } from '@/lib/i18nReturnObjects';
import { SectionHeading } from '../components/SectionHeading';

const USE_CASE_ICONS = [Database, FileJson, Zap, Filter, Terminal, Shield] as const;

export function OverviewIntro() {
  const { t, i18n } = useTranslation('apiDocs');
  const cases = i18nAsArray<string>(t('overview.intro.useCases', { returnObjects: true }));

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
