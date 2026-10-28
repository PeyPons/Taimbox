import { describe, expect, it } from 'vitest';
import { readFunctionsErrorMessage } from '@/lib/invokeEdgeFunction';

describe('readFunctionsErrorMessage', () => {
  it('lee error del body JSON de la Edge Function', async () => {
    const error = {
      message: 'Edge Function returned a non-2xx status code',
      context: { body: JSON.stringify({ error: 'Error de Google Ads API: version sunset' }) },
    };
    await expect(readFunctionsErrorMessage(error, 'fallback')).resolves.toBe(
      'Error de Google Ads API: version sunset',
    );
  });

  it('usa el fallback cuando el cliente solo informa non-2xx', async () => {
    await expect(
      readFunctionsErrorMessage(new Error('Edge Function returned a non-2xx status code'), 'fallback'),
    ).resolves.toBe('fallback');
  });
});
