import { BlogTOC, type BlogTOCItem } from "../BlogTOC";
import type { BlogBlock } from "@/lib/blog/blockSchema";

/**
 * El bloque TOC se compone automaticamente desde los heading blocks que tienen
 * anchorId definido. Si no hay headings con anchorId, no se renderiza.
 */
export function TocBlock({ allBlocks }: { allBlocks: BlogBlock[] }) {
  const items: BlogTOCItem[] = allBlocks
    .filter((b): b is Extract<BlogBlock, { type: "heading" }> => b.type === "heading")
    .filter((b) => typeof b.anchorId === "string" && b.anchorId.length > 0)
    .map((b) => ({ id: b.anchorId as string, label: b.text }));

  if (items.length === 0) return null;
  return (
    <div className="m-0">
      <BlogTOC items={items} />
    </div>
  );
}
