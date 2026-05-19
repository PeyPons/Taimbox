import { cn } from '@/lib/utils';
import { CheckCircle2, ChevronDown } from 'lucide-react';
import { SensitiveText } from '@/components/privacy/SensitiveText';

interface AllocationMonthProjectCardHeaderProps {
  projectId: string;
  projectName: string;
  allCompleted: boolean;
  completedCount: number;
  totalCount: number;
  estimatedHours: number;
  isCollapsed: boolean;
}

export function AllocationMonthProjectCardHeader({
  projectId,
  projectName,
  allCompleted,
  completedCount,
  totalCount,
  estimatedHours,
  isCollapsed,
}: AllocationMonthProjectCardHeaderProps) {
  return (
    <div className="px-2.5 py-2 flex items-center gap-2 min-w-0">
      <span
        className={cn(
          'shrink-0 w-1.5 h-1.5 rounded-full',
          allCompleted ? 'bg-emerald-500' : completedCount > 0 ? 'bg-amber-400' : 'bg-slate-300'
        )}
        aria-hidden
      />
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-[13px] font-medium truncate leading-tight',
            allCompleted ? 'text-emerald-700' : 'text-slate-800'
          )}
        >
          <SensitiveText kind="project" id={projectId}>
            {projectName}
          </SensitiveText>
        </p>
        <p className="text-[10px] text-slate-500 tabular-nums mt-0.5 truncate">
          {allCompleted && <CheckCircle2 className="inline w-3 h-3 text-emerald-500 mr-0.5 -mt-px" />}
          {completedCount}/{totalCount} · {estimatedHours}h
        </p>
      </div>
      <ChevronDown
        className={cn(
          'w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform',
          !isCollapsed && 'rotate-180'
        )}
      />
    </div>
  );
}
