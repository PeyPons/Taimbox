import { BlogArticleSeo } from '@/seo/BlogArticleSeo';
import { KpisAgenciasMarketingArticle } from '@/components/landing/blog/KpisAgenciasMarketingArticle';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { BlogBreadcrumb } from '@/components/landing/blog/BlogBreadcrumb';
import { blogPosts, getBlogPostLocaleFields } from '@/data/blogPosts';
import { useTranslation } from 'react-i18next';

const SLUG = 'kpis-agencias-marketing-2026';

export default function KpisAgenciasMarketingPage() {
  const { t, i18n } = useTranslation("blog");
  const postKey = "kpisAgenciasMarketing";

  const post = blogPosts.find((p) => p.slug === SLUG)!;
  const { title: postTitle } = getBlogPostLocaleFields(post, i18n.language);

  const rawRelatedPost = post?.relatedSlug ? blogPosts.find((p) => p.slug === post.relatedSlug) : null;
  const relatedPost = rawRelatedPost ? getBlogPostLocaleFields(rawRelatedPost, i18n.language) : null;

  const tocData = (t(`posts.${postKey}.toc`, { returnObjects: true }) as any) || {};

  const TOC_ITEMS = [
    { id: 'tabla-rapida-kpis', label: tocData.tablaRapida || 'Tabla rápida: KPIs y decisiones' },
    { id: 'kpi-utilizacion', label: tocData.utilizacion || '1. Tasa de utilización' },
    { id: 'kpi-rentabilidad-pacing', label: tocData.rentabilidad || '2. Rentabilidad y pacing' },
    { id: 'kpi-estimado-real', label: tocData.estimadoReal || '3. Estimación vs realidad' },
    { id: 'kpi-capacidad-departamento', label: tocData.capacidad || '4. Capacidad por departamento' },
    { id: 'kpi-okrs', label: tocData.okrs || '5. OKRs y objetivos' },
    { id: 'excel-vs-taimbox', label: tocData.excel || 'Excel vs herramienta integrada' },
    { id: 'enlaces-guia-landings', label: tocData.enlaces || 'Guía y landings del producto' },
    { id: 'cta-kpis-agencias', label: tocData.cta || 'Próximo paso' }
  ];

  const headline = t(`posts.${postKey}.meta.headline`);
  const description = t(`posts.${postKey}.meta.description`);
  const softwareData = (t(`posts.${postKey}.software`, { returnObjects: true }) as any) || {};

  const kpisJsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        headline: headline,
        description: description,
        author: { '@type': 'Organization', name: 'Taimbox' },
        publisher: { '@type': 'Organization', name: 'Taimbox' },
        datePublished: post?.date ?? '2026-03-23',
      },
      {
        '@type': 'SoftwareApplication',
        name: softwareData.name,
        applicationCategory: 'BusinessApplication',
        description: softwareData.desc,
      },
    ],
  };

  return (
    <>
      <BlogArticleSeo jsonLd={kpisJsonLd} />

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
            backgroundSize: '50px 50px',
          }}
        />

        <LandingHeader />

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
          <BlogBreadcrumb title={postTitle} />
        </div>

        <div className="relative z-10">
          <KpisAgenciasMarketingArticle
            readingMinutes={post?.readingMinutes ?? 16}
            tocItems={TOC_ITEMS}
            relatedPost={relatedPost ?? undefined}
          />
        </div>

        <LandingFooter />
      </div>
    </>
  );
}
