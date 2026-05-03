import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop: hace scroll al inicio de la página en cada cambio de ruta,
 * EXCEPTO cuando la navegación incluye un hash (#section), para no
 * interferir con los enlaces a secciones específicas (ej: API docs).
 */
export function ScrollToTop() {
    const { pathname, hash } = useLocation();
    const prevPathname = useRef(pathname);

    useEffect(() => {
        // Solo hacer scroll al top si:
        // 1. El pathname ha cambiado (navegación entre páginas distintas)
        // 2. No hay hash en la URL (si hay hash, el navegador/componente lo gestiona)
        if (pathname !== prevPathname.current && !hash) {
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        }
        prevPathname.current = pathname;
    }, [pathname, hash]);

    return null;
}
