// supabase/functions/request-password-reset/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { sendEmail } from "../_shared/resend.ts"
import { generatePasswordRecoveryUrl, getSiteUrl } from "../_shared/password-recovery-url.ts"
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

function resetPasswordTemplate(name: string, resetUrl: string): string {
    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Restablecer contraseña - Taimbox</title>
</head>
<body style="
  margin: 0;
  padding: 0;
  background-color: #f1f5f9;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="
          background-color: #ffffff;
          border-radius: 12px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.06);
          overflow: hidden;
          max-width: 560px;
          width: 100%;
        ">
          <!-- Header -->
          <tr>
            <td style="
              background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
              padding: 32px 40px;
              text-align: center;
            ">
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                <tr>
                  <td style="
                    width: 40px;
                    height: 40px;
                    background: rgba(255,255,255,0.2);
                    border-radius: 10px;
                    text-align: center;
                    vertical-align: middle;
                    padding-right: 12px;
                  ">
                    <!-- Icono "Calendar" (approx) en HTML/CSS para evitar SVG/imagenes -->
                    <div style="width: 22px; height: 20px; border: 2px solid #ffffff; border-radius: 4px; box-sizing: border-box; position: relative; margin: 10px auto 0;">
                      <!-- Rings de la cabecera (estilo Lucide Calendar aprox.) -->
                      <div style="position: absolute; left: 4px; top: 1px; width: 6px; height: 6px; border: 2px solid #ffffff; border-radius: 999px; box-sizing: border-box; background: transparent;"></div>
                      <div style="position: absolute; right: 4px; top: 1px; width: 6px; height: 6px; border: 2px solid #ffffff; border-radius: 999px; box-sizing: border-box; background: transparent;"></div>
                      <!-- Barra superior -->
                      <div style="position: absolute; left: 3px; right: 3px; top: 5px; height: 2px; background: #ffffff;"></div>
                    </div>
                  </td>
                  <td style="
                    font-size: 24px;
                    font-weight: 700;
                    color: #ffffff;
                    letter-spacing: -0.5px;
                  ">Taimbox</td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Contenido -->
          <tr>
            <td style="padding: 36px 40px 20px;">
              <h1 style="margin: 0 0 8px; font-size: 22px; font-weight: 700; color: #0f172a;">
                Restablecer contraseña
              </h1>
              <p style="margin: 0 0 20px; font-size: 15px; color: #475569; line-height: 1.6;">
                Hola <strong>${name}</strong>, hemos recibido una solicitud para restablecer la contraseña de tu cuenta.
              </p>
              <p style="margin: 0 0 24px; font-size: 15px; color: #475569; line-height: 1.6;">
                Haz clic en el botón de abajo para establecer una nueva contraseña. El enlace expira en <strong>1 hora</strong>.
              </p>
            </td>
          </tr>
          <!-- CTA -->
          <tr>
            <td style="padding: 8px 40px 20px; text-align: center;">
              <a href="${resetUrl}" style="
                display: inline-block;
                background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
                color: #ffffff;
                text-decoration: none;
                padding: 14px 40px;
                border-radius: 8px;
                font-size: 15px;
                font-weight: 600;
                letter-spacing: 0.2px;
                box-shadow: 0 2px 8px rgba(79, 70, 229, 0.3);
              ">Restablecer contraseña</a>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 36px;">
              <p style="margin: 0; font-size: 13px; color: #94a3b8; line-height: 1.5; text-align: center;">
                Si no solicitaste este cambio, puedes ignorar este email. Tu contraseña no se modificará.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="
              background-color: #f8fafc;
              padding: 20px 40px;
              text-align: center;
              border-top: 1px solid #e2e8f0;
            ">
              <p style="margin: 0; font-size: 12px; color: #94a3b8; line-height: 1.5;">
                © ${new Date().getFullYear()} Taimbox · Gestión inteligente de agencias<br/>
                Este email fue enviado automáticamente. No es necesario responder.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim()
}

function resetPasswordText(name: string, resetUrl: string): string {
    return [
        `Hola ${name}, hemos recibido una solicitud para restablecer la contraseña de tu cuenta.`,
        ``,
        `Para restablecerla, abre el siguiente enlace (expira en 1 hora):`,
        resetUrl,
        ``,
        `Si no solicitaste este cambio, puedes ignorar este email. Tu contraseña no se modificará.`,
    ].join('\n')
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

        if (!supabaseUrl || !supabaseServiceKey) {
            throw new Error('Configuración del servidor incompleta.')
        }

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

        const clientIp = getClientIp(req)
        await assertRateLimit(
            supabaseAdmin,
            `password-reset:ip:${clientIp}`,
            RATE_LIMITS.passwordResetByIp,
            true,
        )

        let body
        try {
            body = await req.json()
        } catch {
            throw new Error('Formato de datos inválido.')
        }

        const { email } = body

        if (!email || typeof email !== 'string' || !email.trim()) {
            throw new Error('El email es obligatorio')
        }

        const cleanEmail = email.trim().toLowerCase()

        await assertRateLimit(
            supabaseAdmin,
            `password-reset:email:${cleanEmail}`,
            RATE_LIMITS.passwordResetByEmail,
            true,
        )

        const siteUrl = getSiteUrl()

        console.log(`[request-password-reset] Solicitud para: ${cleanEmail}`)

        // Obtener nombre del usuario (employees o fallback al email)
        let userName = cleanEmail.split('@')[0]
        const { data: employee } = await supabaseAdmin
            .from('employees')
            .select('name, user_id')
            .eq('email', cleanEmail)
            .limit(1)
            .maybeSingle()
        if (employee?.name) userName = employee.name

        const { resetUrl, error: linkError } = await generatePasswordRecoveryUrl(supabaseAdmin, cleanEmail)

        if (linkError || !resetUrl) {
            console.log('[request-password-reset] Error generando link (email puede no existir en auth):', linkError?.message ?? linkError)
            // Devolver 200 igualmente para no revelar info
            return new Response(
                JSON.stringify({ success: true }),
                {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 200,
                }
            )
        }

        console.log(`[request-password-reset] Enviando email de reset a ${cleanEmail}`)

        // Enviar email vía Resend
        const emailResult = await sendEmail({
            to: cleanEmail,
            subject: 'Restablecer tu contraseña de Taimbox',
            html: resetPasswordTemplate(userName, resetUrl),
            text: resetPasswordText(userName, resetUrl),
        })

        console.log('[request-password-reset] sendEmail result:', {
            success: emailResult.success,
            id: emailResult.id,
            error: emailResult.error,
        })

        if (!emailResult.success) {
            console.error(`[request-password-reset] Error enviando email: ${emailResult.error}`)
            // Aún devolvemos 200 para no revelar info al cliente
        }

        return new Response(
            JSON.stringify({ success: true }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )
    } catch (error: unknown) {
        if (error instanceof RateLimitError) {
            return new Response(
                JSON.stringify({ error: error.message }),
                {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 429,
                },
            )
        }
        if (error instanceof RateLimitUnavailableError) {
            return new Response(
                JSON.stringify({ error: error.message }),
                {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 503,
                },
            )
        }
        console.error('[request-password-reset] Error:', error)
        // Siempre devolver 200 para prevenir enumeración de usuarios
        return new Response(
            JSON.stringify({ success: true }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )
    }
})
