// supabase/functions/delete-user/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // 1. Manejo de CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // 2. Cliente Admin
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 3. Validar variables
        if (!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')) {
            throw new Error('Falta la Service Role Key')
        }

        // 4. Parsear body
        const { userId } = await req.json()

        if (!userId) {
            throw new Error('User ID is required')
        }

        console.log(`Eliminando usuario Auth: ${userId}`)

        // 5. Eliminar usuario de Auth
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
