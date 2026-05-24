import { MessageSquare } from 'lucide-react';
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

export function TutorialFeedback() {
  const { t } = useTranslation('apiDocs');
  const steps = i18nAsArray<TutorialStepJson>(t('tutorials.feedback.steps', { returnObjects: true }));

  return (
    <section>
      <SectionHeading id="tutorial-feedback" icon={MessageSquare} className="mb-2">
        {t('tutorials.feedback.title')}
      </SectionHeading>
      <p className="text-indigo-100/85 mb-6">
        {t('tutorials.feedback.subtitle')}
      </p>

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
          <strong className="text-emerald-300">{t('tutorials.feedback.nextLabel')}</strong>{' '}
          {t('tutorials.feedback.nextText')}{' '}
          <button
            type="button"
            onClick={() => document.getElementById('tutorial-goals')?.scrollIntoView({ behavior: 'smooth' })}
            className="text-emerald-300 underline hover:text-white"
          >
            {t('tutorials.feedback.nextLink')}
          </button>
          {t('tutorials.feedback.nextSuffix')}
        </p>
      </div>
    </section>
  );
}
