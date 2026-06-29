// supabase/functions/create-user/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { sendWelcomeOrInvitationEmail } from "../_shared/welcome-and-invitation-email.ts"
import {
  AgencyAccessError,
  assertCanInviteToAgency,
  getBearerToken,
} from "../_shared/auth-user-access.ts"
import { parseEmail, parseOptionalPassword } from "../_shared/input-limits.ts"

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
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      throw new Error('Configuración del servidor incompleta. Contacta al administrador.')
    }

    const bearer = getBearerToken(req)
    if (!bearer) {
      return new Response(
        JSON.stringify({ error: 'No se proporcionó token de autorización' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 },
      )
    }

    let body: { email?: string; password?: string; name?: string; agency_id?: string }
    try {
      body = await req.json()
    } catch {
      throw new Error('Formato de datos inválido. Verifica que los datos se envíen correctamente.')
    }

    const agencyId = typeof body.agency_id === 'string' ? body.agency_id.trim() : ''
    if (!agencyId) {
      throw new Error('agency_id es obligatorio.')
    }

    await assertCanInviteToAgency({
      supabaseUrl,
      supabaseAnonKey,
      supabaseServiceKey,
      token: bearer,
      agencyId,
    })

    const cleanEmail = parseEmail(body.email)
    const cleanPassword = parseOptionalPassword(body.password)
    const name = typeof body.name === 'string' ? body.name.trim() : cleanEmail

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    const { data: existingEmployee } = await supabaseAdmin
      .from('employees')
      .select('id')
      .eq('email', cleanEmail)
      .eq('agency_id', agencyId)
      .maybeSingle()

    if (existingEmployee) {
      throw new Error('Este email ya está registrado en esta agencia. Usa otro email o inicia sesión.')
    }

    const { data: user, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: cleanEmail,
      password: cleanPassword,
      email_confirm: true,
      user_metadata: { full_name: name || cleanEmail },
    })

    if (authError) {
      if (authError.message?.includes('already registered') || authError.message?.includes('already exists')) {
        throw new Error('Este email ya está registrado. Usa otro email o inicia sesión.')
      }
      throw new Error(authError.message || 'Error al crear el usuario en el sistema de autenticación.')
    }

    if (!user?.user?.id) {
      throw new Error('No se pudo crear el usuario. El sistema no devolvió un ID válido.')
    }

    try {
      const { data: agencyForEmail } = await supabaseAdmin
        .from('agencies')
        .select('name')
        .eq('id', agencyId)
        .single()

      const emailResult = await sendWelcomeOrInvitationEmail(supabaseAdmin, {
        email: cleanEmail,
        name: name || cleanEmail,
        agencyName: agencyForEmail?.name || 'tu agencia',
        type: 'invitation',
      })
      if (!emailResult.success) {
        console.warn(`No se pudo enviar email de invitación a ${cleanEmail}:`, emailResult.error)
      }
    } catch (emailError) {
      console.warn(`No se pudo enviar email de invitación a ${cleanEmail}:`, emailError)
    }

    return new Response(
      JSON.stringify({ user: user.user }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
    )
  } catch (error: unknown) {
    if (error instanceof AgencyAccessError) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: error.status },
      )
    }
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido al crear usuario'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
    )
  }
})
