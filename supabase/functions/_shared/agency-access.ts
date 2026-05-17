import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export type AgencyPermissionKey =
  | "can_access_google_ads"
  | "can_access_meta_ads"
  | "can_access_agency_settings";

export class AgencyAccessError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function getBearerToken(req: Request): string | null {
  const header = req.headers.get("Authorization");
  if (!header?.startsWith("Bearer ")) return null;
  return header.replace("Bearer ", "").trim();
}

function roleHasPermission(
  settings: { roles?: unknown[] } | null | undefined,
  roleName: string,
  permission: AgencyPermissionKey,
): boolean {
  const roles = settings?.roles;
  if (!Array.isArray(roles)) return false;
  const normalized = roleName.trim().toLowerCase();
  for (const entry of roles) {
    if (typeof entry !== "object" || entry === null) continue;
    const name = "name" in entry ? String((entry as { name: string }).name).trim().toLowerCase() : "";
    if (name !== normalized) continue;
    const perms = "permissions" in entry
      ? (entry as { permissions?: Record<string, boolean> }).permissions
      : undefined;
    if (permission === "can_access_agency_settings") {
      return perms?.[permission] === true;
    }
    // Rutas de producto (Ads, etc.): opt-out como en usePermissions
    if (perms?.[permission] === false) return false;
    return true;
  }
  return false;
}

/** Exige JWT válido, membresía en la agencia y permiso de rol (o platform admin). */
export async function assertAgencyPermission(params: {
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceKey: string;
  token: string;
  agencyId: string;
  permission: AgencyPermissionKey;
}): Promise<void> {
  const { supabaseUrl, supabaseAnonKey, supabaseServiceKey, token, agencyId, permission } = params;

  const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
  if (userError || !user) {
    throw new AgencyAccessError(401, "No autorizado.");
  }

  const { data: isPlatformAdmin, error: platErr } = await supabaseUser.rpc("is_platform_admin");
  if (!platErr && isPlatformAdmin) {
    return;
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  const { data: ua } = await supabaseAdmin
    .from("user_agencies")
    .select("role")
    .eq("user_id", user.id)
    .eq("agency_id", agencyId)
    .maybeSingle();

  const { data: emp } = await supabaseAdmin
    .from("employees")
    .select("role")
    .eq("user_id", user.id)
    .eq("agency_id", agencyId)
    .maybeSingle();

  // Prioridad employees.role (igual que get_agency_for_app_client y user_has_agency_role_permission)
  const roleName = (emp?.role ?? ua?.role ?? "").trim();
  if (!roleName) {
    throw new AgencyAccessError(403, "Sin acceso a esta agencia.");
  }

  const { data: agency, error: agencyError } = await supabaseAdmin
    .from("agencies")
    .select("settings")
    .eq("id", agencyId)
    .single();

  if (agencyError || !agency) {
    throw new AgencyAccessError(404, "Agencia no encontrada.");
  }

  if (!roleHasPermission(agency.settings as { roles?: unknown[] }, roleName, permission)) {
    throw new AgencyAccessError(403, "Sin permiso para esta acción.");
  }
}

export async function assertPlatformAdmin(params: {
  supabaseUrl: string;
  supabaseAnonKey: string;
  token: string;
}): Promise<void> {
  const supabaseUser = createClient(params.supabaseUrl, params.supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${params.token}` } },
  });
  const { data: { user }, error } = await supabaseUser.auth.getUser();
  if (error || !user) throw new AgencyAccessError(401, "No autorizado.");
  const { data: isPlatformAdmin, error: platErr } = await supabaseUser.rpc("is_platform_admin");
  if (platErr || !isPlatformAdmin) {
    throw new AgencyAccessError(403, "Solo administradores de plataforma.");
  }
}
