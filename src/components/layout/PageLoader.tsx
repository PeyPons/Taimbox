/** Spinner a pantalla completa mientras carga una ruta lazy. */
export function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="h-8 w-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );
}

/** Spinner dentro del área de contenido (no tapa sidebar/header). */
export function RouteContentLoader() {
  return (
    <div className="flex min-h-[50vh] w-full items-center justify-center">
      <div className="h-8 w-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );
}
