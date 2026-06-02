import { Allocation } from '@/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreHorizontal,
  Pencil,
  ArrowRightLeft,
  ArrowRightCircle,
  AlertTriangle,
  Lock,
  ListChecks,
} from 'lucide-react';
import { isAllocationWeekPastForWeekly } from '@/utils/dateUtils';
import { useAppTranslation } from '@/hooks/useAppTranslation';

export interface PlannerTaskContextMenuProps {
  alloc: Allocation;
  transferReadOnly?: boolean;
  /** @deprecated Usar transferReadOnly */
  pendingTransfer?: boolean;
  transferReadOnlyLabel?: string;
  isWeeklyEnabled: boolean;
  weeklyCloseDay: number;
  nextWeekStart?: Date;
  onStartEditFull: () => void;
  onTransfer: () => void;
  onMoveTask: (targetWeekStart: Date) => void;
  onOpenWeeklyForTask?: (alloc: Allocation) => void;
  triggerClassName?: string;
  iconClassName?: string;
  menuTriggerMode?: 'hover' | 'always';
}

export function PlannerTaskContextMenu({
  alloc,
  transferReadOnly: transferReadOnlyProp,
  pendingTransfer: pendingTransferLegacy,
  transferReadOnlyLabel,
  isWeeklyEnabled,
  weeklyCloseDay,
  nextWeekStart,
  onStartEditFull,
  onTransfer,
  onMoveTask,
  onOpenWeeklyForTask,
  triggerClassName,
  iconClassName = 'h-3 w-3',
  menuTriggerMode = 'hover',
}: PlannerTaskContextMenuProps) {
  const { t } = useAppTranslation();
  const readOnlyLabel = transferReadOnlyLabel ?? t('planner.allocationSheet.transfer.pendingMenu', 'Transfer pending');
  const transferReadOnly = transferReadOnlyProp ?? !!pendingTransferLegacy;
  const isCompleted = alloc.status === 'completed';
  const weeklyPastLock = isWeeklyEnabled && isAllocationWeekPastForWeekly(alloc.weekStartDate, weeklyCloseDay);
  const editDisabled = transferReadOnly || weeklyPastLock;

  const useWeeklyModal = Boolean(isWeeklyEnabled && onOpenWeeklyForTask);
  const weeklyEntryDisabled = transferReadOnly || isCompleted;
  const showWeeklyEntry = useWeeklyModal && !isCompleted;

  const transferDisabled = transferReadOnly || weeklyPastLock;
  const moveDisabled = transferReadOnly || weeklyPastLock;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            'transition-opacity shrink-0',
            menuTriggerMode === 'always' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
            triggerClassName
          )}
        >
          <MoreHorizontal className={iconClassName} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          disabled={editDisabled}
          onClick={() => {
            if (editDisabled) return;
            onStartEditFull();
          }}
        >
          {transferReadOnly ? (
            <Lock className="mr-2 h-3.5 w-3.5" />
          ) : (
            <Pencil className="mr-2 h-3.5 w-3.5" />
          )}
          {transferReadOnly ? readOnlyLabel : t('planner.taskContextMenu.edit', 'Edit')}
        </DropdownMenuItem>

        {showWeeklyEntry && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={weeklyEntryDisabled}
              onClick={() => {
                if (weeklyEntryDisabled || !onOpenWeeklyForTask) return;
                onOpenWeeklyForTask(alloc);
              }}
            >
              <ListChecks className="mr-2 h-3.5 w-3.5" />
              {t('planner.taskContextMenu.weeklyOptions', 'Weekly options…')}
            </DropdownMenuItem>
          </>
        )}

        {!useWeeklyModal && (
          <>
            <DropdownMenuItem
              disabled={transferDisabled}
              onClick={() => {
                if (transferDisabled) return;
                onTransfer();
              }}
            >
              {weeklyPastLock && !transferReadOnly ? (
                <Lock className="mr-2 h-3.5 w-3.5 text-amber-600" />
              ) : (
                <ArrowRightLeft className="mr-2 h-3.5 w-3.5" />
              )}
              {t('planner.taskContextMenu.transferToTeammate', 'Transfer to teammate')}
            </DropdownMenuItem>

            {weeklyPastLock && isWeeklyEnabled && (
              <DropdownMenuItem disabled className="text-xs text-amber-600">
                <AlertTriangle className="mr-2 h-3.5 w-3.5" />
                {t('planner.taskContextMenu.useWeeklyForWeek', 'Use Weekly to manage this week')}
              </DropdownMenuItem>
            )}

            {nextWeekStart && (
              <DropdownMenuItem
                disabled={moveDisabled}
                onClick={() => {
                  if (moveDisabled) return;
                  onMoveTask(nextWeekStart);
                }}
              >
                <ArrowRightCircle className="mr-2 h-3.5 w-3.5" />
                {t('planner.taskContextMenu.moveWeek', 'Move week')}
              </DropdownMenuItem>
            )}
          </>
        )}

        {useWeeklyModal && weeklyPastLock && !transferReadOnly && (
          <DropdownMenuItem disabled className="text-xs text-amber-600">
            <AlertTriangle className="mr-2 h-3.5 w-3.5" />
            {t('planner.taskContextMenu.editLockedUseWeekly', 'Editing locked: use «Weekly options»')}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
