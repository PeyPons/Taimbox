import { env } from './env.js';
import { LIMITS } from '@taimbox/review-shared';

export interface OllamaStreamOptions {
  onToken?: (token: string) => void;
  /** Modelos con razonamiento (p. ej. DeepSeek-R1) emiten tokens en `thinking`. */
  onThinking?: (token: string) => void;
}

type OllamaStreamChunk = {
  message?: { content?: string; thinking?: string };
  thinking?: string;
  done?: boolean;
};

async function ollamaChatStreamOnce(
  model: string,
  system: string,
  user: string,
  options: OllamaStreamOptions,
  signal: AbortSignal,
): Promise<string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (env.ollamaApiToken) {
    headers.Authorization = `Bearer ${env.ollamaApiToken}`;
  }

  const res = await fetch(`${env.ollamaUrl}/api/chat`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      stream: true,
      think: true,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
    signal,
  });

  if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`);
  if (!res.body) throw new Error('Ollama empty body');

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let full = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const chunk = JSON.parse(trimmed) as OllamaStreamChunk;
        const thinking = chunk.message?.thinking ?? chunk.thinking ?? '';
        if (thinking) options.onThinking?.(thinking);
        const token = chunk.message?.content ?? '';
        if (token) {
          full += token;
          options.onToken?.(token);
        }
      } catch {
        // línea parcial NDJSON, ignorar
      }
    }
  }

  return full;
}

export async function ollamaChat(
  system: string,
  user: string,
  retries = LIMITS.chunkRetries,
  options: OllamaStreamOptions = {},
  model = env.ollamaModel,
): Promise<string> {
  let lastErr: Error | null = null;
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), LIMITS.chunkTimeoutMs);
      const full = await ollamaChatStreamOnce(model, system, user, options, controller.signal);
      clearTimeout(t);
      return full;
    } catch (e) {
      lastErr = e instanceof Error ? e : new Error(String(e));
      await new Promise((r) => setTimeout(r, 2000 * (i + 1)));
    }
  }
  throw lastErr ?? new Error('Ollama failed');
}
