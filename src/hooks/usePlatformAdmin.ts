import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Caché por usuario + deduplicación: muchos componentes usan este hook a la vez
 * (Sidebar, ProtectedRoute, etc.); sin esto se repetía la RPC `is_platform_admin`
 * en cada montaje con el mismo resultado.
 */
const platformAdminCache = new Map<string, boolean>();
const inflightRpc = new Map<string, Promise<boolean>>();

async function resolvePlatformAdmin(userId: string): Promise<boolean> {
  const cached = platformAdminCache.get(userId);
  if (cached !== undefined) {
    return cached;
  }

  let pending = inflightRpc.get(userId);
  if (!pending) {
    pending = (async () => {
      const { data, error } = await supabase.rpc('is_platform_admin');
      const value = error ? false : data === true;
      platformAdminCache.set(userId, value);
      inflightRpc.delete(userId);
      return value;
    })();
    inflightRpc.set(userId, pending);
  }

  return pending;
}

function clearPlatformAdminCache(userId?: string) {
  if (userId) {
    platformAdminCache.delete(userId);
    inflightRpc.delete(userId);
  } else {
    platformAdminCache.clear();
    inflightRpc.clear();
  }
}

/**
 * Hook para comprobar si el usuario actual es administrador de plataforma.
 * Usa la RPC is_platform_admin (SECURITY DEFINER).
 * No depende de AgencyContext; válido para el área admin.
 */
export function usePlatformAdmin() {
  const { user, isInitialized } = useAuth();
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isInitialized) {
      setIsLoading(true);
      return;
    }
    if (!user?.id) {
      setIsPlatformAdmin(false);
      setIsLoading(false);
      return;
    }

    const uid = user.id;
    if (platformAdminCache.has(uid)) {
      setIsPlatformAdmin(platformAdminCache.get(uid)!);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    let cancelled = false;
    resolvePlatformAdmin(uid).then((value) => {
      if (!cancelled) {
        setIsPlatformAdmin(value);
        setIsLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [isInitialized, user?.id]);

  const refetch = useCallback(async () => {
    if (!user?.id) {
      setIsPlatformAdmin(false);
      setIsLoading(false);
      return;
    }
    clearPlatformAdminCache(user.id);
    setIsLoading(true);
    try {
      const value = await resolvePlatformAdmin(user.id);
      setIsPlatformAdmin(value);
    } catch (e) {
      console.warn('[usePlatformAdmin] refetch error:', e);
      setIsPlatformAdmin(false);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  return { isPlatformAdmin, isLoading, refetch };
}
