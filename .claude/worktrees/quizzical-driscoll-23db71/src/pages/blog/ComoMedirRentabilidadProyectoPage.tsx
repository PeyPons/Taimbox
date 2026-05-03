import { absoluteUrl } from '@/lib/publicSiteUrl';
import { BlogArticleSeo } from '@/seo/BlogArticleSeo';
import { ComoMedirRentabilidadProyectoArticle } from '@/components/landing/blog/ComoMedirRentabilidadProyectoArticle';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { BlogBreadcrumb } from '@/components/landing/blog/BlogBreadcrumb';
import { blogPosts, getBlogPostLocaleFields } from '@/data/blogPosts';
import { i18nAsArray } from '@/lib/i18nReturnObjects';
import { useTranslation } from 'react-i18next';

const SLUG = 'como-medir-rentabilidad-proyecto-agencia-dejar-vender-horas';

export default function ComoMedirRentabilidadProyectoPage() {
  const { t, i18n } = useTranslation("blog");
  const postKey = "comoMedirRentabilidadProyecto";

  const post = blogPosts.find((p) => p.slug === SLUG)!;
  const { title: postTitle } = getBlogPostLocaleFields(post, i18n.language);

  const rawRelatedPost = post?.relatedSlug ? blogPosts.find((p) => p.slug === post.relatedSlug) : null;
  const relatedPost = rawRelatedPost ? getBlogPostLocaleFields(rawRelatedPost, i18n.language) : null;

  const TOC_ITEMS = [
    { id: 'techo-horas', label: t(`posts.${postKey}.toc.techoHoras`) },
    { id: 'modelos-pricing', label: t(`posts.${postKey}.toc.modelosPricing`) },
    { id: 'calcular-rentabilidad', label: t(`posts.${postKey}.toc.calcularRentabilidad`) },
    { id: 'scope-creep-protocolo', label: t(`posts.${postKey}.toc.scopeCreepProtocolo`) },
    { id: 'modelo-sprint', label: t(`posts.${postKey}.toc.modeloSprint`) },
    { id: 'faq-rentabilidad-proyecto', label: t(`posts.${postKey}.toc.preguntasFrecuentes`) }
  ];

  const titleH1 = t(`posts.${postKey}.meta.headline`);
  const description = t(`posts.${postKey}.meta.description`);

  const faqItems = i18nAsArray<{ q: string; a: string }>(
    t(`posts.${postKey}.faqItems`, { returnObjects: true }),
  );
  const howToData = (t(`posts.${postKey}.howTo`, { returnObjects: true }) as any) || {};
  const softwareData = (t(`posts.${postKey}.software`, { returnObjects: true }) as any) || {};

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        headline: titleH1,
        description,
        author: { '@type': 'Organization', name: 'Taimbox' },
        publisher: { '@type': 'Organization', name: 'Taimbox' },
        datePublished: post?.date ?? '2026-03-26',
        mainEntityOfPage: { '@type': 'WebPage', '@id': absoluteUrl(post.href) },
      },
      {
        '@type': 'HowTo',
        name: howToData.title,
        description: howToData.desc,
        step: i18nAsArray<{ name: string; text: string }>(howToData.steps).map((s, i: number) => ({
          '@type': 'HowToStep',
          position: i + 1,
          name: s.name,
          text: s.text,
        })),
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
          <ComoMedirRentabilidadProyectoArticle
            readingMinutes={post?.readingMinutes ?? 12}
            tocItems={TOC_ITEMS}
            relatedPost={relatedPost ?? undefined}
          />
        </div>

        <LandingFooter />
      </div>
    </>
  );
}
