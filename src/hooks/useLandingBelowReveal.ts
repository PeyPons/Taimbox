import { animate } from "motion";
import { useLayoutEffect } from "react";

/**
 * Stagger-reveal de los hijos directos del wrapper de contenido de cada sección below.
 * El HTML literal trae `opacity: 1; transform: none;` baked-in (post-animación). Forzamos el estado inicial por DOM
 * antes del paint (useLayoutEffect) y animamos cuando la sección entra en viewport — sin tocar los blobs literales.
 */
export function useLandingBelowReveal(reduceMotion: boolean | null) {
  useLayoutEffect(() => {
    if (typeof window === "undefined") return;

    const sections = Array.from(
      document.querySelectorAll<HTMLElement>("[data-landing-below-section]"),
    );
    if (sections.length === 0) return;

    type Prep = { section: HTMLElement; children: HTMLElement[] };
    const preps: Prep[] = [];

    for (const section of sections) {
      const wrapper = section.querySelector<HTMLElement>(
        ".relative[class*='max-w-'].mx-auto",
      );
      if (!wrapper) continue;
      const children = Array.from(wrapper.children) as HTMLElement[];
      if (children.length === 0) continue;

      if (reduceMotion) {
        children.forEach((c) => {
          c.style.opacity = "1";
          c.style.transform = "none";
        });
      } else {
        children.forEach((c) => {
          c.style.opacity = "0";
          c.style.transform = "translateY(28px)";
          c.style.willChange = "opacity, transform";
        });
      }

      preps.push({ section, children });
    }

    if (reduceMotion || preps.length === 0) return;

    const stops: Array<() => void> = [];

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const prep = preps.find((p) => p.section === entry.target);
          if (!prep) continue;
          prep.children.forEach((child, i) => {
            // value→onUpdate evita el animador de elementos de motion (que respeta
            // `prefers-reduced-motion` internamente y haría duration:0 aunque ya
            // bypaseemos el chequeo en este hook).
            const ctrl = animate(0, 1, {
              duration: 0.62,
              delay: Math.min(i, 5) * 0.085,
              ease: [0.22, 1, 0.36, 1],
              onUpdate: (v) => {
                child.style.opacity = String(v);
                child.style.transform = `translateY(${(1 - v) * 28}px)`;
              },
              onComplete: () => {
                child.style.willChange = "";
              },
            });
            stops.push(() => ctrl.stop());
          });
          io.unobserve(entry.target);
        }
      },
      { threshold: 0.14, rootMargin: "0px 0px -8% 0px" },
    );

    preps.forEach(({ section }) => io.observe(section));

    return () => {
      io.disconnect();
      stops.forEach((s) => s());
    };
  }, [reduceMotion]);
}
