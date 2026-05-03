import { BlogArticleSeo } from '@/seo/BlogArticleSeo';
import { LeyParkinsonArticle } from '@/components/landing/blog/LeyParkinsonArticle';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { BlogBreadcrumb } from '@/components/landing/blog/BlogBreadcrumb';
import { blogPosts, getBlogPostLocaleFields } from '@/data/blogPosts';
import { useTranslation } from 'react-i18next';

const SLUG = 'ley-parkinson';

export default function LeyParkinsonPage() {
  const { t, i18n } = useTranslation("blog");
  const postKey = "leyParkinson";

  const post = blogPosts.find((p) => p.slug === SLUG)!;
  const { title: postTitle } = getBlogPostLocaleFields(post, i18n.language);

  const rawRelatedPost = post?.relatedSlug ? blogPosts.find((p) => p.slug === post.relatedSlug) : null;
  const relatedPost = rawRelatedPost ? getBlogPostLocaleFields(rawRelatedPost, i18n.language) : null;

  const tocData = (t(`posts.${postKey}.toc`, { returnObjects: true }) as any) || {};

  const TOC_ITEMS = [
    { id: 'que-es-ley-parkinson', label: tocData.queEs || '1. Qué es la Ley de Parkinson' },
    { id: 'formulacion-origen', label: tocData.formulacion || '2. Formulación exacta y origen' },
    { id: 'parkinson-estructura-burocracia', label: tocData.burocracia || 'Origen burocrático y estructura' },
    { id: 'segunda-ley-gastos', label: tocData.segundaLey || 'Segunda ley: gastos e ingresos' },
    { id: 'ejemplos-ley-parkinson', label: tocData.ejemplos || '3. Ejemplos en el día a día y en negocio' },
    { id: 'ley-trivialidad', label: tocData.trivialidad || 'Ley de la trivialidad (efecto cobertizo)' },
    { id: 'evidencia-estudios', label: tocData.evidencia || '4. Evidencia empírica y estudios' },
    { id: 'consecuencias-negocio', label: tocData.consecuencias || '5. Consecuencias en empresas y equipos' },
    { id: 'antidotos-timeboxing', label: tocData.antidotos || '6. Antídotos: timeboxing y plazos' },
    { id: 'aplicacion-equipos', label: tocData.aplicacion || '7. Cómo aplicar en equipos y agencias' },
    { id: 'preguntas-frecuentes', label: tocData.faq || 'Preguntas frecuentes' },
    { id: 'cta-ley-parkinson', label: tocData.cta || 'Que el tiempo trabaje a tu favor' }
  ];

  const headline = t(`posts.${postKey}.meta.headline`);
  const description = t(`posts.${postKey}.meta.description`);

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        headline: headline,
        description: description,
        author: { '@type': 'Organization', name: 'Taimbox' },
        publisher: { '@type': 'Organization', name: 'Taimbox' },
        datePublished: post?.date ?? '2026-03-14',
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
          <LeyParkinsonArticle
            readingMinutes={post?.readingMinutes ?? 24}
            tocItems={TOC_ITEMS}
            relatedPost={relatedPost ?? undefined}
          />
        </div>

        <LandingFooter />
      </div>
    </>
  );
}
