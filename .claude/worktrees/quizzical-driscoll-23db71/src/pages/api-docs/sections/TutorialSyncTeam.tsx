import { Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { i18nAsArray } from '@/lib/i18nReturnObjects';
import { SectionHeading } from '../components/SectionHeading';
import { TutorialStep } from '../components/TutorialStep';

type TutorialStepJson = {
  title: string;
  description: string;
  note: string | null;
  code: string | null;
  lang: string | null;
};

export function TutorialSyncTeam() {
  const { t } = useTranslation('apiDocs');
  const steps = i18nAsArray<TutorialStepJson>(t('tutorials.syncTeam.steps', { returnObjects: true }));

  return (
    <section>
      <SectionHeading id="tutorial-sync-team" icon={Users} className="mb-2">
        {t('tutorials.syncTeam.title')}
      </SectionHeading>
      <p className="text-indigo-100/85 mb-6">
        {t('tutorials.syncTeam.subtitle')}
      </p>

      <div className="mb-4 p-4 rounded-lg bg-white/[0.03] border border-white/5">
        <h4 className="text-white font-semibold text-sm mb-2">{t('tutorials.syncTeam.prereqTitle')}</h4>
        <ul className="text-sm text-indigo-200/70 space-y-1 list-disc list-inside">
          <li>
            {t('tutorials.syncTeam.prereq1Before')}{' '}
            <button
              type="button"
              onClick={() => document.getElementById('tutorial-quickstart')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-indigo-300 underline hover:text-white"
            >
              {t('tutorials.syncTeam.prereq1Link')}
            </button>
            {t('tutorials.syncTeam.prereq1After')}
          </li>
          <li>{t('tutorials.syncTeam.prereq2')}</li>
        </ul>
      </div>

      <div className="space-y-0">
        {steps.map((s, i) => (
          <TutorialStep
            key={i}
            step={i + 1}
            title={s.title}
            description={s.description}
            code={s.code ?? undefined}
            lang={(s.lang as 'bash' | 'typescript') ?? 'typescript'}
            note={s.note ?? undefined}
          />
        ))}
      </div>

      <div className="mt-6 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
        <p className="text-sm text-emerald-100/90">
          <strong className="text-emerald-300">{t('tutorials.syncTeam.nextLabel')}</strong>{' '}
          {t('tutorials.syncTeam.nextText')}{' '}
          <button
            type="button"
            onClick={() => document.getElementById('tutorial-planning')?.scrollIntoView({ behavior: 'smooth' })}
            className="text-emerald-300 underline hover:text-white"
          >
            {t('tutorials.syncTeam.nextLink')}
          </button>
          .
        </p>
      </div>
    </section>
  );
}
