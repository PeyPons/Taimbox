import { useEffect, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import NewReviewPage from './pages/NewReviewPage';
import JobPage from './pages/JobPage';
import SkillsPage from './pages/SkillsPage';
import SkillEditorPage from './pages/SkillEditorPage';
import NotFoundPage from './pages/NotFoundPage';

const ROUTE_TITLES: Record<string, string> = {
  '/': 'Inicio',
  '/new': 'Nueva revisión',
  '/skills': 'Skills',
  '/skills/new': 'Nueva skill',
};

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  const location = useLocation();
  const active = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
  return (
    <Link to={to} className={active ? 'nav-link nav-link-active' : 'nav-link'}>
      {children}
    </Link>
  );
}

function Shell({ session }: { session: Session }) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname.startsWith('/jobs/')) return;
    const title =
      ROUTE_TITLES[location.pathname] ??
      (location.pathname.startsWith('/skills/') ? 'Editar skill' : undefined);
    document.title = title ? `${title} — Review Agents` : 'Review Agents';
  }, [location.pathname]);

  return (
    <div className="layout">
      <nav className="nav" aria-label="Principal">
        <strong>Review Agents</strong>
        <NavLink to="/">Inicio</NavLink>
        <NavLink to="/new">Nueva revisión</NavLink>
        <NavLink to="/skills">Skills</NavLink>
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
        <span className="nav-email">{session.user.email}</span>
      </nav>
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/new" element={<NewReviewPage />} />
          <Route path="/jobs/:id" element={<JobPage />} />
          <Route path="/skills" element={<SkillsPage />} />
          <Route path="/skills/new" element={<SkillEditorPage />} />
          <Route path="/skills/:id" element={<SkillEditorPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
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
