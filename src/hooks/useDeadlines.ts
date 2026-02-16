import { useState, useCallback } from 'react';
import { Deadline } from '@/types';
import { format, startOfMonth } from 'date-fns';
import { fetchDeadlinesForMonth } from '@/utils/deadlineUtils';

interface UseDeadlinesOptions {
    /** ID de la agencia; si se pasa, solo se cargan deadlines de proyectos de esa agencia (evita mezclar datos entre agencias). */
    agencyId?: string;
}

interface UseDeadlinesReturn {
    deadlines: Deadline[];
    isLoading: boolean;
    error: string | null;
    loadDeadlinesForMonth: (month: Date) => Promise<void>;
    setDeadlines: React.Dispatch<React.SetStateAction<Deadline[]>>;
}

/**
 * Hook centralizado para cargar y gestionar deadlines.
 * Reemplaza la lógica duplicada en EmployeeDashboard y AllocationSheet.
 * Con multi-tenant (varias agencias en el mismo Supabase), pasar agencyId para filtrar por agencia.
 */
export function useDeadlines(options: UseDeadlinesOptions = {}): UseDeadlinesReturn {
    const { agencyId } = options;
    const [deadlines, setDeadlines] = useState<Deadline[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadDeadlinesForMonth = useCallback(async (month: Date) => {
        const monthKey = format(startOfMonth(month), 'yyyy-MM');
        setIsLoading(true);
        setError(null);

        try {
            const { data, error: fetchErr } = await fetchDeadlinesForMonth(monthKey, agencyId);
            if (fetchErr) throw fetchErr;
            setDeadlines(data ?? []);
        } catch (err) {
            console.error('Error cargando deadlines:', err);
            setError('Error al cargar deadlines');
            setDeadlines([]);
        } finally {
            setIsLoading(false);
        }
    }, [agencyId]);

    return {
        deadlines,
        isLoading,
        error,
        loadDeadlinesForMonth,
        setDeadlines
    };
}
