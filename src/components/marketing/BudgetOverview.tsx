import { useMemo } from 'react';
import { useMarketing } from '@/contexts/MarketingContext';
import { MarketingCategory } from '@/types/marketing';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Wallet, TrendingUp, PieChart, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const formatEur = (n: number) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

function useCategoryTotals() {
  const { getCategoryTree, monthlyPlans, getRealSpentForPlan } = useMarketing();

  return useMemo(() => {
    const rows: {
      category: MarketingCategory;
      level: number;
      allocated: number;
      spent: number;
      remaining: number;
      percentage: number;
    }[] = [];

    const getAllDescendantIds = (c: MarketingCategory): string[] => {
      const ids = [c.id];
      (c.children || []).forEach(child => ids.push(...getAllDescendantIds(child)));
      return ids;
    };

    const walk = (cats: MarketingCategory[], level: number) => {
      cats.forEach(cat => {
        const categoryIds = getAllDescendantIds(cat);
        const plans = monthlyPlans.filter(p => categoryIds.includes(p.categoryId));
        const allocated = plans.reduce((s, p) => s + p.budgetAllocated, 0);
        const spent = plans.reduce((s, p) => s + getRealSpentForPlan(p.id), 0);
        const remaining = Math.max(0, allocated - spent);
        const percentage = allocated > 0 ? (spent / allocated) * 100 : 0;

        rows.push({
          category: cat,
          level,
          allocated,
          spent,
          remaining,
          percentage,
        });
        if (cat.children?.length) walk(cat.children, level + 1);
      });
    };

    const tree = getCategoryTree();
    walk(tree, 0);
    return rows;
  }, [getCategoryTree, monthlyPlans, getRealSpentForPlan]);
}

export function BudgetOverview() {
  const { currentBudget, getBudgetSummary, getCategoryTree } = useMarketing();
  const summary = getBudgetSummary();
  const categoryRows = useCategoryTotals();
  const tree = getCategoryTree();

  if (!currentBudget) {
    return null;
  }

  const progressPercent = summary.totalBudget > 0
    ? Math.min(100, (summary.totalSpent / summary.totalBudget) * 100)
    : 0;
  const isOverBudget = summary.totalSpent > summary.totalBudget;
  const isNearLimit = summary.totalBudget > 0 && progressPercent >= 85 && !isOverBudget;

  return (
    <div className="space-y-8">
      {/* Bloque principal: presupuesto del año */}
      <section>
        <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-4">
          Presupuesto año {currentBudget.year}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card className="border border-slate-200/80 bg-white shadow-sm overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-slate-100 text-slate-600">
                  <Wallet className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Total asignado</p>
                  <p className="text-xl font-semibold text-slate-900 tabular-nums">
                    {formatEur(summary.totalBudget)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border border-slate-200/80 bg-white shadow-sm overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'p-2.5 rounded-lg',
                  isOverBudget ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
                )}>
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Gastado real</p>
                  <p className={cn(
                    'text-xl font-semibold tabular-nums',
                    isOverBudget ? 'text-red-700' : 'text-slate-900'
                  )}>
                    {formatEur(summary.totalSpent)}
                  </p>
                  {summary.totalAllocated > 0 && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      {summary.executionRate.toFixed(1)}% del plan ejecutado
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border border-slate-200/80 bg-white shadow-sm overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-amber-100 text-amber-600">
                  <PieChart className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Disponible</p>
                  <p className="text-xl font-semibold text-slate-900 tabular-nums">
                    {formatEur(summary.totalRemaining)}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Sin asignar a partidas
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Barra de progreso global */}
        <Card className="border border-slate-200/80 bg-white shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-medium text-slate-700">Ejecución del presupuesto</span>
              <span className={cn(
                'font-semibold tabular-nums',
                isOverBudget && 'text-red-600',
                isNearLimit && !isOverBudget && 'text-amber-600'
              )}>
                {progressPercent.toFixed(1)}%
              </span>
            </div>
            <Progress
              value={Math.min(100, progressPercent)}
              className={cn(
                'h-3',
                isOverBudget && '[&>div]:bg-red-500',
                isNearLimit && !isOverBudget && '[&>div]:bg-amber-500'
              )}
            />
            <div className="flex justify-between mt-1.5 text-xs text-slate-500">
              <span>0 €</span>
              <span>{formatEur(summary.totalBudget)}</span>
            </div>
            {isOverBudget && (
              <div className="mt-3 flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>Se ha superado el presupuesto en {formatEur(summary.totalSpent - summary.totalBudget)}.</span>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Tabla por categoría */}
      <section>
        <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-4">
          Desglose por partidas
        </h2>
        <Card className="border border-slate-200/80 bg-white shadow-sm overflow-hidden">
          {categoryRows.length === 0 ? (
            <CardContent className="p-10 text-center text-slate-500">
              <p className="text-sm">Aún no hay partidas. Añade categorías en la pestaña Planificación.</p>
            </CardContent>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-200/80 bg-slate-50/80 hover:bg-slate-50/80">
                    <TableHead className="font-semibold text-slate-700">Partida</TableHead>
                    <TableHead className="text-right font-semibold text-slate-700 w-32">Asignado</TableHead>
                    <TableHead className="text-right font-semibold text-slate-700 w-32">Gastado</TableHead>
                    <TableHead className="text-right font-semibold text-slate-700 w-32">Disponible</TableHead>
                    <TableHead className="text-right font-semibold text-slate-700 w-24">Uso</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categoryRows.map(({ category, level, allocated, spent, remaining, percentage }) => (
                    <TableRow
                      key={category.id}
                      className={cn(
                        level > 0 && 'bg-slate-50/50',
                        spent > allocated && 'bg-red-50/40'
                      )}
                    >
                      <TableCell
                        className={cn(
                          'font-medium text-slate-800',
                          level > 0 && 'pl-6'
                        )}
                        style={{ paddingLeft: level > 0 ? 16 + level * 20 : 16 }}
                      >
                        {category.name}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-slate-700">
                        {formatEur(allocated)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-slate-700">
                        {formatEur(spent)}
                      </TableCell>
                      <TableCell className={cn(
                        'text-right tabular-nums',
                        remaining === 0 && allocated > 0 ? 'text-amber-600' : 'text-slate-700'
                      )}>
                        {formatEur(remaining)}
                      </TableCell>
                      <TableCell className="text-right">
                        {allocated > 0 ? (
                          <span
                            className={cn(
                              'inline-block min-w-[2.5rem] font-medium tabular-nums',
                              percentage > 100 && 'text-red-600',
                              percentage > 85 && percentage <= 100 && 'text-amber-600',
                              percentage <= 85 && 'text-slate-600'
                            )}
                          >
                            {percentage.toFixed(0)}%
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 flex justify-between text-sm font-semibold text-slate-800">
                <span>Total partidas</span>
                <span className="tabular-nums">
                  {formatEur(categoryRows.reduce((s, r) => s + r.allocated, 0))} asignado ·{' '}
                  {formatEur(categoryRows.reduce((s, r) => s + r.spent, 0))} gastado
                </span>
              </div>
            </>
          )}
        </Card>
      </section>
    </div>
  );
}
