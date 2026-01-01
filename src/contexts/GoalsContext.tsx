import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { ProfessionalGoal } from '@/types';

interface SupabaseProfessionalGoal {
  id: string;
  employee_id: string;
  title: string;
  description?: string;
  key_results?: string;
  progress: number;
  start_date?: string;
  due_date?: string;
  training_url?: string;
}

interface GoalsContextType {
  professionalGoals: ProfessionalGoal[];
  isLoading: boolean;
  addProfessionalGoal: (goal: Omit<ProfessionalGoal, 'id'>) => Promise<void>;
  updateProfessionalGoal: (goal: ProfessionalGoal) => Promise<void>;
  deleteProfessionalGoal: (id: string) => Promise<void>;
  getEmployeeGoals: (employeeId: string) => ProfessionalGoal[];
  refreshGoals: () => Promise<void>;
}

export const GoalsContext = createContext<GoalsContextType | undefined>(undefined);

export function GoalsProvider({ children }: { children: React.ReactNode }) {
  const [professionalGoals, setProfessionalGoals] = useState<ProfessionalGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchGoals = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('professional_goals').select('*');

      if (error) {
        console.error('Error fetching goals:', error);
        return;
      }

      if (data) {
        setProfessionalGoals(data.map((g: SupabaseProfessionalGoal) => ({
          id: g.id,
          employeeId: g.employee_id,
          title: g.title,
          description: g.description,
          keyResults: g.key_results,
          progress: g.progress,
          startDate: g.start_date,
          dueDate: g.due_date,
          trainingUrl: g.training_url
        })));
      }
    } catch (error) {
      console.error('Error loading goals:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Cargar goals al montar
  React.useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const addProfessionalGoal = useCallback(async (goal: Omit<ProfessionalGoal, 'id'>) => {
    const { data, error } = await supabase.from('professional_goals').insert({
      employee_id: goal.employeeId,
      title: goal.title,
      description: goal.description,
      key_results: goal.keyResults,
      progress: goal.progress,
      start_date: goal.startDate,
      due_date: goal.dueDate,
      training_url: goal.trainingUrl
    }).select().single();

    if (error) {
      console.error('Error adding goal:', error);
      throw error;
    }

    if (data) {
      setProfessionalGoals(prev => [...prev, {
        id: data.id,
        employeeId: data.employee_id,
        title: data.title,
        description: data.description,
        keyResults: data.key_results,
        progress: data.progress,
        startDate: data.start_date,
        dueDate: data.due_date,
        trainingUrl: data.training_url
      }]);
    }
  }, []);

  const updateProfessionalGoal = useCallback(async (goal: ProfessionalGoal) => {
    // Optimistic update
    setProfessionalGoals(prev => prev.map(g => g.id === goal.id ? goal : g));

    const { error } = await supabase.from('professional_goals').update({
      title: goal.title,
      description: goal.description,
      key_results: goal.keyResults,
      progress: goal.progress,
      start_date: goal.startDate,
      due_date: goal.dueDate,
      training_url: goal.trainingUrl
    }).eq('id', goal.id);

    if (error) {
      console.error('Error updating goal:', error);
      // Revert on error
      await fetchGoals();
      throw error;
    }
  }, [fetchGoals]);

  const deleteProfessionalGoal = useCallback(async (id: string) => {
    // Optimistic update
    setProfessionalGoals(prev => prev.filter(g => g.id !== id));

    const { error } = await supabase.from('professional_goals').delete().eq('id', id);

    if (error) {
      console.error('Error deleting goal:', error);
      // Revert on error
      await fetchGoals();
      throw error;
    }
  }, [fetchGoals]);

  const getEmployeeGoals = useCallback((employeeId: string) => {
    return professionalGoals.filter(g => g.employeeId === employeeId);
  }, [professionalGoals]);

  const value = useMemo(() => ({
    professionalGoals,
    isLoading,
    addProfessionalGoal,
    updateProfessionalGoal,
    deleteProfessionalGoal,
    getEmployeeGoals,
    refreshGoals: fetchGoals
  }), [
    professionalGoals,
    isLoading,
    addProfessionalGoal,
    updateProfessionalGoal,
    deleteProfessionalGoal,
    getEmployeeGoals,
    fetchGoals
  ]);

  return <GoalsContext.Provider value={value}>{children}</GoalsContext.Provider>;
}

export function useGoals() {
  const context = useContext(GoalsContext);
  if (!context) {
    throw new Error('useGoals must be used within a GoalsProvider');
  }
  return context;
}
