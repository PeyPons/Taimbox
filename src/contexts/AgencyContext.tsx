import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
}

const AgencyContext = createContext<AgencyContextType | undefined>(undefined);

export function AgencyProvider({ children }: { children: React.ReactNode }) {
  const { user, isInitialized: isAuthInitialized } = useAuth();
  const [currentAgency, setCurrentAgency] = useState<Agency | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAgencyForUser = useCallback(async () => {
    if (!user?.email) {
      setCurrentAgency(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 1. Buscar el empleado por email para obtener su agency_id
      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .select('agency_id')
        .eq('email', user.email.toLowerCase())
        .single();

      if (employeeError || !employeeData?.agency_id) {
        // Intentar buscar por user_id
        const { data: employeeByUserId, error: userIdError } = await supabase
          .from('employees')
          .select('agency_id')
          .eq('user_id', user.id)
          .single();

        if (userIdError || !employeeByUserId?.agency_id) {
          console.warn('[AgencyContext] No se encontró empleado para el usuario:', user.email);
          setCurrentAgency(null);
          setIsLoading(false);
          return;
        }

        // Obtener la agencia por el agency_id del empleado
        const { data: agencyData, error: agencyError } = await supabase
          .from('agencies')
          .select('*')
          .eq('id', employeeByUserId.agency_id)
          .single();

        if (agencyError || !agencyData) {
          console.error('[AgencyContext] Error obteniendo agencia:', agencyError);
          setError('No se pudo cargar la información de la agencia');
          setCurrentAgency(null);
          setIsLoading(false);
          return;
        }

        const agency = mapSupabaseAgency(agencyData);
        setCurrentAgency(agency);
        console.log('[AgencyContext] Agencia cargada:', agency.name);
        setIsLoading(false);
        return;
      }

      // 2. Obtener la agencia por el agency_id del empleado
      const { data: agencyData, error: agencyError } = await supabase
        .from('agencies')
        .select('*')
        .eq('id', employeeData.agency_id)
        .single();

      if (agencyError || !agencyData) {
        console.error('[AgencyContext] Error obteniendo agencia:', agencyError);
        setError('No se pudo cargar la información de la agencia');
        setCurrentAgency(null);
        setIsLoading(false);
        return;
      }

      const agency = mapSupabaseAgency(agencyData);
      setCurrentAgency(agency);
      console.log('[AgencyContext] Agencia cargada:', agency.name);

    } catch (err) {
      console.error('[AgencyContext] Error inesperado:', err);
      setError('Error al cargar la agencia');
      setCurrentAgency(null);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Mapear respuesta de Supabase a tipo Agency
  const mapSupabaseAgency = (data: SupabaseAgency): Agency => ({
    id: data.id,
    name: data.name,
    slug: data.slug,
    settings: data.settings || {},
    setupCompleted: data.setup_completed ?? true,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  });

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

  const value = {
    currentAgency,
    isLoading,
    error,
    refreshAgency,
    completeSetup,
    updateAgencyName,
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

