import { Helmet } from 'react-helmet-async';
import { KpisAgenciasMarketingArticle } from '@/components/landing/blog/KpisAgenciasMarketingArticle';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { BlogBreadcrumb } from '@/components/landing/blog/BlogBreadcrumb';
import { blogPosts } from '@/data/blogPosts';

const SLUG = 'kpis-agencias-marketing-2026';
const post = blogPosts.find((p) => p.slug === SLUG)!;
const relatedPost = post?.relatedSlug ? blogPosts.find((p) => p.slug === post.relatedSlug) : null;

const TOC_ITEMS = [
  { id: 'tabla-rapida-kpis', label: 'Tabla rápida: KPIs y decisiones' },
  { id: 'kpi-utilizacion', label: '1. Tasa de utilización' },
  { id: 'kpi-rentabilidad-pacing', label: '2. Rentabilidad y pacing' },
  { id: 'kpi-estimado-real', label: '3. Estimación vs realidad' },
  { id: 'kpi-capacidad-departamento', label: '4. Capacidad por departamento' },
  { id: 'kpi-okrs', label: '5. OKRs y objetivos' },
  { id: 'excel-vs-taimbox', label: 'Excel vs herramienta integrada' },
  { id: 'enlaces-guia-landings', label: 'Guía y landings del producto' },
  { id: 'cta-kpis-agencias', label: 'Próximo paso' },
];

export default function KpisAgenciasMarketingPage() {
  const titleShort = 'KPIs para agencias de marketing: 5 métricas que sí importan en 2026';
  const description =
    'Cinco KPIs esenciales para agencias de marketing en 2026: utilización, rentabilidad y pacing, estimación vs real, capacidad por área y OKRs. Incluye qué hacer si el número sale mal y por qué el Excel no basta.';

  return (
    <>
      <Helmet>
        <title>{titleShort} | Taimbox</title>
        <meta name="description" content={description} />
        <link rel="canonical" href="https://taimbox.com/blog/kpis-agencias-marketing-2026" />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={`${titleShort} | Taimbox`} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content="https://taimbox.com/blog/kpis-agencias-marketing-2026" />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'Article',
                headline: titleShort,
                description,
                author: { '@type': 'Organization', name: 'Taimbox' },
                publisher: { '@type': 'Organization', name: 'Taimbox' },
                datePublished: post?.date ?? '2026-03-23',
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
          <BlogBreadcrumb title={post?.title ?? titleShort} />
        </div>

        <div className="relative z-10">
          <KpisAgenciasMarketingArticle
            readingMinutes={post?.readingMinutes ?? 16}
            tocItems={TOC_ITEMS}
            relatedPost={
              relatedPost
                ? { title: relatedPost.title, description: relatedPost.description, href: relatedPost.href }
                : undefined
            }
          />
        </div>

        <LandingFooter />
      </div>
    </>
  );
}
