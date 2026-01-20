import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useMarketing } from '@/contexts/MarketingContext';
import { MarketingCategory, MarketingMonthlyPlan } from '@/types/marketing';
import { format, addMonths, startOfYear } from 'date-fns';
import { es } from 'date-fns/locale';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ChevronRight,
  ChevronDown,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  FolderPlus,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Euro,
} from 'lucide-react';
import { cn } from '@/lib/utils';

import { TransferModal } from './TransferModal';
import { ExpensesModal } from './ExpensesModal';

interface MonthData {
  date: Date;
  key: string;
  label: string;
  fullLabel: string;
}

interface QuickAddDialogState {
  open: boolean;
  parentId: string | null;
  parentName: string;
}

type ViewMode = 'monthly' | 'quarterly' | 'annual';

interface QuarterData {
  quarter: string; // Q1, Q2, Q3, Q4
  months: MonthData[];
  label: string;
}

export function MarketingMatrix() {
  const {
    currentBudget,
    categories,
    monthlyPlans,
    getCategoryTree,
    getMonthlyPlanForCategory,
    hasRemainder,
    createCategory,
    updateCategory,
    deleteCategory,
    getBudgetSummary,
    updateBudget,
    getRealSpentForPlan,
    getEstimatedForPlan,
  } = useMarketing();

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [quickAddDialog, setQuickAddDialog] = useState<QuickAddDialogState>({
    open: false,
    parentId: null,
    parentName: ''
  });
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const [transferModal, setTransferModal] = useState<{
    open: boolean;
    fromPlanId?: string;
    categoryId?: string;
    month?: string;
  }>({ open: false });

  const [expensesModal, setExpensesModal] = useState<{
    open: boolean;
    planId?: string;
    categoryName?: string;
    month?: string;
  }>({ open: false });

  // Budget editing state
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [editBudgetValue, setEditBudgetValue] = useState('');

  // View mode state
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');

  // Category Budget Editing
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editCategoryBudget, setEditCategoryBudget] = useState('');

  const handleEditCategoryBudget = (category: MarketingCategory) => {
    setEditingCategoryId(category.id);
    setEditCategoryBudget(category.assignedBudget?.toString() || '');
  };

  const handleSaveCategoryBudget = async (category: MarketingCategory) => {
    const newValue = parseFloat(editCategoryBudget);
    // Allow empty string to reset the budget (or set to 0)
    // If invalid number but not empty, ignore
    if (isNaN(newValue) && editCategoryBudget !== '') return;

    await updateCategory(category.id, {
      assignedBudget: editCategoryBudget === '' ? undefined : newValue
    });
    setEditingCategoryId(null);
  };

  const summary = getBudgetSummary();

  // Generate months for the year
  const months: MonthData[] = useMemo(() => {
    if (!currentBudget) return [];
    const yearStart = startOfYear(new Date(currentBudget.year, 0, 1));
    return Array.from({ length: 12 }, (_, i) => {
      const date = addMonths(yearStart, i);
      return {
        date,
        key: format(date, 'yyyy-MM-dd'),
        label: format(date, 'MMM', { locale: es }),
        fullLabel: format(date, 'MMMM yyyy', { locale: es }),
      };
    });
  }, [currentBudget]);

  // Generate quarters for quarterly view
  const quarters: QuarterData[] = useMemo(() => {
    if (months.length === 0) return [];
    return [
      { quarter: 'Q1', label: 'Ene - Mar', months: months.slice(0, 3) },
      { quarter: 'Q2', label: 'Abr - Jun', months: months.slice(3, 6) },
      { quarter: 'Q3', label: 'Jul - Sep', months: months.slice(6, 9) },
      { quarter: 'Q4', label: 'Oct - Dic', months: months.slice(9, 12) },
    ];
  }, [months]);

  const categoryTree = getCategoryTree();

  // Track if we've done initial expansion
  const hasInitializedRef = useRef(false);

  // Expand all categories by default for better visibility - only once
  useEffect(() => {
    if (categoryTree.length > 0 && !hasInitializedRef.current) {
      hasInitializedRef.current = true;
      const allIds = new Set<string>();
      const collectIds = (cats: MarketingCategory[]) => {
        cats.forEach(c => {
          if (c.children && c.children.length > 0) {
            allIds.add(c.id);
            collectIds(c.children);
          }
        });
      };
      collectIds(categoryTree);
      setExpandedCategories(allIds);
    }
  }, [categoryTree]);

  const toggleExpanded = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  // Calculate totals for a category (including children)
  // Uses getRealSpentForPlan to exclude estimated expenses (fixes 45+49=94 bug)
  const getCategoryTotals = useCallback((category: MarketingCategory) => {
    let totalEstimated = 0;
    let totalSpent = 0;

    months.forEach(month => {
      const plan = getMonthlyPlanForCategory(category.id, month.key);
      if (plan) {
        totalEstimated += plan.budgetAllocated;
        // Use getRealSpentForPlan instead of plan.realSpent to exclude estimated expenses
        totalSpent += getRealSpentForPlan(plan.id);
      }
    });

    if (category.children) {
      category.children.forEach(child => {
        const childTotals = getCategoryTotals(child);
        totalEstimated += childTotals.totalEstimated;
        totalSpent += childTotals.totalSpent;
      });
    }

    // If assigned budget exists, use it as the base for remainder. Otherwise use total estimated (sum of months).
    const budgetBase = (category.assignedBudget && category.assignedBudget > 0) ? category.assignedBudget : totalEstimated;

    return {
      totalEstimated,
      totalSpent,
      assignedBudget: category.assignedBudget || 0,
      unallocated: (category.assignedBudget && category.assignedBudget > 0) ? (category.assignedBudget - totalEstimated) : 0,
      remainder: budgetBase - totalSpent,
      variance: totalEstimated > 0 ? ((totalSpent / totalEstimated) * 100) : 0
    };
  }, [months, getMonthlyPlanForCategory, getRealSpentForPlan]);

  // Get totals for a category for a specific quarter
  const getQuarterTotals = useCallback((category: MarketingCategory, quarter: QuarterData) => {
    let estimated = 0;
    let spent = 0;

    quarter.months.forEach(month => {
      const plan = getMonthlyPlanForCategory(category.id, month.key);
      if (plan) {
        estimated += plan.budgetAllocated;
        // Use getRealSpentForPlan instead of plan.realSpent
        spent += getRealSpentForPlan(plan.id);
      }
    });

    // Include children
    if (category.children) {
      category.children.forEach(child => {
        const childTotals = getQuarterTotals(child, quarter);
        estimated += childTotals.estimated;
        spent += childTotals.spent;
      });
    }

    return { estimated, spent, remainder: estimated - spent };
  }, [getMonthlyPlanForCategory, getRealSpentForPlan]);

  const handleQuickAdd = async () => {
    if (!currentBudget || !newCategoryName.trim()) return;

    setIsCreating(true);
    try {
      await createCategory({
        budgetId: currentBudget.id,
        parentId: quickAddDialog.parentId || undefined,
        name: newCategoryName.trim(),
      });
      setQuickAddDialog({ open: false, parentId: null, parentName: '' });
      setNewCategoryName('');
    } finally {
      setIsCreating(false);
    }
  };

  const openTransferModal = (categoryId: string, month: string, fromPlanId?: string) => {
    setTransferModal({ open: true, categoryId, month, fromPlanId });
  };

  const openExpensesModal = (planId: string, categoryName: string, month: string) => {
    setExpensesModal({ open: true, planId, categoryName, month });
  };

  const handleEditBudget = () => {
    setEditBudgetValue(summary.totalBudget.toString());
    setIsEditingBudget(true);
  };

  const handleSaveBudget = async () => {
    if (!currentBudget) return;
    const newValue = parseFloat(editBudgetValue);
    if (isNaN(newValue) || newValue <= 0) return;

    await updateBudget(currentBudget.id, { totalBudget: newValue });
    setIsEditingBudget(false);
  };

  // Get trend indicator
  const getTrendIndicator = (estimated: number, spent: number) => {
    if (estimated === 0 && spent === 0) return null;
    if (spent > estimated) {
      return <TrendingUp className="h-3 w-3 text-red-500" />;
    } else if (spent < estimated * 0.5 && estimated > 0) {
      return <TrendingDown className="h-3 w-3 text-amber-500" />;
    }
    return <Minus className="h-3 w-3 text-green-500" />;
  };

  // Render a single month cell
  const renderMonthCell = (category: MarketingCategory, month: MonthData) => {
    const plan = getMonthlyPlanForCategory(category.id, month.key);
    const estimated = plan?.budgetAllocated ?? 0;
    // Use getRealSpentForPlan to exclude estimated expenses
    const spent = plan ? getRealSpentForPlan(plan.id) : 0;
    const remainderInfo = plan ? hasRemainder(plan.id) : { hasRemainder: false, amount: 0 };

    const hasData = estimated > 0 || spent > 0;
    const isOverBudget = spent > estimated && estimated > 0;

    return (
      <div key={`${category.id}-${month.key}`} className="flex border-r min-w-[100px]">
        {/* Estimated */}
        <button
          onClick={() => openTransferModal(category.id, month.key, plan?.id)}
          className={cn(
            "w-[50px] px-1 py-1.5 text-right border-r border-dashed transition-colors text-xs",
            "hover:bg-blue-50 focus:bg-blue-100 focus:outline-none",
            !hasData && "text-slate-300"
          )}
          title={`Asignar presupuesto - ${month.fullLabel}`}
        >
          {estimated > 0 ? estimated.toLocaleString('es-ES') : '-'}
        </button>

        {/* Spent */}
        <button
          onClick={() => plan && openExpensesModal(plan.id, category.name, month.fullLabel)}
          disabled={!hasData}
          className={cn(
            "w-[50px] px-1 py-1.5 text-right transition-colors text-xs",
            hasData && "hover:bg-green-50 cursor-pointer",
            isOverBudget ? "text-red-600 font-medium" :
              spent > 0 ? "text-green-700" : "text-slate-300"
          )}
          title={`Ver gastos - ${month.fullLabel}`}
        >
          <div className="flex items-center justify-end gap-0.5">
            {spent > 0 ? spent.toLocaleString('es-ES') : '-'}
            {remainderInfo.hasRemainder && (
              <AlertTriangle className="h-2.5 w-2.5 text-amber-500" />
            )}
          </div>
        </button>
      </div>
    );
  };

  const renderCategoryRow = (category: MarketingCategory, level: number = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedCategories.has(category.id);
    const totals = getCategoryTotals(category);
    const isLeaf = !hasChildren;

    return (
      <div key={category.id}>
        {/* Row */}
        <div className={cn(
          "flex border-b group hover:bg-slate-50/50",
          level === 0 && "bg-gradient-to-r from-emerald-50 to-white"
        )}>
          {/* Category Name (Fixed) */}
          <div
            className={cn(
              "min-w-[200px] w-[200px] sticky left-0 z-10 border-r flex items-center gap-1 py-1.5 px-2",
              level === 0 ? "bg-gradient-to-r from-emerald-50 to-emerald-50/50" : "bg-white group-hover:bg-slate-50/50"
            )}
            style={{ paddingLeft: `${8 + level * 16}px` }}
          >
            {/* Expand/Collapse */}
            {hasChildren ? (
              <button
                onClick={() => toggleExpanded(category.id)}
                className="p-0.5 rounded hover:bg-slate-200 flex-shrink-0"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-slate-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-slate-500" />
                )}
              </button>
            ) : (
              <div className="w-5 flex-shrink-0" />
            )}

            {/* Name */}
            <span className={cn(
              "truncate flex-1 text-sm",
              level === 0 ? "font-semibold text-emerald-900" : "text-slate-700"
            )}>
              {category.name}
            </span>

            {/* Quick Actions */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 flex-shrink-0">
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setQuickAddDialog({
                        open: true,
                        parentId: category.id,
                        parentName: category.name
                      })}
                    >
                      <FolderPlus className="h-3.5 w-3.5 text-emerald-600" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Añadir subcategoría</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    className="text-red-600"
                    onClick={() => deleteCategory(category.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Assigned Budget (Editable) */}
          <div
            className="w-[80px] border-r px-2 py-1.5 text-right bg-purple-50/50 group/budget cursor-pointer hover:bg-purple-100/50 transition-colors"
            onClick={() => handleEditCategoryBudget(category)}
          >
            {editingCategoryId === category.id ? (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  className="w-full text-xs p-1 h-6 border rounded"
                  value={editCategoryBudget}
                  onChange={(e) => setEditCategoryBudget(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveCategoryBudget(category);
                    if (e.key === 'Escape') setEditingCategoryId(null);
                  }}
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            ) : (
              <span className={cn(
                "text-sm font-medium",
                category.assignedBudget ? "text-purple-700" : "text-slate-400"
              )}>
                {category.assignedBudget ? category.assignedBudget.toLocaleString('es-ES') : '-'}
              </span>
            )}
          </div>

          {/* Total Estimated */}
          <div className="w-[80px] border-r px-2 py-1.5 text-right bg-blue-50/50">
            <span className="text-sm font-medium text-blue-900">
              {totals.totalEstimated > 0 ? totals.totalEstimated.toLocaleString('es-ES') : '-'}
            </span>
          </div>

          {/* Total Spent */}
          <div className={cn(
            "w-[80px] border-r px-2 py-1.5 text-right",
            totals.totalSpent > totals.totalEstimated && totals.totalEstimated > 0
              ? "bg-red-50"
              : "bg-green-50/50"
          )}>
            <span className={cn(
              "text-sm font-medium",
              totals.totalSpent > totals.totalEstimated && totals.totalEstimated > 0
                ? "text-red-700"
                : "text-green-700"
            )}>
              {totals.totalSpent > 0 ? totals.totalSpent.toLocaleString('es-ES') : '-'}
            </span>
          </div>

          {/* Remainder with trend */}
          <div className={cn(
            "w-[80px] border-r px-2 py-1.5 text-right flex items-center justify-end gap-1",
            totals.remainder < 0 ? "bg-red-100" :
              totals.remainder > 0 ? "bg-amber-50/50" : "bg-slate-50"
          )}>
            {getTrendIndicator(totals.totalEstimated, totals.totalSpent)}
            <span className={cn(
              "text-sm font-medium",
              totals.remainder < 0 ? "text-red-700" :
                totals.remainder > 0 ? "text-amber-700" : "text-slate-400"
            )}>
              {totals.totalEstimated > 0 || totals.totalSpent > 0
                ? totals.remainder.toLocaleString('es-ES')
                : '-'}
            </span>
          </div>

          {/* Monthly Cells */}
          {months.map(month => renderMonthCell(category, month))}
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div>
            {category.children!.map(child => renderCategoryRow(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (!currentBudget) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Selecciona un presupuesto para ver la matriz de control.
        </CardContent>
      </Card>
    );
  }

  if (categoryTree.length === 0) {
    return (
      <>
        <Card>
          <CardContent className="py-12 text-center">
            <FolderPlus className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            <p className="text-muted-foreground mb-4">No hay categorías configuradas.</p>
            <Button
              onClick={() => setQuickAddDialog({ open: true, parentId: null, parentName: '' })}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Crear primera categoría
            </Button>
          </CardContent>
        </Card>

        {/* Quick Add Dialog - must be rendered here too */}
        <Dialog open={quickAddDialog.open} onOpenChange={(open) => setQuickAddDialog(prev => ({ ...prev, open }))}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Nueva categoría</DialogTitle>
              <DialogDescription>
                Crear una categoría principal (ej: SEM, Social, Display)
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="cat-name-empty">Nombre</Label>
              <Input
                id="cat-name-empty"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Ej: SEM, Social Ads..."
                className="mt-2"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleQuickAdd()}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setQuickAddDialog({ open: false, parentId: null, parentName: '' })}>
                Cancelar
              </Button>
              <Button onClick={handleQuickAdd} disabled={!newCategoryName.trim() || isCreating}>
                {isCreating ? 'Creando...' : 'Crear'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Header - Editable Budget */}
      <div className="grid grid-cols-4 gap-3">
        <Card className="shadow-sm cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => !isEditingBudget && handleEditBudget()}>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Presupuesto Total</p>
              <Pencil className="h-3 w-3 text-slate-400" />
            </div>
            {isEditingBudget ? (
              <div className="flex items-center gap-1 mt-1">
                <Input
                  type="number"
                  value={editBudgetValue}
                  onChange={(e) => setEditBudgetValue(e.target.value)}
                  className="h-7 text-lg font-bold"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveBudget();
                    if (e.key === 'Escape') setIsEditingBudget(false);
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
                <Button size="sm" className="h-7 px-2" onClick={(e) => { e.stopPropagation(); handleSaveBudget(); }}>
                  ✓
                </Button>
              </div>
            ) : (
              <p className="text-lg font-bold">{summary.totalBudget.toLocaleString('es-ES')} €</p>
            )}
          </CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-blue-500">
          <CardContent className="p-3">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Estimado</p>
            <p className="text-lg font-bold text-blue-700">{summary.totalAllocated.toLocaleString('es-ES')} €</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-green-500">
          <CardContent className="p-3">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Invertido</p>
            <p className={cn("text-lg font-bold", summary.totalSpent > summary.totalAllocated ? "text-red-600" : "text-green-600")}>
              {summary.totalSpent.toLocaleString('es-ES')} €
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-amber-500">
          <CardContent className="p-3">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Disponible</p>
            <p className={cn("text-lg font-bold", summary.totalRemaining < 0 ? "text-red-600" : "text-amber-600")}>
              {summary.totalRemaining.toLocaleString('es-ES')} €
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Matrix Table */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              Control de Inversión - {currentBudget.year}
            </CardTitle>
            <div className="flex items-center gap-2">
              {/* View Toggle */}
              <div className="flex rounded-lg border overflow-hidden">
                <Button
                  variant={viewMode === 'monthly' ? 'default' : 'ghost'}
                  size="sm"
                  className="rounded-none h-7 text-xs"
                  onClick={() => setViewMode('monthly')}
                >
                  Mensual
                </Button>
                <Button
                  variant={viewMode === 'quarterly' ? 'default' : 'ghost'}
                  size="sm"
                  className="rounded-none h-7 text-xs border-l"
                  onClick={() => setViewMode('quarterly')}
                >
                  Trimestral
                </Button>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setQuickAddDialog({ open: true, parentId: null, parentName: '' })}
                className="gap-1 h-7"
              >
                <Plus className="h-3.5 w-3.5" />
                Nueva categoría
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {viewMode === 'monthly' ? (
            // MONTHLY VIEW
            <ScrollArea className="w-full">
              <div className="min-w-max">
                {/* Header */}
                <div className="flex border-b bg-slate-100 sticky top-0 z-20 text-xs font-medium">
                  <div className="min-w-[200px] w-[200px] sticky left-0 bg-slate-100 z-30 border-r px-2 py-2">
                    Categoría
                  </div>
                  <div className="w-[80px] border-r px-2 py-2 text-center bg-purple-100/50">
                    Pres. Asig.
                  </div>
                  <div className="w-[80px] border-r px-2 py-2 text-center bg-blue-100/50">
                    Total Est.
                  </div>
                  <div className="w-[80px] border-r px-2 py-2 text-center bg-green-100/50">
                    Total Inv.
                  </div>
                  <div className="w-[80px] border-r px-2 py-2 text-center bg-amber-100/50">
                    Disponible
                  </div>
                  {months.map(month => (
                    <div key={month.key} className="flex border-r min-w-[100px]">
                      <div className="w-[50px] px-1 py-2 text-center border-r border-dashed text-[10px] uppercase bg-blue-50/30">
                        Est
                      </div>
                      <div className="w-[50px] px-1 py-2 text-center text-[10px] uppercase bg-green-50/30">
                        Inv
                      </div>
                    </div>
                  ))}
                </div>

                {/* Month labels row */}
                <div className="flex border-b bg-slate-50 text-[10px] text-slate-500">
                  <div className="min-w-[200px] w-[200px] sticky left-0 bg-slate-50 z-10 border-r" />
                  <div className="w-[80px] border-r" />
                  <div className="w-[80px] border-r" />
                  <div className="w-[80px] border-r" />
                  <div className="w-[80px] border-r" />
                  {months.map(month => (
                    <div key={month.key} className="min-w-[100px] px-2 py-1 text-center border-r capitalize font-medium">
                      {month.label}
                    </div>
                  ))}
                </div>

                {/* Body */}
                <div>
                  {categoryTree.map(category => renderCategoryRow(category))}
                </div>

                {/* Totals Row */}
                <div className="flex border-t-2 border-slate-300 bg-gradient-to-r from-slate-200 to-slate-100 font-semibold text-sm">
                  <div className="min-w-[200px] w-[200px] sticky left-0 bg-slate-200 z-10 border-r px-2 py-2">
                    TOTAL
                  </div>
                  <div className="w-[80px] border-r px-2 py-2 text-right bg-blue-200/50">
                    {summary.totalAllocated.toLocaleString('es-ES')}
                  </div>
                  <div className="w-[80px] border-r px-2 py-2 text-right bg-green-200/50">
                    {summary.totalSpent.toLocaleString('es-ES')}
                  </div>
                  <div className="w-[80px] border-r px-2 py-2 text-right bg-amber-200/50">
                    {summary.totalRemaining.toLocaleString('es-ES')}
                  </div>
                  {months.map(month => {
                    const monthPlans = monthlyPlans.filter(p => p.month === month.key);
                    const monthEst = monthPlans.reduce((sum, p) => sum + p.budgetAllocated, 0);
                    const monthSpent = monthPlans.reduce((sum, p) => sum + p.realSpent, 0);
                    return (
                      <div key={month.key} className="flex border-r min-w-[100px]">
                        <div className="w-[50px] px-1 py-2 text-right text-xs border-r border-dashed bg-blue-100/30">
                          {monthEst > 0 ? monthEst.toLocaleString('es-ES') : '-'}
                        </div>
                        <div className="w-[50px] px-1 py-2 text-right text-xs bg-green-100/30">
                          {monthSpent > 0 ? monthSpent.toLocaleString('es-ES') : '-'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          ) : (
            // QUARTERLY VIEW - Cards like the Excel
            <div className="p-4">
              <div className="grid grid-cols-2 gap-4">
                {quarters.map(quarter => {
                  const quarterPlans = monthlyPlans.filter(p =>
                    quarter.months.some(m => m.key === p.month)
                  );
                  const quarterEst = quarterPlans.reduce((sum, p) => sum + p.budgetAllocated, 0);
                  const quarterSpent = quarterPlans.reduce((sum, p) => sum + p.realSpent, 0);

                  return (
                    <Card key={quarter.quarter} className="border-2 border-cyan-200 bg-gradient-to-br from-cyan-50 to-white">
                      <CardHeader className="pb-2 pt-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-2xl font-bold text-cyan-800">{quarter.quarter}</CardTitle>
                            <p className="text-sm text-muted-foreground">{quarter.label}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-slate-800">
                              {quarterEst.toLocaleString('es-ES')} €
                            </p>
                            {quarterSpent > 0 && (
                              <p className={cn(
                                "text-sm font-medium",
                                quarterSpent > quarterEst ? "text-red-600" : "text-green-600"
                              )}>
                                Invertido: {quarterSpent.toLocaleString('es-ES')} €
                              </p>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-1.5 text-sm">
                          {categoryTree.map(cat => {
                            const catTotals = getQuarterTotals(cat, quarter);
                            if (catTotals.estimated === 0 && catTotals.spent === 0) return null;
                            return (
                              <div key={cat.id} className="flex items-start gap-2">
                                <span className="font-medium text-slate-700">{cat.name}</span>
                                <span className="text-slate-400">({catTotals.estimated.toLocaleString('es-ES')} €)</span>
                                {cat.children && cat.children.length > 0 && (
                                  <ul className="ml-4 text-xs text-slate-600">
                                    {cat.children.map(child => {
                                      const childTotals = getQuarterTotals(child, quarter);
                                      if (childTotals.estimated === 0) return null;
                                      return (
                                        <li key={child.id} className="flex gap-1">
                                          <span>{child.name}:</span>
                                          <span className="font-medium">{childTotals.estimated.toLocaleString('es-ES')} €</span>
                                        </li>
                                      );
                                    })}
                                  </ul>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Annual Total */}
              <div className="mt-4 p-4 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-lg text-white text-center">
                <p className="text-sm opacity-80">Presupuesto Anual Total</p>
                <p className="text-3xl font-bold">{summary.totalBudget.toLocaleString('es-ES')} €</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Add Category Dialog */}
      <Dialog open={quickAddDialog.open} onOpenChange={(open) => setQuickAddDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>
              {quickAddDialog.parentId ? 'Nueva subcategoría' : 'Nueva categoría'}
            </DialogTitle>
            <DialogDescription>
              {quickAddDialog.parentId
                ? `Dentro de "${quickAddDialog.parentName}"`
                : 'Crear una categoría principal (ej: SEM, Social, Display)'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="cat-name">Nombre</Label>
            <Input
              id="cat-name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder={quickAddDialog.parentId ? "Ej: Google Ads, Colombia..." : "Ej: SEM, Social Ads..."}
              className="mt-2"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleQuickAdd()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuickAddDialog({ open: false, parentId: null, parentName: '' })}>
              Cancelar
            </Button>
            <Button onClick={handleQuickAdd} disabled={!newCategoryName.trim() || isCreating}>
              {isCreating ? 'Creando...' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modals */}
      <TransferModal
        open={transferModal.open}
        onOpenChange={(open) => setTransferModal(prev => ({ ...prev, open }))}
        fromPlanId={transferModal.fromPlanId}
        categoryId={transferModal.categoryId}
        month={transferModal.month}
      />

      <ExpensesModal
        open={expensesModal.open}
        onOpenChange={(open) => setExpensesModal(prev => ({ ...prev, open }))}
        planId={expensesModal.planId}
        categoryName={expensesModal.categoryName}
        month={expensesModal.month}
      />
    </div>
  );
}
