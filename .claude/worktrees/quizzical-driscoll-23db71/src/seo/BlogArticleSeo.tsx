import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { findBlogPostByPath, getBlogPostLocaleFields } from "@/data/blogPosts";
import { SeoTags } from "./SeoTags";

type BlogArticleSeoProps = {
  /** JSON-LD adicional o sustituto (p. ej. @graph con FAQ). Si se omite, no se emite script estructurado. */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
};

/** SEO hreflang/canonical para artículos del blog (rutas ES y EN). */
export function BlogArticleSeo(props: BlogArticleSeoProps) {
  const { jsonLd } = props;
  const { pathname } = useLocation();
  const { i18n } = useTranslation();
  const post = findBlogPostByPath(pathname);
  if (!post) return null;
  const loc = getBlogPostLocaleFields(post, i18n.language);
  const lang = i18n.language.startsWith("en") ? "en" : "es";
  return (
    <SeoTags
      pathEs={post.href}
      pathEn={post.hrefEn}
      title={`${loc.title} | Taimbox`}
      description={loc.description}
      lang={lang}
      ogType="article"
      jsonLd={jsonLd}
    />
  );
}
