import { supabase } from './supabase.js';

const MAX_PREVIEW_CHARS = 12_000;
const FLUSH_MS = 350;

export function createLivePreviewUpdater(jobId: string, phase: 'mapping' | 'reducing') {
  let text = '';
  let lastFlush = 0;
  let pending: ReturnType<typeof setTimeout> | null = null;

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
