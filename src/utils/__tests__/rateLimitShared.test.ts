import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  RateLimitError,
  getClientIp,
  assertRateLimit,
} from '../../../supabase/functions/_shared/rate-limit';

describe('getClientIp', () => {
  it('prioriza el primer valor de x-forwarded-for', () => {
    const req = new Request('https://example.com', {
      headers: { 'x-forwarded-for': ' 203.0.113.1 , 198.51.100.2 ' },
    });
    expect(getClientIp(req)).toBe('203.0.113.1');
  });

  it('usa x-real-ip o cf-connecting-ip si no hay forwarded', () => {
    const reqReal = new Request('https://example.com', {
      headers: { 'x-real-ip': '198.51.100.3' },
    });
    expect(getClientIp(reqReal)).toBe('198.51.100.3');

    const reqCf = new Request('https://example.com', {
      headers: { 'cf-connecting-ip': '198.51.100.4' },
    });
    expect(getClientIp(reqCf)).toBe('198.51.100.4');
  });

  it('devuelve unknown sin cabeceras reconocibles', () => {
    const req = new Request('https://example.com');
    expect(getClientIp(req)).toBe('unknown');
  });
});

describe('assertRateLimit', () => {
  const bucket = 'test-bucket';

  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function makeSupabaseMock(result: { count: number | null; countError: Error | null; insertError: Error | null }) {
    const gte = vi.fn().mockResolvedValue({
      count: result.count,
      error: result.countError,
    });
    const eq = vi.fn().mockReturnValue({ gte });
    const select = vi.fn().mockReturnValue({ eq });
    const insert = vi.fn().mockResolvedValue({ error: result.insertError });
    const from = vi.fn().mockReturnValue({ select, insert });
    return { from, select, eq, gte, insert };
  }

  it('lanza RateLimitError cuando el conteo alcanza maxAttempts', async () => {
    const { from } = makeSupabaseMock({ count: 5, countError: null, insertError: null });
    await expect(
      assertRateLimit({ from } as never, bucket, { maxAttempts: 5, windowMs: 60_000 }),
    ).rejects.toBeInstanceOf(RateLimitError);
    expect(from).toHaveBeenCalledWith('form_rate_limit_events');
  });

  it('inserta evento y no lanza cuando está por debajo del límite', async () => {
    const { from, insert } = makeSupabaseMock({ count: 2, countError: null, insertError: null });
    await expect(
      assertRateLimit({ from } as never, bucket, { maxAttempts: 5, windowMs: 60_000 }),
    ).resolves.toBeUndefined();
    expect(insert).toHaveBeenCalledWith({ bucket });
  });

  it('permite la petición si falla el conteo (fail-open)', async () => {
    const { from, insert } = makeSupabaseMock({
      count: null,
      countError: new Error('db down'),
      insertError: null,
    });
    await expect(
      assertRateLimit({ from } as never, bucket, { maxAttempts: 1, windowMs: 60_000 }),
    ).resolves.toBeUndefined();
    expect(insert).not.toHaveBeenCalled();
  });

  it('no lanza si insert falla tras conteo OK (solo registra aviso)', async () => {
    const { from, insert } = makeSupabaseMock({ count: 0, countError: null, insertError: new Error('rls') });
    await expect(
      assertRateLimit({ from } as never, bucket, { maxAttempts: 5, windowMs: 60_000 }),
    ).resolves.toBeUndefined();
    expect(insert).toHaveBeenCalledWith({ bucket });
  });
});
