import { absoluteUrl } from '@/lib/publicSiteUrl';
import { BlogArticleSeo } from '@/seo/BlogArticleSeo';
import { CapacidadCalendarioVsProductivaArticle } from '@/components/landing/blog/CapacidadCalendarioVsProductivaArticle';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { BlogBreadcrumb } from '@/components/landing/blog/BlogBreadcrumb';
import { blogPosts, getBlogPostLocaleFields } from '@/data/blogPosts';
import { i18nAsArray } from '@/lib/i18nReturnObjects';
import { useTranslation } from 'react-i18next';

const SLUG = 'capacidad-calendario-vs-capacidad-productiva-equipo';

export default function CapacidadCalendarioVsProductivaPage() {
  const { t, i18n } = useTranslation('blog');
  const postKey = 'capacidadCalendarioVsProductiva';

  const post = blogPosts.find((p) => p.slug === SLUG)!;
  const { title: postTitle } = getBlogPostLocaleFields(post, i18n.language);

  const rawRelatedPost = post?.relatedSlug ? blogPosts.find((p) => p.slug === post.relatedSlug) : null;
  const relatedPost = rawRelatedPost ? getBlogPostLocaleFields(rawRelatedPost, i18n.language) : null;

  const tocData = (t(`posts.${postKey}.toc`, { returnObjects: true }) as Record<string, string>) || {};
  const TOC_ITEMS = [
    { id: 'mapa-capacidad-calendario-productiva', label: tocData.mapa || '1. Mapa rápido' },
    { id: 'calendario-verde-engana', label: tocData.calendario || '2. Por qué el calendario miente' },
    { id: 'entregables-contra-calendario', label: tocData.entregables || '3. Entregables frente a ocupación' },
    { id: 'lunes-capacidad-neta', label: tocData.lunes || '4. Capacidad neta el lunes' },
    { id: 'checklist-capacidad-productiva', label: tocData.checklist || '5. Checklist semanal y anti-patrones' },
    { id: 'leer-siguiente-capacidad', label: tocData.leerMas || '6. Lecturas relacionadas' },
    { id: 'faq-capacidad-calendario', label: tocData.faq || 'Preguntas frecuentes' },
  ];

  const headline = t(`posts.${postKey}.meta.headline`);
  const description = t(`posts.${postKey}.meta.description`);

  const faqItems = i18nAsArray<{ q: string; a: string }>(t(`posts.${postKey}.faqItems`, { returnObjects: true }));
  const softwareData = (t(`posts.${postKey}.software`, { returnObjects: true }) as Record<string, string>) || {};

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        headline,
        description,
        author: { '@type': 'Organization', name: 'Taimbox' },
        publisher: { '@type': 'Organization', name: 'Taimbox' },
        datePublished: post?.date ?? '2026-05-06',
        mainEntityOfPage: { '@type': 'WebPage', '@id': absoluteUrl(post.href) },
      },
      {
        '@type': 'FAQPage',
        mainEntity: faqItems.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
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
          <CapacidadCalendarioVsProductivaArticle
            readingMinutes={post?.readingMinutes ?? 11}
            tocItems={TOC_ITEMS}
            relatedPost={relatedPost ?? undefined}
          />
        </div>

        <LandingFooter />
      </div>
    </>
  );
}
