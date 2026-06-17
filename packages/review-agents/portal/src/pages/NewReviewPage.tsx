import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiGet, apiPost } from '../lib/api';
import { supabase } from '../lib/supabase';
import { useAgency } from '../hooks/useAgency';
import EmptyAgencyCard from '../components/EmptyAgencyCard';

interface Skill {
  id: string;
  name: string;
  skill_type: string;
}

export default function NewReviewPage() {
  const { agencyId, loading: agencyLoading, hasAgency } = useAgency();
  const navigate = useNavigate();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [skillsLoading, setSkillsLoading] = useState(true);
  const [skillsError, setSkillsError] = useState('');
  const [skillId, setSkillId] = useState('');
  const [url, setUrl] = useState('');
  const [paste, setPaste] = useState('');
  const [files, setFiles] = useState<FileList | null>(null);
  const [notify, setNotify] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!agencyId) {
      setSkillsLoading(false);
      return;
    }
    setSkillsLoading(true);
    setSkillsError('');
    apiGet<{ skills: Skill[] }>(`/api/skills?agencyId=${agencyId}`)
      .then((r) => {
        setSkills(r.skills);
        if (r.skills[0]) setSkillId(r.skills[0].id);
      })
      .catch((err) => setSkillsError(err instanceof Error ? err.message : 'Error al cargar skills'))
      .finally(() => setSkillsLoading(false));
  }, [agencyId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!agencyId || !skillId) return;
    setSubmitting(true);
    setError('');
    try {
      const inputs: Array<Record<string, string>> = [];
      if (url.trim()) inputs.push({ type: 'url', sourceUrl: url.trim() });
      if (paste.trim()) inputs.push({ type: 'paste', text: paste });
      const hasFiles = files && files.length > 0;
      if (inputs.length === 0 && !hasFiles) {
        setError('Añade al menos una URL, texto o archivo.');
        setSubmitting(false);
        return;
      }
      const { job } = await apiPost<{ job: { id: string } }>('/api/jobs', {
        agencyId,
        skillId,
        notifyOnComplete: notify,
        startImmediately: !hasFiles,
        inputs,
      });

      if (hasFiles) {
        for (const file of Array.from(files)) {
          const sign = await apiPost<{ path: string; token: string }>('/api/uploads/sign', {
            agencyId,
            jobId: job.id,
            filename: file.name,
          });
          await supabase.storage.from('review-documents').uploadToSignedUrl(sign.path, sign.token, file);
          await apiPost(`/api/jobs/${job.id}/inputs`, {
            type: 'file',
            storagePath: sign.path,
            filename: file.name,
          });
        }
        await apiPost(`/api/jobs/${job.id}/enqueue`, {});
      }

      navigate(`/jobs/${job.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setSubmitting(false);
    }
  }

  if (agencyLoading) return <p>Cargando agencia…</p>;
  if (!hasAgency) return <EmptyAgencyCard />;

  if (skillsLoading) return <p className="loading-hint">Cargando skills…</p>;

  if (skillsError) {
    return (
      <div className="card">
        <p className="error">{skillsError}</p>
      </div>
    );
  }

  if (skills.length === 0) {
    return (
      <div>
        <h1>Nueva revisión</h1>
        <div className="card">
          <p style={{ color: '#64748b' }}>
            Necesitas al menos una skill de revisión antes de empezar. Crea una nueva o duplica una plantilla
            del sistema.
          </p>
          <Link to="/skills/new" className="btn" style={{ display: 'inline-block', textDecoration: 'none' }}>
            Crear skill
          </Link>
          <Link
            to="/skills"
            className="btn secondary"
            style={{ display: 'inline-block', textDecoration: 'none', marginLeft: '0.5rem' }}
          >
            Ver skills
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1>Nueva revisión</h1>
      <form className="card" onSubmit={onSubmit}>
        <label>
          Skill
          <select value={skillId} onChange={(e) => setSkillId(e.target.value)} required>
            {skills.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.skill_type})
              </option>
            ))}
          </select>
        </label>
        <label>
          URL (opcional)
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
        </label>
        <label>
          Texto o notas (opcional)
          <textarea rows={6} value={paste} onChange={(e) => setPaste(e.target.value)} />
        </label>
        <label>
          Archivos PDF, DOCX, TXT (opcional)
          <input type="file" multiple accept=".pdf,.docx,.txt,.md" onChange={(e) => setFiles(e.target.files)} />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} />
          Avisar por email al completar
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" className="btn" disabled={submitting} style={{ marginTop: '1rem' }}>
          {submitting ? 'Enviando…' : 'Iniciar revisión'}
        </button>
      </form>
    </div>
  );
}
