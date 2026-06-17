export default function EmptyAgencyCard() {
  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>No tienes agencia asignada</h2>
      <p style={{ color: '#64748b' }}>
        Tu cuenta no está vinculada a ninguna agencia en Taimbox. Contacta con el administrador de tu
        organización o abre la app principal para comprobar tu acceso.
      </p>
      <a href="https://app.taimbox.com" className="btn" style={{ display: 'inline-block', textDecoration: 'none' }}>
        Ir a Taimbox
      </a>
    </div>
  );
}
