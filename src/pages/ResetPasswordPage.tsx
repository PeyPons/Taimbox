import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/lib/notify";
import { KeyRound, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useAppTranslation } from "@/hooks/useAppTranslation";

type PageState = 'verifying' | 'form' | 'success' | 'error';

export default function ResetPasswordPage() {
    const { t } = useAppTranslation();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [pageState, setPageState] = useState<PageState>('verifying');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        const verifyToken = async () => {
            // Supabase (y/o el parser del action_link) puede exponer el valor bajo `token_hash` o bajo `token`.
            // La UI de este proyecto llama a `verifyOtp` con `token_hash`, así que normalizamos aquí.
            const tokenHash = searchParams.get('token_hash') || searchParams.get('token');
            const type = searchParams.get('type') as 'recovery' | undefined;

            if (!tokenHash || type !== 'recovery') {
                setErrorMessage(t('auth.resetPassword.invalidLink'));
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
                    setErrorMessage(t('auth.resetPassword.linkUsed'));
                    setPageState('error');
                    return;
                }

                setPageState('form');
            } catch (err) {
                console.error('Error inesperado:', err);
                setErrorMessage(t('auth.resetPassword.verifyError'));
                setPageState('error');
            }
        };

        verifyToken();
    }, [searchParams, t]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword.length < 6) {
            toast.error(t('auth.resetPassword.passwordMinLength'));
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error(t('auth.resetPassword.passwordMismatch'));
            return;
        }

        setIsSubmitting(true);

        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword,
            });

            if (error) {
                console.error('Error actualizando contraseña:', error);
                toast.error(t('auth.resetPassword.updateError', { message: error.message }));
                return;
            }

            setPageState('success');

            // Cerrar la sesión para que el usuario inicie sesión con la nueva contraseña
            await supabase.auth.signOut();

            toast.success(t('auth.resetPassword.successToast'));

            // Redirigir al login después de 3 segundos
            setTimeout(() => {
                navigate('/login', { replace: true });
            }, 3000);
        } catch (err) {
            console.error('Error inesperado:', err);
            toast.error(t('auth.resetPassword.unexpectedError'));
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
                        {pageState === 'verifying' && t('auth.resetPassword.verifyingTitle')}
                        {pageState === 'form' && t('auth.resetPassword.formTitle')}
                        {pageState === 'success' && t('auth.resetPassword.successTitle')}
                        {pageState === 'error' && t('auth.resetPassword.errorTitle')}
                    </CardTitle>
                    <CardDescription className="text-center text-slate-500">
                        {pageState === 'verifying' && t('auth.resetPassword.verifyingDesc')}
                        {pageState === 'form' && t('auth.resetPassword.formDesc')}
                        {pageState === 'success' && t('auth.resetPassword.successDesc')}
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
                                    {t('auth.resetPassword.newPasswordLabel')}
                                </label>
                                <Input
                                    type="password"
                                    placeholder={t('auth.resetPassword.newPasswordPlaceholder')}
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
                                    {t('auth.resetPassword.confirmPasswordLabel')}
                                </label>
                                <Input
                                    type="password"
                                    placeholder={t('auth.resetPassword.confirmPasswordPlaceholder')}
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
                                        {t('auth.resetPassword.submitting')}
                                    </>
                                ) : (
                                    t('auth.resetPassword.submit')
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
                                {t('auth.resetPassword.successBody')}
                            </p>
                            <Button
                                variant="outline"
                                onClick={() => navigate('/login', { replace: true })}
                                className="mt-2"
                            >
                                {t('auth.resetPassword.goToLogin')}
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
                                {t('auth.resetPassword.backToLogin')}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
