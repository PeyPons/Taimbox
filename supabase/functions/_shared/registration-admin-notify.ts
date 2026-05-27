/**
 * Aviso interno al administrador cuando un usuario completa el registro (nueva agencia).
 */
import { sendEmail } from "./resend.ts"

const DEFAULT_NOTIFY_EMAIL = "alexanderouteiral@gmail.com"

function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

export type RegistrationAdminNotifyPayload = {
  userName: string
  userEmail: string
  agencyName: string
  agencySlug: string
  agencyId: string
  userId: string
  currency: string
  planId: string
}

function registrationNotifyTemplate(payload: RegistrationAdminNotifyPayload): { html: string; text: string } {
  const safeName = escapeHtml(payload.userName)
  const safeEmail = escapeHtml(payload.userEmail)
  const safeAgency = escapeHtml(payload.agencyName)
  const safeSlug = escapeHtml(payload.agencySlug)
  const registeredAt = new Date().toLocaleString("es-ES", { timeZone: "Europe/Madrid" })

  const text = [
    "Nuevo registro en Taimbox",
    "",
    `Nombre: ${payload.userName}`,
    `Email: ${payload.userEmail}`,
    `Agencia: ${payload.agencyName}`,
    `Slug: ${payload.agencySlug}`,
    `Moneda: ${payload.currency}`,
    `Plan: ${payload.planId}`,
    `Agency ID: ${payload.agencyId}`,
    `User ID: ${payload.userId}`,
    `Fecha (Madrid): ${registeredAt}`,
  ].join("\n")

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Nuevo registro - Taimbox</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica Neue,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);max-width:560px;width:100%;">
          <tr>
            <td style="background:linear-gradient(135deg,#059669 0%,#10b981 100%);padding:28px 40px;text-align:center;">
              <p style="margin:0;color:#ffffff;font-weight:800;font-size:18px;">Nuevo registro</p>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.9);font-size:12px;">Taimbox · ${escapeHtml(registeredAt)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 40px;">
              <p style="margin:0 0 12px;font-size:14px;color:#475569;"><strong style="color:#0f172a;">Persona:</strong> ${safeName}</p>
              <p style="margin:0 0 12px;font-size:14px;color:#475569;"><strong style="color:#0f172a;">Email:</strong> <a href="mailto:${safeEmail}" style="color:#4f46e5;">${safeEmail}</a></p>
              <p style="margin:0 0 12px;font-size:14px;color:#475569;"><strong style="color:#0f172a;">Agencia:</strong> ${safeAgency}</p>
              <p style="margin:0 0 12px;font-size:14px;color:#475569;"><strong style="color:#0f172a;">Slug:</strong> ${safeSlug}</p>
              <p style="margin:0 0 12px;font-size:14px;color:#475569;"><strong style="color:#0f172a;">Moneda:</strong> ${escapeHtml(payload.currency)} · <strong style="color:#0f172a;">Plan:</strong> ${escapeHtml(payload.planId)}</p>
              <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.5;">IDs: agencia ${escapeHtml(payload.agencyId)} · usuario ${escapeHtml(payload.userId)}</p>
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

export async function sendRegistrationAdminNotify(
  payload: RegistrationAdminNotifyPayload,
): Promise<{ success: boolean; error?: string }> {
  const envTo = Deno.env.get("REGISTRATION_NOTIFY_EMAIL")
  if (envTo === "") {
    return { success: true }
  }
  const to = (envTo ?? DEFAULT_NOTIFY_EMAIL).trim()
  if (!to) {
    return { success: false, error: "REGISTRATION_NOTIFY_EMAIL inválido" }
  }

  const { html, text } = registrationNotifyTemplate(payload)
  const subject = `[Taimbox] Nuevo registro: ${payload.agencyName} (${payload.userEmail})`

  return sendEmail({ to, subject, html, text })
}
