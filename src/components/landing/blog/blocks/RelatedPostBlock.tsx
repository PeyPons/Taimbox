import { useTranslation } from "react-i18next";
import { useRelatedSummary } from "@/hooks/useBlogPosts";
import { getLocaleSummaryFields } from "@/lib/blog/types";
import { BlogRelatedPost } from "../BlogRelatedPost";
import type { RelatedPostBlock as RelatedPostBlockType } from "@/lib/blog/blockSchema";

export function RelatedPostBlock({ block }: { block: RelatedPostBlockType }) {
  const { i18n } = useTranslation();
  const { data: related } = useRelatedSummary(block.slug);
  if (!related) return null;
  const loc = getLocaleSummaryFields(related, i18n.language);
  return (
    <div className="my-8 max-w-xl mx-auto">
      <BlogRelatedPost
        title={loc.title}
        description={loc.description}
        href={loc.path}
      />
    </div>
  );
}
