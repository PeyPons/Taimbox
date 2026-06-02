import { Badge } from '@/components/ui/badge';
import { inferFlowProjectScope, type FlowProjectScope } from '@/utils/suggestionRulesUtils';

export function SuggestionActiveRulesChips({
  flowProjectScope,
  onlySharedProjects,
  includedProjectIds,
  excludedDonorIds,
  excludedReceiverIds,
  minSenderLoadPct,
  maxReceiverLoadPct,
  minSuggestedTransferHours,
  allowedDonorCount,
  allowedReceiverCount,
  mode,
}: {
  flowProjectScope?: FlowProjectScope | null;
  onlySharedProjects: boolean;
  includedProjectIds: Set<string>;
  excludedDonorIds: string[];
  excludedReceiverIds: string[];
  minSenderLoadPct: number;
  maxReceiverLoadPct: number;
  minSuggestedTransferHours?: number;
  allowedDonorCount?: number;
  allowedReceiverCount?: number;
  mode: 'give' | 'take' | 'team';
}) {
  const scope =
    flowProjectScope ?? inferFlowProjectScope(onlySharedProjects, includedProjectIds);
  const chips: string[] = [];

  if (scope === 'shared') chips.push('Solo en común');
  else if (scope === 'manual') {
    chips.push(
      includedProjectIds.size > 0
        ? `${includedProjectIds.size} proy. elegidos`
        : 'Manual (ninguno aún)'
    );
  } else if (scope === 'focus_projects') chips.push('Proyectos de la persona');

  if (mode === 'give' && allowedDonorCount != null) {
    chips.push(`${allowedDonorCount} ceden`);
  }
  if (mode === 'take' && allowedReceiverCount != null) {
    chips.push(`${allowedReceiverCount} destinos`);
  }
  if (mode === 'team' && excludedDonorIds.length > 0) {
    chips.push(`${excludedDonorIds.length} cedentes excl.`);
  }
  if (minSenderLoadPct > 30) chips.push(`Cede desde ${minSenderLoadPct}%`);
  if (maxReceiverLoadPct < 100) chips.push(`Receptor máx. ${maxReceiverLoadPct}%`);
  if (mode === 'team' && minSuggestedTransferHours != null) {
    chips.push(`Mín. ${minSuggestedTransferHours}h/mov.`);
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 mb-3">
      {chips.map((label) => (
        <Badge key={label} variant="secondary" className="text-[10px] font-normal bg-slate-100 text-slate-600">
          {label}
        </Badge>
      ))}
    </div>
  );
}

export function scopeLabel(scope: FlowProjectScope): string {
  switch (scope) {
    case 'shared':
      return 'Solo proyectos en común';
    case 'focus_projects':
      return 'Todos los proyectos de la persona';
    case 'manual':
      return 'Elige proyectos marcando la casilla';
    default:
      return '';
  }
}
