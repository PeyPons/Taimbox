import { useLocation } from "react-router-dom";
import { useRelatedSummary } from "@/hooks/useBlogPosts";
import { blogLocaleFromPathname } from "@/lib/blog/localeFromPath";
import { getLocaleSummaryFields } from "@/lib/blog/types";
import { BlogRelatedPost } from "../BlogRelatedPost";
import type { RelatedPostBlock as RelatedPostBlockType } from "@/lib/blog/blockSchema";

export function RelatedPostBlock({ block }: { block: RelatedPostBlockType }) {
  const { pathname } = useLocation();
  const { data: related } = useRelatedSummary(block.slug);
  if (!related) return null;
  const lang = blogLocaleFromPathname(pathname);
  const loc = getLocaleSummaryFields(related, lang);
  return (
    <div className="max-w-xl mx-auto">
      <BlogRelatedPost
        title={loc.title}
        description={loc.description}
        href={loc.path}
      />
    </div>
  );
}
