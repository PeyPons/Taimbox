import { Globe, AlertTriangle } from 'lucide-react';
import { useTranslation, Trans } from 'react-i18next';
import { SectionHeading } from '../components/SectionHeading';
import { CodeBlock } from '../components/CodeBlock';

export function OverviewBaseUrl() {
  const { t } = useTranslation('apiDocs');

  return (
    <section>
      <SectionHeading id="base-url" icon={Globe} className="mb-6">
        {t('overview.baseUrl.title')}
      </SectionHeading>
      <p className="text-indigo-100/85 mb-4">
        <Trans
          i18nKey="overview.baseUrl.intro"
          ns="apiDocs"
          components={{
            code: (
              <code className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-xs text-indigo-200" />
            ),
            strong: <strong />,
          }}
        />
      </p>
      <CodeBlock lang="bash">{t('overview.baseUrl.codeBlock')}</CodeBlock>
      <div className="mt-4 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-100/90">
            <strong className="text-amber-300">{t('overview.baseUrl.importantTitle')}</strong>{' '}
            {t('overview.baseUrl.importantBody')}
          </p>
        </div>
      </div>

      <div className="mt-4 p-4 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
        <h4 className="text-white font-semibold text-sm mb-2">{t('overview.baseUrl.agencyIdTitle')}</h4>
        <ul className="text-sm text-indigo-100/90 space-y-1 list-disc list-inside">
          <li>
            <Trans
              i18nKey="overview.baseUrl.agencyIdRead"
              ns="apiDocs"
              components={{
                strong: <strong />,
                code: <code className="font-mono text-xs" />,
              }}
            />
          </li>
          <li>
            <Trans
              i18nKey="overview.baseUrl.agencyIdWrite"
              ns="apiDocs"
              components={{
                strong: <strong />,
                code: <code className="font-mono text-xs" />,
              }}
            />
          </li>
        </ul>
      </div>
    </section>
  );
}
