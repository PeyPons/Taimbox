import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/** Misma versión que sync-meta-ads para /me/adaccounts */
const API_VERSION = 'v19.0'

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

        const supabase = createClient(supabaseUrl, supabaseKey)

        let reqData: { agency_id?: string; sync_config?: boolean }
        try {
            const text = await req.text()
            reqData = text ? JSON.parse(text) : {}
        } catch {
            return new Response(
                JSON.stringify({ error: 'Cuerpo inválido. Se espera JSON con agency_id.' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }
        const { agency_id, sync_config = true } = reqData

        if (!agency_id) throw new Error('Falta el agency_id')

        const { data: agency, error: agencyError } = await supabase
            .from('agencies')
            .select('meta_ads_access_token, settings')
            .eq('id', agency_id)
            .single()

        if (agencyError || !agency) {
            throw new Error('Agencia no encontrada')
        }

        const integrations = agency.settings?.integrations || {}
        let accessToken = agency.meta_ads_access_token || integrations.metaAccessToken
        const envFallback = Deno.env.get('META_ACCESS_TOKEN')
        if (!accessToken) accessToken = envFallback

        if (!accessToken) {
            throw new Error('No hay token de Meta. Conecta la cuenta desde Integraciones o configura META_ACCESS_TOKEN.')
        }

        const url = `https://graph.facebook.com/${API_VERSION}/me/adaccounts?fields=account_id,name,currency,account_status&limit=100&access_token=${encodeURIComponent(accessToken)}`
        const res = await fetch(url)
        const json = await res.json()

        if (json.error) {
            const msg = json.error.message || JSON.stringify(json.error)
            throw new Error(`Meta API: ${msg}`)
        }

        const rows = (json.data || []) as Array<{ account_id: string; name?: string; currency?: string; account_status?: number }>
        const accounts = rows.map((acc) => ({
            id: `act_${acc.account_id}`,
            account_id: `act_${acc.account_id}`,
            name: acc.name || `Cuenta ${acc.account_id}`,
            currency: acc.currency,
            account_status: acc.account_status,
        }))

        if (sync_config && accounts.length > 0) {
            const upsertConfigs = accounts.map((acc) => ({
                account_id: acc.account_id,
                account_name: acc.name,
                platform: 'meta',
                is_active: true,
                agency_id,
            }))
            const { error: upsertErr } = await supabase
                .from('ad_accounts_config')
                .upsert(upsertConfigs, { onConflict: 'account_id,agency_id,platform' })
            if (upsertErr) {
                console.warn('[list-meta-accounts] upsert ad_accounts_config:', upsertErr.message)
            }
        }

        return new Response(
            JSON.stringify({ accounts, count: accounts.length }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error)
        console.error('[list-meta-accounts] Error:', message)
        return new Response(
            JSON.stringify({ error: message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
