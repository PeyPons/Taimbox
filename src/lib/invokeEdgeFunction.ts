import { supabase } from '@/lib/supabase';

type FunctionsInvokeError = NonNullable<
    Awaited<ReturnType<typeof supabase.functions.invoke<unknown>>>['error']
>;

const RETRYABLE_STATUS = new Set([502, 503, 504]);

function sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
}

function getHttpStatus(error: unknown): number | undefined {
    if (!error || typeof error !== 'object') return undefined;
    const ctx = (error as { context?: { status?: number } }).context;
    if (typeof ctx?.status === 'number') return ctx.status;
    return undefined;
}

/**
 * El cliente de Supabase solo dice "non-2xx". El mensaje real va en el body
 * (`error.context` como Response o como `{ body }`).
 */
export async function readFunctionsErrorMessage(error: unknown, fallback: string): Promise<string> {
    if (error && typeof error === 'object') {
        const ctx = (error as {
            context?: { body?: unknown; json?: () => Promise<unknown> };
        }).context;
        const fromPayload = (payload: unknown): string | null => {
            if (!payload || typeof payload !== 'object') return null;
            const message = (payload as { error?: unknown }).error;
            return typeof message === 'string' && message.trim() ? message : null;
        };
        if (ctx?.body != null) {
            try {
                const body = typeof ctx.body === 'string' ? JSON.parse(ctx.body) : ctx.body;
                const message = fromPayload(body);
                if (message) return message;
            } catch {
                /* body no JSON */
            }
        }
        if (ctx && typeof ctx.json === 'function') {
            try {
                const message = fromPayload(await ctx.json());
                if (message) return message;
            } catch {
                /* body ya consumido */
            }
        }
    }
    if (error instanceof Error && error.message && !/non-2xx/i.test(error.message)) {
        return error.message;
    }
    return fallback;
}

function isLikelyTransient(error: unknown): boolean {
    const status = getHttpStatus(error);
    if (status != null && RETRYABLE_STATUS.has(status)) return true;
    const msg = error instanceof Error ? error.message : String(error);
    if (/name resolution|getaddrinfo|ECONNRESET|ETIMEDOUT|503|502|504/i.test(msg)) return true;
    return false;
}

/**
 * Invoca una Edge Function con reintentos ante fallos transitorios (503 por DNS/red en Docker, etc.).
 */
export async function invokeEdgeFunctionWithRetry<T>(
    name: string,
    body?: Record<string, unknown>,
    options?: { retries?: number; baseDelayMs?: number }
): Promise<{ data: T | null; error: FunctionsInvokeError | null }> {
    const maxAttempts = options?.retries ?? 3;
    const baseDelayMs = options?.baseDelayMs ?? 700;
    let lastError: FunctionsInvokeError | null = null;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const { data, error } = await supabase.functions.invoke<T>(name, { body });
        if (!error) {
            return { data, error: null };
        }
        lastError = error;
        if (!isLikelyTransient(error) || attempt === maxAttempts - 1) {
            break;
        }
        await sleep(baseDelayMs * (attempt + 1));
    }
    return { data: null, error: lastError };
}
