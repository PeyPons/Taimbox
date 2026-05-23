import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
  const [skills, setSkills] = useState<Skill[]>([]);

  useEffect(() => {
    if (!agencyId) return;
    apiGet<{ skills: Skill[] }>(`/api/skills?agencyId=${agencyId}`).then((r) => setSkills(r.skills));
  }, [agencyId]);

  async function duplicate(id: string) {
    if (!agencyId) return;
    await apiPost(`/api/skills/${id}/duplicate`, { agencyId });
    const r = await apiGet<{ skills: Skill[] }>(`/api/skills?agencyId=${agencyId}`);
    setSkills(r.skills);
  }

  function exportSkill(s: Skill) {
    const blob = new Blob([JSON.stringify(s, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${s.slug}.json`;
    a.click();
  }

  return (
    <div>
      <h1>Skills de revisión</h1>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
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
              await apiPost('/api/skills', {
                agencyId,
                slug: String(json.slug ?? `import-${Date.now().toString(36)}`),
                name: String(json.name ?? 'Skill importada'),
                description: String(json.description ?? ''),
                skillType: json.skill_type ?? json.skillType ?? 'document',
                systemPrompt: String(json.system_prompt ?? json.systemPrompt ?? ''),
                reviewChecklist: json.review_checklist ?? json.reviewChecklist ?? [],
                visibilityRoles: json.visibility_roles ?? json.visibilityRoles ?? [],
              });
              const r = await apiGet<{ skills: Skill[] }>(`/api/skills?agencyId=${agencyId}`);
              setSkills(r.skills);
            }}
          />
        </label>
      </div>
      {skills.map((s) => (
        <div key={s.id} className="card">
          <h3>{s.name}</h3>
          <p style={{ color: '#64748b' }}>{s.description || s.skill_type}</p>
          {s.is_system_template ? (
            <button type="button" className="btn secondary" onClick={() => duplicate(s.id)}>
              Duplicar plantilla
            </button>
          ) : (
            <>
              <Link to={`/skills/${s.id}`}>Editar</Link>
              {' · '}
              <button type="button" className="btn secondary" onClick={() => exportSkill(s)}>
                Exportar JSON
              </button>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
