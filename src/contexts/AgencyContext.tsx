import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Agency, AgencySettings } from '@/types';
import { useAuth } from './AuthContext';

// Tipos para respuestas de Supabase (snake_case)
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

// Tipo exportado para miembros de agencia
export interface AgencyMember {
  id: string;           // employee.id
  userId: string | null; // user_id
  name: string;
  email: string;
  role: string | null;
  department: string | null;
  isActive: boolean;
  isAdmin: boolean;     // Calculado: role contiene keywords de admin
  isPrimary: boolean;   // De user_agencies.is_primary
}

// Tipo exportado para agencias del usuario con más detalles
export interface UserAgency {
  agencyId: string;
  agencyName: string;
  agency: Agency;
  role: string | null;
  isPrimary: boolean;
}

// Función auxiliar para verificar permisos de admin en los settings
const checkAdminPermission = (roleName: string | null, settings: AgencySettings): boolean => {
  if (!roleName) return false;

  // Buscar la configuración del rol
  const roleConfig = settings.roles?.find(r =>
    r.name.toLowerCase() === roleName.toLowerCase()
  );

  // Si existe configuración, verificar el permiso específico
  if (roleConfig && roleConfig.permissions) {
    return roleConfig.permissions.can_access_agency_settings === true;
  }

  // Si no hay configuración, por seguridad NO es admin
  return false;
};

interface AgencyContextType {
  currentAgency: Agency | null;
  isLoading: boolean;
  error: string | null;
  refreshAgency: () => Promise<void>;
  completeSetup: () => Promise<void>;
  updateAgencyName: (name: string) => Promise<void>;
  updateSettings: (settings: Partial<AgencySettings>) => Promise<void>;
  switchAgency: (agencyId: string) => Promise<void>;
  availableAgencies: Array<{ agencyId: string; agencyName: string }>;
  // Nuevas funciones para gestión de miembros
  userAgencies: UserAgency[];
  getAgencyMembers: (agencyId: string) => Promise<AgencyMember[]>;
  removeUserFromAgency: (userId: string, agencyId: string) => Promise<{ completelyRemoved: boolean }>;
  transferAgencyOwnership: (newOwnerId: string, agencyId: string) => Promise<void>;
}

const AgencyContext = createContext<AgencyContextType | undefined>(undefined);

