import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useApp } from '@/contexts/AppContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Trash2, CalendarIcon, Plus, Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/notify';
import { INPUT_LIMITS } from '@/constants/inputLimits';
import { getAbsenceTypeLabel } from '@/utils/capacityUtils';

interface AbsencesSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string;
}

const absenceFormSchema = z.object({
  startDate: z.string().min(1, 'La fecha de inicio es obligatoria'),
  endDate: z.string().optional(),
  type: z.enum(['vacation', 'sick_leave', 'personal', 'other']),
  description: z.string().max(INPUT_LIMITS.absenceDescription).optional(),
  isFullDay: z.boolean(),
  hours: z.number().min(0.5).max(24).optional(),
}).refine((data) => {
  if (!data.isFullDay && (!data.hours || data.hours <= 0)) {
    return false;
  }
  return true;
}, {
  message: 'Las horas son obligatorias cuando no es día completo',
  path: ['hours'],
});

type AbsenceFormValues = z.infer<typeof absenceFormSchema>;

export function AbsencesSheet({ open, onOpenChange, employeeId }: AbsencesSheetProps) {
  const { employees, absences, addAbsence, deleteAbsence } = useApp();
  const employee = employees.find(e => e.id === employeeId);

  const employeeAbsences = absences.filter(a => a.employeeId === employeeId);

  const form = useForm<AbsenceFormValues>({
    resolver: zodResolver(absenceFormSchema),
    defaultValues: {
      startDate: '',
      endDate: '',
      type: 'vacation',
      description: '',
      isFullDay: true,
      hours: 4,
    },
  });
  const [openTypePopover, setOpenTypePopover] = useState(false);

  const isFullDay = form.watch('isFullDay');

  if (!employee) return null;

  const onSubmit = async (data: AbsenceFormValues) => {
    try {
      await addAbsence({
        employeeId,
        startDate: data.startDate,
        endDate: data.endDate || data.startDate,
        type: data.type,
        description: data.description || undefined,
        hours: data.isFullDay ? 0 : (data.hours || 0)
      });

      toast.success('Ausencia registrada correctamente');
      form.reset({
        startDate: '',
        endDate: '',
        type: 'vacation',
        description: '',
        isFullDay: true,
        hours: 4,
      });
    } catch (error) {
      console.error('Error añadiendo ausencia:', error);
      const errorMessage = (error as Error)?.message || 'Error al registrar la ausencia';
      toast.error(errorMessage);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-4 border-b">
          <SheetTitle>Ausencias: {employee.name}</SheetTitle>
          <SheetDescription>Registra vacaciones, bajas o permisos.</SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 p-4 border rounded-lg bg-slate-50 dark:bg-slate-900">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Desde</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hasta (opcional)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Popover open={openTypePopover} onOpenChange={setOpenTypePopover}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant="outline" className="w-full justify-between font-normal">
                            <span className="truncate">{field.value === 'vacation' ? 'Vacaciones' : field.value === 'sick_leave' ? 'Baja Médica' : field.value === 'personal' ? 'Asuntos Propios' : field.value === 'other' ? 'Otro' : 'Tipo'}</span>
                            <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                        <Command>
                          <CommandList>
                            <CommandGroup>
                              {(['vacation', 'sick_leave', 'personal', 'other'] as const).map(val => (
                                <CommandItem key={val} value={val === 'vacation' ? 'Vacaciones' : val === 'sick_leave' ? 'Baja Médica' : val === 'personal' ? 'Asuntos Propios' : 'Otro'} onSelect={() => { field.onChange(val); setOpenTypePopover(false); }}>
                                  <Check className={cn('mr-2 h-4 w-4 shrink-0', field.value === val ? 'opacity-100' : 'opacity-0')} />
                                  {val === 'vacation' ? 'Vacaciones' : val === 'sick_leave' ? 'Baja Médica' : val === 'personal' ? 'Asuntos Propios' : 'Otro'}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* SECCIÓN DÍA PARCIAL */}
              <FormField
                control={form.control}
                name="isFullDay"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-3 pt-2">
                    <div className="flex items-center justify-between">
                      <FormLabel className="cursor-pointer">¿Día completo?</FormLabel>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!isFullDay && (
                <FormField
                  control={form.control}
                  name="hours"
                  render={({ field }) => (
                    <FormItem className="animate-in fade-in slide-in-from-top-1">
                      <FormLabel>Horas de ausencia (por día)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0.5}
                          max={24}
                          step={0.5}
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motivo (opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Cita médica..." maxLength={INPUT_LIMITS.absenceDescription} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" /> Añadir ausencia
              </Button>
            </form>
          </Form>

          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Historial</h4>
            {employeeAbsences.length === 0 && <p className="text-sm text-center py-4 text-muted-foreground">No hay ausencias registradas.</p>}

            {employeeAbsences.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()).map(absence => (
              <div key={absence.id} className="flex items-center justify-between p-3 border rounded-lg bg-card shadow-sm">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full font-medium capitalize",
                      absence.type === 'vacation' ? "bg-green-100 text-green-700" :
                        absence.type === 'sick_leave' ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-700"
                    )}>
                      {getAbsenceTypeLabel(absence.type)}
                    </span>
                    {/* ✅ INDICADOR DE HORAS */}
                    {absence.hours && absence.hours > 0 && (
                      <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded border border-amber-200">
                        -{absence.hours}h
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium mt-1">
                    {format(new Date(absence.startDate), 'd MMM', { locale: es })}
                    {absence.endDate && absence.endDate !== absence.startDate && ` - ${format(new Date(absence.endDate), 'd MMM', { locale: es })}`}
                  </p>
                  {absence.description && <p className="text-xs text-muted-foreground">{absence.description}</p>}
                </div>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-red-600" onClick={() => deleteAbsence(absence.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
