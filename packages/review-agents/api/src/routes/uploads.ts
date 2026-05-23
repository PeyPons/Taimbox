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
  const { jwt } = res.locals.auth as AuthLocals;
  const parsed = signSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const { agencyId, jobId, filename } = parsed.data;
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${agencyId}/${jobId}/${Date.now()}-${safeName}`;

  const sb = supabaseForUser(jwt);
  const { data, error } = await sb.storage.from('review-documents').createSignedUploadUrl(path);
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json({ path, token: data.token, signedUrl: data.signedUrl });
});

export default router;
