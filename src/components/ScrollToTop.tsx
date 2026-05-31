import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop: hace scroll al inicio de la página en cada cambio de ruta,
 * EXCEPTO cuando la navegación incluye un hash (#section), para no
 * interferir con los enlaces a secciones específicas (ej: API docs).
 */
export function ScrollToTop() {
    const { pathname, hash, search } = useLocation();
    const routeKey = `${pathname}${search}`;
    const prevRouteKey = useRef(routeKey);

    useEffect(() => {
        if (routeKey !== prevRouteKey.current && !hash) {
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        }
        prevRouteKey.current = routeKey;
    }, [routeKey, hash]);

    return null;
}
