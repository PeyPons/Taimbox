import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
    AgencyAccessError,
    assertAgencyPermissionAny,
    getBearerToken,
} from '../_shared/agency-access.ts'

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
        const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

        if (!supabaseUrl || !supabaseKey || !supabaseAnonKey) {
            throw new Error('Faltan variables de entorno SUPABASE_URL, SUPABASE_ANON_KEY o SUPABASE_SERVICE_ROLE_KEY')
        }

        const bearer = getBearerToken(req)
        if (!bearer) {
            return new Response(JSON.stringify({ error: 'No autorizado.' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // Credenciales GLOBALES de la plataforma (modelo SaaS)
        const clientId = Deno.env.get('GOOGLE_CLIENT_ID')
        const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')

        if (!clientId || !clientSecret) {
            throw new Error('Error de configuración: Faltan credenciales de Google (Client ID/Secret)')
        }

        const supabase = createClient(supabaseUrl, supabaseKey)

        // 1. Obtener agency_id del request (parsing seguro para evitar 503 por crash)
        let reqData: { agency_id?: string; sync_config?: boolean }
        try {
            const text = await req.text()
            reqData = text ? JSON.parse(text) : {}
        } catch {
            return new Response(
                JSON.stringify({ error: 'Cuerpo de la petición inválido o vacío. Se espera JSON con agency_id.' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }
        const { agency_id, sync_config = true } = reqData

        console.log(`[list-google-accounts] Request for agency: ${agency_id}`)

        if (!agency_id) throw new Error('Falta el agency_id')

        await assertAgencyPermissionAny({
            supabaseUrl,
            supabaseAnonKey,
            supabaseServiceKey: supabaseKey,
            token: bearer,
            agencyId: agency_id,
            permissions: ['can_access_google_ads', 'can_access_agency_settings'],
        })

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

        // 4. Listar clientes accesibles (Google Ads API v22)
        const listResponse = await fetch(`https://googleads.googleapis.com/v22/customers:listAccessibleCustomers`, {
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

        // 5. Lista base (id + resourceName)
        const customers = listData.resourceNames || []
        const customerIds = customers.map((r: string) => r.replace('customers/', ''))

        // 6. Obtener nombre descriptivo de cada cuenta (Search en v22)
        const API_VERSION = 'v22'
        type CustomerSearchResult = { descriptiveName: string | null; currencyCode: string | null };

        const runSearch = async (customerId: string, loginCustomerId: string): Promise<CustomerSearchResult> => {
            const searchUrl = `https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}/googleAds:search`
            const searchRes = await fetch(searchUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'developer-token': developerToken,
                    'Content-Type': 'application/json',
                    'login-customer-id': loginCustomerId,
                },
                body: JSON.stringify({
                    query: 'SELECT customer.id, customer.descriptive_name, customer.currency_code FROM customer LIMIT 1'
                }),
            })
            if (!searchRes.ok) {
                const errText = await searchRes.text()
                console.warn(`[list-google-accounts] search ${customerId} login=${loginCustomerId} status=${searchRes.status}: ${errText.slice(0, 200)}`)
                return { descriptiveName: null, currencyCode: null }
            }
            const searchText = await searchRes.text()
            try {
                const parsed = JSON.parse(searchText)
                const results = parsed.results || (Array.isArray(parsed) ? parsed[0]?.results : undefined)
                const row = results?.[0]
                const customer = row?.customer
                return {
                    descriptiveName: customer?.descriptiveName ?? customer?.descriptive_name ?? null,
                    currencyCode: customer?.currencyCode ?? customer?.currency_code ?? null,
                }
            } catch {
                console.warn(`[list-google-accounts] search ${customerId} respuesta no JSON: ${searchText.slice(0, 150)}`)
                return { descriptiveName: null, currencyCode: null }
            }
        }

        const mccId = customerIds[0]
        const accounts = await Promise.all(customerIds.map(async (customerId: string) => {
            let descriptiveName: string | null = null
            let currencyCode: string | null = null
            try {
                let details = await runSearch(customerId, customerId)
                if (details.descriptiveName == null && customerId !== mccId) {
                    details = await runSearch(customerId, mccId)
                }
                descriptiveName = details.descriptiveName
                currencyCode = details.currencyCode
            } catch (e) {
                console.warn(`[list-google-accounts] No se pudo obtener nombre para ${customerId}:`, (e as Error).message)
            }
            return {
                id: customerId,
                resourceName: `customers/${customerId}`,
                descriptiveName: descriptiveName || null,
                currencyCode: currencyCode || null,
            }
        }))

        if (sync_config && accounts.length > 0) {
            const upsertConfigs = accounts.map((acc) => ({
                account_id: acc.id,
                account_name: acc.descriptiveName || `Cuenta ${acc.id}`,
                platform: 'google',
                is_active: true,
                agency_id,
                currency: acc.currencyCode ? String(acc.currencyCode).toUpperCase() : null,
            }))
            const { error: upsertErr } = await supabase
                .from('ad_accounts_config')
                .upsert(upsertConfigs, { onConflict: 'account_id,agency_id,platform' })
            if (upsertErr) {
                console.warn('[list-google-accounts] upsert ad_accounts_config:', upsertErr.message)
            }
        }

        return new Response(
            JSON.stringify({ success: true, accounts }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error: unknown) {
        if (error instanceof AgencyAccessError) {
            return new Response(JSON.stringify({ error: error.message }), {
                status: error.status,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }
        const message = error instanceof Error ? error.message : 'Error desconocido'
        console.error('[list-google-accounts] Error:', message)
        return new Response(
            JSON.stringify({ error: message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
