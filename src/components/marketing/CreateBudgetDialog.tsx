import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMarketing } from '@/contexts/MarketingContext';

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
}

export function CreateBudgetDialog({ open, onOpenChange }: CreateBudgetDialogProps) {
  const { createBudget, budgets } = useMarketing();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentYear = new Date().getFullYear();
  const existingYears = new Set(budgets.map(b => b.year));

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      year: currentYear,
      totalBudget: 0,
    },
  });

  const onSubmit = async (values: FormValues) => {
    if (existingYears.has(values.year)) {
      form.setError('year', { message: 'Ya existe un presupuesto para este ano' });
      return;
    }

    setIsSubmitting(true);
    try {
      const budget = await createBudget(values);
      if (budget) {
        form.reset();
        onOpenChange(false);
      }
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
            Crear Presupuesto Anual
          </DialogTitle>
          <DialogDescription>
            Define el presupuesto total de marketing para un ano fiscal.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="year"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ano</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="2026"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormDescription>
                    Ano fiscal para el presupuesto
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
                    Techo de gasto total para el ano
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
                Crear Presupuesto
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
