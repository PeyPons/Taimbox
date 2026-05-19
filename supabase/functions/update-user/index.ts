import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import {
  AgencyAccessError,
  assertCanUpdateAuthUser,
  getBearerToken,
} from "../_shared/auth-user-access.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      throw new Error('Configuración del servidor incompleta.')
    }

    const bearer = getBearerToken(req)
    if (!bearer) {
      return new Response(JSON.stringify({ error: 'No se proporcionó token de autorización' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    const { userId, password, email } = await req.json()

    if (!userId || typeof userId !== 'string') {
      throw new Error('User ID is required')
    }

    await assertCanUpdateAuthUser({
      supabaseUrl,
      supabaseAnonKey,
      supabaseServiceKey,
      token: bearer,
      targetUserId: userId,
    })

    const updates: { password?: string; email?: string; email_confirm?: boolean } = {}
    if (password && password.length >= 6) updates.password = password
    if (email && typeof email === 'string' && email.trim()) {
      updates.email = email.trim().toLowerCase()
      updates.email_confirm = true
    }

    if (!updates.password && !updates.email) {
      throw new Error('Se requiere al menos password o email para actualizar')
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, updates)

    if (error) throw error

    return new Response(JSON.stringify({ user: data.user }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    if (error instanceof AgencyAccessError) {
      return new Response(JSON.stringify({ error: error.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: error.status,
      })
    }

    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
