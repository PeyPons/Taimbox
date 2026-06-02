import { useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import { useApp } from '@/contexts/AppContext';

export interface UseEnsureMonthWithLoadingOptions {
  /** Si false, no dispara carga (p. ej. perfil de empleado aún cargando). */
  enabled?: boolean;
}

/**
 * Espera a `ensureMonthLoaded` al cambiar de mes. Devuelve spinner mientras la carga está en curso.
 */
export function useEnsureMonthWithLoading(
  currentMonth: Date,
  options: UseEnsureMonthWithLoadingOptions = {}
): boolean {
  const { enabled = true } = options;
  const { ensureMonthLoaded, isLoading: isGlobalLoading } = useApp();
  const [isLoadingMonth, setIsLoadingMonth] = useState(false);
  const inFlightRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || isGlobalLoading) {
      setIsLoadingMonth(false);
      return;
    }

    const monthKey = format(currentMonth, 'yyyy-MM');
    if (inFlightRef.current === monthKey) {
      return;
    }

    inFlightRef.current = monthKey;
    setIsLoadingMonth(true);
    void ensureMonthLoaded(currentMonth).finally(() => {
      if (inFlightRef.current === monthKey) {
        inFlightRef.current = null;
      }
      setIsLoadingMonth(false);
    });
  }, [currentMonth, isGlobalLoading, ensureMonthLoaded, enabled]);

  return isLoadingMonth;
}
