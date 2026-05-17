import { landingInlineStyle } from "@/components/landing/below/landingInlineStyle";

/** Estilos de celda del mock del planificador (s01), según valor mostrado. */
export function plannerCellStyle(cell: string): ReturnType<typeof landingInlineStyle> {
  if (cell === "—") {
    return landingInlineStyle(
      "background: repeating-linear-gradient(45deg, rgba(148, 163, 184, 0.18) 0px, rgba(148, 163, 184, 0.18) 4px, transparent 4px, transparent 8px) rgb(241, 245, 249); color: rgb(100, 116, 139); height: 38px; font-size: 13px; opacity: 1; transform: none;",
    );
  }
  const pct = parseInt(cell, 10);
  if (pct > 100) {
    return landingInlineStyle(
      "background-position: initial; background-size: initial; background-repeat: initial; background-attachment: initial; background-origin: initial; background-clip: initial; background-color: rgb(254, 242, 242); color: rgb(220, 38, 38); height: 38px; font-size: 13px; opacity: 1; transform: none;",
    );
  }
  if (pct < 80) {
    return landingInlineStyle(
      "background-position: initial; background-size: initial; background-repeat: initial; background-attachment: initial; background-origin: initial; background-clip: initial; background-color: rgb(248, 250, 252); color: rgb(100, 116, 139); height: 38px; font-size: 13px; opacity: 1; transform: none;",
    );
  }
  return landingInlineStyle(
    "background-position: initial; background-size: initial; background-repeat: initial; background-attachment: initial; background-origin: initial; background-clip: initial; background-color: rgb(240, 253, 244); color: rgb(22, 163, 74); height: 38px; font-size: 13px; opacity: 1; transform: none;",
  );
}

export const PLANNER_ROW_AVATAR_BG = [
  "rgb(251, 113, 133)",
  "rgb(251, 146, 60)",
  "rgb(167, 139, 250)",
  "rgb(34, 211, 238)",
] as const;

export const LEGEND_SWATCH_STYLE: Record<string, string> = {
  available: "background-position: initial; background-size: initial; background-repeat: initial; background-attachment: initial; background-origin: initial; background-clip: initial; background-color: rgb(22, 163, 74);",
  busy: "background-position: initial; background-size: initial; background-repeat: initial; background-attachment: initial; background-origin: initial; background-clip: initial; background-color: rgb(234, 88, 12);",
  overload: "background-position: initial; background-size: initial; background-repeat: initial; background-attachment: initial; background-origin: initial; background-clip: initial; background-color: rgb(220, 38, 38);",
  absence:
    "background: repeating-linear-gradient(45deg, rgba(255, 255, 255, 0.4) 0px, rgba(255, 255, 255, 0.4) 1px, transparent 1px, transparent 3px) rgb(148, 163, 184);",
};

export const S01_PILL_BORDERS = ["border-emerald-200", "border-amber-200", "border-violet-200", "border-sky-200"] as const;
export const S01_PILL_ICON_BG = ["bg-emerald-50", "bg-amber-50", "bg-violet-50", "bg-sky-50"] as const;
export const S01_PILL_ICON_COLOR = ["text-emerald-700", "text-amber-700", "text-violet-700", "text-sky-700"] as const;
