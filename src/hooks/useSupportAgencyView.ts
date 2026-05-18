import { useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useAgency } from '@/contexts/AgencyContext';
import { usePlatformAdmin } from '@/hooks/usePlatformAdmin';

/** Platform admin viendo una agencia sin perfil de empleado (impersonación / soporte). */
export function useSupportAgencyView() {
  const { currentUser } = useApp();
  const { currentAgency } = useAgency();
  const { isPlatformAdmin } = usePlatformAdmin();

  return useMemo(() => {
    const isSupportView = Boolean(isPlatformAdmin && currentAgency && !currentUser);
    return {
      isSupportView,
      agencyId: isSupportView ? currentAgency!.id : null,
    };
  }, [isPlatformAdmin, currentAgency, currentUser]);
}

/** Añade ?agency= a rutas internas en vista de soporte (recargas y navegación). */
export function buildAgencyAwarePath(path: string, agencyId: string | null | undefined): string {
  if (!agencyId) return path;
  const qIndex = path.indexOf('?');
  const pathname = qIndex >= 0 ? path.slice(0, qIndex) : path;
  const params = new URLSearchParams(qIndex >= 0 ? path.slice(qIndex + 1) : '');
  params.set('agency', agencyId);
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}
