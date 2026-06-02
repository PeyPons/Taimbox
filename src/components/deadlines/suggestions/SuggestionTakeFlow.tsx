import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDeadlineHoursForDisplay, roundDeadlineHours } from '@/utils/deadlineUtils';
import { EmployeePickerList } from '@/components/deadlines/suggestions/EmployeePickerList';
import { SuggestionStepBar } from '@/components/deadlines/suggestions/SuggestionStepBar';
import { DonorDestinationsList } from '@/components/deadlines/suggestions/DonorDestinationsList';
import { SuggestionRulesStep } from '@/components/deadlines/suggestions/SuggestionRulesStep';
import { SuggestionWizardStepShell } from '@/components/deadlines/suggestions/SuggestionWizardStepShell';
import {
  buildDonorOptions,
  employeeLoadPct,
  getDonorTransferRows,
} from '@/components/deadlines/suggestions/suggestionFlowUtils';
import { filterDonorRows, summarizeDonorRows } from '@/utils/suggestionRulesUtils';
import type { Deadline } from '@/types';
import type { FlowProjectScope } from '@/utils/suggestionRulesUtils';
import type {
  CapacityResult,
  EmployeeRecommendation,
  SuggestionDonor,
} from '@/components/deadlines/suggestions/types';

const STEP_LABELS = ['¿De quién?', 'Reglas', 'Destinos', 'Revisar'];

