import { env } from './env.js';
import { LIMITS } from '@taimbox/review-shared';

export async function ollamaChat(
  system: string,
  user: string,
  retries = LIMITS.chunkRetries,
): Promise<string> {
  let lastErr: Error | null = null;
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), LIMITS.chunkTimeoutMs);
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (env.ollamaApiToken) {
        headers.Authorization = `Bearer ${env.ollamaApiToken}`;
      }
      const res = await fetch(`${env.ollamaUrl}/api/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: env.ollamaModel,
          stream: false,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
        }),
        signal: controller.signal,
      });
      clearTimeout(t);
      if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`);
      const json = (await res.json()) as { message?: { content?: string } };
      return json.message?.content ?? '';
    } catch (e) {
      lastErr = e instanceof Error ? e : new Error(String(e));
      await new Promise((r) => setTimeout(r, 2000 * (i + 1)));
    }
  }
  throw lastErr ?? new Error('Ollama failed');
}
