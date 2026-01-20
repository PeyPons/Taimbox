import { useState, useMemo } from 'react';
import { useMarketing } from '@/contexts/MarketingContext';
import { MarketingExpense } from '@/types/marketing';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Plus,
  Trash2,
  Receipt,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExpensesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planId?: string;
  categoryName?: string;
  month?: string;
}

export function ExpensesModal({
  open,
  onOpenChange,
  planId,
  categoryName,
  month,
}: ExpensesModalProps) {
  const {
    monthlyPlans,
    expenses,
    createExpense,
    deleteExpense,
    getExpensesForPlan,
  } = useMarketing();

  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Form state
  const [newAmount, setNewAmount] = useState('');
  const [newConcept, setNewConcept] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newIsEstimated, setNewIsEstimated] = useState(false);

  const plan = useMemo(() => {
    return monthlyPlans.find(p => p.id === planId);
  }, [planId, monthlyPlans]);

  const planExpenses = useMemo(() => {
    if (!planId) return [];
    return getExpensesForPlan(planId);
  }, [planId, getExpensesForPlan]);

  const totalExpenses = planExpenses.reduce((sum, e) => sum + e.amount, 0);
  const estimatedExpenses = planExpenses.filter(e => e.isEstimated);

  const resetForm = () => {
    setNewAmount('');
    setNewConcept('');
    setNewDate('');
    setNewIsEstimated(false);
    setIsAdding(false);
  };

  const handleAddExpense = async () => {
    if (!planId || !newAmount) return;

    setIsSubmitting(true);
    try {
      await createExpense({
        monthlyPlanId: planId,
        amount: parseFloat(newAmount),
        concept: newConcept.trim() || undefined,
        date: newDate || undefined,
        isEstimated: newIsEstimated,
      });
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (expenseId: string) => {
    await deleteExpense(expenseId);
    setDeleteConfirm(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Gastos y Facturas
            </DialogTitle>
            <DialogDescription>
              {categoryName} - {month}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Summary */}
            {plan && (
              <div className="grid grid-cols-3 gap-3">
                <Card>
                  <CardContent className="p-3 text-center">
                    <p className="text-xs text-muted-foreground">Presupuesto</p>
                    <p className="font-bold">{plan.budgetAllocated.toLocaleString('es-ES')}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 text-center">
                    <p className="text-xs text-muted-foreground">Gasto Total</p>
                    <p className={cn(
                      "font-bold",
                      totalExpenses > plan.budgetAllocated ? "text-red-600" : "text-green-600"
                    )}>
                      {totalExpenses.toLocaleString('es-ES')}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 text-center">
                    <p className="text-xs text-muted-foreground">Disponible</p>
                    <p className={cn(
                      "font-bold",
                      plan.budgetAllocated - totalExpenses < 0 ? "text-red-600" : "text-green-600"
                    )}>
                      {(plan.budgetAllocated - totalExpenses).toLocaleString('es-ES')}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Estimated Warning */}
            {estimatedExpenses.length > 0 && (
              <div className="flex items-center gap-2 p-2 bg-amber-50 rounded-md text-sm text-amber-700">
                <AlertTriangle className="h-4 w-4" />
                <span>{estimatedExpenses.length} gasto(s) marcados como estimados</span>
              </div>
            )}

            {/* Expenses List */}
            <ScrollArea className="h-[250px]">
              <div className="space-y-2">
                {planExpenses.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Receipt className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                    <p>No hay gastos registrados</p>
                  </div>
                ) : (
                  planExpenses.map((expense) => (
                    <div
                      key={expense.id}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border",
                        expense.isEstimated ? "bg-amber-50 border-amber-200" : "bg-white"
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">
                            {expense.amount.toLocaleString('es-ES')} EUR
                          </span>
                          {expense.isEstimated && (
                            <Badge variant="outline" className="text-xs text-amber-700 border-amber-300">
                              Estimado
                            </Badge>
                          )}
                        </div>
                        {expense.concept && (
                          <p className="text-sm text-muted-foreground truncate">
                            {expense.concept}
                          </p>
                        )}
                        {expense.date && (
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(expense.date), 'd MMM yyyy', { locale: es })}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteConfirm(expense.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Add Expense Form */}
            {isAdding ? (
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="exp-amount" className="text-xs">Importe (EUR) *</Label>
                      <Input
                        id="exp-amount"
                        type="number"
                        step="0.01"
                        value={newAmount}
                        onChange={(e) => setNewAmount(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="exp-date" className="text-xs">Fecha</Label>
                      <Input
                        id="exp-date"
                        type="date"
                        value={newDate}
                        onChange={(e) => setNewDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="exp-concept" className="text-xs">Concepto</Label>
                    <Input
                      id="exp-concept"
                      value={newConcept}
                      onChange={(e) => setNewConcept(e.target.value)}
                      placeholder="Ej: Factura Google Ads #FV-2026-01"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="exp-estimated"
                      checked={newIsEstimated}
                      onCheckedChange={(checked) => setNewIsEstimated(!!checked)}
                    />
                    <Label htmlFor="exp-estimated" className="text-sm font-normal cursor-pointer">
                      Gasto estimado (pendiente de cierre)
                    </Label>
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" size="sm" onClick={resetForm} disabled={isSubmitting}>
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleAddExpense}
                      disabled={isSubmitting || !newAmount || parseFloat(newAmount) <= 0}
                    >
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Agregar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Button onClick={() => setIsAdding(true)} variant="outline" className="w-full gap-2">
                <Plus className="h-4 w-4" />
                Agregar Gasto
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Gasto</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion eliminara el gasto y actualizara el total gastado.
              Esta accion no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
