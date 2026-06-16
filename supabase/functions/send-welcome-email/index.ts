/**
 * @deprecated El envío real está en _shared/welcome-and-invitation-email.ts
 * (register-agency, invite-user-to-agency, create-user). Este endpoint HTTP quedó retirado.
 */
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  return new Response(
    JSON.stringify({
      error: "Esta función está retirada. El envío de bienvenida/invitación se hace desde register-agency, invite-user-to-agency o create-user.",
      code: "deprecated",
    }),
    {
      status: 410,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  )
})
