import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { apiGet, apiPost } from '../lib/api';
import { supabase } from '../lib/supabase';
import { useAgency } from '../hooks/useAgency';

interface Job {
  id: string;
  status: string;
  progress_pct: number;
  progress_message: string | null;
  result_markdown: string | null;
  error_message: string | null;
}

interface Event {
  event_type: string;
  message: string;
  created_at: string;
}

export default function JobPage() {
  const { id } = useParams<{ id: string }>();
  const { agencyId } = useAgency();
  const [job, setJob] = useState<Job | null>(null);
  const [events, setEvents] = useState<Event[]>([]);

  const load = useCallback(async () => {
    if (!id) return;
    const { job: j } = await apiGet<{ job: Job }>(`/api/jobs/${id}`);
    setJob(j);
    const { events: ev } = await apiGet<{ events: Event[] }>(`/api/jobs/${id}/events`);
    setEvents(ev);
  }, [id]);

  useEffect(() => {
    load();
    const t = setInterval(load, 10_000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`job-${id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'review_jobs', filter: `id=eq.${id}` },
        () => load(),
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'review_job_events', filter: `job_id=eq.${id}` },
        () => load(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [id, load]);

  async function cancel() {
    if (!id) return;
    await apiPost(`/api/jobs/${id}/cancel`, {});
    await load();
  }

  if (!job) return <p>Cargando…</p>;

  return (
    <div>
      <h1>Revisión</h1>
      <div className="card">
        <p>
          <strong>Estado:</strong> {job.status}
        </p>
        <div className="progress" style={{ margin: '0.75rem 0' }}>
          <div style={{ width: `${job.progress_pct}%` }} />
        </div>
        <p>{job.progress_message}</p>
        {job.error_message && <p className="error">{job.error_message}</p>}
        {!['completed', 'failed', 'cancelled'].includes(job.status) && (
          <button type="button" className="btn secondary" onClick={cancel}>
            Cancelar
          </button>
        )}
      </div>
      <div className="card">
        <h3>Actividad</h3>
        <ul className="timeline">
          {events.map((e, i) => (
            <li key={i}>
              {new Date(e.created_at).toLocaleTimeString('es-ES')} — {e.message}
            </li>
          ))}
        </ul>
      </div>
      {job.status === 'completed' && job.result_markdown && (
        <div className="card markdown-body">
          <h3>Informe</h3>
          <ReactMarkdown>{job.result_markdown}</ReactMarkdown>
          <button
            type="button"
            className="btn secondary"
            style={{ marginTop: '1rem' }}
            onClick={() => {
              const blob = new Blob([job.result_markdown ?? ''], { type: 'text/markdown' });
              const a = document.createElement('a');
              a.href = URL.createObjectURL(blob);
              a.download = `revision-${id}.md`;
              a.click();
            }}
          >
            Exportar Markdown
          </button>
        </div>
      )}
    </div>
  );
}
