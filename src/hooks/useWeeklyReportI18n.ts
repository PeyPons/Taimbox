import { useMemo } from 'react';
import { useAppTranslation } from '@/hooks/useAppTranslation';

export type WeeklyActionId = 'postpone' | 'moveToEmployee' | 'justify' | 'distribute' | 'keep' | 'cancel';
export type WeeklyOutcomeId = 'done' | 'continue' | 'handoff' | 'blocked';

export function useWeeklyReportI18n() {
  const { t } = useAppTranslation();

  return useMemo(() => {
    const weeklyActionMeta: Record<WeeklyActionId, { label: string; hint: string }> = {
      keep: { label: t('weeklyReport.actions.keep.label'), hint: t('weeklyReport.actions.keep.hint') },
      postpone: { label: t('weeklyReport.actions.postpone.label'), hint: t('weeklyReport.actions.postpone.hint') },
      distribute: { label: t('weeklyReport.actions.distribute.label'), hint: t('weeklyReport.actions.distribute.hint') },
      moveToEmployee: { label: t('weeklyReport.actions.moveToEmployee.label'), hint: t('weeklyReport.actions.moveToEmployee.hint') },
      cancel: { label: t('weeklyReport.actions.cancel.label'), hint: t('weeklyReport.actions.cancel.hint') },
      justify: { label: t('weeklyReport.actions.justify.label'), hint: t('weeklyReport.actions.justify.hint') },
    };

    const weeklyOutcomeGroups: Array<{
      id: WeeklyOutcomeId;
      label: string;
      hint: string;
      actions: WeeklyActionId[];
    }> = [
      { id: 'done', label: t('weeklyReport.outcomes.done.label'), hint: t('weeklyReport.outcomes.done.hint'), actions: ['keep'] },
      {
        id: 'continue',
        label: t('weeklyReport.outcomes.continue.label'),
        hint: t('weeklyReport.outcomes.continue.hint'),
        actions: ['postpone', 'distribute'],
      },
      {
        id: 'handoff',
        label: t('weeklyReport.outcomes.handoff.label'),
        hint: t('weeklyReport.outcomes.handoff.hint'),
        actions: ['moveToEmployee'],
      },
      {
        id: 'blocked',
        label: t('weeklyReport.outcomes.blocked.label'),
        hint: t('weeklyReport.outcomes.blocked.hint'),
        actions: ['cancel', 'justify'],
      },
    ];

    return { t, weeklyActionMeta, weeklyOutcomeGroups };
  }, [t]);
}
