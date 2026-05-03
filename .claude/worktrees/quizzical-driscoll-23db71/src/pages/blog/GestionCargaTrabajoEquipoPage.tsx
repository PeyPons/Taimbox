import { absoluteUrl } from '@/lib/publicSiteUrl';
import { BlogArticleSeo } from '@/seo/BlogArticleSeo';
import { GestionCargaTrabajoEquipoArticle } from '@/components/landing/blog/GestionCargaTrabajoEquipoArticle';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { BlogBreadcrumb } from '@/components/landing/blog/BlogBreadcrumb';
import { blogPosts, getBlogPostLocaleFields } from '@/data/blogPosts';
import { i18nAsArray } from '@/lib/i18nReturnObjects';
import { useTranslation } from 'react-i18next';

const SLUG = 'gestion-carga-trabajo-equipo-sin-burnout';

export default function GestionCargaTrabajoEquipoPage() {
  const { t, i18n } = useTranslation("blog");
  const postKey = "gestionCargaTrabajoEquipo";

  const post = blogPosts.find((p) => p.slug === SLUG)!;
  const { title: postTitle } = getBlogPostLocaleFields(post, i18n.language);

  const rawRelatedPost = post?.relatedSlug ? blogPosts.find((p) => p.slug === post.relatedSlug) : null;
  const relatedPost = rawRelatedPost ? getBlogPostLocaleFields(rawRelatedPost, i18n.language) : null;

  const tocData = (t(`posts.${postKey}.toc`, { returnObjects: true }) as any) || {};
  const TOC_ITEMS = [
    { id: 'lo-que-aprenderas', label: tocData.loQueAprenderas || '1. Mapa rápido' },
    { id: 'que-es-carga-trabajo', label: tocData.queEsCargaTrabajo || '2. Qué es la carga de trabajo' },
    { id: 'causas-burnout-equipos', label: tocData.causasBurnoutEquipos || '3. Causas del burnout' },
    { id: 'senales-equipo-riesgo', label: tocData.senalesEquipoRiesgo || '4. Señales de riesgo' },
    { id: 'framework-gestion-sostenible', label: tocData.frameworkGestionSostenible || '5. Framework en 6 pasos' },
    { id: 'rol-manager-equipo', label: tocData.rolManagerEquipo || '6. Rol del manager' },
    { id: 'burnout-instalado', label: tocData.burnoutInstalado || '7. Burnout ya instalado' },
    { id: 'metricas-carga-equipo', label: tocData.metricasCargaEquipo || '8. Métricas clave' },
    { id: 'herramientas-workload', label: tocData.herramientasWorkload || '9. Herramientas' },
    { id: 'conclusion-gestion-carga', label: tocData.conclusionGestionCarga || '10. Conclusión' },
    { id: 'faq-gestion-carga-trabajo', label: tocData.preguntasFrecuentes || 'Preguntas frecuentes' }
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
          <GestionCargaTrabajoEquipoArticle
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
