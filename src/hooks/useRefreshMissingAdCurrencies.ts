import { useEffect, useRef } from 'react';
import { syncAdAccountCurrenciesFromPlatform } from '@/utils/adAccountCurrencySync';

type AdAccountRow = { currency?: string | null };

/**
 * Importa moneda ISO desde Meta/Google cuando falta en ad_accounts_config
 * (p. ej. cuentas antiguas o registro manual sin sync). Reintenta si cambia el listado.
 */
export function useRefreshMissingAdCurrencies(
  agencyId: string | undefined,
  platform: 'google' | 'meta',
  accounts: AdAccountRow[],
  onRefreshed: () => void,
  enabled = true,
) {
  const lastAttemptKey = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !agencyId) return;

    const missingCount = accounts.filter((a) => !a.currency?.trim()).length;
    const needsSync = accounts.length === 0 || missingCount > 0;
    if (!needsSync) return;

    const attemptKey = `${agencyId}:${platform}:${accounts.length}:${missingCount}`;
    if (lastAttemptKey.current === attemptKey) return;
    lastAttemptKey.current = attemptKey;

    void syncAdAccountCurrenciesFromPlatform(agencyId, platform)
      .then(() => onRefreshed())
      .catch((e) => console.warn(`[${platform}] refresh currencies:`, e));
  }, [agencyId, platform, accounts, onRefreshed, enabled]);
}
