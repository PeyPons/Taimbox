import { Router } from 'express';
import { z } from 'zod';
import type { AuthLocals } from '../middleware/auth.js';
import { supabaseForUser } from '../supabase.js';

const router = Router();

const signSchema = z.object({
  agencyId: z.string().uuid(),
  jobId: z.string().uuid(),
  filename: z.string().min(1),
});

router.post('/sign', async (req, res) => {
  const { userId, jwt } = res.locals.auth as AuthLocals;
  const parsed = signSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const { agencyId, jobId, filename } = parsed.data;
  const sb = supabaseForUser(jwt);

  const { data: job, error: jobErr } = await sb
    .from('review_jobs')
    .select('id, agency_id, requested_by')
    .eq('id', jobId)
    .eq('agency_id', agencyId)
    .maybeSingle();

  if (jobErr || !job) {
    res.status(404).json({ error: 'Job not found' });
    return;
  }

  if (job.requested_by !== userId) {
    const { data: isAdmin, error: adminErr } = await sb.rpc('is_agency_admin', {
      p_user_id: userId,
      p_agency_id: agencyId,
    });
    if (adminErr || isAdmin !== true) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
  }

  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${agencyId}/${jobId}/${Date.now()}-${safeName}`;

  const { data, error } = await sb.storage.from('review-documents').createSignedUploadUrl(path);
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json({ path, token: data.token, signedUrl: data.signedUrl });
});

export default router;
