import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAgency } from '@/contexts/AgencyContext';
import { toast } from 'sonner';

export default function GoogleCallbackPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { currentAgency } = useAgency();
    const processedRef = useRef(false);

    useEffect(() => {
        const handleCallback = async () => {
            // Evitar doble ejecución en React StrictMode
            if (processedRef.current) return;
            processedRef.current = true;

            const code = searchParams.get('code');
            const error = searchParams.get('error');

            if (error) {
                console.error('Error de Google OAuth:', error);
                toast.error('No se pudo conectar con Google Ads. El usuario denegó el acceso.');
                navigate('/agency?tab=integrations');
                return;
            }

            if (!code) {
                toast.error('Respuesta inválida de Google.');
                navigate('/agency?tab=integrations');
                return;
            }

            if (!currentAgency?.id) {
                toast.error('No se pudo identificar la agencia.');
                navigate('/agency?tab=integrations');
                return;
            }

            try {
                const { data, error: fnError } = await supabase.functions.invoke('exchange-google-token', {
                    body: { code, agency_id: currentAgency.id },
                });

                if (fnError) throw fnError;
                if (data?.error) throw new Error(data.error);

                toast.success('¡Google Ads vinculado correctamente!');
                navigate('/agency?tab=integrations');

            } catch (err: any) {
                console.error('Error intercambiando token:', err);
                toast.error(`Error al vincular la cuenta: ${err.message || 'Inténtalo de nuevo.'}`);
                navigate('/agency?tab=integrations');
            }
        };

        handleCallback();
    }, [searchParams, navigate, currentAgency]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
            <div className="h-8 w-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="text-slate-600 font-medium mt-4">Vinculando con Google Ads...</p>
            <p className="text-slate-400 text-sm mt-2">Por favor, no cierres esta ventana.</p>
        </div>
    );
}
