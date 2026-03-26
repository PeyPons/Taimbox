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
  { id: 'lo-que-aprenderas', label: 'Lo que aprenderás' },
  { id: 'que-es-carga-trabajo', label: 'Qué es la carga de trabajo' },
  { id: 'causas-burnout-equipos', label: 'Causas del burnout' },
  { id: 'senales-equipo-riesgo', label: 'Señales de riesgo' },
  { id: 'framework-gestion-sostenible', label: 'Framework en 6 pasos' },
  { id: 'rol-manager-equipo', label: 'Rol del manager' },
  { id: 'burnout-instalado', label: 'Burnout ya instalado' },
  { id: 'metricas-carga-equipo', label: 'Métricas clave' },
  { id: 'herramientas-workload', label: 'Herramientas' },
  { id: 'conclusion-gestion-carga', label: 'Conclusión' },
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
      a: 'Depende del rol, pero señales útiles: utilización sostenida muy por encima del ~85%, desviaciones sistemáticas estimado/real, aumento de retrabajo y caída de cumplimiento de plazos. Lo «demasiado» es cuando la carga deja de ser puntual y pasa a ser estructural sin ventanas de recuperación.',
    },
    {
      q: '¿Cómo sé si mi equipo tiene burnout?',
      a: 'Combina señales conductuales (cansancio, cinismo, baja calidad, aislamiento) con datos (plazos, carga por persona, criticidad). No esperes a la confesión explícita: pregunta de forma regular y crea canales seguros.',
    },
    {
      q: '¿Qué diferencia hay entre estrés y burnout?',
      a: 'El estrés agudo puede movilizar; suele tener un «después» de alivio. El burnout es más crónico: agotamiento sostenido, desconexión del trabajo y sensación de baja eficacia. Requiere cambios de carga y de sistema, no solo «aguantar».',
    },
    {
      q: '¿Cómo repartir tareas equitativamente en una agencia?',
      a: 'Equitativo no siempre es «el mismo número»: reparte según capacidad neta, habilidad, criticidad y momento del proyecto. Usa visibilidad común y rota exposición a tareas de alto riesgo para no depender siempre de las mismas personas.',
    },
    {
      q: '¿Qué herramienta es imprescindible para workload management?',
      a: 'Ninguna por sí sola. Lo imprescindible es un acuerdo de equipo sobre dónde vive la verdad (tablero, hoja, ERP) y disciplina de actualización. Elige categorías (tareas, horas, Gantt, encuestas) según tu punto ciego principal.',
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
