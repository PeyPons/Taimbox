import { motion } from "motion/react";

import { LANDING_BELOW_SECTION_BODIES_ORDERED } from "@/components/landing/below/LandingBelowSectionBodies";

type LandingBelowMotionSectionsProps = {
  reduceMotion: boolean | null;
};

/**
 * Bloques inferiores de la home (9 componentes con HTML literal; Motion al scroll).
 * Secciones en `LandingBelowSectionBodies` (TSX).
 */
export function LandingBelowMotionSections({ reduceMotion }: LandingBelowMotionSectionsProps) {
  if (import.meta.env.DEV && LANDING_BELOW_SECTION_BODIES_ORDERED.length !== 9) {
    console.warn(
      "[LandingBelowMotionSections] Se esperaban 9 secciones, hay:",
      LANDING_BELOW_SECTION_BODIES_ORDERED.length,
    );
  }

  const prefersReduced = reduceMotion === true;

  return (
    <div className="relative isolate">
      {LANDING_BELOW_SECTION_BODIES_ORDERED.map((Section, i) => (
        <motion.div
          key={`below-${i}`}
          data-landing-below-section={i + 1}
          initial={prefersReduced ? false : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{
            once: true,
            /** Cualquier intersección: con `amount` alto una sección muy alta puede quedar en opacity 0 al hacer scroll rápido. */
            amount: "some",
            margin: "0px 0px 24% 0px",
          }}
          transition={
            prefersReduced
              ? { duration: 0 }
              : { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
          }
        >
          <Section />
        </motion.div>
      ))}
    </div>
  );
}
