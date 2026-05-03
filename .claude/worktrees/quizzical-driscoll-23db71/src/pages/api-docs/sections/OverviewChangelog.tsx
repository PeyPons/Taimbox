import { History } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { i18nAsArray } from '@/lib/i18nReturnObjects';
import { SectionHeading } from '../components/SectionHeading';

const TYPE_STYLES = {
  new: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  improved: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  deprecated: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  fixed: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
} as const;

type ChangelogType = keyof typeof TYPE_STYLES;

type ChangelogEntryJson = {
  date: string;
  type: ChangelogType;
  title: string;
  description: string;
};

export function OverviewChangelog() {
  const { t } = useTranslation('apiDocs');
  const entries = i18nAsArray<ChangelogEntryJson>(t('overview.changelog.entries', { returnObjects: true }));

  return (
    <section>
      <SectionHeading id="changelog" icon={History} className="mb-6">
        {t('overview.changelog.title')}
      </SectionHeading>
      <p className="text-indigo-100/85 mb-6">
        {t('overview.changelog.intro')}
      </p>

      {entries.length === 0 ? (
        <div className="p-6 rounded-lg bg-white/[0.03] border border-white/5 text-center">
          <p className="text-sm text-indigo-200/60">
            {t('overview.changelog.empty')}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry, i) => (
            <div
              key={`${entry.date}-${i}`}
              className="p-4 rounded-lg bg-white/[0.03] border border-white/5"
            >
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <span className="text-xs font-mono text-slate-400">{entry.date}</span>
                <span
                  className={cn(
                    'px-2 py-0.5 rounded-full text-[10px] font-bold border',
                    TYPE_STYLES[entry.type] ?? TYPE_STYLES.improved,
                  )}
                >
                  {t(`overview.changelog.types.${entry.type}`)}
                </span>
                <span className="text-sm font-semibold text-white">{entry.title}</span>
              </div>
              <p className="text-xs text-indigo-200/70 leading-relaxed">{entry.description}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
