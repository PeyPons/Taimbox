import { supabase } from '@/lib/supabase';
import { Agency, AgencySettings } from '@/types';
import type { AgencyMember } from '@/contexts/AgencyContext';
import { invokeDeleteAuthUser, purgeEmployeeRowAndRelatedData } from '@/utils/employeeDeletionUtils';

interface SupabaseAgency {
  id: string;
  name: string;
  slug: string;
  settings: AgencySettings;
  setup_completed: boolean;
  status?: string;
  created_at: string;
  updated_at: string;
  google_ads_refresh_token?: string | null;
  google_ads_customer_id?: string | null;
  meta_ads_access_token?: string | null;
  plan_id?: string | null;
  subscription_status?: string | null;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  trial_ends_at?: string | null;
  subscription_period_ends_at?: string | null;
  subscription_cancel_at_period_end?: boolean | null;
  trial_used_at?: string | null;
}

const checkAdminPermission = (roleName: string | null, settings: AgencySettings): boolean => {
  if (!roleName) return false;
  const roleConfig = settings.roles?.find(r => r.name.toLowerCase() === roleName.toLowerCase());
  if (roleConfig && roleConfig.permissions) {
    return roleConfig.permissions.can_access_agency_settings === true;
  }
  return false;
};

export async function migrateIntegrations(agencyId: string, settings: AgencySettings): Promise<AgencySettings> {
  if (settings.enabledIntegrations) {
    return settings;
  }

  const enabledIntegrations: AgencySettings['enabledIntegrations'] = {};

  if (settings.modules?.weeklyFeedback === true) {
    enabledIntegrations.weekly_feedback = true;
  }

  try {
    const { data: employeesWithCrm, error: employeesError } = await supabase
      .from('employees')
      .select('crm_user_id')
      .eq('agency_id', agencyId)
      .not('crm_user_id', 'is', null)
      .limit(1);

    if (!employeesError && employeesWithCrm && employeesWithCrm.length > 0) {
      enabledIntegrations.crm_user_id = true;
      enabledIntegrations.crm_export = true;
    }
  } catch (err) {
    console.debug('[AgencyUtils] No se pudo verificar empleados con CRM (opcional):', err);
  }

  const migratedSettings = {
    ...settings,
    enabledIntegrations,
  };

  try {
    const { error: updateError } = await supabase
      .from('agencies')
      .update({ settings: migratedSettings })
      .eq('id', agencyId);

    if (updateError) {
      console.warn('[AgencyUtils] No se pudo guardar migración en BD (continuando en memoria):', updateError);
      return migratedSettings;
    }
  } catch (err) {
    console.warn('[AgencyUtils] Error guardando migración (continuando en memoria):', err);
    return migratedSettings;
  }

  return migratedSettings;
}

export async function mapSupabaseAgency(data: SupabaseAgency): Promise<Agency> {
  const settings = data.settings || {};
  const migratedSettings = await migrateIntegrations(data.id, settings);

  const status = (data.status === 'suspended' ? 'suspended' : 'active') as Agency['status'];
  const planId = (data.plan_id === 'pro' || data.plan_id === 'business' ? data.plan_id : 'starter') as Agency['planId'];

  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    settings: migratedSettings,
    setupCompleted: data.setup_completed ?? true,
    status,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    google_ads_refresh_token: data.google_ads_refresh_token ?? undefined,
    google_ads_customer_id: data.google_ads_customer_id ?? undefined,
    meta_ads_access_token: data.meta_ads_access_token ?? undefined,
    planId,
    subscriptionStatus: data.subscription_status ?? undefined,
    stripeCustomerId: data.stripe_customer_id ?? undefined,
    stripeSubscriptionId: data.stripe_subscription_id ?? undefined,
    trialEndsAt: data.trial_ends_at ?? undefined,
    subscriptionPeriodEndsAt: data.subscription_period_ends_at ?? undefined,
    subscriptionCancelAtPeriodEnd: data.subscription_cancel_at_period_end ?? false,
    trialUsedAt: data.trial_used_at ?? undefined,
  };
}

