import { absoluteUrl } from '@/lib/publicSiteUrl';
import { BlogArticleSeo } from '@/seo/BlogArticleSeo';
import { WhatIsTimeboxingArticle } from '@/components/landing/WhatIsTimeboxingArticle';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { BlogBreadcrumb } from '@/components/landing/blog/BlogBreadcrumb';
import { blogPosts, getBlogPostLocaleFields } from '@/data/blogPosts';
import { useTranslation } from 'react-i18next';

const SLUG = 'que-es-timeboxing';

export default function WhatIsTimeboxingPage() {
  const { t, i18n } = useTranslation('blog');

  const post = blogPosts.find((p) => p.slug === SLUG)!;
  const { title: postTitle } = getBlogPostLocaleFields(post, i18n.language);

  const rawRelatedPost = post?.relatedSlug ? blogPosts.find((p) => p.slug === post.relatedSlug) : null;
  const relatedPost = rawRelatedPost ? getBlogPostLocaleFields(rawRelatedPost, i18n.language) : null;

  const tocItems = [
    {
      id: 'que-es-timeboxing-diferencia',
      label: t('posts.whatIsTimeboxing.toc.queEsDiferencia'),
    },
    {
      id: 'bloques-rigidos-flexibles',
      label: t('posts.whatIsTimeboxing.toc.bloquesRigidosFlexibles'),
    },
    {
      id: 'neurociencia',
      label: t('posts.whatIsTimeboxing.toc.neurociencia'),
    },
    {
      id: 'implementacion-paso-a-paso',
      label: t('posts.whatIsTimeboxing.toc.implementacionPasoAPaso'),
    },
    {
      id: 'equipos-rentabilidad',
      label: t('posts.whatIsTimeboxing.toc.equiposRentabilidad'),
    },
    {
      id: 'timeboxing-reuniones',
      label: t('posts.whatIsTimeboxing.toc.timeboxingReuniones'),
    },
    {
      id: 'preguntas-frecuentes',
      label: t('posts.whatIsTimeboxing.toc.preguntasFrecuentes'),
    },
    {
      id: 'cta-rentabilidad',
      label: t('posts.whatIsTimeboxing.toc.ctaRentabilidad'),
    },
  ];

  const whatIsTimeboxingJsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        headline: t('posts.whatIsTimeboxing.meta.headline'),
        description: t('posts.whatIsTimeboxing.meta.description'),
        author: { '@type': 'Organization', name: 'Taimbox' },
        publisher: { '@type': 'Organization', name: 'Taimbox' },
        datePublished: post?.date ?? '2026-03-10',
        mainEntityOfPage: { '@type': 'WebPage', '@id': absoluteUrl(post.href) },
      },
      {
        '@type': 'SoftwareApplication',
        name: 'Taimbox',
        applicationCategory: 'BusinessApplication',
        description: t('posts.whatIsTimeboxing.meta.softwareDescription'),
      },
    ],
  };

  return (
    <>
      <BlogArticleSeo jsonLd={whatIsTimeboxingJsonLd} />

      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-indigo-900 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-50" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl opacity-50" />
        </div>
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }} />

        <LandingHeader />

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
          <BlogBreadcrumb title={postTitle} />
        </div>

        <div className="relative z-10">
          <WhatIsTimeboxingArticle
            readingMinutes={post?.readingMinutes ?? 12}
            tocItems={tocItems}
            relatedPost={relatedPost ?? undefined}
          />
        </div>

        <LandingFooter />
      </div>
    </>
  );
}
