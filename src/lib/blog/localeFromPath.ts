/** Idioma público del blog según la URL (más fiable que i18n en rutas /en/). */
export function blogLocaleFromPathname(pathname: string): 'es' | 'en' {
  const p = (pathname.split('?')[0] ?? pathname).replace(/\/+$/, '') || '/';
  return p === '/en' || p.startsWith('/en/') ? 'en' : 'es';
}
