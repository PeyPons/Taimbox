import { cn } from "@/lib/utils";

/**
 * Marca de línea de la web pública.
 * El SVG de la línea A (propuesta 18-11-2026) no estaba en el repositorio:
 * trazo único, reloj dentro de la caja, sin gradiente. Sustituir por el
 * fichero oficial cuando llegue. El panel sigue con `TaimboxLogo`.
 */
export type PublicTone = "ink" | "paper";

const TONE = {
  ink: { stroke: "#1c1915", hand: "#9a3412", word: "text-[#1c1915]" },
  paper: { stroke: "#f3efe6", hand: "#e7d7c3", word: "text-[#f3efe6]" },
} as const;

export function PublicMark({
  className,
  tone = "ink",
}: {
  className?: string;
  tone?: PublicTone;
}) {
  const colors = TONE[tone];
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      fill="none"
      role="img"
      aria-hidden
      className={cn("shrink-0", className)}
    >
      <rect
        x="2.75"
        y="2.75"
        width="26.5"
        height="26.5"
        rx="1.5"
        stroke={colors.stroke}
        strokeWidth="1.25"
      />
      <path d="M16 16.2 V8.2" stroke={colors.hand} strokeWidth="1.6" strokeLinecap="square" />
      <path d="M16 16.2 L21.6 19" stroke={colors.stroke} strokeWidth="1.25" strokeLinecap="square" />
      <circle cx="16" cy="16.2" r="1.15" fill={colors.stroke} />
    </svg>
  );
}

export function PublicWordmark({
  className,
  tone = "ink",
  markClassName = "h-7 w-7",
}: {
  className?: string;
  tone?: PublicTone;
  markClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <PublicMark className={markClassName} tone={tone} />
      <span
        className={cn(
          "font-public text-[1.35rem] leading-none tracking-[-0.03em]",
          TONE[tone].word,
        )}
      >
        Taimbox
      </span>
    </span>
  );
}
