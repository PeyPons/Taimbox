import { sanitizeInlineHtml } from "@/lib/blog/sanitize";
import type { FaqBlock as FaqBlockType } from "@/lib/blog/blockSchema";

export function FaqBlock({ block }: { block: FaqBlockType }) {
  return (
    <div className="space-y-6 text-indigo-100/90 text-base sm:text-lg leading-relaxed my-8">
      {block.items.map((item, idx) => (
        <div
          key={idx}
          className="rounded-xl border border-white/10 bg-white/5 p-5 sm:p-6 space-y-3"
        >
          <h3 className="text-white font-bold text-lg m-0">{item.q}</h3>
          <p
            className="m-0"
            dangerouslySetInnerHTML={{ __html: sanitizeInlineHtml(item.a) }}
          />
        </div>
      ))}
    </div>
  );
}
