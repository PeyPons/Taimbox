import { lazy, Suspense } from "react";

type LandingBelowMotionSectionsProps = {
  reduceMotion: boolean | null;
};

const SECTIONS = [
  lazy(() =>
    import("@/components/landing/below/LandingBelowSection01").then((mod) => ({
      default: mod.LandingBelowSection01,
    })),
  ),
  lazy(() =>
    import("@/components/landing/below/LandingBelowSection02").then((mod) => ({
      default: mod.LandingBelowSection02,
    })),
  ),
  lazy(() =>
    import("@/components/landing/below/LandingBelowSection03").then((mod) => ({
      default: mod.LandingBelowSection03,
    })),
  ),
  lazy(() =>
    import("@/components/landing/below/LandingBelowSection04").then((mod) => ({
      default: mod.LandingBelowSection04,
    })),
  ),
  lazy(() =>
    import("@/components/landing/below/LandingBelowSection05").then((mod) => ({
      default: mod.LandingBelowSection05,
    })),
  ),
  lazy(() =>
    import("@/components/landing/below/LandingBelowSection06").then((mod) => ({
      default: mod.LandingBelowSection06,
    })),
  ),
  lazy(() =>
    import("@/components/landing/below/LandingBelowSection07").then((mod) => ({
      default: mod.LandingBelowSection07,
    })),
  ),
  lazy(() =>
    import("@/components/landing/below/LandingBelowSection08").then((mod) => ({
      default: mod.LandingBelowSection08,
    })),
  ),
  lazy(() =>
    import("@/components/landing/below/LandingBelowSection09").then((mod) => ({
      default: mod.LandingBelowSection09,
    })),
  ),
];

/**
 * Bloques inferiores de la home, en trozos. El primer pintado no espera a evaluarlos juntos.
 */
export function LandingBelowMotionSections({ reduceMotion }: LandingBelowMotionSectionsProps) {
  void reduceMotion;
  return (
    <div className="relative isolate">
      {SECTIONS.map((Section, index) => (
        <Suspense key={index} fallback={null}>
          <div data-landing-below-section={index + 1}>
            <Section />
          </div>
        </Suspense>
      ))}
    </div>
  );
}
