import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDeadlineHoursForDisplay, roundDeadlineHours } from '@/utils/deadlineUtils';
import { EmployeePickerList } from '@/components/deadlines/suggestions/EmployeePickerList';
import { SuggestionStepBar } from '@/components/deadlines/suggestions/SuggestionStepBar';
import { ProjectTransfersList } from '@/components/deadlines/suggestions/ProjectTransfersList';
import { SuggestionRulesStep } from '@/components/deadlines/suggestions/SuggestionRulesStep';
import { SuggestionWizardStepShell } from '@/components/deadlines/suggestions/SuggestionWizardStepShell';
import {
  buildReceiverOptions,
  employeeLoadPct,
  getGroupForEmployee,
  sortProjectsBySuggestedHours,
} from '@/components/deadlines/suggestions/suggestionFlowUtils';
import { filterGroupByAllowedDonors, summarizeGroupTransfers } from '@/utils/suggestionRulesUtils';
import type { Deadline } from '@/types';
import type { FlowProjectScope } from '@/utils/suggestionRulesUtils';
import type {
  CapacityResult,
  EmployeeRecommendation,
  SuggestionDonor,
} from '@/components/deadlines/suggestions/types';

export function SuggestionGiveFlow({
  step,
  setStep,
  focusEmployeeId,
  setFocusEmployeeId,
  suggestionsByEmployeeAndProject,
  suggestionDonors,
  deadlines,
  hiddenProjects,
  excludedDonorIds,
  setExcludedDonorIds,
  flowProjectScope,
  setFlowProjectScope,
  onlySharedProjects,
  setOnlySharedProjects,
  includedProjectIds,
  setIncludedProjectIds,
  filteredProjects,
  getMonthlyCapacity,
  getEmployeeAssignedHours,
  maxReceiverLoadPct,
  maxReceiverLoadPctInput,
  setMaxReceiverLoadPct,
  setMaxReceiverLoadPctInput,
  minSenderLoadPct,
  minSenderLoadPctInput,
  setMinSenderLoadPct,
  setMinSenderLoadPctInput,
  onInitializeRules,
  onOpenProject,
}: {
  step: number;
  setStep: (n: number | ((prev: number) => number)) => void;
  focusEmployeeId: string | null;
  setFocusEmployeeId: (id: string | null) => void;
  suggestionsByEmployeeAndProject: EmployeeRecommendation[];
  suggestionDonors: SuggestionDonor[];
  deadlines: Deadline[];
  hiddenProjects: Set<string>;
  flowProjectScope: FlowProjectScope;
  setFlowProjectScope: (scope: FlowProjectScope) => void;
  excludedDonorIds: string[];
  setExcludedDonorIds: (v: string[] | ((prev: string[]) => string[])) => void;
  onlySharedProjects: boolean;
  setOnlySharedProjects: (v: boolean) => void;
  includedProjectIds: Set<string>;
  setIncludedProjectIds: (v: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  filteredProjects: { id: string; name: string }[];
  getMonthlyCapacity: (id: string) => CapacityResult;
  getEmployeeAssignedHours: (id: string) => number;
  maxReceiverLoadPct: number;
  maxReceiverLoadPctInput: string;
  setMaxReceiverLoadPct: (n: number) => void;
  setMaxReceiverLoadPctInput: (s: string) => void;
  minSenderLoadPct: number;
  minSenderLoadPctInput: string;
  setMinSenderLoadPct: (n: number) => void;
  setMinSenderLoadPctInput: (s: string) => void;
  onInitializeRules: (receiverId: string) => void;
  onOpenProject?: (projectId: string) => void;
}) {
  const { t } = useTranslation('app');
  const stepLabels = [
    t('deadlines.suggestions.stepWho', '¿A quién?'),
    t('deadlines.suggestions.stepRules', 'Reglas'),
    t('deadlines.suggestions.stepProjects', 'Proyectos'),
    t('deadlines.suggestions.stepReview', 'Revisar'),
  ] as const;

  const receiverOptions = buildReceiverOptions(
    suggestionsByEmployeeAndProject,
    getMonthlyCapacity,
    getEmployeeAssignedHours
  );
  const rawGroup = focusEmployeeId ? getGroupForEmployee(suggestionsByEmployeeAndProject, focusEmployeeId) : undefined;
  const focusMeta = useMemo(() => {
    if (rawGroup) {
      return {
        employeeId: rawGroup.employeeId,
        employeeName: rawGroup.employeeName,
        employeeAvatar: rawGroup.employeeAvatar,
      };
    }
    const opt = receiverOptions.find((o) => o.id === focusEmployeeId);
    if (opt) {
      return { employeeId: opt.id, employeeName: opt.name, employeeAvatar: opt.avatarUrl };
    }
    return null;
  }, [rawGroup, receiverOptions, focusEmployeeId]);

  const allowedDonorIds = useMemo(() => {
    return new Set(
      suggestionDonors.filter((d) => !excludedDonorIds.includes(d.id)).map((d) => d.id)
    );
  }, [suggestionDonors, excludedDonorIds]);

  const group = useMemo(
    () => (rawGroup ? filterGroupByAllowedDonors(rawGroup, allowedDonorIds) : undefined),
    [rawGroup, allowedDonorIds]
  );

  const sortedProjects = group ? sortProjectsBySuggestedHours(group.projects) : [];
  const preview = summarizeGroupTransfers(group);

  if (step === 1) {
    const selectedName = receiverOptions.find((o) => o.id === focusEmployeeId)?.name;
    return (
      <SuggestionWizardStepShell
        header={<SuggestionStepBar step={1} labels={stepLabels} />}
        footer={
          <div className="flex items-center justify-end gap-3">
            {selectedName ? (
              <p className="text-xs text-slate-600 truncate flex-1 min-w-0 mr-auto">
                {t('deadlines.suggestions.selected', 'Seleccionado: {{name}}', { name: selectedName })}
              </p>
            ) : (
              <p className="text-xs text-slate-500 flex-1 min-w-0 mr-auto">{t('deadlines.suggestions.chooseFromList', 'Elige una persona de la lista')}</p>
            )}
            <Button
              className="shrink-0"
              disabled={!focusEmployeeId}
              onClick={() => {
                if (focusEmployeeId) onInitializeRules(focusEmployeeId);
                setStep(2);
              }}
            >
              {t('deadlines.suggestions.nextRules', 'Siguiente: reglas')}
            </Button>
          </div>
        }
      >
        <EmployeePickerList
          fillHeight
          title={t('deadlines.suggestions.giveWhoTitle', '¿A quién quieres dar horas?')}
          hint={t('deadlines.suggestions.giveWhoHint', 'Personas con margen bajo el {{pct}}% de carga.', { pct: maxReceiverLoadPct })}
          options={receiverOptions}
          selectedId={focusEmployeeId}
          onSelect={(id) => setFocusEmployeeId(id)}
          emptyMessage={t('deadlines.suggestions.giveWhoEmpty', 'Nadie tiene margen para recibir con los filtros actuales. Prueba subir el % del receptor o restaurar filtros.')}
        />
      </SuggestionWizardStepShell>
    );
  }

  if (step === 2 && focusEmployeeId && focusMeta) {
    return (
      <SuggestionWizardStepShell
        header={<SuggestionStepBar step={2} labels={stepLabels} />}
        footer={
          <div className="flex justify-between gap-2">
            <Button variant="outline" onClick={() => setStep(1)}>
              {t('deadlines.suggestions.back', 'Atrás')}
            </Button>
            <Button
              onClick={() => setStep(3)}
              disabled={
                preview.projectCount === 0 ||
                preview.donorCount === 0 ||
                (flowProjectScope === 'manual' && includedProjectIds.size === 0)
              }
            >
              {t('deadlines.suggestions.nextProjects', 'Siguiente: proyectos')}
            </Button>
          </div>
        }
      >
        {!rawGroup && (
          <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50/90 px-3 py-2 text-xs text-amber-900 flex gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              Con estos porcentajes nadie encaja como receptor en las sugerencias, pero puedes ajustar los
              valores y seguir. Sube el «Máx. receptor» o baja el «Mín. quien cede» si la vista previa sale a 0.
            </span>
          </div>
        )}
        <SuggestionRulesStep
          mode="give"
          focusEmployeeId={focusEmployeeId}
          focusEmployeeName={focusMeta.employeeName}
          focusEmployeeAvatar={focusMeta.employeeAvatar}
          suggestionDonors={suggestionDonors}
          receiverCandidates={[]}
          deadlines={deadlines}
          hiddenProjects={hiddenProjects}
          excludedDonorIds={excludedDonorIds}
          setExcludedDonorIds={setExcludedDonorIds}
          excludedReceiverIds={[]}
          setExcludedReceiverIds={() => {}}
          flowProjectScope={flowProjectScope}
          setFlowProjectScope={setFlowProjectScope}
          onlySharedProjects={onlySharedProjects}
          setOnlySharedProjects={setOnlySharedProjects}
          includedProjectIds={includedProjectIds}
          setIncludedProjectIds={setIncludedProjectIds}
          filteredProjects={filteredProjects}
          previewProjectCount={preview.projectCount}
          previewTotalHours={preview.totalHours}
          previewPeopleCount={preview.donorCount}
          minSenderLoadPct={minSenderLoadPct}
          minSenderLoadPctInput={minSenderLoadPctInput}
          setMinSenderLoadPct={setMinSenderLoadPct}
          setMinSenderLoadPctInput={setMinSenderLoadPctInput}
          maxReceiverLoadPct={maxReceiverLoadPct}
          maxReceiverLoadPctInput={maxReceiverLoadPctInput}
          setMaxReceiverLoadPct={setMaxReceiverLoadPct}
          setMaxReceiverLoadPctInput={setMaxReceiverLoadPctInput}
        />
      </SuggestionWizardStepShell>
    );
  }

  if (step === 3 && group) {
    const pct = employeeLoadPct(group.employeeId, getMonthlyCapacity, getEmployeeAssignedHours);
    return (
      <SuggestionWizardStepShell
        header={<SuggestionStepBar step={3} labels={stepLabels} />}
        footer={
          <div className="flex justify-between gap-2">
            <Button variant="outline" onClick={() => setStep(2)}>
              {t('deadlines.suggestions.back', 'Atrás')}
            </Button>
            <Button onClick={() => setStep(4)} disabled={sortedProjects.length === 0}>
              {t('deadlines.suggestions.nextReview', 'Siguiente: revisar')}
            </Button>
          </div>
        }
      >
        <div className="flex items-center gap-3 mb-4 p-3 rounded-xl border bg-slate-50">
          <Avatar className="h-11 w-11 border-2 border-white shadow">
            <AvatarImage src={group.employeeAvatar} alt={group.employeeName} />
            <AvatarFallback className="bg-primary/10 text-primary">{group.employeeName[0]}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-slate-900">{group.employeeName}</p>
            <p className="text-xs text-slate-500">
              Carga actual {pct}% · margen ~{formatDeadlineHoursForDisplay(group.deficitHours)}h
            </p>
          </div>
        </div>
        <ProjectTransfersList projects={sortedProjects} onOpenProject={onOpenProject} />
      </SuggestionWizardStepShell>
    );
  }

  if (step === 4 && group) {
    return (
      <SuggestionWizardStepShell
        header={<SuggestionStepBar step={4} labels={stepLabels} />}
        footer={
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setStep(3)}>
              {t('deadlines.suggestions.back', 'Atrás')}
            </Button>
          </div>
        }
      >
        <GiveFlowSummary
          group={group}
          getMonthlyCapacity={getMonthlyCapacity}
          getEmployeeAssignedHours={getEmployeeAssignedHours}
        />
        {sortedProjects.length > 0 && (
          <div className="space-y-2 mt-4">
            <p className="text-xs font-medium text-slate-500">{t('deadlines.suggestions.byProject', 'Por proyecto')}</p>
            <ProjectTransfersList projects={sortedProjects} onOpenProject={onOpenProject} reviewMode />
            {sortedProjects.length > 8 && (
              <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => setStep(3)}>
                Ver los {sortedProjects.length} proyectos en el paso anterior
              </Button>
            )}
          </div>
        )}
      </SuggestionWizardStepShell>
    );
  }

  return null;
}

