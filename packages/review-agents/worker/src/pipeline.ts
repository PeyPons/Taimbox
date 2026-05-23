import { supabase } from './supabase.js';
import { extractFromBuffer, extractFromUrl, chunkText } from './extract.js';
import { ollamaChat } from './ollama.js';
import { sendCompletionEmail } from './notify.js';
import { normalizeReportMarkdown } from './markdownNormalize.js';
import { formatReviewSourceLabels } from './markdownEmail.js';
import { createLivePreviewUpdater, startModelWaitTicker } from './livePreview.js';
import { env } from './env.js';
import { LIMITS } from '@taimbox/review-shared';
import type { ReviewJobStatus } from '@taimbox/review-shared';

async function logEvent(jobId: string, type: string, message: string, payload?: object) {
  await supabase.from('review_job_events').insert({
    job_id: jobId,
    event_type: type,
    message,
    payload: payload ?? null,
  });
}

async function updateJob(
  jobId: string,
  patch: Record<string, unknown>,
) {
  await supabase
    .from('review_jobs')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', jobId);
}

async function isCancelled(jobId: string): Promise<boolean> {
  const { data } = await supabase.from('review_jobs').select('status').eq('id', jobId).single();
  return data?.status === 'cancelled';
}

function parsePartialJson(raw: string): Record<string, unknown> {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return { raw };
  try {
    return JSON.parse(match[0]) as Record<string, unknown>;
  } catch {
    return { raw };
  }
}

function buildReduceUserMessage(partials: Record<string, unknown>[]): string {
  const blocks = partials.map((partial, i) => {
    const findings = partial.findings;
    if (Array.isArray(findings)) {
      const lines = findings.map((f) => `- ${JSON.stringify(f)}`).join('\n');
      return `## Fragmento ${i + 1}\n${lines}`;
    }
    const raw = typeof partial.raw === 'string' ? partial.raw : JSON.stringify(partial);
    return `## Fragmento ${i + 1}\n${raw.slice(0, 12_000)}`;
  });
  return `Hallazgos parciales (${partials.length} fragmentos). Integra y redacta el informe final:\n\n${blocks.join('\n\n')}`.slice(
    0,
    80_000,
  );
}

async function runOllamaWithLiveFeedback(
  jobId: string,
  phase: 'mapping' | 'reducing',
  baseProgressMessage: string,
  system: string,
  user: string,
  options: {
    bootstrapPreview?: string;
    onProgress?: (chars: number) => void | Promise<void>;
  } = {},
  model = env.ollamaModel,
): Promise<string> {
  const live = createLivePreviewUpdater(jobId, phase);
  let gotStream = false;
  let streamedChars = 0;
  let wroteThinkingHeader = false;
  let wroteContentHeader = false;

  if (options.bootstrapPreview) {
    await live.setBootstrap(options.bootstrapPreview);
  }

  let stopTicker: () => void = () => {};

  const beginStream = () => {
    if (gotStream) return;
    gotStream = true;
    stopTicker();
    live.resetText();
    void updateJob(jobId, {
      progress_message: phase === 'reducing' ? 'Redactando informe final…' : baseProgressMessage,
      live_phase: phase,
    });
  };

  stopTicker = startModelWaitTicker(jobId, phase, baseProgressMessage, (patch) =>
    updateJob(jobId, patch),
  );

  try {
    const raw = await ollamaChat(system, user, LIMITS.chunkRetries, {
      onThinking: (token) => {
        beginStream();
        if (!wroteThinkingHeader) {
          live.push('💭 Razonamiento del modelo\n\n');
          wroteThinkingHeader = true;
        }
        streamedChars += token.length;
        live.push(token);
        void options.onProgress?.(streamedChars);
      },
      onToken: (token) => {
        beginStream();
        if (wroteThinkingHeader && !wroteContentHeader) {
          live.push('\n\n📝 Informe\n\n');
          wroteContentHeader = true;
        }
        streamedChars += token.length;
        live.push(token);
        void options.onProgress?.(streamedChars);
      },
    }, model);
    await live.flush();
    return raw;
  } finally {
    stopTicker();
  }
}

