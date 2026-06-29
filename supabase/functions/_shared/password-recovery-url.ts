/**
 * Construye la URL de /reset-password a partir del hashed_token de Supabase Auth.
 * Misma lógica que request-password-reset para no duplicar parsing.
 */
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2"

export function getSiteUrl(): string {
  return Deno.env.get("CHECKOUT_BASE_URL") || Deno.env.get("SITE_URL") || "https://taimbox.com"
}

export function recoveryRedirectUrl(siteUrl: string): string {
  return `${siteUrl.replace(/\/$/, "")}/reset-password`
}

function buildResetPasswordUrl(
  siteUrl: string,
  tokenHash: string,
  type: string,
): string {
  return `${siteUrl.replace(/\/$/, "")}/reset-password?token_hash=${encodeURIComponent(tokenHash)}&type=${encodeURIComponent(type)}`
}

/**
 * Extrae token_hash y type del action_link como fallback si hashed_token no viene en properties.
 */
function parseActionLink(actionLink: string): { tokenHash: string | null; type: string } {
  try {
    const url = new URL(actionLink)
    const tokenHash =
      url.searchParams.get("token_hash") ||
      url.searchParams.get("token") ||
      url.hash?.match(/token_hash=([^&]+)/)?.[1] ||
      url.hash?.match(/access_token=([^&]+)/)?.[1]
    const type = url.searchParams.get("type") || "recovery"
    return { tokenHash, type }
  } catch {
    return { tokenHash: null, type: "recovery" }
  }
}

/**
 * Genera enlace recovery para establecer/restablecer contraseña (válido para invitados con cuenta recién creada).
 * @returns resetUrl lista para el email, o null si generateLink falla.
 */
export async function generatePasswordRecoveryUrl(
  supabaseAdmin: SupabaseClient,
  email: string,
): Promise<{ resetUrl: string | null; error: Error | null }> {
  const cleanEmail = email.trim().toLowerCase()
  const siteUrl = getSiteUrl()

  const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
    type: "recovery",
    email: cleanEmail,
    options: {
      redirectTo: recoveryRedirectUrl(siteUrl),
    },
  })

  if (linkError) {
    return { resetUrl: null, error: linkError instanceof Error ? linkError : new Error(String(linkError)) }
  }

  const hashedToken = linkData?.properties?.hashed_token
  const verificationType = linkData?.properties?.verification_type || "recovery"

  if (hashedToken) {
    return { resetUrl: buildResetPasswordUrl(siteUrl, hashedToken, verificationType), error: null }
  }

  const actionLink = linkData?.properties?.action_link || ""
  if (actionLink) {
    const parsed = parseActionLink(actionLink)
    if (parsed.tokenHash) {
      return { resetUrl: buildResetPasswordUrl(siteUrl, parsed.tokenHash, parsed.type), error: null }
    }
  }

  return { resetUrl: recoveryRedirectUrl(siteUrl), error: null }
}
