import { useState, useEffect, useMemo } from 'react';
import { useMarketing } from '@/contexts/MarketingContext';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Target, TrendingUp, Calculator } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResultsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planId?: string;
  categoryName?: string;
  month?: string;
  kpiName?: string;
}

export function ResultsModal({
  open,
  onOpenChange,
  planId,
  categoryName,
  month,
  kpiName,
}: ResultsModalProps) {
  const { monthlyPlans, updateResults, categories } = useMarketing();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultValue, setResultValue] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const plan = useMemo(() => {
    return monthlyPlans.find(p => p.id === planId);
  }, [planId, monthlyPlans]);

  const category = useMemo(() => {
    if (!plan) return null;
    return categories.find(c => c.id === plan.categoryId);
  }, [plan, categories]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const value = parseFloat(resultValue) || 0;
    const spent = plan?.realSpent || 0;

    return {
      cpl: value > 0 ? spent / value : 0,
      targetCpl: category?.kpiTargetCost || 0,
      cplVariance: category?.kpiTargetCost && value > 0
        ? ((spent / value) - category.kpiTargetCost) / category.kpiTargetCost * 100
        : 0,
    };
  }, [resultValue, plan, category]);

  // Initialize form when opening
  useEffect(() => {
    if (open && plan) {
      setResultValue(plan.manualResultValue > 0 ? plan.manualResultValue.toString() : '');
      setNotes(plan.manualResultNotes || '');
    }
  }, [open, plan]);

  const handleSubmit = async () => {
    if (!planId) return;

    setIsSubmitting(true);
    try {
      await updateResults(planId, {
        manualResultValue: parseFloat(resultValue) || 0,
        manualResultNotes: notes.trim() || undefined,
      });
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayKpiName = kpiName || category?.kpiName || 'Resultados';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            Cierre de Resultados
          </DialogTitle>
          <DialogDescription>
            {categoryName} - {month}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Results Input */}
          <div className="space-y-2">
            <Label htmlFor="resultValue" className="flex items-center gap-2">
              {displayKpiName} Conseguidos
            </Label>
            <Input
              id="resultValue"
              type="number"
              step="1"
              min="0"
              value={resultValue}
              onChange={(e) => setResultValue(e.target.value)}
              placeholder="Ej: 45"
              className="text-lg"
            />
          </div>

          {/* Calculated Metrics */}
          {plan && parseFloat(resultValue) > 0 && (
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calculator className="h-4 w-4" />
                    CPL Real
                  </div>
                  <p className={cn(
                    "text-xl font-bold mt-1",
                    metrics.targetCpl > 0 && metrics.cpl > metrics.targetCpl
                      ? "text-red-600"
                      : "text-green-600"
                  )}>
                    {metrics.cpl.toFixed(2)} EUR
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Gasto: {plan.realSpent.toLocaleString('es-ES')} EUR
                  </p>
                </CardContent>
              </Card>

              {category?.kpiTargetCost && (
                <Card>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Target className="h-4 w-4" />
                      CPL Objetivo
                    </div>
                    <p className="text-xl font-bold mt-1">
                      {category.kpiTargetCost.toFixed(2)} EUR
                    </p>
                    <p className={cn(
                      "text-xs",
                      metrics.cplVariance > 0 ? "text-red-600" : "text-green-600"
                    )}>
                      {metrics.cplVariance > 0 ? '+' : ''}{metrics.cplVariance.toFixed(1)}% vs objetivo
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Summary Card */}
          {plan && (
            <Card className="bg-slate-50">
              <CardContent className="p-3">
                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                  <div>
                    <p className="text-muted-foreground">Presupuesto</p>
                    <p className="font-semibold">{plan.budgetAllocated.toLocaleString('es-ES')}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Gasto</p>
                    <p className={cn(
                      "font-semibold",
                      plan.realSpent > plan.budgetAllocated ? "text-red-600" : "text-green-600"
                    )}>
                      {plan.realSpent.toLocaleString('es-ES')}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Diferencia</p>
                    <p className={cn(
                      "font-semibold",
                      plan.budgetAllocated - plan.realSpent < 0 ? "text-red-600" : "text-green-600"
                    )}>
                      {(plan.budgetAllocated - plan.realSpent).toLocaleString('es-ES')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Datos extraidos del CRM el dia 30. Excluidos leads duplicados."
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Documenta la fuente de los datos y cualquier exclusion
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar Resultados
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
