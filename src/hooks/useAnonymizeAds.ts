import { useMemo } from 'react';
import { useAgency } from '@/contexts/AgencyContext';

export interface Anonymizer {
  /** Nombre semántico para cuenta/cliente (ej: "Cliente A - Retail") */
  account: (id: string) => string;
  /** Nombre semántico para campaña (ej: "Campaña Retail 01") */
  campaign: (id: string) => string;
}

const SECTORS = ['Retail', 'Tecnología', 'Ecommerce', 'Servicios', 'Automoción', 'Salud', 'Inmobiliaria', 'Educación', 'Hostelería', 'Moda'];
const PREFIXES = ['Cliente', 'Cuenta', 'Proyecto', 'Ecommerce Internacional'];

/**
 * Hook para anonimizar nombres en Ads cuando la integración "Modo demostración" está activa.
 * Usa nombres semánticos genéricos (Cliente A - Retail, Campaña Ecommerce 01) en lugar de
 * "Datos protegidos" para demostrar que el software segmenta y organiza datos correctamente.
 * Recomendado para vídeos de verificación ante Google Trust & Safety.
 */
export function useAnonymizeAds(): { isActive: boolean; anonymizer: Anonymizer } {
  const { currentAgency } = useAgency();
  const isActive = Boolean(currentAgency?.settings?.enabledIntegrations?.anonymize_ads_for_video);

  const anonymizer = useMemo((): Anonymizer => {
    const accountMap = new Map<string, string>();
    const campaignMap = new Map<string, string>();
    let accountIdx = 0;
    let campaignIdx = 0;
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    return {
      account: (id: string) => {
        if (!accountMap.has(id)) {
          accountIdx++;
          const sector = SECTORS[(accountIdx - 1) % SECTORS.length];
          const letter = letters[(accountIdx - 1) % 26];
          if (accountIdx <= 10) {
            accountMap.set(id, `Cliente ${letter} - ${sector}`);
          } else {
            const prefix = PREFIXES[(accountIdx - 1) % PREFIXES.length];
            accountMap.set(id, `${prefix} ${String(accountIdx).padStart(2, '0')}`);
          }
        }
        return accountMap.get(id)!;
      },
      campaign: (id: string) => {
        if (!campaignMap.has(id)) {
          campaignIdx++;
          const sector = SECTORS[(campaignIdx - 1) % SECTORS.length];
          campaignMap.set(id, `Campaña ${sector} ${String(campaignIdx).padStart(2, '0')}`);
        }
        return campaignMap.get(id)!;
      },
    };
  }, []);

  return { isActive, anonymizer };
}
