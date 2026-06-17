import { useEffect, useRef } from 'react';
import { invokeEdgeFunctionWithRetry } from '@/lib/invokeEdgeFunction';

type AdAccountRow = { currency?: string | null };

/**
 * Si hay cuentas sin moneda en ad_accounts_config, pide a Meta/Google el código ISO
 * y vuelve a cargar datos (una vez por montaje).
 */
export function useRefreshMissingAdCurrencies(
  agencyId: string | undefined,
  platform: 'google' | 'meta',
  accounts: AdAccountRow[],
  onRefreshed: () => void,
  enabled = true,
) {
  const attempted = useRef(false);

  useEffect(() => {
    if (!enabled || !agencyId || attempted.current || accounts.length === 0) return;
    const missing = accounts.some((a) => !a.currency?.trim());
    if (!missing) return;

    attempted.current = true;
    const fn = platform === 'google' ? 'list-google-accounts' : 'list-meta-accounts';
    void invokeEdgeFunctionWithRetry(
      fn,
      { agency_id: agencyId, sync_config: true },
      { retries: 1, baseDelayMs: 800 },
    )
      .then(() => onRefreshed())
      .catch((e) => console.warn(`[${fn}] refresh currencies:`, e));
  }, [agencyId, platform, accounts, onRefreshed, enabled]);
}
