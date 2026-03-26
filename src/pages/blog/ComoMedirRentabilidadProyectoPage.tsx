import { Helmet } from 'react-helmet-async';
import { ComoMedirRentabilidadProyectoArticle } from '@/components/landing/blog/ComoMedirRentabilidadProyectoArticle';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { BlogBreadcrumb } from '@/components/landing/blog/BlogBreadcrumb';
import { blogPosts } from '@/data/blogPosts';

const SLUG = 'como-medir-rentabilidad-proyecto-agencia-dejar-vender-horas';
const post = blogPosts.find((p) => p.slug === SLUG)!;
const relatedPost = post?.relatedSlug ? blogPosts.find((p) => p.slug === post.relatedSlug) : null;

const TOC_ITEMS = [
  { id: 'techo-horas', label: '1. Techo de vender horas' },
  { id: 'modelos-pricing', label: '2. Modelos de pricing' },
  { id: 'calcular-rentabilidad', label: '3. Calcular rentabilidad' },
  { id: 'scope-creep-protocolo', label: '4. Scope creep' },
  { id: 'modelo-sprint', label: '5. Fee vs sprint' },
  { id: 'faq-rentabilidad-proyecto', label: 'Preguntas frecuentes' },
];

const CANONICAL = 'https://taimbox.com/blog/como-medir-rentabilidad-proyecto-agencia-dejar-vender-horas';

export default function ComoMedirRentabilidadProyectoPage() {
  const titleH1 =
    'Cómo medir la rentabilidad real por proyecto en tu agencia (y dejar de vender horas)';
  const seoTitle = 'Cómo medir la rentabilidad por proyecto en una agencia y dejar de vender horas';
  const description =
    'De vender tiempo a vender valor: cómo calcular el margen real por proyecto, comparar modelos de pricing y proteger tus beneficios frente al scope creep.';

  const faqItems = [
    {
      q: '¿Qué margen bruto debe tener una agencia de marketing?',
      a: 'La referencia habitual en agencias de servicios sitúa un margen bruto saludable por encima del 50% por proyecto. Por debajo del 40%, el proyecto difícilmente cubre costes indirectos y overhead de forma sostenible. El margen bruto se calcula como (ingresos – coste directo) / ingresos × 100.',
    },
    {
      q: '¿Cómo se cobra el trabajo extra fuera del alcance en una agencia?',
      a: "El proceso más efectivo tiene tres pasos: registrar la solicitud en el momento, estimar el tiempo antes de aceptar, y comunicar el impacto al cliente antes de ejecutar. La pregunta que cambia la conversación es: '¿Lo añadimos ajustando el presupuesto, o lo dejamos para el próximo sprint?'",
    },
    {
      q: '¿Qué es mejor para una agencia: retainer o precio por proyecto?',
      a: 'Depende del tipo de servicio. El retainer funciona mejor para servicios continuos y bien definidos (SEO, gestión de redes). El precio por proyecto funciona mejor para trabajos puntuales con scope variable. Los datos del sector apuntan a que el modelo híbrido — 60-70% retainer, 30-40% proyectos — ofrece el mejor equilibrio entre predecibilidad y flexibilidad.',
    },
    {
      q: '¿Cómo puedo saber qué proyectos son más rentables en mi agencia?',
      a: 'Calculando el margen bruto real de tus últimos 10-15 proyectos: (ingresos – coste directo total) / ingresos × 100. El patrón que emerge casi siempre es el mismo: 2-3 tipos de proyecto concentran el 80% del margen. Esa información es la base de cualquier decisión estratégica de portfolio de servicios.',
    },
    {
      q: '¿Qué es el pricing basado en valor y cuándo aplicarlo?',
      a: 'Es un modelo en el que el precio se fija en función del valor que el trabajo genera para el cliente, no del tiempo invertido. Tiene sentido cuando la agencia tiene datos de resultados previos y track record demostrable que justifique el precio. Sin esas condiciones, es difícil de sostener en la negociación.',
    },
  ];

  const howToSteps = [
    {
      name: 'Define el coste real del proyecto',
      text: 'Incluye horas del equipo a coste cargado, freelancers, overhead imputable, reuniones internas y correcciones no presupuestadas.',
    },
    {
      name: 'Calcula el margen bruto por proyecto',
      text: 'Margen bruto (%) = (ingresos − coste directo total) / ingresos × 100. Referencia: por encima del 50% suele ser saludable.',
    },
    {
      name: 'Compara proyectos entre sí para encontrar el patrón',
      text: 'Con 10–15 proyectos recientes identifica qué tipos de encargo concentran el margen y cuáles lo consumen.',
    },
    {
      name: 'Introduce el tiempo como variable de control',
      text: 'Asigna horas por fase antes de ejecutar; el timeboxing evita que el trabajo se expanda sin límite (Ley de Parkinson).',
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
        '@type': 'HowTo',
        name: 'Cómo calcular la rentabilidad real por proyecto en una agencia',
        description:
          'Cuatro pasos para coste real, margen bruto, comparación de proyectos y control del tiempo por fases.',
        step: howToSteps.map((s, i) => ({
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
          <ComoMedirRentabilidadProyectoArticle
            readingMinutes={post?.readingMinutes ?? 12}
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
