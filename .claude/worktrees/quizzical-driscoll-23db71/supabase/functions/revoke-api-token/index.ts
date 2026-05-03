import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')

    if (!supabaseUrl || !supabaseServiceKey || !anonKey) {
      throw new Error('Configuración del servidor incompleta.')
    }

    // Verificar autenticación del llamante
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

    // Leer body
    const { token_id } = await req.json()

    if (!token_id) {
      throw new Error('Se requiere token_id.')
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Obtener el token para verificar a qué agencia pertenece
    const { data: apiToken, error: tokenError } = await supabaseAdmin
      .from('api_tokens')
      .select('id, agency_id, name')
      .eq('id', token_id)
      .single()

    if (tokenError || !apiToken) {
      return new Response(
        JSON.stringify({ error: 'Token no encontrado.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    // Verificar que el llamante pertenece a esa agencia y tiene permisos
    const { data: callerEmployee, error: empError } = await supabaseAdmin
      .from('employees')
      .select('id, role, name, agency_id')
      .eq('user_id', callerUser.id)
      .eq('agency_id', apiToken.agency_id)
      .single()

    if (empError || !callerEmployee) {
      return new Response(
        JSON.stringify({ error: 'No perteneces a la agencia de este token.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    // Verificar permisos de rol
    const { data: agency, error: agencyError } = await supabaseAdmin
      .from('agencies')
      .select('settings')
      .eq('id', apiToken.agency_id)
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
        JSON.stringify({ error: 'No tienes permisos para revocar tokens API.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    // Revocar el token
    const { error: updateError } = await supabaseAdmin
      .from('api_tokens')
      .update({ is_active: false })
      .eq('id', token_id)

    if (updateError) {
      console.error('Error revocando token:', updateError)
      throw new Error('Error al revocar el token.')
    }

    console.log(`Token API "${apiToken.name}" (${token_id}) revocado por ${callerEmployee.name}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Token "${apiToken.name}" revocado correctamente.`,
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
