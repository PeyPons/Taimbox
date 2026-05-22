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

export interface PlannerTaskContextMenuProps {
  alloc: Allocation;
  /** Solicitud pendiente o cascarón tras aceptación (solo lectura). */
  transferReadOnly?: boolean;
  /** @deprecated Usar transferReadOnly */
  pendingTransfer?: boolean;
  transferReadOnlyLabel?: string;
  isWeeklyEnabled: boolean;
  weeklyCloseDay: number;
  /** Siguiente semana en el mes (para «Mover sem.»); si no hay, no se muestra la opción */
  nextWeekStart?: Date;
  onStartEditFull: () => void;
  onTransfer: () => void;
  onMoveTask: (targetWeekStart: Date) => void;
  /**
   * Con Weekly activo: una sola entrada al modal de cierre (`WeeklyReportDialog`) con todas las acciones.
   * Si no se pasa, se muestran transferir / mover / (legacy) cierre parcial según corresponda.
   */
  onOpenWeeklyForTask?: (alloc: Allocation) => void;
  /** Clases del botón disparador (p. ej. táctil en móvil) */
  triggerClassName?: string;
  iconClassName?: string;
  /** Móvil / filas sin hover: menú siempre visible */
  menuTriggerMode?: 'hover' | 'always';
}

/**
 * Menú ⋯ unificado:
 * - Con Weekly + `onOpenWeeklyForTask`: Editar + «Opciones Weekly…» (modal completo).
 * - Sin Weekly: Editar, Transferir, Mover sem.
 * Con Weekly activo y semana pasada, transferir y mover quedan bloqueados (igual que editar).
 */
export function PlannerTaskContextMenu({
  alloc,
  transferReadOnly: transferReadOnlyProp,
  pendingTransfer: pendingTransferLegacy,
  transferReadOnlyLabel = 'Transferencia pendiente',
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
          {transferReadOnly ? transferReadOnlyLabel : 'Editar'}
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
              Opciones Weekly…
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
              Transferir a compañero
            </DropdownMenuItem>

            {weeklyPastLock && isWeeklyEnabled && (
              <DropdownMenuItem disabled className="text-xs text-amber-600">
                <AlertTriangle className="mr-2 h-3.5 w-3.5" />
                Usa Weekly para gestionar esta semana
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
                Mover sem.
              </DropdownMenuItem>
            )}
          </>
        )}

        {useWeeklyModal && weeklyPastLock && !transferReadOnly && (
          <DropdownMenuItem disabled className="text-xs text-amber-600">
            <AlertTriangle className="mr-2 h-3.5 w-3.5" />
            Edición bloqueada: usa «Opciones Weekly»
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
