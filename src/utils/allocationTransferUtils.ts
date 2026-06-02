import { Allocation, TaskTransfer, WeeklyFeedback } from '@/types';
import { round2 } from '@/utils/numbers';

export type TransferTooltipTranslate = (
  key: string,
  options?: Record<string, unknown>
) => string;

export interface AllocationTransferUiState {
  pendingTransfer?: TaskTransfer;
  acceptedOutgoing?: TaskTransfer;
  /** Bloqueo de edición: pendiente o cascarón tras aceptación (emisor). */
  isReadOnly: boolean;
  /** Tarea que el emisor ya cedió pero sigue visible (p. ej. distribute → 0h). */
  isSenderShell: boolean;
  /** Tarea recibida de otro compañero. */
  isReceivedTransfer: boolean;
  showTransferBadge: boolean;
  transferBadgeTooltip?: string;
  showWeeklyBadge: boolean;
}

export function findOutgoingTransferForAllocation(
  outgoingTransfers: TaskTransfer[] | undefined,
  allocationId: string
): TaskTransfer | undefined {
  return outgoingTransfers?.find(t => t.allocationId === allocationId);
}

export function getPendingOutgoingTransfer(
  outgoingTransfers: TaskTransfer[] | undefined,
  allocationId: string
): TaskTransfer | undefined {
  const t = findOutgoingTransferForAllocation(outgoingTransfers, allocationId);
  return t?.status === 'pending' ? t : undefined;
}

export function getAcceptedOutgoingTransferFromOwner(
  outgoingTransfers: TaskTransfer[] | undefined,
  allocationId: string,
  ownerEmployeeId: string
): TaskTransfer | undefined {
  const t = findOutgoingTransferForAllocation(outgoingTransfers, allocationId);
  if (!t || t.status !== 'accepted' || t.fromEmployeeId !== ownerEmployeeId) return undefined;
  return t;
}

/** Tarea recibida por transferencia (no cascarón del emisor). */
export function isReceivedTransferredAllocation(
  alloc: Allocation,
  ownerEmployeeId: string
): boolean {
  if (alloc.transferredFromAllocationId) return true;
  if (alloc.taskName?.includes('(transferida de')) return true;
  if (alloc.taskName?.includes('(transferred from')) return true;
  if (
    alloc.transferSourceEmployeeId &&
    alloc.transferSourceEmployeeId !== ownerEmployeeId
  ) {
    return true;
  }
  return false;
}

/** Cascarón en panel del emisor tras aceptar (distribute u otro modo con fila residual). */
/**
 * Cascarón del emisor tras distribute aceptado (0h, bloqueado).
 * No se muestra en el planificador: la trazabilidad queda en historial de transferencias.
 */
export function shouldHideSenderTransferShellInPlanner(
  alloc: Allocation,
  ownerEmployeeId: string,
  outgoingTransfers: TaskTransfer[] | undefined
): boolean {
  return isSenderTransferShell(alloc, ownerEmployeeId, outgoingTransfers);
}

export function filterAllocationsForPlannerDisplay(
  allocations: Allocation[],
  ownerEmployeeId: string,
  outgoingTransfers: TaskTransfer[] | undefined
): Allocation[] {
  return allocations.filter(
    (a) => !shouldHideSenderTransferShellInPlanner(a, ownerEmployeeId, outgoingTransfers)
  );
}

export function isSenderTransferShell(
  alloc: Allocation,
  ownerEmployeeId: string,
  outgoingTransfers: TaskTransfer[] | undefined
): boolean {
  if (alloc.employeeId !== ownerEmployeeId) return false;

  const accepted = getAcceptedOutgoingTransferFromOwner(
    outgoingTransfers,
    alloc.id,
    ownerEmployeeId
  );
  if (accepted) {
    if (accepted.acceptanceMode === 'rollover') return false;
    if (accepted.acceptanceMode === 'distribute') return true;
    // keep / move: no debería quedar en el emisor; si el estado local va retrasado, bloquear igual
    return true;
  }

  return (
    !!alloc.isLocked &&
    round2(Number(alloc.hoursAssigned)) === 0 &&
    !!alloc.originalTransferredTaskName
  );
}

