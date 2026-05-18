import type { FC } from "react";

/** Variantes de path ya usadas en la home — no cambiar sin revisar continuidad visual. */
export type LandingSectionWaveVariant =
  | "topIntoWhite"
  | "bottomIntoCream"
  | "bottomIntoWhite";

const PATHS: Record<LandingSectionWaveVariant, string> = {
  topIntoWhite: "M0,120 L1440,120 L1440,40 C1080,90 360,90 0,40 Z",
  bottomIntoCream: "M0,100 C360,20 1080,20 1440,100 L1440,120 L0,120 Z",
  bottomIntoWhite: "M0,80 C320,40 640,120 880,90 C1120,60 1280,90 1440,70 L1440,120 L0,120 Z",
};

type LandingSectionWaveProps = {
  position: "top" | "bottom";
  fill: string;
  variant: LandingSectionWaveVariant;
};

/** Onda SVG entre secciones (misma geometría que el diseño original). */
export const LandingSectionWave: FC<LandingSectionWaveProps> = ({ position, fill, variant }) => {
  const isTop = position === "top";
  return (
    <svg
      aria-hidden
      className={
        isTop
          ? "absolute left-0 right-0 -top-px w-full h-12 sm:h-16 lg:h-20 pointer-events-none"
          : "absolute left-0 right-0 bottom-0 w-full pointer-events-none h-14 sm:h-20"
      }
      viewBox="0 0 1440 120"
      preserveAspectRatio="none"
    >
      <path d={PATHS[variant]} fill={fill} />
    </svg>
  );
};
