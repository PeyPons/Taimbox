import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAgency } from '@/contexts/AgencyContext';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Building2, Users, UserCircle, FolderKanban, Check, ArrowRight, ArrowLeft, Sparkles, X, Plus, Layers, UserPlus, Trash2, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DEFAULT_PERMISSIONS } from '@/types/permissions';

// Pasos del wizard (sin empresa - ya se pide en el registro)
type WizardStep = 'roles' | 'departments' | 'employees' | 'client' | 'project';

const STEPS: { id: WizardStep; title: string; description: string; icon: React.ReactNode }[] = [
    { id: 'roles', title: 'Roles', description: 'Define los roles de tu equipo', icon: <Users className="h-5 w-5" /> },
    { id: 'departments', title: 'Departamentos', description: 'Define los departamentos', icon: <Layers className="h-5 w-5" /> },
    { id: 'employees', title: 'Equipo', description: 'Añade miembros (opcional)', icon: <UserPlus className="h-5 w-5" /> },
    { id: 'client', title: 'Primer cliente', description: 'Crea tu primer cliente', icon: <UserCircle className="h-5 w-5" /> },
    { id: 'project', title: 'Primer proyecto', description: 'Crea tu primer proyecto', icon: <FolderKanban className="h-5 w-5" /> },
];

// Tipo para empleados pendientes de crear
interface PendingEmployee {
    id: string;
    name: string;
    email: string;
    password: string;
    role: string;
    department: string;
}

// Schemas

const clientSchema = z.object({
    name: z.string().min(2, 'El nombre del cliente es obligatorio'),
    color: z.string().min(1, 'Selecciona un color'),
});

const projectSchema = z.object({
    name: z.string().min(2, 'El nombre del proyecto es obligatorio'),
    budgetHours: z.number().min(1, 'El budget debe ser mayor a 0'),
    minHours: z.number().min(0, 'Las horas mínimas no pueden ser negativas').optional(),
    hourlyRate: z.number().min(0, 'El fee debe ser positivo').optional(),
});

// Colores predefinidos para clientes
const CLIENT_COLORS = [
    '#FF5733', '#33FF57', '#3357FF', '#FF33F5', '#FFB533',
    '#33FFF5', '#8B33FF', '#FF3333', '#33FF8B', '#3399FF',
];

