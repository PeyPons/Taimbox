/**
 * @deprecated Usar oauth-google-ads (requiere JWT + permiso can_access_agency_settings).
 * Esta función legacy quedó expuesta sin auth; se mantiene solo para devolver 410 explícito.
 */
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    return new Response(
        JSON.stringify({
            error: 'Esta función está retirada. Conecta Google Ads desde Configuración de agencia (oauth-google-ads).',
            code: 'deprecated',
        }),
        {
            status: 410,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
    )
})