function GiveFlowSummary({
  group,
  getMonthlyCapacity,
  getEmployeeAssignedHours,
}: {
  group: EmployeeRecommendation;
  getMonthlyCapacity: (id: string) => CapacityResult;
  getEmployeeAssignedHours: (id: string) => number;
}) {
  const { t } = useTranslation('app');
  let total = 0;
  const byFrom = new Map<string, { name: string; hours: number }>();
  group.projects.forEach((p) =>
    p.transfers.forEach((t) => {
      if (t.suggestedHours <= 0) return;
      const h = roundDeadlineHours(t.suggestedHours);
      total = roundDeadlineHours(total + h);
      const cur = byFrom.get(t.fromId)?.hours ?? 0;
      byFrom.set(t.fromId, { name: t.fromName, hours: roundDeadlineHours(cur + h) });
    })
  );
  const cap = getMonthlyCapacity(group.employeeId).available;
  const assigned = getEmployeeAssignedHours(group.employeeId);
  const newPct = cap > 0 ? Math.round(((assigned + total) / cap) * 100) : 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-3 text-sm">
      <p className="font-semibold text-slate-800">{t('deadlines.suggestions.summaryFor', 'Resumen para {{name}}', { name: group.employeeName })}</p>
      <p className="text-slate-600">
        {t('deadlines.suggestions.wouldReceiveUpTo', 'Recibiría hasta {{hours}}h de {{count}} origen(es).', {
          hours: formatDeadlineHoursForDisplay(total),
          count: byFrom.size,
        })}{' '}
        (carga ~{newPct}%)
      </p>
      <ul className="space-y-1 text-xs text-slate-600 max-h-32 overflow-y-auto">
        {Array.from(byFrom.entries()).map(([id, { name, hours }]) => (
          <li key={id}>
            −{formatDeadlineHoursForDisplay(hours)}h desde {name}
          </li>
        ))}
      </ul>
    </div>
  );
}
