import { Helmet } from 'react-helmet-async';
import { GestionCargaTrabajoEquipoArticle } from '@/components/landing/blog/GestionCargaTrabajoEquipoArticle';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { BlogBreadcrumb } from '@/components/landing/blog/BlogBreadcrumb';
import { blogPosts } from '@/data/blogPosts';

const SLUG = 'gestion-carga-trabajo-equipo-sin-burnout';
const post = blogPosts.find((p) => p.slug === SLUG)!;
const relatedPost = post?.relatedSlug ? blogPosts.find((p) => p.slug === post.relatedSlug) : null;

const TOC_ITEMS = [
  { id: 'lo-que-aprenderas', label: '1. Mapa rápido' },
  { id: 'que-es-carga-trabajo', label: '2. Qué es la carga de trabajo' },
  { id: 'causas-burnout-equipos', label: '3. Causas del burnout' },
  { id: 'senales-equipo-riesgo', label: '4. Señales de riesgo' },
  { id: 'framework-gestion-sostenible', label: '5. Framework en 6 pasos' },
  { id: 'rol-manager-equipo', label: '6. Rol del manager' },
  { id: 'burnout-instalado', label: '7. Burnout ya instalado' },
  { id: 'metricas-carga-equipo', label: '8. Métricas clave' },
  { id: 'herramientas-workload', label: '9. Herramientas' },
  { id: 'conclusion-gestion-carga', label: '10. Conclusión' },
  { id: 'faq-gestion-carga-trabajo', label: 'Preguntas frecuentes' },
];

const CANONICAL = 'https://taimbox.com/blog/gestion-carga-trabajo-equipo-sin-burnout';

export default function GestionCargaTrabajoEquipoPage() {
  const titleH1 = 'Cómo gestionar la carga de trabajo de tu equipo sin burnout';
  const seoTitle = 'Cómo gestionar la carga de trabajo del equipo sin burnout (Guía 2026)';
  const description =
    'Aprende a distribuir tareas, detectar señales de sobrecarga y construir un equipo sostenible. Guía práctica con métricas, estrategias y frameworks reales.';

  const faqItems = [
    {
      q: '¿Cuánto es demasiada carga de trabajo?',
      a: 'No hay un número mágico: depende del rol. Pero ojo si la utilización se queda muy por encima del ~85% durante largo rato, si estimado y real nunca coinciden, si hay más retrabajo o si los plazos empiezan a caerse todos a la vez. En la práctica, «demasiado» es cuando deja de ser un pico y se convierte en rutina sin respiro.',
    },
    {
      q: '¿Cómo sé si mi equipo tiene burnout?',
      a: 'Cruza lo que ves (cansancio, cinismo, calidad bajando, gente que se encierra) con lo que miden los datos: plazos, reparto de tareas gordas, quién acumula riesgo. Y no esperes a que alguien lo diga en una reunión: pregunta a menudo y deja sitio para respuestas honestas.',
    },
    {
      q: '¿Qué diferencia hay entre estrés y burnout?',
      a: 'El estrés puede venir con una fecha de caducidad: termina el lanzamiento y baja la tensión. El burnout se queda: agotamiento que no recuperas con un fin de semana, desgana con el trabajo y sensación de ir más lento pese a esforzarte. Ahí hace falta tocar el sistema, no solo «más aguante».',
    },
    {
      q: '¿Cómo repartir tareas equitativamente en una agencia?',
      a: '«Equitativo» no es repartir el mismo número de tickets. Es que el riesgo y el esfuerzo vivan repartidos: capacidad real, habilidad, qué tan crítico es cada encargo y en qué fase está el proyecto. Rota lo que pesa para que no siempre caiga en los mismos dos perfiles.',
    },
    {
      q: '¿Hay alguna herramienta imprescindible para la carga de trabajo?',
      a: 'Ninguna salva un equipo sin acuerdos. Lo que cuenta es decidir dónde está «la verdad» (tablero, hoja, ERP) y cumplirla entre todos. Elige categorías —tareas, horas, Gantt, encuestas— según lo que ahora mismo no estás viendo.',
    },
  ];

  const howToSteps = [
    {
      name: 'Mapear la carga real',
      text: 'Unificar tareas, estimaciones, responsables y fechas en una vista común (Kanban, Gantt o hoja) para detectar cuellos de botella humanos.',
    },
    {
      name: 'Priorizar con la matriz de Eisenhower',
      text: 'Diferenciar urgente e importante a nivel de equipo; proteger tiempo para lo importante-no urgente y eliminar o delegar lo que no aporta.',
    },
    {
      name: 'Redistribuir con criterio',
      text: 'Repartir según capacidad neta, habilidades, criticidad y estado actual de cada persona; rotar tareas de alto riesgo.',
    },
    {
      name: 'Poner límites al alcance',
      text: 'Ante nuevas peticiones, preguntar qué se deja de hacer; gestionar el scope creep de forma explícita.',
    },
    {
      name: 'Proteger ritmos y bloques de foco',
      text: 'Usar timeboxing y bloques de deep work; acordar normas de interrupción y buffers entre proyectos.',
    },
    {
      name: 'Revisar la carga con regularidad',
      text: 'Check-ins breves semanales o quincenales sobre carga (escala 1-5) sin esperar a crisis.',
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
        name: 'Framework para gestionar la carga de trabajo del equipo sin burnout',
        description:
          'Seis pasos para visibilizar la carga, priorizar, repartir con criterio, poner límites al alcance, proteger el foco y revisar periódicamente.',
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
          <GestionCargaTrabajoEquipoArticle
            readingMinutes={post?.readingMinutes ?? 24}
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
