import { usePrivacyDemo } from '@/contexts/PrivacyDemoContext';
import type { PrivacyAnonymizer } from '@/lib/privacyDemoAnonymizer';

/** Subconjunto usado en vistas Google/Meta Ads (misma fuente que el modo demostración global). */
export type Anonymizer = Pick<PrivacyAnonymizer, 'account' | 'campaign'>;

/**
 * Hook para anonimizar nombres cuando la integración "Modo demostración" está activa.
 * Comparte estado y mapas con `usePrivacyDemo` / `SensitiveText` en el resto de la app.
 */
export function useAnonymizeAds(): { isActive: boolean; anonymizer: Anonymizer } {
  const { isActive, anonymizer } = usePrivacyDemo();
  return {
    isActive,
    anonymizer: {
      account: anonymizer.account.bind(anonymizer),
      campaign: anonymizer.campaign.bind(anonymizer),
    },
  };
}
