import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Agency, AgencySettings, RolePermissions } from '@/types';
import { useAuth } from './AuthContext';
import { DEFAULT_PERMISSIONS } from '@/types/permissions';

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

interface UserAgency {
  id: string;
  agency: Agency;
  role?: string;
  department?: string;
  isPrimary: boolean;
  joinedAt: string;
}

export interface AgencyMember {
  id: string;
  employeeId: string;
  userId: string | null;
  name: string;
  email: string | null;
  role: string | null;
  department: string | null;
  isActive: boolean;
  joinedAt: string;
  isAdmin: boolean;
}

interface AgencyContextType {
  currentAgency: Agency | null;
  userAgencies: UserAgency[]; // Todas las agencias del usuario
  isLoading: boolean;
  error: string | null;
  refreshAgency: () => Promise<void>;
  switchAgency: (agencyId: string) => Promise<void>;
  completeSetup: () => Promise<void>;
  updateAgencyName: (name: string) => Promise<void>;
  updateSettings: (settings: Partial<AgencySettings>) => Promise<void>;
  createAgency: (name: string) => Promise<Agency>;
  leaveAgency: (agencyId: string) => Promise<void>;
  // Funciones de gestión administrativa
  inviteUserToAgency: (email: string, role?: string, department?: string) => Promise<void>;
  updateUserAgencyRole: (userId: string, agencyId: string, role: string, department?: string) => Promise<void>;
  removeUserFromAgency: (userId: string, agencyId: string) => Promise<{ completelyRemoved: boolean }>;
  getAgencyMembers: (agencyId: string) => Promise<AgencyMember[]>;
  transferAgencyOwnership: (newOwnerId: string, agencyId: string) => Promise<void>;
  deleteAgency: (agencyId: string) => Promise<void>;
}

const AgencyContext = createContext<AgencyContextType | undefined>(undefined);

