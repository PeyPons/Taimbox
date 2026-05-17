import { animate } from "motion";
import { useEffect } from "react";

/**
 * Efectos ambientales del hero literal: co-rotación de las 3 fichas orbitales (Ana / Carlos / Sugerencia)
 * y "breathing" sutil del número central (47h). Complementa `useLandingLiteralDomMotion` (órbita SVG + ticker).
 *
 * Las fichas orbitan alrededor del centro: el contenedor exterior `aria-hidden` rota +360° en T segundos
 * mientras el contenedor interior `.pointer-events-auto` contrarrota −360° para que la tarjeta siempre
 * mire al espectador (no quede al revés en la parte inferior del círculo).
 *
 * Ignoramos `prefers-reduced-motion` porque es micro-motion continuo decorativo (parte de la identidad
 * visual). El parámetro `reduceMotion` se mantiene en la signatura para compatibilidad.
 */
export function useLandingHeroAmbientMotion(
  ref: React.RefObject<HTMLElement | null>,
  _reduceMotion: boolean | null,
) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = ref.current;
    if (!root) return;

    const stops: Array<() => void> = [];

    // Cada ficha vive en un par (outer "aria-hidden" con rotate inline, inner "pointer-events-auto"
    // con contra-rotate inline). Co-rotamos ambos: outer +360°, inner −360°, T idéntico.
    // Período: 96s (igual que la órbita SVG) → las fichas "acompañan" a los segmentos.
    const ORBIT_DURATION_S = 96;

    const orbitOuters = Array.from(
      root.querySelectorAll<HTMLElement>(
        "div[aria-hidden='true'].absolute.top-1\\/2.left-1\\/2",
      ),
    );

    const parseRotateDeg = (transform: string | null): number => {
      if (!transform) return 0;
      const m = /rotate\(([-\d.]+)deg\)/.exec(transform);
      return m ? parseFloat(m[1]) : 0;
    };

    orbitOuters.forEach((outer) => {
      const outerStart = parseRotateDeg(outer.style.transform);
      const inner = outer.querySelector<HTMLElement>(
        ".pointer-events-auto",
      );
      const innerStart = inner ? parseRotateDeg(inner.style.transform) : 0;

      // willChange durante toda la vida del componente: cambian transform en cada frame.
      outer.style.willChange = "transform";
      if (inner) inner.style.willChange = "transform";

      const ctrlOuter = animate(outerStart, outerStart + 360, {
        duration: ORBIT_DURATION_S,
        repeat: Infinity,
        ease: "linear",
        onUpdate: (v) => {
          outer.style.transform = `rotate(${v}deg)`;
        },
      });
      stops.push(() => ctrlOuter.stop());

      if (inner) {
        const ctrlInner = animate(innerStart, innerStart - 360, {
          duration: ORBIT_DURATION_S,
          repeat: Infinity,
          ease: "linear",
          onUpdate: (v) => {
            inner.style.transform = `rotate(${v}deg)`;
          },
        });
        stops.push(() => ctrlInner.stop());
      }
    });

    // Breathing del número central de horas (47h). Usamos la forma value→onUpdate
    // (en lugar de animate(element, { scale }) ) para sortear el respeto interno
    // que motion hace a `prefers-reduced-motion` en su animador de elementos.
    const centerNumber = root.querySelector<HTMLElement>(
      ".text-6xl.tabular-nums",
    );
    if (centerNumber) {
      centerNumber.style.willChange = "transform";
      const ctrl = animate(0, 1, {
        duration: 4.4,
        repeat: Infinity,
        repeatType: "loop",
        ease: "easeInOut",
        onUpdate: (v) => {
          // Triangular: 0..0.5 sube de 1 a 1.03, 0.5..1 baja de 1.03 a 1
          const s = v < 0.5 ? 1 + v * 2 * 0.03 : 1 + (1 - v) * 2 * 0.03;
          centerNumber.style.transform = `scale(${s})`;
        },
      });
      stops.push(() => ctrl.stop());
    }

    return () => {
      stops.forEach((s) => s());
    };
  }, [ref]);
}