export function AgencyProvider({ children }: { children: React.ReactNode }) {
  const { user, isInitialized: isAuthInitialized } = useAuth();
  const [currentAgency, setCurrentAgency] = useState<Agency | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableAgencies, setAvailableAgencies] = useState<Array<{ agencyId: string; agencyName: string }>>([]);
  const [userAgencies, setUserAgencies] = useState<UserAgency[]>([]);
  const isInitialLoadRef = useRef(true);
  const repairAttemptedRef = useRef(false);
  const prevUserIdRef = useRef<string | null>(null);

  // Migración automática de integraciones para agencias existentes (definida primero para usarse en mapSupabaseAgency)
  const migrateIntegrations = useCallback(async (agencyId: string, settings: AgencySettings): Promise<AgencySettings> => {
    // Si ya tiene enabledIntegrations, no hacer migración
    if (settings.enabledIntegrations) {
      return settings;
    }

    const enabledIntegrations: AgencySettings['enabledIntegrations'] = {};

    // Migración 1: weekly_feedback
    // Si el módulo weeklyFeedback está activo, activar la integración
    if (settings.modules?.weeklyFeedback === true) {
      enabledIntegrations.weekly_feedback = true;
    }

    // Migración 2: crm_user_id y crm_export
    // Verificar si hay empleados con crmUserId configurado (opcional, no bloquea si falla)
    try {
      const { data: employeesWithCrm, error: employeesError } = await supabase
        .from('employees')
        .select('crm_user_id')
        .eq('agency_id', agencyId)
        .not('crm_user_id', 'is', null)
        .limit(1);

      // Solo activar si la consulta fue exitosa y hay resultados
      if (!employeesError && employeesWithCrm && employeesWithCrm.length > 0) {
        enabledIntegrations.crm_user_id = true;
        enabledIntegrations.crm_export = true;
      }
    } catch (err) {
      // Silenciar el error - la migración de CRM es opcional
      // No bloquea la carga de la agencia si falla
      console.debug('[AgencyContext] No se pudo verificar empleados con CRM (opcional):', err);
    }

    // Inicializar enabledIntegrations (incluso si está vacío) para evitar migraciones futuras
    const migratedSettings = {
      ...settings,
      enabledIntegrations
    };

    // Intentar guardar la migración, pero no bloquear si falla
    // Si falla, retornamos los settings con enabledIntegrations inicializado en memoria
    try {
      const { error: updateError } = await supabase
        .from('agencies')
        .update({ settings: migratedSettings })
        .eq('id', agencyId);

      if (updateError) {
        console.warn('[AgencyContext] No se pudo guardar migración en BD (continuando en memoria):', updateError);
        // Retornar settings con enabledIntegrations en memoria aunque no se guardó
        return migratedSettings;
      }

      if (Object.keys(enabledIntegrations).length > 0) {
        // Migración de integraciones completada
      }
    } catch (err) {
      console.warn('[AgencyContext] Error guardando migración (continuando en memoria):', err);
      // Retornar settings con enabledIntegrations en memoria aunque no se guardó
      return migratedSettings;
    }

    return migratedSettings;
  }, []);

  // Mapear respuesta de Supabase a tipo Agency
  const mapSupabaseAgency = useCallback(async (data: SupabaseAgency): Promise<Agency> => {
    const settings = data.settings || {};

    // Ejecutar migración si es necesario
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
  }, [migrateIntegrations]);

  const fetchAgencyForUser = useCallback(async () => {
    if (!user?.email) {
      setCurrentAgency(null);
      setIsLoading(false);
      isInitialLoadRef.current = false;
      return;
    }

    // --- CORRECCIÓN: Background Revalidation ---
    // Solo mostrar spinner si es la carga inicial (no hay datos).
    // Si ya hay datos, el usuario seguirá viéndolos mientras se actualizan por detrás.
    const isInitialLoad = isInitialLoadRef.current;
    if (isInitialLoad) {
      setIsLoading(true);
    }

    setError(null);

    try {
      // 0. Si hay agencia primary en user_agencies (ej. impersonación), la priorizamos
      const { data: userAgenciesPrimary } = await supabase
        .from('user_agencies')
        .select('agency_id')
        .eq('user_id', user.id)
        .eq('is_primary', true)
        .maybeSingle();
      const primaryAgencyId = userAgenciesPrimary?.agency_id ?? null;

      // 1. Buscar TODOS los empleados por email para obtener todas las agencias
      const { data: employeesData, error: employeeError } = await supabase
        .from('employees')
        .select('agency_id, email, user_id, created_at')
        .eq('email', user.email.toLowerCase())
        .order('created_at', { ascending: false });

      // Log para diagnóstico
      if (employeeError) {
        console.debug('[AgencyContext] Error buscando por email:', employeeError);
      }

      let selectedEmployee = employeesData?.[0];
      let allEmployees = employeesData || [];

      // Si no se encuentra por email, intentar con user_id
      if (employeeError || !selectedEmployee?.agency_id) {
        console.debug('[AgencyContext] No se encontró por email, intentando con user_id:', user.id);

        // Intentar buscar por user_id (también puede haber múltiples)
        const { data: employeesByUserId, error: userIdError } = await supabase
          .from('employees')
          .select('agency_id, email, user_id, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (userIdError) {
          console.debug('[AgencyContext] Error buscando por user_id:', userIdError);
        }

        allEmployees = employeesByUserId || [];
        selectedEmployee = allEmployees[0];

        if (userIdError || !selectedEmployee?.agency_id) {
          // Fallback: obtener agencias desde user_agencies y buscar empleado en esas agencias
          console.debug('[AgencyContext] Fallback: buscando agencias en user_agencies para user_id:', user.id);
          const { data: userAgenciesData, error: uaError } = await supabase
            .from('user_agencies')
            .select('agency_id')
            .eq('user_id', user.id);

          if (!uaError && userAgenciesData && userAgenciesData.length > 0) {
            const agencyIds = userAgenciesData.map(ua => ua.agency_id);
            // Buscar empleado por user_id en esas agencias (evita depender de email en .or())
            const { data: employeesByAgencies, error: empByAgenciesError } = await supabase
              .from('employees')
              .select('agency_id, email, user_id, created_at')
              .in('agency_id', agencyIds)
              .eq('user_id', user.id)
              .order('created_at', { ascending: false });

            if (!empByAgenciesError && employeesByAgencies && employeesByAgencies.length > 0) {
              allEmployees = employeesByAgencies;
              selectedEmployee = employeesByAgencies[0];
              console.debug('[AgencyContext] Empleado encontrado vía user_agencies');
            } else {
              // Último intento: por email dentro de esas agencias
              const { data: byEmail, error: byEmailErr } = await supabase
                .from('employees')
                .select('agency_id, email, user_id, created_at')
                .in('agency_id', agencyIds)
                .eq('email', user.email?.toLowerCase())
                .order('created_at', { ascending: false });
              if (!byEmailErr && byEmail && byEmail.length > 0) {
                allEmployees = byEmail;
                selectedEmployee = byEmail[0];
                console.debug('[AgencyContext] Empleado encontrado por email vía user_agencies');
              }
            }
          }

          if (!selectedEmployee?.agency_id) {
            // Reparar si no hay filas en user_agencies pero el usuario podría tener empleado (ej. tras "Salir de vista" que borró la fila)
            const hasNoUserAgencies = !userAgenciesData || userAgenciesData.length === 0;
            if (hasNoUserAgencies && !repairAttemptedRef.current) {
              repairAttemptedRef.current = true;
              try {
                await supabase.rpc('repair_user_agencies_from_employees');
              } catch (_) {
                // ignorar
              }
              return fetchAgencyForUser();
            }
            // Sin empleado pero con user_agencies (ej. platform admin "accediendo como" agencia)
            if (userAgenciesData && userAgenciesData.length > 0) {
              const agencyIds = userAgenciesData.map(ua => ua.agency_id);
              const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
              const urlAgencyId = params?.get('agency');
              const selectedAgencyId = urlAgencyId && agencyIds.includes(urlAgencyId)
                ? urlAgencyId
                : agencyIds[0];
              if (selectedAgencyId) {
                const storageKey = `selected_agency_${user.id}`;
                localStorage.setItem(storageKey, selectedAgencyId);
                const { data: agencyData, error: agencyErr } = await supabase
                  .from('agencies')
                  .select('*')
                  .eq('id', selectedAgencyId)
                  .single();
                if (!agencyErr && agencyData) {
                  const agency = await mapSupabaseAgency(agencyData);
                  const { data: agenciesList } = await supabase
                    .from('agencies')
                    .select('id, name')
                    .in('id', agencyIds);
                  setAvailableAgencies((agenciesList || []).map(a => ({ agencyId: a.id, agencyName: a.name })));
                  setCurrentAgency(agency);
                  if (isInitialLoad) setIsLoading(false);
                  return;
                }
              }
            }
            console.warn('[AgencyContext] No se encontró empleado para el usuario:', {
              email: user.email,
              userId: user.id,
              emailError: employeeError,
              userIdError: userIdError
            });
            setCurrentAgency(null);
            if (isInitialLoad) {
              setIsLoading(false);
            }
            return;
          }
        }
      }

      // Obtener información de todas las agencias disponibles
      if (allEmployees.length > 1) {
        const uniqueAgencyIds = [...new Set(allEmployees.map(emp => emp.agency_id))];

        // Obtener nombres de todas las agencias
        const { data: agenciesData } = await supabase
          .from('agencies')
          .select('id, name')
          .in('id', uniqueAgencyIds);

        const agenciesList = (agenciesData || []).map(ag => ({
          agencyId: ag.id,
          agencyName: ag.name
        }));

        setAvailableAgencies(agenciesList);

        // Usar localStorage para recordar la preferencia
        const storageKey = `selected_agency_${user.id}`;
        const savedAgencyId = localStorage.getItem(storageKey);

        if (savedAgencyId) {
          // Buscar el empleado con la agencia guardada
          const savedEmployee = allEmployees.find(emp => emp.agency_id === savedAgencyId);
          if (savedEmployee) {
            selectedEmployee = savedEmployee;
            console.debug('[AgencyContext] Usando agencia guardada:', savedAgencyId);
          }
        } else {
          // Si no hay preferencia guardada, usar la más reciente y guardarla
          if (selectedEmployee?.agency_id) {
            localStorage.setItem(storageKey, selectedEmployee.agency_id);
            console.debug('[AgencyContext] Guardando agencia por defecto:', selectedEmployee.agency_id);
          }
        }
      } else {
        setAvailableAgencies([]);
      }

      // Priorizar agencia con is_primary (ej. impersonación desde admin)
      const agencyIdToLoad = primaryAgencyId || selectedEmployee?.agency_id;
      if (primaryAgencyId && !allEmployees.some(emp => emp.agency_id === primaryAgencyId)) {
        const { data: primaryAgencyData } = await supabase
          .from('agencies')
          .select('id, name')
          .eq('id', primaryAgencyId)
          .single();
        if (primaryAgencyData) {
          setAvailableAgencies(prev => {
            const has = prev.some(a => a.agencyId === primaryAgencyId);
            if (has) return prev;
            return [...prev, { agencyId: primaryAgencyData.id, agencyName: primaryAgencyData.name }];
          });
        }
      }

      // 2. Obtener la agencia por el agency_id a cargar
      const { data: agencyData, error: agencyError } = await supabase
        .from('agencies')
        .select('*')
        .eq('id', agencyIdToLoad)
        .single();

      if (agencyError || !agencyData) {
        console.error('[AgencyContext] Error obteniendo agencia:', agencyError);
        setError('No se pudo cargar la información de la agencia');
        setCurrentAgency(null);
        if (isInitialLoad) {
          setIsLoading(false);
        }
        return;
      }

      const agency = await mapSupabaseAgency(agencyData);

      // Solo actualizar si la agencia cambió para evitar loops infinitos (incl. token Google Ads)
      setCurrentAgency(prev => {
        if (prev?.id === agency.id &&
          JSON.stringify(prev.settings) === JSON.stringify(agency.settings) &&
          prev.google_ads_refresh_token === agency.google_ads_refresh_token &&
          prev.google_ads_customer_id === agency.google_ads_customer_id &&
          prev.meta_ads_access_token === agency.meta_ads_access_token) {
          return prev;
        }
        return agency;
      });

      isInitialLoadRef.current = false;

    } catch (err) {
      console.error('[AgencyContext] Error inesperado:', err);
      setError('Error al cargar la agencia');
      setCurrentAgency(null);
      isInitialLoadRef.current = false;
    } finally {
      // Asegurarnos de quitar el loading solo si lo pusimos (carga inicial)
      if (isInitialLoad) {
        setIsLoading(false);
      }
    }
  }, [user, mapSupabaseAgency]);

  // Cargar agencia cuando el usuario esté autenticado. Guarda con prevUserIdRef evita recargas
  // masivas cuando Supabase refresca el token o re-emite sesión al cambiar de pestaña.
  useEffect(() => {
    if (!isAuthInitialized) return;
    if (user?.id != null && currentAgency != null && user.id === prevUserIdRef.current) {
      return;
    }
    if (!user?.id) {
      prevUserIdRef.current = null;
    }
    repairAttemptedRef.current = false;
    fetchAgencyForUser();
    prevUserIdRef.current = user?.id ?? null;
  }, [isAuthInitialized, fetchAgencyForUser, user?.id, currentAgency]);

  const refreshAgency = useCallback(async () => {
    await fetchAgencyForUser();
  }, [fetchAgencyForUser]);

  // Marcar setup como completado
  const completeSetup = useCallback(async () => {
    if (!currentAgency?.id) return;

    const { error } = await supabase
      .from('agencies')
      .update({ setup_completed: true })
      .eq('id', currentAgency.id);

    if (error) {
      console.error('[AgencyContext] Error completando setup:', error);
      throw error;
    }

    setCurrentAgency(prev => prev ? { ...prev, setupCompleted: true } : null);
  }, [currentAgency?.id]);

  // Actualizar nombre de agencia y regenerar slug
  const updateAgencyName = useCallback(async (name: string) => {
    if (!currentAgency?.id) return;

    // Generar slug a partir del nombre
    const newSlug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const { error } = await supabase
      .from('agencies')
      .update({ name, slug: newSlug })
      .eq('id', currentAgency.id);

    if (error) {
      console.error('[AgencyContext] Error actualizando nombre:', error);
      throw error;
    }

    setCurrentAgency(prev => prev ? { ...prev, name, slug: newSlug } : null);
  }, [currentAgency?.id]);

  // Función para cambiar de agencia manualmente
  const switchAgency = useCallback(async (agencyId: string) => {
    if (!user?.id) return;

    // Guardar la preferencia en localStorage
    const storageKey = `selected_agency_${user.id}`;
    localStorage.setItem(storageKey, agencyId);

    // Recargar la agencia
    await fetchAgencyForUser();
  }, [user?.id, fetchAgencyForUser]);

  // ============================================
  // Funciones de gestión de miembros de agencia
  // ============================================

  // Obtener miembros de una agencia
  const getAgencyMembers = useCallback(async (agencyId: string): Promise<AgencyMember[]> => {
    // 1. Obtener empleados de la agencia
    const { data: employees, error: employeesError } = await supabase
      .from('employees')
      .select('id, user_id, name, email, role, department, is_active')
      .eq('agency_id', agencyId)
      .order('name');

    if (employeesError) {
      console.error('[AgencyContext] Error obteniendo empleados:', employeesError);
      throw new Error('Error al obtener miembros de la agencia');
    }

    if (!employees || employees.length === 0) {
      return [];
    }

    // 2. Obtener settings de la agencia para verificar permisos de roles
    const { data: agencyData, error: agencyError } = await supabase
      .from('agencies')
      .select('settings')
      .eq('id', agencyId)
      .single();

    if (agencyError) {
      console.error('[AgencyContext] Error obteniendo settings de agencia:', agencyError);
    }

    const agencySettings = agencyData?.settings || {};

    // 3. Obtener información de user_agencies para saber quién es primario (Owner)
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

    // 4. Mapear a AgencyMember con lógica de permisos segura
    const members: AgencyMember[] = employees.map(emp => {
      const userAgency = userAgenciesData.find(ua => ua.user_id === emp.user_id);
      const isPrimary = userAgency?.is_primary ?? false;

      // Es admin si:
      // 1. Es el propietario (isPrimary)
      // 2. Su rol tiene permiso explícito 'can_access_agency_settings' en los settings
      const isAdmin = isPrimary || checkAdminPermission(emp.role, agencySettings);

      return {
        id: emp.id,
        userId: emp.user_id || null,
        name: emp.name,
        email: emp.email || '',
        role: emp.role || null,
        department: emp.department || null,
        isActive: emp.is_active ?? true,
        isAdmin,
        isPrimary
      };
    });

    return members;
  }, []);

  // Eliminar usuario de una agencia
  const removeUserFromAgency = useCallback(async (userId: string, agencyId: string): Promise<{ completelyRemoved: boolean }> => {
    // 1. Verificar si el usuario está en otras agencias
    const { data: otherAgencies, error: checkError } = await supabase
      .from('user_agencies')
      .select('id, agency_id')
      .eq('user_id', userId)
      .neq('agency_id', agencyId);

    if (checkError) {
      console.error('[AgencyContext] Error verificando otras agencias:', checkError);
      throw new Error('Error al verificar agencias del usuario');
    }

    const hasOtherAgencies = otherAgencies && otherAgencies.length > 0;

    // 2. Desactivar o eliminar empleado de esta agencia
    const { error: employeeError } = await supabase
      .from('employees')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('agency_id', agencyId);

    if (employeeError) {
      console.error('[AgencyContext] Error desactivando empleado:', employeeError);
      throw new Error('Error al eliminar el miembro');
    }

    // 3. Eliminar relación en user_agencies
    const { error: uaError } = await supabase
      .from('user_agencies')
      .delete()
      .eq('user_id', userId)
      .eq('agency_id', agencyId);

    if (uaError) {
      console.error('[AgencyContext] Error eliminando de user_agencies:', uaError);
      // No lanzar error aquí, la eliminación del empleado ya se hizo
    }

    return { completelyRemoved: !hasOtherAgencies };
  }, []);

  // Transferir propiedad de agencia
  const transferAgencyOwnership = useCallback(async (newOwnerId: string, agencyId: string): Promise<void> => {
    // 1. Quitar is_primary de todos los usuarios de esta agencia
    const { error: resetError } = await supabase
      .from('user_agencies')
      .update({ is_primary: false })
      .eq('agency_id', agencyId);

    if (resetError) {
      console.error('[AgencyContext] Error reseteando is_primary:', resetError);
      throw new Error('Error al transferir propiedad');
    }

    // 2. Establecer el nuevo owner como primario
    const { error: setOwnerError } = await supabase
      .from('user_agencies')
      .update({ is_primary: true })
      .eq('user_id', newOwnerId)
      .eq('agency_id', agencyId);

    if (setOwnerError) {
      console.error('[AgencyContext] Error estableciendo nuevo owner:', setOwnerError);
      throw new Error('Error al establecer nuevo propietario');
    }

    // 3. Actualizar el rol del nuevo owner para incluir "Admin" si no tiene un rol asignado o no parece ser admin
    const { data: newOwnerEmployee } = await supabase
      .from('employees')
      .select('id, role')
      .eq('user_id', newOwnerId)
      .eq('agency_id', agencyId)
      .maybeSingle();

    if (newOwnerEmployee) {
      // Verificar si el rol actual parece ser de admin
      const currentRole = newOwnerEmployee.role?.toLowerCase() || '';
      const seemsLikeAdmin = ['admin', 'manager', 'director', 'owner', 'propietario'].some(k => currentRole.includes(k));

      if (!seemsLikeAdmin) {
        await supabase
          .from('employees')
          .update({ role: 'Admin' })
          .eq('id', newOwnerEmployee.id);
      }
    }
  }, []);

  const value = {
    currentAgency,
    isLoading,
    error,
    refreshAgency,
    completeSetup,
    updateAgencyName,
    switchAgency,
    availableAgencies,
    userAgencies,
    getAgencyMembers,
    removeUserFromAgency,
    transferAgencyOwnership,
    updateSettings: async (settings: Partial<AgencySettings>) => {
      if (!currentAgency?.id) return;

      const newSettings = { ...currentAgency.settings, ...settings };
      const { error } = await supabase
        .from('agencies')
        .update({ settings: newSettings })
        .eq('id', currentAgency.id);

      if (error) throw error;

      // Actualizar estado local inmediatamente para evitar parpadeos y loaders innecesarios
      setCurrentAgency(prev => prev ? { ...prev, settings: newSettings } : null);

      // Opcional: refrescar en segundo plano sin bloquear
      fetchAgencyForUser().catch(console.error);
    }
  };

  return <AgencyContext.Provider value={value}>{children}</AgencyContext.Provider>;
}

export function useAgency() {
  const context = useContext(AgencyContext);
  if (context === undefined) {
    throw new Error('useAgency must be used within an AgencyProvider');
  }
  return context;
}

