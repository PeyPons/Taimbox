import { useState, useMemo } from 'react';
import { useMarketing } from '@/contexts/MarketingContext';
import { MarketingCategory, MarketingMonthlyPlan } from '@/types/marketing';
import { format, addMonths, startOfYear } from 'date-fns';
import { es } from 'date-fns/locale';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  ChevronRight,
  ChevronDown,
  Pencil,
  Receipt,
  ArrowRightLeft,
  AlertTriangle,
  Target,
} from 'lucide-react';
import { cn } from '@/lib/utils';

import { TransferModal } from './TransferModal';
import { ResultsModal } from './ResultsModal';
import { ExpensesModal } from './ExpensesModal';

interface MatrixCellData {
  plan?: MarketingMonthlyPlan;
  hasRemainder: boolean;
  remainderAmount: number;
}

export function MarketingMatrix() {
  const {
    currentBudget,
    categories,
    monthlyPlans,
    getCategoryTree,
    getMonthlyPlanForCategory,
    hasRemainder,
  } = useMarketing();

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [transferModal, setTransferModal] = useState<{
    open: boolean;
    fromPlanId?: string;
    toPlanId?: string;
    categoryId?: string;
    month?: string;
  }>({ open: false });
  const [resultsModal, setResultsModal] = useState<{
    open: boolean;
    planId?: string;
    categoryName?: string;
    month?: string;
    kpiName?: string;
  }>({ open: false });
  const [expensesModal, setExpensesModal] = useState<{
    open: boolean;
    planId?: string;
    categoryName?: string;
    month?: string;
  }>({ open: false });

  // Generate months for the year
  const months = useMemo(() => {
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

  const categoryTree = getCategoryTree();

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

  const getCellData = (categoryId: string, monthKey: string): MatrixCellData => {
    const plan = getMonthlyPlanForCategory(categoryId, monthKey);
    if (!plan) {
      return { hasRemainder: false, remainderAmount: 0 };
    }
    const remainder = hasRemainder(plan.id);
    return {
      plan,
      hasRemainder: remainder.hasRemainder,
      remainderAmount: remainder.amount,
    };
  };

  const getCategoryTotals = (category: MarketingCategory) => {
    let totalAllocated = 0;
    let totalSpent = 0;
    let totalResults = 0;

    months.forEach(month => {
      const plan = getMonthlyPlanForCategory(category.id, month.key);
      if (plan) {
        totalAllocated += plan.budgetAllocated;
        totalSpent += plan.realSpent;
        totalResults += plan.manualResultValue;
      }
    });

    // Include children totals
    if (category.children) {
      category.children.forEach(child => {
        const childTotals = getCategoryTotals(child);
        totalAllocated += childTotals.totalAllocated;
        totalSpent += childTotals.totalSpent;
        totalResults += childTotals.totalResults;
      });
    }

    return { totalAllocated, totalSpent, totalResults };
  };

  const openTransferModal = (categoryId: string, month: string, fromPlanId?: string) => {
    setTransferModal({
      open: true,
      categoryId,
      month,
      fromPlanId,
    });
  };

  const openResultsModal = (planId: string, categoryName: string, month: string, kpiName?: string) => {
    setResultsModal({
      open: true,
      planId,
      categoryName,
      month,
      kpiName,
    });
  };

  const openExpensesModal = (planId: string, categoryName: string, month: string) => {
    setExpensesModal({
      open: true,
      planId,
      categoryName,
      month,
    });
  };

  const renderCell = (category: MarketingCategory, month: typeof months[0]) => {
    const cellData = getCellData(category.id, month.key);
    const plan = cellData.plan;

    return (
      <div
        key={`${category.id}-${month.key}`}
        className="min-w-[120px] p-2 border-r border-b hover:bg-slate-50/50 transition-colors"
      >
        {plan ? (
          <div className="space-y-1">
            {/* Budget (Black) */}
            <button
              onClick={() => openTransferModal(category.id, month.key, plan.id)}
              className="w-full text-left hover:bg-slate-100 rounded px-1 py-0.5 transition-colors"
              title="Gestionar presupuesto"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Ppto</span>
                <ArrowRightLeft className="h-3 w-3 text-slate-400" />
              </div>
              <span className="font-semibold text-slate-900">
                {plan.budgetAllocated.toLocaleString('es-ES')}
              </span>
            </button>

            {/* Spent (Red/Green) */}
            <button
              onClick={() => openExpensesModal(plan.id, category.name, month.fullLabel)}
              className="w-full text-left hover:bg-slate-100 rounded px-1 py-0.5 transition-colors"
              title="Ver gastos"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Gasto</span>
                <Receipt className="h-3 w-3 text-slate-400" />
              </div>
              <span className={cn(
                "font-medium",
                plan.realSpent > plan.budgetAllocated ? "text-red-600" : "text-green-600"
              )}>
                {plan.realSpent.toLocaleString('es-ES')}
              </span>
            </button>

            {/* Results (Blue) */}
            <button
              onClick={() => openResultsModal(plan.id, category.name, month.fullLabel, category.kpiName)}
              className="w-full text-left hover:bg-slate-100 rounded px-1 py-0.5 transition-colors"
              title="Editar resultados"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  {category.kpiName || 'Resultados'}
                </span>
                <Pencil className="h-3 w-3 text-blue-400" />
              </div>
              <span className="font-medium text-blue-600">
                {plan.manualResultValue > 0 ? plan.manualResultValue.toLocaleString('es-ES') : '-'}
              </span>
            </button>

            {/* Remainder Alert */}
            {cellData.hasRemainder && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => openTransferModal(category.id, month.key, plan.id)}
                className="w-full mt-1 text-xs h-7 border-amber-300 text-amber-700 hover:bg-amber-50"
              >
                <AlertTriangle className="h-3 w-3 mr-1" />
                {cellData.remainderAmount.toLocaleString('es-ES')} EUR
              </Button>
            )}
          </div>
        ) : (
          <button
            onClick={() => openTransferModal(category.id, month.key)}
            className="w-full h-full min-h-[80px] flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
            title="Asignar presupuesto"
          >
            <ArrowRightLeft className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  };

  const renderCategoryRow = (category: MarketingCategory, level: number = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedCategories.has(category.id);
    const totals = getCategoryTotals(category);

    return (
      <div key={category.id}>
        {/* Row */}
        <div className="flex border-b">
          {/* Category Name (Fixed) */}
          <div
            className={cn(
              "min-w-[200px] w-[200px] sticky left-0 bg-white z-10 border-r flex items-center gap-1 py-2 px-2",
              level === 0 ? "bg-slate-50" : "bg-white"
            )}
            style={{ paddingLeft: `${8 + level * 16}px` }}
          >
            {hasChildren ? (
              <button
                onClick={() => toggleExpanded(category.id)}
                className="p-1 rounded hover:bg-slate-200"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-slate-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-slate-500" />
                )}
              </button>
            ) : (
              <div className="w-6" />
            )}
            <div className="flex-1 min-w-0">
              <span className={cn(
                "truncate block text-sm",
                level === 0 ? "font-semibold" : "font-medium"
              )}>
                {category.name}
              </span>
              {category.kpiName && (
                <Badge variant="outline" className="text-xs mt-0.5">
                  <Target className="h-3 w-3 mr-1" />
                  {category.kpiName}
                </Badge>
              )}
            </div>
          </div>

          {/* Month Cells */}
          {months.map(month => renderCell(category, month))}

          {/* Totals Column */}
          <div className="min-w-[120px] p-2 border-r border-b bg-slate-50">
            <div className="space-y-1 text-sm">
              <div>
                <span className="text-xs text-slate-500 block">Ppto</span>
                <span className="font-semibold">{totals.totalAllocated.toLocaleString('es-ES')}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Gasto</span>
                <span className={cn(
                  "font-medium",
                  totals.totalSpent > totals.totalAllocated ? "text-red-600" : "text-green-600"
                )}>
                  {totals.totalSpent.toLocaleString('es-ES')}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">
                  {category.kpiName || 'Resultados'}
                </span>
                <span className="font-medium text-blue-600">
                  {totals.totalResults > 0 ? totals.totalResults.toLocaleString('es-ES') : '-'}
                </span>
              </div>
            </div>
          </div>
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
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <p>No hay categorias configuradas.</p>
          <p className="text-sm mt-2">Ve a la pestana "Estructura" para crear categorias.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Matriz de Control - {currentBudget.year}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="w-full">
            <div className="min-w-max">
              {/* Header */}
              <div className="flex border-b bg-slate-100 sticky top-0 z-20">
                <div className="min-w-[200px] w-[200px] sticky left-0 bg-slate-100 z-30 border-r px-4 py-2 font-medium text-sm">
                  Categoria
                </div>
                {months.map(month => (
                  <div
                    key={month.key}
                    className="min-w-[120px] px-2 py-2 text-center border-r font-medium text-sm capitalize"
                  >
                    {month.label}
                  </div>
                ))}
                <div className="min-w-[120px] px-2 py-2 text-center font-medium text-sm bg-slate-200">
                  Total
                </div>
              </div>

              {/* Body */}
              <div>
                {categoryTree.map(category => renderCategoryRow(category))}
              </div>
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Modals */}
      <TransferModal
        open={transferModal.open}
        onOpenChange={(open) => setTransferModal(prev => ({ ...prev, open }))}
        fromPlanId={transferModal.fromPlanId}
        categoryId={transferModal.categoryId}
        month={transferModal.month}
      />

      <ResultsModal
        open={resultsModal.open}
        onOpenChange={(open) => setResultsModal(prev => ({ ...prev, open }))}
        planId={resultsModal.planId}
        categoryName={resultsModal.categoryName}
        month={resultsModal.month}
        kpiName={resultsModal.kpiName}
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
