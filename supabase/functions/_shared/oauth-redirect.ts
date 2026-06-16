const PRODUCTION_REDIRECTS = {
  google: "https://taimbox.com/google-callback",
  meta: "https://taimbox.com/meta-callback",
} as const;

const LOCAL_REDIRECTS = {
  google: "http://localhost:8080/google-callback",
  meta: "http://localhost:8080/meta-callback",
} as const;

export type OAuthProvider = keyof typeof PRODUCTION_REDIRECTS;

function isNonProduction(): boolean {
  const env = (Deno.env.get("ENVIRONMENT") ?? Deno.env.get("DENO_ENV") ?? "").toLowerCase();
  if (env === "production" || env === "prod") return false;
  if (Deno.env.get("ALLOW_LOCAL_OAUTH_REDIRECT") === "1") return true;
  return env !== "production" && env !== "prod";
}

function allowedRedirects(provider: OAuthProvider): Set<string> {
  const allowed = new Set<string>([PRODUCTION_REDIRECTS[provider]]);
  if (isNonProduction()) {
    allowed.add(LOCAL_REDIRECTS[provider]);
  }
  return allowed;
}

/** Resuelve redirect_uri validando contra allowlist; null si el valor no está permitido. */
export function resolveOAuthRedirectUri(
  provider: OAuthProvider,
  redirectUri: string | undefined,
  origin: string | null,
): string | null {
  const allowed = allowedRedirects(provider);

  if (redirectUri && redirectUri.trim()) {
    return allowed.has(redirectUri.trim()) ? redirectUri.trim() : null;
  }

  const originLower = (origin ?? "").toLowerCase();
  if (originLower.includes("localhost") || originLower.includes("127.0.0.1")) {
    const local = LOCAL_REDIRECTS[provider];
    return allowed.has(local) ? local : null;
  }

  const prod = PRODUCTION_REDIRECTS[provider];
  return allowed.has(prod) ? prod : null;
}
