import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function base64UrlEncode(data: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < data.length; i++) {
    binary += String.fromCharCode(data[i])
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlEncodeString(str: string): string {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function signJwt(payload: Record<string, unknown>, secret: string): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' }
  const encodedHeader = base64UrlEncodeString(JSON.stringify(header))
  const encodedPayload = base64UrlEncodeString(JSON.stringify(payload))
  const signingInput = `${encodedHeader}.${encodedPayload}`

  const encoder = new TextEncoder()
  const keyData = encoder.encode(secret)
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(signingInput))
  const encodedSignature = base64UrlEncode(new Uint8Array(signature))

  return `${signingInput}.${encodedSignature}`
}

async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(token)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const jwtSecret = Deno.env.get('JWT_SECRET') || Deno.env.get('SUPABASE_JWT_SECRET')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')

    if (!supabaseUrl || !supabaseServiceKey || !jwtSecret || !anonKey) {
      console.error('Variables de entorno faltantes:', {
        hasUrl: !!supabaseUrl,
        hasServiceKey: !!supabaseServiceKey,
        hasJwtSecret: !!jwtSecret,
        hasAnonKey: !!anonKey,
      })
      throw new Error('Configuración del servidor incompleta.')
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No se proporcionó token de autorización' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    const callerToken = authHeader.replace('Bearer ', '')
    const supabaseWithAuth = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${callerToken}` } }
    })

    const { data: { user: callerUser }, error: callerAuthError } = await supabaseWithAuth.auth.getUser()
    if (callerAuthError || !callerUser) {
      return new Response(
        JSON.stringify({ error: 'Token de autorización inválido o expirado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    const { agency_id, name, permissions, expires_in_days } = await req.json()

    if (!agency_id || !name) {
      throw new Error('Se requieren agency_id y name.')
    }

    const validPermissions = permissions === 'readonly' ? 'readonly' : 'readwrite'

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    const { data: callerEmployee, error: empError } = await supabaseAdmin
      .from('employees')
      .select('id, role, name, agency_id')
      .eq('user_id', callerUser.id)
      .eq('agency_id', agency_id)
      .single()

    if (empError || !callerEmployee) {
      return new Response(
        JSON.stringify({ error: 'No perteneces a esta agencia.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    const { data: agency, error: agencyError } = await supabaseAdmin
      .from('agencies')
      .select('settings')
      .eq('id', agency_id)
      .single()

    if (agencyError || !agency) {
      return new Response(
        JSON.stringify({ error: 'Agencia no encontrada.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    const roles = agency.settings?.roles || []
    const callerRole = roles.find((r: { name: string }) => r.name === callerEmployee.role)
    const hasPermission = callerRole?.permissions?.can_access_agency_settings === true

    if (!hasPermission) {
      return new Response(
        JSON.stringify({ error: 'No tienes permisos para gestionar tokens API.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    const tokenId = crypto.randomUUID()

    let expiresAt: string | null = null
    const now = Math.floor(Date.now() / 1000)
    const jwtPayload: Record<string, unknown> = {
      sub: tokenId,
      role: 'authenticated',
      iss: 'timeboxing-api',
      agency_id: agency_id,
      permissions: validPermissions,
      iat: now,
    }

    if (expires_in_days && expires_in_days > 0) {
      const expTimestamp = now + (expires_in_days * 24 * 60 * 60)
      jwtPayload.exp = expTimestamp
      expiresAt = new Date(expTimestamp * 1000).toISOString()
    }

    const jwt = await signJwt(jwtPayload, jwtSecret)
    const tokenHash = await hashToken(jwt)

    const { error: insertError } = await supabaseAdmin
      .from('api_tokens')
      .insert({
        id: tokenId,
        agency_id: agency_id,
        name: name,
        token_hash: tokenHash,
        permissions: validPermissions,
        is_active: true,
        expires_at: expiresAt,
      })

    if (insertError) {
      console.error('Error insertando api_token:', insertError)
      throw new Error('Error al guardar el token en la base de datos.')
    }

    console.log(`Token API "${name}" creado para agencia ${agency_id} por ${callerEmployee.name}`)

    return new Response(
      JSON.stringify({
        token: jwt,
        token_id: tokenId,
        name: name,
        permissions: validPermissions,
        expires_at: expiresAt,
        message: 'Guarda este token de forma segura. No se podrá volver a mostrar.',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error: unknown) {
    console.error('Error general:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
