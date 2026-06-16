import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
    AgencyAccessError,
    assertAgencyPermission,
    getBearerToken,
} from '../_shared/agency-access.ts'
import { resolveOAuthRedirectUri } from '../_shared/oauth-redirect.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GRAPH_VERSION = 'v21.0'

function getAppCredentials() {
    const clientId = Deno.env.get('META_APP_ID') || Deno.env.get('VITE_META_APP_ID')
    const clientSecret = Deno.env.get('META_APP_SECRET')
    return { clientId, clientSecret }
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

        const { clientId, clientSecret } = getAppCredentials()
        if (!clientId || !clientSecret) {
            throw new Error('Error de configuración: Faltan META_APP_ID (o VITE_META_APP_ID) o META_APP_SECRET en variables de entorno.')
        }

        const supabase = createClient(supabaseUrl, supabaseKey)

        let reqData: { code?: string; redirect_uri?: string; agency_id?: string }
        try {
            const text = await req.text()
            reqData = text ? JSON.parse(text) : {}
        } catch {
            return new Response(
                JSON.stringify({ error: 'Cuerpo de la petición inválido. Se espera JSON con code, redirect_uri y agency_id.' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }
        const { code, redirect_uri, agency_id } = reqData

        if (!code) throw new Error('Falta el código de autorización')
        if (!agency_id) throw new Error('Falta el agency_id')

        await assertAgencyPermission({
            supabaseUrl,
            supabaseAnonKey,
            supabaseServiceKey: supabaseKey,
            token: bearer,
            agencyId: agency_id,
            permission: 'can_access_agency_settings',
        })

        const finalRedirectUri = resolveOAuthRedirectUri(
            'meta',
            redirect_uri,
            req.headers.get('origin'),
        )
        if (!finalRedirectUri) {
            return new Response(
                JSON.stringify({ error: 'redirect_uri no permitido.' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
            )
        }

        console.log(`[oauth-meta] redirect_uri usado: ${finalRedirectUri}`)

        // 1. Intercambiar code por access token (corto plazo)
        const tokenUrl = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/oauth/access_token`)
        tokenUrl.searchParams.set('client_id', clientId)
        tokenUrl.searchParams.set('client_secret', clientSecret)
        tokenUrl.searchParams.set('redirect_uri', finalRedirectUri)
        tokenUrl.searchParams.set('code', code)

        let tokenRes: Response
        try {
            tokenRes = await fetch(tokenUrl.toString())
        } catch (e: unknown) {
            const net = e instanceof Error ? e.message : String(e)
            if (/name resolution|getaddrinfo|dns|network/i.test(net)) {
                throw new Error(
                    'No hay resolución DNS/red desde el contenedor hacia graph.facebook.com. Revisa DNS del servicio edge-functions (p. ej. dns: [8.8.8.8] en docker-compose) o conectividad saliente.'
                )
            }
            throw new Error(`Error de red al llamar a Meta: ${net}`)
        }
        const tokenText = await tokenRes.text()
        let tokenJson: Record<string, unknown>
        try {
            tokenJson = JSON.parse(tokenText)
        } catch {
            console.error('[oauth-meta] Respuesta no JSON:', tokenRes.status, tokenText.slice(0, 300))
            throw new Error(`Meta devolvió una respuesta no válida (${tokenRes.status}). Comprueba redirect_uri y credenciales de la app.`)
        }

        if (tokenJson.error) {
            const err = tokenJson.error
            const msg =
                typeof err === 'object' && err !== null && 'message' in err
                    ? String((err as { message?: string }).message)
                    : String((tokenJson as { error_description?: string }).error_description || err)
            console.error('[oauth-meta] Error Graph:', tokenText.slice(0, 500))
            throw new Error(`Meta OAuth: ${msg}`)
        }

        const shortLived = tokenJson.access_token as string | undefined
        if (!shortLived) {
            throw new Error('Meta no devolvió access_token')
        }

        // 2. Intercambiar por long-lived token (~60 días)
        const longUrl = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/oauth/access_token`)
        longUrl.searchParams.set('grant_type', 'fb_exchange_token')
        longUrl.searchParams.set('client_id', clientId)
        longUrl.searchParams.set('client_secret', clientSecret)
        longUrl.searchParams.set('fb_exchange_token', shortLived)

        let longRes: Response
        try {
            longRes = await fetch(longUrl.toString())
        } catch (e: unknown) {
            const net = e instanceof Error ? e.message : String(e)
            throw new Error(`Error de red al intercambiar token largo en Meta: ${net}`)
        }
        const longText = await longRes.text()
        let longJson: Record<string, unknown>
        try {
            longJson = JSON.parse(longText)
        } catch {
            console.warn('[oauth-meta] Long-lived no JSON, se guarda token de corta duración')
            longJson = {}
        }

        const accessToken = (longJson.access_token as string | undefined) || shortLived
        const expiresIn = (longJson.expires_in as number | undefined) ?? (tokenJson.expires_in as number | undefined)

        const { error: updateError } = await supabase
            .from('agencies')
            .update({
                meta_ads_access_token: accessToken,
                updated_at: new Date().toISOString(),
            })
            .eq('id', agency_id)

        if (updateError) {
            throw new Error(`Error guardando token en BD: ${updateError.message}`)
        }

        console.log(`[oauth-meta] Token guardado para agencia ${agency_id}, expires_in: ${expiresIn ?? 'n/d'}`)

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Meta Ads vinculado correctamente',
                expires_in: expiresIn,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
    } catch (error: unknown) {
        if (error instanceof AgencyAccessError) {
            return new Response(JSON.stringify({ error: error.message }), {
                status: error.status,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }
        const message = error instanceof Error ? error.message : String(error)
        console.error('[oauth-meta] Error:', message)
        return new Response(
            JSON.stringify({ error: message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
