import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { invokeEdgeFunctionWithRetry } from '@/lib/invokeEdgeFunction';
import { useAgency } from '@/contexts/AgencyContext';
import { toast } from 'sonner';

export default function MetaCallbackPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { currentAgency, refreshAgency } = useAgency();
    const processedRef = useRef(false);

    useEffect(() => {
        const handleCallback = async () => {
            if (processedRef.current) return;
            processedRef.current = true;

            const code = searchParams.get('code');
            const error = searchParams.get('error');
            const errorReason = searchParams.get('error_reason');
            const errorDescription = searchParams.get('error_description');

            if (error) {
                console.error('Error OAuth Meta:', error, errorReason, errorDescription);
                toast.error(
                    error === 'access_denied'
                        ? 'No se pudo conectar con Meta. Acceso denegado.'
                        : `Error de Meta: ${errorDescription || error}`
                );
                navigate('/agency?tab=integrations');
                return;
            }

            if (!code) {
                toast.error('Respuesta inválida de Meta.');
                navigate('/agency?tab=integrations');
                return;
            }

            const stateFromUrl = searchParams.get('state');
            let agencyId: string | null = null;
            try {
                const stored = sessionStorage.getItem('meta_oauth_state');
                if (stored && stateFromUrl) {
                    const { state, agencyId: savedAgencyId } = JSON.parse(stored);
                    if (state === stateFromUrl && savedAgencyId) {
                        agencyId = savedAgencyId;
                        sessionStorage.removeItem('meta_oauth_state');
                    }
                }
            } catch {
                // ignore
            }

            if (!agencyId) agencyId = currentAgency?.id || stateFromUrl || null;
            if (!agencyId) {
                toast.error('No se pudo identificar la agencia. Vuelve a intentar desde Integraciones.');
                navigate('/agency?tab=integrations');
                return;
            }

            try {
                const redirectUri = `${window.location.origin}/meta-callback`;
                const { data, error: fnError } = await invokeEdgeFunctionWithRetry('oauth-meta', {
                    code,
                    redirect_uri: redirectUri,
                    agency_id: agencyId,
                });

                if (fnError) throw fnError;
                if (data?.error) throw new Error(data.error);

                try {
                    const { error: listErr } = await invokeEdgeFunctionWithRetry(
                        'list-meta-accounts',
                        { agency_id: agencyId, sync_config: true },
                        { retries: 2, baseDelayMs: 600 }
                    );
                    if (listErr) console.warn('list-meta-accounts tras OAuth:', listErr);
                } catch (e) {
                    console.warn('list-meta-accounts tras OAuth:', e);
                }

                toast.success('¡Meta Ads vinculado correctamente!');
                await refreshAgency();
                navigate('/agency?tab=integrations');
            } catch (err: unknown) {
                console.error('Error intercambiando token Meta:', err);
                let msg = err instanceof Error ? err.message : 'Inténtalo de nuevo.';
                if (/name resolution|getaddrinfo/i.test(msg)) {
                    msg =
                        'El servidor de integraciones no pudo resolver red/DNS (503). Revisa DNS del contenedor edge-functions o reintenta en unos segundos.';
                }
                toast.error(`Error al vincular Meta: ${msg}`);
                navigate('/agency?tab=integrations');
            }
        };

        handleCallback();
    }, [searchParams, navigate, currentAgency, refreshAgency]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
            <div className="h-8 w-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="text-slate-600 font-medium mt-4">Vinculando con Meta Ads...</p>
            <p className="text-slate-400 text-sm mt-2">Por favor, no cierres esta ventana.</p>
        </div>
    );
}
