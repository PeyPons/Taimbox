import { Helmet } from 'react-helmet-async';
import { PlanificacionProyectosArticle } from '@/components/landing/blog/PlanificacionProyectosArticle';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { BlogBreadcrumb } from '@/components/landing/blog/BlogBreadcrumb';
import { blogPosts } from '@/data/blogPosts';

const SLUG = 'planificacion-proyectos-cronograma-recursos';
const post = blogPosts.find((p) => p.slug === SLUG)!;
const relatedPost = post?.relatedSlug ? blogPosts.find((p) => p.slug === post.relatedSlug) : null;

const TOC_ITEMS = [
  { id: 'que-es-planificacion', label: '1. Qué es la planificación de proyectos' },
  { id: 'cronograma-gantt', label: '2. El cronograma y el diagrama de Gantt' },
  { id: 'presupuesto-proyecto', label: '3. Presupuesto del proyecto' },
  { id: 'recursos-capacidad', label: '4. Recursos y capacidad' },
  { id: 'seguimiento-kpis-dashboard', label: '5. Seguimiento, KPIs y dashboard' },
  { id: 'herramientas-gestion-proyectos', label: '6. Herramientas de gestión de proyectos' },
  { id: 'preguntas-frecuentes', label: 'Preguntas frecuentes' },
  { id: 'cta-planifica', label: 'Planifica por horas' },
];

export default function PlanificacionProyectosCronogramaRecursosPage() {
  return (
    <>
      <Helmet>
        <title>Planificación de proyectos: cronograma, presupuesto y recursos | Guía práctica | Taimbox</title>
        <meta
          name="description"
          content="Guía práctica para planificar proyectos: cronograma, diagrama de Gantt, presupuesto por proyectos, recursos y capacidad del equipo. Incluye KPIs, dashboard y herramientas para agencias."
        />
        <link rel="canonical" href="https://taimbox.com/blog/planificacion-proyectos-cronograma-recursos" />
        <meta property="og:type" content="article" />
        <meta property="og:title" content="Planificación de proyectos: cronograma, presupuesto y recursos | Taimbox" />
        <meta
          property="og:description"
          content="Guía práctica para planificar proyectos: cronograma, diagrama de Gantt, presupuesto por proyectos, recursos y capacidad del equipo."
        />
        <meta property="og:url" content="https://taimbox.com/blog/planificacion-proyectos-cronograma-recursos" />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'Article',
                headline: 'Planificación de proyectos: cronograma, presupuesto y recursos (guía práctica)',
                description:
                  'Guía práctica para unir cronograma, presupuesto y capacidad del equipo. Incluye diagrama de Gantt, fases del proyecto, KPIs y herramientas de gestión de proyectos.',
                author: { '@type': 'Organization', name: 'Taimbox' },
                publisher: { '@type': 'Organization', name: 'Taimbox' },
                datePublished: post?.date ?? '2026-03-18',
              },
              {
                '@type': 'SoftwareApplication',
                name: 'Taimbox',
                applicationCategory: 'BusinessApplication',
                description:
                  'Planificador de recursos y tiempo para agencias. Cronograma por horas, presupuesto por proyectos y reportes de rentabilidad.',
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
          <BlogBreadcrumb title={post?.title ?? 'Planificación de proyectos'} />
        </div>

        <div className="relative z-10">
          <PlanificacionProyectosArticle
            readingMinutes={post?.readingMinutes ?? 10}
            tocItems={TOC_ITEMS}
            relatedPost={relatedPost ? { title: relatedPost.title, description: relatedPost.description, href: relatedPost.href } : undefined}
          />
        </div>

        <LandingFooter />
      </div>
    </>
  );
}
