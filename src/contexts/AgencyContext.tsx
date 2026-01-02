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
  created_at: string;
  updated_at: string;
}

interface AgencyContextType {
  currentAgency: Agency | null;
  isLoading: boolean;
  error: string | null;
  refreshAgency: () => Promise<void>;
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

  const value = {
    currentAgency,
    isLoading,
    error,
    refreshAgency
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
