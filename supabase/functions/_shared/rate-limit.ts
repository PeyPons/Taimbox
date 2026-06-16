import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export class RateLimitError extends Error {
  status = 429;

  constructor(message = "Demasiados intentos. Inténtalo más tarde.") {
    super(message);
    this.name = "RateLimitError";
  }
}

export class RateLimitUnavailableError extends Error {
  status = 503;

  constructor(message = "Servicio temporalmente no disponible. Inténtalo más tarde.") {
    super(message);
    this.name = "RateLimitUnavailableError";
  }
}

export const RATE_LIMITS = {
  contactByIp: { maxAttempts: 5, windowMs: 15 * 60 * 1000 },
  registerByIp: { maxAttempts: 5, windowMs: 60 * 60 * 1000 },
  registerByEmail: { maxAttempts: 3, windowMs: 60 * 60 * 1000 },
  passwordResetByIp: { maxAttempts: 5, windowMs: 15 * 60 * 1000 },
  passwordResetByEmail: { maxAttempts: 3, windowMs: 60 * 60 * 1000 },
} as const;

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return req.headers.get("x-real-ip")
    ?? req.headers.get("cf-connecting-ip")
    ?? "unknown";
}

export async function assertRateLimit(
  supabaseAdmin: SupabaseClient,
  bucket: string,
  options: { maxAttempts: number; windowMs: number },
  failClosed = false,
): Promise<void> {
  const since = new Date(Date.now() - options.windowMs).toISOString();

  const { count, error: countError } = await supabaseAdmin
    .from("form_rate_limit_events")
    .select("id", { count: "exact", head: true })
    .eq("bucket", bucket)
    .gte("created_at", since);

  if (countError) {
    console.warn("[rate-limit] count failed:", countError.message);
    if (failClosed) {
      throw new RateLimitUnavailableError();
    }
    return;
  }

  if ((count ?? 0) >= options.maxAttempts) {
    throw new RateLimitError();
  }

  const { error: insertError } = await supabaseAdmin
    .from("form_rate_limit_events")
    .insert({ bucket });

  if (insertError) {
    console.warn("[rate-limit] insert failed:", insertError.message);
    if (failClosed) {
      throw new RateLimitUnavailableError();
    }
  }
}
