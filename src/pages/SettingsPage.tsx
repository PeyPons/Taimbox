import { useState } from 'react';
import { Link } from 'react-router-dom';
// ELIMINADO: import { AppLayout } from '@/components/layout/AppLayout'; <--- CAUSA DEL ERROR
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { PlusCircle, ShieldCheck, Building2, ArrowRight } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { useAgency } from '@/contexts/AgencyContext';

export default function SettingsPage() {
    const [accountId, setAccountId] = useState('');
    const [loading, setLoading] = useState(false);
    const { canAccess } = usePermissions();
    const { currentAgency } = useAgency();

    const handleAddAccount = async () => {
        if (!accountId) return toast.error("Por favor, escribe un ID de cuenta.");
        if (!currentAgency?.id) return toast.error("No hay agencia seleccionada.");

        setLoading(true);
        // Insertamos en la nueva tabla de configuración (solo Meta, Google se añade automáticamente)
        const { error } = await supabase.from('ad_accounts_config').insert({
            platform: 'meta',
            account_id: accountId,
            is_active: true,
            agency_id: currentAgency.id
        });

        if (error) {
            console.error('Error guardando cuenta:', error);
            if (error.code === '23505') {
                toast.error("Esta cuenta ya está registrada.");
            } else {
                const errorMessage = error.message || 'Error al guardar la cuenta';
                toast.error(errorMessage);
            }
        } else {
            toast.success('Cuenta de Meta Ads añadida. Sincroniza ahora para ver datos.');
            setAccountId('');
        }
        setLoading(false);
    };

    return (
        // ELIMINADO EL WRAPPER <AppLayout>
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <h1 className="text-2xl font-bold text-slate-900">Configuración</h1>

            {/* TARJETA PARA CONFIGURACIÓN DE AGENCIA */}
            {canAccess('/agency') && (
                <Link to="/agency" className="block">
                    <Card className="border-slate-200 shadow-sm hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <Building2 className="w-5 h-5 text-indigo-600" />
                                    Configuración de Agencia
                                </span>
                                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-primary transition-colors" />
                            </CardTitle>
                            <CardDescription>
                                Gestiona el nombre, roles, departamentos, módulos y branding de tu agencia.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                </Link>
            )}

            {/* TARJETA PARA AÑADIR CUENTAS */}
            <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <PlusCircle className="w-5 h-5 text-blue-600" />
                        Gestión de cuentas publicitarias
                    </CardTitle>
                    <CardDescription>
                        Añade aquí los IDs de las cuentas de tus clientes para que el sistema las sincronice.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="space-y-2 w-full md:w-3/4">
                            <Label>ID de la cuenta de Meta Ads</Label>
                            <Input
                                placeholder="Ej: act_123456789"
                                value={accountId}
                                onChange={(e) => setAccountId(e.target.value)}
                            />
                        </div>
                        <Button onClick={handleAddAccount} disabled={loading} className="w-full md:w-1/4 bg-slate-900 hover:bg-slate-800">
                            {loading ? 'Guardando...' : 'Añadir cuenta'}
                        </Button>
                    </div>
                    <div className="bg-slate-50 p-3 rounded text-xs text-slate-500 border border-slate-100">
                        <strong>Nota importante:</strong>
                        <ul className="list-disc pl-4 mt-1 space-y-1">
                            <li>Para <strong>Meta Ads</strong>: El ID debe incluir el prefijo (ej: <code>act_147...</code>).</li>
                            <li>Las cuentas de <strong>Google Ads</strong> se añaden automáticamente al sincronizar desde la API.</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-emerald-600" /> Estado del sistema</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-sm text-slate-600">
                        <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full mr-2"></span>
                        Sistema operativo y conectado a base de datos.
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