export function SuggestionTakeFlow({
  step,
  setStep,
  focusEmployeeId,
  setFocusEmployeeId,
  suggestionDonors,
  suggestionsByEmployeeAndProject,
  deadlines,
  hiddenProjects,
  flowProjectScope,
  setFlowProjectScope,
  excludedReceiverIds,
  setExcludedReceiverIds,
  onlySharedProjects,
  setOnlySharedProjects,
  includedProjectIds,
  setIncludedProjectIds,
  filteredProjects,
  getMonthlyCapacity,
  getEmployeeAssignedHours,
  minSenderLoadPct,
  minSenderLoadPctInput,
  setMinSenderLoadPct,
  setMinSenderLoadPctInput,
  maxReceiverLoadPct,
  maxReceiverLoadPctInput,
  setMaxReceiverLoadPct,
  setMaxReceiverLoadPctInput,
  onInitializeRules,
  onOpenProject,
}: {
  step: number;
  setStep: (n: number | ((prev: number) => number)) => void;
  focusEmployeeId: string | null;
  setFocusEmployeeId: (id: string | null) => void;
  suggestionDonors: SuggestionDonor[];
  suggestionsByEmployeeAndProject: EmployeeRecommendation[];
  deadlines: Deadline[];
  hiddenProjects: Set<string>;
  flowProjectScope: FlowProjectScope;
  setFlowProjectScope: (scope: FlowProjectScope) => void;
  excludedReceiverIds: string[];
  setExcludedReceiverIds: (v: string[] | ((prev: string[]) => string[])) => void;
  onlySharedProjects: boolean;
  setOnlySharedProjects: (v: boolean) => void;
  includedProjectIds: Set<string>;
  setIncludedProjectIds: (v: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  filteredProjects: { id: string; name: string }[];
  getMonthlyCapacity: (id: string) => CapacityResult;
  getEmployeeAssignedHours: (id: string) => number;
  minSenderLoadPct: number;
  minSenderLoadPctInput: string;
  setMinSenderLoadPct: (n: number) => void;
  setMinSenderLoadPctInput: (s: string) => void;
  maxReceiverLoadPct: number;
  maxReceiverLoadPctInput: string;
  setMaxReceiverLoadPct: (n: number) => void;
  setMaxReceiverLoadPctInput: (s: string) => void;
  onInitializeRules: (donorId: string) => void;
  onOpenProject?: (projectId: string) => void;
}) {
  const donorOptions = buildDonorOptions(
    suggestionDonors,
    suggestionsByEmployeeAndProject,
    getMonthlyCapacity,
    getEmployeeAssignedHours
  );
  const donorName = donorOptions.find((d) => d.id === focusEmployeeId)?.name ?? '';
  const donorAvatar = suggestionDonors.find((d) => d.id === focusEmployeeId)?.avatarUrl;

  const receiverCandidates = useMemo(
    () =>
      suggestionsByEmployeeAndProject.map((g) => ({
        id: g.employeeId,
        name: g.employeeName,
        avatarUrl: g.employeeAvatar,
      })),
    [suggestionsByEmployeeAndProject]
  );

  const allRows = focusEmployeeId
    ? getDonorTransferRows(suggestionsByEmployeeAndProject, focusEmployeeId)
    : [];

  const excludedReceiverSet = useMemo(() => new Set(excludedReceiverIds), [excludedReceiverIds]);

  const rows = useMemo(
    () => filterDonorRows(allRows, excludedReceiverSet),
    [allRows, excludedReceiverSet]
  );

  const preview = summarizeDonorRows(rows);

  if (step === 1) {
    const selectedName = donorOptions.find((o) => o.id === focusEmployeeId)?.name;
    return (
      <SuggestionWizardStepShell
        header={<SuggestionStepBar step={1} labels={STEP_LABELS} />}
        footer={
          <div className="flex items-center justify-end gap-3">
            {selectedName ? (
              <p className="text-xs text-slate-600 truncate flex-1 min-w-0 mr-auto">
                Seleccionado: <span className="font-medium text-slate-900">{selectedName}</span>
              </p>
            ) : (
              <p className="text-xs text-slate-500 flex-1 min-w-0 mr-auto">Elige una persona de la lista</p>
            )}
            <Button
              className="shrink-0"
              disabled={!focusEmployeeId}
              onClick={() => {
                if (focusEmployeeId) onInitializeRules(focusEmployeeId);
                setStep(2);
              }}
            >
              Siguiente: reglas
            </Button>
          </div>
        }
      >
        <EmployeePickerList
          fillHeight
          title="¿De quién quieres quitar carga?"
          hint={`Personas al ${minSenderLoadPct}% o más de carga con horas en proyectos visibles.`}
          options={donorOptions}
          selectedId={focusEmployeeId}
          onSelect={(id) => setFocusEmployeeId(id)}
          emptyMessage="Nadie puede ceder horas con los filtros actuales. Baja el % mínimo de quien cede o revisa asignaciones."
        />
      </SuggestionWizardStepShell>
    );
  }

  if (step === 2 && focusEmployeeId) {
    const pct = employeeLoadPct(focusEmployeeId, getMonthlyCapacity, getEmployeeAssignedHours);
    return (
      <SuggestionWizardStepShell
        header={<SuggestionStepBar step={2} labels={STEP_LABELS} />}
        footer={
          <div className="flex justify-between gap-2">
            <Button variant="outline" onClick={() => setStep(1)}>
              Atrás
            </Button>
            <Button
              onClick={() => setStep(3)}
              disabled={
                preview.projectCount === 0 ||
                preview.receiverCount === 0 ||
                (flowProjectScope === 'manual' && includedProjectIds.size === 0)
              }
            >
              Ver destinos
            </Button>
          </div>
        }
      >
        <div className="flex items-center gap-3 mb-3 p-3 rounded-xl border bg-amber-50/50 border-amber-200/60">
          <Avatar className="h-11 w-11 border-2 border-white shadow">
            <AvatarFallback className="bg-amber-100 text-amber-800">{donorName[0]}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-slate-900">{donorName}</p>
            <p className="text-xs text-slate-500">Carga actual {pct}%</p>
          </div>
        </div>
        <SuggestionRulesStep
          mode="take"
          focusEmployeeId={focusEmployeeId}
          focusEmployeeName={donorName}
          focusEmployeeAvatar={donorAvatar}
          suggestionDonors={suggestionDonors}
          receiverCandidates={receiverCandidates}
          deadlines={deadlines}
          hiddenProjects={hiddenProjects}
          excludedDonorIds={[]}
          setExcludedDonorIds={() => {}}
          flowProjectScope={flowProjectScope}
          setFlowProjectScope={setFlowProjectScope}
          excludedReceiverIds={excludedReceiverIds}
          setExcludedReceiverIds={setExcludedReceiverIds}
          onlySharedProjects={onlySharedProjects}
          setOnlySharedProjects={setOnlySharedProjects}
          includedProjectIds={includedProjectIds}
          setIncludedProjectIds={setIncludedProjectIds}
          filteredProjects={filteredProjects}
          previewProjectCount={preview.projectCount}
          previewTotalHours={preview.totalHours}
          previewPeopleCount={preview.receiverCount}
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

  if (step === 3 && focusEmployeeId) {
    return (
      <SuggestionWizardStepShell
        header={<SuggestionStepBar step={3} labels={STEP_LABELS} />}
        footer={
          <div className="flex justify-between gap-2">
            <Button variant="outline" onClick={() => setStep(2)}>
              Atrás
            </Button>
            <Button onClick={() => setStep(4)} disabled={rows.length === 0}>
              Ver resumen
            </Button>
          </div>
        }
      >
        <DonorDestinationsList rows={rows} onOpenProject={onOpenProject} />
      </SuggestionWizardStepShell>
    );
  }

  if (step === 4 && focusEmployeeId) {
    return (
      <SuggestionWizardStepShell
        header={<SuggestionStepBar step={4} labels={STEP_LABELS} />}
        footer={
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setStep(3)}>
              Atrás
            </Button>
          </div>
        }
      >
        <p className="text-sm text-slate-600 mb-3">
          Revisa el impacto estimado. Abre un proyecto para editar horas en la tabla (nada se guarda hasta que
          confirmes).
        </p>
        <TakeFlowSummary
          donorName={donorName}
          donorAvatar={donorAvatar}
          donorId={focusEmployeeId}
          rows={rows}
          getMonthlyCapacity={getMonthlyCapacity}
          getEmployeeAssignedHours={getEmployeeAssignedHours}
        />
        {rows.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-medium text-slate-500">Por proyecto</p>
            <DonorDestinationsList rows={rows} onOpenProject={onOpenProject} reviewMode />
            {[...new Set(rows.map((r) => r.projectId))].length > 8 && (
              <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => setStep(3)}>
                Ver todos los proyectos en Destinos
              </Button>
            )}
          </div>
        )}
      </SuggestionWizardStepShell>
    );
  }

  return null;
}