export async function getAgencyMembersUtil(agencyId: string): Promise<AgencyMember[]> {
  const { data: employees, error: employeesError } = await supabase
    .from('employees')
    .select('id, user_id, name, email, role, department, is_active, created_at')
    .eq('agency_id', agencyId)
    .order('name');

  if (employeesError) {
    console.error('[AgencyUtils] Error obteniendo empleados:', employeesError);
    throw new Error('Error al obtener miembros de la agencia');
  }

  if (!employees || employees.length === 0) {
    return [];
  }

  const { data: agencyData, error: agencyError } = await supabase
    .from('agencies')
    .select('settings')
    .eq('id', agencyId)
    .single();

  if (agencyError) {
    console.error('[AgencyUtils] Error obteniendo settings de agencia:', agencyError);
  }

  const agencySettings = (agencyData?.settings || {}) as AgencySettings;

  const userIds = employees.filter(e => e.user_id).map(e => e.user_id);
  let userAgenciesData: Array<{ user_id: string; is_primary: boolean }> = [];

  if (userIds.length > 0) {
    const { data: uaData } = await supabase
      .from('user_agencies')
      .select('user_id, is_primary')
      .eq('agency_id', agencyId)
      .in('user_id', userIds);

    userAgenciesData = uaData || [];
  }

  const settingsOwnerId =
    typeof agencySettings.ownerUserId === 'string' && agencySettings.ownerUserId.trim() !== ''
      ? agencySettings.ownerUserId.trim()
      : null;
  const primaryTrueCount = userAgenciesData.filter(ua => ua.is_primary === true).length;

  let inferredLegacyOwnerId: string | null = null;
  if (!settingsOwnerId && primaryTrueCount > 1) {
    const adminEmps = employees
      .filter(e => e.user_id && checkAdminPermission(e.role ?? null, agencySettings))
      .slice()
      .sort((a, b) => {
        const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
        const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
        return ta - tb;
      });
    inferredLegacyOwnerId = adminEmps[0]?.user_id ?? null;
  }

  const members: AgencyMember[] = employees.map(emp => {
    const userAgency = userAgenciesData.find(ua => ua.user_id === emp.user_id);
    const uaIsPrimary = userAgency?.is_primary ?? false;

    let isAgencyOwner = false;
    if (settingsOwnerId && emp.user_id === settingsOwnerId) {
      isAgencyOwner = true;
    } else if (!settingsOwnerId && primaryTrueCount === 1 && uaIsPrimary) {
      // Legado: antes se mezclaba “agencia por defecto” (is_primary) con propietario; solo si hay un único is_primary en la agencia
      isAgencyOwner = true;
    } else if (
      !settingsOwnerId &&
      primaryTrueCount > 1 &&
      inferredLegacyOwnerId &&
      emp.user_id === inferredLegacyOwnerId
    ) {
      // Varios is_primary=true (agencia única por usuario): mostrar un solo Owner como el admin más antiguo hasta que exista ownerUserId en settings
      isAgencyOwner = true;
    }

    const isAdmin = isAgencyOwner || checkAdminPermission(emp.role, agencySettings);

    return {
      id: emp.id,
      userId: emp.user_id || null,
      name: emp.name,
      email: emp.email || '',
      role: emp.role || null,
      department: emp.department || null,
      isActive: emp.is_active ?? true,
      isAdmin,
      isPrimary: isAgencyOwner,
    };
  });

  return members;
}

