import { supabase } from './supabase.js';
import { extractFromBuffer, extractFromUrl, chunkText } from './extract.js';
import { ollamaChat } from './ollama.js';
import { sendCompletionEmail } from './notify.js';
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
    await supabase
      .from('review_job_chunks')
      .update({ status: 'processing', updated_at: new Date().toISOString() })
      .eq('job_id', jobId)
      .eq('chunk_index', i);

    const userMsg = `Fragmento ${i + 1} de ${chunks.length} (job ${jobId}):\n\n${chunks[i]}`;
    let partial: Record<string, unknown>;
    try {
      const raw = await ollamaChat(systemBase, userMsg);
      partial = parsePartialJson(raw);
    } catch (e) {
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

  await updateJob(jobId, { status: 'reducing', progress_pct: 80, progress_message: 'Sintetizando informe…' });
  await logEvent(jobId, 'reducing', 'Reduce final');

  const reduceSystem = `${skill.system_prompt}\n\nGenera el informe final en español. Primero un bloque JSON válido con: summary (string), score (0-100), findings (array), recommendations (array). Después, separado por ---MARKDOWN---, el informe en markdown.`;
  const reduceUser = `Análisis parciales (${partials.length} fragmentos):\n${JSON.stringify(partials).slice(0, 100_000)}`;

  let resultMarkdown = '';
  let resultJson: Record<string, unknown> = {};

  try {
    const raw = await ollamaChat(reduceSystem, reduceUser);
    const mdSplit = raw.split('---MARKDOWN---');
    if (mdSplit.length >= 2) {
      resultJson = parsePartialJson(mdSplit[0]);
      resultMarkdown = mdSplit.slice(1).join('---MARKDOWN---').trim();
    } else {
      resultJson = parsePartialJson(raw);
      resultMarkdown =
        typeof resultJson.summary === 'string'
          ? String(resultJson.summary)
          : raw;
    }
  } catch (e) {
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
    if (email) {
      const summary =
        typeof resultJson.summary === 'string' ? resultJson.summary : 'Revisión lista';
      await sendCompletionEmail(email, jobId, summary);
      await updateJob(jobId, { email_sent_at: new Date().toISOString() });
    }
  }
}
