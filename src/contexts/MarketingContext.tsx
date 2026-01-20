import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useAgency } from '@/contexts/AgencyContext';
import { useApp } from '@/contexts/AppContext';
import { toast } from 'sonner';
import {
  MarketingBudget,
  MarketingCategory,
  MarketingMonthlyPlan,
  BudgetMovement,
  MarketingExpense,
  BudgetSummary,
  CreateBudgetForm,
  CreateCategoryForm,
  CreateMovementForm,
  CreateExpenseForm,
  UpdateResultsForm,
} from '@/types/marketing';

// ============================================
// Supabase Response Types (snake_case)
// ============================================

interface SupabaseMarketingBudget {
  id: string;
  agency_id: string;
  year: number;
  total_budget: number;
  status: string;
  created_at: string;
  updated_at?: string;
}

interface SupabaseMarketingCategory {
  id: string;
  budget_id: string;
  parent_id: string | null;
  name: string;
  kpi_name?: string;
  kpi_target_cost?: number;
  allowed_employees: string[];
  sort_order: number;
  created_at: string;
  updated_at?: string;
}

interface SupabaseMarketingMonthlyPlan {
  id: string;
  category_id: string;
  month: string;
  budget_allocated: number;
  real_spent: number;
  manual_result_value: number;
  manual_result_notes?: string;
  created_at?: string;
  updated_at?: string;
}

interface SupabaseBudgetMovement {
  id: string;
  created_at: string;
  created_by: string;
  amount: number;
  from_plan_id: string | null;
  to_plan_id: string | null;
  type: string;
  description?: string;
}

interface SupabaseMarketingExpense {
  id: string;
  monthly_plan_id: string;
  amount: number;
  concept?: string;
  date?: string;
  is_estimated: boolean;
  created_at?: string;
  updated_at?: string;
}

// ============================================
// Context Type Definition
// ============================================

interface MarketingContextType {
  // State
  budgets: MarketingBudget[];
  currentBudget: MarketingBudget | null;
  categories: MarketingCategory[];
  monthlyPlans: MarketingMonthlyPlan[];
  movements: BudgetMovement[];
  expenses: MarketingExpense[];
  isLoading: boolean;

