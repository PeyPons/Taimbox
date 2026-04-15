import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { TaskTransfer, TransferStatus } from '@/types';

// ================================================================
// Types
// ================================================================

// Re-export types for compatibility
export type { TaskTransfer, TransferStatus };

export interface UseTaskTransfersResult {
    pendingTransfers: TaskTransfer[];
    outgoingTransfers: TaskTransfer[];
    isLoading: boolean; // This now refers to action loading
    requestTransfer: (params: RequestTransferParams & { fromEmployeeId?: string }) => Promise<boolean>;
    acceptTransfer: (transferId: string, acceptanceMode?: 'keep' | 'move' | 'distribute' | 'rollover', resultAllocationIds?: string[]) => Promise<boolean>;
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
    const { currentUser, pendingTransfers, outgoingTransfers, fetchTransfers } = useApp();
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
        resultAllocationIds: string[] = []
    ): Promise<boolean> => {
        setIsActionLoading(true);
        try {
            const transfer = (pendingTransfers || []).find(t => t.id === transferId);
            if (!transfer) return false;

            // Update transfer status with acceptance details
            const { error: updateError } = await supabase
                .from('task_transfers')
                .update({
                    status: 'accepted',
                    responded_at: new Date().toISOString(),
                    acceptance_mode: acceptanceMode,
                    result_allocation_ids: resultAllocationIds
                })
                .eq('id', transferId);

            if (updateError) throw updateError;

            // Update allocation to new employee
            const { error: allocError } = await supabase
                .from('allocations')
                .update({
                    employee_id: transfer.toEmployeeId,
                    transfer_source_employee_id: transfer.fromEmployeeId,
                    original_transferred_task_name: transfer.taskName
                })
                .eq('id', transfer.allocationId);

            if (allocError) throw allocError;

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
