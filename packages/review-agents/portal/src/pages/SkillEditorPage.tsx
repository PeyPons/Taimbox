import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiDelete, apiGet, apiPatch, apiPost } from '../lib/api';
import { useAgency } from '../hooks/useAgency';
import EmptyAgencyCard from '../components/EmptyAgencyCard';

export default function SkillEditorPage() {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const { agencyId, loading: agencyLoading, hasAgency } = useAgency();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [skillType, setSkillType] = useState<'document' | 'url' | 'mixed'>('document');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [checklistJson, setChecklistJson] = useState('[]');
  const [roles, setRoles] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isTemplate, setIsTemplate] = useState(false);

  useEffect(() => {
    if (isNew || !id || !agencyId) return;
    setLoading(true);
    apiGet<{ skills: Array<Record<string, unknown>> }>(`/api/skills?agencyId=${agencyId}`)
      .then((r) => {
        const s = r.skills.find((x) => x.id === id);
        if (!s) {
          setError('No se encontró la skill o no tienes permiso para verla.');
          return;
        }
        if (s.is_system_template) {
          setIsTemplate(true);
          return;
        }
        setName(String(s.name));
        setSlug(String(s.slug));
        setDescription(String(s.description ?? ''));
        setSkillType(s.skill_type as 'document' | 'url' | 'mixed');
        setSystemPrompt(String(s.system_prompt));
        setChecklistJson(JSON.stringify(s.review_checklist ?? [], null, 2));
        setRoles((s.visibility_roles as string[])?.join(', ') ?? '');
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Error al cargar'))
      .finally(() => setLoading(false));
  }, [id, isNew, agencyId]);

  function normalizeJson(raw: string): string {
    return raw
      .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')
      .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'")
      .replace(/\u00A0/g, ' ')
      .trim();
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!agencyId) return;
    let checklist: unknown[] = [];
    const raw = normalizeJson(checklistJson || '[]');
    try {
      const parsed: unknown = raw === '' ? [] : JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        setError('El checklist debe ser un array JSON (entre corchetes [ ]).');
        return;
      }
      checklist = parsed;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      setError(`JSON inválido: ${msg}. Pista: usa comillas rectas " " y no “ ”.`);
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
    setSaving(true);
    setError('');
    try {
      if (isNew) {
        await apiPost('/api/skills', { ...body, agencyId });
      } else {
        await apiPatch(`/api/skills/${id}`, body);
      }
      navigate('/skills');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
    }
  }

  if (agencyLoading) return <p>Cargando agencia…</p>;
  if (!hasAgency) return <EmptyAgencyCard />;

  if (loading) {
    return (
      <div>
        <h1>{isNew ? 'Nueva skill' : 'Editar skill'}</h1>
        <p className="loading-hint">Cargando…</p>
      </div>
    );
  }

  if (isTemplate) {
    return (
      <div>
        <h1>Plantilla del sistema</h1>
        <div className="card">
          <p>Las plantillas globales no se editan. Duplícala para crear una copia editable en tu agencia.</p>
          {error && <p className="error">{error}</p>}
          <button
            type="button"
            className="btn"
            style={{ marginTop: '1rem' }}
            disabled={duplicating}
            onClick={async () => {
              if (!agencyId || !id) return;
              setDuplicating(true);
              setError('');
              try {
                const { skill } = await apiPost<{ skill: { id: string } }>(`/api/skills/${id}/duplicate`, {
                  agencyId,
                });
                navigate(`/skills/${skill.id}`, { replace: true });
              } catch (err) {
                setError(err instanceof Error ? err.message : 'No se pudo duplicar');
              } finally {
                setDuplicating(false);
              }
            }}
          >
            {duplicating ? 'Duplicando…' : 'Duplicar y editar'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1>{isNew ? 'Nueva skill' : 'Editar skill'}</h1>
      <form className="card" onSubmit={save}>
        <label>
          Nombre
          <input value={name} onChange={(e) => setName(e.target.value)} required disabled={saving} />
        </label>
        <label>
          Slug
          <input value={slug} onChange={(e) => setSlug(e.target.value)} required disabled={!isNew || saving} />
        </label>
        <label>
          Descripción
          <input value={description} onChange={(e) => setDescription(e.target.value)} disabled={saving} />
        </label>
        <label>
          Tipo
          <select
            value={skillType}
            onChange={(e) => setSkillType(e.target.value as typeof skillType)}
            disabled={saving}
          >
            <option value="document">Documento</option>
            <option value="url">URL</option>
            <option value="mixed">Mixto</option>
          </select>
        </label>
        <label>
          Instrucciones (system prompt)
          <textarea
            rows={8}
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            required
            disabled={saving}
          />
        </label>
        <label>
          Checklist (JSON)
          <textarea rows={6} value={checklistJson} onChange={(e) => setChecklistJson(e.target.value)} disabled={saving} />
        </label>
        <label>
          Roles visibles (separados por coma)
          <input
            value={roles}
            onChange={(e) => setRoles(e.target.value)}
            placeholder="comercial, legal, Administrador"
            disabled={saving}
          />
        </label>
        {error && <p className="error">{error}</p>}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
          <button type="submit" className="btn" disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
          {!isNew && id && (
            <>
              {!deleteConfirm ? (
                <button type="button" className="btn danger" disabled={saving} onClick={() => setDeleteConfirm(true)}>
                  Eliminar
                </button>
              ) : (
                <div className="confirm-inline" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn danger"
                    disabled={deleting}
                    onClick={async () => {
                      setDeleting(true);
                      setError('');
                      try {
                        await apiDelete(`/api/skills/${id}`);
                        navigate('/skills');
                      } catch (err) {
                        setError(err instanceof Error ? err.message : 'No se pudo eliminar');
                      } finally {
                        setDeleting(false);
                      }
                    }}
                  >
                    {deleting ? 'Eliminando…' : 'Confirmar eliminación'}
                  </button>
                  <button
                    type="button"
                    className="btn secondary"
                    disabled={deleting}
                    onClick={() => setDeleteConfirm(false)}
                  >
                    No
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </form>
    </div>
  );
}
