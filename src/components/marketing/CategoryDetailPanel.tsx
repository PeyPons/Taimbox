import { useMemo } from 'react';
import { useMarketing } from '@/contexts/MarketingContext';
import { MarketingCategory } from '@/types/marketing';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  X,
  TrendingUp,
  TrendingDown,
  Euro,
  Calendar,
  User,
  FileText,
  ArrowRight,
  ArrowDownLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CategoryDetailPanelProps {
  categoryId: string | null;
  onClose: () => void;
}

export function CategoryDetailPanel({ categoryId, onClose }: CategoryDetailPanelProps) {
  const {
    categories,
    monthlyPlans,
    movements,
    expenses,
    getCategoryTree,
    getMonthlyPlanForCategory,
    getRealSpentForPlan,
    getEstimatedForPlan,
    getExpensesForPlan,
  } = useMarketing();

  const category = useMemo(() => {
    if (!categoryId) return null;
    const allCategories: MarketingCategory[] = [];
    const collect = (cats: MarketingCategory[]) => {
      cats.forEach(cat => {
        allCategories.push(cat);
        if (cat.children) collect(cat.children);
      });
    };
    const tree = getCategoryTree();
    collect(tree);
    return allCategories.find(c => c.id === categoryId) || null;
  }, [categoryId, getCategoryTree]);

  const categoryPlans = useMemo(() => {
    if (!category) return [];
    const allPlans: string[] = [];
    const collect = (cat: MarketingCategory) => {
      monthlyPlans.filter(p => p.categoryId === cat.id).forEach(p => allPlans.push(p.id));
      if (cat.children) cat.children.forEach(collect);
    };
    collect(category);
    return monthlyPlans.filter(p => allPlans.includes(p.id));
  }, [category, monthlyPlans]);

  const allExpenses = useMemo(() => {
    return categoryPlans.flatMap(plan => getExpensesForPlan(plan.id));
  }, [categoryPlans, getExpensesForPlan]);

  const allMovements = useMemo(() => {
    const planIds = categoryPlans.map(p => p.id);
    return movements.filter(m => 
      (m.fromPlanId && planIds.includes(m.fromPlanId)) ||
      (m.toPlanId && planIds.includes(m.toPlanId))
    );
  }, [categoryPlans, movements]);

  const totals = useMemo(() => {
    let totalEstimated = 0;
    let totalSpent = 0;
    let totalProjected = 0;
    
    categoryPlans.forEach(plan => {
      totalEstimated += plan.budgetAllocated;
      totalSpent += getRealSpentForPlan(plan.id);
      totalProjected += getRealSpentForPlan(plan.id) + getEstimatedForPlan(plan.id);
    });

    return { totalEstimated, totalSpent, totalProjected };
  }, [categoryPlans, getRealSpentForPlan, getEstimatedForPlan]);

  if (!category) return null;

  return (
    <Sheet open={!!categoryId} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {category.name}
          </SheetTitle>
          <SheetDescription>
            Trazabilidad completa y detalle de presupuesto
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground">Presupuesto Asignado</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-purple-700">
                  {category.assignedBudget ? category.assignedBudget.toLocaleString('es-ES') : '-'} €
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground">Total Estimado</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-blue-700">
                  {totals.totalEstimated.toLocaleString('es-ES')} €
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground">Total Invertido</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-700">
                  {totals.totalSpent.toLocaleString('es-ES')} €
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Desglose Mensual</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mes</TableHead>
                      <TableHead className="text-right">Estimado</TableHead>
                      <TableHead className="text-right">Invertido</TableHead>
                      <TableHead className="text-right">Proyectado</TableHead>
                      <TableHead className="text-right">Disponible</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categoryPlans.map(plan => {
                      const monthDate = new Date(plan.month);
                      const realSpent = getRealSpentForPlan(plan.id);
                      const estimated = getEstimatedForPlan(plan.id);
                      const projected = realSpent + estimated;
                      const available = plan.budgetAllocated - realSpent;
                      
                      return (
                        <TableRow key={plan.id}>
                          <TableCell className="font-medium">
                            {format(monthDate, 'MMMM yyyy', { locale: es })}
                          </TableCell>
                          <TableCell className="text-right text-blue-700">
                            {plan.budgetAllocated.toLocaleString('es-ES')} €
                          </TableCell>
                          <TableCell className="text-right text-green-700">
                            {realSpent.toLocaleString('es-ES')} €
                          </TableCell>
                          <TableCell className="text-right text-blue-600">
                            {projected.toLocaleString('es-ES')} €
                            {estimated > 0 && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                +{estimated.toLocaleString('es-ES')} est.
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className={cn(
                            "text-right font-medium",
                            available < 0 ? "text-red-600" : "text-amber-700"
                          )}>
                            {available.toLocaleString('es-ES')} €
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Expenses List */}
          {allExpenses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Gastos Registrados ({allExpenses.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[250px]">
                  <div className="space-y-2">
                    {allExpenses.map(expense => {
                      const plan = categoryPlans.find(p => p.id === expense.monthlyPlanId);
                      const monthDate = plan ? new Date(plan.month) : null;
                      
                      return (
                        <div
                          key={expense.id}
                          className={cn(
                            "flex items-center justify-between p-3 rounded-lg border",
                            expense.isEstimated ? "bg-amber-50 border-amber-200" : "bg-white"
                          )}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Euro className="h-4 w-4 text-slate-400" />
                              <span className="font-semibold">
                                {expense.amount.toLocaleString('es-ES')} €
                              </span>
                              {expense.isEstimated && (
                                <Badge variant="outline" className="text-xs text-amber-700">
                                  Estimado
                                </Badge>
                              )}
                            </div>
                            {expense.concept && (
                              <p className="text-sm text-muted-foreground mt-1">{expense.concept}</p>
                            )}
                            {monthDate && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {format(monthDate, 'MMMM yyyy', { locale: es })}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Movements History */}
          {allMovements.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Historial de Movimientos ({allMovements.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[250px]">
                  <div className="space-y-3">
                    {allMovements.map(movement => {
                      const fromPlan = movement.fromPlanId ? categoryPlans.find(p => p.id === movement.fromPlanId) : null;
                      const toPlan = movement.toPlanId ? categoryPlans.find(p => p.id === movement.toPlanId) : null;
                      
                      return (
                        <div
                          key={movement.id}
                          className="flex items-start gap-3 p-3 rounded-lg border bg-slate-50"
                        >
                          <div className={cn(
                            "p-2 rounded-full",
                            movement.type === 'initial_deposit' ? "bg-green-100" :
                            movement.type === 'transfer' ? "bg-blue-100" : "bg-amber-100"
                          )}>
                            {movement.type === 'initial_deposit' ? (
                              <ArrowDownLeft className="h-4 w-4 text-green-600" />
                            ) : (
                              <ArrowRight className="h-4 w-4 text-blue-600" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">
                                {movement.amount.toLocaleString('es-ES')} €
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {movement.type === 'initial_deposit' ? 'Asignación' :
                                 movement.type === 'transfer' ? 'Transferencia' : 'Corrección'}
                              </Badge>
                            </div>
                            {movement.description && (
                              <p className="text-sm text-muted-foreground mt-1">{movement.description}</p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              {fromPlan && (
                                <span>
                                  Desde: {format(new Date(fromPlan.month), 'MMM yyyy', { locale: es })}
                                </span>
                              )}
                              {toPlan && (
                                <span>
                                  Hacia: {format(new Date(toPlan.month), 'MMM yyyy', { locale: es })}
                                </span>
                              )}
                              <span>
                                {format(new Date(movement.createdAt), 'd MMM yyyy', { locale: es })}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
