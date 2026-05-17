import { useCallback, useRef } from "react";
import { animate } from "motion";

const STATUS_CYCLE_MS = 3200;
const STATUS_SLIDE_S = 0.45;

/**
 * Animaciones DOM sobre el HTML literal del hero (ticker infinito + rotación SVG + status ticker vertical).
 * Devuelve un callback ref para enganchar el `<section>`.
 *
 * Ignora `prefers-reduced-motion` — decorativo continuo, parte de la identidad visual.
 */
export function useLandingLiteralDomMotion(_reduceMotion: boolean | null) {
  const stopRef = useRef<Array<() => void>>([]);

  return useCallback(
    (root: HTMLElement | null) => {
      stopRef.current.forEach((fn) => fn());
      stopRef.current = [];
      if (!root) return;

      const ticker = root.querySelector<HTMLElement>(".js-landing-ticker");
      const orbit = root.querySelector<HTMLElement>(".js-landing-orbit-svg");

      if (ticker) {
        const ctrl = animate(0, -1600, {
          duration: 48,
          repeat: Infinity,
          ease: "linear",
          onUpdate: (v) => {
            ticker.style.transform = `translate3d(${v}px,0,0)`;
          },
        });
        stopRef.current.push(() => ctrl.stop());
      }

      if (orbit) {
        const ctrl = animate(0, 360, {
          duration: 96,
          repeat: Infinity,
          ease: "linear",
          onUpdate: (v) => {
            orbit.style.transform = `rotate(${v}deg)`;
          },
        });
        stopRef.current.push(() => ctrl.stop());
      }

      // Vertical status ticker (hero team stats)
      const statusContainer = root.querySelector<HTMLElement>("[data-hero-status-ticker]");
      if (statusContainer) {
        const items = Array.from(statusContainer.querySelectorAll<HTMLElement>("[data-hero-status-item]"));
        if (items.length > 1) {
          let current = 0;

          const cycle = () => {
            const prev = current;
            current = (current + 1) % items.length;
            const outEl = items[prev];
            const inEl = items[current];

            // Slide out upward
            const ctrlOut = animate(0, 1, {
              duration: STATUS_SLIDE_S,
              ease: [0.22, 1, 0.36, 1],
              onUpdate: (p) => {
                outEl.style.opacity = String(1 - p);
                outEl.style.transform = `translateY(${-p * 100}%)`;
              },
            });
            stopRef.current.push(() => ctrlOut.stop());

            // Slide in from below
            const ctrlIn = animate(0, 1, {
              duration: STATUS_SLIDE_S,
              ease: [0.22, 1, 0.36, 1],
              onUpdate: (p) => {
                inEl.style.opacity = String(p);
                inEl.style.transform = `translateY(${(1 - p) * 100}%)`;
              },
            });
            stopRef.current.push(() => ctrlIn.stop());
          };

          const timer = window.setInterval(cycle, STATUS_CYCLE_MS);
          stopRef.current.push(() => window.clearInterval(timer));
        }
      }
    },
    [],
  );
}
