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

        // 1. Obtener agency_id del request
        const { agency_id } = await req.json()
        if (!agency_id) throw new Error('Falta el agency_id')

        // 2. Obtener refresh token de la agencia
        const { data: agency, error: agencyError } = await supabase
            .from('agencies')
            .select('google_ads_refresh_token, settings')
            .eq('id', agency_id)
            .single()

        if (agencyError || !agency) {
            throw new Error('Agencia no encontrada')
        }

        // Fallback para refresh token (columna > settings)
        const refreshToken = agency.google_ads_refresh_token || agency.settings?.integrations?.googleRefreshToken

        if (!refreshToken) {
            throw new Error('La agencia no tiene una cuenta de Google vinculada (falta refresh token)')
        }

        // 3. Obtener Access Token
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

        const tokenData = await tokenResponse.json()
        if (tokenData.error) {
            throw new Error(`Error obteniendo access token: ${tokenData.error_description || tokenData.error}`)
        }
        const accessToken = tokenData.access_token

        // 4. Listar clientes accesibles
        // https://developers.google.com/google-ads/api/rest/custom/customer/listAccessibleCustomers
        const listResponse = await fetch(`https://googleads.googleapis.com/v17/customers:listAccessibleCustomers`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'developer-token': Deno.env.get('GOOGLE_DEVELOPER_TOKEN') || '',
            }
        })

        const listData = await listResponse.json()
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
