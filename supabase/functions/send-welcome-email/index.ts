// supabase/functions/send-welcome-email/index.ts
import { sendEmail } from "../_shared/resend.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ─── Plantilla base HTML ──────────────────────────────────────────
function baseTemplate(content: string, ctaUrl: string, ctaText: string): string {
    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Taimbox</title>
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
          <!-- Header con gradiente -->
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
                    <span style="font-size: 22px;">⏳</span>
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
              ${content}
            </td>
          </tr>
          <!-- CTA -->
          <tr>
            <td style="padding: 8px 40px 36px; text-align: center;">
              <a href="${ctaUrl}" style="
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
              ">${ctaText}</a>
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

// ─── Contenido del email de bienvenida (auto-registro) ────────────
function registrationContent(name: string, agencyName: string): string {
    return `
    <h1 style="margin: 0 0 8px; font-size: 22px; font-weight: 700; color: #0f172a;">
      ¡Bienvenido a Taimbox! 🎉
    </h1>
    <p style="margin: 0 0 20px; font-size: 15px; color: #475569; line-height: 1.6;">
      Hola <strong>${name}</strong>, tu cuenta y tu agencia <strong>${agencyName}</strong> ya están listas.
    </p>
    <p style="margin: 0 0 8px; font-size: 15px; color: #475569; line-height: 1.6;">
      Tienes <strong>14 días de prueba gratuita</strong> del plan Business para explorar todas las funcionalidades:
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 16px 0 24px;">
      <tr>
        <td style="padding: 6px 0; font-size: 14px; color: #475569;">✅ Planificación inteligente de recursos</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; font-size: 14px; color: #475569;">✅ Control de rentabilidad por proyecto</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; font-size: 14px; color: #475569;">✅ Weekly Forecast y redistribución</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; font-size: 14px; color: #475569;">✅ Radar operativo y coherencia</td>
      </tr>
    </table>
  `
}

// ─── Contenido del email de invitación ────────────────────────────
function invitationContent(name: string, agencyName: string): string {
    return `
    <h1 style="margin: 0 0 8px; font-size: 22px; font-weight: 700; color: #0f172a;">
      Te han añadido a ${agencyName} 🚀
    </h1>
    <p style="margin: 0 0 20px; font-size: 15px; color: #475569; line-height: 1.6;">
      Hola <strong>${name}</strong>, ya tienes acceso a <strong>${agencyName}</strong> en Taimbox.
    </p>
    <p style="margin: 0 0 24px; font-size: 15px; color: #475569; line-height: 1.6;">
      Accede con tu email para ver tu planificación, tareas asignadas y el estado de tus proyectos.
    </p>
  `
}

// ─── Handler principal ───────────────────────────────────────────
Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        let body
        try {
            body = await req.json()
        } catch {
            throw new Error('Formato de datos inválido.')
        }

        const { email, name, agencyName, type } = body

        if (!email || !name) {
            throw new Error('Email y nombre son obligatorios')
        }

        const siteUrl = Deno.env.get('CHECKOUT_BASE_URL') || Deno.env.get('SITE_URL') || 'https://taimbox.com'
        const cleanName = name.trim()
        const cleanAgency = (agencyName || 'tu agencia').trim()

        let subject: string
        let content: string

        if (type === 'invitation') {
            subject = `Te han añadido a ${cleanAgency} en Taimbox`
            content = baseTemplate(
                invitationContent(cleanName, cleanAgency),
                `${siteUrl}/login`,
                'Acceder a Taimbox'
            )
        } else {
            subject = '¡Bienvenido a Taimbox! Tu cuenta está lista'
            content = baseTemplate(
                registrationContent(cleanName, cleanAgency),
                `${siteUrl}/login`,
                'Empezar ahora'
            )
        }

        const result = await sendEmail({
            to: email,
            subject,
            html: content,
        })

        if (!result.success) {
            console.warn(`[send-welcome-email] No se pudo enviar email a ${email}: ${result.error}`)
            // No lanzamos error — fire-and-forget
        }

        return new Response(
            JSON.stringify({ success: result.success, id: result.id, error: result.error }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )
    } catch (error: any) {
        console.error('[send-welcome-email] Error:', error)
        return new Response(
            JSON.stringify({ error: error?.message || 'Error enviando email' }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        )
    }
})
