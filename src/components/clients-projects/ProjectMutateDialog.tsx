import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useFormatMoney } from '@/hooks/useFormatMoney';
import type { TFunction } from 'i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { parseISO } from 'date-fns';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Trash2, Plus, X, ChevronsUpDown, ChevronDown, Check, Link as LinkIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SensitiveText } from '@/components/privacy/SensitiveText';
import { useApp } from '@/contexts/AppContext';
import { useAgency } from '@/contexts/AgencyContext';
import type { Client, OKR, Project } from '@/types';
import { PROJECT_TYPE_PRESET_VALUES, PROJECT_TYPE_ENTREGABLE } from '@/config/projectTypePresets';
import { parseDeliverableContractFeeInput } from '@/utils/deliverableProjectFields';
import { PhaseDatePickerButton } from '@/components/projects/PhaseDatePickerButton';
import { toast } from '@/lib/notify';
import { INPUT_LIMITS } from '@/constants/inputLimits';
import type { DepartmentDefinition } from '@/types';

function createProjectFormSchema(t: TFunction<'app'>) {
  return z
    .object({
      name: z.string().min(1, t('clientsAndProjects.dialogs.newProject.nameRequired', 'El nombre es obligatorio')).max(INPUT_LIMITS.projectName),
      clientId: z.string().min(1, t('clientsAndProjects.dialogs.newProject.clientRequired', 'Debes seleccionar un cliente')),
      budgetHours: z.coerce.number().min(0, t('clientsAndProjects.dialogs.newProject.budgetNonNegative', 'Las horas asignadas no pueden ser negativas')),
      minimumHours: z.coerce.number().min(0, t('clientsAndProjects.dialogs.newProject.minHoursNonNegative', 'Las horas mínimas no pueden ser negativas')),
      monthlyFee: z.coerce.number().min(0, t('clientsAndProjects.dialogs.newProject.feeNonNegative', 'El fee mensual no puede ser negativo')),
      status: z.enum(['active', 'archived', 'completed']),
      responsibleDepartmentId: z.string().optional().or(z.literal('')),
      externalId: z.coerce.number().optional().or(z.literal('')),
      okrs: z
        .array(
          z.object({
            id: z.string(),
            title: z.string().max(INPUT_LIMITS.okrTitle),
            progress: z.number().min(0).max(100),
          })
        )
        .optional()
        .default([]),
      projectType: z.string().max(INPUT_LIMITS.projectType).optional().default(''),
      deliverableContractFee: z.string().optional().default(''),
      deliverableStartDate: z.string().optional().default(''),
      deliverableDueDate: z.string().optional().default(''),
    })
    .superRefine((data, ctx) => {
      if (data.projectType !== PROJECT_TYPE_ENTREGABLE) return;
      if (data.deliverableContractFee?.trim()) {
        const parsed = parseDeliverableContractFeeInput(data.deliverableContractFee);
        if (parsed == null) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t('clientsAndProjects.dialogs.newProject.deliverableFeeInvalid', 'Importe total del contrato no válido'),
            path: ['deliverableContractFee'],
          });
        }
      }
      const s = data.deliverableStartDate?.trim();
      const e = data.deliverableDueDate?.trim();
      if (s && e) {
        try {
          const ds = parseISO(s);
          const de = parseISO(e);
          if (!Number.isNaN(ds.getTime()) && !Number.isNaN(de.getTime()) && de < ds) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: t('clientsAndProjects.dialogs.newProject.deliverableDatesOrder', 'La fecha fin debe ser posterior o igual al inicio'),
              path: ['deliverableDueDate'],
            });
          }
        } catch {
          /* ignore */
        }
      }
    });
}

export type ProjectFormValues = z.infer<ReturnType<typeof createProjectFormSchema>>;

const defaultFormValues: ProjectFormValues = {
  name: '',
  clientId: '',
  budgetHours: 0,
  minimumHours: 0,
  monthlyFee: 0,
  status: 'active',
  responsibleDepartmentId: '',
  externalId: '',
  okrs: [],
  projectType: '',
  deliverableContractFee: '',
  deliverableStartDate: '',
  deliverableDueDate: '',
};

