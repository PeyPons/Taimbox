import { Suspense } from "react";
import { getVisualEntry } from "@/lib/blog/visualRegistry";
import type { VisualRefBlock as VisualRefBlockType } from "@/lib/blog/blockSchema";

/**
 * Renderiza un componente registrado por id. Solo soporta `mode='inline'` aqui;
 * los `mode='fullPage'` los gestiona BlogArticleDynamicPage delegando la pagina entera.
 */
export function VisualRefBlock({ block }: { block: VisualRefBlockType }) {
  const entry = getVisualEntry(block.visualId);
  if (!entry) {
    if (import.meta.env.DEV) {
      console.warn(`[blog] visualRef desconocido: ${block.visualId}`);
    }
    return null;
  }
  if (entry.mode === "fullPage") {
    if (import.meta.env.DEV) {
      console.warn(
        `[blog] visualRef '${block.visualId}' es fullPage; debe usarse como unico bloque del post.`,
      );
    }
    return null;
  }
  const Component = entry.Component;
  return (
    <Suspense fallback={<div className="my-6 h-32 animate-pulse rounded-xl bg-white/5" />}>
      <Component {...(block.props ?? {})} />
    </Suspense>
  );
}
