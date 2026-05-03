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
            throw new Error('Error de configuración: Faltan GOOGLE_CLIENT_ID o GOOGLE_CLIENT_SECRET en variables de entorno del servidor.')
        }

        const supabase = createClient(supabaseUrl, supabaseKey)

        const { code, agency_id } = await req.json()

        if (!code || !agency_id) {
            throw new Error('Se requieren los campos "code" y "agency_id"')
        }

        // Determinar redirect_uri según el origin de la petición
        const origin = req.headers.get('origin') || req.headers.get('referer') || ''
        let redirectUri: string
        if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
            redirectUri = 'http://localhost:8080/google-callback'
        } else {
            redirectUri = 'https://taimbox.com/google-callback'
        }

        console.log(`[exchange-google-token] Agency: ${agency_id}, Redirect URI: ${redirectUri}`)

        // Intercambiar código por tokens usando credenciales GLOBALES
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code',
            }),
        })

        const tokenData = await tokenResponse.json()

        if (!tokenResponse.ok) {
            console.error('[exchange-google-token] Error de Google:', JSON.stringify(tokenData))
            throw new Error(`Error de Google: ${tokenData.error_description || tokenData.error || 'Unknown error'}`)
        }

        const refreshToken = tokenData.refresh_token

        if (!refreshToken) {
            throw new Error('Google no devolvió un refresh_token. Asegúrate de que el flujo usa access_type=offline y prompt=consent.')
        }

        console.log(`[exchange-google-token] Token obtenido correctamente para agencia ${agency_id}`)

        // Obtener settings actuales de la agencia
        const { data: agency, error: agencyError } = await supabase
            .from('agencies')
            .select('settings')
            .eq('id', agency_id)
            .single()

        if (agencyError || !agency) {
            throw new Error(`No se encontró la agencia: ${agencyError?.message || 'Not found'}`)
        }

        // Guardar el refresh token en la configuración de la agencia
        const integrations = agency.settings?.integrations || {}
        const updatedIntegrations = {
            ...integrations,
            googleRefreshToken: refreshToken,
        }

        const { error: updateError } = await supabase
            .from('agencies')
            .update({
                settings: {
                    ...agency.settings,
                    integrations: updatedIntegrations,
                },
            })
            .eq('id', agency_id)

        if (updateError) {
            throw new Error(`Error guardando token en BD: ${updateError.message}`)
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error: any) {
        console.error('[exchange-google-token] Error:', error.message)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
