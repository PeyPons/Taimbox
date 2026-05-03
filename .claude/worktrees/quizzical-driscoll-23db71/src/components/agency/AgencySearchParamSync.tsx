import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAgency } from '@/contexts/AgencyContext';

/**
 * `AgencyProvider` está por encima de `BrowserRouter`; al navegar en cliente
 * (p. ej. /admin → /dashboard?agency=...) el efecto del contexto no se vuelve a
 * ejecutar si el usuario no cambia. Este componente vive dentro del router y fuerza
 * una re-resolución de agencia cuando cambia el query `agency`.
 */
export function AgencySearchParamSync() {
  const [searchParams] = useSearchParams();
  const agencyParam = searchParams.get('agency');
  const { refreshAgency } = useAgency();
  const lastHandledParamRef = useRef<string | null>(null);

  useEffect(() => {
    if (!agencyParam) {
      lastHandledParamRef.current = null;
      return;
    }
    if (lastHandledParamRef.current === agencyParam) {
      return;
    }
    lastHandledParamRef.current = agencyParam;
    void refreshAgency();
  }, [agencyParam, refreshAgency]);

  return null;
}
