import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMarketing } from '@/contexts/MarketingContext';
import { MarketingBudget } from '@/types/marketing';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PiggyBank, Loader2 } from 'lucide-react';

const formSchema = z.object({
  year: z.number()
    .min(2020, 'El ano debe ser 2020 o posterior')
    .max(2100, 'El ano debe ser anterior a 2100'),
  totalBudget: z.number()
    .min(1, 'El presupuesto debe ser mayor a 0')
    .max(100000000, 'El presupuesto es demasiado alto'),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateBudgetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: MarketingBudget;
}

export function CreateBudgetDialog({ open, onOpenChange, initialData }: CreateBudgetDialogProps) {
  const { createBudget, updateBudget, budgets } = useMarketing();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentYear = new Date().getFullYear();
  const existingYears = new Set(budgets.map(b => b.year));

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      year: initialData?.year || currentYear,
      totalBudget: initialData?.totalBudget || 0,
    },
  });

  // Reset form when initialData changes
  useEffect(() => {
    if (initialData) {
      form.reset({
        year: initialData.year,
        totalBudget: initialData.totalBudget
      });
    } else {
      form.reset({
        year: currentYear,
        totalBudget: 0
      });
    }
  }, [initialData, form, currentYear]);

  const onSubmit = async (values: FormValues) => {
    // Check for year duplication only if year changed or creating new
    if (!initialData || initialData.year !== values.year) {
      if (existingYears.has(values.year)) {
        form.setError('year', { message: 'Ya existe un presupuesto para este año' });
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (initialData) {
        await updateBudget(initialData.id, values);
      } else {
        await createBudget(values);
      }
      onOpenChange(false);
      if (!initialData) form.reset();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PiggyBank className="h-5 w-5" />
            {initialData ? 'Editar Presupuesto' : 'Crear Presupuesto Anual'}
          </DialogTitle>
          <DialogDescription>
            {initialData ? 'Modifica el presupuesto y año fiscal.' : 'Define el presupuesto total de marketing para un año fiscal.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="year"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Año</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="2026"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      disabled={!!initialData} // Optional: Disable changing year if not desired, but let's allow it for now
                    />
                  </FormControl>
                  <FormDescription>
                    Año fiscal para el presupuesto
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="totalBudget"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Presupuesto Total (EUR)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="69500.00"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormDescription>
                    Techo de gasto total para el año
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {initialData ? 'Guardar Cambios' : 'Crear Presupuesto'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
