import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook para comprobar si el usuario actual es administrador de plataforma.
 * Usa la RPC is_platform_admin (SECURITY DEFINER).
 * No depende de AgencyContext; válido para el área admin.
 */
export function usePlatformAdmin() {
  const { user, isInitialized } = useAuth();
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const check = useCallback(async () => {
    if (!user?.id) {
      setIsPlatformAdmin(false);
      setIsLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase.rpc('is_platform_admin');
      if (error) {
        console.warn('[usePlatformAdmin] RPC error:', error.message);
        setIsPlatformAdmin(false);
      } else {
        setIsPlatformAdmin(data === true);
      }
    } catch (e) {
      console.warn('[usePlatformAdmin] Error:', e);
      setIsPlatformAdmin(false);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!isInitialized) {
      setIsLoading(true);
      return;
    }
    check();
  }, [isInitialized, check]);

  return { isPlatformAdmin, isLoading, refetch: check };
}
