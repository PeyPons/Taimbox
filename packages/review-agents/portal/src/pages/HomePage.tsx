import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiGet } from '../lib/api';
import { useAgency } from '../hooks/useAgency';

interface Job {
  id: string;
  status: string;
  progress_pct: number;
  progress_message: string | null;
  created_at: string;
}

export default function HomePage() {
  const { agencyId, loading: agencyLoading } = useAgency();
  const [jobs, setJobs] = useState<Job[]>([]);

  useEffect(() => {
    if (!agencyId) return;
    apiGet<{ jobs: Job[] }>(`/api/jobs?agencyId=${agencyId}`).then((r) => setJobs(r.jobs));
  }, [agencyId]);

  if (agencyLoading) return <p>Cargando agencia…</p>;

  return (
    <div>
      <h1>Mis revisiones</h1>
      <Link to="/new" className="btn" style={{ display: 'inline-block', marginBottom: '1rem', textDecoration: 'none' }}>
        Nueva revisión
      </Link>
      {jobs.length === 0 && <p className="card">Aún no hay revisiones.</p>}
      {jobs.map((j) => (
        <Link key={j.id} to={`/jobs/${j.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong>{j.status}</strong>
              <span>{new Date(j.created_at).toLocaleString('es-ES')}</span>
            </div>
            <div className="progress" style={{ marginTop: '0.5rem' }}>
              <div style={{ width: `${j.progress_pct}%` }} />
            </div>
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem' }}>{j.progress_message}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
