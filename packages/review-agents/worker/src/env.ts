function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export const env = {
  supabaseUrl: required('SUPABASE_URL'),
  supabaseServiceKey: required('SUPABASE_SERVICE_ROLE_KEY'),
  redisUrl: process.env.REDIS_URL ?? 'redis://127.0.0.1:6379',
  /** Base URL sin /api/chat — p. ej. http://88.30.74.159/ollama-api */
  ollamaUrl: process.env.OLLAMA_URL ?? 'http://88.30.74.159/ollama-api',
  ollamaApiToken: process.env.OLLAMA_API_TOKEN ?? '',
  /** Modelo por defecto si no hay MAP/REDUCE específicos. */
  ollamaModel: process.env.OLLAMA_MODEL ?? 'qwen2.5:7b-instruct',
  ollamaModelMap: process.env.OLLAMA_MODEL_MAP ?? 'llama3.2:3b',
  ollamaModelReduce: process.env.OLLAMA_MODEL_REDUCE ?? process.env.OLLAMA_MODEL ?? 'qwen2.5:7b-instruct',
  resendApiKey: process.env.RESEND_API_KEY ?? '',
  resendFrom: process.env.RESEND_FROM_EMAIL ?? 'Taimbox <noreply@send.taimbox.com>',
  portalPublicUrl: process.env.REVIEW_PORTAL_URL ?? 'http://localhost:5174',
  workerConcurrency: Number(process.env.WORKER_CONCURRENCY ?? 1),
};
