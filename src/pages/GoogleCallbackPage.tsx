import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { supabase } from '@/lib/supabase';
import { invokeEdgeFunctionWithRetry } from '@/lib/invokeEdgeFunction';
import { useAgency } from '@/contexts/AgencyContext';
import { toast } from '@/lib/notify';

export default function GoogleCallbackPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { refreshAgency } = useAgency();
    const processedRef = useRef(false);
    const { t } = useAppTranslation();

    useEffect(() => {
        const handleCallback = async () => {
            // Evitar doble ejecución en React StrictMode
            if (processedRef.current) return;
            processedRef.current = true;

            const code = searchParams.get('code');
            const error = searchParams.get('error');

            if (error) {
                console.error('Error de Google OAuth:', error);
                toast.error(t('auth.oauth.google.denied'));
                navigate('/agency?tab=integrations');
                return;
            }

            if (!code) {
                toast.error(t('auth.oauth.google.invalidResponse'));
                navigate('/agency?tab=integrations');
                return;
            }

            const stateFromUrl = searchParams.get('state');
            let agencyId: string | null = null;
            try {
                const stored = sessionStorage.getItem('google_oauth_state');
                if (stored && stateFromUrl) {
                    const { state, agencyId: savedAgencyId } = JSON.parse(stored);
                    if (state === stateFromUrl && savedAgencyId) {
                        agencyId = savedAgencyId;
                        sessionStorage.removeItem('google_oauth_state');
                    }
                }
            } catch (_) {
                // ignore parse error
            }
            if (!agencyId) {
                toast.error(t('auth.oauth.google.missingAgency'));
                navigate('/agency?tab=integrations');
                return;
            }

            try {
                const redirectUri = window.location.origin + '/google-callback';
                const { data, error: fnError } = await supabase.functions.invoke('oauth-google-ads', {
                    body: { code, redirect_uri: redirectUri, agency_id: agencyId },
                });

                if (fnError) throw fnError;
                if (data?.error) throw new Error(data.error);

                try {
                    const { error: listErr } = await invokeEdgeFunctionWithRetry(
                        'list-google-accounts',
                        { agency_id: agencyId, sync_config: true },
                        { retries: 2, baseDelayMs: 600 },
                    );
                    if (listErr) console.warn('list-google-accounts tras OAuth:', listErr);
                } catch (e) {
                    console.warn('list-google-accounts tras OAuth:', e);
                }

                toast.success(t('auth.oauth.google.success'));
                await refreshAgency();
                navigate('/agency?tab=integrations');

            } catch (err: any) {
                console.error('Error intercambiando token:', err);
                const fallbackMessage = t('auth.oauth.common.tryAgain');
                const message = err?.message || fallbackMessage;
                toast.error(t('auth.oauth.google.linkError', { message }));
                navigate('/agency?tab=integrations');
            }
        };

        handleCallback();
    }, [searchParams, navigate, refreshAgency, t]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
            <div className="h-8 w-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="text-slate-600 font-medium mt-4">
                {t('auth.oauth.google.loadingTitle')}
            </p>
            <p className="text-slate-400 text-sm mt-2">
                {t('auth.oauth.google.loadingSubtitle')}
            </p>
        </div>
    );
}
