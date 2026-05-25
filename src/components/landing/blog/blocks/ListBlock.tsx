import { sanitizeInlineHtml } from "@/lib/blog/sanitize";
import type { ListBlock as ListBlockType } from "@/lib/blog/blockSchema";

export function ListBlock({ block }: { block: ListBlockType }) {
  const Tag = block.ordered ? "ol" : "ul";
  const listClass = block.ordered
    ? "list-decimal pl-6 space-y-4 marker:text-indigo-300"
    : "list-disc pl-5 space-y-4 marker:text-indigo-300";
  return (
    <Tag className={`${listClass} text-indigo-100/90 text-base sm:text-lg leading-[1.75] m-0`}>
      {block.items.map((item, idx) => (
        <li
          key={idx}
          className="pl-1"
          dangerouslySetInnerHTML={{ __html: sanitizeInlineHtml(item) }}
        />
      ))}
    </Tag>
  );
}
