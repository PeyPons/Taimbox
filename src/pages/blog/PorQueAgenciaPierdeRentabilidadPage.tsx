import { Helmet } from 'react-helmet-async';
import { PorQueAgenciaPierdeRentabilidadArticle } from '@/components/landing/blog/PorQueAgenciaPierdeRentabilidadArticle';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { BlogBreadcrumb } from '@/components/landing/blog/BlogBreadcrumb';
import { blogPosts } from '@/data/blogPosts';

const SLUG = 'por-que-tu-agencia-pierde-rentabilidad-equipo-ocupado';
const post = blogPosts.find((p) => p.slug === SLUG)!;
const relatedPost = post?.relatedSlug ? blogPosts.find((p) => p.slug === post.relatedSlug) : null;

const TOC_ITEMS = [
  { id: 'tasa-utilizacion', label: '1. Trampa de la ocupación' },
  { id: 'context-switching', label: '2. Context switching' },
  { id: 'presencialismo-digital', label: '3. Presencialismo digital' },
  { id: 'horas-no-facturables', label: '4. Horas no facturables' },
  { id: 'scope-creep', label: '5. Scope creep' },
  { id: 'metricas-rentabilidad', label: '6. Métricas rentables' },
  { id: 'acciones-inmediatas', label: '7. Qué cambiar esta semana' },
  { id: 'faq-rentabilidad-ocupacion', label: 'Preguntas frecuentes' },
];

const CANONICAL = 'https://taimbox.com/blog/por-que-tu-agencia-pierde-rentabilidad-equipo-ocupado';

export default function PorQueAgenciaPierdeRentabilidadPage() {
  const titleH1 = 'Por qué tu agencia pierde rentabilidad aunque el equipo esté siempre ocupado';
  const seoTitle = 'Por qué tu agencia pierde dinero aunque el equipo esté ocupado (Guía 2026)';
  const description =
    'Equipo al 100% no significa agencia rentable. Te explicamos por qué la ocupación total destruye márgenes y qué métricas deberías mirar en su lugar.';

  const faqItems = [
    {
      q: '¿Qué tasa de utilización es saludable en una agencia?',
      a: 'La referencia habitual del sector sitúa el rango óptimo entre el 70% y el 80%. Por debajo de ese umbral hay capacidad ociosa; por encima, el equipo empieza a generar costes ocultos por errores, retrabajo y burnout que erosionan el margen más rápido de lo que crece el ingreso.',
    },
    {
      q: '¿Cómo sé si mi agencia está perdiendo rentabilidad por el context switching?',
      a: 'El indicador más directo es comparar las horas estimadas con las reales en tus últimos 10 proyectos. Si la desviación media supera el 20%, el context switching y las interrupciones no planificadas son parte del problema. También puedes preguntar directamente al equipo cuántos proyectos lleva cada persona simultáneamente.',
    },
    {
      q: '¿Cuántas horas no facturables tiene de media una agencia?',
      a: 'Depende mucho del modelo, pero en agencias de servicios creativos las horas no facturables pueden representar entre el 30% y el 50% del total de horas trabajadas. La forma de saberlo en tu caso es calcular el ratio: horas facturadas / horas totales trabajadas × 100.',
    },
    {
      q: '¿Qué diferencia hay entre ocupación y rentabilidad en una agencia?',
      a: 'Ocupación mide el porcentaje de tiempo que el equipo está trabajando. Rentabilidad mide cuánto margen genera ese trabajo. Son variables distintas: un equipo puede estar al 100% de ocupación y tener márgenes negativos si hay mucho retrabajo, horas no facturables o scope creep no controlado.',
    },
  ];

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
        mainEntityOfPage: { '@type': 'WebPage', '@id': CANONICAL },
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
        name: 'Taimbox',
        applicationCategory: 'BusinessApplication',
        description:
          'Planificador de recursos y tiempo para agencias. Timeboxing, cronograma por horas y reportes de rentabilidad.',
      },
    ],
  };

  return (
    <>
      <Helmet>
        <title>{seoTitle} | Taimbox</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={CANONICAL} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={`${seoTitle} | Taimbox`} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={CANONICAL} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
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
          <BlogBreadcrumb title={post?.title ?? titleH1} />
        </div>

        <div className="relative z-10">
          <PorQueAgenciaPierdeRentabilidadArticle
            readingMinutes={post?.readingMinutes ?? 14}
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
