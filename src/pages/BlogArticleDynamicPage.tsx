import { Suspense } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { usePostByPath } from "@/hooks/useBlogPosts";
import { getLocaleFields } from "@/lib/blog/types";
import { getVisualEntry } from "@/lib/blog/visualRegistry";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { BlogBreadcrumb } from "@/components/landing/blog/BlogBreadcrumb";
import { BlockRenderer } from "@/components/landing/blog/BlockRenderer";
import { BlogReadingTime } from "@/components/landing/blog/BlogReadingTime";
import { SeoTags } from "@/seo/SeoTags";
import { absoluteUrl } from "@/lib/publicSiteUrl";
import type { BlogPostRecord, BlogPostLocaleFields } from "@/lib/blog/types";

const Loader = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="h-8 w-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
  </div>
);

function NotFoundFallback() {
  const { t, i18n } = useTranslation("blog");
  const lang = i18n.language.startsWith("en") ? "en" : "es";
  return (
    <>
      <SeoTags
        pathEs="/blog"
        pathEn="/en/blog"
        title={lang === "en" ? "Article not found | Taimbox" : "Artículo no encontrado | Taimbox"}
        description=""
        lang={lang}
        robots="noindex, nofollow"
      />
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-indigo-900 flex flex-col">
        <LandingHeader />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <h1 className="text-3xl sm:text-5xl font-black text-white mb-4">
            {t("notFound.title", lang === "en" ? "Article not found" : "Artículo no encontrado")}
          </h1>
          <p className="text-indigo-100/90 max-w-xl">
            {t(
              "notFound.description",
              lang === "en"
                ? "The article you're looking for is no longer available."
                : "El artículo que buscas ya no está disponible.",
            )}
          </p>
        </div>
        <LandingFooter />
      </div>
    </>
  );
}

function buildDefaultArticleJsonLd(
  post: BlogPostRecord,
  loc: BlogPostLocaleFields,
  lang: "es" | "en",
) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: loc.title,
    description: loc.description,
    author: { "@type": "Organization", name: "Taimbox" },
    publisher: { "@type": "Organization", name: "Taimbox" },
    datePublished: post.date,
    dateModified: post.updatedAt,
    inLanguage: lang === "en" ? "en" : "es",
    mainEntityOfPage: { "@type": "WebPage", "@id": absoluteUrl(loc.path) },
  };
}

export default function BlogArticleDynamicPage() {
  const { pathname } = useLocation();
  const { i18n } = useTranslation();
  const { data: post, isLoading, isError } = usePostByPath(pathname);

  if (isLoading) return <Loader />;
  if (isError || !post) return <NotFoundFallback />;

  const loc = getLocaleFields(post, i18n.language);

  // Delegacion total a un componente fullPage cuando el post es un unico visualRef.
  if (loc.blocks.length === 1 && loc.blocks[0].type === "visualRef") {
    const entry = getVisualEntry(loc.blocks[0].visualId);
    if (entry?.mode === "fullPage") {
      const FullPage = entry.Component;
      return (
        <Suspense fallback={<Loader />}>
          <FullPage />
        </Suspense>
      );
    }
  }

  // Render estandar con header/footer/breadcrumb/SEO + BlockRenderer.
  const lang: "es" | "en" = i18n.language.startsWith("en") ? "en" : "es";
  const articleJsonLd = loc.jsonLd ?? buildDefaultArticleJsonLd(post, loc, lang);

  return (
    <>
      <SeoTags
        pathEs={post.pathEs}
        pathEn={post.pathEn}
        title={`${loc.metaTitle} | Taimbox`}
        description={loc.metaDescription}
        lang={lang}
        ogType="article"
        jsonLd={articleJsonLd}
      />

      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-indigo-900 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-50" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl opacity-50" />
        </div>
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: "50px 50px",
          }}
        />

        <LandingHeader />

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
          <BlogBreadcrumb title={loc.title} />
        </div>

        <article className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 md:py-16 text-left overflow-x-hidden">
          <header className="mb-12 sm:mb-14 text-center flex flex-col items-center gap-3">
            <BlogReadingTime minutes={post.readingMinutes} />
            <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-[2.75rem] font-black text-white leading-[1.15] tracking-tight">
              {loc.title}
            </h1>
            <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
              {loc.description}
            </p>
          </header>
          <BlockRenderer blocks={loc.blocks} />
        </article>

        <LandingFooter />
      </div>
    </>
  );
}
