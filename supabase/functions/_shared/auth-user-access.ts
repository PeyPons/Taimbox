import { createClient, type User } from "https://esm.sh/@supabase/supabase-js@2";
import { AgencyAccessError, getBearerToken } from "./agency-access.ts";

export { getBearerToken, AgencyAccessError };

/** Usuario autenticado a partir del JWT del request (rechaza anon key como Bearer). */
export async function getAuthenticatedCaller(params: {
  supabaseUrl: string;
  supabaseAnonKey: string;
  token: string;
}): Promise<User> {
  const supabaseUser = createClient(params.supabaseUrl, params.supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${params.token}` } },
  });

  const { data: { user }, error } = await supabaseUser.auth.getUser();
  if (error || !user) {
    throw new AgencyAccessError(401, "Token de autorización inválido o expirado.");
  }

  return user;
}

async function collectAgencyIdsForUser(
  supabaseAdmin: ReturnType<typeof createClient>,
  userId: string,
): Promise<Set<string>> {
  const ids = new Set<string>();

  const { data: employees } = await supabaseAdmin
    .from("employees")
    .select("agency_id")
    .eq("user_id", userId);

  for (const row of employees ?? []) {
    if (row.agency_id) ids.add(row.agency_id);
  }

  const { data: userAgencies } = await supabaseAdmin
    .from("user_agencies")
    .select("agency_id")
    .eq("user_id", userId);

  for (const row of userAgencies ?? []) {
    if (row.agency_id) ids.add(row.agency_id);
  }

  return ids;
}

/** Misma lógica que RLS/triggers: permiso en settings.roles o is_agency_admin (owner legacy). */
async function callerCanManageAuthInAgency(
  supabaseUser: ReturnType<typeof createClient>,
  callerId: string,
  agencyId: string,
): Promise<boolean> {
  const { data: hasSettingsPerm, error: permErr } = await supabaseUser.rpc(
    "user_has_agency_role_permission",
    {
      p_user_id: callerId,
      p_agency_id: agencyId,
      p_permission: "can_access_agency_settings",
    },
  );
  if (!permErr && hasSettingsPerm === true) {
    return true;
  }

  const { data: isAdmin, error: adminErr } = await supabaseUser.rpc("is_agency_admin", {
    p_user_id: callerId,
    p_agency_id: agencyId,
  });
  return !adminErr && isAdmin === true;
}

/**
 * Autoriza cambios en Auth (email/contraseña) del usuario objetivo.
 *
 * - Propio usuario: puede cambiar su contraseña y email (p. ej. Ajustes → contraseña,
 *   o sincronización de email tras editar su ficha en employees).
 * - Admin de agencia: `can_access_agency_settings` en una agencia compartida con el objetivo.
 * - Platform admin: siempre.
 */
export async function assertCanUpdateAuthUser(params: {
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceKey: string;
  token: string;
  targetUserId: string;
}): Promise<User> {
  const { supabaseUrl, supabaseAnonKey, supabaseServiceKey, token, targetUserId } = params;

  const caller = await getAuthenticatedCaller({ supabaseUrl, supabaseAnonKey, token });

  if (caller.id === targetUserId) {
    return caller;
  }

  const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: isPlatformAdmin, error: platErr } = await supabaseUser.rpc("is_platform_admin");
  if (!platErr && isPlatformAdmin) {
    return caller;
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  const callerAgencies = await collectAgencyIdsForUser(supabaseAdmin, caller.id);
  const targetAgencies = await collectAgencyIdsForUser(supabaseAdmin, targetUserId);

  for (const agencyId of callerAgencies) {
    if (!targetAgencies.has(agencyId)) continue;
    if (await callerCanManageAuthInAgency(supabaseUser, caller.id, agencyId)) {
      return caller;
    }
  }

  throw new AgencyAccessError(
    403,
    "No tienes permiso para modificar las credenciales de este usuario.",
  );
}

/**
 * Autoriza borrado de cuenta Auth.
 * No permite auto-borrado; exige admin de agencia (agencia compartida) o platform admin.
 */
export async function assertCanDeleteAuthUser(params: {
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceKey: string;
  token: string;
  targetUserId: string;
}): Promise<User> {
  const { supabaseUrl, supabaseAnonKey, supabaseServiceKey, token, targetUserId } = params;

  const caller = await getAuthenticatedCaller({ supabaseUrl, supabaseAnonKey, token });

  if (caller.id === targetUserId) {
    throw new AgencyAccessError(
      403,
      "No puedes eliminar tu propia cuenta desde esta acción. Contacta a un administrador.",
    );
  }

  const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: isPlatformAdmin, error: platErr } = await supabaseUser.rpc("is_platform_admin");
  if (!platErr && isPlatformAdmin) {
    return caller;
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  const callerAgencies = await collectAgencyIdsForUser(supabaseAdmin, caller.id);
  const targetAgencies = await collectAgencyIdsForUser(supabaseAdmin, targetUserId);

  for (const agencyId of callerAgencies) {
    if (!targetAgencies.has(agencyId)) continue;
    if (await callerCanManageAuthInAgency(supabaseUser, caller.id, agencyId)) {
      return caller;
    }
  }

  throw new AgencyAccessError(
    403,
    "No tienes permiso para eliminar esta cuenta de acceso.",
  );
}

/**
 * Autoriza invitar usuarios a una agencia (crear/vincular empleado + Auth).
 * Requiere membresía y permiso de admin de agencia (settings o is_agency_admin).
 */
export async function assertCanInviteToAgency(params: {
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceKey: string;
  token: string;
  agencyId: string;
}): Promise<User> {
  const { supabaseUrl, supabaseAnonKey, supabaseServiceKey, token, agencyId } = params;

  const caller = await getAuthenticatedCaller({ supabaseUrl, supabaseAnonKey, token });

  const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: isPlatformAdmin, error: platErr } = await supabaseUser.rpc("is_platform_admin");
  if (!platErr && isPlatformAdmin) {
    return caller;
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  const callerAgencies = await collectAgencyIdsForUser(supabaseAdmin, caller.id);

  if (!callerAgencies.has(agencyId)) {
    throw new AgencyAccessError(403, "No tienes acceso a esta agencia.");
  }

  if (await callerCanManageAuthInAgency(supabaseUser, caller.id, agencyId)) {
    return caller;
  }

  throw new AgencyAccessError(
    403,
    "Solo los administradores pueden invitar usuarios a la agencia.",
  );
}
