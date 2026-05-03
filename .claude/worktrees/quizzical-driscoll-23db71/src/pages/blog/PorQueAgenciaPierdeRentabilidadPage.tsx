import { absoluteUrl } from '@/lib/publicSiteUrl';
import { BlogArticleSeo } from '@/seo/BlogArticleSeo';
import { PorQueAgenciaPierdeRentabilidadArticle } from '@/components/landing/blog/PorQueAgenciaPierdeRentabilidadArticle';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { BlogBreadcrumb } from '@/components/landing/blog/BlogBreadcrumb';
import { blogPosts, getBlogPostLocaleFields } from '@/data/blogPosts';
import { i18nAsArray } from '@/lib/i18nReturnObjects';
import { useTranslation } from 'react-i18next';

const SLUG = 'por-que-tu-agencia-pierde-rentabilidad-equipo-ocupado';

export default function PorQueAgenciaPierdeRentabilidadPage() {
  const { t, i18n } = useTranslation("blog");
  const postKey = "porQueAgenciaPierdeRentabilidad";

  const post = blogPosts.find((p) => p.slug === SLUG)!;
  const { title: postTitle } = getBlogPostLocaleFields(post, i18n.language);

  const rawRelatedPost = post?.relatedSlug ? blogPosts.find((p) => p.slug === post.relatedSlug) : null;
  const relatedPost = rawRelatedPost ? getBlogPostLocaleFields(rawRelatedPost, i18n.language) : null;

  const tocData = (t(`posts.${postKey}.toc`, { returnObjects: true }) as any) || {};

  const TOC_ITEMS = [
    { id: 'tasa-utilizacion', label: tocData.tasaUtilizacion || '' },
    { id: 'context-switching', label: tocData.contextSwitching || '' },
    { id: 'presencialismo-digital', label: tocData.presencialismoDigital || '' },
    { id: 'horas-no-facturables', label: tocData.horasNoFacturables || '' },
    { id: 'scope-creep', label: tocData.scopeCreep || '' },
    { id: 'metricas-rentabilidad', label: tocData.metricasRentabilidad || '' },
    { id: 'acciones-inmediatas', label: tocData.accionesInmediatas || '' },
    { id: 'faq-rentabilidad-ocupacion', label: tocData.preguntasFrecuentes || '' }
  ];

  const headline = t(`posts.${postKey}.meta.headline`);
  const description = t(`posts.${postKey}.meta.description`);
  const faqData = i18nAsArray<{ q: string; a: string }>(
    t(`posts.${postKey}.faqItems`, { returnObjects: true }),
  );

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        headline: headline,
        description,
        author: { '@type': 'Organization', name: 'Taimbox' },
        publisher: { '@type': 'Organization', name: 'Taimbox' },
        datePublished: post?.date ?? '2026-03-26',
        mainEntityOfPage: { '@type': 'WebPage', '@id': absoluteUrl(post.href) },
      },
      {
        '@type': 'FAQPage',
        mainEntity: faqData.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
      {
        '@type': 'SoftwareApplication',
        name: 'Taimbox',
        applicationCategory: 'BusinessApplication',
        description:
          'Planificador de recursos y tiempo para agencias. Timeboxing, cronograma por horas y reportes de rentabilidad.',
      },
    ],
  };

  return (
    <>
      <BlogArticleSeo jsonLd={jsonLd} />

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
          <PorQueAgenciaPierdeRentabilidadArticle
            readingMinutes={post?.readingMinutes ?? 14}
            tocItems={TOC_ITEMS}
            relatedPost={relatedPost ?? undefined}
          />
        </div>

        <LandingFooter />
      </div>
    </>
  );
}
