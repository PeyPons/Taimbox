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
            throw new Error('Error de configuración: Faltan credenciales de Google (Client ID/Secret)')
        }

        const supabase = createClient(supabaseUrl, supabaseKey)

        // 1. Obtener agency_id del request (parsing seguro para evitar 503 por crash)
        let reqData: { agency_id?: string }
        try {
            const text = await req.text()
            reqData = text ? JSON.parse(text) : {}
        } catch {
            return new Response(
                JSON.stringify({ error: 'Cuerpo de la petición inválido o vacío. Se espera JSON con agency_id.' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }
        const { agency_id } = reqData

        console.log(`[list-google-accounts] Request for agency: ${agency_id}`)

        if (!agency_id) throw new Error('Falta el agency_id')

        // 2. Obtener refresh token de la agencia
        const { data: agency, error: agencyError } = await supabase
            .from('agencies')
            .select('google_ads_refresh_token, settings')
            .eq('id', agency_id)
            .single()

        if (agencyError || !agency) {
            console.error('[list-google-accounts] Agency not found or DB error:', agencyError)
            throw new Error('Agencia no encontrada')
        }

        // Fallback para refresh token (columna > settings)
        let refreshToken = agency.google_ads_refresh_token
        let source = 'DB_COLUMN'

        if (!refreshToken) {
            refreshToken = agency.settings?.integrations?.googleRefreshToken
            source = 'LEGACY_JSON'
        }

        console.log(`[list-google-accounts] Refresh token source: ${source}`)
        console.log(`[list-google-accounts] Refresh token found: ${!!refreshToken}, Length: ${refreshToken?.length}`)

        if (!refreshToken) {
            throw new Error('La agencia no tiene una cuenta de Google vinculada (falta refresh token)')
        }

        // 3. Obtener Access Token
        console.log('[list-google-accounts] Exchanging refresh token for access token...')
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                refresh_token: refreshToken,
                grant_type: 'refresh_token',
            }),
        })

        const tokenResponseText = await tokenResponse.text()
        let tokenData

        try {
            tokenData = JSON.parse(tokenResponseText)
        } catch (e) {
            const maxLog = 8000
            const fullBody = tokenResponseText.length > maxLog ? tokenResponseText.slice(0, maxLog) + '\n...[truncado]' : tokenResponseText
            console.error('[list-google-accounts] Token response was not JSON. Status:', tokenResponse.status, tokenResponse.statusText)
            console.error('[list-google-accounts] Token response body (completo o truncado):', fullBody)
            if (tokenResponseText.trimStart().startsWith('<')) {
                throw new Error('Google devolvió una página HTML en lugar de JSON. Comprueba que GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET sean los mismos con los que se vinculó la cuenta.')
            }
            throw new Error(`Error de comunicación con Google (${tokenResponse.status}): respuesta no válida.`)
        }

        if (tokenData.error) {
            console.error('[list-google-accounts] Token Exchange Error:', JSON.stringify(tokenData))
            const msg = tokenData.error === 'unauthorized_client'
                ? 'Refresh token no válido para este Client ID/Secret. Desvincula y vuelve a vincular la cuenta de Google Ads desde la app (mismo Client ID que en Google Cloud).'
                : `Error obteniendo access token: ${tokenData.error_description || tokenData.error}`
            throw new Error(msg)
        }
        const accessToken = tokenData.access_token

        const developerToken = Deno.env.get('GOOGLE_DEVELOPER_TOKEN')
        if (!developerToken) {
            throw new Error('Error de configuración: Falta GOOGLE_DEVELOPER_TOKEN en variables de entorno.')
        }

        // 4. Listar clientes accesibles (Google Ads API v23)
        const listResponse = await fetch(`https://googleads.googleapis.com/v23/customers:listAccessibleCustomers`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'developer-token': developerToken,
                'Content-Type': 'application/json',
            }
        })

        const listResponseText = await listResponse.text()
        let listData
        try {
            listData = JSON.parse(listResponseText)
        } catch (e) {
            const maxLog = 8000
            const fullBody = listResponseText.length > maxLog ? listResponseText.slice(0, maxLog) + '\n...[truncado]' : listResponseText
            console.error('[list-google-accounts] List API response was not JSON. Status:', listResponse.status, listResponse.statusText)
            console.error('[list-google-accounts] List API response body (completo o truncado):', fullBody)
            if (listResponseText.trimStart().startsWith('<')) {
                throw new Error(`Google Ads API devolvió HTML en lugar de JSON (${listResponse.status}). Revisa GOOGLE_DEVELOPER_TOKEN (aprobado en Google Ads) y que la cuenta tenga acceso a la API.`)
            }
            throw new Error(`Error API Google Ads: ${listResponse.status} ${listResponse.statusText}. Respuesta: ${listResponseText.slice(0, 500)}`)
        }

        if (listData.error) {
            throw new Error(`Error de Google Ads API: ${listData.error.message}`)
        }

        // 5. Procesar y devolver lista
        const customers = listData.resourceNames || []
        // resourceNames viene como "customers/1234567890" -> extraer ID
        const accounts = customers.map((resource: string) => ({
            id: resource.replace('customers/', ''),
            resourceName: resource
        }))

        return new Response(
            JSON.stringify({ success: true, accounts }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error: any) {
        console.error('[list-google-accounts] Error:', error.message)
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
