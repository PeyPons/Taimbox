import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiGet } from '../lib/api';
import { formatRelativeTime } from '../lib/formatRelativeTime';
import { useAgency } from '../hooks/useAgency';
import EmptyAgencyCard from '../components/EmptyAgencyCard';
import JobStatusBadge from '../components/JobStatusBadge';

interface Job {
  id: string;
  status: string;
  progress_pct: number;
  progress_message: string | null;
  created_at: string;
  skill?: { name: string } | null;
}

type LoadState = 'idle' | 'loading' | 'ready' | 'error';

export default function HomePage() {
  const { agencyId, loading: agencyLoading, hasAgency } = useAgency();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const loadJobs = useCallback(async () => {
    if (!agencyId) return;
    setLoadState('loading');
    setErrorMessage('');
    try {
      const r = await apiGet<{ jobs: Job[] }>(`/api/jobs?agencyId=${agencyId}`);
      setJobs(r.jobs);
      setLoadState('ready');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Error al cargar revisiones');
      setLoadState('error');
    }
  }, [agencyId]);

  useEffect(() => {
    if (!agencyId) return;
    void loadJobs();
  }, [agencyId, loadJobs]);

  if (agencyLoading) return <p>Cargando agencia…</p>;
  if (!hasAgency) return <EmptyAgencyCard />;

  return (
    <div>
      <h1>Mis revisiones</h1>
      <Link to="/new" className="btn" style={{ display: 'inline-block', marginBottom: '1rem', textDecoration: 'none' }}>
        Nueva revisión
      </Link>

      {loadState === 'loading' && <p className="loading-hint">Cargando revisiones…</p>}

      {loadState === 'error' && (
        <div className="card">
          <p className="error">{errorMessage}</p>
          <button type="button" className="btn secondary" onClick={() => void loadJobs()}>
            Reintentar
          </button>
        </div>
      )}

      {loadState === 'ready' && jobs.length === 0 && (
        <p className="card">Aún no hay revisiones. Crea la primera con el botón de arriba.</p>
      )}

      {loadState === 'ready' &&
        jobs.map((j) => (
          <Link key={j.id} to={`/jobs/${j.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
                <div>
                  <JobStatusBadge status={j.status} />
                  {j.skill?.name && (
                    <span style={{ marginLeft: '0.5rem', color: '#64748b', fontSize: '0.9rem' }}>
                      {j.skill.name}
                    </span>
                  )}
                </div>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }} title={new Date(j.created_at).toLocaleString('es-ES')}>
                  {formatRelativeTime(j.created_at)}
                </span>
              </div>
              <div className="progress" style={{ marginTop: '0.5rem' }}>
                <div style={{ width: `${j.progress_pct}%` }} />
              </div>
              {j.progress_message && (
                <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem' }}>{j.progress_message}</p>
              )}
            </div>
          </Link>
        ))}
    </div>
  );
}
