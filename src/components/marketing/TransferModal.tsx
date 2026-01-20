import { useState, useMemo, useEffect } from 'react';
import { useMarketing } from '@/contexts/MarketingContext';
import { format, addMonths, startOfYear } from 'date-fns';
import { es } from 'date-fns/locale';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Loader2, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TransferModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fromPlanId?: string;
  categoryId?: string;
  month?: string;
}

export function TransferModal({
  open,
  onOpenChange,
  fromPlanId,
  categoryId,
  month,
}: TransferModalProps) {
  const {
    currentBudget,
    categories,
    monthlyPlans,
    createMovement,
    getOrCreateMonthlyPlan,
    getBudgetSummary,
  } = useMarketing();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [movementType, setMovementType] = useState<'initial_deposit' | 'transfer' | 'correction'>('transfer');
  const [fromCategory, setFromCategory] = useState<string>('');
  const [fromMonth, setFromMonth] = useState<string>('');
  const [toCategory, setToCategory] = useState<string>(categoryId || '');
  const [toMonth, setToMonth] = useState<string>(month || '');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  const summary = getBudgetSummary();

  // Generate months for the year
  const months = useMemo(() => {
    if (!currentBudget) return [];
    const yearStart = startOfYear(new Date(currentBudget.year, 0, 1));
    return Array.from({ length: 12 }, (_, i) => {
      const date = addMonths(yearStart, i);
      return {
        key: format(date, 'yyyy-MM-dd'),
        label: format(date, 'MMMM', { locale: es }),
      };
    });
  }, [currentBudget]);

  // Get plan for source
  const sourcePlan = useMemo(() => {
    if (fromPlanId) {
      return monthlyPlans.find(p => p.id === fromPlanId);
    }
    if (fromCategory && fromMonth) {
      return monthlyPlans.find(p => p.categoryId === fromCategory && p.month === fromMonth);
    }
    return undefined;
  }, [fromPlanId, fromCategory, fromMonth, monthlyPlans]);

  const availableFromSource = sourcePlan ? sourcePlan.budgetAllocated - sourcePlan.realSpent : 0;

  // Initialize from pre-filled values
  useEffect(() => {
    if (open) {
      if (fromPlanId) {
        const plan = monthlyPlans.find(p => p.id === fromPlanId);
        if (plan) {
          setFromCategory(plan.categoryId);
          setFromMonth(plan.month);
        }
      }
      if (categoryId) setToCategory(categoryId);
      if (month) setToMonth(month);
    }
  }, [open, fromPlanId, categoryId, month, monthlyPlans]);

  const handleSubmit = async () => {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return;
    }

    if (!description.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      let fromPlan = null;
      let toPlan = null;

      // Get or create source plan (if not initial deposit)
      if (movementType !== 'initial_deposit' && fromCategory && fromMonth) {
        fromPlan = await getOrCreateMonthlyPlan(fromCategory, fromMonth);
      }

      // Get or create destination plan
      if (toCategory && toMonth) {
        toPlan = await getOrCreateMonthlyPlan(toCategory, toMonth);
      }

      await createMovement({
        fromPlanId: fromPlan?.id,
        toPlanId: toPlan?.id,
        amount: parsedAmount,
        type: movementType,
        description: description.trim(),
      });

      // Reset form
      setAmount('');
      setDescription('');
      setFromCategory('');
      setFromMonth('');
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryName = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name || '';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Gestor de Movimientos</DialogTitle>
          <DialogDescription>
            Transfiere presupuesto entre partidas o registra inyecciones de capital.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Movement Type */}
          <div className="space-y-2">
            <Label>Tipo de Movimiento</Label>
            <Select value={movementType} onValueChange={(v: typeof movementType) => setMovementType(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="initial_deposit">Inyeccion de Capital</SelectItem>
                <SelectItem value="transfer">Transferencia entre Partidas</SelectItem>
                <SelectItem value="correction">Correccion/Ajuste</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Source (not for initial deposit) */}
          {movementType !== 'initial_deposit' && (
            <div className="p-4 bg-red-50 rounded-lg space-y-3">
              <Label className="text-red-700">Origen</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-red-600">Categoria</Label>
                  <Select value={fromCategory} onValueChange={setFromCategory}>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-red-600">Mes</Label>
                  <Select value={fromMonth} onValueChange={setFromMonth}>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map(m => (
                        <SelectItem key={m.key} value={m.key}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {sourcePlan && (
                <div className="text-sm">
                  <span className="text-red-600">Saldo disponible: </span>
                  <span className="font-semibold">{availableFromSource.toLocaleString('es-ES')} EUR</span>
                </div>
              )}
            </div>
          )}

          {/* Arrow */}
          {movementType !== 'initial_deposit' && (
            <div className="flex justify-center">
              <ArrowRight className="h-6 w-6 text-slate-400" />
            </div>
          )}

          {/* Destination */}
          <div className="p-4 bg-green-50 rounded-lg space-y-3">
            <Label className="text-green-700">
              {movementType === 'initial_deposit' ? 'Destino del Capital' : 'Destino'}
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-green-600">Categoria</Label>
                <Select value={toCategory} onValueChange={setToCategory}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-green-600">Mes</Label>
                <Select value={toMonth} onValueChange={setToMonth}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map(m => (
                      <SelectItem key={m.key} value={m.key}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Cantidad (EUR)</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-9"
                placeholder="0.00"
              />
            </div>
            {movementType === 'initial_deposit' && (
              <p className="text-xs text-muted-foreground">
                Presupuesto sin asignar: {summary.totalRemaining.toLocaleString('es-ES')} EUR
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descripcion *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: Mover remanente de Enero a Bolsa Q2"
              rows={2}
            />
            <p className="text-xs text-muted-foreground">
              Obligatorio para trazabilidad
            </p>
          </div>

          {/* Summary */}
          {toCategory && toMonth && amount && (
            <div className="p-3 bg-slate-50 rounded-lg text-sm">
              <p className="text-slate-700">
                {movementType === 'initial_deposit' ? (
                  <>
                    Asignar <strong>{parseFloat(amount || '0').toLocaleString('es-ES')} EUR</strong> a{' '}
                    <strong>{getCategoryName(toCategory)}</strong> en{' '}
                    <strong>{months.find(m => m.key === toMonth)?.label}</strong>
                  </>
                ) : (
                  <>
                    Mover <strong>{parseFloat(amount || '0').toLocaleString('es-ES')} EUR</strong> de{' '}
                    <strong>{getCategoryName(fromCategory)}</strong> a{' '}
                    <strong>{getCategoryName(toCategory)}</strong>
                  </>
                )}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              !amount ||
              parseFloat(amount) <= 0 ||
              !description.trim() ||
              !toCategory ||
              !toMonth ||
              (movementType !== 'initial_deposit' && (!fromCategory || !fromMonth))
            }
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar Movimiento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