function TakeFlowSummary({
  donorName,
  donorAvatar,
  donorId,
  rows,
  getMonthlyCapacity,
  getEmployeeAssignedHours,
}: {
  donorName: string;
  donorAvatar?: string;
  donorId: string;
  rows: ReturnType<typeof getDonorTransferRows>;
  getMonthlyCapacity: (id: string) => CapacityResult;
  getEmployeeAssignedHours: (id: string) => number;
}) {
  const total = roundDeadlineHours(rows.reduce((s, r) => s + (Number(r.transfer.suggestedHours) || 0), 0));
  const byReceiver = new Map<string, { name: string; hours: number }>();
  rows.forEach((r) => {
    const h = roundDeadlineHours(Number(r.transfer.suggestedHours) || 0);
    const cur = byReceiver.get(r.receiverId)?.hours ?? 0;
    byReceiver.set(r.receiverId, { name: r.receiverName, hours: roundDeadlineHours(cur + h) });
  });
  const loadPct = employeeLoadPct(donorId, getMonthlyCapacity, getEmployeeAssignedHours);
  const projectCount = new Set(rows.map((r) => r.projectId)).size;

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-3 text-sm">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10 border-2 border-white shadow shrink-0">
          <AvatarImage src={donorAvatar} alt={donorName} />
          <AvatarFallback className="bg-amber-100 text-amber-800 text-sm font-semibold">
            {donorName.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="font-semibold text-slate-800">Resumen para {donorName}</p>
          <p className="text-xs text-slate-500">Carga actual ~{loadPct}%</p>
        </div>
      </div>
      <p className="text-slate-600">
        Podría ceder hasta{' '}
        <span className="font-mono font-bold text-primary">{formatDeadlineHoursForDisplay(total)}h</span> en{' '}
        {projectCount} {projectCount === 1 ? 'proyecto' : 'proyectos'}.
      </p>
      {byReceiver.size > 0 && (
        <ul className="space-y-1 text-xs text-slate-600 max-h-28 overflow-y-auto">
          {Array.from(byReceiver.entries())
            .sort((a, b) => b[1].hours - a[1].hours)
            .map(([id, { name, hours }]) => (
              <li key={id} className="flex justify-between gap-2">
                <span className="truncate">→ {name}</span>
                <span className="font-mono text-primary shrink-0">{formatDeadlineHoursForDisplay(hours)}h</span>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
