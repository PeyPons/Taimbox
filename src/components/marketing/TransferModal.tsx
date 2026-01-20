import { useState, useMemo, useEffect } from 'react';
import { useMarketing } from '@/contexts/MarketingContext';
import { MarketingCategory } from '@/types/marketing';
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
import { ArrowRight, Loader2, Euro } from 'lucide-react';
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
    getCategoryTree,
  } = useMarketing();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [movementType, setMovementType] = useState<'initial_deposit' | 'transfer' | 'correction'>('initial_deposit');
  const [fromCategory, setFromCategory] = useState<string>('');
  const [fromMonth, setFromMonth] = useState<string>('');
  const [toCategory, setToCategory] = useState<string>(categoryId || '');
  const [toMonth, setToMonth] = useState<string>(month || '');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('Asignación de presupuesto');

  const summary = getBudgetSummary();

  // Flatten category tree with full path for dropdown
  const flatCategories = useMemo(() => {
    const result: { id: string; name: string; level: number; displayName: string; fullPath: string; isLeaf: boolean }[] = [];
    const categoryTree = getCategoryTree();

    const flatten = (cats: MarketingCategory[], level: number = 0, pathParts: string[] = []) => {
      cats.forEach(cat => {
        const currentPath = [...pathParts, cat.name];
        const hasChildren = cat.children && cat.children.length > 0;
        const isLeaf = !hasChildren;
        
        // For display: show full path for level 2+, just name with indent for level 1
        let displayName: string;
        if (level === 0) {
          displayName = cat.name;
        } else if (level === 1) {
          displayName = `  └ ${cat.name}`;
        } else {
          // For deeper levels, show path from level 1
          displayName = `    └ ${currentPath.slice(1).join(' > ')}`;
        }

        result.push({
          id: cat.id,
          name: cat.name,
          level,
          displayName,
          fullPath: currentPath.join(' > '),
          isLeaf
        });
        if (hasChildren) {
          flatten(cat.children!, level + 1, currentPath);
        }
      });
    };

    flatten(categoryTree);
    return result;
  }, [getCategoryTree]);

  // For monthly budget allocation (budgetAllocated), allow any category
  // For annual budget assignment (assignedBudget), only leaf categories
  // Since TransferModal is used for monthly allocations, we allow all categories
  const leafCategories = useMemo(() => {
    return flatCategories.filter(cat => cat.isLeaf);
  }, [flatCategories]);

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
        description: description.trim() || 'Asignación de presupuesto',
      });

      // Reset form
      setAmount('');
      setDescription('Asignación de presupuesto');
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

  const getSelectedCategoryDisplay = (catId: string) => {
    const cat = flatCategories.find(c => c.id === catId);
    return cat?.name || 'Seleccionar...';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Asignar Presupuesto</DialogTitle>
          <DialogDescription>
            Asigna presupuesto a una categoría para un mes específico.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Movement Type - Simplified */}
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={movementType} onValueChange={(v: typeof movementType) => setMovementType(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="initial_deposit">Asignar Presupuesto</SelectItem>
                <SelectItem value="transfer">Transferir entre Partidas</SelectItem>
                <SelectItem value="correction">Corrección/Ajuste</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Source (only for transfer) */}
          {movementType !== 'initial_deposit' && (
            <div className="p-4 bg-red-50 rounded-lg space-y-3">
              <Label className="text-red-700">Origen</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-red-600">Categoría</Label>
                  <Select value={fromCategory} onValueChange={setFromCategory}>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {flatCategories.map(cat => (
                        <SelectItem
                          key={cat.id}
                          value={cat.id}
                          className={cn(cat.level > 0 && "pl-6 text-slate-600")}
                        >
                          <span className={cn(cat.level === 0 && "font-medium")}>
                            {cat.displayName}
                          </span>
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
                  <span className="text-red-600">Disponible: </span>
                  <span className="font-semibold">{availableFromSource.toLocaleString('es-ES')} €</span>
                </div>
              )}
            </div>
          )}

          {/* Destination */}
          <div className="p-4 bg-green-50 rounded-lg space-y-3">
            <Label className="text-green-700">
              {movementType === 'initial_deposit' ? 'Destino' : 'Destino'}
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-green-600">Categoría</Label>
                <Select value={toCategory} onValueChange={setToCategory}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Seleccionar...">
                      {toCategory && getSelectedCategoryDisplay(toCategory)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {flatCategories.map(cat => (
                      <SelectItem
                        key={cat.id}
                        value={cat.id}
                        className={cn(cat.level > 0 && "pl-6 text-slate-600")}
                      >
                        <span className={cn(cat.level === 0 && "font-medium")}>
                          {cat.displayName}
                        </span>
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
            <Label htmlFor="amount">Cantidad (€)</Label>
            <div className="relative">
              <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
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
                Sin asignar: {summary.totalRemaining.toLocaleString('es-ES')} €
              </p>
            )}
          </div>

          {/* Description - Simplified */}
          <div className="space-y-2">
            <Label htmlFor="description">Descripción (opcional)</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: Presupuesto Q1"
            />
          </div>

          {/* Summary Preview */}
          {toCategory && toMonth && amount && (
            <div className="p-3 bg-slate-50 rounded-lg text-sm space-y-2">
              <p className="text-slate-700">
                {movementType === 'initial_deposit' ? (
                  <>
                    Asignar <strong>{parseFloat(amount || '0').toLocaleString('es-ES')} €</strong> a{' '}
                    <strong>{getCategoryName(toCategory)}</strong> en{' '}
                    <strong className="capitalize">{months.find(m => m.key === toMonth)?.label}</strong>
                  </>
                ) : (
                  <>
                    Mover <strong>{parseFloat(amount || '0').toLocaleString('es-ES')} €</strong> a{' '}
                    <strong>{getCategoryName(toCategory)}</strong>
                  </>
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                💡 Puedes asignar presupuesto mensual a cualquier categoría. El presupuesto anual solo se asigna a categorías finales.
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
              !toCategory ||
              !toMonth ||
              (movementType !== 'initial_deposit' && (!fromCategory || !fromMonth))
            }
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
