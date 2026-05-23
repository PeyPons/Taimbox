import { useEffect, useState } from 'react';
import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import NewReviewPage from './pages/NewReviewPage';
import JobPage from './pages/JobPage';
import SkillsPage from './pages/SkillsPage';
import SkillEditorPage from './pages/SkillEditorPage';

function Shell({ session }: { session: Session }) {
  const navigate = useNavigate();
  return (
    <div className="layout">
      <nav className="nav">
        <strong>Review Agents</strong>
        <Link to="/">Inicio</Link>
        <Link to="/new">Nueva revisión</Link>
        <Link to="/skills">Skills</Link>
        <button
          type="button"
          className="btn secondary"
          onClick={async () => {
            await supabase.auth.signOut();
            navigate('/login');
          }}
        >
          Salir
        </button>
        <span style={{ marginLeft: 'auto', fontSize: '0.85rem', color: '#64748b' }}>
          {session.user.email}
        </span>
      </nav>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/new" element={<NewReviewPage />} />
        <Route path="/jobs/:id" element={<JobPage />} />
        <Route path="/skills" element={<SkillsPage />} />
        <Route path="/skills/new" element={<SkillEditorPage />} />
        <Route path="/skills/:id" element={<SkillEditorPage />} />
      </Routes>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (loading) return <div className="layout">Cargando…</div>;
  if (!session) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }
  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/*" element={<Shell session={session} />} />
    </Routes>
  );
}
