import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { useAgency } from '@/contexts/AgencyContext';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Building2, Users, UserCircle, FolderKanban, Check, ArrowRight, ArrowLeft, Sparkles, X, Plus } from 'lucide-react';

// Pasos del wizard
type WizardStep = 'company' | 'roles' | 'client' | 'project';

const STEPS: { id: WizardStep; title: string; description: string; icon: React.ReactNode }[] = [
    { id: 'company', title: 'Tu empresa', description: 'Configura el nombre', icon: <Building2 className="h-5 w-5" /> },
    { id: 'roles', title: 'Roles', description: 'Define los roles de tu equipo', icon: <Users className="h-5 w-5" /> },
    { id: 'client', title: 'Primer cliente', description: 'Crea tu primer cliente', icon: <UserCircle className="h-5 w-5" /> },
    { id: 'project', title: 'Primer proyecto', description: 'Crea tu primer proyecto', icon: <FolderKanban className="h-5 w-5" /> },
];

// Schemas
const companySchema = z.object({
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
});

const clientSchema = z.object({
    name: z.string().min(2, 'El nombre del cliente es obligatorio'),
    color: z.string().min(1, 'Selecciona un color'),
});

const projectSchema = z.object({
    name: z.string().min(2, 'El nombre del proyecto es obligatorio'),
    budgetHours: z.number().min(1, 'El budget debe ser mayor a 0'),
});

// Colores predefinidos para clientes
const CLIENT_COLORS = [
    '#FF5733', '#33FF57', '#3357FF', '#FF33F5', '#FFB533',
    '#33FFF5', '#8B33FF', '#FF3333', '#33FF8B', '#3399FF',
];

export default function OnboardingWizard() {
    const navigate = useNavigate();
    const { currentAgency, updateAgencyName, completeSetup } = useAgency();
    const { addClient, addProject, clients } = useApp();

    const [currentStep, setCurrentStep] = useState<WizardStep>('company');
    const [isProcessing, setIsProcessing] = useState(false);
    const [roles, setRoles] = useState<string[]>(['Responsable', 'Coordinador', 'Especialista']);
    const [newRole, setNewRole] = useState('');
    const [createdClientId, setCreatedClientId] = useState<string | null>(null);

    const currentStepIndex = STEPS.findIndex(s => s.id === currentStep);

    // Forms
    const companyForm = useForm({
        resolver: zodResolver(companySchema),
        defaultValues: { name: currentAgency?.name || '' },
    });

    const clientForm = useForm({
        resolver: zodResolver(clientSchema),
        defaultValues: { name: '', color: CLIENT_COLORS[0] },
    });

    const projectForm = useForm({
        resolver: zodResolver(projectSchema),
        defaultValues: { name: '', budgetHours: 20 },
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

    // Handlers
    const handleCompanySubmit = async (data: z.infer<typeof companySchema>) => {
        setIsProcessing(true);
        try {
            await updateAgencyName(data.name);
            goToNextStep();
        } catch (error) {
            toast.error('Error al actualizar el nombre');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRolesSubmit = async () => {
        setIsProcessing(true);
        try {
            // Guardar roles en settings de la agencia
            if (currentAgency?.id) {
                await supabase
                    .from('agencies')
                    .update({
                        settings: {
                            ...currentAgency.settings,
                            roles
                        }
                    })
                    .eq('id', currentAgency.id);
            }
            goToNextStep();
        } catch (error) {
            toast.error('Error al guardar los roles');
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
        if (newRole.trim() && !roles.includes(newRole.trim())) {
            setRoles([...roles, newRole.trim()]);
            setNewRole('');
        }
    };

    const removeRole = (roleToRemove: string) => {
        if (roles.length > 1) {
            setRoles(roles.filter(r => r !== roleToRemove));
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
                        {/* Step: Company */}
                        {currentStep === 'company' && (
                            <Form {...companyForm}>
                                <form onSubmit={companyForm.handleSubmit(handleCompanySubmit)} className="space-y-6">
                                    <FormField
                                        control={companyForm.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nombre de tu empresa</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Mi Agencia de Marketing"
                                                        className="text-lg h-12"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div className="flex justify-end">
                                        <Button type="submit" disabled={isProcessing} className="gap-2">
                                            Continuar <ArrowRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        )}

                        {/* Step: Roles */}
                        {currentStep === 'roles' && (
                            <div className="space-y-6">
                                <div className="flex flex-wrap gap-2">
                                    {roles.map(role => (
                                        <Badge key={role} variant="secondary" className="px-3 py-1.5 text-sm gap-2">
                                            {role}
                                            <button onClick={() => removeRole(role)} className="hover:text-red-500">
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    ))}
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
                                    Los roles te ayudan a organizar tu equipo. Puedes personalizarlos más tarde.
                                </p>
                                <div className="flex justify-between">
                                    <Button type="button" variant="ghost" onClick={goToPrevStep}>
                                        <ArrowLeft className="h-4 w-4 mr-2" /> Atrás
                                    </Button>
                                    <Button onClick={handleRolesSubmit} disabled={isProcessing} className="gap-2">
                                        Continuar <ArrowRight className="h-4 w-4" />
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
