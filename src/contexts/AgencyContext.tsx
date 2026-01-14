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
  created_at: string;
  updated_at: string;
}

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
}

const AgencyContext = createContext<AgencyContextType | undefined>(undefined);

export function AgencyProvider({ children }: { children: React.ReactNode }) {
  const { user, isInitialized: isAuthInitialized } = useAuth();
  const [currentAgency, setCurrentAgency] = useState<Agency | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableAgencies, setAvailableAgencies] = useState<Array<{ agencyId: string; agencyName: string }>>([]);
  const isInitialLoadRef = useRef(true);

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

    return {
      id: data.id,
      name: data.name,
      slug: data.slug,
      settings: migratedSettings,
      setupCompleted: data.setup_completed ?? true,
      createdAt: data.created_at,
      updatedAt: data.updated_at
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

      // 2. Obtener la agencia por el agency_id del empleado seleccionado
      const { data: agencyData, error: agencyError } = await supabase
        .from('agencies')
        .select('*')
        .eq('id', selectedEmployee.agency_id)
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

      // Solo actualizar si la agencia cambió para evitar loops infinitos
      setCurrentAgency(prev => {
        if (prev?.id === agency.id && JSON.stringify(prev.settings) === JSON.stringify(agency.settings)) {
          // La agencia no cambió, no actualizar para evitar re-renders innecesarios
          return prev;
        }
        // Agencia cargada exitosamente
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

  // Cargar agencia cuando el usuario esté autenticado
  useEffect(() => {
    if (isAuthInitialized) {
      fetchAgencyForUser();
    }
  }, [isAuthInitialized, fetchAgencyForUser]);

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

  const value = {
    currentAgency,
    isLoading,
    error,
    refreshAgency,
    completeSetup,
    updateAgencyName,
    switchAgency,
    availableAgencies,
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

