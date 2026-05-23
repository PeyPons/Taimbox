import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { apiGet, apiPost } from '../lib/api';
import { supabase } from '../lib/supabase';

interface Job {
  id: string;
  status: string;
  progress_pct: number;
  progress_message: string | null;
  result_markdown: string | null;
  error_message: string | null;
  live_preview: string | null;
  live_phase: string | null;
  live_updated_at: string | null;
}

interface Event {
  event_type: string;
  message: string;
  created_at: string;
}

const ACTIVE_STATUSES = ['queued', 'preprocessing', 'chunking', 'mapping', 'reducing'];

export default function JobPage() {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const liveRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    if (!id) return;
    const { job: j } = await apiGet<{ job: Job }>(`/api/jobs/${id}`);
    setJob(j);
    const { events: ev } = await apiGet<{ events: Event[] }>(`/api/jobs/${id}/events`);
    setEvents(ev);
  }, [id]);

  useEffect(() => {
    load();
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`job-${id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'review_jobs', filter: `id=eq.${id}` },
        (payload) => {
          const row = payload.new as Job;
          setJob((prev) => (prev ? { ...prev, ...row } : row));
        },
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

  useEffect(() => {
    if (liveRef.current) {
      liveRef.current.scrollTop = liveRef.current.scrollHeight;
    }
  }, [job?.live_preview]);

  async function cancel() {
    if (!id) return;
    await apiPost(`/api/jobs/${id}/cancel`, {});
    await load();
  }

  if (!job) return <p>Cargando…</p>;

  const isActive = ACTIVE_STATUSES.includes(job.status);
  const showLive = isActive && Boolean(job.live_preview?.trim());
  const livePhaseLabel =
    job.live_phase === 'reducing'
      ? 'Redactando informe final'
      : job.live_phase === 'mapping'
        ? 'Analizando contenido'
        : 'Procesando';

  return (
    <div>
      <h1>Revisión</h1>
      <div className="card">
        <p>
          <strong>Estado:</strong> {job.status}
          {isActive && <span className="live-pulse"> · en curso</span>}
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

      {(showLive || (isActive && ['mapping', 'reducing'].includes(job.status))) && (
        <div className="card live-panel">
          <div className="live-panel-header">
            <span className="live-dot" aria-hidden />
            <strong>{livePhaseLabel}</strong>
            <span className="live-hint">respuesta de Ollama en directo</span>
          </div>
          <div ref={liveRef} className="live-preview">
            {showLive ? (
              <>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{job.live_preview ?? ''}</ReactMarkdown>
                <span className="live-cursor" aria-hidden />
              </>
            ) : (
              <p className="live-waiting">
                <span className="live-dot" aria-hidden /> Esperando respuesta del modelo…
              </p>
            )}
          </div>
        </div>
      )}

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
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{job.result_markdown}</ReactMarkdown>
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
