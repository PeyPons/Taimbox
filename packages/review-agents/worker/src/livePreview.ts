import { supabase } from './supabase.js';

const MAX_PREVIEW_CHARS = 12_000;
const FLUSH_MS = 350;

export function createLivePreviewUpdater(jobId: string, phase: 'mapping' | 'reducing') {
  let text = '';
  let lastFlush = 0;
  let pending: ReturnType<typeof setTimeout> | null = null;

  const scheduleFlush = () => {
    const now = Date.now();
    if (now - lastFlush >= FLUSH_MS) {
      void flush();
      return;
    }
    if (!pending) {
      pending = setTimeout(() => {
        pending = null;
        void flush();
      }, FLUSH_MS);
    }
  };

  const flush = async () => {
    if (pending) {
      clearTimeout(pending);
      pending = null;
    }
    const preview = text.slice(-MAX_PREVIEW_CHARS);
    await supabase
      .from('review_jobs')
      .update({
        live_preview: preview || null,
        live_phase: phase,
        live_updated_at: new Date().toISOString(),
      })
      .eq('id', jobId);
    lastFlush = Date.now();
  };

  return {
    push(token: string) {
      text += token;
      scheduleFlush();
    },
    resetText() {
      text = '';
    },
    async setBootstrap(bootstrap: string) {
      text = bootstrap;
      await flush();
    },
    flush,
    async clear() {
      if (pending) clearTimeout(pending);
      text = '';
      await supabase
        .from('review_jobs')
        .update({ live_preview: null, live_phase: null, live_updated_at: null })
        .eq('id', jobId);
    },
  };
}

/** Actualiza progress_message mientras Ollama tarda en emitir el primer token. */
export function startModelWaitTicker(
  jobId: string,
  phase: 'mapping' | 'reducing',
  baseMessage: string,
  onTick: (patch: Record<string, unknown>) => void | Promise<void>,
): () => void {
  let seconds = 0;
  const interval = setInterval(() => {
    seconds += 5;
    const suffix =
      phase === 'reducing'
        ? `(redactando informe, ${seconds}s — esta fase suele tardar más)`
        : `(esperando modelo, ${seconds}s)`;
    void onTick({
      progress_message: `${baseMessage} ${suffix}`,
      live_phase: phase,
    });
  }, 5000);
  return () => clearInterval(interval);
}