  // Budget CRUD
  createBudget: (data: CreateBudgetForm) => Promise<MarketingBudget | null>;
  updateBudget: (id: string, data: Partial<MarketingBudget>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  selectBudget: (budget: MarketingBudget | null) => void;

  // Category CRUD
  createCategory: (data: CreateCategoryForm) => Promise<MarketingCategory | null>;
  updateCategory: (id: string, data: Partial<MarketingCategory>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  reorderCategories: (categoryId: string, newOrder: number) => Promise<void>;

  // Monthly Plans
  getOrCreateMonthlyPlan: (categoryId: string, month: string) => Promise<MarketingMonthlyPlan | null>;
  updateResults: (planId: string, data: UpdateResultsForm) => Promise<void>;

  // Movements (Transfers)
  createMovement: (data: CreateMovementForm) => Promise<BudgetMovement | null>;
  getMovementsForPlan: (planId: string) => BudgetMovement[];

  // Expenses
  createExpense: (data: CreateExpenseForm) => Promise<MarketingExpense | null>;
  updateExpense: (id: string, data: Partial<MarketingExpense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  getExpensesForPlan: (planId: string) => MarketingExpense[];

  // Calculations
  getBudgetSummary: () => BudgetSummary;
  getCategoryTree: () => MarketingCategory[];
  getMonthlyPlanForCategory: (categoryId: string, month: string) => MarketingMonthlyPlan | undefined;
  hasRemainder: (planId: string) => { hasRemainder: boolean; amount: number };

  // Refresh
  refreshData: () => Promise<void>;
}

// ============================================
// Context Creation
// ============================================

export const MarketingContext = createContext<MarketingContextType | undefined>(undefined);

// ============================================
// Helper Functions
// ============================================

const mapBudget = (b: SupabaseMarketingBudget): MarketingBudget => ({
  id: b.id,
  agencyId: b.agency_id,
  year: b.year,
  totalBudget: Number(b.total_budget),
  status: b.status as MarketingBudget['status'],
  createdAt: b.created_at,
  updatedAt: b.updated_at,
});

const mapCategory = (c: SupabaseMarketingCategory): MarketingCategory => ({
  id: c.id,
  budgetId: c.budget_id,
  parentId: c.parent_id,
  name: c.name,
  kpiName: c.kpi_name,
  kpiTargetCost: c.kpi_target_cost ? Number(c.kpi_target_cost) : undefined,
  allowedEmployees: c.allowed_employees || [],
  createdAt: c.created_at,
  updatedAt: c.updated_at,
});

const mapMonthlyPlan = (p: SupabaseMarketingMonthlyPlan): MarketingMonthlyPlan => ({
  id: p.id,
  categoryId: p.category_id,
  month: p.month,
  budgetAllocated: Number(p.budget_allocated),
  realSpent: Number(p.real_spent),
  manualResultValue: Number(p.manual_result_value),
  manualResultNotes: p.manual_result_notes,
  createdAt: p.created_at,
  updatedAt: p.updated_at,
});

const mapMovement = (m: SupabaseBudgetMovement): BudgetMovement => ({
  id: m.id,
  createdAt: m.created_at,
  createdBy: m.created_by,
  amount: Number(m.amount),
  fromPlanId: m.from_plan_id,
  toPlanId: m.to_plan_id,
  type: m.type as BudgetMovement['type'],
  description: m.description,
});

const mapExpense = (e: SupabaseMarketingExpense): MarketingExpense => ({
  id: e.id,
  monthlyPlanId: e.monthly_plan_id,
  amount: Number(e.amount),
  concept: e.concept,
  date: e.date,
  isEstimated: e.is_estimated,
  createdAt: e.created_at,
  updatedAt: e.updated_at,
});

// ============================================
// Provider Component
// ============================================

export function MarketingProvider({ children }: { children: React.ReactNode }) {
  const { isInitialized: isAuthInitialized } = useAuth();
  const { currentAgency, isLoading: isAgencyLoading } = useAgency();
  const { currentUser } = useApp();

  const [budgets, setBudgets] = useState<MarketingBudget[]>([]);
  const [currentBudget, setCurrentBudget] = useState<MarketingBudget | null>(null);
  const [categories, setCategories] = useState<MarketingCategory[]>([]);
  const [monthlyPlans, setMonthlyPlans] = useState<MarketingMonthlyPlan[]>([]);
  const [movements, setMovements] = useState<BudgetMovement[]>([]);
  const [expenses, setExpenses] = useState<MarketingExpense[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ============================================
  // Data Fetching
  // ============================================

  const fetchData = useCallback(async () => {
    if (!currentAgency?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Fetch budgets for this agency
      const { data: budgetsData, error: budgetsError } = await supabase
        .from('marketing_budgets')
        .select('*')
        .eq('agency_id', currentAgency.id)
        .order('year', { ascending: false });

      if (budgetsError) throw budgetsError;

      const mappedBudgets = (budgetsData || []).map(mapBudget);
      setBudgets(mappedBudgets);

      // Auto-select current year budget or most recent
      const currentYear = new Date().getFullYear();
      const currentYearBudget = mappedBudgets.find(b => b.year === currentYear);
      const selectedBudget = currentYearBudget || mappedBudgets[0] || null;
      setCurrentBudget(selectedBudget);

      // If we have a budget, load its data
      if (selectedBudget) {
        await loadBudgetData(selectedBudget.id);
      } else {
        setCategories([]);
        setMonthlyPlans([]);
        setMovements([]);
        setExpenses([]);
      }
    } catch (error) {
      console.error('Error loading marketing data:', error);
      toast.error('Error al cargar datos de marketing');
    } finally {
      setIsLoading(false);
    }
  }, [currentAgency?.id]);

  const loadBudgetData = useCallback(async (budgetId: string) => {
    try {
      // Fetch categories for this budget
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('marketing_categories')
        .select('*')
        .eq('budget_id', budgetId)
        .order('sort_order', { ascending: true });

      if (categoriesError) throw categoriesError;

      const mappedCategories = (categoriesData || []).map(mapCategory);
      setCategories(mappedCategories);

      const categoryIds = mappedCategories.map(c => c.id);

      if (categoryIds.length > 0) {
        // Fetch monthly plans for these categories
        const { data: plansData, error: plansError } = await supabase
          .from('marketing_monthly_plans')
          .select('*')
          .in('category_id', categoryIds);

        if (plansError) throw plansError;

        const mappedPlans = (plansData || []).map(mapMonthlyPlan);
        setMonthlyPlans(mappedPlans);

        const planIds = mappedPlans.map(p => p.id);

        if (planIds.length > 0) {
          // Fetch movements and expenses
          const [movementsRes, expensesRes] = await Promise.all([
            supabase
              .from('budget_movements')
              .select('*')
              .or(`from_plan_id.in.(${planIds.join(',')}),to_plan_id.in.(${planIds.join(',')})`)
              .order('created_at', { ascending: false }),
            supabase
              .from('marketing_expenses')
              .select('*')
              .in('monthly_plan_id', planIds)
              .order('date', { ascending: false }),
          ]);

          if (movementsRes.error) throw movementsRes.error;
          if (expensesRes.error) throw expensesRes.error;

          setMovements((movementsRes.data || []).map(mapMovement));
          setExpenses((expensesRes.data || []).map(mapExpense));
        } else {
          setMovements([]);
          setExpenses([]);
        }
      } else {
        setMonthlyPlans([]);
        setMovements([]);
        setExpenses([]);
      }
    } catch (error) {
      console.error('Error loading budget data:', error);
      toast.error('Error al cargar datos del presupuesto');
    }
  }, []);

  // Initial data load
  useEffect(() => {
    if (isAuthInitialized && !isAgencyLoading && currentAgency?.id) {
      fetchData();
    }
  }, [isAuthInitialized, isAgencyLoading, currentAgency?.id, fetchData]);

  // ============================================
  // Budget CRUD
  // ============================================

  const createBudget = useCallback(async (data: CreateBudgetForm): Promise<MarketingBudget | null> => {
    if (!currentAgency?.id) {
      toast.error('No hay agencia seleccionada');
      return null;
    }

    const { data: newBudget, error } = await supabase
      .from('marketing_budgets')
      .insert({
        agency_id: currentAgency.id,
        year: data.year,
        total_budget: data.totalBudget,
        status: 'planning',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating budget:', error);
      toast.error('Error al crear presupuesto');
      return null;
    }

    const mapped = mapBudget(newBudget);
    setBudgets(prev => [mapped, ...prev]);
    setCurrentBudget(mapped);
    toast.success('Presupuesto creado correctamente');
    return mapped;
  }, [currentAgency?.id]);

  const updateBudget = useCallback(async (id: string, data: Partial<MarketingBudget>) => {
    const { error } = await supabase
      .from('marketing_budgets')
      .update({
        total_budget: data.totalBudget,
        status: data.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating budget:', error);
      toast.error('Error al actualizar presupuesto');
      return;
    }

    setBudgets(prev => prev.map(b => b.id === id ? { ...b, ...data } : b));
    if (currentBudget?.id === id) {
      setCurrentBudget(prev => prev ? { ...prev, ...data } : null);
    }
    toast.success('Presupuesto actualizado');
  }, [currentBudget?.id]);

  const deleteBudget = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('marketing_budgets')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting budget:', error);
      toast.error('Error al eliminar presupuesto');
      return;
    }

    setBudgets(prev => prev.filter(b => b.id !== id));
    if (currentBudget?.id === id) {
      setCurrentBudget(budgets.find(b => b.id !== id) || null);
    }
    toast.success('Presupuesto eliminado');
  }, [currentBudget?.id, budgets]);

  const selectBudget = useCallback((budget: MarketingBudget | null) => {
    setCurrentBudget(budget);
    if (budget) {
      loadBudgetData(budget.id);
    } else {
      setCategories([]);
      setMonthlyPlans([]);
      setMovements([]);
      setExpenses([]);
    }
  }, [loadBudgetData]);

  // ============================================
  // Category CRUD
  // ============================================

  const createCategory = useCallback(async (data: CreateCategoryForm): Promise<MarketingCategory | null> => {
    const maxOrder = categories
      .filter(c => c.parentId === (data.parentId || null))
      .reduce((max, c) => Math.max(max, (c as MarketingCategory & { sortOrder?: number }).sortOrder || 0), -1);

    const { data: newCategory, error } = await supabase
      .from('marketing_categories')
      .insert({
        budget_id: data.budgetId,
        parent_id: data.parentId || null,
        name: data.name,
        kpi_name: data.kpiName || null,
        kpi_target_cost: data.kpiTargetCost || null,
        allowed_employees: data.allowedEmployees || [],
        sort_order: maxOrder + 1,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating category:', error);
      toast.error('Error al crear categoria');
      return null;
    }

    const mapped = mapCategory(newCategory);
    setCategories(prev => [...prev, mapped]);
    toast.success('Categoria creada correctamente');
    return mapped;
  }, [categories]);

  const updateCategory = useCallback(async (id: string, data: Partial<MarketingCategory>) => {
    const { error } = await supabase
      .from('marketing_categories')
      .update({
        name: data.name,
        kpi_name: data.kpiName,
        kpi_target_cost: data.kpiTargetCost,
        allowed_employees: data.allowedEmployees,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating category:', error);
      toast.error('Error al actualizar categoria');
      return;
    }

    setCategories(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
    toast.success('Categoria actualizada');
  }, []);

  const deleteCategory = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('marketing_categories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting category:', error);
      toast.error('Error al eliminar categoria');
      return;
    }

    // Remove category and its children
    const idsToRemove = new Set<string>();
    const collectIds = (parentId: string) => {
      idsToRemove.add(parentId);
      categories.filter(c => c.parentId === parentId).forEach(c => collectIds(c.id));
    };
    collectIds(id);

    setCategories(prev => prev.filter(c => !idsToRemove.has(c.id)));
    setMonthlyPlans(prev => prev.filter(p => !idsToRemove.has(p.categoryId)));
    toast.success('Categoria eliminada');
  }, [categories]);

  const reorderCategories = useCallback(async (categoryId: string, newOrder: number) => {
    const { error } = await supabase
      .from('marketing_categories')
      .update({ sort_order: newOrder })
      .eq('id', categoryId);

    if (error) {
      console.error('Error reordering category:', error);
      return;
    }

    setCategories(prev => prev.map(c =>
      c.id === categoryId ? { ...c } : c
    ).sort((a, b) => {
      // Sort by sort_order within same parent
      if (a.parentId === b.parentId) {
        return 0; // Simplified - could be improved
      }
      return 0;
    }));
  }, []);

  // ============================================
  // Monthly Plans
  // ============================================

  const getOrCreateMonthlyPlan = useCallback(async (categoryId: string, month: string): Promise<MarketingMonthlyPlan | null> => {
    // Check if plan already exists
    const existing = monthlyPlans.find(p => p.categoryId === categoryId && p.month === month);
    if (existing) return existing;

    // Create new plan
    const { data, error } = await supabase
      .from('marketing_monthly_plans')
      .insert({
        category_id: categoryId,
        month: month,
        budget_allocated: 0,
        real_spent: 0,
        manual_result_value: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating monthly plan:', error);
      toast.error('Error al crear plan mensual');
      return null;
    }

    const mapped = mapMonthlyPlan(data);
    setMonthlyPlans(prev => [...prev, mapped]);
    return mapped;
  }, [monthlyPlans]);

  const updateResults = useCallback(async (planId: string, data: UpdateResultsForm) => {
    const { error } = await supabase
      .from('marketing_monthly_plans')
      .update({
        manual_result_value: data.manualResultValue,
        manual_result_notes: data.manualResultNotes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', planId);

    if (error) {
      console.error('Error updating results:', error);
      toast.error('Error al actualizar resultados');
      return;
    }

    setMonthlyPlans(prev => prev.map(p =>
      p.id === planId ? { ...p, manualResultValue: data.manualResultValue, manualResultNotes: data.manualResultNotes } : p
    ));
    toast.success('Resultados actualizados');
  }, []);

  // ============================================
  // Movements (Transfers)
  // ============================================

  const createMovement = useCallback(async (data: CreateMovementForm): Promise<BudgetMovement | null> => {
    if (!currentUser?.id) {
      toast.error('Usuario no autenticado');
      return null;
    }

    const { data: newMovement, error } = await supabase
      .from('budget_movements')
      .insert({
        created_by: currentUser.id,
        amount: data.amount,
        from_plan_id: data.fromPlanId || null,
        to_plan_id: data.toPlanId || null,
        type: data.type,
        description: data.description,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating movement:', error);
      toast.error('Error al crear movimiento');
      return null;
    }

    const mapped = mapMovement(newMovement);
    setMovements(prev => [mapped, ...prev]);

    // Refresh monthly plans to get updated budget_allocated values
    if (currentBudget) {
      await loadBudgetData(currentBudget.id);
    }

    toast.success('Movimiento registrado correctamente');
    return mapped;
  }, [currentUser?.id, currentBudget, loadBudgetData]);

  const getMovementsForPlan = useCallback((planId: string): BudgetMovement[] => {
    return movements.filter(m => m.fromPlanId === planId || m.toPlanId === planId);
  }, [movements]);

  // ============================================
  // Expenses
  // ============================================

  const createExpense = useCallback(async (data: CreateExpenseForm): Promise<MarketingExpense | null> => {
    const { data: newExpense, error } = await supabase
      .from('marketing_expenses')
      .insert({
        monthly_plan_id: data.monthlyPlanId,
        amount: data.amount,
        concept: data.concept || null,
        date: data.date || null,
        is_estimated: data.isEstimated || false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating expense:', error);
      toast.error('Error al crear gasto');
      return null;
    }

    const mapped = mapExpense(newExpense);
    setExpenses(prev => [mapped, ...prev]);

    // Update the monthly plan's real_spent (trigger handles this in DB, but we update local state)
    setMonthlyPlans(prev => prev.map(p =>
      p.id === data.monthlyPlanId ? { ...p, realSpent: p.realSpent + data.amount } : p
    ));

    toast.success('Gasto registrado');
    return mapped;
  }, []);

  const updateExpense = useCallback(async (id: string, data: Partial<MarketingExpense>) => {
    const oldExpense = expenses.find(e => e.id === id);
    if (!oldExpense) return;

    const { error } = await supabase
      .from('marketing_expenses')
      .update({
        amount: data.amount,
        concept: data.concept,
        date: data.date,
        is_estimated: data.isEstimated,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating expense:', error);
      toast.error('Error al actualizar gasto');
      return;
    }

    setExpenses(prev => prev.map(e => e.id === id ? { ...e, ...data } : e));

    // Update monthly plan's real_spent if amount changed
    if (data.amount !== undefined && data.amount !== oldExpense.amount) {
      const diff = data.amount - oldExpense.amount;
      setMonthlyPlans(prev => prev.map(p =>
        p.id === oldExpense.monthlyPlanId ? { ...p, realSpent: p.realSpent + diff } : p
      ));
    }

    toast.success('Gasto actualizado');
  }, [expenses]);

  const deleteExpense = useCallback(async (id: string) => {
    const expense = expenses.find(e => e.id === id);
    if (!expense) return;

    const { error } = await supabase
      .from('marketing_expenses')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting expense:', error);
      toast.error('Error al eliminar gasto');
      return;
    }

    setExpenses(prev => prev.filter(e => e.id !== id));

    // Update monthly plan's real_spent
    setMonthlyPlans(prev => prev.map(p =>
      p.id === expense.monthlyPlanId ? { ...p, realSpent: p.realSpent - expense.amount } : p
    ));

    toast.success('Gasto eliminado');
  }, [expenses]);

  const getExpensesForPlan = useCallback((planId: string): MarketingExpense[] => {
    return expenses.filter(e => e.monthlyPlanId === planId);
  }, [expenses]);

  // ============================================
  // Calculations
  // ============================================

  const getBudgetSummary = useCallback((): BudgetSummary => {
    if (!currentBudget) {
      return {
        totalBudget: 0,
        totalAllocated: 0,
        totalSpent: 0,
        totalRemaining: 0,
        totalUnspent: 0,
        utilizationRate: 0,
        executionRate: 0,
      };
    }

    const totalAllocated = monthlyPlans.reduce((sum, p) => sum + p.budgetAllocated, 0);
    const totalSpent = monthlyPlans.reduce((sum, p) => sum + p.realSpent, 0);

    return {
      totalBudget: currentBudget.totalBudget,
      totalAllocated,
      totalSpent,
      totalRemaining: currentBudget.totalBudget - totalAllocated,
      totalUnspent: totalAllocated - totalSpent,
      utilizationRate: currentBudget.totalBudget > 0 ? (totalAllocated / currentBudget.totalBudget) * 100 : 0,
      executionRate: totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0,
    };
  }, [currentBudget, monthlyPlans]);

  const getCategoryTree = useCallback((): MarketingCategory[] => {
    // Build tree structure from flat list
    const rootCategories = categories.filter(c => !c.parentId);

    const buildTree = (parent: MarketingCategory, level: number): MarketingCategory => {
      const children = categories
        .filter(c => c.parentId === parent.id)
        .map(c => buildTree(c, level + 1));

      return {
        ...parent,
        children,
        level,
      };
    };

    return rootCategories.map(c => buildTree(c, 0));
  }, [categories]);

  const getMonthlyPlanForCategory = useCallback((categoryId: string, month: string): MarketingMonthlyPlan | undefined => {
    return monthlyPlans.find(p => p.categoryId === categoryId && p.month === month);
  }, [monthlyPlans]);

  const hasRemainder = useCallback((planId: string): { hasRemainder: boolean; amount: number } => {
    const plan = monthlyPlans.find(p => p.id === planId);
    if (!plan) return { hasRemainder: false, amount: 0 };

    const planMonth = new Date(plan.month);
    const now = new Date();

    // Check if month has passed
    if (planMonth >= new Date(now.getFullYear(), now.getMonth(), 1)) {
      return { hasRemainder: false, amount: 0 };
    }

    const remainder = plan.budgetAllocated - plan.realSpent;
    return {
      hasRemainder: remainder > 0,
      amount: Math.max(0, remainder),
    };
  }, [monthlyPlans]);

  // ============================================
  // Context Value
  // ============================================

  const value = useMemo(() => ({
    // State
    budgets,
    currentBudget,
    categories,
    monthlyPlans,
    movements,
    expenses,
    isLoading,

    // Budget CRUD
    createBudget,
    updateBudget,
    deleteBudget,
    selectBudget,

    // Category CRUD
    createCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,

    // Monthly Plans
    getOrCreateMonthlyPlan,
    updateResults,

    // Movements
    createMovement,
    getMovementsForPlan,

    // Expenses
    createExpense,
    updateExpense,
    deleteExpense,
    getExpensesForPlan,

    // Calculations
    getBudgetSummary,
    getCategoryTree,
    getMonthlyPlanForCategory,
    hasRemainder,

    // Refresh
    refreshData: fetchData,
  }), [
    budgets, currentBudget, categories, monthlyPlans, movements, expenses, isLoading,
    createBudget, updateBudget, deleteBudget, selectBudget,
    createCategory, updateCategory, deleteCategory, reorderCategories,
    getOrCreateMonthlyPlan, updateResults,
    createMovement, getMovementsForPlan,
    createExpense, updateExpense, deleteExpense, getExpensesForPlan,
    getBudgetSummary, getCategoryTree, getMonthlyPlanForCategory, hasRemainder,
    fetchData,
  ]);

  return <MarketingContext.Provider value={value}>{children}</MarketingContext.Provider>;
}

// ============================================
// Hook
// ============================================

export function useMarketing() {
  const context = useContext(MarketingContext);
  if (!context) {
    throw new Error('useMarketing must be used within a MarketingProvider');
  }
  return context;
}
