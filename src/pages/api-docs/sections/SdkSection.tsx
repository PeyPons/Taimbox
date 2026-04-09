import { Terminal } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SectionHeading } from '../components/SectionHeading';
import { CodeBlock } from '../components/CodeBlock';

export function SdkSection() {
  const { t } = useTranslation('apiDocs');

  return (
    <section>
      <SectionHeading id="sdk" icon={Terminal} className="mb-6">
        {t('sdk.title')}
      </SectionHeading>
      <p className="text-indigo-100/85 mb-4">
        {t('sdk.intro')}
      </p>
      <CodeBlock lang="bash">{t('sdk.install')}</CodeBlock>
      <div className="mt-4" />
      <CodeBlock lang="typescript">{t('sdk.code')}</CodeBlock>
      <div className="mt-4 p-4 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
        <div className="flex items-start gap-2">
          <Terminal className="h-4 w-4 text-indigo-400 mt-0.5 shrink-0" />
          <p className="text-sm text-indigo-100/90">
            <strong className="text-indigo-300">{t('sdk.noteTitle')}</strong>{' '}
            {t('sdk.noteBody')}
          </p>
        </div>
      </div>
    </section>
  );
}
