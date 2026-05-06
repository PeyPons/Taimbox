import { sanitizeHtml } from "@/lib/blog/sanitize";
import type { HtmlBlock as HtmlBlockType } from "@/lib/blog/blockSchema";

/**
 * Bloque HTML libre. El contenido se sanitiza con DOMPurify antes de render.
 * No se permiten scripts, event handlers ni atributos peligrosos.
 */
export function HtmlBlock({ block }: { block: HtmlBlockType }) {
  return (
    <div
      className="prose prose-invert max-w-none text-indigo-100/90 my-6"
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(block.html) }}
    />
  );
}
