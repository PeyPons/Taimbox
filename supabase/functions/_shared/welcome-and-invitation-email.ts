/**
 * Envío directo vía Resend (misma ruta que request-password-reset: sendEmail en proceso).
 * Evita fetch a otra Edge Function, que en algunos despliegues falla (JWT, red interna).
 */
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2"
import { sendEmail } from "./resend.ts"
import { generatePasswordRecoveryUrl, getSiteUrl } from "./password-recovery-url.ts"

export type WelcomeEmailPayloadType = "registration" | "invitation"

function baseTemplate(
  content: string,
  ctaUrl: string,
  ctaText: string,
  secondaryCta?: { url: string; text: string },
): string {
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
                    <div style="width: 22px; height: 20px; border: 2px solid #ffffff; border-radius: 4px; box-sizing: border-box; position: relative; margin: 10px auto 0;">
                      <div style="position: absolute; left: 4px; top: 1px; width: 6px; height: 6px; border: 2px solid #ffffff; border-radius: 999px; box-sizing: border-box; background: transparent;"></div>
                      <div style="position: absolute; right: 4px; top: 1px; width: 6px; height: 6px; border: 2px solid #ffffff; border-radius: 999px; box-sizing: border-box; background: transparent;"></div>
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
          <tr>
            <td style="padding: 36px 40px 20px;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 40px ${secondaryCta ? "12px" : "36px"}; text-align: center;">
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
          ${
  secondaryCta
    ? `<tr>
            <td style="padding: 0 40px 28px; text-align: center;">
              <a href="${secondaryCta.url}" style="
                display: inline-block;
                color: #64748b;
                text-decoration: underline;
                font-size: 14px;
                font-weight: 500;
              ">${secondaryCta.text}</a>
            </td>
          </tr>`
    : ""
}
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

function baseText(
  content: string,
  ctaUrl: string,
  ctaText: string,
  secondary?: { url: string; text: string },
): string {
  const lines = [
    "Taimbox",
    "",
    content,
    "",
    `${ctaText}: ${ctaUrl}`,
  ]
  if (secondary) {
    lines.push("", `${secondary.text}: ${secondary.url}`)
  }
  lines.push("", `© ${new Date().getFullYear()} Taimbox. Este email fue enviado automáticamente. No es necesario responder.`)
  return lines.join("\n")
}

function registrationContent(name: string, agencyName: string): string {
  return `
    <h1 style="margin: 0 0 8px; font-size: 22px; font-weight: 700; color: #0f172a;">
      ¡Bienvenido a Taimbox!
    </h1>
    <p style="margin: 0 0 20px; font-size: 15px; color: #475569; line-height: 1.6;">
      Hola <strong>${name}</strong>, tu cuenta y tu agencia <strong>${agencyName}</strong> ya están listas.
    </p>
    <p style="margin: 0 0 8px; font-size: 15px; color: #475569; line-height: 1.6;">
      Tienes <strong>14 días de prueba gratuita</strong> del plan Business para explorar todas las funcionalidades:
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 16px 0 24px;">
      <tr>
        <td style="padding: 6px 0; font-size: 14px; color: #475569;">- Planificación inteligente de recursos</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; font-size: 14px; color: #475569;">- Control de rentabilidad por proyecto</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; font-size: 14px; color: #475569;">- Weekly Forecast y redistribución</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; font-size: 14px; color: #475569;">- Radar operativo y coherencia</td>
      </tr>
    </table>
  `
}

function registrationText(name: string, agencyName: string): string {
  return [
    `Hola ${name}, tu cuenta y tu agencia ${agencyName} ya están listas.`,
    `Tienes 14 días de prueba gratuita del plan Business para explorar todas las funcionalidades:`,
    "- Planificación inteligente de recursos",
    "- Control de rentabilidad por proyecto",
    "- Weekly Forecast y redistribución",
    "- Radar operativo y coherencia",
  ].join("\n")
}

function invitationContent(name: string, agencyName: string, hasSetupLink: boolean): string {
  return `
    <h1 style="margin: 0 0 8px; font-size: 22px; font-weight: 700; color: #0f172a;">
      Te han añadido a ${agencyName}
    </h1>
    <p style="margin: 0 0 20px; font-size: 15px; color: #475569; line-height: 1.6;">
      Hola <strong>${name}</strong>, ya tienes acceso a <strong>${agencyName}</strong> en Taimbox.
    </p>
    <p style="margin: 0 0 24px; font-size: 15px; color: #475569; line-height: 1.6;">
      ${
  hasSetupLink
    ? "Usa el botón de abajo para <strong>establecer tu contraseña</strong> (enlace válido un tiempo limitado). Después podrás iniciar sesión con tu email."
    : "Accede con tu email para ver tu planificación, tareas asignadas y el estado de tus proyectos."
}
    </p>
  `
}

function invitationText(name: string, agencyName: string, hasSetupLink: boolean): string {
  const extra = hasSetupLink
    ? " Usa el enlace del correo para establecer tu contraseña; el enlace caduca en breve."
    : " Accede con tu email para ver tu planificación y tareas."
  return [`Hola ${name}, ya tienes acceso a ${agencyName} en Taimbox.${extra}`].join("")
}

export async function sendWelcomeOrInvitationEmail(
  supabaseAdmin: SupabaseClient,
  params: {
    email: string
    name: string
    agencyName: string
    type: WelcomeEmailPayloadType
  },
): Promise<{ success: boolean; id?: string; error?: string }> {
  const cleanName = params.name.trim()
  const cleanAgency = (params.agencyName || "tu agencia").trim()
  const cleanEmail = String(params.email).trim().toLowerCase()
  const siteUrl = getSiteUrl()

  let subject: string
  let html: string
  let text: string

  if (params.type === "invitation") {
    const gen = await generatePasswordRecoveryUrl(supabaseAdmin, cleanEmail)
    const setupUrl = gen.resetUrl
    if (gen.error) {
      console.warn(
        "[welcome-and-invitation-email] No se pudo generar enlace recovery para invitación:",
        gen.error.message,
      )
    }

    const loginUrl = `${siteUrl.replace(/\/$/, "")}/login`
    const hasSetup = !!setupUrl

    subject = `Te han añadido a ${cleanAgency} en Taimbox`
    html = baseTemplate(
      invitationContent(cleanName, cleanAgency, hasSetup),
      hasSetup ? setupUrl! : loginUrl,
      hasSetup ? "Establecer contraseña" : "Acceder a Taimbox",
      hasSetup ? { url: loginUrl, text: "Ya tengo contraseña · Ir al inicio de sesión" } : undefined,
    )
    text = baseText(
      invitationText(cleanName, cleanAgency, hasSetup),
      hasSetup ? setupUrl! : loginUrl,
      hasSetup ? "Establecer contraseña" : "Acceder a Taimbox",
      hasSetup ? { url: loginUrl, text: "Iniciar sesión" } : undefined,
    )
  } else {
    subject = "¡Bienvenido a Taimbox! Tu cuenta está lista"
    const loginFull = `${siteUrl.replace(/\/$/, "")}/login`
    html = baseTemplate(
      registrationContent(cleanName, cleanAgency),
      loginFull,
      "Empezar ahora",
    )
    text = baseText(
      registrationText(cleanName, cleanAgency),
      loginFull,
      "Empezar ahora",
    )
  }

  const result = await sendEmail({
    to: cleanEmail,
    subject,
    html,
    text,
  })

  console.log(`[welcome-and-invitation-email] type=${params.type} to=${cleanEmail}`, {
    success: result.success,
    id: result.id,
    error: result.error,
  })

  return result
}
