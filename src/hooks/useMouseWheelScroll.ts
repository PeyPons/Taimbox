import { useEffect, useRef } from 'react';

/**
 * Permite scroll con rueda del ratón dentro de modales Radix (react-remove-scroll
 * bloquea wheel en contenedores anidados fuera del shard principal).
 */
export function useMouseWheelScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onWheel = (event: WheelEvent) => {
      if (el.scrollHeight <= el.clientHeight) return;

      const { scrollTop, scrollHeight, clientHeight } = el;
      const deltaY = event.deltaY;
      const atTop = scrollTop <= 0;
      const atBottom = scrollTop + clientHeight >= scrollHeight - 1;

      if ((deltaY < 0 && atTop) || (deltaY > 0 && atBottom)) return;

      el.scrollTop += deltaY;
      event.preventDefault();
      event.stopPropagation();
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  return ref;
}
