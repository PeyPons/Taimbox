import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') || Deno.env.get('VITE_SUPABASE_URL')
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Faltan variables de entorno SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
        }

        // Credenciales GLOBALES de la plataforma (modelo SaaS)
        const clientId = Deno.env.get('GOOGLE_CLIENT_ID')
        const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')

        if (!clientId || !clientSecret) {
            throw new Error('Error de configuración: Faltan GOOGLE_CLIENT_ID o GOOGLE_CLIENT_SECRET en variables de entorno.')
        }

        const supabase = createClient(supabaseUrl, supabaseKey)

        // 1. Obtener datos del request
        const reqData = await req.json()
        const { code, redirect_uri, agency_id } = reqData

        console.log('[oauth-google-ads] Request received:', JSON.stringify({
            hasCode: !!code,
            redirect_uri,
            agency_id,
            clientIdExists: !!clientId,
            clientSecretExists: !!clientSecret
        }))

        if (!code) throw new Error('Falta el código de autorización')
        if (!agency_id) throw new Error('Falta el agency_id')

        // Usar redirect_uri del frontend (debe coincidir exactamente con la usada al iniciar el flujo)
        const finalRedirectUri = redirect_uri || (
            (req.headers.get('origin') || '').includes('localhost')
                ? 'http://localhost:8080/google-callback'
                : 'https://timeboxing.peypons.duckdns.org/google-callback'
        )

        console.log(`[oauth-google-ads] Final Redirect URI used: ${finalRedirectUri}`)

        // 2. Intercambio con Google (usando credenciales de PLATAFORMA)
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code: code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: finalRedirectUri,
                grant_type: 'authorization_code',
            }),
        })

        const tokens = await tokenResponse.json()

        if (tokens.error) {
            console.error('[oauth-google-ads] Google API Error Response:', JSON.stringify(tokens))
            throw new Error(`Google Error: ${tokens.error_description || tokens.error}`)
        }

        console.log(`[oauth-google-ads] Token obtenido correctamente para agencia ${agency_id}`)

        // 3. Guardar el Refresh Token en la columna directa de la agencia
        // Google solo devuelve refresh_token la primera vez o con prompt=consent
        if (tokens.refresh_token) {
            const { error: updateError } = await supabase
                .from('agencies')
                .update({
                    google_ads_refresh_token: tokens.refresh_token,
                    updated_at: new Date().toISOString()
                })
                .eq('id', agency_id)

            if (updateError) {
                throw new Error(`Error guardando token en BD: ${updateError.message}`)
            }

            console.log(`[oauth-google-ads] Refresh token guardado en agencies.google_ads_refresh_token`)
        } else {
            console.log(`[oauth-google-ads] Google no devolvió refresh_token (puede que el usuario ya lo haya autorizado previamente)`)
        }

        return new Response(
            JSON.stringify({ success: true, message: 'Token guardado correctamente' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error: any) {
        console.error('[oauth-google-ads] Error:', error.message)
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
