// supabase/functions/send-welcome-email/index.ts
// HTTP opcional; el envío real está en _shared/welcome-and-invitation-email.ts (misma vía que request-password-reset).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { sendWelcomeOrInvitationEmail } from "../_shared/welcome-and-invitation-email.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Configuración del servidor incompleta.")
    }
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    let body: Record<string, unknown>
    try {
      body = await req.json()
    } catch {
      throw new Error("Formato de datos inválido.")
    }

    const email = body.email as string | undefined
    const name = body.name as string | undefined
    const agencyName = (body.agencyName as string | undefined) || "tu agencia"
    const type = body.type as "registration" | "invitation" | undefined

    if (!email || !name) {
      throw new Error("Email y nombre son obligatorios")
    }
    if (type !== "registration" && type !== "invitation") {
      throw new Error('type debe ser "registration" o "invitation"')
    }

    const result = await sendWelcomeOrInvitationEmail(supabaseAdmin, {
      email,
      name,
      agencyName,
      type,
    })

    if (!result.success) {
      console.warn(`[send-welcome-email] No se pudo enviar email a ${email}: ${result.error}`)
    }

    return new Response(
      JSON.stringify({ success: result.success, id: result.id, error: result.error }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error enviando email"
    console.error("[send-welcome-email] Error:", error)
    return new Response(
      JSON.stringify({ error: message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      },
    )
  }
})
