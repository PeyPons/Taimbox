import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="card">
      <h1 style={{ marginTop: 0 }}>Página no encontrada</h1>
      <p style={{ color: '#64748b' }}>La ruta que buscas no existe en el portal de revisión.</p>
      <Link to="/" className="btn" style={{ display: 'inline-block', textDecoration: 'none' }}>
        Volver al inicio
      </Link>
    </div>
  );
}