export function getTransferBadgeTooltip(
  alloc: Allocation,
  ownerEmployeeId: string,
  employees: { id: string; name: string }[],
  outgoingTransfers: TaskTransfer[] | undefined,
  pending?: TaskTransfer,
  accepted?: TaskTransfer,
  translate?: TransferTooltipTranslate
): string | undefined {
  const tr: TransferTooltipTranslate =
    translate ??
    ((key, options) => {
      const fallbacks: Record<string, string> = {
        'transfers.badge.teammateFallback': 'teammate',
        'transfers.badge.pendingAcceptance': 'Transfer pending acceptance by {{name}}',
        'transfers.badge.transferredDistributed':
          'Task transferred and split. Kept as reference (0h). Recipient: {{name}}',
        'transfers.badge.transferredRollover': 'Continuation transferred to {{name}} next week',
        'transfers.badge.transferredTo': 'Transferred to {{name}}',
        'transfers.badge.transferredFrom': 'Transferred from {{name}}',
        'transfers.badge.readOnlyShell': 'Transferred task (read-only in your panel)',
        'transfers.badge.receivedFromWithOriginal':
          'Transferred from {{source}}\nOriginal task: {{original}}',
        'transfers.badge.receivedFrom': 'Transferred from {{source}}',
      };
      let text = fallbacks[key] ?? key;
      if (options) {
        Object.entries(options).forEach(([k, v]) => {
          text = text.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(v ?? ''));
        });
      }
      return text;
    });

  const teammateFallback = tr('transfers.badge.teammateFallback');

  if (pending) {
    const toName =
      pending.toEmployeeName ||
      employees.find(e => e.id === pending.toEmployeeId)?.name ||
      teammateFallback;
    return tr('transfers.badge.pendingAcceptance', { name: toName });
  }

  if (accepted) {
    const toName =
      accepted.toEmployeeName ||
      employees.find(e => e.id === accepted.toEmployeeId)?.name ||
      teammateFallback;
    if (accepted.acceptanceMode === 'distribute') {
      return tr('transfers.badge.transferredDistributed', { name: toName });
    }
    if (accepted.acceptanceMode === 'rollover') {
      return tr('transfers.badge.transferredRollover', { name: toName });
    }
    return tr('transfers.badge.transferredTo', { name: toName });
  }

  if (isSenderTransferShell(alloc, ownerEmployeeId, outgoingTransfers)) {
    const sourceId = alloc.transferSourceEmployeeId;
    const sourceName = sourceId
      ? employees.find(e => e.id === sourceId)?.name
      : undefined;
    if (sourceName && sourceId !== ownerEmployeeId) {
      return tr('transfers.badge.transferredFrom', { name: sourceName });
    }
    return tr('transfers.badge.readOnlyShell');
  }

  if (isReceivedTransferredAllocation(alloc, ownerEmployeeId)) {
    const sourceId = alloc.transferSourceEmployeeId;
    const sourceName = sourceId
      ? employees.find(e => e.id === sourceId)?.name
      : alloc.taskName?.match(/\(transferida de (.+?)(?:,|$)/)?.[1] ??
        alloc.taskName?.match(/\(transferred from (.+?)(?:,|$)/)?.[1];
    const original =
      alloc.originalTransferredTaskName ||
      alloc.taskName
        ?.replace(/\s*\((?:transferida de|transferred from) .+?\)/g, '')
        .trim();
    if (sourceName && original) {
      return tr('transfers.badge.receivedFromWithOriginal', { source: sourceName, original });
    }
    if (sourceName) return tr('transfers.badge.receivedFrom', { source: sourceName });
  }

  return undefined;
}

export function shouldShowWeeklyBadge(
  alloc: Allocation,
  ownerEmployeeId: string,
  weeklyFeedback: WeeklyFeedback[] | undefined
): boolean {
  const feedback = weeklyFeedback ?? [];
  const hasWeeklyFeedback = feedback.some(fb => fb.allocationId === alloc.id);
  if (hasWeeklyFeedback) return true;

  if (isReceivedTransferredAllocation(alloc, ownerEmployeeId)) return false;
  if (
    !!alloc.isLocked &&
    round2(Number(alloc.hoursAssigned)) === 0 &&
    !!alloc.originalTransferredTaskName
  ) {
    return false;
  }

  const isDistributed = !!alloc.distributionSourceAllocationId;
  if (isDistributed) return true;

  const allZero =
    round2(Number(alloc.hoursAssigned)) === 0 &&
    round2(Number(alloc.hoursActual ?? 0)) === 0 &&
    round2(Number(alloc.hoursComputed ?? 0)) === 0;

  return allZero && alloc.status === 'completed' && hasWeeklyFeedback;
}

export function getAllocationTransferUiState(
  alloc: Allocation,
  ownerEmployeeId: string,
  outgoingTransfers: TaskTransfer[] | undefined,
  weeklyFeedback: WeeklyFeedback[] | undefined,
  employees: { id: string; name: string }[] = [],
  translate?: TransferTooltipTranslate
): AllocationTransferUiState {
  const pendingTransfer = getPendingOutgoingTransfer(outgoingTransfers, alloc.id);
  const acceptedOutgoing = getAcceptedOutgoingTransferFromOwner(
    outgoingTransfers,
    alloc.id,
    ownerEmployeeId
  );
  const isSenderShell = isSenderTransferShell(alloc, ownerEmployeeId, outgoingTransfers);
  const isReceivedTransfer = isReceivedTransferredAllocation(alloc, ownerEmployeeId);
  const isReadOnly = !!pendingTransfer || isSenderShell;

  const showTransferBadge =
    !!pendingTransfer || isSenderShell || isReceivedTransfer;

  return {
    pendingTransfer,
    acceptedOutgoing,
    isReadOnly,
    isSenderShell,
    isReceivedTransfer,
    showTransferBadge,
    transferBadgeTooltip: showTransferBadge
      ? getTransferBadgeTooltip(
          alloc,
          ownerEmployeeId,
          employees,
          outgoingTransfers,
          pendingTransfer,
          acceptedOutgoing,
          translate
        )
      : undefined,
    showWeeklyBadge: shouldShowWeeklyBadge(alloc, ownerEmployeeId, weeklyFeedback),
  };
}

export function cleanTransferredTaskName(
  taskName?: string,
  fallbackTask = 'Task'
): string {
  let cleanName = taskName || fallbackTask;
  cleanName = cleanName
    .replace(/\s*\((?:transferida de|transferred from) .+?(?:, original: .+?)?\)/g, '')
    .trim();
  return cleanName || fallbackTask;
}
