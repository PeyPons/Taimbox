import { useEffect } from "react";

/**
 * Parallax muy sutil sobre los blobs radiales `.blur-3xl` de cada sección below
 * en función del scroll del viewport. Sin librerías: lectura directa de scrollY +
 * rAF throttled. Coste despreciable; no se ejecuta con prefers-reduced-motion.
 */
export function useLandingBackgroundParallax(reduceMotion: boolean | null) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (reduceMotion) return;

    const blobs = Array.from(
      document.querySelectorAll<HTMLElement>(
        "[data-landing-below-section] .blur-3xl",
      ),
    );
    if (blobs.length === 0) return;

    // Cada blob obtiene un factor pseudo-aleatorio estable según su índice.
    const factors = blobs.map((_, i) => {
      const sign = i % 2 === 0 ? 1 : -1;
      return sign * (0.06 + ((i * 13) % 7) * 0.012);
    });

    let raf = 0;
    let pending = false;

    const tick = () => {
      pending = false;
      const sy = window.scrollY;
      blobs.forEach((blob, i) => {
        const f = factors[i];
        blob.style.transform = `translate3d(0, ${(sy * f).toFixed(1)}px, 0)`;
      });
    };

    const onScroll = () => {
      if (pending) return;
      pending = true;
      raf = requestAnimationFrame(tick);
    };

    tick();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [reduceMotion]);
}
