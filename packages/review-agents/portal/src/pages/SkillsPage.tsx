import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiGet, apiPost } from '../lib/api';
import { useAgency } from '../hooks/useAgency';

interface Skill {
  id: string;
  name: string;
  description: string;
  skill_type: string;
  is_system_template: boolean;
  slug: string;
}

export default function SkillsPage() {
  const { agencyId } = useAgency();
  const navigate = useNavigate();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);

  async function reload() {
    if (!agencyId) return;
    setLoading(true);
    try {
      const r = await apiGet<{ skills: Skill[] }>(`/api/skills?agencyId=${agencyId}`);
      setSkills(r.skills);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
  }, [agencyId]);

  async function duplicateAndEdit(id: string) {
    if (!agencyId) return;
    const { skill } = await apiPost<{ skill: Skill }>(`/api/skills/${id}/duplicate`, { agencyId });
    navigate(`/skills/${skill.id}`);
  }

  function exportSkill(s: Skill) {
    const blob = new Blob([JSON.stringify(s, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${s.slug}.json`;
    a.click();
  }

  const templates = skills.filter((s) => s.is_system_template);
  const agencySkills = skills.filter((s) => !s.is_system_template);

  return (
    <div>
      <h1>Skills de revisión</h1>
      <p style={{ color: '#64748b', marginBottom: '1rem' }}>
        Las plantillas del sistema no se editan directamente: duplícalas para personalizarlas. Tus skills de agencia
        sí se pueden editar.
      </p>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <Link to="/skills/new" className="btn" style={{ textDecoration: 'none' }}>
          Crear skill
        </Link>
        <label className="btn secondary" style={{ cursor: 'pointer' }}>
          Importar JSON
          <input
            type="file"
            accept="application/json"
            hidden
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file || !agencyId) return;
              const json = JSON.parse(await file.text()) as Record<string, unknown>;
              const { skill } = await apiPost<{ skill: Skill }>('/api/skills', {
                agencyId,
                slug: String(json.slug ?? `import-${Date.now().toString(36)}`),
                name: String(json.name ?? 'Skill importada'),
                description: String(json.description ?? ''),
                skillType: json.skill_type ?? json.skillType ?? 'document',
                systemPrompt: String(json.system_prompt ?? json.systemPrompt ?? ''),
                reviewChecklist: json.review_checklist ?? json.reviewChecklist ?? [],
                visibilityRoles: json.visibility_roles ?? json.visibilityRoles ?? [],
              });
              navigate(`/skills/${skill.id}`);
            }}
          />
        </label>
      </div>

      {loading ? (
        <p>Cargando…</p>
      ) : (
        <>
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Tus skills ({agencySkills.length})</h2>
            {agencySkills.length === 0 ? (
              <p className="card" style={{ color: '#64748b' }}>
                Aún no tienes skills propias. Duplica una plantilla abajo o crea una nueva.
              </p>
            ) : (
              agencySkills.map((s) => (
                <div key={s.id} className="card">
                  <h3>{s.name}</h3>
                  <p style={{ color: '#64748b' }}>{s.description || s.skill_type}</p>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                    <Link to={`/skills/${s.id}`} className="btn" style={{ textDecoration: 'none' }}>
                      Editar
                    </Link>
                    <button type="button" className="btn secondary" onClick={() => exportSkill(s)}>
                      Exportar JSON
                    </button>
                  </div>
                </div>
              ))
            )}
          </section>

          <section>
            <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>
              Plantillas del sistema ({templates.length})
            </h2>
            {templates.map((s) => (
              <div key={s.id} className="card">
                <h3>{s.name}</h3>
                <p style={{ color: '#64748b' }}>{s.description || s.skill_type}</p>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                  <button type="button" className="btn" onClick={() => duplicateAndEdit(s.id)}>
                    Duplicar y editar
                  </button>
                  <button type="button" className="btn secondary" onClick={() => exportSkill(s)}>
                    Exportar JSON
                  </button>
                </div>
              </div>
            ))}
          </section>
        </>
      )}
    </div>
  );
}
