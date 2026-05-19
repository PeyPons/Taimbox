/**
 * Dialog para crear/editar asignaciones globales (tareas que afectan a uno o más empleados).
 * Estado del formulario vive dentro del componente; la página solo pasa open, initialData y onSave.
 * No crea suscripciones Realtime.
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Save } from 'lucide-react';
import type { GlobalAssignment } from '@/types';
import type { Employee } from '@/types';
import { INPUT_LIMITS } from '@/constants/inputLimits';

const schema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(INPUT_LIMITS.assignmentName),
  hours: z.number().min(0.1, 'Las horas deben ser mayores a 0'),
  affectsAll: z.boolean(),
  affectedEmployeeIds: z.array(z.string()).optional().default([]),
});

export type GlobalAssignmentFormValues = z.infer<typeof schema>;

export interface GlobalAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Cuando se edita, el assignment a editar; cuando se crea, null */
  initialData: GlobalAssignment | null;
  onSave: (data: GlobalAssignmentFormValues) => Promise<void>;
  employees: Employee[];
}

export function GlobalAssignmentDialog({
  open,
  onOpenChange,
  initialData,
  onSave,
  employees,
}: GlobalAssignmentDialogProps) {
  const form = useForm<GlobalAssignmentFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      hours: 0,
      affectsAll: true,
      affectedEmployeeIds: [],
    },
  });

  useEffect(() => {
    if (open) {
      if (initialData) {
        form.reset({
          name: initialData.name,
          hours: initialData.hours,
          affectsAll: initialData.affectsAll,
          affectedEmployeeIds: initialData.affectedEmployeeIds ?? [],
        });
      } else {
        form.reset({
          name: '',
          hours: 0,
          affectsAll: true,
          affectedEmployeeIds: [],
        });
      }
    }
  }, [open, initialData, form]);

  const handleSubmit = form.handleSubmit(async (data) => {
    await onSave(data);
    onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Editar asignación global' : 'Nueva asignación global'}
          </DialogTitle>
          <DialogDescription>
            Tareas que afectan a uno o más empleados
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de la tarea</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: deadline afecta a todos, creación timeboxing" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Horas</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      step="0.5"
                      placeholder="Ej: 2.5"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="affectsAll"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <Switch
                      id="affects-all"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel htmlFor="affects-all" className="cursor-pointer">
                    Afecta a todos los empleados
                  </FormLabel>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!form.watch('affectsAll') && (
              <FormField
                control={form.control}
                name="affectedEmployeeIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Seleccionar empleados</FormLabel>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto border rounded-lg p-3">
                      {employees.map(emp => (
                        <div key={emp.id} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`emp-${emp.id}`}
                            checked={(field.value || []).includes(emp.id)}
                            onChange={(e) => {
                              const ids = field.value || [];
                              if (e.target.checked) {
                                field.onChange([...ids, emp.id]);
                              } else {
                                field.onChange(ids.filter(id => id !== emp.id));
                              }
                            }}
                            className="rounded"
                          />
                          <Label htmlFor={`emp-${emp.id}`} className="cursor-pointer text-sm">
                            {emp.first_name || emp.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90">
                <Save className="h-4 w-4 mr-2" />
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
