import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Deadline } from '@/types';
import { format, startOfMonth } from 'date-fns';

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
 */
export function useDeadlines(): UseDeadlinesReturn {
    const [deadlines, setDeadlines] = useState<Deadline[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadDeadlinesForMonth = useCallback(async (month: Date) => {
        const monthKey = format(startOfMonth(month), 'yyyy-MM');
        setIsLoading(true);
        setError(null);

        try {
            const { data, error: supabaseError } = await supabase
                .from('deadlines')
                .select('*')
                .eq('month', monthKey)
                .order('created_at', { ascending: false });

            if (supabaseError) throw supabaseError;

            if (data) {
                const mappedDeadlines: Deadline[] = data.map((d: {
                    id: string;
                    project_id: string;
                    month: string;
                    notes?: string;
                    employee_hours?: Record<string, number>;
                    is_hidden?: boolean
                }) => ({
                    id: d.id,
                    projectId: d.project_id,
                    month: d.month,
                    notes: d.notes,
                    employeeHours: d.employee_hours || {},
                    isHidden: d.is_hidden || false
                }));
                setDeadlines(mappedDeadlines);
            } else {
                setDeadlines([]);
            }
        } catch (err) {
            console.error('Error cargando deadlines:', err);
            setError('Error al cargar deadlines');
            setDeadlines([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        deadlines,
        isLoading,
        error,
        loadDeadlinesForMonth,
        setDeadlines
    };
}
