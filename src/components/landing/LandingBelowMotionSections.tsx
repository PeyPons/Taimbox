import { LANDING_BELOW_SECTION_BODIES_ORDERED } from "@/components/landing/below/LandingBelowSectionBodies";

type LandingBelowMotionSectionsProps = {
  reduceMotion: boolean | null;
};

/**
 * Bloques inferiores de la home. Sin fade de entrada: el motion de la portada
 * es la órbita del hero y el cambio de fase al hacer scroll.
 */
export function LandingBelowMotionSections({ reduceMotion }: LandingBelowMotionSectionsProps) {
  void reduceMotion;
  if (import.meta.env.DEV && LANDING_BELOW_SECTION_BODIES_ORDERED.length !== 9) {
    console.warn(
      "[LandingBelowMotionSections] Se esperaban 9 secciones, hay:",
      LANDING_BELOW_SECTION_BODIES_ORDERED.length,
    );
  }

  return (
    <div className="relative isolate">
      {LANDING_BELOW_SECTION_BODIES_ORDERED.map((Section, i) => (
        <div key={`below-${i}`} data-landing-below-section={i + 1}>
          <Section />
        </div>
      ))}
    </div>
  );
}
