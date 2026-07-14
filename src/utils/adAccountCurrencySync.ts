import { invokeEdgeFunctionWithRetry } from '@/lib/invokeEdgeFunction';

export { normalizeMetaAccountId } from '@/utils/metaAccountId';

/**
 * Pide a Meta/Google el código ISO de cada cuenta y persiste en ad_accounts_config.
 * Usado al abrir Monitor PPC, tras OAuth o al registrar cuentas.
 */
export async function syncAdAccountCurrenciesFromPlatform(
  agencyId: string,
  platform: 'google' | 'meta',
): Promise<void> {
  const fn = platform === 'google' ? 'list-google-accounts' : 'list-meta-accounts';
  await invokeEdgeFunctionWithRetry(
    fn,
    { agency_id: agencyId, sync_config: true },
    { retries: 1, baseDelayMs: 800 },
  );
}
