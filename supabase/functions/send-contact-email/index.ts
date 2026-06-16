import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { sendEmail } from "../_shared/resend.ts"
import {
  INPUT_LIMITS,
  parseBoundedString,
  parseEmail,
} from "../_shared/input-limits.ts"
import {
  assertRateLimit,
  getClientIp,
  RATE_LIMITS,
  RateLimitError,
  RateLimitUnavailableError,
} from "../_shared/rate-limit.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function escapeHtml(input: string): string {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function contactEmailTemplate(name: string, email: string, subject: string, message: string): { html: string; text: string } {
  const safeName = escapeHtml(name)
  const safeEmail = escapeHtml(email)
  const safeSubject = escapeHtml(subject)
  const safeMessage = escapeHtml(message)

  const text = [
    `Nuevo mensaje de contacto`,
    ``,
    `Nombre: ${name}`,
    `Email: ${email}`,
    `Asunto: ${subject}`,
    ``,
    message,
  ].join('\n')

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Contacto - Taimbox</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica Neue,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);max-width:560px;width:100%;">
          <tr>
            <td style="background:linear-gradient(135deg,#4f46e5 0%,#6366f1 100%);padding:28px 40px;text-align:center;">
              <p style="margin:0;color:#ffffff;font-weight:800;font-size:18px;letter-spacing:-0.2px;">Taimbox</p>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:12px;">Formulario de contacto</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 40px;">
              <h1 style="margin:0 0 14px;font-size:20px;color:#0f172a;">Nuevo mensaje</h1>

              <p style="margin:0 0 10px;font-size:14px;color:#475569;line-height:1.6;">
                <strong style="color:#0f172a;">Nombre:</strong> ${safeName}
              </p>
              <p style="margin:0 0 10px;font-size:14px;color:#475569;line-height:1.6;">
                <strong style="color:#0f172a;">Email:</strong> ${safeEmail}
              </p>
              <p style="margin:0 0 16px;font-size:14px;color:#475569;line-height:1.6;">
                <strong style="color:#0f172a;">Asunto:</strong> ${safeSubject}
              </p>

              <div style="border:1px solid #e2e8f0;border-radius:10px;background:#f8fafc;padding:14px 16px;">
                <p style="margin:0;font-size:14px;color:#0f172a;white-space:pre-wrap;line-height:1.6;">
                  ${safeMessage.replaceAll('\n', '<br/>')}
                </p>
              </div>

              <p style="margin:18px 0 0;font-size:12px;color:#94a3b8;line-height:1.5;">
                Este email fue enviado automáticamente desde la web de Taimbox. Por favor, responde directamente a la persona indicada.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#f8fafc;padding:18px 40px;text-align:center;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.5;">
                © ${new Date().getFullYear()} Taimbox
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim()

  return { html, text }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    let body: any
    try {
      body = await req.json()
    } catch {
      return new Response(JSON.stringify({ success: false, error: 'Formato de datos inválido.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ success: false, error: 'Configuración del servidor incompleta.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
    const clientIp = getClientIp(req)
    await assertRateLimit(
      supabaseAdmin,
      `contact:ip:${clientIp}`,
      RATE_LIMITS.contactByIp,
      true,
    )

    const name = parseBoundedString(body?.name, {
      max: INPUT_LIMITS.personName,
      fieldName: 'Nombre',
    })
    const email = parseEmail(body?.email)
    const subject = parseBoundedString(body?.subject, {
      max: INPUT_LIMITS.contactSubject,
      fieldName: 'Asunto',
    })
    const message = parseBoundedString(body?.message, {
      max: INPUT_LIMITS.contactMessage,
      fieldName: 'Mensaje',
    })

    const toEmail = Deno.env.get('CONTACT_TO_EMAIL') || 'hello@taimbox.com'
    const contact = contactEmailTemplate(name, email, subject, message)

    const result = await sendEmail({
      to: toEmail,
      subject: `Contacto - ${subject}`,
      html: contact.html,
      text: contact.text,
    })

    if (!result.success) {
      return new Response(JSON.stringify({ success: false, error: result.error }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    return new Response(JSON.stringify({ success: true, id: result.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (err: unknown) {
    console.error('[send-contact-email] Error:', err)
    const message = err instanceof Error ? err.message : 'Error enviando email'
    let status = 500
    if (err instanceof RateLimitError) {
      status = 429
    } else if (err instanceof RateLimitUnavailableError) {
      status = 503
    } else if (err instanceof Error) {
      status = 400
    }
    return new Response(JSON.stringify({ success: false, error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status,
    })
  }
})

