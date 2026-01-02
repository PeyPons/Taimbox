import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Employee, WorkSchedule, EmployeeRole } from '@/types';
import { UserPermissions, PERMISSION_LABELS, DEFAULT_PERMISSIONS } from '@/types/permissions';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Briefcase, CalendarClock, Target, Lock, Clock, ShieldCheck, Hash, Key } from 'lucide-react';

import { ScheduleEditor } from './ScheduleEditor';
import { ProjectsSheet } from './ProjectsSheet';
import { ProfessionalGoalsSheet } from './ProfessionalGoalsSheet';
import { AbsencesSheet } from './AbsencesSheet';

interface EmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeToEdit?: Employee | null;
}

const defaultSchedule: WorkSchedule = {
  monday: 8, tuesday: 8, wednesday: 8, thursday: 8, friday: 8, saturday: 0, sunday: 0
};

// Schema de validación con Zod
const employeeFormSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  password: z.string().optional(),
  role: z.enum(['Responsable', 'Coordinador', 'SEO', 'PPC']),
  department: z.enum(['SEO', 'PPC']),
  capacity: z.number().min(1, 'La capacidad debe ser mayor a 0').max(168, 'La capacidad no puede exceder 168 horas'),
  hourlyRate: z.number().min(0, 'El coste por hora no puede ser negativo'),
  crmUserId: z.number().optional().or(z.literal('')),
  workSchedule: z.object({
    monday: z.number().min(0).max(24),
    tuesday: z.number().min(0).max(24),
    wednesday: z.number().min(0).max(24),
    thursday: z.number().min(0).max(24),
    friday: z.number().min(0).max(24),
    saturday: z.number().min(0).max(24),
    sunday: z.number().min(0).max(24),
  }),
  permissions: z.any().optional(), // Mantenemos any porque UserPermissions tiene keys específicas
}).refine((data) => {
  // Para nuevos empleados, email y password son obligatorios
  // Esta validación se hará en el handleSubmit
  return true;
});

type EmployeeFormValues = z.infer<typeof employeeFormSchema>;

