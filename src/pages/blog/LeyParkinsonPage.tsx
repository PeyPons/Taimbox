import { Helmet } from 'react-helmet-async';
import { LeyParkinsonArticle } from '@/components/landing/blog/LeyParkinsonArticle';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { BlogBreadcrumb } from '@/components/landing/blog/BlogBreadcrumb';
import { blogPosts } from '@/data/blogPosts';

const SLUG = 'ley-parkinson';
const post = blogPosts.find((p) => p.slug === SLUG)!;
const relatedPost = post?.relatedSlug ? blogPosts.find((p) => p.slug === post.relatedSlug) : null;

const TOC_ITEMS = [
  { id: 'que-es-ley-parkinson', label: '1. Qué es la Ley de Parkinson' },
  { id: 'formulacion-origen', label: '2. Formulación exacta y origen' },
  { id: 'ejemplos-ley-parkinson', label: '3. Ejemplos en el día a día y en negocio' },
  { id: 'evidencia-estudios', label: '4. Evidencia empírica y estudios' },
  { id: 'consecuencias-negocio', label: '5. Consecuencias en empresas y equipos' },
  { id: 'antidotos-timeboxing', label: '6. Antídotos: timeboxing y plazos' },
  { id: 'aplicacion-equipos', label: '7. Cómo aplicar en equipos y agencias' },
  { id: 'preguntas-frecuentes', label: 'Preguntas frecuentes' },
  { id: 'cta-ley-parkinson', label: 'Que el tiempo trabaje a tu favor' },
];

export default function LeyParkinsonPage() {
  return (
    <>
      <Helmet>
        <title>Ley de Parkinson: qué es, ejemplos y cómo combatirla | Taimbox</title>
        <meta
          name="description"
          content="Guía completa sobre la Ley de Parkinson: origen, formulación, evidencia, consecuencias en negocio y antídotos (timeboxing, plazos y gestión del tiempo)."
        />
        <link rel="canonical" href="https://taimbox.com/blog/ley-parkinson" />
        <meta property="og:type" content="article" />
        <meta property="og:title" content="Ley de Parkinson: qué es, ejemplos y cómo combatirla | Taimbox" />
        <meta
          property="og:description"
          content="Guía completa sobre la Ley de Parkinson: origen, evidencia, consecuencias y antídotos como el timeboxing."
        />
        <meta property="og:url" content="https://taimbox.com/blog/ley-parkinson" />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'Article',
                headline: 'Ley de Parkinson: qué es, ejemplos y cómo combatirla',
                description:
                  'Guía completa sobre la Ley de Parkinson: origen, formulación, evidencia, consecuencias en negocio y antídotos (timeboxing, plazos y gestión del tiempo).',
                author: { '@type': 'Organization', name: 'Taimbox' },
                publisher: { '@type': 'Organization', name: 'Taimbox' },
                datePublished: post?.date ?? '2025-03-18',
              },
              {
                '@type': 'SoftwareApplication',
                name: 'Taimbox',
                applicationCategory: 'BusinessApplication',
                description:
                  'Planificador de recursos y tiempo para agencias. Timeboxing, cronograma por horas y reportes de rentabilidad.',
              },
            ],
          })}
        </script>
      </Helmet>

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
          <BlogBreadcrumb title={post?.title ?? 'Ley de Parkinson'} />
        </div>

        <div className="relative z-10">
          <LeyParkinsonArticle
            readingMinutes={post?.readingMinutes ?? 18}
            tocItems={TOC_ITEMS}
            relatedPost={relatedPost ? { title: relatedPost.title, description: relatedPost.description, href: relatedPost.href } : undefined}
          />
        </div>

        <LandingFooter />
      </div>
    </>
  );
}
