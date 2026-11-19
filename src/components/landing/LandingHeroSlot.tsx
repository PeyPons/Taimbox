import { useCallback, useRef } from "react";
import { useReducedMotion } from "motion/react";

import { LandingLiteralHero } from "@/components/landing/LandingLiteralHero";
import { useLandingHeroAmbientMotion } from "@/hooks/useLandingHeroAmbientMotion";
import { useLandingLiteralDomMotion } from "@/hooks/useLandingLiteralDomMotion";

/** Hero orbital. Solo se carga si el HTML no trae ya el hero prerenderizado. */
export function LandingHeroSlot() {
  const reduceMotion = useReducedMotion();
  const heroRef = useRef<HTMLElement | null>(null);
  const literalHeroDomMotion = useLandingLiteralDomMotion(reduceMotion);
  const setLiteralHeroRef = useCallback(
    (node: HTMLElement | null) => {
      heroRef.current = node;
      literalHeroDomMotion(node);
    },
    [literalHeroDomMotion],
  );
  useLandingHeroAmbientMotion(heroRef, reduceMotion);
  return <LandingLiteralHero ref={setLiteralHeroRef} reduceMotion={reduceMotion} />;
}
