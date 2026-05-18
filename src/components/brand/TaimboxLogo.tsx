import { cn } from "@/lib/utils";

export type TaimboxClockVariant = "light" | "dark";

const STROKES: Record<
  TaimboxClockVariant,
  { outer: string; inner: string; hand: string; dot: string; center: string }
> = {
  light: {
    outer: "rgba(15,23,42,0.30)",
    inner: "rgba(15,23,42,0.15)",
    hand: "#7c3aed",
    dot: "#a855f7",
    center: "rgba(124,58,237,0.95)",
  },
  dark: {
    outer: "rgba(255,255,255,0.28)",
    inner: "rgba(255,255,255,0.14)",
    hand: "#a78bfa",
    dot: "#c084fc",
    center: "rgba(167,139,250,0.95)",
  },
};

export type TaimboxMarkProps = React.SVGProps<SVGSVGElement> & {
  variant?: TaimboxClockVariant;
  animated?: boolean;
};

/** Reloj circular del hero de la home (manecilla en movimiento). */
export function TaimboxMark({
  className,
  variant = "light",
  animated = true,
  ...props
}: TaimboxMarkProps) {
  const colors = STROKES[variant];

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 14 14"
      fill="none"
      role="img"
      aria-label="Taimbox"
      className={cn("shrink-0", className)}
      {...props}
    >
      <circle cx="7" cy="7" r="5.5" stroke={colors.outer} strokeWidth="1" fill="none" />
      <circle
        cx="7"
        cy="7"
        r="2.5"
        stroke={colors.inner}
        strokeWidth="0.75"
        fill="none"
        strokeDasharray="1 1.5"
      />
      <g
        className={cn(
          animated && "motion-reduce:animate-none animate-[spin_24s_linear_infinite]",
        )}
        style={{ transformOrigin: "50% 50%", transformBox: "fill-box" }}
      >
        <line
          x1="7"
          y1="7"
          x2="7"
          y2="2"
          stroke={colors.hand}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle cx="7" cy="2" r="1.2" fill={colors.dot} />
      </g>
      <circle cx="7" cy="7" r="1" fill={colors.center} />
    </svg>
  );
}

export type TaimboxLogoProps = {
  showWordmark?: boolean;
  className?: string;
  markClassName?: string;
  wordmarkClassName?: string;
  variant?: TaimboxClockVariant;
  animated?: boolean;
};

export function TaimboxLogo({
  showWordmark = true,
  className,
  markClassName = "h-8 w-8",
  wordmarkClassName = "font-bold tracking-tight",
  variant = "light",
  animated = true,
}: TaimboxLogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <TaimboxMark
        className={markClassName}
        variant={variant}
        animated={animated}
        aria-hidden={showWordmark}
      />
      {showWordmark && <span className={wordmarkClassName}>Taimbox</span>}
    </span>
  );
}