export function AgencyProvider({ children }: { children: React.ReactNode }) {
  const { user, isInitialized: isAuthInitialized } = useAuth();
  const [currentAgency, setCurrentAgency] = useState<Agency | null>(null);
  const [userAgencies, setUserAgencies] = useState<UserAgency[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Cache para evitar recargas innecesarias
  const agenciesCacheRef = useRef<{ userId: string | null; data: UserAgency[]; timestamp: number }>({
    userId: null,
    data: [],
    timestamp: 0
  });
  
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
  
  // Obtener agencia actual desde localStorage o usar la primaria
  const getStoredAgencyId = (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('current_agency_id');
    }
    return null;
  };
  
  const setStoredAgencyId = (agencyId: string | null) => {
    if (typeof window !== 'undefined') {
      if (agencyId) {
        localStorage.setItem('current_agency_id', agencyId);
      } else {
        localStorage.removeItem('current_agency_id');
      }
    }
  };

  const fetchAgenciesForUser = useCallback(async () => {
    if (!user?.id) {
      setCurrentAgency(null);
      setUserAgencies([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Verificar cache
      const now = Date.now();
      if (
        agenciesCacheRef.current.userId === user.id &&
        agenciesCacheRef.current.data.length > 0 &&
        (now - agenciesCacheRef.current.timestamp) < CACHE_DURATION
      ) {
        // Usar datos del cache
        const cachedAgencies = agenciesCacheRef.current.data;
        setUserAgencies(cachedAgencies);
        
        // Determinar agencia actual desde cache
        const storedAgencyId = getStoredAgencyId();
        let selectedAgency: Agency | null = null;

        if (storedAgencyId) {
          const stored = cachedAgencies.find(ua => ua.agency.id === storedAgencyId);
          if (stored) {
            selectedAgency = stored.agency;
          }
        }

        if (!selectedAgency) {
          const primary = cachedAgencies.find(ua => ua.isPrimary);
          selectedAgency = primary?.agency || cachedAgencies[0]?.agency || null;
        }

        setCurrentAgency(selectedAgency);
        if (selectedAgency) {
          setStoredAgencyId(selectedAgency.id);
        }
        setIsLoading(false);
        return;
      }

      // Retry logic: intentar hasta 3 veces en caso de error de red
      let lastError: any = null;
      const maxRetries = 3;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          // Intentar obtener agencias desde user_agencies (nuevo sistema)
          const { data: userAgenciesData, error: userAgenciesError } = await supabase
            .from('user_agencies')
            .select(`
              id,
              agency_id,
              role,
              department,
              is_primary,
              joined_at,
              agencies (
                id,
                name,
                slug,
                settings,
                setup_completed,
                created_at,
                updated_at
              )
            `)
            .eq('user_id', user.id)
            .order('is_primary', { ascending: false })
            .order('joined_at', { ascending: true });

          // Si hay error pero no es de tabla no encontrada, reintentar
          if (userAgenciesError && userAgenciesError.code !== '42P01') {
            throw userAgenciesError;
          }

          if (userAgenciesData && userAgenciesData.length > 0) {
        // Nuevo sistema: usar user_agencies
        const mappedAgencies: UserAgency[] = userAgenciesData
          .filter(ua => ua.agencies) // Filtrar nulls
          .map(ua => ({
            id: ua.id,
            agency: mapSupabaseAgency(ua.agencies as SupabaseAgency),
            role: ua.role || undefined,
            department: ua.department || undefined,
            isPrimary: ua.is_primary || false,
            joinedAt: ua.joined_at
          }));

          setUserAgencies(mappedAgencies);
          
          // Actualizar cache
          agenciesCacheRef.current = {
            userId: user.id,
            data: mappedAgencies,
            timestamp: Date.now()
          };

          // Determinar agencia actual
          const storedAgencyId = getStoredAgencyId();
          let selectedAgency: Agency | null = null;

          if (storedAgencyId) {
            // Usar la agencia almacenada si existe en las agencias del usuario
            const stored = mappedAgencies.find(ua => ua.agency.id === storedAgencyId);
            if (stored) {
              selectedAgency = stored.agency;
            }
          }

          // Si no hay almacenada o no existe, usar la primaria
          if (!selectedAgency) {
            const primary = mappedAgencies.find(ua => ua.isPrimary);
            selectedAgency = primary?.agency || mappedAgencies[0]?.agency || null;
          }

          setCurrentAgency(selectedAgency);
          if (selectedAgency) {
            setStoredAgencyId(selectedAgency.id);
          }
          setIsLoading(false);
          return; // Éxito, salir del loop de retry
          }

          // Fallback: sistema antiguo (usando employees)
          console.log('[AgencyContext] Usando sistema antiguo (employees)');
          const { data: employeeData, error: employeeError } = await supabase
            .from('employees')
            .select('agency_id, role, department')
            .eq('user_id', user.id)
            .limit(1)
            .maybeSingle();

          if (employeeError) {
            // Si es error de tabla no encontrada, continuar
            if (employeeError.code === '42P01') {
              console.warn('[AgencyContext] Tabla employees no encontrada');
            } else {
              throw employeeError;
            }
          }

          if (!employeeData?.agency_id) {
            console.warn('[AgencyContext] No se encontró empleado para el usuario:', user.id);
            setCurrentAgency(null);
            setUserAgencies([]);
            setIsLoading(false);
            return; // No hay datos, pero no es un error
          }

          // Obtener la agencia
          const { data: agencyData, error: agencyError } = await supabase
            .from('agencies')
            .select('*')
            .eq('id', employeeData.agency_id)
            .single();

          if (agencyError) {
            console.error('[AgencyContext] Error obteniendo agencia:', agencyError);
            throw new Error(`Error al cargar la agencia: ${agencyError.message}`);
          }

          if (!agencyData) {
            throw new Error('La agencia no existe o fue eliminada');
          }

          const agency = mapSupabaseAgency(agencyData);
          setCurrentAgency(agency);
          
          // Crear entrada en user_agencies para migración automática
          const { error: migrationError } = await supabase
            .from('user_agencies')
            .insert({
              user_id: user.id,
              agency_id: agency.id,
              role: employeeData.role,
              department: employeeData.department,
              is_primary: true
            });

          if (migrationError) {
            // Solo loguear, no fallar si la tabla no existe
            if (migrationError.code !== '42P01') {
              console.warn('[AgencyContext] Error migrando a user_agencies:', migrationError);
            }
          }

          // Crear UserAgency para compatibilidad
          const migratedAgency: UserAgency = {
            id: 'migrated',
            agency,
            role: employeeData.role || undefined,
            department: employeeData.department || undefined,
            isPrimary: true,
            joinedAt: new Date().toISOString()
          };
          
          setUserAgencies([migratedAgency]);
          
          // Actualizar cache
          agenciesCacheRef.current = {
            userId: user.id,
            data: [migratedAgency],
            timestamp: Date.now()
          };

          console.log('[AgencyContext] Agencia cargada (sistema antiguo):', agency.name);
          setIsLoading(false);
          return; // Éxito, salir del loop de retry

        } catch (err: any) {
          lastError = err;
          console.error(`[AgencyContext] Intento ${attempt}/${maxRetries} fallido:`, err);
          
          // Si no es el último intento, esperar antes de reintentar
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Backoff exponencial
            continue;
          }
        }
      }

      // Si llegamos aquí, todos los intentos fallaron
      throw lastError || new Error('Error al cargar las agencias después de varios intentos');

    } catch (err: any) {
      console.error('[AgencyContext] Error inesperado:', err);
      const errorMessage = err?.message || 'Error al cargar las agencias';
      setError(errorMessage);
      setCurrentAgency(null);
      setUserAgencies([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Mapear respuesta de Supabase a tipo Agency
  // Asegurar que el rol "Administrador" siempre esté presente en la configuración
  const mapSupabaseAgency = (data: SupabaseAgency): Agency => {
    const ADMIN_ROLE_NAME = 'Administrador';
    const settings = data.settings || {};
    const roles = settings.roles || [];
    
    // Verificar si el rol "Administrador" existe
    const hasAdminRole = roles.some((r: any) => {
      const roleName = typeof r === 'string' ? r : r.name;
      return roleName === ADMIN_ROLE_NAME;
    });
    
    // Si no existe, agregarlo al inicio de la lista
    if (!hasAdminRole) {
      const adminRole: RolePermissions = {
        name: ADMIN_ROLE_NAME,
        permissions: DEFAULT_PERMISSIONS
      };
      settings.roles = [adminRole, ...roles];
    } else {
      // Asegurar que el rol "Administrador" tenga todos los permisos
      const updatedRoles = roles.map((r: any) => {
        if (typeof r === 'string') {
          if (r === ADMIN_ROLE_NAME) {
            return {
              name: ADMIN_ROLE_NAME,
              permissions: DEFAULT_PERMISSIONS
            };
          }
          return r;
        }
        if (r.name === ADMIN_ROLE_NAME) {
          return {
            ...r,
            permissions: DEFAULT_PERMISSIONS
          };
        }
        return r;
      });
      settings.roles = updatedRoles;
    }
    
    return {
      id: data.id,
      name: data.name,
      slug: data.slug,
      settings,
      setupCompleted: data.setup_completed ?? true,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  };

  // Cargar agencias cuando el usuario esté autenticado
  useEffect(() => {
    if (isAuthInitialized) {
      fetchAgenciesForUser();
    }
  }, [isAuthInitialized, fetchAgenciesForUser]);

  const refreshAgency = useCallback(async () => {
    await fetchAgenciesForUser();
  }, [fetchAgenciesForUser]);

  const switchAgency = useCallback(async (agencyId: string) => {
    if (!user?.id) {
      throw new Error('Usuario no autenticado');
    }

    if (!agencyId || typeof agencyId !== 'string') {
      throw new Error('ID de agencia inválido');
    }

    // Prevenir múltiples llamadas simultáneas
    if (isLoading) {
      throw new Error('Ya se está realizando una operación. Por favor espera.');
    }

    // Verificar que el usuario pertenece a esta agencia
    const userAgency = userAgencies.find(ua => ua.agency.id === agencyId);
    if (!userAgency) {
      throw new Error('No tienes acceso a esta agencia');
    }

    // Si ya es la agencia actual, no hacer nada
    if (currentAgency?.id === agencyId) {
      return;
    }

    try {
      // Obtener datos actualizados de la agencia
      const { data: agencyData, error } = await supabase
        .from('agencies')
        .select('*')
        .eq('id', agencyId)
        .single();

      if (error) {
        console.error('[AgencyContext] Error obteniendo agencia:', error);
        throw new Error(`Error al cargar la agencia: ${error.message}`);
      }

      if (!agencyData) {
        throw new Error('La agencia no existe o fue eliminada');
      }

      const agency = mapSupabaseAgency(agencyData);
      setCurrentAgency(agency);
      setStoredAgencyId(agencyId);
      
      // Opcional: marcar como primaria si no hay otra primaria
      if (!userAgencies.some(ua => ua.isPrimary && ua.agency.id !== agencyId)) {
        const { error: updateError } = await supabase
          .from('user_agencies')
          .update({ is_primary: true })
          .eq('user_id', user.id)
          .eq('agency_id', agencyId);

        if (updateError) {
          console.warn('[AgencyContext] Error marcando agencia como primaria:', updateError);
          // No fallar si esto falla, es solo una optimización
        }
      }

      // Invalidar cache para forzar recarga
      agenciesCacheRef.current = {
        userId: user.id,
        data: [],
        timestamp: 0
      };

      // Disparar evento para que AppContext recargue datos y actualice permisos
      window.dispatchEvent(new CustomEvent('agency-changed', { 
        detail: { targetAgencyId: agencyId } 
      }));
    } catch (error: any) {
      console.error('[AgencyContext] Error cambiando agencia:', error);
      throw error;
    }
  }, [userAgencies, user?.id, currentAgency?.id, isLoading]);

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

  const createAgency = useCallback(async (name: string): Promise<Agency> => {
    if (!user?.id) {
      throw new Error('Usuario no autenticado');
    }

    if (!name || typeof name !== 'string' || !name.trim()) {
      throw new Error('El nombre de la agencia es obligatorio');
    }

    const cleanName = name.trim();
    if (cleanName.length < 2) {
      throw new Error('El nombre de la agencia debe tener al menos 2 caracteres');
    }

    if (cleanName.length > 100) {
      throw new Error('El nombre de la agencia no puede exceder 100 caracteres');
    }

    // Validar que no exista una agencia con el mismo nombre para este usuario
    // (aunque técnicamente pueden existir agencias con el mismo nombre para diferentes usuarios)
    const existingAgency = userAgencies.find(ua => 
      ua.agency.name.toLowerCase() === cleanName.toLowerCase()
    );
    if (existingAgency) {
      throw new Error('Ya tienes una agencia con ese nombre');
    }

    try {
      // Generar slug
      const slug = cleanName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      // Crear agencia
      const { data: agencyData, error: agencyError } = await supabase
        .from('agencies')
        .insert({
          name: cleanName,
          slug,
          settings: {
            modules: {
              projects: true,
              weeklyFeedback: true,
              professionalGoals: true,
              deadlines: true
            },
            projectFilters: [],
            roles: [],
            departments: [],
            branding: {},
            features: {},
            integrations: {}
          },
          setup_completed: false
        })
        .select()
        .single();

      if (agencyError) {
        console.error('[AgencyContext] Error creando agencia:', agencyError);
        if (agencyError.code === '23505') {
          throw new Error('Ya existe una agencia con ese nombre. Por favor elige otro.');
        }
        throw new Error(`Error al crear la agencia: ${agencyError.message}`);
      }

      if (!agencyData) {
        throw new Error('No se pudo crear la agencia. Inténtalo de nuevo.');
      }

      const agency = mapSupabaseAgency(agencyData);

      // Crear relación usuario-agencia
      const { error: userAgencyError } = await supabase
        .from('user_agencies')
        .insert({
          user_id: user.id,
          agency_id: agency.id,
          is_primary: userAgencies.length === 0 // Primera agencia = primaria
        });

      if (userAgencyError) {
        console.error('[AgencyContext] Error creando relación user_agencies:', userAgencyError);
        // Rollback: eliminar agencia si falla la relación
        await supabase.from('agencies').delete().eq('id', agency.id);
        throw new Error(`Error al vincular la agencia: ${userAgencyError.message}`);
      }

      // Refrescar lista de agencias
      await fetchAgenciesForUser();

      return agency;
    } catch (error: any) {
      console.error('[AgencyContext] Error en createAgency:', error);
      throw error;
    }
  }, [user?.id, userAgencies, fetchAgenciesForUser]);

  const leaveAgency = useCallback(async (agencyId: string) => {
    if (!user?.id) {
      throw new Error('Usuario no autenticado');
    }

    if (!agencyId || typeof agencyId !== 'string') {
      throw new Error('ID de agencia inválido');
    }

    // Validar que el usuario pertenece a esta agencia
    const userAgency = userAgencies.find(ua => ua.agency.id === agencyId);
    if (!userAgency) {
      throw new Error('No perteneces a esta agencia');
    }

    // Validar que no es la última agencia
    if (userAgencies.length <= 1) {
      throw new Error('No puedes salir de tu única agencia. Debes tener al menos una agencia activa.');
    }

    // Validar que no se elimine al último admin (si es admin)
    // Esto se verifica en la página, pero también aquí por seguridad
    try {
      const { error } = await supabase
        .from('user_agencies')
        .delete()
        .eq('user_id', user.id)
        .eq('agency_id', agencyId);

      if (error) {
        console.error('[AgencyContext] Error saliendo de agencia:', error);
        throw new Error(`Error al salir de la agencia: ${error.message}`);
      }

      // Si era la agencia actual, cambiar a otra
      if (currentAgency?.id === agencyId) {
        const remaining = userAgencies.find(ua => ua.agency.id !== agencyId);
        if (remaining) {
          try {
            await switchAgency(remaining.agency.id);
          } catch (switchError) {
            console.error('[AgencyContext] Error cambiando a agencia restante:', switchError);
            // Continuar aunque falle el cambio, ya salimos de la agencia
          }
        }
      }

      await fetchAgenciesForUser();
    } catch (error: any) {
      console.error('[AgencyContext] Error en leaveAgency:', error);
      throw error;
    }
  }, [user?.id, userAgencies, currentAgency?.id, switchAgency, fetchAgenciesForUser]);

  // Memoizar userAgencies para evitar recálculos innecesarios
  const memoizedUserAgencies = useMemo(() => userAgencies, [userAgencies]);

  // Invalidar cache cuando sea necesario
  const invalidateCache = useCallback(() => {
    agenciesCacheRef.current = {
      userId: null,
      data: [],
      timestamp: 0
    };
  }, []);

  const value = useMemo(() => ({
    currentAgency,
    userAgencies: memoizedUserAgencies,
    isLoading,
    error,
    refreshAgency: async () => {
      invalidateCache();
      await fetchAgenciesForUser();
    },
    switchAgency,
    completeSetup,
    updateAgencyName,
    createAgency: async (name: string) => {
      invalidateCache();
      return await createAgency(name);
    },
    leaveAgency: async (agencyId: string) => {
      invalidateCache();
      await leaveAgency(agencyId);
    },
    updateSettings: async (settings: Partial<AgencySettings>) => {
      if (!currentAgency?.id) return;

      const newSettings = { ...currentAgency.settings, ...settings };
      const { error } = await supabase
        .from('agencies')
        .update({ settings: newSettings })
        .eq('id', currentAgency.id);

      if (error) {
        console.error('[AgencyContext] Error actualizando settings:', error);
        throw new Error(`Error al actualizar configuración: ${error.message}`);
      }

      // Actualizar estado local inmediatamente
      setCurrentAgency(prev => prev ? { ...prev, settings: newSettings } : null);
      setUserAgencies(prev => prev.map(ua => 
        ua.agency.id === currentAgency.id 
          ? { ...ua, agency: { ...ua.agency, settings: newSettings } }
          : ua
      ));

      // Actualizar cache
      if (agenciesCacheRef.current.userId === user?.id) {
        agenciesCacheRef.current.data = agenciesCacheRef.current.data.map(ua =>
          ua.agency.id === currentAgency.id
            ? { ...ua, agency: { ...ua.agency, settings: newSettings } }
            : ua
        );
      }

      // Refrescar en segundo plano sin invalidar cache completo
      fetchAgenciesForUser().catch(console.error);
    }
  }), [
    currentAgency,
    memoizedUserAgencies,
    isLoading,
    error,
    switchAgency,
    createAgency,
    leaveAgency,
    invalidateCache,
    fetchAgenciesForUser,
    user?.id
  ]);

  // Funciones de gestión administrativa
  const inviteUserToAgency = useCallback(async (
    email: string,
    role?: string,
    department?: string
  ) => {
    if (!currentAgency?.id || !user?.id) {
      throw new Error('Agencia o usuario no válido');
    }

    // Validaciones de entrada
    if (!email || typeof email !== 'string' || !email.trim()) {
      throw new Error('El email es obligatorio');
    }

    // Validar formato de email básico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const cleanEmail = email.trim().toLowerCase();
    if (!emailRegex.test(cleanEmail)) {
      throw new Error('El formato del email no es válido');
    }

    // Validar que el usuario que invita tiene acceso a la agencia
    const currentUserAgency = userAgencies.find(ua => ua.agency.id === currentAgency.id);
    if (!currentUserAgency) {
      throw new Error('No tienes acceso a esta agencia');
    }

    try {
      const { data, error } = await supabase.functions.invoke('invite-user-to-agency', {
        body: {
          email: cleanEmail,
          agencyId: currentAgency.id,
          role: role?.trim() || undefined,
          department: department?.trim() || undefined,
          inviterUserId: user.id
        }
      });

      if (error) {
        console.error('[AgencyContext] Error invitando usuario:', error);
        // Extraer mensaje de error más descriptivo
        let errorMessage = 'Error al invitar usuario';
        if (error.message) {
          errorMessage = error.message;
        } else if (typeof error === 'string') {
          errorMessage = error;
        }
        throw new Error(errorMessage);
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Error al invitar usuario');
      }

      // Invalidar cache para refrescar datos
      invalidateCache();
      await fetchAgenciesForUser();
    } catch (error: any) {
      console.error('[AgencyContext] Error en inviteUserToAgency:', error);
      // Re-lanzar con mensaje más claro si es un error conocido
      if (error.message) {
        throw error;
      }
      throw new Error(`Error al invitar usuario: ${error.message || 'Error desconocido'}`);
    }
  }, [currentAgency?.id, user?.id, userAgencies, invalidateCache, fetchAgenciesForUser]);

  const updateUserAgencyRole = useCallback(async (
    userId: string,
    agencyId: string,
    role: string,
    department?: string
  ) => {
    if (!user?.id) {
      throw new Error('Usuario no autenticado');
    }

    // Validaciones de entrada
    if (!userId || typeof userId !== 'string') {
      throw new Error('ID de usuario inválido');
    }

    if (!agencyId || typeof agencyId !== 'string') {
      throw new Error('ID de agencia inválido');
    }

    if (!role || typeof role !== 'string' || !role.trim()) {
      throw new Error('El rol es obligatorio');
    }

    // Verificar que el usuario que hace la actualización tiene permisos
    // (esto se valida en la UI, pero también aquí por seguridad)
    const currentUserAgency = userAgencies.find(ua => ua.agency.id === agencyId);
    if (!currentUserAgency) {
      throw new Error('No tienes acceso a esta agencia');
    }

    try {
      // Verificar que el usuario objetivo pertenece a la agencia
      const { data: targetUserAgency, error: checkError } = await supabase
        .from('user_agencies')
        .select('id')
        .eq('user_id', userId)
        .eq('agency_id', agencyId)
        .maybeSingle();

      if (checkError && checkError.code !== '42P01') {
        throw new Error(`Error verificando relación: ${checkError.message}`);
      }

      if (!targetUserAgency) {
        throw new Error('El usuario no pertenece a esta agencia');
      }

      // Actualizar en user_agencies
      const { error: userAgencyError } = await supabase
        .from('user_agencies')
        .update({
          role: role.trim(),
          department: department?.trim() || null
        })
        .eq('user_id', userId)
        .eq('agency_id', agencyId);

      if (userAgencyError) {
        if (userAgencyError.code !== '42P01') {
          throw new Error(`Error actualizando rol: ${userAgencyError.message}`);
        }
        // Si la tabla no existe, continuar
      }

      // También actualizar en employees para sincronización
      const { data: employeeData, error: employeeFetchError } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', userId)
        .eq('agency_id', agencyId)
        .maybeSingle();

      if (employeeFetchError) {
        console.warn('[AgencyContext] Error obteniendo empleado para sincronización:', employeeFetchError);
      } else if (employeeData) {
        const { error: employeeError } = await supabase
          .from('employees')
          .update({
            role: role.trim(),
            department: department?.trim() || null
          })
          .eq('id', employeeData.id);

        if (employeeError) {
          console.warn('[AgencyContext] Error sincronizando rol en employees:', employeeError);
          // No fallar si esto falla, es solo sincronización
        }
      }

      // Invalidar cache
      invalidateCache();
      await fetchAgenciesForUser();
    } catch (error: any) {
      console.error('[AgencyContext] Error en updateUserAgencyRole:', error);
      // Re-lanzar con mensaje más claro si es un error conocido
      if (error.message) {
        throw error;
      }
      throw new Error(`Error al actualizar el rol: ${error.message || 'Error desconocido'}`);
    }
  }, [user?.id, userAgencies, invalidateCache, fetchAgenciesForUser]);

  const removeUserFromAgency = useCallback(async (
    userId: string,
    agencyId: string
  ) => {
    if (!user?.id) {
      throw new Error('Usuario no autenticado');
    }

    // Validaciones de entrada
    if (!userId || typeof userId !== 'string') {
      throw new Error('ID de usuario inválido');
    }

    if (!agencyId || typeof agencyId !== 'string') {
      throw new Error('ID de agencia inválido');
    }

    // Verificar que el usuario que hace la eliminación tiene acceso a la agencia
    const currentUserAgency = userAgencies.find(ua => ua.agency.id === agencyId);
    if (!currentUserAgency) {
      throw new Error('No tienes acceso a esta agencia');
    }

    // No permitir auto-eliminación (el usuario no puede eliminarse a sí mismo)
    if (userId === user.id) {
      throw new Error('No puedes eliminarte a ti mismo de la agencia. Usa la opción "Salir" en su lugar.');
    }

    try {
      // Verificar que el usuario objetivo pertenece a la agencia
      const { data: targetUserAgency, error: checkError } = await supabase
        .from('user_agencies')
        .select('id')
        .eq('user_id', userId)
        .eq('agency_id', agencyId)
        .maybeSingle();

      if (checkError && checkError.code !== '42P01') {
        throw new Error(`Error verificando relación: ${checkError.message}`);
      }

      if (!targetUserAgency) {
        throw new Error('El usuario no pertenece a esta agencia');
      }

      // Verificar si el usuario está en otras agencias
      const { data: otherAgencies, error: otherAgenciesError } = await supabase
        .from('user_agencies')
        .select('agency_id')
        .eq('user_id', userId)
        .neq('agency_id', agencyId);

      if (otherAgenciesError && otherAgenciesError.code !== '42P01') {
        console.warn('[AgencyContext] Error verificando otras agencias:', otherAgenciesError);
      }

      const isInOtherAgencies = otherAgencies && otherAgencies.length > 0;

      // Eliminar de user_agencies (siempre, porque estamos desvinculando de esta agencia)
      const { error } = await supabase
        .from('user_agencies')
        .delete()
        .eq('user_id', userId)
        .eq('agency_id', agencyId);

      if (error) {
        if (error.code !== '42P01') {
          throw new Error(`Error eliminando usuario: ${error.message}`);
        }
      }

      // Si el usuario NO está en otras agencias, eliminar también de employees
      // Si está en otras agencias, solo desvincular (no eliminar de employees)
      if (!isInOtherAgencies) {
        // Buscar empleado en esta agencia
        const { data: employeeData } = await supabase
          .from('employees')
          .select('id')
          .eq('user_id', userId)
          .eq('agency_id', agencyId)
          .maybeSingle();

        if (employeeData) {
          // Eliminar empleado solo de esta agencia (si tiene agency_id específico)
          // O desactivar si el empleado puede estar en múltiples agencias
          const { error: deleteEmployeeError } = await supabase
            .from('employees')
            .delete()
            .eq('id', employeeData.id);

          if (deleteEmployeeError) {
            console.warn('[AgencyContext] Error eliminando empleado:', deleteEmployeeError);
            // No fallar si esto falla, ya desvinculamos de user_agencies
          }
        }
      }
      // Si está en otras agencias, no hacemos nada con employees (se mantiene para otras agencias)
      
      // Retornar información sobre si se eliminó completamente o solo se desvinculó
      return { completelyRemoved: !isInOtherAgencies };

      // Invalidar cache
      invalidateCache();
      await fetchAgenciesForUser();
    } catch (error: any) {
      console.error('[AgencyContext] Error en removeUserFromAgency:', error);
      // Re-lanzar con mensaje más claro si es un error conocido
      if (error.message) {
        throw error;
      }
      throw new Error(`Error al eliminar usuario: ${error.message || 'Error desconocido'}`);
    }
  }, [user?.id, userAgencies, invalidateCache, fetchAgenciesForUser]);

  const getAgencyMembers = useCallback(async (agencyId: string): Promise<AgencyMember[]> => {
    if (!user?.id) {
      throw new Error('Usuario no autenticado');
    }

    // Validaciones de entrada
    if (!agencyId || typeof agencyId !== 'string') {
      throw new Error('ID de agencia inválido');
    }

    // Verificar que el usuario tiene acceso a esta agencia
    const currentUserAgency = userAgencies.find(ua => ua.agency.id === agencyId);
    if (!currentUserAgency && currentAgency?.id !== agencyId) {
      throw new Error('No tienes acceso a esta agencia');
    }

    try {
      // Obtener miembros desde user_agencies
      // Primero obtener user_agencies y luego los employees correspondientes
      const { data: userAgenciesData, error: userAgenciesError } = await supabase
        .from('user_agencies')
        .select('id, user_id, role, department, joined_at')
        .eq('agency_id', agencyId);

      if (userAgenciesError) {
        if (userAgenciesError.code === '42P01') {
          // Tabla no existe, usar fallback desde employees
          const { data: employeesData, error: employeesError } = await supabase
            .from('employees')
            .select('id, name, email, role, department, user_id, is_active')
            .eq('agency_id', agencyId);

          if (employeesError) {
            throw new Error(`Error obteniendo miembros: ${employeesError.message}`);
          }

          return (employeesData || []).map((emp: any) => ({
            id: emp.id,
            employeeId: emp.id,
            userId: emp.user_id,
            name: emp.name,
            email: emp.email,
            role: emp.role,
            department: emp.department,
            isActive: emp.is_active,
            joinedAt: new Date().toISOString(),
            isAdmin: false // No podemos determinar esto sin user_agencies
          }));
        }
        throw new Error(`Error obteniendo miembros: ${userAgenciesError.message}`);
      }

      if (!userAgenciesData || userAgenciesData.length === 0) {
        return [];
      }

      // Obtener employees para cada user_id
      const userIds = userAgenciesData.map(ua => ua.user_id).filter(Boolean) as string[];
      
      if (userIds.length === 0) {
        return [];
      }
      
      const { data: employeesData, error: employeesError } = await supabase
        .from('employees')
        .select('id, name, email, role, department, user_id, is_active, agency_id')
        .in('user_id', userIds)
        .eq('agency_id', agencyId);

      if (employeesError) {
        throw new Error(`Error obteniendo empleados: ${employeesError.message}`);
      }

      // Mapear datos combinando user_agencies con employees
      const employeesMap = new Map((employeesData || []).map((emp: any) => [emp.user_id, emp]));
      
      // Obtener configuración de roles de la agencia específica (no currentAgency, sino la agencia que se está consultando)
      // SIEMPRE obtener desde la BD para asegurar que tenemos los datos correctos de la agencia consultada
      let agencyRoles: any[] = [];
      const { data: agencyData, error: agencyDataError } = await supabase
        .from('agencies')
        .select('settings')
        .eq('id', agencyId)
        .maybeSingle();
      
      if (agencyDataError) {
        console.warn('[getAgencyMembers] Error obteniendo configuración de agencia:', agencyDataError);
      }
      
      if (agencyData?.settings?.roles) {
        agencyRoles = agencyData.settings.roles;
      }
      
      console.log(`[getAgencyMembers] Agencia ${agencyId}: ${agencyRoles.length} roles configurados:`, 
        agencyRoles.map((r: any) => typeof r === 'string' ? r : r.name));
      
      const members: AgencyMember[] = userAgenciesData
        .map((ua: any) => {
          const emp = employeesMap.get(ua.user_id);
          if (!emp) {
            // Si no hay employee, crear uno básico
            return null;
          }

          const roleName = ua.role || emp.role || '';
          
          // Determinar si es admin usando la MISMA lógica que usePermissions
          // Esto asegura que el badge "Admin" coincida exactamente con los permisos reales
          let isAdmin = false;
          
          if (!roleName) {
            // Si no hay nombre de rol, NO es admin (igual que usePermissions devuelve RESTRICTED_PERMISSIONS)
            isAdmin = false;
          } else {
            // Buscar el rol en la configuración de la agencia (misma búsqueda que usePermissions)
            const roleConfig = agencyRoles.find((r: any) => {
              if (!r) return false;
              if (typeof r === 'string') return r.toLowerCase() === roleName.toLowerCase();
              return r.name && r.name.toLowerCase() === roleName.toLowerCase();
            });
            
            // Si encontramos configuración de rol con permisos, verificar can_access_agency_settings
            if (roleConfig && typeof roleConfig !== 'string' && roleConfig.permissions) {
              // Usar los permisos del rol configurado (igual que usePermissions línea 54-55)
              isAdmin = roleConfig.permissions.can_access_agency_settings === true;
              console.log(`[getAgencyMembers] Rol "${roleName}" encontrado en configuración de agencia ${agencyId}. isAdmin: ${isAdmin}, can_access_agency_settings: ${roleConfig.permissions.can_access_agency_settings}`);
            } else {
              // El rol NO está configurado o es string (formato antiguo)
              // Si hay roles configurados pero el rol del usuario no está, usePermissions devuelve RESTRICTED_PERMISSIONS
              // que tiene can_access_agency_settings: false, así que NO es admin
              if (agencyRoles.length > 0) {
                isAdmin = false;
                console.log(`[getAgencyMembers] Rol "${roleName}" NO encontrado en configuración (hay ${agencyRoles.length} roles configurados). isAdmin: false`);
              } else {
                // Fallback: Solo si NO hay roles configurados en la agencia, usar palabras clave
                // (igual que usePermissions líneas 61-64)
                const MANAGER_KEYWORDS = ['manager', 'admin', 'director', 'ceo', 'founder', 'head', 'lead', 'responsable'];
                const roleLower = roleName.toLowerCase();
                if (MANAGER_KEYWORDS.some(k => roleLower.includes(k))) {
                  // Si coincide con keywords, usePermissions devuelve DEFAULT_PERMISSIONS
                  // que tiene can_access_agency_settings: true, así que SÍ es admin
                  isAdmin = true;
                  console.log(`[getAgencyMembers] Rol "${roleName}" coincide con keywords (sin roles configurados). isAdmin: true`);
                } else {
                  // No coincide con keywords, usePermissions devuelve RESTRICTED_PERMISSIONS
                  // que tiene can_access_agency_settings: false, así que NO es admin
                  isAdmin = false;
                  console.log(`[getAgencyMembers] Rol "${roleName}" NO coincide con keywords (sin roles configurados). isAdmin: false`);
                }
              }
            }
          }

          return {
            id: ua.id,
            employeeId: emp.id,
            userId: ua.user_id,
            name: emp.name,
            email: emp.email,
            role: ua.role || emp.role,
            department: ua.department || emp.department,
            isActive: emp.is_active,
            joinedAt: ua.joined_at,
            isAdmin
          };
        })
        .filter((m): m is AgencyMember => m !== null);

      return members;
    } catch (error: any) {
      console.error('[AgencyContext] Error en getAgencyMembers:', error);
      throw error;
    }
  }, [user?.id, userAgencies, currentAgency?.id, currentAgency?.settings?.roles]); // Incluir dependencias necesarias para validación de acceso y permisos

  const transferAgencyOwnership = useCallback(async (
    newOwnerId: string,
    agencyId: string
  ) => {
    if (!user?.id) {
      throw new Error('Usuario no autenticado');
    }

    // Validaciones de entrada
    if (!newOwnerId || typeof newOwnerId !== 'string') {
      throw new Error('ID del nuevo propietario inválido');
    }

    if (!agencyId || typeof agencyId !== 'string') {
      throw new Error('ID de agencia inválido');
    }

    // No permitir transferir a uno mismo
    if (newOwnerId === user.id) {
      throw new Error('Ya eres el propietario de esta agencia');
    }

    // Verificar que el usuario actual tiene acceso a la agencia
    const currentUserAgency = userAgencies.find(ua => ua.agency.id === agencyId);
    if (!currentUserAgency) {
      throw new Error('No tienes acceso a esta agencia');
    }

    try {
      // Verificar que el nuevo propietario pertenece a la agencia
      const { data: newOwnerRelation, error: checkError } = await supabase
        .from('user_agencies')
        .select('id, user_id')
        .eq('user_id', newOwnerId)
        .eq('agency_id', agencyId)
        .maybeSingle();

      if (checkError && checkError.code !== '42P01') {
        throw new Error(`Error verificando nuevo propietario: ${checkError.message}`);
      }

      if (!newOwnerRelation) {
        throw new Error('El nuevo propietario no pertenece a esta agencia');
      }

      // Quitar is_primary de todos los usuarios de esta agencia
      const { error: unsetError } = await supabase
        .from('user_agencies')
        .update({ is_primary: false })
        .eq('agency_id', agencyId);

      if (unsetError && unsetError.code !== '42P01') {
        throw new Error(`Error actualizando agencias: ${unsetError.message}`);
      }

      // Marcar nuevo propietario como primario
      const { error } = await supabase
        .from('user_agencies')
        .update({ is_primary: true })
        .eq('id', newOwnerRelation.id);

      if (error) {
        throw new Error(`Error transfiriendo propiedad: ${error.message}`);
      }

      // Invalidar cache
      invalidateCache();
      await fetchAgenciesForUser();
    } catch (error: any) {
      console.error('[AgencyContext] Error en transferAgencyOwnership:', error);
      // Re-lanzar con mensaje más claro si es un error conocido
      if (error.message) {
        throw error;
      }
      throw new Error(`Error al transferir propiedad: ${error.message || 'Error desconocido'}`);
    }
  }, [user?.id, userAgencies, invalidateCache, fetchAgenciesForUser]);

  const deleteAgency = useCallback(async (agencyId: string) => {
    if (!user?.id) {
      throw new Error('Usuario no autenticado');
    }

    // Validaciones de entrada
    if (!agencyId || typeof agencyId !== 'string') {
      throw new Error('ID de agencia inválido');
    }

    try {
      // Verificar que el usuario pertenece a esta agencia
      const userAgency = userAgencies.find(ua => ua.agency.id === agencyId);
      if (!userAgency) {
        throw new Error('No perteneces a esta agencia');
      }

      // Verificar que es admin basándose en los permisos del rol configurado
      let isAdmin = false;
      const roleName = userAgency.role || '';
      const agencyRoles = currentAgency?.settings?.roles || [];
      
      // 1. Primero verificar si el rol tiene configuración con permisos
      if (agencyRoles.length > 0 && roleName) {
        const roleConfig = agencyRoles.find((r: any) => {
          if (!r) return false;
          if (typeof r === 'string') return r.toLowerCase() === roleName.toLowerCase();
          return r.name && r.name.toLowerCase() === roleName.toLowerCase();
        });
        
        // Si encontramos configuración de rol, verificar el permiso específico
        if (roleConfig && typeof roleConfig !== 'string' && roleConfig.permissions) {
          isAdmin = roleConfig.permissions.can_access_agency_settings === true;
        }
      }
      
      // 2. Fallback: Solo si no hay configuración de rol, usar palabras clave
      // (sin incluir 'coordinador' ya que no debería ser admin por defecto)
      if (!isAdmin && agencyRoles.length === 0) {
        const MANAGER_KEYWORDS = ['manager', 'admin', 'director', 'ceo', 'founder', 'head', 'lead', 'responsable'];
        const roleLower = roleName.toLowerCase();
        isAdmin = MANAGER_KEYWORDS.some(k => roleLower.includes(k));
      }

      if (!isAdmin) {
        throw new Error('Solo los administradores pueden eliminar agencias');
      }

      // Validar que es la última agencia
      if (userAgencies.length > 1) {
        throw new Error('No puedes eliminar una agencia si tienes otras agencias activas. Primero sal de las otras agencias.');
      }

      // Verificar que la agencia existe
      const { data: agencyData, error: agencyCheckError } = await supabase
        .from('agencies')
        .select('id, name')
        .eq('id', agencyId)
        .maybeSingle();

      if (agencyCheckError) {
        throw new Error(`Error verificando agencia: ${agencyCheckError.message}`);
      }

      if (!agencyData) {
        throw new Error('La agencia no existe o ya fue eliminada');
      }

      // Eliminar agencia (esto debería tener CASCADE DELETE configurado)
      // CASCADE DELETE eliminará automáticamente:
      // - Registros en user_agencies
      // - Empleados asociados (si tienen CASCADE)
      // - Proyectos, clientes, etc. (si tienen CASCADE)
      const { error } = await supabase
        .from('agencies')
        .delete()
        .eq('id', agencyId);

      if (error) {
        // Manejar errores específicos
        if (error.code === '23503') {
          throw new Error('No se puede eliminar la agencia porque tiene datos asociados. Contacta al administrador.');
        }
        throw new Error(`Error eliminando agencia: ${error.message}`);
      }

      // Invalidar cache
      invalidateCache();
      await fetchAgenciesForUser();
    } catch (error: any) {
      console.error('[AgencyContext] Error en deleteAgency:', error);
      // Re-lanzar con mensaje más claro si es un error conocido
      if (error.message) {
        throw error;
      }
      throw new Error(`Error al eliminar agencia: ${error.message || 'Error desconocido'}`);
    }
  }, [user?.id, userAgencies, currentAgency?.settings?.roles, invalidateCache, fetchAgenciesForUser]);

  const finalValue = useMemo(() => ({
    ...value,
    inviteUserToAgency,
    updateUserAgencyRole,
    removeUserFromAgency,
    getAgencyMembers,
    transferAgencyOwnership,
    deleteAgency
  }), [
    value,
    inviteUserToAgency,
    updateUserAgencyRole,
    removeUserFromAgency,
    getAgencyMembers,
    transferAgencyOwnership,
    deleteAgency
  ]);

  return <AgencyContext.Provider value={finalValue}>{children}</AgencyContext.Provider>;
}

export function useAgency() {
  const context = useContext(AgencyContext);
  if (context === undefined) {
    throw new Error('useAgency must be used within an AgencyProvider');
  }
  return context;
}

