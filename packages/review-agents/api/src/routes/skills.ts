import { Router } from 'express';
import { z } from 'zod';
import type { AuthLocals } from '../middleware/auth.js';
import { supabaseForUser, supabaseAdmin } from '../supabase.js';

const router = Router();

router.get('/', async (req, res) => {
  const { jwt } = res.locals.auth as AuthLocals;
  const agencyId = String(req.query.agencyId ?? '');
  if (!agencyId) {
    res.status(400).json({ error: 'agencyId required' });
    return;
  }
  const sb = supabaseForUser(jwt);
  const { data, error } = await sb
    .from('review_skills')
    .select('*')
    .or(`agency_id.eq.${agencyId},and(agency_id.is.null,is_system_template.eq.true)`)
    .eq('is_archived', false)
    .order('name');
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json({ skills: data ?? [] });
});

const skillBody = z.object({
  agencyId: z.string().uuid(),
  slug: z.string().min(1).max(80),
  name: z.string().min(1),
  description: z.string().optional(),
  skillType: z.enum(['document', 'url', 'mixed']),
  systemPrompt: z.string(),
  reviewChecklist: z.array(z.unknown()).optional(),
  outputSchema: z.record(z.unknown()).optional(),
  visibilityRoles: z.array(z.string()).optional(),
  allowedInputTypes: z.array(z.string()).optional(),
});

router.post('/', async (req, res) => {
  const { userId, jwt } = res.locals.auth as AuthLocals;
  const parsed = skillBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const b = parsed.data;
  const sb = supabaseForUser(jwt);
  const { data, error } = await sb
    .from('review_skills')
    .insert({
      agency_id: b.agencyId,
      slug: b.slug,
      name: b.name,
      description: b.description ?? '',
      skill_type: b.skillType,
      system_prompt: b.systemPrompt,
      review_checklist: b.reviewChecklist ?? [],
      output_schema: b.outputSchema ?? {},
      visibility_roles: b.visibilityRoles ?? [],
      allowed_input_types: b.allowedInputTypes ?? ['pdf', 'docx', 'txt', 'md', 'url'],
      created_by: userId,
      is_system_template: false,
    })
    .select()
    .single();
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.status(201).json({ skill: data });
});

router.patch('/:id', async (req, res) => {
  const { userId, jwt } = res.locals.auth as AuthLocals;
  const id = req.params.id;
  const sb = supabaseForUser(jwt);
  const { data: existing } = await sb.from('review_skills').select('*').eq('id', id).single();
  if (!existing || existing.is_system_template) {
    res.status(404).json({ error: 'Not found or system template' });
    return;
  }
  await sb.from('review_skill_versions').insert({
    skill_id: id,
    version: existing.version,
    snapshot: existing,
    created_by: userId,
  });
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString(), version: existing.version + 1 };
  const allowed = [
    'name', 'description', 'system_prompt', 'review_checklist', 'output_schema',
    'visibility_roles', 'allowed_input_types', 'skill_type',
  ] as const;
  for (const key of allowed) {
    const camel = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    if (req.body[camel] !== undefined) updates[key] = req.body[camel];
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }
  const { data, error } = await sb.from('review_skills').update(updates).eq('id', id).select().single();
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json({ skill: data });
});

router.post('/:id/duplicate', async (req, res) => {
  const { userId, jwt } = res.locals.auth as AuthLocals;
  const agencyId = String(req.body.agencyId ?? '');
  if (!agencyId) {
    res.status(400).json({ error: 'agencyId required' });
    return;
  }
  const sb = supabaseForUser(jwt);
  const { data: src } = await sb.from('review_skills').select('*').eq('id', req.params.id).single();
  if (!src) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  const slug = `${src.slug}-copy-${Date.now().toString(36)}`;
  const { data, error } = await sb
    .from('review_skills')
    .insert({
      agency_id: agencyId,
      slug,
      name: `${src.name} (copia)`,
      description: src.description,
      skill_type: src.skill_type,
      system_prompt: src.system_prompt,
      review_checklist: src.review_checklist,
      output_schema: src.output_schema,
      visibility_roles: [],
      allowed_input_types: src.allowed_input_types,
      created_by: userId,
      is_system_template: false,
    })
    .select()
    .single();
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.status(201).json({ skill: data });
});

export default router;
