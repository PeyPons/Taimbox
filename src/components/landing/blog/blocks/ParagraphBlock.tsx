import { sanitizeInlineHtml } from "@/lib/blog/sanitize";
import type { ParagraphBlock as ParagraphBlockType } from "@/lib/blog/blockSchema";

export function ParagraphBlock({ block }: { block: ParagraphBlockType }) {
  return (
    <p
      className="text-indigo-100/90 text-base sm:text-lg leading-[1.8] sm:leading-[1.75] m-0"
      dangerouslySetInnerHTML={{ __html: sanitizeInlineHtml(block.html) }}
    />
  );
}
