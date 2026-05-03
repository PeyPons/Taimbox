import { useState } from 'react';
import { addDays, format, parseISO, startOfMonth } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { TaskTransfer, TransferStatus } from '@/types';

// ================================================================
// Types
// ================================================================

// Re-export types for compatibility
export type { TaskTransfer, TransferStatus };

/** Opciones para `acceptTransfer` (semana destino en `move`, semanas hijas en `distribute`, refetch explícito). */
export interface AcceptTransferOptions {
    targetWeek?: string;
    distributionWeekStarts?: string[];
    /** Lunes ISO (yyyy-MM-dd) de semanas cuyo mes debe recargarse tras la RPC (p. ej. `transfer.originalWeek`). */
    refetchWeekStarts?: string[];
}

export interface UseTaskTransfersResult {
    pendingTransfers: TaskTransfer[];
    outgoingTransfers: TaskTransfer[];
    isLoading: boolean; // This now refers to action loading
    requestTransfer: (params: RequestTransferParams & { fromEmployeeId?: string }) => Promise<boolean>;
    acceptTransfer: (
        transferId: string,
        acceptanceMode?: 'keep' | 'move' | 'distribute' | 'rollover',
        resultAllocationIds?: string[],
        options?: AcceptTransferOptions
    ) => Promise<boolean>;
    rejectTransfer: (transferId: string, reason?: string) => Promise<boolean>;
    cancelTransfer: (transferId: string) => Promise<boolean>;
    fetchTransfers: () => Promise<void>; // Exposed from context for manual refresh
    refreshTransfers: () => Promise<void>; // Alias for backward compatibility
}

export interface RequestTransferParams {
    allocationId: string;
    toEmployeeId: string;
    hoursTransferred: number;
    reason?: string;
}

// ================================================================
// Hook
// ================================================================
export function useTaskTransfers(): UseTaskTransfersResult {
    const { currentUser, pendingTransfers, outgoingTransfers, fetchTransfers, refetchMonthData } = useApp();
    const { toast } = useToast();
    const [isActionLoading, setIsActionLoading] = useState(false);

    const requestTransfer = async (params: RequestTransferParams & { fromEmployeeId?: string }): Promise<boolean> => {
        if (!currentUser?.id || !currentUser.agencyId) return false;

        const sourceEmployeeId = params.fromEmployeeId || currentUser.id;
        setIsActionLoading(true);

        try {
            // Check for existing pending transfer for this allocation to prevent duplicates
            const { data: existing, error: checkError } = await supabase
                .from('task_transfers')
                .select('id')
                .eq('allocation_id', params.allocationId)
                .eq('status', 'pending')
                .maybeSingle();

            if (checkError) throw checkError;
            if (existing) {
                toast({ title: 'Aviso', description: 'Ya existe una solicitud pendiente para esta tarea.', variant: 'default' });
                return false;
            }

            const { data: insertedTransfer, error } = await supabase
                .from('task_transfers')
                .insert({
                    allocation_id: params.allocationId,
                    from_employee_id: sourceEmployeeId,
                    to_employee_id: params.toEmployeeId,
                    hours_transferred: params.hoursTransferred,
                    reason: params.reason,
                    agency_id: currentUser.agencyId
                })
                .select('id')
                .maybeSingle();

            if (error) throw error;

            if (insertedTransfer?.id) {
                supabase.functions
                    .invoke('notify-task-transfer', { body: { transferId: insertedTransfer.id } })
                    .catch((err) => console.warn('[notify-task-transfer]', err));
            }

            toast({ title: 'Solicitud enviada', description: 'El compañero recibirá la notificación.' });
            await fetchTransfers(); // Update global context
            return true;
        } catch (error) {
            console.error('Error requesting transfer:', error);
            toast({ title: 'Error', description: 'No se pudo enviar la solicitud', variant: 'destructive' });
            return false;
        } finally {
            setIsActionLoading(false);
        }
    };

    const acceptTransfer = async (
        transferId: string,
        acceptanceMode: 'keep' | 'move' | 'distribute' | 'rollover' = 'keep',
        resultAllocationIds: string[] = [],
        options?: AcceptTransferOptions
    ): Promise<boolean> => {
        setIsActionLoading(true);
        try {
            const transfer = (pendingTransfers || []).find(t => t.id === transferId);
            if (!transfer) return false;

            const { error } = await supabase.rpc('accept_task_transfer', {
                p_transfer_id: transferId,
                p_acceptance_mode: acceptanceMode,
                p_result_allocation_ids: resultAllocationIds,
                p_target_week: acceptanceMode === 'move' ? options?.targetWeek ?? null : null
            });
            if (error) throw error;

            const weekStarts = new Set<string>();
            for (const w of options?.refetchWeekStarts ?? []) {
                if (w) weekStarts.add(w);
            }
            if (transfer.originalWeek) weekStarts.add(transfer.originalWeek);
            if (acceptanceMode === 'move' && options?.targetWeek) weekStarts.add(options.targetWeek);
            if (acceptanceMode === 'rollover' && transfer.originalWeek) {
                weekStarts.add(format(addDays(parseISO(transfer.originalWeek), 7), 'yyyy-MM-dd'));
            }
            if (acceptanceMode === 'distribute' && options?.distributionWeekStarts?.length) {
                for (const w of options.distributionWeekStarts) {
                    if (w) weekStarts.add(w);
                }
            }

            const months = new Map<string, Date>();
            for (const ws of weekStarts) {
                const m = startOfMonth(parseISO(ws));
                months.set(format(m, 'yyyy-MM'), m);
            }
            for (const monthDate of months.values()) {
                await refetchMonthData(monthDate);
            }

            await fetchTransfers();
            return true;
        } catch (error) {
            console.error('Error accepting transfer:', error);
            toast({ title: 'Error', description: 'No se pudo aceptar la transferencia', variant: 'destructive' });
            return false;
        } finally {
            setIsActionLoading(false);
        }
    };

    const rejectTransfer = async (transferId: string, reason?: string): Promise<boolean> => {
        setIsActionLoading(true);
        try {
            const { error } = await supabase
                .from('task_transfers')
                .update({
                    status: 'rejected',
                    rejection_reason: reason,
                    responded_at: new Date().toISOString()
                })
                .eq('id', transferId);

            if (error) throw error;

            toast({ title: 'Transferencia rechazada' });
            await fetchTransfers();
            return true;
        } catch (error) {
            console.error('Error rejecting transfer:', error);
            toast({ title: 'Error', description: 'No se pudo rechazar', variant: 'destructive' });
            return false;
        } finally {
            setIsActionLoading(false);
        }
    };

    const cancelTransfer = async (transferId: string): Promise<boolean> => {
        setIsActionLoading(true);
        try {
            const { error } = await supabase
                .from('task_transfers')
                .update({ status: 'cancelled' })
                .eq('id', transferId);

            if (error) throw error;

            toast({ title: 'Solicitud cancelada' });
            await fetchTransfers();
            return true;
        } catch (error) {
            console.error('Error cancelling transfer:', error);
            return false;
        } finally {
            setIsActionLoading(false);
        }
    };

    return {
        pendingTransfers,
        outgoingTransfers,
        isLoading: isActionLoading,
        requestTransfer,
        acceptTransfer,
        rejectTransfer,
        cancelTransfer,
        fetchTransfers,
        refreshTransfers: fetchTransfers
    };
}

export default useTaskTransfers;
