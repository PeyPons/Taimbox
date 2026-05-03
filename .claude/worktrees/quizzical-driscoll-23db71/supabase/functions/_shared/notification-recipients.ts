import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { HoursPreference } from "./project-notification-metrics.ts";

export type RecipientPolicy =
  | "transfer_target"
  | "transfer_source"
  | "all_with_hours_in_month"
  | "role_name"
  | "agency_admins"
  | "custom_emails";

interface EmployeeRow {
  id: string;
  email: string | null;
  user_id: string | null;
  role: string;
}

interface AgencySettingsRoles {
  roles?: Array<{ name?: string; permissions?: { can_access_agency_settings?: boolean } }>;
}

function normalizeEmail(e: string | null | undefined): string | null {
  if (!e || typeof e !== "string") return null;
  const t = e.trim().toLowerCase();
  if (!t.includes("@")) return null;
  return t;
}

const userEmailCache = new Map<string, string | null>();

export async function getEmailForEmployee(
  supabaseAdmin: SupabaseClient,
  emp: EmployeeRow,
): Promise<string | null> {
  if (emp.user_id) {
    const ck = emp.user_id;
    if (userEmailCache.has(ck)) {
      return userEmailCache.get(ck) ?? null;
    }
    const { data, error } = await supabaseAdmin.auth.admin.getUserById(ck);
    if (error) {
      console.warn("[notification-recipients] getUserById", ck, error.message);
    }
    const mail = normalizeEmail(data?.user?.email);
    userEmailCache.set(ck, mail);
    return mail;
  }
  return normalizeEmail(emp.email);
}

export async function loadEmployeesByIds(
  supabaseAdmin: SupabaseClient,
  ids: string[],
): Promise<Map<string, EmployeeRow>> {
  const map = new Map<string, EmployeeRow>();
  if (!ids.length) return map;
  const { data, error } = await supabaseAdmin
    .from("employees")
    .select("id, email, user_id, role")
    .in("id", ids);
  if (error) {
    console.error("[notification-recipients] loadEmployeesByIds", error);
    return map;
  }
  for (const row of data || []) {
    map.set(row.id as string, row as EmployeeRow);
  }
  return map;
}

export async function loadAllAgencyEmployees(
  supabaseAdmin: SupabaseClient,
  agencyId: string,
): Promise<EmployeeRow[]> {
  const { data, error } = await supabaseAdmin
    .from("employees")
    .select("id, email, user_id, role")
    .eq("agency_id", agencyId)
    .eq("is_active", true);
  if (error) {
    console.error("[notification-recipients] loadAllAgencyEmployees", error);
    return [];
  }
  return (data || []) as EmployeeRow[];
}

function roleHasAgencySettings(
  settings: AgencySettingsRoles,
  employeeRoleName: string,
): boolean {
  const roles = settings.roles;
  if (!Array.isArray(roles)) return false;
  const target = employeeRoleName.trim().toLowerCase();
  for (const r of roles) {
    if (!r || typeof r !== "object") continue;
    const n = (r.name || "").trim().toLowerCase();
    if (n === target && r.permissions?.can_access_agency_settings === true) {
      return true;
    }
  }
  return false;
}

export async function resolveEmailsForPolicy(params: {
  supabaseAdmin: SupabaseClient;
  policy: RecipientPolicy;
  recipientRoleName: string | null;
  extraEmails: string[];
  agencyId: string;
  agencySettings: Record<string, unknown>;
  /** transfer */
  fromEmployeeId?: string;
  toEmployeeId?: string;
  /** scheduled: empleados con horas en el proyecto este mes */
  involvedEmployeeIds?: string[];
}): Promise<string[]> {
  const {
    supabaseAdmin,
    policy,
    recipientRoleName,
    extraEmails,
    agencyId,
    agencySettings,
    fromEmployeeId,
    toEmployeeId,
    involvedEmployeeIds = [],
  } = params;

  const out = new Set<string>();
  for (const e of extraEmails || []) {
    const n = normalizeEmail(e);
    if (n) out.add(n);
  }

  const addByEmployeeIds = async (ids: string[]) => {
    const map = await loadEmployeesByIds(supabaseAdmin, ids);
    for (const id of ids) {
      const emp = map.get(id);
      if (!emp) continue;
      const mail = await getEmailForEmployee(supabaseAdmin, emp);
      if (mail) out.add(mail);
    }
  };

  if (policy === "custom_emails") {
    return [...out];
  }

  if (policy === "transfer_target" && toEmployeeId) {
    await addByEmployeeIds([toEmployeeId]);
    return [...out];
  }

  if (policy === "transfer_source" && fromEmployeeId) {
    await addByEmployeeIds([fromEmployeeId]);
    return [...out];
  }

  if (policy === "all_with_hours_in_month") {
    await addByEmployeeIds(involvedEmployeeIds);
    return [...out];
  }

  if (policy === "role_name" && recipientRoleName?.trim()) {
    const all = await loadAllAgencyEmployees(supabaseAdmin, agencyId);
    const target = recipientRoleName.trim().toLowerCase();
    const ids = all.filter((e) => e.role.trim().toLowerCase() === target).map((e) => e.id);
    await addByEmployeeIds(ids);
    return [...out];
  }

  if (policy === "agency_admins") {
    const all = await loadAllAgencyEmployees(supabaseAdmin, agencyId);
    const settings = agencySettings as AgencySettingsRoles;
    const ids = all.filter((e) => roleHasAgencySettings(settings, e.role)).map((e) => e.id);
    await addByEmployeeIds(ids);
    return [...out];
  }

  return [...out];
}

export function hoursPreferenceFromSettings(settings: Record<string, unknown> | null): HoursPreference {
  const p = settings?.hoursTrackingPreference;
  return p === "actual" ? "actual" : "computed";
}
