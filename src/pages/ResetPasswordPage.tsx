import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { KeyRound, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

type PageState = 'verifying' | 'form' | 'success' | 'error';

export default function ResetPasswordPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [pageState, setPageState] = useState<PageState>('verifying');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        const verifyToken = async () => {
            const tokenHash = searchParams.get('token_hash');
            const type = searchParams.get('type') as 'recovery' | undefined;

            if (!tokenHash || type !== 'recovery') {
                setErrorMessage('El enlace de recuperación no es válido o ha expirado.');
                setPageState('error');
                return;
            }

            try {
                const { error } = await supabase.auth.verifyOtp({
                    token_hash: tokenHash,
                    type: 'recovery',
                });

                if (error) {
                    console.error('Error verificando token:', error);
                    setErrorMessage('El enlace ha expirado o ya fue utilizado. Solicita uno nuevo.');
                    setPageState('error');
                    return;
                }

                setPageState('form');
            } catch (err) {
                console.error('Error inesperado:', err);
                setErrorMessage('Error inesperado al verificar el enlace.');
                setPageState('error');
            }
        };

        verifyToken();
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword.length < 6) {
            toast.error('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error('Las contraseñas no coinciden');
            return;
        }

        setIsSubmitting(true);

        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword,
            });

            if (error) {
                console.error('Error actualizando contraseña:', error);
                toast.error('Error al actualizar la contraseña: ' + error.message);
                return;
            }

            setPageState('success');

            // Cerrar la sesión para que el usuario inicie sesión con la nueva contraseña
            await supabase.auth.signOut();

            toast.success('¡Contraseña actualizada correctamente!');

            // Redirigir al login después de 3 segundos
            setTimeout(() => {
                navigate('/login', { replace: true });
            }, 3000);
        } catch (err) {
            console.error('Error inesperado:', err);
            toast.error('Error inesperado. Inténtalo de nuevo.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
            <Card className="w-full max-w-md bg-white shadow-xl">
                <CardHeader className="space-y-1">
                    <div className="flex justify-center mb-4">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center shadow-lg">
                            <KeyRound className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl text-center font-bold text-slate-900">
                        {pageState === 'verifying' && 'Verificando enlace...'}
                        {pageState === 'form' && 'Nueva contraseña'}
                        {pageState === 'success' && '¡Contraseña actualizada!'}
                        {pageState === 'error' && 'Enlace no válido'}
                    </CardTitle>
                    <CardDescription className="text-center text-slate-500">
                        {pageState === 'verifying' && 'Estamos verificando tu enlace de recuperación'}
                        {pageState === 'form' && 'Establece una nueva contraseña para tu cuenta'}
                        {pageState === 'success' && 'Redirigiendo al inicio de sesión...'}
                        {pageState === 'error' && errorMessage}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Verificando */}
                    {pageState === 'verifying' && (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    )}

                    {/* Formulario */}
                    {pageState === 'form' && (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">
                                    Nueva contraseña
                                </label>
                                <Input
                                    type="password"
                                    placeholder="Mínimo 6 caracteres"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="bg-slate-50 border-slate-200 focus:border-indigo-500"
                                    required
                                    minLength={6}
                                    autoFocus
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">
                                    Confirmar contraseña
                                </label>
                                <Input
                                    type="password"
                                    placeholder="Repite la contraseña"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="bg-slate-50 border-slate-200 focus:border-indigo-500"
                                    required
                                    minLength={6}
                                />
                            </div>
                            <Button
                                type="submit"
                                className="w-full bg-primary hover:bg-primary/90 text-white font-medium"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        Actualizando...
                                    </>
                                ) : (
                                    'Establecer nueva contraseña'
                                )}
                            </Button>
                        </form>
                    )}

                    {/* Éxito */}
                    {pageState === 'success' && (
                        <div className="flex flex-col items-center gap-4 py-6">
                            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                                <CheckCircle2 className="h-8 w-8 text-green-600" />
                            </div>
                            <p className="text-sm text-slate-500 text-center">
                                Tu contraseña ha sido actualizada. Serás redirigido al inicio de sesión en unos segundos.
                            </p>
                            <Button
                                variant="outline"
                                onClick={() => navigate('/login', { replace: true })}
                                className="mt-2"
                            >
                                Ir al inicio de sesión
                            </Button>
                        </div>
                    )}

                    {/* Error */}
                    {pageState === 'error' && (
                        <div className="flex flex-col items-center gap-4 py-6">
                            <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
                                <AlertCircle className="h-8 w-8 text-red-600" />
                            </div>
                            <p className="text-sm text-slate-500 text-center">
                                {errorMessage}
                            </p>
                            <Button
                                variant="outline"
                                onClick={() => navigate('/login', { replace: true })}
                                className="mt-2"
                            >
                                Volver al inicio de sesión
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
