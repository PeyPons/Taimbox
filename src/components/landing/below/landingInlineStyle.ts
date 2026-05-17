import type { CSSProperties } from "react";

function cssPropertyToReact(prop: string): string {
  const p = prop.trim();
  if (p.startsWith("-webkit-")) {
    const rest = p.slice(8);
    const parts = rest.split("-").filter(Boolean);
    return "Webkit" + parts.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join("");
  }
  if (p.startsWith("-moz-")) {
    const rest = p.slice(5);
    const parts = rest.split("-").filter(Boolean);
    return "Moz" + parts.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join("");
  }
  return p.replace(/-([a-z])/gi, (_, g: string) => g.toUpperCase());
}

/** Convierte un string `style` HTML a objeto para React (landing literal). */
export function landingInlineStyle(cssText: string): CSSProperties {
  const out: Record<string, string> = {};
  for (const chunk of cssText.split(";")) {
    const t = chunk.trim();
    if (!t) continue;
    const c = t.indexOf(":");
    if (c === -1) continue;
    const key = cssPropertyToReact(t.slice(0, c));
    const val = t.slice(c + 1).trim();
    (out as Record<string, string>)[key] = val;
  }
  return out as CSSProperties;
}
