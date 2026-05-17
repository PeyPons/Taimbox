import type { FC } from "react";

import { LandingBelowSection01 } from "@/components/landing/below/LandingBelowSection01";
import { LandingBelowSection02 } from "@/components/landing/below/LandingBelowSection02";
import { LandingBelowSection03 } from "@/components/landing/below/LandingBelowSection03";
import { LandingBelowSection04 } from "@/components/landing/below/LandingBelowSection04";
import { LandingBelowSection05 } from "@/components/landing/below/LandingBelowSection05";
import { LandingBelowSection06 } from "@/components/landing/below/LandingBelowSection06";
import { LandingBelowSection07 } from "@/components/landing/below/LandingBelowSection07";
import { LandingBelowSection08 } from "@/components/landing/below/LandingBelowSection08";
import { LandingBelowSection09 } from "@/components/landing/below/LandingBelowSection09";

/** Orden fijo de secciones bajo el hero (antes `01.html` … `09.html`; ahora todo en TSX). */
export const LANDING_BELOW_SECTION_BODIES_ORDERED: readonly FC[] = [
  LandingBelowSection01,
  LandingBelowSection02,
  LandingBelowSection03,
  LandingBelowSection04,
  LandingBelowSection05,
  LandingBelowSection06,
  LandingBelowSection07,
  LandingBelowSection08,
  LandingBelowSection09,
];
