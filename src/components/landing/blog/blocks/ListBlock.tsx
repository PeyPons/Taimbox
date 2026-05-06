import { sanitizeInlineHtml } from "@/lib/blog/sanitize";
import type { ListBlock as ListBlockType } from "@/lib/blog/blockSchema";

export function ListBlock({ block }: { block: ListBlockType }) {
  const Tag = block.ordered ? "ol" : "ul";
  const listClass = block.ordered
    ? "list-decimal pl-6 space-y-3 marker:text-indigo-300"
    : "list-disc pl-5 space-y-3 marker:text-indigo-300";
  return (
    <Tag className={`${listClass} text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-6`}>
      {block.items.map((item, idx) => (
        <li
          key={idx}
          dangerouslySetInnerHTML={{ __html: sanitizeInlineHtml(item) }}
        />
      ))}
    </Tag>
  );
}
