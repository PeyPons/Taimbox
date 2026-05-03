import { Filter } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { i18nAsArray } from '@/lib/i18nReturnObjects';
import { SectionHeading } from '../components/SectionHeading';
import { CodeBlock } from '../components/CodeBlock';

type FilterOpRow = { op: string; sdk: string; http: string; desc: string };

export function FilteringSection() {
  const { t } = useTranslation('apiDocs');
  const ops = i18nAsArray<FilterOpRow>(t('filtering.ops', { returnObjects: true }));

  return (
    <section>
      <SectionHeading id="filtering" icon={Filter} className="mb-6">
        {t('filtering.title')}
      </SectionHeading>
      <div className="space-y-6">
        <div>
          <h3 className="text-white font-semibold mb-3">{t('filtering.opsTitle')}</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/15">
                  <th className="text-left py-2 px-3 text-indigo-300 font-semibold text-xs">{t('filtering.thOp')}</th>
                  <th className="text-left py-2 px-3 text-indigo-300 font-semibold text-xs">{t('filtering.thSdk')}</th>
                  <th className="text-left py-2 px-3 text-indigo-300 font-semibold text-xs">{t('filtering.thHttp')}</th>
                  <th className="text-left py-2 px-3 text-indigo-300 font-semibold text-xs">{t('filtering.thDesc')}</th>
                </tr>
              </thead>
              <tbody className="font-mono text-xs">
                {ops.map((row, i) => (
                  <tr key={i} className={cn('border-b border-white/5', i % 2 === 0 ? 'bg-white/[0.02]' : '')}>
                    <td className="py-2 px-3 text-white font-sans font-medium">{row.op}</td>
                    <td className="py-2 px-3 text-purple-300">{row.sdk}</td>
                    <td className="py-2 px-3 text-cyan-300">{row.http}</td>
                    <td className="py-2 px-3 text-indigo-200/70 font-sans">{row.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <h3 className="text-white font-semibold mb-3">{t('filtering.paginationTitle')}</h3>
          <CodeBlock lang="typescript">{t('filtering.paginationCode')}</CodeBlock>
        </div>
        <div>
          <h3 className="text-white font-semibold mb-3">{t('filtering.orderTitle')}</h3>
          <CodeBlock lang="typescript">{t('filtering.orderCode')}</CodeBlock>
        </div>
        <div>
          <h3 className="text-white font-semibold mb-3">{t('filtering.fullTitle')}</h3>
          <p className="text-indigo-100/80 text-sm mb-3">
            {t('filtering.fullIntro')}
          </p>
          <CodeBlock lang="typescript">{t('filtering.fullCode')}</CodeBlock>
        </div>
      </div>
    </section>
  );
}
