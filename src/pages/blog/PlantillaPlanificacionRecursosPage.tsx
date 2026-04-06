import { absoluteUrl } from '@/lib/publicSiteUrl';
import { BlogArticleSeo } from '@/seo/BlogArticleSeo';
import { PlantillaPlanificacionRecursosArticle } from '@/components/landing/blog/PlantillaPlanificacionRecursosArticle';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { BlogBreadcrumb } from '@/components/landing/blog/BlogBreadcrumb';
import { blogPosts, getBlogPostLocaleFields } from '@/data/blogPosts';
import { i18nAsArray } from '@/lib/i18nReturnObjects';
import { useTranslation } from 'react-i18next';

const SLUG = 'plantilla-planificacion-recursos-agencia';

export default function PlantillaPlanificacionRecursosPage() {
  const { t, i18n } = useTranslation("blog");
  const postKey = "plantillaPlanificacionRecursos";

  const post = blogPosts.find((p) => p.slug === SLUG)!;
  const { title: postTitle } = getBlogPostLocaleFields(post, i18n.language);

  const rawRelatedPost = post?.relatedSlug ? blogPosts.find((p) => p.slug === post.relatedSlug) : null;
  const relatedPost = rawRelatedPost ? getBlogPostLocaleFields(rawRelatedPost, i18n.language) : null;

  const tocData = (t(`posts.${postKey}.toc`, { returnObjects: true }) as any) || {};

  const TOC_ITEMS = [
    { id: 'intro-excel-primer-amor', label: tocData.introExcel || '' },
    { id: 'capacidad-bruta-vs-neta', label: tocData.capacidadBrutaNeta || '' },
    { id: 'anatomia-plantilla-profesional', label: tocData.anatomiaPlantilla || '' },
    { id: 'formula-utilizacion-formato', label: tocData.formulaUtilizacion || '' },
    { id: 'pacing-proyecto-margen', label: tocData.pacingProyecto || '' },
    { id: 'impuesto-excel-techo', label: tocData.impuestoExcel || '' },
    { id: 'techo-cristal-errores', label: tocData.techoCristal || '' },
    { id: 'validacion-proteccion-errores', label: tocData.validacionProteccion || '' },
    { id: 'escalar-semana-semana', label: tocData.escalarSemana || '' },
    { id: 'google-sheets-diferencias', label: tocData.googleSheets || '' },
    { id: 'evolucion-taimbox-passiva', label: tocData.evolucionTaimbox || '' },
    { id: 'faq-plantilla-recursos', label: tocData.preguntasFrecuentes || '' },
    { id: 'resumen-recursos', label: tocData.resumen || 'Resumen' },
    { id: 'cta-plantilla-recursos', label: tocData.siguientePaso || 'Siguiente paso' }
  ];

  const headline = t(`posts.${postKey}.meta.headline`) || t(`posts.${postKey}.hero.title`);
  const description = t(`posts.${postKey}.meta.description`);

  const howToData = (t(`posts.${postKey}.howTo`, { returnObjects: true }) as any) || {};
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
        datePublished: post?.date ?? '2026-03-24',
        mainEntityOfPage: { '@type': 'WebPage', '@id': absoluteUrl(post.href) },
      },
      {
        '@type': 'HowTo',
        name: howToData.title || 'Cómo usar la plantilla de planificación de recursos para agencias',
        description:
          howToData.desc || 'Pasos para configurar inventario de horas, catálogo de proyectos, cuadrante semanal y dashboard de utilización en Excel o Google Sheets.',
        step: i18nAsArray<{ name: string; text: string }>(howToData.steps).map((s, i: number) => ({
          '@type': 'HowToStep',
          position: i + 1,
          name: s.name,
          text: s.text,
        })),
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
          <PlantillaPlanificacionRecursosArticle
            readingMinutes={post?.readingMinutes ?? 22}
            tocItems={TOC_ITEMS}
            relatedPost={relatedPost ?? undefined}
          />
        </div>

        <LandingFooter />
      </div>
    </>
  );
}
