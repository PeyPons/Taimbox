import { Router } from 'express';
import { z } from 'zod';
import type { AuthLocals } from '../middleware/auth.js';
import { supabaseForUser, supabaseAdmin } from '../supabase.js';
import { enqueueReviewJob } from '../queue.js';
import { LIMITS } from '@taimbox/review-shared';

const router = Router();

const createJobSchema = z.object({
  agencyId: z.string().uuid(),
  skillId: z.string().uuid(),
  notifyOnComplete: z.boolean().optional(),
  startImmediately: z.boolean().optional(),
  inputs: z.array(
    z.object({
      type: z.enum(['file', 'url', 'paste']),
      storagePath: z.string().optional(),
      sourceUrl: z.string().optional(),
      text: z.string().optional(),
      filename: z.string().optional(),
    }),
  ),
});

router.get('/', async (req, res) => {
  const { jwt } = res.locals.auth as AuthLocals;
  const agencyId = String(req.query.agencyId ?? '');
  const sb = supabaseForUser(jwt);
  let q = sb.from('review_jobs').select('*').order('created_at', { ascending: false }).limit(50);
  if (agencyId) q = q.eq('agency_id', agencyId);
  const { data, error } = await q;
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json({ jobs: data ?? [] });
});

router.get('/:id', async (req, res) => {
  const { jwt } = res.locals.auth as AuthLocals;
  const sb = supabaseForUser(jwt);
  const { data, error } = await sb.from('review_jobs').select('*').eq('id', req.params.id).single();
  if (error || !data) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json({ job: data });
});

router.get('/:id/events', async (req, res) => {
  const { jwt } = res.locals.auth as AuthLocals;
  const sb = supabaseForUser(jwt);
  const { data, error } = await sb
    .from('review_job_events')
    .select('*')
    .eq('job_id', req.params.id)
    .order('created_at');
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json({ events: data ?? [] });
});

router.post('/', async (req, res) => {
  const { userId, jwt } = res.locals.auth as AuthLocals;
  const parsed = createJobSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const { agencyId, skillId, inputs, notifyOnComplete, startImmediately } = parsed.data;

  const { count } = await supabaseAdmin
    .from('review_jobs')
    .select('*', { count: 'exact', head: true })
    .eq('requested_by', userId)
    .in('status', ['queued', 'preprocessing', 'chunking', 'mapping', 'reducing']);

  if ((count ?? 0) >= LIMITS.maxConcurrentJobsPerUser) {
    res.status(429).json({ error: 'Demasiados trabajos activos. Espera a que terminen.' });
    return;
  }

  const sb = supabaseForUser(jwt);
  const { data: skill } = await sb.from('review_skills').select('version').eq('id', skillId).single();
  if (!skill) {
    res.status(404).json({ error: 'Skill not found' });
    return;
  }

  const { data: job, error: jobErr } = await sb
    .from('review_jobs')
    .insert({
      agency_id: agencyId,
      skill_id: skillId,
      skill_version: skill.version,
      requested_by: userId,
      notify_on_complete: notifyOnComplete ?? true,
      input_summary: { inputCount: inputs.length },
    })
    .select()
    .single();

  if (jobErr || !job) {
    res.status(500).json({ error: jobErr?.message ?? 'Failed to create job' });
    return;
  }

  const inputRows: Array<Record<string, unknown>> = [];
  for (const inp of inputs) {
    let storagePath = inp.storagePath ?? null;
    if (inp.type === 'paste' && inp.text) {
      const path = `${agencyId}/${job.id}/paste-${Date.now()}.txt`;
      const { error: upErr } = await supabaseAdmin.storage
        .from('review-documents')
        .upload(path, inp.text, { contentType: 'text/plain', upsert: true });
      if (upErr) {
        await supabaseAdmin.from('review_jobs').delete().eq('id', job.id);
        res.status(500).json({ error: upErr.message });
        return;
      }
      storagePath = path;
    }
    inputRows.push({
      job_id: job.id,
      input_type: inp.type,
      storage_path: storagePath,
      source_url: inp.sourceUrl ?? null,
      original_filename: inp.filename ?? null,
    });
  }

  if (inputRows.length > 0) {
    const { error: inpErr } = await sb.from('review_job_inputs').insert(inputRows);
    if (inpErr) {
      await supabaseAdmin.from('review_jobs').delete().eq('id', job.id);
      res.status(500).json({ error: inpErr.message });
      return;
    }
  }

  await supabaseAdmin.from('review_job_events').insert({
    job_id: job.id,
    event_type: 'created',
    message: 'Trabajo encolado',
  });

  if (startImmediately !== false) {
    await enqueueReviewJob(job.id);
  }

  res.status(201).json({ job });
});

router.post('/:id/enqueue', async (req, res) => {
  const { jwt } = res.locals.auth as AuthLocals;
  const sb = supabaseForUser(jwt);
  const { data: job } = await sb.from('review_jobs').select('id, status').eq('id', req.params.id).single();
  if (!job || job.status !== 'queued') {
    res.status(400).json({ error: 'Job no encolable' });
    return;
  }
  await enqueueReviewJob(job.id);
  res.json({ ok: true });
});

router.post('/:id/inputs', async (req, res) => {
  const { jwt } = res.locals.auth as AuthLocals;
  const sb = supabaseForUser(jwt);
  const jobId = req.params.id;
  const { storagePath, filename, sourceUrl, type } = req.body as {
    type: 'file' | 'url' | 'paste';
    storagePath?: string;
    filename?: string;
    sourceUrl?: string;
  };
  const { data: job } = await sb.from('review_jobs').select('status').eq('id', jobId).single();
  if (!job || job.status !== 'queued') {
    res.status(400).json({ error: 'Job no está en cola' });
    return;
  }
  const { error } = await sb.from('review_job_inputs').insert({
    job_id: jobId,
    input_type: type,
    storage_path: storagePath ?? null,
    source_url: sourceUrl ?? null,
    original_filename: filename ?? null,
  });
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json({ ok: true });
});

router.post('/:id/cancel', async (req, res) => {
  const { jwt } = res.locals.auth as AuthLocals;
  const sb = supabaseForUser(jwt);
  const { data, error } = await sb
    .from('review_jobs')
    .update({ status: 'cancelled', progress_message: 'Cancelado por el usuario', updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .in('status', ['queued', 'preprocessing', 'chunking', 'mapping', 'reducing'])
    .select()
    .single();
  if (error || !data) {
    res.status(400).json({ error: 'No se pudo cancelar' });
    return;
  }
  await supabaseAdmin.from('review_job_events').insert({
    job_id: data.id,
    event_type: 'cancelled',
    message: 'Cancelado',
  });
  res.json({ job: data });
});

export default router;