export interface ProjectMutateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  editingProject: Project | null;
  clients: Client[];
  departmentOptions: DepartmentDefinition[];
  isCrmExportEnabled: boolean;
  /** Por defecto true en modo edición. */
  showDeleteButton?: boolean;
  onRequestDelete?: (project: Project) => void;
}

export function ProjectMutateDialog({
  open,
  onOpenChange,
  mode,
  editingProject,
  clients,
  departmentOptions,
  isCrmExportEnabled,
  showDeleteButton = true,
  onRequestDelete,
}: ProjectMutateDialogProps) {
  const { t } = useTranslation('app');
  const { inCurrencyParens } = useFormatMoney();
  const currencyLabels = { currencyParens: inCurrencyParens };
  const { addProject, updateProject } = useApp();
  const { currentAgency } = useAgency();

  const projectFormSchema = useMemo(() => createProjectFormSchema(t), [t]);
  const projectForm = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: defaultFormValues,
  });

  const [newOkrTitle, setNewOkrTitle] = useState('');
  const [openFormStatus, setOpenFormStatus] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (mode === 'create') {
      projectForm.reset({ ...defaultFormValues });
      setNewOkrTitle('');
      return;
    }
    if (mode === 'edit' && editingProject) {
      projectForm.reset({
        name: editingProject.name,
        clientId: editingProject.clientId,
        budgetHours: editingProject.budgetHours || 0,
        minimumHours: editingProject.minimumHours || 0,
        monthlyFee: editingProject.monthlyFee || 0,
        status: editingProject.status,
        responsibleDepartmentId: editingProject.responsibleDepartmentId ?? '',
        externalId: editingProject.externalId || '',
        okrs: editingProject.okrs || [],
        projectType: editingProject.projectType ?? '',
        deliverableContractFee:
          editingProject.deliverableContractFee != null && Number.isFinite(editingProject.deliverableContractFee)
            ? String(editingProject.deliverableContractFee)
            : '',
        deliverableStartDate: editingProject.deliverableStartDate ?? '',
        deliverableDueDate: editingProject.deliverableDueDate ?? '',
      });
      setNewOkrTitle('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- al abrir/cambiar proyecto se sincroniza el formulario; `editingProject` va acoplado al id.
  }, [open, mode, editingProject?.id, projectForm]);

  const addOkrToForm = () => {
    if (!newOkrTitle.trim()) return;
    const currentOkrs = projectForm.getValues('okrs') || [];
    projectForm.setValue('okrs', [...currentOkrs, { id: crypto.randomUUID(), title: newOkrTitle, progress: 0 }]);
    setNewOkrTitle('');
  };

  const updateOkrProgress = (id: string, val: number) => {
    const currentOkrs = projectForm.getValues('okrs') || [];
    projectForm.setValue('okrs', currentOkrs.map(o => (o.id === id ? { ...o, progress: val } : o)));
  };

  const removeOkr = (id: string) => {
    const currentOkrs = projectForm.getValues('okrs') || [];
    projectForm.setValue('okrs', currentOkrs.filter(o => o.id !== id));
  };

  const onSaveProject = async (data: ProjectFormValues) => {
    try {
      const pt = data.projectType?.trim() ? data.projectType.trim() : undefined;
      const isEnt = pt === PROJECT_TYPE_ENTREGABLE;
      const deliverableContractFee = isEnt ? parseDeliverableContractFeeInput(data.deliverableContractFee) : null;
      const deliverableStartDate =
        isEnt && data.deliverableStartDate?.trim() ? data.deliverableStartDate.trim() : null;
      const deliverableDueDate = isEnt && data.deliverableDueDate?.trim() ? data.deliverableDueDate.trim() : null;

      if (mode === 'create') {
        await addProject({
          name: data.name,
          clientId: data.clientId,
          budgetHours: Number(data.budgetHours) || 0,
          minimumHours: Number(data.minimumHours) || 0,
          monthlyFee: Number(data.monthlyFee) || 0,
          status: data.status,
          responsibleDepartmentId: data.responsibleDepartmentId || undefined,
          externalId: data.externalId !== '' ? Number(data.externalId) : undefined,
          okrs: (data.okrs || []).map(o => ({ ...o, id: o.id || crypto.randomUUID() })) as OKR[],
          agencyId: currentAgency?.id || '',
          projectType: pt,
          deliverableContractFee,
          deliverableStartDate: deliverableStartDate ?? undefined,
          deliverableDueDate: deliverableDueDate ?? undefined,
        });
        toast.success(t('clientsAndProjects.toasts.projectCreated', 'Proyecto creado'));
      } else if (editingProject) {
        await updateProject({
          ...editingProject,
          name: data.name,
          clientId: data.clientId,
          budgetHours: Number(data.budgetHours) || 0,
          minimumHours: Number(data.minimumHours) || 0,
          monthlyFee: Number(data.monthlyFee) || 0,
          status: data.status,
          responsibleDepartmentId: data.responsibleDepartmentId || undefined,
          externalId: data.externalId !== '' ? Number(data.externalId) : undefined,
          okrs: (data.okrs || []).map(o => ({ ...o, id: o.id || crypto.randomUUID() })) as OKR[],
          projectType: pt,
          deliverableContractFee,
          deliverableStartDate: deliverableStartDate ?? undefined,
          deliverableDueDate: deliverableDueDate ?? undefined,
        });
        toast.success(t('clientsAndProjects.toasts.projectUpdated', 'Proyecto actualizado'));
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Error guardando proyecto:', error);
      const errorMessage = (error as Error)?.message || t('clientsAndProjects.toasts.projectSaveError', 'Error al guardar el proyecto');
      toast.error(errorMessage);
    }
  };

  const isCreate = mode === 'create';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            {isCreate
              ? t('clientsAndProjects.dialogs.newProject.title', 'Nuevo proyecto')
              : t('clientsAndProjects.dialogs.newProject.editTitle', 'Editar proyecto')}
          </DialogTitle>
          <DialogDescription>
            {t('clientsAndProjects.dialogs.newProject.description', 'Configura los detalles del proyecto y presupuesto.')}
          </DialogDescription>
        </DialogHeader>
        <Form {...projectForm}>
          <form onSubmit={projectForm.handleSubmit(onSaveProject)} className="space-y-4 py-4">
            <FormField
              control={projectForm.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('clientsAndProjects.dialogs.newProject.name', 'Nombre del proyecto')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('clientsAndProjects.dialogs.newProject.namePlaceholder', 'Ej: Mantenimiento WEB')}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={projectForm.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('clientsAndProjects.dialogs.newProject.client', 'Cliente')}</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button variant="outline" role="combobox" className="w-full justify-between">
                          {field.value ? (
                            <SensitiveText kind="account" id={field.value}>
                              {clients.find(c => c.id === field.value)?.name || 'Seleccionar cliente'}
                            </SensitiveText>
                          ) : (
                            'Seleccionar cliente'
                          )}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Buscar cliente..." />
                        <CommandList>
                          <CommandEmpty>{t('clientsAndProjects.clientNotFound')}</CommandEmpty>
                          <CommandGroup>
                            {clients.map(client => (
                              <CommandItem
                                key={client.id}
                                value={client.name}
                                onSelect={() => field.onChange(client.id)}
                              >
                                <SensitiveText kind="account" id={client.id}>
                                  {client.name}
                                </SensitiveText>
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
            <div
              className={cn(
                'grid gap-4',
                projectForm.watch('projectType') === PROJECT_TYPE_ENTREGABLE ? 'grid-cols-2' : 'grid-cols-3'
              )}
            >
              <FormField
                control={projectForm.control}
                name="budgetHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('clientsAndProjects.dialogs.newProject.budget', 'Horas asignadas (presupuesto)')}</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={projectForm.control}
                name="minimumHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('clientsAndProjects.dialogs.newProject.minHours', 'Horas mínimas (fee)')}</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {projectForm.watch('projectType') !== PROJECT_TYPE_ENTREGABLE && (
                <FormField
                  control={projectForm.control}
                  name="monthlyFee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t('clientsAndProjects.dialogs.newProject.monthlyFee', {
                          defaultValue: 'Fee mensual {{currencyParens}}',
                          ...currencyLabels,
                        })}
                      </FormLabel>
                      <FormDescription>
                        {t(
                          'clientsAndProjects.dialogs.newProject.monthlyFeeHint',
                          'Importe total que paga el cliente por este proyecto al mes (no es precio por hora).'
                        )}
                      </FormDescription>
                      <FormControl>
                        <Input type="number" placeholder="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
            <FormField
              control={projectForm.control}
              name="projectType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('clientsAndProjects.dialogs.newProject.projectType', 'Tipo de proyecto')}</FormLabel>
                  <FormControl>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={field.value ?? ''}
                      onChange={e => field.onChange(e.target.value)}
                    >
                      <option value="">{t('clientsAndProjects.dialogs.newProject.projectTypeNone', 'Sin tipo / mixto')}</option>
                      {PROJECT_TYPE_PRESET_VALUES.map(v => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormDescription>
                    {t(
                      'clientsAndProjects.dialogs.newProject.projectTypeHelp',
                      '«Entregable»: importe total y fechas de fase se configuran aquí; el ingreso por mes se prorratea en rentabilidad. Retainers suelen ser «Mensual».'
                    )}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            {projectForm.watch('projectType') === PROJECT_TYPE_ENTREGABLE && (
              <div className="space-y-4 rounded-lg border border-border bg-muted/40 p-4">
                <p className="text-sm text-muted-foreground">
                  {t(
                    'clientsAndProjects.dialogs.newProject.deliverableBlockIntro',
                    'Opcional: importe total del contrato distinto del fee mensual. Si lo dejas vacío, el fee mensual se usa como total al repartir entre meses. Las fechas acotan la fase (días de calendario).'
                  )}
                </p>
                <FormField
                  control={projectForm.control}
                  name="deliverableContractFee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t('clientsAndProjects.dialogs.newProject.deliverableTotalFee', {
                          defaultValue: 'Importe total del contrato {{currencyParens}}',
                          ...currencyLabels,
                        })}
                      </FormLabel>
                      <FormControl>
                        <Input type="text" inputMode="decimal" placeholder="Ej: 12000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={projectForm.control}
                    name="deliverableStartDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('clientsAndProjects.dialogs.newProject.deliverableStart', 'Inicio fase')}</FormLabel>
                        <FormControl>
                          <PhaseDatePickerButton
                            value={field.value ?? ''}
                            onChange={field.onChange}
                            placeholder={t('clientsAndProjects.dialogs.newProject.deliverableStartPh', 'Elegir inicio')}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={projectForm.control}
                    name="deliverableDueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('clientsAndProjects.dialogs.newProject.deliverableDue', 'Fin previsto')}</FormLabel>
                        <FormControl>
                          <PhaseDatePickerButton
                            value={field.value ?? ''}
                            onChange={field.onChange}
                            placeholder={t('clientsAndProjects.dialogs.newProject.deliverableDuePh', 'Elegir fin')}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}
            <FormField
              control={projectForm.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                  <Popover open={openFormStatus} onOpenChange={setOpenFormStatus}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button variant="outline" className="w-full justify-between font-normal">
                          <span className="truncate">
                            {field.value === 'active'
                              ? 'Activo'
                              : field.value === 'completed'
                                ? 'Completado'
                                : field.value === 'archived'
                                  ? 'Archivado'
                                  : 'Estado'}
                          </span>
                          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                      <Command>
                        <CommandList className="max-h-[280px]">
                          <CommandGroup>
                            <CommandItem
                              value="Activo"
                              onSelect={() => {
                                field.onChange('active');
                                setOpenFormStatus(false);
                              }}
                            >
                              <Check className={cn('mr-2 h-4 w-4 shrink-0', field.value === 'active' ? 'opacity-100' : 'opacity-0')} />
                              Activo
                            </CommandItem>
                            <CommandItem
                              value="Completado"
                              onSelect={() => {
                                field.onChange('completed');
                                setOpenFormStatus(false);
                              }}
                            >
                              <Check className={cn('mr-2 h-4 w-4 shrink-0', field.value === 'completed' ? 'opacity-100' : 'opacity-0')} />
                              Completado
                            </CommandItem>
                            <CommandItem
                              value="Archivado"
                              onSelect={() => {
                                field.onChange('archived');
                                setOpenFormStatus(false);
                              }}
                            >
                              <Check className={cn('mr-2 h-4 w-4 shrink-0', field.value === 'archived' ? 'opacity-100' : 'opacity-0')} />
                              Archivado
                            </CommandItem>
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            {departmentOptions.length > 0 && (
              <FormField
                control={projectForm.control}
                name="responsibleDepartmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Departamento responsable</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant="outline" className="w-full justify-between font-normal">
                            <span className="truncate">
                              {field.value
                                ? (departmentOptions.find(d => d.id === field.value)?.name ?? 'Sin asignar')
                                : 'Sin asignar'}
                            </span>
                            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                        <Command>
                          <CommandList className="max-h-[280px]">
                            <CommandItem value="Sin asignar" onSelect={() => field.onChange('')}>
                              <Check className={cn('mr-2 h-4 w-4 shrink-0', !field.value ? 'opacity-100' : 'opacity-0')} />
                              Sin asignar
                            </CommandItem>
                            {departmentOptions.map(dept => (
                              <CommandItem key={dept.id} value={dept.name} onSelect={() => field.onChange(dept.id)}>
                                <Check
                                  className={cn('mr-2 h-4 w-4 shrink-0', field.value === dept.id ? 'opacity-100' : 'opacity-0')}
                                />
                                <span
                                  className="mr-2 h-3 w-3 shrink-0 rounded-full border border-slate-300"
                                  style={{ backgroundColor: dept.color }}
                                />
                                {dept.name}
                              </CommandItem>
                            ))}
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            {isCrmExportEnabled && (
              <div className="space-y-2 rounded-lg border border-purple-200 bg-purple-50 p-4">
                <div className="flex items-center gap-2">
                  <LinkIcon className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-semibold text-purple-800">IDs externos</span>
                </div>
                <FormField
                  control={projectForm.control}
                  name="externalId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-purple-700">ID externo (proyecto)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Ej: 123"
                          className="bg-white"
                          {...field}
                          value={field.value === '' ? '' : field.value}
                          onChange={e => field.onChange(e.target.value ? Number(e.target.value) : '')}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>Objetivos (OKRs)</Label>
              <div className="flex gap-2">
                <Input
                  value={newOkrTitle}
                  onChange={e => setNewOkrTitle(e.target.value)}
                  placeholder="Añadir objetivo..."
                  onKeyDown={e => e.key === 'Enter' && addOkrToForm()}
                />
                <Button type="button" onClick={addOkrToForm} variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {(projectForm.watch('okrs') || []).length > 0 && (
                <div className="mt-2 space-y-2">
                  {(projectForm.watch('okrs') || []).map(okr => (
                    <div key={okr.id} className="flex items-center gap-2 rounded bg-slate-50 p-2">
                      <span className="flex-1 text-sm">{okr.title}</span>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={okr.progress}
                        onChange={e => updateOkrProgress(okr.id, parseInt(e.target.value, 10) || 0)}
                        className="w-20"
                      />
                      <span className="text-xs text-muted-foreground">%</span>
                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeOkr(okr.id)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <DialogFooter>
              {!isCreate && showDeleteButton && editingProject && onRequestDelete && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => onRequestDelete(editingProject)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar
                </Button>
              )}
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-gradient-to-r from-indigo-500 to-purple-600">
                {isCreate ? 'Crear' : 'Guardar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
