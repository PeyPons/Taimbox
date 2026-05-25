import { sanitizeInlineHtml } from "@/lib/blog/sanitize";
import type { CalloutBlock as CalloutBlockType } from "@/lib/blog/blockSchema";

const TONE_STYLES: Record<CalloutBlockType["tone"], string> = {
  info: "border-l-4 border-sky-400 bg-sky-500/10 border-sky-500/20",
  warning: "border-l-4 border-amber-400 bg-amber-500/10 border-amber-500/20",
  success: "border-l-4 border-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  highlight: "border-l-4 border-violet-400 bg-violet-500/10 border-violet-500/20",
};

export function CalloutBlock({ block }: { block: CalloutBlockType }) {
  return (
    <div className={`rounded-2xl border ${TONE_STYLES[block.tone]} p-4 sm:p-6`}>
      <p
        className="text-white/95 font-medium m-0 text-base sm:text-lg leading-[1.75]"
        dangerouslySetInnerHTML={{ __html: sanitizeInlineHtml(block.html) }}
      />
    </div>
  );
}