export async function removeUserFromAgencyUtil(
  userId: string,
  agencyId: string
): Promise<{ completelyRemoved: boolean }> {
  const { data: otherAgencies, error: checkError } = await supabase
    .from('user_agencies')
    .select('id, agency_id')
    .eq('user_id', userId)
    .neq('agency_id', agencyId);

  if (checkError) {
    console.error('[AgencyUtils] Error verificando otras agencias:', checkError);
    throw new Error('Error al verificar agencias del usuario');
  }

  const hasOtherAgencies = (otherAgencies?.length ?? 0) > 0;

  const { data: empRow, error: empFetchError } = await supabase
    .from('employees')
    .select('id')
    .eq('user_id', userId)
    .eq('agency_id', agencyId)
    .maybeSingle();

  if (empFetchError) {
    console.error('[AgencyUtils] Error obteniendo empleado:', empFetchError);
    throw new Error('Error al localizar el miembro en la agencia');
  }

  if (!hasOtherAgencies) {
    const { error: uaError } = await supabase
      .from('user_agencies')
      .delete()
      .eq('user_id', userId)
      .eq('agency_id', agencyId);

    if (uaError) {
      console.error('[AgencyUtils] Error eliminando de user_agencies:', uaError);
      throw new Error('Error al desvincular el usuario de la agencia');
    }

    if (empRow?.id) {
      const purge = await purgeEmployeeRowAndRelatedData(empRow.id);
      if (!purge.ok) {
        throw new Error(purge.error);
      }
    }

    const authResult = await invokeDeleteAuthUser(userId);
    if (!authResult.ok) {
      throw new Error(
        authResult.error ||
          'Los datos del miembro se eliminaron, pero no se pudo eliminar la cuenta de acceso'
      );
    }

    return { completelyRemoved: true };
  }

  const { error: employeeError } = await supabase
    .from('employees')
    .update({ is_active: false })
    .eq('user_id', userId)
    .eq('agency_id', agencyId);

  if (employeeError) {
    console.error('[AgencyUtils] Error desactivando empleado:', employeeError);
    throw new Error('Error al eliminar el miembro');
  }

  const { error: uaError } = await supabase
    .from('user_agencies')
    .delete()
    .eq('user_id', userId)
    .eq('agency_id', agencyId);

  if (uaError) {
    console.error('[AgencyUtils] Error eliminando de user_agencies:', uaError);
    throw new Error('Error al desvincular el usuario de la agencia');
  }

  return { completelyRemoved: false };
}

export async function transferAgencyOwnershipUtil(newOwnerId: string, agencyId: string): Promise<void> {
  // No poner is_primary = false en toda la agencia: rompe la sesión/RLS de los demás miembros
  // (cada usuario usa su fila user_agencies para “agencia por defecto” y, en algunos despliegues, políticas).
  // La propiedad real va en agencies.settings.ownerUserId (más abajo).
  const { error: setOwnerError } = await supabase
    .from('user_agencies')
    .update({ is_primary: true })
    .eq('user_id', newOwnerId)
    .eq('agency_id', agencyId);

  if (setOwnerError) {
    console.error('[AgencyUtils] Error estableciendo nuevo owner:', setOwnerError);
    throw new Error('Error al establecer nuevo propietario');
  }

  const { data: agencyRow, error: agencyFetchError } = await supabase
    .from('agencies')
    .select('settings')
    .eq('id', agencyId)
    .single();

  if (agencyFetchError) {
    console.error('[AgencyUtils] Error leyendo settings para ownerUserId:', agencyFetchError);
  } else {
    const prevSettings = (agencyRow?.settings || {}) as AgencySettings;
    const nextSettings: AgencySettings = { ...prevSettings, ownerUserId: newOwnerId };
    const { error: settingsError } = await supabase
      .from('agencies')
      .update({ settings: nextSettings })
      .eq('id', agencyId);

    if (settingsError) {
      console.error('[AgencyUtils] Error guardando ownerUserId en settings:', settingsError);
    }
  }

  const { data: newOwnerEmployee } = await supabase
    .from('employees')
    .select('id, role')
    .eq('user_id', newOwnerId)
    .eq('agency_id', agencyId)
    .maybeSingle();

  if (newOwnerEmployee && (!newOwnerEmployee.role || !newOwnerEmployee.role.toLowerCase().includes('admin'))) {
    const { error: updateRoleError } = await supabase
      .from('employees')
      .update({ role: 'Administrador' })
      .eq('id', newOwnerEmployee.id);

    if (updateRoleError) {
      console.warn('[AgencyUtils] No se pudo actualizar el rol del nuevo owner:', updateRoleError);
    }
  }
}

