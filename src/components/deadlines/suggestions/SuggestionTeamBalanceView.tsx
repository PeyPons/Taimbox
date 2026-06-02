import type { ReactNode } from 'react';
import { SuggestionTeamSummary } from '@/components/deadlines/suggestions/SuggestionTeamSummary';
import { SuggestionTeamRulesCollapsible } from '@/components/deadlines/suggestions/SuggestionTeamRulesCollapsible';
import type { TeamSuggestionsSummary } from '@/utils/suggestionTeamUtils';

/** Layout modo equipo: sidebar límites | lista (scroll único) | panel resumen. */
export function SuggestionTeamBalanceView({
  summary,
  listContent,
  rightPanel,
  limitsSidebar,
  mobileLimitsContent,
  rulesChips,
  onExpandAll,
  onCollapseAll,
  teamLimitsOpen,
  onTeamLimitsOpenChange,
  hasRestrictiveFilters,
  onResetFilters,
}: {
  summary: TeamSuggestionsSummary;
  listContent: ReactNode;
  rightPanel: ReactNode;
  limitsSidebar: ReactNode;
  mobileLimitsContent: ReactNode;
  rulesChips?: ReactNode;
  onExpandAll?: () => void;
  onCollapseAll?: () => void;
  teamLimitsOpen: boolean;
  onTeamLimitsOpenChange: (open: boolean) => void;
  hasRestrictiveFilters?: boolean;
  onResetFilters?: () => void;
}) {
  return (
    <div className="flex flex-col flex-1 min-h-0 h-full w-full overflow-hidden">
      <div className="md:hidden shrink-0 px-3 py-2 border-b border-slate-200 bg-white">
        <SuggestionTeamRulesCollapsible
          open={teamLimitsOpen}
          onOpenChange={onTeamLimitsOpenChange}
          hasRestrictiveFilters={hasRestrictiveFilters}
          onResetFilters={onResetFilters}
          unboundedContent
        >
          {mobileLimitsContent}
        </SuggestionTeamRulesCollapsible>
      </div>

      <div className="flex flex-1 min-h-0 w-full overflow-hidden">
        <div className="hidden md:flex h-full min-h-0 shrink-0">{limitsSidebar}</div>

        <div className="flex flex-col flex-1 min-w-0 min-h-0 bg-white">
          <div className="shrink-0 border-b border-slate-200 bg-slate-50/70 px-3 sm:px-4 py-2.5 space-y-2">
            {rulesChips ? <div className="flex flex-wrap items-center gap-1.5">{rulesChips}</div> : null}
            <SuggestionTeamSummary
              summary={summary}
              onExpandAll={onExpandAll}
              onCollapseAll={onCollapseAll}
            />
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 sm:px-4 py-3">
            {listContent}
          </div>
        </div>

        <div className="hidden lg:flex flex-col min-h-0 w-[min(340px,28vw)] max-w-[420px] shrink-0 border-l border-slate-200 bg-slate-50/50">
          <div className="flex-1 min-h-0 overflow-y-auto p-4">{rightPanel}</div>
        </div>
      </div>
    </div>
  );
}
