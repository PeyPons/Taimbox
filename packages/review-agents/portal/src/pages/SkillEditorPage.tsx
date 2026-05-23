import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiGet, apiPatch, apiPost } from '../lib/api';
import { useAgency } from '../hooks/useAgency';

export default function SkillEditorPage() {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const { agencyId } = useAgency();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [skillType, setSkillType] = useState<'document' | 'url' | 'mixed'>('document');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [checklistJson, setChecklistJson] = useState('[]');
  const [roles, setRoles] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isNew || !id) return;
    apiGet<{ skills: Array<Record<string, unknown>> }>(`/api/skills?agencyId=${agencyId}`).then((r) => {
      const s = r.skills.find((x) => x.id === id);
      if (!s) return;
      setName(String(s.name));
      setSlug(String(s.slug));
      setDescription(String(s.description ?? ''));
      setSkillType(s.skill_type as 'document' | 'url' | 'mixed');
      setSystemPrompt(String(s.system_prompt));
      setChecklistJson(JSON.stringify(s.review_checklist ?? [], null, 2));
      setRoles((s.visibility_roles as string[])?.join(', ') ?? '');
    });
  }, [id, isNew, agencyId]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!agencyId) return;
    let checklist: unknown[] = [];
    try {
      checklist = JSON.parse(checklistJson) as unknown[];
    } catch {
      setError('Checklist JSON inválido');
      return;
    }
    const body = {
      name,
      slug,
      description,
      skillType,
      systemPrompt,
      reviewChecklist: checklist,
      visibilityRoles: roles.split(',').map((r) => r.trim()).filter(Boolean),
    };
    try {
      if (isNew) {
        await apiPost('/api/skills', { ...body, agencyId });
      } else {
        await apiPatch(`/api/skills/${id}`, body);
      }
      navigate('/skills');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    }
  }

  return (
    <div>
      <h1>{isNew ? 'Nueva skill' : 'Editar skill'}</h1>
      <form className="card" onSubmit={save}>
        <label>
          Nombre
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label>
          Slug
          <input value={slug} onChange={(e) => setSlug(e.target.value)} required disabled={!isNew} />
        </label>
        <label>
          Descripción
          <input value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
        <label>
          Tipo
          <select value={skillType} onChange={(e) => setSkillType(e.target.value as typeof skillType)}>
            <option value="document">Documento</option>
            <option value="url">URL</option>
            <option value="mixed">Mixto</option>
          </select>
        </label>
        <label>
          Instrucciones (system prompt)
          <textarea rows={8} value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} required />
        </label>
        <label>
          Checklist (JSON)
          <textarea rows={6} value={checklistJson} onChange={(e) => setChecklistJson(e.target.value)} />
        </label>
        <label>
          Roles visibles (separados por coma)
          <input value={roles} onChange={(e) => setRoles(e.target.value)} placeholder="comercial, legal, Administrador" />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" className="btn" style={{ marginTop: '1rem' }}>
          Guardar
        </button>
      </form>
    </div>
  );
}
