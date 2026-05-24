import { Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { i18nAsArray } from '@/lib/i18nReturnObjects';
import { SectionHeading } from '../components/SectionHeading';

type RlsRow = {
  scope: string;
  read: string;
  write: string;
  filter: string;
};

type OutOfScopeItem = { name: string; reason: string };

export function OverviewRls() {
  const { t } = useTranslation('apiDocs');
  const rows = i18nAsArray<RlsRow>(t('overview.rls.rows', { returnObjects: true }));
  const outOfScope = i18nAsArray<OutOfScopeItem>(t('overview.rls.outOfScope', { returnObjects: true }));

  return (
    <section>
      <SectionHeading id="rls-limits" icon={Shield} className="mb-6">
        {t('overview.rls.title')}
      </SectionHeading>
      <p className="text-indigo-100/85 mb-4">{t('overview.rls.intro')}</p>
      <p className="text-indigo-100/85 mb-6 text-sm">{t('overview.rls.tokenNote')}</p>

      <div className="overflow-x-auto mb-8">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/15">
              <th className="text-left py-2.5 px-3 text-indigo-300 font-semibold text-xs">
                {t('overview.rls.thScope')}
              </th>
              <th className="text-left py-2.5 px-3 text-indigo-300 font-semibold text-xs">
                {t('overview.rls.thRead')}
              </th>
              <th className="text-left py-2.5 px-3 text-indigo-300 font-semibold text-xs">
                {t('overview.rls.thWrite')}
              </th>
              <th className="text-left py-2.5 px-3 text-indigo-300 font-semibold text-xs">
                {t('overview.rls.thFilter')}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={row.scope}
                className={cn('border-b border-white/5', i % 2 === 0 ? 'bg-white/[0.02]' : '')}
              >
                <td className="py-2 px-3 text-white font-medium text-xs">{row.scope}</td>
                <td className="py-2 px-3 text-indigo-100/80 text-xs">{row.read}</td>
                <td className="py-2 px-3 text-indigo-100/80 text-xs">{row.write}</td>
                <td className="py-2 px-3 text-indigo-100/80 text-xs font-mono">{row.filter}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="text-white font-semibold mb-3">{t('overview.rls.permissionsTitle')}</h3>
      <p className="text-indigo-100/85 mb-4 text-sm">{t('overview.rls.permissionsBody')}</p>

      <h3 className="text-white font-semibold mb-3">{t('overview.rls.outOfScopeTitle')}</h3>
      <p className="text-indigo-100/85 mb-4 text-sm">{t('overview.rls.outOfScopeIntro')}</p>
      <ul className="space-y-2">
        {outOfScope.map((item) => (
          <li
            key={item.name}
            className="p-3 rounded-lg bg-white/[0.03] border border-white/5 text-sm"
          >
            <span className="font-mono text-indigo-200">{item.name}</span>
            <span className="text-indigo-100/75"> — {item.reason}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
