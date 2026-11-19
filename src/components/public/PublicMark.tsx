import { cn } from "@/lib/utils";

/**
 * Línea C, «Palabra con reloj» (Inés, 18-11-2026).
 * Tinta #14123B y sector #7C3AED; sobre oscuro, lavanda #C4B5FD.
 * El panel sigue con `TaimboxLogo`.
 */
export type PublicTone = "ink" | "paper";

const WORDMARK = {
  ink: "/brand/logo-C.svg",
  paper: "/brand/logo-C-dark.svg",
} as const;

const COMPACT = {
  ink: "/brand/logo-C-compacto.svg",
  paper: "/brand/logo-C-compacto-dark.svg",
} as const;

export function PublicWordmark({
  className,
  tone = "ink",
  compact = false,
}: {
  className?: string;
  tone?: PublicTone;
  compact?: boolean;
  markClassName?: string;
}) {
  const src = (compact ? COMPACT : WORDMARK)[tone];
  return (
    <img
      src={src}
      alt="Taimbox"
      className={cn("block w-auto", compact ? "h-7" : "h-8", className)}
    />
  );
}

/** Signo (la o-reloj) para sitios donde no cabe la palabra. */
export function PublicSign({
  className,
  tone = "ink",
}: {
  className?: string;
  tone?: PublicTone;
}) {
  return (
    <img
      src={tone === "paper" ? "/brand/logo-C-signo-dark.svg" : "/brand/logo-C-signo.svg"}
      alt=""
      className={cn("block h-8 w-8", className)}
    />
  );
}
