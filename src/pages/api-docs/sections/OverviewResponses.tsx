import { useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useTranslation, Trans } from 'react-i18next';
import { cn } from '@/lib/utils';
import { SectionHeading } from '../components/SectionHeading';
import { CodeBlock } from '../components/CodeBlock';
import { i18nAsArray } from '@/lib/i18nReturnObjects';
import { getErrorCodes } from '../data/tableGroups';

type FormatCard = { title: string; status: string; desc: string };

export function OverviewResponses() {
  const { t, i18n } = useTranslation('apiDocs');
  const errorCodes = useMemo(() => getErrorCodes(i18n.language), [i18n.language]);
  const formatCards = i18nAsArray<FormatCard>(t('overview.responses.formatCards', { returnObjects: true }));

  return (
    <section>
      <SectionHeading id="responses" icon={AlertTriangle} className="mb-6">
        {t('overview.responses.title')}
      </SectionHeading>
      <p className="text-indigo-100/85 mb-4">
        <Trans
          i18nKey="overview.responses.intro"
          ns="apiDocs"
          components={{
            code: (
              <code className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-xs text-indigo-200" />
            ),
          }}
        />
      </p>
      <div className="mb-6 p-4 rounded-lg bg-slate-500/10 border border-slate-500/20">
        <p className="text-sm text-slate-100/90">
          <strong className="text-slate-300">{t('overview.responses.empty200Title')}</strong>{' '}
          <Trans
            i18nKey="overview.responses.empty200Body"
            ns="apiDocs"
            components={{
              code: <code className="font-mono text-xs" />,
            }}
          />
        </p>
      </div>

      <h3 className="text-white font-semibold mb-3">{t('overview.responses.formatTitle')}</h3>
      <div className="grid sm:grid-cols-3 gap-3 mb-8">
        {formatCards.map(({ title, status, desc }) => (
          <div
            key={title}
            className="p-4 rounded-lg bg-white/[0.03] border border-white/5"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {status}
              </span>
              <span className="text-sm font-semibold text-white">{title}</span>
            </div>
            <p className="text-xs text-indigo-200/70 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

      <h3 className="text-white font-semibold mb-3">{t('overview.responses.codesTitle')}</h3>
      <div className="overflow-x-auto mb-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/15">
              <th className="text-left py-2.5 px-3 text-indigo-300 font-semibold text-xs w-20">
                {t('overview.responses.thCode')}
              </th>
              <th className="text-left py-2.5 px-3 text-indigo-300 font-semibold text-xs w-32">
                {t('overview.responses.thStatus')}
              </th>
              <th className="text-left py-2.5 px-3 text-indigo-300 font-semibold text-xs">
                {t('overview.responses.thDesc')}
              </th>
            </tr>
          </thead>
          <tbody>
            {errorCodes.map((ec, i) => (
              <tr
                key={ec.code}
                className={cn(
                  'border-b border-white/5',
                  i % 2 === 0 ? 'bg-white/[0.02]' : '',
                )}
              >
                <td className="py-2 px-3 font-mono text-white font-bold">{ec.code}</td>
                <td className="py-2 px-3 text-xs">
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded-full font-medium',
                      ec.code < 300
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : ec.code < 500
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-rose-500/20 text-rose-300',
                    )}
                  >
                    {ec.meaning}
                  </span>
                </td>
                <td className="py-2 px-3 text-indigo-100/80 text-xs">{ec.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="text-white font-semibold mb-3">{t('overview.responses.errorFormatTitle')}</h3>
      <CodeBlock lang="json">{t('overview.responses.errorFormatJson')}</CodeBlock>

      <div className="mt-6" />
      <h3 className="text-white font-semibold mb-3">{t('overview.responses.sdkPatternTitle')}</h3>
      <CodeBlock lang="typescript">{t('overview.responses.sdkPatternCode')}</CodeBlock>
    </section>
  );
}
