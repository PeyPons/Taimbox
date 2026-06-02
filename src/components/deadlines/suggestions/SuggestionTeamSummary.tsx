import { Users, ArrowLeftRight, FolderKanban } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDeadlineHoursForDisplay } from '@/utils/deadlineUtils';
import type { TeamSuggestionsSummary } from '@/utils/suggestionTeamUtils';

export function SuggestionTeamSummary({
  summary,
  onExpandAll,
  onCollapseAll,
}: {
  summary: TeamSuggestionsSummary;
  onExpandAll?: () => void;
  onCollapseAll?: () => void;
}) {
  const hasActivity = summary.transferCount > 0;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
        <span className="text-xs font-semibold text-slate-700 shrink-0">Vista global</span>
        <Badge variant="secondary" className="text-[11px] font-medium h-6 px-2 bg-white border border-slate-200">
          <Users className="h-3 w-3 mr-1 inline" />
          {summary.receiverCount} receptores
        </Badge>
        <Badge variant="secondary" className="text-[11px] font-medium h-6 px-2 bg-white border border-slate-200">
          <ArrowLeftRight className="h-3 w-3 mr-1 inline" />
          {summary.transferCount} mov.
        </Badge>
        <Badge variant="secondary" className="text-[11px] font-medium h-6 px-2 bg-white border border-slate-200">
          <FolderKanban className="h-3 w-3 mr-1 inline" />
          {summary.projectCount} proy.
        </Badge>
        {hasActivity && (
          <Badge className="text-[11px] font-medium h-6 px-2 bg-primary/10 text-primary border border-primary/20">
            ~{formatDeadlineHoursForDisplay(summary.totalHours)}h total
          </Badge>
        )}
      </div>
      {(onExpandAll || onCollapseAll) && (
        <div className="flex shrink-0 gap-1 ml-auto">
          {onExpandAll && (
            <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={onExpandAll}>
              Expandir todo
            </Button>
          )}
          {onCollapseAll && (
            <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={onCollapseAll}>
              Colapsar
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
