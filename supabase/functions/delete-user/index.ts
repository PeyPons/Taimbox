// supabase/functions/delete-user/index.ts
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
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        if (!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')) {
            throw new Error('Falta la Service Role Key')
        }

        const { userId } = await req.json()

        if (!userId) {
            throw new Error('User ID is required')
        }

        console.log(`Eliminando usuario Auth: ${userId}`)

        const { error: uaErr } = await supabaseAdmin.from('user_agencies').delete().eq('user_id', userId)
        if (uaErr) {
            console.error('delete-user: user_agencies', uaErr)
        }

        const { error: empErr } = await supabaseAdmin.from('employees').update({ user_id: null }).eq('user_id', userId)
        if (empErr) {
            console.error('delete-user: employees user_id null', empErr)
        }

        const { error: paErr } = await supabaseAdmin.from('platform_admins').delete().eq('user_id', userId)
        if (paErr) {
            console.warn('delete-user: platform_admins (puede no existir fila)', paErr)
        }

        const { error: alErr } = await supabaseAdmin.from('audit_logs').delete().eq('user_id', userId)
        if (alErr) {
            console.warn('delete-user: audit_logs', alErr)
        }

        const { error: stErr } = await supabaseAdmin
            .from('support_tickets')
            .update({ reporter_user_id: null })
            .eq('reporter_user_id', userId)
        if (stErr) {
            console.warn('delete-user: support_tickets reporter', stErr)
        }

        const { data, error } = await supabaseAdmin.auth.admin.deleteUser(userId)

        if (error) {
            console.error('Error eliminando usuario Auth:', error)
            throw error
        }

        return new Response(
            JSON.stringify({ success: true, data }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            }
        )

    } catch (error) {
        console.error('Error general en delete-user:', error)
        return new Response(
            JSON.stringify({ error: (error as Error).message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400
            }
        )
    }
})