export function EmployeeDialog({ open, onOpenChange, employeeToEdit }: EmployeeDialogProps) {
  const { addEmployee, updateEmployee } = useApp();

  const [isProcessing, setIsProcessing] = useState(false);
  const [showProjects, setShowProjects] = useState(false);
  const [showGoals, setShowGoals] = useState(false);
  const [showAbsences, setShowAbsences] = useState(false);

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'SEO',
      department: 'SEO',
      capacity: 40,
      hourlyRate: 0,
      crmUserId: '',
      workSchedule: defaultSchedule,
      permissions: DEFAULT_PERMISSIONS,
    },
  });

  const workSchedule = form.watch('workSchedule');
  const permissions = form.watch('permissions') || DEFAULT_PERMISSIONS;

  useEffect(() => {
    if (open) {
      if (employeeToEdit) {
        form.reset({
          name: employeeToEdit.name,
          email: employeeToEdit.email || '',
          password: '',
          role: employeeToEdit.role || 'SEO',
          department: employeeToEdit.department || 'SEO',
          capacity: employeeToEdit.defaultWeeklyCapacity,
          hourlyRate: employeeToEdit.hourlyRate || 0,
          crmUserId: employeeToEdit.crmUserId || '',
          workSchedule: employeeToEdit.workSchedule || defaultSchedule,
          permissions: employeeToEdit.permissions || DEFAULT_PERMISSIONS,
        });
      } else {
        form.reset({
          name: '',
          email: '',
          password: '',
          role: 'SEO',
          department: 'SEO',
          capacity: 40,
          hourlyRate: 0,
          crmUserId: '',
          workSchedule: defaultSchedule,
          permissions: DEFAULT_PERMISSIONS,
        });
      }
    }
  }, [open, employeeToEdit, form]);

  const onSubmit = async (data: EmployeeFormValues) => {
    setIsProcessing(true);

    let authUserId = employeeToEdit?.user_id;
    let authMessage = "";

    try {
      const isNewEmployee = !employeeToEdit;
      const hasPassword = (data.password || '').length >= 6;
      const emailValue = data.email?.trim() || '';

      // Para NUEVOS empleados, es OBLIGATORIO crear cuenta de acceso
      if (isNewEmployee) {
        if (!emailValue) {
          toast.error("El email es obligatorio para crear un nuevo empleado");
          form.setError('email', { message: 'El email es obligatorio' });
          setIsProcessing(false);
          return;
        }
        if (!hasPassword) {
          toast.error("La contraseña es obligatoria (mínimo 6 caracteres) para crear un nuevo empleado");
          form.setError('password', { message: 'La contraseña debe tener al menos 6 caracteres' });
          setIsProcessing(false);
          return;
        }

        // Crear usuario en Supabase Auth
        console.log('[EmployeeDialog] Creando usuario en Auth:', emailValue);
        const { data: authData, error } = await supabase.functions.invoke('create-user', {
          body: { email: emailValue, password: data.password, name: data.name }
        });

        if (error) {
          console.error('[EmployeeDialog] Error en create-user:', error);

          // Intentar obtener más detalles del error
          let errorMessage = 'Error al crear cuenta de acceso';
          if (error.message) {
            errorMessage = error.message;
          } else if (error.context) {
            errorMessage = error.context.message || errorMessage;
          }

          // Si el error viene de la función, intentar parsear el body
          if (error.context?.body) {
            try {
              const errorBody = typeof error.context.body === 'string'
                ? JSON.parse(error.context.body)
                : error.context.body;
              if (errorBody.error) {
                errorMessage = errorBody.error;
              }
            } catch (e) {
              // Ignorar error de parsing
            }
          }

          throw new Error(errorMessage);
        }

        if (!authData?.user?.id) {
          console.error('[EmployeeDialog] No se recibió user.id. Respuesta completa:', authData);
          throw new Error('No se pudo crear la cuenta de acceso. La función no devolvió un ID de usuario. Verifica que la Edge Function "create-user" esté desplegada en Supabase.');
        }

        authUserId = authData.user.id;
        authMessage = "Empleado y cuenta de acceso creados.";
        console.log('[EmployeeDialog] Usuario Auth creado:', authUserId);
      }
      // Para empleados EXISTENTES, solo actualizar si hay nueva contraseña
      else if (hasPassword) {
        if (!emailValue) {
          toast.error("Debes proporcionar un email para actualizar el acceso");
          form.setError('email', { message: 'El email es obligatorio' });
          setIsProcessing(false);
          return;
        }

        if (employeeToEdit?.user_id) {
          // Ya tiene cuenta de auth -> actualizar credenciales
          const { error } = await supabase.functions.invoke('update-user', {
            body: { userId: employeeToEdit.user_id, password: data.password, email: emailValue }
          });
          if (error) throw error;
          authMessage = "Credenciales actualizadas.";
        } else {
          // Empleado existente SIN cuenta de auth -> crear nueva
          console.log('[EmployeeDialog] Creando cuenta Auth para empleado existente:', emailValue);
          // Renombrar 'data' a 'newAuthData' para evitar conflicto con el argumento 'data' de la función
          const { data: newAuthData, error } = await supabase.functions.invoke('create-user', {
            body: { email: emailValue, password: data.password, name: data.name }
          });

          if (error) {
            console.error('[EmployeeDialog] Error en create-user:', error);

            // Intentar obtener más detalles del error
            let errorMessage = 'Error al crear cuenta de acceso';
            if (error.message) {
              errorMessage = error.message;
            } else if (error.context) {
              errorMessage = error.context.message || errorMessage;
            }

            // Si el error viene de la función, intentar parsear el body
            if (error.context?.body) {
              try {
                const errorBody = typeof error.context.body === 'string'
                  ? JSON.parse(error.context.body)
                  : error.context.body;
                if (errorBody.error) {
                  errorMessage = errorBody.error;
                }
              } catch (e) {
                // Ignorar error de parsing
              }
            }

            throw new Error(errorMessage);
          }

          if (!newAuthData?.user?.id) {
            console.error('[EmployeeDialog] No se recibió user.id. Respuesta completa:', newAuthData);
            throw new Error('No se pudo crear la cuenta de acceso. La función no devolvió un ID de usuario.');
          }

          authUserId = newAuthData.user.id;
          authMessage = "Cuenta de acceso creada.";
        }
      }

      const employeeData = {
        agencyId: employeeToEdit?.agencyId || '', // Se rellenará en el backend/contexto pero TS lo requiere
        name: data.name,
        email: emailValue || undefined,
        user_id: authUserId,
        role: data.role,
        department: data.department,
        defaultWeeklyCapacity: data.capacity,
        hourlyRate: data.hourlyRate,
        crmUserId: data.crmUserId !== '' ? Number(data.crmUserId) : undefined,
        workSchedule: data.workSchedule as WorkSchedule,
        permissions: data.permissions || DEFAULT_PERMISSIONS,
        isActive: true,
        avatarUrl: employeeToEdit?.avatarUrl || `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${data.name}`
      };

      if (employeeToEdit) {
        await updateEmployee({ ...employeeToEdit, ...employeeData });
        toast.success(authMessage || "Empleado actualizado");
      } else {
        await addEmployee(employeeData);
        toast.success(authMessage || "Empleado creado");
      }
      onOpenChange(false);

    } catch (error) {
      console.error("Error completo:", error);

      // Intentar extraer el mensaje de error más descriptivo
      let errorMsg = "Error al guardar";

      const err = error as { message?: string; error?: { message?: string } };
      if (err?.message) {
        errorMsg = err.message;
      } else if (err?.error?.message) {
        errorMsg = err.error.message;
      } else if (typeof error === 'string') {
        errorMsg = error;
      }

      // Mensajes específicos para errores comunes
      if (errorMsg.includes("already been registered") || errorMsg.includes("already exists") || errorMsg.includes("duplicate")) {
        toast.error("Este usuario ya está registrado en Timeboxing");
      } else if (errorMsg.includes("invalid email") || errorMsg.includes("email")) {
        toast.error("El formato del email no es válido.");
      } else if (errorMsg.includes("password") && errorMsg.includes("weak")) {
        toast.error("La contraseña es demasiado débil. Usa al menos 6 caracteres.");
      } else if (errorMsg.includes("Edge Function") || errorMsg.includes("desplegada")) {
        toast.error("Error: La función 'create-user' no está desplegada. Contacta al administrador.");
      } else {
        toast.error(errorMsg);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const isEditing = !!employeeToEdit;
  const hasAccess = isEditing && !!employeeToEdit.user_id;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Editar empleado' : 'Nuevo empleado'}</DialogTitle>
            <DialogDescription>Modifica datos, acceso y horario.</DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="profile" className="w-full mt-2">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profile">Perfil</TabsTrigger>
              <TabsTrigger value="permissions" disabled={!isEditing}>Permisos</TabsTrigger>
              <TabsTrigger value="schedule" disabled={!isEditing}>Horario</TabsTrigger>
              <TabsTrigger value="management" disabled={!isEditing}>Gestión</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-4 py-4">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre completo</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className={`p-4 border rounded-lg space-y-4 ${isEditing ? 'bg-slate-50' : 'bg-amber-50 border-amber-200'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {hasAccess ? (
                        <>
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          <span className="text-sm font-semibold text-slate-700">Acceso activo</span>
                        </>
                      ) : isEditing ? (
                        <>
                          <Lock className="w-4 h-4 text-red-500" />
                          <span className="text-sm font-semibold text-red-700">Sin acceso al sistema</span>
                        </>
                      ) : (
                        <>
                          <Key className="w-4 h-4 text-amber-600" />
                          <span className="text-sm font-semibold text-amber-800">Configurar acceso (obligatorio)</span>
                        </>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Email {!isEditing && <span className="text-red-500">*</span>}
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="usuario@agencia.com"
                                {...field}
                                className={!isEditing && !field.value ? 'border-amber-300' : ''}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {hasAccess ? 'Nueva contraseña' : 'Contraseña'}
                              {!isEditing && <span className="text-red-500">*</span>}
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder={hasAccess ? "Dejar vacío para no cambiar" : "Mínimo 6 caracteres"}
                                autoComplete="new-password"
                                {...field}
                                className={!isEditing && (field.value || '').length < 6 ? 'border-amber-300' : ''}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <p className={`text-xs ${isEditing ? 'text-slate-500' : 'text-amber-700'}`}>
                      {hasAccess
                        ? "Deja la contraseña vacía si no quieres cambiarla."
                        : isEditing
                          ? "Este empleado no puede acceder al sistema. Introduce email y contraseña para habilitarlo."
                          : "El email y la contraseña son obligatorios para que el empleado pueda acceder al sistema."}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rol</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona un rol" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Responsable">Responsable</SelectItem>
                              <SelectItem value="Coordinador">Coordinador</SelectItem>
                              <SelectItem value="SEO">SEO</SelectItem>
                              <SelectItem value="PPC">PPC</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="department"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Departamento</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="SEO">SEO</SelectItem>
                              <SelectItem value="PPC">PPC</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="capacity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Capacidad (h/sem)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="hourlyRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Coste/Hora (€)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Campo CRM User ID */}
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg space-y-2">
                    <div className="flex items-center gap-2">
                      <Hash className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-semibold text-purple-800">Integración CRM</span>
                    </div>
                    <FormField
                      control={form.control}
                      name="crmUserId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-purple-700">ID Usuario CRM</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Ej: 33"
                              className="bg-white"
                              {...field}
                              value={field.value === '' ? '' : field.value}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : '')}
                            />
                          </FormControl>
                          <FormDescription className="text-xs text-purple-600">
                            Este ID se usa para exportar tareas al CRM. Déjalo vacío si no aplica.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={isProcessing}>
                      {isProcessing ? 'Guardando...' : 'Guardar datos'}
                    </Button>
                  </div>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="permissions" className="py-4 space-y-4">
              <div className="bg-primary/10 text-indigo-800 p-3 rounded-md text-sm flex gap-2">
                <Key className="h-5 w-5 shrink-0" />
                <p>Controla a qué secciones puede acceder este empleado. Si un permiso está desactivado, no verá esa sección en el menú.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">Gestión</h3>
                  {(['can_access_planner', 'can_access_projects', 'can_access_clients', 'can_access_team', 'can_access_settings'] as const).map((permission) => (
                    <div key={permission} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50">
                      <div className="flex-1">
                        <Label htmlFor={permission} className="text-sm font-medium cursor-pointer">
                          {PERMISSION_LABELS[permission]}
                        </Label>
                      </div>
                      <Switch
                        id={permission}
                        checked={permissions[permission] !== false}
                        onCheckedChange={(checked) => {
                          const newPermissions = { ...permissions, [permission]: checked };
                          form.setValue('permissions', newPermissions);
                        }}
                      />
                    </div>
                  ))}
                </div>

                <div className="space-y-3 pt-4 border-t">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">PPC</h3>
                  {(['can_access_google_ads', 'can_access_meta_ads', 'can_access_ads_reports'] as const).map((permission) => (
                    <div key={permission} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50">
                      <div className="flex-1">
                        <Label htmlFor={permission} className="text-sm font-medium cursor-pointer">
                          {PERMISSION_LABELS[permission]}
                        </Label>
                      </div>
                      <Switch
                        id={permission}
                        checked={permissions[permission] !== false}
                        onCheckedChange={(checked) => {
                          const newPermissions = { ...permissions, [permission]: checked };
                          form.setValue('permissions', newPermissions);
                        }}
                      />
                    </div>
                  ))}
                </div>

                <div className="space-y-3 pt-4 border-t">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">Análisis</h3>
                  {(['can_access_reports', 'can_access_client_reports'] as const).map((permission) => (
                    <div key={permission} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50">
                      <div className="flex-1">
                        <Label htmlFor={permission} className="text-sm font-medium cursor-pointer">
                          {PERMISSION_LABELS[permission]}
                        </Label>
                      </div>
                      <Switch
                        id={permission}
                        checked={permissions[permission] !== false}
                        onCheckedChange={(checked) => {
                          const newPermissions = { ...permissions, [permission]: checked };
                          form.setValue('permissions', newPermissions);
                        }}
                      />
                    </div>
                  ))}
                </div>

                <div className="space-y-3 pt-4 border-t">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">Otros</h3>
                  {(['can_access_deadlines', 'can_access_okrs', 'can_access_weekly_forecast', 'can_access_settings'] as const).map((permission) => (
                    <div key={permission} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50">
                      <div className="flex-1">
                        <Label htmlFor={permission} className="text-sm font-medium cursor-pointer">
                          {PERMISSION_LABELS[permission]}
                        </Label>
                      </div>
                      <Switch
                        id={permission}
                        checked={permissions[permission] !== false}
                        onCheckedChange={(checked) => {
                          const newPermissions = { ...permissions, [permission]: checked };
                          form.setValue('permissions', newPermissions);
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t">
                <Button onClick={form.handleSubmit(onSubmit)} className="bg-primary" disabled={isProcessing}>
                  {isProcessing ? 'Guardando...' : 'Guardar permisos'}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="schedule" className="py-4">
              <div className="space-y-4">
                <div className="bg-blue-50 text-blue-800 p-3 rounded-md text-sm flex gap-2">
                  <Clock className="h-5 w-5 shrink-0" />
                  <p>Ajusta las horas diarias. Esto recalculará la capacidad semanal automáticamente.</p>
                </div>
                <ScheduleEditor
                  schedule={workSchedule as WorkSchedule}
                  onChange={(newSchedule) => form.setValue('workSchedule', newSchedule as WorkSchedule)}
                />
                <div className="flex justify-end pt-2">
                  <Button onClick={form.handleSubmit(onSubmit)} className="bg-primary">Guardar horario</Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="management" className="py-4 space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <Button variant="outline" className="justify-start gap-4 h-auto p-4" onClick={() => setShowProjects(true)}>
                  <Briefcase className="h-5 w-5 text-primary" />
                  <div className="text-left">
                    <div className="font-semibold">Proyectos</div>
                    <div className="text-xs text-muted-foreground">Asignaciones</div>
                  </div>
                </Button>
                <Button variant="outline" className="justify-start gap-4 h-auto p-4" onClick={() => setShowGoals(true)}>
                  <Target className="h-5 w-5 text-emerald-600" />
                  <div className="text-left">
                    <div className="font-semibold">Objetivos</div>
                    <div className="text-xs text-muted-foreground">OKRs</div>
                  </div>
                </Button>
                <Button variant="outline" className="justify-start gap-4 h-auto p-4" onClick={() => setShowAbsences(true)}>
                  <CalendarClock className="h-5 w-5 text-amber-600" />
                  <div className="text-left">
                    <div className="font-semibold">Ausencias</div>
                    <div className="text-xs text-muted-foreground">Vacaciones</div>
                  </div>
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Sheets Auxiliares */}
      {employeeToEdit && (
        <>
          <ProjectsSheet open={showProjects} onOpenChange={setShowProjects} employeeId={employeeToEdit.id} />
          <ProfessionalGoalsSheet open={showGoals} onOpenChange={setShowGoals} employeeId={employeeToEdit.id} />
          <AbsencesSheet open={showAbsences} onOpenChange={setShowAbsences} employeeId={employeeToEdit.id} />
        </>
      )}
    </>
  );
}
