import { CalendarRange, AlertTriangle } from 'lucide-react';
import { useTranslation, Trans } from 'react-i18next';
import { SectionHeading } from '../components/SectionHeading';
import { CodeBlock } from '../components/CodeBlock';

/**
 * Modelo de semanas / meses: split weeks y week_start_date efectivo.
 * Crítico para integraciones CRM/GPT en fronteras de mes.
 */
export function OverviewWeeks() {
  const { t } = useTranslation('apiDocs');

  return (
    <section>
      <SectionHeading id="weeks-months" icon={CalendarRange} className="mb-6">
        {t('overview.weeks.title')}
      </SectionHeading>

      <p className="text-indigo-100/85 mb-4">{t('overview.weeks.intro')}</p>

      <div className="mb-6 p-4 rounded-lg border border-amber-500/40 bg-amber-500/10">
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-300 shrink-0 mt-0.5" aria-hidden />
          <p className="text-sm text-amber-100/90 leading-relaxed">
            <Trans
              i18nKey="overview.weeks.warning"
              ns="apiDocs"
              components={{ strong: <strong className="text-amber-50" />, code: <code className="text-amber-100 bg-white/10 px-1 rounded font-mono text-xs" /> }}
            />
          </p>
        </div>
      </div>

      <h3 className="text-white font-semibold mb-3">{t('overview.weeks.rulesTitle')}</h3>
      <ul className="mb-6 space-y-2 text-sm text-indigo-100/85 list-disc pl-5">
        <li>{t('overview.weeks.rule1')}</li>
        <li>{t('overview.weeks.rule2')}</li>
        <li>{t('overview.weeks.rule3')}</li>
        <li>{t('overview.weeks.rule4')}</li>
      </ul>

      <h3 className="text-white font-semibold mb-3">{t('overview.weeks.exampleTitle')}</h3>
      <p className="text-indigo-100/85 mb-3 text-sm">{t('overview.weeks.exampleIntro')}</p>
      <CodeBlock>{t('overview.weeks.exampleCode')}</CodeBlock>

      <h3 className="text-white font-semibold mb-3 mt-6">{t('overview.weeks.gptTitle')}</h3>
      <p className="text-indigo-100/85 mb-3 text-sm">{t('overview.weeks.gptIntro')}</p>
      <CodeBlock lang="text">{t('overview.weeks.gptPrompt')}</CodeBlock>
      <p className="text-xs text-indigo-200/60 mt-2">{t('overview.weeks.gptHint')}</p>
    </section>
  );
}