export default function OnboardingWizard() {
    const navigate = useNavigate();
    const { currentAgency, updateAgencyName, updateSettings, completeSetup, isLoading: isAgencyLoading } = useAgency();
    const { addClient, addProject, addEmployee, clients } = useApp();

    const [currentStep, setCurrentStep] = useState<WizardStep>('roles');
    const [isProcessing, setIsProcessing] = useState(false);
    const [roles, setRoles] = useState<string[]>(['Responsable', 'Coordinador', 'Especialista']);
    const [newRole, setNewRole] = useState('');
    const [departments, setDepartments] = useState<string[]>(['SEO', 'PPC']);
    const [newDepartment, setNewDepartment] = useState('');
    const [pendingEmployees, setPendingEmployees] = useState<PendingEmployee[]>([]);
    const [newEmployee, setNewEmployee] = useState<Omit<PendingEmployee, 'id'>>({
        name: '', email: '', password: '', role: '', department: ''
    });
    // Set default values when steps change or arrays load
    useEffect(() => {
        setNewEmployee(prev => ({
            ...prev,
            role: roles[0] || '',
            department: departments[0] || ''
        }));
    }, [roles, departments]);

    const [createdClientId, setCreatedClientId] = useState<string | null>(null);

    const currentStepIndex = STEPS.findIndex(s => s.id === currentStep);

    // Forms
    const clientForm = useForm({
        resolver: zodResolver(clientSchema),
        defaultValues: { name: '', color: CLIENT_COLORS[0] },
    });

    const projectForm = useForm({
        resolver: zodResolver(projectSchema),
        defaultValues: { name: '', budgetHours: 20, minHours: 0, hourlyRate: 0 },
    });

    const goToNextStep = () => {
        const nextIndex = currentStepIndex + 1;
        if (nextIndex < STEPS.length) {
            setCurrentStep(STEPS[nextIndex].id);
        }
    };

    const goToPrevStep = () => {
        const prevIndex = currentStepIndex - 1;
        if (prevIndex >= 0) {
            setCurrentStep(STEPS[prevIndex].id);
        }
    };

    if (isAgencyLoading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-slate-400">Cargando configuración...</p>
                </div>
            </div>
        );
    }

    // Handlers
    const handleRolesSubmit = async () => {
        if (roles.length === 0) {
            toast.error('Debes definir al menos un rol para continuar');
            return;
        }
        setIsProcessing(true);
        try {
            // Guardar roles en settings de la agencia usando el contexto
            // Convertir string[] a RolePermissions[] para mantener consistencia con el nuevo sistema
            const rolesToSave = roles.map(r => ({
                name: r,
                permissions: r.toLowerCase().includes('responsable') || r.toLowerCase().includes('ceo')
                    ? DEFAULT_PERMISSIONS
                    : { ...DEFAULT_PERMISSIONS, can_access_team: false, can_access_agency_settings: false }
            }));

            await updateSettings({ roles: rolesToSave });
            goToNextStep();
        } catch (error) {
            console.error('Error al guardar roles:', error);
            toast.error('Error al guardar los roles');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDepartmentsSubmit = async () => {
        if (departments.length === 0) {
            toast.error('Debes definir al menos un departamento para continuar');
            return;
        }
        setIsProcessing(true);
        try {
            // Guardar roles y departamentos en settings de la agencia usando el contexto
            const rolesToSave = roles.map(r => ({
                name: r,
                permissions: r.toLowerCase().includes('responsable') || r.toLowerCase().includes('ceo')
                    ? DEFAULT_PERMISSIONS
                    : { ...DEFAULT_PERMISSIONS, can_access_team: false, can_access_agency_settings: false }
            }));

            await updateSettings({ roles: rolesToSave, departments });
            goToNextStep();
        } catch (error) {
            console.error('Error al guardar departamentos:', error);
            toast.error('Error al guardar los departamentos');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleClientSubmit = async (data: z.infer<typeof clientSchema>) => {
        setIsProcessing(true);
        try {
            await addClient({
                name: data.name,
                color: data.color,
                agencyId: currentAgency?.id || '',
            });
            // Obtener el cliente recién creado (último en la lista)
            setTimeout(() => {
                const newestClient = clients[clients.length - 1];
                if (newestClient) {
                    setCreatedClientId(newestClient.id);
                }
            }, 500);
            goToNextStep();
        } catch (error) {
            toast.error('Error al crear el cliente');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleProjectSubmit = async (data: z.infer<typeof projectSchema>) => {
        setIsProcessing(true);
        try {
            const clientId = createdClientId || clients[0]?.id;
            if (!clientId) {
                toast.error('No se encontró un cliente. Vuelve al paso anterior.');
                return;
            }

            await addProject({
                name: data.name,
                clientId,
                budgetHours: data.budgetHours,
                minimumHours: data.minHours,
                monthlyFee: data.hourlyRate,
                status: 'active',
                agencyId: currentAgency?.id || '',
            });

            // Completar el setup
            await completeSetup();

            toast.success('¡Configuración completada!');
            navigate('/dashboard', { replace: true });
        } catch (error) {
            toast.error('Error al crear el proyecto');
        } finally {
            setIsProcessing(false);
        }
    };

    const addRole = () => {
        if (roles.length >= 10) {
            toast.error('Máximo 10 roles permitidos');
            return;
        }
        if (newRole.trim() && !roles.includes(newRole.trim())) {
            setRoles([...roles, newRole.trim()]);
            setNewRole('');
        }
    };


    const removeRole = (roleToRemove: string) => {
        setRoles(roles.filter(r => r !== roleToRemove));
    };

    const addDepartment = () => {
        if (departments.length >= 5) {
            toast.error('Máximo 5 departamentos permitidos');
            return;
        }
        if (newDepartment.trim() && !departments.includes(newDepartment.trim())) {
            setDepartments([...departments, newDepartment.trim()]);
            setNewDepartment('');
        }
    };


    const removeDepartment = (deptToRemove: string) => {
        setDepartments(departments.filter(d => d !== deptToRemove));
    };

    const addPendingEmployee = () => {
        if (!newEmployee.name.trim() || !newEmployee.email.trim() || newEmployee.password.length < 6) {
            toast.error('Completa nombre, email y contraseña (mín. 6 caracteres)');
            return;
        }
        if (pendingEmployees.some(e => e.email === newEmployee.email.trim())) {
            toast.error('Ya existe un empleado con ese email');
            return;
        }
        setPendingEmployees([...pendingEmployees, {
            id: crypto.randomUUID(),
            name: newEmployee.name.trim(),
            email: newEmployee.email.trim().toLowerCase(),
            password: newEmployee.password,
            role: newEmployee.role || roles[0] || 'Responsable',
            department: newEmployee.department || departments[0] || 'SEO',
        }]);
        setNewEmployee({ name: '', email: '', password: '', role: roles[0] || 'Responsable', department: departments[0] || 'SEO' });
    };

    const removePendingEmployee = (id: string) => {
        setPendingEmployees(pendingEmployees.filter(e => e.id !== id));
    };

    const handleEmployeesSubmit = async () => {
        setIsProcessing(true);
        try {
            // Crear empleados si hay alguno pendiente
            for (const emp of pendingEmployees) {
                // 1. Crear usuario en Auth
                const { data: authData, error: authError } = await supabase.functions.invoke('create-user', {
                    body: { email: emp.email, password: emp.password, name: emp.name }
                });

                if (authError) {
                    console.error('Error creando usuario:', emp.email, authError);

                    // Intentar extraer mensaje de error específico
                    let msg = `Error al crear cuenta para ${emp.name}`;
                    try {
                        // El error puede venir como objeto JSON en el cuerpo de la respuesta
                        const errorBody = await authError.context?.json();
                        if (errorBody?.error) {
                            msg = errorBody.error;
                        }
                    } catch (e) {
                        // Fallback a mensajes conocidos
                        if (authError.message?.includes('functions_http_error')) {
                            // Probablemente 400 Bad Request desde la función
                            msg = `Error: El usuario ${emp.email} ya existe o los datos son inválidos.`;
                        } else {
                            msg = authError.message || msg;
                        }
                    }

                    toast.error(msg);
                    continue;
                }

                // 2. Crear empleado usando la función del contexto para asegurar mapeo correcto y actualización de estado
                await addEmployee({
                    agencyId: currentAgency?.id || '',
                    name: emp.name,
                    email: emp.email,
                    user_id: authData?.user?.id,
                    role: emp.role || roles[0],
                    department: emp.department || departments[0],
                    defaultWeeklyCapacity: 40,
                    workSchedule: {
                        monday: 8, tuesday: 8, wednesday: 8, thursday: 8, friday: 8, saturday: 0, sunday: 0
                    },
                    isActive: true,
                    hourlyRate: 0,
                });
            }

            if (pendingEmployees.length > 0) {
                toast.success(`${pendingEmployees.length} empleado(s) creado(s)`);
            }
            goToNextStep();
        } catch (error) {
            console.error('Error en handleEmployeesSubmit:', error);
            toast.error('Error al crear los empleados');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl">
                {/* Progress Steps */}
                <div className="flex justify-center mb-8">
                    <div className="flex items-center gap-2">
                        {STEPS.map((step, idx) => (
                            <div key={step.id} className="flex items-center">
                                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center transition-all
                  ${idx < currentStepIndex
                                        ? 'bg-emerald-500 text-white'
                                        : idx === currentStepIndex
                                            ? 'bg-primary text-white ring-4 ring-primary/30'
                                            : 'bg-slate-700 text-slate-400'}
                `}>
                                    {idx < currentStepIndex ? <Check className="h-5 w-5" /> : step.icon}
                                </div>
                                {idx < STEPS.length - 1 && (
                                    <div className={`w-12 h-1 mx-1 rounded ${idx < currentStepIndex ? 'bg-emerald-500' : 'bg-slate-700'}`} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <Card className="bg-white/95 backdrop-blur shadow-2xl border-0">
                    <CardHeader className="text-center pb-2">
                        <div className="flex justify-center mb-4">
                            <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-indigo-500/20">
                                {STEPS[currentStepIndex].icon}
                            </div>
                        </div>
                        <CardTitle className="text-2xl">{STEPS[currentStepIndex].title}</CardTitle>
                        <CardDescription>{STEPS[currentStepIndex].description}</CardDescription>
                    </CardHeader>

                    <CardContent className="pt-4">
                        {/* Step: Roles */}
                        {currentStep === 'roles' && (
                            <div className="space-y-6">
                                <div className="flex flex-wrap gap-2 min-h-[40px]">
                                    {roles.length === 0 ? (
                                        <p className="text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                                            No hay roles definidos. Añade al menos uno para continuar.
                                        </p>
                                    ) : (
                                        roles.map(role => (
                                            <Badge key={role} variant="secondary" className="px-3 py-1.5 text-sm gap-2">
                                                {role}
                                                <button onClick={() => removeRole(role)} className="hover:text-red-500">
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </Badge>
                                        ))
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <Input
                                        value={newRole}
                                        onChange={(e) => setNewRole(e.target.value)}
                                        placeholder="Nuevo rol..."
                                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addRole())}
                                    />
                                    <Button type="button" variant="outline" onClick={addRole}>
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                                <p className="text-sm text-slate-500">
                                    Los roles te ayudan a organizar tu equipo. Ej: Responsable, Coordinador, Especialista.
                                </p>
                                <div className="flex justify-between">
                                    <Button type="button" variant="ghost" onClick={goToPrevStep}>
                                        <ArrowLeft className="h-4 w-4 mr-2" /> Atrás
                                    </Button>
                                    <Button onClick={handleRolesSubmit} disabled={isProcessing || roles.length === 0} className="gap-2">
                                        Continuar <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Step: Departments */}
                        {currentStep === 'departments' && (
                            <div className="space-y-6">
                                <div className="flex flex-wrap gap-2 min-h-[40px]">
                                    {departments.length === 0 ? (
                                        <p className="text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                                            No hay departamentos definidos. Añade al menos uno para continuar.
                                        </p>
                                    ) : (
                                        departments.map(dept => (
                                            <Badge key={dept} variant="secondary" className="px-3 py-1.5 text-sm gap-2">
                                                {dept}
                                                <button onClick={() => removeDepartment(dept)} className="hover:text-red-500">
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </Badge>
                                        ))
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <Input
                                        value={newDepartment}
                                        onChange={(e) => setNewDepartment(e.target.value)}
                                        placeholder="Nuevo departamento..."
                                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addDepartment())}
                                    />
                                    <Button type="button" variant="outline" onClick={addDepartment}>
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                                <p className="text-sm text-slate-500">
                                    Los departamentos agrupan a los miembros de tu equipo. Ej: SEO, PPC, Contenido.
                                </p>
                                <div className="flex justify-between">
                                    <Button type="button" variant="ghost" onClick={goToPrevStep}>
                                        <ArrowLeft className="h-4 w-4 mr-2" /> Atrás
                                    </Button>
                                    <Button onClick={handleDepartmentsSubmit} disabled={isProcessing || departments.length === 0} className="gap-2">
                                        Continuar <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Step: Employees */}
                        {currentStep === 'employees' && (
                            <div className="space-y-6">
                                <div className="bg-blue-50 text-blue-800 px-4 py-3 rounded-lg text-sm">
                                    <p><strong>Opcional:</strong> Añade miembros de tu equipo ahora o hazlo más tarde desde la sección Equipo.</p>
                                </div>

                                {/* Lista de empleados pendientes */}
                                {pendingEmployees.length > 0 && (
                                    <div className="space-y-2">
                                        {pendingEmployees.map(emp => (
                                            <div key={emp.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
                                                <div>
                                                    <p className="font-medium">{emp.name}</p>
                                                    <p className="text-xs text-slate-500">{emp.email} · {emp.role} · {emp.department}</p>
                                                </div>
                                                <Button type="button" variant="ghost" size="icon" onClick={() => removePendingEmployee(emp.id)}>
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Formulario para nuevo empleado */}
                                <div className="border rounded-lg p-4 space-y-4 bg-white">
                                    <p className="text-sm font-medium text-slate-700">Añadir nuevo miembro</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <Input
                                            placeholder="Nombre completo"
                                            value={newEmployee.name}
                                            onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                                        />
                                        <Input
                                            type="email"
                                            placeholder="Email"
                                            value={newEmployee.email}
                                            onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                                        />
                                    </div>
                                    <Input
                                        type="password"
                                        placeholder="Contraseña (mín. 6 caracteres)"
                                        value={newEmployee.password}
                                        onChange={(e) => setNewEmployee({ ...newEmployee, password: e.target.value })}
                                    />
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <Label className="text-xs">Rol</Label>
                                            <Select
                                                value={newEmployee.role}
                                                onValueChange={(v) => setNewEmployee({ ...newEmployee, role: v })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccionar rol" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {roles.map(role => (
                                                        <SelectItem key={role} value={role}>{role}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">Departamento</Label>
                                            <Select
                                                value={newEmployee.department}
                                                onValueChange={(v) => setNewEmployee({ ...newEmployee, department: v })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccionar departamento" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {departments.map(dept => (
                                                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <Button type="button" variant="outline" onClick={addPendingEmployee} className="w-full gap-2">
                                        <Plus className="h-4 w-4" /> Añadir a la lista
                                    </Button>
                                </div>

                                <div className="flex justify-between">
                                    <Button type="button" variant="ghost" onClick={goToPrevStep}>
                                        <ArrowLeft className="h-4 w-4 mr-2" /> Atrás
                                    </Button>
                                    <Button onClick={handleEmployeesSubmit} disabled={isProcessing} className="gap-2">
                                        {pendingEmployees.length === 0 ? 'Omitir' : 'Crear equipo'} <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Step: Client */}
                        {currentStep === 'client' && (
                            <Form {...clientForm}>
                                <form onSubmit={clientForm.handleSubmit(handleClientSubmit)} className="space-y-6">
                                    <FormField
                                        control={clientForm.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nombre del cliente</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Cliente Ejemplo S.L." {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={clientForm.control}
                                        name="color"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Color identificativo</FormLabel>
                                                <div className="flex gap-2 flex-wrap">
                                                    {CLIENT_COLORS.map(color => (
                                                        <button
                                                            key={color}
                                                            type="button"
                                                            onClick={() => field.onChange(color)}
                                                            className={`w-8 h-8 rounded-full transition-all ${field.value === color ? 'ring-2 ring-offset-2 ring-slate-900 scale-110' : ''
                                                                }`}
                                                            style={{ backgroundColor: color }}
                                                        />
                                                    ))}
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div className="flex justify-between">
                                        <Button type="button" variant="ghost" onClick={goToPrevStep}>
                                            <ArrowLeft className="h-4 w-4 mr-2" /> Atrás
                                        </Button>
                                        <Button type="submit" disabled={isProcessing} className="gap-2">
                                            Continuar <ArrowRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        )}

                        {/* Step: Project */}
                        {currentStep === 'project' && (
                            <Form {...projectForm}>
                                <form onSubmit={projectForm.handleSubmit(handleProjectSubmit)} className="space-y-6">
                                    <FormField
                                        control={projectForm.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nombre del proyecto</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="SEO - Cliente Ejemplo" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={projectForm.control}
                                        name="budgetHours"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Horas mensuales estimadas</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        {...field}
                                                        onChange={e => field.onChange(Number(e.target.value))}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={projectForm.control}
                                            name="minHours"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Horas mínimas (Fee)</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            placeholder="0"
                                                            {...field}
                                                            onChange={e => field.onChange(Number(e.target.value))}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={projectForm.control}
                                            name="hourlyRate"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Precio / Hora (€)</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            placeholder="0"
                                                            {...field}
                                                            onChange={e => field.onChange(Number(e.target.value))}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="flex justify-between">
                                        <Button type="button" variant="ghost" onClick={goToPrevStep}>
                                            <ArrowLeft className="h-4 w-4 mr-2" /> Atrás
                                        </Button>
                                        <Button type="submit" disabled={isProcessing} className="gap-2 bg-gradient-to-r from-primary to-indigo-600">
                                            <Sparkles className="h-4 w-4" /> Completar configuración
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        )}
                    </CardContent>
                </Card>

                <p className="text-center text-slate-400 text-sm mt-6">
                    Puedes modificar toda esta configuración más tarde en Ajustes
                </p>
            </div>
        </div>
    );
}