export async function processReviewJob(jobId: string): Promise<void> {
  const { data: job } = await supabase.from('review_jobs').select('*').eq('id', jobId).single();
  if (!job || job.status === 'cancelled') return;

  const { data: skill } = await supabase.from('review_skills').select('*').eq('id', job.skill_id).single();
  if (!skill) {
    await updateJob(jobId, { status: 'failed', error_message: 'Skill no encontrada' });
    return;
  }

  await updateJob(jobId, {
    status: 'preprocessing' satisfies ReviewJobStatus,
    started_at: job.started_at ?? new Date().toISOString(),
    progress_pct: 5,
    progress_message: 'Extrayendo contenido…',
  });
  await logEvent(jobId, 'preprocessing', 'Inicio de extracción');

  const { data: inputs } = await supabase.from('review_job_inputs').select('*').eq('job_id', jobId);
  const parts: string[] = [];

  for (const inp of inputs ?? []) {
    if (await isCancelled(jobId)) return;
    if (inp.storage_path && (inp.input_type === 'paste' || inp.input_type === 'file')) {
      const { data } = await supabase.storage.from('review-documents').download(inp.storage_path);
      if (data) {
        const buf = Buffer.from(await data.arrayBuffer());
        const name = inp.original_filename ?? inp.storage_path;
        if (inp.input_type === 'paste' || name.endsWith('.txt') || name.endsWith('.md')) {
          parts.push(buf.toString('utf-8'));
        } else {
          const text = await extractFromBuffer(buf, name);
          parts.push(`--- DOC: ${name} ---\n${text}`);
        }
        continue;
      }
    }
    if (inp.input_type === 'url' && inp.source_url) {
      const text = await extractFromUrl(inp.source_url);
      parts.push(`--- URL: ${inp.source_url} ---\n${text}`);
      const path = `${job.agency_id}/${jobId}/extracted-url-${inp.id}.txt`;
      await supabase.storage.from('review-documents').upload(path, text, { upsert: true });
      await supabase.from('review_job_inputs').update({ extracted_text_path: path, char_count: text.length }).eq('id', inp.id);
      continue;
    }
  }

  const corpus = parts.join('\n\n').slice(0, LIMITS.maxCharsTotal);
  if (!corpus.trim()) {
    await updateJob(jobId, { status: 'failed', error_message: 'Sin contenido extraíble' });
    return;
  }

  await updateJob(jobId, {
    status: 'chunking',
    progress_pct: 15,
    progress_message: 'Dividiendo en fragmentos…',
    input_summary: { ...((job.input_summary as object) ?? {}), charCount: corpus.length },
  });
  await logEvent(jobId, 'chunking', `Corpus ${corpus.length} caracteres`);

  const chunks = chunkText(corpus, LIMITS.chunkChars, LIMITS.chunkOverlap);
  await supabase.from('review_job_chunks').delete().eq('job_id', jobId);
  for (let i = 0; i < chunks.length; i++) {
    await supabase.from('review_job_chunks').insert({
      job_id: jobId,
      chunk_index: i,
      status: 'pending',
    });
  }

  const checklist = JSON.stringify(skill.review_checklist ?? []);
  const systemBase = `${skill.system_prompt}\n\nChecklist:\n${checklist}\n\nResponde en JSON parcial con findings (array), sin conclusión global.`;

  await updateJob(jobId, { status: 'mapping', progress_pct: 20, progress_message: 'Analizando fragmentos…' });

  const partials: Record<string, unknown>[] = [];
  for (let i = 0; i < chunks.length; i++) {
    if (await isCancelled(jobId)) return;
    await updateJob(jobId, {
      progress_message: `Analizando fragmento ${i + 1}/${chunks.length}…`,
      live_preview: null,
      live_phase: 'mapping',
    });
    await supabase
      .from('review_job_chunks')
      .update({ status: 'processing', updated_at: new Date().toISOString() })
      .eq('job_id', jobId)
      .eq('chunk_index', i);

    const userMsg = `Fragmento ${i + 1} de ${chunks.length} (job ${jobId}):\n\n${chunks[i]}`;
    let partial: Record<string, unknown>;
    try {
      const raw = await runOllamaWithLiveFeedback(
        jobId,
        'mapping',
        `Analizando fragmento ${i + 1}/${chunks.length}…`,
        systemBase,
        userMsg,
        {},
        env.ollamaModelMap,
      );
      partial = parsePartialJson(raw);
    } catch (e) {
      await createLivePreviewUpdater(jobId, 'mapping').clear();
      partial = { error: e instanceof Error ? e.message : 'chunk failed' };
      await supabase
        .from('review_job_chunks')
        .update({ status: 'failed', error_message: String(partial.error) })
        .eq('job_id', jobId)
        .eq('chunk_index', i);
      partials.push(partial);
      continue;
    }

    await supabase
      .from('review_job_chunks')
      .update({ status: 'completed', partial_result_json: partial })
      .eq('job_id', jobId)
      .eq('chunk_index', i);
    partials.push(partial);

    const pct = 20 + Math.floor(((i + 1) / chunks.length) * 55);
    await updateJob(jobId, { progress_pct: pct, progress_message: `Fragmento ${i + 1}/${chunks.length}` });
  }

  await updateJob(jobId, {
    status: 'reducing',
    progress_pct: 80,
    progress_message: 'Sintetizando informe…',
    live_preview: null,
    live_phase: 'reducing',
  });
  await logEvent(jobId, 'reducing', 'Reduce final');

  const reduceSystem = `${skill.system_prompt}

Genera el informe final en español siguiendo el FORMATO DE RESPUESTA de las instrucciones anteriores.

Reglas técnicas obligatorias:
- Responde SOLO en Markdown (sin JSON inicial ni bloques de código envolviendo todo el informe).
- Cada fila de tabla en su propia línea; línea en blanco antes y después de cada tabla.
- Usa # para el título principal y ## para secciones.
- No concatenes varias filas de tabla en una sola línea.`;
  const reduceUser = buildReduceUserMessage(partials);
  const reduceBootstrap =
    `📋 Contexto que el modelo está procesando (${partials.length} fragmento(s), ${reduceUser.length.toLocaleString('es-ES')} caracteres)\n\n` +
    `${reduceUser.slice(0, 5000)}${reduceUser.length > 5000 ? '\n\n… [contexto truncado en vista]' : ''}\n\n` +
    `---\n⏳ Cuando el modelo responda, verás aquí su razonamiento (si el modelo lo expone) y el informe escribiéndose en directo.\n`;

  let resultMarkdown = '';
  let resultJson: Record<string, unknown> = {};

  try {
    let lastProgressPct = 80;
    const raw = await runOllamaWithLiveFeedback(
      jobId,
      'reducing',
      'Sintetizando informe…',
      reduceSystem,
      reduceUser,
      {
        bootstrapPreview: reduceBootstrap,
        onProgress: async (chars) => {
          const pct = Math.min(98, 80 + Math.floor(chars / 600));
          if (pct > lastProgressPct) {
            lastProgressPct = pct;
            await updateJob(jobId, { progress_pct: pct });
          }
        },
      },
      env.ollamaModelReduce,
    );
    await createLivePreviewUpdater(jobId, 'reducing').clear();
    const mdSplit = raw.split('---MARKDOWN---');
    const body = mdSplit.length >= 2 ? mdSplit.slice(1).join('---MARKDOWN---') : raw;
    resultMarkdown = normalizeReportMarkdown(body);

    const scoreMatch = resultMarkdown.match(/(\d{1,3})\s*\/\s*10/);
    const summaryMatch = resultMarkdown.match(
      /\*\*Resumen en una frase:\*\*\s*([^\n]+)/i,
    );
    resultJson = {
      score: scoreMatch ? Number(scoreMatch[1]) : null,
      summary: summaryMatch?.[1]?.trim() ?? resultMarkdown.slice(0, 200),
    };
  } catch (e) {
    await createLivePreviewUpdater(jobId, 'reducing').clear();
    await updateJob(jobId, {
      status: 'failed',
      error_message: e instanceof Error ? e.message : 'Reduce failed',
      finished_at: new Date().toISOString(),
    });
    return;
  }

  await updateJob(jobId, {
    status: 'completed',
    progress_pct: 100,
    progress_message: 'Completado',
    result_markdown: resultMarkdown,
    result_json: resultJson,
    live_preview: null,
    live_phase: null,
    finished_at: new Date().toISOString(),
  });
  await logEvent(jobId, 'completed', 'Trabajo finalizado');

  if (job.notify_on_complete && !job.email_sent_at) {
    const { data: profile } = await supabase
      .from('review_profiles')
      .select('notify_email')
      .eq('user_id', job.requested_by)
      .eq('agency_id', job.agency_id)
      .maybeSingle();

    const { data: user } = await supabase.auth.admin.getUserById(job.requested_by);
    const email = profile?.notify_email ?? user.user?.email;
    if (email && resultMarkdown.trim()) {
      const { data: jobInputs } = await supabase
        .from('review_job_inputs')
        .select('input_type, original_filename, source_url')
        .eq('job_id', jobId);

      const sourceLabels = formatReviewSourceLabels(jobInputs ?? []);

      await sendCompletionEmail({
        to: email,
        jobId,
        skillName: skill.name,
        sourceLabels,
        resultMarkdown,
      });
      await updateJob(jobId, { email_sent_at: new Date().toISOString() });
    }
  }
}
